/**
 * Pre-fetcht alle AI context (balanstest, hulpbronnen, gemeente) zodat
 * de AI in één stap kan antwoorden zonder multi-step tool calls.
 *
 * Gebruikt dezelfde zoeklogica als de hulpvragen-pagina:
 * - ZORGTAKEN + TAAK_NAAM_VARIANTEN voor categorie-matching
 * - doelgroep: "MANTELZORGER" voor hulp aan de mantelzorger zelf
 */
import { prisma } from "@/lib/prisma"
import { berekenDeelgebieden } from "@/lib/dashboard/deelgebieden"
import { loadCoachAdviezen } from "@/lib/ai/coach-advies"
import { resolveGemeenteContact } from "@/lib/ai/gemeente-resolver"
import { fetchOpenActiepunten } from "@/lib/ai/tools/actiepunten"
import { DEELGEBIED_SLEUTEL_MAP, TAAK_ID_MAP } from "@/lib/ai/types"
import { ZORGTAKEN, TAAK_NAAM_VARIANTEN, HULP_VOOR_MANTELZORGER } from "@/config/options"
import { getISOWeekNummer } from "@/lib/weekkaarten/genereer-weekkaarten"
import { prioritizeUnshown, toKeySet } from "@/lib/ai/variation"
import { bepaalGemeenteScope } from "@/lib/ai/hulp-categorisatie"

// Mapping van taakNaam (dbValue) naar alle mogelijke onderdeelTest waarden
// Identiek aan TAAK_NAAR_ONDERDEEL_VARIANTEN in hulpbronnen.ts
function getOnderdeelVarianten(taakNaam: string): string[] {
  const varianten = TAAK_NAAM_VARIANTEN[taakNaam] || []
  return [taakNaam, ...varianten]
}

/**
 * Pre-fetch met twee gemeenten:
 * - gemeenteMantelzorger: voor hulp AAN de mantelzorger (steunpunt, emotioneel)
 * - gemeenteZorgvrager: voor hulp BIJ zorgtaken (verzorging, boodschappen, klusjes)
 *
 * Voorbeeld: mantelzorger woont in Arnhem, zorgvrager in Zutphen
 * → Hulp bij boodschappen/verzorging komt uit Zutphen
 * → Mantelzorgsteunpunt komt uit Arnhem
 */
export interface PrefetchOptions {
  /** Namen van hulpbronnen die de gebruiker al in dit gesprek heeft gezien — worden achteraan gezet zodat er variatie ontstaat. */
  shownHulpbronnen?: string[]
}

