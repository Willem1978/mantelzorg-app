"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button, SmileyGroup } from "@/components/ui"
import { cn } from "@/lib/utils"
import { searchStreets } from "@/lib/pdok"
import { GerAvatar } from "@/components/GerAvatar"
import { AgentChat } from "@/components/ai/AgentChat"

// ============================================
// STREET SEARCH COMPONENT
// ============================================

interface StreetResult {
  weergavenaam: string
  straat: string
  woonplaats: string
  gemeente: string
}

interface StreetSearchProps {
  label: string
  value: StreetResult | null
  onChange: (street: StreetResult | null) => void
  placeholder?: string
  required?: boolean
}

function StreetSearch({ label, value, onChange, placeholder, required }: StreetSearchProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<StreetResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)

  const handleSearch = async (searchQuery: string) => {
    setQuery(searchQuery)
    if (searchQuery.length < 2) {
      setResults([])
      setShowResults(false)
      return
    }
    setIsSearching(true)
    try {
      const searchResults = await searchStreets(searchQuery)
      const mapped: StreetResult[] = searchResults.map((r) => ({
        weergavenaam: r.weergavenaam,
        straat: r.straat || "",
        woonplaats: r.woonplaats || "",
        gemeente: r.gemeente || "",
      }))
      setResults(mapped)
      setShowResults(true)
    } catch {
      setResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const handleSelect = (street: StreetResult) => {
    onChange(street)
    setQuery(`${street.straat}, ${street.woonplaats}`)
    setShowResults(false)
  }

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-foreground mb-2">
        {label}
        {required && <span className="text-[#E53935] ml-1">*</span>}
      </label>
      {value ? (
        <div className="flex items-center gap-3 px-4 py-3 bg-card border-2 border-primary/30 rounded-xl">
          <svg className="w-5 h-5 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="flex-1 text-foreground">{value.straat}, {value.woonplaats}</span>
          <button type="button" onClick={() => { onChange(null); setQuery("") }} className="text-muted-foreground hover:text-foreground p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ) : (
        <div className="relative">
          <input
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => query.length >= 2 && setShowResults(true)}
            placeholder={placeholder || "Vul je straat en plaats in"}
            className="ker-input"
          />
          {isSearching && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
      )}
      {showResults && results.length > 0 && (
        <div className="absolute z-20 w-full mt-2 bg-card border-2 border-border rounded-xl shadow-lg max-h-52 overflow-auto">
          {results.map((result, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSelect(result)}
              className="w-full text-left px-4 py-3 hover:bg-muted transition-colors border-b border-border last:border-b-0"
            >
              <span className="font-medium text-foreground">{result.straat}</span>
              <span className="text-muted-foreground">, {result.woonplaats}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================
// MAIN COMPONENT
// ============================================

type Step = "intro" | "vragen" | "taken-selectie" | "taken-details" | "rapport" | "gegevens" | "account"

interface TaakData {
  isGeselecteerd: boolean
  uren: string
  belasting: string
}

interface GegevensData {
  naam: string
  email: string
  mantelzorgerStraat: StreetResult | null
  zorgvragerStraat: StreetResult | null
}

export default function BelastbaarheidstestPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const isLoggedIn = status === "authenticated" && !!session?.user

  // Content state - fetched from API
  const [belastbaarheidVragen, setBelastbaarheidVragen] = useState<any[]>([])
  const [zorgtaken, setZorgtaken] = useState<any[]>([])
  const [urenOpties, setUrenOpties] = useState<any[]>([])
  const [contentLoading, setContentLoading] = useState(true)
  const [contentError, setContentError] = useState<string | null>(null)
  const hasFetchedContent = useRef(false)

  const [currentStep, setCurrentStep] = useState<Step>("intro")
  const [currentVraagIndex, setCurrentVraagIndex] = useState(0)
  const [currentTaakDetailIndex, setCurrentTaakDetailIndex] = useState(0)
  const [antwoorden, setAntwoorden] = useState<Record<string, string>>({})
  const [taken, setTaken] = useState<Record<string, TaakData>>({})
  const [gegevens, setGegevens] = useState<GegevensData>({
    naam: "",
    email: "",
    mantelzorgerStraat: null,
    zorgvragerStraat: null,
  })
  const [gegevensError, setGegevensError] = useState("")
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Fetch content from API on mount
  useEffect(() => {
    if (hasFetchedContent.current) return
    hasFetchedContent.current = true

    const loadContent = async () => {
      try {
        const [vragenRes, zorgtakenRes, optiesRes] = await Promise.all([
          fetch("/api/content/balanstest-vragen?type=BALANSTEST"),
          fetch("/api/content/zorgtaken"),
          fetch("/api/content/formulier-opties?groep=UREN_BALANSTEST"),
        ])

        if (!vragenRes.ok || !zorgtakenRes.ok || !optiesRes.ok) {
          throw new Error("Fout bij laden van content")
        }

        const vragenData = await vragenRes.json()
        const zorgtakenData = await zorgtakenRes.json()
        const optiesData = await optiesRes.json()

        const mappedVragen = (vragenData.vragen || []).map((v: any) => ({
          id: v.vraagId,
          header: v.sectie,
          headerIntro: v.beschrijving,
          vraag: v.vraagTekst,
          tip: v.tip,
          weegfactor: v.gewicht,
        }))

        const mappedZorgtaken = (zorgtakenData.zorgtaken || []).map((z: any) => ({
          id: z.taakId,
          naam: z.naam,
          beschrijving: z.beschrijving,
        }))

        const mappedOpties = (optiesData.opties || []).map((o: any) => ({
          value: o.waarde,
          label: o.label,
          uren: parseInt(o.beschrijving || "0"),
        }))

        setBelastbaarheidVragen(mappedVragen)
        setZorgtaken(mappedZorgtaken)
        setUrenOpties(mappedOpties)

        // Initialize taken state based on fetched zorgtaken
        const initialTaken: Record<string, TaakData> = {}
        mappedZorgtaken.forEach((t: any) => {
          initialTaken[t.id] = { isGeselecteerd: false, uren: "", belasting: "" }
        })
        setTaken(initialTaken)
      } catch (error) {
        console.error("Error loading content:", error)
        setContentError("Oeps, dat lukte niet. Probeer het opnieuw.")
      } finally {
        setContentLoading(false)
      }
    }

    loadContent()
  }, [])

  const currentVraag = belastbaarheidVragen[currentVraagIndex]
  const totalVragen = belastbaarheidVragen.length
  const geselecteerdeTakenIds = Object.entries(taken)
    .filter(([, data]) => data.isGeselecteerd)
    .map(([id]) => id)
  const currentDetailTaak = geselecteerdeTakenIds[currentTaakDetailIndex]
    ? zorgtaken.find((t) => t.id === geselecteerdeTakenIds[currentTaakDetailIndex])
    : null

  // Check if showing new section header
  const showSectionHeader = currentVraag && (currentVraagIndex === 0 || currentVraag.header !== belastbaarheidVragen[currentVraagIndex - 1]?.header)

  // Score berekeningen
  const berekenScore = () => {
    let totaal = 0
    Object.entries(antwoorden).forEach(([vraagId, antwoord]) => {
      const vraag = belastbaarheidVragen.find((v) => v.id === vraagId)
      if (!vraag) return
      let basisScore = 0
      if (antwoord === "ja") basisScore = 2
      else if (antwoord === "soms") basisScore = 1
      totaal += basisScore * vraag.weegfactor
    })
    return Math.round(totaal)
  }

  const getBelastingNiveau = (score: number) => {
    if (score <= 6) return { niveau: "Laag", kleur: "green", beschrijving: "Je bent goed in balans. Blijf goed voor jezelf zorgen!" }
    if (score <= 12) return { niveau: "Gemiddeld", kleur: "amber", beschrijving: "Let op jezelf. Plan regelmatig rust in." }
    return { niveau: "Hoog", kleur: "red", beschrijving: "Je hebt ondersteuning nodig. Neem contact op met je huisarts." }
  }

  const berekenTotaleUren = () => {
    let totaal = 0
    Object.values(taken).forEach((taak) => {
      if (taak.isGeselecteerd && taak.uren) {
        const optie = urenOpties.find((o) => o.value === taak.uren)
        if (optie) totaal += optie.uren
      }
    })
    return totaal
  }

  // Handlers
  const handleAntwoord = (value: string) => {
    if (isTransitioning) return
    setAntwoorden((prev) => ({ ...prev, [currentVraag.id]: value }))
    setIsTransitioning(true)
    setTimeout(() => {
      if (currentVraagIndex < totalVragen - 1) {
        setCurrentVraagIndex((prev) => prev + 1)
      } else {
        setCurrentStep("taken-selectie")
      }
      setIsTransitioning(false)
    }, 2000) // 2 seconden - beter voor ouderen
  }

  const handleTaakToggle = (taakId: string) => {
    setTaken((prev) => ({
      ...prev,
      [taakId]: {
        ...prev[taakId],
        isGeselecteerd: !prev[taakId].isGeselecteerd,
        ...(!prev[taakId].isGeselecteerd ? {} : { uren: "", belasting: "" }),
      },
    }))
  }

  const handleUrenSelect = (value: string) => {
    if (isTransitioning || !currentDetailTaak) return
    setTaken((prev) => ({
      ...prev,
      [currentDetailTaak.id]: { ...prev[currentDetailTaak.id], uren: value },
    }))
  }

  const handleBelastingSelect = (value: string) => {
    if (isTransitioning || !currentDetailTaak) return
    setTaken((prev) => ({
      ...prev,
      [currentDetailTaak.id]: { ...prev[currentDetailTaak.id], belasting: value },
    }))
  }

  const handleTaakDetailVolgende = () => {
    if (!currentDetailTaak) return
    const taakData = taken[currentDetailTaak.id]
    if (!taakData.uren || !taakData.belasting) return

    setIsTransitioning(true)
    setTimeout(() => {
      if (currentTaakDetailIndex < geselecteerdeTakenIds.length - 1) {
        setCurrentTaakDetailIndex((prev) => prev + 1)
      } else {
        setCurrentStep("rapport")
      }
      setIsTransitioning(false)
    }, 300)
  }

  const handleGegevensSubmit = async () => {
    setGegevensError("")
    if (!gegevens.naam.trim()) { setGegevensError("Vul je naam in"); return }
    if (!gegevens.email.trim() || !gegevens.email.includes("@")) { setGegevensError("Vul een geldig e-mailadres in"); return }
    if (!gegevens.mantelzorgerStraat) { setGegevensError("Kies je adres uit de lijst. Begin met typen en tik op het juiste adres."); return }
    if (!gegevens.zorgvragerStraat) { setGegevensError("Kies het adres van je naaste uit de lijst. Begin met typen en tik op het juiste adres."); return }
    setCurrentStep("account")
  }

  // Handler voor ingelogde gebruikers - direct opslaan zonder gegevens formulier
  const handleSaveForLoggedInUser = async () => {
    setIsSaving(true)
    const score = berekenScore()
    const niveau = getBelastingNiveau(score)
    const totaleUren = berekenTotaleUren()

    try {
      const response = await fetch("/api/belastbaarheidstest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // Gebruik sessie gegevens - backend haalt dit uit de sessie
          registratie: {
            voornaam: session?.user?.name || "",
            email: session?.user?.email || "",
            postcode: "",
            huisnummer: "",
            woonplaats: "",
            gemeente: "",
            woonplaatsNaaste: "",
            gemeenteNaaste: "",
          },
          antwoorden,
          taken,
          score,
          niveau: niveau.niveau,
          totaleUren,
        }),
      })

      // Wacht op response en check of opslaan gelukt is
      if (response.ok) {
        const result = await response.json()
        // Kleine vertraging om database tijd te geven
        await new Promise(resolve => setTimeout(resolve, 100))
      } else {
        console.error("Fout bij opslaan test:", response.status)
      }

      // Redirect naar persoonlijk advies na opslaan
      router.push("/rapport/persoonlijk")
    } catch (error) {
      console.error("Error saving test:", error)
      // Bij error toch naar advies pagina
      router.push("/rapport/persoonlijk")
    }
    setIsSaving(false)
  }

  const handleAccountKeuze = async (keuze: "register" | "login" | "gast") => {
    setIsSaving(true)
    const score = berekenScore()
    const niveau = getBelastingNiveau(score)
    const totaleUren = berekenTotaleUren()

    const testData = {
      gegevens,
      antwoorden,
      taken,
      score,
      niveau: niveau.niveau,
      totaleUren,
      completedAt: new Date().toISOString(),
    }
    localStorage.setItem("belastbaarheidstest_result", JSON.stringify(testData))

    try {
      await fetch("/api/belastbaarheidstest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registratie: {
            voornaam: gegevens.naam,
            email: gegevens.email,
            postcode: "",
            huisnummer: "",
            woonplaats: gegevens.mantelzorgerStraat?.woonplaats || "",
            gemeente: gegevens.mantelzorgerStraat?.gemeente || "",
            woonplaatsNaaste: gegevens.zorgvragerStraat?.woonplaats || "",
            gemeenteNaaste: gegevens.zorgvragerStraat?.gemeente || "",
          },
          antwoorden,
          taken,
          score,
          niveau: niveau.niveau,
          totaleUren,
        }),
      })
    } catch { /* ignore */ }

    if (keuze === "register") router.push("/register?from=test")
    else if (keuze === "login") router.push("/login?from=test")
    else router.push("/rapport-gast")
    setIsSaving(false)
  }

  // ============================================
  // RENDER - LOADING
  // ============================================

  if (contentLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Laden...</p>
        </div>
      </div>
    )
  }

  if (contentError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <p className="text-foreground font-medium mb-2">Oeps, dat lukte niet</p>
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

  // ============================================
  // RENDER - INTRO
  // ============================================

  if (currentStep === "intro") {
    return (
      <div className="min-h-screen bg-background flex flex-col lg:flex-row">
        {/* Desktop: linker kolom met Ger en welkomstboodschap */}
        <div className="lg:w-1/2 lg:bg-primary/5 lg:flex lg:flex-col lg:justify-center lg:items-center lg:p-12">
          {/* Mobiel: Header met Ger */}
          <div className="px-4 pt-8 pb-4 lg:p-0 lg:text-center lg:max-w-md">
            <div className="flex items-start gap-4 lg:flex-col lg:items-center lg:gap-6">
              <GerAvatar size="lg" className="lg:w-32 lg:h-32" animate />
              <div className="pt-2 lg:pt-0">
                <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Goedendag!</h1>
                <p className="text-muted-foreground mt-1 lg:mt-3 lg:text-lg">
                  Mijn naam is Ger en ik ben jouw digitale mantelzorgmaatje van MantelBuddy.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Rechter kolom / Content */}
        <div className="flex-1 lg:flex lg:flex-col lg:justify-center lg:items-center lg:p-12">
          <main className="px-4 pb-32 lg:px-0 lg:pb-8 lg:w-full lg:max-w-lg">
            <div className="max-w-md mx-auto lg:mx-0 lg:max-w-none">
              <div className="ker-card lg:shadow-lg">
              <h2 className="font-bold text-foreground text-lg mb-4">
                Welkom bij de Balanstest
              </h2>

              <div className="space-y-4 text-foreground">
                <p>
                  Deze test helpt je om te zien hoe zwaar de zorg voor jou is.
                  Het duurt ongeveer 5 minuten.
                </p>

                <div className="bg-muted rounded-xl p-4">
                  <p className="font-medium mb-2">De test heeft 2 delen:</p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-primary">1.</span>
                      <span>Vragen over hoe je je voelt. Over je energie, je gevoel en je tijd.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-primary">2.</span>
                      <span>Vragen over wat je doet voor je naaste. Welke taken en hoeveel uur.</span>
                    </li>
                  </ul>
                </div>

                <p className="font-medium text-primary">
                  Er zijn geen goede of foute antwoorden. Het gaat om hoe je het ervaart.
                </p>
              </div>

              {/* Desktop: knoppen in de card */}
              <div className="hidden lg:flex items-center justify-between gap-4 mt-8">
                <button
                  onClick={() => router.back()}
                  className="ker-btn ker-btn-secondary flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  terug
                </button>

                <button
                  onClick={() => setCurrentStep("vragen")}
                  className="ker-btn ker-btn-primary flex items-center gap-2"
                >
                  start test
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
              </div>
            </div>
          </main>
        </div>

        {/* Mobiel: Footer met terug en start knoppen */}
        <footer className="fixed bottom-0 left-0 right-0 bg-background p-4 lg:hidden">
          <div className="max-w-md mx-auto flex items-center justify-between gap-4">
            <button
              onClick={() => router.back()}
              className="ker-btn ker-btn-secondary flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              terug
            </button>

            <button
              onClick={() => setCurrentStep("vragen")}
              className="ker-btn ker-btn-primary flex items-center gap-2"
            >
              start test
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </footer>
      </div>
    )
  }

  // ============================================
  // RENDER - VRAGEN
  // ============================================

  if (currentStep === "vragen") {
    return (
      <div className="min-h-screen bg-background flex flex-col lg:flex-row">
        {/* Desktop: linker kolom met Ger en sectie */}
        <div className="lg:w-1/2 lg:bg-primary/5 lg:flex lg:flex-col lg:justify-center lg:items-center lg:p-12">
          {/* Progress pill */}
          <div className="flex justify-center pt-6 pb-4 lg:pt-0 lg:pb-6">
            <div className="ker-pill lg:text-base lg:px-6 lg:py-2">
              vraag <span className="font-bold mx-1">{currentVraagIndex + 1}</span> van {totalVragen}
            </div>
          </div>

          {/* Header met Ger en sectie titel */}
          <div className="px-4 pb-4 lg:p-0 lg:text-center lg:max-w-md">
            <div className="flex items-start gap-4 lg:flex-col lg:items-center lg:gap-6">
              <GerAvatar size="md" className="lg:w-24 lg:h-24" />
              <div className="pt-1 lg:pt-0">
                <h2 className="text-xl lg:text-2xl font-bold text-foreground">{currentVraag.header}</h2>
                {showSectionHeader && currentVraag.headerIntro && (
                  <p className="text-muted-foreground text-sm lg:text-base mt-1 lg:mt-3">{currentVraag.headerIntro}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Rechter kolom / Vraag card */}
        <div className="flex-1 lg:flex lg:flex-col lg:justify-center lg:items-center lg:p-12">
          <main className="px-4 pb-32 lg:px-0 lg:pb-8 lg:w-full lg:max-w-lg">
            <div className="max-w-md mx-auto lg:mx-0 lg:max-w-none">
              <div className="ker-card lg:shadow-lg">
              <p className="text-foreground text-center text-lg mb-8">
                {currentVraag.vraag}
              </p>

              {/* Smiley knoppen */}
              <div className="mb-8">
                <SmileyGroup
                  value={antwoorden[currentVraag.id] as "nee" | "soms" | "ja" | null}
                  onChange={(val) => handleAntwoord(val)}
                  disabled={isTransitioning}
                  size="lg"
                />
              </div>

              {/* Tip */}
              {currentVraag.tip && (
                <div className="flex items-start gap-3 p-4 bg-muted rounded-xl">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <span className="text-primary-foreground text-sm font-bold">i</span>
                  </div>
                  <p className="text-sm lg:text-base text-foreground">{currentVraag.tip}</p>
                </div>
              )}

              {/* Desktop: terug knop in de card */}
              <div className="hidden lg:flex justify-center mt-8">
                <button
                  onClick={() => currentVraagIndex > 0 ? setCurrentVraagIndex(prev => prev - 1) : setCurrentStep("intro")}
                  className="ker-btn ker-btn-secondary flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  terug
                </button>
              </div>
              </div>
            </div>
          </main>
        </div>

        {/* Mobiel: Footer - alleen terug knop */}
        <footer className="fixed bottom-0 left-0 right-0 bg-background p-4 lg:hidden">
          <div className="max-w-md mx-auto flex items-center justify-center">
            <button
              onClick={() => currentVraagIndex > 0 ? setCurrentVraagIndex(prev => prev - 1) : setCurrentStep("intro")}
              className="ker-btn ker-btn-secondary flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              terug
            </button>
          </div>
        </footer>
      </div>
    )
  }

  // ============================================
  // RENDER - TAKEN SELECTIE
  // ============================================

  if (currentStep === "taken-selectie") {
    return (
      <div className="min-h-screen bg-background">
        {/* Header met Ger */}
        <div className="px-4 pt-8 pb-4">
          <div className="max-w-md mx-auto flex items-start gap-4">
            <GerAvatar size="md" />
            <div className="pt-1">
              <h2 className="text-xl font-bold text-foreground">Wat doe je voor je naaste?</h2>
              <p className="text-muted-foreground text-sm mt-1">
                Vink aan welke taken je doet. Je mag meerdere dingen aankruisen.
              </p>
            </div>
          </div>
        </div>

        {/* Taken lijst */}
        <main className="px-4 pb-32">
          <div className="max-w-md mx-auto">
            <div className="ker-card">
              <p className="text-sm text-muted-foreground mb-4">
                Klik op een taak om deze te selecteren. Daarna vragen we hoeveel tijd dit kost.
              </p>
              <div className="space-y-3">
                {zorgtaken.map((taak) => (
                  <button
                    key={taak.id}
                    onClick={() => handleTaakToggle(taak.id)}
                    className={cn(
                      "w-full flex items-center gap-4 p-4 rounded-xl transition-all text-left border-2",
                      taken[taak.id].isGeselecteerd
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/30"
                    )}
                  >
                    <div className={cn(
                      "ker-radio flex-shrink-0",
                      taken[taak.id].isGeselecteerd && "selected"
                    )}>
                      {taken[taak.id].isGeselecteerd && (
                        <svg className="w-4 h-4 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{taak.naam}</p>
                      <p className="text-sm text-muted-foreground">{taak.beschrijving}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </main>

        {/* Footer met terug en verder knoppen */}
        <footer className="fixed bottom-0 left-0 right-0 bg-background p-4">
          <div className="max-w-md mx-auto flex items-center justify-between gap-4">
            <button
              onClick={() => setCurrentStep("vragen")}
              className="ker-btn ker-btn-secondary flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              terug
            </button>

            <button
              onClick={() => {
                const selectedTasks = zorgtaken.filter(t => taken[t.id].isGeselecteerd)
                if (selectedTasks.length > 0) {
                  setCurrentStep("taken-details")
                } else {
                  setCurrentStep("rapport")
                }
              }}
              className="ker-btn ker-btn-primary flex items-center gap-2"
            >
              verder
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </footer>
      </div>
    )
  }

  // ============================================
  // RENDER - TAKEN DETAILS
  // ============================================

  if (currentStep === "taken-details" && currentDetailTaak) {
    const taakData = taken[currentDetailTaak.id]

    return (
      <div className="min-h-screen bg-background">
        {/* Progress pill */}
        <div className="flex justify-center pt-6 pb-4">
          <div className="ker-pill">
            vraag <span className="font-bold mx-1">{currentTaakDetailIndex + 1}</span> van {geselecteerdeTakenIds.length}
          </div>
        </div>

        {/* Header met Ger */}
        <div className="px-4 pb-4">
          <div className="max-w-md mx-auto flex items-start gap-4">
            <GerAvatar size="md" />
            <div className="pt-1">
              <h2 className="text-xl font-bold text-foreground">{currentDetailTaak.naam}</h2>
            </div>
          </div>
        </div>

        {/* Uren vraag */}
        <main className="px-4 pb-32">
          <div className="max-w-md mx-auto space-y-4">
            <div className="ker-card">
              <p className="text-foreground mb-6">
                Hoeveel uur <span className="font-bold">per week</span> ben jij bezig met {currentDetailTaak.naam.toLowerCase()} voor je naaste?
              </p>

              <div className="space-y-2">
                {urenOpties.map((optie) => (
                  <button
                    key={optie.value}
                    onClick={() => handleUrenSelect(optie.value)}
                    className={cn(
                      "w-full flex items-center gap-4 p-4 rounded-xl transition-all text-left border-2",
                      taakData.uren === optie.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/30"
                    )}
                  >
                    <div className={cn(
                      "ker-radio flex-shrink-0",
                      taakData.uren === optie.value && "selected"
                    )} />
                    <span className="text-foreground">{optie.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Belasting vraag */}
            <div className="ker-card">
              <p className="text-foreground text-center mb-6">
                Vind je {currentDetailTaak.naam.toLowerCase()} een <span className="font-bold">zware taak</span>?
              </p>

              <SmileyGroup
                value={taakData.belasting as "nee" | "soms" | "ja" | null}
                onChange={(val) => handleBelastingSelect(val)}
                size="lg"
              />
            </div>
          </div>
        </main>

        {/* Footer met terug en verder knoppen */}
        <footer className="fixed bottom-0 left-0 right-0 bg-background p-4">
          <div className="max-w-md mx-auto flex items-center justify-between gap-4">
            <button
              onClick={() => currentTaakDetailIndex > 0 ? setCurrentTaakDetailIndex(prev => prev - 1) : setCurrentStep("taken-selectie")}
              className="ker-btn ker-btn-secondary flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              terug
            </button>

            <button
              onClick={handleTaakDetailVolgende}
              disabled={!taakData.uren || !taakData.belasting}
              className={cn(
                "ker-btn flex items-center gap-2",
                taakData.uren && taakData.belasting ? "ker-btn-primary" : "ker-btn-secondary opacity-50"
              )}
            >
              {currentTaakDetailIndex < geselecteerdeTakenIds.length - 1 ? "volgende" : "bekijk rapport"}
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </footer>
      </div>
    )
  }

  // ============================================
  // RENDER - RAPPORT
  // ============================================

  if (currentStep === "rapport") {
    const score = berekenScore()
    const niveau = getBelastingNiveau(score)
    const totaleUren = berekenTotaleUren()
    const zwareTaken = Object.entries(taken)
      .filter(([, data]) => data.isGeselecteerd)
      .map(([taakId]) => zorgtaken.find((t) => t.id === taakId)!)
      .filter(Boolean)

    return (
      <div className="min-h-screen bg-background">
        {/* Header met Ger */}
        <div className="px-4 pt-8 pb-4">
          <div className="max-w-md mx-auto flex items-start gap-4">
            <GerAvatar size="md" />
            <div className="pt-1">
              <h2 className="text-xl font-bold text-foreground">Jouw resultaat</h2>
              <p className="text-muted-foreground text-sm mt-1">
                Hieronder zie je hoe zwaar de zorg voor jou is. Dit is geen oordeel, maar een hulpmiddel.
              </p>
            </div>
          </div>
        </div>

        {/* Resultaat */}
        <main className="px-4 pb-32">
          <div className="max-w-md mx-auto space-y-4">
            {/* Uitleg */}
            <div className="bg-primary/5 rounded-xl p-4">
              <p className="text-sm text-foreground">
                <span className="font-medium">Wat betekent dit?</span> Hoe hoger je score, hoe meer de zorg
                je belast. Een hoge score is geen falen. Het betekent dat je hulp kunt gebruiken.
              </p>
            </div>

            {/* Score card */}
            <div className={cn(
              "ker-card text-center",
              niveau.kleur === "green" && "bg-[#E8F5E9]",
              niveau.kleur === "amber" && "bg-[#FFF8E1]",
              niveau.kleur === "red" && "bg-[#FFEBEE]"
            )}>
              <div className={cn(
                "w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl font-bold text-white",
                niveau.kleur === "green" && "bg-[#4CAF50]",
                niveau.kleur === "amber" && "bg-[#FF9800]",
                niveau.kleur === "red" && "bg-[#F44336]"
              )}>
                {score}
              </div>
              <h3 className={cn(
                "text-xl font-bold mb-2",
                niveau.kleur === "green" && "text-[#2E7D32]",
                niveau.kleur === "amber" && "text-[#F57C00]",
                niveau.kleur === "red" && "text-[#C62828]"
              )}>
                {niveau.niveau} belasting
              </h3>
              <p className="text-foreground">{niveau.beschrijving}</p>
            </div>

            {/* Uren overzicht */}
            {totaleUren > 0 && (
              <div className="ker-card">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Geschatte zorgtijd per week</span>
                  <span className="text-xl font-bold text-foreground">{totaleUren} uur</span>
                </div>
              </div>
            )}

            {/* Taken overzicht */}
            {zwareTaken.length > 0 && (
              <div className="ker-card">
                <h4 className="font-bold text-foreground mb-3">Jouw zorgtaken</h4>
                <div className="space-y-2">
                  {zwareTaken.map((taak) => {
                    const taakData = taken[taak.id]
                    const urenLabel = urenOpties.find(o => o.value === taakData.uren)?.label || ""
                    return (
                      <div key={taak.id} className="flex items-center justify-between text-sm">
                        <span className="text-foreground">{taak.naam}</span>
                        <span className="text-muted-foreground">{urenLabel}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Tip */}
            <div className="ker-card bg-muted">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                  <span className="text-primary-foreground text-sm font-bold">i</span>
                </div>
                <div>
                  <p className="font-medium text-foreground mb-1">Tip voor jou</p>
                  <p className="text-sm text-foreground">
                    {niveau.kleur === "red"
                      ? "Neem vandaag nog contact op met je huisarts of MantelzorgNL (030-659 98 98)."
                      : niveau.kleur === "amber"
                      ? "Plan deze week een moment voor jezelf. Al is het maar 15 minuten."
                      : "Blijf goed voor jezelf zorgen en vraag om hulp als het nodig is."}
                  </p>
                </div>
              </div>
            </div>

            {/* Persoonlijk advies van Ger (Balanscoach) */}
            {isLoggedIn && (
              <AgentChat
                apiEndpoint="/api/ai/balanscoach"
                title="Persoonlijk advies van Ger"
                initialMessage={`Hier zijn mijn balanstest resultaten:\n- Score: ${score} van 24\n- Niveau: ${niveau.niveau}\n- Zorgtijd: ${totaleUren} uur per week\n- Zorgtaken: ${zwareTaken.map(t => t.naam).join(", ") || "geen geselecteerd"}\n\nGeef me persoonlijk advies.`}
              />
            )}
          </div>
        </main>

        {/* Footer */}
        <footer className="fixed bottom-0 left-0 right-0 bg-background p-4">
          <div className="max-w-md mx-auto">
            {isLoggedIn ? (
              <button
                onClick={handleSaveForLoggedInUser}
                disabled={isSaving}
                className="ker-btn ker-btn-primary w-full"
              >
                {isSaving ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                    Opslaan...
                  </span>
                ) : (
                  "Rapport opslaan"
                )}
              </button>
            ) : (
              <button
                onClick={() => setCurrentStep("gegevens")}
                className="ker-btn ker-btn-primary w-full"
              >
                Rapport opslaan
              </button>
            )}
          </div>
        </footer>
      </div>
    )
  }

  // ============================================
  // RENDER - GEGEVENS
  // ============================================

  if (currentStep === "gegevens") {
    return (
      <div className="min-h-screen bg-background">
        {/* Header met Ger */}
        <div className="px-4 pt-8 pb-4">
          <div className="max-w-md mx-auto flex items-start gap-4">
            <GerAvatar size="md" />
            <div className="pt-1">
              <h2 className="text-xl font-bold text-foreground">Sla je resultaat op</h2>
              <p className="text-muted-foreground text-sm mt-1">
                Vul je gegevens in. Dan kunnen we je resultaat bewaren.
              </p>
            </div>
          </div>
        </div>

        {/* Formulier */}
        <main className="px-4 pb-32">
          <div className="max-w-md mx-auto">
            <div className="ker-card">
              <p className="text-foreground mb-4">
                We slaan je resultaat op. Zo kun je later zien hoe het met je gaat.
                Je krijgt ook een link per e-mail.
              </p>

              <div className="bg-muted rounded-xl p-3 mb-6">
                <p className="text-sm text-muted-foreground">
                  Je adres hebben we nodig om hulp bij jou in de buurt te vinden.
                </p>
              </div>

              <p className="font-medium text-foreground mb-4">Vul hier je gegevens in:</p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Je naam</label>
                  <input
                    value={gegevens.naam}
                    onChange={(e) => setGegevens((prev) => ({ ...prev, naam: e.target.value }))}
                    placeholder="Vul je naam in"
                    className="ker-input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">E-mailadres</label>
                  <input
                    type="email"
                    value={gegevens.email}
                    onChange={(e) => setGegevens((prev) => ({ ...prev, email: e.target.value }))}
                    placeholder="Vul je e-mailadres in"
                    className="ker-input"
                  />
                </div>

                <div>
                  <StreetSearch
                    label="Jouw adres"
                    value={gegevens.mantelzorgerStraat}
                    onChange={(straat) => setGegevens((prev) => ({ ...prev, mantelzorgerStraat: straat }))}
                    placeholder="Vul je straat of postcode in"
                  />
                </div>

                <div className="pt-2">
                  <StreetSearch
                    label="Vul de woonplaats van je naaste hier in"
                    value={gegevens.zorgvragerStraat}
                    onChange={(straat) => setGegevens((prev) => ({ ...prev, zorgvragerStraat: straat }))}
                    placeholder="Vul je straat of postcode in"
                  />
                </div>

                {gegevensError && (
                  <div className="p-4 bg-[#FFEBEE] border-2 border-[#F44336] rounded-xl">
                    <p className="text-[#C62828] text-sm">{gegevensError}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>

        {/* Footer met terug en opslaan knoppen */}
        <footer className="fixed bottom-0 left-0 right-0 bg-background p-4">
          <div className="max-w-md mx-auto flex items-center justify-between gap-4">
            <button
              onClick={() => setCurrentStep("rapport")}
              className="ker-btn ker-btn-secondary flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              terug
            </button>

            <button
              onClick={handleGegevensSubmit}
              disabled={isSaving}
              className="ker-btn ker-btn-primary flex items-center gap-2"
            >
              {isSaving ? "even geduld..." : "opslaan"}
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </button>
          </div>
        </footer>
      </div>
    )
  }

  // ============================================
  // RENDER - ACCOUNT KEUZE
  // ============================================

  return (
    <div className="min-h-screen bg-background">
      {/* Header met Ger */}
      <div className="px-4 pt-8 pb-4">
        <div className="max-w-md mx-auto flex items-start gap-4">
          <GerAvatar size="md" />
          <div className="pt-1">
            <h2 className="text-xl font-bold text-foreground">Bijna klaar!</h2>
            <p className="text-muted-foreground text-sm mt-1">
              Je resultaat is klaar. Kies hoe je verder wilt.
            </p>
          </div>
        </div>
      </div>

      {/* Opties */}
      <main className="px-4 pb-8">
        <div className="max-w-md mx-auto space-y-3">
          <p className="text-sm text-muted-foreground mb-2">
            Met een account kun je je resultaten bewaren en hulp bij jou in de buurt vinden.
          </p>
          <button
            onClick={() => handleAccountKeuze("register")}
            disabled={isSaving}
            className="w-full bg-card rounded-2xl p-4 text-left shadow-sm hover:shadow-md transition-all border-2 border-border hover:border-primary/50"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#F3E8F5] flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-bold text-foreground">Account aanmaken</p>
                <p className="text-sm text-muted-foreground">Sla je resultaat op en volg je voortgang</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => handleAccountKeuze("login")}
            disabled={isSaving}
            className="w-full bg-card rounded-2xl p-4 text-left shadow-sm hover:shadow-md transition-all border-2 border-border hover:border-primary/50"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#F3E8F5] flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-bold text-foreground">Ik heb al een account</p>
                <p className="text-sm text-muted-foreground">Koppel je rapport aan je account</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => handleAccountKeuze("gast")}
            disabled={isSaving}
            className="w-full bg-card rounded-2xl p-4 text-left shadow-sm hover:shadow-md transition-all border-2 border-border hover:border-primary/50"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#F3E8F5] flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-bold text-foreground">Verder als gast</p>
                <p className="text-sm text-muted-foreground">Bekijk je rapport nu</p>
              </div>
            </div>
          </button>

          {isSaving && (
            <div className="flex justify-center py-4">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
