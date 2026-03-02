/**
 * Content Agent — /api/ai/admin/content-agent
 *
 * AI-gestuurde content-agent voor beheerders.
 * Zoekt, genereert, herschrijft en verrijkt content automatisch.
 *
 * Functies:
 *   - zoek-online:       Zoek online bronnen en stel nieuwe artikelen voor
 *   - genereer:          Genereer een compleet nieuw artikel op basis van onderwerp
 *   - herschrijf:        Herschrijf een bestaand artikel (B1, kwaliteit, SEO)
 *   - verrijk:           Verrijk een bestaand artikel met meer diepgang
 *   - categoriseer-bulk: Hercategoriseer meerdere artikelen en pas direct aan in DB
 *
 * POST body:
 *   { type: "zoek-online" | "genereer" | "herschrijf" | "verrijk" | "categoriseer-bulk",
 *     onderwerp?: string, artikelId?: string, limiet?: number }
 */
import { NextResponse } from "next/server"
import { createAnthropic } from "@ai-sdk/anthropic"
import { generateText } from "ai"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logAudit } from "@/lib/audit"
import { generateEmbedding, artikelToEmbeddingText, toVectorSql } from "@/lib/ai/embeddings"

export const maxDuration = 120

const ADMIN_ROLES = ["ADMIN", "GEMEENTE_ADMIN"] as const

async function checkAdminAccess() {
  const session = await auth()
  if (!session?.user?.id) return null
  const role = session.user.role as string
  if (!ADMIN_ROLES.includes(role as (typeof ADMIN_ROLES)[number])) return null
  return session
}

// Beschikbare categorieën ophalen
async function haalCategorieen() {
  const cats = await prisma.artikel.groupBy({
    by: ["categorie"],
    where: { isActief: true },
    _count: true,
  })
  return cats.map((c: { categorie: string; _count: number }) => c.categorie)
}

// Sub-hoofdstukken per categorie
async function haalSubHoofdstukken() {
  const subs = await prisma.artikel.groupBy({
    by: ["categorie", "subHoofdstuk"],
    where: { isActief: true, subHoofdstuk: { not: null } },
    _count: true,
  })
  return subs.map((s) => ({
    categorie: s.categorie,
    subHoofdstuk: s.subHoofdstuk,
    aantal: s._count,
  }))
}

// Beschikbare tags ophalen
async function haalTags() {
  const tags = await prisma.contentTag.findMany({
    where: { isActief: true },
    orderBy: [{ type: "asc" }, { volgorde: "asc" }],
    select: { slug: true, naam: true, type: true },
  })
  return {
    aandoeningen: tags.filter((t) => t.type === "AANDOENING"),
    situaties: tags.filter((t) => t.type === "SITUATIE"),
  }
}

function getAnthropic() {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY niet geconfigureerd")
  }
  return createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
}

const MANTELZORG_CONTEXT = `
CONTEXT OVER HET PLATFORM:
MantelBuddy is een platform voor mantelzorgers in Nederland.
Mantelzorgers zijn mensen die zorgen voor een naaste met een beperking, chronische ziekte of ouderdom.

DOELGROEPEN:
- Mantelzorgers (primair)
- MantelBuddy's (vrijwilligers die mantelzorgers helpen)
- Zorgvragers (de persoon die zorg ontvangt)

ZORGTAKEN:
Administratie, Plannen, Boodschappen, Sociaal contact, Vervoer, Verzorging, Maaltijden, Huishouden, Klusjes

CONTENT-CATEGORIEËN:
- dagelijks-zorgen: Dagritme, persoonlijke verzorging, maaltijden, huishouden, veiligheid, medicatie
- zelfzorg-balans: Overbelasting herkennen, grenzen stellen, ontspanning, emotionele steun
- rechten-regelingen: Wmo, Wlz, Zvw, PGB, cliëntondersteuning, mantelzorgwaardering
- geld-financien: Eigen bijdrage, toeslagen, belastingvoordelen, kosten besparen
- hulpmiddelen-technologie: Hulpmiddelen thuis, digitale hulpmiddelen, domotica, woningaanpassingen
- werk-mantelzorg: Combineren werk en zorg, verlofregeling, flexibel werken
- samenwerken-netwerk: Hulp vragen, professionele zorg, taakverdeling, respijtzorg

TAAL: Nederlands, B1-niveau (eenvoudig, korte zinnen, geen jargon)
`

// ── Online bronnen zoeken ──────────────────────────────────────────

