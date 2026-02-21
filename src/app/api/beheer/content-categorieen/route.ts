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
        { naam: { contains: zoek, mode: "insensitive" } },
        { beschrijving: { contains: zoek, mode: "insensitive" } },
      ]
    }

    const categorieen = await prisma.contentCategorie.findMany({
      where,
      include: {
        children: {
          orderBy: { volgorde: "asc" },
        },
      },
      orderBy: [{ volgorde: "asc" }, { createdAt: "desc" }],
    })

    return NextResponse.json({ categorieen })
  } catch (error) {
    console.error("ContentCategorieen ophalen mislukt:", error)
    return NextResponse.json({ error: "ContentCategorieen ophalen mislukt" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Niet geautoriseerd" }, { status: 401 })
  }

  try {
    const body = await request.json()

    const categorie = await prisma.contentCategorie.create({
      data: {
        type: body.type,
        slug: body.slug,
        naam: body.naam,
        beschrijving: body.beschrijving || null,
        emoji: body.emoji || null,
        icon: body.icon || null,
        hint: body.hint || null,
        parentId: body.parentId || null,
        metadata: body.metadata || null,
        volgorde: body.volgorde || 0,
        isActief: body.isActief !== undefined ? body.isActief : true,
      },
    })

    await logAudit({
      userId: session.user.id!,
      actie: "CREATE",
      entiteit: "ContentCategorie",
      entiteitId: categorie.id,
      details: { naam: body.naam, type: body.type, slug: body.slug },
    })

    return NextResponse.json({ categorie }, { status: 201 })
  } catch (error) {
    console.error("ContentCategorie aanmaken mislukt:", error)
    return NextResponse.json({ error: "ContentCategorie aanmaken mislukt" }, { status: 500 })
  }
}
