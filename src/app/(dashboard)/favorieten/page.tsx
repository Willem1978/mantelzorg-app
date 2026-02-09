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

export default function FavorietenPage() {
  const [favorieten, setFavorieten] = useState<Favoriet[]>([])
  const [loading, setLoading] = useState(true)

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
    // Optimistic update
    setFavorieten(prev => prev.filter(f => f.id !== id))

    try {
      const res = await fetch(`/api/favorieten/${id}`, { method: "DELETE" })
      if (!res.ok) {
        loadFavorieten() // Revert
      }
    } catch {
      loadFavorieten() // Revert
    }
  }

  const handleToggleVoltooid = async (id: string, huidigeStatus: boolean) => {
    // Optimistic update
    setFavorieten(prev =>
      prev.map(f =>
        f.id === id
          ? { ...f, isVoltooid: !huidigeStatus, voltooitOp: !huidigeStatus ? new Date().toISOString() : null }
          : f
      )
    )

    try {
      const res = await fetch(`/api/favorieten/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isVoltooid: !huidigeStatus }),
      })
      if (!res.ok) {
        loadFavorieten() // Revert
      }
    } catch {
      loadFavorieten() // Revert
    }
  }

  if (loading) {
    return (
      <div className="ker-page-content flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  const actieveFavorieten = favorieten.filter(f => !f.isVoltooid)
  const voltooide = favorieten.filter(f => f.isVoltooid)

  // Groepeer actieve favorieten per type en categorie
  const hulpFavorieten = actieveFavorieten.filter(f => f.type === "HULP")
  const infoFavorieten = actieveFavorieten.filter(f => f.type === "INFORMATIE")

  // Groepeer hulp per categorie
  const hulpPerCategorie = hulpFavorieten.reduce<Record<string, Favoriet[]>>((acc, fav) => {
    const cat = fav.categorie || "Overig"
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(fav)
    return acc
  }, {})

  const geenFavorieten = favorieten.length === 0

  return (
    <div className="ker-page-content pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-3xl">❤️</span>
        <h1 className="text-2xl font-bold">Mijn favorieten</h1>
      </div>

      {/* Uitleg */}
      <div className="ker-card p-4 mb-6 bg-primary/5 border-primary/20">
        <p className="text-sm text-foreground">
          Hier bewaar je dingen die je wilt onthouden.
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          Heb je iets gelezen of hulp ingeschakeld? Vink het dan af met het <span className="font-semibold">vinkje</span>.
          Zo zie je wat je al hebt gedaan.
        </p>
      </div>

      {/* Lege staat */}
      {geenFavorieten && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">💜</div>
          <h2 className="text-lg font-semibold text-foreground mb-2">Je hebt nog geen favorieten</h2>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto mb-6">
            Op de <span className="font-medium">Hulp</span> pagina en de <span className="font-medium">Informatie</span> pagina
            kun je op het hartje tikken. Dan verschijnen ze hier.
          </p>
          <div className="flex flex-col gap-3 max-w-xs mx-auto">
            <Link
              href="/hulpvragen"
              className="ker-btn ker-btn-primary text-center"
            >
              Naar Hulp
            </Link>
            <Link
              href="/leren"
              className="ker-btn ker-btn-secondary text-center"
            >
              Naar Informatie
            </Link>
          </div>
        </div>
      )}

      {/* Actieve favorieten */}
      {!geenFavorieten && (
        <div className="space-y-6">
          {/* Hulp organisaties */}
          {Object.keys(hulpPerCategorie).length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                💜 Hulp organisaties
              </h2>
              <div className="space-y-4">
                {Object.entries(hulpPerCategorie).map(([categorie, items]) => (
                  <div key={categorie}>
                    <p className="text-xs font-medium text-muted-foreground mb-2">{categorie}</p>
                    <div className="space-y-2">
                      {items.map(fav => (
                        <FavorietCard
                          key={fav.id}
                          fav={fav}
                          onVerwijder={handleVerwijder}
                          onToggleVoltooid={handleToggleVoltooid}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Informatie & tips */}
          {infoFavorieten.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                📚 Informatie & tips
              </h2>
              <div className="space-y-2">
                {infoFavorieten.map(fav => (
                  <FavorietCard
                    key={fav.id}
                    fav={fav}
                    onVerwijder={handleVerwijder}
                    onToggleVoltooid={handleToggleVoltooid}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Afgeronde favorieten */}
          {voltooide.length > 0 && (
            <div className="mt-8">
              <div className="flex items-center gap-2 mb-3">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  ✅ Afgerond
                </h2>
                <span className="text-xs bg-[var(--accent-green-bg)] text-[var(--accent-green)] px-2 py-0.5 rounded-full font-medium">
                  Goed bezig!
                </span>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Deze dingen heb je al gedaan. Knap!
              </p>
              <div className="space-y-2">
                {voltooide.map(fav => (
                  <FavorietCard
                    key={fav.id}
                    fav={fav}
                    onVerwijder={handleVerwijder}
                    onToggleVoltooid={handleToggleVoltooid}
                    isVoltooid
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Individuele favoriet kaart
function FavorietCard({
  fav,
  onVerwijder,
  onToggleVoltooid,
  isVoltooid = false,
}: {
  fav: Favoriet
  onVerwijder: (id: string) => void
  onToggleVoltooid: (id: string, huidigeStatus: boolean) => void
  isVoltooid?: boolean
}) {
  return (
    <div className={cn(
      "ker-card py-3 transition-all",
      isVoltooid && "opacity-60"
    )}>
      <div className="flex items-start gap-3">
        {/* Vink/afvinken button */}
        <button
          onClick={() => onToggleVoltooid(fav.id, fav.isVoltooid)}
          className={cn(
            "w-10 h-10 min-w-[40px] rounded-full flex items-center justify-center transition-all border-2",
            fav.isVoltooid
              ? "bg-[var(--accent-green)] border-[var(--accent-green)] text-white"
              : "border-border hover:border-primary hover:bg-primary/5"
          )}
          aria-label={fav.isVoltooid ? "Markeer als niet afgerond" : "Markeer als afgerond"}
          title={fav.isVoltooid ? "Toch niet afgerond" : "Ik heb dit gedaan"}
        >
          {fav.isVoltooid ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <span className="text-lg">{fav.icon || (fav.type === "HULP" ? "💜" : "📚")}</span>
          )}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className={cn(
            "font-medium text-sm",
            isVoltooid && "line-through text-muted-foreground"
          )}>
            {fav.titel}
          </p>
          {fav.beschrijving && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
              {fav.beschrijving}
            </p>
          )}
          {/* Telefoon en website links */}
          <div className="flex gap-3 mt-1.5">
            {fav.telefoon && (
              <a
                href={`tel:${fav.telefoon}`}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                📞 {fav.telefoon}
              </a>
            )}
            {fav.url && (
              <a
                href={fav.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                🌐 Website
              </a>
            )}
          </div>
        </div>

        {/* Verwijder button */}
        <button
          onClick={() => onVerwijder(fav.id)}
          className="w-10 h-10 min-w-[40px] flex items-center justify-center rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          aria-label="Verwijder uit favorieten"
          title="Verwijder uit favorieten"
        >
          <svg className="w-5 h-5 text-primary" fill="currentColor" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
        </button>
      </div>
    </div>
  )
}
