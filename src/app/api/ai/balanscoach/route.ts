/**
 * MantelCoach API endpoint.
 *
 * De MantelCoach (Ger) begeleidt de mantelzorger in alle fasen en op alle pagina's.
 * Accepteert een optioneel "pagina" veld in de request body voor context-aware coaching.
 *
 * PERFORMANCE: De gebruikersstatus wordt PRE-FETCHED en in de prompt geïnjecteerd.
 * Dit bespaart 1-2 tool-call round-trips (= 10-15 seconden sneller).
 * Tools blijven beschikbaar voor vervolgacties (zoeken, hulp, actiepunten, etc.).
 *
 * RATE LIMITING: 60 requests per 10 minuten per gebruiker, om kostenrisico bij
 * scraping/abuse te beperken.
 */
import { getModelForAgent } from "@/lib/ai/models"
import { streamText, stepCountIs } from "ai"
import { auth } from "@/lib/auth"
import { buildBalanscoachPrompt } from "@/lib/ai/prompts/balanscoach"
import { prefetchUserContext, buildContextBlock } from "@/lib/ai/prefetch-context"
import { checkRateLimit } from "@/lib/rate-limit"
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
  createSlaActiepuntOpTool,
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

  // Rate limit per gebruiker — 60 berichten per 10 minuten is ruim voor
  // gewoon gebruik maar vangt scraping/abuse op.
  const rateCheck = await checkRateLimit(session.user.id, "ai-balanscoach", {
    maxRequests: 60,
    windowSeconds: 600,
  })
  if (!rateCheck.allowed) {
    return new Response(
      JSON.stringify({
        error: `Even rustig aan! Probeer over ${rateCheck.resetIn} seconden weer.`,
      }),
      { status: 429, headers: { "Content-Type": "application/json" } }
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

  const userId = session.user.id
  // Pagina-context — alleen veilige bekende strings toestaan om
  // prompt-injection via dit veld te voorkomen.
  const TOEGESTANE_PAGINAS = new Set([
    "informatie", "hulp", "mantelbuddy", "balanstest",
    "checkin", "rapport", "agenda", "profiel", "dashboard", "algemeen",
  ])
  const paginaRaw = typeof body.pagina === "string" ? body.pagina.trim() : null
  const pagina = paginaRaw && TOEGESTANE_PAGINAS.has(paginaRaw) ? paginaRaw : null
  // Lijsten van hulpbronnen die de gebruiker eerder heeft gezien — voor variatie.
  // Cap op 50 om payload-bloat te voorkomen.
  const shownHulpbronnen: string[] = Array.isArray(body.shownHulpbronnen)
    ? body.shownHulpbronnen.filter((s: unknown): s is string => typeof s === "string").slice(0, 50)
    : []

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

  // PRE-FETCH: haal status + volledige context (incl. hulpkaarten) op.
  // De prefetchUserContext doet zelf al een caregiver-lookup; we hoeven
  // hier alleen de gemeente-velden uit te halen via een korte tweede query.
  let gemeenteMantelzorger: string | null = null
  let gemeenteZorgvrager: string | null = null
  let statusContext = ""
  let dynamicContext = ""

  try {
    // fetchGebruikerStatus levert ook profiel.gemeente; we pakken hier
    // careRecipient-gemeente apart voor zoekHulpbronnen-tooling.
    const gebruikerStatus = await fetchGebruikerStatus(userId)
    type StatusVelden = { profiel?: { gemeente?: string | null }; naaste?: { gemeente?: string | null } }
    const statusTyped = gebruikerStatus as StatusVelden
    gemeenteMantelzorger = statusTyped?.profiel?.gemeente || null
    gemeenteZorgvrager = statusTyped?.naaste?.gemeente || gemeenteMantelzorger

    // Volledige context: balanstest, hulpkaarten per zorgtaak, hulp voor de
    // mantelzorger, gemeentecontact, voorkeuren, weekkaarten, actiepunten,
    // eerdere gespreks-samenvattingen.
    const userContext = await prefetchUserContext(userId, gemeenteMantelzorger, gemeenteZorgvrager, {
      shownHulpbronnen,
    })
    dynamicContext = buildContextBlock(userContext)

    // De ruwe status-JSON werd voorheen ook geïnjecteerd, maar dat overlapte
    // grotendeels met dynamicContext. We laten het nu weg — alle benodigde
    // data zit al in dynamicContext.
    statusContext = ""
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
      // 5 stappen geeft ruimte voor ketens als balanstest → gemeente-advies
      // → actiepunt opslaan zonder afgekapt te worden.
      stopWhen: stepCountIs(5),
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
        slaActiepuntOp: createSlaActiepuntOpTool({ userId }),
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
