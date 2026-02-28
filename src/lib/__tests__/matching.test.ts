import { describe, it, expect } from "vitest"
import {
  berekenTaakOverlap,
  berekenBeschikbaarheidScore,
  berekenMatchPercentage,
  matchBuddys,
  type BuddyForMatching,
  type MatchRequest,
} from "@/lib/matching"

const makeBuddy = (overrides: Partial<BuddyForMatching> = {}): BuddyForMatching => ({
  id: "buddy-1",
  voornaam: "Jan",
  woonplaats: "Utrecht",
  hulpvormen: ["gesprek", "boodschappen", "vervoer"],
  beschikbaarheid: "BEIDE",
  vogGoedgekeurd: true,
  trainingVoltooid: true,
  gemiddeldeScore: 4.5,
  aantalBeoordelingen: 3,
  latitude: 52.09,
  longitude: 5.12,
  maxReisafstand: 10,
  ...overrides,
})

describe("berekenTaakOverlap", () => {
  it("100% bij volledige overlap", () => {
    const score = berekenTaakOverlap(
      ["Boodschappen", "Vervoer"],
      ["boodschappen", "vervoer"],
    )
    expect(score).toBe(100)
  })

  it("50% bij halve overlap", () => {
    const score = berekenTaakOverlap(
      ["Boodschappen", "Vervoer"],
      ["boodschappen"],
    )
    expect(score).toBe(50)
  })

  it("0% bij geen overlap", () => {
    const score = berekenTaakOverlap(
      ["Persoonlijke verzorging"],
      ["vervoer", "administratie"],
    )
    expect(score).toBe(0)
  })

  it("50 als geen zorgtaken opgegeven", () => {
    const score = berekenTaakOverlap([], ["boodschappen"])
    expect(score).toBe(50)
  })

  it("mapt zorgtaak dbValues correct naar hulpvormen", () => {
    expect(berekenTaakOverlap(["Administratie en aanvragen"], ["administratie"])).toBe(100)
    expect(berekenTaakOverlap(["Sociaal contact en activiteiten"], ["gesprek"])).toBe(100)
    expect(berekenTaakOverlap(["Klusjes in en om het huis"], ["klusjes"])).toBe(100)
  })
})

describe("berekenBeschikbaarheidScore", () => {
  it("geeft maximale score voor perfecte buddy", () => {
    const buddy = makeBuddy()
    const score = berekenBeschikbaarheidScore(buddy, "BEIDE")
    expect(score).toBe(98) // 40 + 25 + 15 + 18
  })

  it("lagere score zonder VOG", () => {
    const buddy = makeBuddy({ vogGoedgekeurd: false })
    const score = berekenBeschikbaarheidScore(buddy)
    expect(score).toBeLessThan(berekenBeschikbaarheidScore(makeBuddy()))
  })

  it("lagere score bij beschikbaarheid mismatch", () => {
    const buddy = makeBuddy({ beschikbaarheid: "EENMALIG" })
    const score = berekenBeschikbaarheidScore(buddy, "VAST")
    expect(score).toBeLessThan(berekenBeschikbaarheidScore(makeBuddy(), "VAST"))
  })

  it("neutrale beoordelingsscore zonder beoordelingen", () => {
    const buddy = makeBuddy({ aantalBeoordelingen: 0, gemiddeldeScore: 0 })
    const score = berekenBeschikbaarheidScore(buddy)
    // 40 (beschikbaarheid BEIDE) + 25 (VOG) + 15 (training) + 10 (neutraal beoordeling)
    expect(score).toBe(90)
  })
})

describe("berekenMatchPercentage", () => {
  it("hoog percentage voor perfecte match", () => {
    const buddy = makeBuddy()
    const request: MatchRequest = {
      zorgtaken: ["Boodschappen", "Vervoer", "Sociaal contact en activiteiten"],
      latitude: 52.09,
      longitude: 5.12,
    }
    const result = berekenMatchPercentage(buddy, request)
    expect(result.matchPercentage).toBeGreaterThan(80)
  })

  it("laag percentage voor slechte match", () => {
    const buddy = makeBuddy({
      hulpvormen: ["klusjes"],
      vogGoedgekeurd: false,
      trainingVoltooid: false,
      latitude: 51.44, // ~70km weg
      longitude: 5.47,
    })
    const request: MatchRequest = {
      zorgtaken: ["Vervoer", "Boodschappen"],
      latitude: 52.09,
      longitude: 5.12,
    }
    const result = berekenMatchPercentage(buddy, request)
    expect(result.matchPercentage).toBeLessThan(30)
  })

  it("berekent afstand correct", () => {
    const buddy = makeBuddy({ latitude: 52.12, longitude: 5.08 })
    const request: MatchRequest = {
      zorgtaken: [],
      latitude: 52.09,
      longitude: 5.12,
    }
    const result = berekenMatchPercentage(buddy, request)
    expect(result.afstandKm).toBeGreaterThan(2)
    expect(result.afstandKm).toBeLessThan(6)
  })

  it("neutrale afstandsscore als geen locatie", () => {
    const buddy = makeBuddy({ latitude: null, longitude: null })
    const request: MatchRequest = {
      zorgtaken: ["Boodschappen"],
      latitude: null,
      longitude: null,
    }
    const result = berekenMatchPercentage(buddy, request)
    expect(result.afstandKm).toBeNull()
    expect(result.details.afstandScore).toBe(50)
  })
})

describe("matchBuddys", () => {
  it("sorteert op matchpercentage (hoog → laag)", () => {
    const buddys = [
      makeBuddy({ id: "b1", hulpvormen: ["klusjes"] }),
      makeBuddy({ id: "b2", hulpvormen: ["boodschappen", "vervoer", "gesprek"] }),
      makeBuddy({ id: "b3", hulpvormen: ["boodschappen"] }),
    ]
    const request: MatchRequest = {
      zorgtaken: ["Boodschappen", "Vervoer", "Sociaal contact en activiteiten"],
      latitude: 52.09,
      longitude: 5.12,
    }
    const results = matchBuddys(buddys, request)
    expect(results[0].buddy.id).toBe("b2")
    expect(results.length).toBe(3)
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1].matchPercentage).toBeGreaterThanOrEqual(results[i].matchPercentage)
    }
  })

  it("filtert buddys buiten maximale afstand", () => {
    const buddys = [
      makeBuddy({ id: "b1", latitude: 52.10, longitude: 5.13 }), // ~1.5 km
      makeBuddy({ id: "b2", latitude: 51.44, longitude: 5.47 }), // ~70 km
    ]
    const request: MatchRequest = {
      zorgtaken: [],
      latitude: 52.09,
      longitude: 5.12,
      maxAfstandKm: 20,
    }
    const results = matchBuddys(buddys, request)
    expect(results.length).toBe(1)
    expect(results[0].buddy.id).toBe("b1")
  })

  it("respecteert buddy maxReisafstand", () => {
    const buddys = [
      makeBuddy({ id: "b1", latitude: 52.20, longitude: 5.20, maxReisafstand: 5 }), // ~13 km
    ]
    const request: MatchRequest = {
      zorgtaken: [],
      latitude: 52.09,
      longitude: 5.12,
      maxAfstandKm: 50, // Mantelzorger accepteert ver
    }
    const results = matchBuddys(buddys, request)
    expect(results.length).toBe(0) // Buddy wil max 5 km reizen
  })
})
