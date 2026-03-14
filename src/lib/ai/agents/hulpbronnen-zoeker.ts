/**
 * AI Hulpbronnen Zoeker Agent
 *
 * Zoekt automatisch lokale hulpbronnen voor mantelzorgers per gemeente.
 * Gebruikt Claude met de Anthropic web_search tool voor betrouwbaar zoeken.
 * Claude zoekt zelf per categorie en structureert de resultaten.
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
// HOOFD-ZOEKFUNCTIE
// ============================================

/**
 * Voer een complete hulpbronnen-zoekopdracht uit voor een gemeente.
 *
 * Gebruikt Claude met de Anthropic web_search tool in 3 batches:
 * 1. Groep A: Hulp voor de mantelzorger (A1-A5)
 * 2. Groep B deel 1: Taken B1-B5
 * 3. Groep B deel 2: Taken B6-B10
 *
 * Claude zoekt zelf via het web en structureert de resultaten.
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

  // Batches definiëren
  const batches = [
    {
      naam: "Hulp voor de mantelzorger (A1-A5)",
      categorieen: ZOEK_CATEGORIEEN.filter(c => c.groep === "mantelzorger"),
      percentage: { start: 10, eind: 40 },
    },
    {
      naam: "Hulp bij taken deel 1 (B1-B5)",
      categorieen: ZOEK_CATEGORIEEN.filter(c => c.groep === "naaste").slice(0, 5),
      percentage: { start: 40, eind: 70 },
    },
    {
      naam: "Hulp bij taken deel 2 (B6-B10)",
      categorieen: ZOEK_CATEGORIEEN.filter(c => c.groep === "naaste").slice(5),
      percentage: { start: 70, eind: 90 },
    },
  ]

  const alleResultaten: GevondenHulpbron[] = []

  for (const batch of batches) {
    onVoortgang?.({
      fase: "zoeken",
      stap: `${batch.naam}...`,
      percentage: batch.percentage.start,
      resultaten: alleResultaten.length,
    })

    console.log(`[hulpbronnen-zoeker] Batch: ${batch.naam}`)

    try {
      const batchResultaten = await zoekBatchMetWebSearch(
        anthropic,
        gemeente,
        woonplaatsen,
        batch.categorieen,
        bestaandeFormatted,
      )

      console.log(`[hulpbronnen-zoeker] ${batch.naam}: ${batchResultaten.length} resultaten`)
      alleResultaten.push(...batchResultaten)
    } catch (e) {
      const isTimeout = e instanceof Error && (e.name === "AbortError" || e.name === "TimeoutError")
      console.error(`[hulpbronnen-zoeker] ${isTimeout ? "Timeout" : "Fout"} bij ${batch.naam}:`, e)
      // Ga door met volgende batch
    }

    onVoortgang?.({
      fase: "zoeken",
      stap: `${batch.naam}: ${alleResultaten.length} gevonden`,
      percentage: batch.percentage.eind,
      resultaten: alleResultaten.length,
    })
  }

  // Dedupliceer over batches heen
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
// CLAUDE + WEB SEARCH PER BATCH
// ============================================

async function zoekBatchMetWebSearch(
  anthropic: ReturnType<typeof createAnthropic>,
  gemeente: string,
  woonplaatsen: string[],
  categorieen: ZoekCategorie[],
  bestaandeFormatted: string,
): Promise<GevondenHulpbron[]> {
  const categorieenFormatted = categorieen.map((c) =>
    `${c.code}. ${c.label} (dbField: ${c.dbField}, dbValue: "${c.dbValue}")
    Zoek op: ${c.zoekwoorden.join(", ")}
    Synoniemen: ${c.synoniemen.join(", ")}`
  ).join("\n\n")

  const systemPrompt = `Je bent een hulpbronnen-specialist voor MantelBuddy, een app voor mantelzorgers in Nederland.
Je schrijft altijd in B1-taalniveau: korte zinnen, eenvoudige woorden, geen jargon.

Je hebt toegang tot een web_search tool. Gebruik deze om daadwerkelijke organisaties en diensten te vinden.

BELANGRIJK:
- Zoek ALTIJD specifiek naar "${gemeente}" in je zoekopdrachten
- Doe MEERDERE zoekopdrachten per categorie voor de beste resultaten
- Zoek ook op de gemeentelijke sociale kaart en hulpwijzer
- Neem ALLEEN organisaties op die daadwerkelijk een dienst aanbieden
- NIET: nieuwsartikelen, beleidsdocumenten, vacatures, webshops, blogs
- Verzin NOOIT informatie — gebruik alleen wat je vindt`

  const prompt = `Zoek hulpbronnen voor mantelzorgers in de gemeente ${gemeente}.
De woonplaatsen in deze gemeente zijn: ${woonplaatsen.join(", ") || gemeente}

Zoek voor deze categorieën:

${categorieenFormatted}

BESTAANDE HULPBRONNEN IN DATABASE (ter deduplicatie):
${bestaandeFormatted}

INSTRUCTIES:
1. Doe per categorie 1 gerichte webzoekopdracht (max 5 zoekopdrachten totaal), bijv.:
   - "${categorieen[0]?.zoekwoorden[0]} ${gemeente}"
2. Neem alleen organisaties op die echt bestaan en een dienst bieden
3. Vergelijk met bestaande hulpbronnen — markeer duplicaten
4. Max 5 resultaten per categorie
5. Wees EFFICIËNT: zoek niet te veel, geef snel je JSON antwoord

VERTROUWEN:
- HOOG: Overheidswebsite, bekende instelling, gemeentelijke bron
- GEMIDDELD: Eén bron, professionele website, duidelijke contactgegevens
- LAAG: Onduidelijk, mogelijk niet meer actief

GEEF JE ANTWOORD als ALLEEN een JSON array (geen markdown, geen uitleg, geen code blocks):
[
  {
    "categorie": "${categorieen[0]?.code}",
    "categorieLabel": "${categorieen[0]?.label}",
    "categorieDbField": "${categorieen[0]?.dbField}",
    "categorieDbValue": "${categorieen[0]?.dbValue}",
    "categorieGroep": "${categorieen[0]?.groep}",
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
    "bron": "Bron waar je dit gevonden hebt",
    "isDuplicaat": false,
    "duplicaatVan": null
  }
]

Als je voor een categorie niets vindt, sla die over (geen lege objecten).
Vul "eersteStap" ALTIJD in met een concrete actie.
Als telefoon/adres/email niet gevonden is: laat het veld leeg (lege string "").`

  const { text } = await generateText({
    model: anthropic("claude-sonnet-4-20250514"),
    system: systemPrompt,
    prompt,
    tools: {
      web_search: anthropic.tools.webSearch_20250305({
        maxUses: 5,
        userLocation: {
          type: "approximate",
          country: "NL",
        },
      }),
    },
    stopWhen: stepCountIs(8),
    maxOutputTokens: 8000,
    temperature: 0.1,
    abortSignal: AbortSignal.timeout(90_000),
  })

  // Parse JSON uit response
  try {
    let json = text.trim()

    // Strip eventuele markdown code blocks
    if (json.startsWith("```")) {
      json = json.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "")
    }

    // Zoek de JSON array in de tekst als het niet direct parsed
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
    console.error("[hulpbronnen-zoeker] JSON parse error:", e, "\nResponse:", text.substring(0, 500))
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
    case "A5": return "OVERIG"
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
    // Dedupliceer op website domein + naam
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
