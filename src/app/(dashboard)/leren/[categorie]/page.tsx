"use client"

import { useParams } from "next/navigation"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { FavorietButton } from "@/components/FavorietButton"
import { Breadcrumbs } from "@/components/ui/Breadcrumbs"
import { ContentModal } from "@/components/ui/ContentModal"

interface ArtikelTag {
  tag: { slug: string; naam: string; type: string }
}

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
  tags?: ArtikelTag[]
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

  // Relevantie filter (vervangt tag-chips)
  const [alleenRelevant, setAlleenRelevant] = useState(false)
  const [gebruikerTags, setGebruikerTags] = useState<string[]>([])
  const [heeftVoorkeuren, setHeeftVoorkeuren] = useState(false)

  // Inklapbare secties
  const [openSecties, setOpenSecties] = useState<Set<string>>(new Set())

  const toggleSectie = (slug: string) => {
    setOpenSecties(prev => {
      const next = new Set(prev)
      if (next.has(slug)) next.delete(slug)
      else next.add(slug)
      return next
    })
  }

  // Fetch category info, tags, en gebruikersvoorkeuren
  useEffect(() => {
    if (hasFetchedContent.current) return
    hasFetchedContent.current = true

    const loadContent = async () => {
      try {
        const [catRes, voorkeurRes] = await Promise.all([
          fetch("/api/content/categorieen?type=LEREN"),
          fetch("/api/user/voorkeuren").catch(() => null),
        ])
        if (!catRes.ok) throw new Error("Fout bij laden van categorieën")

        const data = await catRes.json()
        const allCategories = data.categorieen || []

        // Gebruikersvoorkeuren laden
        if (voorkeurRes?.ok) {
          const voorkeurData = await voorkeurRes.json()
          const tagSlugs = (voorkeurData.voorkeuren || [])
            .filter((v: { type: string }) => v.type === "TAG")
            .map((v: { slug: string }) => v.slug)
          // Voeg aandoening toe als die er is
          if (voorkeurData.aandoening) tagSlugs.push(voorkeurData.aandoening)
          setGebruikerTags(tagSlugs)
          setHeeftVoorkeuren(tagSlugs.length > 0)
        }

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
    if (contentLoading || !categorieInfo[categorie]) return
    if (hasFetched.current) return
    hasFetched.current = true

    const loadData = async () => {
      setLoading(true)
      try {
        const url = `/api/artikelen?categorie=${encodeURIComponent(categorie)}&type=ARTIKEL`
        const res = await fetch(url)
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

  // Filter artikelen op basis van relevantie
  const gefilterdeItems = alleenRelevant && gebruikerTags.length > 0
    ? items.filter(artikel => {
        if (!artikel.tags || artikel.tags.length === 0) return false
        return artikel.tags.some(at => gebruikerTags.includes(at.tag.slug))
      })
    : items

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

  for (const artikel of gefilterdeItems) {
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
      <p className="text-sm text-muted-foreground mb-4">{info.beschrijving}</p>

      {/* Relevantie toggle */}
      <div className="bg-card border border-border rounded-xl p-3 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setAlleenRelevant(!alleenRelevant)}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                alleenRelevant ? "bg-primary" : "bg-muted-foreground/30"
              }`}
              role="switch"
              aria-checked={alleenRelevant}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  alleenRelevant ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
            <div>
              <span className="text-sm font-medium text-foreground">
                {alleenRelevant ? "Alleen relevant voor jou" : "Alle artikelen"}
              </span>
              <p className="text-xs text-muted-foreground">
                {alleenRelevant
                  ? `${gefilterdeItems.length} van ${items.length} artikelen`
                  : `${items.length} artikelen`}
              </p>
            </div>
          </div>
          <Link
            href="/profiel"
            className="text-xs text-primary hover:underline whitespace-nowrap"
          >
            Voorkeuren beheren →
          </Link>
        </div>
        {alleenRelevant && !heeftVoorkeuren && (
          <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-xs text-amber-700">
              Je hebt nog geen voorkeuren ingesteld. Ga naar je{" "}
              <Link href="/profiel" className="font-semibold underline">profiel</Link>{" "}
              om je situatie in te vullen, dan filteren we de artikelen voor jou.
            </p>
          </div>
        )}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}

      {/* Geen artikelen */}
      {!loading && gefilterdeItems.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {alleenRelevant
              ? "Geen artikelen gevonden voor jouw situatie. Probeer alle artikelen te tonen."
              : "Nog geen artikelen in deze categorie."}
          </p>
        </div>
      )}

      {/* Artikelen gegroepeerd per sub-hoofdstuk (inklapbaar) */}
      {!loading && heeftSubHoofdstukken && subs.map((sub) => {
        const artikelen = gegroepeerd[sub.slug]
        if (!artikelen || artikelen.length === 0) return null

        const isOpen = openSecties.has(sub.slug)

        return (
          <div key={sub.slug} className="mb-3">
            <button
              onClick={() => toggleSectie(sub.slug)}
              className="w-full flex items-center gap-3 p-3 bg-card border border-border rounded-xl hover:bg-muted/50 transition-colors text-left"
            >
              <div className="flex-1 min-w-0">
                <h2 className="font-bold text-sm text-foreground">{sub.titel}</h2>
                <p className="text-xs text-muted-foreground">{sub.beschrijving}</p>
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap bg-muted px-2 py-0.5 rounded-full">
                {artikelen.length}
              </span>
              <svg
                className={`w-5 h-5 text-muted-foreground flex-shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {isOpen && (
              <div className="space-y-3 mt-3 ml-1">
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
            )}
          </div>
        )
      })}

      {/* Ongegroepeerde artikelen (zonder sub-hoofdstuk, of als er geen subs zijn) */}
      {!loading && (!heeftSubHoofdstukken ? gefilterdeItems : ongegroepeerd).length > 0 && (
        <div className="space-y-3">
          {(!heeftSubHoofdstukken ? gefilterdeItems : ongegroepeerd).map(artikel => {
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
            {artikel.bron && (
              <span className="text-xs text-muted-foreground">{artikel.bron}</span>
            )}
            {artikel.inhoud && (
              <span className="text-xs text-primary font-medium ml-auto">Lees meer →</span>
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
        website={artikel.url}
        favoriet={{
          type: "INFORMATIE",
          itemId: artikel.id,
          categorie: categorieTitel,
          initialFavorited: isFavorited,
          initialFavorietId: favorietId,
        }}
      />
    </>
  )
}
