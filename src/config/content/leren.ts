/**
 * Leren/Informatie pagina teksten.
 */

export const lerenContent = {
  title: "Informatie, tips & hulpmiddelen",
  emoji: "📚",
  subtitle: "Hier vind je artikelen en tips die passen bij jouw situatie. Tik op een onderwerp om meer te lezen. Bewaar iets met het hartje.",

  gemeenteNieuws: {
    title: "Nieuws van de gemeente",
    emoji: "🏘️",
    badge: "Lokaal",
    badgeEmoji: "📍",
    subtitleFn: (gemeente: string) => `Updates uit ${gemeente}`,
    subtitleTwoFn: (gemeente1: string, gemeente2: string) => `Updates uit ${gemeente1} en ${gemeente2}`,
    beschrijving: "Nieuws over mantelzorg in jouw gemeente",
  },

  landelijk: {
    title: "Landelijke hulplijnen",
    emoji: "🌍",
    badge: "Landelijk",
    badgeEmoji: "🌍",
    beschrijving: "Hier vind je hulplijnen en informatie voor heel Nederland",
  },

  artikelenCountFn: (aantal: number) => `${aantal} artikelen`,

  laden: "Laden...",
  fout: "Oeps, dat lukte niet",
  foutLadenCategorieen: "Oeps, dat lukte niet",
  foutLadenCategorieenBeschrijving: "Oeps, dat lukte niet. Probeer het opnieuw.",
  opnieuw: "Opnieuw proberen",
} as const
