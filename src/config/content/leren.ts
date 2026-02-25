/**
 * Leren/Informatie pagina teksten.
 */

export const lerenContent = {
  title: "Informatie, tips & hulpmiddelen",
  subtitle: "Hier vind je artikelen en tips die passen bij jouw situatie. Tik op een onderwerp om meer te lezen. Bewaar iets met het hartje.",

  gemeenteNieuws: {
    title: "Nieuws van de gemeente",
    badge: "Lokaal",
    emoji: "📍",
    subtitleFn: (gemeente: string) => `Updates uit ${gemeente}`,
    beschrijving: "Nieuws over mantelzorg in jouw gemeente",
  },

  landelijk: {
    title: "Landelijke hulplijnen",
    badge: "Landelijk",
    emoji: "🌍",
    beschrijving: "Hier vind je hulplijnen en informatie voor heel Nederland",
  },

  laden: "Laden...",
  fout: "Er ging iets mis",
  opnieuw: "Opnieuw proberen",
} as const
