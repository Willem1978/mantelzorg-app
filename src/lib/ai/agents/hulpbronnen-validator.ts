/**
 * AI Hulpbronnen Validator
 *
 * Controleert of bestaande hulpbronnen (zorgorganisaties) nog actueel zijn.
 * Draait wekelijks via cron job.
 *
 * Checks:
 * 1. Website bereikbaar? (HTTP HEAD request)
 * 2. Telefoon geldig NL-nummer?
 * 3. Status bepalen: GELDIG, WAARSCHUWING, ONGELDIG, ONBEKEND
 *
 * Resultaten worden opgeslagen in HulpbronValidatie tabel
 * en de Zorgorganisatie wordt bijgewerkt met validatieStatus + laatsteValidatie.
 */
import { prisma } from "@/lib/prisma"

// ============================================
// TYPES
// ============================================

export interface ValidatieResultaat {
  zorgorganisatieId: string
  naam: string
  status: "GELDIG" | "WAARSCHUWING" | "ONGELDIG" | "ONBEKEND"
  websiteBereikbaar: boolean | null
  websiteStatusCode: number | null
  telefoonGeldig: boolean | null
  opmerkingen: string
}

export interface ValidatieSamenvatting {
  totaal: number
  geldig: number
  waarschuwing: number
  ongeldig: number
  onbekend: number
  resultaten: ValidatieResultaat[]
}

// ============================================
// HOOFD-VALIDATIEFUNCTIE
// ============================================

/**
 * Valideer alle actieve hulpbronnen.
 * Optioneel: filter op gemeente.
 */
export async function valideerAlleHulpbronnen(
  gemeente?: string,
): Promise<ValidatieSamenvatting> {
  // Haal alle actieve hulpbronnen op
  const where: Record<string, unknown> = { isActief: true }
  if (gemeente) {
    where.gemeente = { equals: gemeente, mode: "insensitive" }
  }

  const hulpbronnen = await prisma.zorgorganisatie.findMany({
    where,
    select: {
      id: true,
      naam: true,
      website: true,
      telefoon: true,
    },
  })

  const resultaten: ValidatieResultaat[] = []

  // Verwerk in batches van 10 om servers niet te overbelasten
  const batches = chunkArray(hulpbronnen, 10)

  for (const batch of batches) {
    const batchResults = await Promise.all(
      batch.map((h) => valideerHulpbron(h))
    )
    resultaten.push(...batchResults)

    // Kleine pauze tussen batches
    if (batches.indexOf(batch) < batches.length - 1) {
      await sleep(1000)
    }
  }

  // Sla resultaten op in database
  for (const result of resultaten) {
    try {
      // Maak validatie-log record
      await prisma.hulpbronValidatie.create({
        data: {
          zorgorganisatieId: result.zorgorganisatieId,
          status: result.status as any,
          websiteBereikbaar: result.websiteBereikbaar,
          websiteStatusCode: result.websiteStatusCode,
          telefoonGeldig: result.telefoonGeldig,
          opmerkingen: result.opmerkingen || null,
        },
      })

      // Update de zorgorganisatie zelf
      await prisma.zorgorganisatie.update({
        where: { id: result.zorgorganisatieId },
        data: {
          validatieStatus: result.status,
          laatsteValidatie: new Date(),
        },
      })
    } catch (e) {
      console.error(`Validatie opslaan mislukt voor ${result.naam}:`, e)
    }
  }

  return {
    totaal: resultaten.length,
    geldig: resultaten.filter((r) => r.status === "GELDIG").length,
    waarschuwing: resultaten.filter((r) => r.status === "WAARSCHUWING").length,
    ongeldig: resultaten.filter((r) => r.status === "ONGELDIG").length,
    onbekend: resultaten.filter((r) => r.status === "ONBEKEND").length,
    resultaten,
  }
}

// ============================================
// INDIVIDUELE VALIDATIE
// ============================================

