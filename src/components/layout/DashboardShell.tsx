"use client"

import { useState, useEffect, useRef } from "react"
import { Navbar } from "@/components/layout/Navbar"
import { MobileNav } from "@/components/navigation/MobileNav"
import { SessionValidator } from "@/components/SessionValidator"
import { Tutorial, TUTORIAL_STORAGE_KEY } from "@/components/Tutorial"

interface DashboardShellProps {
  children: React.ReactNode
}

export function DashboardShell({ children }: DashboardShellProps) {
  const [showTutorial, setShowTutorial] = useState(false)
  const [userName, setUserName] = useState("")
  const [isChecked, setIsChecked] = useState(false)
  const hasFetched = useRef(false)

  useEffect(() => {
    // Altijd de naam ophalen voor de Navbar
    if (hasFetched.current) return
    hasFetched.current = true

    const fetchUserData = async () => {
      try {
        const res = await fetch("/api/user/onboarded")
        if (res.ok) {
          const data = await res.json()
          setUserName(data.name || "")

          // Check tutorial status
          const tutorialSeen = localStorage.getItem(TUTORIAL_STORAGE_KEY)
          if (!tutorialSeen && !data.onboardedAt) {
            // Nieuwe gebruiker of nieuwe versie: toon tutorial
            setShowTutorial(true)
          } else if (!tutorialSeen && data.onboardedAt) {
            // Gebruiker was al onboarded maar localStorage mist (bijv. nieuw apparaat)
            localStorage.setItem(TUTORIAL_STORAGE_KEY, "true")
          }
        }
      } catch {
        // Bij fout, gewoon doorgaan zonder tutorial
      } finally {
        setIsChecked(true)
      }
    }

    // Snelle localStorage check voor terugkerende gebruikers
    const tutorialSeen = localStorage.getItem(TUTORIAL_STORAGE_KEY)
    if (tutorialSeen) {
      // Terugkerende gebruiker — haal alleen naam op
      fetch("/api/user/onboarded")
        .then(res => res.ok ? res.json() : null)
        .then(data => { if (data?.name) setUserName(data.name) })
        .catch(() => {})
      setIsChecked(true)
      return
    }

    fetchUserData()
  }, [])

  const handleTutorialComplete = () => {
    setShowTutorial(false)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Valideert sessie periodiek en logt uit bij inloggen op ander apparaat */}
      <SessionValidator />
      <Navbar userRole="CAREGIVER" userName={userName || undefined} />
      {/* pb-28 (112px) voor grotere mobile nav (h-20 = 80px + extra ruimte) */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-28 md:pb-8">
        {children}
      </main>
      <MobileNav />

      {/* Tutorial overlay voor nieuwe gebruikers */}
      {isChecked && showTutorial && (
        <Tutorial userName={userName} onComplete={handleTutorialComplete} />
      )}
    </div>
  )
}
