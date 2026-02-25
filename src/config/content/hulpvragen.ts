/**
 * Hulpvragen pagina teksten.
 */

export const hulpvragenContent = {
  title: "Hulp vinden en regelen",
  subtitlePrefix: "Kies hieronder voor wie je hulp zoekt. Tik op het ",
  subtitleHartje: "hartje",
  subtitleSuffix: " om iets te bewaren.",
  belastingInfo: (niveau: string) =>
    `De hulp is afgestemd op jouw situatie (${niveau} belasting).`,
  belastingNiveaus: {
    LAAG: "lage",
    GEMIDDELD: "gemiddelde",
    HOOG: "hoge",
  } as Record<string, string>,

  tabs: {
    voorJou: {
      emoji: "💜",
      label: "Voor jou",
      introTitle: "💜 Hulp voor jou als mantelzorger.",
      beschrijving:
        "Mantelzorgen is zwaar werk. Ook je hebt soms hulp nodig. Hier vind je organisaties die je kunnen helpen.",
    },
    voorNaaste: {
      emoji: "💝",
      label: "Voor naaste",
      introTitle: "💝 Hulp voor je naaste.",
      beschrijving: "Hier vind je hulp voor de taken die je voor je naaste doet.",
      zwareTakenHint: " De kleuren laten zien hoe zwaar een taak voor jou is.",
    },
  },

  balanstest: {
    doe: "Doe de balanstest",
    uitleg: "Dan kleuren we de tegels op basis van wat je zwaar vindt.",
  },

  locatie: {
    vulWoonplaatsIn: "Vul je woonplaats in voor lokale hulp →",
    vulNaasteWoonplaatsIn:
      "Vul de woonplaats van je naaste in voor lokale hulp →",
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
    title: "Geen hulpbronnen gevonden",
    metLocatie: (locatie: string) =>
      `Er zijn nog geen hulpbronnen voor deze categorie bij ${locatie}.`,
    zonderLocatieMantelzorger:
      "Vul je woonplaats in bij je profiel zodat we lokale hulp kunnen tonen.",
    zonderLocatieNaaste:
      "Vul de woonplaats van je naaste in bij je profiel zodat we lokale hulp kunnen tonen.",
  },

  kaart: {
    landelijk: "Landelijk",
    meerInfo: "Meer info →",
  },

  buddy: {
    title: "Hulp van een vrijwilliger?",
    beschrijving:
      "Een MantelBuddy helpt met kleine taken bij jou in de buurt",
  },

  mijnVragen: {
    title: "Mijn vragen",
    beschrijving:
      "Hier zie je de vragen die je hebt gesteld. Wij zoeken hulp voor je en laten je weten als er een antwoord is.",
    nieuweVraag: "+ Nieuwe vraag stellen",
  },

  nieuweHulpvraag: {
    title: "Nieuwe hulpvraag",
    beschrijving:
      "Vertel ons waar je hulp bij nodig hebt. Wij zoeken dan iemand die je kan helpen.",
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
    antwoordLabel: "Antwoord:",
    nieuw: "Nieuw",
    afgerond: "Afgerond",
  },

  errors: {
    ladenTitle: "Er ging iets mis bij het laden",
    ladenSubtitle:
      "Probeer het opnieuw. Werkt het nog steeds niet? Neem dan contact met ons op.",
    opnieuwProberen: "Opnieuw proberen",
    contentLaden: "Fout bij laden van content",
    categorieFout: "Er ging iets mis bij het laden van categorieën.",
  },

  terug: "Terug",
} as const
