"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { GerAvatar } from "@/components/GerAvatar"

const BANNER_KEY = "welkom-banner-dismissed"

interface WelkomBannerProps {
  userName?: string
}

/**
 * Welkomstbanner voor gebruikers die pas onboarding hebben afgerond.
 * Toont 3 snelle acties om mee te beginnen.
 * Verdwijnt na klikken op "Sluiten" of na 7 dagen.
 */
export function WelkomBanner({ userName }: WelkomBannerProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const dismissed = localStorage.getItem(BANNER_KEY)
    if (dismissed) {
      // Na 7 dagen automatisch verwijderen
      const dismissedAt = new Date(dismissed).getTime()
      if (Date.now() - dismissedAt < 7 * 24 * 60 * 60 * 1000) return
    }

    // Toon banner alleen als onboarding recent is afgerond
    const tutorialSeen = localStorage.getItem("tutorial-seen-v3")
    if (tutorialSeen) {
      setVisible(true)
    }
  }, [])

  if (!visible) return null

  const dismiss = () => {
    localStorage.setItem(BANNER_KEY, new Date().toISOString())
    setVisible(false)
  }

  const voornaam = userName?.split(" ")[0] || "daar"

  const stappen = [
    {
      emoji: "📊",
      titel: "Doe de balanstest",
      tekst: "Ontdek hoe het met je gaat",
      href: "/belastbaarheidstest",
    },
    {
      emoji: "📚",
      titel: "Lees een artikel",
      tekst: "Tips en informatie voor mantelzorgers",
      href: "/leren",
    },
    {
      emoji: "🔍",
      titel: "Zoek hulp bij jou in de buurt",
      tekst: "Organisaties die je kunnen helpen",
      href: "/hulpvragen",
    },
  ]

  return (
    <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl p-5 border border-primary/20 relative">
      <button
        onClick={dismiss}
        className="absolute top-3 right-3 text-muted-foreground hover:text-foreground text-lg leading-none min-w-[44px] min-h-[44px] flex items-center justify-center"
        aria-label="Sluiten"
      >
        &times;
      </button>

      <div className="flex items-start gap-3 mb-4">
        <GerAvatar size="sm" />
        <div>
          <h2 className="font-bold text-foreground text-lg">
            Welkom {voornaam}!
          </h2>
          <p className="text-base text-muted-foreground">
            Fijn dat je er bent. Hier zijn 3 dingen om mee te beginnen:
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {stappen.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="flex items-start gap-3 p-4 bg-card rounded-xl border border-border hover:shadow-md hover:border-primary/30 transition-all group min-h-[48px]"
          >
            <span className="text-xl">{s.emoji}</span>
            <div>
              <p className="font-medium text-base text-foreground group-hover:text-primary transition-colors">
                {s.titel}
              </p>
              <p className="text-sm text-muted-foreground">{s.tekst}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
