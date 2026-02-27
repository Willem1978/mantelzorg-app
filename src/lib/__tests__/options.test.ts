import { describe, it, expect } from "vitest"
import {
  ZORGTAKEN,
  TAAK_NAAR_ONDERDEEL,
  TAAK_NAAM_VARIANTEN,
  zorgtaakById,
  zorgtaakByDbValue,
  normaliseerTaakNaam,
  getScoreLevel,
  HULP_VOOR_MANTELZORGER,
  HULP_BIJ_TAAK,
  BALANSTEST_VRAGEN,
  CHECKIN_FREQUENTIES,
} from "@/config/options"

describe("ZORGTAKEN", () => {
  it("bevat 10 zorgtaken", () => {
    expect(ZORGTAKEN).toHaveLength(10)
  })

  it("elke taak heeft id, naam, beschrijving en dbValue", () => {
    ZORGTAKEN.forEach((t) => {
      expect(t.id).toBeTruthy()
      expect(t.naam).toBeTruthy()
      expect(t.beschrijving).toBeTruthy()
      expect(t.dbValue).toBeTruthy()
    })
  })

  it("taak IDs zijn uniek", () => {
    const ids = ZORGTAKEN.map((t) => t.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it("dbValues zijn uniek", () => {
    const vals = ZORGTAKEN.map((t) => t.dbValue)
    expect(new Set(vals).size).toBe(vals.length)
  })
})

describe("TAAK_NAAR_ONDERDEEL", () => {
  it("bevat mapping voor alle taak IDs", () => {
    ZORGTAKEN.forEach((t) => {
      expect(TAAK_NAAR_ONDERDEEL[t.id]).toBe(t.dbValue)
    })
  })

  it("t6 mapt naar 'Vervoer' (niet naar iets anders)", () => {
    expect(TAAK_NAAR_ONDERDEEL["t6"]).toBe("Vervoer")
  })

  it("t1 mapt naar 'Persoonlijke verzorging'", () => {
    expect(TAAK_NAAR_ONDERDEEL["t1"]).toBe("Persoonlijke verzorging")
  })

  it("t5 mapt naar 'Administratie en aanvragen'", () => {
    expect(TAAK_NAAR_ONDERDEEL["t5"]).toBe("Administratie en aanvragen")
  })
})

describe("TAAK_NAAM_VARIANTEN", () => {
  it("bevat varianten voor bekende dbValues", () => {
    expect(TAAK_NAAM_VARIANTEN["Vervoer"]).toContain("Vervoer/begeleiding")
    expect(TAAK_NAAM_VARIANTEN["Huishoudelijke taken"]).toContain("Huishouden")
    expect(TAAK_NAAM_VARIANTEN["Administratie en aanvragen"]).toContain("Administratie")
  })

  it("alle keys corresponderen met dbValues uit ZORGTAKEN", () => {
    const dbValues = ZORGTAKEN.map((t) => t.dbValue)
    Object.keys(TAAK_NAAM_VARIANTEN).forEach((key) => {
      expect(dbValues).toContain(key)
    })
  })
})

describe("zorgtaakById", () => {
  it("vindt taak op ID", () => {
    expect(zorgtaakById("t1")?.naam).toBe("Persoonlijke verzorging")
    expect(zorgtaakById("t6")?.naam).toBe("Vervoer")
  })

  it("retourneert undefined voor onbekend ID", () => {
    expect(zorgtaakById("t99")).toBeUndefined()
  })
})

describe("zorgtaakByDbValue", () => {
  it("vindt taak op dbValue", () => {
    expect(zorgtaakByDbValue("Vervoer")?.id).toBe("t6")
    expect(zorgtaakByDbValue("Boodschappen")?.id).toBe("t4")
  })

  it("retourneert undefined voor onbekende dbValue", () => {
    expect(zorgtaakByDbValue("Onbekend")).toBeUndefined()
  })
})

describe("normaliseerTaakNaam", () => {
  it("retourneert dbValue voor directe match", () => {
    expect(normaliseerTaakNaam("Vervoer")).toBe("Vervoer")
    expect(normaliseerTaakNaam("Boodschappen")).toBe("Boodschappen")
  })

  it("normaliseert varianten naar dbValue", () => {
    expect(normaliseerTaakNaam("Huishouden")).toBe("Huishoudelijke taken")
    expect(normaliseerTaakNaam("Administratie")).toBe("Administratie en aanvragen")
    expect(normaliseerTaakNaam("Vervoer/begeleiding")).toBe("Vervoer")
  })

  it("normaliseert korte naam naar dbValue", () => {
    expect(normaliseerTaakNaam("Maaltijden")).toBe("Bereiden en/of nuttigen van maaltijden")
  })

  it("retourneert originele naam als geen match", () => {
    expect(normaliseerTaakNaam("Onbekende taak")).toBe("Onbekende taak")
  })
})

describe("getScoreLevel", () => {
  it("retourneert LAAG voor score < 7", () => {
    expect(getScoreLevel(0)).toBe("LAAG")
    expect(getScoreLevel(6)).toBe("LAAG")
  })

  it("retourneert GEMIDDELD voor score 7-12", () => {
    expect(getScoreLevel(7)).toBe("GEMIDDELD")
    expect(getScoreLevel(12)).toBe("GEMIDDELD")
  })

  it("retourneert HOOG voor score > 12", () => {
    expect(getScoreLevel(13)).toBe("HOOG")
    expect(getScoreLevel(24)).toBe("HOOG")
  })
})

describe("HULP categorieën", () => {
  it("HULP_VOOR_MANTELZORGER bevat 6 categorieën", () => {
    expect(HULP_VOOR_MANTELZORGER).toHaveLength(6)
  })

  it("HULP_BIJ_TAAK bevat evenveel items als ZORGTAKEN", () => {
    expect(HULP_BIJ_TAAK).toHaveLength(ZORGTAKEN.length)
  })

  it("elke hulp categorie heeft id, naam, emoji en dbValue", () => {
    HULP_VOOR_MANTELZORGER.forEach((h) => {
      expect(h.id).toBeTruthy()
      expect(h.naam).toBeTruthy()
      expect(h.emoji).toBeTruthy()
      expect(h.dbValue).toBeTruthy()
    })
  })
})

describe("BALANSTEST_VRAGEN", () => {
  it("bevat 12 vragen", () => {
    expect(BALANSTEST_VRAGEN).toHaveLength(12)
  })

  it("elke vraag heeft id, vraag en weegfactor", () => {
    BALANSTEST_VRAGEN.forEach((v) => {
      expect(v.id).toMatch(/^q\d+$/)
      expect(v.vraag).toBeTruthy()
      expect(v.weegfactor).toBeGreaterThan(0)
    })
  })
})

describe("CHECKIN_FREQUENTIES", () => {
  it("LAAG = maandelijks (30 dagen)", () => {
    expect(CHECKIN_FREQUENTIES.LAAG.dagen).toBe(30)
  })

  it("GEMIDDELD = 2x per maand (14 dagen)", () => {
    expect(CHECKIN_FREQUENTIES.GEMIDDELD.dagen).toBe(14)
  })

  it("HOOG = wekelijks (7 dagen)", () => {
    expect(CHECKIN_FREQUENTIES.HOOG.dagen).toBe(7)
  })
})
