/**
 * Navigatie en menu teksten.
 */

export const navigation = {
  // Caregiver links
  caregiverLinks: [
    { href: "/dashboard", label: "Home" },
    { href: "/leren", label: "Informatie" },
    { href: "/hulpvragen", label: "Hulp" },
    { href: "/buddys", label: "Buddyhulp" },
    { href: "/balanstest", label: "Balanstest" },
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
