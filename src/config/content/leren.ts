/**
 * Leren/Informatie pagina teksten.
 */

export const lerenContent = {
  title: "Informatie, tips & hulpmiddelen",
  emoji: "\uD83D\uDCDA",
  subtitle: "Hier vind je artikelen en tips die bij jouw situatie passen. Tik op een onderwerp om meer te lezen. Bewaar iets met het hartje.",

  gemeenteNieuws: {
    title: "Nieuws uit je gemeente",
    emoji: "\uD83C\uDFD8\uFE0F",
    badge: "Lokaal",
    badgeEmoji: "\uD83D\uDCCD",
    subtitleFn: (gemeente: string) => `Updates uit ${gemeente}`,
    subtitleTwoFn: (gemeente1: string, gemeente2: string) => `Updates uit ${gemeente1} en ${gemeente2}`,
    beschrijving: "Nieuws over mantelzorg dichtbij",
  },

  landelijk: {
    title: "Landelijke hulplijnen",
    emoji: "\uD83C\uDF0D",
    badge: "Landelijk",
    badgeEmoji: "\uD83C\uDF0D",
    beschrijving: "Hulplijnen en informatie voor heel Nederland",
  },

  artikelenCountFn: (aantal: number) => `${aantal} artikelen`,

  laden: "Laden...",
  fout: "Oeps, dat lukte niet",
  foutLadenCategorieen: "Oeps, dat lukte niet",
  foutLadenCategorieenBeschrijving: "Oeps, dat lukte niet. Probeer het opnieuw.",
  opnieuw: "Opnieuw proberen",
} as const
