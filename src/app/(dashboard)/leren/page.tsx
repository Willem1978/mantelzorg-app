"use client"

import Link from "next/link"
import { useState, useEffect, useRef } from "react"
import { FavorietButton } from "@/components/FavorietButton"

const categories = [
  {
    id: "praktische-tips",
    title: "Praktische tips",
    description: "Voor het dagelijks leven",
    emoji: "💡",
    href: "/leren/praktische-tips",
  },
  {
    id: "zelfzorg",
    title: "Zelfzorg tips",
    description: "Zorg ook voor jezelf",
    emoji: "🧘",
    href: "/leren/zelfzorg",
  },
  {
    id: "rechten",
    title: "Je rechten",
    description: "Waar heb je recht op?",
    emoji: "⚖️",
    href: "/leren/rechten",
  },
  {
    id: "financieel",
    title: "Financieel",
    description: "Vergoedingen & regelingen",
    emoji: "💰",
    href: "/leren/financieel",
  },
]

export default function LerenPage() {
  const [favorieten, setFavorieten] = useState<Record<string, string>>({})
  const hasFetched = useRef(false)

  useEffect(() => {
    if (hasFetched.current) return
    hasFetched.current = true

    const checkFavorieten = async () => {
      try {
        const res = await fetch("/api/favorieten/check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: categories.map(c => ({ type: "INFORMATIE", itemId: c.id })),
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
  }, [])

  return (
    <div className="ker-page-content pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-3xl">📚</span>
        <h1 className="text-2xl font-bold">Informatie, leren en tips</h1>
      </div>

      {/* Uitleg hartje */}
      <div className="ker-card p-4 mb-6 bg-primary/5 border-primary/20">
        <p className="text-sm text-muted-foreground">
          Zie je iets dat je wilt onthouden? Tik op het <span className="text-primary font-semibold">hartje</span> om het te bewaren bij je favorieten.
        </p>
      </div>

      {/* Categorieën grid */}
      <div className="grid grid-cols-2 gap-4">
        {categories.map((category) => {
          const favKey = `INFORMATIE:${category.id}`
          const isFavorited = !!favorieten[favKey]
          const favorietId = favorieten[favKey]

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
              </Link>
            </div>
          )
        })}
      </div>
    </div>
  )
}