export async function prefetchUserContext(
  userId: string,
  gemeenteMantelzorger: string | null,
  gemeenteZorgvrager?: string | null,
  options: PrefetchOptions = {},
) {
  // Fallback: als alleen één gemeente wordt meegegeven (backwards compatibility)
  const gemZorgvrager = gemeenteZorgvrager ?? gemeenteMantelzorger
  const shownHulpSet = toKeySet(options.shownHulpbronnen)

  // 0) Haal gebruiker-voorkeuren + organisatiekoppelingen op
  const caregiver = await prisma.caregiver.findFirst({
    where: { userId },
    select: {
      aandoening: true,
      voorkeuren: {
        select: { type: true, slug: true },
      },
      organisationLinks: {
        where: {
          organisation: { isActive: true },
        },
        select: {
          organisation: {
            select: { name: true, description: true, phone: true, website: true },
          },
        },
      },
    },
  })

  // 0b) Haal openstaande actiepunten op voor opvolging
  const actiepunten = await fetchOpenActiepunten(userId)

  // 0b2) Haal de laatste 3 gespreks-samenvattingen op zodat Ger kan refereren
  // aan eerdere gesprekken. Privacy-vriendelijk: alleen samenvatting + onderwerpen,
  // geen letterlijke berichten.
  const eerdereGesprekken = await prisma.gesprekSamenvatting.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 3,
    select: {
      samenvatting: true,
      onderwerpen: true,
      actiepuntenAangemaakt: true,
      createdAt: true,
    },
  })

  // 0c) Haal weekkaarten op voor deze week
  const weekKaarten = caregiver
    ? await prisma.weekKaart.findMany({
        where: {
          caregiver: { userId },
          weekNummer: getISOWeekNummer(),
        },
        select: { type: true, titel: true, isVoltooid: true },
      })
    : []

  // 1) Haal de laatste balanstest op
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
        select: { taakId: true, taakNaam: true, urenPerWeek: true, moeilijkheid: true },
        orderBy: { urenPerWeek: "desc" },
      },
      alarmLogs: {
        select: { type: true, beschrijving: true, urgentie: true },
      },
    },
  })

  if (!test) {
    // Geen test? Haal alsnog alle hulpbronnen per categorie op
    // Zorgtaken-hulp → gemeente zorgvrager, mantelzorger-hulp → gemeente mantelzorger
    const alleHulp = await fetchAlleHulpbronnenPerCategorie(gemZorgvrager, shownHulpSet)
    const mantelzorgerHulp = await fetchMantelzorgerHulp(gemeenteMantelzorger, gemZorgvrager, shownHulpSet)
    // Haal gemeente contact op (zonder niveau — gebruik GEMIDDELD als default)
    const gemeenteVoorContact = gemZorgvrager || gemeenteMantelzorger
    const gemeenteContact = gemeenteVoorContact
      ? await resolveGemeenteContact(gemeenteVoorContact, "GEMIDDELD")
      : null
    return {
      heeftTest: false as const,
      gemMantelzorger: gemeenteMantelzorger,
      gemZorgvrager,
      alleHulpPerCategorie: alleHulp,
      hulpVoorMantelzorger: mantelzorgerHulp,
      gemeenteContact,
      aandoening: caregiver?.aandoening || null,
      voorkeuren: caregiver?.voorkeuren || [],
      actiepunten,
      eerdereGesprekken,
      weekKaarten,
      externeHulp: caregiver?.organisationLinks?.map((l) => ({
        naam: l.organisation.name,
        beschrijving: l.organisation.description,
        telefoon: l.organisation.phone,
        website: l.organisation.website,
      })) || [],
    }
  }

  // 2) Bereken deelgebieden
  const deelgebieden = berekenDeelgebieden(
    test.antwoorden.map((a) => ({ vraagId: a.vraagId, score: a.score, gewicht: a.gewicht }))
  )

  // 3) Coach adviezen
  const adviesMap = await loadCoachAdviezen()

  // 4) Gemeente contact — zorgtaken worden bij zorgvrager gedaan
  const gemeenteVoorContact = gemZorgvrager || gemeenteMantelzorger
  const gemeenteContact =
    gemeenteVoorContact && test.belastingNiveau
      ? await resolveGemeenteContact(gemeenteVoorContact, test.belastingNiveau)
      : null

  // 5) Alle geselecteerde taken + zware taken apart
  const alleTaken = test.taakSelecties
  const zwareTaken = alleTaken.filter(
    (t) => t.moeilijkheid === "MOEILIJK" || t.moeilijkheid === "ZEER_MOEILIJK"
  )
  // Overige taken (niet-zwaar maar wel geselecteerd — vaak frequente taken)
  const overigeTaken = alleTaken.filter(
    (t) => t.moeilijkheid !== "MOEILIJK" && t.moeilijkheid !== "ZEER_MOEILIJK"
  )

  // 6) Hulpbronnen per zware taak — gemeente ZORGVRAGER (daar vindt de zorg plaats)
  const niveauFilter: Record<string, unknown>[] = []
  if (test.belastingNiveau === "LAAG") niveauFilter.push({ zichtbaarBijLaag: true })
  else if (test.belastingNiveau === "GEMIDDELD") niveauFilter.push({ zichtbaarBijGemiddeld: true })
  else if (test.belastingNiveau === "HOOG") niveauFilter.push({ zichtbaarBijHoog: true })

  const gemeenteFilter = gemZorgvrager
    ? [
        { gemeente: { equals: gemZorgvrager, mode: "insensitive" as const } },
        { gemeente: null },
      ]
    : [{ gemeente: null }]

  // Hulp per zware taak — PARALLEL ophalen (zelfde als hulpbronnen.ts)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hulpVoorNaaste: Record<string, any[]> = {}

  // Haal hulp op voor zware taken + top frequente overige taken
  const takenVoorHulp = [
    ...zwareTaken.slice(0, 5),
    ...overigeTaken.slice(0, 3), // ook top 3 frequente taken (gesorteerd op uren)
  ]

  const taakQueries = takenVoorHulp.map(async (taak) => {
    const varianten = getOnderdeelVarianten(taak.taakNaam)

    const ruwe = await prisma.zorgorganisatie.findMany({
      where: {
        isActief: true,
        onderdeelTest: { in: varianten },
        OR: gemeenteFilter,
        AND: niveauFilter,
      },
      take: 15,
      orderBy: { naam: "asc" },
      select: {
        naam: true,
        dienst: true,
        beschrijving: true,
        telefoon: true,
        website: true,
        email: true,
        soortHulp: true,
        kosten: true,
        gemeente: true,
        openingstijden: true,
        eersteStap: true,
        verwachtingTekst: true,
      },
    })

    // Variatie tussen chat-beurten: nog niet getoonde items eerst, dan getoonde
    const resultaten = prioritizeUnshown(ruwe, (r) => r.naam, shownHulpSet).slice(0, 5)
    return { taakNaam: taak.taakNaam, resultaten }
  })

  const taakResultaten = await Promise.all(taakQueries)
  for (const { taakNaam, resultaten } of taakResultaten) {
    if (resultaten.length > 0) {
      hulpVoorNaaste[taakNaam] = resultaten
    }
  }

  // 7) Hulpbronnen voor de mantelzorger zelf — uit BEIDE gemeenten met scope-label
  const hulpVoorMantelzorger = await fetchMantelzorgerHulp(gemeenteMantelzorger, gemZorgvrager, shownHulpSet)

  // 8) Alle hulpbronnen per categorie — gemeente ZORGVRAGER (zorgtaken vinden daar plaats)
  const alleHulpPerCategorie = await fetchAlleHulpbronnenPerCategorie(gemZorgvrager, shownHulpSet)

  // Bouw het resultaat
  const probleemDeelgebieden = deelgebieden.filter(
    (d) => d.niveau === "HOOG" || d.niveau === "GEMIDDELD"
  )

  return {
    heeftTest: true as const,
    gemMantelzorger: gemeenteMantelzorger,
    gemZorgvrager,
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
      // Niveau-specifiek advies (taak.t1.HOOG) met fallback naar generiek (taak.t1.advies)
      const niveauAdvies = tid && test.belastingNiveau
        ? adviesMap[`taak.${tid}.${test.belastingNiveau}`] || null
        : null
      const generiekAdvies = tid ? (adviesMap[`taak.${tid}.advies`] || null) : null
      return {
        taak: t.taakNaam,
        urenPerWeek: t.urenPerWeek,
        moeilijkheid: t.moeilijkheid,
        advies: niveauAdvies || generiekAdvies,
      }
    }),
    overigeTaken: overigeTaken.map((t) => ({
      taak: t.taakNaam,
      urenPerWeek: t.urenPerWeek,
      moeilijkheid: t.moeilijkheid,
    })),
    hulpVoorNaaste,
    hulpVoorMantelzorger,
    alleHulpPerCategorie,
    gemeenteContact,
    alarmen: test.alarmLogs.map((a) => ({
      type: a.type,
      beschrijving: a.beschrijving,
      urgentie: a.urgentie,
    })),
    aandoening: caregiver?.aandoening || null,
    voorkeuren: caregiver?.voorkeuren || [],
    actiepunten,
    eerdereGesprekken,
    weekKaarten,
    externeHulp: caregiver?.organisationLinks?.map((l) => ({
      naam: l.organisation.name,
      beschrijving: l.organisation.description,
      telefoon: l.organisation.phone,
      website: l.organisation.website,
    })) || [],
  }
}

