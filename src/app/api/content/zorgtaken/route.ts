import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const revalidate = 3600

export async function GET(_request: NextRequest) {
  try {
    const zorgtaken = await prisma.zorgtaak.findMany({
      where: {
        isActief: true,
      },
      orderBy: { volgorde: "asc" },
    })

    return NextResponse.json({ zorgtaken })
  } catch (error) {
    console.error("Zorgtaken ophalen mislukt:", error)
    return NextResponse.json(
      { error: "Zorgtaken ophalen mislukt" },
      { status: 500 }
    )
  }
}
