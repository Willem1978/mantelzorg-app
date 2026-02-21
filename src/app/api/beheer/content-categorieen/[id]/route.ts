import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logAudit } from "@/lib/audit"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Niet geautoriseerd" }, { status: 401 })
  }

  const { id } = await params

  try {
    const body = await request.json()

    const categorie = await prisma.contentCategorie.update({
      where: { id },
      data: {
        type: body.type,
        slug: body.slug,
        naam: body.naam,
        beschrijving: body.beschrijving || null,
        emoji: body.emoji || null,
        icon: body.icon || null,
        hint: body.hint || null,
        parentId: body.parentId || null,
        metadata: body.metadata || null,
        volgorde: body.volgorde || 0,
        isActief: body.isActief !== undefined ? body.isActief : true,
      },
    })

    await logAudit({
      userId: session.user.id!,
      actie: "UPDATE",
      entiteit: "ContentCategorie",
      entiteitId: id,
      details: { naam: body.naam, slug: body.slug },
    })

    return NextResponse.json({ categorie })
  } catch (error) {
    console.error("ContentCategorie bijwerken mislukt:", error)
    return NextResponse.json({ error: "ContentCategorie bijwerken mislukt" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Niet geautoriseerd" }, { status: 401 })
  }

  const { id } = await params

  try {
    const categorie = await prisma.contentCategorie.findUnique({ where: { id }, select: { naam: true } })
    await prisma.contentCategorie.delete({ where: { id } })

    await logAudit({
      userId: session.user.id!,
      actie: "DELETE",
      entiteit: "ContentCategorie",
      entiteitId: id,
      details: { naam: categorie?.naam },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("ContentCategorie verwijderen mislukt:", error)
    return NextResponse.json({ error: "ContentCategorie verwijderen mislukt" }, { status: 500 })
  }
}
