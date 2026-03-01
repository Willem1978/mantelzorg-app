/**
 * Navigatie en menu teksten.
 */

export const navigation = {
  // Caregiver links — 5 items
  caregiverLinks: [
    { href: "/dashboard", label: "Home" },
    { href: "/leren", label: "Info & Tips" },
    { href: "/hulpvragen", label: "Hulp" },
    { href: "/buddys", label: "Mantelbuddy's" },
    { href: "/check-in", label: "Balanstest & Check-In" },
  ],

  // Organisatie links
  orgLinks: [
    { href: "/organisatie", label: "Home" },
    { href: "/organisatie/mantelzorgers", label: "Mensen" },
    { href: "/organisatie/rapportage", label: "Cijfers" },
  ],

  // Begroeting
  greeting: (name: string) => `Hoi ${name}`,

  // Profiel
  profielAriaLabel: "Mijn profiel",
} as const
