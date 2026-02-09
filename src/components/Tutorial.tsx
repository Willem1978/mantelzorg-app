"use client"

import { useState, useCallback } from "react"
import { GerAvatar } from "@/components/GerAvatar"

const TUTORIAL_VERSION = "3"
export const TUTORIAL_STORAGE_KEY = `tutorial-seen-v${TUTORIAL_VERSION}`
const TOTAL_STEPS = 8

interface TutorialProps {
  userName: string
  onComplete: () => void
}

export function Tutorial({ userName, onComplete }: TutorialProps) {
  const [step, setStep] = useState(0)

  const handleNext = useCallback(() => {
    if (step < TOTAL_STEPS - 1) {
      setStep(s => s + 1)
    } else {
      // Laatste stap - tutorial afronden
      handleComplete()
    }
  }, [step])

  const handleBack = useCallback(() => {
    if (step > 0) setStep(s => s - 1)
  }, [step])

  const handleComplete = useCallback(() => {
    localStorage.setItem(TUTORIAL_STORAGE_KEY, "true")
    // API call om onboardedAt te zetten (fire-and-forget)
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

  return (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col">
      {/* Progress bar bovenaan */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-2">
          <span className="ker-pill ker-pill-primary text-xs">
            stap <span className="font-bold mx-1">{step + 1}</span> van {TOTAL_STEPS}
          </span>
          {step < TOTAL_STEPS - 1 && (
            <button
              onClick={handleSkip}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
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
      <div className="flex-1 overflow-y-auto px-4 pb-32">
        <div className="max-w-md mx-auto animate-fade-in" key={step}>
          {step === 0 && <StapWelkom naam={voornaam} />}
          {step === 1 && <StapTest />}
          {step === 2 && <StapHulpMantelzorger />}
          {step === 3 && <StapHulpNaaste />}
          {step === 4 && <StapMantelBuddies />}
          {step === 5 && <StapInformatie />}
          {step === 6 && <StapFavorieten />}
          {step === 7 && <StapKlaar naam={voornaam} />}
        </div>
      </div>

      {/* Navigatie knoppen onderaan */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4 safe-area-inset-bottom">
        <div className="max-w-md mx-auto flex items-center gap-3">
          {step > 0 && step < TOTAL_STEPS - 1 && (
            <button
              onClick={handleBack}
              className="ker-btn ker-btn-secondary flex-1 min-h-[48px]"
            >
              Terug
            </button>
          )}
          {step === 0 && (
            <button
              onClick={handleNext}
              className="ker-btn ker-btn-primary flex-1 min-h-[48px] text-base font-semibold"
            >
              Laten we beginnen!
            </button>
          )}
          {step > 0 && step < TOTAL_STEPS - 1 && (
            <button
              onClick={handleNext}
              className="ker-btn ker-btn-primary flex-1 min-h-[48px] text-base font-semibold"
            >
              Volgende
            </button>
          )}
          {step === TOTAL_STEPS - 1 && (
            <button
              onClick={handleComplete}
              className="ker-btn ker-btn-primary flex-1 min-h-[48px] text-base font-semibold"
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
// Individuele stappen
// ============================================

function StapWelkom({ naam }: { naam: string }) {
  return (
    <div className="flex flex-col items-center text-center pt-8">
      <GerAvatar size="lg" />
      <h1 className="text-2xl font-bold mt-6 mb-2">
        Hoi {naam}! <span className="inline-block animate-bounce-subtle">👋</span>
      </h1>
      <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
        Welkom bij MantelBuddy.
      </p>
      <div className="ker-card p-5 text-left w-full">
        <p className="text-sm leading-relaxed text-foreground">
          Ik ben <strong>Ger</strong>, en ik ga je stap voor stap uitleggen
          hoe MantelBuddy jou kan helpen.
        </p>
        <p className="text-sm text-muted-foreground mt-3">
          Het duurt maar 2 minuutjes. ⏱️
        </p>
      </div>
    </div>
  )
}

function StapTest() {
  return (
    <div className="pt-6">
      <div className="text-center mb-6">
        <span className="text-5xl">📊</span>
        <h2 className="text-xl font-bold mt-3">Hoe gaat het met jou?</h2>
      </div>

      <p className="text-sm leading-relaxed mb-4">
        Als mantelzorger doe je heel veel. Soms te veel.
        Met een <strong>korte test</strong> (2 minuten) kijken we samen hoe het met jou gaat.
      </p>

      <p className="text-sm leading-relaxed mb-5">
        Je krijgt een score die laat zien of je het goed volhoudt,
        of dat je misschien hulp kunt gebruiken.
      </p>

      {/* Visueel: Mini thermometer */}
      <div className="ker-card p-4 mb-5">
        <p className="text-xs font-semibold text-muted-foreground mb-3">Zo ziet jouw score eruit:</p>
        <div className="relative h-6 rounded-full overflow-hidden bg-muted">
          <div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{
              width: "55%",
              background: "linear-gradient(to right, var(--accent-green), var(--accent-amber))",
            }}
          />
        </div>
        <div className="flex justify-between mt-1.5 text-[10px] text-muted-foreground">
          <span>Goed 😊</span>
          <span>Wisselend 😐</span>
          <span>Zwaar 😟</span>
        </div>
      </div>

      {/* Tip kaartje */}
      <div className="bg-primary/5 rounded-xl p-3">
        <p className="text-sm text-muted-foreground">
          💡 <strong>Tip:</strong> Doe de test elke week. Dan kun je zien hoe het gaat over tijd.
        </p>
      </div>
    </div>
  )
}

function StapHulpMantelzorger() {
  return (
    <div className="pt-6">
      <div className="text-center mb-6">
        <span className="text-5xl">💜</span>
        <h2 className="text-xl font-bold mt-3">Er is hulp voor jou</h2>
      </div>

      <p className="text-sm leading-relaxed mb-4">
        Je hoeft het niet alleen te doen. MantelBuddy laat zien welke hulp er is
        <strong> in jouw gemeente</strong>.
      </p>

      {/* Visueel: 2x2 grid met hulpvormen */}
      <div className="grid grid-cols-2 gap-2 mb-5">
        {[
          { emoji: "🧘", label: "Ondersteuning" },
          { emoji: "🌿", label: "Respijtzorg" },
          { emoji: "🤝", label: "Lotgenoten" },
          { emoji: "💬", label: "Emotionele steun" },
        ].map((item) => (
          <div key={item.label} className="ker-card p-3 flex items-center gap-2">
            <span className="text-xl">{item.emoji}</span>
            <span className="text-xs font-medium">{item.label}</span>
          </div>
        ))}
      </div>

      <p className="text-sm leading-relaxed text-muted-foreground">
        Daarom vragen we je adres: zo vinden we hulp bij jou in de buurt. 📍
      </p>
    </div>
  )
}

function StapHulpNaaste() {
  return (
    <div className="pt-6">
      <div className="text-center mb-6">
        <span className="text-5xl">💝</span>
        <h2 className="text-xl font-bold mt-3">Hulp voor je naaste</h2>
      </div>

      <p className="text-sm leading-relaxed mb-4">
        Er is ook hulp voor de persoon waar je voor zorgt.
        Denk aan thuiszorg, dagbesteding of hulp bij het huishouden.
      </p>

      {/* Visueel: 2x2 grid met hulpvormen naaste */}
      <div className="grid grid-cols-2 gap-2 mb-5">
        {[
          { emoji: "🏠", label: "Thuiszorg" },
          { emoji: "☀️", label: "Dagbesteding" },
          { emoji: "🍳", label: "Maaltijdservice" },
          { emoji: "🧹", label: "Huishoudelijke hulp" },
        ].map((item) => (
          <div key={item.label} className="ker-card p-3 flex items-center gap-2">
            <span className="text-xl">{item.emoji}</span>
            <span className="text-xs font-medium">{item.label}</span>
          </div>
        ))}
      </div>

      <p className="text-sm leading-relaxed mb-4">
        Deze hulp is beschikbaar in de <strong>gemeente van je naaste</strong>.
        Dat kan een andere gemeente zijn dan waar jij woont.
      </p>

      {/* Tip kaartje */}
      <div className="bg-primary/5 rounded-xl p-3">
        <p className="text-sm text-muted-foreground">
          💡 <strong>Tip:</strong> Daarom vragen we twee adressen: voor jou en voor je naaste.
          Zo vinden we voor allebei de juiste hulp.
        </p>
      </div>
    </div>
  )
}

function StapMantelBuddies() {
  return (
    <div className="pt-6">
      <div className="text-center mb-6">
        <span className="text-5xl">🤝</span>
        <h2 className="text-xl font-bold mt-3">Wist je dit? Er zijn MantelBuddies!</h2>
      </div>

      <p className="text-sm leading-relaxed mb-4">
        Een <strong>MantelBuddy</strong> is een vrijwilliger bij jou in de buurt.
        Of bij je naaste.
      </p>

      {/* Visueel: MantelBuddy kaart */}
      <div className="ker-card p-4 mb-5 border-l-4 border-l-primary">
        <p className="text-sm font-semibold mb-3">Ze helpen graag met:</p>
        <div className="space-y-2">
          {[
            { emoji: "🛒", text: "Boodschappen doen" },
            { emoji: "☕", text: "Even een praatje maken" },
            { emoji: "🚗", text: "Mee naar de dokter" },
            { emoji: "🔧", text: "Klusjes in huis" },
          ].map((item) => (
            <div key={item.text} className="flex items-center gap-3">
              <span className="text-lg">{item.emoji}</span>
              <span className="text-sm">{item.text}</span>
            </div>
          ))}
        </div>
      </div>

      <p className="text-sm leading-relaxed text-muted-foreground">
        Eenmalig of vaker — jij kiest. Je vindt ze op de <strong>Hulp</strong> pagina.
      </p>
    </div>
  )
}

function StapInformatie() {
  return (
    <div className="pt-6">
      <div className="text-center mb-6">
        <span className="text-5xl">📚</span>
        <h2 className="text-xl font-bold mt-3">Informatie en tips</h2>
      </div>

      <p className="text-sm leading-relaxed mb-4">
        Onder <strong>Informatie</strong> vind je handige artikelen over mantelzorg.
      </p>

      {/* Visueel: 2x2 grid van categorieën */}
      <div className="grid grid-cols-2 gap-2 mb-5">
        {[
          { emoji: "💡", label: "Praktische tips" },
          { emoji: "🧘", label: "Zelfzorg" },
          { emoji: "⚖️", label: "Je rechten" },
          { emoji: "💰", label: "Financieel" },
        ].map((item) => (
          <div key={item.label} className="ker-card p-3 flex items-center gap-2">
            <span className="text-xl">{item.emoji}</span>
            <span className="text-xs font-medium">{item.label}</span>
          </div>
        ))}
      </div>

      <p className="text-sm leading-relaxed mb-4">
        Ook krijg je <strong>nieuws uit jouw gemeente</strong> over mantelzorg.
      </p>

      {/* Visueel: Mini gemeente nieuws kaart */}
      <div className="ker-card p-3 flex items-center gap-3">
        <span className="text-2xl">🏘️</span>
        <div>
          <p className="text-sm font-semibold">Nieuws van de gemeente</p>
          <p className="text-xs text-muted-foreground">Updates over mantelzorg bij jou in de buurt</p>
        </div>
        <span className="w-5 h-5 bg-[var(--accent-red)] text-white text-[10px] font-bold rounded-full flex items-center justify-center ml-auto flex-shrink-0">
          2
        </span>
      </div>
    </div>
  )
}

function StapFavorieten() {
  return (
    <div className="pt-6">
      <div className="text-center mb-6">
        <span className="text-5xl">❤️</span>
        <h2 className="text-xl font-bold mt-3">Bewaar wat je nodig hebt</h2>
      </div>

      <p className="text-sm leading-relaxed mb-4">
        Kom je iets tegen dat je wilt onthouden?
        Tik op het <strong className="text-primary">hartje</strong>.
      </p>

      {/* Visueel: Voorbeeld kaart met hartje */}
      <div className="ker-card p-4 mb-4 relative">
        <div className="absolute top-3 right-3">
          <svg
            className="w-6 h-6 text-primary fill-primary"
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
        <div className="flex items-center gap-2 pr-10">
          <span className="text-xl">🧘</span>
          <div>
            <p className="text-sm font-semibold">Respijtzorg aanvragen</p>
            <p className="text-xs text-muted-foreground">Even vrij van zorgen</p>
          </div>
        </div>
      </div>

      <p className="text-sm leading-relaxed mb-4">
        Je favorieten vind je terug op je eigen pagina.
        Daar kun je ze ook <strong>afvinken</strong> als je ze hebt gedaan. ✅
      </p>

      <p className="text-sm leading-relaxed text-muted-foreground mb-4">
        Dit werkt bij hulporganisaties, artikelen en gemeentenieuws.
      </p>

      {/* Visueel: Mini favorieten preview */}
      <div className="ker-card p-3">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">❤️</span>
          <span className="text-sm font-semibold">Mijn favorieten</span>
        </div>
        <div className="flex gap-2">
          <span className="ker-pill text-[10px] px-2 py-1 bg-primary/10 text-primary">💜 Voor jou</span>
          <span className="ker-pill text-[10px] px-2 py-1 bg-primary/10 text-primary">📚 Info</span>
          <span className="ker-pill text-[10px] px-2 py-1 bg-[var(--accent-green)]/15 text-[var(--accent-green)]">✅ 2</span>
        </div>
      </div>
    </div>
  )
}

function StapKlaar({ naam }: { naam: string }) {
  return (
    <div className="flex flex-col items-center text-center pt-8">
      <GerAvatar size="lg" />
      <div className="text-4xl mt-4 mb-2">🎉</div>
      <h2 className="text-2xl font-bold mb-4">Je bent er klaar voor!</h2>

      <div className="ker-card p-5 text-left w-full mb-4">
        <p className="text-sm leading-relaxed">
          {naam ? `${naam}, ik` : "Ik"} ben trots op je dat je deze stap zet.
          Mantelzorg is niet makkelijk, maar je staat er niet alleen voor.
        </p>
      </div>

      <p className="text-sm text-muted-foreground">
        Je kunt deze uitleg altijd teruglezen via je <strong>Profiel</strong>. 👤
      </p>
    </div>
  )
}
