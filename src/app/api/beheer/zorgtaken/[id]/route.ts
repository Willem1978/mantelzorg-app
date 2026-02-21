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

    const zorgtaak = await prisma.zorgtaak.update({
      where: { id },
      data: {
        taakId: body.taakId,
        naam: body.naam,
        beschrijving: body.beschrijving || null,
        categorie: body.categorie || null,
        emoji: body.emoji || null,
        icon: body.icon || null,
        kort: body.kort || null,
        routeLabel: body.routeLabel || null,
        groep: body.groep || null,
        volgorde: body.volgorde || 0,
        isActief: body.isActief !== undefined ? body.isActief : true,
      },
    })

    await logAudit({
      userId: session.user.id!,
      actie: "UPDATE",
      entiteit: "Zorgtaak",
      entiteitId: id,
      details: { taakId: body.taakId, naam: body.naam },
    })

    return NextResponse.json({ zorgtaak })
  } catch (error) {
    console.error("Zorgtaak bijwerken mislukt:", error)
    return NextResponse.json({ error: "Zorgtaak bijwerken mislukt" }, { status: 500 })
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
    const zorgtaak = await prisma.zorgtaak.findUnique({ where: { id }, select: { naam: true } })
    await prisma.zorgtaak.delete({ where: { id } })

    await logAudit({
      userId: session.user.id!,
      actie: "DELETE",
      entiteit: "Zorgtaak",
      entiteitId: id,
      details: { naam: zorgtaak?.naam },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Zorgtaak verwijderen mislukt:", error)
    return NextResponse.json({ error: "Zorgtaak verwijderen mislukt" }, { status: 500 })
  }
}
