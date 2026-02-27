/**
 * Pre-fetcht alle AI context (balanstest, hulpbronnen, gemeente) zodat
 * de AI in één stap kan antwoorden zonder multi-step tool calls.
 */
import { prisma } from "@/lib/prisma"
import { berekenDeelgebieden } from "@/lib/dashboard/deelgebieden"
import { loadCoachAdviezen } from "@/lib/ai/coach-advies"
import { resolveGemeenteContact } from "@/lib/ai/gemeente-resolver"
import { DEELGEBIED_SLEUTEL_MAP, TAAK_ID_MAP } from "@/lib/ai/types"

export async function prefetchUserContext(userId: string, gemeente: string | null) {
  const test = await prisma.belastbaarheidTest.findFirst({
    where: { caregiver: { userId }, isCompleted: true },
    orderBy: { completedAt: "desc" },
    select: {
      id: true,
      totaleBelastingScore: true,
      belastingNiveau: true,
      totaleZorguren: true,
      completedAt: true,
      antwoorden: {
        select: { vraagId: true, vraagTekst: true, antwoord: true, score: true, gewicht: true },
        orderBy: { vraagId: "asc" },
      },
      taakSelecties: {
        where: { isGeselecteerd: true },
        select: { taakNaam: true, urenPerWeek: true, moeilijkheid: true },
        orderBy: { urenPerWeek: "desc" },
      },
      alarmLogs: {
        select: { type: true, beschrijving: true, urgentie: true },
      },
    },
  })

  if (!test) {
    return { heeftTest: false as const }
  }

  // Bereken deelgebieden
  const deelgebieden = berekenDeelgebieden(
    test.antwoorden.map((a) => ({ vraagId: a.vraagId, score: a.score, gewicht: a.gewicht }))
  )

  // Coach adviezen
  const adviesMap = await loadCoachAdviezen()

  // Gemeente contact
  const gemeenteContact =
    gemeente && test.belastingNiveau
      ? await resolveGemeenteContact(gemeente, test.belastingNiveau)
      : null

  // Zware taken
  const zwareTaken = test.taakSelecties.filter(
    (t) => t.moeilijkheid === "MOEILIJK" || t.moeilijkheid === "ZEER_MOEILIJK"
  )

  // Hulpbronnen per zware taak + voor mantelzorger zelf
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const gemeenteFilter: any[] = gemeente
    ? [
        { gemeente: { equals: gemeente, mode: "insensitive" } },
        { dekkingNiveau: "LANDELIJK" },
        { gemeente: null },
      ]
    : []

  // Bepaal visibility op basis van belastingniveau
  const niveauFilter =
    test.belastingNiveau === "HOOG"
      ? { zichtbaarBijHoog: true }
      : test.belastingNiveau === "GEMIDDELD"
        ? { zichtbaarBijGemiddeld: true }
        : { zichtbaarBijLaag: true }

  // 1) Hulpbronnen voor de naaste (op basis van zorgtaken categorieën)
  const taakNamen = zwareTaken.slice(0, 5).map((t) => t.taakNaam)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hulpVoorNaaste: Record<string, any[]> = {}

  for (const taakNaam of taakNamen) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: Record<string, any> = {
      isActief: true,
      onderdeelTest: { contains: taakNaam, mode: "insensitive" },
      ...niveauFilter,
    }
    if (gemeenteFilter.length > 0) {
      where.OR = gemeenteFilter
    }

    const resultaten = await prisma.zorgorganisatie.findMany({
      where,
      take: 3,
      orderBy: { naam: "asc" },
      select: {
        naam: true,
        beschrijving: true,
        telefoon: true,
        website: true,
        email: true,
        soortHulp: true,
        kosten: true,
        doelgroep: true,
      },
    })

    if (resultaten.length > 0) {
      hulpVoorNaaste[taakNaam] = resultaten
    }
  }

  // 2) Hulpbronnen voor de mantelzorger zelf
  const mantelzorgCategorieen = [
    "Emotionele steun",
    "Vervangende mantelzorg",
    "Persoonlijke begeleiding",
    "Informatie en advies",
  ]

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mantelzorgWhere: Record<string, any> = {
    isActief: true,
    ...niveauFilter,
    OR: [
      { doelgroep: "MANTELZORGER" },
      ...mantelzorgCategorieen.map((cat) => ({
        onderdeelTest: { contains: cat, mode: "insensitive" },
      })),
    ],
  }
  if (gemeente) {
    mantelzorgWhere.AND = [
      {
        OR: [
          { gemeente: { equals: gemeente, mode: "insensitive" } },
          { dekkingNiveau: "LANDELIJK" },
          { gemeente: null },
        ],
      },
    ]
  }

  const hulpVoorMantelzorger = await prisma.zorgorganisatie.findMany({
    where: mantelzorgWhere,
    take: 6,
    orderBy: { naam: "asc" },
    select: {
      naam: true,
      beschrijving: true,
      telefoon: true,
      website: true,
      email: true,
      soortHulp: true,
      kosten: true,
      onderdeelTest: true,
    },
  })

  // Bouw context tekst
  const probleemDeelgebieden = deelgebieden.filter(
    (d) => d.niveau === "HOOG" || d.niveau === "GEMIDDELD"
  )

  return {
    heeftTest: true as const,
    testDatum: test.completedAt?.toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" }),
    totaalScore: test.totaleBelastingScore,
    niveau: test.belastingNiveau,
    totaleZorguren: test.totaleZorguren,
    adviesVoorTotaal: adviesMap[`totaal.${test.belastingNiveau}`] || null,
    deelgebieden: deelgebieden.map((d) => {
      const sleutel = DEELGEBIED_SLEUTEL_MAP[d.naam] || ""
      return {
        naam: d.naam,
        emoji: d.emoji,
        percentage: d.percentage,
        niveau: d.niveau,
        tip: adviesMap[`${sleutel}.${d.niveau}`] || d.tip,
      }
    }),
    probleemDeelgebieden: probleemDeelgebieden.map((d) => ({
      naam: d.naam,
      niveau: d.niveau,
    })),
    zwareTaken: zwareTaken.map((t) => {
      const tid = TAAK_ID_MAP[t.taakNaam]
      return {
        taak: t.taakNaam,
        urenPerWeek: t.urenPerWeek,
        moeilijkheid: t.moeilijkheid,
        advies: tid ? (adviesMap[`taak.${tid}.advies`] || null) : null,
      }
    }),
    hulpVoorNaaste,
    hulpVoorMantelzorger,
    gemeenteContact,
    alarmen: test.alarmLogs.map((a) => ({
      type: a.type,
      beschrijving: a.beschrijving,
      urgentie: a.urgentie,
    })),
  }
}

