import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// POST: Sla onboarding profieldata op
export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.caregiverId) {
      return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 })
    }

    const body = await request.json()
    const { gemeente, careRecipient, careHoursPerWeek, careSinceDuration } = body

    // Bereken careHoursPerWeek als gemiddeld getal
    const hoursMap: Record<string, number> = {
      "0-5": 3,
      "5-10": 8,
      "10-20": 15,
      "20-40": 30,
      "40+": 45,
    }
    const hours = hoursMap[careHoursPerWeek] || null

    // Bereken careSince als datum
    const durationMap: Record<string, number> = {
      "<1": 0,
      "1-3": 2,
      "3-5": 4,
      "5+": 6,
    }
    let careSince: Date | null = null
    if (careSinceDuration && durationMap[careSinceDuration] !== undefined) {
      const yearsAgo = durationMap[careSinceDuration]
      careSince = new Date()
      careSince.setFullYear(careSince.getFullYear() - yearsAgo)
    }

    // Update caregiver profiel
    await prisma.caregiver.update({
      where: { id: session.user.caregiverId },
      data: {
        ...(gemeente ? { municipality: gemeente } : {}),
        ...(careRecipient ? { careRecipient } : {}),
        ...(hours !== null ? { careHoursPerWeek: hours } : {}),
        ...(careSince ? { careSince } : {}),
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Onboarding profiel error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
