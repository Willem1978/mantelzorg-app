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

    const content = await prisma.appContent.update({
      where: { id },
      data: {
        type: body.type,
        sleutel: body.sleutel,
        titel: body.titel || null,
        inhoud: body.inhoud || null,
        subtekst: body.subtekst || null,
        emoji: body.emoji || null,
        icon: body.icon || null,
        afbeelding: body.afbeelding || null,
        metadata: body.metadata || null,
        volgorde: body.volgorde || 0,
        isActief: body.isActief !== undefined ? body.isActief : true,
      },
    })

    await logAudit({
      userId: session.user.id!,
      actie: "UPDATE",
      entiteit: "AppContent",
      entiteitId: id,
      details: { sleutel: body.sleutel, titel: body.titel },
    })

    return NextResponse.json({ content })
  } catch (error) {
    console.error("AppContent bijwerken mislukt:", error)
    return NextResponse.json({ error: "AppContent bijwerken mislukt" }, { status: 500 })
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
    const content = await prisma.appContent.findUnique({ where: { id }, select: { titel: true } })
    await prisma.appContent.delete({ where: { id } })

    await logAudit({
      userId: session.user.id!,
      actie: "DELETE",
      entiteit: "AppContent",
      entiteitId: id,
      details: { titel: content?.titel },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("AppContent verwijderen mislukt:", error)
    return NextResponse.json({ error: "AppContent verwijderen mislukt" }, { status: 500 })
  }
}