const TRUSTED_SOURCES = [
  { naam: "Mantelzorg.nl", url: "https://www.mantelzorg.nl", beschrijving: "Landelijke informatie voor mantelzorgers" },
  { naam: "Mezzo", url: "https://www.mezzo.nl", beschrijving: "Landelijke vereniging voor mantelzorgers" },
  { naam: "MantelzorgNL", url: "https://www.mantelzorgnl.nl", beschrijving: "Informatie en steun" },
  { naam: "Rijksoverheid", url: "https://www.rijksoverheid.nl", beschrijving: "Wetgeving en regelingen" },
  { naam: "Zorgwijzer", url: "https://www.zorgwijzer.nl", beschrijving: "Informatie over zorg en verzekeringen" },
  { naam: "Het Mantelzorgforum", url: "https://www.mantelzorgforum.nl", beschrijving: "Ervaringen en tips" },
  { naam: "Vilans", url: "https://www.vilans.nl", beschrijving: "Kennisorganisatie langdurige zorg" },
  { naam: "Movisie", url: "https://www.movisie.nl", beschrijving: "Kennis en advies sociaal domein" },
  { naam: "SCP", url: "https://www.scp.nl", beschrijving: "Sociaal en Cultureel Planbureau - onderzoek" },
  { naam: "Zorg voor Beter", url: "https://www.zorgvoorbeter.nl", beschrijving: "Kwaliteitsverbetering zorg" },
]

async function zoekOnline(onderwerp?: string) {
  const anthropic = getAnthropic()

  // Haal huidige content op voor gap-analyse
  const [categorieStats, bestaandeArtikelen, subHoofdstukken] = await Promise.all([
    prisma.artikel.groupBy({
      by: ["categorie"],
      where: { isActief: true },
      _count: true,
    }),
    prisma.artikel.findMany({
      where: { isActief: true },
      select: { titel: true, categorie: true, subHoofdstuk: true },
      orderBy: { updatedAt: "desc" },
      take: 100,
    }),
    haalSubHoofdstukken(),
  ])

  const bestaandeTitels = bestaandeArtikelen.map((a) => a.titel).join("\n- ")

  const { text } = await generateText({
    model: anthropic("claude-sonnet-4-20250514"),
    maxOutputTokens: 4000,
    system: `Je bent een content-researcher voor MantelBuddy.
Je zoekt naar relevante, actuele informatie voor mantelzorgers in Nederland.

${MANTELZORG_CONTEXT}

BETROUWBARE BRONNEN (gebruik deze als referentie):
${TRUSTED_SOURCES.map((s) => `- ${s.naam} (${s.url}): ${s.beschrijving}`).join("\n")}

REGELS:
- Schrijf in het Nederlands
- Zoek naar actuele, relevante onderwerpen voor mantelzorgers
- Verwijs naar specifieke pagina's en bronnen
- Stel concrete artikelen voor met titel, categorie, subhoofdstuk en korte inhoud
- Vermijd onderwerpen die al gedekt zijn (zie bestaande titels)
- Focus op praktisch bruikbare informatie
- Geef per voorstel aan: bron-URL, waarom het relevant is, doelgroep
- Gebruik JSON-format voor de voorstellen zodat ze makkelijk verwerkt kunnen worden`,
    prompt: `${onderwerp ? `SPECIFIEK ONDERWERP: "${onderwerp}"\n\nZoek relevante online bronnen over dit onderwerp voor mantelzorgers.` : "Zoek naar relevante, nieuwe content voor mantelzorgers op basis van actuele trends en hiaten in de kennisbank."}

HUIDIGE KENNISBANK:
- Categorieën: ${JSON.stringify(categorieStats.map((c) => `${c.categorie} (${c._count}x)`))}
- Subhoofdstukken: ${JSON.stringify(subHoofdstukken.map((s) => `${s.categorie}/${s.subHoofdstuk} (${s.aantal}x)`))}

BESTAANDE ARTIKELEN (vermijd overlap):
- ${bestaandeTitels}

Geef:
1. **Analyse** van actuele trends en relevante onderwerpen voor mantelzorgers
2. **Gevonden bronnen**: lijst van 5-10 specifieke webpagina's/artikelen die relevant zijn
3. **Artikel-voorstellen**: 5-8 concrete voorstellen in dit JSON-format per voorstel:

\`\`\`json
{
  "titel": "Titel van het artikel",
  "beschrijving": "Korte beschrijving (1-2 zinnen)",
  "categorie": "dagelijks-zorgen|zelfzorg-balans|rechten-regelingen|geld-financien|hulpmiddelen-technologie|werk-mantelzorg|samenwerken-netwerk",
  "subHoofdstuk": "relevant sub-hoofdstuk of null",
  "tags": ["relevante-tag-slugs"],
  "bronUrl": "https://...",
  "bronNaam": "Naam van de bron",
  "relevantie": "Waarom is dit relevant",
  "inhoudSamenvatting": "Korte samenvatting van wat het artikel moet bevatten"
}
\`\`\`

4. **Prioritering**: welke artikelen zijn het meest urgent/impactvol`,
  })

  // Probeer JSON-voorstellen uit de tekst te halen
  const jsonBlokken = text.match(/```json\s*([\s\S]*?)```/g) || []
  let voorstellen: unknown[] = []
  for (const blok of jsonBlokken) {
    try {
      const json = blok.replace(/```json\s*/, "").replace(/```/, "").trim()
      // Kan een enkel object of een array zijn
      const parsed = JSON.parse(json.startsWith("[") ? json : `[${json}]`)
      voorstellen = voorstellen.concat(parsed)
    } catch {
      // JSON parsing mislukt, niet erg — tekst bevat de info
    }
  }

  return {
    type: "zoek-online",
    aantalVoorstellen: voorstellen.length,
    bronnen: TRUSTED_SOURCES.map((s) => s.naam),
    voorstellen,
    analyse: text,
  }
}

