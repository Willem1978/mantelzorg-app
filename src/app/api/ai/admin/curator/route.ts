/**
 * Content Curator Agent — /api/ai/admin/curator
 *
 * AI-gestuurd content-curatieendpoint voor beheerders.
 *
 * Functies:
 *   - Review artikelen op kwaliteit en leesbaarheid
 *   - Auto-categorisering van artikelen
 *   - B1-taalniveau check en herschrijfsugesties
 *   - Duplicaten-detectie met vector similarity
 *
 * POST body:
 *   { type: "review" | "categoriseer" | "b1check" | "duplicaten" | "alles", limiet?: number }
 */
import { NextResponse } from "next/server"
import { createAnthropic } from "@ai-sdk/anthropic"
import { generateText } from "ai"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logAudit } from "@/lib/audit"
import { generateEmbedding, toVectorSql } from "@/lib/ai/embeddings"

export const maxDuration = 60

const ADMIN_ROLES = ["ADMIN", "GEMEENTE_ADMIN"] as const

async function checkAdminAccess() {
  const session = await auth()
  if (!session?.user?.id) return null
  const role = session.user.role as string
  if (!ADMIN_ROLES.includes(role as (typeof ADMIN_ROLES)[number])) return null
  return session
}

// ── Artikel data ophalen ────────────────────────────────────────────

interface ArtikelSamenvatting {
  id: string
  titel: string
  beschrijving: string
  inhoud: string | null
  categorie: string
  subHoofdstuk: string | null
  type: string
  status: string
  belastingNiveau: string
  bron: string | null
  gemeente: string | null
  datum: string
}

async function haalArtikelen(limiet: number, alleenGepubliceerd = false): Promise<ArtikelSamenvatting[]> {
  const artikelen = await prisma.artikel.findMany({
    where: {
      isActief: true,
      ...(alleenGepubliceerd ? { status: "GEPUBLICEERD" } : {}),
    },
    orderBy: { updatedAt: "desc" },
    take: limiet,
    select: {
      id: true,
      titel: true,
      beschrijving: true,
      inhoud: true,
      categorie: true,
      subHoofdstuk: true,
      type: true,
      status: true,
      belastingNiveau: true,
      bron: true,
      gemeente: true,
      updatedAt: true,
    },
  })

  return artikelen.map((a) => ({
    id: a.id,
    titel: a.titel,
    beschrijving: a.beschrijving,
    inhoud: a.inhoud ? a.inhoud.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 500) : null,
    categorie: a.categorie,
    subHoofdstuk: a.subHoofdstuk,
    type: a.type,
    status: a.status,
    belastingNiveau: a.belastingNiveau,
    bron: a.bron,
    gemeente: a.gemeente,
    datum: a.updatedAt.toLocaleDateString("nl-NL"),
  }))
}

// ── Review op kwaliteit/leesbaarheid ────────────────────────────────

async function reviewArtikelen(limiet: number) {
  const artikelen = await haalArtikelen(limiet)

  if (artikelen.length === 0) {
    return { type: "review", aantalItems: 0, analyse: "Geen artikelen gevonden om te reviewen." }
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return { type: "review", aantalItems: artikelen.length, analyse: "AI-analyse niet beschikbaar: ANTHROPIC_API_KEY niet geconfigureerd." }
  }

  const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const { text } = await generateText({
    model: anthropic("claude-sonnet-4-20250514"),
    maxOutputTokens: 2500,
    system: `Je bent een content-reviewer voor MantelBuddy, een platform voor mantelzorgers.
Je beoordeelt artikelen op kwaliteit, leesbaarheid en relevantie.

REGELS:
- Schrijf in het Nederlands, zakelijk en objectief
- Geef per artikel een beoordeling: GOED, VERBETEREN, of HERSCHRIJVEN
- Beoordeel op: volledigheid, leesbaarheid, relevantie voor mantelzorgers, actualiteit
- Let op: ontbrekende beschrijvingen, te korte of te lange teksten, verouderde info
- Controleer of de categorie en het belastingniveau logisch zijn
- Geef concrete verbeterpunten per artikel
- Gebruik markdown tabellen voor overzichten`,
    prompt: `Beoordeel de volgende ${artikelen.length} artikelen op kwaliteit en leesbaarheid.

ARTIKELEN:
${JSON.stringify(artikelen, null, 2)}

Geef:
1. Een overzichtstabel met per artikel: ID, titel, beoordeling (GOED/VERBETEREN/HERSCHRIJVEN), korte reden
2. Samenvatting van algemene patronen
3. Top 3 artikelen die het meest urgent aandacht nodig hebben`,
  })

  const aantalVerbeteren = (text.match(/VERBETEREN/g) || []).length
  const aantalHerschrijven = (text.match(/HERSCHRIJVEN/g) || []).length

  return {
    type: "review",
    aantalItems: artikelen.length,
    aantalVerbeteren,
    aantalHerschrijven,
    analyse: text,
  }
}

