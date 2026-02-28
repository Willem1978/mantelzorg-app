import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

// GET - Haal berichten op voor een match
export async function GET(
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

    // Controleer dat gebruiker deel uitmaakt van deze match
    const match = await prisma.buddyMatch.findUnique({
      where: { id: matchId },
      include: {
        buddy: { select: { userId: true, voornaam: true } },
        caregiver: { select: { userId: true, user: { select: { name: true } } } },
      },
    })

    if (!match) {
      return NextResponse.json(
        { error: "Match niet gevonden" },
        { status: 404 }
      )
    }

    const isBuddy = match.buddy.userId === session.user.id
    const isCaregiver = match.caregiver.userId === session.user.id

    if (!isBuddy && !isCaregiver) {
      return NextResponse.json(
        { error: "Geen toegang tot deze chat" },
        { status: 403 }
      )
    }

    // Haal berichten op
    const berichten = await prisma.bericht.findMany({
      where: { matchId },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        inhoud: true,
        afzenderId: true,
        isGelezen: true,
        createdAt: true,
      },
    })

    // Markeer ongelezen berichten als gelezen
    await prisma.bericht.updateMany({
      where: {
        matchId,
        afzenderId: { not: session.user.id },
        isGelezen: false,
      },
      data: {
        isGelezen: true,
        gelezenOp: new Date(),
      },
    })

    return NextResponse.json({
      berichten,
      match: {
        id: match.id,
        status: match.status,
        buddyNaam: match.buddy.voornaam,
        mantelzorgerNaam: match.caregiver.user?.name?.split(" ")[0] || "Mantelzorger",
      },
      mijnUserId: session.user.id,
    })
  } catch (error) {
    console.error("Berichten GET error:", error)
    return NextResponse.json(
      { error: "Er ging iets mis" },
      { status: 500 }
    )
  }
}

// POST - Stuur een bericht
export async function POST(
  request: NextRequest,
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
    const body = await request.json()

    if (!body.inhoud?.trim()) {
      return NextResponse.json(
        { error: "Bericht mag niet leeg zijn" },
        { status: 400 }
      )
    }

    // Controleer dat gebruiker deel uitmaakt van deze match
    const match = await prisma.buddyMatch.findUnique({
      where: { id: matchId },
      include: {
        buddy: { select: { userId: true, voornaam: true } },
        caregiver: { select: { userId: true, user: { select: { name: true } } } },
      },
    })

    if (!match) {
      return NextResponse.json(
        { error: "Match niet gevonden" },
        { status: 404 }
      )
    }

    if (match.status !== "ACTIEF") {
      return NextResponse.json(
        { error: "Deze match is niet actief" },
        { status: 400 }
      )
    }

    const isBuddy = match.buddy.userId === session.user.id
    const isCaregiver = match.caregiver.userId === session.user.id

    if (!isBuddy && !isCaregiver) {
      return NextResponse.json(
        { error: "Geen toegang tot deze chat" },
        { status: 403 }
      )
    }

    // Maak bericht + notificatie
    const bericht = await prisma.$transaction(async (tx) => {
      const b = await tx.bericht.create({
        data: {
          matchId,
          afzenderId: session.user.id,
          inhoud: body.inhoud.trim(),
        },
      })

      // Notificatie voor de ontvanger
      const ontvangerId = isBuddy ? match.caregiver.userId : match.buddy.userId
      const afzenderNaam = isBuddy ? match.buddy.voornaam : (match.caregiver.user?.name?.split(" ")[0] || "Mantelzorger")

      if (ontvangerId) {
        await tx.notification.create({
          data: {
            userId: ontvangerId,
            type: "BUDDY_BERICHT",
            title: "Nieuw bericht",
            message: `${afzenderNaam}: ${body.inhoud.trim().substring(0, 80)}${body.inhoud.trim().length > 80 ? "..." : ""}`,
            link: isBuddy ? `/marktplaats` : `/buddy/dashboard`,
          },
        })
      }

      return b
    })

    return NextResponse.json({ bericht })
  } catch (error) {
    console.error("Berichten POST error:", error)
    return NextResponse.json(
      { error: "Er ging iets mis bij het versturen" },
      { status: 500 }
    )
  }
}
