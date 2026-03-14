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
 * 4. Bij problemen: AI zoekt de juiste/nieuwe gegevens en stelt correctie voor
 *
 * Resultaten worden opgeslagen in HulpbronValidatie tabel
 * en de Zorgorganisatie wordt bijgewerkt met validatieStatus + laatsteValidatie.
 */
import { prisma } from "@/lib/prisma"
import { createAnthropic } from "@ai-sdk/anthropic"
import { generateText } from "ai"

// ============================================
// TYPES
// ============================================

export interface CorrectieVoorstel {
  nieuwWebsite?: string
  nieuwTelefoon?: string
  toelichting: string
  bron: string
}

export interface ValidatieResultaat {
  zorgorganisatieId: string
  naam: string
  status: "GELDIG" | "WAARSCHUWING" | "ONGELDIG" | "ONBEKEND"
  websiteBereikbaar: boolean | null
  websiteStatusCode: number | null
  telefoonGeldig: boolean | null
  opmerkingen: string
  correctieVoorstel?: CorrectieVoorstel | null
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
      gemeente: true,
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

  // Voor ongeldige/waarschuwing items: zoek correcties via AI
  const probleemItems = resultaten.filter(
    (r) => r.status === "ONGELDIG" || r.status === "WAARSCHUWING"
  )
  if (probleemItems.length > 0) {
    const hulpbronMap = new Map(hulpbronnen.map((h) => [h.id, h]))
    // Verwerk correcties in batches van 3 (AI calls zijn zwaarder)
    const correctieBatches = chunkArray(probleemItems, 3)
    for (const batch of correctieBatches) {
      await Promise.all(
        batch.map(async (result) => {
          try {
            const hulpbron = hulpbronMap.get(result.zorgorganisatieId)
            if (!hulpbron) return
            result.correctieVoorstel = await zoekCorrectie(
              hulpbron.naam,
              hulpbron.website,
              hulpbron.telefoon,
              hulpbron.gemeente,
              result.opmerkingen,
            )
          } catch (e) {
            console.error(`Correctie zoeken mislukt voor ${result.naam}:`, e)
          }
        })
      )
      await sleep(500)
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
          aiSamenvatting: result.correctieVoorstel
            ? JSON.stringify(result.correctieVoorstel)
            : null,
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
  gemeente: string | null
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
// AI CORRECTIE ZOEKEN
// ============================================

/**
 * Zoek via DuckDuckGo naar actuele contactgegevens.
 * Hergebruikt hetzelfde patroon als hulpbronnen-zoeker.
 */
async function zoekWebResultaten(query: string): Promise<{ titel: string; url: string; snippet: string }[]> {
  try {
    const encodedQuery = encodeURIComponent(query)
    const response = await fetch(
      `https://html.duckduckgo.com/html/?q=${encodedQuery}`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; MantelBuddy/1.0; +https://mantelbuddy.nl)",
          "Accept": "text/html",
          "Accept-Language": "nl-NL,nl;q=0.9",
        },
        signal: AbortSignal.timeout(8000),
      }
    )

    if (!response.ok) return []

    const html = await response.text()
    const results: { titel: string; url: string; snippet: string }[] = []

    const resultBlocks = html.split(/class="result[_\s]/)
    for (const block of resultBlocks.slice(1, 8)) {
      const titleMatch =
        block.match(/class="result__a"[^>]*>([^<]+)</) ||
        block.match(/<a[^>]*class="[^"]*result[^"]*"[^>]*>([^<]+)</)

      const urlMatch =
        block.match(/href="(https?:\/\/[^"]+)"/) ||
        block.match(/href="([^"]*uddg=[^"]+)"/)

      const snippetMatch =
        block.match(/class="result__snippet"[^>]*>([\s\S]*?)<\//) ||
        block.match(/class="result-snippet"[^>]*>([\s\S]*?)<\//)

      if (titleMatch && urlMatch) {
        let url = urlMatch[1]
        const actualUrlMatch = url.match(/uddg=([^&]+)/)
        if (actualUrlMatch) {
          url = decodeURIComponent(actualUrlMatch[1])
        }

        // Filter irrelevante sites
        if (/wikipedia|youtube|facebook|twitter|instagram|linkedin|indeed|glassdoor/i.test(url)) continue

        const titel = titleMatch[1].replace(/<[^>]+>/g, "").trim()
        const snippet = snippetMatch ? snippetMatch[1].replace(/<[^>]+>/g, "").trim() : ""

        if (titel) {
          results.push({ titel, url, snippet: snippet.substring(0, 300) })
        }
      }
    }

    return results
  } catch {
    return []
  }
}

/**
 * Zoek actuele contactgegevens voor een hulpbron met problemen.
 * Gebruikt DuckDuckGo + AI-analyse om wijzigingen te identificeren.
 */
async function zoekCorrectie(
  naam: string,
  oudeWebsite: string | null,
  oudTelefoon: string | null,
  gemeente: string | null,
  opmerkingen: string,
): Promise<CorrectieVoorstel | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return null

  // Zoek op organisatienaam + gemeente
  const zoekterm = `${naam} ${gemeente || ""} contact`.trim()
  const resultaten = await zoekWebResultaten(zoekterm)

  if (resultaten.length === 0) return null

  // Laat AI de resultaten analyseren
  const anthropic = createAnthropic({ apiKey })

  const zoekResultatenTekst = resultaten.map((r, i) =>
    `${i + 1}. ${r.titel}\n   URL: ${r.url}\n   Snippet: ${r.snippet}`
  ).join("\n\n")

  const prompt = `Je bent een data-specialist voor een mantelzorg-app. Een hulpbron heeft een validatieprobleem en je moet de actuele contactgegevens zoeken.

HULPBRON
========
Naam: ${naam}
Gemeente: ${gemeente || "Onbekend"}
Huidige website: ${oudeWebsite || "Geen"}
Huidig telefoon: ${oudTelefoon || "Geen"}
Probleem: ${opmerkingen}

ZOEKRESULTATEN
==============
${zoekResultatenTekst}

INSTRUCTIES
===========
Analyseer de zoekresultaten en bepaal:
1. Is er een nieuwe/juiste website-URL voor deze organisatie? Kijk naar:
   - Of de URL in de zoekresultaten hetzelfde bedrijf betreft
   - Of een redirect naar een nieuw domein het juiste nieuwe adres is
   - Of de organisatie gefuseerd is of hernoemd
2. Is er een nieuw telefoonnummer te vinden in de snippets?

BELANGRIJK:
- Stel ALLEEN wijzigingen voor als je ZEKER bent dat het om dezelfde organisatie gaat
- Verzin NOOIT gegevens die niet in de zoekresultaten staan
- Als je het niet zeker weet, geef dan null terug
- Geef een korte toelichting (1-2 zinnen) waarom je deze correctie voorstelt
- Geef aan welk zoekresultaat (nummer) de bron is

Antwoord ALLEEN met geldig JSON in dit formaat:
{
  "nieuwWebsite": "https://..." of null,
  "nieuwTelefoon": "0XX-XXXXXXX" of null,
  "toelichting": "Korte uitleg waarom",
  "bron": "Zoekresultaat X: titel"
}`

  try {
    const { text } = await generateText({
      model: anthropic("claude-sonnet-4-20250514"),
      prompt,
      maxOutputTokens: 500,
      temperature: 0,
    })

    let json = text.trim()
    if (json.startsWith("```")) {
      json = json.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "")
    }

    const parsed = JSON.parse(json) as {
      nieuwWebsite: string | null
      nieuwTelefoon: string | null
      toelichting: string
      bron: string
    }

    // Alleen teruggeven als er daadwerkelijk iets veranderd is
    if (!parsed.nieuwWebsite && !parsed.nieuwTelefoon) return null

    // Verifieer dat voorgestelde website bereikbaar is
    if (parsed.nieuwWebsite) {
      try {
        const url = parsed.nieuwWebsite.startsWith("http")
          ? parsed.nieuwWebsite
          : `https://${parsed.nieuwWebsite}`
        const check = await fetch(url, {
          method: "HEAD",
          signal: AbortSignal.timeout(8000),
          redirect: "follow",
          headers: { "User-Agent": "Mozilla/5.0 (compatible; MantelBuddy-Validator/1.0)" },
        })
        if (!check.ok) {
          // Voorgestelde URL is ook niet bereikbaar, sla over
          parsed.nieuwWebsite = null
          if (!parsed.nieuwTelefoon) return null
        }
      } catch {
        parsed.nieuwWebsite = null
        if (!parsed.nieuwTelefoon) return null
      }
    }

    return {
      nieuwWebsite: parsed.nieuwWebsite || undefined,
      nieuwTelefoon: parsed.nieuwTelefoon || undefined,
      toelichting: parsed.toelichting,
      bron: parsed.bron,
    }
  } catch (e) {
    console.error(`AI correctie-analyse mislukt voor ${naam}:`, e)
    return null
  }
}

/**
 * Zoek correctie voor een enkele hulpbron (voor handmatig triggeren vanuit UI).
 */
export async function zoekCorrectieVoorHulpbron(
  zorgorganisatieId: string,
): Promise<CorrectieVoorstel | null> {
  const hulpbron = await prisma.zorgorganisatie.findUnique({
    where: { id: zorgorganisatieId },
    select: { id: true, naam: true, website: true, telefoon: true, gemeente: true },
  })
  if (!hulpbron) return null

  // Haal laatste validatie op voor context
  const laatsteValidatie = await prisma.hulpbronValidatie.findFirst({
    where: { zorgorganisatieId },
    orderBy: { gecontroleerd: "desc" },
    select: { opmerkingen: true },
  })

  const correctie = await zoekCorrectie(
    hulpbron.naam,
    hulpbron.website,
    hulpbron.telefoon,
    hulpbron.gemeente,
    laatsteValidatie?.opmerkingen || "Website of telefoon niet bereikbaar",
  )

  // Sla het voorstel op in de laatste validatie
  if (correctie && laatsteValidatie) {
    await prisma.hulpbronValidatie.updateMany({
      where: {
        zorgorganisatieId,
        gecontroleerd: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
      data: {
        aiSamenvatting: JSON.stringify(correctie),
      },
    })
  }

  return correctie
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
