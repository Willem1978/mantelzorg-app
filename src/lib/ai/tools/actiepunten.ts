/**
 * Tool: slaActiepuntOp + bekijkActiepunten
 *
 * Gebruikt het bestaande Task model om AI-gesuggereerde actiepunten op te slaan.
 * Dit maakt opvolging tussen sessies mogelijk: "Vorige keer spraken we over X. Is dat gelukt?"
 */
import { tool } from "ai"
import { z } from "zod"
import { prisma } from "@/lib/prisma"

/**
 * Haalt openstaande actiepunten op voor de pre-fetch context.
 */
export async function fetchOpenActiepunten(userId: string) {
  const caregiver = await prisma.caregiver.findUnique({
    where: { userId },
    select: { id: true },
  })

  if (!caregiver) return []

  return prisma.task.findMany({
    where: {
      caregiverId: caregiver.id,
      isSuggested: true,
      status: { in: ["TODO", "IN_PROGRESS"] },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: {
      id: true,
      title: true,
      description: true,
      suggestedReason: true,
      status: true,
      createdAt: true,
    },
  })
}

/**
 * Tool: sla een actiepunt op dat de AI aan de mantelzorger heeft voorgesteld.
 */
export function createSlaActiepuntOpTool(ctx: { userId: string }) {
  return tool({
    description:
      "Sla een concreet actiepunt op dat je aan de mantelzorger hebt voorgesteld. " +
      "Bijvoorbeeld: 'Bel Thuiszorg Plus voor een intake', 'Doe de balanstest opnieuw'. " +
      "Dit wordt bij het volgende gesprek getoond zodat je kunt opvolgen.",
    inputSchema: z.object({
      titel: z
        .string()
        .describe("Korte omschrijving van het actiepunt, bijv. 'Bel Thuiszorg Plus'"),
      reden: z
        .string()
        .optional()
        .describe("Waarom dit actiepunt belangrijk is"),
    }),
    execute: async ({ titel, reden }) => {
      const caregiver = await prisma.caregiver.findUnique({
        where: { userId: ctx.userId },
        select: { id: true },
      })

      if (!caregiver) {
        return { opgeslagen: false, reden: "Geen caregiver profiel gevonden." }
      }

      await prisma.task.create({
        data: {
          caregiverId: caregiver.id,
          title: titel,
          description: reden || null,
          category: "OTHER",
          priority: "MEDIUM",
          status: "TODO",
          isSuggested: true,
          suggestedReason: reden || "Voorgesteld door MantelCoach Ger",
        },
      })

      return { opgeslagen: true, titel }
    },
  })
}