// ── Artikel genereren ──────────────────────────────────────────────

async function genereerArtikel(onderwerp: string, categorie?: string, tags?: string[], opslaan = false) {
  const anthropic = getAnthropic()
  const [beschikbareCategorieen, subHoofdstukken, beschikbareTags] = await Promise.all([
    haalCategorieen(),
    haalSubHoofdstukken(),
    haalTags(),
  ])

  const { text } = await generateText({
    model: anthropic("claude-sonnet-4-20250514"),
    maxOutputTokens: 4000,
    system: `Je bent een content-schrijver voor MantelBuddy.
Je schrijft informatieve, praktische artikelen voor mantelzorgers.

${MANTELZORG_CONTEXT}

BESCHIKBARE CATEGORIEËN: ${beschikbareCategorieen.join(", ")}
SUBHOOFDSTUKKEN: ${JSON.stringify(subHoofdstukken)}
BESCHIKBARE TAGS: ${JSON.stringify(beschikbareTags)}

SCHRIJFREGELS:
- Schrijf op B1-taalniveau: korte zinnen (max 15-20 woorden), eenvoudige woorden
- Gebruik "je" en "jij" om de lezer aan te spreken
- Geef concrete, praktische tips en voorbeelden
- Gebruik een warme maar zakelijke toon
- Structureer met duidelijke kopjes
- Voeg een korte samenvatting/beschrijving toe (max 2 zinnen)
- Geef het artikel als HTML (gebruik <h2>, <h3>, <p>, <ul>, <li>, <strong>)
- GEEN <h1> gebruiken (die wordt apart getoond)
- Verwijs waar mogelijk naar betrouwbare bronnen
- Kies relevante tags (aandoeningen en/of situaties) die bij het artikel passen

ANTWOORD IN JSON-FORMAT:
\`\`\`json
{
  "titel": "...",
  "beschrijving": "Korte beschrijving (1-2 zinnen, max 200 tekens)",
  "inhoud": "<h2>...</h2><p>...</p>...",
  "categorie": "een van de beschikbare categorieën",
  "subHoofdstuk": "passend subhoofdstuk of null",
  "tags": ["tag-slug1", "tag-slug2"]
}
\`\`\``,
    prompt: `Schrijf een volledig artikel over het volgende onderwerp:

ONDERWERP: "${onderwerp}"
${categorie ? `GEWENSTE CATEGORIE: ${categorie}` : "Kies zelf de meest passende categorie."}
${tags && tags.length > 0 ? `GEWENSTE TAGS: ${tags.join(", ")}` : ""}

Het artikel moet:
- Minimaal 400 woorden bevatten
- Praktisch bruikbaar zijn voor mantelzorgers
- Op B1-taalniveau geschreven zijn
- Goed gestructureerd zijn met kopjes
- Concrete tips en voorbeelden bevatten
- Waar relevant verwijzen naar hulpinstanties of regelingen`,
  })

  // Parse het JSON-resultaat
  let artikel = null
  const jsonMatch = text.match(/```json\s*([\s\S]*?)```/)
  if (jsonMatch) {
    try {
      artikel = JSON.parse(jsonMatch[1].trim())
    } catch {
      // Fallback: probeer de hele tekst als JSON
    }
  }

  // Optioneel opslaan in de database
  let opgeslagen = false
  let artikelId = null
  if (opslaan && artikel) {
    try {
      const created = await prisma.artikel.create({
        data: {
          titel: artikel.titel,
          beschrijving: artikel.beschrijving,
          inhoud: artikel.inhoud,
          categorie: artikel.categorie || "dagelijks-zorgen",
          subHoofdstuk: artikel.subHoofdstuk || null,
          type: "ARTIKEL",
          status: "CONCEPT",
          bron: "AI Content Agent",
          isActief: true,
        },
      })
      artikelId = created.id
      opgeslagen = true

      // Tags koppelen
      const artikelTags: string[] = artikel.tags || tags || []
      if (artikelTags.length > 0) {
        const bestaandeTags = await prisma.contentTag.findMany({
          where: { slug: { in: artikelTags }, isActief: true },
          select: { id: true },
        })
        if (bestaandeTags.length > 0) {
          await prisma.artikelTag.createMany({
            data: bestaandeTags.map((t) => ({ artikelId: created.id, tagId: t.id })),
            skipDuplicates: true,
          })
        }
      }

      // Genereer embedding
      if (process.env.OPENAI_API_KEY) {
        try {
          const embeddingText = artikelToEmbeddingText({
            titel: artikel.titel,
            beschrijving: artikel.beschrijving,
            inhoud: artikel.inhoud,
            categorie: artikel.categorie,
          })
          const embedding = await generateEmbedding(embeddingText)
          await prisma.$executeRawUnsafe(
            `UPDATE "Artikel" SET embedding = '${toVectorSql(embedding)}'::vector WHERE id = $1`,
            created.id
          )
        } catch (embErr) {
          console.warn("[Content Agent] Embedding generatie mislukt:", embErr)
        }
      }
    } catch (dbErr) {
      console.error("[Content Agent] Opslaan mislukt:", dbErr)
    }
  }

  return {
    type: "genereer",
    onderwerp,
    artikel,
    opgeslagen,
    artikelId,
    volledigeTekst: text,
  }
}

