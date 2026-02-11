import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET: Haal gelezen nieuws-IDs op
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.caregiverId) {
      return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 })
    }

    const caregiver = await prisma.caregiver.findUnique({
      where: { id: session.user.caregiverId },
      select: { gelezenNieuws: true },
    })

    const ids = Array.isArray(caregiver?.gelezenNieuws)
      ? caregiver.gelezenNieuws
      : []

    return NextResponse.json({ gelezenIds: ids })
  } catch (error) {
    console.error("Gelezen nieuws GET error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

// PUT: Update gelezen nieuws-IDs
export async function PUT(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.caregiverId) {
      return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 })
    }

    const body = await req.json()
    const { gelezenIds } = body

    if (!Array.isArray(gelezenIds)) {
      return NextResponse.json({ error: "gelezenIds moet een array zijn" }, { status: 400 })
    }

    await prisma.caregiver.update({
      where: { id: session.user.caregiverId },
      data: { gelezenNieuws: gelezenIds },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Gelezen nieuws PUT error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