// ── Auto-categorisering ─────────────────────────────────────────────

async function categoriseerArtikelen(limiet: number) {
  const artikelen = await haalArtikelen(limiet)

  if (artikelen.length === 0) {
    return { type: "categoriseer", aantalItems: 0, analyse: "Geen artikelen gevonden om te categoriseren." }
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return { type: "categoriseer", aantalItems: artikelen.length, analyse: "AI-analyse niet beschikbaar: ANTHROPIC_API_KEY niet geconfigureerd." }
  }

  // Haal alle beschikbare categorieeen op
  const categorieenResult = await prisma.artikel.groupBy({
    by: ["categorie"],
    where: { isActief: true },
    _count: true,
  })
  const beschikbareCategorieen = categorieenResult.map((c: { categorie: string; _count: number }) => `${c.categorie} (${c._count} artikelen)`)

  const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const { text } = await generateText({
    model: anthropic("claude-sonnet-4-20250514"),
    maxOutputTokens: 2000,
    system: `Je bent een content-categorisatie specialist voor MantelBuddy, een platform voor mantelzorgers.
Je analyseert artikelen en beoordeelt of ze correct gecategoriseerd zijn.

BESCHIKBARE CATEGORIEËN:
${beschikbareCategorieen.join("\n")}

BELASTINGNIVEAUS:
- ALLE: geschikt voor iedereen
- LAAG: relevant bij lage belasting
- GEMIDDELD: relevant bij gemiddelde belasting
- HOOG: relevant bij hoge belasting

REGELS:
- Schrijf in het Nederlands, zakelijk en objectief
- Beoordeel per artikel of de huidige categorie correct is
- Stel een betere categorie voor als de huidige niet klopt
- Beoordeel ook of het belastingniveau correct is
- Let op artikelen zonder subhoofdstuk die er wel een nodig hebben
- Gebruik markdown tabellen voor overzichten`,
    prompt: `Beoordeel de categorisering van de volgende ${artikelen.length} artikelen.

ARTIKELEN:
${JSON.stringify(artikelen, null, 2)}

Geef:
1. Een overzichtstabel met: ID, titel, huidige categorie, voorgestelde categorie (als anders), huidige niveau, voorgesteld niveau (als anders)
2. Artikelen waarvan de categorie NIET klopt (met uitleg)
3. Artikelen die een sub-hoofdstuk nodig hebben`,
  })

  const aantalVerkeerd = (text.match(/voorgestelde categorie|NIET klopt|verkeerd/gi) || []).length

  return {
    type: "categoriseer",
    aantalItems: artikelen.length,
    aantalVerkeerdeCategorie: aantalVerkeerd,
    beschikbareCategorieen: categorieenResult.map((c) => c.categorie),
    analyse: text,
  }
}

// ── B1-taalniveau check ─────────────────────────────────────────────

