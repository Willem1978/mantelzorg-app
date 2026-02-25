import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logAudit } from "@/lib/audit"

const DREMPEL_DEFAULTS = { laagMax: 30, gemiddeldMax: 60 }

async function getDrempelwaardes() {
  try {
    const settings = await prisma.siteSettings.findMany({
      where: { sleutel: { startsWith: "drempel." } },
    })
    const map: Record<string, string> = {}
    for (const s of settings) map[s.sleutel] = s.waarde
    return {
      laagMax: parseInt(map["drempel.laagMax"] || "") || DREMPEL_DEFAULTS.laagMax,
      gemiddeldMax: parseInt(map["drempel.gemiddeldMax"] || "") || DREMPEL_DEFAULTS.gemiddeldMax,
    }
  } catch {
    return DREMPEL_DEFAULTS
  }
}

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
      drempelwaardes,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: "CAREGIVER" } }),
      prisma.mantelBuddy.count(),
      prisma.artikel.count(),
      prisma.alarmLog.count({ where: { isAfgehandeld: false } }),
      prisma.auditLog.count(),
      getDrempelwaardes(),
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
      drempelwaardes,
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

    // Sla drempelwaardes op in SiteSettings
    if (body.drempelwaardes) {
      const { laagMax, gemiddeldMax } = body.drempelwaardes
      for (const [key, value] of Object.entries({ laagMax, gemiddeldMax })) {
        if (value !== undefined) {
          await prisma.siteSettings.upsert({
            where: { sleutel: `drempel.${key}` },
            update: {
              waarde: String(value),
              updatedBy: session.user.id,
            },
            create: {
              categorie: "instellingen",
              sleutel: `drempel.${key}`,
              waarde: String(value),
              label: key === "laagMax" ? "Drempel laag maximum" : "Drempel gemiddeld maximum",
              type: "text",
              groep: "Drempelwaardes",
              updatedBy: session.user.id,
            },
          })
        }
      }
    }

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
