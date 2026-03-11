import { describe, it, expect } from "vitest"
import { hulpbronSchema } from "../validations"

describe("hulpbronSchema", () => {
  it("accepteert minimale hulpbron", () => {
    const result = hulpbronSchema.safeParse({
      naam: "Thuiszorg Midden-Nederland",
      categorie: "thuiszorg",
    })
    expect(result.success).toBe(true)
  })

  it("accepteert volledige hulpbron", () => {
    const result = hulpbronSchema.safeParse({
      naam: "Thuiszorg Midden-Nederland",
      beschrijving: "Hulp aan huis",
      categorie: "thuiszorg",
      telefoon: "030-1234567",
      email: "info@thuiszorg.nl",
      website: "https://thuiszorg.nl",
      adres: "Hoofdstraat 1, Utrecht",
      gemeente: "Utrecht",
      isActief: true,
    })
    expect(result.success).toBe(true)
  })

  it("weigert lege naam", () => {
    expect(hulpbronSchema.safeParse({
      naam: "",
      categorie: "thuiszorg",
    }).success).toBe(false)
  })

  it("weigert lege categorie", () => {
    expect(hulpbronSchema.safeParse({
      naam: "Test",
      categorie: "",
    }).success).toBe(false)
  })

  it("weigert ongeldig email", () => {
    expect(hulpbronSchema.safeParse({
      naam: "Test",
      categorie: "thuiszorg",
      email: "geen-email",
    }).success).toBe(false)
  })

  it("weigert ongeldige website URL", () => {
    expect(hulpbronSchema.safeParse({
      naam: "Test",
      categorie: "thuiszorg",
      website: "geen-url",
    }).success).toBe(false)
  })

  it("accepteert lege email string", () => {
    expect(hulpbronSchema.safeParse({
      naam: "Test",
      categorie: "thuiszorg",
      email: "",
    }).success).toBe(true)
  })
})
