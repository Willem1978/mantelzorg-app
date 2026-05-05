import { describe, it, expect } from "vitest"
import {
  bepaalKant,
  bepaalGemeenteScope,
  gemeentenVoorScope,
  labelVoorScope,
} from "../hulp-categorisatie"

describe("bepaalKant", () => {
  it("herkent mantelzorger-categorieën", () => {
    expect(bepaalKant("Informatie en advies")).toBe("mantelzorger")
    expect(bepaalKant("Educatie")).toBe("mantelzorger")
    expect(bepaalKant("Emotionele steun")).toBe("mantelzorger")
    expect(bepaalKant("Vervangende mantelzorg")).toBe("mantelzorger")
  })

  it("herkent zorgvrager-taken", () => {
    expect(bepaalKant("Boodschappen")).toBe("zorgvrager-taak")
    expect(bepaalKant("Persoonlijke verzorging")).toBe("zorgvrager-taak")
    expect(bepaalKant("Huishoudelijke taken")).toBe("zorgvrager-taak")
    expect(bepaalKant("Vervoer")).toBe("zorgvrager-taak")
  })

  it("valt voor onbekende categorie terug op zorgvrager-taak", () => {
    expect(bepaalKant("Een onbekende categorie")).toBe("zorgvrager-taak")
    expect(bepaalKant(null)).toBe("zorgvrager-taak")
  })
})

describe("bepaalGemeenteScope", () => {
  it("zorgvrager-categorieën zijn altijd zorgvrager-only", () => {
    expect(bepaalGemeenteScope("Boodschappen")).toBe("zorgvrager-only")
    expect(bepaalGemeenteScope("Persoonlijke verzorging", "Iets random")).toBe(
      "zorgvrager-only",
    )
  })

  it("lotgenoten-keywords markeren als mantelzorger-only", () => {
    expect(
      bepaalGemeenteScope("Emotionele steun", "Lotgenotengroep dementie"),
    ).toBe("mantelzorger-only")
    expect(
      bepaalGemeenteScope("Emotionele steun", "Alzheimer Café Arnhem"),
    ).toBe("mantelzorger-only")
    expect(
      bepaalGemeenteScope("Persoonlijke begeleiding", "Praatcafé voor mantelzorgers"),
    ).toBe("mantelzorger-only")
    expect(bepaalGemeenteScope("Praktische hulp", "Wandelgroep")).toBe(
      "mantelzorger-only",
    )
  })

  it("overige mantelzorger-hulp valt op 'beide'", () => {
    expect(bepaalGemeenteScope("Informatie en advies", "Mantelzorgmakelaar Zutphen")).toBe(
      "beide",
    )
    expect(bepaalGemeenteScope("Vervangende mantelzorg", "De Logeerwoning")).toBe(
      "beide",
    )
  })

  it("expliciete DB-waarde lokaalGebonden override't de heuristiek", () => {
    expect(
      bepaalGemeenteScope("Informatie en advies", "Mantelzorgmakelaar Zutphen", null, {
        lokaalGebonden: true,
      }),
    ).toBe("mantelzorger-only")
    expect(
      bepaalGemeenteScope("Emotionele steun", "Lotgenotengroep dementie", null, {
        lokaalGebonden: false,
      }),
    ).toBe("beide")
  })
})

describe("gemeentenVoorScope", () => {
  it("zorgvrager-only geeft alleen zorgvrager-stad", () => {
    expect(gemeentenVoorScope("zorgvrager-only", "Arnhem", "Zutphen")).toEqual(["Zutphen"])
  })

  it("mantelzorger-only geeft alleen mantelzorger-stad", () => {
    expect(gemeentenVoorScope("mantelzorger-only", "Arnhem", "Zutphen")).toEqual(["Arnhem"])
  })

  it("beide geeft beide steden", () => {
    expect(gemeentenVoorScope("beide", "Arnhem", "Zutphen")).toEqual(["Arnhem", "Zutphen"])
  })

  it("dedupliceert als beide gemeenten gelijk zijn", () => {
    expect(gemeentenVoorScope("beide", "Arnhem", "Arnhem")).toEqual(["Arnhem"])
  })

  it("filtert null waarden uit", () => {
    expect(gemeentenVoorScope("beide", null, "Zutphen")).toEqual(["Zutphen"])
    expect(gemeentenVoorScope("beide", "Arnhem", null)).toEqual(["Arnhem"])
    expect(gemeentenVoorScope("beide", null, null)).toEqual([])
  })
})

describe("labelVoorScope", () => {
  it("levert leesbare labels per scope", () => {
    expect(labelVoorScope("mantelzorger-only", "Arnhem", "Zutphen")).toContain("Arnhem")
    expect(labelVoorScope("zorgvrager-only", "Arnhem", "Zutphen")).toContain("Zutphen")
    expect(labelVoorScope("beide", "Arnhem", "Zutphen")).toContain("Arnhem")
    expect(labelVoorScope("beide", "Arnhem", "Zutphen")).toContain("Zutphen")
  })
})
