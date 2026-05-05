import { streamText, stepCountIs } from "ai"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { buildStableSystem } from "@/lib/ai/prompts/assistent"
import { prefetchUserContext, buildContextBlock } from "@/lib/ai/prefetch-context"
import { getModelForAgent } from "@/lib/ai/models"
import { detecteerCrisis, buildCrisisResponse } from "@/lib/ai/crisis-detector"
import { aiCrisisVerificatie } from "@/lib/ai/crisis-ai-check"
import {
  createZoekHulpbronnenTool,
  createZoekArtikelenTool,
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
  // Lijsten van hulpbronnen/artikelen die de gebruiker eerder in dit gesprek
  // heeft gezien — door de client meegestuurd zodat we kunnen variëren.
  const shownHulpbronnen: string[] = Array.isArray(body.shownHulpbronnen) ? body.shownHulpbronnen : []
  const shownArtikelen: string[] = Array.isArray(body.shownArtikelen) ? body.shownArtikelen : []

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
    let niveau: "geen" | "aandacht" | "crisis" = crisisResult.niveau

    // Bij aandacht-niveau: laat een snelle Haiku-call beoordelen of het een
    // verkapt crisis-signaal is. Subtiele formuleringen ("alles voelt grijs",
    // "ik zie geen weg meer") missen de keyword-detector. Faalt stil als de
    // AI niet bereikbaar is.
    if (niveau === "aandacht") {
      const oordeel = await aiCrisisVerificatie(laatsteBericht.content)
      if (oordeel === "escaleren") niveau = "crisis"
    }

    if (niveau === "crisis") {
      // Bij crisis: retourneer vast protocol, geen AI-call
      const crisisResponse = buildCrisisResponse("crisis")
      return new Response(
        `0:"${crisisResponse.replace(/"/g, '\\"').replace(/\n/g, '\\n')}"\n`,
        { headers: { "Content-Type": "text/plain; charset=utf-8" } }
      )
    }
    // Bij aandacht-niveau dat niet escaleerde: voeg crisis-context toe aan het systeem-prompt (hieronder)
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
    const userContext = await prefetchUserContext(userId, gemeenteMantelzorger, gemeenteZorgvrager, {
      shownHulpbronnen,
    })
    const dynamicContext = buildContextBlock(userContext)

    // Anthropic prompt caching: het STABIELE deel (basis-prompt + gemeenten)
    // wordt als eerste system-message met cacheControl: ephemeral verstuurd
    // zodat Anthropic het ~5 min cachet. Vervolgvragen binnen die window
    // krijgen ~90% korting op de input-kosten van dat blok.
    // Het DYNAMISCHE deel (user-context, verandert per beurt door variatie
    // en shownHulpbronnen) staat achter de cache-grens en wordt elke keer
    // opnieuw meegestuurd.
    const stableSystem = buildStableSystem(gemeenteMantelzorger, gemeenteZorgvrager)
    const messagesMetSystem = [
      {
        role: "system" as const,
        content: stableSystem,
        providerOptions: { anthropic: { cacheControl: { type: "ephemeral" } } },
      },
      { role: "system" as const, content: dynamicContext },
      ...messages,
    ]

    const result = streamText({
      model: getModelForAgent("ger-chat"),
      messages: messagesMetSystem,
      maxOutputTokens: 600,
      stopWhen: stepCountIs(7),
      tools: {
        // Beperkte tool-set: pre-fetched context dekt al de meeste data
        // (balanstest, gemeente-contact, hulpbronnen). Tools alleen voor
        // EXTRA zoekopdrachten die niet in de context staan.
        // bekijkTestTrend en gemeenteInfo zijn weggehaald omdat hun data
        // al in de pre-fetch zit en ze zelden door het model werden gebruikt.
        zoekHulpbronnen: createZoekHulpbronnenTool({
          gemeenteZorgvrager,
          gemeenteMantelzorger,
          shownNamen: shownHulpbronnen,
        }),
        zoekArtikelen: createZoekArtikelenTool({ shownTitels: shownArtikelen }),
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
