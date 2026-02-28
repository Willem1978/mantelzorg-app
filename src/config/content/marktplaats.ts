/**
 * Marktplaats pagina teksten (B1 taalgebruik).
 */

export const marktplaatsContent = {
  title: "Hulpaanvragen",
  subtitle: "Vraag hulp bij een zorgtaak. Vrijwilligers bij jou in de buurt kunnen helpen.",

  // Intro blok
  intro: {
    title: "🤝 Hulp van een MantelBuddy",
    beschrijving:
      "Kies een taak waarvoor je hulp nodig hebt. Vertel wat je nodig hebt. Een vrijwilliger kan dan reageren.",
  },

  // Taak selectie
  taakSelectie: {
    title: "Bij welke taak heb je hulp nodig?",
    subtitle: "Kies de taak die het zwaarst voor je is.",
  },

  // Formulier
  formulier: {
    title: "Vertel meer over je hulpvraag",
    watHebJeNodig: "Wat heb je nodig?",
    watHebJeNodigPlaceholder: "Bijv: Hulp bij boodschappen doen, 1x per week",
    wanneer: "Wanneer?",
    wanneerPlaceholder: "Bijv: Op dinsdag of donderdag",
    extraInfo: "Wil je nog iets vertellen?",
    extraInfoPlaceholder: "Bijv: Mijn naaste woont op de 2e verdieping zonder lift",
    verstuur: "Plaats hulpvraag",
    bezig: "Versturen...",
    annuleren: "Annuleren",
  },

  // Succes
  succes: {
    title: "Je hulpvraag is geplaatst!",
    tekst: "We zoeken een MantelBuddy voor je. Je krijgt bericht als iemand kan helpen.",
    nogEen: "Nog een vraag plaatsen",
    naarDashboard: "Terug naar home",
  },

  // Mijn hulpvragen
  mijnVragen: {
    title: "Mijn hulpvragen",
    leeg: "Je hebt nog geen hulpvragen geplaatst.",
    status: {
      OPEN: "Open",
      MATCHED: "Buddy gevonden",
      IN_BEHANDELING: "In behandeling",
      AFGEROND: "Afgerond",
      GEANNULEERD: "Geannuleerd",
    } as Record<string, string>,
    statusKleur: {
      OPEN: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
      MATCHED: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
      IN_BEHANDELING: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
      AFGEROND: "bg-gray-100 text-gray-600 dark:bg-gray-800/30 dark:text-gray-400",
      GEANNULEERD: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    } as Record<string, string>,
  },

  // Lege staat
  leeg: {
    title: "Geen hulpvragen",
    tekst: "Plaats een hulpvraag om te beginnen.",
  },

  // Fouten
  errors: {
    laden: "Oeps, dat lukte niet. Probeer het opnieuw.",
    versturen: "Oeps, dat lukte niet. Probeer het opnieuw.",
    veldVerplicht: "Dit veld is verplicht",
  },

  // Breadcrumbs
  breadcrumb: {
    home: "Home",
    marktplaats: "Hulpaanvragen",
  },

  // Taak zwaarte badges
  zwaarteBadge: {
    zwaar: { label: "Zwaar", kleur: "bg-accent-red-bg text-accent-red" },
    matig: { label: "Matig", kleur: "bg-accent-amber-bg text-accent-amber" },
    goed: { label: "Goed", kleur: "bg-accent-green-bg text-accent-green" },
  },
} as const
