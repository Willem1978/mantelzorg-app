/**
 * PDOK Locatieserver API integratie
 * https://api.pdok.nl/bzk/locatieserver/search/v3_1
 *
 * Gebruikt voor:
 * - Postcode naar gemeente omzetten
 * - Adres suggesties (zonder opslag van exact adres)
 * - Gemeente informatie ophalen
 */

const PDOK_BASE_URL = "https://api.pdok.nl/bzk/locatieserver/search/v3_1"

export interface PDOKSuggestion {
  id: string
  type: string
  weergavenaam: string
  score: number
}

export interface PDOKAddress {
  id: string
  type: string
  weergavenaam: string
  straatnaam?: string
  huisnummer?: number
  postcode?: string
  woonplaatsnaam?: string
  gemeentenaam: string
  gemeentecode: string
  provincienaam: string
  provinciecode: string
  centroide_ll?: string // "POINT(lon lat)"
}

export interface MunicipalityInfo {
  code: string
  name: string
  provinceCode: string
  provinceName: string
}

/**
 * Zoek suggesties voor een adres of postcode
 * Retourneert alleen gemeente-niveau informatie voor privacy
 */
export async function searchLocation(query: string): Promise<PDOKSuggestion[]> {
  if (!query || query.length < 2) return []

  try {
    const params = new URLSearchParams({
      q: query,
      rows: "5",
      fq: "type:(postcode OR woonplaats OR gemeente)",
    })

    const response = await fetch(`${PDOK_BASE_URL}/suggest?${params}`)

    if (!response.ok) {
      throw new Error(`PDOK API error: ${response.status}`)
    }

    const data = await response.json()

    return (data.response?.docs || []).map((doc: any) => ({
      id: doc.id,
      type: doc.type,
      weergavenaam: doc.weergavenaam,
      score: doc.score,
    }))
  } catch (error) {
    console.error("PDOK search error:", error)
    return []
  }
}

/**
 * Haal details op voor een specifiek adres/postcode
 * Retourneert alleen gemeente-niveau informatie
 */
export async function lookupLocation(id: string): Promise<PDOKAddress | null> {
  try {
    const params = new URLSearchParams({
      id: id,
    })

    const response = await fetch(`${PDOK_BASE_URL}/lookup?${params}`)

    if (!response.ok) {
      throw new Error(`PDOK API error: ${response.status}`)
    }

    const data = await response.json()
    const doc = data.response?.docs?.[0]

    if (!doc) return null

    return {
      id: doc.id,
      type: doc.type,
      weergavenaam: doc.weergavenaam,
      straatnaam: doc.straatnaam,
      huisnummer: doc.huisnummer,
      postcode: doc.postcode,
      woonplaatsnaam: doc.woonplaatsnaam,
      gemeentenaam: doc.gemeentenaam,
      gemeentecode: doc.gemeentecode,
      provincienaam: doc.provincienaam,
      provinciecode: doc.provinciecode,
      centroide_ll: doc.centroide_ll,
    }
  } catch (error) {
    console.error("PDOK lookup error:", error)
    return null
  }
}

/**
 * Zoek gemeente op basis van postcode (eerste 4 cijfers)
 * Privacy-vriendelijk: slaat alleen gemeente op, niet exact adres
 */
export async function getMunicipalityByPostcode(
  postcode: string
): Promise<MunicipalityInfo | null> {
  // Alleen eerste 4 cijfers gebruiken voor privacy
  const postalDigits = postcode.replace(/\D/g, "").substring(0, 4)

  if (postalDigits.length !== 4) {
    return null
  }

  try {
    const params = new URLSearchParams({
      q: postalDigits,
      fq: "type:postcode",
      rows: "1",
    })

    const response = await fetch(`${PDOK_BASE_URL}/free?${params}`)

    if (!response.ok) {
      throw new Error(`PDOK API error: ${response.status}`)
    }

    const data = await response.json()
    const doc = data.response?.docs?.[0]

    if (!doc) return null

    return {
      code: doc.gemeentecode,
      name: doc.gemeentenaam,
      provinceCode: doc.provinciecode,
      provinceName: doc.provincienaam,
    }
  } catch (error) {
    console.error("PDOK postcode lookup error:", error)
    return null
  }
}

/**
 * Zoek alle gemeenten (voor dropdown)
 */
export async function getAllMunicipalities(): Promise<MunicipalityInfo[]> {
  try {
    const params = new URLSearchParams({
      q: "*",
      fq: "type:gemeente",
      rows: "500",
      sort: "gemeentenaam asc",
    })

    const response = await fetch(`${PDOK_BASE_URL}/free?${params}`)

    if (!response.ok) {
      throw new Error(`PDOK API error: ${response.status}`)
    }

    const data = await response.json()

    return (data.response?.docs || []).map((doc: any) => ({
      code: doc.gemeentecode,
      name: doc.gemeentenaam,
      provinceCode: doc.provinciecode,
      provinceName: doc.provincienaam,
    }))
  } catch (error) {
    console.error("PDOK municipalities error:", error)
    return []
  }
}

