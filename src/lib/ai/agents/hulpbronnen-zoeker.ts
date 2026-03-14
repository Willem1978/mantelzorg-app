/**
 * AI Hulpbronnen Zoeker Agent
 *
 * Zoekt automatisch lokale hulpbronnen voor mantelzorgers per gemeente.
 * Gebruikt meerdere bronnen (DuckDuckGo, gemeentelijke sociale kaart, Regelhulp)
 * en laat Claude de resultaten structureren, categoriseren en filteren.
 *
 * Categorieën zijn 1:1 gekoppeld aan:
 * - HULP_VOOR_MANTELZORGER (soortHulp) → config/options.ts
 * - ZORGTAKEN / HULP_BIJ_TAAK (onderdeelTest) → config/options.ts
 */
import { createAnthropic } from "@ai-sdk/anthropic"
import { generateText } from "ai"
import { getWoonplaatsenByGemeente } from "@/lib/pdok"
import { prisma } from "@/lib/prisma"

// ============================================
// TYPES
// ============================================

export interface ZoekCategorie {
  code: string           // A1-A5, B1-B10
  label: string          // Korte naam
  groep: "mantelzorger" | "naaste"
  dbField: "soortHulp" | "onderdeelTest"
  dbValue: string        // Exact de waarde uit config/options.ts
  zoekwoorden: string[]  // Termen waarmee gezocht wordt
  synoniemen: string[]   // Alternatieve benamingen om te herkennen
}

export interface GevondenHulpbron {
  categorie: string
  categorieLabel: string
  categorieDbField: "soortHulp" | "onderdeelTest"
  categorieDbValue: string
  categorieGroep: "mantelzorger" | "naaste"
  naam: string
  beschrijving: string
  website: string
  telefoon: string
  email: string
  adres: string
  gemeente: string
  woonplaats: string
  dienst: string
  doelgroep: string
  kosten: string
  aanmeldprocedure: string
  eersteStap: string
  vertrouwen: "HOOG" | "GEMIDDELD" | "LAAG"
  bron: string
  isDuplicaat: boolean
  duplicaatVan: string | null
}

export interface ZoekVoortgang {
  fase: string
  stap: string
  percentage: number
  resultaten: number
}

export type VoortgangCallback = (voortgang: ZoekVoortgang) => void

// ============================================
// CATEGORIEËN — 1:1 mapping met config/options.ts
// ============================================

