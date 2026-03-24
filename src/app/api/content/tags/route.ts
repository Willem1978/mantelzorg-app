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
        groep: true,
      },
    })

    const zorgthemas = tags.filter((t) => t.type === "ZORGTHEMA")
    const situaties = tags.filter((t) => t.type === "SITUATIE")
    const onderwerpen = tags.filter((t) => t.type === "ONDERWERP")

    return NextResponse.json({
      zorgthemas,
      situaties,
      onderwerpen,
      // backward-compat alias
      aandoeningen: zorgthemas,
    })
  } catch (error) {
    console.error("Tags ophalen mislukt:", error)
    return NextResponse.json({ error: "Tags ophalen mislukt" }, { status: 500 })
  }
}
