"use client"

import { useState, useEffect, useRef, useCallback } from "react"
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

  // Initieel: haal naam op en check tutorial status
  useEffect(() => {
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
            setShowTutorial(true)
          } else if (!tutorialSeen && data.onboardedAt) {
            localStorage.setItem(TUTORIAL_STORAGE_KEY, "true")
          }
        }
      } catch {
        // Bij fout, gewoon doorgaan zonder tutorial
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

  // Luister naar "tutorial-reset" event vanuit Profiel pagina
  const handleTutorialReset = useCallback(() => {
    setShowTutorial(true)
    setIsChecked(true)
  }, [])

  useEffect(() => {
    window.addEventListener("tutorial-reset", handleTutorialReset)
    return () => window.removeEventListener("tutorial-reset", handleTutorialReset)
  }, [handleTutorialReset])

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

      {/* Tutorial overlay voor nieuwe gebruikers */}
      {isChecked && showTutorial && (
        <Tutorial userName={userName} onComplete={handleTutorialComplete} />
      )}
    </div>
  )
}
