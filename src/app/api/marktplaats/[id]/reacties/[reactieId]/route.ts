import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// PATCH - Mantelzorger accepteert of wijst buddy reactie af
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; reactieId: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Je moet ingelogd zijn" },
        { status: 401 }
      )
    }

    const { id: taakId, reactieId } = await params
    const body = await request.json()
    const { actie } = body // "accepteer" of "afwijzen"

    if (!actie || !["accepteer", "afwijzen"].includes(actie)) {
      return NextResponse.json(
        { error: "Actie moet 'accepteer' of 'afwijzen' zijn" },
        { status: 400 }
      )
    }

    // Controleer dat de taak van deze mantelzorger is
    const caregiver = await prisma.caregiver.findUnique({
      where: { userId: session.user.id },
    })

    if (!caregiver) {
      return NextResponse.json(
        { error: "Geen mantelzorger profiel gevonden" },
        { status: 404 }
      )
    }

    const taak = await prisma.buddyTaak.findFirst({
      where: { id: taakId, caregiverId: caregiver.id },
    })

    if (!taak) {
      return NextResponse.json(
        { error: "Hulpvraag niet gevonden" },
        { status: 404 }
      )
    }

    // Haal de reactie op
    const reactie = await prisma.buddyTaakReactie.findFirst({
      where: { id: reactieId, taakId },
      include: {
        buddy: {
          select: { id: true, voornaam: true, userId: true },
        },
      },
    })

    if (!reactie) {
      return NextResponse.json(
        { error: "Reactie niet gevonden" },
        { status: 404 }
      )
    }

    if (actie === "accepteer") {
      // Accepteer deze buddy
      await prisma.$transaction(async (tx) => {
        // 1. Update deze reactie naar GEACCEPTEERD
        await tx.buddyTaakReactie.update({
          where: { id: reactieId },
          data: { status: "GEACCEPTEERD" },
        })

        // 2. Wijs andere reacties af
        await tx.buddyTaakReactie.updateMany({
          where: {
            taakId,
            id: { not: reactieId },
            status: "INTERESSE",
          },
          data: { status: "AFGEWEZEN" },
        })

        // 3. Update taak: status → TOEGEWEZEN, sla buddyId op
        await tx.buddyTaak.update({
          where: { id: taakId },
          data: {
            status: "TOEGEWEZEN",
            toegewezenAan: reactie.buddy.id,
          },
        })

        // 4. Maak of update BuddyMatch
        await tx.buddyMatch.upsert({
          where: {
            buddyId_caregiverId: {
              buddyId: reactie.buddy.id,
              caregiverId: caregiver.id,
            },
          },
          create: {
            buddyId: reactie.buddy.id,
            caregiverId: caregiver.id,
            status: "ACTIEF",
          },
          update: {
            status: "ACTIEF",
          },
        })

        // 5. Notificatie voor geaccepteerde buddy
        if (reactie.buddy.userId) {
          await tx.notification.create({
            data: {
              userId: reactie.buddy.userId,
              type: "REACTIE_GEACCEPTEERD",
              title: "Je reactie is geaccepteerd!",
              message: `Je mag helpen met "${taak.titel}". Open de app om te chatten.`,
              link: "/buddy/dashboard",
            },
          })
        }

        // 6. Notificaties voor afgewezen buddy's
        const afgewezenReacties = await tx.buddyTaakReactie.findMany({
          where: { taakId, status: "AFGEWEZEN" },
          include: { buddy: { select: { userId: true } } },
        })

        for (const r of afgewezenReacties) {
          if (r.buddy.userId) {
            await tx.notification.create({
              data: {
                userId: r.buddy.userId,
                type: "REACTIE_AFGEWEZEN",
                title: "Iemand anders gekozen",
                message: `Voor "${taak.titel}" is een andere buddy gekozen. Bedankt voor je interesse!`,
                link: "/buddy/dashboard",
              },
            })
          }
        }
      })

      return NextResponse.json({ status: "geaccepteerd" })
    } else {
      // Wijs deze buddy af
      await prisma.$transaction(async (tx) => {
        await tx.buddyTaakReactie.update({
          where: { id: reactieId },
          data: { status: "AFGEWEZEN" },
        })

        // Check of er nog openstaande reacties zijn
        const openReacties = await tx.buddyTaakReactie.count({
          where: { taakId, status: "INTERESSE" },
        })

        // Als er geen open reacties meer zijn, zet status terug naar OPEN
        if (openReacties === 0) {
          await tx.buddyTaak.update({
            where: { id: taakId },
            data: { status: "OPEN" },
          })
        }

        // Notificatie voor afgewezen buddy
        if (reactie.buddy.userId) {
          await tx.notification.create({
            data: {
              userId: reactie.buddy.userId,
              type: "REACTIE_AFGEWEZEN",
              title: "Iemand anders gekozen",
              message: `Voor "${taak.titel}" is een andere buddy gekozen. Bedankt voor je interesse!`,
              link: "/buddy/dashboard",
            },
          })
        }
      })

      return NextResponse.json({ status: "afgewezen" })
    }
  } catch (error) {
    console.error("Reactie PATCH error:", error)
    return NextResponse.json(
      { error: "Er ging iets mis" },
      { status: 500 }
    )
  }
}
