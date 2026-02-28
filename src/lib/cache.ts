/**
 * Eenvoudige in-memory cache voor server-side data.
 * Voorkomt herhaalde database-queries binnen dezelfde periode.
 *
 * Gebruik:
 *   const data = await cached("my-key", 60, () => fetchExpensiveData())
 */

interface CacheEntry<T> {
  data: T
  expiresAt: number
}

const store = new Map<string, CacheEntry<unknown>>()

/**
 * Haal data op uit cache of voer de factory uit.
 *
 * @param key - Unieke cache key
 * @param ttlSeconds - Time-to-live in seconden
 * @param factory - Async functie die data ophaalt als cache verlopen is
 */
export async function cached<T>(
  key: string,
  ttlSeconds: number,
  factory: () => Promise<T>,
): Promise<T> {
  const now = Date.now()
  const existing = store.get(key) as CacheEntry<T> | undefined

  if (existing && existing.expiresAt > now) {
    return existing.data
  }

  const data = await factory()
  store.set(key, { data, expiresAt: now + ttlSeconds * 1000 })
  return data
}

/**
 * Verwijder een specifieke cache entry.
 */
export function invalidateCache(key: string) {
  store.delete(key)
}

/**
 * Verwijder alle cache entries met een bepaald prefix.
 */
export function invalidateCachePrefix(prefix: string) {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) {
      store.delete(key)
    }
  }
}

/**
 * Verwijder alle cache entries.
 */
export function clearCache() {
  store.clear()
}
