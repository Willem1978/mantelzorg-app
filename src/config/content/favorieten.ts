/**
 * Favorieten pagina teksten.
 */

export const favorietenContent = {
  title: "Mijn favorieten",
  emoji: "❤️",
  subtitle: "Alles wat je hebt bewaard op één plek.",

  leeg: {
    emoji: "💜",
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
    voorJou: { label: "Voor jou", emoji: "💜" },
    voorNaaste: { label: "Voor naaste", emoji: "💝" },
    informatie: { label: "Informatie", emoji: "📚" },
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