export const ZOEK_CATEGORIEEN: ZoekCategorie[] = [
  // GROEP A — Hulp voor de mantelzorger zelf
  {
    code: "A1",
    label: "Ondersteuning",
    groep: "mantelzorger",
    dbField: "soortHulp",
    dbValue: "Informatie en advies",
    zoekwoorden: [
      "mantelzorgconsulent", "mantelzorgsteunpunt", "WMO loket mantelzorg",
      "informatiepunt mantelzorg", "sociaal wijkteam",
    ],
    synoniemen: [
      "mantelzorgmakelaar", "mantelzorgcoach", "cliëntondersteuner",
      "buurtcoach", "opbouwwerker", "WMO-consulent", "wijkteam",
      "steunpunt", "informatiepunt", "adviesloket",
    ],
  },
  {
    code: "A2",
    label: "Vervangende zorg",
    groep: "mantelzorger",
    dbField: "soortHulp",
    dbValue: "Vervangende mantelzorg",
    zoekwoorden: [
      "respijtzorg", "logeerhuis mantelzorg", "dagvervanging mantelzorg",
      "oppasservice zorg", "respijthuis",
    ],
    synoniemen: [
      "logeerzorg", "logeerbed", "dagopvang", "crisisopvang",
      "weekend-opvang", "vakantieopvang", "thuisoppas", "gastgezin",
      "tijdelijke overname", "vervangende mantelzorg",
    ],
  },
  {
    code: "A3",
    label: "Praten en steun",
    groep: "mantelzorger",
    dbField: "soortHulp",
    dbValue: "Emotionele steun",
    zoekwoorden: [
      "mantelzorglijn", "hulplijn mantelzorg", "inloopspreekuur mantelzorg",
      "maatschappelijk werk mantelzorg",
    ],
    synoniemen: [
      "luisterlijn", "psychosociale hulp", "coaching", "counseling",
      "pastoraat", "geestelijke verzorging", "telefonische hulp",
      "maatschappelijk werker", "inloopspreekuur",
    ],
  },
  {
    code: "A4",
    label: "Lotgenoten",
    groep: "mantelzorger",
    dbField: "soortHulp",
    dbValue: "Persoonlijke begeleiding",
    zoekwoorden: [
      "lotgenotengroep mantelzorg", "mantelzorgcafé", "Alzheimer café",
      "praatgroep mantelzorg",
    ],
    synoniemen: [
      "lotgenotencontact", "gespreksgroep", "Parkinson Café",
      "ervaringsdeskundige", "maatjesproject", "zelfhulpgroep",
      "ontmoetingsgroep", "online community",
    ],
  },
  {
    code: "A5",
    label: "Leren en training",
    groep: "mantelzorger",
    dbField: "soortHulp",
    dbValue: "Educatie",
    zoekwoorden: [
      "cursus mantelzorg", "training mantelzorger", "workshop mantelzorg",
    ],
    synoniemen: [
      "voorlichting", "scholing", "e-learning", "webinar",
      "informatiebijeenkomst", "themabijeenkomst", "omgaan met dementie",
      "tilcursus", "EHBO", "ziektebeeld", "mindfulness mantelzorg",
    ],
  },

  // GROEP B — Hulp bij taken voor de naaste
  {
    code: "B1",
    label: "Administratie",
    groep: "naaste",
    dbField: "onderdeelTest",
    dbValue: "Administratie en aanvragen",
    zoekwoorden: [
      "PGB advies", "formulierenhulp", "sociaal raadslieden",
      "toeslagenhulp",
    ],
    synoniemen: [
      "administratie", "formulieren", "aanvragen", "persoonsgebonden budget",
      "belastingaangifte", "juridisch advies", "schuldhulp", "geldzaken",
      "post", "financieel advies",
    ],
  },
  {
    code: "B2",
    label: "Plannen",
    groep: "naaste",
    dbField: "onderdeelTest",
    dbValue: "Plannen en organiseren",
    zoekwoorden: [
      "casemanager", "cliëntondersteuner", "zorgcoördinator",
    ],
    synoniemen: [
      "plannen", "organiseren", "coördineren", "casemanagement", "zorgplan",
      "agendabeheer", "afspraken regelen", "zorgcoördinatie", "indicatie",
      "wijkverpleegkundige",
    ],
  },
  {
    code: "B3",
    label: "Boodschappen",
    groep: "naaste",
    dbField: "onderdeelTest",
    dbValue: "Boodschappen",
    zoekwoorden: [
      "boodschappenservice", "boodschappen bezorgen", "boodschappenhulp vrijwilligers",
    ],
    synoniemen: [
      "supermarkt bezorgen", "online bestellen", "apotheek bezorgen",
      "boodschappen doen",
    ],
  },
  {
    code: "B4",
    label: "Verzorging",
    groep: "naaste",
    dbField: "onderdeelTest",
    dbValue: "Persoonlijke verzorging",
    zoekwoorden: [
      "thuiszorg", "wijkverpleging", "persoonlijke verzorging",
    ],
    synoniemen: [
      "wassen", "aankleden", "douchen", "medicijnen", "toezicht",
      "thuisverpleging", "verpleging aan huis", "toiletgang",
      "kapper aan huis", "pedicure aan huis", "schoonheidsverzorging",
      "medische zorg",
    ],
  },
  {
    code: "B5",
    label: "Maaltijden",
    groep: "naaste",
    dbField: "onderdeelTest",
    dbValue: "Bereiden en/of nuttigen van maaltijden",
    zoekwoorden: [
      "maaltijdservice", "tafeltje dek je", "warme maaltijden bezorgen",
    ],
    synoniemen: [
      "maaltijden", "eten maken", "eten koken", "maaltijdvoorziening",
      "eten op wielen", "gezamenlijk eten", "buurtrestaurant", "kookgroep",
      "eetgroep", "voedingsadvies", "eten bezorgen", "eten en drinken",
    ],
  },
  {
    code: "B6",
    label: "Sociaal & activiteiten",
    groep: "naaste",
    dbField: "onderdeelTest",
    dbValue: "Sociaal contact en activiteiten",
    zoekwoorden: [
      "dagbesteding", "buurthuis", "ontmoetingscentrum",
      "activiteitencentrum", "buurtvereniging",
    ],
    synoniemen: [
      "sociaal contact", "activiteiten", "dagopvang", "wijkcentrum",
      "soos", "seniorenclub", "KBO", "PCOB", "ledenvereniging",
      "wandelgroep", "bezoekdienst", "maatjesproject", "lokaal initiatief",
      "uitjes", "buurtcentrum",
    ],
  },
  {
    code: "B7",
    label: "Vervoer",
    groep: "naaste",
    dbField: "onderdeelTest",
    dbValue: "Vervoer",
    zoekwoorden: [
      "regiotaxi", "vrijwilligersvervoer", "AutoMaatje",
    ],
    synoniemen: [
      "Valys", "deeltaxi", "buurtbus", "ANWB AutoMaatje",
      "ziekenvervoer", "rolstoelvervoer", "begeleiding onderweg",
      "vervoer begeleiding",
    ],
  },
  {
    code: "B8",
    label: "Huishouden",
    groep: "naaste",
    dbField: "onderdeelTest",
    dbValue: "Huishoudelijke taken",
    zoekwoorden: [
      "huishoudelijke hulp WMO", "schoonmaakhulp", "huishoudelijke hulp",
    ],
    synoniemen: [
      "huishouden", "schoonmaken", "poetshulp", "was-service",
      "strijkservice", "opruimen", "ramen lappen", "strijken", "wassen",
    ],
  },
  {
    code: "B9",
    label: "Klusjes",
    groep: "naaste",
    dbField: "onderdeelTest",
    dbValue: "Klusjes in en om het huis",
    zoekwoorden: [
      "klussendienst", "tuinonderhoud hulp", "woningaanpassing",
    ],
    synoniemen: [
      "klusjes", "klussen", "reparatie", "tuin", "schilderwerk",
      "handyman", "domotica", "traplift", "drempels", "buurthulp klussen",
    ],
  },
  {
    code: "B10",
    label: "Dierenverzorging",
    groep: "naaste",
    dbField: "onderdeelTest",
    dbValue: "Huisdieren",
    zoekwoorden: [
      "hondenuitlaatservice", "dierenoppas", "huisdierenhulp",
    ],
    synoniemen: [
      "huisdieren", "hond uitlaten", "kattenoppas", "dierenverzorging",
      "dierenvoedselbank", "dierenhulp",
    ],
  },
]

