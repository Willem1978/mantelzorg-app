/**
 * Tool: semantischZoeken
 *
 * Semantische zoektool die embeddings gebruikt voor relevantere resultaten.
 * Zoekt over Artikelen en Zorgorganisaties met vector similarity.
 * Valt terug op tekstzoek als er geen embeddings beschikbaar zijn.
 */
import { tool } from "ai"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { generateEmbedding, toVectorSql } from "@/lib/ai/embeddings"

interface SemanticResult {
  id: string
  bronType: "artikel" | "hulpbron"
  titel: string
  beschrijving: string | null
  similarity: number
  extraInfo: Record<string, unknown>
}

export function createSemantischZoekenTool(gemeente?: string | null) {
  return tool({
    description:
      "Zoek semantisch naar relevante artikelen en hulpbronnen. Gebruik dit als de gebruiker een open vraag stelt die niet past bij een specifieke categorie, of als je betere resultaten wilt dan trefwoordzoek.",
    inputSchema: z.object({
      vraag: z
        .string()
        .describe("De zoekvraag in natuurlijke taal, bijv. 'hulp bij eenzaamheid als mantelzorger'"),
      type: z
        .enum(["all", "artikelen", "hulpbronnen"])
        .optional()
        .default("all")
        .describe("Zoek in artikelen, hulpbronnen, of beide"),
      maxResultaten: z
        .number()
        .optional()
        .default(5)
        .describe("Maximum aantal resultaten"),
    }),
    execute: async ({ vraag, type = "all", maxResultaten = 5 }) => {
      // Check of OPENAI_API_KEY beschikbaar is voor embeddings
      if (!process.env.OPENAI_API_KEY) {
        return fallbackTextSearch(vraag, type, maxResultaten, gemeente)
      }

      try {
        const embedding = await generateEmbedding(vraag)
        const vectorSql = toVectorSql(embedding)
        const threshold = 0.4
        const gemeenteParam = gemeente || null

        const results = await prisma.$queryRawUnsafe<SemanticResult[]>(
          `SELECT * FROM semantic_search($1::vector, $2, $3, $4, $5)`,
          vectorSql,
          threshold,
          maxResultaten,
          gemeenteParam,
          type
        )

        if (!results || results.length === 0) {
          return fallbackTextSearch(vraag, type, maxResultaten, gemeente)
        }

        return {
          gevonden: results.length,
          methode: "semantisch",
          resultaten: results.map((r) => ({
            bronType: r.bronType,
            titel: r.titel,
            beschrijving: r.beschrijving,
            relevantie: Math.round(r.similarity * 100) + "%",
            ...(r.extraInfo as Record<string, unknown>),
          })),
        }
      } catch (error) {
        // Als vector search faalt (bijv. pgvector niet geinstalleerd), val terug
        console.warn("[Semantisch zoeken] Vector search mislukt, fallback naar tekst:", error)
        return fallbackTextSearch(vraag, type, maxResultaten, gemeente)
      }
    },
  })
}

/**
 * Fallback: tekstgebaseerd zoeken als vector search niet beschikbaar is.
 */
async function fallbackTextSearch(
  zoekterm: string,
  type: string,
  maxResultaten: number,
  gemeente?: string | null
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const resultaten: any[] = []

  if (type === "all" || type === "artikelen") {
    const artikelen = await prisma.artikel.findMany({
      where: {
        isActief: true,
        status: "GEPUBLICEERD",
        OR: [
          { titel: { contains: zoekterm, mode: "insensitive" } },
          { beschrijving: { contains: zoekterm, mode: "insensitive" } },
        ],
      },
      take: maxResultaten,
      select: {
        titel: true,
        beschrijving: true,
        emoji: true,
        categorie: true,
        url: true,
      },
    })
    resultaten.push(
      ...artikelen.map((a) => ({
        bronType: "artikel",
        titel: a.titel,
        beschrijving: a.beschrijving,
        emoji: a.emoji,
        categorie: a.categorie,
        url: a.url,
        appLink: `/leren/${a.categorie}`,
      }))
    )
  }

  if (type === "all" || type === "hulpbronnen") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const orgWhere: Record<string, any> = {
      isActief: true,
      OR: [
        { naam: { contains: zoekterm, mode: "insensitive" } },
        { beschrijving: { contains: zoekterm, mode: "insensitive" } },
        { dienst: { contains: zoekterm, mode: "insensitive" } },
        { soortHulp: { contains: zoekterm, mode: "insensitive" } },
      ],
    }
    if (gemeente) {
      orgWhere.AND = [
        {
          OR: [
            { gemeente },
            { gemeente: null }, // Landelijke organisaties
          ],
        },
      ]
    }

    const orgs = await prisma.zorgorganisatie.findMany({
      where: orgWhere,
      take: maxResultaten,
      select: {
        naam: true,
        beschrijving: true,
        dienst: true,
        telefoon: true,
        website: true,
        email: true,
        gemeente: true,
        kosten: true,
        soortHulp: true,
      },
    })
    resultaten.push(
      ...orgs.map((o) => ({
        bronType: "hulpbron",
        titel: o.naam,
        beschrijving: o.beschrijving,
        dienst: o.dienst,
        telefoon: o.telefoon,
        website: o.website,
        email: o.email,
        gemeente: o.gemeente,
        kosten: o.kosten,
        soortHulp: o.soortHulp,
      }))
    )
  }

  return {
    gevonden: resultaten.length,
    methode: "tekstzoek",
    resultaten: resultaten.slice(0, maxResultaten),
  }
}
