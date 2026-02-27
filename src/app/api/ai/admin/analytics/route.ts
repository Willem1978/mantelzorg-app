/**
 * Analytics & Signalering Agent — /api/ai/admin/analytics
 *
 * AI-gestuurd analyse-endpoint voor beheerders en gemeente-admins.
 *
 * Functies:
 *   - Patronen analyseren per gemeente (belasting, check-ins, alarmen)
 *   - Trends in check-in data detecteren
 *   - Samenvattende rapportages genereren met AI-duiding
 *
 * POST body:
 *   { type: "gemeente" | "trends" | "rapport", gemeente?: string }
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

// ── Gemeente-patronen ──────────────────────────────────────────────

async function analyseGemeente(gemeenteNaam?: string) {
  const where = gemeenteNaam ? { gemeente: gemeenteNaam } : {}
  const whereCaregiver = gemeenteNaam ? { municipality: gemeenteNaam } : {}

  const nu = new Date()
  const zestigDagenGeleden = new Date(nu.getTime() - 60 * 24 * 60 * 60 * 1000)
  const dertigDagenGeleden = new Date(nu.getTime() - 30 * 24 * 60 * 60 * 1000)

  const [
    testsPerNiveau,
    gemiddeldeScore,
    recenteTests,
    aantalAlarmen,
    alarmenPerType,
    aantalMantelzorgers,
    aantalCheckIns,
    hulpvragenPerCategorie,
    hulpvragenPerStatus,
  ] = await Promise.all([
    // Belastingniveau verdeling
    prisma.belastbaarheidTest.groupBy({
      by: ["belastingNiveau"],
      where: { isCompleted: true, ...where },
      _count: true,
    }),
    // Gemiddelde score
    prisma.belastbaarheidTest.aggregate({
      where: { isCompleted: true, ...where },
      _avg: { totaleBelastingScore: true },
      _count: true,
    }),
    // Recente tests (laatste 60 dagen)
    prisma.belastbaarheidTest.count({
      where: { isCompleted: true, completedAt: { gte: zestigDagenGeleden }, ...where },
    }),
    // Alarmen
    prisma.alarmLog.count({
      where: {
        isAfgehandeld: false,
        ...(gemeenteNaam
          ? { test: { gemeente: gemeenteNaam } }
          : {}),
      },
    }),
    // Alarmen per type
    prisma.alarmLog.groupBy({
      by: ["type"],
      where: {
        createdAt: { gte: dertigDagenGeleden },
        ...(gemeenteNaam ? { test: { gemeente: gemeenteNaam } } : {}),
      },
      _count: true,
    }),
    // Mantelzorgers in gemeente
    prisma.caregiver.count({ where: whereCaregiver }),
    // Check-ins afgelopen 30 dagen
    prisma.monthlyCheckIn.count({
      where: {
        completedAt: { gte: dertigDagenGeleden },
        ...(gemeenteNaam
          ? { caregiver: { municipality: gemeenteNaam } }
          : {}),
      },
    }),
    // Hulpvragen per categorie
    prisma.helpRequest.groupBy({
      by: ["category"],
      where: gemeenteNaam
        ? { caregiver: { municipality: gemeenteNaam } }
        : {},
      _count: true,
    }),
    // Hulpvragen per status
    prisma.helpRequest.groupBy({
      by: ["status"],
      where: gemeenteNaam
        ? { caregiver: { municipality: gemeenteNaam } }
        : {},
      _count: true,
    }),
  ])

  return {
    gemeente: gemeenteNaam || "Alle gemeenten",
    mantelzorgers: aantalMantelzorgers,
    tests: {
      totaal: gemiddeldeScore._count,
      recentZestigDagen: recenteTests,
      gemiddeldeScore: Math.round((gemiddeldeScore._avg.totaleBelastingScore || 0) * 10) / 10,
      perNiveau: testsPerNiveau.reduce(
        (acc, item) => ({ ...acc, [item.belastingNiveau]: item._count }),
        {} as Record<string, number>
      ),
    },
    alarmen: {
      openstaand: aantalAlarmen,
      perType: alarmenPerType.reduce(
        (acc, item) => ({ ...acc, [item.type]: item._count }),
        {} as Record<string, number>
      ),
    },
    checkIns: {
      afgelopenDertigDagen: aantalCheckIns,
    },
    hulpvragen: {
      perCategorie: hulpvragenPerCategorie.reduce(
        (acc, item) => ({ ...acc, [item.category]: item._count }),
        {} as Record<string, number>
      ),
      perStatus: hulpvragenPerStatus.reduce(
        (acc, item) => ({ ...acc, [item.status]: item._count }),
        {} as Record<string, number>
      ),
    },
  }
}

// ── Check-in trends ────────────────────────────────────────────────

async function analyseTrends(gemeenteNaam?: string) {
  const zes_maanden_geleden = new Date()
  zes_maanden_geleden.setMonth(zes_maanden_geleden.getMonth() - 6)

  const whereGemeente = gemeenteNaam
    ? { caregiver: { municipality: gemeenteNaam } }
    : {}

  // Haal alle check-ins van laatste 6 maanden op
  const checkIns = await prisma.monthlyCheckIn.findMany({
    where: {
      completedAt: { gte: zes_maanden_geleden },
      ...whereGemeente,
    },
    orderBy: { month: "asc" },
    select: {
      month: true,
      overallWellbeing: true,
      physicalHealth: true,
      emotionalHealth: true,
      workLifeBalance: true,
      supportSatisfaction: true,
      needsHelp: true,
      completedAt: true,
    },
  })

  // Groepeer per maand
  const perMaand = new Map<
    string,
    {
      welzijn: number[]
      fysiek: number[]
      emotioneel: number[]
      werkBalans: number[]
      steun: number[]
      hulpNodig: number
      totaal: number
    }
  >()

  for (const c of checkIns) {
    const key = c.month.toLocaleDateString("nl-NL", { month: "short", year: "numeric" })
    if (!perMaand.has(key)) {
      perMaand.set(key, { welzijn: [], fysiek: [], emotioneel: [], werkBalans: [], steun: [], hulpNodig: 0, totaal: 0 })
    }
    const m = perMaand.get(key)!
    m.totaal++
    if (c.overallWellbeing != null) m.welzijn.push(c.overallWellbeing)
    if (c.physicalHealth != null) m.fysiek.push(c.physicalHealth)
    if (c.emotionalHealth != null) m.emotioneel.push(c.emotionalHealth)
    if (c.workLifeBalance != null) m.werkBalans.push(c.workLifeBalance)
    if (c.supportSatisfaction != null) m.steun.push(c.supportSatisfaction)
    if (c.needsHelp) m.hulpNodig++
  }

  const avg = (arr: number[]) => (arr.length ? Math.round((arr.reduce((s, v) => s + v, 0) / arr.length) * 10) / 10 : null)

  const maandData = Array.from(perMaand.entries()).map(([maand, d]) => ({
    maand,
    aantalCheckIns: d.totaal,
    gemWelzijn: avg(d.welzijn),
    gemFysiek: avg(d.fysiek),
    gemEmotioneel: avg(d.emotioneel),
    gemWerkBalans: avg(d.werkBalans),
    gemSteun: avg(d.steun),
    percentHulpNodig: d.totaal > 0 ? Math.round((d.hulpNodig / d.totaal) * 100) : 0,
  }))

  // Signalering: check-ins met hulpNodig of lage scores
  const kritiekCheckIns = checkIns.filter(
    (c) =>
      c.needsHelp ||
      (c.overallWellbeing != null && c.overallWellbeing >= 4) ||
      (c.emotionalHealth != null && c.emotionalHealth >= 4)
  ).length

  return {
    gemeente: gemeenteNaam || "Alle gemeenten",
    periode: "Laatste 6 maanden",
    totaalCheckIns: checkIns.length,
    kritiekSignalen: kritiekCheckIns,
    perMaand: maandData,
  }
}

// ── AI Rapport generatie ───────────────────────────────────────────

async function genereerRapport(gemeenteNaam?: string) {
  const [gemeenteData, trendData] = await Promise.all([
    analyseGemeente(gemeenteNaam),
    analyseTrends(gemeenteNaam),
  ])

  if (!process.env.ANTHROPIC_API_KEY) {
    return {
      data: { gemeente: gemeenteData, trends: trendData },
      analyse: "AI-analyse niet beschikbaar: ANTHROPIC_API_KEY niet geconfigureerd.",
    }
  }

  const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const { text } = await generateText({
    model: anthropic("claude-sonnet-4-20250514"),
    maxOutputTokens: 1500,
    system: `Je bent een data-analist voor MantelBuddy, een platform voor mantelzorgers.
Je maakt beknopte, actionable rapportages voor gemeente-beheerders.

REGELS:
- Schrijf in het Nederlands, zakelijk maar toegankelijk
- Gebruik concrete cijfers uit de data
- Geef maximaal 5 belangrijke bevindingen
- Geef maximaal 3 concrete aanbevelingen
- Signaleer eventuele risico's of aandachtspunten
- Houd het kort: max 400 woorden
- Gebruik kopjes met markdown (##)

CONTEXT SCORES:
- Belastingscore: 0-6 = LAAG, 7-12 = GEMIDDELD, 13-24 = HOOG
- Check-in scores: 1 = goed, 5 = slecht (omgekeerd!)
- Check-in "hulpNodig" = true betekent dat de mantelzorger hulp vraagt`,
    prompt: `Analyseer de volgende data voor ${gemeenteNaam || "alle gemeenten"} en genereer een rapport.

GEMEENTE DATA:
${JSON.stringify(gemeenteData, null, 2)}

TREND DATA:
${JSON.stringify(trendData, null, 2)}

Maak een beknopt rapport met:
1. Samenvatting van de huidige situatie
2. Belangrijkste bevindingen en trends
3. Signalering van risico's
4. Concrete aanbevelingen`,
  })

  return {
    data: { gemeente: gemeenteData, trends: trendData },
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
    const { type = "rapport", gemeente } = body as {
      type?: "gemeente" | "trends" | "rapport"
      gemeente?: string
    }

    // Gemeente-admin mag alleen eigen gemeente(n) opvragen
    if (session.user.role === "GEMEENTE_ADMIN" && gemeente) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { gemeenteNaam: true },
      })
      if (user?.gemeenteNaam && user.gemeenteNaam !== gemeente) {
        return NextResponse.json(
          { error: "Je hebt alleen toegang tot data van je eigen gemeente" },
          { status: 403 }
        )
      }
    }

    let result
    switch (type) {
      case "gemeente":
        result = await analyseGemeente(gemeente)
        break
      case "trends":
        result = await analyseTrends(gemeente)
        break
      case "rapport":
      default:
        result = await genereerRapport(gemeente)
        break
    }

    await logAudit({
      userId: session.user.id!,
      actie: "AI_ANALYTICS",
      entiteit: "Analytics",
      details: { type, gemeente: gemeente || "alle" },
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("[AI Analytics] Fout:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Analyse mislukt" },
      { status: 500 }
    )
  }
}
