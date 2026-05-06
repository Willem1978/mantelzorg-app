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

// Module-level cache zodat we niet elke chat-beurt opnieuw alle adviezen
// uit de DB hoeven halen. Adviezen veranderen zelden — een TTL van 5 min
// is ruim voldoende.
const TTL_MS = 5 * 60 * 1000
let cached: { map: AdviesMap; expiresAt: number } | null = null

/**
 * Haal alle actieve coach-adviezen op en retourneer als sleutel→advies map.
 * Resultaat wordt 5 minuten gecached om DB-belasting te beperken.
 */
export async function loadCoachAdviezen(): Promise<AdviesMap> {
  const now = Date.now()
  if (cached && cached.expiresAt > now) return cached.map

  const rows = await prisma.coachAdvies.findMany({
    where: { isActief: true },
    select: { sleutel: true, advies: true },
  })
  const map = Object.fromEntries(rows.map((r) => [r.sleutel, r.advies]))
  cached = { map, expiresAt: now + TTL_MS }
  return map
}
