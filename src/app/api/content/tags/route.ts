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
        emoji: true,
      },
    })

    const aandoeningen = tags.filter((t) => t.type === "AANDOENING")
    const situaties = tags.filter((t) => t.type === "SITUATIE")

    return NextResponse.json({ aandoeningen, situaties })
  } catch (error) {
    console.error("Tags ophalen mislukt:", error)
    return NextResponse.json({ error: "Tags ophalen mislukt" }, { status: 500 })
  }
}
