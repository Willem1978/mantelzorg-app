"use client"

import { useState, useEffect, useRef } from "react"
import { FavorietButton } from "@/components/FavorietButton"
import { Breadcrumbs } from "@/components/ui/Breadcrumbs"

interface LandelijkeHulpbron {
  naam: string
  telefoon: string | null
  website: string | null
  beschrijving: string | null
  soortHulp: string | null
}

// Genereer stabiel itemId voor hulporganisaties
function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function generateHulpItemId(naam: string): string {
  return `${slugify(naam)}-landelijk`
}

export default function LandelijkeHulpPage() {
  const [hulpbronnen, setHulpbronnen] = useState<LandelijkeHulpbron[]>([])
  const [loading, setLoading] = useState(true)
  const [favorieten, setFavorieten] = useState<Record<string, string>>({})
  const hasFetched = useRef(false)

  useEffect(() => {
    if (hasFetched.current) return
    hasFetched.current = true

    const loadData = async () => {
      try {
        const res = await fetch("/api/hulpbronnen/landelijk")
        if (res.ok) {
          const data = await res.json()
          const items: LandelijkeHulpbron[] = data.landelijk || []
          setHulpbronnen(items)

          // Favorieten check
          if (items.length > 0) {
            const favRes = await fetch("/api/favorieten/check", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                items: items.map(h => ({
                  type: "HULP",
                  itemId: generateHulpItemId(h.naam),
                })),
              }),
            }).catch(() => null)

            if (favRes?.ok) {
              const favData = await favRes.json()
              setFavorieten(favData.favorited || {})
            }
          }
        }
      } catch {
        // Silently fail
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  if (loading) {
    return (
      <div className="ker-page-content flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Groepeer hulpbronnen
  const hulplijnen = hulpbronnen.filter(h => h.telefoon)
  const wegwijzers = hulpbronnen.filter(h =>
    h.soortHulp?.toLowerCase().includes('informatie') ||
    h.soortHulp?.toLowerCase().includes('advies') ||
    h.soortHulp?.toLowerCase().includes('wegwijzer')
  )
  const overig = hulpbronnen.filter(h =>
    !h.telefoon &&
    !h.soortHulp?.toLowerCase().includes('informatie') &&
    !h.soortHulp?.toLowerCase().includes('advies') &&
    !h.soortHulp?.toLowerCase().includes('wegwijzer')
  )

  return (
    <div className="ker-page-content pb-24">
      {/* Breadcrumbs navigatie */}
      <Breadcrumbs items={[
        { label: "Home", href: "/dashboard" },
        { label: "Informatie", href: "/leren" },
        { label: "Landelijke hulp" },
      ]} />

      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <span className="text-3xl">🌍</span>
        <h1 className="text-2xl font-bold">Landelijke hulp & wegwijzers</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        Hulplijnen die je kunt bellen, en wegwijzers die je helpen uitzoeken waar je moet zijn.
      </p>

      {/* Uitleg */}
      <div className="bg-primary/5 rounded-xl p-3 mb-6">
        <p className="text-sm text-muted-foreground">
          Bel, chat of bezoek de website. Bewaar iets met het <span className="text-primary font-semibold">hartje</span>.
        </p>
      </div>

      {hulpbronnen.length === 0 && (
        <div className="text-center py-12 text-muted-foreground ker-card">
          <p>Er zijn nog geen landelijke hulpbronnen beschikbaar.</p>
        </div>
      )}

      {/* Landelijke hulplijnen */}
      {hulplijnen.length > 0 && (
        <div className="mb-6">
          <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide flex items-center gap-2">
            📞 Landelijke hulplijnen en adviespunten
          </p>
          <p className="text-xs text-muted-foreground mb-3">
            Bel, chat of bezoek de website. Bewaar met het hartje.
          </p>
          <div className="space-y-2">
            {hulplijnen.map((hulp, i) => (
              <HulpCard key={`hulplijn-${i}`} hulp={hulp} favorieten={favorieten} categorie="Landelijke hulplijnen" />
            ))}
          </div>
        </div>
      )}

      {/* Wegwijzers en loketten */}
      {wegwijzers.length > 0 && (
        <div className="mb-6">
          <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide flex items-center gap-2">
            🗺️ Wegwijzers & loketten
          </p>
          <p className="text-xs text-muted-foreground mb-3">
            &quot;Waar moet ik zijn?&quot; — Regelhulp, Zorginstituut, CAK, SVB.
          </p>
          <div className="space-y-2">
            {wegwijzers.map((hulp, i) => (
              <HulpCard key={`wegwijzer-${i}`} hulp={hulp} favorieten={favorieten} categorie="Wegwijzers" />
            ))}
          </div>
        </div>
      )}

      {/* Overig */}
      {overig.length > 0 && (
        <div className="mb-6">
          <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide flex items-center gap-2">
            📋 Overige landelijke bronnen
          </p>
          <div className="space-y-2">
            {overig.map((hulp, i) => (
              <HulpCard key={`overig-${i}`} hulp={hulp} favorieten={favorieten} categorie="Landelijk" />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function HulpCard({ hulp, favorieten, categorie }: {
  hulp: LandelijkeHulpbron
  favorieten: Record<string, string>
  categorie: string
}) {
  const itemId = generateHulpItemId(hulp.naam)
  const favKey = `HULP:${itemId}`
  const isFavorited = !!(favorieten && favorieten[favKey])
  const favorietId = favorieten?.[favKey]

  return (
    <div className="flex items-center justify-between py-3 px-3 bg-white dark:bg-card rounded-lg border border-border">
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">{hulp.naam}</p>
        {hulp.beschrijving && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{hulp.beschrijving}</p>
        )}
        <div className="flex gap-2 mt-1">
          {hulp.telefoon && (
            <a
              href={`tel:${hulp.telefoon}`}
              className="text-xs text-primary hover:underline font-medium flex items-center gap-1 whitespace-nowrap"
            >
              📞 {hulp.telefoon}
            </a>
          )}
          {hulp.website && (
            <a
              href={hulp.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-primary/80"
            >
              🌐
            </a>
          )}
        </div>
      </div>
      <FavorietButton
        type="HULP"
        itemId={itemId}
        titel={hulp.naam}
        beschrijving={hulp.beschrijving || undefined}
        categorie={categorie}
        url={hulp.website || undefined}
        telefoon={hulp.telefoon || undefined}
        icon="🌍"
        initialFavorited={isFavorited}
        initialFavorietId={favorietId}
        size="sm"
      />
    </div>
  )
}
