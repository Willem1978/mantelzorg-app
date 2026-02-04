export const dynamic = 'force-dynamic'
export const dynamicParams = true
export const revalidate = 0

// Lazy load handlers to avoid database connection during build
export async function GET(request: Request) {
  const { handlers } = await import("@/lib/auth")
  return handlers.GET(request)
}

export async function POST(request: Request) {
  const { handlers } = await import("@/lib/auth")
  return handlers.POST(request)
}
