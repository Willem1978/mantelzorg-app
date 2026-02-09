import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET: Lichtgewicht endpoint voor alleen gemeente data
// Gebruikt door leren- en gemeente-nieuws pagina's ipv het zware /api/dashboard
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.caregiverId) {
      return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 })
    }

    const caregiver = await prisma.caregiver.findUnique({
      where: { id: session.user.caregiverId },
      select: {
        municipality: true,
        careRecipientMunicipality: true,
      },
    })

    if (!caregiver) {
      return NextResponse.json({ error: "Profiel niet gevonden" }, { status: 404 })
    }

    return NextResponse.json({
      mantelzorger: caregiver.municipality || null,
      zorgvrager: caregiver.careRecipientMunicipality || null,
    })
  } catch (error) {
    console.error("Gemeente GET error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
