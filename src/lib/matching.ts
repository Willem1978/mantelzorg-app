/**
 * Buddy-matching algoritme.
 *
 * Berekent een matchpercentage (0-100) op basis van drie factoren:
 * - Taak-overlap (50%): hoeveel van de zorgtaken matchen de hulpvormen van de buddy?
 * - Afstand (30%): hemelsbreed via Haversine-formule
 * - Beschikbaarheid & kwaliteit (20%): past de beschikbaarheid + VOG + training + score
 */

import { haversineDistance, afstandScore } from "@/lib/geocode"

// ============================================
// TYPES
// ============================================

export interface BuddyForMatching {
  id: string
  voornaam: string
  woonplaats: string
  hulpvormen: string[]
  beschikbaarheid: "EENMALIG" | "VAST" | "BEIDE"
  vogGoedgekeurd: boolean
  trainingVoltooid: boolean
  gemiddeldeScore: number
  aantalBeoordelingen: number
  latitude: number | null
  longitude: number | null
  maxReisafstand: number | null
}

export interface MatchRequest {
  /** Zorgtaken waar de mantelzorger hulp bij nodig heeft (dbValues) */
  zorgtaken: string[]
  /** Gewenst type hulp: eenmalig, vast, of beide */
  beschikbaarheid?: "EENMALIG" | "VAST" | "BEIDE"
  /** Locatie van de naaste (niet de mantelzorger) */
  latitude: number | null
  longitude: number | null
  /** Maximum afstand in km (standaard 20) */
  maxAfstandKm?: number
}

export interface BuddyMatch {
  buddy: BuddyForMatching
  matchPercentage: number
  afstandKm: number | null
  details: {
    taakOverlapScore: number
    afstandScore: number
    beschikbaarheidScore: number
  }
}

// ============================================
// MAPPING: zorgtaak dbValue → buddy hulpvorm(en)
// ============================================

// Legacy mapping: voor buddys die met de oude 6 hulpvormen zijn geregistreerd
const ZORGTAAK_NAAR_HULPVORM_LEGACY: Record<string, string[]> = {
  "Administratie en aanvragen": ["administratie"],
  "Plannen en organiseren": ["administratie"],
  "Boodschappen": ["boodschappen"],
  "Sociaal contact en activiteiten": ["gesprek"],
  "Vervoer": ["vervoer"],
  "Persoonlijke verzorging": ["oppas"],
  "Bereiden en/of nuttigen van maaltijden": ["boodschappen"],
  "Huishoudelijke taken": ["klusjes"],
  "Klusjes in en om het huis": ["klusjes"],
  "Huisdieren": ["gesprek", "oppas"],
}

// Inverse mapping: legacy hulpvorm → welke zorgtaken het dekt
const LEGACY_HULPVORM_NAAR_ZORGTAKEN: Record<string, string[]> = {
  administratie: ["Administratie en aanvragen", "Plannen en organiseren"],
  boodschappen: ["Boodschappen", "Bereiden en/of nuttigen van maaltijden"],
  gesprek: ["Sociaal contact en activiteiten", "Huisdieren"],
  vervoer: ["Vervoer"],
  oppas: ["Persoonlijke verzorging", "Huisdieren"],
  klusjes: ["Huishoudelijke taken", "Klusjes in en om het huis"],
}

/** Check of een hulpvorm een legacy waarde is (6 oude waarden) */
function isLegacyHulpvorm(hulpvorm: string): boolean {
  return ["gesprek", "boodschappen", "vervoer", "klusjes", "oppas", "administratie"].includes(hulpvorm)
}

// ============================================
// SCORE BEREKENING
// ============================================

/**
 * Bereken taak-overlap score (0-100).
 * Kijkt hoeveel van de gevraagde zorgtaken de buddy kan aanbieden.
 *
 * Ondersteunt twee formats van buddyHulpvormen:
 * - Nieuw: dbValues (bijv. "Boodschappen", "Vervoer") → directe match
 * - Legacy: 6 generieke waarden (bijv. "boodschappen", "vervoer") → via mapping
 */
