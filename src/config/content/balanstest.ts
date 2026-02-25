/**
 * Balanstest pagina teksten.
 */

export const balanstestContent = {
  title: "Balanstest",
  subtitle: "Hier zie je je scores van elke keer dat je de test hebt gedaan.",
  intro: "Ontdek hoe het met je gaat en waar je hulp bij kunt krijgen.",

  nieuweTest: {
    emoji: "📊",
    title: "Tijd voor een nieuwe balanstest",
    tekstFn: (dagen: number) =>
      `Je laatste test was ${dagen} dagen geleden. Het is goed om elke 3 maanden te checken hoe het gaat.`,
    button: "Doe de balanstest",
  },

  geenTest: {
    emoji: "📊",
    title: "Nog geen test gedaan",
    beschrijving: "Doe de balanstest om te zien hoe het met je gaat.",
    subtekst: "Het duurt maar 5 minuten en je krijgt direct tips.",
    button: "Start de balanstest",
  },

  opnieuwButton: "Doe de test opnieuw",

  scores: {
    title: "Je scores over tijd",
    emoji: "📈",
    legendaTekst: "Hoe hoger de score, hoe zwaarder de zorg voor je is.",
    laag: "Laag (0-6)",
    gemiddeld: "Gemiddeld (7-12)",
    hoog: "Hoog (13-24)",
  },

  zorguren: {
    title: "Je zorguren over tijd",
    emoji: "⏱️",
    legendaTekst: "De kleuren laten zien hoe zwaar je elke taak vindt.",
    nietZwaar: "Niet zwaar",
    somsZwaar: "Soms zwaar",
    zwaar: "Zwaar",
    tooltipNietZwaarFn: (uren: number) => `${uren} uur niet zwaar`,
    tooltipSomsZwaarFn: (uren: number) => `${uren} uur soms zwaar`,
    tooltipZwaarFn: (uren: number) => `${uren} uur zwaar`,
    takenTitel: "Dit waren je taken:",
    uurFn: (uren: number) => `${uren} uur`,
  },

  laatsteScore: {
    title: "Laatste score",
    emoji: "🎯",
    maxLabel: "/24",
    lageBelasting: "Lage belasting",
    gemiddeldeBelasting: "Gemiddelde belasting",
    hogeBelasting: "Hoge belasting",
    zorgtakenFn: (aantal: number) => `${aantal} zorgtaken`,
    uurPerWeekFn: (uren: number) => `${uren} uur/week`,
    bekijkResultaten: "Bekijk je volledige resultaten",
  },

  rapporten: {
    title: "Alle rapporten",
    emoji: "📋",
    laatsteBadge: "Laatste",
    takenSummaryFn: (taken: number, uren: number) => `${taken} taken \u00B7 ${uren} uur/week`,
    zwaarSuffixFn: (zwaar: number) => ` \u00B7 ${zwaar} zwaar`,
    bekijkResultaat: "Bekijk resultaat",
    testVerwijderenLabel: "Test verwijderen",
  },

  verwijderDialog: {
    title: "Weet je het zeker?",
    beschrijving: "Deze test wordt definitief verwijderd.",
    annuleren: "Annuleren",
    bezig: "Bezig...",
    verwijderen: "Verwijderen",
  },
} as const
