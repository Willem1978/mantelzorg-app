"use client"

import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { GerAvatar } from "@/components/GerAvatar"
import { SmileyGroup, ResultSmiley, GerPageIntro } from "@/components/ui"
import { useToast } from "@/components/ui/Toast"
import { AgentChat } from "@/components/ai/AgentChat"
import { PdfDownloadButton } from "@/components/PdfDownloadButton"
import { balanstestContent } from "@/config/content"

const bc = balanstestContent

// ============================================
// TYPES
// ============================================

interface CheckInRecord {
  id: string
  month: string
  overallWellbeing: number | null
  physicalHealth: number | null
  emotionalHealth: number | null
  supportSatisfaction: number | null
  needsHelp: string | null
  completedAt: string | null
}

interface CheckInData {
  checkIns: CheckInRecord[]
  needsCheckIn: boolean
  lastCheckIn: CheckInRecord | null
  aanbevolenFrequentie: string
  frequentieDagen: number
  daysSinceLastCheckIn: number | null
}

interface TaakDetail {
  naam: string
  uren: number
  moeilijkheid: string | null
}

interface TestOverzicht {
  id: string
  score: number
  niveau: "LAAG" | "GEMIDDELD" | "HOOG"
  totaleZorguren: number
  datum: string
  aantalTaken: number
  zwareTaken: number
  taken: TaakDetail[]
}

interface OverzichtData {
  tests: TestOverzicht[]
  needsNewTest: boolean
  daysSinceLastTest: number | null
}

// ============================================
// WELLBEING HELPERS
// ============================================

