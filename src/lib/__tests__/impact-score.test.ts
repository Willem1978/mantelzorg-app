import { describe, it, expect } from "vitest"
import { berekenImpactScore } from "../dashboard/impact-score"

describe("berekenImpactScore", () => {
  it("berekent impact als uren × zwaarte", () => {
    const result = berekenImpactScore([
      { naam: "Huishouden", uren: 10, moeilijkheid: "MOEILIJK" },
    ])

    expect(result.perTaak[0].impact).toBe(30) // 10 * 3
    expect(result.totaal).toBe(30)
    expect(result.totaalUren).toBe(10)
  })

  it("sorteert taken op impact (hoogste eerst)", () => {
    const result = berekenImpactScore([
      { naam: "Administratie", uren: 2, moeilijkheid: "MAKKELIJK" },
      { naam: "Vervoer", uren: 10, moeilijkheid: "ZEER_MOEILIJK" },
      { naam: "Huishouden", uren: 5, moeilijkheid: "MOEILIJK" },
    ])

    expect(result.perTaak[0].naam).toBe("Vervoer")
    expect(result.perTaak[0].impact).toBe(40) // 10 * 4
    expect(result.perTaak[1].naam).toBe("Huishouden")
    expect(result.perTaak[1].impact).toBe(15) // 5 * 3
    expect(result.perTaak[2].naam).toBe("Administratie")
    expect(result.perTaak[2].impact).toBe(2) // 2 * 1
  })

  it("geeft LAAG niveau bij totaal < 20", () => {
    const result = berekenImpactScore([
      { naam: "Boodschappen", uren: 3, moeilijkheid: "MAKKELIJK" },
    ])

    expect(result.niveau).toBe("LAAG")
    expect(result.totaal).toBe(3)
  })

  it("geeft GEMIDDELD niveau bij totaal 20-49", () => {
    const result = berekenImpactScore([
      { naam: "Huishouden", uren: 10, moeilijkheid: "MOEILIJK" },
    ])

    expect(result.niveau).toBe("GEMIDDELD")
    expect(result.totaal).toBe(30)
  })

  it("geeft HOOG niveau bij totaal >= 50", () => {
    const result = berekenImpactScore([
      { naam: "Verzorging", uren: 20, moeilijkheid: "MOEILIJK" },
    ])

    expect(result.niveau).toBe("HOOG")
    expect(result.totaal).toBe(60)
  })

  it("behandelt WhatsApp waarden (ja/soms/nee)", () => {
    const result = berekenImpactScore([
      { naam: "Taak1", uren: 10, moeilijkheid: "ja" },
      { naam: "Taak2", uren: 10, moeilijkheid: "soms" },
      { naam: "Taak3", uren: 10, moeilijkheid: "nee" },
    ])

    expect(result.perTaak.find((t) => t.naam === "Taak1")!.zwaarte).toBe(3)
    expect(result.perTaak.find((t) => t.naam === "Taak2")!.zwaarte).toBe(2)
    expect(result.perTaak.find((t) => t.naam === "Taak3")!.zwaarte).toBe(1)
  })

  it("behandelt null uren als 0", () => {
    const result = berekenImpactScore([
      { naam: "Taak", uren: null, moeilijkheid: "MOEILIJK" },
    ])

    expect(result.perTaak[0].uren).toBe(0)
    expect(result.perTaak[0].impact).toBe(0)
  })

  it("behandelt onbekende moeilijkheid als factor 1", () => {
    const result = berekenImpactScore([
      { naam: "Taak", uren: 5, moeilijkheid: "ONBEKEND" },
    ])

    expect(result.perTaak[0].zwaarte).toBe(1)
    expect(result.perTaak[0].impact).toBe(5)
  })

  it("behandelt null moeilijkheid als factor 1", () => {
    const result = berekenImpactScore([
      { naam: "Taak", uren: 5, moeilijkheid: null },
    ])

    expect(result.perTaak[0].zwaarte).toBe(1)
  })

  it("retourneert lege resultaten voor lege input", () => {
    const result = berekenImpactScore([])

    expect(result.totaal).toBe(0)
    expect(result.totaalUren).toBe(0)
    expect(result.perTaak).toHaveLength(0)
    expect(result.niveau).toBe("LAAG")
  })

  it("sommeert totaal uren over alle taken", () => {
    const result = berekenImpactScore([
      { naam: "Taak1", uren: 5, moeilijkheid: "GEMIDDELD" },
      { naam: "Taak2", uren: 10, moeilijkheid: "GEMIDDELD" },
      { naam: "Taak3", uren: 3, moeilijkheid: "MAKKELIJK" },
    ])

    expect(result.totaalUren).toBe(18)
  })
})
