import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { error: "E-mailadres is verplicht" },
        { status: 400 }
      )
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({
        success: true,
        message: "Als dit e-mailadres bij ons bekend is, sturen we een nieuwe verificatie link."
      })
    }

    // Check if already verified
    if (user.emailVerified) {
      return NextResponse.json({
        success: true,
        message: "Je e-mail is al geverifieerd. Je kunt inloggen."
      })
    }

    // Delete existing tokens
    await prisma.verificationToken.deleteMany({
      where: { identifier: email.toLowerCase() }
    })

    // Generate new token
    const verificationToken = crypto.randomBytes(32).toString("hex")
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    await prisma.verificationToken.create({
      data: {
        identifier: email.toLowerCase(),
        token: verificationToken,
        expires: verificationExpires,
      }
    })

    // In production, send email
    const verifyUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/auth/verify-email?token=${verificationToken}`
    if (process.env.NODE_ENV === "development") {
      console.log("New verification link:", verifyUrl)
    }

    return NextResponse.json({
      success: true,
      message: "Een nieuwe verificatie link is verstuurd.",
      // Only in development:
      ...(process.env.NODE_ENV === "development" && { verifyUrl })
    })

  } catch (error) {
    console.error("Resend verification error:", error)
    return NextResponse.json(
      { error: "Er ging iets mis" },
      { status: 500 }
    )
  }
}
