/**
 * Re-engagement Service — Retentie-loop voor inactieve gebruikers
 *
 * Detecteert inactieve mantelzorgers en plant herinneringen:
 *   Week 1:  "Hoe gaat het?" (in-app notificatie)
 *   Week 2:  Gepersonaliseerde tip (op basis van profiel-tags)
 *   Maand 1: Check-in herinnering
 *   Maand 2: Warm bericht van Ger
 *
 * AVG: opt-out mogelijkheid per gebruiker.
 */

import { prisma } from "@/lib/prisma"
import { createLogger } from "@/lib/logger"

const log = createLogger("re-engagement")

const DAG = 24 * 60 * 60 * 1000

// Inactiviteits-drempels
const DREMPELS = {
  week1: 7 * DAG,
  week2: 14 * DAG,
  maand1: 30 * DAG,
  maand2: 60 * DAG,
}

/**
 * Detecteer inactieve gebruikers en maak re-engagement berichten aan.
 * Bedoeld voor een cron-job (dagelijks).
 */
export async function detecteerInactieveGebruikers(): Promise<{
  totaalGescand: number
  berichtenAangemaakt: number
}> {
  const now = new Date()
  let berichtenAangemaakt = 0

  try {
    // Vind actieve mantelzorgers die niet recent zijn ingelogd
    const inactieveGebruikers = await prisma.user.findMany({
      where: {
        isActive: true,
        role: "CAREGIVER",
        updatedAt: { lt: new Date(now.getTime() - DREMPELS.week1) },
      },
      select: {
        id: true,
        updatedAt: true,
      },
    })

    for (const user of inactieveGebruikers) {
      // Check of gebruiker heeft opt-out gedaan
      const optedOut = await prisma.reEngagementBericht.findFirst({
        where: { userId: user.id, optedOut: true },
      })
      if (optedOut) continue

      // Bepaal welk type bericht (op basis van inactiviteitsduur)
      const inactiefMs = now.getTime() - new Date(user.updatedAt).getTime()
      let type: string | null = null

      if (inactiefMs >= DREMPELS.maand2) {
        type = "warm_bericht"
      } else if (inactiefMs >= DREMPELS.maand1) {
        type = "check_in"
      } else if (inactiefMs >= DREMPELS.week2) {
        type = "tip"
      } else if (inactiefMs >= DREMPELS.week1) {
        type = "hoe_gaat_het"
      }

      if (!type) continue

      // Check of dit type al verstuurd is (voorkom duplicaten)
      const alVerstuurd = await prisma.reEngagementBericht.findFirst({
        where: {
          userId: user.id,
          type,
          verstuurdOp: { gte: new Date(now.getTime() - 7 * DAG) },
        },
      })
      if (alVerstuurd) continue

      // Maak bericht aan
      await prisma.reEngagementBericht.create({
        data: {
          userId: user.id,
          type,
          kanaal: "IN_APP",
        },
      })

      berichtenAangemaakt++
    }

    log.info({
      totaalGescand: inactieveGebruikers.length,
      berichtenAangemaakt,
    }, "Re-engagement scan voltooid")

    return {
      totaalGescand: inactieveGebruikers.length,
      berichtenAangemaakt,
    }
  } catch (e) {
    log.error({ err: e }, "Fout bij re-engagement scan")
    return { totaalGescand: 0, berichtenAangemaakt: 0 }
  }
}

/**
 * Haal openstaande re-engagement berichten op voor een gebruiker.
 * Wordt getoond als in-app notificatie op het dashboard.
 */
export async function getReEngagementBerichten(userId: string) {
  try {
    return await prisma.reEngagementBericht.findMany({
      where: {
        userId,
        geopendOp: null,
        optedOut: false,
      },
      orderBy: { verstuurdOp: "desc" },
      take: 3,
    })
  } catch {
    return []
  }
}

/**
 * Markeer een re-engagement bericht als geopend.
 */
export async function markeerAlsGeopend(berichtId: string): Promise<void> {
  await prisma.reEngagementBericht.update({
    where: { id: berichtId },
    data: { geopendOp: new Date() },
  })
}

/**
 * Opt-out: gebruiker wil geen re-engagement berichten meer.
 */
export async function optOut(userId: string): Promise<void> {
  await prisma.reEngagementBericht.updateMany({
    where: { userId },
    data: { optedOut: true },
  })

  log.info({ userId }, "Gebruiker heeft opt-out gedaan voor re-engagement")
}
