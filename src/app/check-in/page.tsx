"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { GerAvatar } from "@/components/GerAvatar"
import { SmileyGroup, ResultSmiley } from "@/components/ui"

// Korte maandelijkse check-in vragen (NEE/SOMS/JA stijl)
// B1 taalgebruik - korte, eenvoudige zinnen
const checkInQuestions = [
  {
    id: "c1",
    question: "Ben je vaak moe?",
    tip: "Als je veel moe bent, is dat een teken dat je rust nodig hebt.",
    reversed: false, // "nee" is positief
  },
  {
    id: "c2",
    question: "Heb je tijd voor jezelf?",
    tip: "Tijd voor jezelf is belangrijk. Ook voor jou.",
    reversed: true, // "ja" is hier positief
  },
  {
    id: "c3",
    question: "Maak je je vaak zorgen?",
    tip: "Zorgen maken hoort erbij. Maar het mag niet te veel worden.",
    reversed: false,
  },
  {
    id: "c4",
    question: "Krijg je hulp van anderen?",
    tip: "Hulp van anderen is fijn. Je hoeft het niet alleen te doen.",
    reversed: true,
  },
  {
    id: "c5",
    question: "Waar wil je hulp bij?",
    tip: "Kies wat voor jou belangrijk is. Je kunt meer dan één ding kiezen.",
    isMultiSelect: true,
    options: [
      { value: "geen", label: "Het gaat goed zo", icon: "✅" },
      { value: "huishouden", label: "Huishouden", icon: "🧹" },
      { value: "zorgtaken", label: "Zorgtaken", icon: "🩺" },
      { value: "tijd_voor_mezelf", label: "Tijd voor mezelf", icon: "🧘" },
      { value: "administratie", label: "Papierwerk", icon: "📋" },
      { value: "emotioneel", label: "Praten met iemand", icon: "💬" },
    ],
  },
]

