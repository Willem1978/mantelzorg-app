import { cn } from "@/lib/utils"

/**
 * SVG-iconen voor de drie deelgebieden (Energie, Gevoel, Tijd).
 * Gebruik in plaats van emoji's voor een consistent, modern uiterlijk.
 *
 * Props:
 * - naam: de deelgebied-naam ("Jouw energie", "Jouw gevoel", "Jouw tijd")
 *         of de korte variant ("energie", "gevoel", "tijd")
 * - size: "sm" (16px), "md" (24px, default), "lg" (32px)
 * - className: extra Tailwind klassen (bijv. kleuren)
 */

type DeelgebiedNaam =
  | "Jouw energie" | "energie" | "Energie"
  | "Jouw gevoel" | "gevoel" | "Gevoel"
  | "Jouw tijd" | "tijd" | "Tijd"

const SIZE_MAP = { sm: "w-4 h-4", md: "w-6 h-6", lg: "w-8 h-8" } as const

interface DeelgebiedIconProps {
  naam: string
  size?: "sm" | "md" | "lg"
  className?: string
}

function normalizeNaam(naam: string): "energie" | "gevoel" | "tijd" | null {
  const lower = naam.toLowerCase()
  if (lower.includes("energie")) return "energie"
  if (lower.includes("gevoel")) return "gevoel"
  if (lower.includes("tijd")) return "tijd"
  return null
}

function EnergieIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <rect x="6" y="10" width="12" height="10" rx="2" />
      <rect x="9" y="6" width="6" height="4" rx="1" />
      <rect x="10" y="13" width="4" height="4" rx="0.5" fill="currentColor" opacity={0.3} />
    </svg>
  )
}

function GevoelIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z" fill="currentColor" opacity={0.15} />
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z" />
    </svg>
  )
}

function TijdIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" fill="currentColor" opacity={0.1} />
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

export function DeelgebiedIcon({ naam, size = "md", className }: DeelgebiedIconProps) {
  const type = normalizeNaam(naam)
  const sizeClass = SIZE_MAP[size]
  const combinedClass = cn(sizeClass, className)

  switch (type) {
    case "energie":
      return <EnergieIcon className={combinedClass} />
    case "gevoel":
      return <GevoelIcon className={combinedClass} />
    case "tijd":
      return <TijdIcon className={combinedClass} />
    default:
      return null
  }
}

export { EnergieIcon, GevoelIcon, TijdIcon }
