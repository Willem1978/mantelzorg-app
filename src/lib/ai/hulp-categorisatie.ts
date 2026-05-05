/**
 * Centrale classificatie van hulpbron-categorieën.
 *
 * Eén bron-van-waarheid voor de twee fundamentele soorten hulp die Ger kan
 * aanbieden, en de gemeente-scope per categorie. Deze module wordt gebruikt
 * door:
 *   - de zoekHulpbronnen-tool (welke gemeente(n) doorzoeken?)
 *   - de pre-fetched context (welk blok hoort dit in?)
 *   - de prompt-rendering (welk label staat erbij?)
 *
 * Kernregel:
 *   A) Hulp VOOR DE MANTELZORGER zelf
 *      - Lotgenoten / praatgroepen → ALLEEN gemeente mantelzorger (fysiek)
 *      - Mantelzorgmakelaar / respijtzorg / informatie / educatie / emotioneel
 *        → BEIDE gemeenten (zorgvragerstad heeft vaak ook iets te bieden)
 *
 *   B) Hulp BIJ EEN TAAK voor de zorgvrager
 *      - Boodschappen, verzorging, vervoer etc. → ALLEEN gemeente zorgvrager
 */

import { HULP_VOOR_MANTELZORGER, ZORGTAKEN, TAAK_NAAM_VARIANTEN } from "@/config/options"

export type Kant = "mantelzorger" | "zorgvrager-taak"
export type GemeenteScope = "mantelzorger-only" | "zorgvrager-only" | "beide"

const MANTELZORGER_DBVALUES: ReadonlySet<string> = new Set(
  HULP_VOOR_MANTELZORGER.map((c) => c.dbValue),
)

const ZORGTAAK_DBVALUES: ReadonlySet<string> = new Set(
  ZORGTAKEN.flatMap((t) => [t.dbValue, ...(TAAK_NAAM_VARIANTEN[t.dbValue] || [])]),
)

/**
 * Trefwoorden in de naam of dienst van een organisatie die aangeven dat het
 * om een fysiek-lokale activiteit gaat (lotgenoten, praatgroepen). Deze
 * organisaties moeten in de eigen stad van de mantelzorger zijn — niet in
 * de stad van de zorgvrager.
 */
const LOKAAL_GEBONDEN_KEYWORDS: readonly string[] = [
  "lotgenoten",
  "lotgenoot",
  "praatgroep",
  "praatcafe",
  "praatcafé",
  "ontmoetingsgroep",
  "ontmoetingscentrum",
  "huiskamer",
  "alzheimer cafe",
  "alzheimer café",
  "alzheimercafe",
  "alzheimercafé",
  "mantelzorgsalon",
  "inloopochtend",
  "inloopmiddag",
  "wandelgroep",
]

/**
 * Bepaalt of een categorie hulp voor de mantelzorger is, of hulp bij een
 * taak voor de zorgvrager. Onbekende categorieën worden behandeld als
 * "zorgvrager-taak" omdat dat de meest voorkomende kant is bij twijfel.
 */
export function bepaalKant(categorieDbValue: string | null | undefined): Kant {
  if (!categorieDbValue) return "zorgvrager-taak"
  if (MANTELZORGER_DBVALUES.has(categorieDbValue)) return "mantelzorger"
  if (ZORGTAAK_DBVALUES.has(categorieDbValue)) return "zorgvrager-taak"
  // Onbekende categorie: log voor data-kwaliteit, val terug op zorgvrager-taak
  if (typeof console !== "undefined") {
    console.warn("[hulp-categorisatie] Onbekende categorie:", categorieDbValue)
  }
  return "zorgvrager-taak"
}

/**
 * Bepaalt in welke gemeente(n) deze hulpbron gezocht moet worden.
 *
 * Heuristiek voor lokaal-gebonden mantelzorger-hulp: als de naam of dienst
 * een lotgenoten-keyword bevat → alleen mantelzorger-stad. Anders worden
 * beide gemeenten doorzocht voor mantelzorger-hulp.
 *
 * @param categorieDbValue dbValue van `onderdeelTest`
 * @param naam organisatienaam (lowercase-vergelijking)
 * @param dienst dienst- of soort-hulp-veld
 * @param expliciet expliciete override per organisatie (bijv. uit toekomstig DB-veld `lokaalGebonden`)
 */
export function bepaalGemeenteScope(
  categorieDbValue: string | null | undefined,
  naam?: string | null,
  dienst?: string | null,
  expliciet?: { lokaalGebonden?: boolean | null },
): GemeenteScope {
  const kant = bepaalKant(categorieDbValue)
  if (kant === "zorgvrager-taak") return "zorgvrager-only"

  // Mantelzorger-kant: check expliciete override eerst
  if (expliciet?.lokaalGebonden === true) return "mantelzorger-only"
  if (expliciet?.lokaalGebonden === false) return "beide"

  // Geen expliciete override: heuristiek op naam/dienst
  const tekst = `${naam || ""} ${dienst || ""}`.toLowerCase()
  for (const kw of LOKAAL_GEBONDEN_KEYWORDS) {
    if (tekst.includes(kw)) return "mantelzorger-only"
  }
  return "beide"
}

/**
 * Geeft de gemeente(n) terug waarin gezocht moet worden voor deze scope.
 * Resultaat is gefilterd op niet-lege waarden en gededupliceerd.
 */
export function gemeentenVoorScope(
  scope: GemeenteScope,
  gemMantelzorger: string | null,
  gemZorgvrager: string | null,
): string[] {
  const set = new Set<string>()
  if (scope === "mantelzorger-only" || scope === "beide") {
    if (gemMantelzorger) set.add(gemMantelzorger)
  }
  if (scope === "zorgvrager-only" || scope === "beide") {
    if (gemZorgvrager) set.add(gemZorgvrager)
  }
  return [...set]
}

/**
 * Mensvriendelijk Nederlands label voor een scope, bruikbaar in het
 * pre-fetched context-blok zodat Ger meteen ziet "deze hulpbron geldt voor
 * Arnhem" of "voor beide steden".
 */
export function labelVoorScope(
  scope: GemeenteScope,
  gemMantelzorger: string | null,
  gemZorgvrager: string | null,
): string {
  if (scope === "mantelzorger-only") {
    return gemMantelzorger ? `alleen in ${gemMantelzorger} (jouw stad)` : "alleen in jouw stad"
  }
  if (scope === "zorgvrager-only") {
    return gemZorgvrager ? `in ${gemZorgvrager}` : "in stad van naaste"
  }
  if (gemMantelzorger && gemZorgvrager && gemMantelzorger !== gemZorgvrager) {
    return `in ${gemMantelzorger} én ${gemZorgvrager}`
  }
  return "in jouw regio"
}
