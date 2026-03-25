/**
 * Check-in Service
 *
 * Business logic voor maandelijkse check-ins van mantelzorgers.
 * Gescheiden van HTTP-layer zodat het herbruikbaar is vanuit API routes,
 * WhatsApp webhooks en toekomstige integraties.
 */

import { prisma } from "@/lib/prisma"
import { createLogger } from "@/lib/logger"
import { ANTWOORD_SCORES, CHECKIN_FREQUENTIES } from "@/config/options"

const log = createLogger("checkin-service")

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CheckInInput {
  answers: Record<string, string>
}

export interface CheckInResult {
  success: boolean
  message: string
}

export interface CheckInHistoryItem {
  id: string
  month: Date
  overallWellbeing: number | null
  physicalHealth: number | null
  emotionalHealth: number | null
  supportSatisfaction: number | null
  needsHelp: string | null
  completedAt: Date | null
}

export interface CheckInHistoryResponse {
  checkIns: CheckInHistoryItem[]
  needsCheckIn: boolean
  lastCheckIn: CheckInHistoryItem | null
  aanbevolenFrequentie: string
  frequentieDagen: number
  daysSinceLastCheckIn: number | null
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Maak of update een maandelijkse check-in voor een mantelzorger.
 * Berekent welzijnsscores uit de gegeven antwoorden.
 */
export async function createCheckIn(
  caregiverId: string,
  input: CheckInInput,
): Promise<CheckInResult> {
  try {
    const { answers } = input
    const scoreMap = ANTWOORD_SCORES

    // Calculate overall feeling and stress level
    let overallFeeling = 0
    let stressLevel = 0
    let supportFeeling = 0
    let answeredCount = 0

    Object.entries(answers).forEach(([questionId, answer]) => {
      if (answer in scoreMap) {
        answeredCount++
        const score = scoreMap[answer]

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
          caregiverId,
          month: monthStart,
        },
      },
      create: {
        caregiverId,
        month: monthStart,
        overallWellbeing: overallFeeling,
        physicalHealth: scoreMap[answers["c1"]] ? 4 - scoreMap[answers["c1"]] : null,
        emotionalHealth: scoreMap[answers["c3"]] ? 4 - scoreMap[answers["c3"]] : null,
        supportSatisfaction: supportFeeling || null,
        needsHelp: answers["c5"] || null,
        completedAt: new Date(),
      },
      update: {
        overallWellbeing: overallFeeling,
        physicalHealth: scoreMap[answers["c1"]] ? 4 - scoreMap[answers["c1"]] : null,
        emotionalHealth: scoreMap[answers["c3"]] ? 4 - scoreMap[answers["c3"]] : null,
        supportSatisfaction: supportFeeling || null,
        needsHelp: answers["c5"] || null,
        completedAt: new Date(),
      },
    })

    log.info({ caregiverId }, "Check-in opgeslagen")

    return {
      success: true,
      message: "Check-in opgeslagen",
    }
  } catch (error) {
    log.error({ err: error, caregiverId }, "Fout bij opslaan check-in")
    throw error
  }
}

/**
 * Haal check-in geschiedenis op voor een mantelzorger.
 * Bevat ook slimme frequentie-aanbeveling op basis van belastingniveau.
 */
export async function getCheckIns(caregiverId: string): Promise<CheckInHistoryResponse> {
  try {
    const checkIns = await prisma.monthlyCheckIn.findMany({
      where: { caregiverId },
      orderBy: { month: "desc" },
      take: 12, // Last 12 months
    })

    // Check if check-in is needed this month
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const hasCheckedInThisMonth = checkIns.some(
      (checkIn) => checkIn.month.getTime() === monthStart.getTime() && checkIn.completedAt
    )

    // Smart frequency: haal belastingniveau op voor check-in interval
    const latestTest = await prisma.belastbaarheidTest.findFirst({
      where: { caregiverId, isCompleted: true },
      orderBy: { completedAt: "desc" },
      select: { belastingNiveau: true },
    })

    const niveau = (latestTest?.belastingNiveau || "LAAG") as keyof typeof CHECKIN_FREQUENTIES
    const frequentieConfig = CHECKIN_FREQUENTIES[niveau] || CHECKIN_FREQUENTIES.LAAG
    const aanbevolenFrequentie = frequentieConfig.label
    const frequentieDagen = frequentieConfig.dagen

    // Check of check-in nodig is op basis van slimme frequentie
    const lastCheckIn = checkIns[0] || null
    const daysSinceLastCheckIn = lastCheckIn?.completedAt
      ? Math.floor((now.getTime() - new Date(lastCheckIn.completedAt).getTime()) / (1000 * 60 * 60 * 24))
      : null

    const needsCheckIn = !hasCheckedInThisMonth ||
      (daysSinceLastCheckIn !== null && daysSinceLastCheckIn >= frequentieDagen)

    const mappedCheckIns: CheckInHistoryItem[] = checkIns.map((c) => ({
      id: c.id,
      month: c.month,
      overallWellbeing: c.overallWellbeing,
      physicalHealth: c.physicalHealth,
      emotionalHealth: c.emotionalHealth,
      supportSatisfaction: c.supportSatisfaction,
      needsHelp: c.needsHelp,
      completedAt: c.completedAt,
    }))

    return {
      checkIns: mappedCheckIns,
      needsCheckIn,
      lastCheckIn: mappedCheckIns[0] || null,
      aanbevolenFrequentie,
      frequentieDagen,
      daysSinceLastCheckIn,
    }
  } catch (error) {
    log.error({ err: error, caregiverId }, "Fout bij ophalen check-ins")
    throw error
  }
}
