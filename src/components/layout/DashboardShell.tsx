"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { Navbar } from "@/components/layout/Navbar"
import { MobileNav } from "@/components/navigation/MobileNav"
import { SessionValidator } from "@/components/SessionValidator"
import { Tutorial, TUTORIAL_STORAGE_KEY } from "@/components/Tutorial"
import { Onboarding } from "@/components/Onboarding"
import { HelpButton } from "@/components/ui/HelpButton"
import { GerAvatar } from "@/components/GerAvatar"

interface DashboardShellProps {
  children: React.ReactNode
}

export function DashboardShell({ children }: DashboardShellProps) {
  const pathname = usePathname()
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [showTutorial, setShowTutorial] = useState(false)
  const [userName, setUserName] = useState("")
  const [isChecked, setIsChecked] = useState(false)
  const hasFetched = useRef(false)

  // Verberg Ger-knop op pagina's waar Ger al zichtbaar is
  const hideGerButton = pathname === "/ai-assistent" || pathname === "/dashboard"

  // Initieel: haal naam op en check onboarding/tutorial status
  useEffect(() => {
    if (hasFetched.current) return
    hasFetched.current = true

    const fetchUserData = async () => {
      try {
        const res = await fetch("/api/user/onboarded")
        if (res.ok) {
          const data = await res.json()
          setUserName(data.name || "")

          const tutorialSeen = localStorage.getItem(TUTORIAL_STORAGE_KEY)
          if (!tutorialSeen && !data.onboardedAt) {
            // Nieuwe gebruiker: toon onboarding welkomstflow
            setShowOnboarding(true)
          } else if (!tutorialSeen && data.onboardedAt) {
            localStorage.setItem(TUTORIAL_STORAGE_KEY, "true")
          }
        }
      } catch {
        // Bij fout, gewoon doorgaan
      } finally {
        setIsChecked(true)
      }
    }

    const tutorialSeen = localStorage.getItem(TUTORIAL_STORAGE_KEY)
    if (tutorialSeen) {
      fetch("/api/user/onboarded")
        .then(res => res.ok ? res.json() : null)
        .then(data => { if (data?.name) setUserName(data.name) })
        .catch(() => {})
      setIsChecked(true)
      return
    }

    fetchUserData()
  }, [])

  // C4: Registreer service worker voor PWA
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {})
    }
  }, [])

  // Luister naar "tutorial-reset" event vanuit Profiel pagina
  // Dit toont de Tutorial (app-uitleg), niet de volledige onboarding
  const handleTutorialReset = useCallback(() => {
    setShowTutorial(true)
    setIsChecked(true)
  }, [])

  useEffect(() => {
    window.addEventListener("tutorial-reset", handleTutorialReset)
    return () => window.removeEventListener("tutorial-reset", handleTutorialReset)
  }, [handleTutorialReset])

  const handleOnboardingComplete = () => {
    setShowOnboarding(false)
  }

  const handleTutorialComplete = () => {
    setShowTutorial(false)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Valideert sessie periodiek en logt uit bij inloggen op ander apparaat */}
      <SessionValidator />
      <Navbar userRole="CAREGIVER" userName={userName || undefined} />
      <main className="py-4 pb-24 md:pb-8">
        {children}
      </main>
      <MobileNav />

      {/* C2.3: Floating hulpknop */}
      <HelpButton />

      {/* Floating "Vraag Ger" knop — altijd bereikbaar behalve op dashboard en ai-assistent */}
      {!hideGerButton && (
        <Link
          href="/ai-assistent"
          className="fixed bottom-24 right-4 md:bottom-6 md:right-6 z-40 flex items-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-full shadow-lg hover:opacity-90 transition-all active:scale-95"
          aria-label="Vraag Ger"
        >
          <GerAvatar size="xs" className="!w-6 !h-6" />
          <span className="text-sm font-medium hidden sm:inline">Vraag Ger</span>
        </Link>
      )}

      {/* Onboarding welkomstflow voor nieuwe gebruikers (met profielvragen) */}
      {isChecked && showOnboarding && (
        <Onboarding userName={userName} onComplete={handleOnboardingComplete} />
      )}

      {/* Tutorial (app-uitleg) voor herbekijken vanuit profiel */}
      {isChecked && showTutorial && !showOnboarding && (
        <Tutorial userName={userName} onComplete={handleTutorialComplete} />
      )}
    </div>
  )
}
