"use client"

import { useState, useEffect } from "react"
import { cn, ensureAbsoluteUrl } from "@/lib/utils"
import Link from "next/link"
import { favorietenContent } from "@/config/content"

const c = favorietenContent

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

type FavTab = "voor-jou" | "voor-naaste" | "informatie"

// Categorieën die bij "Voor jou" horen (mantelzorger)
const CATEGORIEEN_MANTELZORGER = [
  'Mantelzorgondersteuning', 'Vervangende mantelzorg', 'Emotionele steun', 'Lotgenotencontact'
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
  // Algemeen (landelijke hulpbronnen) + informatie-artikelen samenvoegen in "Informatie"
  const algemeenHulp = favorieten.filter(f =>
    f.type === "HULP" &&
    !CATEGORIEEN_MANTELZORGER.includes(f.categorie || "") &&
    !CATEGORIEEN_ZORGVRAGER.includes(f.categorie || "")
  )
  const informatieArtikelen = favorieten.filter(f => f.type === "INFORMATIE")
  const informatie = [...informatieArtikelen, ...algemeenHulp]

  const geenFavorieten = favorieten.length === 0

  const handleTabClick = (tab: FavTab) => {
    setActiveTab(activeTab === tab ? null : tab)
  }

  // Haal items voor actieve tab
  const getActiveItems = (): Favoriet[] => {
    switch (activeTab) {
      case "voor-jou": return voorJou
      case "voor-naaste": return voorNaaste
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
      const cat = fav.categorie || c.overig
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
          <span className="text-3xl">{c.emoji}</span> {c.title}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {c.subtitle}
        </p>
      </div>

      {/* Lege staat */}
      {geenFavorieten && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">{c.leeg.emoji}</div>
          <h2 className="text-lg font-semibold text-foreground mb-2">{c.leeg.title}</h2>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto mb-6">
            {c.leeg.beschrijvingPrefix}<span className="font-medium">{c.leeg.hulpLabel}</span>{c.leeg.beschrijvingMidden}<span className="font-medium">{c.leeg.informatieLabel}</span>{c.leeg.beschrijvingSuffix}
          </p>
          <div className="flex flex-col gap-3 max-w-xs mx-auto">
            <Link href="/hulpvragen" className="ker-btn ker-btn-primary text-center">
              {c.leeg.naarHulp}
            </Link>
            <Link href="/leren" className="ker-btn ker-btn-secondary text-center">
              {c.leeg.naarInformatie}
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
              {c.kiesCategorieHint}
            </p>
          </div>

          {/* 3 gelijke tabs */}
          <div className="grid grid-cols-3 gap-2 mb-6">
            <TabButton
              label={c.tabs.voorJou.label}
              emoji={c.tabs.voorJou.emoji}
              count={voorJou.length}
              countAfgerond={countAfgerond(voorJou)}
              isActive={activeTab === "voor-jou"}
              onClick={() => handleTabClick("voor-jou")}
              disabled={voorJou.length === 0}
            />
            <TabButton
              label={c.tabs.voorNaaste.label}
              emoji={c.tabs.voorNaaste.emoji}
              count={voorNaaste.length}
              countAfgerond={countAfgerond(voorNaaste)}
              isActive={activeTab === "voor-naaste"}
              onClick={() => handleTabClick("voor-naaste")}
              disabled={voorNaaste.length === 0}
            />
            <TabButton
              label={c.tabs.informatie.label}
              emoji={c.tabs.informatie.emoji}
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
                    {c.afgerondHint}<span className="font-medium text-[var(--accent-green)]">{c.afgerondHintLabel}</span>{c.afgerondHintSuffix}
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

// Favoriet kaart — gestyled als hulpkaart (zelfde stijl als hulpvragen pagina)
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
      "ker-card py-3 transition-shadow hover:shadow-md",
      isVoltooid && "opacity-60"
    )}>
      {/* Titel + beschrijving */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className={cn(
            "font-semibold text-sm text-foreground",
            isVoltooid && "line-through text-muted-foreground"
          )}>
            {fav.titel}
            {isVoltooid && <span className="ml-1.5 no-underline">✅</span>}
          </p>
          {fav.beschrijving && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{fav.beschrijving}</p>
          )}
        </div>
        {/* Verwijderknop */}
        <button
          onClick={() => onVerwijder(fav.id)}
          className="flex-shrink-0 p-1.5 rounded-full text-muted-foreground hover:text-[var(--accent-red)] hover:bg-[var(--accent-red-bg)] transition-colors"
          aria-label={c.verwijderen}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Telefoon en website chips */}
      {(fav.telefoon || fav.url) && (
        <div className="flex flex-wrap gap-2 mt-2">
          {fav.telefoon && (
            <a
              href={`tel:${fav.telefoon}`}
              className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full bg-primary/8 text-primary text-xs font-medium hover:bg-primary/15 transition-colors"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              {fav.telefoon}
            </a>
          )}
          {fav.url && (
            <a
              href={ensureAbsoluteUrl(fav.url)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full bg-primary/8 text-primary text-xs font-medium hover:bg-primary/15 transition-colors"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              {c.website}
            </a>
          )}
        </div>
      )}

      {/* Categorie chip + afgerond knop */}
      <div className="flex items-center gap-2 mt-2 flex-wrap">
        {fav.categorie && (
          <span className="text-xs bg-primary-light dark:bg-primary/20 text-primary dark:text-primary/80 px-2 py-0.5 rounded-full font-medium">
            {fav.categorie}
          </span>
        )}
        <button
          onClick={() => onToggleVoltooid(fav.id, fav.isVoltooid)}
          className={cn(
            "ml-auto text-xs font-medium px-2.5 py-1 rounded-full transition-colors",
            isVoltooid
              ? "bg-muted text-muted-foreground hover:bg-muted/80"
              : "bg-[var(--accent-green)]/15 text-[var(--accent-green)] hover:bg-[var(--accent-green)]/25"
          )}
        >
          {isVoltooid ? c.status.nietAfgerond : c.status.afgerond}
        </button>
      </div>
    </div>
  )
}
