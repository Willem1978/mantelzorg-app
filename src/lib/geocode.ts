/**
 * Geocoding en afstandsberekening voor buddy-matching.
 *
 * Gebruikt PDOK Locatieserver (gratis, overheids-API) voor NL postcodes
 * en de Haversine-formule voor afstandsberekening.
 */

const PDOK_BASE_URL = "https://api.pdok.nl/bzk/locatieserver/search/v3_1"

export interface Coordinates {
  latitude: number
  longitude: number
}

/**
 * Geocode een Nederlandse postcode naar coördinaten via PDOK.
 * Gebruikt alleen de 4 cijfers (privacy-vriendelijk).
 * Retourneert het zwaartepunt van het postcodegebied.
 */
export async function geocodePostcode(postcode: string): Promise<Coordinates | null> {
  const digits = postcode.replace(/\D/g, "").substring(0, 4)
  if (digits.length !== 4) return null

  try {
    const params = new URLSearchParams({
      q: digits,
      fq: "type:postcode",
      rows: "1",
    })

    const response = await fetch(`${PDOK_BASE_URL}/free?${params}`, {
      signal: AbortSignal.timeout(5000),
    })

    if (!response.ok) return null

    const data = await response.json()
    const doc = data.response?.docs?.[0]

    if (!doc?.centroide_ll) return null

    return parseCentroide(doc.centroide_ll)
  } catch {
    return null
  }
}

/**
 * Parse PDOK centroide_ll formaat: "POINT(lng lat)" → { latitude, longitude }
 */
export function parseCentroide(centroide: string): Coordinates | null {
  const match = centroide.match(/POINT\(([^ ]+) ([^ ]+)\)/)
  if (!match) return null

  const longitude = parseFloat(match[1])
  const latitude = parseFloat(match[2])

  if (isNaN(latitude) || isNaN(longitude)) return null

  return { latitude, longitude }
}

/**
 * Bereken afstand tussen twee punten met de Haversine-formule.
 * Retourneert afstand in kilometers.
 */
export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371 // Aardstraal in km

  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180)
}

/**
 * Bereken afstandsscore voor matching (0-100).
 * Hoe dichterbij, hoe hoger de score.
 *
 * < 5 km  = 100
 * 5-10 km = 70
 * 10-20 km = 40
 * > 20 km = 10
 */
export function afstandScore(distanceKm: number): number {
  if (distanceKm < 5) return 100
  if (distanceKm < 10) return 70
  if (distanceKm < 20) return 40
  return 10
}
