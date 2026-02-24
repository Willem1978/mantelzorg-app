import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import crypto from "crypto"
import { prisma } from "@/lib/prisma"
import { checkRateLimit, getClientIp } from "@/lib/rate-limit"
import { registerSchema, validateBody } from "@/lib/validations"
import { sendVerificationEmail } from "@/lib/email"

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = getClientIp(request)
    const limit = checkRateLimit(ip, "register")
    if (!limit.allowed) {
      return NextResponse.json(
        { error: `Te veel pogingen. Probeer het over ${Math.ceil(limit.resetIn / 60)} minuten opnieuw.` },
        { status: 429 }
      )
    }

    const body = await request.json()

    // Zod validatie
    const validation = validateBody(body, registerSchema)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    const data = validation.data

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "Dit e-mailadres is al in gebruik" },
        { status: 409 }
      )
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 12)

    // Create user and caregiver profile in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email: data.email,
          name: data.name || null,
          password: passwordHash,
          role: "CAREGIVER",
        }
      })

      // Create caregiver profile with all info
      const caregiver = await tx.caregiver.create({
        data: {
          userId: user.id,
          phoneNumber: data.phoneNumber || null,
          postalCode: data.postalCode || null,
          street: data.street || null,
          city: data.city || null,
          municipality: data.municipality.name,
          careRecipientName: data.careRecipientName || null,
          careRecipient: data.careRecipientRelation || null,
          careRecipientStreet: data.careRecipientStreet || null,
          careRecipientCity: data.careRecipientCity || null,
          careRecipientMunicipality: data.careRecipientMunicipality || null,
          intakeCompleted: false,
          profileCompleted: !!(data.postalCode && data.careRecipientName),
        }
      })

      // Generate email verification token
      const verificationToken = crypto.randomBytes(32).toString("hex")
      const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000)

      await tx.verificationToken.create({
        data: {
          identifier: user.email,
          token: verificationToken,
          expires: verificationExpires,
        }
      })

      return { user, caregiver, verificationToken }
    })

    // Verstuur verificatie-email
    await sendVerificationEmail(data.email, result.verificationToken)

    return NextResponse.json({
      success: true,
      message: "Account aangemaakt. Check je e-mail om je account te bevestigen.",
      userId: result.user.id,
    })

  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json(
      { error: "Er ging iets mis bij het registreren" },
      { status: 500 }
    )
  }
}
