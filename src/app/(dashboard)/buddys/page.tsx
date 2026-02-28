"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { cn } from "@/lib/utils"
import { ZORGTAKEN } from "@/config/options"
import { BuddyKaart, type BuddyOpKaart } from "@/components/BuddyKaart"
import Link from "next/link"

// ============================================
// TYPES
// ============================================

interface MatchResult {
  buddyId: string
  voornaam: string
  woonplaats: string
  hulpvormen: string[]
  beschikbaarheid: string
  vogGoedgekeurd: boolean
  matchPercentage: number
  afstandKm: number | null
  details: {
    taakOverlapScore: number
    afstandScore: number
    beschikbaarheidScore: number
  }
}

interface MatchResponse {
  matches: MatchResult[]
  totaal: number
}

interface ProfielData {
  careRecipientLatitude: number | null
  careRecipientLongitude: number | null
  careRecipientCity: string | null
  zorgtaken: string[] // dbValues
}

// ============================================
// HULPVORM LABELS
// ============================================

const HULPVORM_LABELS: Record<string, { label: string; emoji: string }> = {
  administratie: { label: "Administratie", emoji: "📋" },
  boodschappen: { label: "Boodschappen", emoji: "🛒" },
  vervoer: { label: "Vervoer", emoji: "🚗" },
  gesprek: { label: "Gesprek", emoji: "💬" },
  oppas: { label: "Oppas", emoji: "🏠" },
  klusjes: { label: "Klusjes", emoji: "🔨" },
}

const BESCHIKBAARHEID_LABELS: Record<string, string> = {
  EENMALIG: "Eenmalig",
  VAST: "Regelmatig",
  BEIDE: "Beide",
}

// ============================================
// COMPONENT
// ============================================

