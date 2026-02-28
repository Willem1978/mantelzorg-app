/**
 * Content Curator Agent — /api/ai/admin/curator
 *
 * AI-gestuurd content curatie endpoint voor beheerders.
 *
 * Functies:
 *   - Artikelen beoordelen op kwaliteit, B1-taalniveau en volledigheid
 *   - Ontbrekende content en hiaten in de kennisbank detecteren
 *   - Verbetervoorstellen genereren voor bestaande artikelen
 *
 * POST body:
 *   { type: "beoordeel" | "hiaten" | "verbeter", categorie?: string, limiet?: number }
 */
import { NextResponse } from "next/server"
import { createAnthropic } from "@ai-sdk/anthropic"
import { generateText } from "ai"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logAudit } from "@/lib/audit"

export const maxDuration = 60

const ADMIN_ROLES = ["ADMIN", "GEMEENTE_ADMIN"] as const

async function checkAdminAccess() {
  const session = await auth()
  if (!session?.user?.id) return null
  const role = session.user.role as string
  if (!ADMIN_ROLES.includes(role as (typeof ADMIN_ROLES)[number])) return null
  return session
}

// ── Artikel data ophalen ──────────────────────────────────────────

interface ArtikelSamenvatting {
  id: string
  titel: string
  beschrijving: string
  inhoudVoorbeeld: string | null
  categorie: string
  subHoofdstuk: string | null
  type: string
  status: string
  belastingNiveau: string
  bronLabel: string | null
  heeftInhoud: boolean
  heeftUrl: boolean
  heeftEmbedding: boolean
  woordenAantal: number
  aangemaakt: string
  bijgewerkt: string
}

