"use client"

import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"

// ============================================
// TYPES
// ============================================

interface OpenTaak {
  id: string
  titel: string
  beschrijving: string | null
  categorie: string
  datum: string | null
  tijdstip: string | null
  isFlexibel: boolean
  createdAt: string
  mantelzorger: {
    voornaam: string
    gemeente: string | null
  }
  afstandKm: number | null
  alGereageerd: boolean
  mijnReactieStatus: string | null
}

interface Match {
  id: string
  status: string
  buddyNaam: string
  mantelzorgerNaam: string
  caregiverId: string
  taakReacties: {
    taak: {
      titel: string
      status: string
    }
  }[]
  ongelezen: number
}

// ============================================
// CATEGORIE LABELS
// ============================================

const CATEGORIE_LABELS: Record<string, { label: string; emoji: string }> = {
  GESPREK: { label: "Gesprek", emoji: "💬" },
  BOODSCHAPPEN: { label: "Boodschappen", emoji: "🛒" },
  VERVOER: { label: "Vervoer", emoji: "🚗" },
  KLUSJES: { label: "Klusjes", emoji: "🔨" },
  OPPAS: { label: "Oppas", emoji: "🏠" },
  ADMINISTRATIE: { label: "Administratie", emoji: "📋" },
  OVERIG: { label: "Overig", emoji: "📌" },
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function BuddyDashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [tab, setTab] = useState<"open" | "mijn">("open")
  const [openTaken, setOpenTaken] = useState<OpenTaak[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reageerBezig, setReageerBezig] = useState<string | null>(null)
  const [reageerBericht, setReageerBericht] = useState<Record<string, string>>({})

  const hasFetched = useRef(false)

  // Redirect als niet ingelogd of geen buddy
  useEffect(() => {
    if (status === "loading") return
    if (!session?.user?.id) {
      router.push("/login")
      return
    }
    if (session.user.role !== "BUDDY" && session.user.role !== "ADMIN") {
      router.push("/dashboard")
    }
  }, [session, status, router])

  // Data laden
  useEffect(() => {
    if (hasFetched.current || status === "loading" || !session?.user?.id) return
    hasFetched.current = true

    const fetchData = async () => {
      try {
        const [openRes, matchRes] = await Promise.all([
          fetch("/api/marktplaats/open"),
          fetch("/api/buddys/mijn-matches"),
        ])

        if (openRes.ok) {
          const openJson = await openRes.json()
          setOpenTaken(openJson.taken || [])
        }

        if (matchRes.ok) {
          const matchJson = await matchRes.json()
          setMatches(matchJson.matches || [])
        }
      } catch {
        setError("Er ging iets mis bij het laden.")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [session, status])

  // Reageer op taak
  const handleReageer = async (taakId: string) => {
    setReageerBezig(taakId)
    try {
      const res = await fetch(`/api/marktplaats/${taakId}/reageer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bericht: reageerBericht[taakId] || null,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Reageren mislukt")
      }

      // Update lokale state
      setOpenTaken((prev) =>
        prev.map((t) =>
          t.id === taakId
            ? { ...t, alGereageerd: true, mijnReactieStatus: "INTERESSE" }
            : t
        )
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : "Er ging iets mis")
    } finally {
      setReageerBezig(null)
    }
  }

  // ============================================
  // LOADING / ERROR / AUTH
  // ============================================

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-secondary rounded w-1/3" />
            <div className="h-4 bg-secondary rounded w-2/3" />
            <div className="space-y-3 mt-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-secondary rounded-2xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-2xl mx-auto px-4 py-8 text-center">
          <p className="text-lg text-muted-foreground">{error}</p>
          <button
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg"
            onClick={() => {
              hasFetched.current = false
              setError(null)
              setLoading(true)
            }}
          >
            Opnieuw proberen
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">
            Hoi {session?.user?.name?.split(" ")[0] || "Buddy"} 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            Bekijk hulpvragen en help mantelzorgers bij jou in de buurt.
          </p>
        </div>

        {/* Tab navigatie */}
        <div className="flex gap-1 bg-secondary/50 rounded-xl p-1 mb-6">
          <button
            onClick={() => setTab("open")}
            className={cn(
              "flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all",
              tab === "open"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Hulpvragen ({openTaken.filter((t) => !t.alGereageerd).length})
          </button>
          <button
            onClick={() => setTab("mijn")}
            className={cn(
              "flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all",
              tab === "mijn"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Mijn matches ({matches.length})
          </button>
        </div>

        {/* Open hulpvragen */}
        {tab === "open" && (
          <div className="space-y-3">
            {openTaken.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-3">🔍</div>
                <p className="text-muted-foreground">
                  Er zijn op dit moment geen hulpvragen bij jou in de buurt.
                </p>
              </div>
            ) : (
              openTaken.map((taak) => {
                const cat = CATEGORIE_LABELS[taak.categorie] || CATEGORIE_LABELS.OVERIG

                return (
                  <div
                    key={taak.id}
                    className="bg-card border border-border rounded-2xl p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">{cat.emoji}</span>
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                            {cat.label}
                          </span>
                          {taak.afstandKm !== null && (
                            <span className="text-xs text-muted-foreground">
                              📍 {taak.afstandKm.toFixed(1)} km
                            </span>
                          )}
                        </div>
                        <h3 className="font-semibold text-foreground">
                          {taak.titel}
                        </h3>
                        {taak.beschrijving && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {taak.beschrijving}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span>{taak.mantelzorger.voornaam}</span>
                          {taak.mantelzorger.gemeente && (
                            <span>{taak.mantelzorger.gemeente}</span>
                          )}
                          <span>
                            {new Date(taak.createdAt).toLocaleDateString("nl-NL", {
                              day: "numeric",
                              month: "short",
                            })}
                          </span>
                        </div>
                      </div>
                    </div>

                    {taak.alGereageerd ? (
                      <div className="flex items-center gap-2 py-2 px-3 rounded-lg bg-green-50 dark:bg-green-900/20">
                        <span className="text-green-600 dark:text-green-400 text-sm font-medium">
                          ✓ Je hebt gereageerd
                        </span>
                        {taak.mijnReactieStatus === "GEACCEPTEERD" && (
                          <span className="text-xs bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full font-medium">
                            Geaccepteerd!
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <textarea
                          value={reageerBericht[taak.id] || ""}
                          onChange={(e) =>
                            setReageerBericht((prev) => ({
                              ...prev,
                              [taak.id]: e.target.value,
                            }))
                          }
                          placeholder="Stel je kort voor (optioneel)"
                          rows={2}
                          className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-background text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                        <button
                          onClick={() => handleReageer(taak.id)}
                          disabled={reageerBezig === taak.id}
                          className={cn(
                            "w-full py-2.5 rounded-lg text-sm font-semibold transition-all",
                            "bg-primary text-primary-foreground hover:bg-primary/90",
                            "disabled:opacity-50 disabled:cursor-not-allowed"
                          )}
                        >
                          {reageerBezig === taak.id ? "Bezig..." : "Ik wil helpen"}
                        </button>
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        )}

        {/* Mijn matches */}
        {tab === "mijn" && (
          <div className="space-y-3">
            {matches.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-3">🤝</div>
                <p className="text-muted-foreground">
                  Je hebt nog geen matches. Reageer op een hulpvraag om te beginnen!
                </p>
                <button
                  onClick={() => setTab("open")}
                  className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium"
                >
                  Bekijk hulpvragen
                </button>
              </div>
            ) : (
              matches.map((match) => (
                <div
                  key={match.id}
                  className="bg-card border border-border rounded-2xl p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-lg font-bold text-primary">
                        {match.mantelzorgerNaam.charAt(0)}
                      </span>
                      <div>
                        <h3 className="font-semibold text-foreground">
                          {match.mantelzorgerNaam}
                        </h3>
                        <span className={cn(
                          "text-xs font-medium px-2 py-0.5 rounded-full",
                          match.status === "ACTIEF"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                            : "bg-gray-100 text-gray-600 dark:bg-gray-800/30 dark:text-gray-400"
                        )}>
                          {match.status === "ACTIEF" ? "Actief" : match.status}
                        </span>
                      </div>
                    </div>
                    {match.ongelezen > 0 && (
                      <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                        {match.ongelezen}
                      </span>
                    )}
                  </div>

                  {/* Taken in deze match */}
                  {match.taakReacties.length > 0 && (
                    <div className="mb-3 space-y-1">
                      {match.taakReacties.map((tr, i) => (
                        <p key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                          <span className="text-xs">📋</span>
                          {tr.taak.titel}
                          <span className={cn(
                            "text-xs px-1.5 py-0.5 rounded-full",
                            tr.taak.status === "TOEGEWEZEN"
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                              : "bg-gray-100 text-gray-500"
                          )}>
                            {tr.taak.status === "TOEGEWEZEN" ? "Actief" : tr.taak.status}
                          </span>
                        </p>
                      ))}
                    </div>
                  )}

                  <Link
                    href={`/chat/${match.id}`}
                    className="block w-full py-2.5 text-center rounded-lg text-sm font-medium bg-secondary text-foreground hover:bg-secondary/80 transition-colors"
                  >
                    💬 Chat openen
                  </Link>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
