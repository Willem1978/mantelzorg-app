import { redirect } from 'next/navigation'
import { PrismaClient } from '@prisma/client'
import { randomBytes } from 'crypto'
import { cookies } from 'next/headers'

const prisma = new PrismaClient()

/**
 * Korte magic link pagina: /m/[token]
 * Verifieert token en logt gebruiker direct in
 */
export default async function MagicLinkPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  if (!token) {
    redirect('/login?error=missing_token')
  }

  try {
    // Zoek token in database
    const magicLink = await prisma.magicLinkToken.findUnique({
      where: { token },
      include: { user: true },
    })

    if (!magicLink) {
      redirect('/login?error=invalid_token')
    }

    // Check of token al gebruikt is
    if (magicLink.usedAt) {
      redirect('/login?error=token_used')
    }

    // Check of token verlopen is
    if (new Date() > magicLink.expiresAt) {
      redirect('/login?error=token_expired')
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

    // Set session cookie
    const cookieStore = await cookies()
    const isSecure = process.env.NODE_ENV === 'production'
    const cookieName = isSecure ? '__Secure-next-auth.session-token' : 'next-auth.session-token'

    cookieStore.set(cookieName, sessionToken, {
      httpOnly: true,
      secure: isSecure,
      sameSite: 'lax',
      path: '/',
      expires,
    })

    // Redirect naar dashboard
    redirect('/dashboard')
  } catch (error) {
    console.error('Magic link error:', error)
    redirect('/login?error=server_error')
  }
}
