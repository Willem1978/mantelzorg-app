/**
 * Veelgebruikte teksten die op meerdere pagina's voorkomen.
 */

export const common = {
  // Algemene knoppen
  buttons: {
    opslaan: "Opslaan",
    annuleren: "Niet nu",
    verwijderen: "Verwijderen",
    bewerken: "Aanpassen",
    sluiten: "Sluiten",
    terug: "Terug",
    verder: "Ga verder",
    opnieuw: "Opnieuw proberen",
  },

  // Laad- en foutstatussen
  status: {
    laden: "Even laden...",
    fout: "Oeps, dat lukte niet. Probeer het opnieuw.",
    geenResultaten: "Geen resultaten gevonden",
    opnieuw: "Opnieuw proberen",
  },

  // Hulp knop (floating)
  help: {
    buttonLabel: "Wil je hulp?",
    title: "Hulp & veelgestelde vragen",
    sluiten: "Sluiten",
    meerHulp: {
      title: "Wil je met iemand praten?",
      tekst: "Bel de gratis Mantelzorglijn. Ze luisteren en helpen je verder.",
    },
  },

  // Toegankelijkheid / weergave-instellingen
  accessibility: {
    title: "Weergave-instellingen",
    subtitle: "Pas de app aan zodat het prettig is voor jou.",
    opties: [
      { label: "Grotere tekst", beschrijving: "Maakt alle tekst iets groter", emoji: "\uD83D\uDD24" },
      { label: "Hoog contrast", beschrijving: "Maakt tekst en randen scherper", emoji: "\uD83D\uDD32" },
      { label: "Minder beweging", beschrijving: "Schakelt animaties uit", emoji: "\uD83C\uDFAF" },
    ],
  },

  // Veelgestelde vragen
  faq: [
    {
      vraag: "Hoe doe ik de Balanscheck?",
      antwoord: "Ga naar 'Balanstest' in het menu. Je beantwoordt korte vragen over hoe het met je gaat. Daarna zie je meteen je resultaten en tips die bij je passen.",
    },
    {
      vraag: "Wat is een check-in?",
      antwoord: "Een check-in is een kort momentje om even stil te staan bij hoe het met je gaat. Je beantwoordt een paar vragen en krijgt tips die bij je passen.",
    },
    {
      vraag: "Hoe vind ik hulp bij mij in de buurt?",
      antwoord: "Ga naar 'Hulp' in het menu. Daar vind je organisaties en hulpverleners dichtbij.",
    },
    {
      vraag: "Kan ik mijn gegevens aanpassen?",
      antwoord: "Ja! Ga naar je profiel via het icoontje rechtsboven. Daar kun je alles wijzigen.",
    },
    {
      vraag: "Is mijn informatie veilig?",
      antwoord: "Absoluut. Je gegevens worden veilig opgeslagen en nooit gedeeld met anderen. Bekijk onze privacyverklaring voor meer informatie.",
    },
  ],
} as const
