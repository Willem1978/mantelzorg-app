/**
 * Buddy Service
 *
 * Business logic voor het matchen en ophalen van MantelBuddy-koppelingen.
 * Gescheiden van HTTP-layer zodat het herbruikbaar is vanuit API routes,
 * WhatsApp webhooks en toekomstige integraties.
 */

import { prisma } from "@/lib/prisma"
import { createLogger } from "@/lib/logger"
import { matchBuddys, type BuddyForMatching, type MatchRequest } from "@/lib/matching"

const log = createLogger("buddy-service")

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MatchSearchInput {
  zorgtaken?: string[]
  latitude?: number | null
  longitude?: number | null
  beschikbaarheid?: "EENMALIG" | "VAST" | "BEIDE"
  maxAfstandKm?: number
}

export interface MatchResultItem {
  buddyId: string
  voornaam: string
  woonplaats: string | null
  hulpvormen: string[]
  beschikbaarheid: string | null
  vogGoedgekeurd: boolean
  matchPercentage: number
  afstandKm: number | null
  details: Record<string, unknown>
  latitude: number | null
  longitude: number | null
}

export interface MatchSearchResult {
  matches: MatchResultItem[]
  totaal: number
}

export interface TaakReactie {
  taak: {
    titel: string
    status: string
  }
}

export interface MijnMatchItem {
  id: string
  status: string
  buddyNaam: string
  mantelzorgerNaam: string
  caregiverId: string
  taakReacties: TaakReactie[]
  ongelezen: number
}

// ---------------------------------------------------------------------------
// Helpers (private)
// ---------------------------------------------------------------------------

/**
 * Privacy-safe: verschuif buddy-coordinaten met ~500m deterministische offset.
 */
function privacyOffset(id: string, coord: number, factor: number): number {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash) + id.charCodeAt(i)
    hash = hash & hash
  }
  const offset = ((hash % 1000) / 1000 - 0.5) * factor
  return coord + offset
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Zoek gematchte buddys op basis van zorgtaken, locatie en beschikbaarheid.
 * Retourneert gesorteerde lijst met matchpercentages en privacy-safe coordinaten.
 */
export async function getMatches(input: MatchSearchInput): Promise<MatchSearchResult> {
  try {
    const zorgtaken = input.zorgtaken ?? []
    const latitude = input.latitude ?? null
    const longitude = input.longitude ?? null
    const beschikbaarheid = input.beschikbaarheid
    const maxAfstandKm = input.maxAfstandKm ?? 20

    // Haal actieve, goedgekeurde buddys op
    const buddys = await prisma.mantelBuddy.findMany({
      where: {
        isActief: true,
        status: "GOEDGEKEURD",
      },
      select: {
        id: true,
        voornaam: true,
        woonplaats: true,
        hulpvormen: true,
        beschikbaarheid: true,
        vogGoedgekeurd: true,
        trainingVoltooid: true,
        gemiddeldeScore: true,
        aantalBeoordelingen: true,
        latitude: true,
        longitude: true,
        maxReisafstand: true,
      },
    })

    const buddysForMatching: BuddyForMatching[] = buddys.map((b) => ({
      id: b.id,
      voornaam: b.voornaam,
      woonplaats: b.woonplaats,
      hulpvormen: b.hulpvormen,
      beschikbaarheid: b.beschikbaarheid,
      vogGoedgekeurd: b.vogGoedgekeurd,
      trainingVoltooid: b.trainingVoltooid,
      gemiddeldeScore: b.gemiddeldeScore,
      aantalBeoordelingen: b.aantalBeoordelingen,
      latitude: b.latitude,
      longitude: b.longitude,
      maxReisafstand: b.maxReisafstand,
    }))

    const matchRequest: MatchRequest = {
      zorgtaken,
      latitude,
      longitude,
      beschikbaarheid,
      maxAfstandKm,
    }

    const matches = matchBuddys(buddysForMatching, matchRequest)

    const mappedMatches: MatchResultItem[] = matches.map((m) => ({
      buddyId: m.buddy.id,
      voornaam: m.buddy.voornaam,
      woonplaats: m.buddy.woonplaats,
      hulpvormen: m.buddy.hulpvormen,
      beschikbaarheid: m.buddy.beschikbaarheid,
      vogGoedgekeurd: m.buddy.vogGoedgekeurd,
      matchPercentage: m.matchPercentage,
      afstandKm: m.afstandKm,
      details: m.details as Record<string, unknown>,
      // Approximate coordinates (privacy-safe: ~500m offset)
      latitude: m.buddy.latitude != null
        ? privacyOffset(m.buddy.id, m.buddy.latitude, 0.009)
        : null,
      longitude: m.buddy.longitude != null
        ? privacyOffset(m.buddy.id, m.buddy.longitude, 0.012)
        : null,
    }))

    return {
      matches: mappedMatches,
      totaal: mappedMatches.length,
    }
  } catch (error) {
    log.error({ err: error }, "Fout bij zoeken naar buddy matches")
    throw error
  }
}

/**
 * Haal actieve matches op voor een ingelogde buddy (via userId).
 * Bevat ook ongelezen berichtentelling per match.
 */
export async function getMatchById(userId: string): Promise<MijnMatchItem[]> {
  try {
    const buddy = await prisma.mantelBuddy.findUnique({
      where: { userId },
    })

    if (!buddy) {
      return []
    }

    const buddyMatches = await prisma.buddyMatch.findMany({
      where: {
        buddyId: buddy.id,
        status: { in: ["ACTIEF", "CAREGIVER_AKKOORD"] },
      },
      orderBy: { updatedAt: "desc" },
      include: {
        caregiver: {
          select: {
            id: true,
            user: { select: { name: true } },
          },
        },
        taakReacties: {
          where: { buddyId: buddy.id },
          include: {
            taak: {
              select: { titel: true, status: true },
            },
          },
        },
      },
    })

    // Tel ongelezen berichten per match
    const matchesMetOngelezen = await Promise.all(
      buddyMatches.map(async (m) => {
        const ongelezen = await prisma.bericht.count({
          where: {
            matchId: m.id,
            afzenderId: { not: userId },
            isGelezen: false,
          },
        })

        return {
          id: m.id,
          status: m.status,
          buddyNaam: buddy.voornaam,
          mantelzorgerNaam: m.caregiver.user?.name?.split(" ")[0] || "Mantelzorger",
          caregiverId: m.caregiver.id,
          taakReacties: m.taakReacties.map((tr) => ({
            taak: {
              titel: tr.taak.titel,
              status: tr.taak.status,
            },
          })),
          ongelezen,
        }
      })
    )

    return matchesMetOngelezen
  } catch (error) {
    log.error({ err: error, userId }, "Fout bij ophalen mijn matches")
    throw error
  }
}
