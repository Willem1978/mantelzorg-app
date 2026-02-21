import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

// Mapping van taak IDs naar onderdeel-categorieën in database
const TAAK_NAAR_ONDERDEEL: Record<string, string> = {
  t1: 'Persoonlijke verzorging',
  t2: 'Huishoudelijke taken',
  t3: 'Persoonlijke verzorging',
  t4: 'Vervoer',
  t5: 'Administratie en aanvragen',
  t6: 'Sociaal contact en activiteiten',
  t7: 'Persoonlijke verzorging',
  t8: 'Persoonlijke verzorging',
  t9: 'Klusjes in en om het huis',
}

// GET - Haal specifieke test op met hulpbronnen voor PDF rapport
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.caregiverId) {
      return NextResponse.json(
        { error: "Je moet ingelogd zijn" },
        { status: 401 }
      )
    }

    const { id } = await params

    const test = await prisma.belastbaarheidTest.findFirst({
      where: { id, caregiverId: session.user.caregiverId },
      include: {
        antwoorden: { orderBy: { vraagId: 'asc' } },
        taakSelecties: { orderBy: { taakId: 'asc' } },
        alarmLogs: true,
      },
    })

    if (!test) {
      return NextResponse.json(
        { error: "Test niet gevonden" },
        { status: 404 }
      )
    }

    // Haal locatiegegevens op van caregiver
    const caregiver = await prisma.caregiver.findUnique({
      where: { id: session.user.caregiverId },
      select: {
        municipality: true,
        careRecipientMunicipality: true,
      },
    })

    const mantelzorgerGemeente = caregiver?.municipality || test.gemeente || null
    const zorgvragerGemeente = caregiver?.careRecipientMunicipality || test.gemeente || null

    // Hulpbronnen per zware taak (voor naaste)
    // Cast naar string voor vergelijking: WhatsApp test slaat soms 'JA'/'SOMS' op als moeilijkheid
    const isZwaarOfMatig = (m: string | null) =>
      m === 'MOEILIJK' || m === 'ZEER_MOEILIJK' || m === 'GEMIDDELD' ||
      m === 'JA' || m === 'ja' || m === 'SOMS' || m === 'soms'

    const zwareTaken = test.taakSelecties.filter(
      t => t.isGeselecteerd && isZwaarOfMatig(t.moeilijkheid as string | null)
    )

    const hulpPerTaak: Record<string, Array<{
      naam: string
      telefoon: string | null
      website: string | null
      beschrijving: string | null
      gemeente: string | null
      isLandelijk: boolean
    }>> = {}

    for (const taak of zwareTaken) {
      const onderdeel = TAAK_NAAR_ONDERDEEL[taak.taakId]
      if (!onderdeel) continue

      const [lokaal, landelijk] = await Promise.all([
        zorgvragerGemeente ? prisma.zorgorganisatie.findMany({
          where: { isActief: true, onderdeelTest: onderdeel, gemeente: zorgvragerGemeente },
          orderBy: { naam: 'asc' },
          select: { naam: true, telefoon: true, website: true, beschrijving: true, gemeente: true },
        }) : [],
        prisma.zorgorganisatie.findMany({
          where: { isActief: true, onderdeelTest: onderdeel, gemeente: null },
          orderBy: { naam: 'asc' },
          select: { naam: true, telefoon: true, website: true, beschrijving: true, gemeente: true },
        }),
      ])

      const gecombineerd = [
        ...lokaal.map(h => ({ ...h, isLandelijk: false })),
        ...landelijk.map(h => ({ ...h, isLandelijk: true })),
      ]

      if (gecombineerd.length > 0) {
        hulpPerTaak[taak.taakNaam] = gecombineerd
      }
    }

    // Hulpbronnen voor mantelzorger
    const [lokaalMantelzorger, landelijkMantelzorger] = await Promise.all([
      mantelzorgerGemeente ? prisma.zorgorganisatie.findMany({
        where: { isActief: true, onderdeelTest: 'Mantelzorgondersteuning', gemeente: mantelzorgerGemeente },
        orderBy: { naam: 'asc' },
        select: { naam: true, telefoon: true, website: true, beschrijving: true, soortHulp: true, gemeente: true },
      }) : [],
      prisma.zorgorganisatie.findMany({
        where: {
          isActief: true,
          OR: [
            { onderdeelTest: 'Mantelzorgondersteuning' },
            { soortHulp: { in: ['Emotionele steun', 'Vervangende mantelzorg', 'Lotgenotencontact'] } },
          ],
          gemeente: null,
        },
        orderBy: { naam: 'asc' },
        select: { naam: true, telefoon: true, website: true, beschrijving: true, soortHulp: true, gemeente: true },
      }),
    ])

    const voorMantelzorger = [
      ...lokaalMantelzorger.map(h => ({ ...h, isLandelijk: false })),
      ...landelijkMantelzorger.map(h => ({ ...h, isLandelijk: true })),
    ]

    return NextResponse.json({
      test: {
        id: test.id,
        voornaam: test.voornaam,
        totaleBelastingScore: test.totaleBelastingScore,
        belastingNiveau: test.belastingNiveau,
        totaleZorguren: test.totaleZorguren,
        gemeente: test.gemeente,
        completedAt: test.completedAt,
        antwoorden: test.antwoorden.map(a => ({
          vraagId: a.vraagId,
          vraagTekst: a.vraagTekst,
          antwoord: a.antwoord,
          score: a.score,
        })),
        taakSelecties: test.taakSelecties.map(t => ({
          taakId: t.taakId,
          taakNaam: t.taakNaam,
          isGeselecteerd: t.isGeselecteerd,
          urenPerWeek: t.urenPerWeek,
          moeilijkheid: t.moeilijkheid,
        })),
        alarmLogs: test.alarmLogs.map(a => ({
          type: a.type,
          beschrijving: a.beschrijving,
          urgentie: a.urgentie,
        })),
      },
      hulpbronnen: {
        perTaak: hulpPerTaak,
        voorMantelzorger,
        mantelzorgerGemeente,
        zorgvragerGemeente,
      },
    })
  } catch (error) {
    console.error("Balanstest GET error:", error)
    return NextResponse.json(
      { error: "Er ging iets mis bij het ophalen" },
      { status: 500 }
    )
  }
}

// DELETE - Verwijder een specifieke test
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.caregiverId) {
      return NextResponse.json(
        { error: "Je moet ingelogd zijn" },
        { status: 401 }
      )
    }

    const { id } = await params

    // Controleer eigenaarschap
    const test = await prisma.belastbaarheidTest.findFirst({
      where: { id, caregiverId: session.user.caregiverId },
    })

    if (!test) {
      return NextResponse.json(
        { error: "Test niet gevonden" },
        { status: 404 }
      )
    }

    // Cascade delete verwijdert automatisch antwoorden, taakSelecties, alarmLogs, rapporten
    await prisma.belastbaarheidTest.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Balanstest delete error:", error)
    return NextResponse.json(
      { error: "Er ging iets mis bij het verwijderen" },
      { status: 500 }
    )
  }
}