/**
 * Haalt ALLE hulpbronnen per categorie op (zonder niveaufilter),
 * zodat de AI altijd iets kan aanbieden.
 */
async function fetchAlleHulpbronnenPerCategorie(
  gemeente: string | null,
  shownSet: ReadonlySet<string> = new Set(),
) {
  const gemeenteFilter = gemeente
    ? [
        { gemeente: { equals: gemeente, mode: "insensitive" as const } },
        { gemeente: null },
      ]
    : [{ gemeente: null }]

  const alle = await prisma.zorgorganisatie.findMany({
    where: {
      isActief: true,
      OR: gemeenteFilter,
      onderdeelTest: { not: null },
    },
    orderBy: { naam: "asc" },
    select: {
      naam: true,
      dienst: true,
      telefoon: true,
      website: true,
      email: true,
      beschrijving: true,
      soortHulp: true,
      kosten: true,
      onderdeelTest: true,
      gemeente: true,
      openingstijden: true,
      eersteStap: true,
      verwachtingTekst: true,
    },
  })

  // Groepeer per categorie — gebruik dezelfde ZORGTAKEN mapping
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const perCategorie: Record<string, any[]> = {}

  for (const zorgtaak of ZORGTAKEN) {
    const varianten = getOnderdeelVarianten(zorgtaak.dbValue)
    const matches = alle.filter((h) => h.onderdeelTest && varianten.includes(h.onderdeelTest))
    if (matches.length > 0) {
      // Variatie: eerst nog niet getoonde items (geshuffeld), dan al getoonde
      const gevarieerd = prioritizeUnshown(matches, (h) => h.naam, shownSet)
      perCategorie[zorgtaak.naam] = gevarieerd.slice(0, 5).map((h) => ({
        naam: h.naam,
        dienst: h.dienst,
        telefoon: h.telefoon,
        website: h.website,
        email: h.email,
        beschrijving: h.beschrijving,
        soortHulp: h.soortHulp,
        kosten: h.kosten,
        gemeente: h.gemeente,
        openingstijden: h.openingstijden,
        eersteStap: h.eersteStap,
        verwachtingTekst: h.verwachtingTekst,
        lokaal: !!h.gemeente,
      }))
    }
  }

  return perCategorie
}

