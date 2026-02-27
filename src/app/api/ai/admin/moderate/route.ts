/**
 * Moderatie Agent — /api/ai/admin/moderate
 *
 * AI-gestuurd moderatie-endpoint voor beheerders.
 *
 * Functies:
 *   - BuddyBeoordeling reviewen (sentiment, kwaliteit, signalen)
 *   - HelpRequest urgentie beoordelen en prioriteren
 *   - BuddyTaakReactie kwaliteit bewaken
 *
 * POST body:
 *   { type: "beoordelingen" | "hulpvragen" | "reacties" | "alles", limiet?: number }
 */
import { NextResponse } from "next/server"
import { createAnthropic } from "@ai-sdk/anthropic"
import { generateText } from "ai"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logAudit } from "@/lib/audit"

export const maxDuration = 60

const ADMIN_ROLES = ["ADMIN", "GEMEENTE_ADMIN"] as const

async function checkAdminAccess() {
  const session = await auth()
  if (!session?.user?.id) return null
  const role = session.user.role as string
  if (!ADMIN_ROLES.includes(role as (typeof ADMIN_ROLES)[number])) return null
  return session
}

// ── BuddyBeoordeling review ───────────────────────────────────────

interface BeoordelingSamenvatting {
  id: string
  buddyNaam: string
  beoordeeldDoor: string
  scores: {
    algemeen: number | null
    betrouwbaarheid: number | null
    vriendelijkheid: number | null
    kwaliteit: number | null
  }
  positieveFeedback: string | null
  verbeterpunten: string | null
  datum: string
}

async function haalBeoordelingen(limiet: number): Promise<BeoordelingSamenvatting[]> {
  const beoordelingen = await prisma.buddyBeoordeling.findMany({
    orderBy: { createdAt: "desc" },
    take: limiet,
    include: {
      buddy: { select: { voornaam: true, achternaam: true } },
      beoordeeldDoor: { select: { voornaam: true, achternaam: true } },
      caregiver: { select: { user: { select: { name: true } } } },
    },
  })

  return beoordelingen.map((b) => ({
    id: b.id,
    buddyNaam: `${b.buddy.voornaam} ${b.buddy.achternaam}`,
    beoordeeldDoor: b.caregiver?.user?.name || (b.beoordeeldDoor ? `${b.beoordeeldDoor.voornaam} ${b.beoordeeldDoor.achternaam}` : "Onbekend"),
    scores: {
      algemeen: b.algemeenScore,
      betrouwbaarheid: b.betrouwbaarheidScore,
      vriendelijkheid: b.vriendelijkheidScore,
      kwaliteit: b.kwaliteitScore,
    },
    positieveFeedback: b.positieveFeedback,
    verbeterpunten: b.verbeterpunten,
    datum: b.createdAt.toLocaleDateString("nl-NL"),
  }))
}

// ── HelpRequest urgentie beoordeling ──────────────────────────────

interface HulpvraagSamenvatting {
  id: string
  titel: string
  beschrijving: string
  categorie: string
  urgentie: string
  status: string
  aangemaakt: string
  heeftReactie: boolean
}

async function haalHulpvragen(limiet: number): Promise<HulpvraagSamenvatting[]> {
  const hulpvragen = await prisma.helpRequest.findMany({
    where: { status: { in: ["OPEN", "IN_PROGRESS"] } },
    orderBy: [{ urgency: "desc" }, { createdAt: "asc" }],
    take: limiet,
    select: {
      id: true,
      title: true,
      description: true,
      category: true,
      urgency: true,
      status: true,
      createdAt: true,
      response: true,
    },
  })

  return hulpvragen.map((h) => ({
    id: h.id,
    titel: h.title,
    beschrijving: h.description,
    categorie: h.category,
    urgentie: h.urgency,
    status: h.status,
    aangemaakt: h.createdAt.toLocaleDateString("nl-NL"),
    heeftReactie: !!h.response,
  }))
}

// ── BuddyTaakReactie kwaliteit ───────────────────────────────────

interface ReactieSamenvatting {
  id: string
  taakTitel: string
  taakCategorie: string
  buddyNaam: string
  bericht: string | null
  status: string
  datum: string
}

async function haalReacties(limiet: number): Promise<ReactieSamenvatting[]> {
  const reacties = await prisma.buddyTaakReactie.findMany({
    orderBy: { createdAt: "desc" },
    take: limiet,
    include: {
      taak: { select: { titel: true, categorie: true } },
      buddy: { select: { voornaam: true, achternaam: true } },
    },
  })

  return reacties.map((r) => ({
    id: r.id,
    taakTitel: r.taak.titel,
    taakCategorie: r.taak.categorie,
    buddyNaam: `${r.buddy.voornaam} ${r.buddy.achternaam}`,
    bericht: r.bericht,
    status: r.status,
    datum: r.createdAt.toLocaleDateString("nl-NL"),
  }))
}

// ── AI Moderatie analyse ──────────────────────────────────────────

type ModeratieType = "beoordelingen" | "hulpvragen" | "reacties"