async function valideerHulpbron(hulpbron: {
  id: string
  naam: string
  website: string | null
  telefoon: string | null
}): Promise<ValidatieResultaat> {
  const opmerkingen: string[] = []
  let websiteBereikbaar: boolean | null = null
  let websiteStatusCode: number | null = null
  let telefoonGeldig: boolean | null = null

  // 1. Website check
  if (hulpbron.website) {
    try {
      const url = hulpbron.website.startsWith("http")
        ? hulpbron.website
        : `https://${hulpbron.website}`

      const response = await fetch(url, {
        method: "HEAD",
        signal: AbortSignal.timeout(10000),
        redirect: "follow",
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; MantelBuddy-Validator/1.0)",
        },
      })

      websiteStatusCode = response.status
      websiteBereikbaar = response.ok

      if (!response.ok) {
        opmerkingen.push(`Website geeft status ${response.status}`)
      }

      // Check of er een redirect was naar een heel ander domein
      const finalUrl = response.url
      if (finalUrl) {
        try {
          const origDomain = new URL(url).hostname.replace("www.", "")
          const finalDomain = new URL(finalUrl).hostname.replace("www.", "")
          if (origDomain !== finalDomain) {
            opmerkingen.push(`Website redirect naar ${finalDomain} (was ${origDomain})`)
          }
        } catch {
          // URL parsing fout, niet erg
        }
      }
    } catch (e) {
      websiteBereikbaar = false
      const msg = e instanceof Error ? e.message : "Onbekende fout"
      if (msg.includes("timeout") || msg.includes("AbortError")) {
        opmerkingen.push("Website timeout (niet bereikbaar binnen 10s)")
      } else if (msg.includes("ENOTFOUND") || msg.includes("getaddrinfo")) {
        opmerkingen.push("Website domein bestaat niet meer")
      } else {
        opmerkingen.push(`Website fout: ${msg.substring(0, 100)}`)
      }
    }
  }

  // 2. Telefoon check (NL-formaat)
  if (hulpbron.telefoon) {
    telefoonGeldig = isGeldigNLTelefoon(hulpbron.telefoon)
    if (!telefoonGeldig) {
      opmerkingen.push(`Telefoon "${hulpbron.telefoon}" is geen geldig NL-nummer`)
    }
  }

  // 3. Status bepalen
  const status = bepaalStatus(websiteBereikbaar, telefoonGeldig, hulpbron.website, opmerkingen)

  return {
    zorgorganisatieId: hulpbron.id,
    naam: hulpbron.naam,
    status,
    websiteBereikbaar,
    websiteStatusCode,
    telefoonGeldig,
    opmerkingen: opmerkingen.join("; "),
  }
}

function bepaalStatus(
  websiteBereikbaar: boolean | null,
  telefoonGeldig: boolean | null,
  heeftWebsite: string | null,
  opmerkingen: string[],
): "GELDIG" | "WAARSCHUWING" | "ONGELDIG" | "ONBEKEND" {
  // Geen website en geen telefoon → onbekend
  if (!heeftWebsite && telefoonGeldig === null) {
    return "ONBEKEND"
  }

  // Website niet bereikbaar → ongeldig
  if (websiteBereikbaar === false) {
    return "ONGELDIG"
  }

  // Redirect naar ander domein → waarschuwing
  if (opmerkingen.some((o) => o.includes("redirect"))) {
    return "WAARSCHUWING"
  }

  // Ongeldig telefoonnummer → waarschuwing
  if (telefoonGeldig === false) {
    return "WAARSCHUWING"
  }

  // Alles is goed
  return "GELDIG"
}

// ============================================
// HULPFUNCTIES
// ============================================

/**
 * Valideer NL-telefoonnummer (basis check)
 * Accepteert: 0XX-XXXXXXX, 0XX XXXXXXX, 0XXXXXXXXX, +31XXXXXXXXX, 0800-XXXX, 0900-XXXX
 */
function isGeldigNLTelefoon(telefoon: string): boolean {
  const schoon = telefoon.replace(/[\s\-().]/g, "")

  // Mobiel of vast: begint met 0 en 10 cijfers
  if (/^0[1-9]\d{8}$/.test(schoon)) return true

  // Internationaal: +31 gevolgd door 9 cijfers
  if (/^\+31[1-9]\d{8}$/.test(schoon)) return true

  // 0031 formaat
  if (/^0031[1-9]\d{8}$/.test(schoon)) return true

  // 0800/0900 nummers
  if (/^0[89]00\d{4,7}$/.test(schoon)) return true

  return false
}

function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }
  return chunks
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
