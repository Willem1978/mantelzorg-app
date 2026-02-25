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
    title: "Wat wil je doen?",
    subtitle: "Selecteer de manieren waarop je wilt helpen",
    hulpTitle: "Ik wil helpen met:",
    beschikbaarheidTitle: "Beschikbaarheid",
    terug: "Terug",
    volgende: "Volgende",
  },

  hulpOpties: [
    { id: "gesprek", label: "Gesprek / luisterend oor", icon: "☕", beschrijving: "Even bijpraten, koffiedrinken" },
    { id: "boodschappen", label: "Boodschappen doen", icon: "🛒", beschrijving: "Supermarkt, apotheek" },
    { id: "vervoer", label: "Vervoer", icon: "🚗", beschrijving: "Naar afspraken of uitjes" },
    { id: "klusjes", label: "Klusjes in huis", icon: "🔧", beschrijving: "Kleine reparaties, tuin" },
    { id: "oppas", label: "Oppas/gezelschap", icon: "🏠", beschrijving: "Bij de zorgvrager zijn" },
    { id: "administratie", label: "Administratie", icon: "📋", beschrijving: "Papierwerk, formulieren" },
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