/**
 * Haalt hulp voor de mantelzorger op uit BEIDE gemeenten (mantelzorger + zorgvrager)
 * en labelt elke organisatie met scope:
 *   - "lokaal": alleen relevant in mantelzorger-stad (lotgenoten, praatgroepen)
 *   - "beide": relevant in zowel mantelzorger- als zorgvrager-stad
 *     (mantelzorgmakelaar, respijtzorg, informatie, educatie, emotionele steun)
 *
 * Per organisatie wordt de juiste scope bepaald via heuristiek
 * (`bepaalGemeenteScope`). Lotgenoten in zorgvrager-stad worden eruit
 * gefilterd — die zijn niet praktisch voor de mantelzorger.
 */
type MantelzorgerHulpItem = {
  naam: string
  dienst: string | null
  beschrijving: string | null
  telefoon: string | null
  website: string | null
  email: string | null
  soortHulp: string | null
  kosten: string | null
  onderdeelTest: string | null
  gemeente: string | null
  openingstijden: string | null
  eersteStap: string | null
  verwachtingTekst: string | null
  scope: "lokaal" | "beide" | "landelijk"
}

async function fetchMantelzorgerHulp(
  gemMantelzorger: string | null,
  gemZorgvrager: string | null,
  shownSet: ReadonlySet<string> = new Set(),
): Promise<MantelzorgerHulpItem[]> {
  // Bepaal welke gemeenten doorzocht moeten worden (uniek)
  const gemeenten = new Set<string>()
  if (gemMantelzorger) gemeenten.add(gemMantelzorger)
  if (gemZorgvrager) gemeenten.add(gemZorgvrager)
  if (gemeenten.size === 0) return []

  const gemeenteFilter = [
    ...[...gemeenten].map((g) => ({ gemeente: { equals: g, mode: "insensitive" as const } })),
    { gemeente: null }, // landelijk
  ]

  const ruwe = await prisma.zorgorganisatie.findMany({
    where: {
      isActief: true,
      OR: [
        { onderdeelTest: { in: HULP_VOOR_MANTELZORGER.map((c) => c.dbValue) } },
        { doelgroep: "MANTELZORGER" },
      ],
      AND: [{ OR: gemeenteFilter }],
    },
    take: 60,
    orderBy: { naam: "asc" },
    select: {
      naam: true,
      dienst: true,
      beschrijving: true,
      telefoon: true,
      website: true,
      email: true,
      soortHulp: true,
      kosten: true,
      onderdeelTest: true,
      gemeente: true,
      openingstijden: true,
      eersteStap: true,
      verwachtingTekst: true,
      lokaalGebonden: true,
    },
  })

  // Filter per organisatie op de juiste scope:
  //   - landelijk: altijd meenemen (label "landelijk")
  //   - mantelzorger-stad: altijd OK
  //   - zorgvrager-stad: alleen meenemen als scope = "beide" (geen lotgenoten in
  //     zorgvragers-stad). DB-veld lokaalGebonden override't de heuristiek.
  const passend: MantelzorgerHulpItem[] = []
  for (const r of ruwe) {
    if (!r.gemeente) {
      passend.push({
        naam: r.naam, dienst: r.dienst, beschrijving: r.beschrijving,
        telefoon: r.telefoon, website: r.website, email: r.email,
        soortHulp: r.soortHulp, kosten: r.kosten, onderdeelTest: r.onderdeelTest,
        gemeente: r.gemeente, openingstijden: r.openingstijden,
        eersteStap: r.eersteStap, verwachtingTekst: r.verwachtingTekst,
        scope: "landelijk",
      })
      continue
    }
    const scope = bepaalGemeenteScope(r.onderdeelTest, r.naam, r.dienst, {
      lokaalGebonden: r.lokaalGebonden,
    })
    const inMantelzorgerStad =
      gemMantelzorger && r.gemeente.toLowerCase() === gemMantelzorger.toLowerCase()
    const inZorgvragerStad =
      gemZorgvrager && r.gemeente.toLowerCase() === gemZorgvrager.toLowerCase()
    // Helper om alleen MantelzorgerHulpItem-velden te pluck (geen lokaalGebonden)
    const itemBasis = {
      naam: r.naam, dienst: r.dienst, beschrijving: r.beschrijving,
      telefoon: r.telefoon, website: r.website, email: r.email,
      soortHulp: r.soortHulp, kosten: r.kosten, onderdeelTest: r.onderdeelTest,
      gemeente: r.gemeente, openingstijden: r.openingstijden,
      eersteStap: r.eersteStap, verwachtingTekst: r.verwachtingTekst,
    }
    if (scope === "mantelzorger-only") {
      if (inMantelzorgerStad) passend.push({ ...itemBasis, scope: "lokaal" })
    } else {
      if (inMantelzorgerStad || inZorgvragerStad) passend.push({ ...itemBasis, scope: "beide" })
    }
  }

  return prioritizeUnshown(passend, (h) => h.naam, shownSet).slice(0, 12)
}

