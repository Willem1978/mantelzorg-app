import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const artikel = await prisma.artikel.findUnique({
      where: { id },
      select: {
        id: true,
        titel: true,
        beschrijving: true,
        inhoud: true,
        url: true,
        bron: true,
        bronLabel: true,
        emoji: true,
        categorie: true,
      },
    })

    if (!artikel) {
      return NextResponse.json({ error: "Artikel niet gevonden" }, { status: 404 })
    }

    return NextResponse.json({ artikel })
  } catch (error) {
    console.error("Artikel ophalen mislukt:", error)
    return NextResponse.json({ error: "Artikel ophalen mislukt" }, { status: 500 })
  }
}
