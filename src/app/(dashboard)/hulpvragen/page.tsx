"use client"

import { useState, useEffect } from "react"
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

interface HulpData {
  perCategorie: Record<string, Hulpbron[]>
  landelijk: LandelijkeHulpbron[]
  zwareTaken: { naam: string; moeilijkheid: string; categorie?: string }[]
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

// Alle categorieën met icons
const ALLE_CATEGORIEEN = [
  { naam: 'Persoonlijke verzorging', icon: '🛁', kort: 'Verzorging', voorWie: 'zorgvrager' },
  { naam: 'Huishoudelijke taken', icon: '🧹', kort: 'Huishouden', voorWie: 'zorgvrager' },
  { naam: 'Vervoer', icon: '🚗', kort: 'Vervoer', voorWie: 'zorgvrager' },
  { naam: 'Administratie en aanvragen', icon: '📋', kort: 'Administratie', voorWie: 'zorgvrager' },
  { naam: 'Sociaal contact en activiteiten', icon: '👥', kort: 'Sociaal', voorWie: 'zorgvrager' },
  { naam: 'Bereiden en/of nuttigen van maaltijden', icon: '🍽️', kort: 'Maaltijden', voorWie: 'zorgvrager' },
  { naam: 'Boodschappen', icon: '🛒', kort: 'Boodschappen', voorWie: 'zorgvrager' },
  { naam: 'Klusjes in en om het huis', icon: '🔧', kort: 'Klusjes', voorWie: 'zorgvrager' },
  { naam: 'Mantelzorgondersteuning', icon: '💜', kort: 'Voor jou', voorWie: 'mantelzorger' },
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

export default function HulpPage() {
  const [hulpData, setHulpData] = useState<HulpData | null>(null)
  const [helpRequests, setHelpRequests] = useState<HelpRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'bronnen' | 'vragen'>('bronnen')
  const [selectedCategorie, setSelectedCategorie] = useState<string | null>(null)
  const [showHulpvraagForm, setShowHulpvraagForm] = useState(false)

  // Hulpvraag form state
  const [formTitle, setFormTitle] = useState("")
  const [formDescription, setFormDescription] = useState("")
  const [formCategory, setFormCategory] = useState("")
  const [formUrgency, setFormUrgency] = useState("NORMAL")
  const [isSubmitting, setIsSubmitting] = useState(false)

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
        const zwareTaken = (dashboardData.test?.zorgtaken || [])
          .filter((t: any) => t.moeilijkheid === 'JA' || t.moeilijkheid === 'SOMS')
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

  if (loading) {
    return (
      <div className="ker-page-content flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  const aantalZwareTaken = hulpData?.zwareTaken?.length || 0
  const openHulpvragen = helpRequests.filter(r => r.status !== 'RESOLVED' && r.status !== 'CLOSED').length

  // Bepaal welke categorieën zware taken hebben
  const zwareTaakCategorieen = new Set(
    hulpData?.zwareTaken?.map(t => t.categorie).filter(Boolean) || []
  )

  // Sorteer categorieën: eerst met zware taken, dan de rest
  const gesorteerdeCategorieen = [...ALLE_CATEGORIEEN].sort((a, b) => {
    const aHeeftZwaar = zwareTaakCategorieen.has(a.naam)
    const bHeeftZwaar = zwareTaakCategorieen.has(b.naam)
    if (aHeeftZwaar && !bHeeftZwaar) return -1
    if (!aHeeftZwaar && bHeeftZwaar) return 1
    return 0
  })

  // Split categorieën in voor zorgvrager en voor mantelzorger
  const categorieenZorgvrager = gesorteerdeCategorieen.filter(c => c.voorWie === 'zorgvrager')
  const categorieenMantelzorger = gesorteerdeCategorieen.filter(c => c.voorWie === 'mantelzorger')

  // Helper functie voor locatie string
  const formatLocatie = (loc: LocatieInfo | undefined) => {
    if (!loc) return null
    const parts = [loc.straat, loc.woonplaats || loc.gemeente].filter(Boolean)
    return parts.length > 0 ? parts.join(', ') : null
  }

  const locatieMantelzorger = formatLocatie(hulpData?.locatie?.mantelzorger)
  const locatieZorgvrager = formatLocatie(hulpData?.locatie?.zorgvrager)

  return (
    <div className="ker-page-content">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <span className="text-3xl">💜</span> Hulp
        </h1>
        <p className="text-muted-foreground mt-1">
          Vind hulp bij zorgtaken of stel een vraag
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

      {/* Zware taken badge */}
      {aantalZwareTaken > 0 && (
        <div className="mb-6 p-4 bg-[var(--accent-amber-bg)] rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[var(--accent-amber)] text-white flex items-center justify-center font-bold">
              {aantalZwareTaken}
            </div>
            <div>
              <p className="font-semibold text-foreground">
                {aantalZwareTaken === 1 ? 'Zware zorgtaak' : 'Zware zorgtaken'}
              </p>
              <p className="text-sm text-muted-foreground">
                {hulpData?.zwareTaken?.map(t => t.naam).join(', ')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('bronnen')}
          className={cn(
            "flex-1 py-3 px-4 rounded-xl font-medium text-sm transition-all",
            activeTab === 'bronnen'
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          )}
        >
          Hulpbronnen
        </button>
        <button
          onClick={() => setActiveTab('vragen')}
          className={cn(
            "flex-1 py-3 px-4 rounded-xl font-medium text-sm transition-all relative",
            activeTab === 'vragen'
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          )}
        >
          Mijn vragen
          {openHulpvragen > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-[var(--accent-red)] text-white text-xs rounded-full flex items-center justify-center">
              {openHulpvragen}
            </span>
          )}
        </button>
      </div>

      {/* TAB: Hulpbronnen */}
      {activeTab === 'bronnen' && (
        <div className="space-y-6">
          {/* SECTIE: Hulp voor de zorgvrager */}
          <div className="ker-card">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl">💝</span>
              <div>
                <h2 className="font-semibold text-foreground">Hulp voor je naaste</h2>
                {locatieZorgvrager && (
                  <p className="text-xs text-muted-foreground">📍 {locatieZorgvrager}</p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {categorieenZorgvrager.map((categorie) => {
                const heeftZwareTaak = zwareTaakCategorieen.has(categorie.naam)
                const aantalHulpbronnen = hulpData?.perCategorie?.[categorie.naam]?.length || 0
                const isSelected = selectedCategorie === categorie.naam

                return (
                  <button
                    key={categorie.naam}
                    onClick={() => setSelectedCategorie(isSelected ? null : categorie.naam)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm transition-all border-2",
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary"
                        : heeftZwareTaak
                          ? "bg-[var(--accent-amber-bg)] border-[var(--accent-amber)] text-foreground"
                          : "bg-muted border-transparent hover:bg-muted/80 text-foreground"
                    )}
                  >
                    <span>{categorie.icon}</span>
                    <span>{categorie.kort}</span>
                    <span className="text-xs opacity-70">({aantalHulpbronnen})</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* SECTIE: Hulp voor de mantelzorger */}
          <div className="ker-card">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl">💜</span>
              <div>
                <h2 className="font-semibold text-foreground">Hulp voor jou</h2>
                {locatieMantelzorger && (
                  <p className="text-xs text-muted-foreground">📍 {locatieMantelzorger}</p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {categorieenMantelzorger.map((categorie) => {
                const aantalHulpbronnen = hulpData?.perCategorie?.[categorie.naam]?.length || 0
                const isSelected = selectedCategorie === categorie.naam

                return (
                  <button
                    key={categorie.naam}
                    onClick={() => setSelectedCategorie(isSelected ? null : categorie.naam)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm transition-all border-2",
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-primary/10 border-primary/30 hover:bg-primary/20 text-foreground"
                    )}
                  >
                    <span>{categorie.icon}</span>
                    <span>{categorie.kort}</span>
                    <span className="text-xs opacity-70">({aantalHulpbronnen})</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Geselecteerde categorie */}
          {selectedCategorie && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                  {ALLE_CATEGORIEEN.find(c => c.naam === selectedCategorie)?.icon} {selectedCategorie}
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
                <div className="text-center py-8 text-muted-foreground">
                  <p>Geen hulpbronnen gevonden voor deze categorie</p>
                  <p className="text-sm mt-2">Zoek op Zorgkaart Nederland voor meer opties</p>
                </div>
              )}
            </div>
          )}

          {/* Hulpvraag stellen */}
          <div className="ker-card bg-gradient-to-r from-primary/5 to-primary/10">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <span className="text-xl">🤝</span>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">Vraag hulp</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Stel een vraag aan hulporganisaties of buurtgenoten
                </p>
                <button
                  onClick={() => {
                    setShowHulpvraagForm(true)
                    setActiveTab('vragen')
                  }}
                  className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90"
                >
                  + Nieuwe hulpvraag
                </button>
              </div>
            </div>
          </div>

          {/* Landelijke hulplijnen */}
          {hulpData?.landelijk && hulpData.landelijk.length > 0 && (
            <div className="p-4 bg-muted/50 rounded-xl">
              <p className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                🌍 Landelijke hulplijnen
              </p>
              <div className="space-y-2">
                {hulpData.landelijk.map((hulp, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div>
                      <p className="font-medium text-sm">{hulp.naam}</p>
                      {hulp.soortHulp && (
                        <span className="text-xs text-muted-foreground">{hulp.soortHulp}</span>
                      )}
                    </div>
                    <div className="flex gap-3">
                      {hulp.telefoon && (
                        <a href={`tel:${hulp.telefoon}`} className="text-xs text-primary hover:underline font-medium">
                          📞 {hulp.telefoon}
                        </a>
                      )}
                      {hulp.website && (
                        <a href={hulp.website} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
                          🌐
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Externe zoekoptie */}
          <div className="ker-card">
            <p className="font-medium text-foreground mb-2">Meer hulp zoeken?</p>
            <p className="text-sm text-muted-foreground mb-3">
              Zoek ook in de landelijke sociale kaart
            </p>
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
      )}

      {/* TAB: Mijn vragen */}
      {activeTab === 'vragen' && (
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
      )}
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