export default function BuddysPage() {
  const [matches, setMatches] = useState<MatchResult[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [profiel, setProfiel] = useState<ProfielData | null>(null)
  const [radiusKm, setRadiusKm] = useState(10)
  const [selectedTaken, setSelectedTaken] = useState<string[]>([])
  const [beschikbaarheid, setBeschikbaarheid] = useState<string>("")
  const [selectedBuddyId, setSelectedBuddyId] = useState<string | null>(null)
  const hasFetched = useRef(false)

  // Haal profiel op
  useEffect(() => {
    if (hasFetched.current) return
    hasFetched.current = true

    async function loadProfiel() {
      try {
        const res = await fetch("/api/profile")
        if (res.ok) {
          const data = await res.json()
          const p: ProfielData = {
            careRecipientLatitude: data.careRecipientLatitude || null,
            careRecipientLongitude: data.careRecipientLongitude || null,
            careRecipientCity: data.naasteWoonplaats || null,
            zorgtaken: data.zorgtaken || [],
          }
          setProfiel(p)
          if (p.zorgtaken.length > 0) {
            setSelectedTaken(p.zorgtaken)
          }
        } else {
          // API fout (401, 404) — gebruik standaard leeg profiel
          setProfiel({ careRecipientLatitude: null, careRecipientLongitude: null, careRecipientCity: null, zorgtaken: [] })
        }
      } catch {
        // Netwerk fout — gebruik standaard leeg profiel zodat pagina niet blijft hangen
        setProfiel({ careRecipientLatitude: null, careRecipientLongitude: null, careRecipientCity: null, zorgtaken: [] })
      }
    }
    loadProfiel()
  }, [])

  // Zoek matches
  const zoekBuddys = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/buddys/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          zorgtaken: selectedTaken,
          latitude: profiel?.careRecipientLatitude || null,
          longitude: profiel?.careRecipientLongitude || null,
          beschikbaarheid: beschikbaarheid || undefined,
          maxAfstandKm: radiusKm,
        }),
      })

      if (!res.ok) throw new Error("Fout bij ophalen")

      const data: MatchResponse = await res.json()
      setMatches(data.matches)
    } catch {
      setError("Kon geen buddys vinden. Probeer het later opnieuw.")
    } finally {
      setLoading(false)
    }
  }, [selectedTaken, profiel, beschikbaarheid, radiusKm])

  // Zoek bij filter-wijziging
  useEffect(() => {
    if (profiel !== null) {
      zoekBuddys()
    }
  }, [profiel, zoekBuddys])

  // Toggle zorgtaak
  function toggleTaak(dbValue: string) {
    setSelectedTaken((prev) =>
      prev.includes(dbValue)
        ? prev.filter((t) => t !== dbValue)
        : [...prev, dbValue]
    )
  }

  // Buddy's met locatie voor de kaart
  const buddysOpKaart: BuddyOpKaart[] = matches
    .filter((m): m is MatchResult & { afstandKm: number } => m.afstandKm != null)
    .map((m) => ({
      buddyId: m.buddyId,
      voornaam: m.voornaam,
      woonplaats: m.woonplaats,
      hulpvormen: m.hulpvormen,
      beschikbaarheid: m.beschikbaarheid,
      vogGoedgekeurd: m.vogGoedgekeurd,
      matchPercentage: m.matchPercentage,
      afstandKm: m.afstandKm,
      // Schatting: locatie op basis van afstandKm (server geeft geen exacte coords)
      // We gebruiken de API response — buddys worden gefilterd op afstand, markers zijn indicatief
      latitude: (profiel?.careRecipientLatitude || 52.09) + (Math.random() - 0.5) * (radiusKm / 111),
      longitude: (profiel?.careRecipientLongitude || 5.12) + (Math.random() - 0.5) * (radiusKm / 70),
    }))

  return (
    <div className="ker-page-content">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-xl font-bold text-foreground">Buddy&apos;s in de buurt</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Vind een MantelBuddy die bij jou past. Gefilterd op jouw zorgtaken en de locatie van je naaste.
        </p>
      </div>

      {/* Zorgtaak filter */}
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-foreground mb-2">Waar zoek je hulp bij?</h2>
        <div className="flex flex-wrap gap-2">
          {ZORGTAKEN.map((t) => (
            <button
              key={t.id}
              onClick={() => toggleTaak(t.dbValue)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border",
                selectedTaken.includes(t.dbValue)
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-foreground border-border hover:border-primary/30"
              )}
            >
              <span>{t.emoji}</span>
              <span>{t.naam}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Beschikbaarheid filter */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs text-muted-foreground">Type hulp:</span>
        {[
          { value: "", label: "Alle" },
          { value: "EENMALIG", label: "Eenmalig" },
          { value: "VAST", label: "Regelmatig" },
        ].map((opt) => (
          <button
            key={opt.value}
            onClick={() => setBeschikbaarheid(opt.value)}
            className={cn(
              "px-3 py-1 rounded-lg text-xs font-medium transition-all",
              beschikbaarheid === opt.value
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-secondary"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Kaart */}
      {profiel?.careRecipientLatitude && profiel?.careRecipientLongitude && (
        <BuddyKaart
          buddys={buddysOpKaart}
          centrumLat={profiel.careRecipientLatitude}
          centrumLng={profiel.careRecipientLongitude}
          radiusKm={radiusKm}
          onRadiusChange={setRadiusKm}
          onBuddyClick={setSelectedBuddyId}
          className="mb-4 rounded-xl overflow-hidden border border-border"
        />
      )}

      {!profiel?.careRecipientLatitude && !loading && (
        <div className="bg-[var(--accent-amber-bg)] border border-[var(--accent-amber)]/20 rounded-xl p-4 mb-4">
          <p className="text-sm text-foreground">
            Vul het adres van je naaste in bij je <Link href="/profiel" className="text-primary underline">profiel</Link> om buddys op de kaart te zien.
          </p>
        </div>
      )}

      {/* Resultaten */}
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">
          {loading ? "Zoeken..." : `${matches.length} buddy${matches.length !== 1 ? "'s" : ""} gevonden`}
        </h2>
      </div>

      {error && (
        <div className="bg-[var(--accent-red-bg)] border border-[var(--accent-red)]/20 rounded-xl p-4 mb-4">
          <p className="text-sm text-foreground">{error}</p>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      )}

      {!loading && matches.length === 0 && !error && (
        <div className="text-center py-12">
          <p className="text-4xl mb-3">🔍</p>
          <p className="text-foreground font-medium">Geen buddys gevonden</p>
          <p className="text-sm text-muted-foreground mt-1">
            Probeer een grotere afstand of minder filters.
          </p>
        </div>
      )}

      {/* Buddy lijst */}
      <div className="space-y-3">
        {matches.map((m) => (
          <div
            key={m.buddyId}
            className={cn(
              "bg-card border rounded-xl p-4 transition-all",
              selectedBuddyId === m.buddyId
                ? "border-primary shadow-md"
                : "border-border hover:border-primary/30"
            )}
            onClick={() => setSelectedBuddyId(m.buddyId === selectedBuddyId ? null : m.buddyId)}
          >
            <div className="flex items-start gap-3">
              {/* Avatar */}
              <div className="w-12 h-12 rounded-full bg-[var(--accent-green-bg)] flex items-center justify-center flex-shrink-0">
                <span className="text-lg font-bold text-[var(--accent-green)]">
                  {m.voornaam.charAt(0)}
                </span>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-foreground">{m.voornaam}</h3>
                  {m.vogGoedgekeurd && (
                    <span className="text-[10px] bg-[var(--accent-green-bg)] text-[var(--accent-green)] px-1.5 py-0.5 rounded-full font-medium">
                      VOG ✓
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {m.woonplaats}
                  {m.afstandKm != null && ` · ${m.afstandKm} km`}
                  {" · "}
                  {BESCHIKBAARHEID_LABELS[m.beschikbaarheid] || m.beschikbaarheid}
                </p>

                {/* Hulpvormen */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {m.hulpvormen.map((h) => {
                    const info = HULPVORM_LABELS[h]
                    return (
                      <span
                        key={h}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-xs text-foreground"
                      >
                        {info?.emoji || "🤝"} {info?.label || h}
                      </span>
                    )
                  })}
                </div>
              </div>

              {/* Match percentage */}
              <div className="flex-shrink-0 text-center">
                <div
                  className={cn(
                    "w-14 h-14 rounded-full flex items-center justify-center border-2",
                    m.matchPercentage >= 75
                      ? "border-[var(--accent-green)] bg-[var(--accent-green-bg)]"
                      : m.matchPercentage >= 50
                        ? "border-[var(--accent-amber)] bg-[var(--accent-amber-bg)]"
                        : "border-border bg-muted"
                  )}
                >
                  <span
                    className={cn(
                      "text-lg font-bold",
                      m.matchPercentage >= 75
                        ? "text-[var(--accent-green)]"
                        : m.matchPercentage >= 50
                          ? "text-[var(--accent-amber)]"
                          : "text-muted-foreground"
                    )}
                  >
                    {m.matchPercentage}%
                  </span>
                </div>
                <span className="text-[10px] text-muted-foreground mt-0.5 block">match</span>
              </div>
            </div>

            {/* Expanded detail */}
            {selectedBuddyId === m.buddyId && (
              <div className="mt-3 pt-3 border-t border-border">
                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Taken</p>
                    <p className="text-sm font-semibold text-foreground">{m.details.taakOverlapScore}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Afstand</p>
                    <p className="text-sm font-semibold text-foreground">{m.details.afstandScore}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Kwaliteit</p>
                    <p className="text-sm font-semibold text-foreground">{m.details.beschikbaarheidScore}%</p>
                  </div>
                </div>
                <Link
                  href={`/marktplaats?buddy=${m.buddyId}`}
                  className="ker-btn ker-btn-primary w-full text-center text-sm"
                >
                  Vraag hulp aan {m.voornaam}
                </Link>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
