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

      {/* Header met ongelezen bolletje */}
      <div className="flex items-center gap-3 mb-2 relative">
        <span className="text-3xl">🏘️</span>
        <h1 className="text-2xl font-bold">Nieuws van de gemeente</h1>
        {aantalOngelezen > 0 && (
          <span className="w-6 h-6 bg-[var(--accent-red)] text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
            {aantalOngelezen}
          </span>
        )}
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Nieuws en updates over mantelzorg in jouw gemeente.
      </p>

      {/* Uitleg + alles gelezen knop */}
      {relevantNieuws.length > 0 && (
        <div className="bg-primary/5 rounded-xl p-3 mb-6">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Tik op <span className="font-medium text-[var(--accent-green)]">Gelezen</span> als je een bericht hebt gelezen.
              Bewaar een bericht met het <span className="text-primary font-semibold">hartje</span>.
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

      {/* Nieuws per gemeente - ongelezen bovenaan, gelezen onderaan */}
      <NieuwsSectie
        items={nieuwsMantelzorger}
        label={gemeenteMantelzorger ? `📍 ${gemeenteMantelzorger} — jouw gemeente` : ""}
        gelezenIds={gelezenIds}
        favorieten={favorieten}
        onGelezen={markeerAlsGelezen}
        onOngelezen={markeerAlsOngelezen}
      />

      <NieuwsSectie
        items={nieuwsZorgvrager}
        label={gemeenteZorgvrager ? `📍 ${gemeenteZorgvrager} — gemeente van je naaste` : ""}
        gelezenIds={gelezenIds}
        favorieten={favorieten}
        onGelezen={markeerAlsGelezen}
        onOngelezen={markeerAlsOngelezen}
      />

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

function NieuwsSectie({
  items,
  label,
  gelezenIds,
  favorieten,
  onGelezen,
  onOngelezen,
}: {
  items: GemeenteNieuws[]
  label: string
  gelezenIds: string[]
  favorieten: Record<string, string>
  onGelezen: (id: string) => void
  onOngelezen: (id: string) => void
}) {
  if (items.length === 0) return null

  const ongelezen = items.filter(item => !gelezenIds.includes(item.id))
  const gelezen = items.filter(item => gelezenIds.includes(item.id))

  return (
    <div className="mb-6">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
        {label}
      </p>

      {/* Ongelezen items */}
      {ongelezen.length > 0 && (
        <div className="space-y-3">
          {ongelezen.map(item => (
            <NieuwsCard
              key={item.id}
              item={item}
              favorieten={favorieten}
              isGelezen={false}
              onGelezen={() => onGelezen(item.id)}
              onOngelezen={() => onOngelezen(item.id)}
            />
          ))}
        </div>
      )}

      {/* Gelezen items */}
      {gelezen.length > 0 && (
        <>
          <div className="flex items-center gap-2 mt-4 mb-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <svg className="w-3.5 h-3.5 text-[var(--accent-green)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              Gelezen
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>
          <div className="space-y-3">
            {gelezen.map(item => (
              <NieuwsCard
                key={item.id}
                item={item}
                favorieten={favorieten}
                isGelezen={true}
                onGelezen={() => onGelezen(item.id)}
                onOngelezen={() => onOngelezen(item.id)}
              />
            ))}
          </div>
        </>
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
    <div className={`ker-card py-4 relative transition-all ${isGelezen ? "opacity-60 bg-[var(--accent-green-bg)]" : ""}`}>
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
        <p className="text-xs text-muted-foreground leading-relaxed pl-7 mb-2">
          {item.beschrijving}
        </p>

        {/* Acties rij: link + gelezen knop */}
        <div className="flex items-center justify-between pl-7">
          {item.url ? (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline font-medium flex items-center gap-1"
            >
              🌐 Meer informatie
            </a>
          ) : <span />}

          {/* Gelezen knop - zelfde stijl als Afgerond op favorieten pagina */}
          {!isGelezen ? (
            <button
              onClick={onGelezen}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-[var(--accent-green)]/15 text-[var(--accent-green)] font-medium text-xs hover:bg-[var(--accent-green)]/25 transition-colors min-h-[40px]"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              Gelezen
            </button>
          ) : (
            <button
              onClick={onOngelezen}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-border text-muted-foreground text-xs hover:bg-muted transition-colors min-h-[40px]"
            >
              Toch niet gelezen
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
