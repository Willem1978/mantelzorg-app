/**
 * Tool: genereerRapportSamenvatting
 * Slaat de AI-gegenereerde samenvatting op in BelastbaarheidRapport.
 * Wordt gebruikt door de Balanstest Coach na het interpreteren van resultaten.
 */
import { tool } from "ai"
import { z } from "zod"
import { prisma } from "@/lib/prisma"

export function createGenereerRapportSamenvattingTool(ctx: { userId: string }) {
  return tool({
    description:
      "Sla de samenvatting, aandachtspunten en aanbevelingen op in het rapport van de gebruiker. Roep dit aan nadat je de balanstest hebt geinterpreteerd.",
    inputSchema: z.object({
      samenvatting: z.string().describe("Korte samenvatting van de resultaten (2-3 zinnen, B1 niveau)"),
      aandachtspunten: z
        .array(z.string())
        .max(3)
        .describe("Maximaal 3 aandachtspunten, bijv. 'Je energie is laag'"),
      aanbevelingen: z
        .array(z.string())
        .max(3)
        .describe("Maximaal 3 concrete aanbevelingen, bijv. 'Neem contact op met ...'"),
    }),
    execute: async ({ samenvatting, aandachtspunten, aanbevelingen }) => {
      // Zoek de meest recente test van deze gebruiker
      const test = await prisma.belastbaarheidTest.findFirst({
        where: { caregiver: { userId: ctx.userId }, isCompleted: true },
        orderBy: { completedAt: "desc" },
        select: { id: true },
      })

      if (!test) {
        return { opgeslagen: false, bericht: "Geen balanstest gevonden om een rapport voor te maken." }
      }

      // Update bestaand rapport of maak nieuw
      const existing = await prisma.belastbaarheidRapport.findFirst({
        where: { testId: test.id },
        select: { id: true },
      })

      if (existing) {
        await prisma.belastbaarheidRapport.update({
          where: { id: existing.id },
          data: { samenvatting, aandachtspunten, aanbevelingen },
        })
      } else {
        await prisma.belastbaarheidRapport.create({
          data: {
            testId: test.id,
            samenvatting,
            aandachtspunten,
            aanbevelingen,
            lokaleHulp: [],
          },
        })
      }

      return { opgeslagen: true, bericht: "Rapport-samenvatting opgeslagen." }
    },
  })
}
