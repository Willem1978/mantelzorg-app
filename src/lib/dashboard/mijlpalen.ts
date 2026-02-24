/**
 * Dashboard helper: gebruikersmijlpalen ("Jouw reis") opbouwen.
 */

export interface Mijlpaal {
  id: string
  titel: string
  beschrijving: string
  emoji: string
  datum: Date | null
  behaald: boolean
}

export function buildMijlpalen(
  registratieDatum: Date,
  eersteTestDatum: Date | null,
  eersteCheckInDatum: Date | null,
  eersteFavorietDatum: Date | null,
  profielCompleet: boolean,
  belastingNiveau: string | null,
  testTrend: "improved" | "same" | "worse" | null
): Mijlpaal[] {
  const mijlpalen: Mijlpaal[] = []

  mijlpalen.push({
    id: "registratie",
    titel: "Account aangemaakt",
    beschrijving: "Je hebt de eerste stap gezet!",
    emoji: "🎉",
    datum: registratieDatum,
    behaald: true,
  })

  mijlpalen.push({
    id: "profiel",
    titel: "Profiel ingevuld",
    beschrijving: "Zo kunnen we je beter helpen",
    emoji: "👤",
    datum: profielCompleet ? registratieDatum : null,
    behaald: profielCompleet,
  })

  mijlpalen.push({
    id: "eerste-test",
    titel: "Eerste balanstest gedaan",
    beschrijving: "Nu weet je hoe het met je gaat",
    emoji: "📊",
    datum: eersteTestDatum,
    behaald: !!eersteTestDatum,
  })

  mijlpalen.push({
    id: "eerste-favoriet",
    titel: "Eerste favoriet bewaard",
    beschrijving: "Handig om later terug te lezen",
    emoji: "❤️",
    datum: eersteFavorietDatum,
    behaald: !!eersteFavorietDatum,
  })

  mijlpalen.push({
    id: "eerste-checkin",
    titel: "Eerste check-in gedaan",
    beschrijving: "Zo houd je bij hoe het gaat",
    emoji: "✅",
    datum: eersteCheckInDatum,
    behaald: !!eersteCheckInDatum,
  })

  if (testTrend === "improved") {
    mijlpalen.push({
      id: "score-verbeterd",
      titel: "Score verbeterd!",
      beschrijving: "Je balans is erop vooruit gegaan",
      emoji: "📈",
      datum: new Date(),
      behaald: true,
    })
  }

  return mijlpalen
}
