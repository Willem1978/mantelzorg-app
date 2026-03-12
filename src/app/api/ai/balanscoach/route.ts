/**
 * MantelCoach API endpoint.
 *
 * De MantelCoach (Ger) begeleidt de mantelzorger in alle fasen en op alle pagina's.
 * Accepteert een optioneel "pagina" veld in de request body voor context-aware coaching.
 *
 * PERFORMANCE: De gebruikersstatus wordt PRE-FETCHED en in de prompt geïnjecteerd.
 * Dit bespaart 1-2 tool-call round-trips (= 10-15 seconden sneller).
 * Tools blijven beschikbaar voor vervolgacties (zoeken, hulp, etc.).
 */
import { createAnthropic } from "@ai-sdk/anthropic"
import { streamText, stepCountIs } from "ai"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { buildBalanscoachPrompt } from "@/lib/ai/prompts/balanscoach"
import {
  fetchGebruikerStatus,
  createBekijkGebruikerStatusTool,
  createBekijkBalanstestTool,
  createBekijkTestTrendTool,
  createZoekHulpbronnenTool,
  createZoekArtikelenTool,
  createSemantischZoekenTool,
  createRegistreerAlarmTool,
  createGenereerRapportSamenvattingTool,
  createBekijkGemeenteAdviesTool,
} from "@/lib/ai/tools"
import { resolveGemeenteContact } from "@/lib/ai/gemeente-resolver"

export const maxDuration = 60

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

  let session
  try {
    session = await auth()
  } catch (authError) {
    console.error("[MantelCoach] Auth fout:", authError)
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

  let body
  try {
    body = await req.json()
  } catch {
    return new Response(
      JSON.stringify({ error: "Ongeldig verzoek." }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    )
  }

  const rawMessages = body.messages
  if (!Array.isArray(rawMessages) || rawMessages.length === 0) {
    return new Response(
      JSON.stringify({ error: "Geen berichten ontvangen." }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    )
  }

  const pagina = body.pagina || null
  const userId = session.user.id

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

  // PRE-FETCH: haal gemeente + gebruikersstatus + gemeenteContact tegelijk op
  // Dit bespaart de AI 1-2 tool calls = 10-15 seconden sneller
  let gemeenteMantelzorger: string | null = null
  let gemeenteZorgvrager: string | null = null
  let statusContext = ""
  let gemeenteContactBlok = ""

  try {
    const [caregiver, gebruikerStatus] = await Promise.all([
      prisma.caregiver.findUnique({
        where: { userId },
        select: { municipality: true, city: true, careRecipientMunicipality: true, careRecipientCity: true },
      }),
      fetchGebruikerStatus(userId),
    ])

    gemeenteMantelzorger = caregiver?.municipality || caregiver?.city || null
    gemeenteZorgvrager = caregiver?.careRecipientMunicipality || caregiver?.careRecipientCity || gemeenteMantelzorger

    // Pre-fetch gemeenteContact (mantelzorgloket) op basis van belastingniveau
    const gemeenteVoorContact = gemeenteZorgvrager || gemeenteMantelzorger
    const niveau = gebruikerStatus?.balanstest && "niveau" in gebruikerStatus.balanstest
      ? gebruikerStatus.balanstest.niveau as string
      : null
    if (gemeenteVoorContact && niveau) {
      const gemeenteContact = await resolveGemeenteContact(gemeenteVoorContact, niveau)
      if (gemeenteContact) {
        const dienstNaam = `Mantelzorgloket ${gemeenteContact.gemeente}`
        const beschrijvingTekst = gemeenteContact.beschrijving || gemeenteContact.adviesTekst || ""
        gemeenteContactBlok = `\n\n--- GEMEENTE HULPVERLENER (AUTOMATISCH GELADEN) ---
Dit is het mantelzorgloket/de hulpverlener gekoppeld aan gemeente ${gemeenteContact.gemeente} voor niveau ${niveau}:
{{hulpkaart:${gemeenteContact.naam}|${dienstNaam}|${beschrijvingTekst}|${gemeenteContact.telefoon || ""}|${gemeenteContact.website || ""}|${gemeenteContact.gemeente || ""}||}}
${gemeenteContact.email ? `Email: ${gemeenteContact.email}` : ""}
${gemeenteContact.adviesTekst ? `Gemeente-advies: ${gemeenteContact.adviesTekst}` : ""}
Verwijs de mantelzorger ALTIJD naar deze hulpverlener bij hulpvragen.
--- EINDE GEMEENTE HULPVERLENER ---`
      }
    }

    // Bouw de status-context die in de prompt wordt geïnjecteerd
    statusContext = `\n\n--- GEBRUIKERSSTATUS (AUTOMATISCH GELADEN) ---
Je HOEFT bekijkGebruikerStatus NIET aan te roepen. De data is hier:
${JSON.stringify(gebruikerStatus, null, 2)}
--- EINDE STATUS ---
Gebruik deze data direct om de juiste flow te kiezen. Roep bekijkGebruikerStatus alleen aan als je VERNIEUWDE data nodig hebt.`
  } catch (dbError) {
    console.error("[MantelCoach] Pre-fetch fout:", dbError)
    // Als pre-fetch faalt, kan de AI alsnog de tool aanroepen
    statusContext = "\n\nLet op: de status kon niet vooraf worden geladen. Roep bekijkGebruikerStatus aan."
  }

  try {
    const systemPrompt = buildBalanscoachPrompt(gemeenteMantelzorger, gemeenteZorgvrager, pagina, gemeenteContactBlok) + statusContext

    const result = streamText({
      model: anthropic("claude-sonnet-4-20250514"),
      system: systemPrompt,
      messages,
      maxOutputTokens: 1000,
      stopWhen: stepCountIs(3),
      tools: {
        bekijkGebruikerStatus: createBekijkGebruikerStatusTool({ userId }),
        bekijkBalanstest: createBekijkBalanstestTool({ userId, gemeenteZorgvrager, gemeenteMantelzorger }),
        bekijkTestTrend: createBekijkTestTrendTool({ userId }),
        zoekHulpbronnen: createZoekHulpbronnenTool({ gemeenteZorgvrager, gemeenteMantelzorger }),
        zoekArtikelen: createZoekArtikelenTool(),
        semantischZoeken: createSemantischZoekenTool(gemeenteZorgvrager || gemeenteMantelzorger),
        registreerAlarm: createRegistreerAlarmTool({ userId }),
        genereerRapportSamenvatting: createGenereerRapportSamenvattingTool({ userId }),
        bekijkGemeenteAdvies: createBekijkGemeenteAdviesTool({ gemeenteZorgvrager, gemeenteMantelzorger }),
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
