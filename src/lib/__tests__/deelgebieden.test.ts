import { describe, it, expect } from "vitest"
import { berekenDeelgebieden } from "../dashboard/deelgebieden"

describe("berekenDeelgebieden", () => {
  it("berekent drie deelgebieden (energie, gevoel, tijd)", () => {
    const antwoorden = [
      { vraagId: "q1", score: 1, gewicht: 1.5 },
      { vraagId: "q2", score: 0, gewicht: 1.0 },
      { vraagId: "q3", score: 2, gewicht: 1.0 },
      { vraagId: "q4", score: 1, gewicht: 1.5 },
      { vraagId: "q5", score: 1, gewicht: 1.5 },
      { vraagId: "q6", score: 0, gewicht: 1.0 },
      { vraagId: "q7", score: 2, gewicht: 1.5 },
      { vraagId: "q8", score: 0, gewicht: 1.0 },
      { vraagId: "q9", score: 1, gewicht: 1.0 },
      { vraagId: "q10", score: 0, gewicht: 1.0 },
      { vraagId: "q11", score: 1, gewicht: 1.5 },
    ]

    const result = berekenDeelgebieden(antwoorden)
    expect(result).toHaveLength(3)
    expect(result[0].naam).toBe("Jouw energie")
    expect(result[1].naam).toBe("Jouw gevoel")
    expect(result[2].naam).toBe("Jouw tijd")
  })

  it("geeft LAAG niveau bij lage scores", () => {
    const antwoorden = Array.from({ length: 11 }, (_, i) => ({
      vraagId: `q${i + 1}`,
      score: 0,
      gewicht: 1,
    }))

    const result = berekenDeelgebieden(antwoorden)
    result.forEach((d) => {
      expect(d.niveau).toBe("LAAG")
      expect(d.percentage).toBe(0)
    })
  })

  it("geeft HOOG niveau bij maximale scores", () => {
    const antwoorden = Array.from({ length: 11 }, (_, i) => ({
      vraagId: `q${i + 1}`,
      score: 2,
      gewicht: 1.5,
    }))

    const result = berekenDeelgebieden(antwoorden)
    result.forEach((d) => {
      expect(d.niveau).toBe("HOOG")
      expect(d.percentage).toBeGreaterThan(60)
    })
  })

  it("berekent percentage correct voor energie", () => {
    // q1 (1.5) + q2 (1.0) + q3 (1.0) = max gewicht 3.5, max score = 7.0
    const antwoorden = [
      { vraagId: "q1", score: 2, gewicht: 1.5 }, // 2 * 1.5 = 3.0
      { vraagId: "q2", score: 2, gewicht: 1.0 }, // 2 * 1.0 = 2.0
      { vraagId: "q3", score: 2, gewicht: 1.0 }, // 2 * 1.0 = 2.0
      // totaal: 7.0, max: 7.0, percentage: 100%
    ]

    const result = berekenDeelgebieden(antwoorden)
    const energie = result.find((d) => d.naam === "Jouw energie")!
    expect(energie.percentage).toBe(100)
    expect(energie.niveau).toBe("HOOG")
  })

  it("negeert onbekende vraagIds", () => {
    const antwoorden = [
      { vraagId: "q99", score: 2, gewicht: 1.0 },
      { vraagId: "unknown", score: 2, gewicht: 1.0 },
    ]

    const result = berekenDeelgebieden(antwoorden)
    result.forEach((d) => {
      expect(d.score).toBe(0)
    })
  })

  it("bevat tip per deelgebied", () => {
    const antwoorden = [
      { vraagId: "q1", score: 1, gewicht: 1.5 },
    ]

    const result = berekenDeelgebieden(antwoorden)
    result.forEach((d) => {
      expect(d.tip).toBeTruthy()
      expect(typeof d.tip).toBe("string")
    })
  })

  it("bevat emoji per deelgebied", () => {
    const result = berekenDeelgebieden([])
    expect(result[0].emoji).toBe("⚡")
    expect(result[1].emoji).toBe("💛")
    expect(result[2].emoji).toBe("⏰")
  })

  it("geeft GEMIDDELD niveau bij middelmatige scores", () => {
    // Energie: score 50% → GEMIDDELD
    const antwoorden = [
      { vraagId: "q1", score: 1, gewicht: 1.5 }, // 1 * 1.5 = 1.5
      { vraagId: "q2", score: 1, gewicht: 1.0 }, // 1 * 1.0 = 1.0
      { vraagId: "q3", score: 1, gewicht: 1.0 }, // 1 * 1.0 = 1.0
      // totaal: 3.5, max: 7.0, percentage: 50% → GEMIDDELD
    ]

    const result = berekenDeelgebieden(antwoorden)
    const energie = result.find((d) => d.naam === "Jouw energie")!
    expect(energie.niveau).toBe("GEMIDDELD")
  })
})
