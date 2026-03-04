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
  },
  GEMIDDELD: {
    label: "Matig",
    emoji: "🧡",
    color: "var(--accent-amber)",
    bgColor: "var(--accent-amber-bg)",
  },
  HOOG: {
    label: "Zwaar",
    emoji: "❤️",
    color: "var(--accent-red)",
    bgColor: "var(--accent-red-bg)",
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
    <div className="ker-card space-y-4">
      {/* Score + balk */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">{config.emoji}</span>
            <span className="text-sm font-semibold text-foreground">Mijn balans</span>
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
              style={{ backgroundColor: config.color }}
            >
              {config.label}
            </span>
          </div>
          <div className="text-right">
            <span className="text-xl font-bold" style={{ color: config.color }}>{score}</span>
            <span className="text-xs text-muted-foreground">/{maxScore}</span>
          </div>
        </div>

        {/* Thermometer balk — één kleur, dikker */}
        <div className="relative">
          <div className="h-5 rounded-full overflow-hidden bg-muted/40 border border-border/30">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${Math.max(6, percentage)}%`,
                backgroundColor: config.color,
              }}
            />
          </div>
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
          <span>Goed</span>
          <span>Matig</span>
          <span>Zwaar</span>
        </div>
      </div>

      {/* 3 mini blokjes: Energie, Gevoel, Tijd */}
      {topDeelgebieden.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {topDeelgebieden.map((dg) => {
            const dgConfig = NIVEAU_CONFIG[dg.niveau]
            return (
              <div
                key={dg.naam}
                className="rounded-xl p-2.5 text-center"
                style={{ backgroundColor: `${dgConfig.color}12` }}
              >
                <span className="text-lg block">{dg.emoji}</span>
                <p className="text-xs font-medium text-foreground mt-0.5">{dg.naam}</p>
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded-full inline-block mt-1"
                  style={{ backgroundColor: `${dgConfig.color}20`, color: dgConfig.color }}
                >
                  {dgConfig.label}
                </span>
              </div>
            )
          })}
        </div>
      )}

      {/* Zorgtaken in drie hokjes: licht / matig / zwaar */}
      {zorgtaken.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            {zorgtaken.length} zorgtaken
          </p>
          <div className="grid grid-cols-3 gap-2">
            <div
              className="rounded-xl p-2.5 text-center"
              style={{ backgroundColor: "var(--accent-green-bg)" }}
            >
              <span className="text-lg font-bold block" style={{ color: "var(--accent-green)" }}>
                {goedCount}
              </span>
              <p className="text-xs font-medium text-foreground mt-0.5">Licht</p>
              <span
                className="text-[10px] font-bold px-1.5 py-0.5 rounded-full inline-block mt-1"
                style={{ backgroundColor: "rgba(34,197,94,0.15)", color: "var(--accent-green)" }}
              >
                💚 Goed
              </span>
            </div>
            <div
              className="rounded-xl p-2.5 text-center"
              style={{ backgroundColor: "var(--accent-amber-bg)" }}
            >
              <span className="text-lg font-bold block" style={{ color: "var(--accent-amber)" }}>
                {matigCount}
              </span>
              <p className="text-xs font-medium text-foreground mt-0.5">Matig</p>
              <span
                className="text-[10px] font-bold px-1.5 py-0.5 rounded-full inline-block mt-1"
                style={{ backgroundColor: "rgba(245,158,11,0.15)", color: "var(--accent-amber)" }}
              >
                🧡 Matig
              </span>
            </div>
            <div
              className="rounded-xl p-2.5 text-center"
              style={{ backgroundColor: "var(--accent-red-bg)" }}
            >
              <span className="text-lg font-bold block" style={{ color: "var(--accent-red)" }}>
                {zwaarCount}
              </span>
              <p className="text-xs font-medium text-foreground mt-0.5">Zwaar</p>
              <span
                className="text-[10px] font-bold px-1.5 py-0.5 rounded-full inline-block mt-1"
                style={{ backgroundColor: "rgba(239,68,68,0.15)", color: "var(--accent-red)" }}
              >
                ❤️ Zwaar
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Footer link */}
      <div className="flex items-center justify-between pt-2 border-t border-border/30">
        <Link
          href="/rapport"
          className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-1"
        >
          Bekijk rapport
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
