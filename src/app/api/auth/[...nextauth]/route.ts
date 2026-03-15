import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const dynamicParams = true
export const revalidate = 0

// Lazy load handlers to avoid database connection during build
export async function GET(request: NextRequest) {
  try {
    const { handlers } = await import("@/lib/auth")
    return await handlers.GET(request)
  } catch (e) {
    console.error("[AUTH] GET error:", e)
    return NextResponse.redirect(new URL("/login?error=ServerError", request.url))
  }
}

export async function POST(request: NextRequest) {
  try {
    const { handlers } = await import("@/lib/auth")
    return await handlers.POST(request)
  } catch (e) {
    console.error("[AUTH] POST error:", e)
    return NextResponse.json({ error: "Auth service unavailable" }, { status: 500 })
  }
}
