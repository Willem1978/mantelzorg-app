import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { matchBuddys, type BuddyForMatching, type MatchRequest } from "@/lib/matching"
import { validateBody, buddyMatchSchema } from "@/lib/validations"

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
    const raw = await request.json()
    const validated = validateBody(raw, buddyMatchSchema)
    if (!validated.success) {
      return NextResponse.json({ error: validated.error }, { status: 400 })
    }

    const vd = validated.data
    const zorgtaken = vd.zorgtaken ?? []
    const latitude = vd.latitude ?? null
    const longitude = vd.longitude ?? null
    const beschikbaarheid = vd.beschikbaarheid as "EENMALIG" | "VAST" | "BEIDE" | undefined
    const maxAfstandKm = vd.maxAfstandKm ?? 20

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

    // Privacy-safe: verschuif buddy-coördinaten met ~500m deterministische offset
    function privacyOffset(id: string, coord: number, factor: number): number {
      let hash = 0
      for (let i = 0; i < id.length; i++) {
        hash = ((hash << 5) - hash) + id.charCodeAt(i)
        hash = hash & hash
      }
      const offset = ((hash % 1000) / 1000 - 0.5) * factor
      return coord + offset
    }

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
        // Approximate coordinates (privacy-safe: ~500m offset)
        latitude: m.buddy.latitude != null
          ? privacyOffset(m.buddy.id, m.buddy.latitude, 0.009)
          : null,
        longitude: m.buddy.longitude != null
          ? privacyOffset(m.buddy.id, m.buddy.longitude, 0.012)
          : null,
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
