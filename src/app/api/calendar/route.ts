import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { calendarEventSchema, validateBody } from "@/lib/validations"

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
    const validation = validateBody(body, calendarEventSchema)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }
    const data = validation.data

    const event = await prisma.calendarEvent.create({
      data: {
        caregiverId: caregiver.id,
        title: data.title,
        description: data.description || null,
        location: data.location || null,
        startTime: new Date(data.startTime),
        endTime: data.endTime ? new Date(data.endTime) : null,
        isAllDay: data.isAllDay,
        eventType: data.eventType || "OTHER",
        reminderMinutes: data.reminderMinutes || null,
        color: data.color || null,
      }
    })

    // Create reminder notification if set
    if (data.reminderMinutes) {
      const reminderTime = new Date(new Date(data.startTime).getTime() - data.reminderMinutes * 60 * 1000)

      if (reminderTime > new Date()) {
        await prisma.notification.create({
          data: {
            userId: session.user.id,
            type: "TASK_REMINDER",
            title: `Herinnering: ${data.title}`,
            message: `Over ${data.reminderMinutes} minuten: ${data.title}`,
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
