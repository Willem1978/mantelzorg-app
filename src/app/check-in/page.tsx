"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { GerAvatar } from "@/components/GerAvatar"

// Korte maandelijkse check-in vragen (NEE/SOMS/JA stijl)
const checkInQuestions = [
  {
    id: "c1",
    question: "Voel je je de afgelopen maand vaak moe of uitgeput?",
    tip: "Vermoeidheid kan een signaal zijn dat je te veel hooi op je vork hebt.",
    reversed: false, // "nee" is positief
  },
  {
    id: "c2",
    question: "Had je genoeg tijd voor jezelf deze maand?",
    tip: "Tijd voor jezelf is essentieel, ook al voelt het soms als luxe.",
    reversed: true, // "ja" is hier positief
  },
  {
    id: "c3",
    question: "Maakte je je veel zorgen over de zorgsituatie?",
    tip: "Zorgen maken is normaal, maar het mag niet overweldigend worden.",
    reversed: false,
  },
  {
    id: "c4",
    question: "Voelde je je gesteund door je omgeving?",
    tip: "Steun van anderen kan een groot verschil maken.",
    reversed: true,
  },
  {
    id: "c5",
    question: "Is er iets waar je extra hulp bij zou willen?",
    tip: "We kunnen je helpen met het vinden van de juiste ondersteuning.",
    isText: true,
  },
]

