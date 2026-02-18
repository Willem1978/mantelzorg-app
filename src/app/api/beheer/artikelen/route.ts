import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logAudit } from "@/lib/audit"

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Niet geautoriseerd" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const categorie = searchParams.get("categorie") || ""
  const type = searchParams.get("type") || ""
  const status = searchParams.get("status") || ""
  const zoek = searchParams.get("zoek") || ""

  try {
    const where: Record<string, unknown> = {}

    if (categorie) where.categorie = categorie
    if (type) where.type = type
    if (status) where.status = status
    if (zoek) {
      where.OR = [
        { titel: { contains: zoek, mode: "insensitive" } },
        { beschrijving: { contains: zoek, mode: "insensitive" } },
      ]
    }

    const artikelen = await prisma.artikel.findMany({
      where,
      orderBy: [{ sorteerVolgorde: "asc" }, { createdAt: "desc" }],
    })

    return NextResponse.json({ artikelen })
  } catch (error) {
    console.error("Artikelen ophalen mislukt:", error)
    return NextResponse.json({ error: "Artikelen ophalen mislukt" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Niet geautoriseerd" }, { status: 401 })
  }

  try {
    const body = await request.json()

    const artikel = await prisma.artikel.create({
      data: {
        titel: body.titel,
        beschrijving: body.beschrijving,
        inhoud: body.inhoud || null,
        url: body.url || null,
        bron: body.bron || null,
        emoji: body.emoji || null,
        categorie: body.categorie,
        subHoofdstuk: body.subHoofdstuk || null,
        bronLabel: body.bronLabel || null,
        type: body.type || "ARTIKEL",
        status: body.status || "CONCEPT",
        belastingNiveau: body.belastingNiveau || "ALLE",
        gemeente: body.gemeente || null,
        publicatieDatum: body.publicatieDatum ? new Date(body.publicatieDatum) : null,
        sorteerVolgorde: body.sorteerVolgorde || 0,
        isActief: body.isActief !== undefined ? body.isActief : true,
        aangemaaaktDoor: session.user.id,
      },
    })

    await logAudit({
      userId: session.user.id!,
      actie: "CREATE",
      entiteit: "Artikel",
      entiteitId: artikel.id,
      details: { titel: body.titel, type: body.type, categorie: body.categorie },
    })

    return NextResponse.json({ artikel }, { status: 201 })
  } catch (error) {
    console.error("Artikel aanmaken mislukt:", error)
    return NextResponse.json({ error: "Artikel aanmaken mislukt" }, { status: 500 })
  }
}
