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
    tags.push("werkend", "werkend-parttime")
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

  // Relatie met naaste → relatie-tags
  if (profiel.careRecipient === "partner") {
    tags.push("partner-zorg")
  }
  if (profiel.careRecipient === "ouder") {
    tags.push("ouder-zorg")
  }
  if (profiel.careRecipient === "kind") {
    tags.push("kind-zorg")
  }

  // Zorgintensiteit
  if (profiel.careHoursPerWeek && profiel.careHoursPerWeek >= 20) {
    tags.push("intensief")
  }

  // Zorgduur
  if (profiel.careSince) {
    const since = profiel.careSince instanceof Date ? profiel.careSince : new Date(profiel.careSince)
    const jarenBezig = (Date.now() - since.getTime()) / (1000 * 60 * 60 * 24 * 365.25)
    if (jarenBezig < 1) tags.push("beginnend")
    if (jarenBezig > 5) tags.push("langdurig")
  }

  // Leeftijd
  if (profiel.dateOfBirth) {
    const dob = profiel.dateOfBirth instanceof Date ? profiel.dateOfBirth : new Date(profiel.dateOfBirth)
    const leeftijd = (Date.now() - dob.getTime()) / (1000 * 60 * 60 * 24 * 365.25)
    if (leeftijd < 25) tags.push("jong")
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
  "werkend-parttime",
  "student",
  "gepensioneerd",
  "samenwonend",
  "dichtbij",
  "op-afstand",
  "partner-zorg",
  "ouder-zorg",
  "kind-zorg",
  "intensief",
  "beginnend",
  "langdurig",
  "jong",
] as const

/**
 * Tags die alleen handmatig gekozen kunnen worden (niet afleidbaar uit profieldata).
 */
export const HANDMATIGE_TAG_SLUGS = [
  "met-kinderen",
  "meerdere-zorgvragers",
  "alleenstaand",
  "rouwverwerking",
] as const
