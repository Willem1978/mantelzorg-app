/**
 * Centrale kleurdefinities voor semantische kleuren.
 * Gebruik deze in plaats van losse hex-codes of Tailwind-kleuren
 * voor scores, statussen en niveaus.
 *
 * CSS variabelen staan in globals.css — dit bestand is voor
 * plekken waar je hex-codes nodig hebt (PDF, images, canvas, etc.)
 */

// Score/belasting niveau kleuren — verhoogd contrast, warmer palet
export const scoreColors = {
  laag: {
    hex: "#1B7A3D",
    hexBg: "#E5F5EA",
    tailwind: "text-accent-green",
    tailwindBg: "bg-accent-green-bg",
    cssVar: "var(--accent-green)",
    cssVarBg: "var(--accent-green-bg)",
    rgb: [27, 122, 61] as const,
    rgbBg: [229, 245, 234] as const,
    label: "Laag",
  },
  gemiddeld: {
    hex: "#A85E00",
    hexBg: "#FFF3E0",
    tailwind: "text-accent-amber",
    tailwindBg: "bg-accent-amber-bg",
    cssVar: "var(--accent-amber)",
    cssVarBg: "var(--accent-amber-bg)",
    rgb: [168, 94, 0] as const,
    rgbBg: [255, 243, 224] as const,
    label: "Gemiddeld",
  },
  hoog: {
    hex: "#A52019",
    hexBg: "#FDECEB",
    tailwind: "text-accent-red",
    tailwindBg: "bg-accent-red-bg",
    cssVar: "var(--accent-red)",
    cssVarBg: "var(--accent-red-bg)",
    rgb: [165, 32, 25] as const,
    rgbBg: [253, 236, 235] as const,
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
  nee: { bg: "#8DB793", face: "#1B7A3D", label: "Goed" },
  soms: { bg: "#E8C96A", face: "#A85E00", label: "Gaat wel" },
  ja: { bg: "#D49A7A", face: "#A52019", label: "Niet goed" },
} as const

// Agenda event kleur
export const eventTypeColors = {
  CARE_TASK: "#2D1B69",
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

// Wellbeing chart kleuren — paurs/navy palet
export const wellbeingChartColors = {
  algemeen: "#2D1B69",
  fysiek: "#5A45A0",
  emotioneel: "#9B8DD4",
} as const

// Niveau Tailwind klassen (voor badges etc.)
export const niveauBadgeClasses: Record<string, string> = {
  LAAG: "bg-accent-green-bg text-accent-green",
  GEMIDDELD: "bg-accent-amber-bg text-accent-amber",
  HOOG: "bg-accent-red-bg text-accent-red",
}

// PDF rapport kleuren (consistent met paurs/navy app-palet)
export const pdfColors = {
  primary: [45, 27, 105] as const,   // #2D1B69 - consistent met app
  primaryBg: [237, 232, 245] as const, // #EDE8F5
  groen: scoreColors.laag.rgb,
  groenBg: scoreColors.laag.rgbBg,
  oranje: scoreColors.gemiddeld.rgb,
  oranjeBg: scoreColors.gemiddeld.rgbBg,
  rood: scoreColors.hoog.rgb,
  roodBg: scoreColors.hoog.rgbBg,
  donker: [30, 21, 51] as const,    // #1E1533 - consistent met --foreground
  tekst: [90, 77, 107] as const,    // #5A4D6B - consistent met --muted-foreground
  grijs: [128, 120, 140] as const,
  lichtgrijs: [240, 230, 239] as const, // zacht mauve lichtgrijs
  wit: [255, 255, 255] as const,
  rand: [212, 198, 217] as const,   // #D4C6D9 - consistent met --border
} as const
