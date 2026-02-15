import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Niet geautoriseerd" }, { status: 401 })
  }

  const { id } = await params

  try {
    const body = await request.json()

    const artikel = await prisma.artikel.update({
      where: { id },
      data: {
        titel: body.titel,
        beschrijving: body.beschrijving,
        inhoud: body.inhoud || null,
        url: body.url || null,
        bron: body.bron || null,
        emoji: body.emoji || null,
        categorie: body.categorie,
        type: body.type || "ARTIKEL",
        status: body.status || "CONCEPT",
        belastingNiveau: body.belastingNiveau || "ALLE",
        gemeente: body.gemeente || null,
        publicatieDatum: body.publicatieDatum ? new Date(body.publicatieDatum) : null,
        sorteerVolgorde: body.sorteerVolgorde || 0,
        isActief: body.isActief !== undefined ? body.isActief : true,
      },
    })

    return NextResponse.json({ artikel })
  } catch (error) {
    console.error("Artikel bijwerken mislukt:", error)
    return NextResponse.json({ error: "Artikel bijwerken mislukt" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Niet geautoriseerd" }, { status: 401 })
  }

  const { id } = await params

  try {
    await prisma.artikel.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Artikel verwijderen mislukt:", error)
    return NextResponse.json({ error: "Artikel verwijderen mislukt" }, { status: 500 })
  }
}
