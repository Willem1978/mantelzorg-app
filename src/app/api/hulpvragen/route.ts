import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { hulpvraagSchema, validateBody } from "@/lib/validations"
import { sanitizeText } from "@/lib/sanitize"

export const dynamic = "force-dynamic"

// GET - Haal de hulpvragen op van de ingelogde mantelzorger
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Je moet ingelogd zijn" },
        { status: 401 }
      )
    }

    const caregiver = await prisma.caregiver.findUnique({
      where: { userId: session.user.id },
    })

    if (!caregiver) {
      return NextResponse.json(
        { error: "Geen mantelzorger profiel gevonden" },
        { status: 404 }
      )
    }

    // Haal alle taken op, nieuwste eerst
    const taken = await prisma.buddyTaak.findMany({
      where: { caregiverId: caregiver.id },
      orderBy: { createdAt: "desc" },
      include: {
        reacties: {
          include: {
            buddy: {
              select: {
                voornaam: true,
                woonplaats: true,
                gemiddeldeScore: true,
              },
            },
          },
        },
      },
    })

    // Haal ook de zware taken op uit de balanstest (voor pre-selectie)
    const laatsteTest = await prisma.belastbaarheidTest.findFirst({
      where: { caregiverId: caregiver.id },
      orderBy: { createdAt: "desc" },
      include: {
        taakSelecties: true,
      },
    })

    const zorgtaakZwaarte: Record<string, string> =
      {}
    if (laatsteTest?.taakSelecties) {
      for (const sel of laatsteTest.taakSelecties) {
        if (sel.moeilijkheid) {
          zorgtaakZwaarte[sel.taakNaam] = sel.moeilijkheid
        }
      }
    }

    return NextResponse.json({
      taken,
      zorgtaakZwaarte,
      gemeente: caregiver.municipality || null,
    })
  } catch (error) {
    console.error("Hulpvragen GET error:", error)
    return NextResponse.json(
      { error: "Er ging iets mis bij het ophalen" },
      { status: 500 }
    )
  }
}

// POST - Maak een nieuwe hulpvraag aan
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Je moet ingelogd zijn" },
        { status: 401 }
      )
    }

    const caregiver = await prisma.caregiver.findUnique({
      where: { userId: session.user.id },
    })

    if (!caregiver) {
      return NextResponse.json(
        { error: "Geen mantelzorger profiel gevonden" },
        { status: 404 }
      )
    }

    const body = await request.json()
    const validation = validateBody(body, hulpvraagSchema)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }
    const data = validation.data

    const taak = await prisma.buddyTaak.create({
      data: {
        caregiverId: caregiver.id,
        titel: sanitizeText(data.titel),
        beschrijving: data.beschrijving ? sanitizeText(data.beschrijving) : null,
        categorie: data.categorie,
        datum: data.datum ? new Date(data.datum) : null,
        tijdstip: data.tijdstip || null,
        isFlexibel: data.isFlexibel,
      },
    })

    // Maak een notificatie
    await prisma.notification.create({
      data: {
        userId: session.user.id,
        type: "HELP_REQUEST_UPDATE",
        title: "Hulpvraag geplaatst",
        message: `Je hulpvraag "${data.titel}" is geplaatst.`,
        link: "/buddys",
      },
    })

    return NextResponse.json({ taak })
  } catch (error) {
    console.error("Hulpvragen POST error:", error)
    return NextResponse.json(
      { error: "Er ging iets mis bij het aanmaken" },
      { status: 500 }
    )
  }
}
