import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get("token")

  if (!token) {
    return NextResponse.json({ error: "Token is verplicht" }, { status: 400 })
  }

  const invite = await prisma.inviteToken.findUnique({ where: { token } })

  if (!invite) {
    return NextResponse.json({ error: "Ongeldige uitnodiging" }, { status: 404 })
  }

  if (invite.usedAt) {
    return NextResponse.json({ error: "Deze uitnodiging is al gebruikt" }, { status: 410 })
  }

  if (invite.expiresAt < new Date()) {
    return NextResponse.json({ error: "Deze uitnodiging is verlopen" }, { status: 410 })
  }

  return NextResponse.json({
    email: invite.email,
    gemeenteNaam: invite.gemeenteNaam,
    gemeenteRollen: invite.gemeenteRollen,
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, name, password } = body

    if (!token || !password) {
      return NextResponse.json({ error: "Token en wachtwoord zijn verplicht" }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Wachtwoord moet minimaal 8 tekens bevatten" }, { status: 400 })
    }

    const invite = await prisma.inviteToken.findUnique({ where: { token } })

    if (!invite) {
      return NextResponse.json({ error: "Ongeldige uitnodiging" }, { status: 404 })
    }

    if (invite.usedAt) {
      return NextResponse.json({ error: "Deze uitnodiging is al gebruikt" }, { status: 410 })
    }

    if (invite.expiresAt < new Date()) {
      return NextResponse.json({ error: "Deze uitnodiging is verlopen" }, { status: 410 })
    }

    // Check of email al bestaat
    const existing = await prisma.user.findUnique({ where: { email: invite.email } })
    if (existing) {
      return NextResponse.json({ error: "Dit e-mailadres is al in gebruik" }, { status: 409 })
    }

    const passwordHash = await bcrypt.hash(password, 12)

    // Maak gebruiker aan en markeer invite als gebruikt
    await prisma.$transaction([
      prisma.user.create({
        data: {
          email: invite.email,
          name: name || null,
          password: passwordHash,
          role: "GEMEENTE_ADMIN",
          gemeenteNaam: invite.gemeenteNaam,
          gemeenteRollen: invite.gemeenteRollen,
        },
      }),
      prisma.inviteToken.update({
        where: { id: invite.id },
        data: { usedAt: new Date() },
      }),
    ])

    return NextResponse.json({
      success: true,
      message: "Account aangemaakt. Je kunt nu inloggen.",
    })
  } catch (error) {
    console.error("Invite accepteren mislukt:", error)
    return NextResponse.json({ error: "Er ging iets mis" }, { status: 500 })
  }
}
