/**
 * bepaalProfielTags() — Automatische tag-afleiding uit profieldata.
 *
 * Berekent welke situatie-tags automatisch van toepassing zijn op basis van
 * de profielvelden van een mantelzorger. Deze tags worden gecombineerd met
 * handmatig gekozen tags en opgeslagen als GebruikerVoorkeur records.
 */

interface ProfielData {
  werkstatus?: string | null
  woonsituatie?: string | null
  careRecipient?: string | null
  careHoursPerWeek?: number | null
  careSince?: Date | string | null
  dateOfBirth?: Date | string | null
  zorgduur?: string | null // "kort" | "paar-jaar" | "lang"
}

/**
 * Berekent welke tags automatisch afgeleid worden uit profielantwoorden.
 * Geeft een array van tag-slugs terug.
 */
export function bepaalProfielTags(profiel: ProfielData): string[] {
  const tags: string[] = []

  // Werkstatus → werk-tags
  if (profiel.werkstatus === "fulltime") {
    tags.push("werkend")
  }
  if (profiel.werkstatus === "parttime") {
    tags.push("werkend")
  }
  if (profiel.werkstatus === "student") {
    tags.push("student")
  }
  if (profiel.werkstatus === "gepensioneerd") {
    tags.push("gepensioneerd")
  }

  // Woonsituatie → locatie-tags
  if (profiel.woonsituatie === "samen") {
    tags.push("samenwonend")
  }
  if (profiel.woonsituatie === "dichtbij") {
    tags.push("dichtbij")
  }
  if (profiel.woonsituatie === "op-afstand") {
    tags.push("op-afstand")
  }

  // Werkstatus → fulltime-zorger
  if (profiel.werkstatus === "niet-werkend") {
    tags.push("fulltime-zorger")
  }

  // Relatie met naaste → relatie-tags
  if (profiel.careRecipient === "partner") {
    tags.push("partner-zorg")
  } else if (profiel.careRecipient === "ouder") {
    tags.push("ouder-zorg")
  } else if (profiel.careRecipient === "kind") {
    tags.push("kind-zorg")
  } else if (profiel.careRecipient && profiel.careRecipient !== "") {
    // broer_zus, vriend, buur, anders → netwerk-zorg
    tags.push("netwerk-zorg")
  }

  // Zorgduur — via directe keuze (B4 radio buttons) of berekend uit careSince
  if (profiel.zorgduur === "kort") {
    tags.push("beginnend")
  } else if (profiel.zorgduur === "paar-jaar") {
    tags.push("ervaren")
  } else if (profiel.zorgduur === "lang") {
    tags.push("langdurig")
  } else if (profiel.careSince) {
    // Fallback: bereken uit careSince als zorgduur niet expliciet gekozen is
    const since = profiel.careSince instanceof Date ? profiel.careSince : new Date(profiel.careSince)
    const jarenBezig = (Date.now() - since.getTime()) / (1000 * 60 * 60 * 24 * 365.25)
    if (jarenBezig < 1) tags.push("beginnend")
    else if (jarenBezig <= 5) tags.push("ervaren")
    else tags.push("langdurig")
  }

  return [...new Set(tags)] // dedupliceren
}

/**
 * Combineert automatisch afgeleide tags met handmatig gekozen tags.
 * Handmatige tags hebben voorrang (worden niet overschreven).
 */
export function mergeProfielTags(
  automatischeTags: string[],
  handmatigeTags: string[],
): string[] {
  return [...new Set([...automatischeTags, ...handmatigeTags])]
}

/**
 * Alle tags die automatisch afgeleid KAN worden.
 * Wordt gebruikt om in de UI aan te geven welke tags automatisch zijn.
 */
export const AUTOMATISCHE_TAG_SLUGS = [
  "werkend",
  "student",
  "gepensioneerd",
  "fulltime-zorger",
  "samenwonend",
  "dichtbij",
  "op-afstand",
  "partner-zorg",
  "ouder-zorg",
  "kind-zorg",
  "netwerk-zorg",
  "beginnend",
  "ervaren",
  "langdurig",
] as const

/**
 * Tags die alleen handmatig gekozen kunnen worden (niet afleidbaar uit profieldata).
 */
export const HANDMATIGE_TAG_SLUGS = [
  "met-kinderen",
  "meerdere-naasten",
  "alleenstaand",
] as const