async function b1Check(limiet: number) {
  const artikelen = await haalArtikelen(limiet)

  if (artikelen.length === 0) {
    return { type: "b1check", aantalItems: 0, analyse: "Geen artikelen gevonden om te controleren." }
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return { type: "b1check", aantalItems: artikelen.length, analyse: "AI-analyse niet beschikbaar: ANTHROPIC_API_KEY niet geconfigureerd." }
  }

  const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const { text } = await generateText({
    model: anthropic("claude-sonnet-4-20250514"),
    maxOutputTokens: 3000,
    system: `Je bent een taalniveau-specialist die teksten beoordeelt op B1-niveau (ERK/CEFR).
Je werkt voor MantelBuddy, een platform voor mantelzorgers. De doelgroep is divers en teksten moeten begrijpelijk zijn voor iedereen.

B1-TAALNIVEAU KENMERKEN:
- Korte, eenvoudige zinnen (max 15-20 woorden per zin)
- Veelgebruikte woorden, geen jargon of vaktaal
- Actieve zinsbouw (vermijd lijdende vorm)
- Directe aanspreking (je/jij)
- Concrete voorbeelden in plaats van abstracte begrippen
- Logische structuur met kopjes
- Geen bijzinnen met meer dan één verwijzing
- Geen figuurlijk taalgebruik of metaforen

REGELS:
- Schrijf in het Nederlands
- Geef per artikel een taalniveau-score: B1_OK, TE_MOEILIJK, of GRENSGEBIED
- Bij TE_MOEILIJK en GRENSGEBIED: geef concrete herschrijfsuggesties
- Markeer specifieke zinnen of woorden die te moeilijk zijn
- Geef per artikel een herschreven versie van de titel en beschrijving als die niet B1 zijn
- Gebruik markdown tabellen voor overzichten`,
    prompt: `Controleer de volgende ${artikelen.length} artikelen op B1-taalniveau.

ARTIKELEN:
${JSON.stringify(artikelen, null, 2)}

Geef:
1. Een overzichtstabel met: ID, titel, taalniveau (B1_OK/TE_MOEILIJK/GRENSGEBIED), belangrijkste probleem
2. Per artikel dat TE_MOEILIJK of GRENSGEBIED is:
   - Welke woorden/zinnen zijn te moeilijk
   - Herschrijfsuggestie voor titel en beschrijving
3. Samenvatting: hoeveel procent voldoet aan B1`,
  })

  const aantalTeMoeilijk = (text.match(/TE_MOEILIJK/g) || []).length
  const aantalGrensgebied = (text.match(/GRENSGEBIED/g) || []).length

  return {
    type: "b1check",
    aantalItems: artikelen.length,
    aantalTeMoeilijk,
    aantalGrensgebied,
    aantalB1Ok: artikelen.length - aantalTeMoeilijk - aantalGrensgebied,
    analyse: text,
  }
}

// ── Duplicaten-detectie met vector similarity ───────────────────────

interface DuplicaatPaar {
  artikel1Id: string
  artikel1Titel: string
  artikel2Id: string
  artikel2Titel: string
  similarity: number
}

