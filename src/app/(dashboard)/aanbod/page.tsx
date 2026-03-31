"use client"

import { useState, useEffect, useRef, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { FavorietButton } from "@/components/FavorietButton"

// ============================================
// TYPES
// ============================================

type FilterType = "alles" | "hulp" | "info" | "buddys"

interface Hulpbron {
  naam: string
  telefoon: string | null
  website: string | null
  beschrijving: string | null
  soortHulp?: string | null
  gemeente?: string | null
  dienst?: string | null
  bronLabel?: string | null
}

interface LerenCategorie {
  id: string
  title: string
  description: string
  emoji: string
  href: string
  artikelCount?: number
}

interface BuddyMatch {
  id: string
  voornaam: string
  woonplaats: string
  afstand: number | null
  hulpvormen: string[]
  beschikbaarheid: string
  matchPercentage: number
}

interface FavorietItem {
  id: string
  type: string
  itemId: string
  titel: string
  beschrijving: string | null
  categorie: string | null
  url: string | null
  telefoon: string | null
  isVoltooid: boolean
}

// ============================================
// MAIN PAGE
// ============================================

export default function AanbodPage() {
  return (
    <Suspense fallback={
      <div className="ker-page-content flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    }>
      <AanbodContent />
    </Suspense>
  )
}

function AanbodContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const initialFilter = (searchParams.get("filter") as FilterType) || "alles"
  const [activeFilter, setActiveFilter] = useState<FilterType>(initialFilter)

  // Data states
  const [hulpVoorJou, setHulpVoorJou] = useState<Hulpbron[]>([])
  const [hulpVoorNaaste, setHulpVoorNaaste] = useState<Hulpbron[]>([])
  const [lerenCategorieen, setLerenCategorieen] = useState<LerenCategorie[]>([])
  const [buddyMatches, setBuddyMatches] = useState<BuddyMatch[]>([])
  const [favorieten, setFavorieten] = useState<FavorietItem[]>([])
  const [loading, setLoading] = useState(true)

  // Modal state
  const [selectedHulpbron, setSelectedHulpbron] = useState<Hulpbron | null>(null)

  const hasFetched = useRef(false)

  useEffect(() => {
    if (hasFetched.current) return
    hasFetched.current = true

    const loadAll = async () => {
      try {
        const [hulpRes, lerenRes, buddyRes, favRes] = await Promise.all([
          fetch("/api/hulpvragen").catch(() => null),
          fetch("/api/content/categorieen?type=LEREN").catch(() => null),
          fetch("/api/buddys/matches?limit=3").catch(() => null),
          fetch("/api/favorieten").catch(() => null),
        ])

        // Hulpbronnen
        if (hulpRes?.ok) {
          const hulpData = await hulpRes.json()
          // Verzamel alle hulpbronnen voor mantelzorger
          const voorJou: Hulpbron[] = []
          if (hulpData.perCategorie) {
            for (const cats of Object.values(hulpData.perCategorie) as Hulpbron[][]) {
              voorJou.push(...cats)
            }
          }
          // Dedup op naam
          const seen = new Set<string>()
          const unique = voorJou.filter(h => {
            if (seen.has(h.naam)) return false
            seen.add(h.naam)
            return true
          })
          setHulpVoorJou(unique.slice(0, 10))

          // Landelijke hulp
          if (hulpData.landelijk) {
            setHulpVoorNaaste(hulpData.landelijk.slice(0, 10))
          }
        }

        // Leren categorieeen
        if (lerenRes?.ok) {
          const data = await lerenRes.json()
          const mapped: LerenCategorie[] = (data.categorieen || []).map((cat: { slug: string; naam: string; beschrijving: string; emoji: string }) => ({
            id: cat.slug,
            title: cat.naam,
            description: cat.beschrijving,
            emoji: cat.emoji,
            href: `/leren/${cat.slug}`,
          }))
          setLerenCategorieen(mapped)
        }

        // Buddy matches
        if (buddyRes?.ok) {
          const data = await buddyRes.json()
          setBuddyMatches(data.matches || [])
        }

        // Favorieten
        if (favRes?.ok) {
          const data = await favRes.json()
          setFavorieten(data.favorieten || [])
        }
      } catch (error) {
        console.error("Aanbod laden mislukt:", error)
      } finally {
        setLoading(false)
      }
    }

    loadAll()
  }, [])

  const handleFilterChange = (filter: FilterType) => {
    setActiveFilter(filter)
    router.replace(`/aanbod?filter=${filter}`, { scroll: false })
  }

  if (loading) {
    return (
      <div className="ker-page-content flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="ker-page-content space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-foreground">Aanbod</h1>
        <p className="text-sm text-muted-foreground">Hulp, informatie en mensen bij jou in de buurt</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {([
          { key: "alles", label: "Alles" },
          { key: "hulp", label: "Hulp" },
          { key: "info", label: "Info & Tips" },
          { key: "buddys", label: "Buddy's" },
        ] as { key: FilterType; label: string }[]).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => handleFilterChange(key)}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
              activeFilter === key
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-foreground hover:bg-secondary/80"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Favorieten snelle rij — altijd zichtbaar als er favorieten zijn */}
      {favorieten.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">❤️</span>
              <h2 className="font-semibold text-foreground text-sm">Favorieten ({favorieten.length})</h2>
            </div>
            <Link href="/favorieten" className="text-xs font-medium text-primary hover:text-primary/80">
              Bekijk alle →
            </Link>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
            {favorieten.slice(0, 6).map((fav) => (
              <div
                key={fav.id}
                className={cn(
                  "flex-shrink-0 w-40 p-3 rounded-xl border border-border bg-card text-left",
                  fav.isVoltooid && "opacity-50"
                )}
              >
                <p className="text-sm font-medium text-foreground line-clamp-2">{fav.titel}</p>
                {fav.categorie && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{fav.categorie}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* HULP SECTIE */}
      {(activeFilter === "alles" || activeFilter === "hulp") && (
        <>
          {/* Hulp voor jou */}
          {hulpVoorJou.length > 0 && (
            <section>
              <h2 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <span>💜</span> Hulp voor jou
              </h2>
              <div className="space-y-2">
                {hulpVoorJou.slice(0, activeFilter === "hulp" ? 20 : 5).map((hulp, i) => (
                  <HulpKaart key={i} hulp={hulp} onSelect={setSelectedHulpbron} />
                ))}
              </div>
              {activeFilter === "alles" && hulpVoorJou.length > 5 && (
                <button
                  onClick={() => handleFilterChange("hulp")}
                  className="text-sm font-medium text-primary hover:text-primary/80 mt-2 py-2"
                >
                  Bekijk meer hulp →
                </button>
              )}
            </section>
          )}

          {/* Hulp voor naaste */}
          {hulpVoorNaaste.length > 0 && (
            <section>
              <h2 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <span>💝</span> Hulp voor je naaste
              </h2>
              <div className="space-y-2">
                {hulpVoorNaaste.slice(0, activeFilter === "hulp" ? 20 : 3).map((hulp, i) => (
                  <HulpKaart key={i} hulp={hulp} onSelect={setSelectedHulpbron} />
                ))}
              </div>
              {activeFilter === "alles" && hulpVoorNaaste.length > 3 && (
                <button
                  onClick={() => handleFilterChange("hulp")}
                  className="text-sm font-medium text-primary hover:text-primary/80 mt-2 py-2"
                >
                  Bekijk meer →
                </button>
              )}
            </section>
          )}

          {/* Volledige hulp pagina link */}
          {activeFilter === "alles" && (
            <Link
              href="/hulpvragen"
              className="ker-card flex items-center justify-between group hover:border-primary/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🏥</span>
                <div>
                  <p className="font-semibold text-foreground group-hover:text-primary transition-colors">Alle hulporganisaties</p>
                  <p className="text-sm text-muted-foreground">Zoek per categorie en locatie</p>
                </div>
              </div>
              <svg className="w-5 h-5 text-muted-foreground group-hover:text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          )}
        </>
      )}

      {/* INFO & TIPS SECTIE */}
      {(activeFilter === "alles" || activeFilter === "info") && lerenCategorieen.length > 0 && (
        <section>
          <h2 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <span>📚</span> Info & Tips
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {lerenCategorieen.map((cat) => (
              <Link
                key={cat.id}
                href={cat.href}
                className="ker-card flex flex-col items-center text-center p-4 hover:border-primary/30 transition-colors group"
              >
                <span className="text-3xl mb-2">{cat.emoji}</span>
                <p className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">{cat.title}</p>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{cat.description}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* BUDDY'S SECTIE */}
      {(activeFilter === "alles" || activeFilter === "buddys") && (
        <section>
          <h2 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <span>🤝</span> MantelBuddy{"'"}s
          </h2>

          {buddyMatches.length > 0 ? (
            <div className="space-y-2">
              {buddyMatches.map((buddy) => (
                <div key={buddy.id} className="ker-card flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-xl">👤</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground">{buddy.voornaam}</p>
                    <p className="text-sm text-muted-foreground">
                      {buddy.woonplaats}
                      {buddy.afstand !== null && ` • ${buddy.afstand} km`}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {buddy.hulpvormen.slice(0, 3).map((h) => (
                        <span key={h} className="text-xs bg-secondary px-2 py-0.5 rounded-full">{h}</span>
                      ))}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-sm font-bold text-primary">{buddy.matchPercentage}%</span>
                    <p className="text-xs text-muted-foreground">match</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="ker-card text-center py-6">
              <span className="text-3xl block mb-2">🤝</span>
              <p className="font-semibold text-foreground mb-1">Vrijwilligers bij jou in de buurt</p>
              <p className="text-sm text-muted-foreground mb-4">
                MantelBuddy{"'"}s helpen met boodschappen, vervoer, gezelschap en meer.
              </p>
            </div>
          )}

          <Link
            href="/buddys"
            className="ker-card flex items-center justify-between group hover:border-primary/30 transition-colors mt-2"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">👥</span>
              <div>
                <p className="font-semibold text-foreground group-hover:text-primary transition-colors">
                  {buddyMatches.length > 0 ? "Alle buddy's bekijken" : "Zoek een MantelBuddy"}
                </p>
                <p className="text-sm text-muted-foreground">Zoek, vraag hulp of bekijk je matches</p>
              </div>
            </div>
            <svg className="w-5 h-5 text-muted-foreground group-hover:text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </section>
      )}

      {/* Detail modal — simpele overlay */}
      {selectedHulpbron && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50" onClick={(e) => { if (e.target === e.currentTarget) setSelectedHulpbron(null) }}>
          <div className="bg-card rounded-t-2xl sm:rounded-2xl p-6 w-full max-w-md space-y-4">
            <div className="flex items-start justify-between">
              <h2 className="text-lg font-bold text-foreground">{selectedHulpbron.naam}</h2>
              <button onClick={() => setSelectedHulpbron(null)} className="p-1 text-muted-foreground hover:text-foreground">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {selectedHulpbron.beschrijving && (
              <p className="text-sm text-muted-foreground">{selectedHulpbron.beschrijving}</p>
            )}
            <div className="space-y-2">
              {selectedHulpbron.telefoon && (
                <a
                  href={`tel:${selectedHulpbron.telefoon}`}
                  className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 hover:bg-primary/10 transition-colors"
                >
                  <span className="text-lg">📞</span>
                  <span className="font-medium text-foreground">{selectedHulpbron.telefoon}</span>
                </a>
              )}
              {selectedHulpbron.website && (
                <a
                  href={selectedHulpbron.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 hover:bg-primary/10 transition-colors"
                >
                  <span className="text-lg">🌐</span>
                  <span className="font-medium text-primary">Website bezoeken</span>
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================
// HULP KAART COMPONENT
// ============================================

function HulpKaart({ hulp, onSelect }: { hulp: Hulpbron; onSelect: (h: Hulpbron) => void }) {
  return (
    <button
      onClick={() => onSelect(hulp)}
      className="ker-card w-full text-left flex items-center gap-3 hover:border-primary/30 transition-colors"
    >
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-foreground line-clamp-1">{hulp.dienst || hulp.naam}</p>
        {hulp.beschrijving && (
          <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">{hulp.beschrijving}</p>
        )}
        {hulp.bronLabel && (
          <span className="inline-block text-xs bg-secondary px-2 py-0.5 rounded-full mt-1">{hulp.bronLabel}</span>
        )}
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        {hulp.telefoon && (
          <a
            href={`tel:${hulp.telefoon}`}
            onClick={(e) => e.stopPropagation()}
            className="p-2 rounded-lg hover:bg-primary/10 text-primary transition-colors"
            title="Bel"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </a>
        )}
        <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </button>
  )
}
