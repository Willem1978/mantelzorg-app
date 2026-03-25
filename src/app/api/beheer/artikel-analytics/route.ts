import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/beheer/artikel-analytics — artikel ratings en leesstatistieken
export async function GET() {
  const session = await auth()
  if (!session?.user?.role || !["ADMIN", "ORG_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Geen toegang" }, { status: 403 })
  }

  // Top 10 meest gelezen
  const meestGelezen = await prisma.artikelInteractie.groupBy({
    by: ["artikelId"],
    where: { gelezen: true },
    _count: { artikelId: true },
    orderBy: { _count: { artikelId: "desc" } },
    take: 10,
  })

  // Top 10 hoogst gewaardeerd (rating = 2 = duimpje omhoog)
  const meestGewaardeerd = await prisma.artikelInteractie.groupBy({
    by: ["artikelId"],
    where: { rating: 2 },
    _count: { artikelId: true },
    orderBy: { _count: { artikelId: "desc" } },
    take: 10,
  })

  // Artikelen met veel duimpjes omlaag (rating = 1)
  const meestNegatief = await prisma.artikelInteractie.groupBy({
    by: ["artikelId"],
    where: { rating: 1 },
    _count: { artikelId: true },
    orderBy: { _count: { artikelId: "desc" } },
    take: 10,
  })

  // Haal artikel-info op voor alle IDs
  const alleIds = [
    ...meestGelezen.map(m => m.artikelId),
    ...meestGewaardeerd.map(m => m.artikelId),
    ...meestNegatief.map(m => m.artikelId),
  ]
  const uniekIds = [...new Set(alleIds)]

  const artikelen = await prisma.artikel.findMany({
    where: { id: { in: uniekIds } },
    select: { id: true, titel: true, categorie: true, emoji: true },
  })

  const artikelMap = Object.fromEntries(artikelen.map(a => [a.id, a]))

  // Totalen
  const totaalInteracties = await prisma.artikelInteractie.count()
  const totaalGelezen = await prisma.artikelInteractie.count({ where: { gelezen: true } })
  const totaalOmhoog = await prisma.artikelInteractie.count({ where: { rating: 2 } })
  const totaalOmlaag = await prisma.artikelInteractie.count({ where: { rating: 1 } })

  return NextResponse.json({
    totalen: { interacties: totaalInteracties, gelezen: totaalGelezen, omhoog: totaalOmhoog, omlaag: totaalOmlaag },
    meestGelezen: meestGelezen.map(m => ({
      ...artikelMap[m.artikelId],
      aantal: m._count.artikelId,
    })),
    meestGewaardeerd: meestGewaardeerd.map(m => ({
      ...artikelMap[m.artikelId],
      aantal: m._count.artikelId,
    })),
    meestNegatief: meestNegatief.map(m => ({
      ...artikelMap[m.artikelId],
      aantal: m._count.artikelId,
    })),
  })
}
