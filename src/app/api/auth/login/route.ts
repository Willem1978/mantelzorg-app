import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"

interface LoginBody {
  email: string
  password: string
}

export async function POST(request: NextRequest) {
  try {
    const body: LoginBody = await request.json()

    // Validatie
    if (!body.email || !body.password) {
      return NextResponse.json(
        { error: "E-mail en wachtwoord zijn verplicht" },
        { status: 400 }
      )
    }

    // Find user in database
    const user = await prisma.user.findUnique({
      where: { email: body.email },
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

    const isPasswordValid = await bcrypt.compare(body.password, user.password)

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Ongeldige inloggegevens" },
        { status: 401 }
      )
    }

    // Note: In production, use NextAuth signIn() for proper session management
    // This endpoint is mainly for validation, actual session is handled by NextAuth

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
