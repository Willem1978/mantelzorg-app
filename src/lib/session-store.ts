/**
 * Abstracte session store voor WhatsApp conversaties.
 * Standaard: in-memory Map.
 * Met Redis configuratie (REDIS_URL env): Redis-backed store.
 *
 * Benodigde environment variabele voor Redis:
 * - REDIS_URL (bijv. redis://localhost:6379 of rediss://...@...upstash.io)
 *
 * Gebruik:
 *   const store = createSessionStore<MyType>("prefix")
 *   await store.set("key", data, 3600) // 1 uur TTL
 *   const data = await store.get("key")
 *   await store.delete("key")
 */

export interface SessionStore<T> {
  get(key: string): Promise<T | undefined>
  set(key: string, value: T, ttlSeconds?: number): Promise<void>
  delete(key: string): Promise<void>
  has(key: string): Promise<boolean>
}

// --- In-memory store (standaard) ---

class MemorySessionStore<T> implements SessionStore<T> {
  private store = new Map<string, { value: T; expiresAt: number | null }>()
  private prefix: string

  constructor(prefix: string) {
    this.prefix = prefix

    // Cleanup elke 5 minuten
    setInterval(() => {
      const now = Date.now()
      for (const [key, entry] of this.store) {
        if (entry.expiresAt && now > entry.expiresAt) {
          this.store.delete(key)
        }
      }
    }, 5 * 60 * 1000)
  }

  private key(k: string) {
    return `${this.prefix}:${k}`
  }

  async get(key: string): Promise<T | undefined> {
    const entry = this.store.get(this.key(key))
    if (!entry) return undefined
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.store.delete(this.key(key))
      return undefined
    }
    return entry.value
  }

  async set(key: string, value: T, ttlSeconds?: number): Promise<void> {
    this.store.set(this.key(key), {
      value,
      expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : null,
    })
  }

  async delete(key: string): Promise<void> {
    this.store.delete(this.key(key))
  }

  async has(key: string): Promise<boolean> {
    const entry = this.store.get(this.key(key))
    if (!entry) return false
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.store.delete(this.key(key))
      return false
    }
    return true
  }
}

// --- Redis store (indien REDIS_URL geconfigureerd) ---

class RedisSessionStore<T> implements SessionStore<T> {
  private prefix: string
  private redisUrl: string

  constructor(prefix: string, redisUrl: string) {
    this.prefix = prefix
    this.redisUrl = redisUrl
  }

  private key(k: string) {
    return `${this.prefix}:${k}`
  }

  private async getClient() {
    // Dynamische import zodat redis alleen geladen wordt als nodig
    const { createClient } = await import("redis" as string)
    const client = createClient({ url: this.redisUrl })
    await client.connect()
    return client
  }

  async get(key: string): Promise<T | undefined> {
    try {
      const client = await this.getClient()
      const data = await client.get(this.key(key))
      await client.disconnect()
      return data ? JSON.parse(data) : undefined
    } catch (error) {
      console.error("[SessionStore] Redis get error:", error)
      return undefined
    }
  }

  async set(key: string, value: T, ttlSeconds?: number): Promise<void> {
    try {
      const client = await this.getClient()
      const serialized = JSON.stringify(value)
      if (ttlSeconds) {
        await client.setEx(this.key(key), ttlSeconds, serialized)
      } else {
        await client.set(this.key(key), serialized)
      }
      await client.disconnect()
    } catch (error) {
      console.error("[SessionStore] Redis set error:", error)
    }
  }

  async delete(key: string): Promise<void> {
    try {
      const client = await this.getClient()
      await client.del(this.key(key))
      await client.disconnect()
    } catch (error) {
      console.error("[SessionStore] Redis delete error:", error)
    }
  }

  async has(key: string): Promise<boolean> {
    try {
      const client = await this.getClient()
      const exists = await client.exists(this.key(key))
      await client.disconnect()
      return exists === 1
    } catch (error) {
      console.error("[SessionStore] Redis has error:", error)
      return false
    }
  }
}

// --- Factory ---

export function createSessionStore<T>(prefix: string): SessionStore<T> {
  const redisUrl = process.env.REDIS_URL

  if (redisUrl) {
    console.log(`[SessionStore] Redis store aangemaakt voor prefix '${prefix}'`)
    return new RedisSessionStore<T>(prefix, redisUrl)
  }

  return new MemorySessionStore<T>(prefix)
}
