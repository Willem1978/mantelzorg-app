import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/beheer/activiteiten — alle activiteiten (beheerder)
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.role || !["ADMIN", "ORG_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Geen toegang" }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const woonplaats = searchParams.get("woonplaats")
  const type = searchParams.get("type")
  const gemeente = searchParams.get("gemeente")

  const where: Record<string, unknown> = {}
  if (woonplaats) where.woonplaats = { equals: woonplaats, mode: "insensitive" }
  if (gemeente) where.gemeente = { equals: gemeente, mode: "insensitive" }
  if (type) where.type = type

  // D9: Begrens resultaten om unbounded queries te voorkomen
  const activiteiten = await prisma.activiteit.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    take: 500,
  })

  return NextResponse.json({ activiteiten })
}

// POST /api/beheer/activiteiten — nieuwe activiteit aanmaken
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.role || !["ADMIN", "ORG_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Geen toegang" }, { status: 403 })
  }

  const body = await req.json()
  const { naam, woonplaats, gemeente, type } = body

  if (!naam || !woonplaats || !gemeente || !type) {
    return NextResponse.json({ error: "naam, woonplaats, gemeente en type zijn vereist" }, { status: 400 })
  }

  // S7: Valideer type tegen toegestane waarden
  const ALLOWED_TYPES = ["LOTGENOTEN", "SPORT", "SOCIAAL", "EDUCATIE", "RESPIJTZORG", "OVERIG"]
  if (!ALLOWED_TYPES.includes(type)) {
    return NextResponse.json({ error: `type moet een van: ${ALLOWED_TYPES.join(", ")}` }, { status: 400 })
  }

  const activiteit = await prisma.activiteit.create({
    data: {
      naam,
      beschrijving: body.beschrijving || null,
      locatie: body.locatie || null,
      adres: body.adres || null,
      woonplaats,
      gemeente,
      type,
      frequentie: body.frequentie || null,
      dag: body.dag || null,
      tijd: body.tijd || null,
      kosten: body.kosten || null,
      contactNaam: body.contactNaam || null,
      contactTelefoon: body.contactTelefoon || null,
      contactEmail: body.contactEmail || null,
      website: body.website || null,
      bronUrl: body.bronUrl || null,
      isGevalideerd: body.isGevalideerd ?? false,
    },
  })

  return NextResponse.json({ activiteit }, { status: 201 })
}

// PATCH /api/beheer/activiteiten — update activiteit
export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.role || !["ADMIN", "ORG_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Geen toegang" }, { status: 403 })
  }

  const body = await req.json()
  const { id } = body

  if (!id) {
    return NextResponse.json({ error: "id is vereist" }, { status: 400 })
  }

  // S1: Alleen toegestane velden accepteren (geen mass assignment)
  const allowedFields: Record<string, unknown> = {}
  const ALLOWED_KEYS = [
    "naam", "beschrijving", "locatie", "adres", "woonplaats", "gemeente",
    "type", "frequentie", "dag", "tijd", "kosten", "contactNaam",
    "contactTelefoon", "contactEmail", "website", "bronUrl",
    "isGevalideerd", "isActief",
  ]
  for (const key of ALLOWED_KEYS) {
    if (key in body) allowedFields[key] = body[key]
  }

  const activiteit = await prisma.activiteit.update({
    where: { id },
    data: allowedFields,
  })

  return NextResponse.json({ activiteit })
}

// DELETE /api/beheer/activiteiten — verwijder activiteit
export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.role || !["ADMIN", "ORG_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Geen toegang" }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")

  if (!id) {
    return NextResponse.json({ error: "id parameter vereist" }, { status: 400 })
  }

  await prisma.activiteit.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
