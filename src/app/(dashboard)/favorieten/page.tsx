"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface Favoriet {
  id: string
  type: "HULP" | "INFORMATIE"
  itemId: string
  titel: string
  beschrijving: string | null
  categorie: string | null
  url: string | null
  telefoon: string | null
  icon: string | null
  isVoltooid: boolean
  voltooitOp: string | null
  createdAt: string
}

type FavTab = "voor-jou" | "voor-naaste" | "algemeen" | "informatie"

// Categorieën die bij "Voor jou" horen (mantelzorger)
const CATEGORIEEN_MANTELZORGER = [
  'Mantelzorgondersteuning', 'Respijtzorg', 'Emotionele steun', 'Lotgenotencontact'
]

// Categorieën die bij "Voor naaste" horen (zorgvrager)
const CATEGORIEEN_ZORGVRAGER = [
  'Persoonlijke verzorging', 'Huishoudelijke taken', 'Vervoer',
  'Administratie en aanvragen', 'Plannen en organiseren',
  'Sociaal contact en activiteiten', 'Bereiden en/of nuttigen van maaltijden',
  'Boodschappen', 'Klusjes in en om het huis', 'Huisdieren'
]

export default function FavorietenPage() {
  const [favorieten, setFavorieten] = useState<Favoriet[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<FavTab | null>(null)

  useEffect(() => {
    loadFavorieten()
  }, [])

  const loadFavorieten = async () => {
    try {
      const res = await fetch(`/api/favorieten?t=${Date.now()}`, {
        cache: "no-store",
      })
      if (res.ok) {
        const data = await res.json()
        setFavorieten(data.favorieten || [])
      }
    } catch (error) {
      console.error("Fout bij laden favorieten:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleVerwijder = async (id: string) => {
    setFavorieten(prev => prev.filter(f => f.id !== id))
    window.dispatchEvent(new Event("favorieten-updated"))

    try {
      const res = await fetch(`/api/favorieten/${id}`, { method: "DELETE" })
      if (!res.ok) loadFavorieten()
    } catch {
      loadFavorieten()
    }
  }

  const handleToggleVoltooid = async (id: string, huidigeStatus: boolean) => {
    setFavorieten(prev =>
      prev.map(f =>
        f.id === id
          ? { ...f, isVoltooid: !huidigeStatus, voltooitOp: !huidigeStatus ? new Date().toISOString() : null }
          : f
      )
    )
    window.dispatchEvent(new Event("favorieten-updated"))

    try {
      const res = await fetch(`/api/favorieten/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isVoltooid: !huidigeStatus }),
      })
      if (!res.ok) loadFavorieten()
    } catch {
      loadFavorieten()
    }
  }

  if (loading) {
    return (
      <div className="ker-page-content flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Categoriseer favorieten - inclusief voltooide items per categorie
  const voorJou = favorieten.filter(f =>
    f.type === "HULP" && CATEGORIEEN_MANTELZORGER.includes(f.categorie || "")
  )
  const voorNaaste = favorieten.filter(f =>
    f.type === "HULP" && CATEGORIEEN_ZORGVRAGER.includes(f.categorie || "")
  )
  const algemeen = favorieten.filter(f =>
    f.type === "HULP" &&
    !CATEGORIEEN_MANTELZORGER.includes(f.categorie || "") &&
    !CATEGORIEEN_ZORGVRAGER.includes(f.categorie || "")
  )
  const informatie = favorieten.filter(f => f.type === "INFORMATIE")

  const geenFavorieten = favorieten.length === 0

  const handleTabClick = (tab: FavTab) => {
    setActiveTab(activeTab === tab ? null : tab)
  }

  // Haal items voor actieve tab
  const getActiveItems = (): Favoriet[] => {
    switch (activeTab) {
      case "voor-jou": return voorJou
      case "voor-naaste": return voorNaaste
      case "algemeen": return algemeen
      case "informatie": return informatie
      default: return []
    }
  }

  // Groepeer per categorie, met voltooide items onderaan
  const groepeerPerCategorie = (items: Favoriet[]): Record<string, Favoriet[]> => {
    // Sorteer: niet-voltooid eerst, dan voltooid
    const gesorteerd = [...items].sort((a, b) => {
      if (a.isVoltooid === b.isVoltooid) return 0
      return a.isVoltooid ? 1 : -1
    })

    return gesorteerd.reduce<Record<string, Favoriet[]>>((acc, fav) => {
      const cat = fav.categorie || "Overig"
      if (!acc[cat]) acc[cat] = []
      acc[cat].push(fav)
      return acc
    }, {})
  }

  // Tel afgeronde items per tab
  const countAfgerond = (items: Favoriet[]) => items.filter(f => f.isVoltooid).length

  return (
    <div className="ker-page-content pb-24">
      {/* Header - compact */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <span className="text-3xl">❤️</span> Mijn favorieten
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Alles wat je hebt bewaard op één plek.
        </p>
      </div>

      {/* Lege staat */}
      {geenFavorieten && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">💜</div>
          <h2 className="text-lg font-semibold text-foreground mb-2">Je hebt nog geen favorieten</h2>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto mb-6">
            Op de <span className="font-medium">Hulp</span> en <span className="font-medium">Informatie</span> pagina
            kun je op het hartje tikken. Dan verschijnen ze hier.
          </p>
          <div className="flex flex-col gap-3 max-w-xs mx-auto">
            <Link href="/hulpvragen" className="ker-btn ker-btn-primary text-center">
              Naar Hulp
            </Link>
            <Link href="/leren" className="ker-btn ker-btn-secondary text-center">
              Naar Informatie
            </Link>
          </div>
        </div>
      )}

      {/* Tabs - 4 gelijke knoppen in 2x2 grid */}
      {!geenFavorieten && (
        <>
          {/* Uitleg tekst */}
          <div className="bg-primary/5 rounded-xl p-3 mb-4">
            <p className="text-sm text-foreground">
              Kies een categorie om je bewaarde items te bekijken.
            </p>
          </div>

          {/* 2x2 grid met 4 gelijke tabs */}
          <div className="grid grid-cols-2 gap-2 mb-6">
            <TabButton
              label="Voor jou"
              emoji="💜"
              count={voorJou.length}
              countAfgerond={countAfgerond(voorJou)}
              isActive={activeTab === "voor-jou"}
              onClick={() => handleTabClick("voor-jou")}
              disabled={voorJou.length === 0}
            />
            <TabButton
              label="Voor naaste"
              emoji="💝"
              count={voorNaaste.length}
              countAfgerond={countAfgerond(voorNaaste)}
              isActive={activeTab === "voor-naaste"}
              onClick={() => handleTabClick("voor-naaste")}
              disabled={voorNaaste.length === 0}
            />
            <TabButton
              label="Algemeen"
              emoji="🌍"
              count={algemeen.length}
              countAfgerond={countAfgerond(algemeen)}
              isActive={activeTab === "algemeen"}
              onClick={() => handleTabClick("algemeen")}
              disabled={algemeen.length === 0}
            />
            <TabButton
              label="Informatie"
              emoji="📚"
              count={informatie.length}
              countAfgerond={countAfgerond(informatie)}
              isActive={activeTab === "informatie"}
              onClick={() => handleTabClick("informatie")}
              disabled={informatie.length === 0}
            />
          </div>

          {/* Content voor actieve tab */}
          {activeTab && (
            <div className="space-y-3">
              {/* Instructie tekst */}
              {getActiveItems().length > 0 && (
                <div className="bg-primary/5 rounded-xl p-3 mb-2">
                  <p className="text-sm text-foreground">
                    Klaar met een item? Tik op <span className="font-medium text-[var(--accent-green)]">Afgerond</span> om af te vinken.
                  </p>
                </div>
              )}

              {/* Items gegroepeerd per categorie */}
              {(() => {
                const items = getActiveItems()
                if (items.length === 0) return null

                const gegroepeerd = groepeerPerCategorie(items)

                return Object.entries(gegroepeerd).map(([categorie, catItems]) => (
                  <div key={categorie}>
                    {Object.keys(gegroepeerd).length > 1 && (
                      <p className="text-sm font-semibold text-muted-foreground mb-2 mt-4">
                        {categorie}
                      </p>
                    )}
                    <div className="space-y-2">
                      {catItems.map(fav => (
                        <FavorietCard
                          key={fav.id}
                          fav={fav}
                          onVerwijder={handleVerwijder}
                          onToggleVoltooid={handleToggleVoltooid}
                        />
                      ))}
                    </div>
                  </div>
                ))
              })()}
            </div>
          )}
        </>
      )}
    </div>
  )
}

// Tab button component - 4 gelijke knoppen
function TabButton({
  label,
  emoji,
  count,
  countAfgerond,
  isActive,
  onClick,
  disabled = false,
}: {
  label: string
  emoji: string
  count: number
  countAfgerond: number
  isActive: boolean
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "py-3 px-2 rounded-xl font-medium text-sm transition-all text-center relative",
        disabled && "opacity-40",
        isActive
          ? "bg-primary text-primary-foreground"
          : "bg-muted text-muted-foreground hover:bg-muted/80"
      )}
    >
      <span className="text-lg block mb-1">{emoji}</span>
      {label}
      {count > 0 && (
        <span className={cn(
          "absolute -top-1 -right-1 w-5 h-5 text-xs font-bold rounded-full flex items-center justify-center",
          isActive
            ? "bg-white text-primary"
            : "bg-primary text-white"
        )}>
          {count}
        </span>
      )}
      {/* Afgerond indicator */}
      {countAfgerond > 0 && (
        <span className="block text-xs mt-0.5 opacity-70">
          {countAfgerond} ✅
        </span>
      )}
    </button>
  )
}

// Favoriet kaart - subtielere knoppen
function FavorietCard({
  fav,
  onVerwijder,
  onToggleVoltooid,
}: {
  fav: Favoriet
  onVerwijder: (id: string) => void
  onToggleVoltooid: (id: string, huidigeStatus: boolean) => void
}) {
  const isVoltooid = fav.isVoltooid

  return (
    <div className={cn(
      "ker-card py-3 transition-all",
      isVoltooid && "opacity-60 bg-[var(--accent-green-bg)]"
    )}>
      {/* Bovenste rij: icoon + titel */}
      <div className="flex items-start gap-3">
        <span className="text-2xl">{fav.icon || (fav.type === "HULP" ? "💜" : "📚")}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className={cn(
              "font-medium text-base",
              isVoltooid && "line-through text-muted-foreground"
            )}>
              {fav.titel}
            </p>
            {isVoltooid && (
              <span className="text-sm text-[var(--accent-green)] font-medium">✅</span>
            )}
          </div>
          {fav.beschrijving && (
            <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
              {fav.beschrijving}
            </p>
          )}
          {/* Telefoon en website */}
          {(fav.telefoon || fav.url) && (
            <div className="flex gap-3 mt-1.5">
              {fav.telefoon && (
                <a href={`tel:${fav.telefoon}`} className="text-sm text-primary hover:underline flex items-center gap-1">
                  📞 {fav.telefoon}
                </a>
              )}
              {fav.url && (
                <a href={fav.url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1">
                  🌐 Website
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Actie knoppen - subtielere stijl */}
      <div className="flex gap-2 mt-2.5 pl-9">
        {!isVoltooid ? (
          <button
            onClick={() => onToggleVoltooid(fav.id, fav.isVoltooid)}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-[var(--accent-green)]/15 text-[var(--accent-green)] font-medium text-sm hover:bg-[var(--accent-green)]/25 transition-colors min-h-[44px]"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            Afgerond
          </button>
        ) : (
          <button
            onClick={() => onToggleVoltooid(fav.id, fav.isVoltooid)}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-border text-muted-foreground text-sm hover:bg-muted transition-colors min-h-[44px]"
          >
            Niet afgerond
          </button>
        )}
        <button
          onClick={() => onVerwijder(fav.id)}
          className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-red-50 text-red-600 text-sm font-medium hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30 transition-colors min-h-[44px]"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Verwijderen
        </button>
      </div>
    </div>
  )
}
