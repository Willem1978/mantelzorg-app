"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui"
import { cn } from "@/lib/utils"
import { searchStreets } from "@/lib/pdok"
import { GerAvatar } from "@/components/GerAvatar"

// ============================================
// CONFIGURATIE - VRAGEN & TAKEN
// ============================================

const belastbaarheidVragen = [
  // SECTIE: Jouw energie
  {
    id: "q1",
    header: "Jouw energie",
    headerIntro: "Eerst een paar vragen aan jou over hoe jij je lichamelijk voelt.",
    vraag: "Slaap je minder goed door de zorg voor je naaste?",
    tip: "Veel mantelzorgers merken dat hun slaap onrustig wordt door piekeren of nachtelijke zorgtaken.",
    weegfactor: 1.5,
  },
  {
    id: "q2",
    header: "Jouw energie",
    vraag: "Heb je last van je lichaam door het zorgen?",
    tip: "Fysieke klachten zoals rugpijn of vermoeidheid komen veel voor bij mantelzorgers.",
    weegfactor: 1.0,
  },
  {
    id: "q3",
    header: "Jouw energie",
    vraag: "Kost het zorgen veel tijd en energie?",
    tip: "Het is normaal om dit te ervaren. Zorg goed voor jezelf.",
    weegfactor: 1.0,
  },
  // SECTIE: Jouw gevoel
  {
    id: "q4",
    header: "Jouw gevoel",
    headerIntro: "Nu een paar vragen over hoe jij je emotioneel voelt.",
    vraag: "Is de band met je naaste veranderd?",
    tip: "Relaties veranderen door ziekte. Dat is normaal en soms lastig.",
    weegfactor: 1.5,
  },
  {
    id: "q5",
    header: "Jouw gevoel",
    vraag: "Maakt het gedrag van je naaste je verdrietig, bang of boos?",
    tip: "Deze gevoelens zijn heel begrijpelijk en komen veel voor.",
    weegfactor: 1.5,
  },
  {
    id: "q6",
    header: "Jouw gevoel",
    vraag: "Heb je verdriet dat je naaste anders is dan vroeger?",
    tip: "Rouwen om wie iemand was is een normaal onderdeel van mantelzorg.",
    weegfactor: 1.0,
  },
  {
    id: "q7",
    header: "Jouw gevoel",
    vraag: "Slokt de zorg al je energie op?",
    tip: "Als dit zo voelt, is het belangrijk om hulp te zoeken.",
    weegfactor: 1.5,
  },
  // SECTIE: Jouw tijd
  {
    id: "q8",
    header: "Jouw tijd",
    headerIntro: "Tot slot een paar vragen over je tijd en je eigen leven.",
    vraag: "Pas je je dagelijks leven aan voor de zorg?",
    tip: "Aanpassingen zijn normaal, maar vergeet jezelf niet.",
    weegfactor: 1.0,
  },
  {
    id: "q9",
    header: "Jouw tijd",
    vraag: "Pas je regelmatig je plannen aan om te helpen?",
    tip: "Flexibiliteit is mooi, maar je eigen plannen tellen ook.",
    weegfactor: 1.0,
  },
  {
    id: "q10",
    header: "Jouw tijd",
    vraag: "Kom je niet meer toe aan dingen die je leuk vindt?",
    tip: "Tijd voor jezelf is geen luxe, maar noodzaak.",
    weegfactor: 1.0,
  },
  {
    id: "q11",
    header: "Jouw tijd",
    vraag: "Kost het zorgen net zoveel tijd als je werk?",
    tip: "Mantelzorg is ook werk. Gun jezelf erkenning hiervoor.",
    weegfactor: 1.5,
  },
]

