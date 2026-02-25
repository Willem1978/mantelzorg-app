/**
 * Centrale kleurdefinities voor semantische kleuren.
 * Gebruik deze in plaats van losse hex-codes of Tailwind-kleuren
 * voor scores, statussen en niveaus.
 *
 * CSS variabelen staan in globals.css — dit bestand is voor
 * plekken waar je hex-codes nodig hebt (PDF, images, canvas, etc.)
 */

// Score/belasting niveau kleuren
export const scoreColors = {
  laag: {
    hex: "#2E7D32",
    hexBg: "#E8F5E9",
    tailwind: "text-accent-green",
    tailwindBg: "bg-accent-green-bg",
    cssVar: "var(--accent-green)",
    cssVarBg: "var(--accent-green-bg)",
    rgb: [46, 125, 50] as const,
    rgbBg: [232, 245, 233] as const,
    label: "Laag",
  },
  gemiddeld: {
    hex: "#C86800",
    hexBg: "#FFF3E0",
    tailwind: "text-accent-amber",
    tailwindBg: "bg-accent-amber-bg",
    cssVar: "var(--accent-amber)",
    cssVarBg: "var(--accent-amber-bg)",
    rgb: [200, 104, 0] as const,
    rgbBg: [255, 243, 224] as const,
    label: "Gemiddeld",
  },
  hoog: {
    hex: "#B71C1C",
    hexBg: "#FFEBEE",
    tailwind: "text-accent-red",
    tailwindBg: "bg-accent-red-bg",
    cssVar: "var(--accent-red)",
    cssVarBg: "var(--accent-red-bg)",
    rgb: [183, 28, 28] as const,
    rgbBg: [255, 235, 238] as const,
    label: "Hoog",
  },
} as const

// Type helper
export type ScoreNiveau = keyof typeof scoreColors

// Helper: geef kleuren op basis van niveau string
export function getScoreColors(niveau: string) {
  const key = niveau.toLowerCase() as ScoreNiveau
  return scoreColors[key] || scoreColors.gemiddeld
}

// Emoticon kleuren (voor SmileyButton etc.)
export const emoticonColors = {
  nee: { bg: "#7CB342", face: "#558B2F", label: "Goed" },
  soms: { bg: "#FFD54F", face: "#F9A825", label: "Gaat wel" },
  ja: { bg: "#EF5350", face: "#C62828", label: "Niet goed" },
} as const

// Agenda event type kleuren
export const eventTypeColors = {
  CARE_TASK: "#ef4444",
  APPOINTMENT: "#3b82f6",
  SELF_CARE: "#10b981",
  SOCIAL: "#8b5cf6",
  WORK: "#f59e0b",
  OTHER: "#6b7280",
} as const

// Urgentie kleuren (voor alarmen)
export const urgentieColors = {
  LOW: { bg: "bg-gray-100", text: "text-gray-700", border: "border-gray-200" },
  MEDIUM: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  HIGH: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
  CRITICAL: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
} as const

export const urgentieLabels: Record<string, string> = {
  LOW: "Laag",
  MEDIUM: "Midden",
  HIGH: "Hoog",
  CRITICAL: "Kritiek",
}

// Wellbeing chart kleuren
export const wellbeingChartColors = {
  algemeen: "#0d9488",
  fysiek: "#3b82f6",
  emotioneel: "#8b5cf6",
} as const

// Niveau Tailwind klassen (voor badges etc.)
export const niveauBadgeClasses: Record<string, string> = {
  LAAG: "bg-accent-green-bg text-accent-green",
  GEMIDDELD: "bg-accent-amber-bg text-accent-amber",
  HOOG: "bg-accent-red-bg text-accent-red",
}

// PDF rapport kleuren (consistent met app)
export const pdfColors = {
  primary: [44, 122, 123] as const,   // #2C7A7B - consistent met app
  primaryBg: [230, 255, 250] as const, // #E6FFFA
  groen: scoreColors.laag.rgb,
  groenBg: scoreColors.laag.rgbBg,
  oranje: scoreColors.gemiddeld.rgb,
  oranjeBg: scoreColors.gemiddeld.rgbBg,
  rood: scoreColors.hoog.rgb,
  roodBg: scoreColors.hoog.rgbBg,
  donker: [45, 55, 72] as const,    // #2D3748 - consistent met --foreground
  tekst: [74, 85, 104] as const,    // #4A5568 - consistent met --muted-foreground
  grijs: [128, 128, 128] as const,
  lichtgrijs: [245, 245, 245] as const,
  wit: [255, 255, 255] as const,
  rand: [203, 213, 224] as const,   // #CBD5E0 - consistent met --border
} as const
