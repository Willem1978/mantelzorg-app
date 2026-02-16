import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logAudit } from "@/lib/audit"

export async function GET() {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Niet geautoriseerd" }, { status: 401 })
  }

  try {
    const [
      aantalGebruikers,
      aantalMantelzorgers,
      aantalBuddies,
      aantalArtikelen,
      aantalAlarmenOpen,
      aantalAuditLogs,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: "CAREGIVER" } }),
      prisma.mantelBuddy.count(),
      prisma.artikel.count(),
      prisma.alarmLog.count({ where: { isAfgehandeld: false } }),
      prisma.auditLog.count(),
    ])

    return NextResponse.json({
      systeem: {
        aantalGebruikers,
        aantalMantelzorgers,
        aantalBuddies,
        aantalArtikelen,
        aantalAlarmenOpen,
        aantalAuditLogs,
      },
      drempelwaardes: {
        laagMax: 30,
        gemiddeldMax: 60,
      },
    })
  } catch (error) {
    console.error("Instellingen ophalen mislukt:", error)
    return NextResponse.json({ error: "Instellingen ophalen mislukt" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Niet geautoriseerd" }, { status: 401 })
  }

  try {
    const body = await request.json()

    await logAudit({
      userId: session.user.id!,
      actie: "UPDATE",
      entiteit: "Instellingen",
      details: body,
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Instellingen opslaan mislukt:", error)
    return NextResponse.json({ error: "Instellingen opslaan mislukt" }, { status: 500 })
  }
}
