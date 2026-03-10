import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { geocodeLocation } from "@/lib/pdok"
import { profielSchema, validateBody } from "@/lib/validations"
import { sanitizeText } from "@/lib/sanitize"

// GET: Profiel ophalen
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.caregiverId) {
      return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 })
    }

    const caregiver = await prisma.caregiver.findUnique({
      where: { id: session.user.caregiverId },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          }
        }
      }
    })

    if (!caregiver) {
      return NextResponse.json({ error: "Profiel niet gevonden" }, { status: 404 })
    }

    // Haal zorgtaken op uit de meest recente balanstest
    const latestTest = await prisma.belastbaarheidTest.findFirst({
      where: { caregiverId: session.user.caregiverId, isCompleted: true },
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

    if (!session?.user?.caregiverId) {
      return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 })
    }

    const body = await request.json()
    const validation = validateBody(body, profielSchema)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }
    const data = validation.data

    // Update user name if provided
    if (data.naam) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { name: sanitizeText(data.naam) }
      })
    }

    // Check of profiel compleet is (beide locaties ingevuld)
    const profileCompleted = !!(
      data.straat && data.woonplaats &&
      data.naasteStraat && data.naasteWoonplaats
    )

    // Valideer telefoonnummer - alleen updaten als expliciet meegestuurd
    // undefined = niet meegestuurd, behoud huidige waarde
    // null of lege string = bewust verwijderen
    let phoneUpdate: { phoneNumber?: string | null } = {}
    if (data.telefoon !== undefined) {
      const telefoon = data.telefoon
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
    if (data.naasteWoonplaats) {
      const coords = await geocodeLocation(data.naasteWoonplaats, data.naasteStraat || undefined)
      if (coords) {
        careRecipientCoords = {
          careRecipientLatitude: coords.latitude,
          careRecipientLongitude: coords.longitude,
        }
      }
    }

    // Update caregiver
    const caregiver = await prisma.caregiver.update({
      where: { id: session.user.caregiverId },
      data: {
        ...phoneUpdate,
        // Locatie mantelzorger
        street: data.straat,
        city: data.woonplaats,
        postalCode: data.postcode,
        municipality: data.gemeente,
        neighborhood: data.wijk,
        // Naaste
        careRecipientName: data.naasteNaam,
        careRecipient: data.naasteRelatie,
        careRecipientStreet: data.naasteStraat,
        careRecipientCity: data.naasteWoonplaats,
        careRecipientMunicipality: data.naasteGemeente,
        careRecipientNeighborhood: data.naasteWijk,
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
