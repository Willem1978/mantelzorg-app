import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logAudit } from "@/lib/audit"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Niet geautoriseerd" }, { status: 401 })
  }

  const { id } = await params
  const body = await request.json()

  try {
    const updateData: any = {}

    if (body.isAfgehandeld !== undefined) {
      updateData.isAfgehandeld = body.isAfgehandeld
      if (body.isAfgehandeld) {
        updateData.afgehandeldOp = new Date()
        updateData.afgehandeldDoor = session.user.id
      }
    }

    if (body.notitie !== undefined) {
      updateData.notitie = body.notitie
    }

    const alarm = await prisma.alarmLog.update({
      where: { id },
      data: updateData,
    })

    await logAudit({
      userId: session.user.id!,
      actie: "UPDATE",
      entiteit: "Alarm",
      entiteitId: id,
      details: { isAfgehandeld: body.isAfgehandeld, notitie: body.notitie ? "bijgewerkt" : undefined },
    })

    return NextResponse.json({ alarm })
  } catch (error) {
    console.error("Alarm bijwerken mislukt:", error)
    return NextResponse.json({ error: "Alarm bijwerken mislukt" }, { status: 500 })
  }
}
