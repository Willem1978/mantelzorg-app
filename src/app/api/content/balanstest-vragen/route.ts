import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get("type")

  if (!type || !["BALANSTEST", "CHECKIN"].includes(type)) {
    return NextResponse.json(
      { error: "Query parameter 'type' is vereist (BALANSTEST of CHECKIN)" },
      { status: 400 }
    )
  }

  try {
    const vragen = await prisma.balanstestVraag.findMany({
      where: {
        type: type as "BALANSTEST" | "CHECKIN",
        isActief: true,
      },
      orderBy: { volgorde: "asc" },
    })

    return NextResponse.json({ vragen })
  } catch (error) {
    console.error("Balanstest vragen ophalen mislukt:", error)
    return NextResponse.json(
      { error: "Balanstest vragen ophalen mislukt" },
      { status: 500 }
    )
  }
}
