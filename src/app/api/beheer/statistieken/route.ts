import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Niet geautoriseerd" }, { status: 401 })
  }

  try {
    const now = new Date()
    const dertigDagenGeleden = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const zevenDagenGeleden = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const [
      totaalGebruikers,
      nieuweGebruikersWeek,
      nieuweGebruikersMaand,
      totaalMantelzorgers,
      totaalBuddies,
      buddiesPerStatus,
      totaalTests,
      testsDezeMaand,
      gemiddeldeScore,
      scoreVerdeling,
      totaalAlarmen,
      openAlarmen,
      totaalHulpvragen,
      openHulpvragen,
      totaalOrganisaties,
      actieveOrganisaties,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: zevenDagenGeleden } } }),
      prisma.user.count({ where: { createdAt: { gte: dertigDagenGeleden } } }),
      prisma.caregiver.count(),
      prisma.mantelBuddy.count(),
      prisma.mantelBuddy.groupBy({ by: ["status"], _count: true }),
      prisma.belastbaarheidTest.count({ where: { isCompleted: true } }),
      prisma.belastbaarheidTest.count({ where: { isCompleted: true, completedAt: { gte: dertigDagenGeleden } } }),
      prisma.belastbaarheidTest.aggregate({ where: { isCompleted: true }, _avg: { totaleBelastingScore: true } }),
      prisma.belastbaarheidTest.groupBy({ by: ["belastingNiveau"], where: { isCompleted: true }, _count: true }),
      prisma.alarmLog.count(),
      prisma.alarmLog.count({ where: { isAfgehandeld: false } }),
      prisma.helpRequest.count(),
      prisma.helpRequest.count({ where: { status: "OPEN" } }),
      prisma.zorgorganisatie.count(),
      prisma.zorgorganisatie.count({ where: { isActief: true } }),
    ])

    return NextResponse.json({
      gebruikers: {
        totaal: totaalGebruikers,
        nieuweWeek: nieuweGebruikersWeek,
        nieuweMaand: nieuweGebruikersMaand,
        mantelzorgers: totaalMantelzorgers,
        buddies: totaalBuddies,
      },
      buddiesPerStatus: buddiesPerStatus.reduce((acc, item) => {
        acc[item.status] = item._count
        return acc
      }, {} as Record<string, number>),
      tests: {
        totaal: totaalTests,
        dezeMaand: testsDezeMaand,
        gemiddeldeScore: Math.round((gemiddeldeScore._avg.totaleBelastingScore || 0) * 10) / 10,
      },
      scoreVerdeling: scoreVerdeling.reduce((acc, item) => {
        acc[item.belastingNiveau] = item._count
        return acc
      }, {} as Record<string, number>),
      alarmen: {
        totaal: totaalAlarmen,
        open: openAlarmen,
      },
      hulpvragen: {
        totaal: totaalHulpvragen,
        open: openHulpvragen,
      },
      organisaties: {
        totaal: totaalOrganisaties,
        actief: actieveOrganisaties,
      },
    })
  } catch (error) {
    console.error("Statistieken ophalen mislukt:", error)
    return NextResponse.json({ error: "Statistieken ophalen mislukt" }, { status: 500 })
  }
}
