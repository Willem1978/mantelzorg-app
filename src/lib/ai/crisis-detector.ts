/**
 * Crisis Safety Classifier
 *
 * Detecteert crisis-signalen in berichten van mantelzorgers VOORDAT
 * de AI een antwoord genereert. Bij detectie wordt een vast protocol
 * geactiveerd met professionele hulplijnnummers.
 *
 * Doelgroep: emotioneel kwetsbare mantelzorgers.
 * False positives zijn acceptabel — beter te vaak hulp aanbieden dan te weinig.
 */

import { createLogger } from "@/lib/logger"

const log = createLogger("crisis-detector")

// Crisis-woorden en -patronen (Nederlands)
const CRISIS_KEYWORDS = [
  // Zelfmoord / zelfbeschadiging
  "zelfmoord", "suicide", "een einde maken", "einde aan maken",
  "niet meer leven", "niet meer verder", "dood willen",
  "mezelf iets aandoen", "geen zin meer in leven",
  // Extreme uitputting / breakdown
  "ik kan niet meer", "ik kan het niet meer aan",
  "ik ga eraan onderdoor", "ik red het niet meer",
  "ik ben op", "ik breek", "ik stort in",
  // Wanhoop
  "geen uitweg", "hopeloos", "het heeft geen zin",
  "niemand die helpt", "helemaal alleen",
  "ik wil stoppen met alles",
  // Mishandeling / onveiligheid
  "geslagen", "mishandeld", "onveilig",
]

// Combinaties die sterker wijzen op crisis
const CRISIS_COMBINATIONS = [
  ["niet meer", "verder"],
  ["kan niet", "meer"],
  ["wil", "stoppen"],
  ["geen", "uitweg"],
  ["geen", "hoop"],
]

export interface CrisisDetectieResultaat {
  isCrisis: boolean
  niveau: "geen" | "aandacht" | "crisis"
  matchedKeywords: string[]
}

/**
 * Analyseer een bericht op crisis-signalen.
 */
export function detecteerCrisis(bericht: string): CrisisDetectieResultaat {
  const lower = bericht.toLowerCase().trim()
  const matchedKeywords: string[] = []

  // Check exacte keywords
  for (const keyword of CRISIS_KEYWORDS) {
    if (lower.includes(keyword)) {
      matchedKeywords.push(keyword)
    }
  }

  // Check combinaties
  for (const [word1, word2] of CRISIS_COMBINATIONS) {
    if (lower.includes(word1) && lower.includes(word2)) {
      matchedKeywords.push(`${word1}...${word2}`)
    }
  }

  if (matchedKeywords.length === 0) {
    return { isCrisis: false, niveau: "geen", matchedKeywords: [] }
  }

  // Eén match = aandacht, meerdere = crisis
  const niveau = matchedKeywords.length >= 2 ? "crisis" : "aandacht"

  log.warn({
    niveau,
    keywords: matchedKeywords,
    berichtLengte: bericht.length,
  }, `Crisis-signaal gedetecteerd: ${niveau}`)

  return { isCrisis: true, niveau, matchedKeywords }
}

/**
 * Vast crisis-protocol bericht.
 * Dit wordt getoond IN PLAATS VAN of NAAST het AI-antwoord.
 */
export const CRISIS_PROTOCOL = {
  aandacht: {
    bericht: "Het klinkt alsof je het zwaar hebt. Dat is begrijpelijk — zorgen voor iemand anders is heel veel. Je hoeft dit niet alleen te doen.",
    hulplijnen: [
      { naam: "Mantelzorglijn", nummer: "030 - 760 60 55", beschrijving: "Luisterend oor en advies, gratis" },
    ],
  },
  crisis: {
    bericht: "Ik maak me zorgen om je. Wat je voelt is serieus en je verdient hulp. Neem alsjeblieft contact op met een van deze lijnen — ze zijn er speciaal voor jou.",
    hulplijnen: [
      { naam: "113 Zelfmoordpreventie", nummer: "113 of 0800-0113", beschrijving: "24/7 bereikbaar, gratis en anoniem" },
      { naam: "Huisartsenpost", nummer: "Bel je eigen huisarts", beschrijving: "Bij acute nood" },
      { naam: "Mantelzorglijn", nummer: "030 - 760 60 55", beschrijving: "Luisterend oor en advies" },
    ],
  },
}

/**
 * Bouw het crisis-response bericht op dat in de chat getoond wordt.
 */
export function buildCrisisResponse(niveau: "aandacht" | "crisis"): string {
  const protocol = CRISIS_PROTOCOL[niveau]

  let response = `${protocol.bericht}\n\n`

  for (const lijn of protocol.hulplijnen) {
    response += `📞 **${lijn.naam}**: ${lijn.nummer}\n_${lijn.beschrijving}_\n\n`
  }

  response += "_Ger is een digitale assistent, geen hulpverlener. Bij acute nood, bel 112._"

  return response
}
