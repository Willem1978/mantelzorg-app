import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Niet geautoriseerd" }, { status: 401 })
  }

  const sleutel = new URL(request.url).searchParams.get("sleutel")
  if (!sleutel) {
    return NextResponse.json({ error: "Sleutel is verplicht" }, { status: 400 })
  }

  try {
    const setting = await prisma.siteSettings.findUnique({ where: { sleutel } })
    if (!setting) {
      return NextResponse.json({ error: "Niet gevonden" }, { status: 404 })
    }
    return NextResponse.json(setting)
  } catch {
    return NextResponse.json({ error: "Ophalen mislukt" }, { status: 500 })
  }
}
