import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { auth } from "@/lib/auth"

// Routes die authenticatie vereisen
const protectedRoutes = ["/dashboard", "/intake", "/rapport", "/agenda", "/profiel", "/organisatie"]

// Routes die alleen voor niet-ingelogde gebruikers zijn
// Let op: /register-whatsapp moet ook toegankelijk zijn voor niet-ingelogde gebruikers
const authRoutes = ["/login", "/register", "/register-whatsapp"]

export default auth((request) => {
  const { pathname } = request.nextUrl

  // Check of het een protected route is
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route))
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route))

  // Haal de sessie uit de request (gezet door auth middleware)
  const session = request.auth

  // Als de gebruiker niet ingelogd is en naar een protected route gaat
  if (isProtectedRoute && !session) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Als de gebruiker ingelogd is en naar login/register gaat
  if (isAuthRoute && session) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    // Match alle routes behalve API routes, static files, etc.
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|belastbaarheidstest|rapport-gast).*)",
  ],
}
