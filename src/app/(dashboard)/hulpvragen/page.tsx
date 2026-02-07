"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface Hulpbron {
  naam: string
  telefoon: string | null
  website: string | null
  beschrijving: string | null
  soortHulp?: string | null
  gemeente?: string | null
  isLandelijk?: boolean
}

interface LandelijkeHulpbron {
  naam: string
  telefoon: string | null
  website: string | null
  beschrijving: string | null
  soortHulp: string | null
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

// Categorieën voor zorgvrager (hulp voor wie je zorgt)
const CATEGORIEEN_ZORGVRAGER = [
  { naam: 'Persoonlijke verzorging', icon: '🛁', kort: 'Verzorging' },
  { naam: 'Huishoudelijke taken', icon: '🧹', kort: 'Huishouden' },
  { naam: 'Vervoer', icon: '🚗', kort: 'Vervoer' },
  { naam: 'Administratie en aanvragen', icon: '📋', kort: 'Administratie' },
  { naam: 'Sociaal contact en activiteiten', icon: '👥', kort: 'Sociaal' },
  { naam: 'Bereiden en/of nuttigen van maaltijden', icon: '🍽️', kort: 'Maaltijden' },
  { naam: 'Boodschappen', icon: '🛒', kort: 'Boodschappen' },
  { naam: 'Klusjes in en om het huis', icon: '🔧', kort: 'Klusjes' },
]

// Categorieën voor mantelzorger (hulp voor jou)
const CATEGORIEEN_MANTELZORGER = [
  { naam: 'Mantelzorgondersteuning', icon: '💜', kort: 'Ondersteuning' },
  { naam: 'Respijtzorg', icon: '🏠', kort: 'Respijtzorg' },
  { naam: 'Emotionele steun', icon: '💚', kort: 'Praten' },
  { naam: 'Lotgenotencontact', icon: '👥', kort: 'Lotgenoten' },
]

// Mapping van taak namen naar categorieën
const TAAK_NAAR_CATEGORIE: Record<string, string> = {
  'Wassen/aankleden': 'Persoonlijke verzorging',
  'Persoonlijke verzorging': 'Persoonlijke verzorging',
  'Toiletgang': 'Persoonlijke verzorging',
  'Medicijnen': 'Persoonlijke verzorging',
  'Toezicht': 'Persoonlijke verzorging',
  'Medische zorg': 'Persoonlijke verzorging',
  'Huishouden': 'Huishoudelijke taken',
  'Huishoudelijke taken': 'Huishoudelijke taken',
  'Vervoer': 'Vervoer',
  'Vervoer/begeleiding': 'Vervoer',
  'Administratie': 'Administratie en aanvragen',
  'Administratie en aanvragen': 'Administratie en aanvragen',
  'Sociaal contact': 'Sociaal contact en activiteiten',
  'Sociaal contact en activiteiten': 'Sociaal contact en activiteiten',
  'Activiteiten': 'Sociaal contact en activiteiten',
  'Maaltijden': 'Bereiden en/of nuttigen van maaltijden',
  'Boodschappen': 'Boodschappen',
  'Klusjes': 'Klusjes in en om het huis',
}

// Hulpvraag categorieën
const hulpvraagCategories = [
  { value: "RESPITE_CARE", label: "Even vrij", icon: "🏠", hint: "Iemand neemt de zorg over" },
  { value: "EMOTIONAL_SUPPORT", label: "Praten", icon: "💚", hint: "Over je gevoel praten" },
  { value: "PRACTICAL_HELP", label: "Hulp thuis", icon: "🔧", hint: "Klussen of taken" },
  { value: "FINANCIAL_ADVICE", label: "Geld", icon: "💰", hint: "Hulp met geld of aanvragen" },
  { value: "INFORMATION", label: "Info", icon: "ℹ️", hint: "Informatie zoeken" },
  { value: "OTHER", label: "Anders", icon: "📝", hint: "Iets anders" },
]

type TabType = 'voor-jou' | 'voor-naaste' | 'algemeen'

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
  const [showHulpvraagForm, setShowHulpvraagForm] = useState(false)
  const [showVragenTab, setShowVragenTab] = useState(false)
  const [initializedFromUrl, setInitializedFromUrl] = useState(false)

