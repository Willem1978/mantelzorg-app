import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { geocodePostcode } from "@/lib/geocode"
import { z } from "zod"
import { validateBody } from "@/lib/validations"
import { sanitizeText } from "@/lib/sanitize"
import { sendBuddyBevestigingsEmail, sendBuddyAdminNotificatie } from "@/lib/email"

const aanmeldSchema = z.object({
  voornaam: z.string().min(1, "Voornaam is verplicht").max(100).transform(sanitizeText),
  achternaam: z.string().max(100).transform(sanitizeText).optional().default(""),
  email: z.string().email("Ongeldig e-mailadres").max(255),
  telefoon: z.string().min(1, "Telefoonnummer is verplicht").max(20),
  postcode: z.string().min(4, "Ongeldige postcode").max(7),
  woonplaats: z.string().max(100).transform(sanitizeText).optional().default(""),
  hulpvormen: z.array(z.string().max(50)).max(20).optional().default([]),
  beschikbaarheid: z.enum(["eenmalig", "vast", "beide"]).optional().default("beide"),
  motivatie: z.string().max(2000).transform(sanitizeText).optional(),
  ervaring: z.string().max(2000).transform(sanitizeText).optional(),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const validation = validateBody(body, aanmeldSchema)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }
    const { voornaam, achternaam, email, telefoon, postcode, woonplaats, hulpvormen, beschikbaarheid, motivatie, ervaring } = validation.data

    // Check of email al bestaat
    const bestaandeBuddy = await prisma.mantelBuddy.findUnique({
      where: { email },
    })

    if (bestaandeBuddy) {
      return NextResponse.json(
        { error: "Dit e-mailadres is al geregistreerd" },
        { status: 400 }
      )
    }

    // Converteer beschikbaarheid naar enum
    const beschikbaarheidMap = { eenmalig: "EENMALIG", vast: "VAST", beide: "BEIDE" } as const
    const beschikbaarheidEnum = beschikbaarheidMap[beschikbaarheid]

    // Geocodeer postcode naar lat/lng voor afstandsmatching
    const coords = await geocodePostcode(postcode)

    // Maak nieuwe MantelBuddy aan
    const mantelBuddy = await prisma.mantelBuddy.create({
      data: {
        voornaam,
        achternaam: achternaam || "",
        email,
        telefoon,
        postcode,
        woonplaats: woonplaats || "",
        latitude: coords?.latitude ?? null,
        longitude: coords?.longitude ?? null,
        hulpvormen: hulpvormen || [],
        beschikbaarheid: beschikbaarheidEnum,
        motivatie,
        ervaring,
        status: "AANGEMELD",
      },
    })

    // Emails versturen (niet-blokkerend — fouten worden gelogd maar breken de aanmelding niet)
    sendBuddyBevestigingsEmail(email, voornaam).catch(() => {})
    sendBuddyAdminNotificatie(voornaam, woonplaats).catch(() => {})

    return NextResponse.json({
      success: true,
      message: "Aanmelding succesvol ontvangen",
      buddyId: mantelBuddy.id,
    })
  } catch (error) {
    console.error("Error bij MantelBuddy aanmelding:", error)
    return NextResponse.json(
      { error: "Er ging iets mis bij het verwerken van je aanmelding" },
      { status: 500 }
    )
  }
}
