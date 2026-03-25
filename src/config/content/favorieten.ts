/**
 * Favorieten pagina teksten.
 */

export const favorietenContent = {
  title: "Mijn hulpbronnen",
  emoji: "\uD83D\uDCCB",
  subtitle: "Alles wat je hebt bewaard op \u00E9\u00E9n plek.",

  leeg: {
    emoji: "\uD83D\uDC9C",
    title: "Je hebt nog geen favorieten",
    beschrijvingPrefix: "Op de ",
    hulpLabel: "Hulp",
    beschrijvingMidden: " en ",
    informatieLabel: "Informatie",
    beschrijvingSuffix: " pagina kun je op het hartje tikken. Dan verschijnen ze hier.",
    naarHulp: "Naar Hulp",
    naarInformatie: "Naar Informatie",
  },

  kiesCategorieHint: "Kies een categorie om je bewaarde items te bekijken.",

  tabs: {
    voorJou: { label: "Mijn hulpbronnen", emoji: "\uD83D\uDCCB" },
    voorNaaste: { label: "Voor naaste", emoji: "\uD83D\uDC9D" },
    informatie: { label: "Informatie", emoji: "\uD83D\uDCDA" },
  },

  afgerondHint: "Klaar met een item? Tik op ",
  afgerondHintLabel: "Afgerond",
  afgerondHintSuffix: " om af te vinken.",

  status: {
    afgerond: "Afgerond",
    nietAfgerond: "Niet afgerond",
  },

  verwijderen: "Verwijderen",
  website: "Website",
  overig: "Overig",
} as const
