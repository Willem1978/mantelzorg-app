import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"

// Eenmalig setup endpoint om admin-account aan te maken
// Werkt alleen als er nog geen ADMIN gebruiker bestaat
export async function POST(request: Request) {
  try {
    // Check of er al een admin bestaat
    const existingAdmin = await prisma.user.findFirst({
      where: { role: "ADMIN" },
    })

    if (existingAdmin) {
      return NextResponse.json(
        { error: "Er bestaat al een admin-account. Dit endpoint is uitgeschakeld." },
        { status: 403 }
      )
    }

    const { email, password, name } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email en wachtwoord zijn verplicht" },
        { status: 400 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const user = await prisma.user.upsert({
      where: { email },
      create: {
        email,
        name: name || null,
        password: hashedPassword,
        role: "ADMIN",
      },
      update: {
        password: hashedPassword,
        role: "ADMIN",
      },
    })

    return NextResponse.json({
      message: "Admin-account aangemaakt",
      email: user.email,
    })
  } catch (error) {
    console.error("Setup error:", error)
    return NextResponse.json(
      { error: "Er ging iets mis bij het aanmaken van het admin-account" },
      { status: 500 }
    )
  }
}