function wellbeingLabel(score: number | null): { label: string; kleur: string; emoji: string } {
  if (score === null) return { label: "Onbekend", kleur: "gray", emoji: "➖" }
  if (score >= 3) return { label: "Goed", kleur: "green", emoji: "😊" }
  if (score >= 2) return { label: "Wisselend", kleur: "amber", emoji: "😐" }
  return { label: "Zwaar", kleur: "red", emoji: "😟" }
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function CheckInPage() {
  const { status } = useSession()
  const { showSuccess, showError } = useToast()

  // Main state
  const [activeTab, setActiveTab] = useState<"check-in" | "balanstest">("check-in")
  const [doingCheckIn, setDoingCheckIn] = useState(false)

  // Check-in history data
  const [checkInData, setCheckInData] = useState<CheckInData | null>(null)
  const [checkInLoading, setCheckInLoading] = useState(true)

  // Balanstest overview data
  const [balanstestData, setBalanstestData] = useState<OverzichtData | null>(null)
  const [balanstestLoading, setBalanstestLoading] = useState(true)

  // Balanstest delete state
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Questionnaire state (loaded on demand)
  const [checkInQuestions, setCheckInQuestions] = useState<any[]>([])
  const [questionsLoading, setQuestionsLoading] = useState(false)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [selectedOptions, setSelectedOptions] = useState<string[]>([])
  const [isCompleted, setIsCompleted] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)

  const hasFetched = useRef(false)

  // ============================================
  // DATA LOADING
  // ============================================

  const loadOverviewData = () => {
    fetch("/api/check-in")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setCheckInData(data)
      })
      .catch(() => {})
      .finally(() => setCheckInLoading(false))

    fetch(`/api/balanstest/overzicht?t=${Date.now()}`, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setBalanstestData(data)
      })
      .catch(() => {})
      .finally(() => setBalanstestLoading(false))
  }

  useEffect(() => {
    if (hasFetched.current || status === "loading") return
    if (status !== "authenticated") {
      setCheckInLoading(false)
      setBalanstestLoading(false)
      return
    }
    hasFetched.current = true
    loadOverviewData()
  }, [status])

  // ============================================
  // CHECK-IN QUESTIONNAIRE HANDLERS
  // ============================================

  const startCheckIn = async () => {
    setQuestionsLoading(true)
    try {
      const [vragenRes, optiesRes] = await Promise.all([
        fetch("/api/content/balanstest-vragen?type=CHECKIN"),
        fetch("/api/content/formulier-opties?groep=CHECKIN_HULP"),
      ])

      if (!vragenRes.ok || !optiesRes.ok) throw new Error("Laden mislukt")

      const vragenData = await vragenRes.json()
      const optiesData = await optiesRes.json()

      const mappedOptions = (optiesData.opties || []).map((o: any) => ({
        value: o.waarde,
        label: o.label,
        icon: o.emoji,
      }))

      const mappedQuestions = (vragenData.vragen || []).map((v: any) => {
        const question: any = {
          id: v.vraagId,
          question: v.vraagTekst,
          tip: v.tip,
          reversed: v.reversed,
          isMultiSelect: v.isMultiSelect,
        }
        if (v.isMultiSelect) {
          question.options = mappedOptions
        }
        return question
      })

      setCheckInQuestions(mappedQuestions)
      setCurrentQuestionIndex(0)
      setAnswers({})
      setSelectedOptions([])
      setIsCompleted(false)
      setDoingCheckIn(true)
    } catch {
      showError("Laden mislukt. Probeer het opnieuw.")
    } finally {
      setQuestionsLoading(false)
    }
  }

  const currentQuestion = checkInQuestions[currentQuestionIndex]
  const totalQuestions = checkInQuestions.length
  const isLastQuestion = currentQuestionIndex === totalQuestions - 1

  const handleAnswer = (value: string) => {
    if (isTransitioning) return
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: value }))
    if (!currentQuestion.isMultiSelect) {
      setIsTransitioning(true)
      setTimeout(() => {
        if (!isLastQuestion) {
          setCurrentQuestionIndex((prev) => prev + 1)
        } else {
          setIsCompleted(true)
        }
        setIsTransitioning(false)
      }, 2000)
    }
  }

  const toggleOption = (value: string) => {
    if (value === "geen") {
      setSelectedOptions(["geen"])
    } else {
      setSelectedOptions((prev) => {
        const withoutGeen = prev.filter((v) => v !== "geen")
        if (withoutGeen.includes(value)) {
          return withoutGeen.filter((v) => v !== value)
        }
        return [...withoutGeen, value]
      })
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) setCurrentQuestionIndex((prev) => prev - 1)
  }

  const handleNext = () => {
    if (currentQuestion.isMultiSelect) {
      setAnswers((prev) => ({ ...prev, [currentQuestion.id]: selectedOptions.join(",") }))
    }
    if (!isLastQuestion) {
      setCurrentQuestionIndex((prev) => prev + 1)
    } else {
      setIsCompleted(true)
    }
  }

  const handleComplete = async () => {
    setIsSaving(true)
    try {
      const response = await fetch("/api/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      })
      if (!response.ok) throw new Error("Opslaan mislukt")

      showSuccess("Check-in opgeslagen!")
      setDoingCheckIn(false)
      setIsCompleted(false)
      // Refresh overview data
      setCheckInLoading(true)
      hasFetched.current = false
      loadOverviewData()
    } catch {
      showError("Oeps, dat lukte niet. Probeer het opnieuw.")
    } finally {
      setIsSaving(false)
    }
  }

  const calculateMood = () => {
    let score = 0
    let total = 0
    checkInQuestions.forEach((q) => {
      if (!q.isMultiSelect && answers[q.id]) {
        const answer = answers[q.id]
        if (q.reversed) {
          if (answer === "ja") score += 3
          else if (answer === "soms") score += 2
          else score += 1
        } else {
          if (answer === "nee") score += 3
          else if (answer === "soms") score += 2
          else score += 1
        }
        total += 3
      }
    })
    const percentage = total > 0 ? Math.round((score / total) * 100) : 50
    if (percentage >= 70) return { label: "Goed", kleur: "green" }
    if (percentage >= 40) return { label: "Wisselend", kleur: "amber" }
    return { label: "Zwaar", kleur: "red" }
  }

  const getContextueleHulp = () => {
    const suggesties: { emoji: string; titel: string; beschrijving: string; href: string }[] = []
    const hulpNodig = (answers["c5"] || "").split(",").filter(Boolean)

    if (hulpNodig.includes("emotioneel")) {
      suggesties.push({ emoji: "💬", titel: "Praten met iemand", beschrijving: "Vind ondersteuning bij jou in de buurt", href: "/hulpvragen?tab=voor-jou" })
    }
    if (hulpNodig.includes("huishouden") || hulpNodig.includes("zorgtaken")) {
      suggesties.push({ emoji: "🤝", titel: "Hulp zoeken bij taken", beschrijving: "Bekijk welke hulp er beschikbaar is", href: "/hulpvragen?tab=voor-naaste" })
    }
    if (hulpNodig.includes("tijd_voor_mezelf")) {
      suggesties.push({ emoji: "🧘", titel: "Tips voor zelfzorg", beschrijving: "Kleine dingen die veel verschil maken", href: "/leren/zelfzorg" })
    }
    if (hulpNodig.includes("administratie")) {
      suggesties.push({ emoji: "⚖️", titel: "Je rechten als mantelzorger", beschrijving: "Regelingen en vergoedingen waar je recht op hebt", href: "/leren/rechten" })
    }
    if (answers["c1"] === "ja" && !hulpNodig.includes("tijd_voor_mezelf")) {
      suggesties.push({ emoji: "💚", titel: "Rust en ontspanning", beschrijving: "Tips om beter voor jezelf te zorgen", href: "/leren/zelfzorg" })
    }
    if (answers["c4"] === "nee") {
      suggesties.push({ emoji: "🏛️", titel: "Hulp in jouw gemeente", beschrijving: "Ontdek welke ondersteuning er voor je is", href: "/hulpvragen?tab=voor-jou" })
    }
    return suggesties.slice(0, 3)
  }

  // ============================================
  // BALANSTEST DELETE HANDLER
  // ============================================

  const handleDelete = async (testId: string) => {
    setDeleting(true)
    try {
      const res = await fetch(`/api/balanstest/${testId}`, { method: "DELETE" })
      if (res.ok) {
        setBalanstestData((prev) =>
          prev ? { ...prev, tests: prev.tests.filter((t) => t.id !== testId) } : null
        )
      }
    } catch {
      // silently fail
    } finally {
      setDeleting(false)
      setDeleteId(null)
    }
  }

  // ============================================
  // FULL-SCREEN CHECK-IN QUESTIONNAIRE
  // ============================================

  if (doingCheckIn && checkInQuestions.length > 0) {
    // Completion screen
    if (isCompleted) {
      const mood = calculateMood()
      return (
        <div className="fixed inset-0 z-50 bg-background overflow-y-auto">
          <div className="min-h-screen flex flex-col lg:flex-row">
            {/* Desktop: linker kolom met Ger */}
            <div className="lg:w-1/2 lg:bg-primary/5 lg:flex lg:flex-col lg:justify-center lg:items-center lg:p-12">
              <div className="px-4 pt-8 pb-4 lg:p-0 lg:text-center lg:max-w-md">
                <div className="flex items-start gap-4 lg:flex-col lg:items-center lg:gap-6">
                  <GerAvatar size="md" className="lg:w-24 lg:h-24" animate />
                  <div className="pt-1 lg:pt-0">
                    <h2 className="text-xl lg:text-2xl font-bold text-foreground">Klaar!</h2>
                    <p className="text-muted-foreground text-sm lg:text-base mt-1 lg:mt-3">
                      Bedankt voor het invullen. Hieronder zie je hoe het met je gaat.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Rechter kolom / Resultaat */}
            <div className="flex-1 lg:flex lg:flex-col lg:justify-center lg:items-center lg:p-12">
              <main className="px-4 pb-32 lg:px-0 lg:pb-8 lg:w-full lg:max-w-lg">
                <div className="max-w-md mx-auto lg:mx-0 lg:max-w-none space-y-4">
                  {/* Score card */}
                  <div className={cn(
                    "ker-card text-center",
                    mood.kleur === "green" && "bg-[#E8F5E9]",
                    mood.kleur === "amber" && "bg-[#FFF8E1]",
                    mood.kleur === "red" && "bg-[#FFEBEE]"
                  )}>
                    <div className="mx-auto mb-4">
                      <ResultSmiley type={mood.kleur as "green" | "amber" | "red"} size="xl" />
                    </div>
                    <h3 className={cn(
                      "text-xl font-bold mb-2",
                      mood.kleur === "green" && "text-[#2E7D32]",
                      mood.kleur === "amber" && "text-[#F57F17]",
                      mood.kleur === "red" && "text-[var(--accent-red)]"
                    )}>
                      {mood.label}
                    </h3>
                    <p className="text-foreground text-sm">
                      {mood.kleur === "green"
                        ? "Fijn dat het goed met je gaat! Blijf goed voor jezelf zorgen. Je doet het prima."
                        : mood.kleur === "amber"
                        ? "Je hebt het soms zwaar. Dat is normaal als mantelzorger. Vergeet niet om hulp te vragen."
                        : "Je hebt het zwaar. Dat is niet gek bij alles wat je doet. Praat erover met iemand."}
                    </p>
                  </div>

                  {/* Hulplijn bij zwaar */}
                  {mood.kleur === "red" && (
                    <div className="ker-card bg-[#FFEBEE] border-2 border-[#F44336]">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#F44336] flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-sm font-bold">!</span>
                        </div>
                        <div>
                          <p className="font-medium text-[var(--accent-red)] mb-1">Wil je met iemand praten?</p>
                          <p className="text-sm lg:text-base text-[var(--accent-red)]">
                            Bel de Mantelzorglijn: <a href="tel:0302059059" className="font-bold underline">030 - 205 90 59</a>
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Contextual suggestions */}
                  {getContextueleHulp().length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-foreground">
                        {mood.kleur === "red" ? "Dit kan je nu doen:" : "Misschien handig voor je:"}
                      </p>
                      {getContextueleHulp().map((suggestie, i) => (
                        <Link key={i} href={suggestie.href} className="block">
                          <div className="ker-card hover:border-primary/50 transition-all py-3">
                            <div className="flex items-center gap-3">
                              <span className="text-xl flex-shrink-0">{suggestie.emoji}</span>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm">{suggestie.titel}</p>
                                <p className="text-xs text-muted-foreground">{suggestie.beschrijving}</p>
                              </div>
                              <svg className="w-4 h-4 text-muted-foreground flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}

                  {/* Persoonlijk advies van Ger */}
                  <AgentChat
                    apiEndpoint="/api/ai/checkin"
                    title="Even bijpraten met Ger"
                    defaultOpen={mood.kleur !== "green"}
                    initialMessage={`Hier zijn mijn check-in antwoorden:\n- Vermoeidheid (c1): ${answers["c1"] || "niet ingevuld"}\n- Tijd voor mezelf (c2): ${answers["c2"] || "niet ingevuld"}\n- Zorgen (c3): ${answers["c3"] || "niet ingevuld"}\n- Steun gevoel (c4): ${answers["c4"] || "niet ingevuld"}\n- Hulp nodig bij: ${answers["c5"] || "niets"}\n- Algehele stemming: ${mood.label}\n\nHoe gaat het met me?`}
                  />

                  {/* Desktop button */}
                  <div className="hidden lg:block mt-6">
                    <button onClick={handleComplete} disabled={isSaving} className="ker-btn ker-btn-primary w-full">
                      {isSaving ? "Even geduld..." : "Opslaan en terug"}
                    </button>
                  </div>
                </div>
              </main>
            </div>

            {/* Mobiel footer */}
            <footer className="fixed bottom-0 left-0 right-0 bg-background p-4 lg:hidden z-50">
              <div className="max-w-md mx-auto">
                <button onClick={handleComplete} disabled={isSaving} className="ker-btn ker-btn-primary w-full">
                  {isSaving ? "Even geduld..." : "Opslaan en terug"}
                </button>
              </div>
            </footer>
          </div>
        </div>
      )
    }

    // Multi-select question
    if (currentQuestion?.isMultiSelect && currentQuestion.options) {
      return (
        <div className="fixed inset-0 z-50 bg-background overflow-y-auto">
          <div className="min-h-screen flex flex-col lg:flex-row">
            <div className="lg:w-1/2 lg:bg-primary/5 lg:flex lg:flex-col lg:justify-center lg:items-center lg:p-12">
              <div className="flex justify-center pt-6 pb-4 lg:pt-0 lg:pb-6">
                <div className="ker-pill lg:text-base lg:px-6 lg:py-2">
                  vraag <span className="font-bold mx-1">{currentQuestionIndex + 1}</span> van {totalQuestions}
                </div>
              </div>
              <div className="px-4 pb-4 lg:p-0 lg:text-center lg:max-w-md">
                <div className="flex items-start gap-4 lg:flex-col lg:items-center lg:gap-6">
                  <GerAvatar size="md" className="lg:w-24 lg:h-24" animate />
                  <div className="pt-1 lg:pt-0">
                    <h2 className="text-xl lg:text-2xl font-bold text-foreground">Maandelijkse check-in</h2>
                    <p className="text-muted-foreground text-sm lg:text-base mt-1 lg:mt-3">Even kijken hoe het met je gaat</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 lg:flex lg:flex-col lg:justify-center lg:items-center lg:p-12">
              <main className="px-4 pb-32 lg:px-0 lg:pb-8 lg:w-full lg:max-w-lg">
                <div className="max-w-md mx-auto lg:mx-0 lg:max-w-none">
                  <div className="ker-card lg:shadow-lg">
                    <p className="text-foreground text-lg text-center mb-6">{currentQuestion.question}</p>
                    <div className="grid grid-cols-2 gap-3">
                      {currentQuestion.options.map((option: { value: string; label: string; icon: string }) => {
                        const isSelected = selectedOptions.includes(option.value)
                        return (
                          <button
                            key={option.value}
                            onClick={() => toggleOption(option.value)}
                            className={cn(
                              "p-4 rounded-xl border-2 transition-all text-left",
                              isSelected ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
                            )}
                          >
                            <span className="text-2xl block mb-1">{option.icon}</span>
                            <span className="text-sm font-medium">{option.label}</span>
                          </button>
                        )
                      })}
                    </div>

                    {currentQuestion.tip && (
                      <div className="flex items-start gap-3 bg-muted rounded-xl p-4 mt-4">
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                          <span className="text-primary-foreground text-sm font-bold">i</span>
                        </div>
                        <p className="text-sm lg:text-base text-foreground pt-1">{currentQuestion.tip}</p>
                      </div>
                    )}

                    {/* Desktop buttons */}
                    <div className="hidden lg:flex items-center justify-between gap-4 mt-8">
                      <button onClick={handlePrevious} disabled={currentQuestionIndex === 0} className="ker-btn ker-btn-secondary flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                        terug
                      </button>
                      <button
                        onClick={handleNext}
                        disabled={selectedOptions.length === 0}
                        className={cn("ker-btn flex items-center gap-2", selectedOptions.length > 0 ? "ker-btn-primary" : "ker-btn-secondary opacity-50")}
                      >
                        {isLastQuestion ? "afsluiten" : "volgende"}
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                      </button>
                    </div>
                  </div>
                </div>
              </main>
            </div>

            {/* Mobiel footer */}
            <footer className="fixed bottom-0 left-0 right-0 bg-background p-4 lg:hidden z-50">
              <div className="max-w-md mx-auto flex items-center justify-between gap-4">
                <button onClick={handlePrevious} disabled={currentQuestionIndex === 0} className="ker-btn ker-btn-secondary flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                  terug
                </button>
                <button
                  onClick={handleNext}
                  disabled={selectedOptions.length === 0}
                  className={cn("ker-btn flex items-center gap-2", selectedOptions.length > 0 ? "ker-btn-primary" : "ker-btn-secondary opacity-50")}
                >
                  {isLastQuestion ? "afsluiten" : "volgende"}
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>
            </footer>
          </div>
        </div>
      )
    }

    // Normal smiley question
    const selectedAnswer = answers[currentQuestion?.id]
    return (
      <div className="fixed inset-0 z-50 bg-background overflow-y-auto">
        <div className="min-h-screen flex flex-col lg:flex-row">
          <div className="lg:w-1/2 lg:bg-primary/5 lg:flex lg:flex-col lg:justify-center lg:items-center lg:p-12">
            <div className="flex justify-center pt-6 pb-4 lg:pt-0 lg:pb-6">
              <div className="ker-pill lg:text-base lg:px-6 lg:py-2">
                vraag <span className="font-bold mx-1">{currentQuestionIndex + 1}</span> van {totalQuestions}
              </div>
            </div>
            <div className="px-4 pb-4 lg:p-0 lg:text-center lg:max-w-md">
              <div className="flex items-start gap-4 lg:flex-col lg:items-center lg:gap-6">
                <GerAvatar size="md" className="lg:w-24 lg:h-24" animate />
                <div className="pt-1 lg:pt-0">
                  <h2 className="text-xl lg:text-2xl font-bold text-foreground">Hoe gaat het met je?</h2>
                  <p className="text-muted-foreground text-sm lg:text-base mt-1 lg:mt-3">
                    We stellen je een paar korte vragen. Zo kunnen we zien hoe het met je gaat. Dit duurt maar 2 minuten.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 lg:flex lg:flex-col lg:justify-center lg:items-center lg:p-12">
            <main className="px-4 pb-32 lg:px-0 lg:pb-8 lg:w-full lg:max-w-lg">
              <div className="max-w-md mx-auto lg:mx-0 lg:max-w-none">
                <div className="ker-card lg:shadow-lg">
                  <p className="text-foreground text-lg text-center mb-8">{currentQuestion?.question}</p>
                  <div className="mb-6">
                    <SmileyGroup
                      value={selectedAnswer as "nee" | "soms" | "ja" | null}
                      onChange={(val) => handleAnswer(val)}
                      disabled={isTransitioning}
                      size="lg"
                    />
                  </div>

                  {isTransitioning && (
                    <div className="flex justify-center">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  )}

                  {currentQuestion?.tip && !isTransitioning && (
                    <div className="flex items-start gap-3 bg-muted rounded-xl p-4 mt-4">
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                        <span className="text-primary-foreground text-sm font-bold">i</span>
                      </div>
                      <p className="text-sm lg:text-base text-foreground pt-1">{currentQuestion.tip}</p>
                    </div>
                  )}

                  {/* Desktop: terug knop */}
                  <div className="hidden lg:flex justify-center mt-8">
                    <button onClick={handlePrevious} disabled={currentQuestionIndex === 0} className="ker-btn ker-btn-secondary flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                      terug
                    </button>
                  </div>
                </div>
              </div>
            </main>
          </div>

          {/* Mobiel footer */}
          <footer className="fixed bottom-0 left-0 right-0 bg-background p-4 lg:hidden z-50">
            <div className="max-w-md mx-auto flex items-center justify-center">
              <button onClick={handlePrevious} disabled={currentQuestionIndex === 0} className="ker-btn ker-btn-secondary flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                terug
              </button>
            </div>
          </footer>
        </div>
      </div>
    )
  }

  // ============================================
  // OVERVIEW MODE
  // ============================================

  const loading = checkInLoading || balanstestLoading
  const tests = balanstestData?.tests || []
  const hasTests = tests.length > 0
  const laatsteTest = tests[0] || null
  const maxScore = 24

  if (loading) {
    return (
      <div className="ker-page-content flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="ker-page-content">
      <GerPageIntro tekst="Hier houd je bij hoe het met je gaat. Je kunt een check-in doen en je balanstest bekijken. Wat kan ik voor jou doen?" />

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Mijn welzijn</h1>
        <p className="text-muted-foreground mt-1">Houd bij hoe het met je gaat</p>
      </div>

      {/* Tab navigatie */}
      <div className="flex gap-1 bg-secondary/50 rounded-xl p-1 mb-6">
        <button
          onClick={() => setActiveTab("check-in")}
          className={cn(
            "flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all",
            activeTab === "check-in"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Check-in
        </button>
        <button
          onClick={() => setActiveTab("balanstest")}
          className={cn(
            "flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all",
            activeTab === "balanstest"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Balanstest
        </button>
      </div>

      {/* ============================================ */}
      {/* CHECK-IN OVERZICHT TAB                       */}
      {/* ============================================ */}
      {activeTab === "check-in" && (
        <div className="space-y-6">
          {/* Nieuwe check-in knop */}
          {checkInData?.needsCheckIn && (
            <div className="ker-card bg-primary/5 border-2 border-primary">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">💚</span>
                </div>
                <div className="flex-1">
                  <h2 className="font-bold text-foreground">Tijd voor een check-in</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {checkInData.daysSinceLastCheckIn
                      ? `Je laatste check-in was ${checkInData.daysSinceLastCheckIn} dagen geleden.`
                      : "Je hebt nog geen check-in gedaan."}
                    {checkInData.aanbevolenFrequentie && ` Aanbevolen: ${checkInData.aanbevolenFrequentie}.`}
                  </p>
                </div>
              </div>
              <button
                onClick={startCheckIn}
                disabled={questionsLoading}
                className="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {questionsLoading ? "Laden..." : "Start check-in"}
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}

          {/* Geen check-ins */}
          {(!checkInData?.checkIns || checkInData.checkIns.length === 0) && !checkInData?.needsCheckIn && (
            <div className="ker-card text-center bg-primary/5">
              <div className="w-20 h-20 bg-primary/10 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-4xl">💚</span>
              </div>
              <h2 className="font-bold text-xl text-foreground mb-2">Nog geen check-ins</h2>
              <p className="text-muted-foreground mb-6">
                Doe regelmatig een check-in om bij te houden hoe het met je gaat.
              </p>
              <button
                onClick={startCheckIn}
                disabled={questionsLoading}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {questionsLoading ? "Laden..." : "Start je eerste check-in"}
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}

          {/* Check-in geschiedenis */}
          {checkInData?.checkIns && checkInData.checkIns.length > 0 && (
            <>
              {/* Grafiek als er meerdere zijn */}
              {checkInData.checkIns.length > 1 && (
                <section>
                  <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                    <span className="text-2xl">📈</span> Je welzijn over tijd
                  </h2>
                  <div className="ker-card">
                    <div className="flex items-end gap-3 h-36">
                      <div className="flex flex-col justify-between h-full text-xs text-muted-foreground pr-1">
                        <span>Goed</span>
                        <span>Matig</span>
                        <span>Zwaar</span>
                      </div>
                      <div className="flex-1 flex items-end gap-2 h-full relative">
                        {/* Achtergrond zones */}
                        <div className="absolute inset-0 flex flex-col pointer-events-none">
                          <div className="flex-1 bg-[var(--accent-green-bg)] rounded-t-lg opacity-30" />
                          <div className="flex-1 bg-[var(--accent-amber-bg)] opacity-30" />
                          <div className="flex-1 bg-[var(--accent-red-bg)] rounded-b-lg opacity-30" />
                        </div>
                        {[...checkInData.checkIns].reverse().slice(-8).map((ci) => {
                          const wb = wellbeingLabel(ci.overallWellbeing)
                          const hoogte = ci.overallWellbeing ? (ci.overallWellbeing / 4) * 100 : 25
                          return (
                            <div key={ci.id || ci.month} className="flex-1 flex flex-col items-center justify-end h-full relative z-10">
                              <div
                                className={cn(
                                  "w-full max-w-[40px] rounded-t-lg",
                                  wb.kleur === "green" && "bg-[var(--accent-green)]",
                                  wb.kleur === "amber" && "bg-[var(--accent-amber)]",
                                  wb.kleur === "red" && "bg-[var(--accent-red)]",
                                  wb.kleur === "gray" && "bg-muted"
                                )}
                                style={{ height: `${Math.max(hoogte, 8)}%` }}
                              />
                              <span className="text-[10px] text-muted-foreground mt-2 whitespace-nowrap">
                                {new Date(ci.month).toLocaleDateString("nl-NL", { month: "short" })}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-border/50 flex justify-center gap-4">
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-[var(--accent-green)]" />
                        <span className="text-xs text-muted-foreground">Goed</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-[var(--accent-amber)]" />
                        <span className="text-xs text-muted-foreground">Wisselend</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-[var(--accent-red)]" />
                        <span className="text-xs text-muted-foreground">Zwaar</span>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* Lijst van check-ins */}
              <section>
                <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                  <span className="text-2xl">📋</span> Alle check-ins
                </h2>
                <div className="space-y-3">
                  {checkInData.checkIns.map((ci, i) => {
                    const wb = wellbeingLabel(ci.overallWellbeing)
                    return (
                      <div key={ci.id || ci.month} className="ker-card">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-11 h-11 rounded-full flex items-center justify-center text-lg flex-shrink-0",
                            wb.kleur === "green" && "bg-[var(--accent-green-bg)]",
                            wb.kleur === "amber" && "bg-[var(--accent-amber-bg)]",
                            wb.kleur === "red" && "bg-[var(--accent-red-bg)]",
                            wb.kleur === "gray" && "bg-muted"
                          )}>
                            {wb.emoji}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-foreground">
                                {new Date(ci.month).toLocaleDateString("nl-NL", {
                                  month: "long",
                                  year: "numeric",
                                })}
                              </p>
                              {i === 0 && (
                                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                                  Laatste
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Welzijn: {wb.label}
                              {ci.completedAt && ` \u00B7 ${new Date(ci.completedAt).toLocaleDateString("nl-NL", {
                                day: "numeric",
                                month: "short",
                              })}`}
                            </p>
                          </div>
                          <span className={cn(
                            "text-xs font-semibold px-2.5 py-1 rounded-full",
                            wb.kleur === "green" && "bg-[var(--accent-green-bg)] text-[var(--accent-green)]",
                            wb.kleur === "amber" && "bg-[var(--accent-amber-bg)] text-[var(--accent-amber)]",
                            wb.kleur === "red" && "bg-[var(--accent-red-bg)] text-[var(--accent-red)]",
                            wb.kleur === "gray" && "bg-muted text-muted-foreground"
                          )}>
                            {wb.label}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>

              {/* Nieuwe check-in knop onderaan */}
              {!checkInData?.needsCheckIn && (
                <button
                  onClick={startCheckIn}
                  disabled={questionsLoading}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-secondary text-foreground font-medium rounded-lg hover:bg-secondary/80 transition-colors disabled:opacity-50"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {questionsLoading ? "Laden..." : "Doe opnieuw een check-in"}
                </button>
              )}
            </>
          )}
        </div>
      )}

      {/* ============================================ */}
      {/* BALANSTEST OVERZICHT TAB                     */}
      {/* ============================================ */}
      {activeTab === "balanstest" && (
        <div className="space-y-6">
          {/* Nieuwe test knop */}
          {balanstestData?.needsNewTest && hasTests && (
            <div className="ker-card bg-primary/5 border-2 border-primary">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">{bc.nieuweTest.emoji}</span>
                </div>
                <div className="flex-1">
                  <h2 className="font-bold text-foreground">{bc.nieuweTest.title}</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {bc.nieuweTest.tekstFn(balanstestData.daysSinceLastTest!)}
                  </p>
                </div>
              </div>
              <Link
                href="/belastbaarheidstest"
                className="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground font-medium rounded-lg hover:opacity-90 transition-opacity"
              >
                {bc.nieuweTest.button}
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          )}

          {/* Geen tests */}
          {!hasTests && (
            <div className="ker-card text-center bg-primary/5">
              <div className="w-20 h-20 bg-primary/10 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-4xl">{bc.geenTest.emoji}</span>
              </div>
              <h2 className="font-bold text-xl text-foreground mb-2">{bc.geenTest.title}</h2>
              <p className="text-muted-foreground mb-2">{bc.geenTest.beschrijving}</p>
              <p className="text-sm text-muted-foreground mb-6">{bc.geenTest.subtekst}</p>
              <Link
                href="/belastbaarheidstest"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground font-medium rounded-lg hover:opacity-90 transition-opacity"
              >
                {bc.geenTest.button}
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          )}

          {/* Scores grafiek */}
          {tests.length > 1 && (
            <section>
              <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <span className="text-2xl">{bc.scores.emoji}</span> {bc.scores.title}
              </h2>
              <div className="ker-card">
                <div className="flex items-end gap-3 h-48">
                  <div className="flex flex-col justify-between h-full text-xs text-muted-foreground pr-1">
                    <span>24</span><span>18</span><span>12</span><span>6</span><span>0</span>
                  </div>
                  <div className="flex-1 flex items-end gap-2 h-full relative">
                    <div className="absolute inset-0 flex flex-col pointer-events-none">
                      <div className="flex-1 bg-[var(--accent-red-bg)] rounded-t-lg opacity-30" style={{ flex: `${(24 - 12) / 24}` }} />
                      <div className="flex-1 bg-[var(--accent-amber-bg)] opacity-30" style={{ flex: `${(12 - 6) / 24}` }} />
                      <div className="flex-1 bg-[var(--accent-green-bg)] rounded-b-lg opacity-30" style={{ flex: `${6 / 24}` }} />
                    </div>
                    {[...tests].reverse().slice(-8).map((test) => {
                      const hoogte = (test.score / maxScore) * 100
                      return (
                        <div key={test.id} className="flex-1 flex flex-col items-center justify-end h-full relative z-10">
                          <div
                            className={cn(
                              "w-full max-w-[40px] rounded-t-lg transition-all relative",
                              test.niveau === "LAAG" && "bg-[var(--accent-green)]",
                              test.niveau === "GEMIDDELD" && "bg-[var(--accent-amber)]",
                              test.niveau === "HOOG" && "bg-[var(--accent-red)]"
                            )}
                            style={{ height: `${Math.max(hoogte, 4)}%` }}
                          >
                            <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold text-foreground">{test.score}</span>
                          </div>
                          <span className="text-[10px] text-muted-foreground mt-2 whitespace-nowrap">
                            {new Date(test.datum).toLocaleDateString("nl-NL", { day: "numeric", month: "short" })}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-border/50">
                  <p className="text-xs text-muted-foreground text-center mb-3">{bc.scores.legendaTekst}</p>
                  <div className="flex justify-center gap-4">
                    <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-[var(--accent-green)]" /><span className="text-xs text-muted-foreground">{bc.scores.laag}</span></div>
                    <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-[var(--accent-amber)]" /><span className="text-xs text-muted-foreground">{bc.scores.gemiddeld}</span></div>
                    <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-[var(--accent-red)]" /><span className="text-xs text-muted-foreground">{bc.scores.hoog}</span></div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Zorguren grafiek */}
          {tests.length > 0 && tests.some((t) => t.taken.length > 0) && (() => {
            const testsMetUren = [...tests].reverse().slice(-8).map((test) => {
              let urenGroen = 0, urenOranje = 0, urenRood = 0
              for (const taak of test.taken) {
                const m = taak.moeilijkheid?.toUpperCase()
                if (m === "JA" || m === "MOEILIJK" || m === "ZEER_MOEILIJK") urenRood += taak.uren
                else if (m === "SOMS" || m === "GEMIDDELD") urenOranje += taak.uren
                else urenGroen += taak.uren
              }
              return { ...test, urenGroen, urenOranje, urenRood, totaalUren: urenGroen + urenOranje + urenRood }
            })

            const maxUren = Math.max(...testsMetUren.map((t) => t.totaalUren), 1)
            const yStap = maxUren <= 12 ? 3 : maxUren <= 24 ? 6 : maxUren <= 48 ? 12 : 24
            const yMax = Math.ceil(maxUren / yStap) * yStap
            const yLabels: number[] = []
            for (let i = yMax; i >= 0; i -= yStap) yLabels.push(i)

            return (
              <section>
                <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                  <span className="text-2xl">{bc.zorguren.emoji}</span> {bc.zorguren.title}
                </h2>
                <div className="ker-card">
                  <div className="flex items-end gap-3 h-52">
                    <div className="flex flex-col justify-between h-full text-xs text-muted-foreground pr-1 min-w-[24px] text-right">
                      {yLabels.map((val) => (<span key={val}>{val}</span>))}
                    </div>
                    <div className="flex-1 flex items-end gap-2 h-full relative">
                      {testsMetUren.map((test) => {
                        const totaalHoogte = yMax > 0 ? (test.totaalUren / yMax) * 100 : 0
                        const roodPct = test.totaalUren > 0 ? (test.urenRood / test.totaalUren) * 100 : 0
                        const oranjePct = test.totaalUren > 0 ? (test.urenOranje / test.totaalUren) * 100 : 0
                        const groenPct = test.totaalUren > 0 ? (test.urenGroen / test.totaalUren) * 100 : 0

                        return (
                          <div key={test.id} className="flex-1 flex flex-col items-center justify-end h-full">
                            <span className="text-xs font-bold text-foreground mb-1">{test.totaalUren}</span>
                            {(() => {
                              const topSegment = groenPct > 0 ? "groen" : oranjePct > 0 ? "oranje" : "rood"
                              return (
                                <div className="w-full max-w-[40px] flex flex-col" style={{ height: `${Math.max(totaalHoogte, 3)}%` }}>
                                  {groenPct > 0 && (
                                    <div className={cn("w-full bg-[var(--accent-green)]", topSegment === "groen" && "rounded-t-lg")} style={{ flex: `${groenPct} 0 0%` }} />
                                  )}
                                  {oranjePct > 0 && (
                                    <div className={cn("w-full bg-[var(--accent-amber)]", topSegment === "oranje" && "rounded-t-lg")} style={{ flex: `${oranjePct} 0 0%` }} />
                                  )}
                                  {roodPct > 0 && (
                                    <div className={cn("w-full bg-[var(--accent-red)]", topSegment === "rood" && "rounded-t-lg")} style={{ flex: `${roodPct} 0 0%` }} />
                                  )}
                                  {roodPct === 0 && oranjePct === 0 && groenPct === 0 && test.totaalUren > 0 && (
                                    <div className="w-full bg-muted flex-1 rounded-t-lg" />
                                  )}
                                </div>
                              )
                            })()}
                            <span className="text-[10px] text-muted-foreground mt-2 whitespace-nowrap">
                              {new Date(test.datum).toLocaleDateString("nl-NL", { day: "numeric", month: "short" })}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Legenda */}
                  <div className="mt-4 pt-4 border-t border-border/50">
                    <p className="text-xs text-muted-foreground text-center mb-3">{bc.zorguren.legendaTekst}</p>
                    <div className="flex justify-center gap-4">
                      <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-[var(--accent-green)]" /><span className="text-xs text-muted-foreground">{bc.zorguren.nietZwaar}</span></div>
                      <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-[var(--accent-amber)]" /><span className="text-xs text-muted-foreground">{bc.zorguren.somsZwaar}</span></div>
                      <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-[var(--accent-red)]" /><span className="text-xs text-muted-foreground">{bc.zorguren.zwaar}</span></div>
                    </div>
                  </div>

                  {/* Detail lijst laatste test */}
                  {laatsteTest && laatsteTest.taken.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-border/50">
                      <p className="text-xs font-medium text-muted-foreground mb-2">{bc.zorguren.takenTitel}</p>
                      <div className="space-y-1">
                        {laatsteTest.taken
                          .filter((t) => t.uren > 0)
                          .sort((a, b) => b.uren - a.uren)
                          .map((taak, i) => {
                            const m = taak.moeilijkheid?.toUpperCase()
                            const isRood = m === "JA" || m === "MOEILIJK" || m === "ZEER_MOEILIJK"
                            const isOranje = m === "SOMS" || m === "GEMIDDELD"
                            return (
                              <div key={i} className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                  <div className={cn("w-2.5 h-2.5 rounded-full", isRood && "bg-[var(--accent-red)]", isOranje && "bg-[var(--accent-amber)]", !isRood && !isOranje && "bg-[var(--accent-green)]")} />
                                  <span className="text-foreground">{taak.naam}</span>
                                </div>
                                <span className="text-muted-foreground">{bc.zorguren.uurFn(taak.uren)}</span>
                              </div>
                            )
                          })}
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )
          })()}

          {/* Huidige score */}
          {laatsteTest && (
            <section>
              <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <span className="text-2xl">{bc.laatsteScore.emoji}</span> {bc.laatsteScore.title}
              </h2>
              <div className="ker-card">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className={cn(
                      "text-3xl font-bold",
                      laatsteTest.niveau === "LAAG" && "text-[var(--accent-green)]",
                      laatsteTest.niveau === "GEMIDDELD" && "text-[var(--accent-amber)]",
                      laatsteTest.niveau === "HOOG" && "text-[var(--accent-red)]"
                    )}>
                      {laatsteTest.score}
                      <span className="text-lg font-normal text-muted-foreground">{bc.laatsteScore.maxLabel}</span>
                    </span>
                  </div>
                  <span className={cn(
                    "text-sm font-semibold px-3 py-1 rounded-full",
                    laatsteTest.niveau === "LAAG" && "bg-[var(--accent-green-bg)] text-[var(--accent-green)]",
                    laatsteTest.niveau === "GEMIDDELD" && "bg-[var(--accent-amber-bg)] text-[var(--accent-amber)]",
                    laatsteTest.niveau === "HOOG" && "bg-[var(--accent-red-bg)] text-[var(--accent-red)]"
                  )}>
                    {laatsteTest.niveau === "LAAG" && bc.laatsteScore.lageBelasting}
                    {laatsteTest.niveau === "GEMIDDELD" && bc.laatsteScore.gemiddeldeBelasting}
                    {laatsteTest.niveau === "HOOG" && bc.laatsteScore.hogeBelasting}
                  </span>
                </div>

                {/* Thermometer */}
                <div className="relative h-5 bg-muted rounded-full overflow-hidden mb-3">
                  <div
                    className={cn(
                      "absolute left-0 top-0 h-full rounded-full transition-all duration-500",
                      laatsteTest.niveau === "LAAG" && "bg-[var(--accent-green)]",
                      laatsteTest.niveau === "GEMIDDELD" && "bg-[var(--accent-amber)]",
                      laatsteTest.niveau === "HOOG" && "bg-[var(--accent-red)]"
                    )}
                    style={{ width: `${(laatsteTest.score / maxScore) * 100}%` }}
                  />
                  <div className="absolute inset-0 flex">
                    <div className="flex-1 border-r border-white/30" />
                    <div className="flex-1 border-r border-white/30" />
                    <div className="flex-1" />
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{bc.laatsteScore.zorgtakenFn(laatsteTest.aantalTaken)}</span>
                  <span>{bc.laatsteScore.uurPerWeekFn(laatsteTest.totaleZorguren)}</span>
                </div>

                <Link
                  href="/rapport"
                  className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-border/50 text-sm font-medium text-primary hover:underline"
                >
                  {bc.laatsteScore.bekijkResultaten}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </section>
          )}

          {/* Alle rapporten */}
          {tests.length > 0 && (
            <section>
              <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <span className="text-2xl">{bc.rapporten.emoji}</span> {bc.rapporten.title}
              </h2>
              <div className="space-y-3">
                {tests.map((test, i) => (
                  <div key={test.id} className="ker-card relative">
                    {/* Bevestigingsdialoog */}
                    {deleteId === test.id && (
                      <div className="absolute inset-0 z-10 bg-card/95 backdrop-blur-sm rounded-2xl flex items-center justify-center p-4">
                        <div className="text-center">
                          <p className="font-medium text-foreground mb-3">{bc.verwijderDialog.title}</p>
                          <p className="text-sm text-muted-foreground mb-4">{bc.verwijderDialog.beschrijving}</p>
                          <div className="flex gap-2 justify-center">
                            <button type="button" onClick={() => setDeleteId(null)} className="px-4 py-2.5 text-sm font-medium rounded-lg bg-muted text-foreground hover:bg-muted/80 transition-colors">
                              {bc.verwijderDialog.annuleren}
                            </button>
                            <button type="button" onClick={() => handleDelete(test.id)} disabled={deleting} className="px-4 py-2.5 text-sm font-medium rounded-lg bg-[var(--accent-red)] text-white hover:opacity-90 transition-opacity disabled:opacity-50">
                              {deleting ? bc.verwijderDialog.bezig : bc.verwijderDialog.verwijderen}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Test info */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className={cn(
                        "w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0",
                        test.niveau === "LAAG" && "bg-[var(--accent-green-bg)] text-[var(--accent-green)]",
                        test.niveau === "GEMIDDELD" && "bg-[var(--accent-amber-bg)] text-[var(--accent-amber)]",
                        test.niveau === "HOOG" && "bg-[var(--accent-red-bg)] text-[var(--accent-red)]"
                      )}>
                        {test.score}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-foreground">
                            {new Date(test.datum).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" })}
                          </p>
                          {i === 0 && (
                            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                              {bc.rapporten.laatsteBadge}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {bc.rapporten.takenSummaryFn(test.aantalTaken, test.totaleZorguren)}
                          {test.zwareTaken > 0 && bc.rapporten.zwaarSuffixFn(test.zwareTaken)}
                        </p>
                      </div>
                    </div>

                    {/* Actieknoppen */}
                    <div className="flex gap-2">
                      <Link
                        href="/rapport"
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        {bc.rapporten.bekijkResultaat}
                      </Link>
                      <PdfDownloadButton testId={test.id} size="sm" variant="button" />
                      <button
                        type="button"
                        onClick={() => setDeleteId(test.id)}
                        className="flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-medium rounded-lg bg-[var(--accent-red-bg)] text-[var(--accent-red)] hover:bg-[var(--accent-red)]/20 transition-colors"
                        aria-label={bc.rapporten.testVerwijderenLabel}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Doe nieuwe test knop */}
          {hasTests && !balanstestData?.needsNewTest && (
            <Link
              href="/belastbaarheidstest"
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-secondary text-foreground font-medium rounded-lg hover:bg-secondary/80 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {bc.opnieuwButton}
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
