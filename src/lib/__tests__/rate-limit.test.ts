import { describe, it, expect, beforeEach } from "vitest"
import { checkRateLimit } from "../rate-limit"

describe("checkRateLimit", () => {
  // Rate limiter gebruikt globale store, tests gebruiken unieke IPs
  let testIp = ""

  beforeEach(() => {
    testIp = `test-${Date.now()}-${Math.random()}`
  })

  it("laat de eerste request toe", () => {
    const result = checkRateLimit(testIp, "login")
    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(4) // 5 max - 1
  })

  it("blokkeert na het maximum aantal requests", () => {
    const config = { maxRequests: 3, windowSeconds: 60 }

    checkRateLimit(testIp, "test-endpoint", config)
    checkRateLimit(testIp, "test-endpoint", config)
    checkRateLimit(testIp, "test-endpoint", config)

    const result = checkRateLimit(testIp, "test-endpoint", config)
    expect(result.allowed).toBe(false)
    expect(result.remaining).toBe(0)
  })

  it("telt remaining correct af", () => {
    const config = { maxRequests: 5, windowSeconds: 60 }

    const r1 = checkRateLimit(testIp, "test-count", config)
    expect(r1.remaining).toBe(4)

    const r2 = checkRateLimit(testIp, "test-count", config)
    expect(r2.remaining).toBe(3)

    const r3 = checkRateLimit(testIp, "test-count", config)
    expect(r3.remaining).toBe(2)
  })

  it("scheidt endpoints van elkaar", () => {
    const config = { maxRequests: 1, windowSeconds: 60 }

    checkRateLimit(testIp, "endpoint-a", config)
    const resultA = checkRateLimit(testIp, "endpoint-a", config)
    expect(resultA.allowed).toBe(false)

    // Ander endpoint moet nog werken
    const resultB = checkRateLimit(testIp, "endpoint-b", config)
    expect(resultB.allowed).toBe(true)
  })

  it("scheidt IPs van elkaar", () => {
    const config = { maxRequests: 1, windowSeconds: 60 }

    checkRateLimit("ip-1", "shared-endpoint", config)
    const result1 = checkRateLimit("ip-1", "shared-endpoint", config)
    expect(result1.allowed).toBe(false)

    // Ander IP moet nog werken
    const result2 = checkRateLimit("ip-2", "shared-endpoint", config)
    expect(result2.allowed).toBe(true)
  })

  it("geeft resetIn in seconden terug", () => {
    const config = { maxRequests: 5, windowSeconds: 300 }
    const result = checkRateLimit(testIp, "test-reset", config)
    expect(result.resetIn).toBeGreaterThan(0)
    expect(result.resetIn).toBeLessThanOrEqual(300)
  })
})
