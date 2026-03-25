import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/artikel-interactie?artikelId=xxx — haal interactie op voor huidig artikel
// GET /api/artikel-interactie?all=true — haal alle interacties op voor dashboard
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 })
  }

  const caregiver = await prisma.caregiver.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  })
  if (!caregiver) {
    return NextResponse.json({ error: "Geen mantelzorger-profiel" }, { status: 404 })
  }

  const { searchParams } = new URL(req.url)
  const artikelId = searchParams.get("artikelId")
  const all = searchParams.get("all")

  // Eén specifiek artikel
  if (artikelId) {
    const interactie = await prisma.artikelInteractie.findUnique({
      where: {
        caregiverId_artikelId: {
          caregiverId: caregiver.id,
          artikelId,
        },
      },
    })
    return NextResponse.json({ interactie: interactie || null })
  }

  // Alle interacties (voor dashboard)
  if (all === "true") {
    const interacties = await prisma.artikelInteractie.findMany({
      where: { caregiverId: caregiver.id },
      select: {
        artikelId: true,
        gelezen: true,
        gelezenOp: true,
        rating: true,
      },
    })
    return NextResponse.json({ interacties })
  }

  return NextResponse.json({ error: "artikelId of all parameter vereist" }, { status: 400 })
}

// POST /api/artikel-interactie — markeer als gelezen of geef rating
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 })
  }

  const caregiver = await prisma.caregiver.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  })
  if (!caregiver) {
    return NextResponse.json({ error: "Geen mantelzorger-profiel" }, { status: 404 })
  }

  const body = await req.json()
  const { artikelId, gelezen, rating } = body as {
    artikelId: string
    gelezen?: boolean
    rating?: number | null
  }

  if (!artikelId) {
    return NextResponse.json({ error: "artikelId is vereist" }, { status: 400 })
  }

  // Valideer rating waarde
  if (rating !== undefined && rating !== null && ![1, 2].includes(rating)) {
    return NextResponse.json({ error: "rating moet 1 (omlaag) of 2 (omhoog) zijn" }, { status: 400 })
  }

  // Upsert: maak aan of update
  const data: Record<string, unknown> = {}
  if (gelezen !== undefined) {
    data.gelezen = gelezen
    if (gelezen) data.gelezenOp = new Date()
  }
  if (rating !== undefined) {
    data.rating = rating
    if (rating !== null) data.ratingOp = new Date()
  }

  const interactie = await prisma.artikelInteractie.upsert({
    where: {
      caregiverId_artikelId: {
        caregiverId: caregiver.id,
        artikelId,
      },
    },
    create: {
      caregiverId: caregiver.id,
      artikelId,
      gelezen: gelezen ?? false,
      gelezenOp: gelezen ? new Date() : null,
      rating: rating ?? null,
      ratingOp: rating ? new Date() : null,
    },
    update: data,
  })

  return NextResponse.json({ interactie })
}
