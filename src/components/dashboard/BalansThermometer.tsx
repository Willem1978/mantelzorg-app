"use client"

import Link from "next/link"
import { DeelgebiedIcon } from "@/components/ui/DeelgebiedIcon"

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
    ringColor: "#1B7A3D",
    ringTrack: "#E5F5EA",
    bericht: "Je balans ziet er goed uit!",
    sub: "Je doet het fantastisch.",
  },
  GEMIDDELD: {
    label: "Matig",
    emoji: "🧡",
    color: "var(--accent-amber)",
    bgColor: "var(--accent-amber-bg)",
    ringColor: "#A85E00",
    ringTrack: "#FFF3E0",
    bericht: "Let goed op jezelf.",
    sub: "Je hebt best veel op je bordje.",
  },
  HOOG: {
    label: "Zwaar",
    emoji: "❤️",
    color: "var(--accent-red)",
    bgColor: "var(--accent-red-bg)",
    ringColor: "#A52019",
    ringTrack: "#FDECEB",
    bericht: "Het is zwaar, dat mag er zijn.",
    sub: "Vergeet niet om hulp te vragen.",
  },
}

const DEELGEBIED_CONFIG = {
  LAAG: {
    label: "Goed",
    pastelBg: "bg-emerald-50 dark:bg-emerald-950/20",
    pastelBorder: "border-emerald-200/60 dark:border-emerald-800/40",
    textColor: "text-emerald-700 dark:text-emerald-400",
  },
  GEMIDDELD: {
    label: "Matig",
    pastelBg: "bg-amber-50 dark:bg-amber-950/20",
    pastelBorder: "border-amber-200/60 dark:border-amber-800/40",
    textColor: "text-amber-700 dark:text-amber-400",
  },
  HOOG: {
    label: "Zwaar",
    pastelBg: "bg-rose-50 dark:bg-rose-950/20",
    pastelBorder: "border-rose-200/60 dark:border-rose-800/40",
    textColor: "text-rose-700 dark:text-rose-400",
  },
}


/** SVG Donut Chart — zachte, organische uitstraling */
function BalansDonut({ percentage, config }: { percentage: number; config: typeof NIVEAU_CONFIG.LAAG }) {
  const size = 100
  const strokeWidth = 10
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percentage / 100) * circumference

  return (
    <div className="relative w-[100px] h-[100px] flex-shrink-0">
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full -rotate-90">
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={config.ringTrack}
          strokeWidth={strokeWidth}
          opacity={0.6}
        />
        {/* Filled arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={config.ringColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      {/* Center emoji */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl">{config.emoji}</span>
      </div>
    </div>
  )
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

  const topDeelgebieden = deelgebieden.slice(0, 3)

  // Bouw vriendelijke zorgtaken-samenvatting
  const zorgtakenText = buildZorgtakenText(zorgtaken.length, goedCount, matigCount, zwaarCount)

  return (
    <div className="ker-card space-y-5">
      {/* Balans Cirkel — donut met warme tekst */}
      <div className="flex items-center gap-5">
        <BalansDonut percentage={percentage} config={config} />
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-foreground leading-tight">Balans Cirkel</h3>
          <p className="text-base font-semibold mt-0.5" style={{ color: config.color }}>
            {config.bericht}
          </p>
          <p className="text-sm text-muted-foreground mt-0.5">{config.sub}</p>
        </div>
      </div>

      {/* Deelgebieden: Energie, Gevoel, Tijd — zachte pastelkaarten */}
      {topDeelgebieden.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">
            Hoe gaat het met jou?
          </p>
          <div className="grid grid-cols-3 gap-2.5">
            {topDeelgebieden.map((dg) => {
              const dgConfig = DEELGEBIED_CONFIG[dg.niveau]
              return (
                <div
                  key={dg.naam}
                  className={`rounded-2xl p-3 text-center border ${dgConfig.pastelBg} ${dgConfig.pastelBorder}`}
                >
                  <div className={`flex justify-center mb-1.5 ${dgConfig.textColor}`}>
                    <DeelgebiedIcon naam={dg.naam} size="md" />
                  </div>
                  <p className="text-xs font-semibold text-foreground leading-tight">{dg.naam}</p>
                  <span className={`text-xs font-bold mt-1 inline-block ${dgConfig.textColor}`}>
                    {dgConfig.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Zorgtaken — vriendelijke samenvatting in kaart */}
      {zorgtaken.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">
            Jouw zorgtaken
          </p>
          <div
            className="rounded-2xl px-4 py-3.5 flex items-center gap-3 border"
            style={{ backgroundColor: "var(--accent-green-bg)", borderColor: "transparent" }}
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground leading-relaxed">{zorgtakenText}</p>
            </div>
            {/* Compacte status badges */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {goedCount > 0 && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  Goed
                </span>
              )}
              {matigCount > 0 && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 dark:text-amber-400">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L1 21h22L12 2zm0 4l7.53 13H4.47L12 6z" opacity={0.6}/><path d="M11 10h2v5h-2zm0 6h2v2h-2z"/></svg>
                  Matig
                </span>
              )}
              {zwaarCount > 0 && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700 dark:text-rose-400">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10" opacity={0.15}/><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth={2}/><path d="M12 8v5M12 16h.01"/></svg>
                  Zwaar
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-border">
        <Link
          href="/rapport"
          className="text-sm font-medium text-primary hover:underline inline-flex items-center gap-1 min-h-[44px]"
        >
          Bekijk volledig rapport
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
        {daysSinceTest != null && (
          <span className="text-xs text-muted-foreground font-medium">
            {daysSinceTest === 0 ? "Vandaag getest" : `${daysSinceTest} dagen geleden`}
          </span>
        )}
      </div>
    </div>
  )
}

function buildZorgtakenText(total: number, goed: number, matig: number, zwaar: number): string {
  if (total === 0) return "Je hebt nog geen zorgtaken ingevuld."

  const parts: string[] = []
  parts.push(`Je hebt momenteel ${total} lopende ${total === 1 ? "zorgtaak" : "zorgtaken"}.`)

  if (zwaar > 0 && matig > 0) {
    parts.push(`${zwaar === 1 ? "Eén daarvan" : `${zwaar} daarvan`} ${zwaar === 1 ? "vraagt" : "vragen"} wat extra aandacht.`)
  } else if (zwaar > 0) {
    parts.push(`${zwaar === 1 ? "Eén daarvan" : `${zwaar} daarvan`} ${zwaar === 1 ? "is" : "zijn"} best zwaar.`)
  } else if (matig > 0) {
    parts.push(`${matig === 1 ? "Eén" : `${matig}`} ${matig === 1 ? "vraagt" : "vragen"} wat aandacht.`)
  } else {
    parts.push("Alles gaat lekker!")
  }

  return parts.join("\n")
}
