"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

// ============================================
// TYPES & CONSTANTS
// ============================================

interface OnboardingData {
  motivatie: string
  skills: string[]
  beschikbaarheid: string
}

const MOTIVATIE_OPTIES = [
  { value: "terugdoen", label: "Ik wil iets terugdoen" },
  { value: "ervaring", label: "Ik heb zelf ervaring als mantelzorger" },
  { value: "buurt", label: "Ik wil mijn buurt helpen" },
  { value: "anders", label: "Anders" },
] as const

const SKILL_OPTIES = [
  { value: "boodschappen", label: "Boodschappen doen" },
  { value: "gezelschap", label: "Gezelschap/koffie" },
  { value: "vervoer", label: "Vervoer" },
  { value: "administratie", label: "Administratie" },
  { value: "klusjes", label: "Klusjes" },
  { value: "huishoudelijk", label: "Huishoudelijk" },
  { value: "tuinwerk", label: "Tuinwerk" },
  { value: "andere", label: "Andere" },
] as const

const BESCHIKBAARHEID_OPTIES = [
  { value: "eenmalig", label: "Eenmalig" },
  { value: "wekelijks", label: "Wekelijks" },
  { value: "maandelijks", label: "Maandelijks" },
  { value: "flexibel", label: "Flexibel" },
] as const

const STAPPEN = ["Motivatie", "Vaardigheden", "Beschikbaarheid", "Bevestiging"]

// ============================================
// DESIGN SYSTEM
// ============================================

const COLORS = {
  primary: "#2D1B69",
  accent: "#E5A825",
  background: "#F8F0F5",
}

// ============================================
// COMPONENT
// ============================================

