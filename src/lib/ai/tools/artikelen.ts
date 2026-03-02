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
        .describe("Categorie slug: praktische-tips, zelfzorg-balans, rechten-regelingen, geld-financien, hulpmiddelen-technologie, werk-mantelzorg, samenwerken-netwerk"),
      zoekterm: z.string().optional().describe("Zoekterm in titel of beschrijving"),
      tags: z.array(z.string()).optional().describe("Filter op tag-slugs (bijv. dementie, werkend)"),
    }),
    execute: async ({ categorie, zoekterm, tags }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const where: Record<string, any> = {
        isActief: true,
        status: "GEPUBLICEERD",
        type: "ARTIKEL",
      }

      if (categorie) {
        where.categorie = categorie
      }

      if (zoekterm) {
        where.OR = [
          { titel: { contains: zoekterm, mode: "insensitive" } },
          { beschrijving: { contains: zoekterm, mode: "insensitive" } },
        ]
      }

      if (tags && tags.length > 0) {
        where.tags = { some: { tag: { slug: { in: tags } } } }
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
          tags: { select: { tag: { select: { slug: true, naam: true, emoji: true } } } },
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
          appLink: `/leren/${a.categorie}`,
          tags: a.tags.map((t) => ({ slug: t.tag.slug, naam: t.tag.naam, emoji: t.tag.emoji })),
        })),
      }
    },
  })
}
