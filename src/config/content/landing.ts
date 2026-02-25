/**
 * Landing pagina teksten (/).
 */

export const landingContent = {
  hero: {
    title: "Samen zorgen, samen sterk",
    subtitle:
      "MantelBuddy is er voor iedere mantelzorger. Krijg inzicht, informatie en zie lokale hulp. Vrijwillige MantelBuddy\u2019s staan klaar om bij te springen wanneer nodig.",
  },

  cards: {
    mantelzorger: {
      title: "Ik ben mantelzorger",
      beschrijving:
        "Krijg snel inzicht in je belasting en taken. Vind hulp en advies in de buurt. Roep hulp in van betrouwbare MantelBuddy\u2019s.",
      button: "Ga verder",
    },
    buddy: {
      title: "Ik wil MantelBuddy worden",
      beschrijving:
        "Help mantelzorgers in je buurt. Als vast maatje of door eenmalig een taak op te pakken.",
      button: "Meld je aan",
    },
  },

  howItWorks: {
    title: "Hoe werkt MantelBuddy?",
    mantelzorgers: {
      label: "Voor mantelzorgers",
      stappen: [
        { title: "Krijg inzicht", beschrijving: "Doe de Balanstest en zie hoe het met je gaat" },
        { title: "Vind snel hulp in de buurt", beschrijving: "Lokale organisaties en advies op maat" },
        { title: "Roep hulp in van een MantelBuddy", beschrijving: "Betrouwbare vrijwilligers uit je buurt" },
      ],
    },
    buddys: {
      label: "Voor MantelBuddy\u2019s",
      stappen: [
        { title: "Meld je aan", beschrijving: "Vertel wat je wilt bijdragen" },
        { title: "Match in de buurt", beschrijving: "We koppelen je aan iemand dichtbij" },
        { title: "Maak het verschil", beschrijving: "Eenmalig of als vast maatje" },
      ],
    },
  },

  watIsEenBuddy: {
    title: "Wat is een MantelBuddy?",
    beschrijving:
      "Een MantelBuddy is een vrijwilliger uit de buurt die mantelzorgers ondersteunt. Je kunt eenmalig helpen wanneer het jou uitkomt, of een vast maatje worden en regelmatig taken voor de zorgvrager oppakken.",
    opties: [
      { title: "Luisterend oor", beschrijving: "Even bijpraten, een kop koffie, of gewoon er zijn" },
      { title: "Praktische hulp", beschrijving: "Boodschappen, vervoer, of klusjes in huis" },
      { title: "Oppas", beschrijving: "Even bij de zorgvrager zijn zodat de mantelzorger even weg kan" },
    ],
  },

  cta: {
    title: "Samen zorgen we voor elkaar",
    beschrijving: "Of je nu hulp zoekt of hulp wilt bieden - bij MantelBuddy ben je welkom.",
    mantelzorgerButton: "Ik ben mantelzorger",
    helpenButton: "Ik wil helpen",
  },

  footer: {
    mantelzorgers: {
      title: "Voor mantelzorgers",
      links: {
        home: "Home",
        balanstest: "Balanstest",
        inloggen: "Inloggen",
      },
    },
    vrijwilligers: {
      title: "Voor vrijwilligers",
      links: {
        wordBuddy: "Word MantelBuddy",
        inloggen: "Inloggen",
      },
    },
    contact: {
      title: "Contact",
      email: "info@mantelbuddy.nl",
      mantelzorglijn: "Mantelzorglijn: 030 - 205 90 59",
      beheer: "Beheer hulpbronnen",
    },
    copyright: "\u00A9 2026 MantelBuddy. Samen sterk voor mantelzorgers.",
  },
} as const
