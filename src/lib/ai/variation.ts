/**
 * Helpers om hulpbronnen en artikelen te laten variëren tussen chat-beurten.
 *
 * Strategie: items die de gebruiker al gezien heeft worden zacht gedeprioriteerd
 * (achteraan), niet uitgesloten. Bij kleine pools (gemeente met 3 hulpbronnen)
 * blijft er zo altijd iets om te tonen — de "nog niet getoonde" items komen
 * gewoon eerst.
 */

/**
 * Fisher-Yates shuffle. In-place op een kopie.
 */
export function shuffle<T>(arr: readonly T[]): T[] {
  const out = arr.slice()
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/**
 * Splitst items in "nog niet getoond" en "al getoond", shuffelt elk groepje
 * en plakt ze achter elkaar. Zo komen verse items eerst, met variatie binnen
 * de groepen.
 */
export function prioritizeUnshown<T>(
  items: readonly T[],
  getKey: (item: T) => string,
  shownKeys: ReadonlySet<string>,
): T[] {
  if (shownKeys.size === 0) return shuffle(items)
  const fresh: T[] = []
  const seen: T[] = []
  for (const item of items) {
    const key = getKey(item).toLowerCase().trim()
    if (shownKeys.has(key)) seen.push(item)
    else fresh.push(item)
  }
  return [...shuffle(fresh), ...shuffle(seen)]
}

/**
 * Maakt een lookup-set van strings (lowercase, getrimd) — robust tegen casing
 * en whitespace verschillen tussen wat de AI rendert en wat de DB teruggeeft.
 */
export function toKeySet(keys: readonly string[] | undefined): Set<string> {
  if (!keys || keys.length === 0) return new Set()
  return new Set(keys.map((k) => k.toLowerCase().trim()).filter(Boolean))
}
