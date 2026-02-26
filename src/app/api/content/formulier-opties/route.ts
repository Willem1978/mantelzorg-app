import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

const VALID_GROEPEN = [
  "RELATIE",
  "UREN_PER_WEEK",
  "ZORGDUUR",
  "UREN_BALANSTEST",
  "BUDDY_HULPVORM",
  "BUDDY_BESCHIKBAARHEID",
  "CHECKIN_HULP",
] as const

type OptieGroep = (typeof VALID_GROEPEN)[number]

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const groep = searchParams.get("groep")

  if (!groep || !VALID_GROEPEN.includes(groep as OptieGroep)) {
    return NextResponse.json(
      { error: `Query parameter 'groep' is vereist (${VALID_GROEPEN.join(", ")})` },
      { status: 400 }
    )
  }

  try {
    const opties = await prisma.formulierOptie.findMany({
      where: {
        groep: groep as OptieGroep,
        isActief: true,
      },
      orderBy: { volgorde: "asc" },
    })

    return NextResponse.json({ opties })
  } catch (error) {
    console.error("Formulier opties ophalen mislukt:", error)
    return NextResponse.json(
      { error: "Formulier opties ophalen mislukt" },
      { status: 500 }
    )
  }
}