async function detecteerDuplicaten(limiet: number) {
  // Haal artikelen op die een embedding hebben
  const artikelen = await prisma.artikel.findMany({
    where: { isActief: true },
    orderBy: { updatedAt: "desc" },
    take: limiet,
    select: {
      id: true,
      titel: true,
      beschrijving: true,
      categorie: true,
      status: true,
    },
  })

  if (artikelen.length < 2) {
    return { type: "duplicaten", aantalItems: artikelen.length, analyse: "Niet genoeg artikelen voor duplicaten-detectie (minimaal 2 nodig)." }
  }

  // Probeer vector similarity via pgvector
  let duplicaten: DuplicaatPaar[] = []
  let methode: "vector" | "ai" = "vector"

  if (process.env.OPENAI_API_KEY) {
    try {
      // Gebruik pgvector om paren met hoge similarity te vinden
      duplicaten = await prisma.$queryRawUnsafe<DuplicaatPaar[]>(`
        SELECT
          a1.id as "artikel1Id",
          a1.titel as "artikel1Titel",
          a2.id as "artikel2Id",
          a2.titel as "artikel2Titel",
          1 - (a1.embedding <=> a2.embedding) as similarity
        FROM "Artikel" a1
        CROSS JOIN "Artikel" a2
        WHERE a1.id < a2.id
          AND a1."isActief" = true
          AND a2."isActief" = true
          AND a1.embedding IS NOT NULL
          AND a2.embedding IS NOT NULL
          AND 1 - (a1.embedding <=> a2.embedding) > 0.85
        ORDER BY similarity DESC
        LIMIT $1
      `, limiet)
    } catch (error) {
      console.warn("[Curator] Vector duplicaten-detectie mislukt, fallback naar AI:", error)
      methode = "ai"
    }
  } else {
    methode = "ai"
  }

  // Als vector search niet lukt of geen resultaten, gebruik AI voor analyse
  if (methode === "ai" || duplicaten.length === 0) {
    if (!process.env.ANTHROPIC_API_KEY) {
      return {
        type: "duplicaten",
        aantalItems: artikelen.length,
        analyse: "Duplicaten-detectie niet beschikbaar: ANTHROPIC_API_KEY en/of OPENAI_API_KEY niet geconfigureerd.",
      }
    }

    methode = "ai"
    const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const { text } = await generateText({
      model: anthropic("claude-sonnet-4-20250514"),
      maxOutputTokens: 2000,
      system: `Je bent een content-deduplicatie specialist voor MantelBuddy.
Je identificeert artikelen die (bijna) hetzelfde onderwerp behandelen en mogelijk samengevoegd of opgeruimd moeten worden.

REGELS:
- Schrijf in het Nederlands, zakelijk en objectief
- Identificeer paren/groepen artikelen met overlappende inhoud
- Beoordeel per paar: IDENTIEK (moet verwijderd), OVERLAP (moet samengevoegd), of GERELATEERD (ok, maar cross-link suggestie)
- Geef concrete acties per paar
- Gebruik markdown tabellen voor overzichten`,
      prompt: `Analyseer de volgende ${artikelen.length} artikelen op mogelijke duplicaten en overlap.

ARTIKELEN:
${JSON.stringify(artikelen, null, 2)}

Geef:
1. Een overzichtstabel met gevonden paren: artikel 1 (ID + titel), artikel 2 (ID + titel), type (IDENTIEK/OVERLAP/GERELATEERD)
2. Per paar: concrete actie (verwijderen, samenvoegen, cross-linken)
3. Samenvatting: hoeveel unieke artikelen, hoeveel overlap`,
    })

    return {
      type: "duplicaten",
      aantalItems: artikelen.length,
      methode: "ai-analyse",
      analyse: text,
    }
  }

  // Vector-resultaten formatteren met AI-duiding
  if (!process.env.ANTHROPIC_API_KEY) {
    return {
      type: "duplicaten",
      aantalItems: artikelen.length,
      methode: "vector",
      aantalDuplicaten: duplicaten.length,
      paren: duplicaten.map((d) => ({
        artikel1: `${d.artikel1Titel} (${d.artikel1Id})`,
        artikel2: `${d.artikel2Titel} (${d.artikel2Id})`,
        similarity: `${Math.round(d.similarity * 100)}%`,
      })),
      analyse: `${duplicaten.length} mogelijke duplicaatparen gevonden via vector similarity (>85%).`,
    }
  }

  const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const { text } = await generateText({
    model: anthropic("claude-sonnet-4-20250514"),
    maxOutputTokens: 1500,
    system: `Je bent een content-deduplicatie specialist voor MantelBuddy.
Je beoordeelt gevonden duplicaatparen op basis van vector similarity scores.

REGELS:
- Schrijf in het Nederlands, zakelijk en objectief
- Beoordeel elk paar: IDENTIEK (>95% - verwijderen), OVERLAP (85-95% - samenvoegen), GERELATEERD (< 85% - ok)
- Geef concrete acties per paar
- Gebruik markdown tabellen`,
    prompt: `Beoordeel de volgende ${duplicaten.length} duplicaatparen (gevonden via vector similarity).

DUPLICAAT PAREN:
${JSON.stringify(duplicaten.map((d) => ({
  artikel1: d.artikel1Titel,
  artikel1Id: d.artikel1Id,
  artikel2: d.artikel2Titel,
  artikel2Id: d.artikel2Id,
  similarity: `${Math.round(d.similarity * 100)}%`,
})), null, 2)}

Geef:
1. Overzichtstabel met beoordeling per paar
2. Concrete acties per paar
3. Samenvatting`,
  })

  return {
    type: "duplicaten",
    aantalItems: artikelen.length,
    methode: "vector",
    aantalDuplicaten: duplicaten.length,
    analyse: text,
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
    const { type = "alles", limiet = 20 } = body as {
      type?: "review" | "categoriseer" | "b1check" | "duplicaten" | "alles"
      limiet?: number
    }

    const effectiefLimiet = Math.min(Math.max(limiet, 1), 50)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const resultaten: Record<string, any> = {}

    if (type === "review" || type === "alles") {
      resultaten.review = await reviewArtikelen(effectiefLimiet)
    }

    if (type === "categoriseer" || type === "alles") {
      resultaten.categoriseer = await categoriseerArtikelen(effectiefLimiet)
    }

    if (type === "b1check" || type === "alles") {
      resultaten.b1check = await b1Check(effectiefLimiet)
    }

    if (type === "duplicaten" || type === "alles") {
      resultaten.duplicaten = await detecteerDuplicaten(effectiefLimiet)
    }

    await logAudit({
      userId: session.user.id!,
      actie: "AI_CURATOR",
      entiteit: "Curator",
      details: { type, limiet: effectiefLimiet },
    })

    return NextResponse.json({
      success: true,
      type,
      ...resultaten,
    })
  } catch (error) {
    console.error("[AI Curator] Fout:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Content curatie mislukt" },
      { status: 500 }
    )
  }
}
