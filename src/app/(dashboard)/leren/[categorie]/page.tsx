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
  subHoofdstuk: string | null
  bronLabel: string | null
}

// Sub-hoofdstuk definities per categorie
const subHoofdstukken: Record<string, { slug: string; titel: string; beschrijving: string }[]> = {
  "praktische-tips": [
    { slug: "dagelijks-organiseren", titel: "Dagelijks organiseren", beschrijving: "Dagstructuur, weekplanning en taken uitbesteden" },
    { slug: "samen-organiseren", titel: "Samen organiseren met familie/netwerk", beschrijving: "Afspraken, back-up en samenwerking" },
    { slug: "veiligheid-zware-taken", titel: "Veiligheid bij zware taken", beschrijving: "Tillen, verplaatsen en medicatie" },
  ],
  "zelfzorg": [
    { slug: "overbelasting-herkennen", titel: "Overbelasting herkennen", beschrijving: "Signalen herkennen en wat je kunt doen" },
    { slug: "pauze-en-respijt", titel: "Pauze en respijt organiseren", beschrijving: "Tijdelijke overname van zorg regelen" },
    { slug: "emotionele-steun", titel: "Emotionele steun en praten", beschrijving: "Steun zoeken en stress verwerken" },
  ],
  "rechten": [
    { slug: "routekaart-wmo-zvw-wlz", titel: "Routekaart Wmo / Zvw / Wlz", beschrijving: "Wat hoort waar? Interactief overzicht" },
    { slug: "gemeente-wmo-aanvragen", titel: "Gemeente (Wmo) aanvragen", beschrijving: "Wat je kunt krijgen en hoe je het aanvraagt" },
    { slug: "clientondersteuning", titel: "Gratis clientondersteuning", beschrijving: "Onafhankelijke hulp bij het organiseren van zorg" },
  ],
  "financieel": [
    { slug: "eigen-bijdrage-kosten", titel: "Eigen bijdrage en kosten", beschrijving: "CAK, abonnementstarief en rekentools" },
    { slug: "mantelzorgwaardering", titel: "Mantelzorgwaardering", beschrijving: "Jaarlijkse waardering van je gemeente" },
    { slug: "pgb-aanvragen-beheer", titel: "Pgb: aanvragen en beheer", beschrijving: "Route, vaardigheden en SVB" },
    { slug: "vergoedingen-hulpmiddelen", titel: "Vergoedingen hulpmiddelen", beschrijving: "Eerst aanvragen, dan kopen" },
  ],
  "hulpmiddelen-producten": [
    { slug: "hulpmiddelen-overzicht", titel: "Hulpmiddelen overzicht", beschrijving: "Fysieke en digitale hulpmiddelen vinden" },
    { slug: "vergoedingsroutes", titel: "Vergoedingsroutes", beschrijving: "Welk hulpmiddel via welke wet?" },
  ],
}

const categorieInfo: Record<string, { titel: string; beschrijving: string; emoji: string }> = {
  "praktische-tips": {
    titel: "Praktische tips",
    beschrijving: "Handige tips voor het dagelijks leven als mantelzorger.",
    emoji: "💡",
  },
  "zelfzorg": {
    titel: "Zelfzorg",
    beschrijving: "Zorg ook goed voor jezelf. Dat is net zo belangrijk.",
    emoji: "🧘",
  },
  "rechten": {
    titel: "Je rechten",
    beschrijving: "Dit zijn je rechten als mantelzorger. Wmo, Zvw, Wlz en meer.",
    emoji: "⚖️",
  },
  "financieel": {
    titel: "Financieel",
    beschrijving: "Kosten, vergoedingen en regelingen waar je recht op hebt.",
    emoji: "💰",
  },
  "hulpmiddelen-producten": {
    titel: "Hulpmiddelen & producten",
    beschrijving: "Vind het juiste hulpmiddel en ontdek vergoedingsroutes.",
    emoji: "🛠️",
  },
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
  return (
    <div className="ker-card py-4 relative">
      {/* Hartje rechtsboven */}
      <div className="absolute top-3 right-3">
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
        <p className="text-xs text-muted-foreground leading-relaxed mb-3 pl-7">
          {artikel.beschrijving}
        </p>
        <div className="flex items-center gap-3 pl-7 flex-wrap">
          {artikel.url && artikel.bron && (
            <a
              href={artikel.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline font-medium flex items-center gap-1"
            >
              🌐 Lees meer op {artikel.bron}
            </a>
          )}
          {artikel.bronLabel && (
            <span className={`text-xs px-2 py-0.5 rounded-full ${bronLabelKleur(artikel.bronLabel)}`}>
              {artikel.bronLabel}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
