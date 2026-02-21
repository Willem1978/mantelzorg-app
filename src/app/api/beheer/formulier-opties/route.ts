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
  const groep = searchParams.get("groep") || ""
  const zoek = searchParams.get("zoek") || ""

  try {
    const where: Record<string, unknown> = {}

    if (groep) where.groep = groep
    if (zoek) {
      where.OR = [
        { label: { contains: zoek, mode: "insensitive" } },
        { beschrijving: { contains: zoek, mode: "insensitive" } },
      ]
    }

    const opties = await prisma.formulierOptie.findMany({
      where,
      orderBy: [{ groep: "asc" }, { volgorde: "asc" }, { createdAt: "desc" }],
    })

    return NextResponse.json({ opties })
  } catch (error) {
    console.error("FormulierOpties ophalen mislukt:", error)
    return NextResponse.json({ error: "FormulierOpties ophalen mislukt" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Niet geautoriseerd" }, { status: 401 })
  }

  try {
    const body = await request.json()

    const optie = await prisma.formulierOptie.create({
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
      actie: "CREATE",
      entiteit: "FormulierOptie",
      entiteitId: optie.id,
      details: { groep: body.groep, waarde: body.waarde, label: body.label },
    })

    return NextResponse.json({ optie }, { status: 201 })
  } catch (error) {
    console.error("FormulierOptie aanmaken mislukt:", error)
    return NextResponse.json({ error: "FormulierOptie aanmaken mislukt" }, { status: 500 })
  }
}
