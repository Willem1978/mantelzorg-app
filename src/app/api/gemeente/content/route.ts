import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getGemeenteSession, logGemeenteAudit } from "@/lib/gemeente-auth"
import { gemeenteContentSchema, validateBody } from "@/lib/validations"

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
    const validation = validateBody(body, gemeenteContentSchema)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }
    const { titel, beschrijving, inhoud, url, bron, emoji, publicatieDatum } = validation.data

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
