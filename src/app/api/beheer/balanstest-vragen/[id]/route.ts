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

    const vraag = await prisma.balanstestVraag.update({
      where: { id },
      data: {
        type: body.type,
        vraagId: body.vraagId,
        vraagTekst: body.vraagTekst,
        beschrijving: body.beschrijving || null,
        tip: body.tip || null,
        sectie: body.sectie || null,
        opties: body.opties || null,
        gewicht: body.gewicht || 1.0,
        reversed: body.reversed || false,
        isMultiSelect: body.isMultiSelect || false,
        emoji: body.emoji || null,
        volgorde: body.volgorde || 0,
        isActief: body.isActief !== undefined ? body.isActief : true,
      },
    })

    await logAudit({
      userId: session.user.id!,
      actie: "UPDATE",
      entiteit: "BalanstestVraag",
      entiteitId: id,
      details: { vraagId: body.vraagId, vraagTekst: body.vraagTekst },
    })

    return NextResponse.json({ vraag })
  } catch (error) {
    console.error("BalanstestVraag bijwerken mislukt:", error)
    return NextResponse.json({ error: "BalanstestVraag bijwerken mislukt" }, { status: 500 })
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
    const vraag = await prisma.balanstestVraag.findUnique({ where: { id }, select: { vraagTekst: true } })
    await prisma.balanstestVraag.delete({ where: { id } })

    await logAudit({
      userId: session.user.id!,
      actie: "DELETE",
      entiteit: "BalanstestVraag",
      entiteitId: id,
      details: { vraagTekst: vraag?.vraagTekst },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("BalanstestVraag verwijderen mislukt:", error)
    return NextResponse.json({ error: "BalanstestVraag verwijderen mislukt" }, { status: 500 })
  }
}
