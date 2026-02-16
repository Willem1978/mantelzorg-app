import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import crypto from "crypto"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

interface RegisterBody {
  name?: string
  email: string
  password: string
  phoneNumber?: string  // Voor WhatsApp koppeling
  // Eigen adres
  postalCode?: string
  street?: string
  city?: string
  municipality: {
    code: string
    name: string
    provinceCode: string
    provinceName: string
  }
  // Naaste info
  careRecipientName?: string
  careRecipientRelation?: string
  careRecipientStreet?: string
  careRecipientCity?: string
  careRecipientMunicipality?: string
  // Privacy
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
          name: body.name || null,
          password: passwordHash,
          role: "CAREGIVER",
        }
      })

      // Create caregiver profile with all info
      const caregiver = await tx.caregiver.create({
        data: {
          userId: user.id,
          phoneNumber: body.phoneNumber || null,
          // Eigen locatie
          postalCode: body.postalCode || null,
          street: body.street || null,
          city: body.city || null,
          municipality: body.municipality.name,
          // Naaste info
          careRecipientName: body.careRecipientName || null,
          careRecipient: body.careRecipientRelation || null,
          careRecipientStreet: body.careRecipientStreet || null,
          careRecipientCity: body.careRecipientCity || null,
          careRecipientMunicipality: body.careRecipientMunicipality || null,
          // Status
          intakeCompleted: false,
          profileCompleted: !!(body.postalCode && body.careRecipientName), // Profiel compleet als adres en naaste ingevuld
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
    if (process.env.NODE_ENV === "development") {
      console.log("Email verification link:", verifyUrl)
    }

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
