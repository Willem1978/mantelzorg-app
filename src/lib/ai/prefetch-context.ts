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
import { ZORGTAKEN, TAAK_NAAM_VARIANTEN } from "@/config/options"

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
export async function prefetchUserContext(
  userId: string,
  gemeenteMantelzorger: string | null,
  gemeenteZorgvrager?: string | null,
) {
  // Fallback: als alleen één gemeente wordt meegegeven (backwards compatibility)
  const gemZorgvrager = gemeenteZorgvrager ?? gemeenteMantelzorger

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
    const alleHulp = await fetchAlleHulpbronnenPerCategorie(gemZorgvrager)
    const mantelzorgerHulp = await fetchMantelzorgerHulp(gemeenteMantelzorger)
    // Haal gemeente contact op (zonder niveau — gebruik GEMIDDELD als default)
    const gemeenteVoorContact = gemZorgvrager || gemeenteMantelzorger
    const gemeenteContact = gemeenteVoorContact
      ? await resolveGemeenteContact(gemeenteVoorContact, "GEMIDDELD")
      : null
    return {
      heeftTest: false as const,
      alleHulpPerCategorie: alleHulp,
      hulpVoorMantelzorger: mantelzorgerHulp,
      gemeenteContact,
      aandoening: caregiver?.aandoening || null,
      voorkeuren: caregiver?.voorkeuren || [],
      actiepunten,
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

  // 5) Zware taken
  const zwareTaken = test.taakSelecties.filter(
    (t) => t.moeilijkheid === "MOEILIJK" || t.moeilijkheid === "ZEER_MOEILIJK"
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

  const taakQueries = zwareTaken.slice(0, 5).map(async (taak) => {
    const varianten = getOnderdeelVarianten(taak.taakNaam)

    const resultaten = await prisma.zorgorganisatie.findMany({
      where: {
        isActief: true,
        onderdeelTest: { in: varianten },
        OR: gemeenteFilter,
        AND: niveauFilter,
      },
      take: 5,
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
      },
    })

    return { taakNaam: taak.taakNaam, resultaten }
  })

  const taakResultaten = await Promise.all(taakQueries)
  for (const { taakNaam, resultaten } of taakResultaten) {
    if (resultaten.length > 0) {
      hulpVoorNaaste[taakNaam] = resultaten
    }
  }

  // 7) Hulpbronnen voor de mantelzorger zelf — gemeente MANTELZORGER (daar woont de mantelzorger)
  const hulpVoorMantelzorger = await fetchMantelzorgerHulp(gemeenteMantelzorger)

  // 8) Alle hulpbronnen per categorie — gemeente ZORGVRAGER (zorgtaken vinden daar plaats)
  const alleHulpPerCategorie = await fetchAlleHulpbronnenPerCategorie(gemZorgvrager)

  // Bouw het resultaat
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
async function fetchAlleHulpbronnenPerCategorie(gemeente: string | null) {
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
    },
  })

  // Groepeer per categorie — gebruik dezelfde ZORGTAKEN mapping
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const perCategorie: Record<string, any[]> = {}

  for (const zorgtaak of ZORGTAKEN) {
    const varianten = getOnderdeelVarianten(zorgtaak.dbValue)
    const matches = alle.filter((h) => h.onderdeelTest && varianten.includes(h.onderdeelTest))
    if (matches.length > 0) {
      perCategorie[zorgtaak.naam] = matches.slice(0, 5).map((h) => ({
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
        lokaal: !!h.gemeente,
      }))
    }
  }

  return perCategorie
}

/**
 * Haalt hulpbronnen op die specifiek voor de mantelzorger zijn (doelgroep=MANTELZORGER).
 */
async function fetchMantelzorgerHulp(gemeente: string | null) {
  if (!gemeente) return []

  return prisma.zorgorganisatie.findMany({
    where: {
      isActief: true,
      gemeente: { equals: gemeente, mode: "insensitive" as const },
      doelgroep: "MANTELZORGER",
    },
    take: 8,
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
    },
  })
}

