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
    beschrijving: "Je houdt het goed vol",
    emoji: "💚",
    color: "var(--accent-green)",
    bgColor: "var(--accent-green-bg)",
  },
  GEMIDDELD: {
    label: "Matig",
    beschrijving: "Je doet heel veel",
    emoji: "🧡",
    color: "var(--accent-amber)",
    bgColor: "var(--accent-amber-bg)",
  },
  HOOG: {
    label: "Zwaar",
    beschrijving: "Je doet te veel",
    emoji: "❤️",
    color: "var(--accent-red)",
    bgColor: "var(--accent-red-bg)",
  },
}

function MiniBar({ percentage, color }: { percentage: number; color: string }) {
  return (
    <div className="h-2 rounded-full bg-border/30 overflow-hidden flex-1">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${Math.min(percentage, 100)}%`, backgroundColor: color }}
      />
    </div>
  )
}

export function BalansThermometer({
  score,
  maxScore = 24,
  niveau,
  zorgtaken = [],
  deelgebieden = [],
  totaalUren,
  daysSinceTest,
}: BalansThermometerProps) {
  const config = NIVEAU_CONFIG[niveau]
  const percentage = Math.min((score / maxScore) * 100, 100)

  // Tel zorgtaken per niveau
  const isZwaar = (m: string | null) => m === 'MOEILIJK' || m === 'ZEER_MOEILIJK' || m === 'JA' || m === 'ja'
  const isMatig = (m: string | null) => m === 'GEMIDDELD' || m === 'SOMS' || m === 'soms'

  const zwaarCount = zorgtaken.filter(t => isZwaar(t.moeilijkheid)).length
  const matigCount = zorgtaken.filter(t => isMatig(t.moeilijkheid)).length
  const goedCount = zorgtaken.length - zwaarCount - matigCount

  return (
    <div className="ker-card border-l-4 space-y-4" style={{ borderLeftColor: config.color }}>
      {/* === Bovenste rij: score + label === */}
      <div className="flex items-center gap-3">
        <span className="text-3xl">{config.emoji}</span>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span
              className="text-xs font-bold px-2.5 py-1 rounded-full text-white"
              style={{ backgroundColor: config.color }}
            >
              {config.label}
            </span>
            <span className="text-sm font-medium text-foreground">{config.beschrijving}</span>
          </div>
          {totaalUren != null && totaalUren > 0 && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {totaalUren} uur zorg per week
            </p>
          )}
        </div>
        <div className="text-right">
          <span className="text-3xl font-bold" style={{ color: config.color }}>
            {score}
          </span>
          <span className="text-sm text-muted-foreground">/{maxScore}</span>
        </div>
      </div>

      {/* === Thermometer balk === */}
      <div className="relative">
        <div className="h-4 rounded-full overflow-hidden flex bg-background/50 border border-border/30">
          <div className="h-full rounded-l-full" style={{ width: "33.3%", backgroundColor: "var(--accent-green)" }} />
          <div className="h-full" style={{ width: "33.4%", backgroundColor: "var(--accent-amber)" }} />
          <div className="h-full rounded-r-full" style={{ width: "33.3%", backgroundColor: "var(--accent-red)" }} />
        </div>
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-white shadow-md transition-all duration-700"
          style={{
            left: `${Math.max(4, Math.min(percentage, 96))}%`,
            borderColor: config.color,
            borderWidth: "3px",
          }}
        />
      </div>
      <div className="flex justify-between text-xs text-muted-foreground -mt-2">
        <span>Goed</span>
        <span>Matig</span>
        <span>Zwaar</span>
      </div>

      {/* === Energie, gevoel, tijd === */}
      {deelgebieden.length > 0 && (
        <div className="space-y-2.5 pt-2 border-t border-border/50">
          {deelgebieden.map((dg) => {
            const dgConfig = NIVEAU_CONFIG[dg.niveau]
            return (
              <div key={dg.naam} className="flex items-center gap-3">
                <span className="text-lg w-6 text-center flex-shrink-0">{dg.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-sm font-medium text-foreground">{dg.naam}</span>
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{ backgroundColor: `${dgConfig.color}20`, color: dgConfig.color }}
                    >
                      {dgConfig.label}
                    </span>
                  </div>
                  <MiniBar percentage={dg.percentage} color={dgConfig.color} />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* === Zorgtaken overzicht === */}
      {zorgtaken.length > 0 && (
        <div className="pt-2 border-t border-border/50">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Jouw {zorgtaken.length} zorgtaken
          </p>
          <div className="flex items-center gap-3">
            {goedCount > 0 && (
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "var(--accent-green)" }} />
                <span className="text-sm text-foreground">
                  <span className="font-semibold">{goedCount}</span>
                  <span className="text-muted-foreground text-xs ml-0.5">goed</span>
                </span>
              </div>
            )}
            {matigCount > 0 && (
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "var(--accent-amber)" }} />
                <span className="text-sm text-foreground">
                  <span className="font-semibold">{matigCount}</span>
                  <span className="text-muted-foreground text-xs ml-0.5">matig</span>
                </span>
              </div>
            )}
            {zwaarCount > 0 && (
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "var(--accent-red)" }} />
                <span className="text-sm text-foreground">
                  <span className="font-semibold">{zwaarCount}</span>
                  <span className="text-muted-foreground text-xs ml-0.5">zwaar</span>
                </span>
              </div>
            )}
          </div>

          {/* Taken pills */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {zorgtaken.map((t, i) => {
              const taakNiveau = isZwaar(t.moeilijkheid) ? "HOOG" : isMatig(t.moeilijkheid) ? "GEMIDDELD" : "LAAG"
              const taakColor = NIVEAU_CONFIG[taakNiveau].color
              return (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full border"
                  style={{
                    borderColor: `${taakColor}40`,
                    backgroundColor: `${taakColor}10`,
                  }}
                >
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: taakColor }} />
                  <span className="text-foreground">{t.naam}</span>
                </span>
              )
            })}
          </div>
        </div>
      )}

      {/* === Footer link === */}
      <div className="flex items-center justify-between pt-2 border-t border-border/50">
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
            {daysSinceTest === 0 ? "Vandaag" : `${daysSinceTest}d geleden`}
          </span>
        )}
      </div>
    </div>
  )
}
