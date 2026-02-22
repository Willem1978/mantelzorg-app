"use client"

import { useParams } from "next/navigation"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { FavorietButton } from "@/components/FavorietButton"
import { Breadcrumbs } from "@/components/ui/Breadcrumbs"
import { ContentModal } from "@/components/ui/ContentModal"

interface Artikel {
  id: string
  titel: string
  beschrijving: string
  inhoud: string | null
  url: string | null
  bron: string | null
  emoji: string | null
  subHoofdstuk: string | null
  bronLabel: string | null
}


// Bronlabel kleuren
function bronLabelKleur(label: string | null): string {
  if (!label) return "bg-muted text-muted-foreground"
  switch (label) {
    case "Landelijk": return "bg-primary/10 text-primary"
    case "Gemeente (Wmo)": return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
    case "Zorgverzekeraar (Zvw)": return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
    case "Wlz": return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
    default: return "bg-muted text-muted-foreground"
  }
}

export default function CategoriePage() {
  const params = useParams()
  const categorie = params.categorie as string

  // Content state - fetched from API
  const [categorieInfo, setCategorieInfo] = useState<Record<string, { titel: string; beschrijving: string; emoji: string }>>({})
  const [subHoofdstukken, setSubHoofdstukken] = useState<Record<string, { slug: string; titel: string; beschrijving: string }[]>>({})
  const [contentLoading, setContentLoading] = useState(true)
  const [contentError, setContentError] = useState<string | null>(null)
  const hasFetchedContent = useRef(false)

  const info = categorieInfo[categorie]

  const [items, setItems] = useState<Artikel[]>([])
  const [loading, setLoading] = useState(true)
  const [favorieten, setFavorieten] = useState<Record<string, string>>({})
  const hasFetched = useRef(false)

  // Fetch category info and sub-chapters from API
  useEffect(() => {
    if (hasFetchedContent.current) return
    hasFetchedContent.current = true

    const loadContent = async () => {
      try {
        const res = await fetch("/api/content/categorieen?type=LEREN")
        if (!res.ok) throw new Error("Fout bij laden van categorieën")

        const data = await res.json()
        const allCategories = data.categorieen || []

        // Build categorieInfo map
        const infoMap: Record<string, { titel: string; beschrijving: string; emoji: string }> = {}
        const subsMap: Record<string, { slug: string; titel: string; beschrijving: string }[]> = {}

        for (const c of allCategories) {
          infoMap[c.slug] = {
            titel: c.naam,
            beschrijving: c.beschrijving,
            emoji: c.emoji,
          }

          // Build subHoofdstukken from children
          if (c.children && c.children.length > 0) {
            subsMap[c.slug] = c.children.map((child: { slug: string; naam: string; beschrijving: string }) => ({
              slug: child.slug,
              titel: child.naam,
              beschrijving: child.beschrijving,
            }))
          }
        }

        setCategorieInfo(infoMap)
        setSubHoofdstukken(subsMap)
      } catch (error) {
        console.error("Error loading category content:", error)
        setContentError("Er ging iets mis bij het laden.")
      } finally {
        setContentLoading(false)
      }
    }

    loadContent()
  }, [])

  // Fetch artikelen once content is loaded
  useEffect(() => {
    if (hasFetched.current || contentLoading || !categorieInfo[categorie]) return
    hasFetched.current = true

    const loadData = async () => {
      try {
        // Haal artikelen op uit database
        const res = await fetch(`/api/artikelen?categorie=${encodeURIComponent(categorie)}&type=ARTIKEL`)
        if (res.ok) {
          const data = await res.json()
          setItems(data.artikelen || [])

          // Check favorieten voor de opgehaalde artikelen
          if (data.artikelen?.length > 0) {
            const favRes = await fetch("/api/favorieten/check", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                items: data.artikelen.map((a: Artikel) => ({ type: "INFORMATIE", itemId: a.id })),
              }),
            }).catch(() => null)

            if (favRes?.ok) {
              const favData = await favRes.json()
              setFavorieten(favData.favorited || {})
            }
          }
        }
      } catch (error) {
        console.error("Fout bij laden artikelen:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [categorie, contentLoading, categorieInfo])

  // Loading state
  if (contentLoading) {
    return (
      <div className="ker-page-content flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Laden...</p>
        </div>
      </div>
    )
  }

  if (contentError) {
    return (
      <div className="ker-page-content flex items-center justify-center min-h-[50vh]">
        <div className="text-center max-w-md mx-auto px-4">
          <p className="text-foreground font-medium mb-2">Er ging iets mis</p>
          <p className="text-muted-foreground text-sm mb-4">{contentError}</p>
          <button
            onClick={() => window.location.reload()}
            className="ker-btn ker-btn-primary"
          >
            Opnieuw proberen
          </button>
        </div>
      </div>
    )
  }

  // Categorie niet gevonden
  if (!info) {
    return (
      <div className="ker-page-content pb-24">
        <div className="text-center py-12">
          <p className="text-lg text-muted-foreground">Categorie niet gevonden</p>
          <Link href="/leren" className="text-primary hover:underline mt-4 inline-block">
            Terug naar overzicht
          </Link>
        </div>
      </div>
    )
  }

  // Groepeer artikelen per sub-hoofdstuk
  const subs = subHoofdstukken[categorie] || []
  const gegroepeerd: Record<string, Artikel[]> = {}
  const ongegroepeerd: Artikel[] = []

  for (const artikel of items) {
    if (artikel.subHoofdstuk && subs.some(s => s.slug === artikel.subHoofdstuk)) {
      if (!gegroepeerd[artikel.subHoofdstuk]) gegroepeerd[artikel.subHoofdstuk] = []
      gegroepeerd[artikel.subHoofdstuk].push(artikel)
    } else {
      ongegroepeerd.push(artikel)
    }
  }

  const heeftSubHoofdstukken = subs.length > 0 && Object.keys(gegroepeerd).length > 0

  return (
    <div className="ker-page-content pb-24">
      {/* Breadcrumbs navigatie */}
      <Breadcrumbs items={[
        { label: "Home", href: "/dashboard" },
        { label: "Informatie", href: "/leren" },
        { label: info.titel },
      ]} />

      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <span className="text-3xl">{info.emoji}</span>
        <h1 className="text-2xl font-bold">{info.titel}</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-6">{info.beschrijving}</p>

      {/* Uitleg hartje */}
      <div className="bg-primary/5 rounded-xl p-3 mb-6">
        <p className="text-sm text-muted-foreground">
          Tik op het <span className="text-primary font-semibold">hartje</span> om een artikel te bewaren bij je favorieten.
        </p>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}

      {/* Geen artikelen */}
      {!loading && items.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Nog geen artikelen in deze categorie.</p>
        </div>
      )}

      {/* Artikelen gegroepeerd per sub-hoofdstuk */}
      {heeftSubHoofdstukken && subs.map((sub) => {
        const artikelen = gegroepeerd[sub.slug]
        if (!artikelen || artikelen.length === 0) return null

        return (
          <div key={sub.slug} className="mb-8">
            <div className="mb-3">
              <h2 className="font-bold text-base text-foreground">{sub.titel}</h2>
              <p className="text-xs text-muted-foreground">{sub.beschrijving}</p>
            </div>
            <div className="space-y-3">
              {artikelen.map(artikel => {
                const favKey = `INFORMATIE:${artikel.id}`
                const isFavorited = !!favorieten[favKey]
                const favorietId = favorieten[favKey]

                return (
                  <ArtikelCard
                    key={artikel.id}
                    artikel={artikel}
                    categorieTitel={info.titel}
                    isFavorited={isFavorited}
                    favorietId={favorietId}
                  />
                )
              })}
            </div>
          </div>
        )
      })}

      {/* Ongegroepeerde artikelen (zonder sub-hoofdstuk, of als er geen subs zijn) */}
      {(!heeftSubHoofdstukken ? items : ongegroepeerd).length > 0 && (
        <div className="space-y-3">
          {(!heeftSubHoofdstukken ? items : ongegroepeerd).map(artikel => {
            const favKey = `INFORMATIE:${artikel.id}`
            const isFavorited = !!favorieten[favKey]
            const favorietId = favorieten[favKey]

            return (
              <ArtikelCard
                key={artikel.id}
                artikel={artikel}
                categorieTitel={info.titel}
                isFavorited={isFavorited}
                favorietId={favorietId}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

function ArtikelCard({ artikel, categorieTitel, isFavorited, favorietId }: {
  artikel: Artikel
  categorieTitel: string
  isFavorited: boolean
  favorietId?: string
}) {
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <>
      <div
        className="ker-card py-4 relative cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => setModalOpen(true)}
      >
        {/* Hartje rechtsboven */}
        <div className="absolute top-3 right-3" onClick={(e) => e.stopPropagation()}>
          <FavorietButton
            type="INFORMATIE"
            itemId={artikel.id}
            titel={artikel.titel}
            beschrijving={artikel.beschrijving}
            categorie={categorieTitel}
            url={artikel.url || undefined}
            icon={artikel.emoji || undefined}
            initialFavorited={isFavorited}
            initialFavorietId={favorietId}
            size="sm"
          />
        </div>

        {/* Content */}
        <div className="pr-12">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">{artikel.emoji || "📄"}</span>
            <h2 className="font-semibold text-sm">{artikel.titel}</h2>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed mb-2 pl-7 line-clamp-2">
            {artikel.beschrijving}
          </p>
          <div className="flex items-center gap-3 pl-7 flex-wrap">
            {artikel.bronLabel && (
              <span className={`text-xs px-2 py-0.5 rounded-full ${bronLabelKleur(artikel.bronLabel)}`}>
                {artikel.bronLabel}
              </span>
            )}
            {artikel.inhoud && (
              <span className="text-xs text-primary font-medium">Lees meer →</span>
            )}
          </div>
        </div>
      </div>

      <ContentModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        titel={artikel.titel}
        emoji={artikel.emoji}
        beschrijving={artikel.beschrijving}
        inhoud={artikel.inhoud}
        bron={artikel.bron}
        bronLabel={artikel.bronLabel}
        url={artikel.url}
      />
    </>
  )
}
