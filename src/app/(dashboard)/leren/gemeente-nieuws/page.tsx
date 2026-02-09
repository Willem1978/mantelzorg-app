"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { gemeenteNieuws, type GemeenteNieuws } from "@/data/artikelen"
import { FavorietButton } from "@/components/FavorietButton"

export default function GemeenteNieuwsPage() {
  const [gemeenteMantelzorger, setGemeenteMantelzorger] = useState<string | null>(null)
  const [gemeenteZorgvrager, setGemeenteZorgvrager] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [favorieten, setFavorieten] = useState<Record<string, string>>({})
  const hasFetched = useRef(false)

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await fetch("/api/dashboard")
        if (res.ok) {
          const data = await res.json()
          const gm = data.locatie?.mantelzorger?.gemeente || null
          const gz = data.locatie?.zorgvrager?.gemeente || null
          setGemeenteMantelzorger(gm)
          setGemeenteZorgvrager(gz)
        }
      } catch {
        // Silently fail
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // Filter nieuws per gemeente (berekend na state update)
  const nieuwsMantelzorger = gemeenteMantelzorger
    ? gemeenteNieuws.filter(n => n.gemeente.toLowerCase() === gemeenteMantelzorger.toLowerCase())
    : []

  const nieuwsZorgvrager = gemeenteZorgvrager && gemeenteZorgvrager !== gemeenteMantelzorger
    ? gemeenteNieuws.filter(n => n.gemeente.toLowerCase() === gemeenteZorgvrager.toLowerCase())
    : []

  const relevantNieuws = [...nieuwsMantelzorger, ...nieuwsZorgvrager]

  // Overig nieuws (van andere gemeenten, niet in jouw gemeente)
  const overigNieuws = gemeenteNieuws.filter(n =>
    !relevantNieuws.some(r => r.id === n.id)
  )

  const geenGemeente = !gemeenteMantelzorger && !gemeenteZorgvrager

  // Markeer als gelezen in localStorage
  useEffect(() => {
    if (!loading && gemeenteNieuws.length > 0) {
      // Markeer alle nieuws items als gelezen
      const alleIds = gemeenteNieuws.map(n => n.id)
      localStorage.setItem("gemeente-nieuws-gelezen", JSON.stringify(alleIds))
      localStorage.setItem("gemeente-nieuws-gelezen-datum", new Date().toISOString())
      window.dispatchEvent(new Event("gemeente-nieuws-gelezen"))
    }
  }, [loading, gemeenteMantelzorger, gemeenteZorgvrager])

  // Favorieten check
  useEffect(() => {
    if (hasFetched.current || loading) return
    hasFetched.current = true

    const checkFavorieten = async () => {
      try {
        const items = gemeenteNieuws.map(n => ({ type: "INFORMATIE", itemId: n.id }))
        if (items.length === 0) return

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
  }, [loading])

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
      <p className="text-sm text-muted-foreground mb-6">
        Nieuws en updates over mantelzorg in jouw regio.
      </p>

      {/* Geen gemeente ingesteld - tip */}
      {geenGemeente && (
        <div className="bg-primary/5 rounded-xl p-3 mb-6">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium">Tip:</span> Vul je adres in bij je{" "}
            <Link href="/profiel" className="text-primary hover:underline font-medium">profiel</Link>.
            Dan tonen we nieuws uit jouw gemeente bovenaan.
          </p>
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
              <NieuwsCard key={item.id} item={item} favorieten={favorieten} />
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
              <NieuwsCard key={item.id} item={item} favorieten={favorieten} />
            ))}
          </div>
        </div>
      )}

      {/* Overig nieuws (andere gemeenten of als geen gemeente is ingesteld) */}
      {(overigNieuws.length > 0 || geenGemeente) && (
        <div className="mb-6">
          {relevantNieuws.length > 0 && (
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              🌍 Overig nieuws
            </p>
          )}
          {geenGemeente && (
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              📰 Laatste berichten
            </p>
          )}
          <div className="space-y-3">
            {(geenGemeente ? gemeenteNieuws : overigNieuws).map(item => (
              <NieuwsCard key={item.id} item={item} favorieten={favorieten} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function NieuwsCard({ item, favorieten }: { item: GemeenteNieuws; favorieten: Record<string, string> }) {
  const favKey = `INFORMATIE:${item.id}`
  const isFavorited = !!favorieten[favKey]
  const favorietId = favorieten[favKey]

  const formatDatum = (datum: string) => {
    const d = new Date(datum)
    return d.toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" })
  }

  return (
    <div className="ker-card py-4 relative">
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
        </div>
        <p className="text-[10px] text-muted-foreground pl-7 mb-1">
          {formatDatum(item.datum)} — {item.gemeente}
        </p>
        <p className="text-xs text-muted-foreground leading-relaxed pl-7 mb-2">
          {item.beschrijving}
        </p>
        {item.url && (
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary hover:underline font-medium flex items-center gap-1 pl-7"
          >
            🌐 Meer informatie
          </a>
        )}
      </div>
    </div>
  )
}
