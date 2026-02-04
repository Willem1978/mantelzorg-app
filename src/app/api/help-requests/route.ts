import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET - Fetch user's help requests
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Je moet ingelogd zijn" },
        { status: 401 }
      )
    }

    const caregiver = await prisma.caregiver.findUnique({
      where: { userId: session.user.id }
    })

    if (!caregiver) {
      return NextResponse.json(
        { error: "Geen mantelzorger profiel gevonden" },
        { status: 404 }
      )
    }

    const helpRequests = await prisma.helpRequest.findMany({
      where: { caregiverId: caregiver.id },
      orderBy: { createdAt: "desc" },
      include: {
        organisation: {
          select: { name: true }
        }
      }
    })

    return NextResponse.json({ helpRequests })
  } catch (error) {
    console.error("Help requests fetch error:", error)
    return NextResponse.json(
      { error: "Er ging iets mis bij het ophalen" },
      { status: 500 }
    )
  }
}

// POST - Create new help request
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Je moet ingelogd zijn" },
        { status: 401 }
      )
    }

    const caregiver = await prisma.caregiver.findUnique({
      where: { userId: session.user.id }
    })

    if (!caregiver) {
      return NextResponse.json(
        { error: "Geen mantelzorger profiel gevonden" },
        { status: 404 }
      )
    }

    const body = await request.json()

    if (!body.title || !body.description || !body.category) {
      return NextResponse.json(
        { error: "Titel, beschrijving en categorie zijn verplicht" },
        { status: 400 }
      )
    }

    const helpRequest = await prisma.helpRequest.create({
      data: {
        caregiverId: caregiver.id,
        title: body.title,
        description: body.description,
        category: body.category,
        urgency: body.urgency || "NORMAL",
        organisationId: body.organisationId || null,
      }
    })

    // Create notification for the user
    await prisma.notification.create({
      data: {
        userId: session.user.id,
        type: "HELP_REQUEST_UPDATE",
        title: "Hulpvraag ingediend",
        message: `Je hulpvraag "${body.title}" is ontvangen.`,
        link: `/hulpvragen/${helpRequest.id}`,
      }
    })

    return NextResponse.json({ helpRequest })
  } catch (error) {
    console.error("Help request create error:", error)
    return NextResponse.json(
      { error: "Er ging iets mis bij het aanmaken" },
      { status: 500 }
    )
  }
}