export function berekenTaakOverlap(
  gevraagdeZorgtaken: string[],
  buddyHulpvormen: string[],
): number {
  if (gevraagdeZorgtaken.length === 0) return 50 // Geen taken opgegeven → neutrale score

  // Bepaal of buddy het nieuwe of legacy format gebruikt
  const usesLegacy = buddyHulpvormen.length > 0 && buddyHulpvormen.every(isLegacyHulpvorm)

  let matches = 0

  if (usesLegacy) {
    // Legacy: vertaal via ZORGTAAK_NAAR_HULPVORM_LEGACY
    const buddySet = new Set(buddyHulpvormen)
    for (const taak of gevraagdeZorgtaken) {
      const benodigdeHulpvormen = ZORGTAAK_NAAR_HULPVORM_LEGACY[taak] || []
      if (benodigdeHulpvormen.some((h) => buddySet.has(h))) {
        matches++
      }
    }
  } else {
    // Nieuw: directe match op dbValue
    const buddySet = new Set(buddyHulpvormen)
    for (const taak of gevraagdeZorgtaken) {
      if (buddySet.has(taak)) {
        matches++
      }
    }
  }

  return Math.round((matches / gevraagdeZorgtaken.length) * 100)
}

/**
 * Bereken beschikbaarheid & kwaliteitsscore (0-100).
 * Factoren: beschikbaarheid match (40%), VOG (25%), training (15%), beoordeling (20%)
 */
export function berekenBeschikbaarheidScore(
  buddy: BuddyForMatching,
  gevraagdeBeschikbaarheid?: "EENMALIG" | "VAST" | "BEIDE",
): number {
  let score = 0

  // Beschikbaarheid match (40 punten)
  if (!gevraagdeBeschikbaarheid || buddy.beschikbaarheid === "BEIDE") {
    score += 40
  } else if (buddy.beschikbaarheid === gevraagdeBeschikbaarheid) {
    score += 40
  } else {
    score += 10
  }

  // VOG goedgekeurd (25 punten)
  if (buddy.vogGoedgekeurd) score += 25

  // Training voltooid (15 punten)
  if (buddy.trainingVoltooid) score += 15

  // Beoordeling (20 punten) — alleen als er beoordelingen zijn
  if (buddy.aantalBeoordelingen > 0) {
    score += Math.round((buddy.gemiddeldeScore / 5) * 20)
  } else {
    score += 10 // Neutraal als nog geen beoordelingen
  }

  return score
}

/**
 * Bereken het totale matchpercentage voor één buddy.
 */
export function berekenMatchPercentage(
  buddy: BuddyForMatching,
  request: MatchRequest,
): BuddyMatch {
  // 1. Taak-overlap (50%)
  const taakScore = berekenTaakOverlap(request.zorgtaken, buddy.hulpvormen)

  // 2. Afstand (30%)
  let distanceKm: number | null = null
  let distScore = 50 // Neutraal als geen locatie beschikbaar

  if (
    buddy.latitude != null && buddy.longitude != null &&
    request.latitude != null && request.longitude != null
  ) {
    distanceKm = haversineDistance(
      request.latitude, request.longitude,
      buddy.latitude, buddy.longitude,
    )
    distScore = afstandScore(distanceKm)
  }

  // 3. Beschikbaarheid & kwaliteit (20%)
  const beschikScore = berekenBeschikbaarheidScore(buddy, request.beschikbaarheid)

  // Gewogen gemiddelde
  const matchPercentage = Math.round(
    taakScore * 0.5 +
    distScore * 0.3 +
    beschikScore * 0.2,
  )

  return {
    buddy,
    matchPercentage,
    afstandKm: distanceKm != null ? Math.round(distanceKm * 10) / 10 : null,
    details: {
      taakOverlapScore: taakScore,
      afstandScore: distScore,
      beschikbaarheidScore: beschikScore,
    },
  }
}

/**
 * Match een lijst buddys met een hulpvraag.
 * Retourneert gesorteerd op matchpercentage (hoog → laag).
 * Filtert buddys die buiten de maximale afstand vallen.
 */
export function matchBuddys(
  buddys: BuddyForMatching[],
  request: MatchRequest,
): BuddyMatch[] {
  const maxAfstand = request.maxAfstandKm ?? 20

  return buddys
    .map((buddy) => berekenMatchPercentage(buddy, request))
    .filter((match) => {
      // Filter op maximale afstand (als locatie beschikbaar)
      if (match.afstandKm != null && match.afstandKm > maxAfstand) return false
      // Filter op buddy maxReisafstand
      if (
        match.afstandKm != null &&
        match.buddy.maxReisafstand != null &&
        match.afstandKm > match.buddy.maxReisafstand
      ) return false
      return true
    })
    .sort((a, b) => b.matchPercentage - a.matchPercentage)
}
