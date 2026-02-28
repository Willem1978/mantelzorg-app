"use client"

import { cn } from "@/lib/utils"

interface BalansThermometerProps {
  score: number
  maxScore?: number
  niveau: "LAAG" | "GEMIDDELD" | "HOOG"
  compact?: boolean
}

const NIVEAU_CONFIG = {
  LAAG: {
    label: "Goed",
    beschrijving: "Je houdt het goed vol",
    color: "var(--accent-green)",
    bgColor: "var(--accent-green-bg)",
  },
  GEMIDDELD: {
    label: "Let op",
    beschrijving: "Je doet heel veel",
    color: "var(--accent-amber)",
    bgColor: "var(--accent-amber-bg)",
  },
  HOOG: {
    label: "Zwaar",
    beschrijving: "Je doet te veel",
    color: "var(--accent-red)",
    bgColor: "var(--accent-red-bg)",
  },
}

export function BalansThermometer({ score, maxScore = 24, niveau, compact = false }: BalansThermometerProps) {
  const config = NIVEAU_CONFIG[niveau]
  const percentage = Math.min((score / maxScore) * 100, 100)

  // Zones: 0-8 = LAAG (groen), 9-16 = GEMIDDELD (oranje), 17-24 = HOOG (rood)
  const zones = [
    { label: "Goed", max: 33.3, color: "var(--accent-green)" },
    { label: "Let op", max: 66.6, color: "var(--accent-amber)" },
    { label: "Zwaar", max: 100, color: "var(--accent-red)" },
  ]

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <div className="h-3 rounded-full overflow-hidden flex" style={{ backgroundColor: "var(--accent-green-bg)" }}>
            {zones.map((zone, i) => (
              <div
                key={i}
                className="h-full"
                style={{
                  width: `${zone.max - (i === 0 ? 0 : zones[i - 1].max)}%`,
                  backgroundColor: percentage >= (i === 0 ? 0 : zones[i - 1].max) ? zone.color : `${zone.color}20`,
                  opacity: percentage >= (i === 0 ? 0 : zones[i - 1].max) ? 1 : 0.2,
                }}
              />
            ))}
          </div>
        </div>
        <span className="text-sm font-bold" style={{ color: config.color }}>
          {score}/{maxScore}
        </span>
      </div>
    )
  }

  return (
    <div className="ker-card" style={{ backgroundColor: config.bgColor }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span
            className="text-xs font-bold px-2.5 py-1 rounded-full text-white"
            style={{ backgroundColor: config.color }}
          >
            {config.label}
          </span>
          <span className="text-sm font-medium text-foreground">{config.beschrijving}</span>
        </div>
        <span className="text-2xl font-bold" style={{ color: config.color }}>
          {score}
          <span className="text-sm font-normal text-muted-foreground">/{maxScore}</span>
        </span>
      </div>

      {/* Thermometer */}
      <div className="relative">
        {/* Track */}
        <div className="h-5 rounded-full overflow-hidden flex bg-background/50 border border-border/50">
          <div
            className="h-full rounded-l-full"
            style={{ width: "33.3%", backgroundColor: "var(--accent-green)" }}
          />
          <div
            className="h-full"
            style={{ width: "33.4%", backgroundColor: "var(--accent-amber)" }}
          />
          <div
            className="h-full rounded-r-full"
            style={{ width: "33.3%", backgroundColor: "var(--accent-red)" }}
          />
        </div>

        {/* Indicator */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-white border-3 shadow-md transition-all duration-500"
          style={{
            left: `${percentage}%`,
            borderColor: config.color,
            borderWidth: "3px",
          }}
        />
      </div>

      {/* Zone labels */}
      <div className="flex justify-between mt-2 text-[10px] text-muted-foreground font-medium">
        <span>0</span>
        <span>8</span>
        <span>16</span>
        <span>24</span>
      </div>
    </div>
  )
}
