import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { geocodePostcode } from "@/lib/geocode"

export async function POST(request: Request) {
  try {
    const data = await request.json()

    const {
      voornaam,
      achternaam,
      email,
      telefoon,
      postcode,
      woonplaats,
      hulpvormen,
      beschikbaarheid,
      motivatie,
      ervaring,
    } = data

    // Validatie
    if (!voornaam || !email || !telefoon || !postcode) {
      return NextResponse.json(
        { error: "Vul alle verplichte velden in" },
        { status: 400 }
      )
    }

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
    let beschikbaarheidEnum: "EENMALIG" | "VAST" | "BEIDE" = "BEIDE"
    if (beschikbaarheid === "eenmalig") beschikbaarheidEnum = "EENMALIG"
    if (beschikbaarheid === "vast") beschikbaarheidEnum = "VAST"

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

    // TODO: Stuur bevestigingsmail naar de nieuwe MantelBuddy
    // TODO: Stuur notificatie naar admin

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
