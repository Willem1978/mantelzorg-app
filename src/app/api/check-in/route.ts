import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

interface CheckInBody {
  answers: Record<string, string>
}

// POST - Save monthly check-in
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Je moet ingelogd zijn" },
        { status: 401 }
      )
    }

    const body: CheckInBody = await request.json()

    if (!body.answers || Object.keys(body.answers).length === 0) {
      return NextResponse.json(
        { error: "Geen antwoorden ontvangen" },
        { status: 400 }
      )
    }

    // Get caregiver profile
    const caregiver = await prisma.caregiver.findUnique({
      where: { userId: session.user.id }
    })

    if (!caregiver) {
      return NextResponse.json(
        { error: "Geen mantelzorger profiel gevonden" },
        { status: 404 }
      )
    }

    // Calculate scores from answers
    const scoreMap: Record<string, number> = {
      "ja": 1,
      "soms": 2,
      "nee": 3,
    }

    // Calculate overall feeling and stress level
    let overallFeeling = 0
    let stressLevel = 0
    let supportFeeling = 0
    let answeredCount = 0

    Object.entries(body.answers).forEach(([questionId, answer]) => {
      if (answer in scoreMap) {
        answeredCount++
        const score = scoreMap[answer]

        // Map questions to scores (simplified)
        if (questionId === "c1") {
          // Fatigue - reversed (ja = bad)
          overallFeeling += 4 - score
        } else if (questionId === "c2") {
          // Time for self (ja = good)
          overallFeeling += score
        } else if (questionId === "c3") {
          // Worries - reversed (ja = bad)
          stressLevel = 4 - score
        } else if (questionId === "c4") {
          // Support (ja = good)
          supportFeeling = score
        }
      }
    })

    // Normalize overall feeling to 1-4 scale
    if (answeredCount > 0) {
      overallFeeling = Math.round(overallFeeling / 2) // Average of 2 questions
    }

    // Get current month start
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    // Upsert monthly check-in
    await prisma.monthlyCheckIn.upsert({
      where: {
        caregiverId_month: {
          caregiverId: caregiver.id,
          month: monthStart,
        }
      },
      create: {
        caregiverId: caregiver.id,
        month: monthStart,
        overallWellbeing: overallFeeling,
        physicalHealth: scoreMap[body.answers["c1"]] ? 4 - scoreMap[body.answers["c1"]] : null,
        emotionalHealth: scoreMap[body.answers["c3"]] ? 4 - scoreMap[body.answers["c3"]] : null,
        supportSatisfaction: supportFeeling || null,
        needsHelp: body.answers["c5"] || null,
        completedAt: new Date(),
      },
      update: {
        overallWellbeing: overallFeeling,
        physicalHealth: scoreMap[body.answers["c1"]] ? 4 - scoreMap[body.answers["c1"]] : null,
        emotionalHealth: scoreMap[body.answers["c3"]] ? 4 - scoreMap[body.answers["c3"]] : null,
        supportSatisfaction: supportFeeling || null,
        needsHelp: body.answers["c5"] || null,
        completedAt: new Date(),
      }
    })

    return NextResponse.json({
      success: true,
      message: "Check-in opgeslagen",
    })

  } catch (error) {
    console.error("Check-in save error:", error)
    return NextResponse.json(
      { error: "Er ging iets mis bij het opslaan" },
      { status: 500 }
    )
  }
}

// GET - Get check-in history
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Je moet ingelogd zijn" },
        { status: 401 }
      )
    }

    const caregiver = await prisma.caregiver.findUnique({
      where: { userId: session.user.id },
      include: {
        monthlyCheckIns: {
          orderBy: { month: "desc" },
          take: 12, // Last 12 months
        }
      }
    })

    if (!caregiver) {
      return NextResponse.json(
        { error: "Geen mantelzorger profiel gevonden" },
        { status: 404 }
      )
    }

    // Check if check-in is needed this month
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const hasCheckedInThisMonth = caregiver.monthlyCheckIns.some(
      (checkIn) => checkIn.month.getTime() === monthStart.getTime() && checkIn.completedAt
    )

    return NextResponse.json({
      checkIns: caregiver.monthlyCheckIns,
      needsCheckIn: !hasCheckedInThisMonth,
      lastCheckIn: caregiver.monthlyCheckIns[0] || null,
    })

  } catch (error) {
    console.error("Check-in fetch error:", error)
    return NextResponse.json(
      { error: "Er ging iets mis bij het ophalen" },
      { status: 500 }
    )
  }
}
