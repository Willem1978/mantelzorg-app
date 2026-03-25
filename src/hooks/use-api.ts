/**
 * SWR hooks voor data fetching met automatische caching en revalidatie.
 *
 * Gebruik:
 *   const { data, error, isLoading } = useProfile()
 *   const { data, mutate } = useVoorkeuren()
 *
 * Voordelen t.o.v. handmatige useState + useEffect:
 * - Automatische caching (geen dubbele requests)
 * - Stale-while-revalidate (snelle navigatie)
 * - Request deduplication (meerdere componenten, 1 request)
 * - Focus revalidation (data ververst bij tab-switch)
 * - Error retry (automatisch opnieuw bij fout)
 */

import useSWR, { type SWRConfiguration } from "swr"

// Standaard fetcher: gooit bij non-2xx status
const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) {
    const error = new Error("Fout bij ophalen data")
    throw error
  }
  return res.json()
}

// Standaard SWR opties voor de app
const defaultOptions: SWRConfiguration = {
  revalidateOnFocus: false,    // Niet ververst bij tab-switch (spaart requests)
  dedupingInterval: 5000,       // Deduplicate requests binnen 5s
  errorRetryCount: 2,           // Max 2 retries bij fout
}

// ============================================
// PROFIEL
// ============================================

export function useProfile() {
  return useSWR("/api/profile", fetcher, {
    ...defaultOptions,
    revalidateOnFocus: true,  // Profiel kan veranderen in andere tab
  })
}

// ============================================
// VOORKEUREN (tags, interesses)
// ============================================

export function useVoorkeuren() {
  return useSWR("/api/user/voorkeuren", fetcher, defaultOptions)
}

// ============================================
// DASHBOARD
// ============================================

export function useDashboard() {
  return useSWR("/api/dashboard", fetcher, {
    ...defaultOptions,
    revalidateOnFocus: true,
  })
}

// ============================================
// CONTENT TAGS
// ============================================

export function useContentTags() {
  return useSWR("/api/content/tags", fetcher, {
    ...defaultOptions,
    dedupingInterval: 60000,  // Tags veranderen zelden — cache 60s
  })
}

// ============================================
// ARTIKELEN
// ============================================

export function useArtikelen(categorie?: string, tag?: string) {
  const params = new URLSearchParams()
  if (categorie) params.set("categorie", categorie)
  if (tag) params.set("tag", tag)
  const query = params.toString()
  const url = `/api/artikelen${query ? `?${query}` : ""}`

  return useSWR(url, fetcher, {
    ...defaultOptions,
    dedupingInterval: 30000,  // Artikelen veranderen niet vaak
  })
}

// ============================================
// NOTIFICATIES
// ============================================

export function useNotificaties() {
  return useSWR("/api/notifications", fetcher, {
    ...defaultOptions,
    refreshInterval: 60000,   // Poll elke 60s voor nieuwe notificaties
  })
}

// ============================================
// FAVORIETEN
// ============================================

export function useFavorieten() {
  return useSWR("/api/favorieten", fetcher, defaultOptions)
}

// ============================================
// HULPVRAGEN
// ============================================

export function useHulpvragen() {
  return useSWR("/api/hulpvragen", fetcher, defaultOptions)
}

// ============================================
// WEEKKAARTEN
// ============================================

export function useWeekkaarten() {
  return useSWR("/api/weekkaarten", fetcher, {
    ...defaultOptions,
    dedupingInterval: 30000,
  })
}