// ── Artikel herschrijven ───────────────────────────────────────────

async function herschrijfArtikel(artikelId: string, instructies?: string) {
  const anthropic = getAnthropic()

  const artikel = await prisma.artikel.findUnique({
    where: { id: artikelId },
    select: {
      id: true,
      titel: true,
      beschrijving: true,
      inhoud: true,
      categorie: true,
      subHoofdstuk: true,
      type: true,
      bron: true,
      tags: {
        select: { tag: { select: { slug: true, naam: true, type: true } } },
      },
    },
  })

  if (!artikel) {
    return { type: "herschrijf", error: "Artikel niet gevonden" }
  }

  const plainInhoud = artikel.inhoud
    ? artikel.inhoud.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
    : ""

  const { text } = await generateText({
    model: anthropic("claude-sonnet-4-20250514"),
    maxOutputTokens: 4000,
    system: `Je bent een content-editor voor MantelBuddy.
Je herschrijft bestaande artikelen om ze beter, leesbaarder en relevanter te maken.

${MANTELZORG_CONTEXT}

HERSCHRIJFREGELS:
- Behoud de kernboodschap en het onderwerp
- Schrijf op B1-taalniveau: korte zinnen (max 15-20 woorden), eenvoudige woorden
- Gebruik "je" en "jij" om de lezer aan te spreken
- Voeg concrete, praktische tips toe waar die ontbreken
- Verbeter de structuur met duidelijke kopjes (<h2>, <h3>)
- Maak de beschrijving aantrekkelijk en duidelijk (max 200 tekens)
- Verwijder jargon, vaktaal en te lange zinnen
- Voeg waar nodig voorbeelden of stappen toe
- Geef de output als HTML (geen <h1>)

ANTWOORD IN JSON-FORMAT:
\`\`\`json
{
  "titel": "Nieuwe of verbeterde titel",
  "beschrijving": "Verbeterde beschrijving (max 200 tekens)",
  "inhoud": "<h2>...</h2><p>...</p>...",
  "wijzigingen": ["Wijziging 1", "Wijziging 2"],
  "taalniveauVerbetering": "Beschrijving van taalniveau-verbeteringen"
}
\`\`\``,
    prompt: `Herschrijf het volgende artikel:

HUIDIGE VERSIE:
- Titel: ${artikel.titel}
- Beschrijving: ${artikel.beschrijving}
- Categorie: ${artikel.categorie}
- Tags: ${artikel.tags.map((t) => t.tag.naam).join(", ") || "geen"}
- Inhoud: ${plainInhoud}

${instructies ? `SPECIFIEKE INSTRUCTIES: ${instructies}` : "Verbeter het artikel op alle fronten: B1-taalniveau, structuur, volledigheid en praktische bruikbaarheid."}

Herschrijf het artikel volledig en geef aan welke wijzigingen je hebt gemaakt.`,
  })

  // Parse resultaat
  let herschreven = null
  const jsonMatch = text.match(/```json\s*([\s\S]*?)```/)
  if (jsonMatch) {
    try {
      herschreven = JSON.parse(jsonMatch[1].trim())
    } catch {
      // Fallback
    }
  }

  return {
    type: "herschrijf",
    artikelId: artikel.id,
    origineel: {
      titel: artikel.titel,
      beschrijving: artikel.beschrijving,
    },
    herschreven,
    volledigeTekst: text,
  }
}

// ── Artikel verrijken ──────────────────────────────────────────────

