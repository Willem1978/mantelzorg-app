/**
 * Dashboard pagina teksten.
 */

export const dashboardContent = {
  // Welkomst
  loggedOut: {
    title: "Welkom bij MantelBuddy!",
    subtitle: "Log in om je dashboard te zien. Hier vind je je resultaten, tips en hulp bij jou in de buurt.",
    loginButton: "Inloggen",
  },

  // Begroeting header
  greeting: (name: string) => `Hoi ${name}!`,
  pageIntro: "Hier zie je hoe het met je gaat. Scrol naar beneden voor tips en hulp.",

  // Begroetingen op basis van tijdstip
  greetings: {
    morning: "Goedemorgen! Hoe voel je je vandaag?",
    afternoon: "Goedemiddag! Hoe gaat het met je?",
    evening: "Goedenavond! Hoe was je dag?",
  },

  // Score niveau feedback
  scoreMessages: {
    LAAG: {
      emoji: "💚",
      kort: "Je houdt het goed vol",
      uitleg: "Je balans is goed. Zorg ook goed voor jezelf. Neem af en toe rust. Zo hou je het vol.",
    },
    GEMIDDELD: {
      emoji: "🧡",
      kort: "Je doet heel veel",
      uitleg: "Je hebt veel te doen. Het is goed om hulp te vragen. Denk aan familie, buren of hulp uit je gemeente. Kleine stappen helpen al veel.",
    },
    HOOG: {
      emoji: "❤️",
      kort: "Je doet te veel",
      uitleg: "Je hebt te veel op je bordje. Ga hier niet alleen mee door. Bel de Mantelzorglijn: 030 - 205 90 59 (gratis). Of neem contact op met je gemeente. Zij helpen je verder.",
    },
  },

  // Score weergave
  score: {
    maxScore: "/24",
    bekijkResultaten: "Bekijk je volledige resultaten",
  },

  // Zorgtaken sectie
  zorgtaken: {
    sectionTitle: "Je zorgtaken",
    sectionEmoji: "📋",
    title: "Jouw zorgtaken",
    subtitle: "Dit zijn je taken. Rode en oranje taken zijn zwaar. Druk op een taak om hulp te vinden.",
    niveaus: {
      licht: "Goed",
      matig: "Matig",
      zwaar: "Zwaar",
    },
    hulpbronCount: (count: number) => `${count} hulpbron${count !== 1 ? "nen" : ""} beschikbaar`,
    zoekHulp: "Vind hulp",
    goedeTaken: "Taken die goed gaan",
    urenPerWeek: (uren: number) => `(${uren}u/week)`,
  },

  // Tijdsnotatie
  tijd: {
    vandaag: "Vandaag",
    dagenGeleden: (dagen: number) => `${dagen}d geleden`,
  },

  // Aanbevolen artikelen
  artikelen: {
    title: "Aanbevolen voor jou",
    emoji: "💡",
    perNiveau: {
      LAAG: "Tips om het goed te blijven doen.",
      GEMIDDELD: "Artikelen die je nu kunnen helpen.",
      HOOG: "Belangrijke informatie voor jou.",
    },
    default: "Artikelen die voor jou interessant kunnen zijn.",
    meerBekijken: "Bekijk meer informatie",
  },

  // WhatsApp sectie
  whatsapp: {
    title: "Gebruik MantelBuddy ook via WhatsApp",
    subtitle: "Scan de QR code met je telefoon. Of druk op de knop hieronder.",
    qrAlt: "Scan QR code om WhatsApp te starten",
    openButton: "Open WhatsApp",
  },

  // Geen test gedaan
  geenTest: {
    emoji: "📊",
    title: "Nog geen test gedaan",
    subtitle: "Ontdek hoe het met je gaat en waar je hulp bij kunt krijgen",
    button: "Start de balanstest",
  },

  // Nieuwe test nodig
  nieuweTest: {
    title: "Tijd voor een nieuwe balanstest",
    tekst: (dagen: number) => `Je laatste test was ${dagen} dagen geleden. Het is goed om elke 3 maanden te checken hoe het gaat.`,
    button: "Doe de balanstest",
  },

  // Laden
  laden: "Even laden...",

  // Quick check-in component
  checkIn: {
    title: "Hoe voel je je nu?",
    subtitle: "Een snelle check-in voor vandaag",
    feelings: [
      { value: "great", label: "Super" },
      { value: "good", label: "Goed" },
      { value: "okay", label: "Oké" },
      { value: "tired", label: "Moe" },
      { value: "struggling", label: "Zwaar" },
    ],
    bedankt: "Bedankt!",
    opgeslagen: "Je gevoel is opgeslagen",
  },
} as const
