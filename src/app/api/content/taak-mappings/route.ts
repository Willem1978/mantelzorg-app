import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(_request: NextRequest) {
  try {
    const mappings = await prisma.taakCategorieMapping.findMany({
      where: {
        isActief: true,
      },
      include: {
        zorgtaak: {
          select: {
            naam: true,
          },
        },
      },
    })

    return NextResponse.json({ mappings })
  } catch (error) {
    console.error("Taak mappings ophalen mislukt:", error)
    return NextResponse.json(
      { error: "Taak mappings ophalen mislukt" },
      { status: 500 }
    )
  }
}
