"use client"

import Link from "next/link"

interface ZorgtaakInfo {
  naam: string
  moeilijkheid: string | null
}

interface DeelgebiedInfo {
  naam: string
  emoji: string
  score: number
  maxScore: number
  percentage: number
  niveau: "LAAG" | "GEMIDDELD" | "HOOG"
  tip: string
}

export interface BalansThermometerProps {
  score: number
  maxScore?: number
  niveau: "LAAG" | "GEMIDDELD" | "HOOG"
  zorgtaken?: ZorgtaakInfo[]
  deelgebieden?: DeelgebiedInfo[]
  totaalUren?: number | null
  daysSinceTest?: number | null
}

const NIVEAU_CONFIG = {
  LAAG: {
    label: "Goed",
    emoji: "💚",
    color: "var(--accent-green)",
    bgColor: "var(--accent-green-bg)",
    bericht: "Je balans ziet er goed uit!",
  },
  GEMIDDELD: {
    label: "Matig",
    emoji: "🧡",
    color: "var(--accent-amber)",
    bgColor: "var(--accent-amber-bg)",
    bericht: "Let goed op jezelf, je hebt veel op je bordje.",
  },
  HOOG: {
    label: "Zwaar",
    emoji: "❤️",
    color: "var(--accent-red)",
    bgColor: "var(--accent-red-bg)",
    bericht: "Het is zwaar. Vergeet niet om hulp te vragen.",
  },
}

export function BalansThermometer({
  score,
  maxScore = 24,
  niveau,
  zorgtaken = [],
  deelgebieden = [],
  daysSinceTest,
}: BalansThermometerProps) {
  const config = NIVEAU_CONFIG[niveau]
  const percentage = Math.min((score / maxScore) * 100, 100)

  const isZwaar = (m: string | null) => m === 'MOEILIJK' || m === 'ZEER_MOEILIJK' || m === 'JA' || m === 'ja'
  const isMatig = (m: string | null) => m === 'GEMIDDELD' || m === 'SOMS' || m === 'soms'

  const zwaarCount = zorgtaken.filter(t => isZwaar(t.moeilijkheid)).length
  const matigCount = zorgtaken.filter(t => isMatig(t.moeilijkheid)).length
  const goedCount = zorgtaken.length - zwaarCount - matigCount

  // Neem max 3 deelgebieden: Energie, Gevoel, Tijd
  const topDeelgebieden = deelgebieden.slice(0, 3)

  return (
    <div className="ker-card space-y-5">
      {/* Header met persoonlijk bericht */}
      <div
        className="rounded-xl px-4 py-3 flex items-center gap-3"
        style={{ backgroundColor: config.bgColor }}
      >
        <span className="text-2xl">{config.emoji}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">Mijn balans</p>
          <p className="text-xs text-muted-foreground">{config.bericht}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <span className="text-2xl font-bold" style={{ color: config.color }}>{score}</span>
          <span className="text-xs text-muted-foreground">/{maxScore}</span>
        </div>
      </div>

      {/* Thermometer balk met zones */}
      <div>
        <div className="h-3 rounded-full overflow-hidden bg-muted/30">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${Math.max(6, percentage)}%`,
              backgroundColor: config.color,
            }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground mt-1.5 px-0.5">
          <span>Goed</span>
          <span>Matig</span>
          <span>Zwaar</span>
        </div>
      </div>

      {/* Deelgebieden: Energie, Gevoel, Tijd */}
      {topDeelgebieden.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Hoe gaat het met jou?
          </p>
          <div className="grid grid-cols-3 gap-2">
            {topDeelgebieden.map((dg) => {
              const dgConfig = NIVEAU_CONFIG[dg.niveau]
              return (
                <div
                  key={dg.naam}
                  className="rounded-xl p-3 text-center"
                  style={{ backgroundColor: dgConfig.bgColor }}
                >
                  <span className="text-xl block">{dg.emoji}</span>
                  <p className="text-[11px] font-medium text-foreground mt-1">{dg.naam}</p>
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-1.5"
                    style={{ backgroundColor: `${dgConfig.color}20`, color: dgConfig.color }}
                  >
                    {dgConfig.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Zorgtaken */}
      {zorgtaken.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Jouw zorgtaken
          </p>
          <div className="grid grid-cols-3 gap-2">
            <div
              className="rounded-xl p-3 text-center"
              style={{ backgroundColor: "var(--accent-green-bg)" }}
            >
              <span className="text-xl font-bold block" style={{ color: "var(--accent-green)" }}>
                {goedCount}
              </span>
              <p className="text-[11px] font-medium text-foreground mt-1">Goed</p>
            </div>
            <div
              className="rounded-xl p-3 text-center"
              style={{ backgroundColor: "var(--accent-amber-bg)" }}
            >
              <span className="text-xl font-bold block" style={{ color: "var(--accent-amber)" }}>
                {matigCount}
              </span>
              <p className="text-[11px] font-medium text-foreground mt-1">Matig</p>
            </div>
            <div
              className="rounded-xl p-3 text-center"
              style={{ backgroundColor: "var(--accent-red-bg)" }}
            >
              <span className="text-xl font-bold block" style={{ color: "var(--accent-red)" }}>
                {zwaarCount}
              </span>
              <p className="text-[11px] font-medium text-foreground mt-1">Zwaar</p>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-border/30">
        <Link
          href="/rapport"
          className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-1"
        >
          Bekijk volledig rapport
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
        {daysSinceTest != null && (
          <span className="text-[10px] text-muted-foreground">
            {daysSinceTest === 0 ? "Vandaag getest" : `${daysSinceTest} dagen geleden`}
          </span>
        )}
      </div>
    </div>
  )
}
