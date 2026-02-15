import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Niet geautoriseerd" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get("status") || ""
  const zoek = searchParams.get("zoek") || ""

  try {
    const where: any = {}

    if (status) where.status = status
    if (zoek) {
      where.OR = [
        { voornaam: { contains: zoek, mode: "insensitive" } },
        { achternaam: { contains: zoek, mode: "insensitive" } },
        { email: { contains: zoek, mode: "insensitive" } },
        { woonplaats: { contains: zoek, mode: "insensitive" } },
      ]
    }

    const buddies = await prisma.mantelBuddy.findMany({
      where,
      include: {
        matches: {
          select: { id: true, status: true },
        },
        ontvangenBeoordelingen: {
          select: { algemeenScore: true },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    const resultaten = buddies.map((b) => ({
      id: b.id,
      voornaam: b.voornaam,
      achternaam: b.achternaam,
      email: b.email,
      telefoon: b.telefoon,
      postcode: b.postcode,
      woonplaats: b.woonplaats,
      hulpvormen: b.hulpvormen,
      beschikbaarheid: b.beschikbaarheid,
      motivatie: b.motivatie,
      status: b.status,
      vogGoedgekeurd: b.vogGoedgekeurd,
      trainingVoltooid: b.trainingVoltooid,
      isActief: b.isActief,
      gemiddeldeScore: b.gemiddeldeScore,
      aantalBeoordelingen: b.aantalBeoordelingen,
      aantalTakenVoltooid: b.aantalTakenVoltooid,
      aantalMatches: b.matches.length,
      actieveMatches: b.matches.filter((m) => m.status === "ACTIEF").length,
      createdAt: b.createdAt,
    }))

    return NextResponse.json({ buddies: resultaten })
  } catch (error) {
    console.error("MantelBuddies ophalen mislukt:", error)
    return NextResponse.json({ error: "MantelBuddies ophalen mislukt" }, { status: 500 })
  }
}
