/**
 * Word MantelBuddy / vrijwilligers pagina teksten (/word-mantelbuddy).
 */

export const volunteerContent = {
  progress: (stap: number) => `Stap ${stap} van 3`,

  stap1: {
    title: "Word MantelBuddy",
    subtitle:
      "Help mantelzorgers in je buurt. Eenmalig of als vast maatje - je kiest hoe je wilt helpen!",
    gegevensTitle: "Jouw gegevens",
    labels: {
      voornaam: "Voornaam *",
      achternaam: "Achternaam *",
      email: "E-mailadres *",
      telefoon: "Telefoonnummer *",
      postcode: "Postcode *",
      gemeente: "Gemeente *",
    },
    placeholders: {
      voornaam: "Jan",
      achternaam: "Jansen",
      email: "jan@voorbeeld.nl",
      telefoon: "06-12345678",
      postcode: "1234 AB",
      gemeente: "Typ je gemeente (bijv. Nijmegen)",
    },
    volgende: "Volgende",
  },

  stap2: {
    title: "Waarbij wil je helpen?",
    subtitle: "Kies de taken waarbij je de zorgvrager wilt ondersteunen",
    hulpTitle: "Ik wil helpen met:",
    beschikbaarheidTitle: "Beschikbaarheid",
    terug: "Terug",
    volgende: "Volgende",
  },

  // De 10 hulpcategorieën — hulp voor de naaste (zorgvrager).
  // IDs komen overeen met ZORGTAKEN dbValues uit config/options.ts.
  hulpOpties: [
    { id: "Administratie en aanvragen", label: "Administratie", icon: "📋", beschrijving: "Rekeningen, post, verzekeringen" },
    { id: "Plannen en organiseren", label: "Plannen & organiseren", icon: "📅", beschrijving: "Arts, thuiszorg, afspraken" },
    { id: "Boodschappen", label: "Boodschappen", icon: "🛒", beschrijving: "Supermarkt, apotheek" },
    { id: "Sociaal contact en activiteiten", label: "Sociaal contact", icon: "👥", beschrijving: "Gesprekken, uitjes, wandelen" },
    { id: "Vervoer", label: "Vervoer", icon: "🚗", beschrijving: "Ziekenhuis, huisarts, familie" },
    { id: "Persoonlijke verzorging", label: "Persoonlijke verzorging", icon: "🛁", beschrijving: "Wassen, aankleden, medicijnen" },
    { id: "Bereiden en/of nuttigen van maaltijden", label: "Maaltijden", icon: "🍽️", beschrijving: "Koken, maaltijden, dieet" },
    { id: "Huishoudelijke taken", label: "Huishoudelijke taken", icon: "🏠", beschrijving: "Schoonmaken, was, opruimen" },
    { id: "Klusjes in en om het huis", label: "Klusjes", icon: "🔨", beschrijving: "Reparaties, tuin, onderhoud" },
    { id: "Huisdieren", label: "Huisdieren", icon: "🐕", beschrijving: "Verzorging huisdieren" },
  ],

  beschikbaarheidOpties: [
    { id: "eenmalig", label: "Eenmalige taken", beschrijving: "Af en toe een taak oppakken wanneer het jou uitkomt" },
    { id: "vast", label: "Vast maatje worden", beschrijving: "Regelmatig taken voor de zorgvrager oppakken en uitvoeren" },
    { id: "beide", label: "Beide", beschrijving: "Flexibel inzetbaar - zowel eenmalig als vast" },
  ],

  stap3: {
    title: "Vertel iets over jezelf",
    subtitle: "Dit helpt bij het matchen met de juiste mantelzorger",
    motivatieLabel: "Waarom wil je MantelBuddy worden?",
    motivatiePlaceholder: "Vertel waarom je mantelzorgers wilt helpen...",
    ervaringLabel: "Heb je ervaring met mantelzorg of vrijwilligerswerk? (optioneel)",
    ervaringPlaceholder: "Bijv. zelf mantelzorger geweest, vrijwilligerswerk gedaan...",
    naAanmelding: {
      title: "Wat gebeurt er na aanmelding?",
      stappen: [
        "Je ontvangt een bevestigingsmail",
        "We nemen contact op voor een kennismakingsgesprek",
        "Na goedkeuring word je gekoppeld aan mantelzorgers in je buurt",
      ],
    },
    terug: "Terug",
    aanmelden: "Aanmelden",
    bezig: "Bezig...",
  },

  stap4: {
    title: "Bedankt voor je aanmelding!",
    subtitle:
      "We hebben je aanmelding ontvangen. Je ontvangt binnenkort een e-mail met meer informatie over de volgende stappen.",
    volgendeStappen: {
      title: "Volgende stappen:",
      items: [
        "Je ontvangt een bevestigingsmail",
        "Kennismakingsgesprek (telefonisch of video)",
        "VOG-aanvraag en korte training",
        "Start als MantelBuddy!",
      ],
    },
    terugNaarHome: "Terug naar home",
  },
} as const
