import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logAudit } from "@/lib/audit"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Niet geautoriseerd" }, { status: 401 })
  }

  const { id } = await params

  try {
    const gemeente = await prisma.gemeente.findUnique({ where: { id } })
    if (!gemeente) {
      return NextResponse.json({ error: "Gemeente niet gevonden" }, { status: 404 })
    }
    return NextResponse.json({ gemeente })
  } catch (error) {
    console.error("Gemeente ophalen mislukt:", error)
    return NextResponse.json({ error: "Gemeente ophalen mislukt" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Niet geautoriseerd" }, { status: 401 })
  }

  const { id } = await params

  try {
    const body = await request.json()

    const gemeente = await prisma.gemeente.update({
      where: { id },
      data: {
        naam: body.naam?.trim(),
        code: body.code?.trim() || null,
        isActief: body.isActief,
        contactEmail: body.contactEmail?.trim() || null,
        contactTelefoon: body.contactTelefoon?.trim() || null,
        websiteUrl: body.websiteUrl?.trim() || null,
        wmoLoketUrl: body.wmoLoketUrl?.trim() || null,
        adviesLaag: body.adviesLaag?.trim() || null,
        adviesGemiddeld: body.adviesGemiddeld?.trim() || null,
        adviesHoog: body.adviesHoog?.trim() || null,
        organisatieLaagId: body.organisatieLaagId || null,
        organisatieGemiddeldId: body.organisatieGemiddeldId || null,
        organisatieHoogId: body.organisatieHoogId || null,
        mantelzorgSteunpunt: body.mantelzorgSteunpunt?.trim() || null,
        mantelzorgSteunpuntNaam: body.mantelzorgSteunpuntNaam?.trim() || null,
        respijtzorgUrl: body.respijtzorgUrl?.trim() || null,
        dagopvangUrl: body.dagopvangUrl?.trim() || null,
        notities: body.notities?.trim() || null,
      },
    })

    await logAudit({
      userId: session.user.id!,
      actie: "UPDATE",
      entiteit: "Gemeente",
      entiteitId: gemeente.id,
      details: { naam: gemeente.naam },
    })

    return NextResponse.json({ gemeente })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : ""
    if (msg.includes("Unique constraint")) {
      return NextResponse.json({ error: "Deze gemeente naam bestaat al" }, { status: 409 })
    }
    console.error("Gemeente bijwerken mislukt:", error)
    return NextResponse.json({ error: "Gemeente bijwerken mislukt" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Niet geautoriseerd" }, { status: 401 })
  }

  const { id } = await params

  try {
    const gemeente = await prisma.gemeente.delete({ where: { id } })

    await logAudit({
      userId: session.user.id!,
      actie: "DELETE",
      entiteit: "Gemeente",
      entiteitId: id,
      details: { naam: gemeente.naam },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Gemeente verwijderen mislukt:", error)
    return NextResponse.json({ error: "Gemeente verwijderen mislukt" }, { status: 500 })
  }
}
