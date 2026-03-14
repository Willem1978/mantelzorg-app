import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getISOWeekNummer, genereerWeekKaarten } from "@/lib/weekkaarten/genereer-weekkaarten"
import { z } from "zod"

export const dynamic = "force-dynamic"

/**
 * GET /api/weekkaarten — Haal weekkaarten op voor de ingelogde gebruiker.
 * Genereert automatisch als er nog geen kaarten zijn voor deze week.
 */
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 })
  }

  const caregiver = await prisma.caregiver.findFirst({
    where: { userId: session.user.id },
    select: {
      id: true,
      municipality: true,
      careRecipientMunicipality: true,
      aandoening: true,
      voorkeuren: { select: { type: true, slug: true } },
      belastbaarheidTests: {
        where: { isCompleted: true },
        orderBy: { completedAt: "desc" },
        take: 1,
        select: {
          belastingNiveau: true,
          totaleZorguren: true,
          taakSelecties: {
            where: { isGeselecteerd: true },
            select: { taakNaam: true, urenPerWeek: true, moeilijkheid: true },
            orderBy: { urenPerWeek: "desc" },
          },
        },
      },
    },
  })

  if (!caregiver) {
    return NextResponse.json({ weekkaarten: [] })
  }

  const weekNummer = getISOWeekNummer()

  // Zoek bestaande kaarten voor deze week
  let kaarten = await prisma.weekKaart.findMany({
    where: { caregiverId: caregiver.id, weekNummer },
    orderBy: { type: "asc" },
  })

  // Genereer als er nog geen kaarten zijn en er een test is
  if (kaarten.length === 0 && caregiver.belastbaarheidTests.length > 0) {
    const test = caregiver.belastbaarheidTests[0]
    const zwareTaken = test.taakSelecties.filter(
      (t) => t.moeilijkheid === "MOEILIJK" || t.moeilijkheid === "ZEER_MOEILIJK"
    )

    await genereerWeekKaarten({
      caregiverId: caregiver.id,
      niveau: test.belastingNiveau,
      zwareTaken,
      totaleZorguren: test.totaleZorguren,
      gemeente: caregiver.careRecipientMunicipality || caregiver.municipality,
      aandoening: caregiver.aandoening,
      voorkeuren: caregiver.voorkeuren,
    })

    kaarten = await prisma.weekKaart.findMany({
      where: { caregiverId: caregiver.id, weekNummer },
      orderBy: { type: "asc" },
    })
  }

  return NextResponse.json({
    weekNummer,
    weekkaarten: kaarten.map((k) => ({
      id: k.id,
      type: k.type,
      titel: k.titel,
      beschrijving: k.beschrijving,
      emoji: k.emoji,
      linkUrl: k.linkUrl,
      linkLabel: k.linkLabel,
      isVoltooid: k.isVoltooid,
      voltooitOp: k.voltooitOp,
    })),
  })
}

const patchSchema = z.object({
  id: z.string(),
  isVoltooid: z.boolean(),
})

/**
 * PATCH /api/weekkaarten — Markeer een weekkaart als voltooid/niet-voltooid.
 */
export async function PATCH(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 })
  }

  const body = await request.json()
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Ongeldige data" }, { status: 400 })
  }

  const { id, isVoltooid } = parsed.data

  // Verifieer eigenaarschap
  const kaart = await prisma.weekKaart.findFirst({
    where: { id, caregiver: { userId: session.user.id } },
  })

  if (!kaart) {
    return NextResponse.json({ error: "Kaart niet gevonden" }, { status: 404 })
  }

  const updated = await prisma.weekKaart.update({
    where: { id },
    data: {
      isVoltooid,
      voltooitOp: isVoltooid ? new Date() : null,
    },
  })

  return NextResponse.json({
    id: updated.id,
    isVoltooid: updated.isVoltooid,
    voltooitOp: updated.voltooitOp,
  })
}
