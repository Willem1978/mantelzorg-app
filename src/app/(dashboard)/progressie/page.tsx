"use client"

import { useEffect, useState } from "react"
import { GerPageIntro } from "@/components/ui"

interface Badge {
  id: string
  naam: string
  emoji: string
  beschrijving: string
  behaald: boolean
  behaaldOp?: string
}

interface ProgressieData {
  badges: Badge[]
  totaalBehaald: number
  totaalBadges: number
}

export default function ProgressiePage() {
  const [data, setData] = useState<ProgressieData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/progressie")
      .then((res) => res.json())
      .then((json) => {
        setData(json)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const percentage = data
    ? Math.round((data.totaalBehaald / data.totaalBadges) * 100)
    : 0

  return (
    <div className="space-y-6">
      <div className="ker-section-header">
        <h1 className="text-2xl font-bold text-foreground">
          Je voortgang als mantelzorger
        </h1>
      </div>

      <GerPageIntro tekst="Hier zie je wat je allemaal al hebt bereikt. Elke stap telt — groot of klein. Je doet het goed!" />

      {loading ? (
        <div className="ker-card p-8 text-center text-muted-foreground">
          Laden...
        </div>
      ) : data ? (
        <>
          {/* Progress bar */}
          <div className="ker-card p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">
                {data.totaalBehaald} van {data.totaalBadges} badges behaald
              </span>
              <span className="text-sm font-medium text-primary">
                {percentage}%
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-3">
              <div
                className="bg-primary h-3 rounded-full transition-all duration-500"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>

          {/* Badge grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {data.badges.map((badge) => (
              <div
                key={badge.id}
                className={`ker-card p-4 text-center transition-all ${
                  badge.behaald
                    ? "bg-primary/5 border-primary/20 border"
                    : "opacity-50 grayscale"
                }`}
              >
                <div className="text-3xl mb-2">{badge.emoji}</div>
                <h3 className="text-sm font-semibold text-foreground mb-1">
                  {badge.naam}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {badge.beschrijving}
                </p>
                {badge.behaald && (
                  <span className="inline-block mt-2 text-xs text-primary font-medium">
                    Behaald
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Encouraging message */}
          <div className="ker-card p-5 bg-primary/5 border border-primary/10 text-center">
            <p className="text-sm text-foreground leading-relaxed">
              Je doet het goed — vergeet niet voor jezelf te zorgen
            </p>
          </div>
        </>
      ) : (
        <div className="ker-card p-8 text-center text-muted-foreground">
          Kon je voortgang niet laden. Probeer het later opnieuw.
        </div>
      )}
    </div>
  )
}
