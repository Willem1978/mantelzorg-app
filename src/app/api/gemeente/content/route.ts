import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getGemeenteSession, logGemeenteAudit } from "@/lib/gemeente-auth"

export async function GET() {
  const { error, gemeenteNaam, userId } = await getGemeenteSession()
  if (error) return error

  try {
    const artikelen = await prisma.artikel.findMany({
      where: {
        type: "GEMEENTE_NIEUWS",
        gemeente: { equals: gemeenteNaam, mode: "insensitive" },
        isActief: true,
      },
      select: {
        id: true,
        titel: true,
        beschrijving: true,
        inhoud: true,
        url: true,
        bron: true,
        emoji: true,
        categorie: true,
        status: true,
        belastingNiveau: true,
        publicatieDatum: true,
        sorteerVolgorde: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: [
        { sorteerVolgorde: "asc" },
        { createdAt: "desc" },
      ],
    })

    logGemeenteAudit(userId, "BEKEKEN", "Content", { gemeente: gemeenteNaam })

    return NextResponse.json({
      gemeenteNaam,
      artikelen,
    })
  } catch (err) {
    console.error("Gemeente content GET error:", err)
    return NextResponse.json({ error: "Interne fout" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const { error, gemeenteNaam, userId } = await getGemeenteSession()
  if (error) return error

  try {
    const body = await request.json()
    const { titel, beschrijving, inhoud, url, bron, emoji, belastingNiveau, publicatieDatum } = body

    // Validatie van verplichte velden
    if (!titel || typeof titel !== "string" || titel.trim().length === 0) {
      return NextResponse.json(
        { error: "Titel is verplicht" },
        { status: 400 }
      )
    }

    if (!beschrijving || typeof beschrijving !== "string" || beschrijving.trim().length === 0) {
      return NextResponse.json(
        { error: "Beschrijving is verplicht" },
        { status: 400 }
      )
    }

    const artikel = await prisma.artikel.create({
      data: {
        titel: titel.trim(),
        beschrijving: beschrijving.trim(),
        inhoud: inhoud?.trim() || null,
        url: url?.trim() || null,
        bron: bron?.trim() || null,
        emoji: emoji || null,
        categorie: "gemeente-nieuws",
        type: "GEMEENTE_NIEUWS",
        status: "GEPUBLICEERD",
        belastingNiveau: belastingNiveau || "ALLE",
        gemeente: gemeenteNaam,
        publicatieDatum: publicatieDatum ? new Date(publicatieDatum) : new Date(),
        aangemaaaktDoor: userId,
      },
    })

    logGemeenteAudit(userId, "AANGEMAAKT", "Content", { gemeente: gemeenteNaam, artikelId: artikel.id })

    return NextResponse.json(
      {
        bericht: "Artikel succesvol aangemaakt",
        artikel: {
          id: artikel.id,
          titel: artikel.titel,
          beschrijving: artikel.beschrijving,
          status: artikel.status,
          createdAt: artikel.createdAt,
        },
      },
      { status: 201 }
    )
  } catch (err) {
    console.error("Gemeente content POST error:", err)
    return NextResponse.json({ error: "Interne fout" }, { status: 500 })
  }
}
