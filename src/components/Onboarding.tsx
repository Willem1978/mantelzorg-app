"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { GerAvatar } from "@/components/GerAvatar"
import { ProfielFormulier } from "@/components/profiel/ProfielFormulier"

interface OnboardingProps {
  userName: string
  onComplete: () => void
}

export function Onboarding({ userName, onComplete }: OnboardingProps) {
  const router = useRouter()
  const [showProfiel, setShowProfiel] = useState(false)

  const voornaam = userName?.split(" ")[0] || ""

  // Markeer als onboarded en ga verder
  const markOnboarded = useCallback(async () => {
    try {
      await fetch("/api/user/onboarded", { method: "POST" }).catch(() => {})
      localStorage.setItem("tutorial-seen-v3", "true")
    } catch {
      // best-effort
    }
  }, [])

  // Profiel opgeslagen → markeer onboarded en ga naar belastbaarheidstest
  const handleProfielSaved = useCallback(async () => {
    await markOnboarded()
    onComplete()
    router.push("/belastbaarheidstest?from=onboarding")
  }, [markOnboarded, onComplete, router])

  // Later invullen → markeer onboarded en ga naar dashboard
  const handleSkip = useCallback(async () => {
    await markOnboarded()
    onComplete()
  }, [markOnboarded, onComplete])

  // Welkom-scherm
  if (!showProfiel) {
    return (
      <div className="fixed inset-0 z-[100] bg-background flex flex-col">
        <div className="flex-1 overflow-y-auto px-5">
          <div className="max-w-lg mx-auto">
            <div className="flex flex-col items-center text-center pt-12">
              <GerAvatar size="lg" />
              <h1 className="text-2xl font-bold mt-6 mb-3">
                Welkom{voornaam ? ` ${voornaam}` : ""}!
              </h1>
              <p className="text-lg text-muted-foreground mb-6">
                Welkom bij MantelBuddy.
              </p>
              <div className="ker-card p-5 text-left w-full">
                <p className="text-base leading-relaxed">
                  Ik ben <strong>Ger</strong>, jouw digitale coach.
                  Laten we je profiel invullen, zodat ik je zo goed mogelijk kan helpen
                  met tips en artikelen die bij jouw situatie passen.
                </p>
                <p className="text-base text-muted-foreground mt-3">
                  Je kunt alles later nog aanpassen of aanvullen.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Knoppen onderaan */}
        <div className="bg-background border-t border-border p-4 safe-area-inset-bottom">
          <div className="max-w-lg mx-auto space-y-3">
            <button
              onClick={() => setShowProfiel(true)}
              className="ker-btn ker-btn-primary w-full min-h-[52px] text-base font-semibold"
            >
              Profiel invullen
            </button>
            <button
              onClick={handleSkip}
              className="ker-btn w-full min-h-[44px] text-base bg-muted text-foreground hover:bg-muted/80"
            >
              Later invullen
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Profiel-formulier
  return (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col">
      <div className="flex-1 overflow-y-auto px-5">
        <div className="max-w-lg mx-auto pt-4">
          <ProfielFormulier
            onSave={handleProfielSaved}
            onSkip={handleSkip}
            showSkip={true}
            variant="onboarding"
          />
        </div>
      </div>
    </div>
  )
}
