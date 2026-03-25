import { streamText, stepCountIs } from "ai"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { buildAssistentPrompt } from "@/lib/ai/prompts/assistent"
import { prefetchUserContext, buildContextBlock } from "@/lib/ai/prefetch-context"
import { getModelForAgent } from "@/lib/ai/models"
import { detecteerCrisis, buildCrisisResponse } from "@/lib/ai/crisis-detector"
import {
  createBekijkTestTrendTool,
  createZoekHulpbronnenTool,
  createZoekArtikelenTool,
  createGemeenteInfoTool,
  createSemantischZoekenTool,
  createSlaActiepuntOpTool,
} from "@/lib/ai/tools"

// Vercel serverless function timeout: AI tool calls + DB queries need more than default 10s
export const maxDuration = 30

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("[AI Chat] ANTHROPIC_API_KEY is niet geconfigureerd")
    return new Response(
      JSON.stringify({ error: "AI-chat is niet beschikbaar. De ANTHROPIC_API_KEY is niet geconfigureerd." }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    )
  }

  let session
  try {
    session = await auth()
  } catch (authError) {
    console.error("[AI Chat] Auth fout:", authError)
    return new Response(
      JSON.stringify({ error: "Sessie verlopen. Log opnieuw in." }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    )
  }

  if (!session?.user?.id) {
    return new Response(
      JSON.stringify({ error: "Je bent niet ingelogd. Log eerst in." }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    )
  }

  const body = await req.json()
  const rawMessages = body.messages

  // Handle both UI messages (parts format) and pre-converted model messages (content format)
  // Filter lege berichten (tool-call stappen zonder tekst) om API fouten te voorkomen
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
  }).filter((msg: { content: string }) => msg.content.trim() !== "")

  // Crisis-detectie: check het laatste bericht van de gebruiker VOORDAT de AI antwoordt
  const laatsteBericht = messages.filter((m: { role: string }) => m.role === "user").pop()
  if (laatsteBericht) {
    const crisisResult = detecteerCrisis(laatsteBericht.content)
    if (crisisResult.isCrisis && crisisResult.niveau === "crisis") {
      // Bij crisis: retourneer vast protocol, geen AI-call
      const crisisResponse = buildCrisisResponse("crisis")
      return new Response(
        `0:"${crisisResponse.replace(/"/g, '\\"').replace(/\n/g, '\\n')}"\n`,
        { headers: { "Content-Type": "text/plain; charset=utf-8" } }
      )
    }
    // Bij aandacht-niveau: voeg crisis-context toe aan het systeem-prompt (hieronder)
  }

  // Haal gebruikerscontext op — twee gemeenten: mantelzorger en zorgvrager
  // Hulp bij zorgtaken (verzorging, boodschappen, klusjes) → gemeente zorgvrager
  // Hulp voor de mantelzorger zelf (steunpunt, emotioneel) → gemeente mantelzorger
  const caregiver = await prisma.caregiver.findUnique({
    where: { userId: session.user.id },
    select: { municipality: true, city: true, careRecipientMunicipality: true, careRecipientCity: true },
  })

  const gemeenteMantelzorger = caregiver?.municipality || caregiver?.city || null
  const gemeenteZorgvrager = caregiver?.careRecipientMunicipality || caregiver?.careRecipientCity || gemeenteMantelzorger
  const userId = session.user.id

  try {
    // Pre-fetch balanstest + hulpbronnen zodat de AI direct kan antwoorden
    const userContext = await prefetchUserContext(userId, gemeenteMantelzorger, gemeenteZorgvrager)
    const contextBlock = buildContextBlock(userContext)

    const result = streamText({
      model: getModelForAgent("ger-chat"),
      system: buildAssistentPrompt(gemeenteMantelzorger, gemeenteZorgvrager, contextBlock),
      messages,
      maxOutputTokens: 2048,
      stopWhen: stepCountIs(7),
      tools: {
        // Tools beschikbaar voor extra zoekopdrachten (niet nodig voor standaard vragen)
        bekijkTestTrend: createBekijkTestTrendTool({ userId }),
        zoekHulpbronnen: createZoekHulpbronnenTool({ gemeenteZorgvrager, gemeenteMantelzorger }),
        zoekArtikelen: createZoekArtikelenTool(),
        gemeenteInfo: createGemeenteInfoTool(),
        semantischZoeken: createSemantischZoekenTool(gemeenteZorgvrager || gemeenteMantelzorger),
        slaActiepuntOp: createSlaActiepuntOpTool({ userId }),
      },
    })

    return result.toUIMessageStreamResponse()
  } catch (error) {
    console.error("[AI Chat] Fout bij het genereren van een antwoord:", error)
    const message = error instanceof Error ? error.message : "Onbekende fout"
    return new Response(
      JSON.stringify({ error: `AI-chat fout: ${message}` }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}
