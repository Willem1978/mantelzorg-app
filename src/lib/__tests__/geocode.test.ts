import { describe, it, expect } from "vitest"
import { parseCentroide, haversineDistance, afstandScore } from "@/lib/geocode"

describe("parseCentroide", () => {
  it("parseert PDOK POINT formaat correct", () => {
    const result = parseCentroide("POINT(5.47 52.15)")
    expect(result).toEqual({ latitude: 52.15, longitude: 5.47 })
  })

  it("retourneert null voor ongeldig formaat", () => {
    expect(parseCentroide("invalid")).toBeNull()
    expect(parseCentroide("")).toBeNull()
    expect(parseCentroide("POINT(abc def)")).toBeNull()
  })
})

describe("haversineDistance", () => {
  it("berekent afstand Amsterdam - Rotterdam (~60 km)", () => {
    // Amsterdam: 52.3676, 4.9041
    // Rotterdam: 51.9225, 4.4792
    const distance = haversineDistance(52.3676, 4.9041, 51.9225, 4.4792)
    expect(distance).toBeGreaterThan(55)
    expect(distance).toBeLessThan(65)
  })

  it("berekent afstand nul voor hetzelfde punt", () => {
    const distance = haversineDistance(52.0, 5.0, 52.0, 5.0)
    expect(distance).toBe(0)
  })

  it("berekent korte afstand correct (~5 km)", () => {
    // Twee punten in Utrecht ~5km uit elkaar
    const distance = haversineDistance(52.09, 5.12, 52.12, 5.08)
    expect(distance).toBeGreaterThan(3)
    expect(distance).toBeLessThan(7)
  })
})

describe("afstandScore", () => {
  it("geeft 100 voor < 5 km", () => {
    expect(afstandScore(0)).toBe(100)
    expect(afstandScore(3)).toBe(100)
    expect(afstandScore(4.9)).toBe(100)
  })

  it("geeft 70 voor 5-10 km", () => {
    expect(afstandScore(5)).toBe(70)
    expect(afstandScore(7)).toBe(70)
    expect(afstandScore(9.9)).toBe(70)
  })

  it("geeft 40 voor 10-20 km", () => {
    expect(afstandScore(10)).toBe(40)
    expect(afstandScore(15)).toBe(40)
    expect(afstandScore(19.9)).toBe(40)
  })

  it("geeft 10 voor > 20 km", () => {
    expect(afstandScore(20)).toBe(10)
    expect(afstandScore(50)).toBe(10)
    expect(afstandScore(100)).toBe(10)
  })
})
