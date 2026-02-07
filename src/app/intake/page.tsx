"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { GerAvatar } from "@/components/GerAvatar"
import { SmileyGroup, ResultSmiley } from "@/components/ui"

// Vragen - simpele B1 taalgebruik
const intakeCategories = [
  {
    id: "1",
    name: "Jouw energie",
    description: "Hoe voel jij je lichamelijk?",
    questions: [
      {
        id: "q1",
        question: "Slaap je slechter door de zorg?",
        tip: "Veel mensen die zorgen slapen minder goed. Door piekeren of 's nachts wakker worden.",
      },
      {
        id: "q2",
        question: "Ben je vaak moe?",
        tip: "Moe zijn komt veel voor als je voor iemand zorgt.",
      },
      {
        id: "q3",
        question: "Heb je pijn door het zorgen?",
        tip: "Tillen en stress kunnen pijn geven aan rug, nek of hoofd.",
      },
    ],
  },
  {
    id: "2",
    name: "Jouw gevoel",
    description: "Hoe voel je je van binnen?",
    questions: [
      {
        id: "q4",
        question: "Maak je je vaak zorgen?",
        tip: "Zorgen maken is normaal. Maar als je er veel last van hebt, is het zwaar.",
      },
      {
        id: "q5",
        question: "Ben je vaak verdrietig?",
        tip: "Verdrietig zijn kan een teken zijn dat het te veel wordt.",
      },
      {
        id: "q6",
        question: "Voel je je schuldig als je iets leuks doet?",
        tip: "Dit gevoel komt vaak voor. Maar voor jezelf zorgen is niet egoïstisch.",
      },
    ],
  },
  {
    id: "3",
    name: "Jouw tijd",
    description: "Heb je genoeg tijd voor jezelf?",
    questions: [
      {
        id: "q7",
        question: "Heb je weinig tijd voor jezelf?",
        tip: "Tijd voor jezelf is belangrijk. Ook al lijkt dat soms luxe.",
      },
      {
        id: "q8",
        question: "Is het lastig om werk en zorg te doen?",
        tip: "Werk en zorg samen is zwaar. Er is hulp voor.",
      },
      {
        id: "q9",
        question: "Moet je vaak dingen afzeggen?",
        tip: "Steeds dingen afzeggen is niet fijn voor je.",
      },
    ],
  },
  {
    id: "4",
    name: "Jouw steun",
    description: "Krijg je hulp van anderen?",
    questions: [
      {
        id: "q10",
        question: "Voel je je alleen met de zorg?",
        tip: "Veel mensen voelen zich alleen. Ook als er mensen om hen heen zijn.",
      },
      {
        id: "q11",
        question: "Vind je het moeilijk om hulp te vragen?",
        tip: "Hulp vragen is lastig voor veel mensen. Maar het kan echt helpen.",
      },
      {
        id: "q12",
        question: "Begrijpen anderen je niet goed?",
        tip: "Niet iedereen snapt hoe zwaar zorgen is. Dat kan eenzaam voelen.",
      },
    ],
  },
]