/**
 * Bouwt een context-blok dat als injectie in het systeem-prompt kan worden gebruikt.
 */
export function buildContextBlock(ctx: Awaited<ReturnType<typeof prefetchUserContext>>): string {
  // Voorkeurenblok (voor beide paden)
  const voorkeurenBlock = buildVoorkeurenBlock(ctx.aandoening, ctx.voorkeuren)

  // Actiepunten blok (voor beide paden)
  const actiepuntenBlock = buildActiepuntenBlock(ctx.actiepunten)
  // Weekkaarten blok (voor beide paden)
  const weekKaartenBlock = buildWeekKaartenBlock(ctx.weekKaarten)
  // Externe hulp blok (voor beide paden)
  const externeHulpBlock = buildExterneHulpBlock(ctx.externeHulp)
  // Eerdere gespreks-samenvattingen (voor beide paden) — nieuw in Ronde 11
  const eerdereGesprekkenBlock = buildEerdereGesprekkenBlock(ctx.eerdereGesprekken)

  if (!ctx.heeftTest) {
    let block = `\n\n--- GEBRUIKERSCONTEXT ---
Deze gebruiker heeft nog GEEN balanstest gedaan. Moedig aan om de test te doen via /belastbaarheidstest (duurt 5 minuten).`

    block += voorkeurenBlock
    block += eerdereGesprekkenBlock
    block += actiepuntenBlock
    block += weekKaartenBlock
    block += externeHulpBlock
    // Toch hulpbronnen tonen als die er zijn
    block += buildHulpPerCategorieBlock(ctx.alleHulpPerCategorie, ctx.gemZorgvrager)
    block += buildMantelzorgerHulpBlock(ctx.hulpVoorMantelzorger, ctx.gemMantelzorger, ctx.gemZorgvrager)
    if (ctx.gemeenteContact) {
      block += buildGemeenteContactBlock(ctx.gemeenteContact)
    }
    block += `\n--- EINDE CONTEXT ---`
    return block
  }

  let block = `\n\n--- GEBRUIKERSCONTEXT (AUTOMATISCH GELADEN) ---
Je HOEFT GEEN tools aan te roepen voor deze informatie. Het is al beschikbaar.

BALANSTEST (${ctx.testDatum}):
- Totaalscore: ${ctx.totaalScore}/24 → Niveau: ${ctx.niveau}
- Zorguren per week: ${ctx.totaleZorguren}`

  if (ctx.adviesVoorTotaal) {
    block += `\n- Advies bij dit niveau: ${ctx.adviesVoorTotaal}`
  }

  block += voorkeurenBlock
  block += eerdereGesprekkenBlock
  block += actiepuntenBlock
  block += weekKaartenBlock
  block += externeHulpBlock

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

  if (ctx.overigeTaken && ctx.overigeTaken.length > 0) {
    block += `\n\nOVERIGE ZORGTAKEN (voor de naaste — niet als zwaar aangegeven, maar wel geselecteerd):`
    for (const t of ctx.overigeTaken) {
      block += `\n- ${t.taak} (${t.urenPerWeek}u/week${t.moeilijkheid ? `, ${t.moeilijkheid}` : ""})`
    }
    block += `\nDeze taken kosten ook tijd en energie. Bied PROACTIEF hulp aan bij taken met veel uren, ook als ze niet als "zwaar" zijn gemarkeerd.`
  }

  // Hulp per zware taak (deel van het ZORGVRAGER-TAKEN-blok)
  const hulpNaaste = Object.entries(ctx.hulpVoorNaaste)
  if (hulpNaaste.length > 0) {
    const stadLabel = ctx.gemZorgvrager ? ` (in ${ctx.gemZorgvrager})` : ""
    block += `\n\n=== HULP BIJ ZWAARSTE TAKEN VOOR JE NAASTE${stadLabel} ===
Dit zijn organisaties die de zwaarste zorgtaken kunnen overnemen. Onderdeel
van "hulp bij een taak voor je naaste" — niet voor de mantelzorger zelf.`
    for (const [taak, bronnen] of hulpNaaste) {
      block += `\n\n  ${taak}:`
      for (const b of bronnen) {
        block += `\n  ${formatHulpkaart(b)}`
      }
    }
  }

  // Alle hulp per categorie (ook niet-zware taken)
  block += buildHulpPerCategorieBlock(ctx.alleHulpPerCategorie, ctx.gemZorgvrager)

  // Hulp voor mantelzorger
  block += buildMantelzorgerHulpBlock(ctx.hulpVoorMantelzorger, ctx.gemMantelzorger, ctx.gemZorgvrager)

  if (ctx.gemeenteContact) {
    block += buildGemeenteContactBlock(ctx.gemeenteContact)
  }

  if (ctx.alarmen.length > 0) {
    block += `\n\nALARMEN:`
    for (const a of ctx.alarmen) {
      block += `\n  • ${a.type}: ${a.beschrijving} (${a.urgentie})`
    }
  }

  block += `\n--- EINDE CONTEXT ---`
  return block
}

