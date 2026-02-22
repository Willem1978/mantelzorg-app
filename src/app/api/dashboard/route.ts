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

// Hulpbron interface voor type safety
interface HulpbronResult {
  naam: string
  telefoon: string | null
  website: string | null
  beschrijving: string | null
  gemeente: string | null
  isLandelijk: boolean
}

interface AlgemeenHulpbron extends HulpbronResult {
  soortHulp: string | null
}

interface LandelijkHulpbron {
  naam: string
  telefoon: string | null
  website: string | null
  beschrijving: string | null
  soortHulp: string | null
}

interface CategorieHulpbron extends HulpbronResult {
  // Overerft van HulpbronResult
}

// Haal hulpbronnen op - gescheiden voor mantelzorger en zorgvrager locaties
// Filtert op belastingniveau (zichtbaarBijLaag/Gemiddeld/Hoog)
async function getHulpbronnenVoorTaken(
  latestTest: any,
  mantelzorgerGemeente: string | null,
  zorgvragerGemeente: string | null,
  belastingNiveau: string | null
): Promise<{
  // Hulp voor zorgvrager (per taak, gebaseerd op locatie zorgvrager)
  perTaak: Record<string, HulpbronResult[]>
  // Hulp voor mantelzorger (gebaseerd op locatie mantelzorger)
  voorMantelzorger: AlgemeenHulpbron[]
  // Landelijke hulplijnen (altijd beschikbaar)
  landelijk: LandelijkHulpbron[]
  // Alle hulpbronnen per categorie (voor hulp zoeken)
  perCategorie: Record<string, HulpbronResult[]>
  // Context info
  mantelzorgerGemeente: string | null
  zorgvragerGemeente: string | null
}> {
  // Belastingniveau-filter: toon hulpbronnen die passen bij het niveau
  // TODO: activeren zodra beheer-UI beschikbaar is om zichtbaarBijLaag/Gemiddeld/Hoog
  // per hulpbron in te stellen. Nu uitgeschakeld omdat de schema-defaults
  // (laag=false, gemiddeld=false, hoog=true) hulpbronnen onzichtbaar maken
  // voor LAAG/GEMIDDELD gebruikers terwijl beheerders ze nog niet kunnen configureren.
  const niveauFilter: Record<string, unknown>[] = []
  // Toekomstige filter logica (bewaard voor later):
  // LAAG:      [{ OR: [{ zichtbaarBijLaag: true }, { zichtbaarBijLaag: false, zichtbaarBijGemiddeld: false, zichtbaarBijHoog: true }] }]
  // GEMIDDELD: [{ OR: [{ zichtbaarBijGemiddeld: true }, { zichtbaarBijLaag: false, zichtbaarBijGemiddeld: false, zichtbaarBijHoog: true }] }]
  // HOOG:      [{ zichtbaarBijHoog: true }]
  void belastingNiveau // bewust niet gebruikt tot beheer-UI er is

  // Landelijke hulplijnen (altijd zichtbaar) - zonder filter op soortHulp
  const landelijk = await prisma.zorgorganisatie.findMany({
    where: {
      isActief: true,
      gemeente: null,
      AND: niveauFilter,
    },
    orderBy: { naam: 'asc' },
    select: {
      naam: true,
      telefoon: true,
      website: true,
      beschrijving: true,
      soortHulp: true,
    },
  })

  if (!latestTest) {
    return {
      perTaak: {},
      voorMantelzorger: [],
      landelijk,
      perCategorie: {},
      mantelzorgerGemeente,
      zorgvragerGemeente
    }
  }

  // Vind zware taken
  // Ondersteunt zowel web format (MOEILIJK/GEMIDDELD) als WhatsApp format (JA/SOMS)
  const isZwaarOfMatig = (m: string | null) =>
    m === 'MOEILIJK' || m === 'ZEER_MOEILIJK' || m === 'GEMIDDELD' ||
    m === 'JA' || m === 'ja' || m === 'SOMS' || m === 'soms'

  const zwareTaken = latestTest.taakSelecties?.filter(
    (t: any) => t.isGeselecteerd && isZwaarOfMatig(t.moeilijkheid)
  ) || []

  const perTaak: Record<string, HulpbronResult[]> = {}

  // Hulpbronnen per zware taak - PARALLEL ophalen (ipv sequentieel in for-loop)
  const taakOnderdelen = zwareTaken
    .map((taak: any) => ({ taak, onderdeel: TAAK_NAAR_ONDERDEEL[taak.taakId] }))
    .filter(({ onderdeel }: any) => onderdeel)

  const taakResultaten = await Promise.all(
    taakOnderdelen.map(async ({ onderdeel }: any) => {
      const [lokaleHulp, landelijkeHulp] = await Promise.all([
        zorgvragerGemeente ? prisma.zorgorganisatie.findMany({
          where: {
            isActief: true,
            onderdeelTest: onderdeel,
            gemeente: zorgvragerGemeente,
            AND: niveauFilter,
          },
          orderBy: { naam: 'asc' },
          select: { naam: true, telefoon: true, website: true, beschrijving: true, gemeente: true, doelgroep: true, kosten: true },
        }) : Promise.resolve([]),
        prisma.zorgorganisatie.findMany({
          where: {
            isActief: true,
            onderdeelTest: onderdeel,
            gemeente: null,
            AND: niveauFilter,
          },
          orderBy: { naam: 'asc' },
          select: { naam: true, telefoon: true, website: true, beschrijving: true, gemeente: true, doelgroep: true, kosten: true },
        }),
      ])
      return { lokaleHulp, landelijkeHulp }
    })
  )

  taakOnderdelen.forEach(({ taak }: any, i: number) => {
    const { lokaleHulp, landelijkeHulp } = taakResultaten[i]
    const gecombineerd: HulpbronResult[] = [
      ...lokaleHulp.map((h: any) => ({ ...h, isLandelijk: false })),
      ...landelijkeHulp.map((h: any) => ({ ...h, isLandelijk: true })),
    ]
    if (gecombineerd.length > 0) {
      perTaak[taak.taakNaam] = gecombineerd
    }
  })

  // Hulpbronnen voor mantelzorger - lokaal OF landelijk
  const lokaalMantelzorger = mantelzorgerGemeente ? await prisma.zorgorganisatie.findMany({
    where: {
      isActief: true,
      onderdeelTest: 'Mantelzorgondersteuning',
      gemeente: mantelzorgerGemeente,
      AND: niveauFilter,
    },
    orderBy: { naam: 'asc' },
    select: {
      naam: true,
      telefoon: true,
      website: true,
      beschrijving: true,
      soortHulp: true,
      gemeente: true,
      doelgroep: true,
      kosten: true,
    },
  }) : []

  // Landelijke mantelzorgondersteuning
  const landelijkMantelzorger = await prisma.zorgorganisatie.findMany({
    where: {
      isActief: true,
      OR: [
        { onderdeelTest: 'Mantelzorgondersteuning' },
        { soortHulp: { in: ['Emotionele steun', 'Vervangende mantelzorg', 'Lotgenotencontact', 'Educatie', 'Leren en training'] } },
      ],
      gemeente: null,
      AND: niveauFilter,
    },
    orderBy: { naam: 'asc' },
    select: {
      naam: true,
      telefoon: true,
      website: true,
      beschrijving: true,
      soortHulp: true,
      gemeente: true,
      doelgroep: true,
      kosten: true,
    },
  })

  const voorMantelzorger: AlgemeenHulpbron[] = [
    ...lokaalMantelzorger.map(h => ({ ...h, isLandelijk: false })),
    ...landelijkMantelzorger.map(h => ({ ...h, isLandelijk: true })),
  ]

  // Alle hulpbronnen per categorie (voor hulp zoeken sectie)
  // Inclusief nieuwe "Voor jou" categorieën
  const alleOnderdelen = [
    // Voor naaste
    'Persoonlijke verzorging',
    'Huishoudelijke taken',
    'Vervoer',
    'Administratie en aanvragen',
    'Plannen en organiseren',
    'Sociaal contact en activiteiten',
    'Bereiden en/of nuttigen van maaltijden',
    'Boodschappen',
    'Klusjes in en om het huis',
    'Huisdieren',
    // Voor jou (mantelzorger)
    'Mantelzorgondersteuning',
    'Vervangende mantelzorg',
    'Emotionele steun',
    'Lotgenotencontact',
    'Leren en training',
  ]

  // Alle categorieën PARALLEL ophalen (ipv sequentieel in for-loop)
  const categorieResultaten = await Promise.all(
    alleOnderdelen.map(async (onderdeel) => {
      const [lokaal, landelijkCat] = await Promise.all([
        // Lokaal bij zorgvrager (behalve mantelzorger-categorieën, die zijn bij mantelzorger)
        prisma.zorgorganisatie.findMany({
          where: {
            isActief: true,
            onderdeelTest: onderdeel,
            gemeente: ['Mantelzorgondersteuning', 'Vervangende mantelzorg', 'Emotionele steun', 'Lotgenotencontact', 'Leren en training'].includes(onderdeel)
              ? mantelzorgerGemeente
              : zorgvragerGemeente,
            AND: niveauFilter,
          },
          orderBy: { naam: 'asc' },
          select: {
            naam: true,
            telefoon: true,
            website: true,
            beschrijving: true,
            gemeente: true,
            doelgroep: true,
            kosten: true,
          },
        }),
        // Landelijk
        prisma.zorgorganisatie.findMany({
          where: {
            isActief: true,
            onderdeelTest: onderdeel,
            gemeente: null,
            AND: niveauFilter,
          },
          orderBy: { naam: 'asc' },
          select: {
            naam: true,
            telefoon: true,
            website: true,
            beschrijving: true,
            gemeente: true,
            doelgroep: true,
            kosten: true,
          },
        }),
      ])

      const gecombineerd: HulpbronResult[] = [
        ...lokaal.map(h => ({ ...h, isLandelijk: false })),
        ...landelijkCat.map(h => ({ ...h, isLandelijk: true })),
      ]

      return { onderdeel, gecombineerd }
    })
  )

  const perCategorie: Record<string, HulpbronResult[]> = {}
  for (const { onderdeel, gecombineerd } of categorieResultaten) {
    if (gecombineerd.length > 0) {
      perCategorie[onderdeel] = gecombineerd
    }
  }

  return {
    perTaak,
    voorMantelzorger,
    landelijk,
    perCategorie,
    mantelzorgerGemeente,
    zorgvragerGemeente
  }
}

