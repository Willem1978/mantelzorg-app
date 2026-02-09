import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// POST: Markeer gebruiker als onboarded (tutorial voltooid)
export async function POST() {
  try {
    const session = await auth()

    if (!session?.user?.caregiverId) {
      return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 })
    }

    await prisma.caregiver.update({
      where: { id: session.user.caregiverId },
      data: { onboardedAt: new Date() },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Onboarded POST error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

// DELETE: Reset onboarded status (tutorial opnieuw bekijken)
export async function DELETE() {
  try {
    const session = await auth()

    if (!session?.user?.caregiverId) {
      return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 })
    }

    await prisma.caregiver.update({
      where: { id: session.user.caregiverId },
      data: { onboardedAt: null },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Onboarded DELETE error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

// GET: Check of gebruiker al onboarded is + haal naam op
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.caregiverId) {
      return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 })
    }

    const caregiver = await prisma.caregiver.findUnique({
      where: { id: session.user.caregiverId },
      select: {
        onboardedAt: true,
        user: {
          select: {
            name: true,
          },
        },
      },
    })

    if (!caregiver) {
      return NextResponse.json({ error: "Profiel niet gevonden" }, { status: 404 })
    }

    return NextResponse.json({
      name: caregiver.user?.name || "",
      onboardedAt: caregiver.onboardedAt,
    })
  } catch (error) {
    console.error("Onboarded GET error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
