import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { checkRateLimit, getClientIp } from "@/lib/rate-limit"
import { loginSchema, validateBody } from "@/lib/validations"

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = getClientIp(request)
    const limit = checkRateLimit(ip, "login")
    if (!limit.allowed) {
      return NextResponse.json(
        { error: `Te veel pogingen. Probeer het over ${Math.ceil(limit.resetIn / 60)} minuten opnieuw.` },
        { status: 429 }
      )
    }

    const body = await request.json()

    // Zod validatie
    const validation = validateBody(body, loginSchema)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    const { email, password } = validation.data

    // Find user in database
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        caregiver: true,
        orgMember: true,
      }
    })

    if (!user || !user.password) {
      return NextResponse.json(
        { error: "Ongeldige inloggegevens" },
        { status: 401 }
      )
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Ongeldige inloggegevens" },
        { status: 401 }
      )
    }

    return NextResponse.json({
      success: true,
      role: user.role,
      intakeCompleted: user.caregiver?.intakeCompleted ?? false,
    })

  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json(
      { error: "Er ging iets mis bij het inloggen" },
      { status: 500 }
    )
  }
}
