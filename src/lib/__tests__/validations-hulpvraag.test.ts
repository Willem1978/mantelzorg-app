import { describe, it, expect } from "vitest"
import { hulpvraagSchema, hulpvraagReactieSchema } from "../validations"

describe("hulpvraagSchema", () => {
  it("accepteert geldige hulpvraag", () => {
    const result = hulpvraagSchema.safeParse({
      titel: "Hulp bij boodschappen",
      categorie: "PRACTICAL_HELP",
      beschrijving: "Ik zoek iemand die kan helpen met boodschappen",
    })
    expect(result.success).toBe(true)
  })

  it("weigert lege titel", () => {
    const result = hulpvraagSchema.safeParse({
      titel: "",
      categorie: "PRACTICAL_HELP",
      beschrijving: "Beschrijving",
    })
    expect(result.success).toBe(false)
  })

  it("weigert lege categorie", () => {
    const result = hulpvraagSchema.safeParse({
      titel: "Titel",
      categorie: "",
      beschrijving: "Beschrijving",
    })
    expect(result.success).toBe(false)
  })

  it("weigert te lange titel (> 200 tekens)", () => {
    const result = hulpvraagSchema.safeParse({
      titel: "a".repeat(201),
      categorie: "OTHER",
      beschrijving: "Beschrijving",
    })
    expect(result.success).toBe(false)
  })

  it("weigert te lange beschrijving (> 2000 tekens)", () => {
    const result = hulpvraagSchema.safeParse({
      titel: "Titel",
      categorie: "OTHER",
      beschrijving: "a".repeat(2001),
    })
    expect(result.success).toBe(false)
  })

  it("accepteert optionele datum en tijdstip", () => {
    const result = hulpvraagSchema.safeParse({
      titel: "Titel",
      categorie: "OTHER",
      beschrijving: "Beschrijving",
      datum: "2025-01-15",
      tijdstip: "14:00",
      isFlexibel: true,
    })
    expect(result.success).toBe(true)
  })
})

describe("hulpvraagReactieSchema", () => {
  it("accepteert geldig bericht", () => {
    expect(hulpvraagReactieSchema.safeParse({ bericht: "Ik wil graag helpen!" }).success).toBe(true)
  })

  it("weigert leeg bericht", () => {
    expect(hulpvraagReactieSchema.safeParse({ bericht: "" }).success).toBe(false)
  })

  it("weigert te lang bericht (> 2000 tekens)", () => {
    expect(hulpvraagReactieSchema.safeParse({ bericht: "a".repeat(2001) }).success).toBe(false)
  })
})