// Haal aanbevolen artikelen op basis van belastingniveau
async function getAanbevolenArtikelen(
  belastingNiveau: string | null,
  gemeente: string | null
) {
  try {
    // Bepaal categorieën op basis van niveau
    let categorieen: string[] = []
    if (belastingNiveau === "LAAG") {
      categorieen = ["zelfzorg", "praktische-tips"]
    } else if (belastingNiveau === "GEMIDDELD") {
      categorieen = ["rechten", "praktische-tips", "zelfzorg"]
    } else if (belastingNiveau === "HOOG") {
      categorieen = ["zelfzorg", "rechten", "financieel"]
    } else {
      categorieen = ["praktische-tips", "zelfzorg"]
    }

    const artikelen = await prisma.artikel.findMany({
      where: {
        isActief: true,
        status: "GEPUBLICEERD",
        type: "ARTIKEL",
        categorie: { in: categorieen },
        OR: [
          { publicatieDatum: null },
          { publicatieDatum: { lte: new Date() } },
        ],
      },
      orderBy: [{ sorteerVolgorde: "asc" }, { createdAt: "desc" }],
      take: 3,
      select: {
        id: true,
        titel: true,
        beschrijving: true,
        emoji: true,
        categorie: true,
        url: true,
      },
    })

    return artikelen
  } catch {
    return []
  }
}

