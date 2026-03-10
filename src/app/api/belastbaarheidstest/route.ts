import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { BALANSTEST_VRAGEN, UREN_MAP, TAAK_NAAR_ONDERDEEL } from "@/config/options"
import { sendBalanstestResultEmail, sendAlarmNotificationEmail } from "@/lib/email"
import { checkAlarmindicatoren } from "@/lib/alarm-indicatoren"
import { validateBody, belastbaarheidstestSchema } from "@/lib/validations"

export const dynamic = 'force-dynamic'

/**
 * Laad vragen en zorgtaken uit de database.
 * Fallback naar config als de database leeg is.
 */
async function loadVragenEnTaken() {
  // Laad balanstestvragen uit database
  const dbVragen = await prisma.balanstestVraag.findMany({
    where: { type: "BALANSTEST", isActief: true },
    select: { vraagId: true, vraagTekst: true, gewicht: true },
  })
  const vragenMap = new Map(
    dbVragen.map((v) => [v.vraagId, { vraag: v.vraagTekst, weegfactor: v.gewicht }])
  )

  // Laad zorgtaken uit database
  const dbZorgtaken = await prisma.zorgtaak.findMany({
    where: { isActief: true },
    select: { taakId: true, naam: true, categorie: true },
  })
  const takenMap = new Map(
    dbZorgtaken.map((t) => [t.taakId, { naam: t.naam, categorie: t.categorie || t.naam }])
  )

  return { vragenMap, takenMap }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const session = await auth()

    // Valideer de kern-input (registratie, antwoorden, taken)
    const validated = validateBody(data, belastbaarheidstestSchema)
    if (!validated.success) {
      return NextResponse.json({ error: validated.error }, { status: 400 })
    }

    const { registratie, antwoorden, taken } = validated.data
    const { score, totaleUren } = data as { score: number; totaleUren: number }

    // Laad vragen en taken uit database (met config fallback)
    const { vragenMap, takenMap } = await loadVragenEnTaken()

    // Bepaal belasting niveau voor database
    let belastingNiveau: "LAAG" | "GEMIDDELD" | "HOOG" = "LAAG"
    if (score >= 7 && score <= 12) belastingNiveau = "GEMIDDELD"
    if (score >= 13) belastingNiveau = "HOOG"

    // Maak de test sessie aan
    const test = await prisma.belastbaarheidTest.create({
      data: {
        // Koppel aan gebruiker als ingelogd
        caregiverId: session?.user?.caregiverId || null,

        // Registratie gegevens
        voornaam: registratie.voornaam,
        email: registratie.email || "",
        postcode: registratie.postcode || null,
        huisnummer: registratie.huisnummer || null,
        straat: registratie.straat || null,
        woonplaats: registratie.woonplaats || null,
        gemeente: registratie.gemeente || null,

        // Scores
        totaleBelastingScore: score,
        belastingNiveau,
        totaleZorguren: totaleUren,

        // Status
        isCompleted: true,
        completedAt: new Date(),

        // Antwoorden opslaan
        antwoorden: {
          create: Object.entries(antwoorden).map(([vraagId, antwoord]) => {
            // Probeer eerst database, dan config
            const dbVraag = vragenMap.get(vraagId)
            const configVraag = BALANSTEST_VRAGEN.find((v) => v.id === vraagId)
            const vraagTekst = dbVraag?.vraag || configVraag?.vraag || vraagId
            const gewicht = dbVraag?.weegfactor || configVraag?.weegfactor || 1.0
            const antwoordScore = getAntwoordScore(antwoord as string)

            return {
              vraagId,
              vraagTekst,
              antwoord: antwoord as string,
              score: antwoordScore,
              gewicht,
            }
          }),
        },

        // Taak selecties opslaan
        taakSelecties: taken && Object.keys(taken).length > 0 ? {
          create: Object.entries(taken).map(([taakId, taakData]) => {
            const taak = taakData as {
              isGeselecteerd: boolean
              uren: string
              belasting: string
            }

            // Probeer eerst database, dan config
            const dbTaak = takenMap.get(taakId)
            const configOnderdeel = TAAK_NAAR_ONDERDEEL[taakId]
            const taakNaam = dbTaak?.naam || configOnderdeel || taakId

            // Converteer uren string naar getal
            let urenPerWeek: number | null = null
            if (taak.uren) {
              urenPerWeek = UREN_MAP[taak.uren] || null
            }

            // Converteer belasting naar moeilijkheid enum
            let moeilijkheid: "MAKKELIJK" | "GEMIDDELD" | "MOEILIJK" | "ZEER_MOEILIJK" | null = null
            if (taak.belasting === "nee") moeilijkheid = "MAKKELIJK"
            if (taak.belasting === "soms") moeilijkheid = "GEMIDDELD"
            if (taak.belasting === "ja") moeilijkheid = "MOEILIJK"

            return {
              taakId,
              taakNaam,
              isGeselecteerd: taak.isGeselecteerd,
              urenPerWeek,
              moeilijkheid,
            }
          }),
        } : undefined,
      },
    })

    // Check op alarmindicatoren
    const alarmen = checkAlarmindicatoren(antwoorden, score)

    // Maak alarm logs aan indien nodig
    if (alarmen.length > 0) {
      await prisma.alarmLog.createMany({
        data: alarmen.map((alarm) => ({
          testId: test.id,
          type: alarm.type,
          beschrijving: alarm.beschrijving,
          urgentie: alarm.urgentie,
        })),
      })
    }

    // Als ingelogd, update de caregiver intake status
    if (session?.user?.caregiverId) {
      await prisma.caregiver.update({
        where: { id: session.user.caregiverId },
        data: { intakeCompleted: true },
      })
    }

    // --- Opvolging: emails versturen (async, niet blokkeren) ---
    const emailAddr = registratie?.email
    const voornaam = registratie?.voornaam || "Mantelzorger"
    const gemeenteNaam = registratie?.gemeente

    // 1. Email naar mantelzorger met resultaat
    if (emailAddr) {
      let adviesTekst: string | null = null
      if (gemeenteNaam) {
        try {
          const gem = await prisma.gemeente.findFirst({
            where: { naam: { equals: gemeenteNaam, mode: "insensitive" }, isActief: true },
            select: { adviesLaag: true, adviesGemiddeld: true, adviesHoog: true },
          })
          if (gem) {
            adviesTekst = belastingNiveau === "HOOG" ? gem.adviesHoog
              : belastingNiveau === "GEMIDDELD" ? gem.adviesGemiddeld
              : gem.adviesLaag
          }
        } catch { /* gemeente advies niet beschikbaar */ }
      }

      sendBalanstestResultEmail(emailAddr, voornaam, score, belastingNiveau, adviesTekst)
        .catch((err) => console.error("[Email] Balanstest result email mislukt:", err))
    }

    // 2. Alarm notificatie naar gemeente (geanonimiseerd)
    if (alarmen.length > 0 && gemeenteNaam) {
      try {
        const gem = await prisma.gemeente.findFirst({
          where: { naam: { equals: gemeenteNaam, mode: "insensitive" }, isActief: true },
          select: { contactEmail: true, naam: true },
        })
        if (gem?.contactEmail) {
          for (const alarm of alarmen) {
            sendAlarmNotificationEmail(
              gem.contactEmail,
              gem.naam,
              alarm.type,
              alarm.urgentie,
              alarm.beschrijving,
            ).catch((err) => console.error("[Email] Alarm notificatie mislukt:", err))
          }
        }
      } catch { /* gemeente niet gevonden */ }
    }

    return NextResponse.json({
      success: true,
      testId: test.id,
      score,
      niveau: belastingNiveau,
      alarmen: alarmen.length > 0 ? alarmen : undefined,
    })
  } catch (error) {
    console.error("Error saving belastbaarheidstest:", error)
    return NextResponse.json(
      { error: "Er ging iets mis bij het opslaan" },
      { status: 500 }
    )
  }
}

