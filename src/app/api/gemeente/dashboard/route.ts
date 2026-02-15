import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getGemeenteSession, K_ANONIMITEIT_MINIMUM, logGemeenteAudit } from "@/lib/gemeente-auth"

export async function GET() {
  const { error, gemeenteNaam, userId } = await getGemeenteSession()
  if (error) return error

  try {
    // Tel mantelzorgers in deze gemeente
    const totalCaregivers = await prisma.caregiver.count({
      where: {
        OR: [
          { municipality: { equals: gemeenteNaam, mode: "insensitive" } },
          { careRecipientMunicipality: { equals: gemeenteNaam, mode: "insensitive" } },
        ],
      },
    })

    // K-anonimiteit check
    if (totalCaregivers < K_ANONIMITEIT_MINIMUM) {
      return NextResponse.json({
        kAnonimiteit: true,
        minimumNietBereikt: true,
        bericht: `Er zijn nog onvoldoende gebruikers (minimaal ${K_ANONIMITEIT_MINIMUM}) in ${gemeenteNaam} voor geanonimiseerde statistieken.`,
        totaalMantelzorgers: totalCaregivers,
      })
    }

    // Haal alle tests op voor deze gemeente
    const tests = await prisma.belastbaarheidTest.findMany({
      where: {
        isCompleted: true,
        gemeente: { equals: gemeenteNaam, mode: "insensitive" },
      },
      select: {
        totaleBelastingScore: true,
        belastingNiveau: true,
        totaleZorguren: true,
        completedAt: true,
      },
      orderBy: { completedAt: "desc" },
    })

    // Bereken gemiddelde score
    const avgScore = tests.length > 0
      ? Math.round(tests.reduce((sum, t) => sum + t.totaleBelastingScore, 0) / tests.length * 10) / 10
      : 0

    // Verdeling belastingniveaus
    const niveauVerdeling = {
      LAAG: tests.filter(t => t.belastingNiveau === "LAAG").length,
      GEMIDDELD: tests.filter(t => t.belastingNiveau === "GEMIDDELD").length,
      HOOG: tests.filter(t => t.belastingNiveau === "HOOG").length,
    }

    // Actieve alarmen
    const actieveAlarmen = await prisma.alarmLog.count({
      where: {
        isAfgehandeld: false,
        test: {
          gemeente: { equals: gemeenteNaam, mode: "insensitive" },
        },
      },
    })

    // Trend: vergelijk afgelopen 30 dagen met 30 dagen daarvoor
    const now = new Date()
    const dertigDagenGeleden = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const zestigDagenGeleden = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)

    const recenteTests = tests.filter(t => t.completedAt && t.completedAt > dertigDagenGeleden)
    const vorigeTests = tests.filter(t => t.completedAt && t.completedAt > zestigDagenGeleden && t.completedAt <= dertigDagenGeleden)

    const recentAvg = recenteTests.length > 0
      ? recenteTests.reduce((s, t) => s + t.totaleBelastingScore, 0) / recenteTests.length
      : null
    const vorigeAvg = vorigeTests.length > 0
      ? vorigeTests.reduce((s, t) => s + t.totaleBelastingScore, 0) / vorigeTests.length
      : null

    let scoreTrend: "omhoog" | "omlaag" | "stabiel" | null = null
    if (recentAvg !== null && vorigeAvg !== null) {
      const verschil = recentAvg - vorigeAvg
      if (verschil > 1) scoreTrend = "omhoog"
      else if (verschil < -1) scoreTrend = "omlaag"
      else scoreTrend = "stabiel"
    }

    // Hulpvragen
    const hulpvragen = await prisma.helpRequest.count({
      where: {
        caregiver: {
          OR: [
            { municipality: { equals: gemeenteNaam, mode: "insensitive" } },
            { careRecipientMunicipality: { equals: gemeenteNaam, mode: "insensitive" } },
          ],
        },
      },
    })

    const openHulpvragen = await prisma.helpRequest.count({
      where: {
        status: "OPEN",
        caregiver: {
          OR: [
            { municipality: { equals: gemeenteNaam, mode: "insensitive" } },
            { careRecipientMunicipality: { equals: gemeenteNaam, mode: "insensitive" } },
          ],
        },
      },
    })

    // Audit log
    logGemeenteAudit(userId, "BEKEKEN", "Dashboard", { gemeente: gemeenteNaam })

    return NextResponse.json({
      gemeenteNaam,
      totaalMantelzorgers: totalCaregivers,
      totaalTests: tests.length,
      gemiddeldeScore: avgScore,
      niveauVerdeling,
      actieveAlarmen,
      scoreTrend,
      hulpvragen: {
        totaal: hulpvragen,
        open: openHulpvragen,
      },
      nieuweDezeMaand: recenteTests.length,
    })
  } catch (err) {
    console.error("Gemeente dashboard error:", err)
    return NextResponse.json({ error: "Interne fout" }, { status: 500 })
  }
}