export default function BuddyOnboardingPage() {
  const router = useRouter()
  const [stap, setStap] = useState(1)
  const [data, setData] = useState<OnboardingData>({
    motivatie: "",
    skills: [],
    beschikbaarheid: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isVoltooid, setIsVoltooid] = useState(false)
  const [foutmelding, setFoutmelding] = useState<string | null>(null)

  const totaalStappen = 4

  // ---- Validation ----
  const kanVerder = (): boolean => {
    switch (stap) {
      case 1:
        return data.motivatie !== ""
      case 2:
        return data.skills.length > 0
      case 3:
        return data.beschikbaarheid !== ""
      case 4:
        return true
      default:
        return false
    }
  }

  // ---- Handlers ----
  const toggleSkill = (skill: string) => {
    setData((prev) => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter((s) => s !== skill)
        : [...prev.skills, skill],
    }))
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setFoutmelding(null)
    try {
      const res = await fetch("/api/buddy/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || "Er ging iets mis bij het opslaan")
      }
      setIsVoltooid(true)
      setStap(4)
    } catch (err: any) {
      setFoutmelding(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const volgende = () => {
    if (stap === 3) {
      handleSubmit()
    } else if (stap < totaalStappen) {
      setStap(stap + 1)
    }
  }

  const vorige = () => {
    if (stap > 1) {
      setStap(stap - 1)
    }
  }

  // ============================================
  // RENDER HELPERS
  // ============================================

  const ProgressBar = () => (
    <div className="mb-8">
      <div className="flex justify-between mb-2">
        {STAPPEN.map((label, i) => (
          <span
            key={label}
            className="text-xs font-medium"
            style={{ color: i + 1 <= stap ? COLORS.primary : "#9CA3AF" }}
          >
            {label}
          </span>
        ))}
      </div>
      <div className="w-full h-2 rounded-full bg-gray-200 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${(stap / totaalStappen) * 100}%`,
            backgroundColor: COLORS.accent,
          }}
        />
      </div>
    </div>
  )

  const RadioGroep = ({
    opties,
    waarde,
    onChange,
  }: {
    opties: readonly { value: string; label: string }[]
    waarde: string
    onChange: (val: string) => void
  }) => (
    <div className="space-y-3">
      {opties.map((optie) => (
        <label
          key={optie.value}
          className="flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all"
          style={{
            borderColor: waarde === optie.value ? COLORS.primary : "#E5E7EB",
            backgroundColor: waarde === optie.value ? `${COLORS.primary}08` : "white",
          }}
        >
          <div
            className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
            style={{
              borderColor: waarde === optie.value ? COLORS.primary : "#9CA3AF",
            }}
          >
            {waarde === optie.value && (
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: COLORS.primary }}
              />
            )}
          </div>
          <input
            type="radio"
            name="radio-groep"
            value={optie.value}
            checked={waarde === optie.value}
            onChange={() => onChange(optie.value)}
            className="sr-only"
          />
          <span className="text-gray-900 font-medium">{optie.label}</span>
        </label>
      ))}
    </div>
  )

  const CheckboxGroep = ({
    opties,
    geselecteerd,
    onToggle,
  }: {
    opties: readonly { value: string; label: string }[]
    geselecteerd: string[]
    onToggle: (val: string) => void
  }) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {opties.map((optie) => {
        const isChecked = geselecteerd.includes(optie.value)
        return (
          <label
            key={optie.value}
            className="flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all"
            style={{
              borderColor: isChecked ? COLORS.primary : "#E5E7EB",
              backgroundColor: isChecked ? `${COLORS.primary}08` : "white",
            }}
          >
            <div
              className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border-2"
              style={{
                borderColor: isChecked ? COLORS.primary : "#9CA3AF",
                backgroundColor: isChecked ? COLORS.primary : "transparent",
              }}
            >
              {isChecked && (
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <input
              type="checkbox"
              checked={isChecked}
              onChange={() => onToggle(optie.value)}
              className="sr-only"
            />
            <span className="text-gray-900 font-medium">{optie.label}</span>
          </label>
        )
      })}
    </div>
  )

  // ============================================
  // STAP CONTENT
  // ============================================

  const renderStap = () => {
    switch (stap) {
      case 1:
        return (
          <div>
            <h2 className="text-xl font-bold mb-2" style={{ color: COLORS.primary }}>
              Waarom wil je helpen?
            </h2>
            <p className="text-gray-600 mb-6">
              Vertel ons je motivatie, zodat we je goed kunnen koppelen aan mantelzorgers.
            </p>
            <RadioGroep
              opties={MOTIVATIE_OPTIES}
              waarde={data.motivatie}
              onChange={(val) => setData((prev) => ({ ...prev, motivatie: val }))}
            />
          </div>
        )

      case 2:
        return (
          <div>
            <h2 className="text-xl font-bold mb-2" style={{ color: COLORS.primary }}>
              Waar kun je bij helpen?
            </h2>
            <p className="text-gray-600 mb-6">
              Selecteer de activiteiten waar je je voor wilt inzetten. Je kunt meerdere opties kiezen.
            </p>
            <CheckboxGroep
              opties={SKILL_OPTIES}
              geselecteerd={data.skills}
              onToggle={toggleSkill}
            />
          </div>
        )

      case 3:
        return (
          <div>
            <h2 className="text-xl font-bold mb-2" style={{ color: COLORS.primary }}>
              Hoe vaak wil je helpen?
            </h2>
            <p className="text-gray-600 mb-6">
              Geef aan hoe vaak je beschikbaar bent als MantelBuddy.
            </p>
            <RadioGroep
              opties={BESCHIKBAARHEID_OPTIES}
              waarde={data.beschikbaarheid}
              onChange={(val) => setData((prev) => ({ ...prev, beschikbaarheid: val }))}
            />
          </div>
        )

      case 4:
        return (
          <div className="text-center py-8">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: `${COLORS.accent}20` }}
            >
              <svg
                className="w-8 h-8"
                style={{ color: COLORS.accent }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-2" style={{ color: COLORS.primary }}>
              Bedankt voor je aanmelding!
            </h2>
            <p className="text-gray-600 max-w-md mx-auto mb-6">
              Je onboarding is voltooid. We hebben je motivatie, vaardigheden en beschikbaarheid
              opgeslagen. Je hoort binnenkort van ons.
            </p>
            <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-sm mx-auto text-left space-y-3">
              <div>
                <span className="text-xs text-gray-500 uppercase tracking-wide">Motivatie</span>
                <p className="font-medium text-gray-900">
                  {MOTIVATIE_OPTIES.find((o) => o.value === data.motivatie)?.label}
                </p>
              </div>
              <div>
                <span className="text-xs text-gray-500 uppercase tracking-wide">Vaardigheden</span>
                <p className="font-medium text-gray-900">
                  {data.skills
                    .map((s) => SKILL_OPTIES.find((o) => o.value === s)?.label)
                    .join(", ")}
                </p>
              </div>
              <div>
                <span className="text-xs text-gray-500 uppercase tracking-wide">Beschikbaarheid</span>
                <p className="font-medium text-gray-900">
                  {BESCHIKBAARHEID_OPTIES.find((o) => o.value === data.beschikbaarheid)?.label}
                </p>
              </div>
            </div>
            <div className="mt-8">
              <Link
                href="/buddy/dashboard"
                className="inline-flex items-center px-6 py-3 rounded-xl font-semibold text-white transition-colors"
                style={{ backgroundColor: COLORS.primary }}
              >
                Naar je dashboard
              </Link>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  // ============================================
  // MAIN RENDER
  // ============================================

  return (
    <div className="min-h-screen" style={{ backgroundColor: COLORS.background }}>
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/word-mantelbuddy"
            className="text-sm font-medium hover:underline"
            style={{ color: COLORS.primary }}
          >
            &larr; Terug naar aanmelding
          </Link>
          <h1 className="text-2xl font-bold mt-2" style={{ color: COLORS.primary }}>
            MantelBuddy Onboarding
          </h1>
          <p className="text-gray-600 text-sm mt-1">
            Vertel ons meer over jezelf zodat we je aan de juiste mantelzorger kunnen koppelen.
          </p>
        </div>

        {/* Progress */}
        {!isVoltooid && <ProgressBar />}

        {/* Foutmelding */}
        {foutmelding && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            {foutmelding}
          </div>
        )}

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
          {renderStap()}
        </div>

        {/* Navigation */}
        {!isVoltooid && (
          <div className="flex justify-between mt-6">
            <button
              onClick={vorige}
              disabled={stap === 1}
              className="px-5 py-2.5 rounded-xl font-medium border-2 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              style={{
                borderColor: COLORS.primary,
                color: COLORS.primary,
              }}
            >
              Vorige
            </button>
            <button
              onClick={volgende}
              disabled={!kanVerder() || isSubmitting}
              className="px-6 py-2.5 rounded-xl font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: kanVerder() ? COLORS.primary : "#9CA3AF" }}
            >
              {isSubmitting
                ? "Opslaan..."
                : stap === 3
                  ? "Afronden"
                  : "Volgende"}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
