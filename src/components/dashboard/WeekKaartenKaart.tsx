"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"

interface WeekKaart {
  id: string
  type: "ZELFZORG" | "PRAKTISCH" | "LEREN"
  titel: string
  beschrijving: string
  emoji: string | null
  linkUrl: string | null
  linkLabel: string | null
  isVoltooid: boolean
}

const TYPE_CONFIG: Record<string, { color: string; bg: string; border: string; label: string }> = {
  ZELFZORG: { color: "text-green-700", bg: "bg-green-50", border: "border-green-200", label: "Zelfzorg" },
  PRAKTISCH: { color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200", label: "Praktisch" },
  LEREN: { color: "text-purple-700", bg: "bg-purple-50", border: "border-purple-200", label: "Leren" },
}

export function WeekKaartenKaart() {
  const [kaarten, setKaarten] = useState<WeekKaart[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)

  const fetchKaarten = useCallback(async () => {
    try {
      const res = await fetch("/api/weekkaarten")
      if (res.ok) {
        const data = await res.json()
        setKaarten(data.weekkaarten || [])
      }
    } catch {
      // Stille fout
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchKaarten()
  }, [fetchKaarten])

  const toggleVoltooid = async (id: string, huidigVoltooid: boolean) => {
    const nieuwVoltooid = !huidigVoltooid
    setUpdating(id)

    try {
      const res = await fetch("/api/weekkaarten", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isVoltooid: nieuwVoltooid }),
      })

      if (res.ok) {
        setKaarten((prev) =>
          prev.map((k) => (k.id === id ? { ...k, isVoltooid: nieuwVoltooid } : k))
        )
      }
    } catch {
      // Fout — niets doen
    } finally {
      setUpdating(null)
    }
  }

  if (loading) {
    return (
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Deze week voor jou
        </h2>
        <div className="animate-pulse space-y-3">
          <div className="h-24 bg-muted rounded-xl" />
          <div className="h-24 bg-muted rounded-xl" />
          <div className="h-24 bg-muted rounded-xl" />
        </div>
      </section>
    )
  }

  if (kaarten.length === 0) return null

  const voltooid = kaarten.filter((k) => k.isVoltooid).length

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Deze week voor jou
        </h2>
        {voltooid > 0 && (
          <span className="text-xs font-medium text-green-600">
            {voltooid}/{kaarten.length} gedaan
          </span>
        )}
      </div>
      <div className="space-y-3">
        {kaarten.map((kaart) => {
          const config = TYPE_CONFIG[kaart.type] || TYPE_CONFIG.PRAKTISCH
          const isUpdating = updating === kaart.id

          return (
            <div
              key={kaart.id}
              className={`relative rounded-xl border-2 p-4 transition-all ${
                kaart.isVoltooid
                  ? "bg-muted/40 border-muted opacity-70"
                  : `${config.bg} ${config.border}`
              }`}
            >
              {/* Header met type badge + checkbox */}
              <div className="flex items-start gap-3">
                {/* Checkbox */}
                <button
                  onClick={() => toggleVoltooid(kaart.id, kaart.isVoltooid)}
                  disabled={isUpdating}
                  className={`mt-0.5 w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                    kaart.isVoltooid
                      ? "bg-green-500 border-green-500 text-white"
                      : "border-muted-foreground/30 hover:border-primary"
                  } ${isUpdating ? "opacity-50" : ""}`}
                  aria-label={kaart.isVoltooid ? "Markeer als niet gedaan" : "Markeer als gedaan"}
                >
                  {kaart.isVoltooid && (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  {isUpdating && (
                    <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  )}
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {kaart.emoji && <span className="text-lg">{kaart.emoji}</span>}
                    <h3 className={`text-base font-semibold leading-snug ${
                      kaart.isVoltooid ? "line-through text-muted-foreground" : "text-foreground"
                    }`}>
                      {kaart.titel}
                    </h3>
                  </div>
                  <p className={`text-sm leading-relaxed ${
                    kaart.isVoltooid ? "text-muted-foreground" : "text-foreground/70"
                  }`}>
                    {kaart.beschrijving}
                  </p>

                  {/* Link + Type badge */}
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      kaart.isVoltooid ? "bg-muted text-muted-foreground" : `${config.bg} ${config.color}`
                    }`}>
                      {config.label}
                    </span>
                    {kaart.linkUrl && !kaart.isVoltooid && (
                      <Link
                        href={kaart.linkUrl}
                        className={`text-xs font-semibold ${config.color} hover:underline inline-flex items-center gap-1`}
                        target={kaart.linkUrl.startsWith("http") ? "_blank" : undefined}
                        rel={kaart.linkUrl.startsWith("http") ? "noopener noreferrer" : undefined}
                      >
                        {kaart.linkLabel || "Bekijk"}
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
