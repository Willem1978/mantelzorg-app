/**
 * Agenda pagina teksten.
 */

export const agendaContent = {
  title: "Mijn Agenda",
  subtitle: "Hier zie je wat je moet doen.",

  addButton: "Iets toevoegen",

  // Herinnering opties
  reminderOptions: {
    none: "Geen",
    min15: "15 min van tevoren",
    min30: "30 min van tevoren",
    hour1: "1 uur van tevoren",
    day1: "1 dag van tevoren",
  },

  // Nieuw item formulier
  form: {
    title: "Nieuw in agenda",
    stap1: "1. Welke zorgtaak?",
    stap1Hint: "Kies de taak die je gaat doen.",
    stap2: "2. Wat moet je doen?",
    stap2Placeholder: "Bijvoorbeeld: Boodschappen halen bij Albert Heijn",
    stap3: "3. Wanneer?",
    heleDag: "De hele dag",
    datum: "Datum",
    vanTot: "Van - tot",
    stap4: "4. Extra (niet verplicht)",
    locatie: "Waar?",
    locatiePlaceholder: "Bijvoorbeeld: Bij de huisarts",
    notitie: "Notitie",
    notitiePlaceholder: "Wat moet je niet vergeten?",
    herinnering: "Herinnering",
    stopButton: "Stop",
    opslaanButton: "Opslaan",
  },

  // Event weergave
  heleDag: "Hele dag",

  // Statussen
  laden: "Even laden...",
  leeg: {
    title: "Je agenda is leeg",
    subtitle: "Voeg toe wat je moet doen.",
  },
} as const
