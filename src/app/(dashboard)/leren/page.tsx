"use client"

import Link from "next/link"
import { useState, useEffect, useRef, useCallback } from "react"
import { FavorietButton } from "@/components/FavorietButton"
import { PageIntro } from "@/components/ui/PageIntro"
import { lerenContent } from "@/config/content"

const c = lerenContent

interface GemeenteNieuwsItem {
  id: string
  titel: string
  gemeente: string | null
}

interface LerenCategorie {
  id: string
  title: string
  description: string
  emoji: string
  href: string
}

export default function LerenPage() {
  // Content state - fetched from API
  const [categories, setCategories] = useState<LerenCategorie[]>([])
  const [contentLoading, setContentLoading] = useState(true)
  const [contentError, setContentError] = useState<string | null>(null)
  const hasFetchedContent = useRef(false)

  const [favorieten, setFavorieten] = useState<Record<string, string>>({})
  const [gemeenteMantelzorger, setGemeenteMantelzorger] = useState<string | null>(null)
  const [gemeenteZorgvrager, setGemeenteZorgvrager] = useState<string | null>(null)
  const [aantalNieuwItems, setAantalNieuwItems] = useState(0)
  const [aantalPerCategorie, setAantalPerCategorie] = useState<Record<string, number>>({})
  const hasFetched = useRef(false)
  const gemeenteRef = useRef<{ mantelzorger: string | null; zorgvrager: string | null }>({ mantelzorger: null, zorgvrager: null })
  const gemeenteNieuwsRef = useRef<GemeenteNieuwsItem[]>([])

  const gelezenRef = useRef<string[]>([])

  const berekenNieuwItems = useCallback((gMantelzorger: string | null, gZorgvrager: string | null) => {
    const relevant = gemeenteNieuwsRef.current.filter(n => {
      const gemeente = (n.gemeente || "").toLowerCase()
      return (
        (gMantelzorger && gemeente === gMantelzorger.toLowerCase()) ||
        (gZorgvrager && gemeente === gZorgvrager.toLowerCase())
      )
    })

    if (relevant.length === 0) {
      setAantalNieuwItems(0)
      return
    }

    const gelezen = gelezenRef.current
    const nieuw = relevant.filter(n => !gelezen.includes(n.id))
    setAantalNieuwItems(nieuw.length)
  }, [])

  // Fetch categories from API on mount
  useEffect(() => {
    if (hasFetchedContent.current) return
    hasFetchedContent.current = true

    const loadCategories = async () => {
      try {
        const res = await fetch("/api/content/categorieen?type=LEREN")
        if (!res.ok) throw new Error(c.foutLadenCategorieen)

        const data = await res.json()
        const mapped: LerenCategorie[] = (data.categorieen || []).map((cat: { slug: string; naam: string; beschrijving: string; emoji: string }) => ({
          id: cat.slug,
          title: cat.naam,
          description: cat.beschrijving,
          emoji: cat.emoji,
          href: `/leren/${cat.slug}`,
        }))
        setCategories(mapped)
      } catch (error) {
        console.error("Error loading categories:", error)
        setContentError(c.foutLadenCategorieenBeschrijving)
      } finally {
        setContentLoading(false)
      }
    }

    loadCategories()
  }, [])

  // Laad gemeente data en favorieten PARALLEL (wacht tot categories geladen zijn)
  useEffect(() => {
    if (hasFetched.current || contentLoading || categories.length === 0) return
    hasFetched.current = true

    const loadAll = async () => {
      try {
        // Alle API calls tegelijk starten
        const [favRes, gemeenteRes, gelezenRes, artikelenRes, nieuwsRes] = await Promise.all([
          // Favorieten check
          fetch("/api/favorieten/check", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              items: categories.map(cat => ({ type: "INFORMATIE", itemId: cat.id })),
            }),
          }).catch(() => null),
          // Lichtgewicht gemeente endpoint (ipv zwaar /api/dashboard)
          fetch("/api/user/gemeente").catch(() => null),
          // Gelezen nieuws IDs uit database
          fetch("/api/user/gelezen-nieuws").catch(() => null),
          // Artikelen per categorie ophalen
          fetch("/api/artikelen?type=ARTIKEL").catch(() => null),
          // Gemeente nieuws ophalen
          fetch("/api/artikelen?type=GEMEENTE_NIEUWS").catch(() => null),
        ])

        // Verwerk favorieten
        if (favRes?.ok) {
          try {
            const data = await favRes.json()
            setFavorieten(data.favorited || {})
          } catch (error) {
            console.error("Fout bij verwerken data:", error)
          }
        }

        // Verwerk gelezen IDs uit database
        if (gelezenRes?.ok) {
          try {
            const data = await gelezenRes.json()
            if (Array.isArray(data.gelezenIds)) {
              gelezenRef.current = data.gelezenIds
            }
          } catch (error) {
            console.error("Fout bij verwerken data:", error)
          }
        }

        // Verwerk artikelen data (tel per categorie)
        if (artikelenRes?.ok) {
          try {
            const data = await artikelenRes.json()
            const counts: Record<string, number> = {}
            for (const a of data.artikelen || []) {
              counts[a.categorie] = (counts[a.categorie] || 0) + 1
            }
            setAantalPerCategorie(counts)
          } catch (error) {
            console.error("Fout bij verwerken data:", error)
          }
        }

        // Verwerk gemeente nieuws data
        if (nieuwsRes?.ok) {
          try {
            const data = await nieuwsRes.json()
            gemeenteNieuwsRef.current = data.artikelen || []
          } catch (error) {
            console.error("Fout bij verwerken data:", error)
          }
        }

        // Verwerk gemeente data
        if (gemeenteRes?.ok) {
          try {
            const data = await gemeenteRes.json()
            const gMantelzorger = data.mantelzorger || null
            const gZorgvrager = data.zorgvrager || null
            setGemeenteMantelzorger(gMantelzorger)
            setGemeenteZorgvrager(gZorgvrager)
            gemeenteRef.current = { mantelzorger: gMantelzorger, zorgvrager: gZorgvrager }

            // Bereken nieuw items
            berekenNieuwItems(gMantelzorger, gZorgvrager)
          } catch (error) {
            console.error("Fout bij verwerken data:", error)
          }
        }
      } catch (error) {
        console.error("Fout bij laden leren data:", error)
      }
    }

    loadAll()
  }, [berekenNieuwItems, contentLoading, categories])

  // Luister naar gezien-event van gemeente-nieuws pagina
  useEffect(() => {
    const handleGezien = async () => {
      try {
        const res = await fetch("/api/user/gelezen-nieuws").catch(() => null)
        if (res?.ok) {
          const data = await res.json()
          if (Array.isArray(data.gelezenIds)) {
            gelezenRef.current = data.gelezenIds
          }
        }
      } catch (error) {
        console.error("Fout bij vernieuwen gelezen status:", error)
      }
      berekenNieuwItems(gemeenteRef.current.mantelzorger, gemeenteRef.current.zorgvrager)
    }
    window.addEventListener("gemeente-nieuws-gelezen", handleGezien)
    return () => window.removeEventListener("gemeente-nieuws-gelezen", handleGezien)
  }, [berekenNieuwItems])

  // Tel artikelen per categorie
  const getAantalArtikelen = (catId: string) => {
    return aantalPerCategorie[catId] || 0
  }

  if (contentLoading) {
    return (
      <div className="ker-page-content flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">{c.laden}</p>
        </div>
      </div>
    )
  }

  if (contentError) {
    return (
      <div className="ker-page-content flex items-center justify-center min-h-[50vh]">
        <div className="text-center max-w-md mx-auto px-4">
          <p className="text-foreground font-medium mb-2">{c.fout}</p>
          <p className="text-muted-foreground text-sm mb-4">{contentError}</p>
          <button
            onClick={() => window.location.reload()}
            className="ker-btn ker-btn-primary"
          >
            {c.opnieuw}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="ker-page-content pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-3xl">{c.emoji}</span>
        <h1 className="text-2xl font-bold">{c.title}</h1>
      </div>

      {/* C2.1: Introductietekst */}
      <PageIntro tekst={c.subtitle} />

      {/* Gemeente Nieuws - bovenaan als er nieuws is */}
      <Link
        href="/leren/gemeente-nieuws"
        className="ker-card hover:shadow-md transition-shadow flex items-center gap-4 p-4 mb-4 relative"
      >
        <span className="text-3xl">{c.gemeenteNieuws.emoji}</span>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-0.5">
            <h2 className="font-bold text-lg">{c.gemeenteNieuws.title}</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            {gemeenteMantelzorger && gemeenteZorgvrager && gemeenteMantelzorger !== gemeenteZorgvrager
              ? c.gemeenteNieuws.subtitleTwoFn(gemeenteMantelzorger, gemeenteZorgvrager)
              : gemeenteMantelzorger
                ? c.gemeenteNieuws.subtitleFn(gemeenteMantelzorger)
                : c.gemeenteNieuws.beschrijving
            }
          </p>
        </div>
        {/* Nieuw bolletje */}
        {aantalNieuwItems > 0 && (
          <span className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-[var(--accent-red)] text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
            {aantalNieuwItems}
          </span>
        )}
        {/* Pijl rechts */}
        <svg className="w-5 h-5 text-muted-foreground flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </Link>

      {/* Landelijke hulp & wegwijzers */}
      <Link
        href="/leren/landelijke-hulp"
        className="ker-card hover:shadow-md transition-shadow flex items-center gap-4 p-4 mb-6 relative"
      >
        <span className="text-3xl">{c.landelijk.emoji}</span>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-0.5">
            <h2 className="font-bold text-lg">{c.landelijk.title}</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            {c.landelijk.beschrijving}
          </p>
        </div>
        {/* Pijl rechts */}
        <svg className="w-5 h-5 text-muted-foreground flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </Link>

      {/* Categorieën grid */}
      <div className="grid grid-cols-2 gap-4">
        {categories.map((category) => {
          const favKey = `INFORMATIE:${category.id}`
          const isFavorited = !!favorieten[favKey]
          const favorietId = favorieten[favKey]
          const aantalArtikelen = getAantalArtikelen(category.id)

          return (
            <div key={category.id} className="ker-card hover:shadow-md transition-shadow flex flex-col items-start p-5 relative">
              <div className="absolute top-2 right-2">
                <FavorietButton
                  type="INFORMATIE"
                  itemId={category.id}
                  titel={category.title}
                  beschrijving={category.description}
                  categorie="Informatie"
                  icon={category.emoji}
                  initialFavorited={isFavorited}
                  initialFavorietId={favorietId}
                  size="sm"
                />
              </div>
              <Link href={category.href} className="flex flex-col items-start w-full">
                <span className="text-3xl mb-3">{category.emoji}</span>
                <h2 className="font-bold text-lg">{category.title}</h2>
                <p className="text-sm text-muted-foreground">{category.description}</p>
                {aantalArtikelen > 0 && (
                  <p className="text-sm text-primary mt-1">{c.artikelenCountFn(aantalArtikelen)}</p>
                )}
              </Link>
            </div>
          )
        })}
      </div>
    </div>
  )
}