async function haalArtikelen(
  limiet: number,
  categorie?: string
): Promise<ArtikelSamenvatting[]> {
  const artikelen = await prisma.artikel.findMany({
    where: {
      isActief: true,
      ...(categorie ? { categorie } : {}),
    },
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
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
      bronLabel: true,
      url: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  return artikelen.map((a) => {
    const plainInhoud = a.inhoud
      ? a.inhoud.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
      : null

    return {
      id: a.id,
      titel: a.titel,
      beschrijving: a.beschrijving,
      inhoudVoorbeeld: plainInhoud ? plainInhoud.slice(0, 300) : null,
      categorie: a.categorie,
      subHoofdstuk: a.subHoofdstuk,
      type: a.type,
      status: a.status,
      belastingNiveau: a.belastingNiveau,
      bronLabel: a.bronLabel,
      heeftInhoud: !!a.inhoud,
      heeftUrl: !!a.url,
      heeftEmbedding: false, // Embedding is Unsupported type, niet direct queryable
      woordenAantal: plainInhoud ? plainInhoud.split(/\s+/).length : 0,
      aangemaakt: a.createdAt.toLocaleDateString("nl-NL"),
      bijgewerkt: a.updatedAt.toLocaleDateString("nl-NL"),
    }
  })
}

// ── Content overzicht voor hiaatanalyse ──────────────────────────

interface ContentOverzicht {
  totaalArtikelen: number
  perCategorie: Record<string, number>
  perType: Record<string, number>
  perStatus: Record<string, number>
  perBelastingNiveau: Record<string, number>
  artikelenZonderInhoud: number
  artikelenZonderUrl: number
  concepten: number
  gearchiveerd: number
  categorieën: string[]
}

async function haalContentOverzicht(): Promise<ContentOverzicht> {
  const [
    totaal,
    perCategorie,
    perType,
    perStatus,
    perBelastingNiveau,
    zonderInhoud,
    zonderUrl,
  ] = await Promise.all([
    prisma.artikel.count({ where: { isActief: true } }),
    prisma.artikel.groupBy({
      by: ["categorie"],
      where: { isActief: true },
      _count: true,
    }),
    prisma.artikel.groupBy({
      by: ["type"],
      where: { isActief: true },
      _count: true,
    }),
    prisma.artikel.groupBy({
      by: ["status"],
      where: { isActief: true },
      _count: true,
    }),
    prisma.artikel.groupBy({
      by: ["belastingNiveau"],
      where: { isActief: true },
      _count: true,
    }),
    prisma.artikel.count({
      where: { isActief: true, inhoud: null },
    }),
    prisma.artikel.count({
      where: { isActief: true, url: null, inhoud: null },
    }),
  ])

  const toRecord = <T extends { _count: number }>(
    items: T[],
    key: keyof T
  ): Record<string, number> =>
    items.reduce(
      (acc, item) => ({ ...acc, [String(item[key])]: item._count }),
      {} as Record<string, number>
    )

  return {
    totaalArtikelen: totaal,
    perCategorie: toRecord(perCategorie, "categorie"),
    perType: toRecord(perType, "type"),
    perStatus: toRecord(perStatus, "status"),
    perBelastingNiveau: toRecord(perBelastingNiveau, "belastingNiveau"),
    artikelenZonderInhoud: zonderInhoud,
    artikelenZonderUrl: zonderUrl,
    concepten: perStatus.find((s) => s.status === "CONCEPT")?._count || 0,
    gearchiveerd: perStatus.find((s) => s.status === "GEARCHIVEERD")?._count || 0,
    categorieën: perCategorie.map((c) => c.categorie),
  }
}

// ── AI Beoordeling van artikelen ─────────────────────────────────

async function beoordeelArtikelen(limiet: number, categorie?: string) {
  const artikelen = await haalArtikelen(limiet, categorie)

  if (artikelen.length === 0) {
    return {
      aantalItems: 0,
      analyse: "Geen artikelen gevonden om te beoordelen.",
    }
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return {
      aantalItems: artikelen.length,
      data: artikelen,
      analyse: "AI-analyse niet beschikbaar: ANTHROPIC_API_KEY niet geconfigureerd.",
    }
  }

  const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const { text } = await generateText({
    model: anthropic("claude-sonnet-4-20250514"),
    maxOutputTokens: 2000,
    system: `Je bent een content curator voor MantelBuddy, een platform voor mantelzorgers in Nederland.
Je beoordeelt artikelen op kwaliteit, toegankelijkheid en volledigheid.

REGELS:
- Schrijf in het Nederlands, zakelijk maar constructief
- Beoordeel elk artikel op: GOED, VERBETEREN, of ONVOLDOENDE
- Gebruik markdown tabellen voor overzichten

BEOORDELINGSCRITERIA:
1. B1-taalniveau: Zijn de teksten begrijpelijk voor mensen met een gemiddeld leesniveau?
   - Korte zinnen (max 15 woorden ideaal)
   - Geen jargon zonder uitleg
   - Actieve schrijfstijl
2. Volledigheid: Heeft het artikel zowel een beschrijving als inhoud?
3. Relevantie: Past de inhoud bij de categorie en het type?
4. Bruikbaarheid: Bevat het concrete, praktische informatie voor mantelzorgers?
5. Metadata: Klopt het belastingsniveau? Is de bronlabel ingevuld?

CATEGORIEËN IN DE APP:
- praktische-tips: Dagelijkse hulp bij mantelzorg
- zelfzorg: Zorg voor jezelf als mantelzorger
- rechten: Juridische rechten en regelingen
- financieel: Financiële hulp en toeslagen
- hulpmiddelen-producten: Praktische hulpmiddelen

BELASTINGNIVEAUS:
- ALLE: Toon aan iedereen
- LAAG/GEMIDDELD/HOOG: Specifiek voor die groep`,
    prompt: `Beoordeel de volgende ${artikelen.length} artikelen op kwaliteit en B1-taalniveau.

ARTIKELEN:
${JSON.stringify(artikelen, null, 2)}

Geef:
1. Een overzichtstabel met per artikel: titel, beoordeling (GOED/VERBETEREN/ONVOLDOENDE), B1-score, korte toelichting
2. Algemene patronen in de content
3. Top 3 artikelen die het meest urgent aandacht nodig hebben, met concrete suggesties`,
  })

  return {
    aantalItems: artikelen.length,
    categorie: categorie || "alle",
    analyse: text,
  }
}

// ── AI Hiaatanalyse ─────────────────────────────────────────────

async function detecteerHiaten() {
  const overzicht = await haalContentOverzicht()

  if (!process.env.ANTHROPIC_API_KEY) {
    return {
      data: overzicht,
      analyse: "AI-analyse niet beschikbaar: ANTHROPIC_API_KEY niet geconfigureerd.",
    }
  }

  // Haal ook een steekproef van artikeltitels per categorie
  const steekproef = await prisma.artikel.findMany({
    where: { isActief: true, status: "GEPUBLICEERD" },
    select: { titel: true, categorie: true, subHoofdstuk: true },
    orderBy: { categorie: "asc" },
  })

  const perCategorie: Record<string, string[]> = {}
  for (const a of steekproef) {
    const key = a.categorie
    if (!perCategorie[key]) perCategorie[key] = []
    perCategorie[key].push(a.subHoofdstuk ? `${a.titel} [${a.subHoofdstuk}]` : a.titel)
  }

  const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const { text } = await generateText({
    model: anthropic("claude-sonnet-4-20250514"),
    maxOutputTokens: 2000,
    system: `Je bent een content strateeg voor MantelBuddy, een platform voor mantelzorgers in Nederland.
Je analyseert de kennisbank op hiaten en ontbrekende onderwerpen.

REGELS:
- Schrijf in het Nederlands
- Baseer je op kennis over mantelzorg in Nederland
- Wees concreet: noem specifieke onderwerpen die ontbreken
- Prioriteer op basis van relevantie voor mantelzorgers

CONTEXT OVER MANTELZORG IN NEDERLAND:
- Ca. 4,4 miljoen Nederlanders zijn mantelzorger
- Veelvoorkomende thema's: overbelasting, respijtzorg, Wmo, Wlz, PGB, casemanager
- Doelgroep: mantelzorgers van ouderen, mensen met dementie, chronisch zieken, GGZ
- Regelingen: Wmo (gemeente), Wlz (zorgkantoor), Zvw (zorgverzekeraar)
- Belangrijke organisaties: MantelzorgNL, Mezzo, gemeentelijke steunpunten

VERWACHTE CATEGORIEËN EN ONDERWERPEN:
- praktische-tips: dagstructuur, medicatie, vervoer, hulpmiddelen, communicatie met zorgverleners
- zelfzorg: overbelasting herkennen, grenzen stellen, ontspanning, lotgenotencontact
- rechten: Wmo-aanvraag, Wlz-indicatie, PGB, mantelzorgcompliment, zorgverlof
- financieel: toeslagen, PGB, belastingaftrek, kosten thuiszorg
- hulpmiddelen-producten: aanpassingen in huis, technologie, apps`,
    prompt: `Analyseer de volgende kennisbank op hiaten en ontbrekende onderwerpen.

CONTENT OVERZICHT:
${JSON.stringify(overzicht, null, 2)}

BESTAANDE ARTIKELEN PER CATEGORIE:
${JSON.stringify(perCategorie, null, 2)}

Geef:
1. Een analyse van de verdeling over categorieën (evenwichtig? scheve verdeling?)
2. Per categorie: ontbrekende onderwerpen die belangrijk zijn voor mantelzorgers
3. Onderwerpen die helemaal niet gedekt zijn maar wel relevant
4. Top 5 geprioriteerde content-suggesties met motivatie
5. Aandachtspunten voor belastingsniveau-dekking (zijn er genoeg artikelen per niveau?)`,
  })

  return {
    data: overzicht,
    artikelenPerCategorie: perCategorie,
    analyse: text,
  }
}

// ── AI Verbetervoorstellen ──────────────────────────────────────

async function genereerVerbetervoorstellen(limiet: number, categorie?: string) {
  const artikelen = await haalArtikelen(limiet, categorie)

  if (artikelen.length === 0) {
    return {
      aantalItems: 0,
      analyse: "Geen artikelen gevonden voor verbetervoorstellen.",
    }
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return {
      aantalItems: artikelen.length,
      data: artikelen,
      analyse: "AI-analyse niet beschikbaar: ANTHROPIC_API_KEY niet geconfigureerd.",
    }
  }

  const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const { text } = await generateText({
    model: anthropic("claude-sonnet-4-20250514"),
    maxOutputTokens: 2000,
    system: `Je bent een redacteur en taalcoach voor MantelBuddy, een platform voor mantelzorgers.
Je herschrijft en verbetert artikelen naar B1-taalniveau.

REGELS:
- Schrijf in het Nederlands
- Geef per artikel concrete verbetervoorstellen
- Gebruik markdown voor duidelijke opmaak

B1-TAALNIVEAU RICHTLIJNEN:
- Zinnen van max 12-15 woorden
- Geen bijzinnen met meer dan 1 nesting
- Gebruik alledaagse woorden, vermijd jargon
- Leg vakbegrippen uit bij eerste gebruik
- Gebruik actieve zinsbouw ("Je kunt..." in plaats van "Er kan...")
- Gebruik opsommingen en tussenkopjes
- Spreek de lezer direct aan met "je" en "jij"

STRUCTUUR VERBETERVOORSTEL:
1. Huidige kwaliteit (kort)
2. Wat goed is (behouden)
3. Concrete herschrijfsuggesties (met voorbeelden)
4. Ontbrekende informatie die toegevoegd moet worden`,
    prompt: `Genereer verbetervoorstellen voor de volgende ${artikelen.length} artikelen.
Focus op B1-taalniveau, volledigheid en bruikbaarheid.

ARTIKELEN:
${JSON.stringify(artikelen, null, 2)}

Geef per artikel:
1. Beoordeling huidige kwaliteit (1-5 sterren)
2. B1-taalniveau check (voldoet / deels / onvoldoende)
3. Concrete herschrijfsuggesties met voorbeeldteksten
4. Ontbrekende informatie
5. Metadata-suggesties (belastingsniveau, bronlabel)

Sluit af met een samenvatting: hoeveel artikelen voldoen aan B1, hoeveel moeten herschreven worden.`,
  })

  return {
    aantalItems: artikelen.length,
    categorie: categorie || "alle",
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
    const { type = "beoordeel", categorie, limiet = 20 } = body as {
      type?: "beoordeel" | "hiaten" | "verbeter"
      categorie?: string
      limiet?: number
    }

    const effectiefLimiet = Math.min(Math.max(limiet, 1), 50)

    let result
    switch (type) {
      case "beoordeel":
        result = await beoordeelArtikelen(effectiefLimiet, categorie)
        break
      case "hiaten":
        result = await detecteerHiaten()
        break
      case "verbeter":
        result = await genereerVerbetervoorstellen(effectiefLimiet, categorie)
        break
      default:
        result = await beoordeelArtikelen(effectiefLimiet, categorie)
        break
    }

    await logAudit({
      userId: session.user.id!,
      actie: "AI_CURATOR",
      entiteit: "ContentCuratie",
      details: { type, categorie: categorie || "alle", limiet: effectiefLimiet },
    })

    return NextResponse.json({
      success: true,
      type,
      ...result,
    })
  } catch (error) {
    console.error("[AI Curator] Fout:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Content curatie mislukt" },
      { status: 500 }
    )
  }
}
