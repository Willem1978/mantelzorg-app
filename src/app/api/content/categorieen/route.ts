import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

const VALID_TYPES = [
  "LEREN",
  "SUB_HOOFDSTUK",
  "HULPVRAAG",
  "HULP_ZORGVRAGER",
  "HULP_MANTELZORGER",
] as const

type CategorieType = (typeof VALID_TYPES)[number]

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get("type")

  if (!type || !VALID_TYPES.includes(type as CategorieType)) {
    return NextResponse.json(
      { error: `Query parameter 'type' is vereist (${VALID_TYPES.join(", ")})` },
      { status: 400 }
    )
  }

  try {
    const categorieen = await prisma.contentCategorie.findMany({
      where: {
        type: type as CategorieType,
        isActief: true,
      },
      orderBy: { volgorde: "asc" },
      ...(type === "LEREN" && {
        include: {
          children: {
            where: { isActief: true },
            orderBy: { volgorde: "asc" },
          },
        },
      }),
    })

    return NextResponse.json({ categorieen })
  } catch (error) {
    console.error("Categorieen ophalen mislukt:", error)
    return NextResponse.json(
      { error: "Categorieen ophalen mislukt" },
      { status: 500 }
    )
  }
}
