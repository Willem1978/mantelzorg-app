import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET() {
  const start = Date.now()

  let dbStatus: "ok" | "error" = "error"
  let dbLatencyMs = 0

  try {
    const dbStart = Date.now()
    await prisma.$queryRaw`SELECT 1`
    dbLatencyMs = Date.now() - dbStart
    dbStatus = "ok"
  } catch {
    dbStatus = "error"
  }

  // Test of NextAuth configuratie correct laadt
  let authStatus: "ok" | "error" = "error"
  let authError: string | null = null
  try {
    await import("@/lib/auth")
    authStatus = "ok"
  } catch (e) {
    authError = e instanceof Error ? e.message : "Onbekende fout bij laden auth config"
  }

  const totalMs = Date.now() - start

  // Check kritieke environment variabelen (alleen of ze bestaan, niet de waarden)
  const envChecks = {
    DATABASE_URL: !!process.env.DATABASE_URL,
    AUTH_SECRET: !!(process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET),
    NEXTAUTH_URL: !!(process.env.NEXTAUTH_URL || process.env.VERCEL_URL),
  }

  const allEnvOk = Object.values(envChecks).every(Boolean)
  const healthy = dbStatus === "ok" && allEnvOk && authStatus === "ok"

  return NextResponse.json(
    {
      status: healthy ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: {
        status: dbStatus,
        latencyMs: dbLatencyMs,
      },
      auth: {
        status: authStatus,
        ...(authError && { error: authError }),
      },
      environment: envChecks,
      responseTimeMs: totalMs,
    },
    { status: healthy ? 200 : 503 }
  )
}
