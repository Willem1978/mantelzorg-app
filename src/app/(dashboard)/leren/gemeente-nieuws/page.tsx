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

  // Laad gelezen items uit localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(GELEZEN_KEY)
      if (raw) {
        setGelezenIds(JSON.parse(raw))
      }
    } catch {
      // Silently fail
    }
  }, [])

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await fetch("/api/dashboard")
        if (res.ok) {
          const data = await res.json()
          setGemeenteMantelzorger(data.locatie?.mantelzorger?.gemeente || null)
          setGemeenteZorgvrager(data.locatie?.zorgvrager?.gemeente || null)
        }
      } catch {
        // Silently fail
      } finally {
        setLoading(false)
      }
    }

    loadData()
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

  // Favorieten check
  useEffect(() => {
    if (hasFetched.current || loading || relevantNieuws.length === 0) return
    hasFetched.current = true

    const checkFavorieten = async () => {
      try {
        const items = relevantNieuws.map(n => ({ type: "INFORMATIE", itemId: n.id }))
        const res = await fetch("/api/favorieten/check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items }),
        })
        if (res.ok) {
          const data = await res.json()
          setFavorieten(data.favorited || {})
        }
      } catch {
        // Silently fail
      }
    }

    checkFavorieten()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, gemeenteMantelzorger, gemeenteZorgvrager])

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
    <div className={`ker-card py-4 relative transition-opacity ${isGelezen ? "opacity-60" : ""}`}>
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

      {/* Nieuw bolletje */}
      {!isGelezen && (
        <div className="absolute top-3 left-3">
          <span className="w-2.5 h-2.5 bg-[var(--accent-red)] rounded-full block animate-pulse" />
        </div>
      )}

      <div className="pr-12 pl-2">
        <div className="flex items-center gap-2 mb-1 pl-5">
          <span className="text-xl">{item.emoji}</span>
          <h2 className="font-semibold text-sm">{item.titel}</h2>
        </div>
        <p className="text-[10px] text-muted-foreground pl-12 mb-1">
          {formatDatum(item.datum)} — {item.gemeente}
        </p>
        <p className="text-xs text-muted-foreground leading-relaxed pl-12 mb-3">
          {item.beschrijving}
        </p>

        {/* Acties: gelezen + link */}
        <div className="flex items-center gap-4 pl-12">
          {item.url && (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline font-medium flex items-center gap-1"
            >
              🌐 Meer info
            </a>
          )}
          <button
            onClick={isGelezen ? onOngelezen : onGelezen}
            className={`text-xs font-medium flex items-center gap-1 transition-colors ${
              isGelezen
                ? "text-green-600 hover:text-muted-foreground"
                : "text-muted-foreground hover:text-green-600"
            }`}
          >
            {isGelezen ? "✅ Gelezen" : "☐ Markeer als gelezen"}
          </button>
        </div>
      </div>
    </div>
  )
}
