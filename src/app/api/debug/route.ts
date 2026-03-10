import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET() {
  const checks: Record<string, unknown> = {
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    env: {
      DATABASE_URL: !!process.env.DATABASE_URL,
      DIRECT_URL: !!process.env.DIRECT_URL,
      AUTH_SECRET: !!process.env.AUTH_SECRET,
      NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || "(not set)",
      VERCEL_URL: process.env.VERCEL_URL || "(not set)",
      NODE_ENV: process.env.NODE_ENV,
    },
  }

  // Try importing prisma
  try {
    const { prisma } = await import("@/lib/prisma")
    checks.prismaImport = "ok"

    try {
      await prisma.$queryRaw`SELECT 1`
      checks.prismaQuery = "ok"
    } catch (e: unknown) {
      checks.prismaQuery = `error: ${e instanceof Error ? e.message : String(e)}`
    }
  } catch (e: unknown) {
    checks.prismaImport = `error: ${e instanceof Error ? e.message : String(e)}`
  }

  return NextResponse.json(checks)
}
