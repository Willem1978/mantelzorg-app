/**
 * Dashboard pagina teksten.
 */

export const dashboardContent = {
  // Welkomst
  loggedOut: {
    title: "Fijn dat je er bent",
    subtitle: "Log in om je persoonlijke overzicht te bekijken. Hier vind je je resultaten, tips en hulp dichtbij.",
    loginButton: "Inloggen",
  },

  // Begroeting header
  greeting: (name: string) => `Hoi ${name}, fijn dat je er bent`,
  pageIntro: "Fijn dat je even de tijd neemt voor jezelf. Hier zie je in \u00E9\u00E9n oogopslag hoe het gaat en wat je kunt doen.",

  // Begroetingen op basis van tijdstip
  greetings: {
    morning: "Goedemorgen! Hoe voel je je vandaag?",
    afternoon: "Goedemiddag! Hoe gaat het met je?",
    evening: "Goedenavond! Hoe was je dag?",
  },

  // Score niveau feedback
  scoreMessages: {
    LAAG: {
      emoji: "\uD83D\uDC9A",
      kort: "Je houdt het goed vol",
      uitleg: "Fijn om te zien! Je balans is goed. Blijf ook goed voor jezelf zorgen. Neem af en toe even rust \u2014 zo hou je het vol.",
    },
    GEMIDDELD: {
      emoji: "\uD83E\uDDE1",
      kort: "Je draagt veel op je schouders",
      uitleg: "Je hebt veel te doen. Dat is niet niks. Het is slim om hulp te vragen \u2014 aan familie, buren of je gemeente. Kleine stappen helpen al.",
    },
    HOOG: {
      emoji: "\u2764\uFE0F",
      kort: "Je draagt te veel alleen",
      uitleg: "Het is te veel wat je doet. Ga hier niet alleen mee door. Bel de Mantelzorglijn: 030 - 205 90 59 (gratis). Of neem contact op met je gemeente. Ze helpen je graag verder.",
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
    sectionEmoji: "\uD83D\uDCCB",
    title: "Jouw zorgtaken",
    subtitle: "Dit zijn de taken die je doet. Rode en oranje taken zijn zwaar voor je. Tik op een taak om te zien welke hulp er is.",
    niveaus: {
      licht: "Goed",
      matig: "Matig",
      zwaar: "Zwaar",
    },
    hulpbronCount: (count: number) => `${count} hulpbron${count !== 1 ? "nen" : ""} beschikbaar`,
    zoekHulp: "Bekijk hulp",
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
    title: "Aangeraden voor jou",
    emoji: "\uD83D\uDCA1",
    perNiveau: {
      LAAG: "Tips om het goed te blijven doen.",
      GEMIDDELD: "Dit kan je nu helpen.",
      HOOG: "Belangrijk om te lezen.",
    },
    default: "Artikelen die bij jouw situatie passen.",
    meerBekijken: "Bekijk meer informatie",
  },

  // WhatsApp sectie
  whatsapp: {
    title: "Gebruik MantelBuddy ook via WhatsApp",
    subtitle: "Scan de QR code met je telefoon. Of tik op de knop hieronder.",
    qrAlt: "Scan QR code om WhatsApp te starten",
    openButton: "Open WhatsApp",
  },

  // Geen test gedaan
  geenTest: {
    emoji: "\uD83D\uDCCA",
    title: "Hoe gaat het eigenlijk met je?",
    subtitle: "Doe de Balanscheck en ontdek in 5 minuten hoe het met je gaat en waar je hulp bij kunt krijgen.",
    button: "Start de Balanscheck",
  },

  // Nieuwe test nodig
  nieuweTest: {
    title: "Tijd voor een nieuwe Balanscheck",
    tekst: (dagen: number) => `Je laatste check was ${dagen} dagen geleden. Het is fijn om elke 3 maanden even te kijken hoe het gaat.`,
    button: "Doe de Balanscheck",
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
      { value: "okay", label: "Ok\u00E9" },
      { value: "tired", label: "Moe" },
      { value: "struggling", label: "Zwaar" },
    ],
    bedankt: "Bedankt!",
    opgeslagen: "Je gevoel is opgeslagen",
  },
} as const
