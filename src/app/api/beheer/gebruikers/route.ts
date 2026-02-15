import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Niet geautoriseerd" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const zoek = searchParams.get("zoek") || ""
  const rol = searchParams.get("rol") || ""
  const pagina = parseInt(searchParams.get("pagina") || "1")
  const perPagina = parseInt(searchParams.get("perPagina") || "20")
  const sorteer = searchParams.get("sorteer") || "createdAt"
  const richting = searchParams.get("richting") || "desc"

  try {
    const where: any = {}

    if (zoek) {
      where.OR = [
        { email: { contains: zoek, mode: "insensitive" } },
        { name: { contains: zoek, mode: "insensitive" } },
        { caregiver: { phoneNumber: { contains: zoek } } },
      ]
    }

    if (rol) {
      where.role = rol
    }

    const [gebruikers, totaal] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          caregiver: {
            select: {
              id: true,
              phoneNumber: true,
              municipality: true,
              onboardedAt: true,
              profileCompleted: true,
              careHoursPerWeek: true,
            },
          },
          mantelBuddy: {
            select: {
              id: true,
              status: true,
              voornaam: true,
              achternaam: true,
              gemiddeldeScore: true,
            },
          },
        },
        orderBy: { [sorteer]: richting },
        skip: (pagina - 1) * perPagina,
        take: perPagina,
      }),
      prisma.user.count({ where }),
    ])

    // Haal laatste belastbaarheidsscore op voor elke caregiver
    const caregiverIds = gebruikers
      .filter((g) => g.caregiver)
      .map((g) => g.caregiver!.id)

    const laatsteTests = caregiverIds.length > 0
      ? await prisma.belastbaarheidTest.findMany({
          where: {
            caregiverId: { in: caregiverIds },
            isCompleted: true,
          },
          orderBy: { completedAt: "desc" },
          distinct: ["caregiverId"],
          select: {
            caregiverId: true,
            totaleBelastingScore: true,
            belastingNiveau: true,
            completedAt: true,
          },
        })
      : []

    const testMap = new Map(laatsteTests.map((t) => [t.caregiverId, t]))

    const resultaten = gebruikers.map((g) => ({
      id: g.id,
      email: g.email,
      name: g.name,
      role: g.role,
      createdAt: g.createdAt,
      updatedAt: g.updatedAt,
      municipality: g.caregiver?.municipality || null,
      phoneNumber: g.caregiver?.phoneNumber || null,
      onboarded: !!g.caregiver?.onboardedAt,
      profileCompleted: g.caregiver?.profileCompleted || false,
      careHoursPerWeek: g.caregiver?.careHoursPerWeek || null,
      buddyStatus: g.mantelBuddy?.status || null,
      buddyScore: g.mantelBuddy?.gemiddeldeScore || null,
      laatsteTest: g.caregiver ? testMap.get(g.caregiver.id) || null : null,
    }))

    return NextResponse.json({
      gebruikers: resultaten,
      totaal,
      pagina,
      perPagina,
      totaalPaginas: Math.ceil(totaal / perPagina),
    })
  } catch (error) {
    console.error("Gebruikers ophalen mislukt:", error)
    return NextResponse.json({ error: "Gebruikers ophalen mislukt" }, { status: 500 })
  }
}
