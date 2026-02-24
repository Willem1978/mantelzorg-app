/**
 * Dashboard helper: aanbevolen artikelen ophalen op basis van belastingniveau.
 */

import { prisma } from "@/lib/prisma"

export async function getAanbevolenArtikelen(
  belastingNiveau: string | null,
  gemeente: string | null
) {
  try {
    let categorieen: string[] = []
    if (belastingNiveau === "LAAG") {
      categorieen = ["zelfzorg", "praktische-tips"]
    } else if (belastingNiveau === "GEMIDDELD") {
      categorieen = ["rechten", "praktische-tips", "zelfzorg"]
    } else if (belastingNiveau === "HOOG") {
      categorieen = ["zelfzorg", "rechten", "financieel"]
    } else {
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
