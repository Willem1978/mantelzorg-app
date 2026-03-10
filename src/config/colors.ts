/**
 * Centrale kleurdefinities voor semantische kleuren.
 * Gebruik deze in plaats van losse hex-codes of Tailwind-kleuren
 * voor scores, statussen en niveaus.
 *
 * CSS variabelen staan in globals.css — dit bestand is voor
 * plekken waar je hex-codes nodig hebt (PDF, images, canvas, etc.)
 */

// Score/belasting niveau kleuren — warm & kalmerend
export const scoreColors = {
  laag: {
    hex: "#4A7A50",
    hexBg: "#EEF4EF",
    tailwind: "text-accent-green",
    tailwindBg: "bg-accent-green-bg",
    cssVar: "var(--accent-green)",
    cssVarBg: "var(--accent-green-bg)",
    rgb: [74, 122, 80] as const,
    rgbBg: [238, 244, 239] as const,
    label: "Laag",
  },
  gemiddeld: {
    hex: "#B8862B",
    hexBg: "#FDF6EC",
    tailwind: "text-accent-amber",
    tailwindBg: "bg-accent-amber-bg",
    cssVar: "var(--accent-amber)",
    cssVarBg: "var(--accent-amber-bg)",
    rgb: [184, 134, 43] as const,
    rgbBg: [253, 246, 236] as const,
    label: "Gemiddeld",
  },
  hoog: {
    hex: "#A65050",
    hexBg: "#F9EFEF",
    tailwind: "text-accent-red",
    tailwindBg: "bg-accent-red-bg",
    cssVar: "var(--accent-red)",
    cssVarBg: "var(--accent-red-bg)",
    rgb: [166, 80, 80] as const,
    rgbBg: [249, 239, 239] as const,
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
  nee: { bg: "#8DB793", face: "#4A7A50", label: "Goed" },
  soms: { bg: "#E8C96A", face: "#B8862B", label: "Gaat wel" },
  ja: { bg: "#D49A7A", face: "#A65050", label: "Niet goed" },
} as const

// Agenda event kleur
export const eventTypeColors = {
  CARE_TASK: "#C47D5A",
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

// Wellbeing chart kleuren — warm palet
export const wellbeingChartColors = {
  algemeen: "#6B8F71",
  fysiek: "#5B8FB9",
  emotioneel: "#9B7BB5",
} as const

// Niveau Tailwind klassen (voor badges etc.)
export const niveauBadgeClasses: Record<string, string> = {
  LAAG: "bg-accent-green-bg text-accent-green",
  GEMIDDELD: "bg-accent-amber-bg text-accent-amber",
  HOOG: "bg-accent-red-bg text-accent-red",
}

// PDF rapport kleuren (consistent met app)
export const pdfColors = {
  primary: [107, 143, 113] as const,   // #6B8F71 - consistent met app
  primaryBg: [238, 244, 239] as const, // #EEF4EF
  groen: scoreColors.laag.rgb,
  groenBg: scoreColors.laag.rgbBg,
  oranje: scoreColors.gemiddeld.rgb,
  oranjeBg: scoreColors.gemiddeld.rgbBg,
  rood: scoreColors.hoog.rgb,
  roodBg: scoreColors.hoog.rgbBg,
  donker: [61, 56, 53] as const,    // #3D3835 - consistent met --foreground
  tekst: [107, 101, 96] as const,   // #6B6560 - consistent met --muted-foreground
  grijs: [128, 128, 128] as const,
  lichtgrijs: [245, 243, 240] as const,
  wit: [255, 252, 248] as const,
  rand: [224, 216, 206] as const,   // #E0D8CE - consistent met --border
} as const
