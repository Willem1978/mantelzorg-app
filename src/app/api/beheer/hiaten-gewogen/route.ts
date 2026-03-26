import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

interface HiaatItem {
  prioriteit: number
  categorie: string
  zorgthema: string | null
  reden: string
  score: number
}

/**
 * GET /api/beheer/hiaten-gewogen — Gewogen hiaten-analyse (4.2)
 *
 * Analyseert content-gaps gewogen naar:
 * 1. ArtikelInteractie ratings (artikelen met veel duimpjes omlaag)
 * 2. Gebruikersprofielen (meest voorkomende zorgthema's)
 * 3. Categorieverdeling (categorieën met de minste artikelen)
 *
 * Retourneert een geprioritiseerde lijst met hiaten en reasoning.
 */
export async function GET() {
  const session = await auth()
  if (!session?.user?.role || !["ADMIN", "ORG_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Geen toegang" }, { status: 403 })
  }

  try {
    // --- 1. Categorieverdeling: artikelen per categorie ---
    const artikelenPerCategorie = await prisma.artikel.groupBy({
      by: ["categorie"],
      _count: true,
      where: { isActief: true },
    })

    const categorieMap: Record<string, number> = {}
    let totaalArtikelen = 0
    for (const row of artikelenPerCategorie) {
      categorieMap[row.categorie] = row._count
      totaalArtikelen += row._count
    }

    // --- 2. Gebruikersprofielen: meest voorkomende aandoeningen ---
    const aandoeningVerdeling = await prisma.caregiver.groupBy({
      by: ["aandoening"],
      where: { aandoening: { not: null } },
      _count: true,
    })

    const totaalGebruikers = await prisma.caregiver.count()
    const aandoeningMap: Record<string, number> = {}
    for (const row of aandoeningVerdeling) {
      if (row.aandoening) {
        aandoeningMap[row.aandoening] = row._count
      }
    }

    // --- 3. Negatieve ratings per artikel ---
    const negatieveRatings = await prisma.artikelInteractie.groupBy({
      by: ["artikelId"],
      where: { rating: 1 },
      _count: true,
      orderBy: { _count: { artikelId: "desc" } },
    })

    // Haal artikel-info op voor negatief beoordeelde artikelen
    const negatiefArtikelIds = negatieveRatings.map((r) => r.artikelId)
    const negatiefArtikelen = negatiefArtikelIds.length > 0
      ? await prisma.artikel.findMany({
          where: { id: { in: negatiefArtikelIds } },
          select: { id: true, titel: true, categorie: true },
        })
      : []
    const negatiefArtikelMap = Object.fromEntries(negatiefArtikelen.map((a) => [a.id, a]))

    // --- 4. Tags met artikeltelling (zorgthema's) ---
    const tagVerdeling = await prisma.artikelTag.groupBy({
      by: ["tagId"],
      _count: true,
    })

    const tagIds = tagVerdeling.map((t) => t.tagId)
    const tags = tagIds.length > 0
      ? await prisma.contentTag.findMany({
          where: { id: { in: tagIds }, type: "ZORGTHEMA", isActief: true },
          select: { id: true, slug: true, naam: true },
        })
      : []
    const tagMap = Object.fromEntries(tags.map((t) => [t.id, t]))
    const tagArtikelCount: Record<string, number> = {}
    for (const row of tagVerdeling) {
      const tag = tagMap[row.tagId]
      if (tag) {
        tagArtikelCount[tag.slug] = row._count
      }
    }

    // Haal ook alle zorgthema-tags op (inclusief die zonder artikelen)
    const alleZorgthemas = await prisma.contentTag.findMany({
      where: { type: "ZORGTHEMA", isActief: true },
      select: { slug: true, naam: true },
    })

    // --- Hiaten berekenen ---
    const hiaten: HiaatItem[] = []

    // A) Zorgthema's die veel gebruikers hebben maar weinig artikelen
    for (const thema of alleZorgthemas) {
      const gebruikersMetThema = aandoeningMap[thema.slug] || 0
      const artikelenMetThema = tagArtikelCount[thema.slug] || 0
      const gebruikersPercentage = totaalGebruikers > 0
        ? Math.round((gebruikersMetThema / totaalGebruikers) * 100)
        : 0

      // Score: hoge score als veel gebruikers maar weinig artikelen
      if (gebruikersMetThema > 0 && artikelenMetThema <= 2) {
        const score = Math.min(100, Math.round(
          (gebruikersPercentage * 2) + (artikelenMetThema === 0 ? 30 : 10)
        ))
        hiaten.push({
          prioriteit: 0, // wordt later ingevuld
          categorie: "-",
          zorgthema: thema.naam,
          reden: `${artikelenMetThema} artikelen over "${thema.naam}", terwijl ${gebruikersPercentage}% van gebruikers dit thema heeft`,
          score,
        })
      } else if (artikelenMetThema === 0) {
        // Thema zonder artikelen, ook als er geen gebruikers voor zijn
        hiaten.push({
          prioriteit: 0,
          categorie: "-",
          zorgthema: thema.naam,
          reden: `Geen artikelen voor zorgthema "${thema.naam}"`,
          score: 20,
        })
      }
    }

    // B) Categorieën met weinig artikelen (relatief)
    const gemiddeldePerCategorie = artikelenPerCategorie.length > 0
      ? totaalArtikelen / artikelenPerCategorie.length
      : 0

    for (const row of artikelenPerCategorie) {
      if (row._count < gemiddeldePerCategorie * 0.5) {
        const score = Math.min(100, Math.round(
          ((gemiddeldePerCategorie - row._count) / Math.max(gemiddeldePerCategorie, 1)) * 60
        ))
        hiaten.push({
          prioriteit: 0,
          categorie: row.categorie,
          zorgthema: null,
          reden: `Categorie "${row.categorie}" heeft slechts ${row._count} artikelen (gemiddelde: ${Math.round(gemiddeldePerCategorie)})`,
          score,
        })
      }
    }

    // C) Artikelen met veel negatieve ratings -> categorie/thema verbetering nodig
    for (const rating of negatieveRatings.slice(0, 10)) {
      const artikel = negatiefArtikelMap[rating.artikelId]
      if (artikel && rating._count >= 2) {
        const score = Math.min(100, Math.round(rating._count * 15))
        hiaten.push({
          prioriteit: 0,
          categorie: artikel.categorie,
          zorgthema: null,
          reden: `Artikel "${artikel.titel}" in categorie "${artikel.categorie}" heeft ${rating._count}x duimpje omlaag — verbetering nodig`,
          score,
        })
      }
    }

    // Sorteer op score (hoog = hoge prioriteit)
    hiaten.sort((a, b) => b.score - a.score)

    // Ken prioriteiten toe
    hiaten.forEach((h, i) => {
      h.prioriteit = i + 1
    })

    return NextResponse.json({
      hiaten,
      stats: {
        totaalArtikelen,
        totaalGebruikers,
        categorieVerdeling: categorieMap,
      },
    })
  } catch (error) {
    console.error("Hiaten-analyse fout:", error)
    return NextResponse.json(
      { error: "Er ging iets mis bij de hiaten-analyse" },
      { status: 500 }
    )
  }
}
