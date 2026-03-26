"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"

// ── Types ──────────────────────────────────────────────────────────

type ArtikelStatus = "VOORSTEL" | "CONCEPT" | "HERSCHREVEN" | "VERRIJKT" | "GEPUBLICEERD" | "GEARCHIVEERD"

interface WerkbankArtikel {
  id: string
  titel: string
  beschrijving: string
  categorie: string
  status: ArtikelStatus
  emoji: string | null
  tags: { tag: { naam: string; slug: string } }[]
  updatedAt: string
  _count?: { interacties?: number }
}

const KOLOMMEN: { status: ArtikelStatus; label: string; kleur: string; bgKleur: string }[] = [
  { status: "VOORSTEL", label: "Voorstel", kleur: "text-purple-700", bgKleur: "bg-purple-50 border-purple-200" },
  { status: "CONCEPT", label: "Concept", kleur: "text-blue-700", bgKleur: "bg-blue-50 border-blue-200" },
  { status: "HERSCHREVEN", label: "Herschreven", kleur: "text-amber-700", bgKleur: "bg-amber-50 border-amber-200" },
  { status: "VERRIJKT", label: "Verrijkt", kleur: "text-teal-700", bgKleur: "bg-teal-50 border-teal-200" },
  { status: "GEPUBLICEERD", label: "Gepubliceerd", kleur: "text-green-700", bgKleur: "bg-green-50 border-green-200" },
  { status: "GEARCHIVEERD", label: "Gearchiveerd", kleur: "text-gray-500", bgKleur: "bg-gray-50 border-gray-200" },
]

// ── Hoofdpagina ────────────────────────────────────────────────────

