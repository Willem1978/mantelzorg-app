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
        { naam: { contains: zoek, mode: "insensitive" } },
        { beschrijving: { contains: zoek, mode: "insensitive" } },
      ]
    }

    const zorgtaken = await prisma.zorgtaak.findMany({
      where,
      include: {
        _count: {
          select: { mappings: true },
        },
      },
      orderBy: [{ volgorde: "asc" }, { createdAt: "desc" }],
    })

    return NextResponse.json({ zorgtaken })
  } catch (error) {
    console.error("Zorgtaken ophalen mislukt:", error)
    return NextResponse.json({ error: "Zorgtaken ophalen mislukt" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Niet geautoriseerd" }, { status: 401 })
  }

  try {
    const body = await request.json()

    const zorgtaak = await prisma.zorgtaak.create({
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
      actie: "CREATE",
      entiteit: "Zorgtaak",
      entiteitId: zorgtaak.id,
      details: { taakId: body.taakId, naam: body.naam },
    })

    return NextResponse.json({ zorgtaak }, { status: 201 })
  } catch (error) {
    console.error("Zorgtaak aanmaken mislukt:", error)
    return NextResponse.json({ error: "Zorgtaak aanmaken mislukt" }, { status: 500 })
  }
}
