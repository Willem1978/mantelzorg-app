/**
 * Rate limiter voor auth endpoints.
 * Beschermt tegen brute-force aanvallen op login, registratie en wachtwoord-reset.
 *
 * Productie: Upstash Redis — persistent over serverless cold starts.
 * Development: In-memory fallback als UPSTASH_REDIS_REST_URL niet is geconfigureerd.
 */

import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

// ============================================
// CONFIGURATIE PER ENDPOINT
// ============================================

interface RateLimitConfig {
  /** Maximum aantal requests in het window */
  maxRequests: number
  /** Window in seconden */
  windowSeconds: number
}

const defaultConfigs: Record<string, RateLimitConfig> = {
  login: { maxRequests: 5, windowSeconds: 300 },             // 5 pogingen per 5 min
  register: { maxRequests: 3, windowSeconds: 600 },           // 3 per 10 min
  "forgot-password": { maxRequests: 3, windowSeconds: 600 },  // 3 per 10 min
  "reset-password": { maxRequests: 5, windowSeconds: 600 },   // 5 per 10 min
  "magic-link": { maxRequests: 3, windowSeconds: 600 },       // 3 per 10 min
  "beheer-api": { maxRequests: 30, windowSeconds: 60 },       // 30 per min voor admin endpoints
  "check-phone": { maxRequests: 5, windowSeconds: 300 },      // 5 per 5 min voor telefoon-check
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetIn: number // seconden tot reset
}

// ============================================
// UPSTASH REDIS RATE LIMITER (productie)
// ============================================

const isRedisConfigured = !!(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
)

// Redis client — alleen aanmaken als geconfigureerd
const redis = isRedisConfigured
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null

// Cache van Ratelimit instances per endpoint
const rateLimiters = new Map<string, Ratelimit>()

function getUpstashRateLimiter(endpoint: string, config: RateLimitConfig): Ratelimit {
  const key = `${endpoint}:${config.maxRequests}:${config.windowSeconds}`
  let limiter = rateLimiters.get(key)
  if (!limiter) {
    limiter = new Ratelimit({
      redis: redis!,
      limiter: Ratelimit.slidingWindow(config.maxRequests, `${config.windowSeconds} s`),
      prefix: `rl:${endpoint}`,
    })
    rateLimiters.set(key, limiter)
  }
  return limiter
}

// ============================================
// IN-MEMORY FALLBACK (development)
// ============================================

interface MemoryEntry {
  count: number
  resetTime: number
}

const memoryStore = new Map<string, MemoryEntry>()

// Cleanup elke 5 minuten om geheugenlekkage te voorkomen (alleen in dev)
if (!isRedisConfigured) {
  setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of memoryStore) {
      if (now > entry.resetTime) {
        memoryStore.delete(key)
      }
    }
  }, 5 * 60 * 1000)
}

function checkMemoryRateLimit(
  identifier: string,
  endpoint: string,
  config: RateLimitConfig
): RateLimitResult {
  const key = `${endpoint}:${identifier}`
  const now = Date.now()
  const windowMs = config.windowSeconds * 1000

  const entry = memoryStore.get(key)

  if (!entry || now > entry.resetTime) {
    memoryStore.set(key, { count: 1, resetTime: now + windowMs })
    return { allowed: true, remaining: config.maxRequests - 1, resetIn: config.windowSeconds }
  }

  if (entry.count >= config.maxRequests) {
    const resetIn = Math.ceil((entry.resetTime - now) / 1000)
    return { allowed: false, remaining: 0, resetIn }
  }

  entry.count++
  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetIn: Math.ceil((entry.resetTime - now) / 1000),
  }
}

// ============================================
// PUBLIEKE API
// ============================================

/**
 * Check rate limit voor een bepaald endpoint en identifier (IP of email).
 *
 * Gebruikt Upstash Redis in productie (persistent over cold starts).
 * Valt terug op in-memory store in development.
 */
export async function checkRateLimit(
  identifier: string,
  endpoint: string,
  config?: RateLimitConfig
): Promise<RateLimitResult> {
  const cfg = config || defaultConfigs[endpoint] || { maxRequests: 10, windowSeconds: 60 }

  // Upstash Redis — persistent rate limiting
  if (isRedisConfigured && redis) {
    try {
      const limiter = getUpstashRateLimiter(endpoint, cfg)
      const result = await limiter.limit(`${endpoint}:${identifier}`)
      return {
        allowed: result.success,
        remaining: result.remaining,
        resetIn: Math.ceil((result.reset - Date.now()) / 1000),
      }
    } catch (error) {
      // Bij Redis-fout: val terug op in-memory (beter dan geen rate limiting)
      console.error("[RATE-LIMIT] Redis fout, fallback naar in-memory:", error)
      return checkMemoryRateLimit(identifier, endpoint, cfg)
    }
  }

  // In-memory fallback (development of als Redis niet geconfigureerd is)
  if (!isRedisConfigured && process.env.NODE_ENV === "development") {
    // Eenmalige waarschuwing in development
    if (!memoryWarnShown) {
      console.warn("[RATE-LIMIT] Upstash Redis niet geconfigureerd — in-memory rate limiting actief. " +
        "Dit werkt NIET in productie (serverless cold starts). " +
        "Stel UPSTASH_REDIS_REST_URL en UPSTASH_REDIS_REST_TOKEN in voor productie.")
      memoryWarnShown = true
    }
  }

  return checkMemoryRateLimit(identifier, endpoint, cfg)
}

let memoryWarnShown = false

/**
 * Haal het IP-adres op uit een Request.
 * Vercel zet het echte client IP als eerste waarde in x-forwarded-for.
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) {
    const firstIp = forwarded.split(",")[0].trim()
    if (firstIp && firstIp !== "unknown") return firstIp
  }

  const real = request.headers.get("x-real-ip")
  if (real && real !== "unknown") return real

  return "unknown"
}
