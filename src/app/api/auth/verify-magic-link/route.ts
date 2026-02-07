import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { randomBytes } from 'crypto'

const prisma = new PrismaClient()

/**
 * POST /api/auth/verify-magic-link
 * Verifieert magic link token en geeft credentials terug voor automatisch inloggen
 */
export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json(
        { error: 'Geen token opgegeven' },
        { status: 400 }
      )
    }

    // Zoek token in database
    const magicLink = await prisma.magicLinkToken.findUnique({
      where: { token },
      include: { user: true },
    })

    if (!magicLink) {
      return NextResponse.json(
        { error: 'Deze link is ongeldig' },
        { status: 404 }
      )
    }

    // Check of token al gebruikt is
    if (magicLink.usedAt) {
      return NextResponse.json(
        { error: 'Deze link is al gebruikt' },
        { status: 400 }
      )
    }

    // Check of token verlopen is
    if (new Date() > magicLink.expiresAt) {
      return NextResponse.json(
        { error: 'Deze link is verlopen' },
        { status: 400 }
      )
    }

    // Markeer token als gebruikt
    await prisma.magicLinkToken.update({
      where: { id: magicLink.id },
      data: { usedAt: new Date() },
    })

    // Genereer een tijdelijk wachtwoord en update de user
    const tempPassword = randomBytes(16).toString('hex')
    const hashedTempPassword = await bcrypt.hash(tempPassword, 12)

    await prisma.user.update({
      where: { id: magicLink.user.id },
      data: { password: hashedTempPassword },
    })

    console.log('Magic link verified for user:', magicLink.user.email)

    // Return credentials voor automatisch inloggen
    return NextResponse.json({
      success: true,
      email: magicLink.user.email,
      tempPassword: tempPassword,
    })

  } catch (error) {
    console.error('Verify magic link error:', error)
    return NextResponse.json(
      { error: 'Er ging iets mis' },
      { status: 500 }
    )
  }
}
