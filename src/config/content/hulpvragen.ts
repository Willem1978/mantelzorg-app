/**
 * Hulpvragen pagina teksten.
 */

export const hulpvragenContent = {
  title: "Hulp vinden en regelen",
  subtitle: "Kies hieronder voor wie je hulp zoekt. Tik op het hartje om iets te bewaren.",

  tabs: {
    voorJou: {
      emoji: "💜",
      label: "Hulp voor jou als mantelzorger",
      beschrijving: "Mantelzorgen is zwaar werk. Ook je hebt soms hulp nodig.",
    },
    voorNaaste: {
      emoji: "💝",
      label: "Hulp voor je naaste",
      beschrijving: "Hier vind je hulp voor de taken die je voor je naaste doet.",
    },
  },

  balanstest: {
    doe: "Doe de balanstest",
    uitleg: "Dan kleuren we de tegels op basis van wat je zwaar vindt.",
  },

  filters: {
    inJeBuurt: "In je buurt",
    inBuurtNaaste: "In de buurt van je naaste",
    lokaal: "Lokaal",
    alles: "Alles",
  },

  leeg: {
    title: "Geen hulpbronnen gevonden",
    subtitle: "Er zijn nog geen hulpbronnen voor deze categorie.",
  },

  buddy: {
    title: "Hulp van een vrijwilliger?",
    beschrijving: "Een MantelBuddy helpt met kleine taken bij jou in de buurt",
  },

  mijnVragen: {
    title: "Mijn vragen",
    beschrijving: "Hier zie je de vragen die je hebt gesteld. Wij zoeken hulp voor je en laten je weten als er een antwoord is.",
    nieuweVraag: "Nieuwe vraag stellen",
  },

  nieuweHulpvraag: {
    title: "Nieuwe hulpvraag",
    beschrijving: "Vertel ons waar je hulp bij nodig hebt. Wij zoeken dan iemand die je kan helpen.",
    onderwerp: "Waar gaat het over?",
    korteVraag: "Korte vraag",
    korteVraagPlaceholder: "Bijv: Ik zoek hulp bij boodschappen",
    meerUitleg: "Meer uitleg",
    meerUitlegPlaceholder: "Vertel meer over wat je nodig hebt...",
    annuleren: "Annuleren",
    verstuur: "Verstuur",
    bezig: "Versturen...",
  },

  geenVragen: "Nog geen vragen gesteld",

  status: {
    antwoord: "Antwoord",
    nieuw: "Nieuw",
    afgerond: "Afgerond",
  },
} as const
