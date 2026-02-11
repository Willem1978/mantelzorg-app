"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Link from "next/link"
import { gemeenteNieuws, type GemeenteNieuws } from "@/data/artikelen"
import { FavorietButton } from "@/components/FavorietButton"

export default function GemeenteNieuwsPage() {
  const [gemeenteMantelzorger, setGemeenteMantelzorger] = useState<string | null>(null)
  const [gemeenteZorgvrager, setGemeenteZorgvrager] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [favorieten, setFavorieten] = useState<Record<string, string>>({})
  const [gelezenIds, setGelezenIds] = useState<string[]>([])
  const hasFetched = useRef(false)

  // Laad alles uit database
  useEffect(() => {
    if (hasFetched.current) return
    hasFetched.current = true

    const loadAll = async () => {
      try {
        // Haal gemeente + gelezen IDs parallel op
        const [gemeenteRes, gelezenRes] = await Promise.all([
          fetch("/api/user/gemeente").catch(() => null),
          fetch("/api/user/gelezen-nieuws").catch(() => null),
        ])

        let gMantelzorger: string | null = null
        let gZorgvrager: string | null = null

        if (gemeenteRes?.ok) {
          const data = await gemeenteRes.json()
          gMantelzorger = data.mantelzorger || null
          gZorgvrager = data.zorgvrager || null
          setGemeenteMantelzorger(gMantelzorger)
          setGemeenteZorgvrager(gZorgvrager)
        }

        // Gelezen IDs uit database
        if (gelezenRes?.ok) {
          const data = await gelezenRes.json()
          if (Array.isArray(data.gelezenIds)) {
            setGelezenIds(data.gelezenIds)
          }
        }

        // Favorieten check
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

  // Sla op naar database (fire-and-forget)
  const saveToDb = useCallback((ids: string[]) => {
    fetch("/api/user/gelezen-nieuws", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gelezenIds: ids }),
    }).catch(() => {})
    // Dispatch event voor badge-update in navbar
    window.dispatchEvent(new Event("gemeente-nieuws-gelezen"))
  }, [])

  // Markeer een item als gezien
  const markeerAlsGezien = useCallback((itemId: string) => {
    setGelezenIds(prev => {
      if (prev.includes(itemId)) return prev
      const updated = [...prev, itemId]
      saveToDb(updated)
      return updated
    })
  }, [saveToDb])

  // Markeer een item als niet-gezien
  const markeerAlsNietGezien = useCallback((itemId: string) => {
    setGelezenIds(prev => {
      const updated = prev.filter(id => id !== itemId)
      saveToDb(updated)
      return updated
    })
  }, [saveToDb])

  // Alles gezien markeren
  const allesGezien = useCallback(() => {
    const alleIds = relevantNieuws.map(n => n.id)
    setGelezenIds(alleIds)
    saveToDb(alleIds)
  }, [relevantNieuws, saveToDb])

  const aantalNieuw = relevantNieuws.filter(n => !gelezenIds.includes(n.id)).length

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
        {aantalNieuw > 0 && (
          <span className="w-6 h-6 bg-[var(--accent-red)] text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
            {aantalNieuw}
          </span>
        )}
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Nieuws en updates over mantelzorg in jouw gemeente.
      </p>

      {/* Uitleg + alles gezien knop */}
      {relevantNieuws.length > 0 && (
        <div className="bg-primary/5 rounded-xl p-3 mb-6">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Tik op <span className="font-medium text-primary">Gezien</span> als je een bericht hebt bekeken.
              Bewaar een bericht met het <span className="text-primary font-semibold">hartje</span>.
            </p>
            {aantalNieuw > 0 && (
              <button
                onClick={allesGezien}
                className="text-xs text-primary hover:underline font-medium whitespace-nowrap"
              >
                Alles gezien
              </button>
            )}
          </div>
        </div>
      )}

      {/* Geen gemeente ingesteld */}
      {geenGemeente && (
        <div className="ker-card p-6 text-center">
          <div className="text-4xl mb-3">📍</div>
          <h2 className="font-semibold text-base mb-2">Gemeente nog niet ingesteld</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Vul je adres in bij je profiel. Dan tonen we hier nieuws uit jouw gemeente.
          </p>
          <Link href="/profiel" className="ker-btn ker-btn-primary text-sm">
            Naar profiel
          </Link>
        </div>
      )}

      {/* Nieuws per gemeente - nieuw bovenaan, gezien onderaan */}
      <NieuwsSectie
        items={nieuwsMantelzorger}
        label={gemeenteMantelzorger ? `📍 ${gemeenteMantelzorger} — jouw gemeente` : ""}
        gelezenIds={gelezenIds}
        favorieten={favorieten}
        onGezien={markeerAlsGezien}
        onNietGezien={markeerAlsNietGezien}
      />

      <NieuwsSectie
        items={nieuwsZorgvrager}
        label={gemeenteZorgvrager ? `📍 ${gemeenteZorgvrager} — gemeente van je naaste` : ""}
        gelezenIds={gelezenIds}
        favorieten={favorieten}
        onGezien={markeerAlsGezien}
        onNietGezien={markeerAlsNietGezien}
      />

      {/* Gemeente wel ingesteld maar geen nieuws */}
      {!geenGemeente && relevantNieuws.length === 0 && (
        <div className="ker-card p-6 text-center">
          <div className="text-4xl mb-3">📰</div>
          <h2 className="font-semibold text-base mb-2">Nog geen nieuws</h2>
          <p className="text-sm text-muted-foreground">
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
  onGezien,
  onNietGezien,
}: {
  items: GemeenteNieuws[]
  label: string
  gelezenIds: string[]
  favorieten: Record<string, string>
  onGezien: (id: string) => void
  onNietGezien: (id: string) => void
}) {
  if (items.length === 0) return null

  const nieuw = items.filter(item => !gelezenIds.includes(item.id))
  const gezien = items.filter(item => gelezenIds.includes(item.id))

  return (
    <div className="mb-6">
      <p className="text-sm font-semibold text-muted-foreground mb-3">
        {label}
      </p>

      {/* Nieuwe items */}
      {nieuw.length > 0 && (
        <div className="space-y-3">
          {nieuw.map(item => (
            <NieuwsCard
              key={item.id}
              item={item}
              favorieten={favorieten}
              isGezien={false}
              onGezien={() => onGezien(item.id)}
              onNietGezien={() => onNietGezien(item.id)}
            />
          ))}
        </div>
      )}

      {/* Gezien items */}
      {gezien.length > 0 && (
        <>
          <div className="flex items-center gap-2 mt-4 mb-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <svg className="w-3.5 h-3.5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Eerder gezien
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>
          <div className="space-y-3">
            {gezien.map(item => (
              <NieuwsCard
                key={item.id}
                item={item}
                favorieten={favorieten}
                isGezien={true}
                onGezien={() => onGezien(item.id)}
                onNietGezien={() => onNietGezien(item.id)}
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
  isGezien,
  onGezien,
  onNietGezien,
}: {
  item: GemeenteNieuws
  favorieten: Record<string, string>
  isGezien: boolean
  onGezien: () => void
  onNietGezien: () => void
}) {
  const favKey = `INFORMATIE:${item.id}`
  const isFavorited = !!favorieten[favKey]
  const favorietId = favorieten[favKey]

  const formatDatum = (datum: string) => {
    const d = new Date(datum)
    return d.toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" })
  }

  return (
    <div className={`ker-card py-4 relative transition-all ${isGezien ? "opacity-60" : ""}`}>
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
          <h2 className="font-semibold text-base">{item.titel}</h2>
          {!isGezien && (
            <span className="w-2 h-2 bg-[var(--accent-red)] rounded-full flex-shrink-0 animate-pulse" />
          )}
        </div>
        <p className="text-sm text-muted-foreground pl-7 mb-1">
          {formatDatum(item.datum)} — {item.gemeente}
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed pl-7 mb-3">
          {item.beschrijving}
        </p>

        {/* Acties rij: link + gezien knop */}
        <div className="flex items-center justify-between pl-7">
          {item.url ? (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline font-medium flex items-center gap-1"
            >
              🌐 Meer informatie
            </a>
          ) : <span />}

          {/* Gezien knop */}
          {!isGezien ? (
            <button
              onClick={onGezien}
              className="flex items-center justify-center gap-1.5 py-2 px-4 rounded-lg bg-primary/10 text-primary font-medium text-sm hover:bg-primary/20 transition-colors min-h-[44px]"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Gezien
            </button>
          ) : (
            <button
              onClick={onNietGezien}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-border text-muted-foreground text-sm hover:bg-muted transition-colors min-h-[44px]"
            >
              Markeer als nieuw
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
