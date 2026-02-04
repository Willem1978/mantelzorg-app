export const dynamic = 'force-dynamic'
export const dynamicParams = true
export const revalidate = 0

// Lazy load handlers to avoid database connection during build
export async function GET(request: Request, context: any) {
  const { handlers } = await import("@/lib/auth")
  return handlers.GET(request, context)
}

export async function POST(request: Request, context: any) {
  const { handlers } = await import("@/lib/auth")
  return handlers.POST(request, context)
}