async function verrijkArtikel(artikelId: string) {
  const anthropic = getAnthropic()

  const artikel = await prisma.artikel.findUnique({
    where: { id: artikelId },
    select: {
      id: true,
      titel: true,
      beschrijving: true,
      inhoud: true,
      categorie: true,
      subHoofdstuk: true,
    },
  })

  if (!artikel) {
    return { type: "verrijk", error: "Artikel niet gevonden" }
  }

  // Zoek gerelateerde artikelen voor cross-referencing
  let gerelateerd: { titel: string; id: string }[] = []
  if (process.env.OPENAI_API_KEY && artikel.inhoud) {
    try {
      const embeddingText = artikelToEmbeddingText({
        titel: artikel.titel,
        beschrijving: artikel.beschrijving,
        inhoud: artikel.inhoud,
        categorie: artikel.categorie,
      })
      const embedding = await generateEmbedding(embeddingText)
      gerelateerd = await prisma.$queryRawUnsafe<{ titel: string; id: string }[]>(`
        SELECT id, titel
        FROM "Artikel"
        WHERE id != $1
          AND "isActief" = true
          AND embedding IS NOT NULL
        ORDER BY embedding <=> '${toVectorSql(embedding)}'::vector
        LIMIT 5
      `, artikelId)
    } catch {
      // Vector search mislukt, niet erg
    }
  }

  // Zoek hulpbronnen in dezelfde categorie
  const hulpbronnen = await prisma.zorgorganisatie.findMany({
    where: {
      isActief: true,
      onderdeelTest: { contains: artikel.categorie },
    },
    select: { naam: true, dienst: true, website: true },
    take: 5,
  })

  const plainInhoud = artikel.inhoud
    ? artikel.inhoud.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
    : ""

  const { text } = await generateText({
    model: anthropic("claude-sonnet-4-20250514"),
    maxOutputTokens: 4000,
    system: `Je bent een content-verrijker voor MantelBuddy.
Je voegt diepgang, bronnen, tips en verwijzingen toe aan bestaande artikelen.

${MANTELZORG_CONTEXT}

VERRIJKINGSREGELS:
- Behoud de bestaande tekst als basis
- Voeg extra secties toe waar waarde wordt toegevoegd:
  - Praktische tips (stap-voor-stap)
  - Veelgestelde vragen (FAQ)
  - Ervaringen of voorbeelden
  - Verwijzingen naar hulporganisaties
  - Links naar gerelateerde artikelen op het platform
  - Wettelijke rechten of regelingen die relevant zijn
- Blijf schrijven op B1-taalniveau
- Geef output als HTML
- Markeer nieuwe secties duidelijk

ANTWOORD IN JSON-FORMAT:
\`\`\`json
{
  "inhoud": "<h2>...</h2><p>...</p>... (volledige verrijkte versie)",
  "toegevoegdeSecties": ["Sectie 1", "Sectie 2"],
  "aantalWoordenToegevoegd": 123,
  "gerelateerdeArtikelen": ["Titel 1", "Titel 2"],
  "externeBronnen": [{"naam": "...", "url": "..."}]
}
\`\`\``,
    prompt: `Verrijk het volgende artikel met meer diepgang, tips en verwijzingen:

ARTIKEL:
- Titel: ${artikel.titel}
- Beschrijving: ${artikel.beschrijving}
- Categorie: ${artikel.categorie}
- Huidige inhoud: ${plainInhoud}

GERELATEERDE ARTIKELEN OP HET PLATFORM:
${gerelateerd.length > 0 ? gerelateerd.map((a) => `- ${a.titel}`).join("\n") : "Geen gevonden"}

RELEVANTE HULPBRONNEN:
${hulpbronnen.length > 0 ? hulpbronnen.map((h) => `- ${h.naam}: ${h.dienst || ""} ${h.website ? `(${h.website})` : ""}`).join("\n") : "Geen gevonden"}

Voeg waardevolle secties toe aan dit artikel. Denk aan: praktische tips, FAQ, voorbeelden, verwijzingen naar hulp.`,
  })

  let verrijking = null
  const jsonMatch = text.match(/```json\s*([\s\S]*?)```/)
  if (jsonMatch) {
    try {
      verrijking = JSON.parse(jsonMatch[1].trim())
    } catch {
      // Fallback
    }
  }

  return {
    type: "verrijk",
    artikelId: artikel.id,
    artikel: { titel: artikel.titel, categorie: artikel.categorie },
    gerelateerdeArtikelen: gerelateerd.map((a) => a.titel),
    hulpbronnen: hulpbronnen.map((h) => h.naam),
    verrijking,
    volledigeTekst: text,
  }
}

// ── Bulk categoriseren en opslaan ──────────────────────────────────

