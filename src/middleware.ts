import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

// Routes die authenticatie vereisen
const protectedRoutes = ["/dashboard", "/intake", "/rapport", "/agenda", "/profiel", "/privacy", "/organisatie", "/onboarding"]

// Routes die alleen voor niet-ingelogde gebruikers zijn
const authRoutes = ["/login", "/register"]

// Beheer routes - vereisen ADMIN rol
const beheerRoutes = ["/beheer"]

export default auth((request) => {
  const { pathname } = request.nextUrl

  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route))
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route))
  const isBeheerRoute = beheerRoutes.some((route) => pathname.startsWith(route))

  const session = request.auth

  // Beheer login pagina: altijd toegankelijk (anders redirect loop)
  if (pathname === "/beheer/login") {
    if (session && (session.user as any)?.role === "ADMIN") {
      return NextResponse.redirect(new URL("/beheer", request.url))
    }
    return NextResponse.next()
  }

  // Beheer routes: vereisen inlog + ADMIN rol
  if (isBeheerRoute) {
    if (!session) {
      const loginUrl = new URL("/beheer/login", request.url)
      loginUrl.searchParams.set("callbackUrl", pathname)
      return NextResponse.redirect(loginUrl)
    }
    const role = (session.user as any)?.role
    if (role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }
    return NextResponse.next()
  }

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
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|belastbaarheidstest|rapport-gast).*)",
  ],
}
