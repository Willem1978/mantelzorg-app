import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logAudit } from "@/lib/audit"

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Niet geautoriseerd" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const zoek = searchParams.get("zoek") || ""

  try {
    const where: Record<string, unknown> = {}
    if (zoek) {
      where.OR = [
        { naam: { contains: zoek, mode: "insensitive" } },
        { code: { contains: zoek, mode: "insensitive" } },
      ]
    }

    const gemeenten = await prisma.gemeente.findMany({
      where,
      orderBy: { naam: "asc" },
    })

    return NextResponse.json({ gemeenten })
  } catch (error) {
    console.error("Gemeenten ophalen mislukt:", error)
    return NextResponse.json({ error: "Gemeenten ophalen mislukt" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Niet geautoriseerd" }, { status: 401 })
  }

  try {
    const body = await request.json()

    if (!body.naam?.trim()) {
      return NextResponse.json({ error: "Gemeente naam is verplicht" }, { status: 400 })
    }

    const gemeente = await prisma.gemeente.create({
      data: {
        naam: body.naam.trim(),
        code: body.code?.trim() || null,
        isActief: body.isActief !== false,
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
      actie: "CREATE",
      entiteit: "Gemeente",
      entiteitId: gemeente.id,
      details: { naam: gemeente.naam },
    })

    return NextResponse.json({ gemeente }, { status: 201 })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : ""
    if (msg.includes("Unique constraint")) {
      return NextResponse.json({ error: "Deze gemeente bestaat al" }, { status: 409 })
    }
    console.error("Gemeente aanmaken mislukt:", error)
    return NextResponse.json({ error: "Gemeente aanmaken mislukt" }, { status: 500 })
  }
}
