/**
 * Agenda pagina teksten.
 */

export const agendaContent = {
  title: "Mijn Agenda",
  subtitle: "Hier zie je wat je moet doen.",

  addButton: "Iets toevoegen",

  // Event type labels en hints (B1 taalgebruik)
  eventTypes: {
    CARE_TASK: { label: "Zorg", icon: "🏥", hint: "Voor de zorg" },
    APPOINTMENT: { label: "Afspraak", icon: "📅", hint: "Arts of andere afspraak" },
    SELF_CARE: { label: "Voor mij", icon: "🧘", hint: "Tijd voor jezelf" },
    SOCIAL: { label: "Samen", icon: "👥", hint: "Met vrienden of familie" },
    WORK: { label: "Werk", icon: "💼", hint: "Werk of studie" },
    OTHER: { label: "Anders", icon: "📝", hint: "Iets anders" },
  },

  // Herinnering opties
  reminderOptions: {
    none: "Geen",
    min15: "15 min van tevoren",
    min30: "30 min van tevoren",
    hour1: "1 uur van tevoren",
    day1: "1 dag van tevoren",
  },

  // Zorgtaak sub-selectie
  zorgtaakSelectie: {
    label: "Welke zorgtaak?",
    hint: "Kies de taak die je gaat doen.",
  },

  // Nieuw item formulier
  form: {
    title: "Nieuw in agenda",
    stap1: "1. Waar gaat het over?",
    stap1b: "1b. Welke zorgtaak?",
    stap2: "2. Wat moet je doen?",
    stap2Placeholder: "Bijvoorbeeld: Naar de dokter",
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
