import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getGemeenteSession, K_ANONIMITEIT_MINIMUM } from "@/lib/gemeente-auth"

export async function GET() {
  const { error, gemeenteNaam } = await getGemeenteSession()
  if (error) return error

  try {
    // Haal alle voltooide tests op voor deze gemeente
    const tests = await prisma.belastbaarheidTest.findMany({
      where: {
        isCompleted: true,
        gemeente: { equals: gemeenteNaam, mode: "insensitive" },
      },
      select: {
        totaleBelastingScore: true,
        belastingNiveau: true,
        totaleZorguren: true,
      },
    })

    // K-anonimiteit check
    if (tests.length < K_ANONIMITEIT_MINIMUM) {
      return NextResponse.json({
        kAnonimiteit: true,
        minimumNietBereikt: true,
        bericht: `Er zijn nog onvoldoende voltooide tests (minimaal ${K_ANONIMITEIT_MINIMUM}) in ${gemeenteNaam} voor geanonimiseerde demografische statistieken.`,
        aantalTests: tests.length,
      })
    }

    // Verdeling belastingniveaus
    const belastingNiveauVerdeling = {
      LAAG: tests.filter((t) => t.belastingNiveau === "LAAG").length,
      GEMIDDELD: tests.filter((t) => t.belastingNiveau === "GEMIDDELD").length,
      HOOG: tests.filter((t) => t.belastingNiveau === "HOOG").length,
    }

    // Gemiddeld zorguren per week
    const testsMetZorguren = tests.filter((t) => t.totaleZorguren > 0)
    const gemiddeldZorguren =
      testsMetZorguren.length > 0
        ? Math.round(
            (testsMetZorguren.reduce((sum, t) => sum + t.totaleZorguren, 0) /
              testsMetZorguren.length) *
              10
          ) / 10
        : 0

    // Zorguren verdeling in buckets
    const zorgurenVerdeling = {
      "0-10": tests.filter((t) => t.totaleZorguren >= 0 && t.totaleZorguren < 10).length,
      "10-20": tests.filter((t) => t.totaleZorguren >= 10 && t.totaleZorguren < 20).length,
      "20-40": tests.filter((t) => t.totaleZorguren >= 20 && t.totaleZorguren < 40).length,
      "40+": tests.filter((t) => t.totaleZorguren >= 40).length,
    }

    // Score verdeling in buckets
    const scoreVerdeling = {
      "0-8": tests.filter(
        (t) => t.totaleBelastingScore >= 0 && t.totaleBelastingScore < 8
      ).length,
      "8-16": tests.filter(
        (t) => t.totaleBelastingScore >= 8 && t.totaleBelastingScore < 16
      ).length,
      "16-24": tests.filter((t) => t.totaleBelastingScore >= 16).length,
    }

    return NextResponse.json({
      gemeenteNaam,
      aantalTests: tests.length,
      belastingNiveauVerdeling,
      gemiddeldZorguren,
      zorgurenVerdeling,
      scoreVerdeling,
    })
  } catch (err) {
    console.error("Gemeente demografie error:", err)
    return NextResponse.json({ error: "Interne fout" }, { status: 500 })
  }
}
