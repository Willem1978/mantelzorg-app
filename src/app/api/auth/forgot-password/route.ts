import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import crypto from "crypto"
import { checkRateLimit, getClientIp } from "@/lib/rate-limit"
import { forgotPasswordSchema, validateBody } from "@/lib/validations"
import { sendPasswordResetEmail } from "@/lib/email"

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = getClientIp(request)
    const limit = checkRateLimit(ip, "forgot-password")
    if (!limit.allowed) {
      return NextResponse.json(
        { error: `Te veel pogingen. Probeer het over ${Math.ceil(limit.resetIn / 60)} minuten opnieuw.` },
        { status: 429 }
      )
    }

    const body = await request.json()

    // Zod validatie
    const validation = validateBody(body, forgotPasswordSchema)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    const { email } = validation.data

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({
        success: true,
        message: "Als dit e-mailadres bij ons bekend is, ontvang je een reset link."
      })
    }

    // Generate reset token
    const token = crypto.randomBytes(32).toString("hex")
    const expires = new Date(Date.now() + 3600000) // 1 hour

    // Delete existing tokens for this email
    await prisma.passwordResetToken.deleteMany({
      where: { email: email.toLowerCase() }
    })

    // Create new token
    await prisma.passwordResetToken.create({
      data: {
        email: email.toLowerCase(),
        token,
        expires,
      }
    })

    // Verstuur reset email
    await sendPasswordResetEmail(email.toLowerCase(), token)

    return NextResponse.json({
      success: true,
      message: "Als dit e-mailadres bij ons bekend is, ontvang je een reset link.",
    })

  } catch (error) {
    console.error("Forgot password error:", error)
    return NextResponse.json(
      { error: "Er ging iets mis" },
      { status: 500 }
    )
  }
}
