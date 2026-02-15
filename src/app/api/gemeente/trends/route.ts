import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getGemeenteSession, K_ANONIMITEIT_MINIMUM } from "@/lib/gemeente-auth"

export async function GET() {
  const { error, gemeenteNaam } = await getGemeenteSession()
  if (error) return error

  try {
    // Bepaal de periode: afgelopen 12 maanden
    const now = new Date()
    const twaalfMaandenGeleden = new Date(now.getFullYear() - 1, now.getMonth(), 1)

    // Haal alle voltooide tests op van de afgelopen 12 maanden
    const tests = await prisma.belastbaarheidTest.findMany({
      where: {
        isCompleted: true,
        gemeente: { equals: gemeenteNaam, mode: "insensitive" },
        completedAt: {
          gte: twaalfMaandenGeleden,
        },
      },
      select: {
        totaleBelastingScore: true,
        completedAt: true,
      },
      orderBy: { completedAt: "asc" },
    })

    // K-anonimiteit check op totaal
    if (tests.length < K_ANONIMITEIT_MINIMUM) {
      return NextResponse.json({
        kAnonimiteit: true,
        minimumNietBereikt: true,
        bericht: `Er zijn nog onvoldoende voltooide tests (minimaal ${K_ANONIMITEIT_MINIMUM}) in ${gemeenteNaam} voor trendgegevens.`,
        aantalTests: tests.length,
      })
    }

    // Groepeer tests per maand
    const maandMap = new Map<string, { totaalScore: number; aantal: number }>()

    // Initialiseer alle 12 maanden (ook maanden zonder data)
    for (let i = 11; i >= 0; i--) {
      const datum = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const maandSleutel = `${datum.getFullYear()}-${String(datum.getMonth() + 1).padStart(2, "0")}`
      maandMap.set(maandSleutel, { totaalScore: 0, aantal: 0 })
    }

    // Vul de maanden met testdata
    for (const test of tests) {
      if (!test.completedAt) continue
      const datum = test.completedAt
      const maandSleutel = `${datum.getFullYear()}-${String(datum.getMonth() + 1).padStart(2, "0")}`

      const bestaand = maandMap.get(maandSleutel)
      if (bestaand) {
        bestaand.totaalScore += test.totaleBelastingScore
        bestaand.aantal += 1
      }
    }

    // Bouw het resultaat op
    const trends = Array.from(maandMap.entries()).map(([maand, data]) => ({
      maand,
      gemiddeldeScore:
        data.aantal > 0
          ? Math.round((data.totaalScore / data.aantal) * 10) / 10
          : null,
      aantalTests: data.aantal,
    }))

    return NextResponse.json({
      gemeenteNaam,
      periode: {
        van: twaalfMaandenGeleden.toISOString(),
        tot: now.toISOString(),
      },
      trends,
    })
  } catch (err) {
    console.error("Gemeente trends error:", err)
    return NextResponse.json({ error: "Interne fout" }, { status: 500 })
  }
}
