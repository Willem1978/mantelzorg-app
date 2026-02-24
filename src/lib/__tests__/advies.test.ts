import { describe, it, expect } from "vitest"
import { genereerAdvies } from "../dashboard/advies"

describe("genereerAdvies", () => {
  it("geeft hoge prioriteit adviezen voor HOOG niveau", () => {
    const adviezen = genereerAdvies({
      belastingNiveau: "HOOG",
      score: 18,
      trend: null,
      zwareTaken: ["Huishouden", "Administratie"],
      wellbeingTrend: null,
      daysSinceTest: 5,
      hasCheckIn: true,
    })

    expect(adviezen.length).toBeGreaterThan(0)
    expect(adviezen[0].prioriteit).toBe("hoog")
    expect(adviezen.some((a) => a.id === "hoog-hulp")).toBe(true)
    expect(adviezen.some((a) => a.id === "hoog-respijt")).toBe(true)
  })

  it("geeft balans advies voor GEMIDDELD niveau", () => {
    const adviezen = genereerAdvies({
      belastingNiveau: "GEMIDDELD",
      score: 10,
      trend: null,
      zwareTaken: ["Vervoer"],
      wellbeingTrend: null,
      daysSinceTest: 30,
      hasCheckIn: true,
    })

    expect(adviezen.some((a) => a.id === "gemiddeld-balans")).toBe(true)
    expect(adviezen.some((a) => a.id === "gemiddeld-taken")).toBe(true)
  })

  it("geeft positief advies voor LAAG niveau", () => {
    const adviezen = genereerAdvies({
      belastingNiveau: "LAAG",
      score: 4,
      trend: null,
      zwareTaken: [],
      wellbeingTrend: null,
      daysSinceTest: 10,
      hasCheckIn: true,
    })

    expect(adviezen.some((a) => a.id === "laag-goed")).toBe(true)
  })

  it("waarschuwt bij verslechterde trend", () => {
    const adviezen = genereerAdvies({
      belastingNiveau: "GEMIDDELD",
      score: 12,
      trend: "worse",
      zwareTaken: [],
      wellbeingTrend: null,
      daysSinceTest: 5,
      hasCheckIn: true,
    })

    expect(adviezen.some((a) => a.id === "trend-slechter")).toBe(true)
  })

  it("feliciteert bij verbeterde trend", () => {
    const adviezen = genereerAdvies({
      belastingNiveau: "LAAG",
      score: 4,
      trend: "improved",
      zwareTaken: [],
      wellbeingTrend: null,
      daysSinceTest: 5,
      hasCheckIn: true,
    })

    expect(adviezen.some((a) => a.id === "trend-beter")).toBe(true)
  })

  it("herinnert aan test na 90+ dagen", () => {
    const adviezen = genereerAdvies({
      belastingNiveau: "LAAG",
      score: 4,
      trend: null,
      zwareTaken: [],
      wellbeingTrend: null,
      daysSinceTest: 100,
      hasCheckIn: true,
    })

    expect(adviezen.some((a) => a.id === "test-verouderd")).toBe(true)
  })

  it("herinnert aan check-in als die niet gedaan is", () => {
    const adviezen = genereerAdvies({
      belastingNiveau: "LAAG",
      score: 4,
      trend: null,
      zwareTaken: [],
      wellbeingTrend: null,
      daysSinceTest: 10,
      hasCheckIn: false,
    })

    expect(adviezen.some((a) => a.id === "checkin-reminder")).toBe(true)
  })

  it("sorteert adviezen op prioriteit (hoog eerst)", () => {
    const adviezen = genereerAdvies({
      belastingNiveau: "HOOG",
      score: 18,
      trend: "worse",
      zwareTaken: [],
      wellbeingTrend: "down",
      daysSinceTest: 100,
      hasCheckIn: false,
    })

    for (let i = 1; i < adviezen.length; i++) {
      const prioriteitVolgorde = { hoog: 0, gemiddeld: 1, laag: 2 }
      expect(prioriteitVolgorde[adviezen[i].prioriteit]).toBeGreaterThanOrEqual(
        prioriteitVolgorde[adviezen[i - 1].prioriteit]
      )
    }
  })
})
