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
  const type = searchParams.get("type") || ""
  const zoek = searchParams.get("zoek") || ""

  try {
    const where: Record<string, unknown> = {}

    if (type) where.type = type
    if (zoek) {
      where.OR = [
        { titel: { contains: zoek, mode: "insensitive" } },
        { inhoud: { contains: zoek, mode: "insensitive" } },
        { sleutel: { contains: zoek, mode: "insensitive" } },
      ]
    }

    const content = await prisma.appContent.findMany({
      where,
      orderBy: [{ type: "asc" }, { volgorde: "asc" }, { createdAt: "desc" }],
    })

    return NextResponse.json({ content })
  } catch (error) {
    console.error("AppContent ophalen mislukt:", error)
    return NextResponse.json({ error: "AppContent ophalen mislukt" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Niet geautoriseerd" }, { status: 401 })
  }

  try {
    const body = await request.json()

    const content = await prisma.appContent.create({
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
      actie: "CREATE",
      entiteit: "AppContent",
      entiteitId: content.id,
      details: { type: body.type, sleutel: body.sleutel, titel: body.titel },
    })

    return NextResponse.json({ content }, { status: 201 })
  } catch (error) {
    console.error("AppContent aanmaken mislukt:", error)
    return NextResponse.json({ error: "AppContent aanmaken mislukt" }, { status: 500 })
  }
}
