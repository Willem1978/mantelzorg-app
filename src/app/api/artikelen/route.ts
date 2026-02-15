import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const categorie = searchParams.get("categorie") || ""
  const type = searchParams.get("type") || ""
  const gemeente = searchParams.get("gemeente") || ""

  try {
    const where: any = {
      isActief: true,
      status: "GEPUBLICEERD",
    }

    if (categorie) where.categorie = categorie
    if (type) where.type = type
    if (gemeente) {
      where.gemeente = { equals: gemeente, mode: "insensitive" }
    }

    // Filter op publicatieDatum: alleen tonen als datum leeg is of in het verleden
    where.OR = [
      { publicatieDatum: null },
      { publicatieDatum: { lte: new Date() } },
    ]

    const artikelen = await prisma.artikel.findMany({
      where,
      orderBy: [{ sorteerVolgorde: "asc" }, { createdAt: "desc" }],
      select: {
        id: true,
        titel: true,
        beschrijving: true,
        inhoud: true,
        url: true,
        bron: true,
        emoji: true,
        categorie: true,
        type: true,
        belastingNiveau: true,
        gemeente: true,
        publicatieDatum: true,
      },
    })

    return NextResponse.json({ artikelen })
  } catch (error) {
    console.error("Artikelen ophalen mislukt:", error)
    return NextResponse.json({ error: "Artikelen ophalen mislukt" }, { status: 500 })
  }
}