/**
 * Bouwt een context-blok dat als injectie in het systeem-prompt kan worden gebruikt.
 */
export function buildContextBlock(ctx: Awaited<ReturnType<typeof prefetchUserContext>>): string {
  // Voorkeurenblok (voor beide paden)
  const voorkeurenBlock = buildVoorkeurenBlock(ctx.aandoening, ctx.voorkeuren)

  // Actiepunten blok (voor beide paden)
  const actiepuntenBlock = buildActiepuntenBlock(ctx.actiepunten)
  // Externe hulp blok (voor beide paden)
  const externeHulpBlock = buildExterneHulpBlock(ctx.externeHulp)

  if (!ctx.heeftTest) {
    let block = `\n\n--- GEBRUIKERSCONTEXT ---
Deze gebruiker heeft nog GEEN balanstest gedaan. Moedig aan om de test te doen via /belastbaarheidstest (duurt 5 minuten).`

    block += voorkeurenBlock
    block += actiepuntenBlock
    block += externeHulpBlock
    // Toch hulpbronnen tonen als die er zijn
    block += buildHulpPerCategorieBlock(ctx.alleHulpPerCategorie)
    block += buildMantelzorgerHulpBlock(ctx.hulpVoorMantelzorger)
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
  block += actiepuntenBlock
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

  // Hulp per zware taak
  const hulpNaaste = Object.entries(ctx.hulpVoorNaaste)
  if (hulpNaaste.length > 0) {
    block += `\n\nHULP BIJ ZWARE ZORGTAKEN — kopieer de {{hulpkaart:...}} regels letterlijk als je ze wilt tonen:`
    for (const [taak, bronnen] of hulpNaaste) {
      block += `\n\n  ${taak}:`
      for (const b of bronnen) {
        block += `\n  ${formatHulpkaart(b)}`
      }
    }
  }

  // Alle hulp per categorie (ook niet-zware taken)
  block += buildHulpPerCategorieBlock(ctx.alleHulpPerCategorie)

  // Hulp voor mantelzorger
  block += buildMantelzorgerHulpBlock(ctx.hulpVoorMantelzorger)

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
function buildHulpPerCategorieBlock(perCategorie: Record<string, any[]>): string {
  const entries = Object.entries(perCategorie)
  if (entries.length === 0) return ""

  let block = `\n\nALLE HULP PER CATEGORIE — kopieer de {{hulpkaart:...}} regels letterlijk als je ze wilt tonen:`
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

  let block = `\n\nGEBRUIKERSVOORKEUREN:`
  if (aandoening) {
    block += `\n- Aandoening naaste: ${aandoening}`
  }
  const tagVoorkeuren = voorkeuren.filter((v) => v.type === "TAG")
  const catVoorkeuren = voorkeuren.filter((v) => v.type === "CATEGORIE")
  if (tagVoorkeuren.length > 0) {
    block += `\n- Interessegebieden: ${tagVoorkeuren.map((v) => v.slug).join(", ")}`
  }
  if (catVoorkeuren.length > 0) {
    block += `\n- Favoriete categorieën: ${catVoorkeuren.map((v) => v.slug).join(", ")}`
  }
  block += `\nStem je antwoorden af op deze voorkeuren wanneer relevant.`
  return block
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildMantelzorgerHulpBlock(hulp: any[]): string {
  if (!hulp || hulp.length === 0) return ""

  let block = `\n\nHULP VOOR JOU (mantelzorger) — kopieer de {{hulpkaart:...}} regels letterlijk:`
  for (const b of hulp) {
    block += `\n  ${formatHulpkaart(b)}`
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
  const dienst = gc.beschrijving || `Hulpverlener gemeente ${gc.gemeente}`
  let block = `\n\nGEMEENTE HULPVERLENER — kopieer letterlijk:`
  block += `\n  {{hulpkaart:${gc.naam}|${dienst}||${gc.telefoon || ""}|${gc.website || ""}|${gc.gemeente || ""}||}}`
  if (gc.email) block += `\n  Email: ${gc.email}`
  return block
}