// ============================================
// ZOEKBRONNEN
// ============================================

interface RawZoekResultaat {
  naam: string
  beschrijving: string
  website: string
  telefoon?: string
  adres?: string
  bron: string
}

/**
 * Zoek via DuckDuckGo HTML (bestaande aanpak, bewezen)
 */
async function zoekViaDuckDuckGo(query: string): Promise<RawZoekResultaat[]> {
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
    const results: RawZoekResultaat[] = []

    const resultBlocks = html.split(/class="result[_\s]/)
    for (const block of resultBlocks.slice(1, 12)) {
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

        const naam = stripHtml(titleMatch[1]).trim()
        const snippet = snippetMatch ? stripHtml(snippetMatch[1]).trim() : ""

        if (naam) {
          results.push({
            naam,
            beschrijving: snippet.substring(0, 300),
            website: url,
            bron: "DuckDuckGo",
          })
        }
      }
    }

    return results
  } catch {
    return []
  }
}

/**
 * Zoek op De Sociale Kaart (desocialekaart.nl)
 */
async function zoekOpSocialeKaart(query: string, gemeente: string): Promise<RawZoekResultaat[]> {
  try {
    const q = encodeURIComponent(`${query} ${gemeente}`.trim())
    const response = await fetch(
      `https://www.desocialekaart.nl/zoeken?q=${q}`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; MantelBuddy/1.0)",
          "Accept": "text/html",
          "Accept-Language": "nl-NL,nl;q=0.9",
        },
        signal: AbortSignal.timeout(8000),
      }
    )

    if (!response.ok) return []

    const html = await response.text()
    const results: RawZoekResultaat[] = []

    // Probeer organisatie-links te vinden
    const orgLinks = html.match(/href="(\/organisaties\/[^"]+)"[^>]*>([^<]+)</gi)
    if (orgLinks) {
      for (const link of orgLinks.slice(0, 8)) {
        const parts = link.match(/href="(\/organisaties\/[^"]+)"[^>]*>([^<]+)</)
        if (parts) {
          results.push({
            naam: stripHtml(parts[2]).trim(),
            beschrijving: "",
            website: `https://www.desocialekaart.nl${parts[1]}`,
            bron: "De Sociale Kaart",
          })
        }
      }
    }

    return results
  } catch {
    return []
  }
}

/**
 * Zoek de gemeentelijke sociale kaart / hulpwijzer / wegwijzer
 * Gemeenten publiceren hun hulpaanbod onder verschillende namen.
 */
