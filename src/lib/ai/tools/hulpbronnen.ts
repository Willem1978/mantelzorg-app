/**
 * Tool: zoekHulpbronnen
 * Zoekt zorgorganisaties op basis van zoekterm, gemeente en/of categorie.
 * Gebruikt TAAK_NAAM_VARIANTEN voor correcte categorie-matching.
 */
import { tool } from "ai"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { TAAK_NAAM_VARIANTEN } from "@/config/options"

// Bouwt een lijst van alle mogelijke onderdeelTest waarden voor een categorie
function getCategorieVarianten(categorie: string): string[] {
  // Directe match als dbValue
  const directVarianten = TAAK_NAAM_VARIANTEN[categorie]
  if (directVarianten) return [categorie, ...directVarianten]

  // Zoek of dit een variant is van een dbValue
  for (const [dbValue, varianten] of Object.entries(TAAK_NAAM_VARIANTEN)) {
    if (varianten.some((v) => v.toLowerCase() === categorie.toLowerCase())) {
      return [dbValue, ...varianten]
    }
  }

  // Geen match gevonden, gebruik de categorie zelf
  return [categorie]
}

export function createZoekHulpbronnenTool(ctx: { gemeenteZorgvrager: string | null; gemeenteMantelzorger: string | null } | { gemeente: string | null }) {
  // Ondersteun zowel het nieuwe (twee gemeenten) als het oude (één gemeente) formaat
  const ctxZorgvrager = "gemeenteZorgvrager" in ctx ? ctx.gemeenteZorgvrager : ctx.gemeente
  const ctxMantelzorger = "gemeenteMantelzorger" in ctx ? ctx.gemeenteMantelzorger : ctx.gemeente

  return tool({
    description:
      "Zoek hulporganisaties en zorgaanbieders. Gebruik dit om lokale hulp te vinden voor specifieke problemen, deelgebieden of zorgtaken. " +
      "Zorgtaken (verzorging, boodschappen, klusjes) worden gezocht in de gemeente van de zorgvrager. " +
      "Hulp voor de mantelzorger zelf (steunpunt, emotioneel) wordt gezocht in de gemeente van de mantelzorger.",
    inputSchema: z.object({
      zoekterm: z.string().optional().describe("Zoekterm voor naam of beschrijving"),
      gemeente: z.string().optional().describe("Gemeente naam om lokaal te zoeken (overschrijft de standaard)"),
      categorie: z
        .string()
        .optional()
        .describe("Categorie/taak zoals: Persoonlijke verzorging, Huishoudelijke taken, Vervangende mantelzorg, Emotionele steun, etc."),
    }),
    execute: async ({ zoekterm, gemeente: zoekGemeente, categorie }) => {
      // Bepaal de juiste gemeente: zorgtaken → zorgvrager, mantelzorger hulp → mantelzorger
      const categorieLC = categorie?.toLowerCase() || ""
      const isMantelzorgerHulp = categorie && (
        categorieLC.includes("emotioneel") ||
        categorieLC.includes("steunpunt") ||
        categorieLC.includes("mantelzorg") ||
        categorieLC.includes("lotgenoot") ||
        categorieLC.includes("zelfzorg") ||
        categorieLC.includes("respijt") ||
        categorieLC.includes("vervangende zorg") ||
        categorieLC.includes("begeleiding") ||
        categorieLC.includes("informatie en advies") ||
        categorieLC.includes("educatie") ||
        categorieLC.includes("cursus")
      )
      const defaultGemeente = isMantelzorgerHulp ? ctxMantelzorger : ctxZorgvrager
      const gem = zoekGemeente || defaultGemeente || ctxZorgvrager || ctxMantelzorger
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const where: Record<string, any> = { isActief: true }

      if (gem) {
        where.OR = [
          { gemeente: { equals: gem, mode: "insensitive" } },
          { gemeente: null },
        ]
      }

      // Bij mantelzorger-hulp: filter op doelgroep MANTELZORGER
      if (isMantelzorgerHulp) {
        where.doelgroep = "MANTELZORGER"
      }

      if (categorie && !isMantelzorgerHulp) {
        // Gebruik alle naamvarianten voor correcte matching (alleen voor zorgtaken)
        const varianten = getCategorieVarianten(categorie)
        where.onderdeelTest = { in: varianten }
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
        return {
          gevonden: 0,
          bericht: gem
            ? `Geen hulpbronnen gevonden in ${gem}. Geef de gebruiker algemeen advies over dit onderwerp en verwijs naar de gemeente of huisarts.`
            : "Geen hulpbronnen gevonden. Geef de gebruiker algemeen advies over dit onderwerp en verwijs naar de gemeente of huisarts.",
        }
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
