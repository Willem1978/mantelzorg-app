import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET() {
  // Stap 1: basis check (geen externe imports)
  const result: Record<string, unknown> = {
    status: "ok",
    time: new Date().toISOString(),
    node: process.version,
    env: {
      DATABASE_URL: !!process.env.DATABASE_URL,
      AUTH_SECRET: !!process.env.AUTH_SECRET,
      NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
      NODE_ENV: process.env.NODE_ENV,
    },
  }

  // Stap 2: database check (dynamische import)
  try {
    const { prisma } = await import("@/lib/prisma")
    await prisma.$queryRaw`SELECT 1`
    result.database = "ok"
  } catch (e) {
    result.database = `error: ${e instanceof Error ? e.message : String(e)}`
  }

  return NextResponse.json(result)
}
