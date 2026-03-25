import { NextResponse } from "next/server"
import { createLogger } from "@/lib/logger"

export const dynamic = "force-dynamic"

const log = createLogger("health")

export async function GET() {
  const start = Date.now()

  // 1. Database check
  let dbStatus: "ok" | "error" = "error"
  let dbLatencyMs = 0
  try {
    const { prisma } = await import("@/lib/prisma")
    const dbStart = Date.now()
    await prisma.$queryRaw`SELECT 1`
    dbLatencyMs = Date.now() - dbStart
    dbStatus = "ok"
  } catch (e) {
    log.error({ err: e }, "Database health check mislukt")
    dbStatus = "error"
  }

  // 2. Auth config check
  let authStatus: "ok" | "error" = "error"
  let authError: string | null = null
  try {
    await import("@/lib/auth")
    authStatus = "ok"
  } catch (e) {
    authError = e instanceof Error ? e.message : "Onbekende fout bij laden auth config"
    log.error({ err: e }, "Auth config health check mislukt")
  }

  // 3. AI (Anthropic) bereikbaarheid — lichtgewicht check
  let aiStatus: "ok" | "not_configured" | "error" = "not_configured"
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      // Alleen checken of de key geldig formaat heeft (geen API call)
      aiStatus = process.env.ANTHROPIC_API_KEY.startsWith("sk-") ? "ok" : "error"
    } catch {
      aiStatus = "error"
    }
  }

  // 4. WhatsApp (Twilio) status
  let whatsappStatus: "ok" | "not_configured" | "error" = "not_configured"
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    whatsappStatus = "ok"
  }

  // 5. Upstash Redis status
  let redisStatus: "ok" | "not_configured" | "error" = "not_configured"
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    try {
      const { Redis } = await import("@upstash/redis")
      const redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
      await redis.ping()
      redisStatus = "ok"
    } catch (e) {
      log.error({ err: e }, "Redis health check mislukt")
      redisStatus = "error"
    }
  }

  // 6. Sentry status
  const sentryStatus = process.env.NEXT_PUBLIC_SENTRY_DSN ? "ok" : "not_configured"

  // Environment variabelen check
  const envChecks = {
    DATABASE_URL: !!process.env.DATABASE_URL,
    AUTH_SECRET: !!(process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET),
    NEXTAUTH_URL: !!(process.env.NEXTAUTH_URL || process.env.VERCEL_URL),
    ANTHROPIC_API_KEY: !!process.env.ANTHROPIC_API_KEY,
    OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
  }

  const totalMs = Date.now() - start
  const criticalOk = dbStatus === "ok" && authStatus === "ok" && envChecks.DATABASE_URL && envChecks.AUTH_SECRET
  const healthy = criticalOk

  const result = {
    status: healthy ? "healthy" : "degraded",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      database: { status: dbStatus, latencyMs: dbLatencyMs },
      auth: { status: authStatus, ...(authError && { error: authError }) },
      ai: { status: aiStatus },
      whatsapp: { status: whatsappStatus },
      redis: { status: redisStatus },
      sentry: { status: sentryStatus },
    },
    environment: envChecks,
    responseTimeMs: totalMs,
  }

  if (!healthy) {
    log.warn(result, "Health check: degraded")
  }

  return NextResponse.json(result, { status: healthy ? 200 : 503 })
}
