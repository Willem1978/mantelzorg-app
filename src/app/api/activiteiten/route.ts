import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/activiteiten — activiteiten voor de ingelogde gebruiker (op woonplaats)
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 })
  }

  const caregiver = await prisma.caregiver.findUnique({
    where: { userId: session.user.id },
    select: { city: true, municipality: true },
  })

  const { searchParams } = new URL(req.url)
  const woonplaats = searchParams.get("woonplaats") || caregiver?.city
  const type = searchParams.get("type")

  if (!woonplaats) {
    return NextResponse.json({ activiteiten: [], bericht: "Geen woonplaats bekend. Vul je profiel aan." })
  }

  const where: Record<string, unknown> = {
    isActief: true,
    isGevalideerd: true,
  }

  // Zoek op woonplaats OF gemeente (voor bredere dekking)
  where.OR = [
    { woonplaats: { equals: woonplaats, mode: "insensitive" } },
    { gemeente: { equals: caregiver?.municipality || "", mode: "insensitive" } },
  ]

  if (type && type !== "alle") {
    where.type = type
  }

  const activiteiten = await prisma.activiteit.findMany({
    where,
    orderBy: [{ type: "asc" }, { naam: "asc" }],
  })

  return NextResponse.json({ activiteiten, woonplaats })
}
