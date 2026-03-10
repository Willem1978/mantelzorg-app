/**
 * Word MantelBuddy / vrijwilligers pagina teksten (/word-mantelbuddy).
 */

export const volunteerContent = {
  progress: (stap: number) => `Stap ${stap} van 3`,

  stap1: {
    title: "Word MantelBuddy",
    subtitle:
      "Help mantelzorgers dichtbij. Eenmalig of als vast maatje \u2014 je kiest zelf hoe je wilt helpen!",
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
    subtitle: "Kies de taken waarbij je wilt bijspringen",
    hulpTitle: "Ik wil helpen met:",
    beschikbaarheidTitle: "Beschikbaarheid",
    terug: "Terug",
    volgende: "Volgende",
  },

  // De 10 hulpcategorie\u00EBn \u2014 hulp voor de naaste (zorgvrager).
  // IDs komen overeen met ZORGTAKEN dbValues uit config/options.ts.
  hulpOpties: [
    { id: "Administratie en aanvragen", label: "Administratie", icon: "\uD83D\uDCCB", beschrijving: "Rekeningen, post, verzekeringen" },
    { id: "Plannen en organiseren", label: "Plannen & organiseren", icon: "\uD83D\uDCC5", beschrijving: "Arts, thuiszorg, afspraken" },
    { id: "Boodschappen", label: "Boodschappen", icon: "\uD83D\uDED2", beschrijving: "Supermarkt, apotheek" },
    { id: "Sociaal contact en activiteiten", label: "Sociaal contact", icon: "\uD83D\uDC65", beschrijving: "Gesprekken, uitjes, wandelen" },
    { id: "Vervoer", label: "Vervoer", icon: "\uD83D\uDE97", beschrijving: "Ziekenhuis, huisarts, familie" },
    { id: "Persoonlijke verzorging", label: "Persoonlijke verzorging", icon: "\uD83D\uDEC1", beschrijving: "Wassen, aankleden, medicijnen" },
    { id: "Bereiden en/of nuttigen van maaltijden", label: "Maaltijden", icon: "\uD83C\uDF7D\uFE0F", beschrijving: "Koken, maaltijden, dieet" },
    { id: "Huishoudelijke taken", label: "Huishoudelijke taken", icon: "\uD83C\uDFE0", beschrijving: "Schoonmaken, was, opruimen" },
    { id: "Klusjes in en om het huis", label: "Klusjes", icon: "\uD83D\uDD28", beschrijving: "Reparaties, tuin, onderhoud" },
    { id: "Huisdieren", label: "Huisdieren", icon: "\uD83D\uDC15", beschrijving: "Verzorging huisdieren" },
  ],

  beschikbaarheidOpties: [
    { id: "eenmalig", label: "Eenmalige taken", beschrijving: "Af en toe een taak oppakken wanneer het jou uitkomt" },
    { id: "vast", label: "Vast maatje worden", beschrijving: "Regelmatig bijspringen voor een vaste mantelzorger" },
    { id: "beide", label: "Beide", beschrijving: "Flexibel inzetbaar \u2014 zowel eenmalig als vast" },
  ],

  stap3: {
    title: "Vertel iets over jezelf",
    subtitle: "Dit helpt bij het vinden van de juiste match",
    motivatieLabel: "Waarom wil je MantelBuddy worden?",
    motivatiePlaceholder: "Vertel waarom je mantelzorgers wilt helpen...",
    ervaringLabel: "Heb je ervaring met mantelzorg of vrijwilligerswerk? (niet verplicht)",
    ervaringPlaceholder: "Bijv. zelf mantelzorger geweest, vrijwilligerswerk gedaan...",
    naAanmelding: {
      title: "Wat gebeurt er na aanmelding?",
      stappen: [
        "Je ontvangt een bevestigingsmail",
        "We nemen contact op voor een kennismakingsgesprek",
        "Na goedkeuring word je gekoppeld aan mantelzorgers dichtbij",
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