export default function ContentWerkbankPage() {
  const [artikelen, setArtikelen] = useState<WerkbankArtikel[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("")
  const [categorieFilter, setCategorieFilter] = useState("")
  const [movingId, setMovingId] = useState<string | null>(null)

  const fetchArtikelen = useCallback(async () => {
    try {
      const res = await fetch("/api/beheer/content-werkbank")
      if (res.ok) {
        const data = await res.json()
        setArtikelen(data.artikelen || [])
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchArtikelen() }, [fetchArtikelen])

  const moveArtikel = async (artikelId: string, nieuweStatus: ArtikelStatus) => {
    setMovingId(artikelId)
    // Optimistic update
    setArtikelen(prev => prev.map(a =>
      a.id === artikelId ? { ...a, status: nieuweStatus } : a
    ))
    try {
      await fetch("/api/beheer/content-werkbank", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ artikelId, status: nieuweStatus }),
      })
    } catch {
      fetchArtikelen() // rollback
    } finally {
      setMovingId(null)
    }
  }

  const triggerAI = async (artikelId: string, actie: "herschrijf" | "verrijk" | "tags") => {
    setMovingId(artikelId)
    try {
      await fetch("/api/beheer/content-werkbank/ai-actie", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ artikelId, actie }),
      })
      await fetchArtikelen()
    } catch {
      // silent
    } finally {
      setMovingId(null)
    }
  }

  // Filter
  const gefilterd = artikelen.filter(a => {
    if (filter && !a.titel.toLowerCase().includes(filter.toLowerCase()) &&
        !a.beschrijving.toLowerCase().includes(filter.toLowerCase())) return false
    if (categorieFilter && a.categorie !== categorieFilter) return false
    return true
  })

  const categorieen = [...new Set(artikelen.map(a => a.categorie))].sort()

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2D1B69]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#2D1B69]">Content Werkbank</h1>
          <p className="text-sm text-[#5A4D6B] mt-1">
            {artikelen.length} artikelen &middot; Sleep of verplaats tussen kolommen
          </p>
        </div>
        <Link
          href="/beheer/content-werkbank/publiceren"
          className="px-4 py-2.5 bg-[#E5A825] text-[#1E1533] font-bold rounded-lg hover:bg-[#d49b20] transition-colors"
        >
          + Slim Publiceren
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <input
          type="text"
          placeholder="Zoek op titel..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-3 py-2 border border-[#D4C6D9] rounded-lg text-sm bg-white focus:border-[#2D1B69] focus:outline-none w-64"
        />
        <select
          value={categorieFilter}
          onChange={(e) => setCategorieFilter(e.target.value)}
          className="px-3 py-2 border border-[#D4C6D9] rounded-lg text-sm bg-white focus:border-[#2D1B69] focus:outline-none"
        >
          <option value="">Alle categorieën</option>
          {categorieen.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Kanban-bord */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-[1200px]">
          {KOLOMMEN.map((kolom) => {
            const kolomArtikelen = gefilterd.filter(a => a.status === kolom.status)

            return (
              <div key={kolom.status} className="flex-1 min-w-[200px]">
                {/* Kolom header */}
                <div className={`px-3 py-2 rounded-t-lg border ${kolom.bgKleur} flex items-center justify-between`}>
                  <span className={`text-sm font-bold ${kolom.kleur}`}>{kolom.label}</span>
                  <span className={`text-xs font-semibold ${kolom.kleur} bg-white/60 px-2 py-0.5 rounded-full`}>
                    {kolomArtikelen.length}
                  </span>
                </div>

                {/* Kaartjes */}
                <div className="space-y-2 mt-2 min-h-[200px]">
                  {kolomArtikelen.map((artikel) => (
                    <ArtikelKaart
                      key={artikel.id}
                      artikel={artikel}
                      kolommen={KOLOMMEN}
                      onMove={moveArtikel}
                      onAI={triggerAI}
                      isMoving={movingId === artikel.id}
                    />
                  ))}

                  {kolomArtikelen.length === 0 && (
                    <div className="text-center py-8 text-sm text-gray-400 italic">
                      Geen artikelen
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── Artikel Kaart ──────────────────────────────────────────────────

function ArtikelKaart({
  artikel,
  kolommen,
  onMove,
  onAI,
  isMoving,
}: {
  artikel: WerkbankArtikel
  kolommen: typeof KOLOMMEN
  onMove: (id: string, status: ArtikelStatus) => void
  onAI: (id: string, actie: "herschrijf" | "verrijk" | "tags") => void
  isMoving: boolean
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const currentIndex = kolommen.findIndex(k => k.status === artikel.status)
  const canMoveForward = currentIndex < kolommen.length - 1
  const canMoveBack = currentIndex > 0

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-3 shadow-sm hover:shadow-md transition-shadow ${
      isMoving ? "opacity-60" : ""
    }`}>
      {/* Titel */}
      <div className="flex items-start gap-2">
        <span className="text-lg">{artikel.emoji || "📄"}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[#1E1533] line-clamp-2">{artikel.titel}</p>
          <p className="text-xs text-[#5A4D6B] mt-0.5 line-clamp-1">{artikel.categorie}</p>
        </div>
      </div>

      {/* Tags */}
      {artikel.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {artikel.tags.slice(0, 3).map((t, i) => (
            <span key={i} className="text-[10px] bg-[#EDE8F5] text-[#2D1B69] px-1.5 py-0.5 rounded-full">
              {t.tag.naam}
            </span>
          ))}
          {artikel.tags.length > 3 && (
            <span className="text-[10px] text-[#5A4D6B]">+{artikel.tags.length - 3}</span>
          )}
        </div>
      )}

      {/* Acties */}
      <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
        {/* Verplaats knoppen */}
        <div className="flex gap-1">
          {canMoveBack && (
            <button
              onClick={() => onMove(artikel.id, kolommen[currentIndex - 1].status)}
              className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
              title={`Naar ${kolommen[currentIndex - 1].label}`}
              disabled={isMoving}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          {canMoveForward && (
            <button
              onClick={() => onMove(artikel.id, kolommen[currentIndex + 1].status)}
              className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
              title={`Naar ${kolommen[currentIndex + 1].label}`}
              disabled={isMoving}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>

        {/* AI acties menu */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1 rounded hover:bg-[#EDE8F5] text-[#5A4D6B] hover:text-[#2D1B69] text-xs font-semibold"
            disabled={isMoving}
          >
            AI ✨
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 bottom-8 z-20 bg-white rounded-lg shadow-lg border border-gray-200 py-1 w-44">
                <button
                  onClick={() => { onAI(artikel.id, "herschrijf"); setMenuOpen(false) }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-[#EDE8F5] transition-colors"
                >
                  ✏️ Herschrijf B1
                </button>
                <button
                  onClick={() => { onAI(artikel.id, "verrijk"); setMenuOpen(false) }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-[#EDE8F5] transition-colors"
                >
                  📚 Verrijk met FAQ
                </button>
                <button
                  onClick={() => { onAI(artikel.id, "tags"); setMenuOpen(false) }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-[#EDE8F5] transition-colors"
                >
                  🏷️ Stel tags voor
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
