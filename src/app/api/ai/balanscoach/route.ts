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
import { getModelForAgent } from "@/lib/ai/models"
import { streamText, stepCountIs } from "ai"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { buildBalanscoachPrompt } from "@/lib/ai/prompts/balanscoach"
import { prefetchUserContext, buildContextBlock } from "@/lib/ai/prefetch-context"
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

export const maxDuration = 60

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
  // Lijsten van hulpbronnen die de gebruiker eerder heeft gezien — voor variatie
  const shownHulpbronnen: string[] = Array.isArray(body.shownHulpbronnen) ? body.shownHulpbronnen : []

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

  // PRE-FETCH: haal gemeente + status + volledige context (incl. hulpkaarten) op.
  // Dit bespaart de AI tool-call round-trips én geeft het model de
  // {{hulpkaart:...}} regels per zorgtaak/voor de mantelzorger letterlijk
  // mee, zodat de prompt-instructie "kaarten zijn al geladen, niet zoeken"
  // ook echt klopt.
  let gemeenteMantelzorger: string | null = null
  let gemeenteZorgvrager: string | null = null
  let statusContext = ""
  let dynamicContext = ""

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

    // Volledige context: balanstest, hulpkaarten per zorgtaak, hulp voor de
    // mantelzorger, gemeentecontact, voorkeuren, weekkaarten, actiepunten.
    const userContext = await prefetchUserContext(userId, gemeenteMantelzorger, gemeenteZorgvrager, {
      shownHulpbronnen,
    })
    dynamicContext = buildContextBlock(userContext)

    // Status-blok dat de prompt expliciet noemt (naam, profiel-percentage,
    // ontbrekende velden, check-in status etc.) — komt bovenop de context.
    statusContext = `\n\n--- GEBRUIKERSSTATUS (AUTOMATISCH GELADEN) ---
Je HOEFT bekijkGebruikerStatus NIET aan te roepen. De data is hier:
${JSON.stringify(gebruikerStatus, null, 2)}
--- EINDE STATUS ---
Gebruik deze data direct om de juiste flow te kiezen. Roep bekijkGebruikerStatus alleen aan als je VERNIEUWDE data nodig hebt.`
  } catch (dbError) {
    console.error("[MantelCoach] Pre-fetch fout:", dbError)
    // Als pre-fetch faalt, kan de AI alsnog de tools aanroepen
    statusContext = "\n\nLet op: de context kon niet vooraf worden geladen. Roep bekijkGebruikerStatus en zoekHulpbronnen aan waar nodig."
  }

  try {
    const systemPrompt = buildBalanscoachPrompt(gemeenteMantelzorger, gemeenteZorgvrager, pagina) + dynamicContext + statusContext

    const result = streamText({
      model: getModelForAgent("ger-balanscoach"),
      system: systemPrompt,
      messages,
      maxOutputTokens: 1500,
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
