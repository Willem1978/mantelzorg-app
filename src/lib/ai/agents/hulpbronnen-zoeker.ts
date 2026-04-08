/**
 * AI Hulpbronnen Zoeker Agent
 *
 * Zoekt automatisch lokale hulpbronnen voor mantelzorgers per gemeente.
 * Gebruikt Claude met de Anthropic web_search tool voor betrouwbaar zoeken.
 * Zoekt PER CATEGORIE apart (A1, A2, ... B10) zodat elke stap snel is
 * en vastlopen wordt voorkomen.
 *
 * Categorieën zijn 1:1 gekoppeld aan:
 * - HULP_VOOR_MANTELZORGER (soortHulp) → config/options.ts
 * - ZORGTAKEN / HULP_BIJ_TAAK (onderdeelTest) → config/options.ts
 */
import { createAnthropic } from "@ai-sdk/anthropic"
import { generateText, stepCountIs } from "ai"
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
      "mantelzorgconsulent", "mantelzorgsteunpunt", "mantelzorgmakelaar",
      "WMO loket mantelzorg", "informatiepunt mantelzorg", "sociaal wijkteam",
    ],
    synoniemen: [
      "mantelzorgcoach", "cliëntondersteuner",
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
    label: "Praten, steun & lotgenoten",
    groep: "mantelzorger",
    dbField: "soortHulp",
    dbValue: "Emotionele steun",
    zoekwoorden: [
      "mantelzorglijn", "hulplijn mantelzorg", "inloopspreekuur mantelzorg",
      "maatschappelijk werk mantelzorg",
      "lotgenotengroep mantelzorg", "mantelzorgcafé", "Alzheimer café",
      "praatgroep mantelzorg",
    ],
    synoniemen: [
      "luisterlijn", "psychosociale hulp", "coaching", "counseling",
      "pastoraat", "geestelijke verzorging", "telefonische hulp",
      "maatschappelijk werker", "inloopspreekuur",
      "lotgenotencontact", "gespreksgroep", "Parkinson Café",
      "ervaringsdeskundige", "maatjesproject", "zelfhulpgroep",
      "ontmoetingsgroep", "online community",
    ],
  },
  {
    code: "A4",
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
// HOOFD-ZOEKFUNCTIE
// ============================================

/**
 * Voer een complete hulpbronnen-zoekopdracht uit voor een gemeente.
 *
 * Zoekt PER CATEGORIE apart (A1, A2, ... B10).
 * Elke categorie = 1 snelle Claude call met 1 web search.
 * Als een categorie faalt of timeout, gaan de rest gewoon door.
 */
export async function zoekHulpbronnenVoorGemeente(
  gemeente: string,
  onVoortgang?: VoortgangCallback,
): Promise<GevondenHulpbron[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY niet geconfigureerd")
  }

  const anthropic = createAnthropic({ apiKey })

  // STAP 0: Woonplaatsen ophalen via PDOK
  onVoortgang?.({
    fase: "voorbereiding",
    stap: "Woonplaatsen ophalen via PDOK...",
    percentage: 5,
    resultaten: 0,
  })

  const woonplaatsen = await getWoonplaatsenByGemeente(gemeente)
  console.log(`[hulpbronnen-zoeker] Gemeente: ${gemeente}, woonplaatsen: ${woonplaatsen.join(", ")}`)

  // Bestaande hulpbronnen ophalen voor deduplicatie
  const bestaande = await prisma.zorgorganisatie.findMany({
    where: {
      OR: [
        { gemeente: { equals: gemeente, mode: "insensitive" } },
        { gemeente: null },
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

  const bestaandeFormatted = bestaande.length > 0
    ? bestaande.map((b) =>
        `- ${b.naam} | ${b.website || "geen website"} | ${b.telefoon || "geen telefoon"} | ${b.onderdeelTest || b.soortHulp || "geen categorie"}`
      ).join("\n")
    : "Geen bestaande hulpbronnen voor deze gemeente."

  // Per categorie zoeken (A1, A2, ... B10) — 3 tegelijk parallel
  const alleResultaten: GevondenHulpbron[] = []
  const totaal = ZOEK_CATEGORIEEN.length
  const PARALLEL = 3

  for (let i = 0; i < totaal; i += PARALLEL) {
    const batch = ZOEK_CATEGORIEEN.slice(i, i + PARALLEL)
    const percentage = Math.round(5 + (i / totaal) * 90)

    onVoortgang?.({
      fase: "zoeken",
      stap: `${batch.map(c => c.code).join(", ")} zoeken...`,
      percentage,
      resultaten: alleResultaten.length,
    })

    console.log(`[hulpbronnen-zoeker] Parallel: ${batch.map(c => `${c.code} ${c.label}`).join(", ")}`)

    const results = await Promise.allSettled(
      batch.map((cat) =>
        zoekEnkeleCategorieMetWebSearch(
          anthropic,
          gemeente,
          woonplaatsen,
          cat,
          bestaandeFormatted,
        )
      )
    )

    for (let j = 0; j < results.length; j++) {
      const result = results[j]
      const cat = batch[j]
      if (result.status === "fulfilled") {
        console.log(`[hulpbronnen-zoeker] ${cat.code} ${cat.label}: ${result.value.length} resultaten`)
        alleResultaten.push(...result.value)
      } else {
        const e = result.reason
        const isTimeout = e instanceof Error && (e.name === "AbortError" || e.name === "TimeoutError")
        console.error(`[hulpbronnen-zoeker] ${isTimeout ? "Timeout" : "Fout"} bij ${cat.code} ${cat.label}:`, e)
      }
    }
  }

  // Dedupliceer
  const gedeupeerd = dedupliceerHulpbronnen(alleResultaten)

  onVoortgang?.({
    fase: "klaar",
    stap: `${gedeupeerd.length} hulpbronnen gevonden en gecategoriseerd`,
    percentage: 100,
    resultaten: gedeupeerd.length,
  })

  return gedeupeerd
}

// ============================================
// CLAUDE + WEB SEARCH PER ENKELE CATEGORIE
// ============================================

async function zoekEnkeleCategorieMetWebSearch(
  anthropic: ReturnType<typeof createAnthropic>,
  gemeente: string,
  woonplaatsen: string[],
  categorie: ZoekCategorie,
  bestaandeFormatted: string,
): Promise<GevondenHulpbron[]> {
  const zoekterm = categorie.zoekwoorden[0]

  const prompt = `Zoek organisaties voor "${categorie.label}" in gemeente ${gemeente}.
Woonplaatsen: ${woonplaatsen.join(", ") || gemeente}

Categorie: ${categorie.code} - ${categorie.label}
dbField: ${categorie.dbField}
dbValue: "${categorie.dbValue}"
Groep: ${categorie.groep}
Zoektermen: ${categorie.zoekwoorden.join(", ")}
Synoniemen: ${categorie.synoniemen.join(", ")}

Zoek op: "${zoekterm} ${gemeente}"

BESTAANDE (ter deduplicatie):
${bestaandeFormatted}

Geef ALLEEN een JSON array terug. Geen uitleg, geen markdown.
Max 5 resultaten. Alleen echte organisaties die een dienst aanbieden.
NIET: nieuwsartikelen, beleidsdocumenten, vacatures, webshops, blogs.

[
  {
    "categorie": "${categorie.code}",
    "categorieLabel": "${categorie.label}",
    "categorieDbField": "${categorie.dbField}",
    "categorieDbValue": "${categorie.dbValue}",
    "categorieGroep": "${categorie.groep}",
    "naam": "Organisatienaam",
    "beschrijving": "Korte beschrijving (max 200 tekens, B1-taal)",
    "website": "https://...",
    "telefoon": "",
    "email": "",
    "adres": "",
    "gemeente": "${gemeente}",
    "woonplaats": "",
    "dienst": "Wat zij doen",
    "doelgroep": "Voor wie",
    "kosten": "Gratis / Via WMO / Kosten onbekend",
    "aanmeldprocedure": "Hoe aanmelden",
    "eersteStap": "Concrete actie voor de mantelzorger",
    "vertrouwen": "HOOG",
    "bron": "Bron",
    "isDuplicaat": false,
    "duplicaatVan": null
  }
]

Lege velden = lege string "". Niets verzinnen.`

  const { text } = await generateText({
    model: anthropic("claude-sonnet-4-20250514"),
    prompt,
    tools: {
      web_search: anthropic.tools.webSearch_20250305({
        maxUses: 2,
        userLocation: {
          type: "approximate",
          country: "NL",
        },
      }),
    },
    stopWhen: stepCountIs(4),
    maxOutputTokens: 4000,
    temperature: 0.1,
    abortSignal: AbortSignal.timeout(45_000),
  })

  // Parse JSON uit response
  try {
    let json = text.trim()

    if (json.startsWith("```")) {
      json = json.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "")
    }

    if (!json.startsWith("[")) {
      const arrayMatch = json.match(/\[[\s\S]*\]/)
      if (arrayMatch) {
        json = arrayMatch[0]
      }
    }

    const parsed = JSON.parse(json) as GevondenHulpbron[]

    return parsed
      .filter((h) => h.naam && h.categorie)
      .map((h) => ({
        ...h,
        telefoon: h.telefoon === "onbekend" ? "" : (h.telefoon || ""),
        email: h.email === "onbekend" ? "" : (h.email || ""),
        adres: h.adres === "onbekend" ? "" : (h.adres || ""),
        woonplaats: h.woonplaats || "",
        website: h.website || "",
        kosten: h.kosten || "Kosten onbekend, bel voor informatie.",
      }))
  } catch (e) {
    console.error(`[hulpbronnen-zoeker] ${categorie.code} JSON parse error:`, e, "\nResponse:", text.substring(0, 300))
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
      const type = bepaalZorgorganisatieType(hulpbron)
      const isMantelzorgerHulp = hulpbron.categorieGroep === "mantelzorger"

      const zichtbaarBijLaag = false
      const zichtbaarBijGemiddeld = true
      const zichtbaarBijHoog = true

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

// ============================================
// HULPFUNCTIES
// ============================================

function bepaalZorgorganisatieType(hulpbron: GevondenHulpbron): string {
  switch (hulpbron.categorie) {
    case "A1": return "MANTELZORGSTEUNPUNT"
    case "A2": return "RESPIJTZORG"
    case "A3": return "OVERIG"
    case "A4": return "OVERIG"
    case "B1": return "GEMEENTE"
    case "B2": return "THUISZORG"
    case "B3": return "VRIJWILLIGERS"
    case "B4": return "THUISZORG"
    case "B5": return "OVERIG"
    case "B6": return "DAGBESTEDING"
    case "B7": return "VRIJWILLIGERS"
    case "B8": return "THUISZORG"
    case "B9": return "VRIJWILLIGERS"
    case "B10": return "VRIJWILLIGERS"
    default: return "OVERIG"
  }
}

function dedupliceerHulpbronnen(hulpbronnen: GevondenHulpbron[]): GevondenHulpbron[] {
  const seen = new Set<string>()
  return hulpbronnen.filter((h) => {
    let key = ""
    try {
      if (h.website) {
        const url = new URL(h.website)
        key = url.hostname + url.pathname.replace(/\/$/, "")
      }
    } catch {
      // Geen geldige URL
    }

    if (!key) key = h.naam.toLowerCase().trim()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}
