import { describe, it, expect } from "vitest"
import { beheerGebruikerUpdateSchema } from "../validations"

describe("beheerGebruikerUpdateSchema", () => {
  it("accepteert leeg object (alles optioneel)", () => {
    expect(beheerGebruikerUpdateSchema.safeParse({}).success).toBe(true)
  })

  it("accepteert role update", () => {
    expect(beheerGebruikerUpdateSchema.safeParse({ role: "ADMIN" }).success).toBe(true)
  })

  it("accepteert GEMEENTE_ADMIN role", () => {
    expect(beheerGebruikerUpdateSchema.safeParse({ role: "GEMEENTE_ADMIN" }).success).toBe(true)
  })

  it("weigert ongeldige role", () => {
    expect(beheerGebruikerUpdateSchema.safeParse({ role: "SUPERUSER" }).success).toBe(false)
  })

  it("accepteert name update", () => {
    expect(beheerGebruikerUpdateSchema.safeParse({ name: "Jan Jansen" }).success).toBe(true)
  })

  it("weigert te lange naam", () => {
    expect(beheerGebruikerUpdateSchema.safeParse({ name: "a".repeat(101) }).success).toBe(false)
  })

  it("accepteert isActive toggle", () => {
    expect(beheerGebruikerUpdateSchema.safeParse({ isActive: false }).success).toBe(true)
  })

  it("accepteert adminNotities", () => {
    expect(beheerGebruikerUpdateSchema.safeParse({
      adminNotities: "Let op: overbelast",
    }).success).toBe(true)
  })

  it("accepteert null adminNotities", () => {
    expect(beheerGebruikerUpdateSchema.safeParse({
      adminNotities: null,
    }).success).toBe(true)
  })

  it("accepteert geldig resetPassword", () => {
    expect(beheerGebruikerUpdateSchema.safeParse({
      resetPassword: "NieuwWachtwoord1!",
    }).success).toBe(true)
  })

  it("weigert zwak resetPassword", () => {
    expect(beheerGebruikerUpdateSchema.safeParse({
      resetPassword: "zwak",
    }).success).toBe(false)
  })

  it("accepteert combinatie van updates", () => {
    expect(beheerGebruikerUpdateSchema.safeParse({
      name: "Nieuwe Naam",
      isActive: true,
      adminNotities: "Bijgewerkt",
    }).success).toBe(true)
  })
})
