/**
 * Laadt configureerbare coach-adviezen uit de database.
 * Adviezen worden beheerd via het admin panel (CoachAdvies model).
 *
 * Sleutel-patronen:
 *   totaal.LAAG / totaal.GEMIDDELD / totaal.HOOG
 *   energie.LAAG / energie.GEMIDDELD / energie.HOOG
 *   gevoel.LAAG / gevoel.GEMIDDELD / gevoel.HOOG
 *   tijd.LAAG / tijd.GEMIDDELD / tijd.HOOG
 *   taak.t1.advies / taak.t2.advies / ...
 */
import { prisma } from "@/lib/prisma"

export type AdviesMap = Record<string, string>

/**
 * Haal alle actieve coach-adviezen op en retourneer als sleutel→advies map.
 */
export async function loadCoachAdviezen(): Promise<AdviesMap> {
  const rows = await prisma.coachAdvies.findMany({
    where: { isActief: true },
    select: { sleutel: true, advies: true },
  })
  return Object.fromEntries(rows.map((r) => [r.sleutel, r.advies]))
}