function buildModeratiePrompt(type: ModeratieType): string {
  const base = `Je bent een moderatie-assistent voor MantelBuddy, een platform voor mantelzorgers en vrijwillige buddy's.
Je analyseert content en geeft concrete moderatie-adviezen aan beheerders.

REGELS:
- Schrijf in het Nederlands, zakelijk en objectief
- Geef per item een beoordeling: GOED, AANDACHT, of ACTIE_NODIG
- Wees alert op: ongepast taalgebruik, nepsignalen, schreeuwende nood, spam, of ongegronde klachten
- Geef concrete aanbevelingen
- Gebruik markdown tabellen voor overzichten
- Houd het beknopt maar volledig`

  switch (type) {
    case "beoordelingen":
      return `${base}

SPECIFIEK VOOR BUDDY-BEOORDELINGEN:
- Check of scores consistent zijn met feedback-tekst (bijv. lage score maar positieve tekst = verdacht)
- Signaleer herhaald lage scores voor dezelfde buddy
- Controleer of verbeterpunten constructief zijn of ongepast
- Markeer beoordelingen die mogelijk nep of wraakzuchtig zijn
- Let op patronen: meerdere lage beoordelingen van dezelfde beoordelaar`

    case "hulpvragen":
      return `${base}

SPECIFIEK VOOR HULPVRAGEN:
- Beoordeel of de urgentie correct is ingeschat
- Markeer hulpvragen die mogelijk opgehoogd moeten worden (bijv. emotionele nood als LOW)
- Signaleer hulpvragen die al lang openstaan
- Let op hulpvragen die mogelijk buiten het platform horen (medisch, juridisch, crisis)
- Geef prioriteringssuggesties

URGENTIENIVEAUS: LOW < NORMAL < HIGH < URGENT
CATEGORIEËN: RESPITE_CARE, EMOTIONAL_SUPPORT, PRACTICAL_HELP, FINANCIAL_ADVICE, INFORMATION, OTHER`

    case "reacties":
      return `${base}

SPECIFIEK VOOR BUDDY-TAAKREACTIES:
- Beoordeel de kwaliteit van het bericht (is het vriendelijk, professioneel?)
- Signaleer lege of minimale berichten bij taakacceptatie
- Check of de reactie past bij het type taak
- Let op buddy's die veel taken aannemen maar niet afmaken (status INTERESSE maar nooit VOLTOOID)
- Markeer verdachte patronen (spam-achtige reacties, copy-paste)`
  }
}

async function analyseerContent(
  type: ModeratieType,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[],
) {
  if (data.length === 0) {
    return {
      type,
      aantalItems: 0,
      analyse: "Geen items gevonden om te modereren.",
      acties: [],
    }
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return {
      type,
      aantalItems: data.length,
      data,
      analyse: "AI-analyse niet beschikbaar: ANTHROPIC_API_KEY niet geconfigureerd.",
      acties: [],
    }
  }

  const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const { text } = await generateText({
    model: anthropic("claude-sonnet-4-20250514"),
    maxOutputTokens: 2000,
    system: buildModeratiePrompt(type),
    prompt: `Analyseer de volgende ${data.length} items en geef je moderatie-beoordeling.

DATA:
${JSON.stringify(data, null, 2)}

Geef:
1. Een overzichtstabel met per item: ID, beoordeling (GOED/AANDACHT/ACTIE_NODIG), korte reden
2. Samenvatting van patronen
3. Concrete acties die de beheerder moet nemen (als die er zijn)`,
  })

  // Extraheer actie-items uit de analyse
  const actieRegex = /ACTIE_NODIG/g
  const aantalActies = (text.match(actieRegex) || []).length

  return {
    type,
    aantalItems: data.length,
    aantalActieNodig: aantalActies,
    analyse: text,
  }
}

// ── Route handler ──────────────────────────────────────────────────

export async function POST(req: Request) {
  const session = await checkAdminAccess()
  if (!session) {
    return NextResponse.json({ error: "Niet geautoriseerd" }, { status: 403 })
  }

  try {
    const body = await req.json()
    const { type = "alles", limiet = 20 } = body as {
      type?: "beoordelingen" | "hulpvragen" | "reacties" | "alles"
      limiet?: number
    }

    const effectiefLimiet = Math.min(Math.max(limiet, 1), 50)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const resultaten: Record<string, any> = {}

    if (type === "beoordelingen" || type === "alles") {
      const data = await haalBeoordelingen(effectiefLimiet)
      resultaten.beoordelingen = await analyseerContent("beoordelingen", data)
    }

    if (type === "hulpvragen" || type === "alles") {
      const data = await haalHulpvragen(effectiefLimiet)
      resultaten.hulpvragen = await analyseerContent("hulpvragen", data)
    }

    if (type === "reacties" || type === "alles") {
      const data = await haalReacties(effectiefLimiet)
      resultaten.reacties = await analyseerContent("reacties", data)
    }

    await logAudit({
      userId: session.user.id!,
      actie: "AI_MODERATE",
      entiteit: "Moderatie",
      details: { type, limiet: effectiefLimiet },
    })

    return NextResponse.json({
      success: true,
      type,
      ...resultaten,
    })
  } catch (error) {
    console.error("[AI Moderate] Fout:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Moderatie mislukt" },
      { status: 500 }
    )
  }
}
