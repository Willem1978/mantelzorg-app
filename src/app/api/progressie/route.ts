import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

interface Badge {
  id: string
  naam: string
  emoji: string
  beschrijving: string
  behaald: boolean
  behaaldOp?: string
}

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.caregiverId) {
      return NextResponse.json(
        { error: "Niet ingelogd of geen mantelzorger profiel" },
        { status: 401 }
      )
    }

    const caregiverId = session.user.caregiverId

    // Fetch all data in parallel
    const [
      checkInCount,
      caregiver,
      artikelenGelezen,
      balanstestCount,
      favorietenCount,
    ] = await Promise.all([
      prisma.monthlyCheckIn.count({
        where: { caregiverId },
      }),
      prisma.caregiver.findUnique({
        where: { id: caregiverId },
        select: { profileCompleted: true, createdAt: true },
      }),
      prisma.artikelInteractie.count({
        where: { caregiverId, gelezen: true },
      }),
      prisma.belastbaarheidTest.count({
        where: { caregiverId },
      }),
      prisma.favoriet.count({
        where: { caregiverId },
      }),
    ])

    const now = new Date()
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
    const isThreeMonthsActive = caregiver?.createdAt
      ? caregiver.createdAt <= ninetyDaysAgo
      : false

    const badges: Badge[] = [
      {
        id: "eerste-checkin",
        naam: "Eerste check-in",
        emoji: "\u2705",
        beschrijving: "Je hebt je eerste maandelijkse check-in gedaan",
        behaald: checkInCount >= 1,
      },
      {
        id: "profiel-compleet",
        naam: "Profiel compleet",
        emoji: "\uD83D\uDC64",
        beschrijving: "Je profiel is volledig ingevuld",
        behaald: caregiver?.profileCompleted === true,
      },
      {
        id: "5-artikelen",
        naam: "5 artikelen gelezen",
        emoji: "\uD83D\uDCDA",
        beschrijving: "Je hebt 5 artikelen gelezen in de kennisbank",
        behaald: artikelenGelezen >= 5,
      },
      {
        id: "10-artikelen",
        naam: "10 artikelen gelezen",
        emoji: "\uD83C\uDFC6",
        beschrijving: "Je hebt 10 artikelen gelezen \u2014 echte kennisheld!",
        behaald: artikelenGelezen >= 10,
      },
      {
        id: "eerste-balanstest",
        naam: "Eerste balanstest",
        emoji: "\u2696\uFE0F",
        beschrijving: "Je hebt je eerste belastbaarheidstest gedaan",
        behaald: balanstestCount >= 1,
      },
      {
        id: "3-maanden-actief",
        naam: "3 maanden actief",
        emoji: "\uD83D\uDD25",
        beschrijving: "Je bent al 3 maanden actief op MantelBuddy",
        behaald: isThreeMonthsActive,
      },
      {
        id: "hulpbronnen-bewaard",
        naam: "Hulpbronnen bewaard",
        emoji: "\u2B50",
        beschrijving: "Je hebt hulpbronnen opgeslagen als favoriet",
        behaald: favorietenCount >= 1,
      },
    ]

    const totaalBehaald = badges.filter((b) => b.behaald).length

    return NextResponse.json({
      badges,
      totaalBehaald,
      totaalBadges: badges.length,
    })
  } catch (error) {
    console.error("Progressie fetch error:", error)
    return NextResponse.json(
      { error: "Er ging iets mis bij het ophalen van je voortgang" },
      { status: 500 }
    )
  }
}