async function zoekGemeentelijkeSocialeKaart(gemeente: string): Promise<RawZoekResultaat[]> {
  const zoektermen = [
    `sociale kaart ${gemeente}`,
    `hulpwijzer ${gemeente}`,
    `wegwijzer zorg ${gemeente}`,
    `steunwijzer ${gemeente}`,
    `zorggids ${gemeente}`,
    `${gemeente} mantelzorg hulpaanbod`,
  ]

  const alleResultaten: RawZoekResultaat[] = []

  // Zoek parallel op alle termen
  const searches = zoektermen.map((term) => zoekViaDuckDuckGo(term))
  const results = await Promise.allSettled(searches)

  for (const result of results) {
    if (result.status === "fulfilled") {
      for (const r of result.value) {
        // Markeer als gemeentelijke bron als URL de gemeente naam bevat
        const isGemeentelijk =
          r.website.toLowerCase().includes(gemeente.toLowerCase()) ||
          r.website.includes("sociale-kaart") ||
          r.website.includes("socialekaart") ||
          r.website.includes("hulpwijzer") ||
          r.website.includes("wegwijzer") ||
          r.website.includes("steunwijzer") ||
          r.website.includes("zorggids")

        alleResultaten.push({
          ...r,
          bron: isGemeentelijk ? `Sociale kaart ${gemeente}` : r.bron,
        })
      }
    }
  }

  // Zoek ook op bekende platforms
  const platforms = [
    `https://www.socialekaartnederland.nl/?search=${encodeURIComponent(gemeente)}`,
    `https://www.zorggidsnederland.nl/zoeken/?q=${encodeURIComponent(gemeente + " mantelzorg")}`,
  ]

  for (const url of platforms) {
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; MantelBuddy/1.0)",
          "Accept": "text/html",
        },
        signal: AbortSignal.timeout(8000),
      })
      if (!response.ok) continue

      const html = await response.text()
      // Zoek links naar organisaties
      const linkPattern = /<a[^>]*href="([^"]*)"[^>]*>([^<]{5,80})</gi
      let match
      let count = 0
      while ((match = linkPattern.exec(html)) !== null && count < 10) {
        const href = match[1]
        const naam = stripHtml(match[2]).trim()
        // Filter navigatie/footer links
        if (href.startsWith("/") && !href.includes("login") && !href.includes("contact") && naam.length > 3) {
          const baseUrl = new URL(url).origin
          alleResultaten.push({
            naam,
            beschrijving: "",
            website: href.startsWith("http") ? href : `${baseUrl}${href}`,
            bron: `Sociale kaart ${gemeente}`,
          })
          count++
        }
      }
    } catch {
      // Platform niet bereikbaar, ga door
    }
  }

  return dedupliceerResultaten(alleResultaten)
}

/**
 * Zoek op Regelhulp.nl
 */
async function zoekOpRegelhulp(gemeente: string): Promise<RawZoekResultaat[]> {
  try {
    const response = await fetch("https://www.regelhulp.nl/onderwerpen/mantelzorg", {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; MantelBuddy/1.0)",
        "Accept": "text/html",
      },
      signal: AbortSignal.timeout(8000),
    })

    if (!response.ok) return []

    const html = await response.text()
    const results: RawZoekResultaat[] = []

    const linkPattern = /<a[^>]*href="(\/[^"]*)"[^>]*>([^<]+)</gi
    let match
    while ((match = linkPattern.exec(html)) !== null && results.length < 5) {
      const naam = stripHtml(match[2]).trim()
      if (naam.length > 3 && !match[1].includes("cookie")) {
        results.push({
          naam,
          beschrijving: `Informatie over mantelzorg via Regelhulp.nl`,
          website: `https://www.regelhulp.nl${match[1]}`,
          bron: "Regelhulp.nl",
        })
      }
    }

    return results
  } catch {
    return []
  }
}

// ============================================
// HOOFD-ZOEKFUNCTIE
// ============================================

/**
 * Voer een complete hulpbronnen-zoekopdracht uit voor een gemeente.
 *
 * Zoekt in 4 stappen:
 * 0. Woonplaatsen ophalen via PDOK
 * 1. Gemeente-breed zoeken per categorie
 * 2. Gemeentelijke sociale kaart/hulpwijzer doorzoeken
 * 3. Per woonplaats zoeken (als er meerdere woonplaatsen zijn)
 *
 * Alle resultaten worden naar Claude gestuurd voor structurering,
 * categorisering en filtering op basis van het volledige prompt.
 */
