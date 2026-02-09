"use client"

import { useParams } from "next/navigation"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { artikelen, categorieInfo } from "@/data/artikelen"
import { FavorietButton } from "@/components/FavorietButton"

export default function CategoriePage() {
  const params = useParams()
  const categorie = params.categorie as string

  const info = categorieInfo[categorie]
  const items = artikelen[categorie]

  const [favorieten, setFavorieten] = useState<Record<string, string>>({})
  const hasFetched = useRef(false)

  useEffect(() => {
    if (hasFetched.current || !items) return
    hasFetched.current = true

    const checkFavorieten = async () => {
      try {
        const res = await fetch("/api/favorieten/check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: items.map(a => ({ type: "INFORMATIE", itemId: a.id })),
          }),
        })
        if (res.ok) {
          const data = await res.json()
          setFavorieten(data.favorited || {})
        }
      } catch {
        // Silently fail
      }
    }

    checkFavorieten()
  }, [items])

  // Categorie niet gevonden
  if (!info || !items) {
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
      {/* Terug knop */}
      <Link
        href="/leren"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Terug
      </Link>

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
                  url={artikel.url}
                  icon={artikel.emoji}
                  initialFavorited={isFavorited}
                  initialFavorietId={favorietId}
                  size="sm"
                />
              </div>

              {/* Content */}
              <div className="pr-12">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">{artikel.emoji}</span>
                  <h2 className="font-semibold text-sm">{artikel.titel}</h2>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed mb-3 pl-7">
                  {artikel.beschrijving}
                </p>
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
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
