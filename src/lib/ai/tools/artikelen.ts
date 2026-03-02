/**
 * Tool: zoekArtikelen
 * Zoekt gepubliceerde artikelen en tips over mantelzorg.
 */
import { tool } from "ai"
import { z } from "zod"
import { prisma } from "@/lib/prisma"

export function createZoekArtikelenTool() {
  return tool({
    description:
      "Zoek informatie-artikelen en tips over mantelzorg. Gebruik dit voor advies en informatie over specifieke onderwerpen (slaap, energie, zelfzorg, rechten, financieel).",
    inputSchema: z.object({
      categorie: z
        .string()
        .optional()
        .describe("Categorie slug: dagelijks-zorgen, zelfzorg-balans, rechten-regelingen, geld-financien, hulpmiddelen-technologie, werk-mantelzorg, samenwerken-netwerk"),
      tag: z
        .string()
        .optional()
        .describe("Tag slug voor aandoening of situatie, bijv: dementie, kanker, psychisch, jong, werkend, op-afstand"),
      zoekterm: z.string().optional().describe("Zoekterm in titel of beschrijving"),
    }),
    execute: async ({ categorie, tag, zoekterm }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const where: Record<string, any> = {
        isActief: true,
        status: "GEPUBLICEERD",
        type: "ARTIKEL",
      }

      if (categorie) {
        where.categorie = categorie
      }

      if (tag) {
        where.tags = { some: { tag: { slug: tag } } }
      }

      if (zoekterm) {
        where.OR = [
          { titel: { contains: zoekterm, mode: "insensitive" } },
          { beschrijving: { contains: zoekterm, mode: "insensitive" } },
        ]
      }

      const artikelen = await prisma.artikel.findMany({
        where,
        take: 5,
        orderBy: { sorteerVolgorde: "asc" },
        select: {
          titel: true,
          beschrijving: true,
          emoji: true,
          categorie: true,
          url: true,
          tags: {
            select: { tag: { select: { slug: true, naam: true } } },
          },
        },
      })

      if (artikelen.length === 0) {
        return { gevonden: 0, bericht: "Geen artikelen gevonden over dit onderwerp." }
      }

      return {
        gevonden: artikelen.length,
        artikelen: artikelen.map((a) => ({
          titel: a.titel,
          beschrijving: a.beschrijving,
          emoji: a.emoji,
          categorie: a.categorie,
          url: a.url,
          tags: a.tags.map((t) => t.tag.naam),
          appLink: `/leren/${a.categorie}`,
        })),
      }
    },
  })
}
