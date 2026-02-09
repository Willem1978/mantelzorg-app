"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Link from "next/link"
import { gemeenteNieuws, type GemeenteNieuws } from "@/data/artikelen"
import { FavorietButton } from "@/components/FavorietButton"

const GELEZEN_KEY = "gemeente-nieuws-gelezen"

export default function GemeenteNieuwsPage() {
  const [gemeenteMantelzorger, setGemeenteMantelzorger] = useState<string | null>(null)
  const [gemeenteZorgvrager, setGemeenteZorgvrager] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [favorieten, setFavorieten] = useState<Record<string, string>>({})
  const [gelezenIds, setGelezenIds] = useState<string[]>([])
  const hasFetched = useRef(false)

  // Laad gelezen items uit localStorage (na eventuele migratie)
  useEffect(() => {
    try {
      // Eenmalige reset van oude auto-read-all data
      const migrated = localStorage.getItem("gemeente-nieuws-v2.3-migrated")
      if (!migrated) {
        localStorage.removeItem(GELEZEN_KEY)
        localStorage.removeItem("gemeente-nieuws-gelezen-datum")
        localStorage.setItem("gemeente-nieuws-v2.3-migrated", "true")
        return // Geen gelezen items na reset
      }

      const raw = localStorage.getItem(GELEZEN_KEY)
      if (raw) {
        setGelezenIds(JSON.parse(raw))
      }
    } catch {
      // Silently fail
    }
  }, [])

  // Laad gemeente + favorieten PARALLEL
  useEffect(() => {
    if (hasFetched.current) return
    hasFetched.current = true

    const loadAll = async () => {
      try {
        // Stap 1: Haal gemeente data op (lichtgewicht endpoint)
        const gemeenteRes = await fetch("/api/user/gemeente").catch(() => null)

        let gMantelzorger: string | null = null
        let gZorgvrager: string | null = null

        if (gemeenteRes?.ok) {
          const data = await gemeenteRes.json()
          gMantelzorger = data.mantelzorger || null
          gZorgvrager = data.zorgvrager || null
          setGemeenteMantelzorger(gMantelzorger)
          setGemeenteZorgvrager(gZorgvrager)
        }

        // Stap 2: Nu we de gemeenten weten, bereken relevante nieuws en check favorieten
        const relevant = gemeenteNieuws.filter(n => {
          const gemeente = n.gemeente.toLowerCase()
          return (
            (gMantelzorger && gemeente === gMantelzorger.toLowerCase()) ||
            (gZorgvrager && gemeente === gZorgvrager.toLowerCase())
          )
        })

        if (relevant.length > 0) {
          const favRes = await fetch("/api/favorieten/check", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              items: relevant.map(n => ({ type: "INFORMATIE", itemId: n.id })),
            }),
          }).catch(() => null)

          if (favRes?.ok) {
            const favData = await favRes.json()
            setFavorieten(favData.favorited || {})
          }
        }
      } catch {
        // Silently fail
      } finally {
        setLoading(false)
      }
    }

    loadAll()
  }, [])

  // Filter nieuws per gemeente
  const nieuwsMantelzorger = gemeenteMantelzorger
    ? gemeenteNieuws.filter(n => n.gemeente.toLowerCase() === gemeenteMantelzorger.toLowerCase())
    : []

  const nieuwsZorgvrager = gemeenteZorgvrager && gemeenteZorgvrager !== gemeenteMantelzorger
    ? gemeenteNieuws.filter(n => n.gemeente.toLowerCase() === gemeenteZorgvrager.toLowerCase())
    : []

  const relevantNieuws = [...nieuwsMantelzorger, ...nieuwsZorgvrager]
  const geenGemeente = !gemeenteMantelzorger && !gemeenteZorgvrager

  // Markeer een item als gelezen
  const markeerAlsGelezen = useCallback((itemId: string) => {
    setGelezenIds(prev => {
      if (prev.includes(itemId)) return prev
      const updated = [...prev, itemId]
      localStorage.setItem(GELEZEN_KEY, JSON.stringify(updated))
      localStorage.setItem("gemeente-nieuws-gelezen-datum", new Date().toISOString())
      window.dispatchEvent(new Event("gemeente-nieuws-gelezen"))
      return updated
    })
  }, [])

  // Markeer een item als ongelezen
  const markeerAlsOngelezen = useCallback((itemId: string) => {
    setGelezenIds(prev => {
      const updated = prev.filter(id => id !== itemId)
      localStorage.setItem(GELEZEN_KEY, JSON.stringify(updated))
      localStorage.setItem("gemeente-nieuws-gelezen-datum", new Date().toISOString())
      window.dispatchEvent(new Event("gemeente-nieuws-gelezen"))
      return updated
    })
  }, [])

  // Alles gelezen markeren
  const allesGelezen = useCallback(() => {
    const alleIds = relevantNieuws.map(n => n.id)
    setGelezenIds(alleIds)
    localStorage.setItem(GELEZEN_KEY, JSON.stringify(alleIds))
    localStorage.setItem("gemeente-nieuws-gelezen-datum", new Date().toISOString())
    window.dispatchEvent(new Event("gemeente-nieuws-gelezen"))
  }, [relevantNieuws])

  const aantalOngelezen = relevantNieuws.filter(n => !gelezenIds.includes(n.id)).length

  if (loading) {
    return (
      <div className="ker-page-content flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="ker-page-content pb-24">
      {/* Terug knop */}
      <Link
        href="/leren"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Terug
      </Link>

      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <span className="text-3xl">🏘️</span>
        <h1 className="text-2xl font-bold">Nieuws van de gemeente</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Nieuws en updates over mantelzorg in jouw gemeente.
      </p>

      {/* Uitleg + alles gelezen knop */}
      {relevantNieuws.length > 0 && (
        <div className="bg-primary/5 rounded-xl p-3 mb-6 flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Tik op <span className="font-semibold">✅ Gelezen</span> als je een bericht hebt gelezen.
          </p>
          {aantalOngelezen > 0 && (
            <button
              onClick={allesGelezen}
              className="text-xs text-primary hover:underline font-medium whitespace-nowrap"
            >
              Alles gelezen
            </button>
          )}
        </div>
      )}

      {/* Geen gemeente ingesteld */}
      {geenGemeente && (
        <div className="ker-card p-6 text-center">
          <div className="text-4xl mb-3">📍</div>
          <h2 className="font-semibold text-sm mb-2">Gemeente nog niet ingesteld</h2>
          <p className="text-xs text-muted-foreground mb-4">
            Vul je adres in bij je profiel. Dan tonen we hier nieuws uit jouw gemeente.
          </p>
          <Link href="/profiel" className="ker-btn ker-btn-primary text-sm">
            Naar profiel
          </Link>
        </div>
      )}

      {/* Nieuws van gemeente mantelzorger */}
      {nieuwsMantelzorger.length > 0 && (
        <div className="mb-6">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            📍 {gemeenteMantelzorger} — jouw gemeente
          </p>
          <div className="space-y-3">
            {nieuwsMantelzorger.map(item => (
              <NieuwsCard
                key={item.id}
                item={item}
                favorieten={favorieten}
                isGelezen={gelezenIds.includes(item.id)}
                onGelezen={() => markeerAlsGelezen(item.id)}
                onOngelezen={() => markeerAlsOngelezen(item.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Nieuws van gemeente zorgvrager */}
      {nieuwsZorgvrager.length > 0 && (
        <div className="mb-6">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            📍 {gemeenteZorgvrager} — gemeente van je naaste
          </p>
          <div className="space-y-3">
            {nieuwsZorgvrager.map(item => (
              <NieuwsCard
                key={item.id}
                item={item}
                favorieten={favorieten}
                isGelezen={gelezenIds.includes(item.id)}
                onGelezen={() => markeerAlsGelezen(item.id)}
                onOngelezen={() => markeerAlsOngelezen(item.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Gemeente wel ingesteld maar geen nieuws */}
      {!geenGemeente && relevantNieuws.length === 0 && (
        <div className="ker-card p-6 text-center">
          <div className="text-4xl mb-3">📰</div>
          <h2 className="font-semibold text-sm mb-2">Nog geen nieuws</h2>
          <p className="text-xs text-muted-foreground">
            Er is op dit moment geen nieuws over mantelzorg in{" "}
            {gemeenteMantelzorger && gemeenteZorgvrager && gemeenteMantelzorger !== gemeenteZorgvrager
              ? `${gemeenteMantelzorger} of ${gemeenteZorgvrager}`
              : gemeenteMantelzorger || gemeenteZorgvrager
            }.
            We houden het in de gaten!
          </p>
        </div>
      )}
    </div>
  )
}

function NieuwsCard({
  item,
  favorieten,
  isGelezen,
  onGelezen,
  onOngelezen,
}: {
  item: GemeenteNieuws
  favorieten: Record<string, string>
  isGelezen: boolean
  onGelezen: () => void
  onOngelezen: () => void
}) {
  const favKey = `INFORMATIE:${item.id}`
  const isFavorited = !!favorieten[favKey]
  const favorietId = favorieten[favKey]

  const formatDatum = (datum: string) => {
    const d = new Date(datum)
    return d.toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" })
  }

  return (
    <div className={`ker-card py-4 relative transition-all ${isGelezen ? "opacity-60" : ""}`}>
      {/* Hartje rechtsboven */}
      <div className="absolute top-3 right-3">
        <FavorietButton
          type="INFORMATIE"
          itemId={item.id}
          titel={item.titel}
          beschrijving={item.beschrijving}
          categorie="Gemeente nieuws"
          url={item.url}
          icon={item.emoji}
          initialFavorited={isFavorited}
          initialFavorietId={favorietId}
          size="sm"
        />
      </div>

      {/* Nieuw bolletje naast titel */}
      <div className="pr-12">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xl">{item.emoji}</span>
          <h2 className="font-semibold text-sm">{item.titel}</h2>
          {!isGelezen && (
            <span className="w-2 h-2 bg-[var(--accent-red)] rounded-full flex-shrink-0 animate-pulse" />
          )}
        </div>
        <p className="text-[10px] text-muted-foreground pl-7 mb-1">
          {formatDatum(item.datum)} — {item.gemeente}
        </p>
        <p className="text-xs text-muted-foreground leading-relaxed pl-7 mb-3">
          {item.beschrijving}
        </p>

        {/* Link naar meer info */}
        {item.url && (
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary hover:underline font-medium flex items-center gap-1 pl-7 mb-3"
          >
            🌐 Meer informatie
          </a>
        )}

        {/* Gelezen knop - groot en rechtsonder */}
        <div className="flex justify-end">
          <button
            onClick={isGelezen ? onOngelezen : onGelezen}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              isGelezen
                ? "bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800"
                : "bg-muted text-muted-foreground border border-border hover:bg-primary/10 hover:text-primary hover:border-primary/30"
            }`}
          >
            {isGelezen ? (
              <>✅ Gelezen</>
            ) : (
              <>☐ Gelezen</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
