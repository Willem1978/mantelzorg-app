/**
 * Tool: bekijkCheckInTrend
 * Vergelijkt recente check-ins om trends te detecteren.
 */
import { tool } from "ai"
import { z } from "zod"
import { prisma } from "@/lib/prisma"

export function createBekijkCheckInTrendTool(ctx: { userId: string }) {
  return tool({
    description:
      "Bekijk de trend van maandelijkse check-ins. Vergelijk de huidige check-in met eerdere. Gebruik dit om te zien of het beter of slechter gaat.",
    inputSchema: z.object({}),
    execute: async () => {
      const checkIns = await prisma.monthlyCheckIn.findMany({
        where: {
          caregiver: { userId: ctx.userId },
          completedAt: { not: null },
        },
        orderBy: { month: "desc" },
        take: 6,
        select: {
          month: true,
          overallWellbeing: true,
          physicalHealth: true,
          emotionalHealth: true,
          supportSatisfaction: true,
          needsHelp: true,
          completedAt: true,
        },
      })

      if (checkIns.length === 0) {
        return {
          gevonden: false,
          bericht: "Nog geen check-ins gedaan.",
        }
      }

      const laatste = checkIns[0]
      const vorige = checkIns.length > 1 ? checkIns[1] : null

      let trend = "eerste"
      if (vorige && laatste.overallWellbeing != null && vorige.overallWellbeing != null) {
        const verschil = laatste.overallWellbeing - vorige.overallWellbeing
        trend = verschil < 0 ? "verbeterd" : verschil > 0 ? "verslechterd" : "gelijk"
      }

      return {
        gevonden: true,
        aantalCheckIns: checkIns.length,
        laatste: {
          maand: laatste.month.toLocaleDateString("nl-NL", { month: "long", year: "numeric" }),
          welzijn: laatste.overallWellbeing,
          fysiek: laatste.physicalHealth,
          emotioneel: laatste.emotionalHealth,
          steun: laatste.supportSatisfaction,
          hulpNodig: laatste.needsHelp,
        },
        vorige: vorige
          ? {
              maand: vorige.month.toLocaleDateString("nl-NL", { month: "long", year: "numeric" }),
              welzijn: vorige.overallWellbeing,
              fysiek: vorige.physicalHealth,
              emotioneel: vorige.emotionalHealth,
            }
          : null,
        trend,
        geschiedenis: checkIns.map((c) => ({
          maand: c.month.toLocaleDateString("nl-NL", { month: "short", year: "2-digit" }),
          welzijn: c.overallWellbeing,
        })),
      }
    },
  })
}
