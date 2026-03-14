/**
 * Genereert 3 wekelijkse hulpkaarten per mantelzorger:
 * - ZELFZORG (groen): tips om goed voor jezelf te zorgen
 * - PRAKTISCH (blauw): concrete hulpacties met lokale organisaties
 * - LEREN (paars): relevante artikelen en kennis
 *
 * Personalisatie op basis van:
 * - Belastingscore + niveau
 * - Zware zorgtaken
 * - Check-in trend
 * - Eerder voltooide kaarten (geen herhaling)
 * - Beschikbare gemeente-hulpbronnen
 * - Gelezen artikelen (voorkeuren)
 */
import { prisma } from "@/lib/prisma"

/** ISO weeknummer: "2026-W11" */
export function getISOWeekNummer(date: Date = new Date()): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7))
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`
}

interface CaregiverContext {
  caregiverId: string
  niveau: "LAAG" | "GEMIDDELD" | "HOOG" | null
  zwareTaken: { taakNaam: string; urenPerWeek: number | null; moeilijkheid: string | null }[]
  totaleZorguren: number | null
  gemeente: string | null
  aandoening: string | null
  voorkeuren: { type: string; slug: string }[]
}

// Zelfzorg tips per niveau
const ZELFZORG_TIPS: Record<string, { titel: string; beschrijving: string; emoji: string }[]> = {
  HOOG: [
    { titel: "Plan een vrij dagdeel", beschrijving: "Vraag iemand om de zorg over te nemen en plan een half dagje voor jezelf. Je hoeft niet weg — een rustige ochtend thuis telt ook.", emoji: "🌿" },
    { titel: "Bel de Mantelzorglijn", beschrijving: "Even je verhaal kwijt? De Mantelzorglijn luistert zonder oordeel. Bel 030-164 0 164 (ma-vr 9-18).", emoji: "📞" },
    { titel: "Slaap is medicijn", beschrijving: "Probeer deze week elke avond 30 minuten eerder naar bed te gaan. Slaaptekort maakt alles zwaarder.", emoji: "😴" },
    { titel: "Schrijf 3 dingen op", beschrijving: "Schrijf elke ochtend 3 dingen op die goed gaan. Het helpt om het positieve te blijven zien.", emoji: "📝" },
    { titel: "Beweeg 15 minuten", beschrijving: "Een korte wandeling, yoga of stretchen. Beweging verlaagt stress en geeft energie.", emoji: "🚶" },
    { titel: "Zeg nee tegen iets", beschrijving: "Kies deze week bewust één ding waar je nee tegen zegt. Grenzen stellen is geen egoïsme.", emoji: "🛑" },
  ],
  GEMIDDELD: [
    { titel: "Plan wekelijks 'ik-tijd'", beschrijving: "Blokkeer een vast moment in de week dat alleen voor jou is. Maak er een gewoonte van.", emoji: "📅" },
    { titel: "Praat erover", beschrijving: "Deel hoe het gaat met een vriend, familielid of lotgenoot. Je hoeft het niet alleen te doen.", emoji: "💬" },
    { titel: "Doe iets leuks", beschrijving: "Plan deze week een activiteit die je energie geeft. Een hobby, een wandeling, of een kopje koffie met een vriend.", emoji: "☀️" },
    { titel: "Check je energie", beschrijving: "Houd bij wanneer je moe wordt. Misschien kun je de zwaarste taken op je beste moment plannen.", emoji: "⚡" },
  ],
  LAAG: [
    { titel: "Blijf in balans", beschrijving: "Je doet het goed! Houd je vaste rustmomenten aan — ook als het goed gaat.", emoji: "⚖️" },
    { titel: "Inspireer een ander", beschrijving: "Deel jouw ervaring met een andere mantelzorger. Jouw tips kunnen iemand enorm helpen.", emoji: "💡" },
    { titel: "Vier het kleine", beschrijving: "Neem een moment om stil te staan bij wat goed gaat. Je verdient die erkenning.", emoji: "🎉" },
  ],
}

// Praktische fallback tips per zware taak
const PRAKTISCH_PER_TAAK: Record<string, { titel: string; beschrijving: string; emoji: string }> = {
  "Persoonlijke verzorging": { titel: "Vraag thuiszorg aan", beschrijving: "Thuiszorg kan helpen bij wassen, aankleden en medicijnen. Vraag je huisarts of het WMO-loket naar de mogelijkheden.", emoji: "🏥" },
  "Huishoudelijke taken": { titel: "Vraag huishoudelijke hulp aan", beschrijving: "Via de WMO kun je huishoudelijke hulp aanvragen. Bel het WMO-loket van je gemeente.", emoji: "🧹" },
  "Boodschappen": { titel: "Laat boodschappen bezorgen", beschrijving: "Online boodschappen bestellen bespaart tijd en energie. Of vraag een vrijwilliger via het steunpunt.", emoji: "🛒" },
  "Vervoer": { titel: "Bekijk vervoersopties", beschrijving: "Regiotaxi, Valys of vrijwillige vervoersdiensten — er zijn meer opties dan je denkt.", emoji: "🚗" },
  "Administratie en aanvragen": { titel: "Zoek hulp bij formulieren", beschrijving: "Veel steunpunten helpen gratis met formulieren en aanvragen. Je hoeft het niet alleen uit te zoeken.", emoji: "📋" },
  "Maaltijden": { titel: "Ontdek maaltijdservice", beschrijving: "Tafeltje Dekje of andere maaltijdservices brengen warme maaltijden aan huis.", emoji: "🍽️" },
  "Sociaal contact en activiteiten": { titel: "Zoek dagbesteding", beschrijving: "Dagbesteding biedt je naaste activiteiten en gezelschap — en jou een adempauze.", emoji: "🎨" },
  "Plannen en organiseren": { titel: "Vraag een casemanager", beschrijving: "Een casemanager helpt met het coördineren van alle zorg. Vraag je huisarts of het sociaal wijkteam.", emoji: "📅" },
  "Klusjes in en om het huis": { titel: "Zoek een klussenservice", beschrijving: "Veel gemeenten hebben vrijwillige klussendiensten voor kleine reparaties en tuinonderhoud.", emoji: "🔧" },
  "Huisdieren": { titel: "Regel oppas voor huisdieren", beschrijving: "De Dierenbescherming of lokale vrijwilligers kunnen tijdelijk je huisdier opvangen.", emoji: "🐾" },
}

// Leren tips per situatie
const LEREN_TIPS: { titel: string; beschrijving: string; emoji: string; categorie?: string }[] = [
  { titel: "Lees over je rechten", beschrijving: "Als mantelzorger heb je recht op ondersteuning. Lees welke regelingen er zijn.", emoji: "⚖️", categorie: "rechten-regelingen" },
  { titel: "Ontdek respijtzorg", beschrijving: "Respijtzorg is vervangende zorg zodat jij even op adem kunt komen. Lees hoe je dit aanvraagt.", emoji: "🏡", categorie: "praktische-tips" },
  { titel: "Tips voor betere slaap", beschrijving: "Slaapproblemen zijn veel voorkomend bij mantelzorgers. Lees praktische tips.", emoji: "🌙", categorie: "zelfzorg-balans" },
  { titel: "Omgaan met schuldgevoel", beschrijving: "Schuldgevoel hoort erbij maar mag niet de overhand krijgen. Lees hoe andere mantelzorgers hiermee omgaan.", emoji: "💭", categorie: "zelfzorg-balans" },
  { titel: "Financiële regelingen", beschrijving: "Er zijn financiële tegemoetkomingen voor mantelzorgers. Bekijk waar je recht op hebt.", emoji: "💰", categorie: "geld-financien" },
  { titel: "Hulpmiddelen in huis", beschrijving: "Van tilliften tot douchestoelen — hulpmiddelen maken het leven makkelijker.", emoji: "🔧", categorie: "hulpmiddelen-technologie" },
  { titel: "Werk en mantelzorg combineren", beschrijving: "Lees over je rechten op het werk en hoe je het gesprek aangaat met je werkgever.", emoji: "💼", categorie: "werk-mantelzorg" },
  { titel: "Steun van je netwerk", beschrijving: "Hoe vraag je hulp aan mensen om je heen? Tips om je netwerk in te schakelen.", emoji: "🤝", categorie: "samenwerken-netwerk" },
]

/**
 * Genereert 3 weekkaarten voor één mantelzorger.
 * Slaat bestaande kaarten NIET over (uniek per caregiver + week + type).
 */
export async function genereerWeekKaarten(ctx: CaregiverContext): Promise<number> {
  const weekNummer = getISOWeekNummer()

  // Check of er al kaarten zijn voor deze week
  const bestaande = await prisma.weekKaart.count({
    where: { caregiverId: ctx.caregiverId, weekNummer },
  })
  if (bestaande >= 3) return 0

  // Haal eerder voltooide kaarten op (geen herhaling)
  const vorigeKaarten = await prisma.weekKaart.findMany({
    where: { caregiverId: ctx.caregiverId },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: { titel: true },
  })
  const gebruikteTitels = new Set(vorigeKaarten.map((k) => k.titel))

  const niveau = ctx.niveau || "GEMIDDELD"
  const kaarten: { type: "ZELFZORG" | "PRAKTISCH" | "LEREN"; titel: string; beschrijving: string; emoji: string; linkUrl?: string; linkLabel?: string }[] = []

  // 1. ZELFZORG kaart
  const zelfzorgOpties = ZELFZORG_TIPS[niveau] || ZELFZORG_TIPS.GEMIDDELD
  const zelfzorg = zelfzorgOpties.find((t) => !gebruikteTitels.has(t.titel)) || zelfzorgOpties[0]
  kaarten.push({ type: "ZELFZORG", ...zelfzorg })

  // 2. PRAKTISCH kaart — gebaseerd op zwaarste taak + lokale hulpbronnen
  const praktisch = await genereerPraktischKaart(ctx, gebruikteTitels)
  kaarten.push(praktisch)

  // 3. LEREN kaart — gebaseerd op voorkeuren + relevante artikelen
  const leren = await genereerLerenKaart(ctx, gebruikteTitels)
  kaarten.push(leren)

  // Bewaar in database (skip als al bestaat via upsert)
  let aangemaakt = 0
  for (const kaart of kaarten) {
    try {
      await prisma.weekKaart.upsert({
        where: {
          caregiverId_weekNummer_type: {
            caregiverId: ctx.caregiverId,
            weekNummer,
            type: kaart.type,
          },
        },
        create: {
          caregiverId: ctx.caregiverId,
          weekNummer,
          type: kaart.type,
          titel: kaart.titel,
          beschrijving: kaart.beschrijving,
          emoji: kaart.emoji,
          linkUrl: kaart.linkUrl || null,
          linkLabel: kaart.linkLabel || null,
          bron: "REGEL",
        },
        update: {}, // Als al bestaat, niets doen
      })
      aangemaakt++
    } catch {
      // Constraint violation — kaart bestaat al, skip
    }
  }

  return aangemaakt
}

async function genereerPraktischKaart(
  ctx: CaregiverContext,
  gebruikteTitels: Set<string>,
) {
  // Vind zwaarste taak
  const zwaarste = ctx.zwareTaken[0]
  const taakNaam = zwaarste?.taakNaam || "Huishoudelijke taken"

  // Zoek lokale hulpbron
  let linkUrl: string | undefined
  let linkLabel: string | undefined
  let beschrijvingExtra = ""

  if (ctx.gemeente) {
    const hulpbron = await prisma.zorgorganisatie.findFirst({
      where: {
        isActief: true,
        onderdeelTest: taakNaam,
        OR: [
          { gemeente: { equals: ctx.gemeente, mode: "insensitive" } },
          { gemeente: null },
        ],
      },
      orderBy: { naam: "asc" },
      select: { naam: true, telefoon: true, website: true, eersteStap: true },
    })

    if (hulpbron) {
      beschrijvingExtra = hulpbron.eersteStap
        ? ` ${hulpbron.eersteStap}`
        : hulpbron.telefoon
          ? ` Bel ${hulpbron.naam}: ${hulpbron.telefoon}.`
          : ""
      if (hulpbron.website) {
        linkUrl = hulpbron.website
        linkLabel = `Bekijk ${hulpbron.naam}`
      }
    }
  }

  const fallback = PRAKTISCH_PER_TAAK[taakNaam] || PRAKTISCH_PER_TAAK["Huishoudelijke taken"]
  const titel = gebruikteTitels.has(fallback.titel)
    ? `Hulp bij ${taakNaam.toLowerCase()}`
    : fallback.titel

  return {
    type: "PRAKTISCH" as const,
    titel,
    beschrijving: fallback.beschrijving + beschrijvingExtra,
    emoji: fallback.emoji,
    linkUrl,
    linkLabel,
  }
}

async function genereerLerenKaart(
  ctx: CaregiverContext,
  gebruikteTitels: Set<string>,
) {
  // Probeer een relevant artikel te vinden
  const voorkeurCategorieen = ctx.voorkeuren
    .filter((v) => v.type === "CATEGORIE")
    .map((v) => v.slug)

  // Zoek een gepubliceerd artikel dat past bij voorkeuren
  const artikel = await prisma.artikel.findFirst({
    where: {
      status: "GEPUBLICEERD",
      ...(voorkeurCategorieen.length > 0
        ? { categorie: { in: voorkeurCategorieen } }
        : {}),
    },
    orderBy: { publicatieDatum: "desc" },
    select: { id: true, titel: true, categorie: true, emoji: true, beschrijving: true },
  })

  if (artikel && !gebruikteTitels.has(artikel.titel)) {
    return {
      type: "LEREN" as const,
      titel: artikel.titel,
      beschrijving: artikel.beschrijving || `Lees dit artikel over ${artikel.categorie}.`,
      emoji: artikel.emoji || "📖",
      linkUrl: `/leren/${artikel.id}`,
      linkLabel: "Lees artikel",
    }
  }

  // Fallback: vaste leren tips — kies op basis van voorkeur of random
  const relevanteTips = voorkeurCategorieen.length > 0
    ? LEREN_TIPS.filter((t) => t.categorie && voorkeurCategorieen.includes(t.categorie))
    : LEREN_TIPS

  const tips = relevanteTips.length > 0 ? relevanteTips : LEREN_TIPS
  const tip = tips.find((t) => !gebruikteTitels.has(t.titel)) || tips[0]

  return {
    type: "LEREN" as const,
    titel: tip.titel,
    beschrijving: tip.beschrijving,
    emoji: tip.emoji,
    linkUrl: `/leren`,
    linkLabel: "Bekijk artikelen",
  }
}

/**
 * Genereert weekkaarten voor alle actieve mantelzorgers met een test.
 * Bedoeld voor de cron job.
 */
export async function genereerWeekKaartenVoorIedereen(): Promise<{ totaal: number; aangemaakt: number }> {
  const caregivers = await prisma.caregiver.findMany({
    where: {
      user: { isActive: true },
      belastbaarheidTests: { some: { isCompleted: true } },
    },
    select: {
      id: true,
      municipality: true,
      careRecipientMunicipality: true,
      aandoening: true,
      voorkeuren: { select: { type: true, slug: true } },
      belastbaarheidTests: {
        where: { isCompleted: true },
        orderBy: { completedAt: "desc" },
        take: 1,
        select: {
          belastingNiveau: true,
          totaleZorguren: true,
          taakSelecties: {
            where: { isGeselecteerd: true },
            select: { taakNaam: true, urenPerWeek: true, moeilijkheid: true },
            orderBy: { urenPerWeek: "desc" },
          },
        },
      },
    },
  })

  let aangemaakt = 0

  for (const cg of caregivers) {
    const test = cg.belastbaarheidTests[0]
    if (!test) continue

    const zwareTaken = test.taakSelecties.filter(
      (t) => t.moeilijkheid === "MOEILIJK" || t.moeilijkheid === "ZEER_MOEILIJK"
    )

    const count = await genereerWeekKaarten({
      caregiverId: cg.id,
      niveau: test.belastingNiveau,
      zwareTaken,
      totaleZorguren: test.totaleZorguren,
      gemeente: cg.careRecipientMunicipality || cg.municipality,
      aandoening: cg.aandoening,
      voorkeuren: cg.voorkeuren,
    })

    aangemaakt += count
  }

  return { totaal: caregivers.length, aangemaakt }
}
