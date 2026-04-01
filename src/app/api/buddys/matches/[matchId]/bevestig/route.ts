import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { sendMatchActiefEmail } from "@/lib/email"

// POST - Buddy bevestigt een match (double opt-in stap 2)
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Je moet ingelogd zijn" },
        { status: 401 }
      )
    }

    const { matchId } = await params

    // Zoek de buddy
    const buddy = await prisma.mantelBuddy.findUnique({
      where: { userId: session.user.id },
    })

    if (!buddy) {
      return NextResponse.json(
        { error: "Geen buddy profiel gevonden" },
        { status: 404 }
      )
    }

    // Haal de match op en controleer eigenaarschap
    const match = await prisma.buddyMatch.findUnique({
      where: { id: matchId },
      include: {
        caregiver: {
          select: { userId: true, user: { select: { name: true, email: true } } },
        },
      },
    })

    if (!match) {
      return NextResponse.json(
        { error: "Match niet gevonden" },
        { status: 404 }
      )
    }

    if (match.buddyId !== buddy.id) {
      return NextResponse.json(
        { error: "Geen toegang tot deze match" },
        { status: 403 }
      )
    }

    if (match.status !== "CAREGIVER_AKKOORD") {
      return NextResponse.json(
        { error: "Deze match kan niet bevestigd worden" },
        { status: 400 }
      )
    }

    // D10: Bevestig de match met status-check in where clause (voorkomt race condition)
    await prisma.$transaction(async (tx) => {
      const updated = await tx.buddyMatch.updateMany({
        where: { id: matchId, status: "CAREGIVER_AKKOORD" },
        data: { status: "ACTIEF" },
      })
      if (updated.count === 0) {
        throw new Error("Match status is al gewijzigd door een ander verzoek")
      }

      // Notificatie voor de mantelzorger
      if (match.caregiver.userId) {
        await tx.notification.create({
          data: {
            userId: match.caregiver.userId,
            type: "REACTIE_GEACCEPTEERD",
            title: "Match bevestigd!",
            message: `${buddy.voornaam} heeft de match bevestigd. Jullie kunnen nu chatten.`,
            link: "/buddys",
          },
        })
      }
    })

    // Email notificatie naar mantelzorger (fire-and-forget)
    if (match.caregiver.user?.email) {
      const voornaam = match.caregiver.user.name?.split(" ")[0] || "Mantelzorger"
      sendMatchActiefEmail(match.caregiver.user.email, voornaam, buddy.voornaam).catch(() => {})
    }

    return NextResponse.json({ status: "bevestigd" })
  } catch (error) {
    console.error("Match bevestig POST error:", error)
    return NextResponse.json(
      { error: "Er ging iets mis" },
      { status: 500 }
    )
  }
}

// DELETE - Buddy wijst match af
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Je moet ingelogd zijn" },
        { status: 401 }
      )
    }

    const { matchId } = await params

    const buddy = await prisma.mantelBuddy.findUnique({
      where: { userId: session.user.id },
    })

    if (!buddy) {
      return NextResponse.json(
        { error: "Geen buddy profiel gevonden" },
        { status: 404 }
      )
    }

    const match = await prisma.buddyMatch.findUnique({
      where: { id: matchId },
      include: {
        caregiver: { select: { userId: true } },
      },
    })

    if (!match || match.buddyId !== buddy.id) {
      return NextResponse.json(
        { error: "Match niet gevonden" },
        { status: 404 }
      )
    }

    if (match.status !== "CAREGIVER_AKKOORD") {
      return NextResponse.json(
        { error: "Deze match kan niet afgewezen worden" },
        { status: 400 }
      )
    }

    await prisma.$transaction(async (tx) => {
      // Match naar BEEINDIGD
      await tx.buddyMatch.update({
        where: { id: matchId },
        data: { status: "BEEINDIGD" },
      })

      // Zet gekoppelde taken terug naar OPEN
      await tx.buddyTaak.updateMany({
        where: { toegewezenAan: buddy.id, status: "TOEGEWEZEN" },
        data: { status: "OPEN", toegewezenAan: null },
      })

      // Notificatie voor mantelzorger
      if (match.caregiver.userId) {
        await tx.notification.create({
          data: {
            userId: match.caregiver.userId,
            type: "REACTIE_AFGEWEZEN",
            title: "Match niet bevestigd",
            message: `${buddy.voornaam} kan toch niet helpen. Je hulpvraag is weer open.`,
            link: "/buddys",
          },
        })
      }
    })

    return NextResponse.json({ status: "afgewezen" })
  } catch (error) {
    console.error("Match afwijzen DELETE error:", error)
    return NextResponse.json(
      { error: "Er ging iets mis" },
      { status: 500 }
    )
  }
}
