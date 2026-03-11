import { describe, it, expect } from "vitest"
import { intakeSchema } from "../validations"

describe("intakeSchema", () => {
  it("accepteert geldige antwoorden", () => {
    const result = intakeSchema.safeParse({
      answers: {
        q1: "3",
        q2: "4",
        q3: "2",
      },
    })
    expect(result.success).toBe(true)
  })

  it("accepteert lege antwoorden", () => {
    const result = intakeSchema.safeParse({ answers: {} })
    expect(result.success).toBe(true)
  })

  it("weigert zonder answers veld", () => {
    expect(intakeSchema.safeParse({}).success).toBe(false)
  })

  it("weigert als answers geen object is", () => {
    expect(intakeSchema.safeParse({ answers: "invalid" }).success).toBe(false)
  })

  it("weigert als answers waarden geen strings zijn", () => {
    expect(intakeSchema.safeParse({ answers: { q1: 3 } }).success).toBe(false)
  })
})