export async function zoekHulpbronnenVoorGemeente(
  gemeente: string,
  onVoortgang?: VoortgangCallback,
): Promise<GevondenHulpbron[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY niet geconfigureerd")
  }

  // STAP 0: Woonplaatsen ophalen via PDOK
  onVoortgang?.({
    fase: "voorbereiding",
    stap: "Woonplaatsen ophalen via PDOK...",
    percentage: 5,
    resultaten: 0,
  })

  const woonplaatsen = await getWoonplaatsenByGemeente(gemeente)

  // STAP 0b: Bestaande hulpbronnen ophalen voor deduplicatie
  const bestaande = await prisma.zorgorganisatie.findMany({
    where: {
      OR: [
        { gemeente: { equals: gemeente, mode: "insensitive" } },
        { gemeente: null }, // Landelijke hulpbronnen
      ],
    },
    select: {
      id: true,
      naam: true,
      website: true,
      telefoon: true,
      onderdeelTest: true,
      soortHulp: true,
    },
  })

  // STAP 1: Gemeente-breed zoeken per categorie
  onVoortgang?.({
    fase: "zoeken",
    stap: "Gemeente-breed zoeken per categorie...",
    percentage: 10,
    resultaten: 0,
  })

  const gemeenteResultaten: RawZoekResultaat[] = []

  // Verdeel in batches van 5 om rate limiting te voorkomen
  const categorieBatches = chunkArray(ZOEK_CATEGORIEEN, 5)
  let batchIndex = 0

  for (const batch of categorieBatches) {
    const batchSearches = batch.flatMap((cat) =>
      cat.zoekwoorden.map((woord) =>
        zoekViaDuckDuckGo(`${woord} ${gemeente}`)
      )
    )

    const batchResults = await Promise.allSettled(batchSearches)
    for (const result of batchResults) {
      if (result.status === "fulfilled") {
        gemeenteResultaten.push(...result.value)
      }
    }

    batchIndex++
    const pct = 10 + Math.round((batchIndex / categorieBatches.length) * 30)
    onVoortgang?.({
      fase: "zoeken",
      stap: `Categorie ${batchIndex}/${categorieBatches.length} doorzocht...`,
      percentage: pct,
      resultaten: gemeenteResultaten.length,
    })

    // Kleine pauze tussen batches
    if (batchIndex < categorieBatches.length) {
      await sleep(500)
    }
  }

  // STAP 2: Gemeentelijke sociale kaart
  onVoortgang?.({
    fase: "sociale-kaart",
    stap: `Gemeentelijke sociale kaart / hulpwijzer doorzoeken...`,
    percentage: 45,
    resultaten: gemeenteResultaten.length,
  })

  const socialeKaartResultaten = await zoekGemeentelijkeSocialeKaart(gemeente)

  // STAP 2b: Zoek op De Sociale Kaart per categorie
  const socialeKaartCategorieën = ZOEK_CATEGORIEEN.map((cat) =>
    zoekOpSocialeKaart(cat.zoekwoorden[0], gemeente)
  )
  const skResults = await Promise.allSettled(socialeKaartCategorieën)
  for (const result of skResults) {
    if (result.status === "fulfilled") {
      socialeKaartResultaten.push(...result.value)
    }
  }

  // STAP 2c: Regelhulp
  const regelhulpResultaten = await zoekOpRegelhulp(gemeente)

  // STAP 3: Per woonplaats zoeken
  const woonplaatsResultaten: RawZoekResultaat[] = []
  const extraWoonplaatsen = woonplaatsen.filter(
    (wp) => wp.toLowerCase() !== gemeente.toLowerCase()
  )

  if (extraWoonplaatsen.length > 0) {
    onVoortgang?.({
      fase: "woonplaatsen",
      stap: `${extraWoonplaatsen.length} woonplaatsen doorzoeken...`,
      percentage: 55,
      resultaten: gemeenteResultaten.length + socialeKaartResultaten.length,
    })

    // Per woonplaats een beperkte set zoekqueries
    const wpBatches = chunkArray(extraWoonplaatsen, 3)
    let wpBatchIdx = 0

    for (const wpBatch of wpBatches) {
      const wpSearches = wpBatch.flatMap((wp) => [
        zoekViaDuckDuckGo(`thuiszorg ${wp}`),
        zoekViaDuckDuckGo(`buurthuis ${wp}`),
        zoekViaDuckDuckGo(`huishoudelijke hulp ${wp}`),
        zoekViaDuckDuckGo(`dagbesteding ${wp}`),
      ])

      const wpResults = await Promise.allSettled(wpSearches)
      for (const result of wpResults) {
        if (result.status === "fulfilled") {
          woonplaatsResultaten.push(
            ...result.value.map((r) => ({
              ...r,
              bron: `Woonplaats: ${wpBatch[0]}`, // Wordt door AI nader bepaald
            }))
          )
        }
      }

      wpBatchIdx++
      const pct = 55 + Math.round((wpBatchIdx / wpBatches.length) * 20)
      onVoortgang?.({
        fase: "woonplaatsen",
        stap: `Woonplaats ${wpBatchIdx}/${wpBatches.length} doorzocht...`,
        percentage: pct,
        resultaten: gemeenteResultaten.length + socialeKaartResultaten.length + woonplaatsResultaten.length,
      })

      if (wpBatchIdx < wpBatches.length) {
        await sleep(500)
      }
    }
  }

  // Alle resultaten dedupliceren
  const alleRuwResultaten = dedupliceerResultaten([
    ...gemeenteResultaten,
    ...socialeKaartResultaten,
    ...regelhulpResultaten,
    ...woonplaatsResultaten,
  ])

  onVoortgang?.({
    fase: "analyseren",
    stap: `AI analyseert ${alleRuwResultaten.length} resultaten...`,
    percentage: 80,
    resultaten: alleRuwResultaten.length,
  })

  // STAP 4: Claude structureert en categoriseert de resultaten
  const gestructureerd = await analyseerMetAI(
    gemeente,
    woonplaatsen,
    alleRuwResultaten,
    bestaande,
    apiKey,
  )

  onVoortgang?.({
    fase: "klaar",
    stap: `${gestructureerd.length} hulpbronnen gevonden en gecategoriseerd`,
    percentage: 100,
    resultaten: gestructureerd.length,
  })

  return gestructureerd
}

