"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { GerAvatar } from "@/components/GerAvatar"
import { cn } from "@/lib/utils"

const TUTORIAL_VERSION = "3"
export const TUTORIAL_STORAGE_KEY = `tutorial-seen-v${TUTORIAL_VERSION}`
const TOTAL_STEPS = 8

interface TutorialStep {
  stepKey: string
  title: string
  subtitle?: string
  body: string
  tip?: string
  emoji?: string
  items?: { emoji: string; label: string; status?: string }[]
  metadata?: Record<string, any>
}

interface TutorialProps {
  userName: string
  onComplete: () => void
}

export function Tutorial({ userName, onComplete }: TutorialProps) {
  const [step, setStep] = useState(0)

  // Content state - fetched from API
  const [tutorialSteps, setTutorialSteps] = useState<TutorialStep[]>([])
  const [contentLoading, setContentLoading] = useState(true)
  const [contentError, setContentError] = useState<string | null>(null)
  const hasFetchedContent = useRef(false)

  // Fetch tutorial content from API on mount
  useEffect(() => {
    if (hasFetchedContent.current) return
    hasFetchedContent.current = true

    const loadContent = async () => {
      try {
        const res = await fetch("/api/content/app-content?type=TUTORIAL")
        if (!res.ok) throw new Error("Fout bij laden van tutorial")

        const data = await res.json()
        setTutorialSteps(data.content || data.steps || [])
      } catch (error) {
        console.error("Error loading tutorial content:", error)
        setContentError("Oeps, dat lukte niet. Probeer het opnieuw.")
      } finally {
        setContentLoading(false)
      }
    }

    loadContent()
  }, [])

  const handleNext = useCallback(() => {
    if (step < TOTAL_STEPS - 1) {
      setStep(s => s + 1)
    } else {
      handleComplete()
    }
  }, [step])

  const handleBack = useCallback(() => {
    if (step > 0) setStep(s => s - 1)
  }, [step])

  const handleComplete = useCallback(() => {
    localStorage.setItem(TUTORIAL_STORAGE_KEY, "true")
    fetch("/api/user/onboarded", { method: "POST" }).catch(() => {})
    onComplete()
  }, [onComplete])

  const handleSkip = useCallback(() => {
    localStorage.setItem(TUTORIAL_STORAGE_KEY, "true")
    fetch("/api/user/onboarded", { method: "POST" }).catch(() => {})
    onComplete()
  }, [onComplete])

  const progressPercent = ((step + 1) / TOTAL_STEPS) * 100
  const voornaam = userName?.split(" ")[0] || ""

  // Helper to get content for a step by index
  const getStepContent = (index: number): TutorialStep | undefined => tutorialSteps[index]

  if (contentLoading) {
    return (
      <div className="fixed inset-0 z-[100] bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Laden...</p>
        </div>
      </div>
    )
  }

  if (contentError) {
    return (
      <div className="fixed inset-0 z-[100] bg-background flex items-center justify-center">
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

  return (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col">
      {/* Progress bar bovenaan */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-primary">
            Stap {step + 1} van {TOTAL_STEPS}
          </span>
          {step < TOTAL_STEPS - 1 && (
            <button
              onClick={handleSkip}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors py-1 px-2"
            >
              Overslaan
            </button>
          )}
        </div>
        <div className="ker-progress-bar">
          <div
            className="ker-progress-fill"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Content - scrollbaar */}
      <div className="flex-1 overflow-y-auto px-5 pb-28">
        <div className="max-w-lg mx-auto" key={step}>
          {step === 0 && <StapWelkom naam={voornaam} content={getStepContent(0)} />}
          {step === 1 && <StapTest content={getStepContent(1)} />}
          {step === 2 && <StapHulpMantelzorger content={getStepContent(2)} />}
          {step === 3 && <StapHulpNaaste content={getStepContent(3)} />}
          {step === 4 && <StapMantelBuddies content={getStepContent(4)} />}
          {step === 5 && <StapInformatie content={getStepContent(5)} />}
          {step === 6 && <StapFavorieten content={getStepContent(6)} />}
          {step === 7 && <StapKlaar naam={voornaam} content={getStepContent(7)} />}
        </div>
      </div>

      {/* Navigatie knoppen onderaan */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4 safe-area-inset-bottom">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          {step > 0 && step < TOTAL_STEPS - 1 && (
            <button
              onClick={handleBack}
              className="ker-btn ker-btn-secondary flex-1 min-h-[52px] text-base"
            >
              Terug
            </button>
          )}
          {step === 0 && (
            <button
              onClick={handleNext}
              className="ker-btn ker-btn-primary flex-1 min-h-[52px] text-base font-semibold"
            >
              Laten we beginnen!
            </button>
          )}
          {step > 0 && step < TOTAL_STEPS - 1 && (
            <button
              onClick={handleNext}
              className="ker-btn ker-btn-primary flex-1 min-h-[52px] text-base font-semibold"
            >
              Volgende
            </button>
          )}
          {step === TOTAL_STEPS - 1 && (
            <button
              onClick={handleComplete}
              className="ker-btn ker-btn-primary flex-1 min-h-[52px] text-base font-semibold"
            >
              Aan de slag!
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================
// Individuele stappen — mobiel-first, grote tekst, ruim opgezet
// ============================================

function StapWelkom({ naam, content }: { naam: string; content?: TutorialStep }) {
  return (
    <div className="flex flex-col items-center text-center pt-8">
      <GerAvatar size="lg" />
      <h1 className="text-2xl font-bold mt-6 mb-3">
        {content?.title ? content.title.replace("{naam}", naam) : `Hoi ${naam}! 👋`}
      </h1>
      <p className="text-lg text-muted-foreground mb-6">
        {content?.subtitle || "Welkom bij MantelBuddy."}
      </p>
      <div className="ker-card p-5 text-left w-full">
        <p className="text-base leading-relaxed" dangerouslySetInnerHTML={{ __html: content?.body || 'Ik ben <strong>Ger</strong>, en ik ga je stap voor stap uitleggen hoe MantelBuddy jou kan helpen.' }} />
        {content?.tip && (
          <p className="text-base text-muted-foreground mt-3">{content.tip}</p>
        )}
        {!content?.tip && (
          <p className="text-base text-muted-foreground mt-3">
            Het duurt maar 2 minuutjes. ⏱️
          </p>
        )}
      </div>
    </div>
  )
}

function StapTest({ content }: { content?: TutorialStep }) {
  return (
    <div className="pt-6">
      <div className="text-center mb-5">
        <span className="text-5xl">{content?.emoji || "📊"}</span>
        <h2 className="text-xl font-bold mt-3">{content?.title || "De Balanstest"}</h2>
      </div>

      <p className="text-base leading-relaxed mb-6" dangerouslySetInnerHTML={{ __html: content?.body || 'Met een <strong>korte test</strong> van 2 minuten kijken we hoe het met je gaat. Je krijgt een score die laat zien of je het goed volhoudt.' }} />

      {/* Thermometer preview -- vereenvoudigd voor mobiel */}
      <div className="ker-card overflow-hidden">
        <p className="text-sm font-semibold text-muted-foreground mb-3">Zo ziet je score eruit:</p>

        {/* Score */}
        <div className="flex items-end gap-2 mb-3">
          <span className="text-3xl font-bold text-[var(--accent-amber)]">
            13
          </span>
          <span className="text-base text-muted-foreground mb-1">/24</span>
        </div>

        {/* Thermometer balk */}
        <div className="relative h-7 bg-muted rounded-full overflow-hidden">
          <div
            className="absolute left-0 top-0 h-full rounded-full bg-[var(--accent-amber)]"
            style={{ width: "54%" }}
          />
          <div className="absolute inset-0 flex">
            <div className="flex-1 border-r border-white/30" />
            <div className="flex-1 border-r border-white/30" />
            <div className="flex-1" />
          </div>
        </div>
        <div className="flex text-sm text-muted-foreground mt-2">
          <div className="flex-1 text-center">Laag ✓</div>
          <div className="flex-1 text-center">Midden</div>
          <div className="flex-1 text-center">Hoog ⚠</div>
        </div>
      </div>

      {content?.tip && (
        <div className="bg-primary/5 rounded-xl p-4 mt-5">
          <p className="text-base text-foreground">{content.tip}</p>
        </div>
      )}
      {!content?.tip && (
        <div className="bg-primary/5 rounded-xl p-4 mt-5">
          <p className="text-base text-foreground">
            💡 <strong>Tip:</strong> Doe de test regelmatig. Dan kun je zien hoe het gaat over tijd.
          </p>
        </div>
      )}
    </div>
  )
}

function StapHulpMantelzorger({ content }: { content?: TutorialStep }) {
  const defaultItems = [
    { emoji: "💜", label: "Ondersteuning" },
    { emoji: "🏠", label: "Vervangende mantelzorg" },
    { emoji: "💚", label: "Praten" },
    { emoji: "👥", label: "Lotgenoten" },
  ]
  const items = content?.items?.length ? content.items : defaultItems

  return (
    <div className="pt-6">
      <div className="text-center mb-5">
        <span className="text-5xl">{content?.emoji || "💜"}</span>
        <h2 className="text-xl font-bold mt-3">{content?.title || "Hulp voor jou"}</h2>
      </div>

      <p className="text-base leading-relaxed mb-5" dangerouslySetInnerHTML={{ __html: content?.body || 'Je hoeft het niet alleen te doen. MantelBuddy zoekt hulp <strong>bij jou in de buurt</strong>.' }} />

      {/* Categorie knoppen -- 2x2 grid, ruimer opgezet */}
      <div className="grid grid-cols-2 gap-4 mb-5">
        {items.map((item) => (
          <div
            key={item.label}
            className="flex items-center gap-3 p-4 rounded-xl bg-primary/10 border border-primary/20"
          >
            <span className="text-2xl">{item.emoji}</span>
            <p className="text-base font-semibold">{item.label}</p>
          </div>
        ))}
      </div>

      <p className="text-base text-muted-foreground">
        {content?.tip || "📍 Daarom vragen we je adres. Zo vinden we hulp bij jou in de buurt."}
      </p>
    </div>
  )
}

function StapHulpNaaste({ content }: { content?: TutorialStep }) {
  const defaultItems = [
    { emoji: "🛁", label: "Verzorging", status: "zwaar" },
    { emoji: "🧹", label: "Huishouden", status: "gemiddeld" },
    { emoji: "🍽️", label: "Maaltijden", status: "gemiddeld" },
    { emoji: "🚗", label: "Vervoer", status: "licht" },
  ]
  const items = content?.items?.length ? content.items : defaultItems

  return (
    <div className="pt-6">
      <div className="text-center mb-5">
        <span className="text-5xl">{content?.emoji || "💝"}</span>
        <h2 className="text-xl font-bold mt-3">{content?.title || "Hulp voor je naaste"}</h2>
      </div>

      <p className="text-base leading-relaxed mb-5" dangerouslySetInnerHTML={{ __html: content?.body || 'Er is ook hulp voor de persoon waar je voor zorgt. De kleuren laten zien wat het zwaarst is.' }} />

      {/* Categorie knoppen met taakstatus kleuren */}
      <div className="grid grid-cols-2 gap-4 mb-5">
        {items.map((item) => (
          <div
            key={item.label}
            className={cn(
              "flex items-center gap-3 p-4 rounded-xl",
              item.status === "zwaar" && "bg-[var(--accent-red-bg)] border-2 border-[var(--accent-red)]",
              item.status === "gemiddeld" && "bg-[var(--accent-amber-bg)] border-2 border-[var(--accent-amber)]",
              item.status === "licht" && "bg-[var(--accent-green-bg)] border-2 border-[var(--accent-green)]",
            )}
          >
            <span className="text-2xl">{item.emoji}</span>
            <p className="text-base font-semibold">{item.label}</p>
          </div>
        ))}
      </div>

      {content?.tip && (
        <div className="bg-primary/5 rounded-xl p-4">
          <p className="text-base text-foreground">{content.tip}</p>
        </div>
      )}
      {!content?.tip && (
        <div className="bg-primary/5 rounded-xl p-4">
          <p className="text-base text-foreground">
            💡 <strong>Tip:</strong> We vragen twee adressen. Eén voor jou en één voor je naaste.
            Zo vinden we voor allebei de juiste hulp.
          </p>
        </div>
      )}
    </div>
  )
}

function StapMantelBuddies({ content }: { content?: TutorialStep }) {
  const defaultItems = [
    { emoji: "🛒", label: "Boodschappen doen" },
    { emoji: "☕", label: "Even een praatje maken" },
    { emoji: "🚗", label: "Mee naar de dokter" },
    { emoji: "🔧", label: "Klusjes in huis" },
  ]
  const items = content?.items?.length ? content.items : defaultItems

  return (
    <div className="pt-6">
      <div className="text-center mb-5">
        <span className="text-5xl">{content?.emoji || "🤝"}</span>
        <h2 className="text-xl font-bold mt-3">{content?.title || "MantelBuddies"}</h2>
      </div>

      <p className="text-base leading-relaxed mb-5" dangerouslySetInnerHTML={{ __html: content?.body || 'Een <strong>MantelBuddy</strong> is een vrijwilliger bij jou in de buurt. Die helpt je graag met kleine taken.' }} />

      {/* Lijst met taken -- eenvoudig en ruim */}
      <div className="ker-card bg-gradient-to-r from-primary/5 to-primary/10">
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.label} className="flex items-center gap-3">
              <span className="text-xl">{item.emoji}</span>
              <span className="text-base">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      <p className="text-base text-muted-foreground mt-5" dangerouslySetInnerHTML={{ __html: content?.tip || 'Eenmalig of vaker -- jij kiest. Je vindt ze bij <strong>Hulp</strong>.' }} />
    </div>
  )
}

function StapInformatie({ content }: { content?: TutorialStep }) {
  const defaultItems = [
    { emoji: "💡", label: "Praktische tips" },
    { emoji: "🧘", label: "Zelfzorg" },
    { emoji: "⚖️", label: "Je rechten" },
    { emoji: "💰", label: "Financieel" },
  ]
  const items = content?.items?.length ? content.items : defaultItems

  return (
    <div className="pt-6">
      <div className="text-center mb-5">
        <span className="text-5xl">{content?.emoji || "📚"}</span>
        <h2 className="text-xl font-bold mt-3">{content?.title || "Informatie en tips"}</h2>
      </div>

      <p className="text-base leading-relaxed mb-5" dangerouslySetInnerHTML={{ __html: content?.body || 'Bij <strong>Informatie</strong> vind je handige artikelen en nieuws uit jouw gemeente.' }} />

      {/* Categorie grid -- vereenvoudigd */}
      <div className="grid grid-cols-2 gap-4 mb-5">
        {items.map((item) => (
          <div key={item.label} className="ker-card flex flex-col items-start p-4">
            <span className="text-3xl mb-2">{item.emoji}</span>
            <p className="font-bold text-base">{item.label}</p>
          </div>
        ))}
      </div>

      {/* Gemeente nieuws kaart */}
      <div className="ker-card flex items-center gap-4 p-4 relative">
        <span className="text-3xl">🏘️</span>
        <div className="flex-1">
          <p className="font-bold text-base">Nieuws van de gemeente</p>
          <p className="text-sm text-muted-foreground">
            Updates bij jou in de buurt
          </p>
        </div>
        <span className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-[var(--accent-red)] text-white text-xs font-bold rounded-full flex items-center justify-center">
          2
        </span>
      </div>
    </div>
  )
}

function StapFavorieten({ content }: { content?: TutorialStep }) {
  return (
    <div className="pt-6">
      <div className="text-center mb-5">
        <span className="text-5xl">{content?.emoji || "❤️"}</span>
        <h2 className="text-xl font-bold mt-3">{content?.title || "Bewaar je favorieten"}</h2>
      </div>

      <p className="text-base leading-relaxed mb-5" dangerouslySetInnerHTML={{ __html: content?.body || 'Kom je iets tegen dat je wilt onthouden? Tik op het <strong class="text-primary">hartje ❤️</strong> om het te bewaren.' }} />

      {/* Voorbeeld kaart met hartje */}
      <div className="ker-card py-4 mb-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <p className="font-medium text-base">Mantelzorgondersteuning</p>
            <p className="text-sm text-muted-foreground mt-1">Hulp bij jou in de buurt</p>
          </div>
          <svg
            className="w-7 h-7 text-primary fill-primary flex-shrink-0"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
        </div>
      </div>

      <p className="text-base leading-relaxed" dangerouslySetInnerHTML={{ __html: content?.tip || 'Je favorieten vind je terug op een eigen pagina. Daar kun je ze ook <strong>afvinken</strong> als je ze hebt gedaan. ✅' }} />
    </div>
  )
}

function StapKlaar({ naam, content }: { naam: string; content?: TutorialStep }) {
  return (
    <div className="flex flex-col items-center text-center pt-8">
      <GerAvatar size="lg" />
      <div className="text-4xl mt-4 mb-2">{content?.emoji || "🎉"}</div>
      <h2 className="text-2xl font-bold mb-4">{content?.title || "Je bent er klaar voor!"}</h2>

      <div className="ker-card p-5 text-left w-full mb-5">
        <p className="text-base leading-relaxed">
          {content?.body
            ? content.body.replace("{naam}", naam)
            : (naam ? `${naam}, ik` : "Ik") + " ben trots op je dat je deze stap zet. Mantelzorg is niet makkelijk, maar je staat er niet alleen voor."}
        </p>
      </div>

      <p className="text-base text-muted-foreground" dangerouslySetInnerHTML={{ __html: content?.tip || 'Je kunt deze uitleg altijd teruglezen via je <strong>Profiel</strong>. 👤' }} />
    </div>
  )
}
