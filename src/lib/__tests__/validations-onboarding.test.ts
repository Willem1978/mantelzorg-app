import { describe, it, expect } from "vitest"
import { onboardingProfielSchema, voorkeurenSchema } from "../validations"

describe("onboardingProfielSchema", () => {
  it("accepteert leeg object", () => {
    expect(onboardingProfielSchema.safeParse({}).success).toBe(true)
  })

  it("accepteert volledig profiel", () => {
    const result = onboardingProfielSchema.safeParse({
      gemeente: "Zutphen",
      careRecipient: "partner",
      careHoursPerWeek: "10-20",
      careSinceDuration: "1-3",
    })
    expect(result.success).toBe(true)
  })

  it("accepteert gedeeltelijk profiel", () => {
    expect(onboardingProfielSchema.safeParse({
      gemeente: "Amsterdam",
    }).success).toBe(true)
  })
})

describe("voorkeurenSchema", () => {
  it("accepteert geldige voorkeuren", () => {
    const result = voorkeurenSchema.safeParse({
      voorkeuren: [
        { type: "HULP_MANTELZORGER", slug: "ondersteuning" },
        { type: "HULP_ZORGVRAGER", slug: "maaltijden" },
      ],
    })
    expect(result.success).toBe(true)
  })

  it("accepteert lege voorkeuren array", () => {
    expect(voorkeurenSchema.safeParse({ voorkeuren: [] }).success).toBe(true)
  })

  it("accepteert voorkeuren met aandoening", () => {
    const result = voorkeurenSchema.safeParse({
      voorkeuren: [{ type: "HULP_MANTELZORGER", slug: "steun" }],
      aandoening: "dementie",
    })
    expect(result.success).toBe(true)
  })

  it("weigert zonder voorkeuren veld", () => {
    expect(voorkeurenSchema.safeParse({}).success).toBe(false)
  })

  it("weigert voorkeur zonder type", () => {
    expect(voorkeurenSchema.safeParse({
      voorkeuren: [{ slug: "test" }],
    }).success).toBe(false)
  })
})
