"use client"

import { useState, useEffect, useRef, useCallback, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"
import { ZORGTAKEN, ZORGTAAK_NAAR_CATEGORIE, HULPVORM_LABELS, HULPVORM_LABELS_LEGACY } from "@/config/options"
import { BuddyKaart, type BuddyOpKaart } from "@/components/BuddyKaart"
import { GerPageIntro } from "@/components/ui"
import { Button } from "@/components/ui"
import Link from "next/link"
import { hulpvragenPageContent } from "@/config/content"

const c = hulpvragenPageContent

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
  latitude: number | null
  longitude: number | null
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

interface BuddyReactie {
  id: string
  status: string
  bericht: string | null
  buddy: {
    voornaam: string
    woonplaats: string
    gemiddeldeScore: number
  }
}

interface BuddyTaak {
  id: string
  titel: string
  beschrijving: string | null
  categorie: string
  datum: string | null
  tijdstip: string | null
  isFlexibel: boolean
  status: string
  createdAt: string
  reacties: BuddyReactie[]
}

interface HulpvragenData {
  taken: BuddyTaak[]
  zorgtaakZwaarte: Record<string, string>
  gemeente: string | null
}

// ============================================
// HELPERS
// ============================================

function getHulpvormInfo(h: string): { label: string; emoji: string } {
  if (HULPVORM_LABELS[h]) return HULPVORM_LABELS[h]
  const legacyLabel = HULPVORM_LABELS_LEGACY[h]
  if (legacyLabel) {
    const legacyEmoji: Record<string, string> = {
      administratie: "📋", boodschappen: "🛒", vervoer: "🚗",
      gesprek: "💬", oppas: "🏠", klusjes: "🔨",
    }
    return { label: legacyLabel, emoji: legacyEmoji[h] || "🤝" }
  }
  return { label: h, emoji: "🤝" }
}

const BESCHIKBAARHEID_LABELS: Record<string, string> = {
  EENMALIG: "Eenmalig",
  VAST: "Regelmatig",
  BEIDE: "Beide",
}

function getCategorieVoorTaak(taakId: string): string {
  const taak = ZORGTAKEN.find((t) => t.id === taakId)
  if (!taak) return "OVERIG"
  return ZORGTAAK_NAAR_CATEGORIE[taak.dbValue] || "OVERIG"
}

function statusBadge(status: string) {
  const label = c.mijnVragen.status[status] || status
  const kleur = c.mijnVragen.statusKleur[status] || "bg-gray-100 text-gray-600"
  return { label, kleur }
}

type TabType = "zoeken" | "hulpvraag" | "mijn-vragen"

// ============================================
// MAIN PAGE
// ============================================

export default function BuddysPage() {
  return (
    <Suspense fallback={
      <div className="ker-page-content flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    }>
      <BuddysPageContent />
    </Suspense>
  )
}

function BuddysPageContent() {
  const searchParams = useSearchParams()
  const initialTab = searchParams.get("tab") as TabType | null

  const [activeTab, setActiveTab] = useState<TabType>(initialTab === "hulpvraag" ? "hulpvraag" : initialTab === "mijn-vragen" ? "mijn-vragen" : "zoeken")

  // --- Buddy matching state ---
  const [matches, setMatches] = useState<MatchResult[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [profiel, setProfiel] = useState<ProfielData | null>(null)
  const [radiusKm, setRadiusKm] = useState(10)
  const [selectedTaken, setSelectedTaken] = useState<string[]>([])
  const [beschikbaarheid, setBeschikbaarheid] = useState<string>("")
  const [selectedBuddyId, setSelectedBuddyId] = useState<string | null>(null)
  const hasFetchedProfiel = useRef(false)

  // --- Hulpvragen state ---
  const [marktData, setMarktData] = useState<HulpvragenData | null>(null)
  const [marktLoading, setMarktLoading] = useState(true)
  const [gekozenTaak, setGekozenTaak] = useState<string | null>(null)
  const [titel, setTitel] = useState("")
  const [beschrijving, setBeschrijving] = useState("")
  const [wanneer, setWanneer] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const hasFetchedMarkt = useRef(false)

  // ============================================
  // DATA LOADING
  // ============================================

  // Profiel laden
  useEffect(() => {
    if (hasFetchedProfiel.current) return
    hasFetchedProfiel.current = true

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
          setProfiel({ careRecipientLatitude: null, careRecipientLongitude: null, careRecipientCity: null, zorgtaken: [] })
        }
      } catch {
        setProfiel({ careRecipientLatitude: null, careRecipientLongitude: null, careRecipientCity: null, zorgtaken: [] })
      }
    }
    loadProfiel()
  }, [])

  // Hulpvragen data laden
  useEffect(() => {
    if (hasFetchedMarkt.current) return
    hasFetchedMarkt.current = true

    async function loadMarktData() {
      try {
        const res = await fetch("/api/hulpvragen")
        if (res.ok) {
          const json = await res.json()
          setMarktData(json)
        }
      } catch {
        // Silently fail
      } finally {
        setMarktLoading(false)
      }
    }
    loadMarktData()
  }, [])

  // Buddy matching
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
      setError("Kon geen buddy's vinden. Probeer het later opnieuw.")
    } finally {
      setLoading(false)
    }
  }, [selectedTaken, profiel, beschikbaarheid, radiusKm])

  useEffect(() => {
    if (profiel !== null) {
      zoekBuddys()
    }
  }, [profiel, zoekBuddys])

  function toggleTaak(dbValue: string) {
    setSelectedTaken((prev) =>
      prev.includes(dbValue)
        ? prev.filter((t) => t !== dbValue)
        : [...prev, dbValue]
    )
  }

  // Hulpvraag formulier submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!gekozenTaak) return

    const taakDef = ZORGTAKEN.find((t) => t.id === gekozenTaak)
    if (!taakDef) return

    const categorie = getCategorieVoorTaak(gekozenTaak)
    const volledigeTitel = titel || `Hulp bij ${taakDef.naam.toLowerCase()}`

    setSubmitting(true)
    setSubmitError(null)

    try {
      const res = await fetch("/api/hulpvragen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titel: volledigeTitel,
          beschrijving: [beschrijving, wanneer ? `Wanneer: ${wanneer}` : ""]
            .filter(Boolean)
            .join("\n\n"),
          categorie,
          isFlexibel: true,
        }),
      })

      if (!res.ok) throw new Error("Versturen mislukt")

      // Refresh hulpvragen data
      const refreshRes = await fetch("/api/hulpvragen")
      if (refreshRes.ok) {
        const json = await refreshRes.json()
        setMarktData(json)
      }

      setSubmitSuccess(true)
      setTitel("")
      setBeschrijving("")
      setWanneer("")
      setGekozenTaak(null)
    } catch {
      setSubmitError(c.errors.versturen)
    } finally {
      setSubmitting(false)
    }
  }

  // Deterministische offset voor buddys zonder coördinaten (op basis van ID)
  function hashOffset(id: string, factor: number): number {
    let h = 0
    for (let i = 0; i < id.length; i++) {
      h = ((h << 5) - h) + id.charCodeAt(i)
      h = h & h
    }
    return ((h % 1000) / 1000 - 0.5) * factor
  }

  // Kaart data — gebruik werkelijke coördinaten, of plaats bij centrum als geen coords
  const centrumLat = profiel?.careRecipientLatitude || 52.09
  const centrumLng = profiel?.careRecipientLongitude || 5.12
  const buddysOpKaart: BuddyOpKaart[] = matches.map((m) => ({
    buddyId: m.buddyId,
    voornaam: m.voornaam,
    woonplaats: m.woonplaats,
    hulpvormen: m.hulpvormen,
    beschikbaarheid: m.beschikbaarheid,
    vogGoedgekeurd: m.vogGoedgekeurd,
    matchPercentage: m.matchPercentage,
    afstandKm: m.afstandKm,
    latitude: m.latitude ?? centrumLat + hashOffset(m.buddyId, 0.02),
    longitude: m.longitude ?? centrumLng + hashOffset(m.buddyId + "lng", 0.03),
  }))

  // Tabs configuratie
  const tabs: { id: TabType; label: string; emoji: string }[] = [
    { id: "zoeken", label: "Zoek buddy", emoji: "🔍" },
    { id: "hulpvraag", label: "Hulpvraag", emoji: "📝" },
    { id: "mijn-vragen", label: "Mijn vragen", emoji: "📋" },
  ]

  const mijnVragenCount = marktData?.taken?.length || 0

  return (
    <div className="ker-page-content">
      <GerPageIntro tekst="Hier vind je buddy's in de buurt en kun je hulpvragen plaatsen. Andere mantelzorgers en vrijwilligers staan klaar om te helpen. Wat kan ik voor jou doen?" />

      {/* Tabs */}
      <div className="flex gap-1 bg-muted/50 rounded-xl p-1 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setSubmitSuccess(false) }}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
              activeTab === tab.id
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span>{tab.emoji}</span>
            <span>{tab.label}</span>
            {tab.id === "mijn-vragen" && mijnVragenCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                {mijnVragenCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* TAB: Zoek buddy */}
      {activeTab === "zoeken" && (
        <div className="space-y-5">
          {/* Header */}
          <div>
            <h2 className="text-lg font-bold text-foreground mb-1">Buddy&apos;s in de buurt</h2>
            <p className="text-sm text-muted-foreground">
              Vind een MantelBuddy die bij jou past op basis van wat je nodig hebt.
            </p>
          </div>

          {/* Filters card */}
          <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-2.5">Waar zoek je hulp bij?</h3>
              <div className="flex flex-wrap gap-2">
                {ZORGTAKEN.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => toggleTaak(t.dbValue)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium transition-all border",
                      selectedTaken.includes(t.dbValue)
                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                        : "bg-background text-foreground border-border hover:border-primary/40 hover:bg-primary/5"
                    )}
                  >
                    <span>{t.emoji}</span>
                    <span>{t.naam}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <span className="text-sm font-medium text-foreground">Beschikbaarheid:</span>
              <div className="flex gap-1.5">
                {[
                  { value: "", label: "Alle" },
                  { value: "EENMALIG", label: "Eenmalig" },
                  { value: "VAST", label: "Regelmatig" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setBeschikbaarheid(opt.value)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                      beschikbaarheid === opt.value
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Kaart */}
          {profiel?.careRecipientLatitude && profiel?.careRecipientLongitude && (
            <div className="rounded-2xl overflow-hidden border border-border shadow-sm">
              <BuddyKaart
                buddys={buddysOpKaart}
                centrumLat={profiel.careRecipientLatitude}
                centrumLng={profiel.careRecipientLongitude}
                radiusKm={radiusKm}
                onRadiusChange={setRadiusKm}
                onBuddyClick={setSelectedBuddyId}
              />
            </div>
          )}

          {!profiel?.careRecipientLatitude && !loading && (
            <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30 rounded-2xl p-4">
              <span className="text-xl flex-shrink-0">📍</span>
              <div>
                <p className="text-sm font-medium text-foreground mb-1">Adres naaste nodig voor kaart</p>
                <p className="text-sm text-muted-foreground">
                  Vul het adres van je naaste in bij je{" "}
                  <Link href="/profiel" className="text-primary font-medium hover:underline">profiel</Link>
                  {" "}om buddy&apos;s op de kaart te zien.
                </p>
              </div>
            </div>
          )}

          {/* Resultaten header */}
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">
              {loading ? "Zoeken..." : `${matches.length} buddy${matches.length !== 1 ? "'s" : ""} gevonden`}
            </h3>
            {!loading && matches.length > 0 && (
              <button
                onClick={() => zoekBuddys()}
                className="text-xs text-primary font-medium hover:underline"
              >
                Vernieuwen
              </button>
            )}
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/30 rounded-2xl p-4">
              <p className="text-sm text-foreground">{error}</p>
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {!loading && matches.length === 0 && !error && (
            <div className="text-center py-12 bg-card border border-border rounded-2xl">
              <p className="text-4xl mb-3">🔍</p>
              <p className="text-foreground font-semibold">Geen buddy&apos;s gevonden</p>
              <p className="text-sm text-muted-foreground mt-1">
                Probeer een grotere afstand of andere filters.
              </p>
            </div>
          )}

          {/* Buddy kaarten */}
          <div className="space-y-3">
            {matches.map((m) => {
              const isSelected = selectedBuddyId === m.buddyId
              const matchColor = m.matchPercentage >= 75
                ? "text-emerald-600 dark:text-emerald-400"
                : m.matchPercentage >= 50
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-muted-foreground"
              const matchBg = m.matchPercentage >= 75
                ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/40"
                : m.matchPercentage >= 50
                  ? "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/40"
                  : "bg-muted border-border"

              return (
                <div
                  key={m.buddyId}
                  className={cn(
                    "bg-card border-2 rounded-2xl transition-all cursor-pointer",
                    isSelected
                      ? "border-primary shadow-lg shadow-primary/10"
                      : "border-border hover:border-primary/30 hover:shadow-md"
                  )}
                  onClick={() => setSelectedBuddyId(isSelected ? null : m.buddyId)}
                >
                  <div className="p-4">
                    <div className="flex items-start gap-3.5">
                      {/* Avatar */}
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-lg font-bold text-primary">
                          {m.voornaam.charAt(0)}
                        </span>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h3 className="font-semibold text-foreground text-base">{m.voornaam}</h3>
                          {m.vogGoedgekeurd && (
                            <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full font-semibold">
                              VOG
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {m.woonplaats || "Onbekend"}
                          {m.afstandKm != null && ` \u00b7 ${m.afstandKm} km`}
                          {" \u00b7 "}
                          {BESCHIKBAARHEID_LABELS[m.beschikbaarheid] || m.beschikbaarheid}
                        </p>
                      </div>

                      {/* Match badge */}
                      <div className={cn("flex-shrink-0 px-3 py-1.5 rounded-xl border", matchBg)}>
                        <span className={cn("text-lg font-bold", matchColor)}>
                          {m.matchPercentage}%
                        </span>
                      </div>
                    </div>

                    {/* Hulpvormen */}
                    <div className="flex flex-wrap gap-1.5 mt-3 pl-[58px]">
                      {m.hulpvormen.map((h) => {
                        const info = getHulpvormInfo(h)
                        return (
                          <span
                            key={h}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-muted/80 text-xs font-medium text-foreground"
                          >
                            {info.emoji} {info.label}
                          </span>
                        )
                      })}
                    </div>
                  </div>

                  {/* Expanded detail */}
                  {isSelected && (
                    <div className="px-4 pb-4">
                      <div className="pt-3 border-t border-border">
                        <div className="grid grid-cols-3 gap-2 mb-4">
                          <div className="text-center bg-muted/50 rounded-xl py-2.5">
                            <p className="text-xs text-muted-foreground mb-0.5">Taken</p>
                            <p className="text-base font-bold text-foreground">{m.details.taakOverlapScore}%</p>
                          </div>
                          <div className="text-center bg-muted/50 rounded-xl py-2.5">
                            <p className="text-xs text-muted-foreground mb-0.5">Afstand</p>
                            <p className="text-base font-bold text-foreground">{m.details.afstandScore}%</p>
                          </div>
                          <div className="text-center bg-muted/50 rounded-xl py-2.5">
                            <p className="text-xs text-muted-foreground mb-0.5">Kwaliteit</p>
                            <p className="text-base font-bold text-foreground">{m.details.beschikbaarheidScore}%</p>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setActiveTab("hulpvraag")
                          }}
                          className="ker-btn ker-btn-primary w-full text-center text-sm py-3 rounded-xl font-semibold"
                        >
                          Vraag hulp aan {m.voornaam}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* TAB: Hulpvraag stellen */}
      {activeTab === "hulpvraag" && (
        <div className="space-y-4">
          {submitSuccess ? (
            <div className="text-center py-8">
              <div className="text-5xl mb-4">🎉</div>
              <h2 className="text-xl font-bold text-foreground mb-2">{c.succes.title}</h2>
              <p className="text-muted-foreground mb-6">{c.succes.tekst}</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  variant="outline"
                  onClick={() => { setSubmitSuccess(false); setGekozenTaak(null) }}
                >
                  {c.succes.nogEen}
                </Button>
                <Button onClick={() => { setSubmitSuccess(false); setActiveTab("mijn-vragen") }}>
                  Bekijk mijn vragen
                </Button>
              </div>
            </div>
          ) : !gekozenTaak ? (
            // Taak selectie
            <div>
              <h2 className="text-lg font-bold text-foreground mb-1">
                {c.taakSelectie.title}
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                {c.taakSelectie.subtitle}
              </p>

              <div className="grid grid-cols-2 gap-3">
                {ZORGTAKEN.map((taak) => (
                  <button
                    key={taak.id}
                    onClick={() => setGekozenTaak(taak.id)}
                    className="flex flex-col items-start p-4 rounded-2xl border-2 border-border bg-card hover:border-primary/40 hover:shadow-md transition-all text-left min-h-[88px] active:scale-[0.98]"
                  >
                    <span className="text-2xl mb-1">{taak.emoji}</span>
                    <span className="font-medium text-sm text-foreground leading-tight">
                      {taak.naam}
                    </span>
                    <span className="text-xs text-muted-foreground mt-0.5">
                      {taak.beschrijving}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            // Formulier
            <div>
              <button
                onClick={() => setGekozenTaak(null)}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Terug
              </button>

              <h2 className="text-lg font-bold text-foreground mb-1">
                {c.formulier.title}
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                Je vraagt hulp bij: <strong>{ZORGTAKEN.find(t => t.id === gekozenTaak)?.naam}</strong>
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="titel" className="block text-sm font-semibold text-foreground mb-1.5">
                    {c.formulier.watHebJeNodig}
                  </label>
                  <input
                    id="titel"
                    type="text"
                    value={titel}
                    onChange={(e) => setTitel(e.target.value)}
                    placeholder={c.formulier.watHebJeNodigPlaceholder}
                    className="ker-input w-full"
                  />
                </div>

                <div>
                  <label htmlFor="wanneer" className="block text-sm font-semibold text-foreground mb-1.5">
                    {c.formulier.wanneer}
                  </label>
                  <input
                    id="wanneer"
                    type="text"
                    value={wanneer}
                    onChange={(e) => setWanneer(e.target.value)}
                    placeholder={c.formulier.wanneerPlaceholder}
                    className="ker-input w-full"
                  />
                </div>

                <div>
                  <label htmlFor="beschrijving" className="block text-sm font-semibold text-foreground mb-1.5">
                    {c.formulier.extraInfo}
                  </label>
                  <textarea
                    id="beschrijving"
                    value={beschrijving}
                    onChange={(e) => setBeschrijving(e.target.value)}
                    placeholder={c.formulier.extraInfoPlaceholder}
                    rows={3}
                    className="ker-input w-full resize-none"
                  />
                </div>

                {submitError && (
                  <p className="text-sm text-[var(--accent-red)]">{submitError}</p>
                )}

                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setGekozenTaak(null)}
                    className="flex-1"
                  >
                    {c.formulier.annuleren}
                  </Button>
                  <Button
                    type="submit"
                    isLoading={submitting}
                    className="flex-1"
                  >
                    {submitting ? c.formulier.bezig : c.formulier.verstuur}
                  </Button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* TAB: Mijn vragen */}
      {activeTab === "mijn-vragen" && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-foreground">{c.mijnVragen.title}</h2>

          {marktLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          )}

          {!marktLoading && (!marktData?.taken || marktData.taken.length === 0) && (
            <div className="text-center py-12">
              <p className="text-4xl mb-3">📋</p>
              <p className="text-foreground font-medium">{c.mijnVragen.leeg}</p>
              <button
                onClick={() => setActiveTab("hulpvraag")}
                className="mt-4 text-sm text-primary font-medium hover:underline"
              >
                Plaats een hulpvraag
              </button>
            </div>
          )}

          {!marktLoading && marktData?.taken && marktData.taken.length > 0 && (
            <MijnHulpvragen
              taken={marktData.taken}
              onRefresh={async () => {
                try {
                  const res = await fetch("/api/hulpvragen")
                  if (res.ok) {
                    const json = await res.json()
                    setMarktData(json)
                  }
                } catch {
                  // Silently fail
                }
              }}
            />
          )}
        </div>
      )}
    </div>
  )
}

// ============================================
// MIJN HULPVRAGEN COMPONENT
// ============================================

function MijnHulpvragen({ taken, onRefresh }: { taken: BuddyTaak[]; onRefresh?: () => void }) {
  const [actieBezig, setActieBezig] = useState<string | null>(null)

  const handleReactie = async (taakId: string, reactieId: string, actie: "accepteer" | "afwijzen") => {
    setActieBezig(reactieId)
    try {
      const res = await fetch(`/api/hulpvragen/${taakId}/reacties/${reactieId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actie }),
      })
      if (!res.ok) throw new Error("Mislukt")
      onRefresh?.()
    } catch {
      // Fout afhandelen
    } finally {
      setActieBezig(null)
    }
  }

  return (
    <div className="space-y-3">
      {taken.map((taak) => {
        const sb = statusBadge(taak.status)
        const datum = new Date(taak.createdAt).toLocaleDateString("nl-NL", {
          day: "numeric",
          month: "short",
        })

        return (
          <div key={taak.id} className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-foreground truncate">
                  {taak.titel}
                </h3>
                {taak.beschrijving && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {taak.beschrijving}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-muted-foreground">{datum}</span>
                  <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", sb.kleur)}>
                    {sb.label}
                  </span>
                </div>
              </div>
            </div>

            {/* Reacties van buddy's */}
            {taak.reacties.length > 0 && (
              <div className="mt-3 pt-3 border-t border-border space-y-3">
                <p className="text-xs font-semibold text-foreground">
                  {taak.reacties.length} reactie{taak.reacties.length !== 1 ? "s" : ""}
                </p>
                {taak.reacties.map((reactie) => {
                  const rStatus = c.mijnVragen.reactieStatus[reactie.status] || reactie.status

                  return (
                    <div key={reactie.id} className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                          {reactie.buddy.voornaam.charAt(0)}
                        </span>
                        <div className="flex-1 min-w-0">
                          <span className="font-medium text-foreground">
                            {reactie.buddy.voornaam}
                          </span>
                          <span className="text-muted-foreground">
                            {" "}uit {reactie.buddy.woonplaats}
                          </span>
                          {reactie.buddy.gemiddeldeScore > 0 && (
                            <span className="ml-1 text-xs">
                              ⭐ {reactie.buddy.gemiddeldeScore.toFixed(1)}
                            </span>
                          )}
                        </div>
                        {reactie.status !== "INTERESSE" && (
                          <span className={cn(
                            "text-xs font-medium px-2 py-0.5 rounded-full shrink-0",
                            reactie.status === "GEACCEPTEERD"
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                              : "bg-gray-100 text-gray-500 dark:bg-gray-800/30 dark:text-gray-400"
                          )}>
                            {rStatus}
                          </span>
                        )}
                      </div>

                      {reactie.bericht && (
                        <p className="text-sm text-muted-foreground pl-9 italic">
                          &ldquo;{reactie.bericht}&rdquo;
                        </p>
                      )}

                      {reactie.status === "INTERESSE" && (
                        <div className="flex gap-2 pl-9">
                          <Button
                            size="sm"
                            onClick={() => handleReactie(taak.id, reactie.id, "accepteer")}
                            isLoading={actieBezig === reactie.id}
                            disabled={!!actieBezig}
                          >
                            {actieBezig === reactie.id ? c.mijnVragen.bezig : c.mijnVragen.accepteer}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReactie(taak.id, reactie.id, "afwijzen")}
                            disabled={!!actieBezig}
                          >
                            {c.mijnVragen.afwijzen}
                          </Button>
                        </div>
                      )}

                      {reactie.status === "GEACCEPTEERD" && taak.status === "TOEGEWEZEN" && (
                        <div className="pl-9">
                          <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                            Wacht op bevestiging van {reactie.buddy.voornaam}...
                          </span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
