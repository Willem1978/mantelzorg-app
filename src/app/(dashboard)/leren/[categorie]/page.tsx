"use client"

import { useParams } from "next/navigation"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { FavorietButton } from "@/components/FavorietButton"
import { Breadcrumbs } from "@/components/ui/Breadcrumbs"

interface Artikel {
  id: string
  titel: string
  beschrijving: string
  url: string | null
  bron: string | null
  emoji: string | null
}

const categorieInfo: Record<string, { titel: string; beschrijving: string; emoji: string }> = {
  "praktische-tips": {
    titel: "Praktische tips",
    beschrijving: "Handige tips voor het dagelijks leven als mantelzorger.",
    emoji: "💡",
  },
  "zelfzorg": {
    titel: "Zelfzorg tips",
    beschrijving: "Zorg ook goed voor jezelf. Dat is net zo belangrijk.",
    emoji: "🧘",
  },
  "rechten": {
    titel: "Je rechten",
    beschrijving: "Dit zijn je rechten als mantelzorger. Goed om te weten.",
    emoji: "⚖️",
  },
  "financieel": {
    titel: "Financieel",
    beschrijving: "Vergoedingen en regelingen waar je recht op hebt.",
    emoji: "💰",
  },
}

export default function CategoriePage() {
  const params = useParams()
  const categorie = params.categorie as string

  const info = categorieInfo[categorie]

  const [items, setItems] = useState<Artikel[]>([])
  const [loading, setLoading] = useState(true)
  const [favorieten, setFavorieten] = useState<Record<string, string>>({})
  const hasFetched = useRef(false)

  useEffect(() => {
    if (hasFetched.current || !info) return
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
      } catch {
        // Silently fail
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [categorie, info])

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

      {/* Artikelen lijst */}
      <div className="space-y-3">
        {items.map(artikel => {
          const favKey = `INFORMATIE:${artikel.id}`
          const isFavorited = !!favorieten[favKey]
          const favorietId = favorieten[favKey]

          return (
            <div key={artikel.id} className="ker-card py-4 relative">
              {/* Hartje rechtsboven */}
              <div className="absolute top-3 right-3">
                <FavorietButton
                  type="INFORMATIE"
                  itemId={artikel.id}
                  titel={artikel.titel}
                  beschrijving={artikel.beschrijving}
                  categorie={info.titel}
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
                <p className="text-xs text-muted-foreground leading-relaxed mb-3 pl-7">
                  {artikel.beschrijving}
                </p>
                {artikel.url && artikel.bron && (
                  <div className="flex items-center gap-3 pl-7">
                    <a
                      href={artikel.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline font-medium flex items-center gap-1"
                    >
                      🌐 Lees meer op {artikel.bron}
                    </a>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
