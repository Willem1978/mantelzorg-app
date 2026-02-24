import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { checkRateLimit, getClientIp } from "@/lib/rate-limit"
import { resetPasswordSchema, validateBody } from "@/lib/validations"

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = getClientIp(request)
    const limit = checkRateLimit(ip, "reset-password")
    if (!limit.allowed) {
      return NextResponse.json(
        { error: `Te veel pogingen. Probeer het over ${Math.ceil(limit.resetIn / 60)} minuten opnieuw.` },
        { status: 429 }
      )
    }

    const body = await request.json()

    // Zod validatie
    const validation = validateBody(body, resetPasswordSchema)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    const { token, password } = validation.data

    // Find valid token
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token }
    })

    if (!resetToken) {
      return NextResponse.json(
        { error: "Ongeldige of verlopen link" },
        { status: 400 }
      )
    }

    if (resetToken.expires < new Date()) {
      // Delete expired token
      await prisma.passwordResetToken.delete({
        where: { token }
      })

      return NextResponse.json(
        { error: "Deze link is verlopen. Vraag een nieuwe aan." },
        { status: 400 }
      )
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: resetToken.email }
    })

    if (!user) {
      return NextResponse.json(
        { error: "Gebruiker niet gevonden" },
        { status: 404 }
      )
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Update password
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    })

    // Delete used token
    await prisma.passwordResetToken.delete({
      where: { token }
    })

    // Create notification
    await prisma.notification.create({
      data: {
        userId: user.id,
        type: "SYSTEM",
        title: "Wachtwoord gewijzigd",
        message: "Je wachtwoord is succesvol gewijzigd.",
      }
    })

    return NextResponse.json({
      success: true,
      message: "Wachtwoord is gewijzigd. Je kunt nu inloggen."
    })

  } catch (error) {
    console.error("Reset password error:", error)
    return NextResponse.json(
      { error: "Er ging iets mis" },
      { status: 500 }
    )
  }
}
