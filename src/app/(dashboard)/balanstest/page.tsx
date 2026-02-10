"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { GerAvatar } from "@/components/GerAvatar"
import { PdfDownloadButton } from "@/components/PdfDownloadButton"

interface TestOverzicht {
  id: string
  score: number
  niveau: "LAAG" | "GEMIDDELD" | "HOOG"
  totaleZorguren: number
  datum: string
  aantalTaken: number
  zwareTaken: number
}

interface OverzichtData {
  tests: TestOverzicht[]
  needsNewTest: boolean
  daysSinceLastTest: number | null
}

export default function BalanstestOverzichtPage() {
  const { status } = useSession()
  const [data, setData] = useState<OverzichtData | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (status === "loading") return

    const loadData = async () => {
      try {
        const res = await fetch(`/api/balanstest/overzicht?t=${Date.now()}`, {
          cache: "no-store",
        })
        if (res.ok) {
          setData(await res.json())
        }
      } catch (error) {
        console.error("Failed to load balanstest overzicht:", error)
      } finally {
        setLoading(false)
      }
    }

    if (status === "authenticated") {
      loadData()
    } else {
      setLoading(false)
    }
  }, [status])

  if (loading) {
    return (
      <div className="ker-page-content flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  const tests = data?.tests || []
  const hasTests = tests.length > 0
  const laatsteTest = tests[0] || null

  // Bereken score voor de grafiek (max 24)
  const maxScore = 24

  const handleDelete = async (testId: string) => {
    setDeleting(true)
    try {
      const res = await fetch(`/api/balanstest/${testId}`, { method: "DELETE" })
      if (res.ok) {
        setData(prev => prev ? {
          ...prev,
          tests: prev.tests.filter(t => t.id !== testId),
        } : null)
      }
    } catch (error) {
      console.error("Delete failed:", error)
    } finally {
      setDeleting(false)
      setDeleteId(null)
    }
  }

  return (
    <div className="ker-page-content">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <GerAvatar size="lg" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">Balanstest</h1>
          <p className="text-muted-foreground mt-1">
            {hasTests
              ? "Hier zie je al je resultaten en hoe het verloop is."
              : "Doe de balanstest om inzicht te krijgen in je belasting."}
          </p>
        </div>
      </div>

      {/* Nieuwe test knop */}
      {data?.needsNewTest && hasTests && (
        <div className="ker-card mb-6 bg-primary/5 border-2 border-primary">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">📊</span>
            </div>
            <div className="flex-1">
              <h2 className="font-bold text-foreground">Tijd voor een nieuwe balanstest</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Je laatste test was {data.daysSinceLastTest} dagen geleden.
                Het is goed om elke 3 maanden te checken hoe het gaat.
              </p>
            </div>
          </div>
          <Link
            href="/belastbaarheidstest"
            className="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground font-medium rounded-lg hover:opacity-90 transition-opacity"
          >
            Doe de balanstest
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      )}

      {/* Geen tests */}
      {!hasTests && (
        <div className="ker-card text-center">
          <div className="w-16 h-16 bg-muted rounded-full mx-auto mb-4 flex items-center justify-center">
            <span className="text-3xl">📊</span>
          </div>
          <h2 className="font-bold text-xl text-foreground mb-2">Nog geen test gedaan</h2>
          <p className="text-muted-foreground mb-6">
            Doe de mantelzorg balanstest om te ontdekken hoe het met je gaat
            en waar je hulp bij kunt krijgen.
          </p>
          <Link
            href="/belastbaarheidstest"
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground font-medium rounded-lg hover:opacity-90 transition-opacity"
          >
            Start de balanstest
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      )}

      {/* Score verloop grafiek */}
      {tests.length > 1 && (
        <section className="mb-6">
          <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <span className="text-2xl">📈</span> Score verloop
          </h2>
          <div className="ker-card">
            <div className="flex items-end gap-3 h-48">
              {/* Y-as labels */}
              <div className="flex flex-col justify-between h-full text-xs text-muted-foreground pr-1">
                <span>24</span>
                <span>18</span>
                <span>12</span>
                <span>6</span>
                <span>0</span>
              </div>

              {/* Balken */}
              <div className="flex-1 flex items-end gap-2 h-full relative">
                {/* Achtergrond zones */}
                <div className="absolute inset-0 flex flex-col pointer-events-none">
                  <div className="flex-1 bg-[var(--accent-red-bg)] rounded-t-lg opacity-30" style={{ flex: `${(24 - 12) / 24}` }} />
                  <div className="flex-1 bg-[var(--accent-amber-bg)] opacity-30" style={{ flex: `${(12 - 6) / 24}` }} />
                  <div className="flex-1 bg-[var(--accent-green-bg)] rounded-b-lg opacity-30" style={{ flex: `${6 / 24}` }} />
                </div>

                {/* Test balken - toon max 8, oudste eerst */}
                {[...tests].reverse().slice(-8).map((test, i, arr) => {
                  const hoogte = (test.score / maxScore) * 100
                  return (
                    <div key={test.id} className="flex-1 flex flex-col items-center justify-end h-full relative z-10">
                      <div
                        className={cn(
                          "w-full max-w-[40px] rounded-t-lg transition-all relative group",
                          test.niveau === "LAAG" && "bg-[var(--accent-green)]",
                          test.niveau === "GEMIDDELD" && "bg-[var(--accent-amber)]",
                          test.niveau === "HOOG" && "bg-[var(--accent-red)]"
                        )}
                        style={{ height: `${Math.max(hoogte, 4)}%` }}
                      >
                        {/* Score label */}
                        <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold text-foreground">
                          {test.score}
                        </span>
                      </div>
                      {/* Datum label */}
                      <span className="text-[10px] text-muted-foreground mt-2 whitespace-nowrap">
                        {new Date(test.datum).toLocaleDateString("nl-NL", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Legenda */}
            <div className="flex justify-center gap-4 mt-4 pt-4 border-t border-border/50">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-[var(--accent-green)]" />
                <span className="text-xs text-muted-foreground">Laag (0-6)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-[var(--accent-amber)]" />
                <span className="text-xs text-muted-foreground">Gemiddeld (7-12)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-[var(--accent-red)]" />
                <span className="text-xs text-muted-foreground">Hoog (13-24)</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Huidige score overzicht */}
      {laatsteTest && (
        <section className="mb-6">
          <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <span className="text-2xl">🎯</span> Laatste score
          </h2>
          <div className="ker-card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span
                  className={cn(
                    "text-3xl font-bold",
                    laatsteTest.niveau === "LAAG" && "text-[var(--accent-green)]",
                    laatsteTest.niveau === "GEMIDDELD" && "text-[var(--accent-amber)]",
                    laatsteTest.niveau === "HOOG" && "text-[var(--accent-red)]"
                  )}
                >
                  {laatsteTest.score}
                  <span className="text-lg font-normal text-muted-foreground">/24</span>
                </span>
              </div>
              <span
                className={cn(
                  "text-sm font-semibold px-3 py-1 rounded-full",
                  laatsteTest.niveau === "LAAG" && "bg-[var(--accent-green-bg)] text-[var(--accent-green)]",
                  laatsteTest.niveau === "GEMIDDELD" && "bg-[var(--accent-amber-bg)] text-[var(--accent-amber)]",
                  laatsteTest.niveau === "HOOG" && "bg-[var(--accent-red-bg)] text-[var(--accent-red)]"
                )}
              >
                {laatsteTest.niveau === "LAAG" && "Lage belasting"}
                {laatsteTest.niveau === "GEMIDDELD" && "Gemiddelde belasting"}
                {laatsteTest.niveau === "HOOG" && "Hoge belasting"}
              </span>
            </div>

            {/* Thermometer */}
            <div className="relative h-5 bg-muted rounded-full overflow-hidden mb-3">
              <div
                className={cn(
                  "absolute left-0 top-0 h-full rounded-full transition-all duration-500",
                  laatsteTest.niveau === "LAAG" && "bg-[var(--accent-green)]",
                  laatsteTest.niveau === "GEMIDDELD" && "bg-[var(--accent-amber)]",
                  laatsteTest.niveau === "HOOG" && "bg-[var(--accent-red)]"
                )}
                style={{ width: `${(laatsteTest.score / maxScore) * 100}%` }}
              />
              <div className="absolute inset-0 flex">
                <div className="flex-1 border-r border-white/30" />
                <div className="flex-1 border-r border-white/30" />
                <div className="flex-1" />
              </div>
            </div>

            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{laatsteTest.aantalTaken} zorgtaken</span>
              <span>{laatsteTest.totaleZorguren} uur/week</span>
            </div>

            <Link
              href="/rapport"
              className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-border/50 text-sm font-medium text-primary hover:underline"
            >
              Bekijk volledig rapport
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </section>
      )}

      {/* Alle rapporten */}
      {tests.length > 0 && (
        <section className="mb-6">
          <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <span className="text-2xl">📋</span> Alle rapporten
          </h2>
          <div className="space-y-3">
            {tests.map((test, i) => (
              <div key={test.id} className="ker-card relative">
                {/* Bevestigingsdialoog */}
                {deleteId === test.id && (
                  <div className="absolute inset-0 z-10 bg-card/95 backdrop-blur-sm rounded-2xl flex items-center justify-center p-4">
                    <div className="text-center">
                      <p className="font-medium text-foreground mb-3">
                        Weet je het zeker?
                      </p>
                      <p className="text-sm text-muted-foreground mb-4">
                        Deze test wordt definitief verwijderd.
                      </p>
                      <div className="flex gap-2 justify-center">
                        <button
                          type="button"
                          onClick={() => setDeleteId(null)}
                          className="px-4 py-2.5 text-sm font-medium rounded-lg bg-muted text-foreground hover:bg-muted/80 transition-colors"
                        >
                          Annuleren
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(test.id)}
                          disabled={deleting}
                          className="px-4 py-2.5 text-sm font-medium rounded-lg bg-[var(--accent-red)] text-white hover:opacity-90 transition-opacity disabled:opacity-50"
                        >
                          {deleting ? "Bezig..." : "Verwijderen"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Test info */}
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className={cn(
                      "w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0",
                      test.niveau === "LAAG" && "bg-[var(--accent-green-bg)] text-[var(--accent-green)]",
                      test.niveau === "GEMIDDELD" && "bg-[var(--accent-amber-bg)] text-[var(--accent-amber)]",
                      test.niveau === "HOOG" && "bg-[var(--accent-red-bg)] text-[var(--accent-red)]"
                    )}
                  >
                    {test.score}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-foreground">
                        {new Date(test.datum).toLocaleDateString("nl-NL", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                      {i === 0 && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                          Laatste
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {test.aantalTaken} taken &middot; {test.totaleZorguren} uur/week
                      {test.zwareTaken > 0 && ` · ${test.zwareTaken} zwaar`}
                    </p>
                  </div>
                </div>

                {/* Actieknoppen */}
                <div className="flex gap-2">
                  <Link
                    href="/rapport"
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Bekijken
                  </Link>
                  <PdfDownloadButton testId={test.id} size="sm" variant="button" />
                  <button
                    type="button"
                    onClick={() => setDeleteId(test.id)}
                    className="flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-medium rounded-lg bg-[var(--accent-red-bg)] text-[var(--accent-red)] hover:bg-[var(--accent-red)]/20 transition-colors"
                    aria-label="Test verwijderen"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Doe nieuwe test knop (altijd tonen als er al tests zijn) */}
      {hasTests && !data?.needsNewTest && (
        <Link
          href="/belastbaarheidstest"
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-secondary text-foreground font-medium rounded-lg hover:bg-secondary/80 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Doe de test opnieuw
        </Link>
      )}
    </div>
  )
}
