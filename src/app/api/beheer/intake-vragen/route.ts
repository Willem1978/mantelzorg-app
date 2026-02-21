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
  const zoek = searchParams.get("zoek") || ""

  try {
    const where: Record<string, unknown> = {}

    if (zoek) {
      where.OR = [
        { question: { contains: zoek, mode: "insensitive" } },
        { description: { contains: zoek, mode: "insensitive" } },
      ]
    }

    const vragen = await prisma.intakeQuestion.findMany({
      where,
      include: {
        category: true,
      },
      orderBy: [{ order: "asc" }],
    })

    return NextResponse.json({ vragen })
  } catch (error) {
    console.error("IntakeVragen ophalen mislukt:", error)
    return NextResponse.json({ error: "IntakeVragen ophalen mislukt" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Niet geautoriseerd" }, { status: 401 })
  }

  try {
    const body = await request.json()

    const vraag = await prisma.intakeQuestion.create({
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
      actie: "CREATE",
      entiteit: "IntakeQuestion",
      entiteitId: vraag.id,
      details: { question: body.question, categoryId: body.categoryId },
    })

    return NextResponse.json({ vraag }, { status: 201 })
  } catch (error) {
    console.error("IntakeQuestion aanmaken mislukt:", error)
    return NextResponse.json({ error: "IntakeQuestion aanmaken mislukt" }, { status: 500 })
  }
}
