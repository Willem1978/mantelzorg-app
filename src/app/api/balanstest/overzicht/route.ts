import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

// GET: Alle balanstests ophalen voor overzichtspagina
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.caregiverId) {
      return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 })
    }

    const caregiverId = session.user.caregiverId

    // Haal alle voltooide tests op, nieuwste eerst
    const tests = await prisma.belastbaarheidTest.findMany({
      where: {
        caregiverId,
        isCompleted: true,
      },
      orderBy: { completedAt: "desc" },
      select: {
        id: true,
        totaleBelastingScore: true,
        belastingNiveau: true,
        totaleZorguren: true,
        completedAt: true,
        taakSelecties: {
          where: { isGeselecteerd: true },
          select: {
            taakNaam: true,
            moeilijkheid: true,
            urenPerWeek: true,
          },
        },
      },
    })

    // Bereken of een nieuwe test nodig is (na 90 dagen)
    const laatsteTest = tests[0] || null
    let needsNewTest = true
    let daysSinceLastTest: number | null = null

    if (laatsteTest?.completedAt) {
      const now = new Date()
      daysSinceLastTest = Math.floor(
        (now.getTime() - new Date(laatsteTest.completedAt).getTime()) / (1000 * 60 * 60 * 24)
      )
      needsNewTest = daysSinceLastTest >= 90
    }

    return NextResponse.json({
      tests: tests.map((t) => ({
        id: t.id,
        score: t.totaleBelastingScore,
        niveau: t.belastingNiveau,
        totaleZorguren: t.totaleZorguren,
        datum: t.completedAt,
        aantalTaken: t.taakSelecties.length,
        zwareTaken: t.taakSelecties.filter(
          (ts) => {
            const m = ts.moeilijkheid as string | null
            return m === "MOEILIJK" || m === "ZEER_MOEILIJK" || m === "JA"
          }
        ).length,
        taken: t.taakSelecties.map((ts) => ({
          naam: ts.taakNaam,
          uren: ts.urenPerWeek || 0,
          moeilijkheid: ts.moeilijkheid as string | null,
        })),
      })),
      needsNewTest,
      daysSinceLastTest,
    })
  } catch (error) {
    console.error("Balanstest overzicht GET error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
