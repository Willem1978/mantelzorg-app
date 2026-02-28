import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

/**
 * GET /api/beheer/gemeenten/hulpbronnen-zoek?gemeente=Amsterdam
 *
 * Zoek bestaande zorgorganisaties die bij een gemeente horen.
 * Gebruikt door de gemeente onboarding wizard (stap 3).
 */
export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Niet geautoriseerd" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const gemeente = searchParams.get("gemeente")

  if (!gemeente) {
    return NextResponse.json({ error: "Gemeente parameter is verplicht" }, { status: 400 })
  }

  try {
    // Zoek organisaties voor deze gemeente
    const organisaties = await prisma.zorgorganisatie.findMany({
      where: {
        gemeente: { equals: gemeente, mode: "insensitive" },
      },
      select: {
        id: true,
        naam: true,
        type: true,
        dienst: true,
        telefoon: true,
        website: true,
        gemeente: true,
      },
      orderBy: { naam: "asc" },
    })

    return NextResponse.json({
      organisaties,
      totaal: organisaties.length,
    })
  } catch (error) {
    console.error("Hulpbronnen zoeken mislukt:", error)
    return NextResponse.json({ error: "Zoeken mislukt" }, { status: 500 })
  }
}
