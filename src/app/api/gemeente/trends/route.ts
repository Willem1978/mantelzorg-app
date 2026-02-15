import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getGemeenteSession, K_ANONIMITEIT_MINIMUM, logGemeenteAudit } from "@/lib/gemeente-auth"

export async function GET() {
  const { error, gemeenteNaam, userId } = await getGemeenteSession()
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

    // ============================================
    // SEIZOENSDATA: Groepeer tests per kwartaal
    // ============================================
    const alleVoltooideTests = await prisma.belastbaarheidTest.findMany({
      where: {
        isCompleted: true,
        gemeente: { equals: gemeenteNaam, mode: "insensitive" },
        completedAt: { not: null },
      },
      select: {
        totaleBelastingScore: true,
        completedAt: true,
      },
    })

    const kwartaalMap = new Map<string, { totaalScore: number; aantal: number }>()
    kwartaalMap.set("Q1", { totaalScore: 0, aantal: 0 })
    kwartaalMap.set("Q2", { totaalScore: 0, aantal: 0 })
    kwartaalMap.set("Q3", { totaalScore: 0, aantal: 0 })
    kwartaalMap.set("Q4", { totaalScore: 0, aantal: 0 })

    for (const test of alleVoltooideTests) {
      if (!test.completedAt) continue
      const maand = test.completedAt.getMonth() // 0-11
      let kwartaal: string
      if (maand <= 2) kwartaal = "Q1"
      else if (maand <= 5) kwartaal = "Q2"
      else if (maand <= 8) kwartaal = "Q3"
      else kwartaal = "Q4"

      const entry = kwartaalMap.get(kwartaal)!
      entry.totaalScore += test.totaleBelastingScore
      entry.aantal += 1
    }

    const seizoensData = Array.from(kwartaalMap.entries()).map(([kwartaal, data]) => ({
      kwartaal,
      gemiddeldeScore:
        data.aantal > 0
          ? Math.round((data.totaalScore / data.aantal) * 10) / 10
          : null,
      aantalTests: data.aantal,
    }))

    // ============================================
    // EFFECTIVITEIT: Registratie -> Test -> Hulpvraag metrics
    // ============================================

    // Totaal aantal mantelzorgers in deze gemeente
    const totaalMantelzorgers = await prisma.caregiver.count({
      where: {
        OR: [
          { municipality: { equals: gemeenteNaam, mode: "insensitive" } },
          { careRecipientMunicipality: { equals: gemeenteNaam, mode: "insensitive" } },
        ],
      },
    })

    // Mantelzorgers die geregistreerd zijn EN minstens 1 voltooide test hebben
    const mantelzorgersMetTest = await prisma.caregiver.count({
      where: {
        OR: [
          { municipality: { equals: gemeenteNaam, mode: "insensitive" } },
          { careRecipientMunicipality: { equals: gemeenteNaam, mode: "insensitive" } },
        ],
        belastbaarheidTests: {
          some: {
            isCompleted: true,
          },
        },
      },
    })

    // Mantelzorgers die een test voltooiden EN minstens 1 hulpvraag hebben geplaatst
    const mantelzorgersMetTestEnHulpvraag = await prisma.caregiver.count({
      where: {
        OR: [
          { municipality: { equals: gemeenteNaam, mode: "insensitive" } },
          { careRecipientMunicipality: { equals: gemeenteNaam, mode: "insensitive" } },
        ],
        belastbaarheidTests: {
          some: {
            isCompleted: true,
          },
        },
        helpRequests: {
          some: {},
        },
      },
    })

    // Scoreverbetering: mantelzorgers met 2+ voltooide tests
    // waar de laatste score lager is dan de eerste score
    const mantelzorgersMetMeerdereTests = await prisma.caregiver.findMany({
      where: {
        OR: [
          { municipality: { equals: gemeenteNaam, mode: "insensitive" } },
          { careRecipientMunicipality: { equals: gemeenteNaam, mode: "insensitive" } },
        ],
        belastbaarheidTests: {
          some: {
            isCompleted: true,
          },
        },
      },
      select: {
        belastbaarheidTests: {
          where: {
            isCompleted: true,
            completedAt: { not: null },
          },
          select: {
            totaleBelastingScore: true,
            completedAt: true,
          },
          orderBy: { completedAt: "asc" },
        },
      },
    })

    let scoreVerbetering = 0
    for (const cg of mantelzorgersMetMeerdereTests) {
      const voltooideTests = cg.belastbaarheidTests
      if (voltooideTests.length < 2) continue
      const eersteScore = voltooideTests[0].totaleBelastingScore
      const laatsteScore = voltooideTests[voltooideTests.length - 1].totaleBelastingScore
      if (laatsteScore < eersteScore) {
        scoreVerbetering++
      }
    }

    const effectiviteit = {
      registratieNaarTest: {
        mantelzorgersMetTest,
        totaalMantelzorgers,
        percentage:
          totaalMantelzorgers > 0
            ? Math.round((mantelzorgersMetTest / totaalMantelzorgers) * 1000) / 10
            : 0,
      },
      testNaarHulpvraag: {
        mantelzorgersMetHulpvraag: mantelzorgersMetTestEnHulpvraag,
        totaalMetTest: mantelzorgersMetTest,
        percentage:
          mantelzorgersMetTest > 0
            ? Math.round((mantelzorgersMetTestEnHulpvraag / mantelzorgersMetTest) * 1000) / 10
            : 0,
      },
      scoreVerbetering,
    }

    // ============================================
    // JAARVERGELIJKING: Dit jaar vs vorig jaar
    // ============================================
    const huidigJaar = now.getFullYear()
    const startDitJaar = new Date(huidigJaar, 0, 1)
    const startVorigJaar = new Date(huidigJaar - 1, 0, 1)
    const eindVorigJaar = new Date(huidigJaar - 1, 11, 31, 23, 59, 59, 999)

    const testsDitJaar = alleVoltooideTests.filter(
      (t) => t.completedAt && t.completedAt >= startDitJaar
    )
    const testsVorigJaar = alleVoltooideTests.filter(
      (t) => t.completedAt && t.completedAt >= startVorigJaar && t.completedAt <= eindVorigJaar
    )

    let jaarVergelijking = null
    if (testsVorigJaar.length > 0) {
      const gemiddeldDitJaar =
        testsDitJaar.length > 0
          ? Math.round(
              (testsDitJaar.reduce((sum, t) => sum + t.totaleBelastingScore, 0) /
                testsDitJaar.length) *
                10
            ) / 10
          : null
      const gemiddeldVorigJaar =
        Math.round(
          (testsVorigJaar.reduce((sum, t) => sum + t.totaleBelastingScore, 0) /
            testsVorigJaar.length) *
            10
        ) / 10

      jaarVergelijking = {
        huidigJaar: {
          jaar: huidigJaar,
          gemiddeldeScore: gemiddeldDitJaar,
          aantalTests: testsDitJaar.length,
        },
        vorigJaar: {
          jaar: huidigJaar - 1,
          gemiddeldeScore: gemiddeldVorigJaar,
          aantalTests: testsVorigJaar.length,
        },
        verschil:
          gemiddeldDitJaar !== null
            ? Math.round((gemiddeldDitJaar - gemiddeldVorigJaar) * 10) / 10
            : null,
      }
    }

    logGemeenteAudit(userId, "BEKEKEN", "Trends", { gemeente: gemeenteNaam })

    return NextResponse.json({
      gemeenteNaam,
      periode: {
        van: twaalfMaandenGeleden.toISOString(),
        tot: now.toISOString(),
      },
      trends,
      seizoensData,
      effectiviteit,
      jaarVergelijking,
    })
  } catch (err) {
    console.error("Gemeente trends error:", err)
    return NextResponse.json({ error: "Interne fout" }, { status: 500 })
  }
}
