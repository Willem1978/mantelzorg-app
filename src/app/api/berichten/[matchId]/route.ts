import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { sendNieuwBerichtEmail } from "@/lib/email"
import { sanitizeText } from "@/lib/sanitize"

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
    const inhoud = sanitizeText(body.inhoud || "").trim()

    if (!inhoud) {
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
        caregiver: { select: { userId: true, user: { select: { name: true, email: true } } } },
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
          inhoud: inhoud,
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
            message: `${afzenderNaam}: ${inhoud.substring(0, 80)}${inhoud.length > 80 ? "..." : ""}`,
            link: isBuddy ? `/buddys` : `/buddy/dashboard`,
          },
        })
      }

      return b
    })

    // Email notificatie (alleen als ontvanger geen recente ongelezen berichten heeft)
    const ontvangerId = isBuddy ? match.caregiver.userId : match.buddy.userId
    if (ontvangerId) {
      const ongelezen = await prisma.bericht.count({
        where: {
          matchId,
          afzenderId: session.user.id,
          isGelezen: false,
        },
      })
      // Stuur alleen email bij het eerste ongelezen bericht (niet bij elk volgend)
      if (ongelezen <= 1) {
        const afzenderNaam = isBuddy ? match.buddy.voornaam : (match.caregiver.user?.name?.split(" ")[0] || "Mantelzorger")
        const ontvangerEmail = isBuddy ? match.caregiver.user?.email : match.buddy.userId
          ? await prisma.user.findUnique({ where: { id: match.buddy.userId }, select: { email: true } }).then(u => u?.email)
          : null
        const ontvangerNaam = isBuddy
          ? (match.caregiver.user?.name?.split(" ")[0] || "Mantelzorger")
          : match.buddy.voornaam
        const preview = inhoud.substring(0, 100)

        if (ontvangerEmail) {
          sendNieuwBerichtEmail(ontvangerEmail, ontvangerNaam, afzenderNaam, preview).catch(() => {})
        }
      }
    }

    return NextResponse.json({ bericht })
  } catch (error) {
    console.error("Berichten POST error:", error)
    return NextResponse.json(
      { error: "Er ging iets mis bij het versturen" },
      { status: 500 }
    )
  }
}
