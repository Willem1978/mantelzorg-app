import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const session = await auth()

    const {
      registratie,
      antwoorden,
      taken,
      score,
      niveau,
      totaleUren,
    } = data

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
        email: registratie.email,
        postcode: registratie.postcode,
        huisnummer: registratie.huisnummer,
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
            // Vind de vraag configuratie
            const vraagConfig = getVraagConfig(vraagId)
            const antwoordScore = getAntwoordScore(antwoord as string)

            return {
              vraagId,
              vraagTekst: vraagConfig?.vraag || vraagId,
              antwoord: antwoord as string,
              score: antwoordScore,
              gewicht: vraagConfig?.weegfactor || 1.0,
            }
          }),
        },

        // Taak selecties opslaan
        taakSelecties: {
          create: Object.entries(taken).map(([taakId, taakData]) => {
            const taak = taakData as {
              isGeselecteerd: boolean
              uren: string
              moeilijkheid: string
            }
            const taakConfig = getTaakConfig(taakId)

            // Converteer uren string naar getal
            let urenPerWeek: number | null = null
            if (taak.uren) {
              const urenMap: Record<string, number> = {
                "0-7": 4,
                "8-14": 11,
                "15-20": 17,
                "20+": 25,
              }
              urenPerWeek = urenMap[taak.uren] || null
            }

            // Converteer moeilijkheid
            let moeilijkheid: "MAKKELIJK" | "GEMIDDELD" | "MOEILIJK" | "ZEER_MOEILIJK" | null = null
            if (taak.moeilijkheid === "nee") moeilijkheid = "MAKKELIJK"
            if (taak.moeilijkheid === "soms") moeilijkheid = "GEMIDDELD"
            if (taak.moeilijkheid === "ja") moeilijkheid = "MOEILIJK"

            return {
              taakId,
              taakNaam: taakConfig?.naam || taakId,
              isGeselecteerd: taak.isGeselecteerd,
              urenPerWeek,
              moeilijkheid,
            }
          }),
        },
      },
    })

    // Check op alarmindicatoren
    const alarmen = checkAlarmindicatoren(antwoorden, score)

    // Maak alarm logs aan indien nodig
    if (alarmen.length > 0) {
      await prisma.alarmLog.createMany({
        data: alarmen.map((alarm) => ({
          testId: test.id,
          type: alarm.type as any,
          beschrijving: alarm.beschrijving,
          urgentie: alarm.urgentie as any,
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

function getVraagConfig(vraagId: string) {
  const vragen: Record<string, { vraag: string; weegfactor: number }> = {
    q1: { vraag: "Slaap je minder goed door de zorg?", weegfactor: 1.5 },
    q2: { vraag: "Heb je last van je lichaam door het zorgen?", weegfactor: 1.0 },
    q3: { vraag: "Kost het zorgen veel tijd en energie?", weegfactor: 1.0 },
    q4: { vraag: "Is de band met je naaste veranderd?", weegfactor: 1.5 },
    q5: { vraag: "Maakt het gedrag van je naaste je verdrietig, bang of boos?", weegfactor: 1.5 },
    q6: { vraag: "Heb je verdriet dat je naaste anders is dan vroeger?", weegfactor: 1.0 },
    q7: { vraag: "Slokt de zorg al je energie op?", weegfactor: 1.5 },
    q8: { vraag: "Pas je je dagelijks leven aan voor de zorg?", weegfactor: 1.0 },
    q9: { vraag: "Pas je regelmatig je plannen aan om te helpen?", weegfactor: 1.0 },
    q10: { vraag: "Kom je niet meer toe aan dingen die je leuk vindt?", weegfactor: 1.0 },
    q11: { vraag: "Kost het zorgen net zoveel tijd als je werk?", weegfactor: 1.5 },
    q12: { vraag: "Geeft de zorg je ook geldproblemen?", weegfactor: 1.0 },
  }
  return vragen[vraagId]
}

function getTaakConfig(taakId: string) {
  const taken: Record<string, { naam: string; categorie: string }> = {
    t1: { naam: "Administratie en geldzaken", categorie: "mentaal" },
    t2: { naam: "Plannen en organiseren", categorie: "mentaal" },
    t3: { naam: "Boodschappen doen", categorie: "praktisch" },
    t4: { naam: "Bezoek en uitjes", categorie: "sociaal" },
    t5: { naam: "Vervoer naar afspraken", categorie: "praktisch" },
    t6: { naam: "Wassen en aankleden", categorie: "fysiek" },
    t7: { naam: "Eten maken", categorie: "praktisch" },
    t8: { naam: "Huishouden", categorie: "praktisch" },
    t9: { naam: "Klusjes in huis", categorie: "fysiek" },
  }
  return taken[taakId]
}

function getAntwoordScore(antwoord: string): number {
  if (antwoord === "ja") return 2
  if (antwoord === "soms") return 1
  return 0
}

function checkAlarmindicatoren(
  antwoorden: Record<string, string>,
  totalScore: number
): Array<{ type: string; beschrijving: string; urgentie: string }> {
  const alarmen: Array<{ type: string; beschrijving: string; urgentie: string }> = []

  // Hoge belasting alarm
  if (totalScore >= 13) {
    alarmen.push({
      type: "HOGE_BELASTING",
      beschrijving: `Belastingsscore is ${totalScore} (hoog)`,
      urgentie: "HIGH",
    })
  }

  // Burn-out risico: slaap + fysiek + emotie allemaal "ja"
  if (
    antwoorden.q1 === "ja" &&
    antwoorden.q2 === "ja" &&
    antwoorden.q4 === "ja"
  ) {
    alarmen.push({
      type: "KRITIEKE_COMBINATIE",
      beschrijving: "Slaapproblemen, fysieke klachten én emotionele verandering",
      urgentie: "CRITICAL",
    })
  }

  // Energie uitputting: energie op + te veel tijd
  if (antwoorden.q7 === "ja" && antwoorden.q11 === "ja") {
    alarmen.push({
      type: "EMOTIONELE_NOOD",
      beschrijving: "Zorg slokt alle energie op en kost evenveel tijd als werk",
      urgentie: "HIGH",
    })
  }

  // Sociaal isolement: geen hobby's + verdriet
  if (antwoorden.q10 === "ja" && antwoorden.q6 === "ja") {
    alarmen.push({
      type: "SOCIAAL_ISOLEMENT",
      beschrijving: "Komt niet meer toe aan leuke dingen en heeft verdriet",
      urgentie: "MEDIUM",
    })
  }

  return alarmen
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

    return NextResponse.json(test)
  } catch (error) {
    console.error("Error fetching belastbaarheidstest:", error)
    return NextResponse.json(
      { error: "Er ging iets mis" },
      { status: 500 }
    )
  }
}
