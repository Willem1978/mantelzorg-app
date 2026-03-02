import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Niet geautoriseerd" }, { status: 401 })
  }

  try {
    const tags = await prisma.contentTag.findMany({
      orderBy: [{ type: "asc" }, { volgorde: "asc" }],
      include: {
        _count: { select: { artikelTags: true } },
      },
    })

    return NextResponse.json({ tags })
  } catch (error) {
    console.error("Content tags ophalen mislukt:", error)
    return NextResponse.json({ error: "Tags ophalen mislukt" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Niet geautoriseerd" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { type, slug, naam, beschrijving, emoji, volgorde } = body

    if (!type || !slug || !naam) {
      return NextResponse.json({ error: "type, slug en naam zijn verplicht" }, { status: 400 })
    }

    const tag = await prisma.contentTag.create({
      data: {
        type,
        slug,
        naam,
        beschrijving: beschrijving || null,
        emoji: emoji || null,
        volgorde: volgorde || 0,
      },
    })

    return NextResponse.json({ tag }, { status: 201 })
  } catch (error) {
    console.error("Content tag aanmaken mislukt:", error)
    return NextResponse.json({ error: "Tag aanmaken mislukt" }, { status: 500 })
  }
}