// Helper functies

function getAntwoordScore(antwoord: string): number {
  if (antwoord === "ja") return 2
  if (antwoord === "soms") return 1
  return 0
}

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.caregiverId) {
      return NextResponse.json(
        { error: "Niet ingelogd" },
        { status: 401 }
      )
    }

    // Haal de meest recente test op voor deze gebruiker
    const test = await prisma.belastbaarheidTest.findFirst({
      where: { caregiverId: session.user.caregiverId },
      orderBy: { createdAt: "desc" },
      include: {
        antwoorden: true,
        taakSelecties: true,
        alarmLogs: true,
      },
    })

    if (!test) {
      return NextResponse.json(
        { error: "Geen test gevonden" },
        { status: 404 }
      )
    }

    // Gemeente-specifiek advies ophalen als gemeente bekend is
    let gemeenteAdvies = null
    const gemeenteNaam = test.gemeente
    if (gemeenteNaam) {
      try {
        const dbGemeente = await prisma.gemeente.findFirst({
          where: {
            naam: { equals: gemeenteNaam, mode: "insensitive" },
            isActief: true,
          },
          select: {
            naam: true,
            adviesLaag: true,
            adviesGemiddeld: true,
            adviesHoog: true,
            mantelzorgSteunpunt: true,
            mantelzorgSteunpuntNaam: true,
            contactTelefoon: true,
            websiteUrl: true,
            wmoLoketUrl: true,
            respijtzorgUrl: true,
            dagopvangUrl: true,
          },
        })
        if (dbGemeente) {
          gemeenteAdvies = dbGemeente
        }
      } catch {
        // Negeer database fouten
      }
    }

    return NextResponse.json({ ...test, gemeenteAdvies })
  } catch (error) {
    console.error("Error fetching belastbaarheidstest:", error)
    return NextResponse.json(
      { error: "Er ging iets mis" },
      { status: 500 }
    )
  }
}
