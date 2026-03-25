/**
 * Gemeente Service — Automatische check-in planning & alarmnotificaties
 *
 * Na elke balanstest wordt automatisch een check-in gepland:
 *   HOOG:     1 week
 *   GEMIDDELD: 2 weken
 *   LAAG:     4 weken
 */

import { prisma } from "@/lib/prisma"
import { createLogger } from "@/lib/logger"

const log = createLogger("gemeente-service")

// Check-in intervallen per belastingniveau
const CHECK_IN_INTERVALLEN: Record<string, number> = {
  HOOG: 7,       // 1 week
  GEMIDDELD: 14,  // 2 weken
  LAAG: 28,       // 4 weken
}

/**
 * Plan een check-in na een balanstest.
 * Wordt aangeroepen vanuit de belastbaarheidstest API na voltooiing.
 */
export async function planCheckInNaBalanstest(
  caregiverId: string,
  belastingNiveau: string,
  testId?: string,
): Promise<void> {
  const dagen = CHECK_IN_INTERVALLEN[belastingNiveau] || 28
  const geplandOp = new Date()
  geplandOp.setDate(geplandOp.getDate() + dagen)

  try {
    // Annuleer bestaande geplande check-ins (alleen 1 actieve tegelijk)
    await prisma.geplandCheckin.updateMany({
      where: {
        caregiverId,
        status: "GEPLAND",
      },
      data: { status: "GEANNULEERD" },
    })

    // Plan nieuwe check-in
    await prisma.geplandCheckin.create({
      data: {
        caregiverId,
        geplandOp,
        kanaal: "IN_APP",
        aanleiding: `balanstest_${belastingNiveau.toLowerCase()}`,
        status: "GEPLAND",
        testId,
      },
    })

    log.info({
      caregiverId,
      belastingNiveau,
      geplandOp: geplandOp.toISOString(),
      dagen,
    }, "Check-in gepland na balanstest")
  } catch (e) {
    log.error({ err: e, caregiverId }, "Fout bij plannen check-in")
  }
}

/**
 * Haal geplande check-ins op voor een gemeente (geanonimiseerd).
 * K-anonimiteit: alleen tonen als er >= 10 mantelzorgers zijn.
 */
export async function getGemeenteCheckinStats(gemeente: string) {
  const K_MINIMUM = 10

  try {
    const totaalMantelzorgers = await prisma.caregiver.count({
      where: {
        OR: [
          { municipality: { equals: gemeente, mode: "insensitive" } },
          { careRecipientMunicipality: { equals: gemeente, mode: "insensitive" } },
        ],
      },
    })

    if (totaalMantelzorgers < K_MINIMUM) {
      return { voldoendeData: false, minimumVereist: K_MINIMUM }
    }

    const [gepland, verstuurd, voltooid] = await Promise.all([
      prisma.geplandCheckin.count({
        where: {
          status: "GEPLAND",
          caregiver: {
            OR: [
              { municipality: { equals: gemeente, mode: "insensitive" } },
              { careRecipientMunicipality: { equals: gemeente, mode: "insensitive" } },
            ],
          },
        },
      }),
      prisma.geplandCheckin.count({
        where: {
          status: "VERSTUURD",
          caregiver: {
            OR: [
              { municipality: { equals: gemeente, mode: "insensitive" } },
              { careRecipientMunicipality: { equals: gemeente, mode: "insensitive" } },
            ],
          },
        },
      }),
      prisma.geplandCheckin.count({
        where: {
          status: "VOLTOOID",
          caregiver: {
            OR: [
              { municipality: { equals: gemeente, mode: "insensitive" } },
              { careRecipientMunicipality: { equals: gemeente, mode: "insensitive" } },
            ],
          },
        },
      }),
    ])

    return {
      voldoendeData: true,
      totaalMantelzorgers,
      checkins: { gepland, verstuurd, voltooid },
    }
  } catch (e) {
    log.error({ err: e, gemeente }, "Fout bij ophalen gemeente check-in stats")
    return { voldoendeData: false, error: true }
  }
}

/**
 * Verstuur geanonimiseerde alarmnotificatie naar gemeente.
 * Geen PII — alleen type, niveau, gemeente en aantal.
 */
export async function getGemeenteAlarmen(gemeente: string) {
  try {
    const recenteAlarmen = await prisma.alarmLog.groupBy({
      by: ["urgentie"],
      where: {
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        test: {
          OR: [
            { gemeente: { equals: gemeente, mode: "insensitive" } },
            { caregiver: { careRecipientMunicipality: { equals: gemeente, mode: "insensitive" } } },
          ],
        },
      },
      _count: true,
    })

    return recenteAlarmen.map((a) => ({
      urgentie: a.urgentie,
      aantal: a._count,
    }))
  } catch (e) {
    log.error({ err: e, gemeente }, "Fout bij ophalen gemeente alarmen")
    return []
  }
}
