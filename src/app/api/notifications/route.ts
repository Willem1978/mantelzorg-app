import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET - Fetch user notifications
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Je moet ingelogd zijn" },
        { status: 401 }
      )
    }

    const notifications = await prisma.notification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    })

    return NextResponse.json({ notifications })
  } catch (error) {
    console.error("Notifications fetch error:", error)
    return NextResponse.json(
      { error: "Er ging iets mis bij het ophalen" },
      { status: 500 }
    )
  }
}

// POST - Create a new notification (internal use)
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Je moet ingelogd zijn" },
        { status: 401 }
      )
    }

    const body = await request.json()

    const notification = await prisma.notification.create({
      data: {
        userId: session.user.id,
        type: body.type || "SYSTEM",
        title: body.title,
        message: body.message,
        link: body.link,
        scheduledFor: body.scheduledFor ? new Date(body.scheduledFor) : null,
      }
    })

    return NextResponse.json({ notification })
  } catch (error) {
    console.error("Notification create error:", error)
    return NextResponse.json(
      { error: "Er ging iets mis bij het aanmaken" },
      { status: 500 }
    )
  }
}
