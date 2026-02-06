import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { randomBytes } from 'crypto'

const prisma = new PrismaClient()

/**
 * GET /api/auth/magic-link?token=xxx
 * Verifieert magic link token en logt gebruiker in
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const token = searchParams.get('token')

  if (!token) {
    return NextResponse.redirect(new URL('/login?error=missing_token', request.url))
  }

  try {
    // Zoek token in database
    const magicLink = await prisma.magicLinkToken.findUnique({
      where: { token },
      include: { user: true },
    })

    if (!magicLink) {
      return NextResponse.redirect(new URL('/login?error=invalid_token', request.url))
    }

    // Check of token al gebruikt is
    if (magicLink.usedAt) {
      return NextResponse.redirect(new URL('/login?error=token_used', request.url))
    }

    // Check of token verlopen is
    if (new Date() > magicLink.expiresAt) {
      return NextResponse.redirect(new URL('/login?error=token_expired', request.url))
    }

    // Markeer token als gebruikt
    await prisma.magicLinkToken.update({
      where: { id: magicLink.id },
      data: { usedAt: new Date() },
    })

    // Genereer een simpele session token
    const sessionToken = randomBytes(32).toString('hex')

    // Maak sessie in database
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 dagen
    await prisma.session.create({
      data: {
        sessionToken,
        userId: magicLink.user.id,
        expires,
      },
    })

    // Redirect naar dashboard met sessie cookie
    const response = NextResponse.redirect(new URL('/dashboard', request.url))

    // Set session cookie (same as NextAuth does)
    const isSecure = process.env.NODE_ENV === 'production'
    const cookieName = isSecure ? '__Secure-next-auth.session-token' : 'next-auth.session-token'

    response.cookies.set(cookieName, sessionToken, {
      httpOnly: true,
      secure: isSecure,
      sameSite: 'lax',
      path: '/',
      expires,
    })

    return response
  } catch (error) {
    console.error('Magic link error:', error)
    return NextResponse.redirect(new URL('/login?error=server_error', request.url))
  }
}
