import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const tags = await prisma.contentTag.findMany({
      where: { isActief: true },
      orderBy: [{ type: "asc" }, { volgorde: "asc" }],
      select: {
        id: true,
        type: true,
        slug: true,
        naam: true,
        beschrijving: true,
        emoji: true,
      },
    })

    // Groepeer per type
    const grouped: Record<string, typeof tags> = {}
    for (const tag of tags) {
      if (!grouped[tag.type]) {
        grouped[tag.type] = []
      }
      grouped[tag.type].push(tag)
    }

    return NextResponse.json({ tags: grouped })
  } catch (error) {
    console.error("Content tags ophalen mislukt:", error)
    return NextResponse.json({ error: "Content tags ophalen mislukt" }, { status: 500 })
  }
}