/**
 * Genereert de exacte {{hulpkaart:...}} syntax zodat de AI deze kan kopiëren.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatHulpkaart(b: any): string {
  const dienst = b.dienst || b.soortHulp || ""
  const beschrijving = b.beschrijving || ""
  const telefoon = b.telefoon || ""
  const website = b.website || ""
  const gemeente = b.gemeente || ""
  const kosten = b.kosten || ""
  const openingstijden = b.openingstijden || ""
  return `{{hulpkaart:${b.naam}|${dienst}|${beschrijving}|${telefoon}|${website}|${gemeente}|${kosten}|${openingstijden}}}`
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildHulpPerCategorieBlock(perCategorie: Record<string, any[]>, gemZorgvrager: string | null): string {
  const entries = Object.entries(perCategorie)
  if (entries.length === 0) return ""

  const stadLabel = gemZorgvrager ? ` (in ${gemZorgvrager} — de stad van je naaste)` : ""
  let block = `\n\n=== HULP BIJ TAKEN VOOR JE NAASTE${stadLabel} ===
Dit zijn organisaties die TAKEN kunnen overnemen die jij normaal voor je
naaste doet. Per zorgtaak een set hulpkaarten. Kopieer letterlijk.`
  for (const [categorie, bronnen] of entries) {
    block += `\n\n  ${categorie} (${bronnen.length}):`
    for (const b of bronnen) {
      block += `\n  ${formatHulpkaart(b)}`
    }
  }
  return block
}

function buildVoorkeurenBlock(aandoening: string | null, voorkeuren: { type: string; slug: string }[]): string {
  if (!aandoening && voorkeuren.length === 0) return ""

  let block = `\n\nPROFIEL & VOORKEUREN VAN DEZE MANTELZORGER:`

  // Zorgthema's (wat voor zorg geeft deze persoon?)
  const zorgthemaSlugs = ["geheugen-cognitie", "lichamelijk", "psychisch-emotioneel", "beperking-begeleiding", "ouder-worden", "ernstig-ziek"]
  const zorgthemaNamen: Record<string, string> = {
    "geheugen-cognitie": "geheugen & denken (dementie, NAH)",
    "lichamelijk": "lichamelijke zorg (hartfalen, COPD, diabetes)",
    "psychisch-emotioneel": "psychisch & emotioneel",
    "beperking-begeleiding": "beperking & begeleiding",
    "ouder-worden": "ouder worden",
    "ernstig-ziek": "ernstig of langdurig ziek (kanker, palliatief)",
  }

  // Zoek zorgthema in voorkeuren OF in legacy aandoening veld
  const profielZorgthemas = voorkeuren
    .filter((v) => v.type === "TAG" && zorgthemaSlugs.includes(v.slug))
    .map((v) => zorgthemaNamen[v.slug] || v.slug)

  if (profielZorgthemas.length > 0) {
    block += `\n- Zorgsituatie naaste: ${profielZorgthemas.join(", ")}`
  } else if (aandoening) {
    block += `\n- Zorgsituatie naaste: ${zorgthemaNamen[aandoening] || aandoening}`
  }

  // Situatie-tags (wie is deze mantelzorger?)
  const situatieTags = voorkeuren
    .filter((v) => v.type === "TAG" && !zorgthemaSlugs.includes(v.slug))
    .map((v) => v.slug.replace(/-/g, " "))
  if (situatieTags.length > 0) {
    block += `\n- Situatie: ${situatieTags.join(", ")}`
  }

  // Leesinteresses
  const catVoorkeuren = voorkeuren.filter((v) => v.type === "CATEGORIE")
  if (catVoorkeuren.length > 0) {
    block += `\n- Leesinteresses: ${catVoorkeuren.map((v) => v.slug.replace(/-/g, " ")).join(", ")}`
  }

  block += `\nGebruik deze context om je antwoorden af te stemmen op de specifieke situatie van deze mantelzorger.`
  return block
}

function buildMantelzorgerHulpBlock(
  hulp: MantelzorgerHulpItem[],
  gemMantelzorger: string | null,
  gemZorgvrager: string | null,
): string {
  if (!hulp || hulp.length === 0) return ""

  // Groepeer per scope-label zodat Ger meteen ziet welke hulpbron in welke
  // stad geldt — geen verwarring meer over waar de gebruiker heen kan.
  const lokaal = hulp.filter((h) => h.scope === "lokaal")
  const beide = hulp.filter((h) => h.scope === "beide")
  const landelijk = hulp.filter((h) => h.scope === "landelijk")

  let block = `\n\n=== HULP VOOR JOU (mantelzorger) ===
Dit zijn organisaties die JOU als mantelzorger ondersteunen. Kopieer de
{{hulpkaart:...}} regels letterlijk wanneer je ze toont.`

  if (lokaal.length > 0) {
    const stadLabel = gemMantelzorger ? ` (alleen in ${gemMantelzorger} — jouw stad)` : ""
    block += `\n\n  Lotgenoten / praatgroepen / fysieke ontmoeting${stadLabel}:`
    for (const b of lokaal) {
      block += `\n  ${formatHulpkaart(b)}`
    }
  }

  if (beide.length > 0) {
    const stadLabel =
      gemMantelzorger && gemZorgvrager && gemMantelzorger !== gemZorgvrager
        ? ` (in zowel ${gemMantelzorger} als ${gemZorgvrager} — beide steden hebben hier vaak iets te bieden)`
        : ""
    block += `\n\n  Mantelzorgmakelaar / respijtzorg / advies / educatie / emotionele steun${stadLabel}:`
    for (const b of beide) {
      block += `\n  ${formatHulpkaart(b)}`
    }
  }

  if (landelijk.length > 0) {
    block += `\n\n  Landelijke organisaties (geen plaats — bereikbaar voor iedereen):`
    for (const b of landelijk) {
      block += `\n  ${formatHulpkaart(b)}`
    }
  }

  return block
}

/**
 * Bouwt een blok met de laatste gespreks-samenvattingen zodat Ger kan
 * refereren aan eerdere gesprekken zonder de hele berichtenhistorie te
 * hoeven lezen.
 */
