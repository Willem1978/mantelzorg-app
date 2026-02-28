/**
 * Veelgebruikte teksten die op meerdere pagina's voorkomen.
 */

export const common = {
  // Algemene knoppen
  buttons: {
    opslaan: "Opslaan",
    annuleren: "Annuleren",
    verwijderen: "Verwijderen",
    bewerken: "Bewerken",
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
    buttonLabel: "Hulp nodig?",
    title: "Hulp & Veelgestelde vragen",
    sluiten: "Sluiten",
    meerHulp: {
      title: "Meer hulp nodig?",
      tekst: "Bel de gratis Mantelzorglijn voor persoonlijk advies.",
    },
  },

  // Toegankelijkheid / weergave-instellingen
  accessibility: {
    title: "Weergave-instellingen",
    subtitle: "Pas de app aan zodat het prettig is om te gebruiken.",
    opties: [
      { label: "Grotere tekst", beschrijving: "Maakt alle tekst iets groter", emoji: "🔤" },
      { label: "Hoog contrast", beschrijving: "Maakt tekst en randen scherper", emoji: "🔲" },
      { label: "Minder beweging", beschrijving: "Schakelt animaties uit", emoji: "🎯" },
    ],
  },

  // Veelgestelde vragen
  faq: [
    {
      vraag: "Hoe doe ik de balanstest?",
      antwoord: "Ga naar 'Balanstest' in het menu. Je beantwoordt korte vragen over hoe het met je gaat. Aan het einde zie je je score en tips.",
    },
    {
      vraag: "Wat is een check-in?",
      antwoord: "Een check-in is een kort momentje om bij te houden hoe het met je gaat. Je beantwoordt een paar vragen en krijgt persoonlijke tips.",
    },
    {
      vraag: "Hoe vind ik hulp bij mij in de buurt?",
      antwoord: "Ga naar 'Hulp' in het menu. Daar vind je organisaties en hulpverleners bij jou in de buurt.",
    },
    {
      vraag: "Kan ik mijn gegevens aanpassen?",
      antwoord: "Ja! Ga naar je profiel via het icoontje rechtsboven of via 'Profiel' in het menu onderaan.",
    },
    {
      vraag: "Is mijn informatie veilig?",
      antwoord: "Ja. Je gegevens worden veilig opgeslagen en niet gedeeld met derden. Bekijk onze privacyverklaring voor meer informatie.",
    },
  ],
} as const
