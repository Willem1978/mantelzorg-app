"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { GerAvatar } from "@/components/GerAvatar"
import { searchGemeenten } from "@/lib/pdok"

const TOTAL_STEPS = 5

interface OnboardingProps {
  userName: string
  onComplete: () => void
}

// Onboarding profiel data die verzameld wordt in stap 2 & 3
interface OnboardingData {
  gemeente: string
  careRecipient: string // partner / ouder / kind / ander familielid / kennis
  careHoursPerWeek: string // 0-5 / 5-10 / 10-20 / 20-40 / 40+
  careSinceDuration: string // <1 / 1-3 / 3-5 / 5+
}

export function Onboarding({ userName, onComplete }: OnboardingProps) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [data, setData] = useState<OnboardingData>({
    gemeente: "",
    careRecipient: "",
    careHoursPerWeek: "",
    careSinceDuration: "",
  })

  // Content state - fetched from API
  const [relatieOpties, setRelatieOpties] = useState<any[]>([])
  const [urenOpties, setUrenOpties] = useState<any[]>([])
  const [duurOpties, setDuurOpties] = useState<any[]>([])
  const [contentLoading, setContentLoading] = useState(true)
  const [contentError, setContentError] = useState<string | null>(null)
  const hasFetchedContent = useRef(false)

  // Fetch form options from API on mount
  useEffect(() => {
    if (hasFetchedContent.current) return
    hasFetchedContent.current = true

    const loadContent = async () => {
      try {
        const [relatieRes, urenRes, duurRes] = await Promise.all([
          fetch("/api/content/formulier-opties?groep=RELATIE"),
          fetch("/api/content/formulier-opties?groep=UREN_PER_WEEK"),
          fetch("/api/content/formulier-opties?groep=ZORGDUUR"),
        ])

        if (!relatieRes.ok || !urenRes.ok || !duurRes.ok) {
          throw new Error("Fout bij laden van opties")
        }

        const relatieData = await relatieRes.json()
        const urenData = await urenRes.json()
        const duurData = await duurRes.json()

        setRelatieOpties((relatieData.opties || []).map((o: any) => ({
          value: o.waarde,
          label: o.label,
          emoji: o.emoji,
        })))

        setUrenOpties((urenData.opties || []).map((o: any) => ({
          value: o.waarde,
          label: o.label,
          beschrijving: o.beschrijving,
        })))

        setDuurOpties((duurData.opties || []).map((o: any) => ({
          value: o.waarde,
          label: o.label,
          emoji: o.emoji,
        })))
      } catch (error) {
        console.error("Error loading onboarding content:", error)
        setContentError("Er ging iets mis bij het laden.")
      } finally {
        setContentLoading(false)
      }
    }

    loadContent()
  }, [])

  const voornaam = userName?.split(" ")[0] || ""
  const progressPercent = ((step + 1) / TOTAL_STEPS) * 100

  const handleNext = useCallback(() => {
    if (step < TOTAL_STEPS - 1) {
      setStep(s => s + 1)
    }
  }, [step])

  const handleBack = useCallback(() => {
    if (step > 0) setStep(s => s - 1)
  }, [step])

  // Sla profiel data op en markeer als onboarded
  const handleComplete = useCallback(async () => {
    setSaving(true)
    try {
      // Sla onboarding profiel data op
      await fetch("/api/user/onboarding-profiel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).catch(() => {})

      // Markeer als onboarded
      await fetch("/api/user/onboarded", { method: "POST" }).catch(() => {})

      // Sla tutorial ook op als gezien (zodat Tutorial niet opnieuw toont)
      localStorage.setItem("tutorial-seen-v3", "true")

      onComplete()

      // Redirect naar belastbaarheidstest
      router.push("/belastbaarheidstest?from=onboarding")
    } catch {
      onComplete()
    }
  }, [data, onComplete, router])

  const handleSkip = useCallback(() => {
    // Bij overslaan: markeer als onboarded maar sla data niet op
    fetch("/api/user/onboarded", { method: "POST" }).catch(() => {})
    localStorage.setItem("tutorial-seen-v3", "true")
    onComplete()
  }, [onComplete])

  // Check of volgende knop enabled is
  const canProceed = () => {
    if (step === 1) {
      // Gemeente en relatie zijn verplicht
      return data.gemeente.length > 0 && data.careRecipient.length > 0
    }
    if (step === 2) {
      // Uren en duur zijn verplicht
      return data.careHoursPerWeek.length > 0 && data.careSinceDuration.length > 0
    }
    return true
  }

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
          <p className="text-foreground font-medium mb-2">Er ging iets mis</p>
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
          {step === 0 && <StapWelkom naam={voornaam} />}
          {step === 1 && <StapWieBenJij data={data} onChange={setData} relatieOpties={relatieOpties} />}
          {step === 2 && <StapZorgsituatie data={data} onChange={setData} urenOpties={urenOpties} duurOpties={duurOpties} />}
          {step === 3 && <StapAppUitleg />}
          {step === 4 && <StapKlaar naam={voornaam} />}
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
              disabled={!canProceed()}
              className="ker-btn ker-btn-primary flex-1 min-h-[52px] text-base font-semibold disabled:opacity-50"
            >
              Volgende
            </button>
          )}
          {step === TOTAL_STEPS - 1 && (
            <button
              onClick={handleComplete}
              disabled={saving}
              className="ker-btn ker-btn-primary flex-1 min-h-[52px] text-base font-semibold disabled:opacity-50"
            >
              {saving ? "Even geduld..." : "Doe de balanstest"}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================
// Stap 1: Welkom
// ============================================
function StapWelkom({ naam }: { naam: string }) {
  return (
    <div className="flex flex-col items-center text-center pt-8">
      <GerAvatar size="lg" />
      <h1 className="text-2xl font-bold mt-6 mb-3">
        Welkom{naam ? ` ${naam}` : ""}! 👋
      </h1>
      <p className="text-lg text-muted-foreground mb-6">
        Welkom bij MantelBuddy.
      </p>
      <div className="ker-card p-5 text-left w-full">
        <p className="text-base leading-relaxed">
          Ik ben <strong>Ger</strong>, en ik ga je helpen.
          We stellen je eerst een paar korte vragen, zodat we je zo goed mogelijk kunnen ondersteunen.
        </p>
        <p className="text-base text-muted-foreground mt-3">
          Het duurt maar 2 minuutjes. ⏱️
        </p>
      </div>
    </div>
  )
}

// ============================================
// Stap 2: Wie ben jij?
// ============================================
function StapWieBenJij({
  data,
  onChange,
  relatieOpties,
}: {
  data: OnboardingData
  onChange: (data: OnboardingData) => void
  relatieOpties: any[]
}) {
  const [gemeenteQuery, setGemeenteQuery] = useState("")
  const [gemeenteResults, setGemeenteResults] = useState<string[]>([])
  const [showGemeenteResults, setShowGemeenteResults] = useState(false)
  const [isSearching, setIsSearching] = useState(false)

  const handleGemeenteSearch = async (query: string) => {
    setGemeenteQuery(query)
    if (query.length < 2) {
      setGemeenteResults([])
      setShowGemeenteResults(false)
      return
    }
    setIsSearching(true)
    try {
      const results = await searchGemeenten(query)
      setGemeenteResults(results)
      setShowGemeenteResults(true)
    } catch {
      setGemeenteResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const handleGemeenteSelect = (gemeente: string) => {
    onChange({ ...data, gemeente })
    setGemeenteQuery("")
    setShowGemeenteResults(false)
  }

  const handleGemeenteClear = () => {
    onChange({ ...data, gemeente: "" })
    setGemeenteQuery("")
  }

  return (
    <div className="pt-6">
      <div className="text-center mb-6">
        <span className="text-5xl">👤</span>
        <h2 className="text-xl font-bold mt-3">Wie ben jij?</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Zodat we hulp bij jou in de buurt kunnen vinden.
        </p>
      </div>

      {/* Gemeente zoeken */}
      <div className="mb-6 relative">
        <label className="block text-sm font-semibold text-foreground mb-2">
          In welke gemeente woon je?
        </label>
        {data.gemeente ? (
          <div className="p-3 bg-primary/10 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span>📍</span>
              <span className="font-medium">{data.gemeente}</span>
            </div>
            <button
              onClick={handleGemeenteClear}
              className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
          </div>
        ) : (
          <div className="relative">
            <input
              value={gemeenteQuery}
              onChange={(e) => handleGemeenteSearch(e.target.value)}
              onFocus={() => gemeenteQuery.length >= 2 && setShowGemeenteResults(true)}
              placeholder="Typ je gemeente (bijv. Nijmegen)"
              className="ker-input"
              autoComplete="off"
            />
            {isSearching && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
        )}
        {showGemeenteResults && gemeenteResults.length > 0 && (
          <div className="absolute z-20 w-full mt-2 bg-card border-2 border-border rounded-xl shadow-lg max-h-52 overflow-auto">
            {gemeenteResults.map((gemeente) => (
              <button
                key={gemeente}
                type="button"
                onClick={() => handleGemeenteSelect(gemeente)}
                className="w-full text-left px-4 py-3 hover:bg-muted transition-colors border-b border-border last:border-b-0 text-base"
              >
                <span className="mr-2">📍</span>
                {gemeente}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Voor wie zorg je */}
      <div>
        <label className="block text-sm font-semibold text-foreground mb-2">
          Voor wie zorg je?
        </label>
        <div className="space-y-2">
          {relatieOpties.map((optie) => (
            <button
              key={optie.value}
              onClick={() => onChange({ ...data, careRecipient: optie.value })}
              className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                data.careRecipient === optie.value
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/30"
              }`}
            >
              <span className="text-2xl">{optie.emoji}</span>
              <span className="text-base font-medium">{optie.label}</span>
              {data.careRecipient === optie.value && (
                <svg className="w-5 h-5 text-primary ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ============================================
// Stap 3: Jouw zorgsituatie
// ============================================
function StapZorgsituatie({
  data,
  onChange,
  urenOpties,
  duurOpties,
}: {
  data: OnboardingData
  onChange: (data: OnboardingData) => void
  urenOpties: any[]
  duurOpties: any[]
}) {

  return (
    <div className="pt-6">
      <div className="text-center mb-6">
        <span className="text-5xl">💪</span>
        <h2 className="text-xl font-bold mt-3">Jouw zorgsituatie</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Zo kunnen we beter inschatten wat je nodig hebt.
        </p>
      </div>

      {/* Uren per week */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-foreground mb-2">
          Hoeveel uur per week besteed je aan mantelzorg?
        </label>
        <div className="space-y-2">
          {urenOpties.map((optie) => (
            <button
              key={optie.value}
              onClick={() => onChange({ ...data, careHoursPerWeek: optie.value })}
              className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all text-left ${
                data.careHoursPerWeek === optie.value
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/30"
              }`}
            >
              <div>
                <span className="text-base font-medium">{optie.label}</span>
                <span className="text-sm text-muted-foreground ml-2">{optie.beschrijving}</span>
              </div>
              {data.careHoursPerWeek === optie.value && (
                <svg className="w-5 h-5 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Hoe lang al */}
      <div>
        <label className="block text-sm font-semibold text-foreground mb-2">
          Hoe lang zorg je al?
        </label>
        <div className="grid grid-cols-2 gap-2">
          {duurOpties.map((optie) => (
            <button
              key={optie.value}
              onClick={() => onChange({ ...data, careSinceDuration: optie.value })}
              className={`flex flex-col items-center gap-1 p-4 rounded-xl border-2 transition-all ${
                data.careSinceDuration === optie.value
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/30"
              }`}
            >
              <span className="text-2xl">{optie.emoji}</span>
              <span className="text-sm font-medium text-center">{optie.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ============================================
// Stap 4: App uitleg (condensed)
// ============================================
function StapAppUitleg() {
  return (
    <div className="pt-6">
      <div className="text-center mb-5">
        <span className="text-5xl">📱</span>
        <h2 className="text-xl font-bold mt-3">Dit kan MantelBuddy voor je doen</h2>
      </div>

      <div className="space-y-3">
        <div className="ker-card flex items-start gap-4 p-4">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <span className="text-xl">📊</span>
          </div>
          <div>
            <h3 className="font-semibold text-base">Balanstest</h3>
            <p className="text-sm text-muted-foreground">
              Ontdek hoe het met je gaat en houd je belasting bij over tijd.
            </p>
          </div>
        </div>

        <div className="ker-card flex items-start gap-4 p-4">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <span className="text-xl">🤝</span>
          </div>
          <div>
            <h3 className="font-semibold text-base">Hulp zoeken</h3>
            <p className="text-sm text-muted-foreground">
              Vind hulpbronnen bij jou in de buurt, voor jezelf en je naaste.
            </p>
          </div>
        </div>

        <div className="ker-card flex items-start gap-4 p-4">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <span className="text-xl">📚</span>
          </div>
          <div>
            <h3 className="font-semibold text-base">Tips & informatie</h3>
            <p className="text-sm text-muted-foreground">
              Praktische tips, je rechten, en nieuws uit jouw gemeente.
            </p>
          </div>
        </div>

        <div className="ker-card flex items-start gap-4 p-4">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <span className="text-xl">❤️</span>
          </div>
          <div>
            <h3 className="font-semibold text-base">Favorieten</h3>
            <p className="text-sm text-muted-foreground">
              Bewaar artikelen en hulpbronnen met het hartje. Vind ze later terug.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-primary/5 rounded-xl p-4 mt-4">
        <p className="text-sm text-muted-foreground">
          💡 Je kunt deze uitleg altijd teruglezen via je <strong>Profiel</strong>.
        </p>
      </div>
    </div>
  )
}

// ============================================
// Stap 5: Klaar
// ============================================
function StapKlaar({ naam }: { naam: string }) {
  return (
    <div className="flex flex-col items-center text-center pt-8">
      <GerAvatar size="lg" />
      <div className="text-4xl mt-4 mb-2">🎉</div>
      <h2 className="text-2xl font-bold mb-4">Bijna klaar!</h2>

      <div className="ker-card p-5 text-left w-full mb-5">
        <p className="text-base leading-relaxed">
          {naam ? `${naam}, w` : "W"}e gaan nu een korte test doen om te kijken hoe het met je gaat.
          Beantwoord de vragen eerlijk — er zijn geen foute antwoorden.
        </p>
      </div>

      <div className="ker-card p-5 text-left w-full bg-primary/5 border-primary/20">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-3xl">📊</span>
          <h3 className="font-bold text-lg">De Balanstest</h3>
        </div>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-center gap-2">
            <span className="text-primary">✓</span> Duurt maar 2 minuten
          </li>
          <li className="flex items-center gap-2">
            <span className="text-primary">✓</span> Je krijgt direct je resultaat
          </li>
          <li className="flex items-center gap-2">
            <span className="text-primary">✓</span> Met persoonlijke aanbevelingen
          </li>
        </ul>
      </div>

      <p className="text-sm text-muted-foreground mt-5">
        Na de test kom je op je persoonlijke dashboard.
      </p>
    </div>
  )
}
