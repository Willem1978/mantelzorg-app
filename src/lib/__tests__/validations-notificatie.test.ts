import { describe, it, expect } from "vitest"
import { notificatieSchema } from "../validations"

describe("notificatieSchema", () => {
  it("accepteert geldige notificatie", () => {
    const result = notificatieSchema.safeParse({
      type: "REMINDER",
      title: "Check-in herinnering",
      message: "Het is weer tijd voor je maandelijkse check-in!",
    })
    expect(result.success).toBe(true)
  })

  it("accepteert notificatie met link en schedule", () => {
    const result = notificatieSchema.safeParse({
      type: "INFO",
      title: "Nieuw artikel",
      message: "Er is een nieuw artikel beschikbaar",
      link: "/leren/zelfzorg",
      scheduledFor: "2025-02-01T10:00:00Z",
    })
    expect(result.success).toBe(true)
  })

  it("weigert leeg type", () => {
    expect(notificatieSchema.safeParse({
      type: "",
      title: "Titel",
      message: "Bericht",
    }).success).toBe(false)
  })

  it("weigert lege titel", () => {
    expect(notificatieSchema.safeParse({
      type: "INFO",
      title: "",
      message: "Bericht",
    }).success).toBe(false)
  })

  it("weigert te lange titel", () => {
    expect(notificatieSchema.safeParse({
      type: "INFO",
      title: "a".repeat(201),
      message: "Bericht",
    }).success).toBe(false)
  })

  it("weigert te lang bericht", () => {
    expect(notificatieSchema.safeParse({
      type: "INFO",
      title: "Titel",
      message: "a".repeat(2001),
    }).success).toBe(false)
  })
})
