/**
 * Agenda pagina teksten.
 */

export const agendaContent = {
  title: "Mijn Agenda",
  subtitle: "Hier zie je wat je moet doen.",

  addButton: "Iets toevoegen",

  // Nieuw item formulier
  form: {
    title: "Nieuw in agenda",
    stap1: "1. Waar gaat het over?",
    stap2: "2. Wat moet je doen?",
    stap2Placeholder: "Bijvoorbeeld: Naar de dokter",
    stap3: "3. Wanneer?",
    heleDag: "De hele dag",
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

  // Statussen
  laden: "Even laden...",
  leeg: {
    title: "Je agenda is leeg",
    subtitle: "Voeg toe wat je moet doen.",
  },
} as const
