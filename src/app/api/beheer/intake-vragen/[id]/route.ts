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

    const vraag = await prisma.intakeQuestion.update({
      where: { id },
      data: {
        categoryId: body.categoryId,
        question: body.question,
        description: body.description || null,
        type: body.type || "SCALE",
        options: body.options || null,
        order: body.order || 0,
        isRequired: body.isRequired !== undefined ? body.isRequired : true,
      },
      include: {
        category: true,
      },
    })

    await logAudit({
      userId: session.user.id!,
      actie: "UPDATE",
      entiteit: "IntakeQuestion",
      entiteitId: id,
      details: { question: body.question },
    })

    return NextResponse.json({ vraag })
  } catch (error) {
    console.error("IntakeQuestion bijwerken mislukt:", error)
    return NextResponse.json({ error: "IntakeQuestion bijwerken mislukt" }, { status: 500 })
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
    const vraag = await prisma.intakeQuestion.findUnique({ where: { id }, select: { question: true } })
    await prisma.intakeQuestion.delete({ where: { id } })

    await logAudit({
      userId: session.user.id!,
      actie: "DELETE",
      entiteit: "IntakeQuestion",
      entiteitId: id,
      details: { question: vraag?.question },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("IntakeQuestion verwijderen mislukt:", error)
    return NextResponse.json({ error: "IntakeQuestion verwijderen mislukt" }, { status: 500 })
  }
}
