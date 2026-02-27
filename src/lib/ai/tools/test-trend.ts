/**
 * Tool: bekijkTestTrend
 * Vergelijkt meerdere balanstesten over tijd voor trendanalyse.
 */
import { tool } from "ai"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { berekenDeelgebieden } from "@/lib/dashboard/deelgebieden"

export function createBekijkTestTrendTool(ctx: { userId: string }) {
  return tool({
    description:
      "Bekijk de trend van meerdere balanstesten over tijd. Gebruik dit als iemand vraagt of het beter of slechter gaat, of naar hun voortgang.",
    inputSchema: z.object({}),
    execute: async () => {
      const tests = await prisma.belastbaarheidTest.findMany({
        where: { caregiver: { userId: ctx.userId }, isCompleted: true },
        orderBy: { completedAt: "asc" },
        take: 8,
        select: {
          totaleBelastingScore: true,
          belastingNiveau: true,
          totaleZorguren: true,
          completedAt: true,
          antwoorden: {
            select: { vraagId: true, score: true, gewicht: true },
          },
        },
      })

      if (tests.length === 0) {
        return {
          gevonden: false,
          bericht: "Deze gebruiker heeft nog geen balanstesten gedaan. Verwijs naar /belastbaarheidstest.",
        }
      }

      if (tests.length === 1) {
        return {
          gevonden: true,
          aantalTests: 1,
          bericht: "Er is pas 1 test gedaan. Na de volgende test kan ik een trend laten zien.",
          laatsteScore: tests[0].totaleBelastingScore,
          laatsteNiveau: tests[0].belastingNiveau,
        }
      }

      const eerste = tests[0]
      const laatste = tests[tests.length - 1]
      const scoreVerschil = (laatste.totaleBelastingScore ?? 0) - (eerste.totaleBelastingScore ?? 0)

      const deelgebiedenEerst = berekenDeelgebieden(
        eerste.antwoorden.map((a) => ({ vraagId: a.vraagId, score: a.score, gewicht: a.gewicht }))
      )
      const deelgebiedenLaatst = berekenDeelgebieden(
        laatste.antwoorden.map((a) => ({ vraagId: a.vraagId, score: a.score, gewicht: a.gewicht }))
      )

      return {
        gevonden: true,
        aantalTests: tests.length,
        periode: {
          van: eerste.completedAt?.toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" }),
          tot: laatste.completedAt?.toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" }),
        },
        scoreTrend: {
          eersteScore: eerste.totaleBelastingScore,
          laatsteScore: laatste.totaleBelastingScore,
          verschil: scoreVerschil,
          richting: scoreVerschil < 0 ? "verbeterd" : scoreVerschil > 0 ? "verslechterd" : "gelijk",
        },
        zorguren: {
          eerst: eerste.totaleZorguren,
          laatst: laatste.totaleZorguren,
        },
        deelgebiedTrend: deelgebiedenEerst.map((d, i) => ({
          naam: d.naam,
          emoji: d.emoji,
          eersteNiveau: d.niveau,
          laatsteNiveau: deelgebiedenLaatst[i].niveau,
          eerstePercentage: d.percentage,
          laatstePercentage: deelgebiedenLaatst[i].percentage,
        })),
        alleScores: tests.map((t) => ({
          datum: t.completedAt?.toLocaleDateString("nl-NL", { day: "numeric", month: "short" }),
          score: t.totaleBelastingScore,
          niveau: t.belastingNiveau,
        })),
      }
    },
  })
}
