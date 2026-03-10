/**
 * In-memory rate limiter voor auth en API endpoints.
 * Beschermt tegen brute-force aanvallen op login, registratie en wachtwoord-reset.
 *
 * Beperkingen van in-memory rate limiting:
 * - Overleeft geen serverless restart (Vercel cold start)
 * - Niet gedeeld tussen serverless instances
 * TODO: Vervang door Upstash Redis voor productie (Iteratie 6)
 */

interface RateLimitEntry {
  count: number
  resetTime: number
}

const store = new Map<string, RateLimitEntry>()

// Cleanup elke 5 minuten om geheugenlekkage te voorkomen
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of store) {
      if (now > entry.resetTime) {
        store.delete(key)
      }
    }
  }, 5 * 60 * 1000)
}

export interface RateLimitConfig {
  /** Maximum aantal requests in het window */
  maxRequests: number
  /** Window in seconden */
  windowSeconds: number
}

const defaultConfigs: Record<string, RateLimitConfig> = {
  login: { maxRequests: 5, windowSeconds: 300 },            // 5 pogingen per 5 min
  register: { maxRequests: 3, windowSeconds: 600 },          // 3 per 10 min
  "forgot-password": { maxRequests: 3, windowSeconds: 600 }, // 3 per 10 min
  "reset-password": { maxRequests: 5, windowSeconds: 600 },  // 5 per 10 min
  "magic-link": { maxRequests: 3, windowSeconds: 600 },      // 3 per 10 min
  "check-phone": { maxRequests: 5, windowSeconds: 300 },     // 5 per 5 min
  "beheer-api": { maxRequests: 60, windowSeconds: 60 },      // 60 per minuut voor admin
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetIn: number // seconden tot reset
}

/**
 * Check rate limit voor een bepaald endpoint en identifier (IP of userId).
 */
export function checkRateLimit(
  identifier: string,
  endpoint: string,
  config?: RateLimitConfig
): RateLimitResult {
  const cfg = config || defaultConfigs[endpoint] || { maxRequests: 10, windowSeconds: 60 }
  const key = `${endpoint}:${identifier}`
  const now = Date.now()
  const windowMs = cfg.windowSeconds * 1000

  const entry = store.get(key)

  if (!entry || now > entry.resetTime) {
    // Nieuw window starten
    store.set(key, { count: 1, resetTime: now + windowMs })
    return { allowed: true, remaining: cfg.maxRequests - 1, resetIn: cfg.windowSeconds }
  }

  if (entry.count >= cfg.maxRequests) {
    const resetIn = Math.ceil((entry.resetTime - now) / 1000)
    return { allowed: false, remaining: 0, resetIn }
  }

  entry.count++
  return {
    allowed: true,
    remaining: cfg.maxRequests - entry.count,
    resetIn: Math.ceil((entry.resetTime - now) / 1000),
  }
}

/**
 * Haal het IP-adres op uit een NextRequest.
 * Let op: Vercel zet het echte IP in x-forwarded-for.
 * We nemen alleen het eerste IP (van de client, niet van proxies).
 */
export function getClientIp(request: Request): string {
  // Vercel-specifiek: x-real-ip is betrouwbaar op Vercel
  const vercelIp = request.headers.get("x-real-ip")
  if (vercelIp) return vercelIp

  // Fallback: eerste IP uit x-forwarded-for
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) {
    return forwarded.split(",")[0].trim()
  }

  return "unknown"
}
