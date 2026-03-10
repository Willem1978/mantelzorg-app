import { prisma } from "@/lib/prisma"

export interface AlarmIndicator {
  type: string
  beschrijving: string
  urgentie: string
}

/**
 * Check op alarmindicatoren op basis van testantwoorden en score.
 * Gebruikt door zowel de web-route als de WhatsApp handler.
 */
export function checkAlarmindicatoren(
  antwoorden: Record<string, string>,
  totalScore: number
): AlarmIndicator[] {
  const alarmen: AlarmIndicator[] = []

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

/**
 * Sla alarmindicatoren op in de AlarmLog tabel.
 */
export async function saveAlarmLogs(
  testId: string,
  alarmen: AlarmIndicator[]
): Promise<void> {
  for (const alarm of alarmen) {
    await prisma.alarmLog.create({
      data: {
        testId,
        type: alarm.type,
        beschrijving: alarm.beschrijving,
        urgentie: alarm.urgentie,
        status: "OPEN",
      },
    })
  }
}