export default function IntakePage() {
  const router = useRouter()
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [isCompleted, setIsCompleted] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)

  const currentCategory = intakeCategories[currentCategoryIndex]
  const currentQuestion = currentCategory.questions[currentQuestionIndex]
  const isLastQuestion = currentQuestionIndex === currentCategory.questions.length - 1
  const isLastCategory = currentCategoryIndex === intakeCategories.length - 1
  const isFirstQuestion = currentCategoryIndex === 0 && currentQuestionIndex === 0

  const totalQuestions = intakeCategories.reduce((acc, cat) => acc + cat.questions.length, 0)
  const currentQuestionNumber = intakeCategories
    .slice(0, currentCategoryIndex)
    .reduce((acc, cat) => acc + cat.questions.length, 0) + currentQuestionIndex + 1

  const handleAnswer = (value: string) => {
    if (isTransitioning) return

    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: value,
    }))

    // Auto-advance after delay
    setIsTransitioning(true)
    setTimeout(() => {
      if (!isLastQuestion) {
        setCurrentQuestionIndex((prev) => prev + 1)
      } else if (!isLastCategory) {
        setCurrentCategoryIndex((prev) => prev + 1)
        setCurrentQuestionIndex(0)
      } else {
        setIsCompleted(true)
      }
      setIsTransitioning(false)
    }, 1000)
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1)
    } else if (currentCategoryIndex > 0) {
      setCurrentCategoryIndex((prev) => prev - 1)
      setCurrentQuestionIndex(intakeCategories[currentCategoryIndex - 1].questions.length - 1)
    }
  }

  const handleComplete = async () => {
    setIsSaving(true)
    const scores = calculateScores()

    try {
      // Sla lokaal op
      localStorage.setItem("intake_answers", JSON.stringify(answers))
      localStorage.setItem("intake_scores", JSON.stringify(scores))
      localStorage.setItem("intake_completed", "true")

      // Probeer op te slaan naar server
      await fetch("/api/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      })

      router.push("/belastbaarheidstest")
    } catch {
      router.push("/belastbaarheidstest")
    } finally {
      setIsSaving(false)
    }
  }

  const calculateScores = () => {
    return intakeCategories.map((cat) => {
      const categoryAnswers = cat.questions
        .map((q) => answers[q.id])
        .filter(Boolean)

      const totalScore = categoryAnswers.reduce((acc, answer) => {
        if (answer === "nee") return acc + 3
        if (answer === "soms") return acc + 2
        return acc + 1
      }, 0)

      const maxScore = categoryAnswers.length * 3
      const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0

      return {
        name: cat.name,
        percentage,
        level: percentage >= 70 ? "goed" : percentage >= 40 ? "aandacht" : "zorg",
      }
    })
  }

  // Resultaat scherm
  if (isCompleted) {
    const scores = calculateScores()
    const overallScore = Math.round(scores.reduce((acc, s) => acc + s.percentage, 0) / scores.length)
    const overallLevel = overallScore >= 70 ? "goed" : overallScore >= 40 ? "aandacht" : "zorg"

    return (
      <div className="ker-page">
        {/* Header met Ger */}
        <div className="px-4 pt-8 pb-4">
          <div className="max-w-md mx-auto flex items-start gap-4">
            <GerAvatar size="md" />
            <div className="pt-1">
              <h2 className="text-xl font-bold text-foreground">Bedankt!</h2>
              <p className="text-muted-foreground text-sm mt-1">
                Dit is een eerste beeld van hoe het met je gaat.
              </p>
            </div>
          </div>
        </div>

        <main className="px-4 pb-32">
          <div className="max-w-md mx-auto space-y-4">
            {/* Overall score */}
            <div
              className={cn(
                "ker-card text-center",
                overallLevel === "goed" && "bg-[var(--accent-green-bg)]",
                overallLevel === "aandacht" && "bg-[var(--accent-amber-bg)]",
                overallLevel === "zorg" && "bg-[var(--accent-red-bg)]"
              )}
            >
              <div className="mx-auto mb-4">
                <ResultSmiley
                  type={overallLevel === "goed" ? "green" : overallLevel === "aandacht" ? "amber" : "red"}
                  size="xl"
                />
              </div>
              <h3
                className={cn(
                  "text-xl font-bold mb-2",
                  overallLevel === "goed" && "text-[var(--accent-green)]",
                  overallLevel === "aandacht" && "text-[var(--accent-amber)]",
                  overallLevel === "zorg" && "text-[var(--accent-red)]"
                )}
              >
                {overallLevel === "goed"
                  ? "Je bent goed in balans"
                  : overallLevel === "aandacht"
                  ? "Er zijn aandachtspunten"
                  : "Je hebt hulp nodig"}
              </h3>
            </div>

            {/* Per categorie */}
            <div className="ker-card">
              <h4 className="font-bold text-foreground mb-4">Per onderwerp</h4>
              <div className="space-y-3">
                {scores.map((score) => (
                  <div key={score.name} className="flex items-center gap-3">
                    <div
                      className={cn(
                        "w-4 h-4 rounded-full flex-shrink-0",
                        score.level === "goed" && "bg-[var(--emoticon-green)]",
                        score.level === "aandacht" && "bg-[var(--emoticon-yellow)]",
                        score.level === "zorg" && "bg-[var(--emoticon-red)]"
                      )}
                    />
                    <span className="text-foreground flex-1">{score.name}</span>
                    <span
                      className={cn(
                        "text-sm font-medium",
                        score.level === "goed" && "text-[var(--accent-green)]",
                        score.level === "aandacht" && "text-[var(--accent-amber)]",
                        score.level === "zorg" && "text-[var(--accent-red)]"
                      )}
                    >
                      {score.level === "goed"
                        ? "Goed"
                        : score.level === "aandacht"
                        ? "Let op"
                        : "Zwaar"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tip */}
            <div className="ker-card bg-muted">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                  <span className="text-primary-foreground text-sm font-bold">i</span>
                </div>
                <p className="text-sm text-foreground pt-1">
                  Voor een completer beeld kun je de Balanstest doen. Daar kijken we ook naar je zorgtaken.
                </p>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="fixed bottom-0 left-0 right-0 bg-background p-4">
          <div className="max-w-md mx-auto">
            <button onClick={handleComplete} disabled={isSaving} className="ker-btn ker-btn-primary w-full">
              {isSaving ? "Even geduld..." : "Naar de Balanstest"}
            </button>
          </div>
        </footer>
      </div>
    )
  }

  // Vraag scherm
  const selectedAnswer = answers[currentQuestion.id]

  return (
    <div className="ker-page">
      {/* Header */}
      <header className="ker-header">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold">K</span>
            </div>
            <span className="font-bold text-foreground">MB</span>
          </Link>
          <div className="ker-pill text-sm">
            vraag <span className="font-bold mx-1">{currentQuestionNumber}</span> van {totalQuestions}
          </div>
        </div>
      </header>

      {/* Progress bar */}
      <div className="ker-progress-bar mx-4 mt-4">
        <div
          className="ker-progress-fill"
          style={{ width: `${(currentQuestionNumber / totalQuestions) * 100}%` }}
        />
      </div>

      {/* Categorie header */}
      <div className="px-4 pt-6 pb-2">
        <div className="max-w-md mx-auto flex items-start gap-4">
          <GerAvatar size="md" />
          <div className="pt-1">
            <h2 className="text-xl font-bold text-foreground">{currentCategory.name}</h2>
            <p className="text-muted-foreground text-sm mt-1">{currentCategory.description}</p>
          </div>
        </div>
      </div>

      {/* Vraag */}
      <main className="px-4 pb-32">
        <div className="max-w-md mx-auto">
          <div className="ker-card">
            <p className="text-foreground text-lg text-center mb-8">{currentQuestion.question}</p>

            {/* Emoticon buttons */}
            <div className="mb-6">
              <SmileyGroup
                value={selectedAnswer as "nee" | "soms" | "ja" | null}
                onChange={(val) => handleAnswer(val)}
                disabled={isTransitioning}
                size="lg"
              />
            </div>

            {/* Loading indicator */}
            {isTransitioning && (
              <div className="flex justify-center">
                <div className="flex space-x-1">
                  <div className="loading-dot" />
                  <div className="loading-dot" />
                  <div className="loading-dot" />
                </div>
              </div>
            )}

            {/* Tip */}
            {currentQuestion.tip && !isTransitioning && (
              <div className="flex items-start gap-3 bg-muted rounded-xl p-4 mt-4">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                  <span className="text-primary-foreground text-sm font-bold">i</span>
                </div>
                <p className="text-sm text-foreground pt-1">{currentQuestion.tip}</p>
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
            disabled={isFirstQuestion}
            className="ker-btn ker-btn-secondary flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            terug
          </button>

          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <span className="text-primary font-bold text-lg">MB</span>
          </div>

          <div
            className={cn(
              "ker-btn flex items-center gap-2",
              selectedAnswer ? "ker-btn-primary" : "ker-btn-secondary opacity-50"
            )}
          >
            maak keuze
          </div>
        </div>
      </footer>
    </div>
  )
}
