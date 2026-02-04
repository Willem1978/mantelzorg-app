import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import crypto from "crypto"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

interface RegisterBody {
  email: string
  password: string
  municipality: {
    code: string
    name: string
    provinceCode: string
    provinceName: string
  }
  privacyConsent: boolean
  dataProcessingConsent: boolean
}

export async function POST(request: NextRequest) {
  try {
    const body: RegisterBody = await request.json()

    // Validatie
    if (!body.email || !body.password) {
      return NextResponse.json(
        { error: "E-mail en wachtwoord zijn verplicht" },
        { status: 400 }
      )
    }

    if (body.password.length < 8) {
      return NextResponse.json(
        { error: "Wachtwoord moet minimaal 8 tekens bevatten" },
        { status: 400 }
      )
    }

    if (!body.municipality) {
      return NextResponse.json(
        { error: "Gemeente is verplicht" },
        { status: 400 }
      )
    }

    if (!body.privacyConsent || !body.dataProcessingConsent) {
      return NextResponse.json(
        { error: "Je moet akkoord gaan met de voorwaarden" },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: body.email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "Dit e-mailadres is al in gebruik" },
        { status: 409 }
      )
    }

    // Hash password
    const passwordHash = await bcrypt.hash(body.password, 12)

    // Create user and caregiver profile in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email: body.email,
          password: passwordHash,
          role: "CAREGIVER",
        }
      })

      // Create caregiver profile with municipality info
      // Note: We only store municipality, not exact address (AVG-compliant)
      const caregiver = await tx.caregiver.create({
        data: {
          userId: user.id,
          city: body.municipality.name,
          // We could add a separate field for municipality code if needed
          intakeCompleted: false,
        }
      })

      // Generate email verification token
      const verificationToken = crypto.randomBytes(32).toString("hex")
      const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

      await tx.verificationToken.create({
        data: {
          identifier: user.email,
          token: verificationToken,
          expires: verificationExpires,
        }
      })

      return { user, caregiver, verificationToken }
    })

    // In production, send verification email
    const verifyUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/auth/verify-email?token=${result.verificationToken}`
    console.log("Email verification link:", verifyUrl)

    // TODO: Send verification email
    // await sendEmail({
    //   to: body.email,
    //   subject: "Bevestig je e-mailadres - MantelzorgApp",
    //   html: `<a href="${verifyUrl}">Klik hier om je e-mail te bevestigen</a>`
    // })

    return NextResponse.json({
      success: true,
      message: "Account aangemaakt. Check je e-mail om je account te bevestigen.",
      userId: result.user.id,
      // Only in development:
      ...(process.env.NODE_ENV === "development" && { verifyUrl })
    })

  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json(
      { error: "Er ging iets mis bij het registreren" },
      { status: 500 }
    )
  }
}