// ============================================
// AI ANALYSE
// ============================================

async function analyseerMetAI(
  gemeente: string,
  woonplaatsen: string[],
  rawResults: RawZoekResultaat[],
  bestaande: { id: string; naam: string; website: string | null; telefoon: string | null; onderdeelTest: string | null; soortHulp: string | null }[],
  apiKey: string,
): Promise<GevondenHulpbron[]> {
  if (rawResults.length === 0) return []

  const anthropic = createAnthropic({ apiKey })

  const bestaandeFormatted = bestaande.map((b) =>
    `- ${b.naam} | ${b.website || "geen website"} | ${b.telefoon || "geen telefoon"} | ${b.onderdeelTest || b.soortHulp || "geen categorie"}`
  ).join("\n")

  const rawFormatted = rawResults.map((r, i) =>
    `${i + 1}. ${r.naam}\n   Website: ${r.website}\n   Beschrijving: ${r.beschrijving}\n   Telefoon: ${r.telefoon || "onbekend"}\n   Adres: ${r.adres || "onbekend"}\n   Bron: ${r.bron}`
  ).join("\n\n")

  const categorieenFormatted = ZOEK_CATEGORIEEN.map((c) =>
    `${c.code}. ${c.label} (dbField: ${c.dbField}, dbValue: "${c.dbValue}")\n    Wat: zie zoekwoorden\n    Synoniemen: ${c.synoniemen.join(", ")}`
  ).join("\n\n")

  const prompt = `Je bent een hulpbronnen-specialist voor MantelBuddy, een app voor mantelzorgers in Nederland. Je schrijft altijd in B1-taalniveau: korte zinnen, eenvoudige woorden, geen jargon.

TAAK
====
Analyseer de zoekresultaten en vind organisaties die mantelzorgers of hun naaste kunnen helpen in de gemeente ${gemeente}.
De woonplaatsen in deze gemeente zijn: ${woonplaatsen.join(", ")}

Je zoekt voor TWEE groepen:

GROEP A — HULP VOOR DE MANTELZORGER ZELF
${ZOEK_CATEGORIEEN.filter(c => c.groep === "mantelzorger").map(c =>
  `${c.code}. ${c.label} (dbField: ${c.dbField}, dbValue: "${c.dbValue}")\n    Synoniemen: ${c.synoniemen.join(", ")}`
).join("\n\n")}

GROEP B — HULP BIJ TAKEN VOOR DE NAASTE
${ZOEK_CATEGORIEEN.filter(c => c.groep === "naaste").map(c =>
  `${c.code}. ${c.label} (dbField: ${c.dbField}, dbValue: "${c.dbValue}")\n    Synoniemen: ${c.synoniemen.join(", ")}`
).join("\n\n")}

ZOEKRESULTATEN
==============
${rawFormatted}

BESTAANDE HULPBRONNEN IN DATABASE (ter deduplicatie)
====================================================
${bestaandeFormatted || "Geen bestaande hulpbronnen voor deze gemeente."}

INSTRUCTIES
===========

1. RELEVANTIE
   Neem alleen organisaties op die daadwerkelijk een dienst aanbieden.
   WEL: zorginstellingen, steunpunten, vrijwilligersorganisaties, buurthuizen, gemeentelijke voorzieningen, buurtcoaches, ledenverenigingen, lokale initiatieven, zorgcoöperaties.
   NIET: nieuwsartikelen, beleidsdocumenten, vacatures, webshops, verzekeraars, blogs, makelaars, uitvaart, advocaten.

2. CATEGORIE TOEWIJZING
   Wijs elke organisatie toe aan PRECIES ÉÉN categorie (A1-A5 of B1-B10). Kies de best passende. Een organisatie die meerdere diensten biedt: kies de hoofddienst.

3. SYNONIEMEN HERKENNEN
   Veel diensten worden anders benoemd dan de categorienaam. Voorbeelden:
   - "eten koken" of "warme maaltijden" → B5 Maaltijden
   - "wassen en aankleden" → B4 Verzorging
   - "poetshulp" → B8 Huishouden
   - "tilcursus" → A5 Leren en training
   - "Alzheimer Café" → A4 Lotgenoten
   - "AutoMaatje" → B7 Vervoer

4. GEMEENTELIJKE SOCIALE KAART
   Resultaten afkomstig van de officiële sociale kaart, hulpwijzer, wegwijzer of zorggids van de gemeente krijgen automatisch vertrouwen HOOG.

5. VERTROUWEN
   HOOG: Overheidswebsite, bekende instelling, gemeentelijke sociale kaart, meerdere bronnen bevestigen.
   GEMIDDELD: Eén bron, professionele website, duidelijke contactgegevens.
   LAAG: Onduidelijk, mogelijk niet meer actief, geen website.

6. DUPLICAAT CHECK
   Vergelijk met de bestaande hulpbronnen op: zelfde websitedomein, zelfde naam (ook fuzzy), zelfde telefoonnummer.

7. WOONPLAATS KOPPELING
   Als een resultaat specifiek is voor één woonplaats binnen de gemeente, vul dan "woonplaats" in met die naam. Als het gemeente-breed is, laat "woonplaats" leeg.

8. BESCHRIJVING IN B1-TAALNIVEAU
   - Korte zinnen (max 15 woorden per zin)
   - Geen afkortingen zonder uitleg
   - Geen vakjargon
   - Schrijf alsof je het uitlegt aan iemand die het voor het eerst hoort

9. KOSTEN
   Vermeld altijd of de dienst gratis is, of wat de kosten zijn.
   Als het via de WMO loopt: "Aanvragen via de gemeente (WMO)."
   Als het via de zorgverzekering loopt: "Vergoed door zorgverzekering."
   Als je de kosten niet weet: "Kosten onbekend, bel voor informatie."

10. MAXIMAAL 8 PER CATEGORIE
    Geef per categorie maximaal 8 resultaten, gesorteerd op relevantie.

GEEF JE ANTWOORD als ALLEEN een JSON array (geen markdown, geen uitleg):
[
  {
    "categorie": "A1",
    "categorieLabel": "Ondersteuning",
    "categorieDbField": "soortHulp",
    "categorieDbValue": "Informatie en advies",
    "categorieGroep": "mantelzorger",
    "naam": "Naam van de organisatie",
    "beschrijving": "Korte beschrijving in B1-taal (max 200 tekens)",
    "website": "https://...",
    "telefoon": "0XX-XXX XXXX",
    "email": "",
    "adres": "",
    "gemeente": "${gemeente}",
    "woonplaats": "",
    "dienst": "Wat zij concreet doen",
    "doelgroep": "Voor wie",
    "kosten": "Gratis / Via WMO / Eigen bijdrage / Kosten onbekend",
    "aanmeldprocedure": "Hoe je je aanmeldt",
    "eersteStap": "Eén concrete zin: wat moet de mantelzorger nu doen?",
    "vertrouwen": "HOOG",
    "bron": "DuckDuckGo / Sociale kaart ${gemeente} / etc.",
    "isDuplicaat": false,
    "duplicaatVan": null
  }
]

BELANGRIJK
==========
- Filter ALLE niet-relevante resultaten weg
- Vul "eersteStap" ALTIJD in met een concrete actie
- Verzin NOOIT informatie die niet in de zoekresultaten staat
- Als telefoon/adres/email niet gevonden is: laat het veld LEEG (lege string)
- Bij twijfel over relevantie: neem op met vertrouwen LAAG
- Categoriseer NIET dubbel: één organisatie = één categorie
- Herken synoniemen: "eten koken" = B5, "poetshulp" = B8, etc.`

  const { text } = await generateText({
    model: anthropic("claude-sonnet-4-20250514"),
    prompt,
    maxOutputTokens: 8000,
    temperature: 0.1,
  })

  // Parse JSON uit response
  try {
    // Probeer direct te parsen
    let json = text.trim()

    // Strip eventuele markdown code blocks
    if (json.startsWith("```")) {
      json = json.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "")
    }

    const parsed = JSON.parse(json) as GevondenHulpbron[]

    // Valideer en normaliseer
    return parsed
      .filter((h) => h.naam && h.categorie)
      .map((h) => ({
        ...h,
        // Zorg dat lege strings echt leeg zijn (niet "onbekend" etc.)
        telefoon: h.telefoon === "onbekend" ? "" : (h.telefoon || ""),
        email: h.email === "onbekend" ? "" : (h.email || ""),
        adres: h.adres === "onbekend" ? "" : (h.adres || ""),
        woonplaats: h.woonplaats || "",
        website: h.website || "",
        kosten: h.kosten || "Kosten onbekend, bel voor informatie.",
      }))
  } catch (e) {
    console.error("AI response parse error:", e, "\nResponse:", text.substring(0, 500))
    return []
  }
}

