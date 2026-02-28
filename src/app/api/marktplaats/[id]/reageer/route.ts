import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// POST - Buddy reageert op een hulpvraag
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Je moet ingelogd zijn" },
        { status: 401 }
      )
    }

    const { id: taakId } = await params

    // Zoek de buddy
    const buddy = await prisma.mantelBuddy.findUnique({
      where: { userId: session.user.id },
    })

    if (!buddy) {
      return NextResponse.json(
        { error: "Geen buddy profiel gevonden" },
        { status: 404 }
      )
    }

    if (!buddy.isActief || buddy.status !== "GOEDGEKEURD") {
      return NextResponse.json(
        { error: "Je buddy profiel is nog niet goedgekeurd" },
        { status: 403 }
      )
    }

    // Zoek de taak
    const taak = await prisma.buddyTaak.findUnique({
      where: { id: taakId },
      include: {
        caregiver: {
          select: { userId: true },
        },
      },
    })

    if (!taak) {
      return NextResponse.json(
        { error: "Hulpvraag niet gevonden" },
        { status: 404 }
      )
    }

    if (taak.status === "TOEGEWEZEN" || taak.status === "VOLTOOID" || taak.status === "GEANNULEERD") {
      return NextResponse.json(
        { error: "Deze hulpvraag is niet meer beschikbaar" },
        { status: 400 }
      )
    }

    // Check of buddy niet al gereageerd heeft
    const bestaandeReactie = await prisma.buddyTaakReactie.findUnique({
      where: { taakId_buddyId: { taakId, buddyId: buddy.id } },
    })

    if (bestaandeReactie) {
      return NextResponse.json(
        { error: "Je hebt al gereageerd op deze hulpvraag" },
        { status: 409 }
      )
    }

    const body = await request.json()

    // Maak reactie + update taak status in een transactie
    const reactie = await prisma.$transaction(async (tx) => {
      // 1. Maak de reactie
      const r = await tx.buddyTaakReactie.create({
        data: {
          taakId,
          buddyId: buddy.id,
          bericht: body.bericht || null,
          status: "INTERESSE",
        },
      })

      // 2. Update taak status naar REACTIES
      await tx.buddyTaak.update({
        where: { id: taakId },
        data: { status: "REACTIES" },
      })

      // 3. Maak notificatie voor de mantelzorger
      if (taak.caregiver.userId) {
        await tx.notification.create({
          data: {
            userId: taak.caregiver.userId,
            type: "BUDDY_REACTIE",
            title: "Nieuwe reactie op je hulpvraag",
            message: `${buddy.voornaam} wil je helpen met "${taak.titel}"`,
            link: "/marktplaats",
          },
        })
      }

      return r
    })

    return NextResponse.json({ reactie })
  } catch (error) {
    console.error("Reageer POST error:", error)
    return NextResponse.json(
      { error: "Er ging iets mis bij het reageren" },
      { status: 500 }
    )
  }
}
