/**
 * Gespreks-samenvatting endpoint.
 *
 * Wordt aan het eind van een chat-sessie aangeroepen (bijv. bij sluiten van
 * de FloatingGerChat-paneel) om een korte samenvatting van het gesprek op
 * te slaan. De samenvatting wordt bij een volgend gesprek terug-geïnjecteerd
 * in de system prompt zodat Ger kan refereren aan eerdere gesprekken.
 *
 * Privacy-by-design:
 * - Geen letterlijke berichten worden bewaard, alleen een samenvatting.
 * - Maximaal 3 samenvattingen per gebruiker zichtbaar in toekomstige
 *   gesprekken (oudere blijven wel staan voor analytics maar niet in prompt).
 *
 * Goedkoop:
 * - Haiku model (~$0.0005 per gesprek bij 5KB input).
 * - Niet-blocking: de UI kan dit met `keepalive` of `sendBeacon` aanroepen.
 *
 * Dedup: maximaal één samenvatting per 5 minuten per gebruiker, om dubbele
 * opslag bij re-mount of beforeunload-events te voorkomen.
 */
import { generateObject } from "ai"
import { z } from "zod"
import { getModelForAgent, AGENT_MODELS } from "@/lib/ai/models"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logAiInteractie } from "@/lib/ai/telemetrie"

export const maxDuration = 30

// Anthropic's structured output ondersteunt geen JSON-schema-constraints zoals
// minItems/maxItems/minLength/maxLength op velden — die geven een 400 terug
// ("output_format.schema: For 'array' type, property 'maxItems' is not supported").
// We coderen de limieten daarom in de `describe()` (instructie aan het model)
// en valideren ze pas na de call met een tweede Zod-pass.
const samenvattingSchema = z.object({
  samenvatting: z
    .string()
    .describe("Korte samenvatting van het gesprek in 3-5 zinnen (20-800 tekens), vanuit Ger's perspectief, in informele B1-Nederlandse stijl"),
  onderwerpen: z
    .array(z.string())
    .describe("Lijst van 1 tot 5 sleutelwoorden of korte zinnetjes die de besproken onderwerpen samenvatten, bv. 'PGB', 'zelfzorg', 'huishoudelijke hulp voor naaste'"),
})

export async function POST(req: Request) {
  const startTime = Date.now()
  const ROUTE = "samenvat"
  const MODEL_ID = AGENT_MODELS["ger-samenvat"]

  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response(JSON.stringify({ error: "AI niet beschikbaar." }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    })
  }

  let session
  try {
    session = await auth()
  } catch {
    return new Response(JSON.stringify({ error: "Sessie verlopen." }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    })
  }

  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: "Niet ingelogd." }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    })
  }

  let body: { messages?: { role: string; content: string }[]; actiepuntenAangemaakt?: number }
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: "Ongeldig verzoek." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    })
  }

  const messages = Array.isArray(body.messages) ? body.messages : []
  // Filter berichten die tellen voor samenvatting (geen pagina-init, geen lege)
  const echteBerichten = messages.filter(
    (m) => m && typeof m.content === "string" && m.content.trim() !== "" && !m.content.startsWith("[pagina:"),
  )

  // Te kort gesprek: niet samenvatten, gewoon negeren
  if (echteBerichten.length < 4) {
    return new Response(JSON.stringify({ skipped: true, reason: "te kort" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  }

  const userId = session.user.id

  // Dedup: één samenvatting per 5 minuten per gebruiker. Voorkomt dubbele
  // opslag bij re-mount, beforeunload, of snel achter elkaar sluiten.
  const vijfMinuutGeleden = new Date(Date.now() - 5 * 60 * 1000)
  const recent = await prisma.gesprekSamenvatting.findFirst({
    where: { userId, createdAt: { gte: vijfMinuutGeleden } },
    select: { id: true },
  })
  if (recent) {
    return new Response(JSON.stringify({ skipped: true, reason: "dedup" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  }

  try {
    const transcript = echteBerichten
      .map((m) => `${m.role === "user" ? "Mantelzorger" : "Ger"}: ${m.content}`)
      .join("\n\n")

    const result = await generateObject({
      model: getModelForAgent("ger-samenvat"),
      schema: samenvattingSchema,
      maxOutputTokens: 400,
      system: `Je vat een chat tussen een mantelzorger en Ger (de MantelCoach) samen.
De samenvatting is bedoeld voor Ger zelf, om bij een volgend gesprek aan te
kunnen refereren. Schrijf in B1-Nederlands, vanuit Ger's perspectief
("we hadden het over...", "ze gaf aan dat..."). Geen klinische taal, geen
score-getallen. Focus op:
- Wat de mantelzorger heeft gedeeld over zichzelf of de zorgsituatie
- Welke hulp/onderwerpen besproken zijn
- Eventuele actiepunten of vervolgafspraken

Onderwerpen-lijst: 1-5 korte zinnetjes of woorden die de besproken
onderwerpen vangen — gebruikt om bij volgende chat snel context te tonen.`,
      prompt: `Vat de volgende chat samen:\n\n${transcript}`,
    })

    // Tel actiepunten die Ger in het laatste half uur via slaActiepuntOp
    // heeft aangemaakt voor deze gebruiker. Het laatste half uur dekt een
    // typisch gesprek; preciezer (per-bericht-timestamps) zit niet in de
    // data die de UI naar deze endpoint stuurt.
    const dertigMinGeleden = new Date(Date.now() - 30 * 60 * 1000)
    const caregiver = await prisma.caregiver.findUnique({
      where: { userId },
      select: { id: true },
    })
    const actiepuntenAangemaakt = caregiver
      ? await prisma.task.count({
          where: {
            caregiverId: caregiver.id,
            isSuggested: true,
            createdAt: { gte: dertigMinGeleden },
          },
        })
      : 0

    // Limieten worden niet via JSON-schema afgedwongen (zie comment bij
    // samenvattingSchema), dus hier afkappen voordat we opslaan.
    const samenvattingTekst = result.object.samenvatting.slice(0, 800)
    const onderwerpen = result.object.onderwerpen
      .map((o) => o.trim())
      .filter((o) => o.length > 0)
      .slice(0, 5)

    const saved = await prisma.gesprekSamenvatting.create({
      data: {
        userId,
        samenvatting: samenvattingTekst,
        onderwerpen,
        actiepuntenAangemaakt,
        berichtenAantal: echteBerichten.length,
      },
      select: { id: true, samenvatting: true, onderwerpen: true, createdAt: true },
    })

    void logAiInteractie({
      userId,
      route: ROUTE,
      model: MODEL_ID,
      durationMs: Date.now() - startTime,
      inputTokens: result.usage?.inputTokens ?? null,
      outputTokens: result.usage?.outputTokens ?? null,
      status: "ok",
    })

    return new Response(JSON.stringify({ saved: true, samenvatting: saved }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("[Samenvat] Fout:", error)
    const message = error instanceof Error ? error.message : "onbekende fout"
    void logAiInteractie({
      userId,
      route: ROUTE,
      model: MODEL_ID,
      durationMs: Date.now() - startTime,
      status: "error",
      errorBericht: message,
    })
    return new Response(JSON.stringify({ error: `Samenvatten mislukt: ${message}` }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