// ============================================
// OPSLAAN IN DATABASE
// ============================================

/**
 * Sla goedgekeurde hulpbronnen op in de database.
 * Vertaalt AI-output naar de juiste Zorgorganisatie velden zodat
 * ze automatisch terugkomen op het dashboard, in Ger, en op hulpvragen.
 */
export async function slaHulpbronnenOp(
  hulpbronnen: GevondenHulpbron[],
): Promise<{ aangemaakt: number; fouten: string[] }> {
  let aangemaakt = 0
  const fouten: string[] = []

  for (const hulpbron of hulpbronnen) {
    try {
      // Bepaal ZorgorganisatieType op basis van categorie
      const type = bepaalZorgorganisatieType(hulpbron)

      // Bepaal doelgroep flag
      const isMantelzorgerHulp = hulpbron.categorieGroep === "mantelzorger"

      // Bepaal zichtbaarheid — standaard zichtbaar bij GEMIDDELD en HOOG
      const zichtbaarBijLaag = false
      const zichtbaarBijGemiddeld = true
      const zichtbaarBijHoog = true

      // Bepaal dekkingNiveau en woonplaatsen
      const heeftWoonplaats = hulpbron.woonplaats && hulpbron.woonplaats.length > 0
      const dekkingNiveau = heeftWoonplaats ? "WOONPLAATS" : "GEMEENTE"
      const dekkingWoonplaatsen = heeftWoonplaats ? [hulpbron.woonplaats] : null

      await prisma.zorgorganisatie.create({
        data: {
          naam: hulpbron.naam,
          beschrijving: hulpbron.beschrijving,
          type: type as any,
          telefoon: hulpbron.telefoon || null,
          email: hulpbron.email || null,
          website: hulpbron.website || null,
          adres: hulpbron.adres || null,
          gemeente: hulpbron.gemeente || null,
          woonplaats: hulpbron.woonplaats || null,
          dekkingNiveau,
          dekkingWoonplaatsen: dekkingWoonplaatsen as any,
          isActief: true,
          dienst: hulpbron.dienst || null,
          doelgroep: isMantelzorgerHulp ? "MANTELZORGER" : (hulpbron.doelgroep || null),
          kosten: hulpbron.kosten || null,
          aanmeldprocedure: hulpbron.aanmeldprocedure || null,
          eersteStap: hulpbron.eersteStap || null,
          bronType: "AI_ZOEKER",
          zichtbaarBijLaag,
          zichtbaarBijGemiddeld,
          zichtbaarBijHoog,

          // Categorie toewijzing — het cruciale stuk dat ervoor zorgt
          // dat hulpbronnen terugkomen in Ger en het dashboard
          ...(hulpbron.categorieDbField === "soortHulp"
            ? { soortHulp: hulpbron.categorieDbValue }
            : { onderdeelTest: hulpbron.categorieDbValue }),
        },
      })

      aangemaakt++
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      fouten.push(`${hulpbron.naam}: ${msg}`)
    }
  }

  return { aangemaakt, fouten }
}

