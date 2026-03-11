import { describe, it, expect } from "vitest"
import { calendarEventSchema } from "../validations"

describe("calendarEventSchema", () => {
  const geldig = {
    title: "Doktersbezoek",
    startTime: "2025-01-15T10:00:00Z",
    endTime: "2025-01-15T11:00:00Z",
  }

  it("accepteert minimale event data", () => {
    expect(calendarEventSchema.safeParse(geldig).success).toBe(true)
  })

  it("accepteert volledig event", () => {
    const result = calendarEventSchema.safeParse({
      ...geldig,
      description: "Controle bij de huisarts",
      location: "Huisartspraktijk Centrum",
      isAllDay: false,
      eventType: "MEDICAL",
      reminderMinutes: 30,
      color: "#ff0000",
    })
    expect(result.success).toBe(true)
  })

  it("weigert lege titel", () => {
    expect(calendarEventSchema.safeParse({ ...geldig, title: "" }).success).toBe(false)
  })

  it("weigert te lange titel", () => {
    expect(calendarEventSchema.safeParse({ ...geldig, title: "a".repeat(201) }).success).toBe(false)
  })

  it("weigert lege startTime", () => {
    expect(calendarEventSchema.safeParse({ ...geldig, startTime: "" }).success).toBe(false)
  })

  it("weigert lege endTime", () => {
    expect(calendarEventSchema.safeParse({ ...geldig, endTime: "" }).success).toBe(false)
  })

  it("weigert negatieve reminderMinutes", () => {
    expect(calendarEventSchema.safeParse({ ...geldig, reminderMinutes: -5 }).success).toBe(false)
  })

  it("weigert te lange beschrijving", () => {
    expect(calendarEventSchema.safeParse({ ...geldig, description: "a".repeat(2001) }).success).toBe(false)
  })
})