const zorgtaken = [
  { id: "t1", naam: "Administratie en geldzaken", beschrijving: "Rekeningen, post, verzekeringen" },
  { id: "t2", naam: "Regelen en afspraken maken", beschrijving: "Arts, thuiszorg, dagbesteding" },
  { id: "t3", naam: "Boodschappen doen", beschrijving: "Supermarkt, apotheek" },
  { id: "t4", naam: "Bezoek en gezelschap", beschrijving: "Gesprekken, uitjes, wandelen" },
  { id: "t5", naam: "Vervoer naar afspraken", beschrijving: "Ziekenhuis, huisarts, familie" },
  { id: "t6", naam: "Persoonlijke verzorging", beschrijving: "Wassen, aankleden, medicijnen" },
  { id: "t7", naam: "Eten en drinken", beschrijving: "Koken, maaltijden, dieet" },
  { id: "t8", naam: "Huishouden", beschrijving: "Schoonmaken, was, opruimen" },
  { id: "t9", naam: "Klusjes in en om huis", beschrijving: "Reparaties, tuin, onderhoud" },
]

const urenOpties = [
  { value: "0-2", label: "Tot 2 uur per week", uren: 1 },
  { value: "2-4", label: "2 tot 4 uur per week", uren: 3 },
  { value: "4-8", label: "4 tot 8 uur per week", uren: 6 },
  { value: "8-12", label: "8 tot 12 uur per week", uren: 10 },
  { value: "12-24", label: "12 tot 24 uur per week", uren: 18 },
  { value: "24+", label: "Meer dan 24 uur per week", uren: 30 },
]

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
            placeholder={placeholder || "Zoek op straatnaam"}
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

  const [currentStep, setCurrentStep] = useState<Step>("intro")
  const [currentVraagIndex, setCurrentVraagIndex] = useState(0)
  const [currentTaakDetailIndex, setCurrentTaakDetailIndex] = useState(0)
  const [antwoorden, setAntwoorden] = useState<Record<string, string>>({})
  const [taken, setTaken] = useState<Record<string, TaakData>>(() => {
    const initial: Record<string, TaakData> = {}
    zorgtaken.forEach((t) => {
      initial[t.id] = { isGeselecteerd: false, uren: "", belasting: "" }
    })
    return initial
  })
  const [gegevens, setGegevens] = useState<GegevensData>({
    naam: "",
    email: "",
    mantelzorgerStraat: null,
    zorgvragerStraat: null,
  })
  const [gegevensError, setGegevensError] = useState("")
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

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
    }, 500)
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
    if (!gegevens.mantelzorgerStraat) { setGegevensError("Selecteer je adres via de zoekfunctie"); return }
    if (!gegevens.zorgvragerStraat) { setGegevensError("Selecteer de woonplaats van je naaste via de zoekfunctie"); return }
    setCurrentStep("account")
  }

  // Handler voor ingelogde gebruikers - direct opslaan zonder gegevens formulier
  const handleSaveForLoggedInUser = async () => {
    setIsSaving(true)
    const score = berekenScore()
    const niveau = getBelastingNiveau(score)
    const totaleUren = berekenTotaleUren()

    // Debug: log taken data
    console.log("=== Frontend: Opslaan test ===")
    console.log("Taken state:", taken)
    console.log("Geselecteerde taken:", Object.entries(taken).filter(([, d]) => d.isGeselecteerd))

    try {
      const response = await fetch("/api/belastbaarheidstest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // Gebruik sessie gegevens - backend haalt dit uit de sessie
          registratie: {
            voornaam: session?.user?.name || "",
            email: session?.user?.email || "",
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
        console.log("Test opgeslagen:", result)
        // Kleine vertraging om database tijd te geven
        await new Promise(resolve => setTimeout(resolve, 100))
      } else {
        console.error("Fout bij opslaan test:", response.status)
      }

      // Redirect naar dashboard na opslaan
      router.push("/dashboard?from=test")
    } catch (error) {
      console.error("Error saving test:", error)
      // Bij error toch naar dashboard
      router.push("/dashboard")
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
  // RENDER - INTRO
  // ============================================

  if (currentStep === "intro") {
    return (
      <div className="min-h-screen bg-background">
        {/* Header met Ger */}
        <div className="px-4 pt-8 pb-4">
          <div className="max-w-md mx-auto flex items-start gap-4">
            <GerAvatar size="lg" />
            <div className="pt-2">
              <h1 className="text-2xl font-bold text-foreground">Goedendag!</h1>
              <p className="text-muted-foreground mt-1">
                Mijn naam is Ger van KER en ik ben jouw digitale mantelzorgconsulent.
              </p>
            </div>
          </div>
        </div>

        {/* Content card */}
        <main className="px-4 pb-32">
          <div className="max-w-md mx-auto">
            <div className="ker-card">
              <h2 className="font-bold text-foreground text-lg mb-4">
                Welkom bij de Mantelzorg Balanstest!
              </h2>

              <div className="space-y-4 text-foreground">
                <p>
                  In deel 1 krijg je vragen over hoe jij je voelt, hoeveel energie je hebt en of je tijd voor jezelf hebt. Zo zie je snel wat de zorg voor je naaste met jou doet.
                </p>
                <p>
                  In deel 2 krijg je vragen wat je voor je naaste doet. Help je meer mensen? Tel dan de taken en uren die je maakt bij elkaar op.
                </p>
                <p className="font-medium">
                  Er zijn geen goede of foute antwoorden. Het gaat alleen om jouw eigen ervaring.
                </p>
                <p className="text-muted-foreground text-sm">
                  Onder elke vraag staat ook een weetje voor jou als mantelzorger.
                </p>
              </div>
            </div>
          </div>
        </main>

        {/* Footer buttons */}
        <footer className="fixed bottom-0 left-0 right-0 bg-background p-4">
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

            <div className="flex items-center justify-center">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <span className="text-primary font-bold text-lg">KER</span>
              </div>
            </div>

            <button
              onClick={() => setCurrentStep("vragen")}
              className="ker-btn ker-btn-primary flex items-center gap-2"
            >
              volgende
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
      <div className="min-h-screen bg-background">
        {/* Progress pill */}
        <div className="flex justify-center pt-6 pb-4">
          <div className="ker-pill">
            vraag <span className="font-bold mx-1">{currentVraagIndex + 1}</span> van {totalVragen}
          </div>
        </div>

        {/* Header met Ger en sectie titel */}
        <div className="px-4 pb-4">
          <div className="max-w-md mx-auto flex items-start gap-4">
            <GerAvatar size="md" />
            <div className="pt-1">
              <h2 className="text-xl font-bold text-foreground">{currentVraag.header}</h2>
              {showSectionHeader && currentVraag.headerIntro && (
                <p className="text-muted-foreground text-sm mt-1">{currentVraag.headerIntro}</p>
              )}
            </div>
          </div>
        </div>

        {/* Vraag card */}
        <main className="px-4 pb-32">
          <div className="max-w-md mx-auto">
            <div className="ker-card">
              <p className="text-foreground text-center text-lg mb-8">
                {currentVraag.vraag}
              </p>

              {/* Emoticon knoppen */}
              <div className="flex justify-center gap-6 mb-8">
                {[
                  { value: "nee", emoji: "🙂", color: "green", label: "NEE" },
                  { value: "soms", emoji: "😐", color: "yellow", label: "SOMS" },
                  { value: "ja", emoji: "🙁", color: "red", label: "JA" },
                ].map((option) => {
                  const isSelected = antwoorden[currentVraag.id] === option.value
                  const hasAnswer = !!antwoorden[currentVraag.id]
                  return (
                    <button
                      key={option.value}
                      onClick={() => handleAntwoord(option.value)}
                      disabled={isTransitioning}
                      className="flex flex-col items-center gap-2"
                    >
                      <div
                        className={cn(
                          "emoticon-btn transition-all duration-300",
                          isSelected
                            ? `selected bg-[var(--emoticon-${option.color})] scale-110`
                            : hasAnswer
                              ? "bg-gray-200 opacity-50"
                              : `bg-[var(--emoticon-${option.color})]/20 hover:bg-[var(--emoticon-${option.color})]/40`
                        )}
                      >
                        <span className={cn(
                          "text-3xl transition-all duration-300",
                          hasAnswer && !isSelected && "grayscale"
                        )}>{option.emoji}</span>
                      </div>
                      <span className={cn(
                        "text-sm font-bold transition-all duration-300",
                        isSelected ? "text-foreground" : hasAnswer ? "text-gray-400" : "text-muted-foreground"
                      )}>
                        {option.label}
                      </span>
                    </button>
                  )
                })}
              </div>

              {/* Tip */}
              {currentVraag.tip && (
                <div className="flex items-start gap-3 p-4 bg-muted rounded-xl">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <span className="text-primary-foreground text-sm font-bold">i</span>
                  </div>
                  <p className="text-sm text-foreground">{currentVraag.tip}</p>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="fixed bottom-0 left-0 right-0 bg-background p-4">
          <div className="max-w-md mx-auto flex items-center justify-between gap-4">
            <button
              onClick={() => currentVraagIndex > 0 ? setCurrentVraagIndex(prev => prev - 1) : setCurrentStep("intro")}
              className="ker-btn ker-btn-secondary flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              terug
            </button>

            <div className="flex items-center justify-center">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <span className="text-primary font-bold text-lg">KER</span>
              </div>
            </div>

            <button
              disabled={!antwoorden[currentVraag.id]}
              onClick={() => {
                if (currentVraagIndex < totalVragen - 1) {
                  setCurrentVraagIndex(prev => prev + 1)
                } else {
                  setCurrentStep("taken-selectie")
                }
              }}
              className={cn(
                "ker-btn flex items-center gap-2",
                antwoorden[currentVraag.id] ? "ker-btn-primary" : "ker-btn-secondary opacity-50"
              )}
            >
              maak keuze
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
              <h2 className="text-xl font-bold text-foreground">Jouw zorgtaken</h2>
              <p className="text-muted-foreground text-sm mt-1">
                Welke taken doe jij voor je naaste? Selecteer alles wat van toepassing is.
              </p>
            </div>
          </div>
        </div>

        {/* Taken lijst */}
        <main className="px-4 pb-32">
          <div className="max-w-md mx-auto">
            <div className="ker-card">
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

        {/* Footer */}
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

            <div className="flex items-center justify-center">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <span className="text-primary font-bold text-lg">KER</span>
              </div>
            </div>

            <button
              onClick={() => {
                if (geselecteerdeTakenIds.length > 0) {
                  setCurrentTaakDetailIndex(0)
                  setCurrentStep("taken-details")
                } else {
                  setCurrentStep("rapport")
                }
              }}
              className="ker-btn ker-btn-primary flex items-center gap-2"
            >
              volgende
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
              <p className="text-foreground mb-6">
                Ervaar je deze taak als <span className="font-bold">zwaar</span>?
              </p>

              <div className="flex justify-center gap-6">
                <button
                  onClick={() => handleBelastingSelect("nee")}
                  className="flex flex-col items-center gap-2"
                >
                  <div className={cn(
                    "emoticon-btn transition-all duration-300",
                    taakData.belasting === "nee"
                      ? "selected bg-[var(--emoticon-green)] scale-110"
                      : taakData.belasting
                        ? "bg-gray-200 opacity-50"
                        : "bg-[var(--emoticon-green)]/20 hover:bg-[var(--emoticon-green)]/40"
                  )}>
                    <span className={cn(
                      "text-3xl transition-all duration-300",
                      taakData.belasting && taakData.belasting !== "nee" && "grayscale"
                    )}>🙂</span>
                  </div>
                  <span className={cn(
                    "text-sm font-medium transition-all duration-300",
                    taakData.belasting === "nee" ? "text-foreground" : taakData.belasting ? "text-gray-400" : "text-muted-foreground"
                  )}>NEE</span>
                </button>

                <button
                  onClick={() => handleBelastingSelect("soms")}
                  className="flex flex-col items-center gap-2"
                >
                  <div className={cn(
                    "emoticon-btn transition-all duration-300",
                    taakData.belasting === "soms"
                      ? "selected bg-[var(--emoticon-yellow)] scale-110"
                      : taakData.belasting
                        ? "bg-gray-200 opacity-50"
                        : "bg-[var(--emoticon-yellow)]/20 hover:bg-[var(--emoticon-yellow)]/40"
                  )}>
                    <span className={cn(
                      "text-3xl transition-all duration-300",
                      taakData.belasting && taakData.belasting !== "soms" && "grayscale"
                    )}>😐</span>
                  </div>
                  <span className={cn(
                    "text-sm font-medium transition-all duration-300",
                    taakData.belasting === "soms" ? "text-foreground" : taakData.belasting ? "text-gray-400" : "text-muted-foreground"
                  )}>SOMS</span>
                </button>

                <button
                  onClick={() => handleBelastingSelect("ja")}
                  className="flex flex-col items-center gap-2"
                >
                  <div className={cn(
                    "emoticon-btn transition-all duration-300",
                    taakData.belasting === "ja"
                      ? "selected bg-[var(--emoticon-red)] scale-110"
                      : taakData.belasting
                        ? "bg-gray-200 opacity-50"
                        : "bg-[var(--emoticon-red)]/20 hover:bg-[var(--emoticon-red)]/40"
                  )}>
                    <span className={cn(
                      "text-3xl transition-all duration-300",
                      taakData.belasting && taakData.belasting !== "ja" && "grayscale"
                    )}>🙁</span>
                  </div>
                  <span className={cn(
                    "text-sm font-medium transition-all duration-300",
                    taakData.belasting === "ja" ? "text-foreground" : taakData.belasting ? "text-gray-400" : "text-muted-foreground"
                  )}>JA</span>
                </button>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
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

            <div className="flex items-center justify-center">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <span className="text-primary font-bold text-lg">KER</span>
              </div>
            </div>

            <button
              disabled={!taakData.uren || !taakData.belasting}
              onClick={handleTaakDetailVolgende}
              className={cn(
                "ker-btn flex items-center gap-2",
                taakData.uren && taakData.belasting ? "ker-btn-primary" : "ker-btn-secondary opacity-50"
              )}
            >
              maak keuze
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
                Dit is jouw persoonlijke Mantelzorg Balanstest rapport.
              </p>
            </div>
          </div>
        </div>

        {/* Resultaat */}
        <main className="px-4 pb-32">
          <div className="max-w-md mx-auto space-y-4">
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
              <h2 className="text-xl font-bold text-foreground">Jouw Balanstest</h2>
              <p className="text-muted-foreground text-sm mt-1">
                Vul nu je gegevens in en klik op verstuur.
              </p>
            </div>
          </div>
        </div>

        {/* Formulier */}
        <main className="px-4 pb-32">
          <div className="max-w-md mx-auto">
            <div className="ker-card">
              <p className="text-foreground mb-6">
                Vul nu je gegevens in en klik op verstuur. Dan lees je op de volgende pagina meteen het resultaat van jouw <span className="font-bold">Mantelzorg Balanstest.</span> Je krijgt ook een link per e-mail, zodat je de check vaker kunt bekijken of uitprinten.
              </p>

              <p className="font-medium text-foreground mb-4">Vul hier jouw gegevens in:</p>

              <div className="space-y-4">
                <div>
                  <input
                    value={gegevens.naam}
                    onChange={(e) => setGegevens((prev) => ({ ...prev, naam: e.target.value }))}
                    placeholder="Naam"
                    className="ker-input"
                  />
                </div>

                <div>
                  <input
                    type="email"
                    value={gegevens.email}
                    onChange={(e) => setGegevens((prev) => ({ ...prev, email: e.target.value }))}
                    placeholder="E-mail"
                    className="ker-input"
                  />
                </div>

                <div>
                  <StreetSearch
                    label="Jouw adres"
                    value={gegevens.mantelzorgerStraat}
                    onChange={(straat) => setGegevens((prev) => ({ ...prev, mantelzorgerStraat: straat }))}
                    placeholder="Zoek op postcode of straatnaam"
                  />
                </div>

                <div className="pt-2">
                  <StreetSearch
                    label="Vul de woonplaats van je naaste hier in"
                    value={gegevens.zorgvragerStraat}
                    onChange={(straat) => setGegevens((prev) => ({ ...prev, zorgvragerStraat: straat }))}
                    placeholder="Zoek op postcode of straatnaam"
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

        {/* Footer */}
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

            <div className="flex items-center justify-center">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <span className="text-primary font-bold text-lg">KER</span>
              </div>
            </div>

            <button
              onClick={handleGegevensSubmit}
              className="ker-btn ker-btn-primary"
            >
              verstuur
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
              Je rapport is klaar. Hoe wil je verder?
            </p>
          </div>
        </div>
      </div>

      {/* Opties */}
      <main className="px-4 pb-8">
        <div className="max-w-md mx-auto space-y-3">
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
                <p className="text-sm text-muted-foreground">Sla je rapport op en volg je voortgang</p>
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
