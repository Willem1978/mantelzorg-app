import { describe, it, expect, vi, beforeEach } from "vitest"
import { cached, invalidateCache, invalidateCachePrefix, clearCache } from "@/lib/cache"

beforeEach(() => {
  clearCache()
})

describe("cached", () => {
  it("retourneert data van factory bij eerste aanroep", async () => {
    const factory = vi.fn().mockResolvedValue("hello")
    const result = await cached("test-key", 60, factory)
    expect(result).toBe("hello")
    expect(factory).toHaveBeenCalledTimes(1)
  })

  it("retourneert gecachte data bij tweede aanroep", async () => {
    const factory = vi.fn().mockResolvedValue("hello")
    await cached("test-key", 60, factory)
    const result = await cached("test-key", 60, factory)
    expect(result).toBe("hello")
    expect(factory).toHaveBeenCalledTimes(1) // Niet opnieuw aangeroepen
  })

  it("roept factory opnieuw aan na TTL verlopen", async () => {
    const factory = vi.fn()
      .mockResolvedValueOnce("first")
      .mockResolvedValueOnce("second")

    await cached("expire-key", 0, factory) // TTL = 0 seconden
    // Wacht even zodat de cache verlopen is
    await new Promise((r) => setTimeout(r, 10))
    const result = await cached("expire-key", 0, factory)
    expect(result).toBe("second")
    expect(factory).toHaveBeenCalledTimes(2)
  })

  it("onderscheidt verschillende keys", async () => {
    const factory1 = vi.fn().mockResolvedValue("data1")
    const factory2 = vi.fn().mockResolvedValue("data2")

    const r1 = await cached("key1", 60, factory1)
    const r2 = await cached("key2", 60, factory2)

    expect(r1).toBe("data1")
    expect(r2).toBe("data2")
  })
})

describe("invalidateCache", () => {
  it("verwijdert specifieke cache entry", async () => {
    const factory = vi.fn()
      .mockResolvedValueOnce("first")
      .mockResolvedValueOnce("second")

    await cached("del-key", 60, factory)
    invalidateCache("del-key")
    const result = await cached("del-key", 60, factory)
    expect(result).toBe("second")
    expect(factory).toHaveBeenCalledTimes(2)
  })

  it("doet niets voor niet-bestaande key", () => {
    expect(() => invalidateCache("nonexistent")).not.toThrow()
  })
})

describe("invalidateCachePrefix", () => {
  it("verwijdert entries met bepaald prefix", async () => {
    const factory = vi.fn().mockResolvedValue("data")

    await cached("user:1:profile", 60, factory)
    await cached("user:1:settings", 60, factory)
    await cached("gemeente:Amsterdam", 60, factory)

    invalidateCachePrefix("user:")

    // user entries zijn verwijderd, gemeente niet
    const factory2 = vi.fn().mockResolvedValue("new-data")
    await cached("user:1:profile", 60, factory2)
    expect(factory2).toHaveBeenCalledTimes(1) // Was verwijderd
  })
})

describe("clearCache", () => {
  it("verwijdert alle entries", async () => {
    const factory = vi.fn()
      .mockResolvedValueOnce("old")
      .mockResolvedValueOnce("new")

    await cached("clear-key", 60, factory)
    clearCache()
    const result = await cached("clear-key", 60, factory)
    expect(result).toBe("new")
  })
})
