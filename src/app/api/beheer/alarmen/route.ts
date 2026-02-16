import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Niet geautoriseerd" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get("status") || "open" // open, afgehandeld, alle
  const urgentie = searchParams.get("urgentie") || ""
  const type = searchParams.get("type") || ""

  try {
    const where: Record<string, unknown> = {}

    if (status === "open") where.isAfgehandeld = false
    else if (status === "afgehandeld") where.isAfgehandeld = true

    if (urgentie) where.urgentie = urgentie
    if (type) where.type = type

    const alarmen = await prisma.alarmLog.findMany({
      where,
      include: {
        test: {
          select: {
            id: true,
            voornaam: true,
            email: true,
            gemeente: true,
            totaleBelastingScore: true,
            belastingNiveau: true,
            completedAt: true,
            caregiverId: true,
          },
        },
      },
      orderBy: [
        { isAfgehandeld: "asc" },
        { urgentie: "desc" },
        { createdAt: "desc" },
      ],
    })

    return NextResponse.json({ alarmen })
  } catch (error) {
    console.error("Alarmen ophalen mislukt:", error)
    return NextResponse.json({ error: "Alarmen ophalen mislukt" }, { status: 500 })
  }
}
