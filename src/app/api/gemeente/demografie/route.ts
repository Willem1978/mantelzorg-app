import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getGemeenteSession, K_ANONIMITEIT_MINIMUM, logGemeenteAudit } from "@/lib/gemeente-auth"

export async function GET() {
  const { error, gemeenteNaam, userId } = await getGemeenteSession()
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

    // Haal alle mantelzorgers op voor deze gemeente
    const caregivers = await prisma.caregiver.findMany({
      where: {
        municipality: { equals: gemeenteNaam, mode: "insensitive" },
      },
      select: {
        dateOfBirth: true,
        careRecipient: true,
        neighborhood: true,
        careSince: true,
      },
    })

    // K-anonimiteit check voor mantelzorgers
    if (caregivers.length < K_ANONIMITEIT_MINIMUM) {
      return NextResponse.json({
        gemeenteNaam,
        aantalTests: tests.length,
        belastingNiveauVerdeling,
        gemiddeldZorguren,
        zorgurenVerdeling,
        scoreVerdeling,
        aantalMantelzorgers: caregivers.length,
        leeftijdVerdeling: null,
        zorgrelatie: null,
        wijkVerdeling: null,
        zorgsince: null,
        kAnonimiteit: true,
        berichtMantelzorgers: `Er zijn nog onvoldoende mantelzorgers (minimaal ${K_ANONIMITEIT_MINIMUM}) in ${gemeenteNaam} voor geanonimiseerde demografische statistieken.`,
      })
    }

    // Leeftijdverdeling op basis van geboortedatum
    const now = new Date()
    const getAge = (dateOfBirth: Date | null): number | null => {
      if (!dateOfBirth) return null
      const age = now.getFullYear() - dateOfBirth.getFullYear()
      const monthDiff = now.getMonth() - dateOfBirth.getMonth()
      if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dateOfBirth.getDate())) {
        return age - 1
      }
      return age
    }

    const leeftijdVerdeling = {
      "18-30": 0,
      "31-45": 0,
      "46-60": 0,
      "61-75": 0,
      "75+": 0,
      "Onbekend": 0,
    }

    for (const c of caregivers) {
      const age = getAge(c.dateOfBirth)
      if (age === null) {
        leeftijdVerdeling["Onbekend"]++
      } else if (age >= 18 && age <= 30) {
        leeftijdVerdeling["18-30"]++
      } else if (age >= 31 && age <= 45) {
        leeftijdVerdeling["31-45"]++
      } else if (age >= 46 && age <= 60) {
        leeftijdVerdeling["46-60"]++
      } else if (age >= 61 && age <= 75) {
        leeftijdVerdeling["61-75"]++
      } else if (age > 75) {
        leeftijdVerdeling["75+"]++
      } else {
        leeftijdVerdeling["Onbekend"]++
      }
    }

    // Zorgrelatie verdeling op basis van careRecipient
    const bekendZorgrelaties = ["partner", "ouder", "kind", "familielid", "kennis"]
    const zorgrelatie: Record<string, number> = {
      partner: 0,
      ouder: 0,
      kind: 0,
      familielid: 0,
      kennis: 0,
      "Overig/Onbekend": 0,
    }

    for (const c of caregivers) {
      const value = c.careRecipient?.toLowerCase().trim() ?? null
      if (value && bekendZorgrelaties.includes(value)) {
        zorgrelatie[value]++
      } else {
        zorgrelatie["Overig/Onbekend"]++
      }
    }

    // Wijk verdeling op basis van neighborhood
    const wijkVerdeling: Record<string, number> = {}

    for (const c of caregivers) {
      const wijk = c.neighborhood?.trim() || "Onbekend"
      wijkVerdeling[wijk] = (wijkVerdeling[wijk] || 0) + 1
    }

    // Zorgduur verdeling op basis van careSince
    const zorgsince = {
      "< 1 jaar": 0,
      "1-3 jaar": 0,
      "3-5 jaar": 0,
      "> 5 jaar": 0,
      "Onbekend": 0,
    }

    for (const c of caregivers) {
      if (!c.careSince) {
        zorgsince["Onbekend"]++
      } else {
        const diffMs = now.getTime() - c.careSince.getTime()
        const diffYears = diffMs / (1000 * 60 * 60 * 24 * 365.25)
        if (diffYears < 1) {
          zorgsince["< 1 jaar"]++
        } else if (diffYears < 3) {
          zorgsince["1-3 jaar"]++
        } else if (diffYears < 5) {
          zorgsince["3-5 jaar"]++
        } else {
          zorgsince["> 5 jaar"]++
        }
      }
    }

    logGemeenteAudit(userId, "BEKEKEN", "Demografie", { gemeente: gemeenteNaam })

    return NextResponse.json({
      gemeenteNaam,
      aantalTests: tests.length,
      aantalMantelzorgers: caregivers.length,
      belastingNiveauVerdeling,
      gemiddeldZorguren,
      zorgurenVerdeling,
      scoreVerdeling,
      leeftijdVerdeling,
      zorgrelatie,
      wijkVerdeling,
      zorgsince,
    })
  } catch (err) {
    console.error("Gemeente demografie error:", err)
    return NextResponse.json({ error: "Interne fout" }, { status: 500 })
  }
}
