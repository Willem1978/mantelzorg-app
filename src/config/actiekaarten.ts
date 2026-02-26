/**
 * Actiekaarten configuratie.
 *
 * De aanbevelingsmatrix koppelt:
 *   belastingniveau × zwaarte van zorgtaak → concrete actiekaart(en)
 *
 * Elke actiekaart bevat een titel, korte tekst (B1-niveau),
 * een link naar de juiste plek in de app, en een prioriteit.
 *
 * Impact-score = uren × zwaarte (1-3), hoe hoger hoe urgenter.
 */

import type { BelastingNiveau } from "./options"

// ============================================
// TYPES
// ============================================

export type ActieType =
  | "hulp-zoeken"       // Zoek hulp bij deze taak
  | "buddy-vragen"      // Vraag een MantelBuddy
  | "respijt"           // Respijtzorg regelen
  | "gemeente"          // Neem contact op met gemeente
  | "zelfzorg"          // Doe iets voor jezelf
  | "check-in"          // Doe een check-in
  | "verdeel"           // Verdeel de taak
  | "informatie"        // Lees meer informatie
  | "marktplaats"       // Ga naar de marktplaats

export type Urgentie = "direct" | "binnenkort" | "op-termijn"

export interface Actiekaart {
  id: string
  type: ActieType
  titel: string
  tekst: string
  emoji: string
  urgentie: Urgentie
  link: string
  linkTekst: string
}

export interface ImpactTaak {
  taakId: string
  taakNaam: string
  emoji: string
  zwaarte: 1 | 2 | 3          // 1=goed, 2=matig, 3=zwaar
  urenPerWeek: number
  impactScore: number          // uren × zwaarte
}

// ============================================
// ZWAARTE MAPPING
// ============================================

/** Vertaal test-moeilijkheid naar numerieke zwaarte */
export const ZWAARTE_MAP: Record<string, 1 | 2 | 3> = {
  NEE: 1,      // Goed
  SOMS: 2,     // Matig
  JA: 3,       // Zwaar
  nee: 1,
  soms: 2,
  ja: 3,
  goed: 1,
  matig: 2,
  zwaar: 3,
}

// ============================================
// IMPACT BEREKENING
// ============================================

/**
 * Bereken impact-score voor een zorgtaak.
 * Impact = uren per week × zwaarte (1-3).
 * Bereik: 0 – 90 (30u × 3).
 */
export function berekenImpact(urenPerWeek: number, zwaarte: 1 | 2 | 3): number {
  return Math.round(urenPerWeek * zwaarte * 10) / 10
}

/**
 * Sorteer taken op impact (hoogste eerst).
 */
export function sorteerOpImpact(taken: ImpactTaak[]): ImpactTaak[] {
  return [...taken].sort((a, b) => b.impactScore - a.impactScore)
}

// ============================================
// ACTIEKAARTEN MATRIX
// ============================================

/**
 * Genereer actiekaarten voor een specifieke taak op basis van
 * het totale belastingniveau en de zwaarte van de taak.
 */
