/**
 * Landing pagina teksten (/).
 */

export const landingContent = {
  hero: {
    title: "Je staat er niet alleen voor",
    subtitle:
      "MantelBuddy helpt mantelzorgers met rust, inzicht en steun van dichtbij. Vrijwillige MantelBuddy\u2019s staan klaar om bij te springen wanneer nodig.",
  },

  cards: {
    mantelzorger: {
      title: "Ik ben mantelzorger",
      beschrijving:
        "Ontdek hoe het met je gaat, vind hulp dichtbij en krijg steun van een MantelBuddy wanneer je dat nodig hebt.",
      button: "Ga verder",
    },
    buddy: {
      title: "Ik wil MantelBuddy worden",
      beschrijving:
        "Maak het verschil voor iemand bij jou in de buurt. Als vast maatje of door af en toe even bij te springen.",
      button: "Meld je aan",
    },
  },

  howItWorks: {
    title: "Zo werkt MantelBuddy",
    mantelzorgers: {
      label: "Voor mantelzorgers",
      stappen: [
        { title: "Ontdek hoe het gaat", beschrijving: "Doe de Balanscheck en zie in 5 minuten hoe het met je gaat" },
        { title: "Bekijk wat er in jouw buurt is", beschrijving: "Vind hulp, tips en organisaties dichtbij" },
        { title: "Even overnemen", beschrijving: "Een MantelBuddy uit je buurt springt bij wanneer nodig" },
      ],
    },
    buddys: {
      label: "Voor MantelBuddy\u2019s",
      stappen: [
        { title: "Meld je aan", beschrijving: "Vertel waar je goed in bent en wat je leuk vindt" },
        { title: "Match dichtbij", beschrijving: "We koppelen je aan iemand bij jou in de buurt" },
        { title: "Maak het verschil", beschrijving: "Help eenmalig of word een vast maatje" },
      ],
    },
  },

  watIsEenBuddy: {
    title: "Wat is een MantelBuddy?",
    beschrijving:
      "Een MantelBuddy is een vrijwilliger uit de buurt die even bijspringt. Je kunt helpen wanneer het jou uitkomt, of een vast maatje worden. Elke vorm van hulp telt.",
    opties: [
      { title: "Luisterend oor", beschrijving: "Even bijpraten, een kop koffie, of gewoon er zijn" },
      { title: "Praktische hulp", beschrijving: "Boodschappen, vervoer, of klusjes in huis" },
      { title: "Even overnemen", beschrijving: "Bij de zorgvrager zijn zodat de mantelzorger even op adem kan komen" },
    ],
  },

  cta: {
    title: "Samen zorgen we voor elkaar",
    beschrijving: "Of je nu hulp zoekt of hulp wilt bieden \u2014 bij MantelBuddy ben je welkom.",
    mantelzorgerButton: "Ik ben mantelzorger",
    helpenButton: "Ik wil helpen",
  },

  footer: {
    mantelzorgers: {
      title: "Voor mantelzorgers",
      links: {
        home: "Home",
        balanstest: "Balanscheck",
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
