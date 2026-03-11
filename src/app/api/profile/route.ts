import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { geocodeLocation } from "@/lib/pdok"
import { z } from "zod"
import { validateBody } from "@/lib/validations"
import { sanitizeText } from "@/lib/sanitize"

const profileUpdateSchema = z.object({
  naam: z.string().max(200).transform(sanitizeText).optional(),
  telefoon: z.string().max(20).nullable().optional(),
  straat: z.string().max(200).transform(sanitizeText).optional(),
  woonplaats: z.string().max(100).transform(sanitizeText).optional(),
  postcode: z.string().max(7).optional(),
  gemeente: z.string().max(100).transform(sanitizeText).optional(),
  wijk: z.string().max(100).transform(sanitizeText).optional(),
  naasteNaam: z.string().max(200).transform(sanitizeText).optional(),
  naasteRelatie: z.string().max(100).transform(sanitizeText).optional(),
  naasteStraat: z.string().max(200).transform(sanitizeText).optional(),
  naasteWoonplaats: z.string().max(100).transform(sanitizeText).optional(),
  naasteGemeente: z.string().max(100).transform(sanitizeText).optional(),
  naasteWijk: z.string().max(100).transform(sanitizeText).optional(),
})

// GET: Profiel ophalen
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 })
    }

    // Zoek caregiver via caregiverId (snel) of via userId (fallback als session verouderd is)
    let caregiver = session.user.caregiverId
      ? await prisma.caregiver.findUnique({
          where: { id: session.user.caregiverId },
          include: { user: { select: { name: true, email: true } } },
        })
      : null

    if (!caregiver) {
      caregiver = await prisma.caregiver.findUnique({
        where: { userId: session.user.id },
        include: { user: { select: { name: true, email: true } } },
      })
    }

    if (!caregiver) {
      return NextResponse.json({ error: "Profiel niet gevonden" }, { status: 404 })
    }

    const caregiverId = caregiver.id

    // Haal zorgtaken op uit de meest recente balanstest
    const latestTest = await prisma.belastbaarheidTest.findFirst({
      where: { caregiverId, isCompleted: true },
      orderBy: { completedAt: "desc" },
      select: {
        taakSelecties: {
          where: { isGeselecteerd: true },
          select: { taakNaam: true },
        },
      },
    })

    const zorgtaken = latestTest?.taakSelecties?.map((z) => z.taakNaam) || []

    return NextResponse.json({
      naam: caregiver.user.name,
      email: caregiver.user.email,
      telefoon: caregiver.phoneNumber,
      // Locatie mantelzorger
      straat: caregiver.street,
      woonplaats: caregiver.city,
      postcode: caregiver.postalCode,
      gemeente: caregiver.municipality,
      wijk: caregiver.neighborhood,
      // Naaste
      naasteNaam: caregiver.careRecipientName,
      naasteRelatie: caregiver.careRecipient,
      naasteStraat: caregiver.careRecipientStreet,
      naasteWoonplaats: caregiver.careRecipientCity,
      naasteGemeente: caregiver.careRecipientMunicipality,
      naasteWijk: caregiver.careRecipientNeighborhood,
      // Locatie coördinaten naaste
      careRecipientLatitude: caregiver.careRecipientLatitude,
      careRecipientLongitude: caregiver.careRecipientLongitude,
      // Zorgtaken
      zorgtaken,
      // Status
      profileCompleted: caregiver.profileCompleted,
      intakeCompleted: caregiver.intakeCompleted,
    })
  } catch (error) {
    console.error("Profile GET error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

// PUT: Profiel updaten
export async function PUT(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 })
    }

    // Zoek caregiverId met fallback op userId
    let caregiverId = session.user.caregiverId
    if (!caregiverId) {
      const found = await prisma.caregiver.findUnique({
        where: { userId: session.user.id },
        select: { id: true },
      })
      caregiverId = found?.id || null
    }

    if (!caregiverId) {
      return NextResponse.json({ error: "Profiel niet gevonden" }, { status: 404 })
    }

    const rawBody = await request.json()
    const validation = validateBody(rawBody, profileUpdateSchema)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }
    const body = validation.data

    // Update user name if provided
    if (body.naam) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { name: body.naam }
      })
    }

    // Check of profiel compleet is (beide locaties ingevuld)
    const profileCompleted = !!(
      body.straat && body.woonplaats &&
      body.naasteStraat && body.naasteWoonplaats
    )

    // Valideer telefoonnummer - alleen updaten als expliciet meegestuurd
    // undefined = niet meegestuurd, behoud huidige waarde
    // null of lege string = bewust verwijderen
    let phoneUpdate: { phoneNumber?: string | null } = {}
    if (body.telefoon !== undefined) {
      const telefoon = body.telefoon
      const validPhone = telefoon &&
        telefoon !== "undefined" &&
        telefoon !== "null" &&
        telefoon.trim() !== ""
          ? telefoon
          : null
      phoneUpdate = { phoneNumber: validPhone }
    }

    // Geocodeer naaste-adres naar coördinaten (voor buddy-kaart)
    let careRecipientCoords: { careRecipientLatitude?: number; careRecipientLongitude?: number } = {}
    if (body.naasteWoonplaats) {
      const coords = await geocodeLocation(body.naasteWoonplaats, body.naasteStraat || undefined)
      if (coords) {
        careRecipientCoords = {
          careRecipientLatitude: coords.latitude,
          careRecipientLongitude: coords.longitude,
        }
      }
    }

    // Update caregiver
    const caregiver = await prisma.caregiver.update({
      where: { id: caregiverId },
      data: {
        ...phoneUpdate,
        // Locatie mantelzorger
        street: body.straat,
        city: body.woonplaats,
        postalCode: body.postcode,
        municipality: body.gemeente,
        neighborhood: body.wijk,
        // Naaste
        careRecipientName: body.naasteNaam,
        careRecipient: body.naasteRelatie,
        careRecipientStreet: body.naasteStraat,
        careRecipientCity: body.naasteWoonplaats,
        careRecipientMunicipality: body.naasteGemeente,
        careRecipientNeighborhood: body.naasteWijk,
        // Naaste coördinaten
        ...careRecipientCoords,
        // Status
        profileCompleted,
      }
    })

    return NextResponse.json({
      success: true,
      profileCompleted: caregiver.profileCompleted
    })
  } catch (error) {
    console.error("Profile PUT error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
