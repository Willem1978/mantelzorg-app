"use client"

import Link from "next/link"
import { useState, useEffect, useRef, useCallback } from "react"
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

interface GemeenteNieuwsItem {
  id: string
  titel: string
  gemeente: string | null
}

export default function LerenPage() {
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

  // Laad gemeente data en favorieten PARALLEL
  useEffect(() => {
    if (hasFetched.current) return
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
              items: categories.map(c => ({ type: "INFORMATIE", itemId: c.id })),
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
          } catch {
            // Silently fail
          }
        }

        // Verwerk gelezen IDs uit database
        if (gelezenRes?.ok) {
          try {
            const data = await gelezenRes.json()
            if (Array.isArray(data.gelezenIds)) {
              gelezenRef.current = data.gelezenIds
            }
          } catch {
            // Silently fail
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
          } catch {
            // Silently fail
          }
        }

        // Verwerk gemeente nieuws data
        if (nieuwsRes?.ok) {
          try {
            const data = await nieuwsRes.json()
            gemeenteNieuwsRef.current = data.artikelen || []
          } catch {
            // Silently fail
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
          } catch {
            // Silently fail
          }
        }
      } catch {
        // Netwerk/onverwachte fout - silently fail
      }
    }

    loadAll()
  }, [berekenNieuwItems])

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
      } catch {
        // Silently fail
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

  return (
    <div className="ker-page-content pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-3xl">📚</span>
        <h1 className="text-2xl font-bold">Informatie, leren en tips</h1>
      </div>

      {/* Uitleg hartje */}
      <div className="bg-primary/5 rounded-xl p-3 mb-6">
        <p className="text-sm text-muted-foreground">
          Tik op een onderwerp om meer te lezen. Bewaar iets met het <span className="text-primary font-semibold">hartje</span>.
        </p>
      </div>

      {/* Gemeente Nieuws - bovenaan als er nieuws is */}
      <Link
        href="/leren/gemeente-nieuws"
        className="ker-card hover:shadow-md transition-shadow flex items-center gap-4 p-4 mb-6 relative"
      >
        <span className="text-3xl">🏘️</span>
        <div className="flex-1">
          <h2 className="font-bold text-lg">Nieuws van de gemeente</h2>
          <p className="text-sm text-muted-foreground">
            {gemeenteMantelzorger && gemeenteZorgvrager && gemeenteMantelzorger !== gemeenteZorgvrager
              ? `Updates uit ${gemeenteMantelzorger} en ${gemeenteZorgvrager}`
              : gemeenteMantelzorger
                ? `Updates uit ${gemeenteMantelzorger}`
                : "Nieuws over mantelzorg in jouw gemeente"
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
                  <p className="text-sm text-primary mt-1">{aantalArtikelen} artikelen</p>
                )}
              </Link>
            </div>
          )
        })}
      </div>
    </div>
  )
}
