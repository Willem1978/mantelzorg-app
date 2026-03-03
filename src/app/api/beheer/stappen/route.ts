import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

/**
 * GET /api/beheer/stappen?gemeente=X
 * Haal alle stappen op voor een gemeente (admin).
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "GEMEENTE_ADMIN")) {
      return NextResponse.json({ error: "Geen toegang" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const gemeente = searchParams.get("gemeente") || "_default"

    const stappen = await prisma.gemeenteStap.findMany({
      where: { gemeenteNaam: gemeente },
      orderBy: [{ niveau: "asc" }, { stapNummer: "asc" }],
    })

    // Haal organisaties en artikelen op voor dropdown opties
    const [organisaties, artikelen] = await Promise.all([
      prisma.zorgorganisatie.findMany({
        where: { isActief: true },
        select: { id: true, naam: true, gemeente: true },
        orderBy: { naam: "asc" },
      }),
      prisma.artikel.findMany({
        where: { isActief: true, status: "GEPUBLICEERD" },
        select: { id: true, titel: true, categorie: true, emoji: true },
        orderBy: { titel: "asc" },
      }),
    ])

    // Haal gemeenten op
    const gemeenten = await prisma.gemeente.findMany({
      where: { isActief: true },
      select: { naam: true },
      orderBy: { naam: "asc" },
    })

    return NextResponse.json({
      stappen,
      organisaties,
      artikelen,
      gemeenten: gemeenten.map((g) => g.naam),
    })
  } catch (error) {
    console.error("Beheer stappen GET error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

/**
 * POST /api/beheer/stappen
 * Maak een nieuwe stap aan of update bestaande.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "GEMEENTE_ADMIN")) {
      return NextResponse.json({ error: "Geen toegang" }, { status: 403 })
    }

    const body = await request.json()
    const { gemeenteNaam, niveau, stapNummer, titel, beschrijving, emoji, organisatieId, artikelId, externeUrl } = body

    if (!gemeenteNaam || !niveau || !stapNummer || !titel) {
      return NextResponse.json({ error: "Verplichte velden ontbreken" }, { status: 400 })
    }

    if (stapNummer < 1 || stapNummer > 3) {
      return NextResponse.json({ error: "Stapnummer moet 1, 2 of 3 zijn" }, { status: 400 })
    }

    // Upsert: maak aan of update
    const stap = await prisma.gemeenteStap.upsert({
      where: {
        gemeenteNaam_niveau_stapNummer: {
          gemeenteNaam,
          niveau,
          stapNummer,
        },
      },
      update: {
        titel,
        beschrijving: beschrijving || null,
        emoji: emoji || null,
        organisatieId: organisatieId || null,
        artikelId: artikelId || null,
        externeUrl: externeUrl || null,
      },
      create: {
        gemeenteNaam,
        niveau,
        stapNummer,
        titel,
        beschrijving: beschrijving || null,
        emoji: emoji || null,
        organisatieId: organisatieId || null,
        artikelId: artikelId || null,
        externeUrl: externeUrl || null,
      },
    })

    return NextResponse.json({ stap })
  } catch (error) {
    console.error("Beheer stappen POST error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

/**
 * DELETE /api/beheer/stappen
 * Verwijder een stap.
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "GEMEENTE_ADMIN")) {
      return NextResponse.json({ error: "Geen toegang" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "ID ontbreekt" }, { status: 400 })
    }

    await prisma.gemeenteStap.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Beheer stappen DELETE error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
