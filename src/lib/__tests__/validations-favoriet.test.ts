import { describe, it, expect } from "vitest"
import { favorietSchema } from "../validations"

describe("favorietSchema", () => {
  it("accepteert minimale favoriet", () => {
    const result = favorietSchema.safeParse({
      type: "HULPBRON",
      itemId: "abc123",
    })
    expect(result.success).toBe(true)
  })

  it("accepteert volledig favoriet", () => {
    const result = favorietSchema.safeParse({
      type: "ARTIKEL",
      itemId: "art-1",
      titel: "Handige tips",
      beschrijving: "Tips voor mantelzorgers",
      categorie: "praktische-tips",
      url: "https://example.com",
      telefoon: "030-1234567",
      icon: "📋",
    })
    expect(result.success).toBe(true)
  })

  it("weigert leeg type", () => {
    expect(favorietSchema.safeParse({ type: "", itemId: "abc" }).success).toBe(false)
  })

  it("weigert leeg itemId", () => {
    expect(favorietSchema.safeParse({ type: "HULPBRON", itemId: "" }).success).toBe(false)
  })

  it("weigert te lange titel", () => {
    expect(favorietSchema.safeParse({
      type: "HULPBRON",
      itemId: "abc",
      titel: "a".repeat(201),
    }).success).toBe(false)
  })

  it("weigert te lange beschrijving", () => {
    expect(favorietSchema.safeParse({
      type: "HULPBRON",
      itemId: "abc",
      beschrijving: "a".repeat(501),
    }).success).toBe(false)
  })
})
