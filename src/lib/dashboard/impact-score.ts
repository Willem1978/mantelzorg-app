/**
 * Impact-score berekening: uren × zwaarte per zorgtaak.
 *
 * Geeft een enkel getal dat de totale zorgdruk weergeeft.
 * Hoe hoger, hoe zwaarder de combinatie van uren en moeilijkheid.
 */

// Gewichtsfactoren per moeilijkheid
const ZWAARTE_FACTOR: Record<string, number> = {
  // Web test waarden
  MAKKELIJK: 1,
  GEMIDDELD: 2,
  MOEILIJK: 3,
  ZEER_MOEILIJK: 4,
  // WhatsApp test waarden
  NEE: 1,
  nee: 1,
  SOMS: 2,
  soms: 2,
  JA: 3,
  ja: 3,
}

export interface ZorgtaakInput {
  naam: string
  uren: number | null
  moeilijkheid: string | null
}

export interface ImpactResult {
  totaal: number
  perTaak: { naam: string; uren: number; zwaarte: number; impact: number }[]
  totaalUren: number
  niveau: "LAAG" | "GEMIDDELD" | "HOOG"
}

/**
 * Berekent impact-score: uren per week × zwaarte-factor per taak.
 * Totaal geeft een overzicht van de complete zorgdruk.
 */
export function berekenImpactScore(zorgtaken: ZorgtaakInput[]): ImpactResult {
  const perTaak = zorgtaken.map((taak) => {
    const uren = taak.uren || 0
    const zwaarte = ZWAARTE_FACTOR[taak.moeilijkheid || ""] || 1
    return {
      naam: taak.naam,
      uren,
      zwaarte,
      impact: uren * zwaarte,
    }
  })

  // Sorteer op impact (hoogste eerst)
  perTaak.sort((a, b) => b.impact - a.impact)

  const totaal = perTaak.reduce((sum, t) => sum + t.impact, 0)
  const totaalUren = perTaak.reduce((sum, t) => sum + t.uren, 0)

  // Drempels: totaal uren × gemiddelde zwaarte
  // < 20 = laag, 20-50 = gemiddeld, > 50 = hoog
  let niveau: "LAAG" | "GEMIDDELD" | "HOOG" = "LAAG"
  if (totaal >= 50) niveau = "HOOG"
  else if (totaal >= 20) niveau = "GEMIDDELD"

  return { totaal, perTaak, totaalUren, niveau }
}
