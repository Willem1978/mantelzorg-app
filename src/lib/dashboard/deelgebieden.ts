/**
 * Berekent deelgebied-scores uit balanstest antwoorden.
 *
 * De 11 balanstestvragen zijn verdeeld over 3 gebieden:
 *   - Jouw Energie (q1-q3): slaap, lichaam, energieniveau
 *   - Jouw Gevoel (q4-q7): relatie, emotie, verdriet, uitputting
 *   - Jouw Tijd (q8-q11): dagelijks leven, plannen, hobby's, werkdruk
 *
 * Elke vraag scoort 0 (nee), 1 (soms) of 2 (ja) x gewicht.
 * Per gebied wordt een niveau (LAAG/GEMIDDELD/HOOG) bepaald op basis
 * van het percentage van de maximale score.
 */

export type DeelgebiedNiveau = "LAAG" | "GEMIDDELD" | "HOOG"

export interface DeelgebiedScore {
  naam: string
  emoji: string
  score: number
  maxScore: number
  percentage: number
  niveau: DeelgebiedNiveau
  tip: string
}

interface Antwoord {
  vraagId: string
  score: number
  gewicht: number
}

const SECTIE_MAP: Record<string, { sectie: string; gewicht: number }> = {
  q1: { sectie: "energie", gewicht: 1.5 },
  q2: { sectie: "energie", gewicht: 1.0 },
  q3: { sectie: "energie", gewicht: 1.0 },
  q4: { sectie: "gevoel", gewicht: 1.5 },
  q5: { sectie: "gevoel", gewicht: 1.5 },
  q6: { sectie: "gevoel", gewicht: 1.0 },
  q7: { sectie: "gevoel", gewicht: 1.5 },
  q8: { sectie: "tijd", gewicht: 1.0 },
  q9: { sectie: "tijd", gewicht: 1.0 },
  q10: { sectie: "tijd", gewicht: 1.0 },
  q11: { sectie: "tijd", gewicht: 1.5 },
}

const SECTIE_META: Record<string, { naam: string; emoji: string; maxGewicht: number }> = {
  energie: { naam: "Jouw energie", emoji: "⚡", maxGewicht: 3.5 },  // 1.5+1.0+1.0
  gevoel: { naam: "Jouw gevoel", emoji: "💛", maxGewicht: 5.5 },    // 1.5+1.5+1.0+1.5
  tijd: { naam: "Jouw tijd", emoji: "⏰", maxGewicht: 4.5 },        // 1.0+1.0+1.0+1.5
}

const TIPS: Record<string, Record<DeelgebiedNiveau, string>> = {
  energie: {
    LAAG: "Je energie is goed. Blijf goed slapen en bewegen.",
    GEMIDDELD: "Let op je energie. Probeer vaste rusttijden in te bouwen.",
    HOOG: "Je energie is laag. Prioriteer slaap en vraag hulp bij zware taken.",
  },
  gevoel: {
    LAAG: "Emotioneel gaat het goed. Blijf praten over hoe je je voelt.",
    GEMIDDELD: "Je gevoel vraagt aandacht. Praat met iemand die je vertrouwt.",
    HOOG: "Je hebt het emotioneel zwaar. Overweeg professionele steun of de Mantelzorglijn.",
  },
  tijd: {
    LAAG: "Je hebt nog tijd voor jezelf. Dat is belangrijk, houd dat vast.",
    GEMIDDELD: "Je tijd staat onder druk. Kijk of je taken kunt delen of loslaten.",
    HOOG: "De zorg kost veel van je tijd. Zoek vervangende zorg zodat je lucht krijgt.",
  },
}

function getNiveau(percentage: number): DeelgebiedNiveau {
  if (percentage < 35) return "LAAG"
  if (percentage <= 60) return "GEMIDDELD"
  return "HOOG"
}

/**
 * Bereken scores per deelgebied uit balanstest antwoorden.
 */
export function berekenDeelgebieden(antwoorden: Antwoord[]): DeelgebiedScore[] {
  const scores: Record<string, number> = { energie: 0, gevoel: 0, tijd: 0 }

  for (const a of antwoorden) {
    const mapping = SECTIE_MAP[a.vraagId]
    if (!mapping) continue
    // score is 0/1/2, gewicht uit de mapping (niet uit antwoord, want die kan afwijken)
    scores[mapping.sectie] += a.score * mapping.gewicht
  }

  return Object.entries(SECTIE_META).map(([key, meta]) => {
    const score = scores[key] || 0
    const maxScore = meta.maxGewicht * 2 // max score per vraag = 2
    const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0
    const niveau = getNiveau(percentage)

    return {
      naam: meta.naam,
      emoji: meta.emoji,
      score: Math.round(score * 10) / 10,
      maxScore,
      percentage,
      niveau,
      tip: TIPS[key][niveau],
    }
  })
}