/**
 * Bouwt een context-blok dat als injectie in het systeem-prompt kan worden gebruikt.
 */
export function buildContextBlock(ctx: Awaited<ReturnType<typeof prefetchUserContext>>): string {
  if (!ctx.heeftTest) {
    return `\n\n--- GEBRUIKERSCONTEXT ---\nDeze gebruiker heeft nog GEEN balanstest gedaan. Moedig aan om de test te doen via /belastbaarheidstest (duurt 5 minuten).`
  }

  let block = `\n\n--- GEBRUIKERSCONTEXT (AUTOMATISCH GELADEN) ---
Je HOEFT GEEN tools aan te roepen voor deze informatie. Het is al beschikbaar:

BALANSTEST (${ctx.testDatum}):
- Totaalscore: ${ctx.totaalScore}/24 → Niveau: ${ctx.niveau}
- Zorguren per week: ${ctx.totaleZorguren}`

  if (ctx.adviesVoorTotaal) {
    block += `\n- Advies bij dit niveau: ${ctx.adviesVoorTotaal}`
  }

  block += `\n\nDEELGEBIEDEN:`
  for (const d of ctx.deelgebieden) {
    block += `\n- ${d.emoji} ${d.naam}: ${d.percentage}% → ${d.niveau}`
    if (d.tip) block += ` | Tip: ${d.tip}`
  }

  if (ctx.zwareTaken.length > 0) {
    block += `\n\nZWARE ZORGTAKEN (voor de naaste):`
    for (const t of ctx.zwareTaken) {
      block += `\n- ${t.taak} (${t.urenPerWeek}u/week, ${t.moeilijkheid})`
      if (t.advies) block += `\n  Advies: ${t.advies}`
    }
  }

  const hulpNaaste = Object.entries(ctx.hulpVoorNaaste)
  if (hulpNaaste.length > 0) {
    block += `\n\nBESCHIKBARE HULP VOOR DE NAASTE (per zorgtaak):`
    for (const [taak, bronnen] of hulpNaaste) {
      block += `\n\n  ${taak}:`
      for (const b of bronnen) {
        block += `\n  • ${b.naam}`
        if (b.soortHulp) block += ` — ${b.soortHulp}`
        if (b.telefoon) block += ` | Tel: ${b.telefoon}`
        if (b.email) block += ` | Email: ${b.email}`
        if (b.website) block += ` | Web: ${b.website}`
        if (b.kosten) block += ` | Kosten: ${b.kosten}`
      }
    }
  }

  if (ctx.hulpVoorMantelzorger.length > 0) {
    block += `\n\nBESCHIKBARE HULP VOOR JOU (mantelzorger):`
    for (const b of ctx.hulpVoorMantelzorger) {
      block += `\n  • ${b.naam}`
      if (b.soortHulp) block += ` — ${b.soortHulp}`
      if (b.onderdeelTest) block += ` [${b.onderdeelTest}]`
      if (b.telefoon) block += ` | Tel: ${b.telefoon}`
      if (b.email) block += ` | Email: ${b.email}`
      if (b.website) block += ` | Web: ${b.website}`
      if (b.kosten) block += ` | Kosten: ${b.kosten}`
    }
  }

  if (ctx.gemeenteContact) {
    const gc = ctx.gemeenteContact
    block += `\n\nGEMEENTE HULPVERLENER:`
    block += `\n  • ${gc.naam} (${gc.gemeente})`
    if (gc.telefoon) block += ` | Tel: ${gc.telefoon}`
    if (gc.email) block += ` | Email: ${gc.email}`
    if (gc.website) block += ` | Web: ${gc.website}`
    if (gc.adviesTekst) block += `\n  Advies: ${gc.adviesTekst}`
  }

  if (ctx.alarmen.length > 0) {
    block += `\n\n⚠️ ALARMEN:`
    for (const a of ctx.alarmen) {
      block += `\n  • ${a.type}: ${a.beschrijving} (${a.urgentie})`
    }
  }

  block += `\n--- EINDE CONTEXT ---`
  return block
}
