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
        { vraagTekst: { contains: zoek, mode: "insensitive" } },
        { beschrijving: { contains: zoek, mode: "insensitive" } },
      ]
    }

    const vragen = await prisma.balanstestVraag.findMany({
      where,
      orderBy: [{ volgorde: "asc" }, { createdAt: "desc" }],
    })

    return NextResponse.json({ vragen })
  } catch (error) {
    console.error("BalanstestVragen ophalen mislukt:", error)
    return NextResponse.json({ error: "BalanstestVragen ophalen mislukt" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Niet geautoriseerd" }, { status: 401 })
  }

  try {
    const body = await request.json()

    const vraag = await prisma.balanstestVraag.create({
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
      actie: "CREATE",
      entiteit: "BalanstestVraag",
      entiteitId: vraag.id,
      details: { vraagId: body.vraagId, type: body.type, vraagTekst: body.vraagTekst },
    })

    return NextResponse.json({ vraag }, { status: 201 })
  } catch (error) {
    console.error("BalanstestVraag aanmaken mislukt:", error)
    return NextResponse.json({ error: "BalanstestVraag aanmaken mislukt" }, { status: 500 })
  }
}
