/**
 * Artikel-completeness berekening.
 * Geeft een score van 0–100% op basis van gewogen criteria.
 */

export interface CompletenessDetail {
  label: string
  punten: number
  maxPunten: number
  voldaan: boolean
}

export interface CompletenessResult {
  score: number
  details: CompletenessDetail[]
}

interface ArtikelVelden {
  titel?: string | null
  beschrijving?: string | null
  inhoud?: string | null
  emoji?: string | null
  bron?: string | null
  url?: string | null
  subHoofdstuk?: string | null
  status?: string | null
  tagCount?: number | null
}

/**
 * Bereken de completeness-score voor een artikel.
 * Retourneert een score van 0–100 en een gedetailleerde breakdown.
 */
export function berekenCompleteness(artikel: ArtikelVelden): CompletenessResult {
  const details: CompletenessDetail[] = [
    {
      label: "Titel",
      maxPunten: 10,
      punten: artikel.titel && artikel.titel.trim().length > 0 ? 10 : 0,
      voldaan: !!(artikel.titel && artikel.titel.trim().length > 0),
    },
    {
      label: "Beschrijving (>50 tekens)",
      maxPunten: 15,
      punten:
        artikel.beschrijving && artikel.beschrijving.trim().length > 50
          ? 15
          : 0,
      voldaan: !!(
        artikel.beschrijving && artikel.beschrijving.trim().length > 50
      ),
    },
    {
      label: "Inhoud",
      maxPunten: 20,
      punten: artikel.inhoud && artikel.inhoud.trim().length > 0 ? 20 : 0,
      voldaan: !!(artikel.inhoud && artikel.inhoud.trim().length > 0),
    },
    {
      label: "Minimaal 1 tag",
      maxPunten: 15,
      punten:
        artikel.tagCount !== undefined &&
        artikel.tagCount !== null &&
        artikel.tagCount > 0
          ? 15
          : 0,
      voldaan: !!(
        artikel.tagCount !== undefined &&
        artikel.tagCount !== null &&
        artikel.tagCount > 0
      ),
    },
    {
      label: "Emoji",
      maxPunten: 5,
      punten: artikel.emoji && artikel.emoji.trim().length > 0 ? 5 : 0,
      voldaan: !!(artikel.emoji && artikel.emoji.trim().length > 0),
    },
    {
      label: "Bron / URL",
      maxPunten: 10,
      punten:
        (artikel.bron && artikel.bron.trim().length > 0) ||
        (artikel.url && artikel.url.trim().length > 0)
          ? 10
          : 0,
      voldaan: !!(
        (artikel.bron && artikel.bron.trim().length > 0) ||
        (artikel.url && artikel.url.trim().length > 0)
      ),
    },
    {
      label: "Subhoofdstuk",
      maxPunten: 10,
      punten:
        artikel.subHoofdstuk && artikel.subHoofdstuk.trim().length > 0
          ? 10
          : 0,
      voldaan: !!(
        artikel.subHoofdstuk && artikel.subHoofdstuk.trim().length > 0
      ),
    },
    {
      label: "Status gepubliceerd",
      maxPunten: 15,
      punten: artikel.status === "GEPUBLICEERD" ? 15 : 0,
      voldaan: artikel.status === "GEPUBLICEERD",
    },
  ]

  const score = details.reduce((sum, d) => sum + d.punten, 0)

  return { score, details }
}

/**
 * Geef een Tailwind-tekstkleur terug op basis van de score.
 */
export function getCompletenessKleur(score: number): string {
  if (score > 80) return "text-green-600"
  if (score >= 50) return "text-amber-600"
  return "text-red-600"
}

/**
 * Geef een badge met label en className terug op basis van de score.
 */
export function getCompletenessBadge(score: number): {
  label: string
  className: string
} {
  if (score > 80) {
    return {
      label: "Compleet",
      className:
        "bg-green-100 text-green-800 border-green-200",
    }
  }
  if (score >= 50) {
    return {
      label: "Gedeeltelijk",
      className:
        "bg-amber-100 text-amber-800 border-amber-200",
    }
  }
  return {
    label: "Incompleet",
    className:
      "bg-red-100 text-red-800 border-red-200",
  }
}
