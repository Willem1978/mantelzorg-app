"use client"

import Link from "next/link"
import { useState, useEffect, useRef, useCallback } from "react"

type FilterType = "all" | "artikelen" | "hulpbronnen"

interface ZoekResultaat {
  id: string
  bronType: "artikel" | "hulpbron"
  titel: string
  beschrijving: string
  relevantie: string | null
  extraInfo: {
    categorie?: string
    emoji?: string
    telefoon?: string
    website?: string
    email?: string
  }
}

interface ZoekResponse {
  resultaten: ZoekResultaat[]
  methode: "semantisch" | "tekstzoek"
  aantal: number
}

const filterOpties: { label: string; value: FilterType }[] = [
  { label: "Alles", value: "all" },
  { label: "Artikelen", value: "artikelen" },
  { label: "Hulpbronnen", value: "hulpbronnen" },
]

export default function ZoekenPage() {
  const [zoekterm, setZoekterm] = useState("")
  const [filter, setFilter] = useState<FilterType>("all")
  const [resultaten, setResultaten] = useState<ZoekResultaat[]>([])
  const [methode, setMethode] = useState<string | null>(null)
  const [laden, setLaden] = useState(false)
  const [heeftGezocht, setHeeftGezocht] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Auto-focus op mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const zoek = useCallback(async (term: string, type: FilterType) => {
    if (!term.trim()) {
      setResultaten([])
      setMethode(null)
      setHeeftGezocht(false)
      return
    }

    setLaden(true)
    setHeeftGezocht(true)

    try {
      const params = new URLSearchParams({ q: term.trim(), type })
      const res = await fetch(`/api/search?${params}`)

      if (!res.ok) throw new Error("Zoeken mislukt")

      const data: ZoekResponse = await res.json()
      setResultaten(data.resultaten)
      setMethode(data.methode)
    } catch (error) {
      console.error("Zoekfout:", error)
      setResultaten([])
      setMethode(null)
    } finally {
      setLaden(false)
    }
  }, [])

  // Debounce zoeken bij wijziging zoekterm of filter
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)

    timerRef.current = setTimeout(() => {
      zoek(zoekterm, filter)
    }, 300)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [zoekterm, filter, zoek])

  return (
    <div className="ker-page-content pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-3xl">🔍</span>
        <h1 className="text-2xl font-bold">Zoeken</h1>
      </div>

      {/* Zoekbalk */}
      <div className="mb-4">
        <input
          ref={inputRef}
          type="text"
          value={zoekterm}
          onChange={(e) => setZoekterm(e.target.value)}
          placeholder="Zoek hulp of informatie..."
          className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
        />
      </div>

      {/* Filter knoppen */}
      <div className="flex gap-2 mb-6">
        {filterOpties.map((optie) => (
          <button
            key={optie.value}
            onClick={() => setFilter(optie.value)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filter === optie.value
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-500 border border-gray-200 hover:border-gray-300"
            }`}
          >
            {optie.label}
          </button>
        ))}
      </div>

      {/* Methode badge */}
      {methode && !laden && resultaten.length > 0 && (
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs text-gray-500">
            {resultaten.length} {resultaten.length === 1 ? "resultaat" : "resultaten"} via
          </span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-600">
            {methode}
          </span>
        </div>
      )}

      {/* Laden */}
      {laden && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-500">Zoeken...</p>
          </div>
        </div>
      )}

      {/* Geen resultaten */}
      {!laden && heeftGezocht && resultaten.length === 0 && (
        <div className="text-center py-12">
          <span className="text-4xl mb-3 block">🤷</span>
          <p className="text-sm text-gray-500">Geen resultaten gevonden voor &ldquo;{zoekterm}&rdquo;</p>
        </div>
      )}

      {/* Resultaten */}
      {!laden && resultaten.length > 0 && (
        <div className="space-y-3">
          {resultaten.map((resultaat) => (
            <div
              key={resultaat.id}
              className="bg-white rounded-xl border border-gray-200 p-4"
            >
              {/* Kop met type badge en relevantie */}
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="flex items-center gap-2 min-w-0">
                  {resultaat.bronType === "artikel" && resultaat.extraInfo.emoji && (
                    <span className="text-lg flex-shrink-0">{resultaat.extraInfo.emoji}</span>
                  )}
                  <h2 className="font-bold text-sm truncate">{resultaat.titel}</h2>
                </div>
                {resultaat.relevantie && (
                  <span className="text-xs text-blue-600 font-medium flex-shrink-0">
                    {resultaat.relevantie}
                  </span>
                )}
              </div>

              {/* Beschrijving */}
              <p className="text-sm text-gray-500 mb-3 line-clamp-2">{resultaat.beschrijving}</p>

              {/* Artikel: categorie badge + link */}
              {resultaat.bronType === "artikel" && resultaat.extraInfo.categorie && (
                <Link
                  href={`/leren/${resultaat.extraInfo.categorie}`}
                  className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                >
                  {resultaat.extraInfo.categorie}
                </Link>
              )}

              {/* Hulpbron: contactgegevens */}
              {resultaat.bronType === "hulpbron" && (
                <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                  {resultaat.extraInfo.telefoon && (
                    <a href={`tel:${resultaat.extraInfo.telefoon}`} className="hover:text-blue-600 transition-colors">
                      📞 {resultaat.extraInfo.telefoon}
                    </a>
                  )}
                  {resultaat.extraInfo.website && (
                    <a href={resultaat.extraInfo.website} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors">
                      🌐 Website
                    </a>
                  )}
                  {resultaat.extraInfo.email && (
                    <a href={`mailto:${resultaat.extraInfo.email}`} className="hover:text-blue-600 transition-colors">
                      ✉️ {resultaat.extraInfo.email}
                    </a>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
