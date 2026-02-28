import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

/**
 * Tests voor de email module.
 * We testen in console-mode (geen SMTP) zodat we geen externe deps nodig hebben.
 * De sendEmail functie logt naar console als SMTP niet geconfigureerd is.
 */

const originalEnv = { ...process.env }

beforeEach(() => {
  // Verwijder SMTP configuratie zodat emails naar console gaan
  delete process.env.SMTP_HOST
  delete process.env.SMTP_USER
  delete process.env.SMTP_PASSWORD
  vi.spyOn(console, "log").mockImplementation(() => {})
})

afterEach(() => {
  process.env = { ...originalEnv }
  vi.restoreAllMocks()
})

describe("sendBalanstestResultEmail", () => {
  it("retourneert true voor LAAG niveau", async () => {
    const { sendBalanstestResultEmail } = await import("@/lib/email")
    const result = await sendBalanstestResultEmail(
      "test@example.com",
      "Jan",
      5,
      "LAAG",
      null,
    )
    expect(result).toBe(true)
  })

  it("retourneert true voor HOOG niveau met gemeente advies", async () => {
    const { sendBalanstestResultEmail } = await import("@/lib/email")
    const result = await sendBalanstestResultEmail(
      "test@example.com",
      "Petra",
      18,
      "HOOG",
      "Neem contact op met het WMO loket.",
    )
    expect(result).toBe(true)
  })

  it("retourneert true voor GEMIDDELD zonder advies", async () => {
    const { sendBalanstestResultEmail } = await import("@/lib/email")
    const result = await sendBalanstestResultEmail(
      "test@example.com",
      "Maria",
      10,
      "GEMIDDELD",
      undefined,
    )
    expect(result).toBe(true)
  })
})

describe("sendCheckInReminderEmail", () => {
  it("retourneert true", async () => {
    const { sendCheckInReminderEmail } = await import("@/lib/email")
    const result = await sendCheckInReminderEmail("test@example.com", "Kees")
    expect(result).toBe(true)
  })
})

describe("sendAlarmNotificationEmail", () => {
  it("retourneert true voor CRITICAL urgentie", async () => {
    const { sendAlarmNotificationEmail } = await import("@/lib/email")
    const result = await sendAlarmNotificationEmail(
      "wmo@amsterdam.nl",
      "Amsterdam",
      "KRITIEKE_COMBINATIE",
      "CRITICAL",
      "Slaapproblemen, fysieke klachten en emotionele verandering",
    )
    expect(result).toBe(true)
  })

  it("retourneert true voor MEDIUM urgentie", async () => {
    const { sendAlarmNotificationEmail } = await import("@/lib/email")
    const result = await sendAlarmNotificationEmail(
      "wmo@utrecht.nl",
      "Utrecht",
      "SOCIAAL_ISOLEMENT",
      "MEDIUM",
      "Komt niet meer toe aan leuke dingen",
    )
    expect(result).toBe(true)
  })
})

describe("sendWelcomeEmail", () => {
  it("retourneert true met naam", async () => {
    const { sendWelcomeEmail } = await import("@/lib/email")
    const result = await sendWelcomeEmail("test@example.com", "Anna")
    expect(result).toBe(true)
  })

  it("retourneert true zonder naam", async () => {
    const { sendWelcomeEmail } = await import("@/lib/email")
    const result = await sendWelcomeEmail("test@example.com")
    expect(result).toBe(true)
  })
})

describe("sendVerificationEmail", () => {
  it("retourneert true", async () => {
    const { sendVerificationEmail } = await import("@/lib/email")
    const result = await sendVerificationEmail("test@example.com", "token123")
    expect(result).toBe(true)
  })
})

describe("sendPasswordResetEmail", () => {
  it("retourneert true", async () => {
    const { sendPasswordResetEmail } = await import("@/lib/email")
    const result = await sendPasswordResetEmail("test@example.com", "reset-token")
    expect(result).toBe(true)
  })
})