  // Hulpvraag form state
  const [formTitle, setFormTitle] = useState("")
  const [formDescription, setFormDescription] = useState("")
  const [formCategory, setFormCategory] = useState("")
  const [formUrgency, setFormUrgency] = useState("NORMAL")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // URL parameters verwerken (van rapport pagina)
  useEffect(() => {
    if (initializedFromUrl) return

    const tabParam = searchParams.get('tab') as TabType | null
    const categorieParam = searchParams.get('categorie')

    if (tabParam && ['voor-jou', 'voor-naaste', 'algemeen'].includes(tabParam)) {
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

        // Voeg categorie toe aan zware taken
        // Database kan twee formats hebben:
        // 1. Web test: MOEILIJK/ZEER_MOEILIJK/GEMIDDELD/MAKKELIJK
        // 2. WhatsApp test: JA/SOMS/NEE
        const isZwaarOfMatig = (m: string | null) =>
          m === 'MOEILIJK' || m === 'ZEER_MOEILIJK' || m === 'GEMIDDELD' ||
          m === 'JA' || m === 'ja' || m === 'SOMS' || m === 'soms'

        const zwareTaken = (dashboardData.test?.zorgtaken || [])
          .filter((t: any) => isZwaarOfMatig(t.moeilijkheid))
          .map((t: any) => ({
            ...t,
            categorie: TAAK_NAAR_CATEGORIE[t.naam] || null
          }))

        setHulpData({
          perCategorie: dashboardData.hulpbronnen?.perCategorie || {},
          landelijk: dashboardData.hulpbronnen?.landelijk || [],
          zwareTaken,
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
    }
  }

  const handleTabClick = (tab: TabType) => {
    if (activeTab === tab) {
      setActiveTab(null)
      setSelectedCategorie(null)
    } else {
      setActiveTab(tab)
      setSelectedCategorie(null)
    }
  }

  if (loading) {
    return (
      <div className="ker-page-content flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  const openHulpvragen = helpRequests.filter(r => r.status !== 'RESOLVED' && r.status !== 'CLOSED').length

  // Bepaal welke categorieën zware taken hebben en hun niveau
  // Ondersteunt zowel web format (MOEILIJK/GEMIDDELD) als WhatsApp format (JA/SOMS)
  const getTaakStatus = (categorieNaam: string): 'zwaar' | 'gemiddeld' | null => {
    const taken = hulpData?.zwareTaken?.filter(t => t.categorie === categorieNaam) || []
    const isZwaar = (m: string | null) =>
      m === 'MOEILIJK' || m === 'ZEER_MOEILIJK' || m === 'JA' || m === 'ja'
    const isMatig = (m: string | null) =>
      m === 'GEMIDDELD' || m === 'SOMS' || m === 'soms'

    if (taken.some(t => isZwaar(t.moeilijkheid))) {
      return 'zwaar'
    }
    if (taken.some(t => isMatig(t.moeilijkheid))) {
      return 'gemiddeld'
    }
    return null
  }

  // Helper functie voor locatie string
  const formatLocatie = (loc: LocatieInfo | undefined) => {
    if (!loc) return null
    const parts = [loc.woonplaats || loc.gemeente].filter(Boolean)
    return parts.length > 0 ? parts.join(', ') : null
  }

  // Helper functie om relevante landelijke hulpbronnen te vinden voor een categorie (mantelzorger)
  const getLandelijkeHulpVoorCategorie = (categorieNaam: string): LandelijkeHulpbron[] => {
    if (!hulpData?.landelijk) return []

    const mapping: Record<string, string[]> = {
      'Mantelzorgondersteuning': ['ondersteuning', 'mantelzorg'],
      'Respijtzorg': ['respijt'],
      'Emotionele steun': ['emotioneel', 'steun'],
      'Lotgenotencontact': ['lotgenoot', 'lotgenoten'],
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

    const relevanteKeywords = ['ondersteuning', 'mantelzorg', 'respijt', 'emotioneel', 'steun', 'lotgenoot', 'lotgenoten']
    return hulpData.landelijk.filter(h =>
      relevanteKeywords.some(kw => h.soortHulp?.toLowerCase().includes(kw))
    ).length
  }

  // Landelijke hulpbronnen die NIET relevant zijn voor de mantelzorger categorieën
  const getOverigeLandelijke = (): LandelijkeHulpbron[] => {
    if (!hulpData?.landelijk) return []

    const relevanteKeywords = ['ondersteuning', 'mantelzorg', 'respijt', 'emotioneel', 'steun', 'lotgenoot', 'lotgenoten']
    return hulpData.landelijk.filter(h =>
      !relevanteKeywords.some(kw => h.soortHulp?.toLowerCase().includes(kw))
    )
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
              <h3 className="font-semibold text-foreground mb-4">Nieuwe hulpvraag</h3>
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
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <span className="text-3xl">💜</span> Hulp
        </h1>
        <p className="text-muted-foreground mt-1">
          Kies waar je hulp bij zoekt
        </p>
      </div>

      {/* Urgente melding bij hoge belasting */}
      {hulpData?.testNiveau === "HOOG" && (
        <div className="mb-6 p-4 bg-[var(--accent-red-bg)] rounded-xl border-l-4 border-[var(--accent-red)]">
          <p className="font-semibold text-foreground mb-2">Je belasting is hoog</p>
          <p className="text-sm text-muted-foreground mb-3">
            Neem contact op met je huisarts of de mantelzorglijn voor ondersteuning.
          </p>
          <div className="flex flex-wrap gap-2">
            <a
              href="tel:0900-2020496"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-lg text-sm font-medium hover:bg-gray-50"
            >
              📞 Mantelzorglijn
            </a>
            <Link
              href="/rapport"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium"
            >
              Bekijk rapport
            </Link>
          </div>
        </div>
      )}

      {/* DRIE TABS NAAST ELKAAR */}
      {(() => {
        // Bereken totalen voor badges
        // Voor jou: lokale hulpbronnen + relevante landelijke hulpbronnen
        const aantalLokaalVoorJou = CATEGORIEEN_MANTELZORGER.reduce((sum, cat) =>
          sum + (hulpData?.perCategorie?.[cat.naam]?.length || 0), 0)
        const aantalLandelijkVoorJou = getRelevanteLandelijkeCount()
        const aantalVoorJou = aantalLokaalVoorJou + aantalLandelijkVoorJou

        const aantalZwareTaken = hulpData?.zwareTaken?.length || 0
        // Algemeen: alleen overige landelijke hulpbronnen die niet in categorieën passen
        const aantalLandelijk = getOverigeLandelijke().length

        return (
          <div className="grid grid-cols-3 gap-2 mb-6">
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
            <button
              onClick={() => handleTabClick('algemeen')}
              className={cn(
                "py-3 px-2 rounded-xl font-medium text-sm transition-all text-center relative",
                activeTab === 'algemeen'
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              <span className="text-lg block mb-1">🌍</span>
              Algemeen
              {aantalLandelijk > 0 && (
                <span className={cn(
                  "absolute -top-1 -right-1 w-5 h-5 text-xs font-bold rounded-full flex items-center justify-center",
                  activeTab === 'algemeen'
                    ? "bg-white text-primary"
                    : "bg-primary text-white"
                )}>
                  {aantalLandelijk}
                </span>
              )}
            </button>
          </div>
        )
      })()}

      {/* CONTENT OP BASIS VAN GESELECTEERDE TAB */}
      {!activeTab && (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-lg">👆</p>
          <p className="mt-2">Kies hierboven waar je hulp bij zoekt</p>
        </div>
      )}

      {/* TAB: VOOR JOU (Mantelzorger) */}
      {activeTab === 'voor-jou' && (
        <div className="space-y-4">
          {locatieMantelzorger && (
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              📍 {locatieMantelzorger}
            </p>
          )}

          <div className="grid grid-cols-2 gap-3">
            {CATEGORIEEN_MANTELZORGER.map((cat) => {
              const aantalLokaal = hulpData?.perCategorie?.[cat.naam]?.length || 0
              const aantalLandelijk = getLandelijkeHulpVoorCategorie(cat.naam).length
              const aantalHulp = aantalLokaal + aantalLandelijk
              const isSelected = selectedCategorie === cat.naam

              return (
                <button
                  key={cat.naam}
                  onClick={() => handleSelectCategorie(cat.naam)}
                  className={cn(
                    "flex items-center gap-3 p-4 rounded-xl text-sm transition-all text-left",
                    isSelected
                      ? "bg-primary text-primary-foreground ring-2 ring-primary"
                      : "bg-primary/10 hover:bg-primary/20 border border-primary/20"
                  )}
                >
                  <span className="text-2xl">{cat.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold">{cat.kort}</p>
                    <p className={cn(
                      "text-xs mt-0.5",
                      isSelected ? "text-primary-foreground/70" : "text-muted-foreground"
                    )}>
                      ({aantalHulp})
                    </p>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Hulpbronnen voor geselecteerde categorie */}
          {selectedCategorie && (
            <div className="space-y-2 mt-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">
                  {selectedCategorie}
                </p>
                <button
                  onClick={() => setSelectedCategorie(null)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  ✕ Sluiten
                </button>
              </div>

              {(() => {
                const lokaleHulp = hulpData?.perCategorie?.[selectedCategorie] || []
                const landelijkeHulp = getLandelijkeHulpVoorCategorie(selectedCategorie)
                const heeftHulp = lokaleHulp.length > 0 || landelijkeHulp.length > 0

                if (!heeftHulp) {
                  return (
                    <div className="text-center py-8 text-muted-foreground ker-card">
                      <p>Geen hulpbronnen gevonden</p>
                      <a
                        href={`https://www.zorgkaartnederland.nl/zoeken?q=${encodeURIComponent(selectedCategorie)}&plaats=${hulpData?.mantelzorgerGemeente || ''}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline mt-2 inline-block"
                      >
                        Zoek op Zorgkaart Nederland →
                      </a>
                    </div>
                  )
                }

                return (
                  <div className="space-y-3">
                    {/* Lokale hulpbronnen */}
                    {lokaleHulp.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          📍 In je buurt
                        </p>
                        {lokaleHulp.map((hulp, i) => (
                          <HulpbronCard key={`lokaal-${i}`} hulp={hulp} />
                        ))}
                      </div>
                    )}

                    {/* Landelijke hulpbronnen */}
                    {landelijkeHulp.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          🌍 Landelijk
                        </p>
                        {landelijkeHulp.map((hulp, i) => (
                          <LandelijkeHulpCard key={`landelijk-${i}`} hulp={hulp} />
                        ))}
                      </div>
                    )}
                  </div>
                )
              })()}
            </div>
          )}
        </div>
      )}

      {/* TAB: VOOR NAASTE (Zorgvrager) */}
      {activeTab === 'voor-naaste' && (
        <div className="space-y-4">
          {locatieZorgvrager && (
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              📍 {locatieZorgvrager}
            </p>
          )}

          <div className="grid grid-cols-2 gap-3">
            {CATEGORIEEN_ZORGVRAGER.map((cat) => {
              const taakStatus = getTaakStatus(cat.naam)
              const aantalHulp = hulpData?.perCategorie?.[cat.naam]?.length || 0
              const isSelected = selectedCategorie === cat.naam

              return (
                <button
                  key={cat.naam}
                  onClick={() => handleSelectCategorie(cat.naam)}
                  className={cn(
                    "flex items-center gap-3 p-4 rounded-xl text-sm transition-all text-left relative",
                    isSelected
                      ? "bg-primary text-primary-foreground ring-2 ring-primary"
                      : taakStatus === 'zwaar'
                        ? "bg-[var(--accent-red-bg)] border-2 border-[var(--accent-red)] hover:border-[var(--accent-red)]"
                        : taakStatus === 'gemiddeld'
                          ? "bg-[var(--accent-amber-bg)] border-2 border-[var(--accent-amber)] hover:border-[var(--accent-amber)]"
                          : "bg-muted hover:bg-muted/80 border border-border"
                  )}
                >
                  <span className="text-2xl">{cat.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold">{cat.kort}</p>
                    <p className={cn(
                      "text-xs mt-0.5",
                      isSelected ? "text-primary-foreground/70" : "text-muted-foreground"
                    )}>
                      ({aantalHulp})
                    </p>
                  </div>
                  {/* Status indicator */}
                  {!isSelected && taakStatus && (
                    <div className={cn(
                      "absolute top-2 right-2 w-3 h-3 rounded-full",
                      taakStatus === 'zwaar' ? "bg-[var(--accent-red)]" : "bg-[var(--accent-amber)]"
                    )} />
                  )}
                </button>
              )
            })}
          </div>

          {/* Hulpbronnen voor geselecteerde categorie */}
          {selectedCategorie && (
            <div className="space-y-2 mt-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">
                  {selectedCategorie}
                </p>
                <button
                  onClick={() => setSelectedCategorie(null)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  ✕ Sluiten
                </button>
              </div>

              {hulpData?.perCategorie?.[selectedCategorie] && hulpData.perCategorie[selectedCategorie].length > 0 ? (
                <div className="space-y-2">
                  {hulpData.perCategorie[selectedCategorie].map((hulp, i) => (
                    <HulpbronCard key={i} hulp={hulp} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground ker-card">
                  <p>Geen hulpbronnen gevonden</p>
                  <a
                    href={`https://www.zorgkaartnederland.nl/zoeken?q=${encodeURIComponent(selectedCategorie)}&plaats=${hulpData?.zorgvragerGemeente || ''}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline mt-2 inline-block"
                  >
                    Zoek op Zorgkaart Nederland →
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB: ALGEMEEN (Landelijk) - alleen overige hulpbronnen die niet in categorieën passen */}
      {activeTab === 'algemeen' && (
        <div className="space-y-4">
          {(() => {
            const overigeLandelijke = getOverigeLandelijke()

            if (overigeLandelijke.length === 0) {
              return (
                <div className="text-center py-8 text-muted-foreground ker-card">
                  <p>Alle landelijke hulpbronnen zijn te vinden bij de categorieën hierboven</p>
                  <p className="text-sm mt-2">Klik op "Voor jou" om hulpbronnen te bekijken</p>
                </div>
              )
            }

            // Groepeer overige landelijke hulpbronnen
            const hulplijnen = overigeLandelijke.filter(h => h.telefoon)
            const informatieAdvies = overigeLandelijke.filter(h =>
              (h.soortHulp?.toLowerCase().includes('informatie') ||
               h.soortHulp?.toLowerCase().includes('advies')) &&
              !h.telefoon
            )
            const overig = overigeLandelijke.filter(h =>
              !h.telefoon &&
              !h.soortHulp?.toLowerCase().includes('informatie') &&
              !h.soortHulp?.toLowerCase().includes('advies')
            )

            return (
              <>
                <p className="text-sm text-muted-foreground">
                  Overige landelijke hulplijnen en informatie
                </p>

                {/* Hulplijnen met telefoonnummer */}
                {hulplijnen.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide flex items-center gap-2">
                      📞 Hulplijnen
                    </p>
                    <div className="space-y-2">
                      {hulplijnen.map((hulp, i) => (
                        <LandelijkeHulpCard key={i} hulp={hulp} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Informatie & advies */}
                {informatieAdvies.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide flex items-center gap-2">
                      ℹ️ Informatie & advies
                    </p>
                    <div className="space-y-2">
                      {informatieAdvies.map((hulp, i) => (
                        <LandelijkeHulpCard key={i} hulp={hulp} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Overig */}
                {overig.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide flex items-center gap-2">
                      📋 Overig
                    </p>
                    <div className="space-y-2">
                      {overig.map((hulp, i) => (
                        <LandelijkeHulpCard key={i} hulp={hulp} />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )
          })()}
        </div>
      )}

      {/* HULPVRAAG STELLEN - altijd zichtbaar onderaan */}
      <div className="mt-8 space-y-4">
        <div className="ker-card bg-gradient-to-r from-primary/5 to-primary/10">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
              <span className="text-xl">🤝</span>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">Stel een vraag</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Vraag hulp aan organisaties of buurtgenoten
              </p>
              <button
                onClick={() => setShowVragenTab(true)}
                className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90"
              >
                Mijn vragen
                {openHulpvragen > 0 && (
                  <span className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center text-xs">
                    {openHulpvragen}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Externe zoekoptie */}
        <div className="ker-card">
          <p className="font-medium text-foreground mb-2">Meer hulp zoeken?</p>
          <a
            href={`https://www.zorgkaartnederland.nl/zoeken?q=mantelzorg&plaats=${hulpData?.mantelzorgerGemeente || ''}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-muted rounded-lg text-sm hover:bg-muted/80"
          >
            🔍 Zoek op Zorgkaart Nederland
          </a>
        </div>
      </div>
    </div>
  )
}

// Hulpbron card component
function HulpbronCard({ hulp }: { hulp: Hulpbron }) {
  return (
    <div className="ker-card py-3">
      <div className="flex items-start justify-between">
        <p className="font-medium text-sm">{hulp.naam}</p>
        {hulp.isLandelijk ? (
          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
            🌍 Landelijk
          </span>
        ) : hulp.gemeente && (
          <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
            📍 {hulp.gemeente}
          </span>
        )}
      </div>
      {hulp.beschrijving && (
        <p className="text-xs text-muted-foreground mt-1">{hulp.beschrijving}</p>
      )}
      <div className="flex gap-4 mt-2">
        {hulp.telefoon && (
          <a href={`tel:${hulp.telefoon}`} className="text-xs text-primary hover:underline flex items-center gap-1">
            📞 {hulp.telefoon}
          </a>
        )}
        {hulp.website && (
          <a href={hulp.website} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
            🌐 Website
          </a>
        )}
      </div>
    </div>
  )
}

// Landelijke hulpbron card component
function LandelijkeHulpCard({ hulp }: { hulp: LandelijkeHulpbron }) {
  return (
    <div className="flex items-center justify-between py-3 px-3 bg-white rounded-lg border border-border">
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">{hulp.naam}</p>
        {hulp.beschrijving && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{hulp.beschrijving}</p>
        )}
      </div>
      <div className="flex gap-2 flex-shrink-0 ml-2">
        {hulp.telefoon && (
          <a
            href={`tel:${hulp.telefoon}`}
            className="text-xs text-primary hover:underline font-medium flex items-center gap-1 whitespace-nowrap"
          >
            📞 {hulp.telefoon}
          </a>
        )}
        {hulp.website && (
          <a
            href={hulp.website}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:text-primary/80"
          >
            🌐
          </a>
        )}
      </div>
    </div>
  )
}
