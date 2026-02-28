import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { matchBuddys, type BuddyForMatching, type MatchRequest } from "@/lib/matching"

/**
 * POST /api/buddys/match
 *
 * Zoek gematchte buddys op basis van zorgtaken, locatie en beschikbaarheid.
 * Retourneert gesorteerde lijst met matchpercentages.
 *
 * Body: {
 *   zorgtaken: string[]          — dbValues van zorgtaken
 *   latitude?: number            — locatie naaste
 *   longitude?: number           — locatie naaste
 *   beschikbaarheid?: string     — EENMALIG | VAST | BEIDE
 *   maxAfstandKm?: number        — max afstand (standaard 20)
 * }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()

    const {
      zorgtaken = [],
      latitude = null,
      longitude = null,
      beschikbaarheid,
      maxAfstandKm = 20,
    } = body

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

    return NextResponse.json({
      matches: matches.map((m) => ({
        buddyId: m.buddy.id,
        voornaam: m.buddy.voornaam,
        woonplaats: m.buddy.woonplaats,
        hulpvormen: m.buddy.hulpvormen,
        beschikbaarheid: m.buddy.beschikbaarheid,
        vogGoedgekeurd: m.buddy.vogGoedgekeurd,
        matchPercentage: m.matchPercentage,
        afstandKm: m.afstandKm,
        details: m.details,
      })),
      totaal: matches.length,
    })
  } catch (error) {
    console.error("Match API error:", error)
    return NextResponse.json(
      { error: "Er ging iets mis bij het zoeken naar buddys" },
      { status: 500 },
    )
  }
}
