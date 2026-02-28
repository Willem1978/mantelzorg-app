/**
 * Navigatie en menu teksten.
 */

export const navigation = {
  // Caregiver links — vereenvoudigd tot 4 items
  caregiverLinks: [
    { href: "/dashboard", label: "Home" },
    { href: "/hulpvragen", label: "Hulp" },
    { href: "/check-in", label: "Check-in" },
    { href: "/leren", label: "Info & tips" },
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
