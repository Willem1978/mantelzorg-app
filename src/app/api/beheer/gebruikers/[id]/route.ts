import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logAudit } from "@/lib/audit"
import bcrypt from "bcryptjs"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Niet geautoriseerd" }, { status: 401 })
  }

  const { id } = await params

  try {
    const gebruiker = await prisma.user.findUnique({
      where: { id },
      include: {
        caregiver: {
          include: {
            belastbaarheidTests: {
              where: { isCompleted: true },
              orderBy: { completedAt: "desc" },
              take: 10,
              select: {
                id: true,
                totaleBelastingScore: true,
                belastingNiveau: true,
                totaleZorguren: true,
                completedAt: true,
                createdAt: true,
              },
            },
            monthlyCheckIns: {
              orderBy: { month: "desc" },
              take: 12,
              select: {
                id: true,
                month: true,
                overallWellbeing: true,
                completedAt: true,
              },
            },
            helpRequests: {
              orderBy: { createdAt: "desc" },
              take: 5,
              select: {
                id: true,
                title: true,
                category: true,
                status: true,
                urgency: true,
                createdAt: true,
              },
            },
            buddyMatches: {
              include: {
                buddy: {
                  select: {
                    voornaam: true,
                    achternaam: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
        mantelBuddy: {
          include: {
            matches: {
              include: {
                caregiver: {
                  select: {
                    user: {
                      select: { name: true, email: true },
                    },
                  },
                },
              },
            },
            ontvangenBeoordelingen: {
              orderBy: { createdAt: "desc" },
              take: 5,
            },
          },
        },
      },
    })

    if (!gebruiker) {
      return NextResponse.json({ error: "Gebruiker niet gevonden" }, { status: 404 })
    }

    // Haal alarm logs op als er tests zijn
    let alarmen: any[] = []
    if (gebruiker.caregiver?.belastbaarheidTests.length) {
      const testIds = gebruiker.caregiver.belastbaarheidTests.map((t) => t.id)
      alarmen = await prisma.alarmLog.findMany({
        where: { testId: { in: testIds } },
        orderBy: { createdAt: "desc" },
        take: 10,
      })
    }

    return NextResponse.json({
      gebruiker: {
        id: gebruiker.id,
        email: gebruiker.email,
        name: gebruiker.name,
        role: gebruiker.role,
        isActive: (gebruiker as any).isActive ?? true,
        adminNotities: (gebruiker as any).adminNotities || null,
        createdAt: gebruiker.createdAt,
        updatedAt: gebruiker.updatedAt,
        emailVerified: gebruiker.emailVerified,
        caregiver: gebruiker.caregiver
          ? {
              id: gebruiker.caregiver.id,
              phoneNumber: gebruiker.caregiver.phoneNumber,
              municipality: gebruiker.caregiver.municipality,
              city: gebruiker.caregiver.city,
              careRecipient: gebruiker.caregiver.careRecipient,
              careHoursPerWeek: gebruiker.caregiver.careHoursPerWeek,
              onboardedAt: gebruiker.caregiver.onboardedAt,
              profileCompleted: gebruiker.caregiver.profileCompleted,
              tests: gebruiker.caregiver.belastbaarheidTests,
              checkIns: gebruiker.caregiver.monthlyCheckIns,
              helpRequests: gebruiker.caregiver.helpRequests,
              buddyMatches: gebruiker.caregiver.buddyMatches,
            }
          : null,
        mantelBuddy: gebruiker.mantelBuddy,
        alarmen,
      },
    })
  } catch (error) {
    console.error("Gebruiker ophalen mislukt:", error)
    return NextResponse.json({ error: "Gebruiker ophalen mislukt" }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Niet geautoriseerd" }, { status: 401 })
  }

  const { id } = await params
  const body = await request.json()

  try {
    const updateData: any = {}
    const auditDetails: Record<string, any> = {}

    if (body.role) {
      updateData.role = body.role
      auditDetails.role = body.role
    }

    if (body.name !== undefined) {
      updateData.name = body.name
      auditDetails.name = body.name
    }

    if (body.isActive !== undefined) {
      updateData.isActive = body.isActive
      auditDetails.isActive = body.isActive
    }

    if (body.adminNotities !== undefined) {
      updateData.adminNotities = body.adminNotities || null
      auditDetails.adminNotities = "bijgewerkt"
    }

    if (body.resetPassword) {
      const hashedPassword = await bcrypt.hash(body.resetPassword, 12)
      updateData.password = hashedPassword
      updateData.sessionVersion = { increment: 1 }
      auditDetails.wachtwoordReset = true
    }

    const gebruiker = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
      },
    })

    await logAudit({
      userId: session.user.id!,
      actie: "UPDATE",
      entiteit: "User",
      entiteitId: id,
      details: auditDetails,
    })

    return NextResponse.json({ gebruiker })
  } catch (error) {
    console.error("Gebruiker bijwerken mislukt:", error)
    return NextResponse.json({ error: "Gebruiker bijwerken mislukt" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Niet geautoriseerd" }, { status: 401 })
  }

  const { id } = await params

  // Voorkom verwijdering eigen account
  if (id === session.user.id) {
    return NextResponse.json({ error: "Je kunt je eigen account niet verwijderen" }, { status: 400 })
  }

  try {
    const gebruiker = await prisma.user.findUnique({
      where: { id },
      select: { email: true, name: true },
    })

    if (!gebruiker) {
      return NextResponse.json({ error: "Gebruiker niet gevonden" }, { status: 404 })
    }

    await prisma.user.delete({ where: { id } })

    await logAudit({
      userId: session.user.id!,
      actie: "DELETE",
      entiteit: "User",
      entiteitId: id,
      details: { email: gebruiker.email, name: gebruiker.name },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Gebruiker verwijderen mislukt:", error)
    return NextResponse.json({ error: "Gebruiker verwijderen mislukt" }, { status: 500 })
  }
}
