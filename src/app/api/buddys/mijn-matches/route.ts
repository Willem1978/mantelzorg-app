import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

// GET - Haal actieve matches op voor de ingelogde buddy
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Je moet ingelogd zijn" },
        { status: 401 }
      )
    }

    const buddy = await prisma.mantelBuddy.findUnique({
      where: { userId: session.user.id },
    })

    if (!buddy) {
      return NextResponse.json(
        { error: "Geen buddy profiel gevonden" },
        { status: 404 }
      )
    }

    const buddyMatches = await prisma.buddyMatch.findMany({
      where: {
        buddyId: buddy.id,
        status: { in: ["ACTIEF", "CAREGIVER_AKKOORD"] },
      },
      orderBy: { updatedAt: "desc" },
      include: {
        caregiver: {
          select: {
            id: true,
            user: { select: { name: true } },
          },
        },
        taakReacties: {
          where: { buddyId: buddy.id },
          include: {
            taak: {
              select: { titel: true, status: true },
            },
          },
        },
      },
    })

    // Tel ongelezen berichten per match
    const matchesMetOngelezen = await Promise.all(
      buddyMatches.map(async (m) => {
        const ongelezen = await prisma.bericht.count({
          where: {
            matchId: m.id,
            afzenderId: { not: session.user.id },
            isGelezen: false,
          },
        })

        return {
          id: m.id,
          status: m.status,
          buddyNaam: buddy.voornaam,
          mantelzorgerNaam: m.caregiver.user?.name?.split(" ")[0] || "Mantelzorger",
          caregiverId: m.caregiver.id,
          taakReacties: m.taakReacties.map((tr) => ({
            taak: {
              titel: tr.taak.titel,
              status: tr.taak.status,
            },
          })),
          ongelezen,
        }
      })
    )

    return NextResponse.json({ matches: matchesMetOngelezen })
  } catch (error) {
    console.error("Mijn matches GET error:", error)
    return NextResponse.json(
      { error: "Er ging iets mis" },
      { status: 500 }
    )
  }
}
