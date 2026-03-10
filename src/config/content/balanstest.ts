/**
 * Balanstest pagina teksten.
 */

export const balanstestContent = {
  title: "Balanscheck",
  subtitle: "Hier zie je je resultaten van elke keer dat je de check hebt gedaan.",
  intro: "Ontdek hoe het met je gaat en waar je hulp bij kunt krijgen.",

  nieuweTest: {
    emoji: "\uD83D\uDCCA",
    title: "Tijd voor een nieuwe Balanscheck",
    tekstFn: (dagen: number) =>
      `Je laatste check was ${dagen} dagen geleden. Het is fijn om elke 3 maanden even te kijken hoe het gaat.`,
    button: "Doe de Balanscheck",
  },

  geenTest: {
    emoji: "\uD83D\uDCCA",
    title: "Hoe gaat het eigenlijk met je?",
    beschrijving: "Doe de Balanscheck en ontdek hoe het met je gaat.",
    subtekst: "Het duurt maar 5 minuten en je krijgt direct tips die bij je passen.",
    button: "Start de Balanscheck",
  },

  opnieuwButton: "Doe de check opnieuw",

  scores: {
    title: "Je resultaten over tijd",
    emoji: "\uD83D\uDCC8",
    legendaTekst: "Hoe hoger de score, hoe zwaarder het voor je is.",
    laag: "Laag (0-6)",
    gemiddeld: "Gemiddeld (7-12)",
    hoog: "Hoog (13-24)",
  },

  zorguren: {
    title: "Je zorguren over tijd",
    emoji: "\u23F1\uFE0F",
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
    title: "Laatste resultaat",
    emoji: "\uD83C\uDFAF",
    maxLabel: "/24",
    lageBelasting: "Goed vol te houden",
    gemiddeldeBelasting: "Het wordt zwaar",
    hogeBelasting: "Te veel op je bordje",
    zorgtakenFn: (aantal: number) => `${aantal} zorgtaken`,
    uurPerWeekFn: (uren: number) => `${uren} uur/week`,
    bekijkResultaten: "Bekijk je volledige resultaten",
  },

  rapporten: {
    title: "Alle resultaten",
    emoji: "\uD83D\uDCCB",
    laatsteBadge: "Laatste",
    takenSummaryFn: (taken: number, uren: number) => `${taken} taken \u00B7 ${uren} uur/week`,
    zwaarSuffixFn: (zwaar: number) => ` \u00B7 ${zwaar} zwaar`,
    bekijkResultaat: "Bekijk resultaat",
    testVerwijderenLabel: "Resultaat verwijderen",
  },

  verwijderDialog: {
    title: "Weet je het zeker?",
    beschrijving: "Dit resultaat wordt definitief verwijderd.",
    annuleren: "Niet nu",
    bezig: "Bezig...",
    verwijderen: "Verwijderen",
  },
} as const
