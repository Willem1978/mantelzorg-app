import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getGemeenteSession, logGemeenteAudit } from "@/lib/gemeente-auth"
import { gemeenteEvenementSchema, validateBody } from "@/lib/validations"

export async function GET() {
  const { error, gemeenteNaam, userId } = await getGemeenteSession()
  if (error) return error

  try {
    const evenementen = await prisma.artikel.findMany({
      where: {
        type: "GEMEENTE_NIEUWS",
        categorie: "evenement",
        gemeente: { equals: gemeenteNaam!, mode: "insensitive" },
        isActief: true,
      },
      select: {
        id: true,
        titel: true,
        beschrijving: true,
        inhoud: true,
        url: true,
        emoji: true,
        status: true,
        publicatieDatum: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: [
        { publicatieDatum: "asc" },
        { createdAt: "desc" },
      ],
    })

    logGemeenteAudit(userId, "BEKEKEN", "Evenementen", { gemeente: gemeenteNaam })

    return NextResponse.json({
      gemeenteNaam,
      evenementen,
    })
  } catch (err) {
    console.error("Gemeente evenementen GET error:", err)
    return NextResponse.json({ error: "Interne fout" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const { error, gemeenteNaam, userId } = await getGemeenteSession()
  if (error) return error

  try {
    const body = await request.json()
    const validation = validateBody(body, gemeenteEvenementSchema)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }
    const { titel, beschrijving, publicatieDatum, inhoud, url, emoji } = validation.data

    const evenement = await prisma.artikel.create({
      data: {
        titel: titel.trim(),
        beschrijving: beschrijving.trim(),
        inhoud: inhoud?.trim() || null,
        url: url?.trim() || null,
        emoji: emoji || null,
        categorie: "evenement",
        type: "GEMEENTE_NIEUWS",
        status: "GEPUBLICEERD",
        gemeente: gemeenteNaam,
        publicatieDatum: new Date(publicatieDatum),
        aangemaaaktDoor: userId,
      },
    })

    logGemeenteAudit(userId, "AANGEMAAKT", "Evenement", { gemeente: gemeenteNaam, evenementId: evenement.id })

    return NextResponse.json(
      {
        bericht: "Evenement succesvol aangemaakt",
        evenement: {
          id: evenement.id,
          titel: evenement.titel,
          beschrijving: evenement.beschrijving,
          publicatieDatum: evenement.publicatieDatum,
          status: evenement.status,
          createdAt: evenement.createdAt,
        },
      },
      { status: 201 }
    )
  } catch (err) {
    console.error("Gemeente evenementen POST error:", err)
    return NextResponse.json({ error: "Interne fout" }, { status: 500 })
  }
}
