"use client"

import { useState, useCallback } from "react"
import { GerAvatar } from "@/components/GerAvatar"
import { cn } from "@/lib/utils"

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
// Individuele stappen — met echte dashboard vormgeving
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

      {/* Echte dashboard thermometer — exact zoals op dashboard/page.tsx */}
      <div className="ker-card overflow-hidden mb-5">
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-lg text-[var(--accent-amber)]">
              Gemiddelde belasting
            </h3>
            <p className="text-xs text-muted-foreground">Vandaag gemeten</p>
          </div>
          <p className="text-sm text-muted-foreground">
            Je draagt best veel. Kijk of je ergens hulp bij kunt krijgen.
          </p>
        </div>

        {/* Score + Thermometer */}
        <div className="relative">
          <div className="flex justify-between items-end mb-2">
            <span className="text-3xl font-bold text-[var(--accent-amber)]">
              13<span className="text-lg font-normal text-muted-foreground">/24</span>
            </span>
          </div>

          <div className="relative h-6 bg-muted rounded-full overflow-hidden">
            <div
              className="absolute left-0 top-0 h-full rounded-full bg-[var(--accent-amber)] transition-all duration-500"
              style={{ width: "54%" }}
            />
            <div className="absolute inset-0 flex">
              <div className="flex-1 border-r border-white/30" />
              <div className="flex-1 border-r border-white/30" />
              <div className="flex-1" />
            </div>
          </div>
          <div className="flex text-[10px] text-muted-foreground mt-1">
            <div className="flex-1 text-center">✓ Laag</div>
            <div className="flex-1 text-center">● Midden</div>
            <div className="flex-1 text-center">⚠ Hoog</div>
          </div>
        </div>

        {/* Zorgtaken verdeling */}
        <div className="grid grid-cols-3 gap-2 text-center mt-4 pt-4 border-t border-border/50">
          <div>
            <p className="text-lg font-bold text-[var(--accent-green)]">✓ 4</p>
            <p className="text-xs text-muted-foreground">Gaat goed</p>
          </div>
          <div>
            <p className="text-lg font-bold text-[var(--accent-amber)]">● 3</p>
            <p className="text-xs text-muted-foreground">Matig</p>
          </div>
          <div>
            <p className="text-lg font-bold text-[var(--accent-red)]">⚠ 2</p>
            <p className="text-xs text-muted-foreground">Zwaar</p>
          </div>
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

      {/* Echte hulpvragen vormgeving — "Voor jou" tabs + categorie knoppen */}
      <div className="bg-primary/10 rounded-xl p-3 mb-4">
        <p className="text-sm text-foreground">
          <span className="font-medium">💜 Hulp voor jou als mantelzorger.</span> Mantelzorgen is zwaar werk.
          Ook jij hebt soms hulp nodig.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-5">
        {[
          { emoji: "💜", label: "Ondersteuning", count: 3 },
          { emoji: "🏠", label: "Respijtzorg", count: 2 },
          { emoji: "💚", label: "Praten", count: 4 },
          { emoji: "👥", label: "Lotgenoten", count: 1 },
        ].map((item) => (
          <div
            key={item.label}
            className="flex items-center gap-3 p-4 rounded-xl text-sm bg-primary/10 border border-primary/20"
          >
            <span className="text-2xl">{item.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold">{item.label}</p>
              <p className="text-xs text-muted-foreground">({item.count})</p>
            </div>
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

      {/* Echte hulpvragen vormgeving — "Voor naaste" met taakstatus kleuren */}
      <div className="bg-[var(--accent-amber-bg)] rounded-xl p-3 mb-4">
        <p className="text-sm text-foreground">
          <span className="font-medium">💝 Hulp voor je naaste.</span> Rode en oranje taken zijn het zwaarst.
          Daar kun je het beste eerst hulp bij zoeken.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-5">
        {[
          { emoji: "🛁", label: "Verzorging", status: "zwaar" as const },
          { emoji: "🧹", label: "Huishouden", status: "gemiddeld" as const },
          { emoji: "🍽️", label: "Maaltijden", status: "gemiddeld" as const },
          { emoji: "🚗", label: "Vervoer", status: "licht" as const },
        ].map((item) => (
          <div
            key={item.label}
            className={cn(
              "flex items-center gap-3 p-4 rounded-xl text-sm relative",
              item.status === "zwaar" && "bg-[var(--accent-red-bg)] border-2 border-[var(--accent-red)]",
              item.status === "gemiddeld" && "bg-[var(--accent-amber-bg)] border-2 border-[var(--accent-amber)]",
              item.status === "licht" && "bg-[var(--accent-green-bg)] border-2 border-[var(--accent-green)]",
            )}
          >
            <span className="text-2xl">{item.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold">{item.label}</p>
            </div>
            <div className="absolute top-2 right-2">
              <span className="text-sm">
                {item.status === "zwaar" && "⚠"}
                {item.status === "gemiddeld" && "●"}
                {item.status === "licht" && "✓"}
              </span>
            </div>
          </div>
        ))}
      </div>

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

      {/* Echte MantelBuddy kaart zoals op hulpvragen pagina */}
      <div className="ker-card bg-gradient-to-r from-primary/5 to-primary/10 mb-5">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
            <span className="text-2xl">🤝</span>
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-foreground text-lg">MantelBuddy</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-3">
              Een vrijwilliger die jou helpt met kleine taken.
            </p>
            <div className="space-y-2">
              {[
                { emoji: "🛒", text: "Boodschappen doen" },
                { emoji: "☕", text: "Even een praatje maken" },
                { emoji: "🚗", text: "Mee naar de dokter" },
                { emoji: "🔧", text: "Klusjes in huis" },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-2">
                  <span className="text-base">{item.emoji}</span>
                  <span className="text-sm">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
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

      {/* Echte leren pagina categorieën — 2x2 grid met emoji, titel en beschrijving */}
      <div className="grid grid-cols-2 gap-4 mb-5">
        {[
          { emoji: "💡", title: "Praktische tips", desc: "Voor het dagelijks leven" },
          { emoji: "🧘", title: "Zelfzorg tips", desc: "Zorg ook voor jezelf" },
          { emoji: "⚖️", title: "Je rechten", desc: "Waar heb je recht op?" },
          { emoji: "💰", title: "Financieel", desc: "Vergoedingen & regelingen" },
        ].map((item) => (
          <div key={item.title} className="ker-card hover:shadow-md transition-shadow flex flex-col items-start p-5">
            <span className="text-3xl mb-3">{item.emoji}</span>
            <p className="font-bold text-base">{item.title}</p>
            <p className="text-sm text-muted-foreground">{item.desc}</p>
          </div>
        ))}
      </div>

      <p className="text-sm leading-relaxed mb-4">
        Ook krijg je <strong>nieuws uit jouw gemeente</strong> over mantelzorg.
      </p>

      {/* Echte gemeente nieuws kaart — zoals op leren pagina */}
      <div className="ker-card hover:shadow-md transition-shadow flex items-center gap-4 p-4 relative">
        <span className="text-3xl">🏘️</span>
        <div className="flex-1">
          <p className="font-bold text-lg">Nieuws van de gemeente</p>
          <p className="text-sm text-muted-foreground">
            Updates over mantelzorg bij jou in de buurt
          </p>
        </div>
        <span className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-[var(--accent-red)] text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
          2
        </span>
        <svg className="w-5 h-5 text-muted-foreground flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
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

      {/* Echte hulpbron kaart met hartje — zoals op hulpvragen pagina */}
      <div className="ker-card py-3 mb-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-medium text-sm">Mantelzorgondersteuning Nijmegen</p>
              <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground flex-shrink-0">
                📍 Nijmegen
              </span>
            </div>
          </div>
          {/* Gevuld hartje */}
          <svg
            className="w-6 h-6 text-primary fill-primary flex-shrink-0"
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
        <p className="text-xs text-muted-foreground mt-1">Hulp en ondersteuning voor mantelzorgers</p>
        <div className="flex gap-4 mt-2">
          <span className="text-xs text-primary flex items-center gap-1">📞 024-3226120</span>
          <span className="text-xs text-primary flex items-center gap-1">🌐 Website</span>
        </div>
      </div>

      <p className="text-sm leading-relaxed mb-4">
        Je favorieten vind je terug op je eigen pagina.
        Daar kun je ze ook <strong>afvinken</strong> als je ze hebt gedaan.
      </p>

      <p className="text-sm leading-relaxed text-muted-foreground mb-4">
        Dit werkt bij hulporganisaties, artikelen en gemeentenieuws.
      </p>

      {/* Echte favorieten kaart met afgevinkt item */}
      <div className="ker-card py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-medium text-sm line-through text-muted-foreground">Respijtzorg aanvragen</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center gap-1.5 py-1 px-2 rounded-lg bg-[var(--accent-green)]/15 text-[var(--accent-green)] font-medium text-xs">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              Afgerond
            </span>
            <svg
              className="w-5 h-5 text-primary fill-primary flex-shrink-0"
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
        <p className="text-xs text-muted-foreground mt-1">Even vrij van zorgen</p>
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
