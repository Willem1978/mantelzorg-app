/**
 * MantelCoach API endpoint (voorheen: Balanstest Coach).
 *
 * De MantelCoach is de persoonlijke coach voor de mantelzorger.
 * Wordt gebruikt in ALLE fasen:
 * - Welkom: eerste kennismaking, website uitleg, aansturen op balanstest
 * - Na balanstest: scores interpreteren, gemeente-advies, doorcoaching
 * - Doorlopend: profiel-check, check-in herinneringen, artikelen delen
 *
 * Beschikbare tools:
 * - bekijkGebruikerStatus  → profiel, test, check-in, voorkeuren status
 * - bekijkBalanstest       → scores, deelgebieden, taken, adviezen
 * - bekijkTestTrend        → vergelijking met eerdere testen
 * - bekijkGemeenteAdvies   → gemeente-specifiek advies + organisatie per niveau
 * - zoekHulpbronnen        → hulporganisaties per gemeente/taak
 * - zoekArtikelen          → artikelen met inhoud per categorie/zoekterm
 * - semantischZoeken       → slimme zoek in artikelen + hulpbronnen
 * - registreerAlarm        → alarmsignaal registreren bij hoge belasting
 * - genereerRapportSamenvatting → rapport opslaan
 *
 * De response is een streaming AI-response (toUIMessageStreamResponse).
 */
import { createAnthropic } from "@ai-sdk/anthropic"
import { streamText, stepCountIs } from "ai"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { buildBalanscoachPrompt } from "@/lib/ai/prompts/balanscoach"
import {
  createBekijkGebruikerStatusTool,
  createBekijkBalanstestTool,
  createBekijkTestTrendTool,
  createBekijkGemeenteAdviesTool,
  createZoekHulpbronnenTool,
  createZoekArtikelenTool,
  createSemantischZoekenTool,
  createRegistreerAlarmTool,
  createGenereerRapportSamenvattingTool,
} from "@/lib/ai/tools"

// Meer tools + doorcoaching vereist meer tijd
export const maxDuration = 45

const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response(
      JSON.stringify({ error: "AI is niet beschikbaar." }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    )
  }

  const session = await auth()
  if (!session?.user?.id) {
    return new Response("Niet ingelogd", { status: 401 })
  }

  const body = await req.json()
  const rawMessages = body.messages

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const messages = rawMessages.map((msg: any) => {
    if (msg.content !== undefined) {
      return { role: msg.role, content: msg.content }
    }
    if (msg.parts) {
      const text = msg.parts
        .filter((p: { type: string }) => p.type === "text")
        .map((p: { type: string; text?: string }) => p.text || "")
        .join("")
      return { role: msg.role, content: text }
    }
    return { role: msg.role, content: "" }
  })

  // Twee gemeenten: zorgtaken → gemeente zorgvrager, mantelzorger hulp → gemeente mantelzorger
  const caregiver = await prisma.caregiver.findUnique({
    where: { userId: session.user.id },
    select: { municipality: true, city: true, careRecipientMunicipality: true, careRecipientCity: true },
  })

  const gemeenteMantelzorger = caregiver?.municipality || caregiver?.city || null
  const gemeenteZorgvrager = caregiver?.careRecipientMunicipality || caregiver?.careRecipientCity || gemeenteMantelzorger
  const gemeente = gemeenteZorgvrager || gemeenteMantelzorger
  const userId = session.user.id

  try {
    const result = streamText({
      model: anthropic("claude-sonnet-4-20250514"),
      system: buildBalanscoachPrompt(gemeente),
      messages,
      maxOutputTokens: 2048,
      stopWhen: stepCountIs(8),
      tools: {
        bekijkGebruikerStatus: createBekijkGebruikerStatusTool({ userId }),
        bekijkBalanstest: createBekijkBalanstestTool({ userId, gemeenteZorgvrager, gemeenteMantelzorger }),
        bekijkTestTrend: createBekijkTestTrendTool({ userId }),
        bekijkGemeenteAdvies: createBekijkGemeenteAdviesTool({ gemeenteZorgvrager, gemeenteMantelzorger }),
        zoekHulpbronnen: createZoekHulpbronnenTool({ gemeenteZorgvrager, gemeenteMantelzorger }),
        zoekArtikelen: createZoekArtikelenTool(),
        semantischZoeken: createSemantischZoekenTool(gemeente),
        registreerAlarm: createRegistreerAlarmTool({ userId }),
        genereerRapportSamenvatting: createGenereerRapportSamenvattingTool({ userId }),
      },
    })

    return result.toUIMessageStreamResponse()
  } catch (error) {
    console.error("[MantelCoach] Fout:", error)
    const message = error instanceof Error ? error.message : "Onbekende fout"
    return new Response(
      JSON.stringify({ error: `MantelCoach fout: ${message}` }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}
