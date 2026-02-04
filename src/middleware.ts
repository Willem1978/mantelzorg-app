import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

// Routes die authenticatie vereisen
const protectedRoutes = ["/dashboard", "/intake", "/rapport", "/agenda", "/profiel", "/organisatie"]

// Routes die alleen voor niet-ingelogde gebruikers zijn
const authRoutes = ["/login", "/register"]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check of het een protected route is
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route))
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route))

  // Haal de sessie token op
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  })

  // Als de gebruiker niet ingelogd is en naar een protected route gaat
  if (isProtectedRoute && !token) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Als de gebruiker ingelogd is en naar login/register gaat
  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Match alle routes behalve API routes, static files, etc.
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|belastbaarheidstest|rapport-gast).*)",
  ],
}
