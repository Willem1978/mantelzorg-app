import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { getGemeenteSession } from "@/lib/gemeente-auth"
import { prisma } from "@/lib/prisma"
import { gemeenteGebruikerUitnodigingSchema, validateBody } from "@/lib/validations"

export async function GET(request: NextRequest) {
  const { error, gemeenteNaam } = await getGemeenteSession()
  if (error) return error

  try {
    const { searchParams } = new URL(request.url)
    const zoek = searchParams.get("zoek") || ""

    const where = zoek
      ? {
          role: "GEMEENTE_ADMIN" as const,
          gemeenteNaam,
          OR: [
            { email: { contains: zoek, mode: "insensitive" as const } },
            { name: { contains: zoek, mode: "insensitive" as const } },
          ],
        }
      : {
          role: "GEMEENTE_ADMIN" as const,
          gemeenteNaam,
        }

    const gebruikers = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        gemeenteRollen: true,
        isActive: true,
        createdAt: true,
        password: false,
      },
      orderBy: { createdAt: "desc" },
    })

    // Haal ook uitstaande uitnodigingen op
    const uitnodigingen = await prisma.inviteToken.findMany({
      where: {
        gemeenteNaam,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      select: {
        id: true,
        email: true,
        gemeenteRollen: true,
        createdAt: true,
        expiresAt: true,
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ gebruikers, uitnodigingen })
  } catch (error) {
    console.error("Gemeente gebruikers ophalen mislukt:", error)
    return NextResponse.json({ error: "Gebruikers ophalen mislukt" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const { error, gemeenteNaam, userId } = await getGemeenteSession()
  if (error) return error

  try {
    const body = await request.json()
    const validation = validateBody(body, gemeenteGebruikerUitnodigingSchema)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }
    const { email, name, gemeenteRollen: rollen } = validation.data

    // Check of email al bestaat als gebruiker
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: "Dit e-mailadres is al in gebruik" }, { status: 409 })
    }

    // Check of er al een actieve uitnodiging is
    const existingInvite = await prisma.inviteToken.findFirst({
      where: { email, usedAt: null, expiresAt: { gt: new Date() } },
    })
    if (existingInvite) {
      return NextResponse.json({ error: "Er is al een openstaande uitnodiging voor dit e-mailadres" }, { status: 409 })
    }

    // Genereer invite token
    const token = crypto.randomBytes(32).toString("hex")
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 dagen geldig

    await prisma.inviteToken.create({
      data: {
        email,
        token,
        gemeenteNaam,
        gemeenteRollen: rollen,
        invitedBy: userId!,
        expiresAt,
      },
    })

    const uitnodigingsUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/uitnodiging/${token}`

    return NextResponse.json({
      success: true,
      message: "Uitnodiging aangemaakt",
      uitnodigingsUrl,
      naam: name || email,
    })
  } catch (error) {
    console.error("Gemeente gebruiker uitnodigen mislukt:", error)
    return NextResponse.json({ error: "Uitnodigen mislukt" }, { status: 500 })
  }
}
