import { describe, it, expect } from "vitest"
import { loginSchema, registerSchema, forgotPasswordSchema, resetPasswordSchema, validateBody } from "../validations"

describe("loginSchema", () => {
  it("accepteert geldig email en wachtwoord", () => {
    const result = loginSchema.safeParse({
      email: "test@example.com",
      password: "wachtwoord123",
    })
    expect(result.success).toBe(true)
  })

  it("weigert leeg email", () => {
    const result = loginSchema.safeParse({
      email: "",
      password: "wachtwoord123",
    })
    expect(result.success).toBe(false)
  })

  it("weigert ongeldig email formaat", () => {
    const result = loginSchema.safeParse({
      email: "geen-email",
      password: "wachtwoord123",
    })
    expect(result.success).toBe(false)
  })

  it("weigert leeg wachtwoord", () => {
    const result = loginSchema.safeParse({
      email: "test@example.com",
      password: "",
    })
    expect(result.success).toBe(false)
  })
})

describe("registerSchema", () => {
  const geldige_data = {
    email: "test@example.com",
    password: "wachtwoord123",
    municipality: {
      code: "0301",
      name: "Zutphen",
      provinceCode: "25",
      provinceName: "Gelderland",
    },
    privacyConsent: true as const,
    dataProcessingConsent: true as const,
  }

  it("accepteert geldige registratiedata", () => {
    const result = registerSchema.safeParse(geldige_data)
    expect(result.success).toBe(true)
  })

  it("weigert te kort wachtwoord", () => {
    const result = registerSchema.safeParse({
      ...geldige_data,
      password: "kort",
    })
    expect(result.success).toBe(false)
  })

  it("weigert zonder privacyConsent", () => {
    const result = registerSchema.safeParse({
      ...geldige_data,
      privacyConsent: false,
    })
    expect(result.success).toBe(false)
  })

  it("weigert zonder gemeente", () => {
    const result = registerSchema.safeParse({
      ...geldige_data,
      municipality: undefined,
    })
    expect(result.success).toBe(false)
  })

  it("accepteert optioneel telefoonnummer", () => {
    const result = registerSchema.safeParse({
      ...geldige_data,
      phoneNumber: "0612345678",
    })
    expect(result.success).toBe(true)
  })
})

describe("forgotPasswordSchema", () => {
  it("accepteert geldig email", () => {
    const result = forgotPasswordSchema.safeParse({ email: "test@example.com" })
    expect(result.success).toBe(true)
  })

  it("weigert leeg email", () => {
    const result = forgotPasswordSchema.safeParse({ email: "" })
    expect(result.success).toBe(false)
  })
})

describe("resetPasswordSchema", () => {
  it("accepteert geldig token en wachtwoord", () => {
    const result = resetPasswordSchema.safeParse({
      token: "abc123",
      password: "nieuwwachtwoord",
    })
    expect(result.success).toBe(true)
  })

  it("weigert te kort wachtwoord", () => {
    const result = resetPasswordSchema.safeParse({
      token: "abc123",
      password: "kort",
    })
    expect(result.success).toBe(false)
  })
})

describe("validateBody", () => {
  it("geeft success en data bij geldige input", () => {
    const result = validateBody({ email: "test@example.com", password: "wachtwoord" }, loginSchema)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.email).toBe("test@example.com")
    }
  })

  it("geeft error string bij ongeldige input", () => {
    const result = validateBody({ email: "", password: "" }, loginSchema)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(typeof result.error).toBe("string")
      expect(result.error.length).toBeGreaterThan(0)
    }
  })
})
