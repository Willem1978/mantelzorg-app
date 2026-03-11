import { describe, it, expect } from "vitest"
import { buddyMatchSchema } from "../validations"

describe("buddyMatchSchema", () => {
  it("accepteert leeg object (defaults)", () => {
    const result = buddyMatchSchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.zorgtaken).toEqual([])
      expect(result.data.maxAfstandKm).toBe(25)
    }
  })

  it("accepteert volledige match data", () => {
    const result = buddyMatchSchema.safeParse({
      zorgtaken: ["boodschappen", "vervoer"],
      latitude: 52.0116,
      longitude: 6.2854,
      beschikbaarheid: "vast",
      maxAfstandKm: 10,
    })
    expect(result.success).toBe(true)
  })

  it("weigert maxAfstandKm > 100", () => {
    expect(buddyMatchSchema.safeParse({ maxAfstandKm: 101 }).success).toBe(false)
  })

  it("weigert maxAfstandKm < 1", () => {
    expect(buddyMatchSchema.safeParse({ maxAfstandKm: 0 }).success).toBe(false)
  })

  it("accepteert maxAfstandKm = 1", () => {
    expect(buddyMatchSchema.safeParse({ maxAfstandKm: 1 }).success).toBe(true)
  })
})