/**
 * Bepaal het ZorgorganisatieType enum op basis van de AI-categorie.
 * Dit is nodig voor het Prisma model.
 */
function bepaalZorgorganisatieType(hulpbron: GevondenHulpbron): string {
  switch (hulpbron.categorie) {
    case "A1": return "MANTELZORGSTEUNPUNT"
    case "A2": return "RESPIJTZORG"
    case "A3": return "OVERIG"       // Emotionele steun past niet in bestaande types
    case "A4": return "OVERIG"       // Lotgenoten
    case "A5": return "OVERIG"       // Educatie
    case "B1": return "GEMEENTE"     // Administratie (vaak gemeentelijk)
    case "B2": return "THUISZORG"    // Casemanager etc.
    case "B3": return "VRIJWILLIGERS"
    case "B4": return "THUISZORG"
    case "B5": return "OVERIG"       // Maaltijdservice
    case "B6": return "DAGBESTEDING"
    case "B7": return "VRIJWILLIGERS" // Vervoer
    case "B8": return "THUISZORG"    // Huishouden
    case "B9": return "VRIJWILLIGERS" // Klusjes
    case "B10": return "VRIJWILLIGERS" // Dierenverzorging
    default: return "OVERIG"
  }
}

// ============================================
// HULPFUNCTIES
// ============================================

function stripHtml(text: string): string {
  return text
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .trim()
}

function dedupliceerResultaten(results: RawZoekResultaat[]): RawZoekResultaat[] {
  const seen = new Set<string>()
  return results.filter((r) => {
    // Dedupliceer op website domein
    let key = r.website?.toLowerCase() || ""
    try {
      if (key) {
        const url = new URL(key)
        key = url.hostname + url.pathname.replace(/\/$/, "")
      }
    } catch {
      key = r.naam.toLowerCase()
    }

    if (!key) key = r.naam.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
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
