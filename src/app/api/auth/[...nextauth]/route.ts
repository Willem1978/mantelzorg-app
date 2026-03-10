import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const dynamicParams = true
export const revalidate = 0

// Lazy load handlers to avoid database connection during build
export async function GET(request: NextRequest) {
  try {
    const { handlers } = await import("@/lib/auth")
    return handlers.GET(request)
  } catch (e) {
    console.error("[AUTH ROUTE] GET fout:", e instanceof Error ? e.message : e)
    return NextResponse.json({ error: "Auth service unavailable" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { handlers } = await import("@/lib/auth")
    return handlers.POST(request)
  } catch (e) {
    console.error("[AUTH ROUTE] POST fout:", e instanceof Error ? e.message : e)
    return NextResponse.json({ error: "Auth service unavailable" }, { status: 500 })
  }
}