function kaartenVoorTaak(
  taak: ImpactTaak,
  belasting: BelastingNiveau
): Actiekaart[] {
  const kaarten: Actiekaart[] = []
  const { taakId, taakNaam, zwaarte } = taak

  // === HOOG belastingniveau ===
  if (belasting === "HOOG") {
    if (zwaarte === 3) {
      // Zwaar + Hoog → directe actie
      kaarten.push({
        id: `${taakId}-hulp-direct`,
        type: "hulp-zoeken",
        titel: `Zoek hulp bij ${taakNaam.toLowerCase()}`,
        tekst: `${taakNaam} is zwaar voor je. Zoek iemand die kan helpen. Dat mag. Het is nodig.`,
        emoji: "🆘",
        urgentie: "direct",
        link: `/hulpvragen?tab=voor-naaste&taak=${taakId}`,
        linkTekst: "Zoek hulp",
      })
      kaarten.push({
        id: `${taakId}-buddy`,
        type: "marktplaats",
        titel: `Vraag een MantelBuddy`,
        tekst: `Een vrijwilliger bij jou in de buurt kan helpen met ${taakNaam.toLowerCase()}.`,
        emoji: "🤝",
        urgentie: "direct",
        link: `/marktplaats?taak=${taakId}`,
        linkTekst: "Naar de marktplaats",
      })
    } else if (zwaarte === 2) {
      // Matig + Hoog → binnenkort actie
      kaarten.push({
        id: `${taakId}-verdeel`,
        type: "verdeel",
        titel: `Verdeel ${taakNaam.toLowerCase()}`,
        tekst: `Kun je ${taakNaam.toLowerCase()} delen met iemand? Familie, buren of een vrijwilliger?`,
        emoji: "🔄",
        urgentie: "binnenkort",
        link: `/marktplaats?taak=${taakId}`,
        linkTekst: "Zoek een helper",
      })
    }
    // Bij hoog altijd respijt adviseren
    if (kaarten.length === 0 || zwaarte >= 2) {
      kaarten.push({
        id: `${taakId}-respijt`,
        type: "respijt",
        titel: "Regel vervangende zorg",
        tekst: "Je hebt rust nodig. Vraag bij je gemeente naar respijtzorg of dagopvang.",
        emoji: "🛏️",
        urgentie: "direct",
        link: "/hulpvragen?tab=voor-mij",
        linkTekst: "Zoek respijtzorg",
      })
    }
  }

  // === GEMIDDELD belastingniveau ===
  if (belasting === "GEMIDDELD") {
    if (zwaarte === 3) {
      kaarten.push({
        id: `${taakId}-hulp`,
        type: "hulp-zoeken",
        titel: `Zoek hulp bij ${taakNaam.toLowerCase()}`,
        tekst: `${taakNaam} kost je veel energie. Kijk of iemand kan bijspringen.`,
        emoji: "💪",
        urgentie: "binnenkort",
        link: `/hulpvragen?tab=voor-naaste&taak=${taakId}`,
        linkTekst: "Zoek hulp",
      })
      kaarten.push({
        id: `${taakId}-marktplaats`,
        type: "marktplaats",
        titel: `Vraag hulp via de marktplaats`,
        tekst: `Plaats een hulpvraag voor ${taakNaam.toLowerCase()}. Vrijwilligers kunnen reageren.`,
        emoji: "🤝",
        urgentie: "binnenkort",
        link: `/marktplaats?taak=${taakId}`,
        linkTekst: "Naar de marktplaats",
      })
    } else if (zwaarte === 2) {
      kaarten.push({
        id: `${taakId}-info`,
        type: "informatie",
        titel: `Tips voor ${taakNaam.toLowerCase()}`,
        tekst: `Lees tips om ${taakNaam.toLowerCase()} makkelijker te maken.`,
        emoji: "💡",
        urgentie: "op-termijn",
        link: `/leren?zoek=${encodeURIComponent(taakNaam)}`,
        linkTekst: "Lees tips",
      })
    }
  }

  // === LAAG belastingniveau ===
  if (belasting === "LAAG") {
    if (zwaarte === 3) {
      // Zelfs bij laag totaal: als een taak zwaar is, signaleer het
      kaarten.push({
        id: `${taakId}-hulp-laag`,
        type: "hulp-zoeken",
        titel: `${taakNaam} is zwaar`,
        tekst: `Je balans is goed, maar ${taakNaam.toLowerCase()} valt je zwaar. Het is slim om hiervoor hulp te zoeken.`,
        emoji: "📌",
        urgentie: "op-termijn",
        link: `/marktplaats?taak=${taakId}`,
        linkTekst: "Bekijk opties",
      })
    }
  }

  return kaarten
}

// ============================================
// HOOFDFUNCTIE
// ============================================

export interface ActiekaartResultaat {
  focusKaart: Actiekaart | null       // De #1 meest urgente actie
  overige: Actiekaart[]               // Max 3 extra acties
  takenOpImpact: ImpactTaak[]         // Alle taken gesorteerd op impact
}

/**
 * Genereer persoonlijke actiekaarten op basis van:
 *   - belastingniveau (uit balanstest)
 *   - alle zorgtaken met hun zwaarte en uren
 *
 * Retourneert 1 focus-actie + max 3 extra acties.
 */
export function genereerActiekaarten(
  belasting: BelastingNiveau,
  taken: ImpactTaak[]
): ActiekaartResultaat {
  // Sorteer taken op impact
  const gesorteerd = sorteerOpImpact(taken)

  // Genereer kaarten per taak
  const alleKaarten: Actiekaart[] = []
  for (const taak of gesorteerd) {
    const kaarten = kaartenVoorTaak(taak, belasting)
    alleKaarten.push(...kaarten)
  }

  // Voeg altijd een check-in kaart toe als er geen directe acties zijn
  if (alleKaarten.length === 0) {
    alleKaarten.push({
      id: "check-in-algemeen",
      type: "check-in",
      titel: "Hoe gaat het?",
      tekst: "Doe een korte check-in. Dan weten we hoe het met je gaat.",
      emoji: "✅",
      urgentie: "op-termijn",
      link: "/check-in",
      linkTekst: "Doe de check-in",
    })
  }

  // Voeg zelfzorg toe bij gemiddeld/hoog
  if (belasting !== "LAAG" && alleKaarten.length < 5) {
    alleKaarten.push({
      id: "zelfzorg-reminder",
      type: "zelfzorg",
      titel: "Doe iets voor jezelf",
      tekst: "Plan deze week iets leuks voor jezelf. Een wandeling, een kopje koffie, even rust.",
      emoji: "🧘",
      urgentie: "binnenkort",
      link: "/agenda",
      linkTekst: "Plan in je agenda",
    })
  }

  // Dedupliceer op type (max 1 per type behalve hulp-zoeken en marktplaats)
  const gezien = new Set<string>()
  const uniek: Actiekaart[] = []
  for (const k of alleKaarten) {
    const key = k.type === "hulp-zoeken" || k.type === "marktplaats" ? k.id : k.type
    if (!gezien.has(key)) {
      gezien.add(key)
      uniek.push(k)
    }
  }

  // Sorteer op urgentie
  const urgentieVolgorde: Record<Urgentie, number> = {
    direct: 0,
    binnenkort: 1,
    "op-termijn": 2,
  }
  uniek.sort((a, b) => urgentieVolgorde[a.urgentie] - urgentieVolgorde[b.urgentie])

  return {
    focusKaart: uniek[0] || null,
    overige: uniek.slice(1, 4),
    takenOpImpact: gesorteerd,
  }
}

