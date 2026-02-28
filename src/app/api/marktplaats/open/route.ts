import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

// GET - Buddy ziet open hulpvragen (gefilterd op hulpvormen + locatie)
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Je moet ingelogd zijn" },
        { status: 401 }
      )
    }

    // Zoek de buddy profiel van deze gebruiker
    const buddy = await prisma.mantelBuddy.findUnique({
      where: { userId: session.user.id },
    })

    if (!buddy) {
      return NextResponse.json(
        { error: "Geen buddy profiel gevonden" },
        { status: 404 }
      )
    }

    // Haal open taken op
    const taken = await prisma.buddyTaak.findMany({
      where: {
        status: { in: ["OPEN", "REACTIES"] },
        // Niet je eigen taken (als je ook mantelzorger bent)
        caregiver: {
          userId: { not: session.user.id },
        },
      },
      orderBy: { createdAt: "desc" },
      include: {
        caregiver: {
          select: {
            municipality: true,
            careRecipientLatitude: true,
            careRecipientLongitude: true,
            user: { select: { name: true } },
          },
        },
        reacties: {
          where: { buddyId: buddy.id },
          select: { id: true, status: true },
        },
      },
    })

    // Filter op afstand als buddy locatie heeft
    const takenMetAfstand = taken.map((taak) => {
      let afstandKm: number | null = null
      if (buddy.latitude && buddy.longitude && taak.caregiver.careRecipientLatitude && taak.caregiver.careRecipientLongitude) {
        afstandKm = haversineKm(
          buddy.latitude, buddy.longitude,
          taak.caregiver.careRecipientLatitude, taak.caregiver.careRecipientLongitude
        )
      }

      return {
        id: taak.id,
        titel: taak.titel,
        beschrijving: taak.beschrijving,
        categorie: taak.categorie,
        datum: taak.datum,
        tijdstip: taak.tijdstip,
        isFlexibel: taak.isFlexibel,
        createdAt: taak.createdAt,
        mantelzorger: {
          voornaam: taak.caregiver.user?.name?.split(" ")[0] || "Onbekend",
          gemeente: taak.caregiver.municipality || null,
        },
        afstandKm,
        alGereageerd: taak.reacties.length > 0,
        mijnReactieStatus: taak.reacties[0]?.status || null,
      }
    })

    // Filter: alleen taken binnen bereik (max 25km standaard, of buddy maxReisafstand)
    const maxAfstand = buddy.maxReisafstand || 25
    const gefilterd = takenMetAfstand.filter(
      (t) => t.afstandKm === null || t.afstandKm <= maxAfstand
    )

    return NextResponse.json({ taken: gefilterd })
  } catch (error) {
    console.error("Marktplaats open GET error:", error)
    return NextResponse.json(
      { error: "Er ging iets mis bij het ophalen" },
      { status: 500 }
    )
  }
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}
