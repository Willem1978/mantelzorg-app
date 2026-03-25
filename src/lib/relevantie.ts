/**
 * Relevantie-score berekening voor gepersonaliseerde aanbevelingen.
 *
 * Berekent hoe relevant een artikel is voor een gebruiker op basis van
 * tag-overlap tussen het artikel en het gebruikersprofiel.
 *
 * Scoring:
 *   ZORGTHEMA match  = 3 punten (zwaarst: bepaalt type zorg)
 *   SITUATIE match   = 2 punten (context: werk, wonen, duur)
 *   ONDERWERP match  = 1 punt   (interesse)
 *   Categorie match  = 1 punt   (leescategorie)
 */

interface ArtikelMetTags {
  id: string
  titel: string
  beschrijving: string | null
  emoji: string | null
  categorie: string
  url: string | null
  tags: { tag: { slug: string; type: string; naam: string } }[]
}

interface GebruikerProfiel {
  zorgthemaSlugs: string[]       // Geselecteerde zorgthema's
  situatieTagSlugs: string[]     // Alle situatie-tags (automatisch + handmatig)
  interesseCategorieen: string[] // Leesinteresses (categorie-slugs)
}

export interface AanbevolenArtikel {
  id: string
  titel: string
  beschrijving: string | null
  emoji: string | null
  categorie: string
  url: string | null
  relevantieScore: number
  matchRedenen: string[]  // Waarom dit artikel is aanbevolen
}

const SCORE_ZORGTHEMA = 3
const SCORE_SITUATIE = 2
const SCORE_ONDERWERP = 1
const SCORE_CATEGORIE = 1

/**
 * Bereken relevantie-score van een artikel voor een gebruiker.
 */
export function berekenRelevantie(
  artikel: ArtikelMetTags,
  profiel: GebruikerProfiel,
): { score: number; redenen: string[] } {
  let score = 0
  const redenen: string[] = []

  const artikelTagSlugs = artikel.tags.map((t) => t.tag.slug)
  const artikelTagTypes = new Map(artikel.tags.map((t) => [t.tag.slug, t.tag.type]))
  const artikelTagNamen = new Map(artikel.tags.map((t) => [t.tag.slug, t.tag.naam]))

  // Zorgthema overlap (3 punten per match)
  for (const slug of profiel.zorgthemaSlugs) {
    if (artikelTagSlugs.includes(slug)) {
      score += SCORE_ZORGTHEMA
      const naam = artikelTagNamen.get(slug)
      if (naam) redenen.push(naam)
    }
  }

  // Situatie-tag overlap (2 punten per match)
  for (const slug of profiel.situatieTagSlugs) {
    if (artikelTagSlugs.includes(slug)) {
      score += SCORE_SITUATIE
      const naam = artikelTagNamen.get(slug)
      if (naam) redenen.push(naam)
    }
  }

  // Onderwerp-tag overlap (1 punt per match)
  for (const slug of artikelTagSlugs) {
    if (artikelTagTypes.get(slug) === "ONDERWERP") {
      // Check of de gebruiker deze interesse-categorie heeft
      if (profiel.interesseCategorieen.includes(slug)) {
        score += SCORE_ONDERWERP
      }
    }
  }

  // Categorie match (1 punt)
  if (profiel.interesseCategorieen.includes(artikel.categorie)) {
    score += SCORE_CATEGORIE
    if (redenen.length === 0) {
      redenen.push("Past bij je interesses")
    }
  }

  return { score, redenen }
}

/**
 * Sorteer en filter artikelen op relevantie voor een gebruiker.
 * Geeft de top-N meest relevante artikelen terug.
 */
export function getGepersonaliseerdeArtikelen(
  artikelen: ArtikelMetTags[],
  profiel: GebruikerProfiel,
  maxAantal: number = 5,
): AanbevolenArtikel[] {
  const scored = artikelen.map((artikel) => {
    const { score, redenen } = berekenRelevantie(artikel, profiel)
    return {
      id: artikel.id,
      titel: artikel.titel,
      beschrijving: artikel.beschrijving,
      emoji: artikel.emoji,
      categorie: artikel.categorie,
      url: artikel.url,
      relevantieScore: score,
      matchRedenen: redenen.length > 0 ? redenen : ["Populair artikel"],
    }
  })

  // Sorteer op relevantie (hoog → laag), dan op titel voor stabiliteit
  scored.sort((a, b) => {
    if (b.relevantieScore !== a.relevantieScore) {
      return b.relevantieScore - a.relevantieScore
    }
    return a.titel.localeCompare(b.titel, "nl")
  })

  return scored.slice(0, maxAantal)
}
