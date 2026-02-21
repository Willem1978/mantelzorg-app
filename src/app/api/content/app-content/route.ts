import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

const VALID_TYPES = [
  "ONBOARDING",
  "TUTORIAL",
  "PAGINA_INTRO",
  "FEATURE_CARD",
] as const

type AppContentType = (typeof VALID_TYPES)[number]

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get("type")

  if (!type || !VALID_TYPES.includes(type as AppContentType)) {
    return NextResponse.json(
      { error: `Query parameter 'type' is vereist (${VALID_TYPES.join(", ")})` },
      { status: 400 }
    )
  }

  try {
    const content = await prisma.appContent.findMany({
      where: {
        type: type as AppContentType,
        isActief: true,
      },
      orderBy: { volgorde: "asc" },
    })

    return NextResponse.json({ content })
  } catch (error) {
    console.error("App content ophalen mislukt:", error)
    return NextResponse.json(
      { error: "App content ophalen mislukt" },
      { status: 500 }
    )
  }
}
