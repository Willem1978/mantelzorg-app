import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// DELETE - Favoriet verwijderen
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.caregiverId) {
      return NextResponse.json(
        { error: "Je moet ingelogd zijn" },
        { status: 401 }
      )
    }

    const { id } = await params

    // Controleer eigenaarschap
    const favoriet = await prisma.favoriet.findFirst({
      where: { id, caregiverId: session.user.caregiverId },
    })

    if (!favoriet) {
      return NextResponse.json(
        { error: "Favoriet niet gevonden" },
        { status: 404 }
      )
    }

    await prisma.favoriet.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Favoriet delete error:", error)
    return NextResponse.json(
      { error: "Er ging iets mis bij het verwijderen" },
      { status: 500 }
    )
  }
}

// PATCH - Favoriet voltooien/ongedaan maken
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.caregiverId) {
      return NextResponse.json(
        { error: "Je moet ingelogd zijn" },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await request.json()

    // Controleer eigenaarschap
    const favoriet = await prisma.favoriet.findFirst({
      where: { id, caregiverId: session.user.caregiverId },
    })

    if (!favoriet) {
      return NextResponse.json(
        { error: "Favoriet niet gevonden" },
        { status: 404 }
      )
    }

    const updated = await prisma.favoriet.update({
      where: { id },
      data: {
        isVoltooid: body.isVoltooid,
        voltooitOp: body.isVoltooid ? new Date() : null,
      },
    })

    return NextResponse.json({ favoriet: updated })
  } catch (error) {
    console.error("Favoriet update error:", error)
    return NextResponse.json(
      { error: "Er ging iets mis bij het bijwerken" },
      { status: 500 }
    )
  }
}
