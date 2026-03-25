/**
 * Profiel Service
 *
 * Business logic voor het ophalen en updaten van mantelzorger-profielen.
 * Gescheiden van HTTP-layer zodat het herbruikbaar is vanuit API routes,
 * WhatsApp webhooks en toekomstige integraties.
 */

import { prisma } from "@/lib/prisma"
import { geocodeLocation } from "@/lib/pdok"
import { createLogger } from "@/lib/logger"

const log = createLogger("profiel-service")

export interface ProfielData {
  naam: string | null
  email: string | null
  telefoon: string | null
  straat: string | null
  woonplaats: string | null
  postcode: string | null
  gemeente: string | null
  wijk: string | null
  naasteNaam: string | null
  naasteRelatie: string | null
  naasteStraat: string | null
  naasteWoonplaats: string | null
  naasteGemeente: string | null
  naasteWijk: string | null
  careRecipientLatitude: number | null
  careRecipientLongitude: number | null
  woonsituatie: string | null
  werkstatus: string | null
  careHoursPerWeek: number | null
  careSince: Date | null
  dateOfBirth: Date | null
  zorgtaken: string[]
  profileCompleted: boolean
  intakeCompleted: boolean
}

export interface ProfielUpdateInput {
  naam?: string
  telefoon?: string | null
  straat?: string
  woonplaats?: string
  postcode?: string
  gemeente?: string
  wijk?: string
  naasteNaam?: string
  naasteRelatie?: string
  naasteStraat?: string
  naasteWoonplaats?: string
  naasteGemeente?: string
  naasteWijk?: string
  woonsituatie?: string | null
  werkstatus?: string | null
}

/**
 * Zoek caregiverId op basis van session data.
 * Probeert eerst caregiverId uit de session, dan fallback via userId.
 */
export async function findCaregiverId(
  sessionCaregiverId: string | null | undefined,
  userId: string,
): Promise<string | null> {
  if (sessionCaregiverId) return sessionCaregiverId

  const found = await prisma.caregiver.findUnique({
    where: { userId },
    select: { id: true },
  })
  return found?.id || null
}

/**
 * Haal het volledige profiel op van een mantelzorger.
 */
export async function getProfile(caregiverId: string): Promise<ProfielData | null> {
  const caregiver = await prisma.caregiver.findUnique({
    where: { id: caregiverId },
    include: { user: { select: { name: true, email: true } } },
  })

  if (!caregiver) return null

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

  return {
    naam: caregiver.user.name,
    email: caregiver.user.email,
    telefoon: caregiver.phoneNumber,
    straat: caregiver.street,
    woonplaats: caregiver.city,
    postcode: caregiver.postalCode,
    gemeente: caregiver.municipality,
    wijk: caregiver.neighborhood,
    naasteNaam: caregiver.careRecipientName,
    naasteRelatie: caregiver.careRecipient,
    naasteStraat: caregiver.careRecipientStreet,
    naasteWoonplaats: caregiver.careRecipientCity,
    naasteGemeente: caregiver.careRecipientMunicipality,
    naasteWijk: caregiver.careRecipientNeighborhood,
    careRecipientLatitude: caregiver.careRecipientLatitude,
    careRecipientLongitude: caregiver.careRecipientLongitude,
    woonsituatie: caregiver.woonsituatie,
    werkstatus: caregiver.werkstatus,
    careHoursPerWeek: caregiver.careHoursPerWeek,
    careSince: caregiver.careSince,
    dateOfBirth: caregiver.dateOfBirth,
    zorgtaken: latestTest?.taakSelecties?.map((z) => z.taakNaam) || [],
    profileCompleted: caregiver.profileCompleted,
    intakeCompleted: caregiver.intakeCompleted,
  }
}

/**
 * Update het profiel van een mantelzorger.
 */
export async function updateProfile(
  caregiverId: string,
  userId: string,
  input: ProfielUpdateInput,
): Promise<{ success: boolean; profileCompleted: boolean }> {
  // Update user name
  if (input.naam) {
    await prisma.user.update({
      where: { id: userId },
      data: { name: input.naam },
    })
  }

  // Check of profiel compleet is
  const profileCompleted = !!(
    input.straat && input.woonplaats &&
    input.naasteStraat && input.naasteWoonplaats
  )

  // Telefoon verwerken
  let phoneUpdate: { phoneNumber?: string | null } = {}
  if (input.telefoon !== undefined) {
    const telefoon = input.telefoon
    const validPhone = telefoon &&
      telefoon !== "undefined" &&
      telefoon !== "null" &&
      telefoon.trim() !== ""
        ? telefoon
        : null
    phoneUpdate = { phoneNumber: validPhone }
  }

  // Geocodeer naaste-adres
  let careRecipientCoords: { careRecipientLatitude?: number; careRecipientLongitude?: number } = {}
  if (input.naasteWoonplaats) {
    try {
      const coords = await geocodeLocation(input.naasteWoonplaats, input.naasteStraat || undefined)
      if (coords) {
        careRecipientCoords = {
          careRecipientLatitude: coords.latitude,
          careRecipientLongitude: coords.longitude,
        }
      }
    } catch (e) {
      log.warn({ err: e }, "Geocoding naaste-adres mislukt")
    }
  }

  const caregiver = await prisma.caregiver.update({
    where: { id: caregiverId },
    data: {
      ...phoneUpdate,
      street: input.straat,
      city: input.woonplaats,
      postalCode: input.postcode,
      municipality: input.gemeente,
      neighborhood: input.wijk,
      careRecipientName: input.naasteNaam,
      careRecipient: input.naasteRelatie,
      careRecipientStreet: input.naasteStraat,
      careRecipientCity: input.naasteWoonplaats,
      careRecipientMunicipality: input.naasteGemeente,
      careRecipientNeighborhood: input.naasteWijk,
      ...careRecipientCoords,
      ...(input.woonsituatie !== undefined ? { woonsituatie: input.woonsituatie } : {}),
      ...(input.werkstatus !== undefined ? { werkstatus: input.werkstatus } : {}),
      profileCompleted,
    },
  })

  return { success: true, profileCompleted: caregiver.profileCompleted }
}