export default function CheckInPage() {
  const router = useRouter()
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [selectedOptions, setSelectedOptions] = useState<string[]>([])
  const [isCompleted, setIsCompleted] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)

  const currentQuestion = checkInQuestions[currentQuestionIndex]
  const totalQuestions = checkInQuestions.length
  const isLastQuestion = currentQuestionIndex === totalQuestions - 1

  const handleAnswer = (value: string) => {
    if (isTransitioning) return

    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: value,
    }))

    // Auto-advance after delay (niet voor multi-select vragen)
    if (!currentQuestion.isMultiSelect) {
      setIsTransitioning(true)
      setTimeout(() => {
        if (!isLastQuestion) {
          setCurrentQuestionIndex((prev) => prev + 1)
        } else {
          setIsCompleted(true)
        }
        setIsTransitioning(false)
      }, 1200) // Langere delay voor betere UX
    }
  }

  const toggleOption = (value: string) => {
    if (value === "geen") {
      // Als "geen" geselecteerd wordt, deselecteer alles en selecteer alleen "geen"
      setSelectedOptions(["geen"])
    } else {
      // Als een andere optie geselecteerd wordt, verwijder "geen" en toggle de optie
      setSelectedOptions(prev => {
        const withoutGeen = prev.filter(v => v !== "geen")
        if (withoutGeen.includes(value)) {
          return withoutGeen.filter(v => v !== value)
        } else {
          return [...withoutGeen, value]
        }
      })
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1)
    }
  }

  const handleNext = () => {
    if (currentQuestion.isMultiSelect) {
      setAnswers((prev) => ({
        ...prev,
        [currentQuestion.id]: selectedOptions.join(","),
      }))
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
      await fetch("/api/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      })
      router.push("/dashboard")
    } catch (error) {
      console.error("Error saving check-in:", error)
      router.push("/dashboard")
    } finally {
      setIsSaving(false)
    }
  }

  // Calculate mood from answers
  const calculateMood = () => {
    let score = 0
    let total = 0

    checkInQuestions.forEach((q) => {
      if (!q.isMultiSelect && answers[q.id]) {
        const answer = answers[q.id]
        const isReversed = q.reversed

        if (isReversed) {
          // "ja" is positief
          if (answer === "ja") score += 3
          else if (answer === "soms") score += 2
          else score += 1
        } else {
          // "nee" is positief
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

  // Completion screen - KER stijl
  if (isCompleted) {
    const mood = calculateMood()

    return (
      <div className="min-h-screen bg-background flex flex-col lg:flex-row">
        {/* Desktop: linker kolom met Ger */}
        <div className="lg:w-1/2 lg:bg-primary/5 lg:flex lg:flex-col lg:justify-center lg:items-center lg:p-12">
          {/* Header met Ger */}
          <div className="px-4 pt-8 pb-4 lg:p-0 lg:text-center lg:max-w-md">
            <div className="flex items-start gap-4 lg:flex-col lg:items-center lg:gap-6">
              <GerAvatar size="md" className="lg:w-24 lg:h-24" />
              <div className="pt-1 lg:pt-0">
                <h2 className="text-xl lg:text-2xl font-bold text-foreground">Check-in voltooid!</h2>
                <p className="text-muted-foreground text-sm lg:text-base mt-1 lg:mt-3">
                  Zo te zien gaat het {mood.label.toLowerCase()} met je deze maand.
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
                mood.kleur === "red" && "text-[#C62828]"
              )}>
                {mood.label}
              </h3>
              <p className="text-foreground">
                {mood.kleur === "green"
                  ? "Fijn dat het goed met je gaat! Blijf goed voor jezelf zorgen."
                  : mood.kleur === "amber"
                  ? "Het gaat wisselend. Vergeet niet af en toe hulp te vragen."
                  : "Het lijkt erop dat je het zwaar hebt. We zijn er voor je."}
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
                    <p className="font-medium text-[#C62828] mb-1">Wil je met iemand praten?</p>
                    <p className="text-sm lg:text-base text-[#C62828]">
                      Bel de Mantelzorglijn: <a href="tel:0302059059" className="font-bold underline">030 - 205 9 059</a>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Desktop: button in de card */}
            <div className="hidden lg:block mt-6">
              <button
                onClick={handleComplete}
                disabled={isSaving}
                className="ker-btn ker-btn-primary w-full"
              >
                {isSaving ? "Even geduld..." : "Terug naar dashboard"}
              </button>
            </div>
            </div>
          </main>
        </div>

        {/* Mobiel: Footer */}
        <footer className="fixed bottom-0 left-0 right-0 bg-background p-4 lg:hidden">
          <div className="max-w-md mx-auto">
            <button
              onClick={handleComplete}
              disabled={isSaving}
              className="ker-btn ker-btn-primary w-full"
            >
              {isSaving ? "Even geduld..." : "Terug naar dashboard"}
            </button>
          </div>
        </footer>
      </div>
    )
  }

  // Multi-select vraag
  if (currentQuestion.isMultiSelect && currentQuestion.options) {
    return (
      <div className="min-h-screen bg-background flex flex-col lg:flex-row">
        {/* Desktop: linker kolom met Ger */}
        <div className="lg:w-1/2 lg:bg-primary/5 lg:flex lg:flex-col lg:justify-center lg:items-center lg:p-12">
          {/* Progress pill */}
          <div className="flex justify-center pt-6 pb-4 lg:pt-0 lg:pb-6">
            <div className="ker-pill lg:text-base lg:px-6 lg:py-2">
              vraag <span className="font-bold mx-1">{currentQuestionIndex + 1}</span> van {totalQuestions}
            </div>
          </div>

          {/* Header met Ger */}
          <div className="px-4 pb-4 lg:p-0 lg:text-center lg:max-w-md">
            <div className="flex items-start gap-4 lg:flex-col lg:items-center lg:gap-6">
              <GerAvatar size="md" className="lg:w-24 lg:h-24" />
              <div className="pt-1 lg:pt-0">
                <h2 className="text-xl lg:text-2xl font-bold text-foreground">Maandelijkse check-in</h2>
                <p className="text-muted-foreground text-sm lg:text-base mt-1 lg:mt-3">
                  Even kijken hoe het met je gaat
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Rechter kolom / Vraag */}
        <div className="flex-1 lg:flex lg:flex-col lg:justify-center lg:items-center lg:p-12">
          <main className="px-4 pb-32 lg:px-0 lg:pb-8 lg:w-full lg:max-w-lg">
            <div className="max-w-md mx-auto lg:mx-0 lg:max-w-none">
              <div className="ker-card lg:shadow-lg">
              <p className="text-foreground text-lg text-center mb-6">
                {currentQuestion.question}
              </p>

              <div className="grid grid-cols-2 gap-3">
                {currentQuestion.options.map((option) => {
                  const isSelected = selectedOptions.includes(option.value)
                  return (
                    <button
                      key={option.value}
                      onClick={() => toggleOption(option.value)}
                      className={cn(
                        "p-4 rounded-xl border-2 transition-all text-left",
                        isSelected
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <span className="text-2xl block mb-1">{option.icon}</span>
                      <span className="text-sm font-medium">{option.label}</span>
                    </button>
                  )
                })}
              </div>

              {/* Tip */}
              {currentQuestion.tip && (
                <div className="flex items-start gap-3 bg-muted rounded-xl p-4 mt-4">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <span className="text-primary-foreground text-sm font-bold">i</span>
                  </div>
                  <p className="text-sm lg:text-base text-foreground pt-1">
                    {currentQuestion.tip}
                  </p>
                </div>
              )}

              {/* Desktop: knoppen in de card */}
              <div className="hidden lg:flex items-center justify-between gap-4 mt-8">
                <button
                  onClick={handlePrevious}
                  disabled={currentQuestionIndex === 0}
                  className="ker-btn ker-btn-secondary flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  terug
                </button>

                <button
                  onClick={handleNext}
                  disabled={selectedOptions.length === 0}
                  className={cn(
                    "ker-btn flex items-center gap-2",
                    selectedOptions.length > 0 ? "ker-btn-primary" : "ker-btn-secondary opacity-50"
                  )}
                >
                  {isLastQuestion ? "afsluiten" : "volgende"}
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
              </div>
            </div>
          </main>
        </div>

        {/* Mobiel: Footer met terug en volgende knoppen */}
        <footer className="fixed bottom-0 left-0 right-0 bg-background p-4 lg:hidden">
          <div className="max-w-md mx-auto flex items-center justify-between gap-4">
            <button
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
              className="ker-btn ker-btn-secondary flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              terug
            </button>

            <button
              onClick={handleNext}
              disabled={selectedOptions.length === 0}
              className={cn(
                "ker-btn flex items-center gap-2",
                selectedOptions.length > 0 ? "ker-btn-primary" : "ker-btn-secondary opacity-50"
              )}
            >
              {isLastQuestion ? "afsluiten" : "volgende"}
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </footer>
      </div>
    )
  }

  // Normale vraag met smileys
  const selectedAnswer = answers[currentQuestion.id]

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row">
      {/* Desktop: linker kolom met Ger */}
      <div className="lg:w-1/2 lg:bg-primary/5 lg:flex lg:flex-col lg:justify-center lg:items-center lg:p-12">
        {/* Progress pill */}
        <div className="flex justify-center pt-6 pb-4 lg:pt-0 lg:pb-6">
          <div className="ker-pill lg:text-base lg:px-6 lg:py-2">
            vraag <span className="font-bold mx-1">{currentQuestionIndex + 1}</span> van {totalQuestions}
          </div>
        </div>

        {/* Header met Ger */}
        <div className="px-4 pb-4 lg:p-0 lg:text-center lg:max-w-md">
          <div className="flex items-start gap-4 lg:flex-col lg:items-center lg:gap-6">
            <GerAvatar size="md" className="lg:w-24 lg:h-24" />
            <div className="pt-1 lg:pt-0">
              <h2 className="text-xl lg:text-2xl font-bold text-foreground">Maandelijkse check-in</h2>
              <p className="text-muted-foreground text-sm lg:text-base mt-1 lg:mt-3">
                Even kijken hoe het met je gaat
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Rechter kolom / Vraag */}
      <div className="flex-1 lg:flex lg:flex-col lg:justify-center lg:items-center lg:p-12">
        <main className="px-4 pb-32 lg:px-0 lg:pb-8 lg:w-full lg:max-w-lg">
          <div className="max-w-md mx-auto lg:mx-0 lg:max-w-none">
            <div className="ker-card lg:shadow-lg">
            <p className="text-foreground text-lg text-center mb-8">
              {currentQuestion.question}
            </p>

            {/* Smiley buttons */}
            <div className="mb-6">
              <SmileyGroup
                value={selectedAnswer as "nee" | "soms" | "ja" | null}
                onChange={(val) => handleAnswer(val)}
                disabled={isTransitioning}
                size="lg"
              />
            </div>

            {/* Loading indicator during transition */}
            {isTransitioning && (
              <div className="flex justify-center">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                </div>
              </div>
            )}

            {/* Tip */}
            {currentQuestion.tip && !isTransitioning && (
              <div className="flex items-start gap-3 bg-muted rounded-xl p-4 mt-4">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                  <span className="text-primary-foreground text-sm font-bold">i</span>
                </div>
                <p className="text-sm lg:text-base text-foreground pt-1">
                  {currentQuestion.tip}
                </p>
              </div>
            )}

            {/* Desktop: terug knop in de card */}
            <div className="hidden lg:flex justify-center mt-8">
              <button
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0}
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
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
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
