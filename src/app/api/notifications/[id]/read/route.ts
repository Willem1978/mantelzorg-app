import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// POST - Mark single notification as read
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Je moet ingelogd zijn" },
        { status: 401 }
      )
    }

    const { id } = await params

    await prisma.notification.updateMany({
      where: {
        id,
        userId: session.user.id,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Mark read error:", error)
    return NextResponse.json(
      { error: "Er ging iets mis" },
      { status: 500 }
    )
  }
}
