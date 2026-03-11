import { describe, it, expect } from "vitest"
import { belastbaarheidstestSchema } from "../validations"

describe("belastbaarheidstestSchema", () => {
  const geldig = {
    registratie: {
      voornaam: "Jan",
    },
    antwoorden: {
      q1: "ja",
      q2: "soms",
      q3: "nee",
    },
  }

  it("accepteert minimale test data", () => {
    expect(belastbaarheidstestSchema.safeParse(geldig).success).toBe(true)
  })

  it("accepteert volledige registratie", () => {
    const result = belastbaarheidstestSchema.safeParse({
      registratie: {
        voornaam: "Jan",
        email: "jan@example.com",
        postcode: "7200 AA",
        huisnummer: "1",
        straat: "Kerkstraat",
        woonplaats: "Zutphen",
        gemeente: "Zutphen",
      },
      antwoorden: { q1: "ja" },
    })
    expect(result.success).toBe(true)
  })

  it("weigert zonder voornaam", () => {
    expect(belastbaarheidstestSchema.safeParse({
      registratie: { voornaam: "" },
      antwoorden: { q1: "ja" },
    }).success).toBe(false)
  })

  it("weigert zonder antwoorden", () => {
    expect(belastbaarheidstestSchema.safeParse({
      registratie: { voornaam: "Jan" },
    }).success).toBe(false)
  })

  it("weigert ongeldige antwoord waarde", () => {
    expect(belastbaarheidstestSchema.safeParse({
      registratie: { voornaam: "Jan" },
      antwoorden: { q1: "misschien" },
    }).success).toBe(false)
  })

  it("accepteert lege taken", () => {
    const result = belastbaarheidstestSchema.safeParse({
      ...geldig,
      taken: {},
    })
    expect(result.success).toBe(true)
  })

  it("accepteert taken met details", () => {
    const result = belastbaarheidstestSchema.safeParse({
      ...geldig,
      taken: {
        t1: { isGeselecteerd: true, uren: "5-10", belasting: "gemiddeld" },
        t2: { isGeselecteerd: false },
      },
    })
    expect(result.success).toBe(true)
  })

  it("weigert ongeldig email formaat", () => {
    expect(belastbaarheidstestSchema.safeParse({
      registratie: { voornaam: "Jan", email: "geen-email" },
      antwoorden: { q1: "ja" },
    }).success).toBe(false)
  })

  it("accepteert leeg email (optioneel)", () => {
    expect(belastbaarheidstestSchema.safeParse({
      registratie: { voornaam: "Jan", email: "" },
      antwoorden: { q1: "ja" },
    }).success).toBe(true)
  })
})
