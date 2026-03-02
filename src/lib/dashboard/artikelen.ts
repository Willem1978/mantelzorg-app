/**
 * Dashboard helper: aanbevolen artikelen ophalen op basis van tags en voorkeuren.
 */

import { prisma } from "@/lib/prisma"

export async function getAanbevolenArtikelen(
  gemeente: string | null,
  caregiverId?: string | null
) {
  try {
    let tagSlugs: string[] = []
    let categorieen: string[] = []

    if (caregiverId) {
      // Haal gebruikersvoorkeuren en aandoening op
      const [voorkeuren, caregiver] = await Promise.all([
        prisma.gebruikerVoorkeur.findMany({
          where: { caregiverId },
        }),
        prisma.caregiver.findUnique({
          where: { id: caregiverId },
          select: { aandoening: true },
        }),
      ])

      // Splits voorkeuren in tags en categorieën
      for (const v of voorkeuren) {
        if (v.type === "TAG") {
          tagSlugs.push(v.slug)
        } else if (v.type === "CATEGORIE") {
          categorieen.push(v.slug)
        }
      }

      // Voeg aandoening toe als tag als die er is
      if (caregiver?.aandoening && !tagSlugs.includes(caregiver.aandoening)) {
        tagSlugs.push(caregiver.aandoening)
      }
    }

    // Als er tag-voorkeuren zijn, prioriteer artikelen met matchende tags
    if (tagSlugs.length > 0) {
      const artikelen = await prisma.artikel.findMany({
        where: {
          isActief: true,
          status: "GEPUBLICEERD",
          type: "ARTIKEL",
          tags: { some: { tag: { slug: { in: tagSlugs } } } },
          OR: [
            { publicatieDatum: null },
            { publicatieDatum: { lte: new Date() } },
          ],
        },
        orderBy: [{ sorteerVolgorde: "asc" }, { createdAt: "desc" }],
        take: 3,
        select: {
          id: true,
          titel: true,
          beschrijving: true,
          emoji: true,
          categorie: true,
          url: true,
        },
      })

      if (artikelen.length > 0) return artikelen
    }

    // Fallback: gebruik categorie-voorkeuren of standaard mix
    if (categorieen.length === 0) {
      categorieen = ["praktische-tips", "zelfzorg"]
    }

    const artikelen = await prisma.artikel.findMany({
      where: {
        isActief: true,
        status: "GEPUBLICEERD",
        type: "ARTIKEL",
        categorie: { in: categorieen },
        OR: [
          { publicatieDatum: null },
          { publicatieDatum: { lte: new Date() } },
        ],
      },
      orderBy: [{ sorteerVolgorde: "asc" }, { createdAt: "desc" }],
      take: 3,
      select: {
        id: true,
        titel: true,
        beschrijving: true,
        emoji: true,
        categorie: true,
        url: true,
      },
    })

    return artikelen
  } catch {
    return []
  }
}
