import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

// GET - Fetch calendar events
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

    // Get query params for date range
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("start")
    const endDate = searchParams.get("end")

    const where: any = { caregiverId: caregiver.id }

    if (startDate && endDate) {
      where.startTime = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
    }

    const events = await prisma.calendarEvent.findMany({
      where,
      orderBy: { startTime: "asc" },
    })

    return NextResponse.json({ events })
  } catch (error) {
    console.error("Calendar fetch error:", error)
    return NextResponse.json(
      { error: "Er ging iets mis bij het ophalen" },
      { status: 500 }
    )
  }
}

// POST - Create new calendar event
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

    if (!body.title || !body.startTime) {
      return NextResponse.json(
        { error: "Titel en starttijd zijn verplicht" },
        { status: 400 }
      )
    }

    const event = await prisma.calendarEvent.create({
      data: {
        caregiverId: caregiver.id,
        title: body.title,
        description: body.description || null,
        location: body.location || null,
        startTime: new Date(body.startTime),
        endTime: body.endTime ? new Date(body.endTime) : null,
        isAllDay: body.isAllDay || false,
        eventType: body.eventType || "OTHER",
        reminderMinutes: body.reminderMinutes || null,
        color: body.color || null,
      }
    })

    // Create reminder notification if set
    if (body.reminderMinutes) {
      const reminderTime = new Date(new Date(body.startTime).getTime() - body.reminderMinutes * 60 * 1000)

      if (reminderTime > new Date()) {
        await prisma.notification.create({
          data: {
            userId: session.user.id,
            type: "TASK_REMINDER",
            title: `Herinnering: ${body.title}`,
            message: `Over ${body.reminderMinutes} minuten: ${body.title}`,
            link: "/agenda",
            scheduledFor: reminderTime,
          }
        })
      }
    }

    return NextResponse.json({ event })
  } catch (error) {
    console.error("Calendar create error:", error)
    return NextResponse.json(
      { error: "Er ging iets mis bij het aanmaken" },
      { status: 500 }
    )
  }
}
