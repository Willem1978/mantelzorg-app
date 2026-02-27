/**
 * Tool: registreerAlarm
 * Registreert een alarmsignaal in de AlarmLog.
 * Wordt gebruikt door de Check-in Buddy wanneer kritieke signalen worden gedetecteerd.
 */
import { tool } from "ai"
import { z } from "zod"
import { prisma } from "@/lib/prisma"

export function createRegistreerAlarmTool(ctx: { userId: string }) {
  return tool({
    description:
      "Registreer een alarmsignaal wanneer je kritieke signalen detecteert bij de gebruiker. Gebruik dit bij emotionele nood, sociaal isolement, of hoge belasting.",
    inputSchema: z.object({
      type: z
        .enum([
          "HOGE_BELASTING",
          "KRITIEKE_COMBINATIE",
          "VEEL_ZORGUREN",
          "EMOTIONELE_NOOD",
          "SOCIAAL_ISOLEMENT",
          "FYSIEKE_KLACHTEN",
        ])
        .describe("Type alarm"),
      beschrijving: z.string().describe("Korte beschrijving van het signaal, bijv. 'Gebruiker geeft aan moe en alleen te zijn'"),
      urgentie: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).describe("Urgentieniveau"),
    }),
    execute: async ({ type, beschrijving, urgentie }) => {
      // Zoek de meest recente test om het alarm aan te koppelen
      const test = await prisma.belastbaarheidTest.findFirst({
        where: { caregiver: { userId: ctx.userId }, isCompleted: true },
        orderBy: { completedAt: "desc" },
        select: { id: true },
      })

      if (!test) {
        return { geregistreerd: false, bericht: "Geen test gevonden om alarm aan te koppelen." }
      }

      await prisma.alarmLog.create({
        data: {
          testId: test.id,
          type,
          beschrijving,
          urgentie,
        },
      })

      return { geregistreerd: true, bericht: `Alarm ${type} geregistreerd met urgentie ${urgentie}.` }
    },
  })
}
