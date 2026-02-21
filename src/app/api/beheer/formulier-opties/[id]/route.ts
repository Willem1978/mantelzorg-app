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

    const optie = await prisma.formulierOptie.update({
      where: { id },
      data: {
        groep: body.groep,
        waarde: body.waarde,
        label: body.label,
        beschrijving: body.beschrijving || null,
        emoji: body.emoji || null,
        volgorde: body.volgorde || 0,
        isActief: body.isActief !== undefined ? body.isActief : true,
      },
    })

    await logAudit({
      userId: session.user.id!,
      actie: "UPDATE",
      entiteit: "FormulierOptie",
      entiteitId: id,
      details: { groep: body.groep, label: body.label },
    })

    return NextResponse.json({ optie })
  } catch (error) {
    console.error("FormulierOptie bijwerken mislukt:", error)
    return NextResponse.json({ error: "FormulierOptie bijwerken mislukt" }, { status: 500 })
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
    const optie = await prisma.formulierOptie.findUnique({ where: { id }, select: { label: true } })
    await prisma.formulierOptie.delete({ where: { id } })

    await logAudit({
      userId: session.user.id!,
      actie: "DELETE",
      entiteit: "FormulierOptie",
      entiteitId: id,
      details: { label: optie?.label },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("FormulierOptie verwijderen mislukt:", error)
    return NextResponse.json({ error: "FormulierOptie verwijderen mislukt" }, { status: 500 })
  }
}
