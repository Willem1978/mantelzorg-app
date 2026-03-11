import { describe, it, expect } from "vitest"
import { gemeenteSchema, inviteSchema } from "../validations"

describe("gemeenteSchema", () => {
  it("accepteert minimale gemeente", () => {
    expect(gemeenteSchema.safeParse({ naam: "Zutphen" }).success).toBe(true)
  })

  it("accepteert volledige gemeente", () => {
    const result = gemeenteSchema.safeParse({
      naam: "Zutphen",
      code: "0301",
      isActief: true,
      contactEmail: "info@zutphen.nl",
      contactTelefoon: "0575-123456",
      websiteUrl: "https://zutphen.nl",
      wmoLoketUrl: "https://zutphen.nl/wmo",
      adviesLaag: "Het gaat goed met je!",
      adviesGemiddeld: "Let op je balans",
      adviesHoog: "Zoek hulp",
      mantelzorgSteunpunt: "https://steunpunt.nl",
      mantelzorgSteunpuntNaam: "Steunpunt Zutphen",
      respijtzorgUrl: "https://zutphen.nl/respijtzorg",
      dagopvangUrl: "https://zutphen.nl/dagopvang",
      notities: "Extra info",
    })
    expect(result.success).toBe(true)
  })

  it("weigert lege naam", () => {
    expect(gemeenteSchema.safeParse({ naam: "" }).success).toBe(false)
  })

  it("weigert ongeldig contactEmail", () => {
    expect(gemeenteSchema.safeParse({
      naam: "Test",
      contactEmail: "geen-email",
    }).success).toBe(false)
  })

  it("accepteert leeg contactEmail", () => {
    expect(gemeenteSchema.safeParse({
      naam: "Test",
      contactEmail: "",
    }).success).toBe(true)
  })
})

describe("inviteSchema", () => {
  it("accepteert geldige uitnodiging", () => {
    const result = inviteSchema.safeParse({
      token: "abc123def456",
      name: "Jan Jansen",
      password: "Welkom123!",
    })
    expect(result.success).toBe(true)
  })

  it("weigert leeg token", () => {
    expect(inviteSchema.safeParse({
      token: "",
      name: "Jan",
      password: "Welkom123!",
    }).success).toBe(false)
  })

  it("weigert lege naam", () => {
    expect(inviteSchema.safeParse({
      token: "abc123",
      name: "",
      password: "Welkom123!",
    }).success).toBe(false)
  })

  it("weigert zwak wachtwoord", () => {
    expect(inviteSchema.safeParse({
      token: "abc123",
      name: "Jan",
      password: "zwak",
    }).success).toBe(false)
  })
})
