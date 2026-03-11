import { describe, it, expect } from "vitest"
import { checkInSchema } from "../validations"

describe("checkInSchema", () => {
  it("accepteert geldige score", () => {
    expect(checkInSchema.safeParse({ score: 3 }).success).toBe(true)
  })

  it("accepteert score met notitie", () => {
    const result = checkInSchema.safeParse({
      score: 4,
      notitie: "Het gaat beter deze maand",
    })
    expect(result.success).toBe(true)
  })

  it("accepteert minimale score (1)", () => {
    expect(checkInSchema.safeParse({ score: 1 }).success).toBe(true)
  })

  it("accepteert maximale score (5)", () => {
    expect(checkInSchema.safeParse({ score: 5 }).success).toBe(true)
  })

  it("weigert score 0", () => {
    expect(checkInSchema.safeParse({ score: 0 }).success).toBe(false)
  })

  it("weigert score 6", () => {
    expect(checkInSchema.safeParse({ score: 6 }).success).toBe(false)
  })

  it("weigert decimale score", () => {
    expect(checkInSchema.safeParse({ score: 3.5 }).success).toBe(false)
  })

  it("weigert zonder score", () => {
    expect(checkInSchema.safeParse({}).success).toBe(false)
  })

  it("weigert string als score", () => {
    expect(checkInSchema.safeParse({ score: "3" }).success).toBe(false)
  })
})
