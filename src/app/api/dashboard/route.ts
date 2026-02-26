import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getHulpbronnenVoorTaken } from "@/lib/dashboard/hulpbronnen"
import { getAanbevolenArtikelen } from "@/lib/dashboard/artikelen"
import { buildMijlpalen } from "@/lib/dashboard/mijlpalen"
import { berekenDeelgebieden } from "@/lib/dashboard/deelgebieden"
import { genereerAdvies } from "@/lib/dashboard/advies"

export const dynamic = "force-dynamic"

// GET: Dashboard data ophalen
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.caregiverId) {
      return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 })
    }

    const caregiverId = session.user.caregiverId

    // Haal alle data parallel op
    const [
      caregiver,
      latestTest,
      allTests,
      recentCheckIns,
      tasks,
      selfCareTasks,
      favorieten,
    ] = await Promise.all([
      prisma.caregiver.findUnique({
        where: { id: caregiverId },
        include: {
          user: { select: { name: true, email: true } },
        },
      }),
      prisma.belastbaarheidTest.findFirst({
        where: { caregiverId },
        orderBy: { completedAt: "desc" },
        include: {
          antwoorden: true,
          taakSelecties: true,
        },
      }),
      prisma.belastbaarheidTest.findMany({
        where: { caregiverId, isCompleted: true },
        orderBy: { completedAt: "desc" },
        take: 4,
        select: {
          id: true,
          totaleBelastingScore: true,
          belastingNiveau: true,
          completedAt: true,
        },
      }),
      prisma.monthlyCheckIn.findMany({
        where: { caregiverId },
        orderBy: { month: "desc" },
        take: 12,
      }),
      prisma.task.findMany({
        where: { caregiverId },
        orderBy: [{ priority: "desc" }, { dueDate: "asc" }],
      }),
      prisma.task.findMany({
        where: { caregiverId, category: "SELF_CARE" },
        orderBy: { dueDate: "asc" },
      }),
      prisma.favoriet.findFirst({
        where: { caregiverId },
        orderBy: { createdAt: "asc" },
        select: { createdAt: true },
      }),
    ])

    if (!caregiver) {
      return NextResponse.json({ error: "Profiel niet gevonden" }, { status: 404 })
    }

    // Bereken statistieken
    const now = new Date()
    const lastTestDate = latestTest?.completedAt
    const daysSinceLastTest = lastTestDate
      ? Math.floor((now.getTime() - new Date(lastTestDate).getTime()) / (1000 * 60 * 60 * 24))
      : null

    const needsNewTest = !lastTestDate || daysSinceLastTest! >= 90

    // Vergelijking met vorige test
    let testTrend: "improved" | "same" | "worse" | null = null
    if (allTests.length >= 2) {
      const currentScore = allTests[0].totaleBelastingScore
      const previousScore = allTests[1].totaleBelastingScore
      if (currentScore < previousScore) testTrend = "improved"
      else if (currentScore > previousScore) testTrend = "worse"
      else testTrend = "same"
    }

    // Check-in statistieken
    const thisWeek = new Date()
    thisWeek.setDate(thisWeek.getDate() - 7)

    const weeklyCheckIn = recentCheckIns.find(
      (c) => new Date(c.createdAt) >= thisWeek
    )
    const monthlyCheckIn = recentCheckIns.find(
      (c) =>
        new Date(c.month).getMonth() === now.getMonth() &&
        new Date(c.month).getFullYear() === now.getFullYear()
    )

    // Urgentie bepalen
    let urgencyLevel: "low" | "medium" | "high" | "critical" = "low"
    const urgencyMessages: string[] = []

    if (latestTest?.belastingNiveau === "HOOG") {
      urgencyLevel = "high"
      urgencyMessages.push("Je belastingniveau is hoog - zorg goed voor jezelf!")
    }
    if (needsNewTest && daysSinceLastTest && daysSinceLastTest > 90) {
      urgencyMessages.push("Tijd voor je kwartaal balanstest")
    }
    if (!weeklyCheckIn) {
      urgencyMessages.push("Je hebt deze week nog geen check-in gedaan")
    }

    // Open taken
    const openTasks = tasks.filter((t) => t.status === "TODO" || t.status === "IN_PROGRESS")
    const overdueTasks = openTasks.filter(
      (t) => t.dueDate && new Date(t.dueDate) < now
    )

    if (overdueTasks.length > 0) {
      urgencyLevel = urgencyLevel === "low" ? "medium" : urgencyLevel
      urgencyMessages.push(`${overdueTasks.length} verlopen ${overdueTasks.length === 1 ? "taak" : "taken"}`)
    }

    // Zelfzorg taken status
    const openSelfCareTasks = selfCareTasks.filter(
      (t) => t.status === "TODO" || t.status === "IN_PROGRESS"
    )
    const completedSelfCareThisWeek = selfCareTasks.filter(
      (t) => t.status === "COMPLETED" && t.completedAt && new Date(t.completedAt) >= thisWeek
    )

    // Wellbeing trend (laatste 4 check-ins)
    const wellbeingScores = recentCheckIns
      .filter((c) => c.overallWellbeing !== null)
      .slice(0, 4)
      .map((c) => c.overallWellbeing!)

    let wellbeingTrend: "up" | "down" | "stable" | null = null
    if (wellbeingScores.length >= 2) {
      const avg = wellbeingScores.reduce((a, b) => a + b, 0) / wellbeingScores.length
      const recent = wellbeingScores[0]
      if (recent > avg + 0.5) wellbeingTrend = "up"
      else if (recent < avg - 0.5) wellbeingTrend = "down"
      else wellbeingTrend = "stable"
    }

    // Deelgebied-scores berekenen
    const deelgebieden = latestTest
      ? berekenDeelgebieden(
          latestTest.antwoorden.map((a) => ({
            vraagId: a.vraagId,
            score: a.score,
            gewicht: a.gewicht,
          }))
        )
      : []

    // Zware taken namen voor advies
    const zwareTaken = latestTest
      ? latestTest.taakSelecties
          .filter((t) => t.isGeselecteerd && (t.moeilijkheid === "MOEILIJK" || t.moeilijkheid === "ZEER_MOEILIJK"))
          .map((t) => t.taakNaam)
      : []

    // Advies genereren
    const adviezen = genereerAdvies({
      belastingNiveau: (latestTest?.belastingNiveau as "LAAG" | "GEMIDDELD" | "HOOG") || null,
      score: latestTest?.totaleBelastingScore ?? null,
      trend: testTrend,
      zwareTaken,
      wellbeingTrend,
      daysSinceTest: daysSinceLastTest,
      hasCheckIn: !!monthlyCheckIn,
    })

    return NextResponse.json({
      user: {
        name: caregiver.user.name,
        email: caregiver.user.email,
        profileCompleted: caregiver.profileCompleted,
      },

      test: latestTest
        ? {
            hasTest: true,
            score: latestTest.totaleBelastingScore,
            niveau: latestTest.belastingNiveau,
            completedAt: latestTest.completedAt,
            daysSinceTest: daysSinceLastTest,
            needsNewTest,
            trend: testTrend,
            history: allTests.map((t) => ({
              score: t.totaleBelastingScore,
              niveau: t.belastingNiveau,
              date: t.completedAt,
            })),
            highScoreAreas: latestTest.antwoorden
              .filter((a) => a.score === 2)
              .map((a) => ({
                vraag: a.vraagTekst,
                antwoord: a.antwoord,
              })),
            zorgtaken: latestTest.taakSelecties
              .filter((t) => t.isGeselecteerd)
              .map((t) => ({
                id: t.taakId,
                naam: t.taakNaam,
                uren: t.urenPerWeek,
                moeilijkheid: t.moeilijkheid,
              })),
          }
        : {
            hasTest: false,
            needsNewTest: true,
          },

      checkIns: {
        weeklyDone: !!weeklyCheckIn,
        monthlyDone: !!monthlyCheckIn,
        lastCheckIn: recentCheckIns[0] || null,
        wellbeingTrend,
        recentScores: wellbeingScores,
      },

      tasks: {
        total: tasks.length,
        open: openTasks.length,
        overdue: overdueTasks.length,
        completedThisWeek: tasks.filter(
          (t) => t.status === "COMPLETED" && t.completedAt && new Date(t.completedAt) >= thisWeek
        ).length,
        byCategory: {
          selfCare: selfCareTasks.length,
          openSelfCare: openSelfCareTasks.length,
          completedSelfCareThisWeek: completedSelfCareThisWeek.length,
        },
        upcoming: openTasks.slice(0, 5).map((t) => ({
          id: t.id,
          title: t.title,
          category: t.category,
          priority: t.priority,
          dueDate: t.dueDate,
          isOverdue: t.dueDate && new Date(t.dueDate) < now,
        })),
      },

      urgency: {
        level: urgencyLevel,
        messages: urgencyMessages,
      },

      selfCare: {
        weeklyGoal: 3,
        completed: completedSelfCareThisWeek.length,
        upcoming: openSelfCareTasks.slice(0, 3).map((t) => ({
          id: t.id,
          title: t.title,
          dueDate: t.dueDate,
        })),
      },

      hulpbronnen: await getHulpbronnenVoorTaken(
        latestTest,
        caregiver.municipality,
        caregiver.careRecipientMunicipality,
        latestTest?.belastingNiveau || null
      ),

      aanbevolenArtikelen: await getAanbevolenArtikelen(
        latestTest?.belastingNiveau || null,
        caregiver.municipality
      ),

      mijlpalen: buildMijlpalen(
        caregiver.createdAt,
        allTests.length > 0 ? allTests[allTests.length - 1].completedAt : null,
        recentCheckIns.length > 0 ? recentCheckIns[recentCheckIns.length - 1].createdAt : null,
        favorieten?.createdAt || null,
        caregiver.profileCompleted,
        latestTest?.belastingNiveau || null,
        testTrend
      ),

      deelgebieden,

      adviezen,

      locatie: {
        mantelzorger: {
          straat: caregiver.street,
          gemeente: caregiver.municipality,
          woonplaats: caregiver.city,
        },
        zorgvrager: {
          straat: caregiver.careRecipientStreet,
          gemeente: caregiver.careRecipientMunicipality,
          woonplaats: caregiver.careRecipientCity,
        },
      },
    })
  } catch (error) {
    console.error("Dashboard GET error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
