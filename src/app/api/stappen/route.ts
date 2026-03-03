import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

/**
 * GET /api/stappen?gemeente=X&niveau=LAAG|GEMIDDELD|HOOG
 *
 * Haal stappen op voor een specifieke gemeente en belastingniveau.
 * Valt terug op "_default" als er geen gemeente-specifieke stappen zijn.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const gemeente = searchParams.get("gemeente") || ""
    const niveau = searchParams.get("niveau") || ""

    if (!niveau || !["LAAG", "GEMIDDELD", "HOOG"].includes(niveau)) {
      return NextResponse.json({ error: "Ongeldig niveau" }, { status: 400 })
    }

    // Probeer gemeente-specifieke stappen
    let stappen = await prisma.gemeenteStap.findMany({
      where: {
        gemeenteNaam: gemeente,
        niveau: niveau as "LAAG" | "GEMIDDELD" | "HOOG",
        isActief: true,
      },
      orderBy: { stapNummer: "asc" },
    })

    // Fallback naar default als geen gemeente-specifieke stappen
    if (stappen.length === 0 && gemeente !== "_default") {
      stappen = await prisma.gemeenteStap.findMany({
        where: {
          gemeenteNaam: "_default",
          niveau: niveau as "LAAG" | "GEMIDDELD" | "HOOG",
          isActief: true,
        },
        orderBy: { stapNummer: "asc" },
      })
    }

    // Verrijk stappen met organisatie/artikel informatie
    const verrijkteStappen = await Promise.all(
      stappen.map(async (stap) => {
        let organisatie = null
        let artikel = null

        if (stap.organisatieId) {
          organisatie = await prisma.zorgorganisatie.findUnique({
            where: { id: stap.organisatieId },
            select: { id: true, naam: true, telefoon: true, website: true, beschrijving: true },
          })
        }

        if (stap.artikelId) {
          artikel = await prisma.artikel.findUnique({
            where: { id: stap.artikelId },
            select: { id: true, titel: true, beschrijving: true, categorie: true, emoji: true },
          })
        }

        return {
          id: stap.id,
          stapNummer: stap.stapNummer,
          titel: stap.titel,
          beschrijving: stap.beschrijving,
          emoji: stap.emoji,
          organisatie,
          artikel,
          externeUrl: stap.externeUrl,
        }
      })
    )

    return NextResponse.json({ stappen: verrijkteStappen })
  } catch (error) {
    console.error("Stappen GET error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