// ============================================
// CONTENT STRINGS (B1 taalgebruik)
// ============================================

export const actiekaartContent = {
  sectionTitle: "Jouw volgende stap",
  sectionEmoji: "🎯",
  sectionSubtitle: "Dit is het belangrijkste dat je nu kunt doen.",
  meerActies: "Meer acties",
  geenActies: "Geen acties nodig. Je doet het goed!",
  urgentieLabels: {
    direct: "Nu belangrijk",
    binnenkort: "Binnenkort",
    "op-termijn": "Kan later",
  } as Record<Urgentie, string>,
  urgentieKleuren: {
    direct: "bg-accent-red-bg text-accent-red border-accent-red/20",
    binnenkort: "bg-accent-amber-bg text-accent-amber border-accent-amber/20",
    "op-termijn": "bg-accent-green-bg text-accent-green border-accent-green/20",
  } as Record<Urgentie, string>,
} as const

// ============================================
// TAAK-SPECIFIEK ADVIES (per naam, per niveau)
// ============================================

/** Concrete adviesteksten per zorgtaak × belastingniveau */
const TAAK_SPECIFIEK: Record<string, Record<"LAAG" | "GEMIDDELD" | "HOOG", string>> = {
  "Persoonlijke verzorging": {
    LAAG: "Je regelt de verzorging goed. Houd het vol en neem af en toe rust.",
    GEMIDDELD: "Thuiszorg kan helpen bij wassen, aankleden of medicijnen. Vraag je huisarts of gemeente.",
    HOOG: "Dit is te veel om alleen te doen. Vraag een WMO-indicatie aan bij je gemeente voor thuiszorg.",
  },
  "Wassen/aankleden": {
    LAAG: "Je regelt de verzorging goed. Houd het vol.",
    GEMIDDELD: "Thuiszorg kan helpen met persoonlijke verzorging. Vraag bij je gemeente naar een PGB of indicatie.",
    HOOG: "Vraag een WMO-indicatie aan bij je gemeente voor thuiszorg.",
  },
  "Huishoudelijke taken": {
    LAAG: "Het huishouden gaat goed. Wist je dat je gemeente soms huishoudelijke hulp vergoedt?",
    GEMIDDELD: "Hulp bij het huishouden kun je aanvragen via je gemeente (WMO). Er zijn ook particuliere diensten.",
    HOOG: "Vraag huishoudelijke hulp aan via de WMO. Je gemeente kan dit snel regelen.",
  },
  "Huishouden": {
    LAAG: "Het huishouden gaat goed.",
    GEMIDDELD: "Hulp bij het huishouden kun je aanvragen via je gemeente (WMO).",
    HOOG: "Vraag huishoudelijke hulp aan via de WMO.",
  },
  "Bereiden en/of nuttigen van maaltijden": {
    LAAG: "De maaltijden zijn geen probleem. Tip: kook extra en vries porties in.",
    GEMIDDELD: "Tafeltje Dekje of een maaltijdservice kan warme maaltijden bezorgen. Scheelt je tijd en energie.",
    HOOG: "Laat maaltijden bezorgen. Tafeltje Dekje levert warme maaltijden aan huis.",
  },
  "Maaltijden": {
    LAAG: "Tip: kook extra en vries porties in.",
    GEMIDDELD: "Tafeltje Dekje of maaltijdservice kan warme maaltijden bezorgen.",
    HOOG: "Laat maaltijden bezorgen zodat je energie overhoudt voor andere dingen.",
  },
  "Eten maken": {
    LAAG: "Tip: kook extra en vries porties in.",
    GEMIDDELD: "Tafeltje Dekje of maaltijdservice kan warme maaltijden bezorgen.",
    HOOG: "Laat maaltijden bezorgen zodat je energie overhoudt.",
  },
  "Boodschappen": {
    LAAG: "De boodschappen lopen soepel. Tip: online bestellen bespaart tijd.",
    GEMIDDELD: "Online boodschappen bestellen scheelt een rit. Of vraag een vrijwilliger om te helpen.",
    HOOG: "Besteed boodschappen uit. Bestel online of vraag via de marktplaats een vrijwilliger.",
  },
  "Administratie en aanvragen": {
    LAAG: "De administratie loopt. Tip: bewaar belangrijke papieren op één plek.",
    GEMIDDELD: "MEE of het sociaal wijkteam kan helpen met formulieren en aanvragen. Dat is gratis.",
    HOOG: "Laat je helpen met formulieren en aanvragen. MEE of het wijkteam kan bijspringen.",
  },
  "Administratie": {
    LAAG: "Bewaar belangrijke papieren op één plek.",
    GEMIDDELD: "MEE of het sociaal wijkteam kan helpen met administratie en formulieren.",
    HOOG: "Laat je helpen met formulieren. MEE of het wijkteam kan bijspringen.",
  },
  "Vervoer": {
    LAAG: "Het vervoer is geen probleem. Goed dat je dat regelt!",
    GEMIDDELD: "Regiotaxi of vrijwillige vervoersdiensten kunnen helpen. Vraag bij je gemeente.",
    HOOG: "Regiotaxi, vrijwillig vervoer of WMO-vervoer kan je ontlasten.",
  },
  "Vervoer/begeleiding": {
    LAAG: "Het vervoer gaat goed.",
    GEMIDDELD: "Regiotaxi of vrijwillige vervoersdiensten kunnen helpen.",
    HOOG: "Regiotaxi of WMO-vervoer kan je ontlasten.",
  },
  "Sociaal contact en activiteiten": {
    LAAG: "Sociaal contact is belangrijk, voor jou en je naaste. Blijf dit doen!",
    GEMIDDELD: "Dagbesteding of een maatje-project kan sociaal contact bieden aan je naaste.",
    HOOG: "Dagbesteding geeft je naaste sociaal contact en jou rust. Vraag ernaar bij je gemeente.",
  },
  "Sociaal contact": {
    LAAG: "Sociaal contact is belangrijk. Blijf dit doen!",
    GEMIDDELD: "Dagbesteding of een maatje-project kan sociaal contact bieden aan je naaste.",
    HOOG: "Dagbesteding geeft je naaste sociaal contact en jou rust.",
  },
  "Klusjes in en om het huis": {
    LAAG: "De klusjes gaan goed. Tip: voor grotere klussen kun je de gemeente vragen.",
    GEMIDDELD: "Gemeente of woningcorporatie heeft vaak een klussendienst. Vrijwilligers kunnen ook helpen.",
    HOOG: "Laat klusjes over aan anderen. Via de marktplaats of klussendienst van je gemeente.",
  },
  "Klusjes": {
    LAAG: "Voor grotere klussen kun je de gemeente vragen.",
    GEMIDDELD: "Gemeente of woningcorporatie heeft vaak een klussendienst.",
    HOOG: "Laat klusjes over aan anderen.",
  },
  "Plannen en organiseren": {
    LAAG: "Je hebt het plannen onder controle. Gebruik de agenda om overzicht te houden.",
    GEMIDDELD: "Plan je zorgtaken in de agenda. Zo houd je overzicht en kun je beter verdelen.",
    HOOG: "Een casemanager of het wijkteam kan helpen met het plannen en organiseren van zorg.",
  },
  "Huisdieren": {
    LAAG: "De huisdieren zijn goed verzorgd. Fijn dat dat lukt!",
    GEMIDDELD: "Een buur of vrijwilliger kan helpen met uitlaten of voeren.",
    HOOG: "Dierenopvang of een buurthulp kan tijdelijk de zorg voor huisdieren overnemen.",
  },
}

const DEFAULT_ADVIES: Record<"LAAG" | "GEMIDDELD" | "HOOG", string> = {
  LAAG: "Dit gaat goed. Houd het zo vol!",
  GEMIDDELD: "Er is hulp beschikbaar voor deze taak. Bekijk welke opties er zijn in jouw buurt.",
  HOOG: "Zoek hulp bij deze taak. Je hoeft het niet alleen te doen.",
}

/**
 * Haal het advies-tekst op voor een specifieke taak × belastingniveau.
 * Werkt met alle varianten van taaknamen (web test, WhatsApp, database).
 */
export function getTaakAdviesTekst(
  taakNaam: string,
  niveau: "LAAG" | "GEMIDDELD" | "HOOG" = "GEMIDDELD"
): string {
  const specifiek = TAAK_SPECIFIEK[taakNaam]
  if (specifiek) return specifiek[niveau]
  return DEFAULT_ADVIES[niveau]
}