// Bouw mijlpalen tijdlijn
function buildMijlpalen(
  registratieDatum: Date,
  eersteTestDatum: Date | null,
  eersteCheckInDatum: Date | null,
  eersteFavorietDatum: Date | null,
  profielCompleet: boolean,
  belastingNiveau: string | null,
  testTrend: "improved" | "same" | "worse" | null
) {
  const mijlpalen: {
    id: string
    titel: string
    beschrijving: string
    emoji: string
    datum: Date | null
    behaald: boolean
  }[] = []

  // Geregistreerd
  mijlpalen.push({
    id: "registratie",
    titel: "Account aangemaakt",
    beschrijving: "Je hebt de eerste stap gezet!",
    emoji: "🎉",
    datum: registratieDatum,
    behaald: true,
  })

  // Profiel compleet
  mijlpalen.push({
    id: "profiel",
    titel: "Profiel ingevuld",
    beschrijving: "Zo kunnen we je beter helpen",
    emoji: "👤",
    datum: profielCompleet ? registratieDatum : null,
    behaald: profielCompleet,
  })

  // Eerste test
  mijlpalen.push({
    id: "eerste-test",
    titel: "Eerste balanstest gedaan",
    beschrijving: "Nu weet je hoe het met je gaat",
    emoji: "📊",
    datum: eersteTestDatum,
    behaald: !!eersteTestDatum,
  })

  // Eerste favoriet
  mijlpalen.push({
    id: "eerste-favoriet",
    titel: "Eerste favoriet bewaard",
    beschrijving: "Handig om later terug te lezen",
    emoji: "❤️",
    datum: eersteFavorietDatum,
    behaald: !!eersteFavorietDatum,
  })

  // Eerste check-in
  mijlpalen.push({
    id: "eerste-checkin",
    titel: "Eerste check-in gedaan",
    beschrijving: "Zo houd je bij hoe het gaat",
    emoji: "✅",
    datum: eersteCheckInDatum,
    behaald: !!eersteCheckInDatum,
  })

  // Score verbeterd (alleen als er een trend is)
  if (testTrend === "improved") {
    mijlpalen.push({
      id: "score-verbeterd",
      titel: "Score verbeterd!",
      beschrijving: "Je balans is erop vooruit gegaan",
      emoji: "📈",
      datum: new Date(),
      behaald: true,
    })
  }

  return mijlpalen
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
      favorieten,
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

      // Favorieten (voor mijlpalen)
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
      // - perTaak: hulp bij zorgtaken, gebaseerd op locatie ZORGVRAGER
      // - voorMantelzorger: hulp voor mantelzorger, gebaseerd op locatie MANTELZORGER
      // - gefilterd op belastingniveau (zichtbaarBijLaag/Gemiddeld/Hoog)
      hulpbronnen: await getHulpbronnenVoorTaken(
        latestTest,
        caregiver.municipality,            // Locatie mantelzorger
        caregiver.careRecipientMunicipality, // Locatie zorgvrager
        latestTest?.belastingNiveau || null  // Belastingniveau voor filtering
      ),

      // Aanbevolen artikelen op basis van belastingniveau
      aanbevolenArtikelen: await getAanbevolenArtikelen(
        latestTest?.belastingNiveau || null,
        caregiver.municipality
      ),

      // Mijlpalen ("Jouw reis")
      mijlpalen: buildMijlpalen(
        caregiver.createdAt,
        allTests.length > 0 ? allTests[allTests.length - 1].completedAt : null,
        recentCheckIns.length > 0 ? recentCheckIns[recentCheckIns.length - 1].createdAt : null,
        favorieten?.createdAt || null,
        caregiver.profileCompleted,
        latestTest?.belastingNiveau || null,
        testTrend
      ),

      // Locatie info voor UI
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
