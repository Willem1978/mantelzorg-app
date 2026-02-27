/**
 * Tool: zoekHulpbronnen
 * Zoekt zorgorganisaties op basis van zoekterm, gemeente en/of categorie.
 */
import { tool } from "ai"
import { z } from "zod"
import { prisma } from "@/lib/prisma"

export function createZoekHulpbronnenTool(ctx: { gemeente: string | null }) {
  return tool({
    description:
      "Zoek hulporganisaties en zorgaanbieders. Gebruik dit om lokale hulp te vinden voor specifieke problemen, deelgebieden of zorgtaken.",
    inputSchema: z.object({
      zoekterm: z.string().optional().describe("Zoekterm voor naam of beschrijving"),
      gemeente: z.string().optional().describe("Gemeente naam om lokaal te zoeken"),
      categorie: z
        .string()
        .optional()
        .describe("Categorie/taak zoals: Persoonlijke verzorging, Huishoudelijke taken, Vervangende mantelzorg, Emotionele steun, etc."),
    }),
    execute: async ({ zoekterm, gemeente: zoekGemeente, categorie }) => {
      const gem = zoekGemeente || ctx.gemeente
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const where: Record<string, any> = { isActief: true }

      if (gem) {
        where.OR = [
          { gemeente: { equals: gem, mode: "insensitive" } },
          { dekkingNiveau: "LANDELIJK" },
          { gemeente: null },
        ]
      }

      if (categorie) {
        where.onderdeelTest = { contains: categorie, mode: "insensitive" }
      }

      if (zoekterm) {
        where.AND = [
          ...(Array.isArray(where.AND) ? where.AND : []),
          {
            OR: [
              { naam: { contains: zoekterm, mode: "insensitive" } },
              { beschrijving: { contains: zoekterm, mode: "insensitive" } },
              { soortHulp: { contains: zoekterm, mode: "insensitive" } },
            ],
          },
        ]
      }

      const resultaten = await prisma.zorgorganisatie.findMany({
        where,
        take: 8,
        orderBy: { naam: "asc" },
        select: {
          naam: true,
          beschrijving: true,
          telefoon: true,
          website: true,
          email: true,
          soortHulp: true,
          onderdeelTest: true,
          gemeente: true,
          dekkingNiveau: true,
          kosten: true,
          openingstijden: true,
        },
      })

      if (resultaten.length === 0) {
        return { gevonden: 0, bericht: "Geen hulpbronnen gevonden. Probeer een bredere zoekterm." }
      }

      return {
        gevonden: resultaten.length,
        hulpbronnen: resultaten.map((r) => ({
          naam: r.naam,
          beschrijving: r.beschrijving,
          telefoon: r.telefoon,
          website: r.website,
          email: r.email,
          soortHulp: r.soortHulp,
          categorie: r.onderdeelTest,
          lokatie: r.gemeente || "Landelijk",
          kosten: r.kosten,
          openingstijden: r.openingstijden,
        })),
      }
    },
  })
}
