import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Mapping van taak IDs naar "Onderdeel mantelzorgtest" waarden in de database
const TAAK_NAAR_ONDERDEEL: Record<string, string> = {
  t1: 'Persoonlijke verzorging',
  t2: 'Huishoudelijke taken',
  t3: 'Persoonlijke verzorging', // Medicijnen
  t4: 'Vervoer',
  t5: 'Administratie en aanvragen',
  t6: 'Sociaal contact en activiteiten',
  t7: 'Persoonlijke verzorging', // Toezicht
  t8: 'Persoonlijke verzorging', // Medische zorg
}

// Haal hulpbronnen op voor zware taken - combineert lokale en landelijke bronnen
async function getHulpbronnenVoorTaken(
  latestTest: any,
  gemeente: string | null
): Promise<{
  perTaak: Record<string, { naam: string; telefoon: string | null; website: string | null; beschrijving: string | null; gemeente: string | null; isLandelijk: boolean }[]>
  algemeen: { naam: string; telefoon: string | null; website: string | null; beschrijving: string | null; soortHulp: string | null; gemeente: string | null; isLandelijk: boolean }[]
  landelijk: { naam: string; telefoon: string | null; website: string | null; beschrijving: string | null; soortHulp: string | null }[]
  gebruikersGemeente: string | null
}> {
  if (!latestTest) {
    // Toon altijd landelijke bronnen, ook zonder test
    const landelijk = await prisma.zorgorganisatie.findMany({
      where: {
        isActief: true,
        gemeente: null, // Landelijk = geen gemeente
        soortHulp: { in: ['Emotionele steun', 'Respijtzorg', 'Lotgenotencontact'] },
      },
      take: 5,
      orderBy: { naam: 'asc' },
      select: {
        naam: true,
        telefoon: true,
        website: true,
        beschrijving: true,
        soortHulp: true,
      },
    })
    return { perTaak: {}, algemeen: [], landelijk, gebruikersGemeente: gemeente }
  }

  // Vind zware taken (JA of SOMS)
  const zwareTaken = latestTest.taakSelecties?.filter(
    (t: any) => t.isGeselecteerd && (t.moeilijkheid === 'JA' || t.moeilijkheid === 'SOMS')
  ) || []

  const perTaak: Record<string, any[]> = {}

  // Haal hulpbronnen op per zware taak
  for (const taak of zwareTaken) {
    const onderdeel = TAAK_NAAR_ONDERDEEL[taak.taakId]
    if (!onderdeel) continue

    // Haal zowel lokale als landelijke hulpbronnen op
    const [lokaleHulp, landelijkeHulp] = await Promise.all([
      // Lokale hulpbronnen (als gemeente bekend)
      gemeente ? prisma.zorgorganisatie.findMany({
        where: {
          isActief: true,
          onderdeelTest: onderdeel,
          gemeente: gemeente,
        },
        take: 2,
        orderBy: { naam: 'asc' },
        select: {
          naam: true,
          telefoon: true,
          website: true,
          beschrijving: true,
          gemeente: true,
        },
      }) : Promise.resolve([]),
      // Landelijke hulpbronnen
      prisma.zorgorganisatie.findMany({
        where: {
          isActief: true,
          onderdeelTest: onderdeel,
          gemeente: null, // Landelijk
        },
        take: 2,
        orderBy: { naam: 'asc' },
        select: {
          naam: true,
          telefoon: true,
          website: true,
          beschrijving: true,
          gemeente: true,
        },
      }),
    ])

    // Combineer en markeer als lokaal/landelijk
    const gecombineerd = [
      ...lokaleHulp.map(h => ({ ...h, isLandelijk: false })),
      ...landelijkeHulp.map(h => ({ ...h, isLandelijk: true })),
    ]

    if (gecombineerd.length > 0) {
      perTaak[taak.taakNaam] = gecombineerd
    }
  }

  // Haal algemene hulpbronnen op gebaseerd op belastingsniveau
  const isHoog = latestTest.belastingNiveau === 'HOOG'

  // Haal zowel lokale als landelijke algemene hulpbronnen
  const [lokaalAlgemeen, landelijkAlgemeen] = await Promise.all([
    // Lokale algemene hulpbronnen
    gemeente ? prisma.zorgorganisatie.findMany({
      where: {
        isActief: true,
        ...(isHoog ? { zichtbaarBijHoog: true } : {}),
        soortHulp: { in: ['Emotionele steun', 'Respijtzorg', 'Lotgenotencontact'] },
        gemeente: gemeente,
      },
      take: 3,
      orderBy: { naam: 'asc' },
      select: {
        naam: true,
        telefoon: true,
        website: true,
        beschrijving: true,
        soortHulp: true,
        gemeente: true,
      },
    }) : Promise.resolve([]),
    // Landelijke algemene hulpbronnen
    prisma.zorgorganisatie.findMany({
      where: {
        isActief: true,
        ...(isHoog ? { zichtbaarBijHoog: true } : {}),
        soortHulp: { in: ['Emotionele steun', 'Respijtzorg', 'Lotgenotencontact'] },
        gemeente: null, // Landelijk
      },
      take: 5,
      orderBy: { naam: 'asc' },
      select: {
        naam: true,
        telefoon: true,
        website: true,
        beschrijving: true,
        soortHulp: true,
        gemeente: true,
      },
    }),
  ])

  // Combineer lokaal en landelijk
  const algemeen = [
    ...lokaalAlgemeen.map(h => ({ ...h, isLandelijk: false })),
    ...landelijkAlgemeen.map(h => ({ ...h, isLandelijk: true })),
  ]

  // Landelijke hulpbronnen apart (voor "Landelijke ondersteuning" sectie)
  const landelijk = await prisma.zorgorganisatie.findMany({
    where: {
      isActief: true,
      gemeente: null,
      soortHulp: { in: ['Emotionele steun', 'Praktische hulp', 'Financiële hulp'] },
    },
    take: 5,
    orderBy: { naam: 'asc' },
    select: {
      naam: true,
      telefoon: true,
      website: true,
      beschrijving: true,
      soortHulp: true,
    },
  })

  return { perTaak, algemeen, landelijk, gebruikersGemeente: gemeente }
}

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
    ] = await Promise.all([
      // Caregiver profiel
      prisma.caregiver.findUnique({
        where: { id: caregiverId },
        include: {
          user: { select: { name: true, email: true } },
        },
      }),

      // Meest recente test
      prisma.belastbaarheidTest.findFirst({
        where: { caregiverId },
        orderBy: { completedAt: "desc" },
        include: {
          antwoorden: true,
          taakSelecties: true,
        },
      }),

      // Alle tests voor vergelijking
      prisma.belastbaarheidTest.findMany({
        where: { caregiverId, isCompleted: true },
        orderBy: { completedAt: "desc" },
        take: 4, // Laatste 4 kwartalen
        select: {
          id: true,
          totaleBelastingScore: true,
          belastingNiveau: true,
          completedAt: true,
        },
      }),

      // Check-ins laatste 3 maanden
      prisma.monthlyCheckIn.findMany({
        where: { caregiverId },
        orderBy: { month: "desc" },
        take: 12,
      }),

      // Alle taken (zorgtaken)
      prisma.task.findMany({
        where: { caregiverId },
        orderBy: [{ priority: "desc" }, { dueDate: "asc" }],
      }),

      // Zelfzorg taken (specifiek)
      prisma.task.findMany({
        where: { caregiverId, category: "SELF_CARE" },
        orderBy: { dueDate: "asc" },
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

    // Bepaal of nieuwe test nodig is (kwartaal = 90 dagen)
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
    const thisMonth = new Date()
    thisMonth.setDate(1)

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
    let urgencyMessages: string[] = []

    if (latestTest?.belastingNiveau === "HOOG") {
      urgencyLevel = "high"
      urgencyMessages.push("Je belastingsniveau is hoog - zorg goed voor jezelf!")
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

    return NextResponse.json({
      // Gebruiker info
      user: {
        name: caregiver.user.name,
        email: caregiver.user.email,
        profileCompleted: caregiver.profileCompleted,
      },

      // Test resultaten
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
            // Aandachtspunten uit de test
            highScoreAreas: latestTest.antwoorden
              .filter((a) => a.score === 2)
              .map((a) => ({
                vraag: a.vraagTekst,
                antwoord: a.antwoord,
              })),
            // Zorgtaken uit de test
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

      // Check-ins
      checkIns: {
        weeklyDone: !!weeklyCheckIn,
        monthlyDone: !!monthlyCheckIn,
        lastCheckIn: recentCheckIns[0] || null,
        wellbeingTrend,
        recentScores: wellbeingScores,
      },

      // Taken overzicht
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

      // Urgentie
      urgency: {
        level: urgencyLevel,
        messages: urgencyMessages,
      },

      // Zelfzorg doelen
      selfCare: {
        weeklyGoal: 3, // Standaard: 3 zelfzorg activiteiten per week
        completed: completedSelfCareThisWeek.length,
        upcoming: openSelfCareTasks.slice(0, 3).map((t) => ({
          id: t.id,
          title: t.title,
          dueDate: t.dueDate,
        })),
      },

      // Hulpbronnen uit de Sociale Kaart
      hulpbronnen: await getHulpbronnenVoorTaken(latestTest, caregiver.municipality),
    })
  } catch (error) {
    console.error("Dashboard GET error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
