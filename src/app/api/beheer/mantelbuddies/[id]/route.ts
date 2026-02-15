import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

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

    if (body.status !== undefined) updateData.status = body.status
    if (body.vogGoedgekeurd !== undefined) updateData.vogGoedgekeurd = body.vogGoedgekeurd
    if (body.trainingVoltooid !== undefined) updateData.trainingVoltooid = body.trainingVoltooid
    if (body.isActief !== undefined) updateData.isActief = body.isActief

    // Als status naar GOEDGEKEURD gaat, activeer automatisch
    if (body.status === "GOEDGEKEURD") {
      updateData.isActief = true
    }

    const buddy = await prisma.mantelBuddy.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ buddy })
  } catch (error) {
    console.error("MantelBuddy bijwerken mislukt:", error)
    return NextResponse.json({ error: "MantelBuddy bijwerken mislukt" }, { status: 500 })
  }
}
