"use client"

import { useState, useEffect, useRef } from "react"
import { FavorietButton } from "@/components/FavorietButton"
import { Breadcrumbs } from "@/components/ui/Breadcrumbs"
import { ContentModal } from "@/components/ui/ContentModal"

interface LandelijkeHulpbron {
  naam: string
  telefoon: string | null
  website: string | null
  beschrijving: string | null
  soortHulp: string | null
  dienst: string | null
  openingstijden: string | null
  kosten: string | null
  bronLabel: string | null
  doelgroep: string | null
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

  // Groepeer hulpbronnen op basis van soortHulp of naam
  const hulplijnNamen = ['mantelzorglijn', 'luisterlijn', 'alzheimer', 'zilverlijn', 'sensoor']
  const overheidNamen = ['regelhulp', 'cak', 'svb', 'zorginstituut']

  const hulplijnen = hulpbronnen.filter(h =>
    h.soortHulp?.toLowerCase().includes('hulplijn') ||
    hulplijnNamen.some(n => h.naam.toLowerCase().includes(n))
  )
  const overheidFinancieel = hulpbronnen.filter(h =>
    h.soortHulp?.toLowerCase().includes('overheid') ||
    overheidNamen.some(n => h.naam.toLowerCase().includes(n))
  )
  const belangenorganisaties = hulpbronnen.filter(h =>
    !hulplijnen.includes(h) && !overheidFinancieel.includes(h)
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

      {hulpbronnen.length === 0 && (
        <div className="text-center py-12 text-muted-foreground ker-card">
          <p>Er zijn nog geen landelijke hulpbronnen beschikbaar.</p>
        </div>
      )}

      {/* Hulplijnen */}
      {hulplijnen.length > 0 && (
        <div className="mb-6">
          <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide flex items-center gap-2">
            📞 Hulplijnen
          </p>
          <p className="text-xs text-muted-foreground mb-3">
            Direct bellen voor een luisterend oor, advies of informatie.
          </p>
          <div className="space-y-2">
            {hulplijnen.map((hulp, i) => (
              <HulpCard key={`hulplijn-${i}`} hulp={hulp} favorieten={favorieten} categorie="Hulplijnen" />
            ))}
          </div>
        </div>
      )}

      {/* Overheid & financieel */}
      {overheidFinancieel.length > 0 && (
        <div className="mb-6">
          <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide flex items-center gap-2">
            🏛️ Overheid & financieel
          </p>
          <p className="text-xs text-muted-foreground mb-3">
            Loketten en wegwijzers voor regelingen, vergoedingen en eigen bijdrage.
          </p>
          <div className="space-y-2">
            {overheidFinancieel.map((hulp, i) => (
              <HulpCard key={`overheid-${i}`} hulp={hulp} favorieten={favorieten} categorie="Overheid & financieel" />
            ))}
          </div>
        </div>
      )}

      {/* Belangenorganisaties */}
      {belangenorganisaties.length > 0 && (
        <div className="mb-6">
          <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide flex items-center gap-2">
            🤝 Belangenorganisaties
          </p>
          <p className="text-xs text-muted-foreground mb-3">
            Verenigingen die opkomen voor mantelzorgers met informatie, tips en lotgenotencontact.
          </p>
          <div className="space-y-2">
            {belangenorganisaties.map((hulp, i) => (
              <HulpCard key={`belang-${i}`} hulp={hulp} favorieten={favorieten} categorie="Belangenorganisaties" />
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
  const [modalOpen, setModalOpen] = useState(false)
  const itemId = generateHulpItemId(hulp.naam)
  const favKey = `HULP:${itemId}`
  const isFavorited = !!(favorieten && favorieten[favKey])
  const favorietId = favorieten?.[favKey]

  const displayNaam = hulp.dienst || hulp.naam

  return (
    <>
      <div
        className="flex items-center justify-between py-3 px-3 bg-white dark:bg-card rounded-lg border border-border cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => setModalOpen(true)}
      >
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">{displayNaam}</p>
          {hulp.beschrijving && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{hulp.beschrijving}</p>
          )}
          <div className="flex items-center gap-2 mt-1">
            {hulp.telefoon && (
              <span className="text-xs text-primary font-medium flex items-center gap-1 whitespace-nowrap">
                📞 {hulp.telefoon}
              </span>
            )}
            <span className="text-xs text-primary font-medium ml-auto">Meer info →</span>
          </div>
        </div>
        <div onClick={(e) => e.stopPropagation()}>
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
      </div>

      <ContentModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        titel={hulp.naam}
        dienst={hulp.dienst}
        beschrijving={hulp.beschrijving}
        soortHulp={hulp.soortHulp}
        telefoon={hulp.telefoon}
        website={hulp.website}
        kosten={hulp.kosten}
        openingstijden={hulp.openingstijden}
        bronLabel={hulp.bronLabel}
        doelgroep={hulp.doelgroep}
      />
    </>
  )
}