async function categoriseerBulk(limiet: number) {
  const anthropic = getAnthropic()
  const beschikbareCategorieen = await haalCategorieen()
  const subHoofdstukken = await haalSubHoofdstukken()

  // Haal artikelen op die mogelijk verkeerd gecategoriseerd zijn
  const artikelen = await prisma.artikel.findMany({
    where: { isActief: true },
    orderBy: { updatedAt: "desc" },
    take: limiet,
    select: {
      id: true,
      titel: true,
      beschrijving: true,
      inhoud: true,
      categorie: true,
      subHoofdstuk: true,
      tags: {
        select: { tag: { select: { slug: true, naam: true } } },
      },
    },
  })

  if (artikelen.length === 0) {
    return { type: "categoriseer-bulk", aantalItems: 0, analyse: "Geen artikelen gevonden." }
  }

  const artikelData = artikelen.map((a) => ({
    id: a.id,
    titel: a.titel,
    beschrijving: a.beschrijving,
    inhoud: a.inhoud ? a.inhoud.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 300) : null,
    categorie: a.categorie,
    subHoofdstuk: a.subHoofdstuk,
    tags: a.tags.map((at) => at.tag.slug),
  }))

  const { text } = await generateText({
    model: anthropic("claude-sonnet-4-20250514"),
    maxOutputTokens: 3000,
    system: `Je bent een categorisatie-specialist voor MantelBuddy.
Je analyseert artikelen en stelt correcte categorieën voor.

${MANTELZORG_CONTEXT}

BESCHIKBARE CATEGORIEËN: ${beschikbareCategorieen.join(", ")}
SUBHOOFDSTUKKEN: ${JSON.stringify(subHoofdstukken)}

REGELS:
- Analyseer elk artikel op basis van titel, beschrijving en inhoud
- Stel de juiste categorie, subhoofdstuk en tags voor
- Geef ALLEEN wijzigingen als de huidige categorisering NIET klopt
- Antwoord in JSON-format zodat wijzigingen automatisch doorgevoerd kunnen worden

ANTWOORD FORMAT:
\`\`\`json
{
  "wijzigingen": [
    {
      "id": "artikel-id",
      "titel": "Titel van het artikel",
      "huidigeCategorie": "...",
      "nieuweCategorie": "...",
      "huidigSubHoofdstuk": "... of null",
      "nieuwSubHoofdstuk": "... of null",
      "nieuweTags": ["tag-slug1", "tag-slug2"],
      "reden": "Korte uitleg waarom"
    }
  ],
  "geenWijziging": 12,
  "samenvatting": "Korte samenvatting van de bevindingen"
}
\`\`\``,
    prompt: `Analyseer en hercategoriseer de volgende ${artikelData.length} artikelen.

ARTIKELEN:
${JSON.stringify(artikelData, null, 2)}

Geef voor elk artikel aan of de categorisering correct is. Als die niet klopt, geef de juiste waarden.`,
  })

  // Parse wijzigingen
  let wijzigingen: Array<{
    id: string
    titel: string
    nieuweCategorie?: string
    nieuwSubHoofdstuk?: string | null
    nieuwNiveau?: string
    reden: string
  }> = []
  let parseResult = null
  const jsonMatch = text.match(/```json\s*([\s\S]*?)```/)
  if (jsonMatch) {
    try {
      parseResult = JSON.parse(jsonMatch[1].trim())
      wijzigingen = parseResult.wijzigingen || []
    } catch {
      // JSON parsing mislukt
    }
  }

  return {
    type: "categoriseer-bulk",
    aantalItems: artikelen.length,
    aantalWijzigingen: wijzigingen.length,
    wijzigingen,
    samenvatting: parseResult?.samenvatting || null,
    analyse: text,
  }
}

// ── Wijzigingen toepassen (aparte actie) ───────────────────────────

async function pasWijzigingenToe(wijzigingen: Array<{
  id: string
  nieuweCategorie?: string
  nieuwSubHoofdstuk?: string | null
  nieuweTags?: string[]
}>) {
  const resultaten = []

  for (const w of wijzigingen) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updateData: Record<string, any> = {}
      if (w.nieuweCategorie) updateData.categorie = w.nieuweCategorie
      if (w.nieuwSubHoofdstuk !== undefined) updateData.subHoofdstuk = w.nieuwSubHoofdstuk

      if (Object.keys(updateData).length > 0) {
        await prisma.artikel.update({
          where: { id: w.id },
          data: updateData,
        })
        resultaten.push({ id: w.id, status: "bijgewerkt" })
      } else {
        resultaten.push({ id: w.id, status: "geen-wijzigingen" })
      }
    } catch (err) {
      resultaten.push({ id: w.id, status: "fout", error: String(err) })
    }
  }

  return {
    type: "toepassen",
    aantalVerwerkt: resultaten.filter((r) => r.status === "bijgewerkt").length,
    aantalFouten: resultaten.filter((r) => r.status === "fout").length,
    resultaten,
  }
}

// ── Herschrijving toepassen ────────────────────────────────────────

