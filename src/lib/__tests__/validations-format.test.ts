import { describe, it, expect } from "vitest"
import { formatZodErrors, validateBody } from "../validations"
import { z } from "zod"

describe("formatZodErrors", () => {
  it("formatteert enkele fout", () => {
    const schema = z.object({ naam: z.string().min(1, "Naam is verplicht") })
    const result = schema.safeParse({ naam: "" })
    if (!result.success) {
      expect(formatZodErrors(result.error)).toBe("Naam is verplicht")
    }
  })

  it("formatteert meerdere fouten met punt-scheiding", () => {
    const schema = z.object({
      naam: z.string().min(1, "Naam is verplicht"),
      email: z.string().email("Ongeldig email"),
    })
    const result = schema.safeParse({ naam: "", email: "x" })
    if (!result.success) {
      const formatted = formatZodErrors(result.error)
      expect(formatted).toContain("Naam is verplicht")
      expect(formatted).toContain("Ongeldig email")
      expect(formatted).toContain(". ")
    }
  })
})

describe("validateBody (met custom schema)", () => {
  const testSchema = z.object({
    naam: z.string().min(1),
    leeftijd: z.number().int().min(0),
  })

  it("retourneert geparseerde data bij succes", () => {
    const result = validateBody({ naam: "Jan", leeftijd: 45 }, testSchema)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.naam).toBe("Jan")
      expect(result.data.leeftijd).toBe(45)
    }
  })

  it("retourneert error string bij fout", () => {
    const result = validateBody({ naam: "", leeftijd: -1 }, testSchema)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.length).toBeGreaterThan(0)
    }
  })

  it("handelt ontbrekende velden af", () => {
    const result = validateBody({}, testSchema)
    expect(result.success).toBe(false)
  })

  it("handelt extra velden af (stripped by Zod)", () => {
    const result = validateBody({ naam: "Jan", leeftijd: 30, extra: "test" }, testSchema)
    expect(result.success).toBe(true)
  })
})
