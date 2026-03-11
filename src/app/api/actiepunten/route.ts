import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logAudit } from "@/lib/audit"

export const dynamic = "force-dynamic"

// GET: Haal open actiepunten op voor de ingelogde gebruiker
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 })
  }

  const caregiver = await prisma.caregiver.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  })

  if (!caregiver) {
    return NextResponse.json({ actiepunten: [] })
  }

  const actiepunten = await prisma.task.findMany({
    where: {
      caregiverId: caregiver.id,
      status: { in: ["TODO", "IN_PROGRESS"] },
    },
    select: {
      id: true,
      title: true,
      description: true,
      category: true,
      priority: true,
      status: true,
      isSuggested: true,
      suggestedReason: true,
      dueDate: true,
      createdAt: true,
    },
    orderBy: [
      { priority: "desc" },
      { createdAt: "desc" },
    ],
    take: 10,
  })

  return NextResponse.json({ actiepunten })
}

// PATCH: Update status van een actiepunt (TODO → COMPLETED of andersom)
export async function PATCH(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 })
  }

  const body = await request.json()
  const { id, status } = body as { id?: string; status?: string }

  if (!id || !status) {
    return NextResponse.json({ error: "ID en status zijn verplicht" }, { status: 400 })
  }

  const validStatuses = ["TODO", "IN_PROGRESS", "COMPLETED", "CANCELLED"]
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: "Ongeldige status" }, { status: 400 })
  }

  // Controleer eigenaarschap
  const caregiver = await prisma.caregiver.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  })

  if (!caregiver) {
    return NextResponse.json({ error: "Profiel niet gevonden" }, { status: 404 })
  }

  const task = await prisma.task.findFirst({
    where: { id, caregiverId: caregiver.id },
  })

  if (!task) {
    return NextResponse.json({ error: "Actiepunt niet gevonden" }, { status: 404 })
  }

  const updated = await prisma.task.update({
    where: { id },
    data: {
      status: status as "TODO" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED",
      completedAt: status === "COMPLETED" ? new Date() : null,
    },
  })

  await logAudit({
    userId: session.user.id,
    actie: "UPDATE",
    entiteit: "Task",
    entiteitId: id,
    details: { oldStatus: task.status, newStatus: status },
  })

  return NextResponse.json({ actiepunt: updated })
}