async function pasHerschrijvingToe(artikelId: string, data: {
  titel?: string
  beschrijving?: string
  inhoud?: string
}) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: Record<string, any> = {}
    if (data.titel) updateData.titel = data.titel
    if (data.beschrijving) updateData.beschrijving = data.beschrijving
    if (data.inhoud) updateData.inhoud = data.inhoud

    if (Object.keys(updateData).length === 0) {
      return { type: "toepassen-herschrijving", status: "geen-wijzigingen" }
    }

    await prisma.artikel.update({
      where: { id: artikelId },
      data: updateData,
    })

    // Regenereer embedding
    if (process.env.OPENAI_API_KEY) {
      try {
        const artikel = await prisma.artikel.findUnique({
          where: { id: artikelId },
          select: { titel: true, beschrijving: true, inhoud: true, categorie: true },
        })
        if (artikel) {
          const embeddingText = artikelToEmbeddingText(artikel)
          const embedding = await generateEmbedding(embeddingText)
          await prisma.$executeRawUnsafe(
            `UPDATE "Artikel" SET embedding = '${toVectorSql(embedding)}'::vector WHERE id = $1`,
            artikelId
          )
        }
      } catch (embErr) {
        console.warn("[Content Agent] Embedding regeneratie mislukt:", embErr)
      }
    }

    return { type: "toepassen-herschrijving", status: "bijgewerkt", artikelId }
  } catch (err) {
    return { type: "toepassen-herschrijving", status: "fout", error: String(err) }
  }
}

// ── Hiaten-analyse ──────────────────────────────────────────────────

async function hiatenAnalyse() {
  const anthropic = getAnthropic()

  const [categorieen, beschikbareTags, artikelen] = await Promise.all([
    haalCategorieen(),
    haalTags(),
    prisma.artikel.findMany({
      where: { isActief: true },
      select: {
        id: true,
        categorie: true,
        tags: {
          select: { tag: { select: { slug: true, type: true } } },
        },
      },
    }),
  ])

  // Bouw matrix: categorie × tag → aantal artikelen
  const alleTags = [...beschikbareTags.aandoeningen, ...beschikbareTags.situaties]
  const matrix: Record<string, Record<string, number>> = {}

  for (const cat of categorieen) {
    matrix[cat] = {}
    for (const tag of alleTags) {
      matrix[cat][tag.slug] = 0
    }
  }

  for (const artikel of artikelen) {
    const cat = artikel.categorie
    if (!matrix[cat]) continue
    const artikelTagSlugs = artikel.tags.map((at) => at.tag.slug)
    for (const slug of artikelTagSlugs) {
      if (matrix[cat][slug] !== undefined) {
        matrix[cat][slug]++
      }
    }
  }

  // Bereken totalen per categorie en per tag
  const categorieAantallen: Record<string, number> = {}
  for (const cat of categorieen) {
    categorieAantallen[cat] = artikelen.filter((a) => a.categorie === cat).length
  }

  const tagAantallen: Record<string, number> = {}
  for (const tag of alleTags) {
    tagAantallen[tag.slug] = artikelen.filter((a) =>
      a.tags.some((at) => at.tag.slug === tag.slug)
    ).length
  }

  // Gebruik AI om hiaten te analyseren en prioriteiten voor te stellen
  const { text } = await generateText({
    model: anthropic("claude-sonnet-4-20250514"),
    maxOutputTokens: 3000,
    system: `Je bent een content-strateeg voor MantelBuddy.
Je analyseert de dekking van content per categorie en per aandoening/situatie-tag.

${MANTELZORG_CONTEXT}

Je krijgt een matrix van categorie × tag met aantallen artikelen.
Analyseer de hiaten en stel prioriteiten voor welke combinaties artikelen nodig hebben.`,
    prompt: `Analyseer de volgende content-dekkingsmatrix:

MATRIX (categorie × tag → aantal artikelen):
${JSON.stringify(matrix, null, 2)}

TOTALEN PER CATEGORIE: ${JSON.stringify(categorieAantallen)}
TOTALEN PER TAG: ${JSON.stringify(tagAantallen)}
TOTAAL ARTIKELEN: ${artikelen.length}

Geef:
1. **Hiaten**: welke categorie × tag combinaties hebben 0 of weinig artikelen?
2. **Prioriteiten**: top 10 artikelen die geschreven moeten worden (categorie + tag + onderwerp)
3. **Samenvatting**: hoe evenwichtig is de content-dekking?

Antwoord in JSON:
\`\`\`json
{
  "hiaten": [{"categorie": "...", "tag": "...", "aantal": 0}],
  "prioriteiten": [{"categorie": "...", "tag": "...", "onderwerp": "Titel voorstel"}],
  "samenvatting": "..."
}
\`\`\``,
  })

  let analyse = null
  const jsonMatch = text.match(/```json\s*([\s\S]*?)```/)
  if (jsonMatch) {
    try { analyse = JSON.parse(jsonMatch[1].trim()) } catch { /* */ }
  }

  return {
    type: "hiaten-analyse",
    matrix,
    categorieAantallen,
    tagAantallen,
    totaalArtikelen: artikelen.length,
    analyse,
    volledigeTekst: text,
  }
}

