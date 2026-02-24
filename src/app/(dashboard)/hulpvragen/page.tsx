"use client"

import { useState, useEffect, useRef, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { FavorietButton } from "@/components/FavorietButton"
import { ContentModal } from "@/components/ui/ContentModal"

// Genereer stabiel itemId voor hulporganisaties
function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function generateHulpItemId(naam: string, gemeente: string | null | undefined): string {
  return `${slugify(naam)}-${slugify(gemeente || 'landelijk')}`
}

interface Hulpbron {
  naam: string
  telefoon: string | null
  website: string | null
  beschrijving: string | null
  soortHulp?: string | null
  gemeente?: string | null
  isLandelijk?: boolean
  doelgroep?: string | null
  kosten?: string | null
  dienst?: string | null
  openingstijden?: string | null
  bronLabel?: string | null
}

interface LandelijkeHulpbron {
  naam: string
  telefoon: string | null
  website: string | null
  beschrijving: string | null
  soortHulp: string | null
  dienst?: string | null
  openingstijden?: string | null
  kosten?: string | null
  bronLabel?: string | null
}

interface LocatieInfo {
  straat: string | null
  gemeente: string | null
  woonplaats: string | null
}

interface ZwareTaak {
  naam: string
  moeilijkheid: string
  categorie?: string
}

interface HulpData {
  perCategorie: Record<string, Hulpbron[]>
  landelijk: LandelijkeHulpbron[]
  zwareTaken: ZwareTaak[]
  mantelzorgerGemeente: string | null
  zorgvragerGemeente: string | null
  testNiveau: "LAAG" | "GEMIDDELD" | "HOOG" | null
  locatie: {
    mantelzorger: LocatieInfo
    zorgvrager: LocatieInfo
  }
}

interface HelpRequest {
  id: string
  title: string
  description: string
  category: string
  urgency: string
  status: string
  createdAt: string
  response?: string
}

interface Categorie {
  naam: string
  icon: string
  kort: string
  routeLabel?: string | null
}

interface CategorieGroep {
  groep: string
  categorieen: Categorie[]
}

interface HulpvraagCategorie {
  value: string
  label: string
  icon: string
  hint: string
}

type TabType = 'voor-jou' | 'voor-naaste'

// Wrapper component voor Suspense boundary (nodig voor useSearchParams)
export default function HulpPage() {
  return (
    <Suspense fallback={
      <div className="ker-page-content flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    }>
      <HulpPageContent />
    </Suspense>
  )
}

function HulpPageContent() {
  const searchParams = useSearchParams()
  const [hulpData, setHulpData] = useState<HulpData | null>(null)
  const [helpRequests, setHelpRequests] = useState<HelpRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType | null>(null)
  const [selectedCategorie, setSelectedCategorie] = useState<string | null>(null)
  const [bereikFilter, setBereikFilter] = useState<'alle' | 'lokaal'>('lokaal')
  const [showHulpvraagForm, setShowHulpvraagForm] = useState(false)
  const [showVragenTab, setShowVragenTab] = useState(false)
  const [initializedFromUrl, setInitializedFromUrl] = useState(false)

  // Content state - fetched from API
  const [CATEGORIEEN_ZORGVRAGER_GROEPEN, setCategorieenZorgvragerGroepen] = useState<CategorieGroep[]>([])
  const [CATEGORIEEN_MANTELZORGER, setCategorieenMantelzorger] = useState<Categorie[]>([])
  const [TAAK_NAAR_CATEGORIE, setTaakNaarCategorie] = useState<Record<string, string>>({})
  const [hulpvraagCategories, setHulpvraagCategories] = useState<HulpvraagCategorie[]>([])
  const [contentLoading, setContentLoading] = useState(true)
  const [contentError, setContentError] = useState<string | null>(null)
  const hasFetchedContent = useRef(false)

  // Derived: flat list for backwards compatibility
  const CATEGORIEEN_ZORGVRAGER = CATEGORIEEN_ZORGVRAGER_GROEPEN.flatMap((g) => g.categorieen)

  // Favorieten state
  const [favorieten, setFavorieten] = useState<Record<string, string>>({})
  const hasFetchedFav = useRef(false)

  // Hulpvraag form state
  const [formTitle, setFormTitle] = useState("")
  const [formDescription, setFormDescription] = useState("")
  const [formCategory, setFormCategory] = useState("")
  const [formUrgency, setFormUrgency] = useState("NORMAL")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch content from API on mount
  useEffect(() => {
    if (hasFetchedContent.current) return
    hasFetchedContent.current = true

    const loadContent = async () => {
      try {
        const [zorgvragerRes, mantelzorgerRes, hulpvraagRes, mappingsRes] = await Promise.all([
          fetch("/api/content/categorieen?type=HULP_ZORGVRAGER"),
          fetch("/api/content/categorieen?type=HULP_MANTELZORGER"),
          fetch("/api/content/categorieen?type=HULPVRAAG"),
          fetch("/api/content/taak-mappings"),
        ])

        if (!zorgvragerRes.ok || !mantelzorgerRes.ok || !hulpvraagRes.ok || !mappingsRes.ok) {
          throw new Error("Fout bij laden van content")
        }

        const zorgvragerData = await zorgvragerRes.json()
        const mantelzorgerData = await mantelzorgerRes.json()
        const hulpvraagData = await hulpvraagRes.json()
        const mappingsData = await mappingsRes.json()

        // Reconstruct CATEGORIEEN_ZORGVRAGER_GROEPEN by grouping on metadata.groep
        const groepMap: Record<string, Categorie[]> = {}
        for (const c of (zorgvragerData.categorieen || [])) {
          const groep = c.metadata?.groep || 'Overig'
          if (!groepMap[groep]) groepMap[groep] = []
          groepMap[groep].push({
            naam: c.naam,
            icon: c.icon,
            kort: c.hint,
            routeLabel: c.metadata?.routeLabel || null,
          })
        }
        const mappedGroepen: CategorieGroep[] = Object.entries(groepMap).map(([groep, categorieen]) => ({
          groep,
          categorieen,
        }))
        setCategorieenZorgvragerGroepen(mappedGroepen)

        // Map mantelzorger categories
        const mappedMantelzorger: Categorie[] = (mantelzorgerData.categorieen || []).map((c: { naam: string; icon: string; hint: string }) => ({
          naam: c.naam,
          icon: c.icon,
          kort: c.hint,
        }))
        setCategorieenMantelzorger(mappedMantelzorger)

        // Map hulpvraag categories
        const mappedHulpvraag: HulpvraagCategorie[] = (hulpvraagData.categorieen || []).map((c: { slug: string; naam: string; icon: string; hint: string }) => ({
          value: c.slug.toUpperCase().replace(/-/g, '_'),
          label: c.naam,
          icon: c.icon,
          hint: c.hint,
        }))
        setHulpvraagCategories(mappedHulpvraag)

        // Reconstruct TAAK_NAAR_CATEGORIE from mappings
        const mappedTaakCategorie: Record<string, string> = {}
        for (const m of (mappingsData.mappings || [])) {
          mappedTaakCategorie[m.taak || m.key] = m.categorie || m.value
        }
        setTaakNaarCategorie(mappedTaakCategorie)
      } catch (error) {
        console.error("Error loading content:", error)
        setContentError("Er ging iets mis bij het laden van categorieën.")
      } finally {
        setContentLoading(false)
      }
    }

    loadContent()
  }, [])

  // URL parameters verwerken (van rapport pagina)
  useEffect(() => {
    if (initializedFromUrl) return

    const tabParam = searchParams.get('tab') as TabType | null
    const categorieParam = searchParams.get('categorie')

    if (tabParam && ['voor-jou', 'voor-naaste'].includes(tabParam)) {
      setActiveTab(tabParam)
      if (categorieParam) {
        setSelectedCategorie(decodeURIComponent(categorieParam))
      }
      setInitializedFromUrl(true)
    }
  }, [searchParams, initializedFromUrl])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [dashboardRes, requestsRes] = await Promise.all([
        fetch("/api/dashboard"),
        fetch("/api/help-requests")
      ])

      if (dashboardRes.ok) {
        const dashboardData = await dashboardRes.json()

        // Voeg categorie toe aan ALLE zorgtaken (niet alleen zware)
        // Database kan twee formats hebben:
        // 1. Web test: MOEILIJK/ZEER_MOEILIJK/GEMIDDELD/MAKKELIJK
        // 2. WhatsApp test: JA/SOMS/NEE
        const alleTaken = (dashboardData.test?.zorgtaken || [])
          .map((t: { naam: string; moeilijkheid: string; categorie?: string }) => ({
            ...t,
            categorie: TAAK_NAAR_CATEGORIE[t.naam] || null
          }))

        setHulpData({
          perCategorie: dashboardData.hulpbronnen?.perCategorie || {},
          landelijk: dashboardData.hulpbronnen?.landelijk || [],
          zwareTaken: alleTaken, // Nu alle taken, naam blijft voor backwards compatibility
          mantelzorgerGemeente: dashboardData.hulpbronnen?.mantelzorgerGemeente || null,
          zorgvragerGemeente: dashboardData.hulpbronnen?.zorgvragerGemeente || null,
          testNiveau: dashboardData.test?.niveau || null,
          locatie: dashboardData.locatie || {
            mantelzorger: { straat: null, gemeente: null, woonplaats: null },
            zorgvrager: { straat: null, gemeente: null, woonplaats: null },
          },
        })
      }

      if (requestsRes.ok) {
        const requestsData = await requestsRes.json()
        setHelpRequests(requestsData.helpRequests || [])
      }
    } catch (error) {
      console.error("Failed to load data:", error)
    } finally {
      setLoading(false)
    }
  }

  // Favorieten check laden
  useEffect(() => {
    if (hasFetchedFav.current || loading || !hulpData) return
    hasFetchedFav.current = true

    const checkFavorieten = async () => {
      try {
        // Verzamel alle mogelijke itemIds van hulpbronnen op de pagina
        const items: { type: string; itemId: string }[] = []

        // Lokale hulpbronnen per categorie
        if (hulpData.perCategorie) {
          Object.entries(hulpData.perCategorie).forEach(([, bronnen]) => {
            bronnen.forEach(hulp => {
              items.push({
                type: "HULP",
                itemId: generateHulpItemId(hulp.naam, hulp.gemeente),
              })
            })
          })
        }

        // Landelijke hulpbronnen
        if (hulpData.landelijk) {
          hulpData.landelijk.forEach(hulp => {
            items.push({
              type: "HULP",
              itemId: generateHulpItemId(hulp.naam, null),
            })
          })
        }

        if (items.length === 0) return

        const res = await fetch("/api/favorieten/check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items }),
        })
        if (res.ok) {
          const data = await res.json()
          setFavorieten(data.favorited || {})
        }
      } catch (error) {
        console.error("Fout bij laden favorieten:", error)
      }
    }

    checkFavorieten()
  }, [loading, hulpData])

  const handleSubmitHulpvraag = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const res = await fetch("/api/help-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formTitle,
          description: formDescription,
          category: formCategory,
          urgency: formUrgency
        }),
      })

      if (res.ok) {
        setFormTitle("")
        setFormDescription("")
        setFormCategory("")
        setFormUrgency("NORMAL")
        setShowHulpvraagForm(false)
        loadData()
      }
    } catch (error) {
      console.error("Failed to create help request:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSelectCategorie = (categorie: string) => {
    if (selectedCategorie === categorie) {
      setSelectedCategorie(null)
    } else {
      setSelectedCategorie(categorie)
      setBereikFilter('lokaal')
    }
  }

  const handleBackToCategories = () => {
    setSelectedCategorie(null)
    setBereikFilter('alle')
  }

  const handleTabClick = (tab: TabType) => {
    if (activeTab === tab) {
      setActiveTab(null)
      setSelectedCategorie(null)
      setBereikFilter('lokaal')
    } else {
      setActiveTab(tab)
      setSelectedCategorie(null)
      setBereikFilter('lokaal')
    }
  }

  if (loading || contentLoading) {
    return (
      <div className="ker-page-content flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (contentError) {
    return (
      <div className="ker-page-content flex items-center justify-center min-h-[50vh]">
        <div className="text-center max-w-md mx-auto px-4">
          <p className="text-foreground font-medium mb-2">Er ging iets mis bij het laden</p>
          <p className="text-muted-foreground text-sm mb-4">Probeer het opnieuw. Werkt het nog steeds niet? Neem dan contact met ons op.</p>
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

  // Bepaal welke categorieën zware taken hebben en hun niveau
  // Ondersteunt zowel web format (MOEILIJK/GEMIDDELD) als WhatsApp format (JA/SOMS)
  const getTaakStatus = (categorieNaam: string): 'zwaar' | 'gemiddeld' | 'licht' | null => {
    const alleTaken = hulpData?.zwareTaken || []
    const takenVoorCategorie = alleTaken.filter(t => {
      // Direct categorie match
      if (t.categorie === categorieNaam) return true
      // Naam-naar-categorie mapping check
      const mappedCategorie = TAAK_NAAR_CATEGORIE[t.naam]
      return mappedCategorie === categorieNaam
    })

    const upper = (m: string | null) => m?.toUpperCase() || ''
    const isZwaar = (m: string | null) =>
      upper(m) === 'MOEILIJK' || upper(m) === 'ZEER_MOEILIJK' || upper(m) === 'JA'
    const isMatig = (m: string | null) =>
      upper(m) === 'GEMIDDELD' || upper(m) === 'SOMS'
    const isLicht = (m: string | null) =>
      upper(m) === 'MAKKELIJK' || upper(m) === 'NEE' || !m

    if (takenVoorCategorie.some(t => isZwaar(t.moeilijkheid))) {
      return 'zwaar'
    }
    if (takenVoorCategorie.some(t => isMatig(t.moeilijkheid))) {
      return 'gemiddeld'
    }
    if (takenVoorCategorie.some(t => isLicht(t.moeilijkheid))) {
      return 'licht'
    }
    return null
  }

  // Helper functie voor locatie string: "Gemeente (Woonplaats)" of alleen "Gemeente"
  const formatLocatie = (loc: LocatieInfo | undefined) => {
    if (!loc) return null
    if (loc.gemeente && loc.woonplaats && loc.gemeente !== loc.woonplaats) {
      return `${loc.gemeente} (${loc.woonplaats})`
    }
    return loc.woonplaats || loc.gemeente || null
  }

  // Helper functie om relevante landelijke hulpbronnen te vinden voor een categorie (mantelzorger)
  const getLandelijkeHulpVoorCategorie = (categorieNaam: string): LandelijkeHulpbron[] => {
    if (!hulpData?.landelijk) return []

    const mapping: Record<string, string[]> = {
      'Ondersteuning': ['ondersteuning', 'mantelzorg'],
      'Vervangende mantelzorg': ['respijt'],
      'Praten & steun': ['emotioneel', 'steun'],
      'Lotgenoten': ['lotgenoot', 'lotgenoten'],
      'Leren & training': ['educatie', 'training', 'cursus', 'leren'],
    }

    const keywords = mapping[categorieNaam] || []
    if (keywords.length === 0) return []

    return hulpData.landelijk.filter(h =>
      keywords.some(kw => h.soortHulp?.toLowerCase().includes(kw))
    )
  }

  // Bereken het totaal aantal relevante landelijke hulpbronnen (die al in andere categorieën getoond worden)
  const getRelevanteLandelijkeCount = (): number => {
    if (!hulpData?.landelijk) return 0

    const relevanteKeywords = ['ondersteuning', 'mantelzorg', 'respijt', 'emotioneel', 'steun', 'lotgenoot', 'lotgenoten', 'educatie', 'training', 'cursus', 'leren']
    return hulpData.landelijk.filter(h =>
      relevanteKeywords.some(kw => h.soortHulp?.toLowerCase().includes(kw))
    ).length
  }

  const locatieMantelzorger = formatLocatie(hulpData?.locatie?.mantelzorger)
  const locatieZorgvrager = formatLocatie(hulpData?.locatie?.zorgvrager)

  // Als "Mijn vragen" actief is
  if (showVragenTab) {
    return (
      <div className="ker-page-content">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => setShowVragenTab(false)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Terug
          </button>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <span className="text-3xl">📝</span> Mijn vragen
          </h1>
          <p className="text-muted-foreground mt-2">
            Hier zie je de vragen die je hebt gesteld. Wij zoeken hulp voor je en
            laten je weten als er een antwoord is.
          </p>
        </div>

        <div className="space-y-4">
          {/* Nieuwe vraag button */}
          {!showHulpvraagForm && (
            <button
              onClick={() => setShowHulpvraagForm(true)}
              className="w-full py-4 border-2 border-dashed border-primary/30 rounded-xl text-primary font-medium hover:border-primary hover:bg-primary/5 transition-all"
            >
              + Nieuwe vraag stellen
            </button>
          )}

          {/* Hulpvraag formulier */}
          {showHulpvraagForm && (
            <div className="ker-card">
              <h3 className="font-semibold text-foreground mb-2">Nieuwe hulpvraag</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Vertel ons waar je hulp bij nodig hebt. Wij zoeken dan iemand die je kan helpen.
              </p>
              <form onSubmit={handleSubmitHulpvraag} className="space-y-4">
                {/* Categorie */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Waar gaat het over?
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {hulpvraagCategories.map((cat) => (
                      <button
                        key={cat.value}
                        type="button"
                        onClick={() => setFormCategory(cat.value)}
                        className={cn(
                          "p-3 rounded-xl border-2 transition-all text-left",
                          formCategory === cat.value
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        <span className="text-xl">{cat.icon}</span>
                        <p className="font-medium text-sm mt-1">{cat.label}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Titel */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Korte vraag
                  </label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="Bijv: Ik zoek hulp bij boodschappen"
                    className="ker-input"
                    required
                  />
                </div>

                {/* Beschrijving */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Meer uitleg
                  </label>
                  <textarea
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Vertel meer over wat je nodig hebt..."
                    rows={3}
                    className="ker-input"
                    required
                  />
                </div>

                {/* Buttons */}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowHulpvraagForm(false)}
                    className="ker-btn ker-btn-secondary flex-1"
                  >
                    Annuleren
                  </button>
                  <button
                    type="submit"
                    disabled={!formCategory || !formTitle || !formDescription || isSubmitting}
                    className="ker-btn ker-btn-primary flex-1"
                  >
                    {isSubmitting ? 'Versturen...' : 'Verstuur'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Bestaande vragen */}
          {helpRequests.length === 0 && !showHulpvraagForm ? (
            <div className="text-center py-12">
              <span className="text-5xl">📝</span>
              <p className="text-muted-foreground mt-4">Nog geen vragen gesteld</p>
            </div>
          ) : (
            <div className="space-y-3">
              {helpRequests.map((request) => {
                const catInfo = hulpvraagCategories.find(c => c.value === request.category)
                return (
                  <div key={request.id} className="ker-card">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{catInfo?.icon || '📝'}</span>
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-medium text-foreground">{request.title}</h4>
                          <span className={cn(
                            "text-xs px-2 py-1 rounded-full",
                            request.status === 'RESPONDED' && "bg-green-100 text-green-700",
                            request.status === 'OPEN' && "bg-yellow-100 text-yellow-700",
                            request.status === 'RESOLVED' && "bg-gray-100 text-gray-600"
                          )}>
                            {request.status === 'RESPONDED' && 'Antwoord'}
                            {request.status === 'OPEN' && 'Nieuw'}
                            {request.status === 'RESOLVED' && 'Afgerond'}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {request.description}
                        </p>
                        {request.response && (
                          <div className="mt-3 p-3 bg-green-50 rounded-lg">
                            <p className="text-xs font-medium text-green-700 mb-1">Antwoord:</p>
                            <p className="text-sm text-green-800">{request.response}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="ker-page-content">
      {/* Header - compact */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <span className="text-3xl">💜</span> Hulp vinden en regelen
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Kies hieronder voor wie je hulp zoekt. Tik op het <span className="text-primary font-semibold">hartje</span> om iets te bewaren.
          {hulpData?.testNiveau && (
            <span>
              {' '}De hulp is afgestemd op jouw situatie ({hulpData.testNiveau === "LAAG" ? "lage" : hulpData.testNiveau === "GEMIDDELD" ? "gemiddelde" : "hoge"} belasting).
            </span>
          )}
        </p>
      </div>

      {/* TWEE TABS NAAST ELKAAR */}
      {(() => {
        // Bereken totalen voor badges
        // Voor jou: lokale hulpbronnen + relevante landelijke hulpbronnen
        const aantalLokaalVoorJou = CATEGORIEEN_MANTELZORGER.reduce((sum, cat) =>
          sum + (hulpData?.perCategorie?.[cat.naam]?.length || 0), 0)
        const aantalLandelijkVoorJou = getRelevanteLandelijkeCount()
        const aantalVoorJou = aantalLokaalVoorJou + aantalLandelijkVoorJou

        const aantalZwareTaken = hulpData?.zwareTaken?.length || 0

        return (
          <div className="grid grid-cols-2 gap-2 mb-6">
            <button
              onClick={() => handleTabClick('voor-jou')}
              className={cn(
                "py-3 px-2 rounded-xl font-medium text-sm transition-all text-center relative",
                activeTab === 'voor-jou'
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              <span className="text-lg block mb-1">💜</span>
              Voor jou
              {aantalVoorJou > 0 && (
                <span className={cn(
                  "absolute -top-1 -right-1 w-5 h-5 text-xs font-bold rounded-full flex items-center justify-center",
                  activeTab === 'voor-jou'
                    ? "bg-white text-primary"
                    : "bg-primary text-white"
                )}>
                  {aantalVoorJou}
                </span>
              )}
            </button>
            <button
              onClick={() => handleTabClick('voor-naaste')}
              className={cn(
                "py-3 px-2 rounded-xl font-medium text-sm transition-all text-center relative",
                activeTab === 'voor-naaste'
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              <span className="text-lg block mb-1">💝</span>
              Voor naaste
              {aantalZwareTaken > 0 && (
                <span className={cn(
                  "absolute -top-1 -right-1 w-5 h-5 text-xs font-bold rounded-full flex items-center justify-center",
                  activeTab === 'voor-naaste'
                    ? "bg-white text-primary"
                    : "bg-[var(--accent-amber)] text-white"
                )}>
                  {aantalZwareTaken}
                </span>
              )}
            </button>
          </div>
        )
      })()}

      {/* CONTENT OP BASIS VAN GESELECTEERDE TAB */}

      {/* TAB: VOOR JOU (Mantelzorger) */}
      {activeTab === 'voor-jou' && (
        <div className="space-y-4">
          {/* Als GEEN categorie geselecteerd: toon categorie grid */}
          {!selectedCategorie && (
            <>
              <div className="bg-primary/10 rounded-xl p-4 mb-2">
                <p className="text-sm text-foreground">
                  <span className="font-medium">💜 Hulp voor jou als mantelzorger.</span> Mantelzorgen is zwaar werk.
                  Ook jij hebt soms hulp nodig. Hier vind je organisaties die jou kunnen helpen.
                </p>
              </div>
              {locatieMantelzorger ? (
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  📍 {locatieMantelzorger}
                </p>
              ) : (
                <Link href="/profiel" className="text-sm text-primary hover:underline flex items-center gap-1">
                  📍 Vul je woonplaats in voor lokale hulp →
                </Link>
              )}

              <div className="grid grid-cols-2 gap-3">
                {CATEGORIEEN_MANTELZORGER.map((cat) => {
                  const aantalLokaal = hulpData?.perCategorie?.[cat.naam]?.length || 0
                  const aantalLandelijk = getLandelijkeHulpVoorCategorie(cat.naam).length
                  const aantalHulp = aantalLokaal + aantalLandelijk

                  return (
                    <button
                      key={cat.naam}
                      onClick={() => handleSelectCategorie(cat.naam)}
                      className="flex flex-col items-start p-3 rounded-xl text-left transition-all border bg-card hover:shadow-md border-border"
                    >
                      <span className="text-2xl mb-2">{cat.icon}</span>
                      <p className="font-bold text-sm">{cat.kort}</p>
                      {aantalHulp > 0 && (
                        <p className="text-xs mt-0.5 text-primary">
                          {aantalHulp} hulpbron{aantalHulp > 1 ? 'nen' : ''}
                        </p>
                      )}
                    </button>
                  )
                })}
              </div>
            </>
          )}

          {/* Als WEL categorie geselecteerd: toon resultaten (vervangt grid) */}
          {selectedCategorie && (() => {
            const catInfo = CATEGORIEEN_MANTELZORGER.find(c => c.naam === selectedCategorie)
            const lokaleHulp = (hulpData?.perCategorie?.[selectedCategorie] || []).filter(h => !h.isLandelijk)
            const landelijkInCategorie = (hulpData?.perCategorie?.[selectedCategorie] || []).filter(h => h.isLandelijk)
            const landelijkeHulp = [...landelijkInCategorie.map(h => ({
              naam: h.naam,
              telefoon: h.telefoon,
              website: h.website,
              beschrijving: h.beschrijving,
              soortHulp: h.soortHulp || null,
              dienst: h.dienst || null,
              openingstijden: h.openingstijden || null,
              kosten: h.kosten || null,
              bronLabel: h.bronLabel || null,
            })), ...getLandelijkeHulpVoorCategorie(selectedCategorie)]
            // Dedup landelijke hulpbronnen op naam
            const seenNames = new Set<string>()
            const uniekeLandelijk = landelijkeHulp.filter(h => {
              if (seenNames.has(h.naam)) return false
              seenNames.add(h.naam)
              return true
            })

            const toonLokaal = lokaleHulp.length > 0
            const toonLandelijk = uniekeLandelijk.length > 0 && bereikFilter === 'alle'
            const heeftHulp = toonLokaal || toonLandelijk

            return (
              <div className="space-y-3">
                {/* Breadcrumb navigatie */}
                <nav className="flex items-center gap-1.5 text-sm" aria-label="Navigatiepad">
                  <button
                    onClick={handleBackToCategories}
                    className="text-primary hover:underline font-medium"
                  >
                    Hulp
                  </button>
                  <span className="text-muted-foreground">&rsaquo;</span>
                  <button
                    onClick={handleBackToCategories}
                    className="text-primary hover:underline font-medium"
                  >
                    Voor jou
                  </button>
                  <span className="text-muted-foreground">&rsaquo;</span>
                  <span className="text-muted-foreground">{catInfo?.kort || selectedCategorie}</span>
                </nav>

                {/* Categorie header */}
                <div className="flex items-center gap-2">
                  <span className="text-xl">{catInfo?.icon || '💜'}</span>
                  <h2 className="font-bold text-foreground leading-tight">{catInfo?.kort || selectedCategorie}</h2>
                </div>

                {/* Filter toggle - altijd zichtbaar, gelijke grootte, met aantallen */}
                <div className="flex gap-1 bg-muted p-1 rounded-lg">
                  <button
                    onClick={() => setBereikFilter('lokaal')}
                    className={cn(
                      "flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2",
                      bereikFilter === 'lokaal'
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Lokaal
                    <span className={cn(
                      "w-5 h-5 rounded-full text-xs flex items-center justify-center",
                      bereikFilter === 'lokaal'
                        ? "bg-primary text-white"
                        : "bg-muted-foreground/20 text-muted-foreground"
                    )}>
                      {lokaleHulp.length}
                    </span>
                  </button>
                  <button
                    onClick={() => setBereikFilter('alle')}
                    className={cn(
                      "flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2",
                      bereikFilter === 'alle'
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Alles
                    <span className={cn(
                      "w-5 h-5 rounded-full text-xs flex items-center justify-center",
                      bereikFilter === 'alle'
                        ? "bg-primary text-white"
                        : "bg-muted-foreground/20 text-muted-foreground"
                    )}>
                      {lokaleHulp.length + uniekeLandelijk.length}
                    </span>
                  </button>
                </div>

                {/* Resultaten */}
                {!heeftHulp ? (
                  <div className="text-center py-8 ker-card">
                    <span className="text-3xl block mb-2">🔍</span>
                    <p className="text-foreground font-medium">Geen hulpbronnen gevonden</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {locatieMantelzorger
                        ? `Er zijn nog geen hulpbronnen voor deze categorie bij ${locatieMantelzorger}.`
                        : "Vul je woonplaats in bij je profiel zodat we lokale hulp kunnen tonen."}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Lokale hulpbronnen */}
                    {toonLokaal && (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          In je buurt
                          {locatieMantelzorger && (
                            <span> 📍 {locatieMantelzorger}</span>
                          )}
                        </p>
                        {lokaleHulp.map((hulp, i) => (
                          <HulpbronCard key={`lokaal-${i}`} hulp={hulp} favorieten={favorieten} categorie={selectedCategorie || undefined} />
                        ))}
                      </div>
                    )}

                    {/* Landelijke hulpbronnen */}
                    {toonLandelijk && (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          Landelijk beschikbaar
                        </p>
                        {uniekeLandelijk.map((hulp, i) => (
                          <LandelijkeHulpCard key={`landelijk-${i}`} hulp={hulp} favorieten={favorieten} categorie={selectedCategorie || undefined} />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })()}
        </div>
      )}

      {/* TAB: VOOR NAASTE (Zorgvrager) */}
      {activeTab === 'voor-naaste' && (
        <div className="space-y-4">
          {/* Als GEEN categorie geselecteerd: toon categorie grid */}
          {!selectedCategorie && (
            <>
              <div className="bg-[var(--accent-amber-bg)] rounded-xl p-4 mb-2">
                <p className="text-sm text-foreground">
                  <span className="font-medium">💝 Hulp voor je naaste.</span> Hier vind je hulp voor de taken
                  die je voor je naaste doet.
                  {hulpData?.zwareTaken && hulpData.zwareTaken.length > 0
                    ? " De kleuren laten zien hoe zwaar een taak voor jou is."
                    : ""}
                </p>
              </div>
              {!hulpData?.zwareTaken?.length && (
                <Link
                  href="/belastbaarheidstest"
                  className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/20 hover:bg-primary/10 transition-colors"
                >
                  <span className="text-2xl">📊</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">Doe de balanstest</p>
                    <p className="text-xs text-muted-foreground">Dan kleuren we de tegels op basis van wat jij zwaar vindt.</p>
                  </div>
                  <svg className="w-4 h-4 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              )}
              {locatieZorgvrager ? (
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  📍 {locatieZorgvrager}
                </p>
              ) : (
                <Link href="/profiel" className="text-sm text-primary hover:underline flex items-center gap-1">
                  📍 Vul de woonplaats van je naaste in voor lokale hulp →
                </Link>
              )}

              {/* Categorieën visueel gegroepeerd */}
              <div className="space-y-4">
                {CATEGORIEEN_ZORGVRAGER_GROEPEN.map((groep) => (
                  <div key={groep.groep}>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{groep.groep}</p>
                    <div className="grid grid-cols-2 gap-3">
                      {groep.categorieen.map((cat) => {
                        const taakStatus = getTaakStatus(cat.naam)
                        const aantalHulp = hulpData?.perCategorie?.[cat.naam]?.length || 0

                        return (
                          <button
                            key={cat.naam}
                            onClick={() => handleSelectCategorie(cat.naam)}
                            className={cn(
                              "flex flex-col items-start p-3 rounded-xl text-left transition-all relative",
                              taakStatus === 'zwaar'
                                ? "bg-[var(--accent-red-bg)] border-[3px] border-[var(--accent-red)] hover:shadow-md"
                                : taakStatus === 'gemiddeld'
                                  ? "bg-[var(--accent-amber-bg)] border-[3px] border-[var(--accent-amber)] hover:shadow-md"
                                  : taakStatus === 'licht'
                                    ? "bg-[var(--accent-green-bg)] border-[3px] border-[var(--accent-green)] hover:shadow-md"
                                    : "bg-card border border-border hover:shadow-md"
                            )}
                          >
                            {/* Status label */}
                            {taakStatus && (
                              <div className="absolute top-2 right-2">
                                <span className={cn(
                                  "text-xs font-semibold px-2 py-0.5 rounded-full",
                                  taakStatus === 'zwaar' && "bg-[var(--accent-red)]/15 text-[var(--accent-red)]",
                                  taakStatus === 'gemiddeld' && "bg-[var(--accent-amber)]/15 text-[var(--accent-amber)]",
                                  taakStatus === 'licht' && "bg-[var(--accent-green)]/15 text-[var(--accent-green)]",
                                )}>
                                  {taakStatus === 'zwaar' && 'Zwaar'}
                                  {taakStatus === 'gemiddeld' && 'Matig'}
                                  {taakStatus === 'licht' && 'Goed'}
                                </span>
                              </div>
                            )}
                            <span className="text-2xl mb-2">{cat.icon}</span>
                            <p className="font-bold text-sm">{cat.kort}</p>
                            {aantalHulp > 0 && (
                              <p className="text-xs mt-0.5 text-primary">
                                {aantalHulp} hulpbron{aantalHulp > 1 ? 'nen' : ''}
                              </p>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Als WEL categorie geselecteerd: toon resultaten (vervangt grid) */}
          {selectedCategorie && (() => {
            const catInfo = CATEGORIEEN_ZORGVRAGER.find(c => c.naam === selectedCategorie)
            const taakStatus = getTaakStatus(selectedCategorie)
            const alleHulp = hulpData?.perCategorie?.[selectedCategorie] || []
            const lokaleHulp = alleHulp.filter(h => !h.isLandelijk)
            const landelijkeHulp = alleHulp.filter(h => h.isLandelijk)

            const toonLokaal = lokaleHulp.length > 0
            const toonLandelijk = landelijkeHulp.length > 0 && bereikFilter === 'alle'
            const heeftHulp = toonLokaal || toonLandelijk

            return (
              <div className="space-y-3">
                {/* Breadcrumb navigatie */}
                <nav className="flex items-center gap-1.5 text-sm" aria-label="Navigatiepad">
                  <button
                    onClick={handleBackToCategories}
                    className="text-primary hover:underline font-medium"
                  >
                    Hulp
                  </button>
                  <span className="text-muted-foreground">&rsaquo;</span>
                  <button
                    onClick={handleBackToCategories}
                    className="text-primary hover:underline font-medium"
                  >
                    Voor naaste
                  </button>
                  <span className="text-muted-foreground">&rsaquo;</span>
                  <span className="text-muted-foreground">{catInfo?.kort || selectedCategorie}</span>
                </nav>

                {/* Categorie header met status badge */}
                <div className="flex items-center gap-2">
                  <span className="text-xl">{catInfo?.icon || '💝'}</span>
                  <h2 className="font-bold text-foreground leading-tight">{catInfo?.kort || selectedCategorie}</h2>
                  {taakStatus && (
                    <span className={cn(
                      "text-xs font-semibold px-2 py-0.5 rounded-full",
                      taakStatus === 'zwaar' && "bg-[var(--accent-red)]/15 text-[var(--accent-red)]",
                      taakStatus === 'gemiddeld' && "bg-[var(--accent-amber)]/15 text-[var(--accent-amber)]",
                      taakStatus === 'licht' && "bg-[var(--accent-green)]/15 text-[var(--accent-green)]",
                    )}>
                      {taakStatus === 'zwaar' && 'Zwaar'}
                      {taakStatus === 'gemiddeld' && 'Matig'}
                      {taakStatus === 'licht' && 'Goed'}
                    </span>
                  )}
                </div>

                {/* Filter toggle - altijd zichtbaar, gelijke grootte, met aantallen */}
                <div className="flex gap-1 bg-muted p-1 rounded-lg">
                  <button
                    onClick={() => setBereikFilter('lokaal')}
                    className={cn(
                      "flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2",
                      bereikFilter === 'lokaal'
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Lokaal
                    <span className={cn(
                      "w-5 h-5 rounded-full text-xs flex items-center justify-center",
                      bereikFilter === 'lokaal'
                        ? "bg-primary text-white"
                        : "bg-muted-foreground/20 text-muted-foreground"
                    )}>
                      {lokaleHulp.length}
                    </span>
                  </button>
                  <button
                    onClick={() => setBereikFilter('alle')}
                    className={cn(
                      "flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2",
                      bereikFilter === 'alle'
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Alles
                    <span className={cn(
                      "w-5 h-5 rounded-full text-xs flex items-center justify-center",
                      bereikFilter === 'alle'
                        ? "bg-primary text-white"
                        : "bg-muted-foreground/20 text-muted-foreground"
                    )}>
                      {lokaleHulp.length + landelijkeHulp.length}
                    </span>
                  </button>
                </div>

                {/* Resultaten */}
                {!heeftHulp ? (
                  <div className="text-center py-8 ker-card">
                    <span className="text-3xl block mb-2">🔍</span>
                    <p className="text-foreground font-medium">Geen hulpbronnen gevonden</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {locatieZorgvrager
                        ? `Er zijn nog geen hulpbronnen voor deze categorie bij ${locatieZorgvrager}.`
                        : "Vul de woonplaats van je naaste in bij je profiel zodat we lokale hulp kunnen tonen."}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Lokale hulpbronnen */}
                    {toonLokaal && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                            In de buurt van je naaste
                            {locatieZorgvrager && (
                              <span> 📍 {locatieZorgvrager}</span>
                            )}
                          </p>
                        </div>
                        {lokaleHulp.map((hulp, i) => (
                          <HulpbronCard key={`lokaal-${i}`} hulp={hulp} favorieten={favorieten} categorie={selectedCategorie || undefined} />
                        ))}
                      </div>
                    )}

                    {/* Landelijke hulpbronnen */}
                    {toonLandelijk && (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          Landelijk beschikbaar
                        </p>
                        {landelijkeHulp.map((hulp, i) => (
                          <HulpbronCard key={`landelijk-${i}`} hulp={hulp} favorieten={favorieten} categorie={selectedCategorie || undefined} />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })()}
        </div>
      )}

      {/* MantelBuddy inschakelen - altijd zichtbaar onderaan */}
      <div className="mt-6">
        <button
          onClick={() => setShowVragenTab(true)}
          className="w-full ker-card bg-gradient-to-r from-primary/5 to-primary/10 hover:from-primary/10 hover:to-primary/15 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">🤝</span>
            <div className="flex-1 text-left">
              <h3 className="font-semibold text-foreground text-sm">Hulp van een vrijwilliger?</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Een MantelBuddy helpt met kleine taken bij jou in de buurt</p>
            </div>
            <svg className="w-4 h-4 text-muted-foreground flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </button>
      </div>
    </div>
  )
}

// Hulpbron card component
function HulpbronCard({ hulp, favorieten, categorie }: {
  hulp: Hulpbron
  favorieten?: Record<string, string>
  categorie?: string
}) {
  const [modalOpen, setModalOpen] = useState(false)
  const itemId = generateHulpItemId(hulp.naam, hulp.gemeente)
  const favKey = `HULP:${itemId}`
  const isFavorited = !!(favorieten && favorieten[favKey])
  const favorietId = favorieten?.[favKey]

  // Dienst als primaire naam, organisatie als secundair
  const displayNaam = hulp.dienst || hulp.naam

  return (
    <>
      <div
        className="ker-card py-3 cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => setModalOpen(true)}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-foreground">{displayNaam}</p>
            {hulp.beschrijving && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{hulp.beschrijving}</p>
            )}
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
              initialFavorited={isFavorited}
              initialFavorietId={favorietId}
              size="sm"
            />
          </div>
        </div>
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          {/* Organisatie + gemeente */}
          {hulp.isLandelijk ? (
            <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full font-medium">
              🌍 Landelijk
            </span>
          ) : hulp.gemeente && (
            <span className="text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full font-medium">
              📍 {hulp.dienst ? hulp.naam : hulp.gemeente}
            </span>
          )}
          {hulp.kosten && (
            <span className="text-xs text-muted-foreground">
              {hulp.kosten}
            </span>
          )}
          <span className="text-xs text-primary font-medium ml-auto">Meer info →</span>
        </div>
      </div>

      <ContentModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        titel={hulp.naam}
        dienst={hulp.dienst}
        beschrijving={hulp.beschrijving}
        gemeente={hulp.gemeente}
        soortHulp={hulp.soortHulp}
        telefoon={hulp.telefoon}
        website={hulp.website}
        doelgroep={hulp.doelgroep}
        kosten={hulp.kosten}
        openingstijden={hulp.openingstijden}
        bronLabel={hulp.bronLabel}
      />
    </>
  )
}

// Landelijke hulpbron card component
function LandelijkeHulpCard({ hulp, favorieten, categorie }: {
  hulp: LandelijkeHulpbron
  favorieten?: Record<string, string>
  categorie?: string
}) {
  const [modalOpen, setModalOpen] = useState(false)
  const itemId = generateHulpItemId(hulp.naam, null)
  const favKey = `HULP:${itemId}`
  const isFavorited = !!(favorieten && favorieten[favKey])
  const favorietId = favorieten?.[favKey]

  const displayNaam = hulp.dienst || hulp.naam

  return (
    <>
      <div
        className="ker-card py-3 cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => setModalOpen(true)}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-foreground">{displayNaam}</p>
            {hulp.beschrijving && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{hulp.beschrijving}</p>
            )}
          </div>
          <div onClick={(e) => e.stopPropagation()}>
            <FavorietButton
              type="HULP"
              itemId={itemId}
              titel={hulp.naam}
              beschrijving={hulp.beschrijving || undefined}
              categorie={categorie || "Landelijk"}
              url={hulp.website || undefined}
              telefoon={hulp.telefoon || undefined}
              icon="🌍"
              initialFavorited={isFavorited}
              initialFavorietId={favorietId}
              size="sm"
            />
          </div>
        </div>
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full font-medium">
            🌍 {hulp.dienst ? hulp.naam : 'Landelijk'}
          </span>
          {hulp.kosten && (
            <span className="text-xs text-muted-foreground">
              {hulp.kosten}
            </span>
          )}
          <span className="text-xs text-primary font-medium ml-auto">Meer info →</span>
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
      />
    </>
  )
}