function buildEerdereGesprekkenBlock(
  gesprekken: { samenvatting: string; onderwerpen: string[]; actiepuntenAangemaakt: number; createdAt: Date }[],
): string {
  if (!gesprekken || gesprekken.length === 0) return ""

  let block = `\n\n=== EERDERE GESPREKKEN MET DEZE MANTELZORGER ===
Hier zijn de laatste ${gesprekken.length} gesprekken die we eerder hadden,
nieuwste eerst. Refereer er natuurlijk aan ("vorige keer hadden we het over X")
zonder ze letterlijk te citeren of een opsomming te geven.`

  for (const g of gesprekken) {
    const datum = g.createdAt
      ? new Date(g.createdAt).toLocaleDateString("nl-NL", { day: "numeric", month: "long" })
      : ""
    const onderwerpen = g.onderwerpen?.length ? ` [onderwerpen: ${g.onderwerpen.join(", ")}]` : ""
    block += `\n\n- ${datum}${onderwerpen}\n  ${g.samenvatting}`
  }

  return block
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildActiepuntenBlock(actiepunten: any[]): string {
  if (!actiepunten || actiepunten.length === 0) return ""

  let block = `\n\nOPENSTAANDE ACTIEPUNTEN (uit vorige gesprekken):
Begin het gesprek met opvolging! Vraag: "Vorige keer spraken we over [actie]. Is dat gelukt?"`
  for (const a of actiepunten) {
    const datum = a.createdAt
      ? new Date(a.createdAt).toLocaleDateString("nl-NL", { day: "numeric", month: "long" })
      : ""
    block += `\n- ${a.title}${a.description ? ` (${a.description})` : ""}${datum ? ` — ${datum}` : ""}`
  }
  return block
}

function buildWeekKaartenBlock(weekKaarten: { type: string; titel: string; isVoltooid: boolean }[]): string {
  if (!weekKaarten || weekKaarten.length === 0) return ""

  const voltooid = weekKaarten.filter((k) => k.isVoltooid).length
  let block = `\n\nWEEKKAARTEN (${voltooid}/${weekKaarten.length} voltooid deze week):`
  if (voltooid > 0) {
    block += `\nComplimenteer de gebruiker met voltooide kaarten!`
  }
  for (const k of weekKaarten) {
    block += `\n- ${k.isVoltooid ? "[VOLTOOID]" : "[OPEN]"} ${k.type}: ${k.titel}`
  }
  if (weekKaarten.some((k) => !k.isVoltooid)) {
    block += `\nVraag proactief naar de openstaande kaarten: "Heb je al kans gezien om [titel] te doen?"`
  }
  return block
}

function buildExterneHulpBlock(externeHulp: { naam: string; beschrijving?: string | null; telefoon?: string | null; website?: string | null }[]): string {
  if (!externeHulp || externeHulp.length === 0) return ""

  let block = `\n\nEXTERNE HULP DIE DEZE GEBRUIKER AL ONTVANGT:
Pas je advies hierop aan — deze mantelzorger is NIET nieuw in het zoeken van hulp.`
  for (const h of externeHulp) {
    block += `\n- ${h.naam}${h.beschrijving ? `: ${h.beschrijving}` : ""}`
  }
  return block
}

function buildGemeenteContactBlock(gc: { naam: string; telefoon: string | null; email: string | null; website: string | null; beschrijving: string | null; gemeente: string }): string {
  const dienstNaam = `Mantelzorgloket ${gc.gemeente}`
  const beschrijvingTekst = gc.beschrijving || ""
  let block = `\n\nGEMEENTE HULPVERLENER — kopieer letterlijk:`
  block += `\n  {{hulpkaart:${gc.naam}|${dienstNaam}|${beschrijvingTekst}|${gc.telefoon || ""}|${gc.website || ""}|${gc.gemeente || ""}||}}`
  if (gc.email) block += `\n  Email: ${gc.email}`
  return block
}
