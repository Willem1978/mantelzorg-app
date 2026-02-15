// MantelBuddy Service Worker - Basis offline ondersteuning
const CACHE_NAME = 'mantelbuddy-v1'
const OFFLINE_URL = '/offline'

// Bestanden die altijd gecached worden
const PRECACHE_URLS = [
  '/',
  '/dashboard',
  '/manifest.json',
]

// Installatie: cache basis bestanden
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS).catch(() => {
        // Silently fail als sommige URLs niet gecacht kunnen worden
      })
    })
  )
  self.skipWaiting()
})

// Activatie: verwijder oude caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    })
  )
  self.clients.claim()
})

// Fetch: network-first met cache fallback
self.addEventListener('fetch', (event) => {
  // Alleen GET requests cachen
  if (event.request.method !== 'GET') return

  // API calls niet cachen
  if (event.request.url.includes('/api/')) return

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Sla response op in cache
        if (response.status === 200) {
          const responseClone = response.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone)
          })
        }
        return response
      })
      .catch(() => {
        // Bij netwerk fout: probeer uit cache
        return caches.match(event.request).then((cachedResponse) => {
          return cachedResponse || new Response('Offline', { status: 503 })
        })
      })
  )
})