// ── Batch genereren ──────────────────────────────────────────────────

async function batchGenereer(
  voorstellen: Array<{ onderwerp: string; categorie?: string; tags?: string[] }>,
  opslaan: boolean
) {
  const resultaten = []

  for (const voorstel of voorstellen) {
    try {
      const resultaat = await genereerArtikel(
        voorstel.onderwerp,
        voorstel.categorie,
        voorstel.tags,
        opslaan
      )
      resultaten.push({
        ...resultaat,
        onderwerp: voorstel.onderwerp,
        status: "succes",
      })
    } catch (err) {
      resultaten.push({
        onderwerp: voorstel.onderwerp,
        status: "fout",
        error: String(err),
      })
    }
  }

  return {
    type: "batch-genereer",
    aantalVoorstellen: voorstellen.length,
    aantalSucces: resultaten.filter((r) => r.status === "succes").length,
    aantalFouten: resultaten.filter((r) => r.status === "fout").length,
    resultaten,
  }
}

// ── Route handler ──────────────────────────────────────────────────

export async function POST(req: Request) {
  const session = await checkAdminAccess()
  if (!session) {
    return NextResponse.json({ error: "Niet geautoriseerd" }, { status: 403 })
  }

  try {
    const body = await req.json()
    const {
      type,
      onderwerp,
      artikelId,
      categorie,
      tags: requestTags,
      limiet = 20,
      opslaan = false,
      wijzigingen: wijzigingenData,
      herschrijving,
      voorstellen,
    } = body as {
      type: "zoek-online" | "genereer" | "herschrijf" | "verrijk" | "categoriseer-bulk" | "toepassen" | "toepassen-herschrijving" | "hiaten-analyse" | "batch-genereer"
      onderwerp?: string
      artikelId?: string
      categorie?: string
      tags?: string[]
      limiet?: number
      opslaan?: boolean
      wijzigingen?: Array<{ id: string; nieuweCategorie?: string; nieuwSubHoofdstuk?: string | null; nieuweTags?: string[] }>
      herschrijving?: { titel?: string; beschrijving?: string; inhoud?: string }
      voorstellen?: Array<{ onderwerp: string; categorie?: string; tags?: string[] }>
    }

    const effectiefLimiet = Math.min(Math.max(limiet, 1), 50)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let resultaat: Record<string, any>

    switch (type) {
      case "zoek-online":
        resultaat = await zoekOnline(onderwerp)
        break

      case "genereer":
        if (!onderwerp) {
          return NextResponse.json({ error: "Onderwerp is verplicht voor genereren" }, { status: 400 })
        }
        resultaat = await genereerArtikel(onderwerp, categorie, requestTags, opslaan)
        break

      case "herschrijf":
        if (!artikelId) {
          return NextResponse.json({ error: "artikelId is verplicht voor herschrijven" }, { status: 400 })
        }
        resultaat = await herschrijfArtikel(artikelId, onderwerp)
        break

      case "verrijk":
        if (!artikelId) {
          return NextResponse.json({ error: "artikelId is verplicht voor verrijken" }, { status: 400 })
        }
        resultaat = await verrijkArtikel(artikelId)
        break

      case "categoriseer-bulk":
        resultaat = await categoriseerBulk(effectiefLimiet)
        break

      case "toepassen":
        if (!wijzigingenData || wijzigingenData.length === 0) {
          return NextResponse.json({ error: "Geen wijzigingen om toe te passen" }, { status: 400 })
        }
        resultaat = await pasWijzigingenToe(wijzigingenData)
        break

      case "toepassen-herschrijving":
        if (!artikelId || !herschrijving) {
          return NextResponse.json({ error: "artikelId en herschrijving zijn verplicht" }, { status: 400 })
        }
        resultaat = await pasHerschrijvingToe(artikelId, herschrijving)
        break

      case "hiaten-analyse":
        resultaat = await hiatenAnalyse()
        break

      case "batch-genereer":
        if (!voorstellen || voorstellen.length === 0) {
          return NextResponse.json({ error: "Voorstellen zijn verplicht voor batch-genereer" }, { status: 400 })
        }
        resultaat = await batchGenereer(voorstellen, opslaan)
        break

      default:
        return NextResponse.json({ error: `Onbekend type: ${type}` }, { status: 400 })
    }

    await logAudit({
      userId: session.user.id!,
      actie: "AI_CONTENT_AGENT",
      entiteit: "ContentAgent",
      details: { type, onderwerp, artikelId, limiet: effectiefLimiet },
    })

    return NextResponse.json({
      success: true,
      ...resultaat,
    })
  } catch (error) {
    console.error("[Content Agent] Fout:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Content Agent mislukt" },
      { status: 500 }
    )
  }
}
