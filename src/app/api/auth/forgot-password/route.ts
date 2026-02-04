import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import crypto from "crypto"

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

    // In production, send email here
    // For now, log the reset link
    const resetUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/wachtwoord-reset?token=${token}`
    console.log("Password reset link:", resetUrl)

    // TODO: Send email with reset link
    // await sendEmail({
    //   to: email,
    //   subject: "Wachtwoord resetten - MantelzorgApp",
    //   html: `
    //     <h1>Wachtwoord resetten</h1>
    //     <p>Klik op de onderstaande link om je wachtwoord te resetten:</p>
    //     <a href="${resetUrl}">${resetUrl}</a>
    //     <p>Deze link is 1 uur geldig.</p>
    //   `
    // })

    return NextResponse.json({
      success: true,
      message: "Als dit e-mailadres bij ons bekend is, ontvang je een reset link.",
      // Only in development:
      ...(process.env.NODE_ENV === "development" && { resetUrl })
    })

  } catch (error) {
    console.error("Forgot password error:", error)
    return NextResponse.json(
      { error: "Er ging iets mis" },
      { status: 500 }
    )
  }
}