/**
 * Privacy-helper: Extract alleen gemeente info uit een volledig adres
 * Gebruik dit om te voorkomen dat exacte adressen worden opgeslagen
 */
export function extractMunicipalityOnly(address: PDOKAddress): MunicipalityInfo {
  return {
    code: address.gemeentecode,
    name: address.gemeentenaam,
    provinceCode: address.provinciecode,
    provinceName: address.provincienaam,
  }
}

/**
 * Valideer postcode format (Nederlandse postcode)
 */
export function isValidPostcode(postcode: string): boolean {
  const regex = /^[1-9][0-9]{3}\s?[A-Za-z]{2}$/
  return regex.test(postcode)
}

/**
 * Zoek adressen op basis van vrije tekst
 * Retourneert een lijst met adressen inclusief straat, huisnummer, woonplaats en gemeente
 */
export async function searchAddresses(query: string): Promise<Array<{
  weergavenaam: string
  straat: string
  huisnummer: string
  woonplaats: string
  gemeente: string
}>> {
  if (!query || query.length < 3) return []

  try {
    const params = new URLSearchParams({
      q: query,
      fq: "type:adres",
      rows: "10",
    })

    const response = await fetch(`${PDOK_BASE_URL}/free?${params}`)

    if (!response.ok) {
      throw new Error(`PDOK API error: ${response.status}`)
    }

    const data = await response.json()

    return (data.response?.docs || []).map((doc: any) => ({
      weergavenaam: doc.weergavenaam || "",
      straat: doc.straatnaam || "",
      huisnummer: doc.huisnummer ? String(doc.huisnummer) : "",
      woonplaats: doc.woonplaatsnaam || "",
      gemeente: doc.gemeentenaam || "",
    }))
  } catch (error) {
    console.error("PDOK address search error:", error)
    return []
  }
}

/**
 * Zoek straten op basis van vrije tekst of postcode
 * Retourneert unieke straten met woonplaats en gemeente (zonder huisnummers)
 * Dit voorkomt dat dezelfde straat meerdere keren verschijnt met verschillende huisnummers
 */
export async function searchStreets(query: string): Promise<Array<{
  weergavenaam: string
  straat: string
  woonplaats: string
  gemeente: string
}>> {
  if (!query || query.length < 2) return []

  try {
    // Check if query starts with numbers (postcode search)
    const isPostcodeSearch = /^\d{4}/.test(query.trim())

    const params = new URLSearchParams({
      q: query,
      fq: isPostcodeSearch ? "type:postcode" : "type:weg",
      rows: "10",
    })

    const response = await fetch(`${PDOK_BASE_URL}/free?${params}`)

    if (!response.ok) {
      throw new Error(`PDOK API error: ${response.status}`)
    }

    const data = await response.json()

    return (data.response?.docs || []).map((doc: any) => ({
      weergavenaam: doc.weergavenaam || "",
      straat: doc.straatnaam || doc.weergavenaam?.split(",")[0] || "",
      woonplaats: doc.woonplaatsnaam || "",
      gemeente: doc.gemeentenaam || "",
    }))
  } catch (error) {
    console.error("PDOK street search error:", error)
    return []
  }
}

/**
 * Zoek adres op basis van postcode en huisnummer
 * Retourneert straatnaam, woonplaats en gemeente
 */
export async function lookupAddressByPostcodeHuisnummer(
  postcode: string,
  huisnummer: string
): Promise<{
  straat: string
  woonplaats: string
  gemeente: string
  volledigAdres: string
} | null> {
  try {
    // Normaliseer postcode
    const cleanPostcode = postcode.replace(/\s/g, "").toUpperCase()

    const params = new URLSearchParams({
      q: `postcode:${cleanPostcode} AND huisnummer:${huisnummer}`,
      fq: "type:adres",
      rows: "1",
    })

    const response = await fetch(`${PDOK_BASE_URL}/free?${params}`)

    if (!response.ok) {
      throw new Error(`PDOK API error: ${response.status}`)
    }

    const data = await response.json()
    const doc = data.response?.docs?.[0]

    if (!doc) return null

    return {
      straat: doc.straatnaam,
      woonplaats: doc.woonplaatsnaam,
      gemeente: doc.gemeentenaam,
      volledigAdres: doc.weergavenaam,
    }
  } catch (error) {
    console.error("PDOK address lookup error:", error)
    return null
  }
}
