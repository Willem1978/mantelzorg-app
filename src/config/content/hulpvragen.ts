/**
 * Hulpvragen pagina teksten.
 */

export const hulpvragenContent = {
  title: "Hulp vinden en regelen",
  subtitlePrefix: "Kies hieronder voor wie je hulp zoekt. Tik op het ",
  subtitleHartje: "hartje",
  subtitleSuffix: " om iets te bewaren.",

  tabs: {
    voorJou: {
      emoji: "\uD83D\uDC9C",
      label: "Voor jou",
      introTitle: "\uD83D\uDC9C Hulp voor jou als mantelzorger.",
      beschrijving:
        "Je doet heel veel voor een ander. Maar ook jij mag hulp krijgen. Hier vind je wat er voor jou is.",
    },
    voorNaaste: {
      emoji: "\uD83D\uDC9D",
      label: "Voor naaste",
      introTitle: "\uD83D\uDC9D Hulp voor je naaste.",
      beschrijving: "Hier vind je hulp voor de taken die je voor je naaste doet.",
      zwareTakenHint: " De kleuren laten zien hoe zwaar een taak voor jou is.",
    },
  },

  balanstest: {
    doe: "Doe de Balanscheck",
    uitleg: "Dan kleuren we de tegels op basis van wat je zwaar vindt.",
  },

  locatie: {
    vulWoonplaatsIn: "Vul je woonplaats in voor hulp dichtbij \u2192",
    vulNaasteWoonplaatsIn:
      "Vul de woonplaats van je naaste in voor hulp dichtbij \u2192",
  },

  hulpbronnenCount: (n: number) => `${n} hulpbron${n > 1 ? "nen" : ""}`,

  breadcrumb: {
    hulp: "Hulp",
  },

  filters: {
    inJeBuurt: "In je buurt",
    inBuurtNaaste: "In de buurt van je naaste",
    lokaal: "Lokaal",
    alles: "Alles",
    landelijkBeschikbaar: "Landelijk beschikbaar",
  },

  taakStatus: {
    zwaar: "Zwaar",
    gemiddeld: "Matig",
    licht: "Goed",
  } as Record<string, string>,

  leeg: {
    title: "Nog geen hulpbronnen gevonden",
    metLocatie: (locatie: string) =>
      `Er zijn nog geen hulpbronnen voor deze categorie bij ${locatie}.`,
    zonderLocatieMantelzorger:
      "Vul je woonplaats in bij je profiel zodat we hulp dichtbij kunnen tonen.",
    zonderLocatieNaaste:
      "Vul de woonplaats van je naaste in bij je profiel zodat we hulp dichtbij kunnen tonen.",
  },

  kaart: {
    landelijk: "Landelijk",
    meerInfo: "Meer info \u2192",
  },

  buddy: {
    title: "Hulp van een vrijwilliger?",
    beschrijving:
      "Een MantelBuddy springt bij met kleine taken dichtbij",
  },

  mijnVragen: {
    title: "Mijn vragen",
    beschrijving:
      "Hier zie je de vragen die je hebt gesteld. We zoeken hulp voor je en laten het je weten als er een reactie is.",
    nieuweVraag: "+ Nieuwe vraag stellen",
  },

  nieuweHulpvraag: {
    title: "Nieuwe hulpvraag",
    beschrijving:
      "Vertel waar je hulp bij nodig hebt. Wij zoeken dan iemand die je kan helpen.",
    onderwerp: "Waar gaat het over?",
    korteVraag: "Korte vraag",
    korteVraagPlaceholder: "Bijv: Ik zoek hulp bij boodschappen",
    meerUitleg: "Meer uitleg",
    meerUitlegPlaceholder: "Vertel meer over wat je nodig hebt...",
    annuleren: "Niet nu",
    verstuur: "Verstuur",
    bezig: "Versturen...",
  },

  geenVragen: "Nog geen vragen gesteld",

  status: {
    antwoord: "Antwoord",
    antwoordLabel: "Antwoord:",
    nieuw: "Nieuw",
    afgerond: "Afgerond",
  },

  errors: {
    ladenTitle: "Oeps, dat lukte niet",
    ladenSubtitle:
      "Probeer het opnieuw. Werkt het nog steeds niet? Neem dan contact met ons op.",
    opnieuwProberen: "Opnieuw proberen",
    contentLaden: "Oeps, dat lukte niet. Probeer het opnieuw.",
    categorieFout: "Oeps, dat lukte niet. Probeer het opnieuw.",
  },

  terug: "Terug",
} as const