export default function CheckInPage() {
  const router = useRouter()
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [isCompleted, setIsCompleted] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [textInput, setTextInput] = useState("")

  const currentQuestion = checkInQuestions[currentQuestionIndex]
  const totalQuestions = checkInQuestions.length
  const isLastQuestion = currentQuestionIndex === totalQuestions - 1

  const handleAnswer = (value: string) => {
    if (isTransitioning) return

    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: value,
    }))

    // Auto-advance after delay (niet voor tekst vragen)
    if (!currentQuestion.isText) {
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

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1)
    }
  }

  const handleNext = () => {
    if (currentQuestion.isText) {
      setAnswers((prev) => ({
        ...prev,
        [currentQuestion.id]: textInput,
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
      if (!q.isText && answers[q.id]) {
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
      <div className="min-h-screen bg-background">
        {/* Header met Ger */}
        <div className="px-4 pt-8 pb-4">
          <div className="max-w-md mx-auto flex items-start gap-4">
            <GerAvatar size="md" />
            <div className="pt-1">
              <h2 className="text-xl font-bold text-foreground">Check-in voltooid!</h2>
              <p className="text-muted-foreground text-sm mt-1">
                Zo te zien gaat het {mood.label.toLowerCase()} met je deze maand.
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
              mood.kleur === "green" && "bg-[#E8F5E9]",
              mood.kleur === "amber" && "bg-[#FFF8E1]",
              mood.kleur === "red" && "bg-[#FFEBEE]"
            )}>
              <div className={cn(
                "w-20 h-20 rounded-full mx-auto flex items-center justify-center text-4xl mb-4",
                mood.kleur === "green" && "bg-[var(--emoticon-green)]",
                mood.kleur === "amber" && "bg-[var(--emoticon-yellow)]",
                mood.kleur === "red" && "bg-[var(--emoticon-red)]"
              )}>
                {mood.kleur === "green" ? "🙂" : mood.kleur === "amber" ? "😐" : "🙁"}
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
                    <p className="text-sm text-[#C62828]">
                      Bel de Mantelzorglijn: <a href="tel:0302059059" className="font-bold underline">030 - 205 9 059</a>
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>

        {/* Footer */}
        <footer className="fixed bottom-0 left-0 right-0 bg-background p-4">
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

  // Text vraag
  if (currentQuestion.isText) {
    return (
      <div className="min-h-screen bg-background">
        {/* Progress pill */}
        <div className="flex justify-center pt-6 pb-4">
          <div className="ker-pill">
            vraag <span className="font-bold mx-1">{currentQuestionIndex + 1}</span> van {totalQuestions}
          </div>
        </div>

        {/* Header met Ger */}
        <div className="px-4 pb-4">
          <div className="max-w-md mx-auto flex items-start gap-4">
            <GerAvatar size="md" />
            <div className="pt-1">
              <h2 className="text-xl font-bold text-foreground">Maandelijkse check-in</h2>
              <p className="text-muted-foreground text-sm mt-1">
                Even kijken hoe het met je gaat
              </p>
            </div>
          </div>
        </div>

        {/* Vraag */}
        <main className="px-4 pb-32">
          <div className="max-w-md mx-auto">
            <div className="ker-card">
              <p className="text-foreground text-lg text-center mb-6">
                {currentQuestion.question}
              </p>

              <textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Typ hier je antwoord..."
                className="ker-input min-h-[150px] resize-none"
              />

              {/* Tip */}
              {currentQuestion.tip && (
                <div className="flex items-start gap-3 bg-muted rounded-xl p-4 mt-4">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <span className="text-primary-foreground text-sm font-bold">i</span>
                  </div>
                  <p className="text-sm text-foreground pt-1">
                    {currentQuestion.tip}
                  </p>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="fixed bottom-0 left-0 right-0 bg-background p-4">
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

            <div className="flex items-center justify-center">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <span className="text-primary font-bold text-lg">KER</span>
              </div>
            </div>

            <button
              onClick={handleNext}
              className="ker-btn ker-btn-primary flex items-center gap-2"
            >
              {isLastQuestion ? "afronden" : "volgende"}
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
  const isReversed = currentQuestion.reversed

  // Bij reversed vragen: JA is positief (groen), NEE is negatief (rood)
  // Bij normale vragen: NEE is positief (groen), JA is negatief (rood)
  const getOptionConfig = (value: "nee" | "soms" | "ja") => {
    if (isReversed) {
      // Reversed: JA = goed, NEE = slecht
      switch (value) {
        case "ja": return { emoji: "🙂", color: "green" }
        case "soms": return { emoji: "😐", color: "yellow" }
        case "nee": return { emoji: "🙁", color: "red" }
      }
    } else {
      // Normaal: NEE = goed, JA = slecht
      switch (value) {
        case "nee": return { emoji: "🙂", color: "green" }
        case "soms": return { emoji: "😐", color: "yellow" }
        case "ja": return { emoji: "🙁", color: "red" }
      }
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Progress pill */}
      <div className="flex justify-center pt-6 pb-4">
        <div className="ker-pill">
          vraag <span className="font-bold mx-1">{currentQuestionIndex + 1}</span> van {totalQuestions}
        </div>
      </div>

      {/* Header met Ger */}
      <div className="px-4 pb-4">
        <div className="max-w-md mx-auto flex items-start gap-4">
          <GerAvatar size="md" />
          <div className="pt-1">
            <h2 className="text-xl font-bold text-foreground">Maandelijkse check-in</h2>
            <p className="text-muted-foreground text-sm mt-1">
              Even kijken hoe het met je gaat
            </p>
          </div>
        </div>
      </div>

      {/* Vraag */}
      <main className="px-4 pb-32">
        <div className="max-w-md mx-auto">
          <div className="ker-card">
            <p className="text-foreground text-lg text-center mb-8">
              {currentQuestion.question}
            </p>

            {/* Emoticon buttons - volgorde afhankelijk van reversed */}
            <div className="flex justify-center gap-6 mb-6">
              {(["nee", "soms", "ja"] as const).map((value) => {
                const config = getOptionConfig(value)
                const isSelected = selectedAnswer === value
                const hasAnswer = !!selectedAnswer

                return (
                  <button
                    key={value}
                    onClick={() => handleAnswer(value)}
                    disabled={isTransitioning}
                    className="flex flex-col items-center gap-2"
                  >
                    <div className={cn(
                      "emoticon-btn transition-all duration-300",
                      isSelected
                        ? `selected bg-[var(--emoticon-${config.color})] scale-110`
                        : hasAnswer
                          ? "bg-gray-200 opacity-50"
                          : `bg-[var(--emoticon-${config.color})]/20 hover:bg-[var(--emoticon-${config.color})]/40`
                    )}>
                      <span className={cn(
                        "text-3xl transition-all duration-300",
                        hasAnswer && !isSelected && "grayscale"
                      )}>{config.emoji}</span>
                    </div>
                    <span className={cn(
                      "text-sm font-medium transition-all duration-300",
                      isSelected ? "text-foreground" : hasAnswer ? "text-gray-400" : "text-muted-foreground"
                    )}>{value.toUpperCase()}</span>
                  </button>
                )
              })}
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
                <p className="text-sm text-foreground pt-1">
                  {currentQuestion.tip}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-background p-4">
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

          <div className="flex items-center justify-center">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <span className="text-primary font-bold text-lg">KER</span>
            </div>
          </div>

          <div className={cn(
            "ker-btn flex items-center gap-2",
            selectedAnswer ? "ker-btn-primary" : "ker-btn-secondary opacity-50"
          )}>
            maak keuze
          </div>
        </div>
      </footer>
    </div>
  )
}
