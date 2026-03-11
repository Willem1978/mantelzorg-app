import { describe, it, expect } from "vitest"
import { passwordSchema } from "../validations"

describe("passwordSchema", () => {
  it("accepteert geldig wachtwoord", () => {
    expect(passwordSchema.safeParse("Welkom1!").success).toBe(true)
  })

  it("weigert te kort wachtwoord", () => {
    expect(passwordSchema.safeParse("Aa1!").success).toBe(false)
  })

  it("weigert zonder hoofdletter", () => {
    expect(passwordSchema.safeParse("wachtwoord1!").success).toBe(false)
  })

  it("weigert zonder cijfer", () => {
    expect(passwordSchema.safeParse("Wachtwoord!").success).toBe(false)
  })

  it("weigert zonder speciaal teken", () => {
    expect(passwordSchema.safeParse("Wachtwoord1").success).toBe(false)
  })

  it("accepteert lang wachtwoord met alle eisen", () => {
    expect(passwordSchema.safeParse("MijnSuperVeiligWachtwoord123!@#").success).toBe(true)
  })

  it("weigert lege string", () => {
    expect(passwordSchema.safeParse("").success).toBe(false)
  })
})
