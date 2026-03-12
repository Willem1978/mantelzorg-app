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
  userName?: string
  naasteNaam?: string | null
  naasteRelatie?: string | null
}

const NIVEAU_CONFIG = {
  LAAG: {
    label: "Goed",
    emoji: "💚",
    color: "var(--accent-green)",
    bgColor: "var(--accent-green-bg)",
    ringColor: "#1B7A3D",
    ringTrack: "#E5F5EA",
  },
  GEMIDDELD: {
    label: "Matig",
    emoji: "🧡",
    color: "var(--accent-amber)",
    bgColor: "var(--accent-amber-bg)",
    ringColor: "#A85E00",
    ringTrack: "#FFF3E0",
  },
  HOOG: {
    label: "Zwaar",
    emoji: "❤️",
    color: "var(--accent-red)",
    bgColor: "var(--accent-red-bg)",
    ringColor: "#A52019",
    ringTrack: "#FDECEB",
  },
}

/** SVG Donut Chart */
function BalansDonut({ percentage, config }: { percentage: number; config: typeof NIVEAU_CONFIG.LAAG }) {
  const size = 100
  const strokeWidth = 10
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percentage / 100) * circumference

  return (
    <div className="relative w-[100px] h-[100px] flex-shrink-0">
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={config.ringTrack}
          strokeWidth={strokeWidth}
          opacity={0.6}
        />
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
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl">{config.emoji}</span>
      </div>
    </div>
  )
}

/** Build a personal narrative about the caregiver's situation */
function buildVerhaal(
  niveau: "LAAG" | "GEMIDDELD" | "HOOG",
  userName: string,
  naasteNaam: string | null,
  naasteRelatie: string | null,
  totaalUren: number | null,
  zorgtaken: ZorgtaakInfo[],
  zwaarCount: number,
): { titel: string; verhaal: string } {
  const naasteTekst = naasteNaam
    ? naasteRelatie
      ? `${naasteNaam} (je ${naasteRelatie.toLowerCase()})`
      : naasteNaam
    : naasteRelatie
      ? `je ${naasteRelatie.toLowerCase()}`
      : "je naaste"

  const urenTekst = totaalUren
    ? totaalUren >= 20
      ? `Je besteedt ${totaalUren} uur per week aan zorg — dat is een flinke klus.`
      : `Je besteedt zo'n ${totaalUren} uur per week aan zorg.`
    : ""

  if (niveau === "HOOG") {
    return {
      titel: "Het is zwaar, dat mag er zijn.",
      verhaal: `${userName}, je zorgt voor ${naasteTekst} en dat kost veel van je. ${urenTekst}${zwaarCount > 0 ? ` ${zwaarCount === 1 ? "Een van je zorgtaken" : `${zwaarCount} van je zorgtaken`} ${zwaarCount === 1 ? "weegt" : "wegen"} zwaar.` : ""} Vergeet niet om ook hulp te vragen voor jezelf.`,
    }
  }

  if (niveau === "GEMIDDELD") {
    return {
      titel: "Let goed op jezelf.",
      verhaal: `${userName}, je zorgt voor ${naasteTekst} en hebt best wat op je bordje. ${urenTekst}${zwaarCount > 0 ? ` Let extra op bij de ${zwaarCount === 1 ? "taak die" : "taken die"} zwaar ${zwaarCount === 1 ? "voelt" : "voelen"}.` : " Het gaat redelijk, maar houd je grenzen in de gaten."}`,
    }
  }

  return {
    titel: "Je balans ziet er goed uit!",
    verhaal: `${userName}, je zorgt voor ${naasteTekst} en houdt de balans goed. ${urenTekst} Ga zo door en blijf goed voor jezelf zorgen.`,
  }
}

export function BalansThermometer({
  score,
  maxScore = 24,
  niveau,
  zorgtaken = [],
  deelgebieden = [],
  totaalUren,
  daysSinceTest,
  userName = "Je",
  naasteNaam,
  naasteRelatie,
}: BalansThermometerProps) {
  const config = NIVEAU_CONFIG[niveau]
  const percentage = Math.min((score / maxScore) * 100, 100)

  const isZwaar = (m: string | null) => m === 'MOEILIJK' || m === 'ZEER_MOEILIJK' || m === 'JA' || m === 'ja'
  const isMatig = (m: string | null) => m === 'GEMIDDELD' || m === 'SOMS' || m === 'soms'

  const zwaarCount = zorgtaken.filter(t => isZwaar(t.moeilijkheid)).length
  const matigCount = zorgtaken.filter(t => isMatig(t.moeilijkheid)).length
  const goedCount = zorgtaken.length - zwaarCount - matigCount

  const topDeelgebieden = deelgebieden.slice(0, 3)

  const { titel, verhaal } = buildVerhaal(niveau, userName, naasteNaam ?? null, naasteRelatie ?? null, totaalUren ?? null, zorgtaken, zwaarCount)

  // (deelgebieden + zorgtaken worden nu als verhaal getoond)

  return (
    <div className="ker-card space-y-5">
      {/* Balans Cirkel + persoonlijk verhaal */}
      <div className="flex items-start gap-5">
        <BalansDonut percentage={percentage} config={config} />
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-foreground leading-tight">Balans Cirkel</h3>
          <p className="text-base font-semibold mt-0.5" style={{ color: config.color }}>
            {titel}
          </p>
          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{verhaal}</p>
        </div>
      </div>

      {/* Deelgebieden + zorgtaken als doorlopend verhaal */}
      {(topDeelgebieden.length > 0 || zorgtaken.length > 0) && (
        <p className="text-sm text-muted-foreground leading-relaxed">
          {buildSamenvattingVerhaal(topDeelgebieden, zorgtaken.length, goedCount, matigCount, zwaarCount)}
        </p>
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

function buildSamenvattingVerhaal(
  deelgebieden: DeelgebiedInfo[],
  totaleTaken: number,
  goed: number,
  matig: number,
  zwaar: number,
): string {
  const parts: string[] = []

  // Deelgebieden als vloeiende tekst
  if (deelgebieden.length > 0) {
    const niveauWoord = (n: "LAAG" | "GEMIDDELD" | "HOOG") =>
      n === "LAAG" ? "goed" : n === "GEMIDDELD" ? "matig" : "zwaar"

    const beschrijvingen = deelgebieden.map(
      (dg) => `je ${dg.naam.toLowerCase()} is ${niveauWoord(dg.niveau)}`
    )

    if (beschrijvingen.length === 1) {
      parts.push(`Uit je test blijkt dat ${beschrijvingen[0]}.`)
    } else if (beschrijvingen.length === 2) {
      parts.push(`Uit je test blijkt dat ${beschrijvingen[0]} en ${beschrijvingen[1]}.`)
    } else {
      const laatste = beschrijvingen.pop()
      parts.push(`Uit je test blijkt dat ${beschrijvingen.join(", ")} en ${laatste}.`)
    }
  }

  // Zorgtaken als doorlopende zin
  if (totaleTaken > 0) {
    let takenZin = `Je hebt ${totaleTaken} ${totaleTaken === 1 ? "zorgtaak" : "zorgtaken"}`
    if (zwaar > 0 && matig > 0) {
      takenZin += `, waarvan ${zwaar === 1 ? "één" : zwaar} ${zwaar === 1 ? "weegt" : "wegen"} zwaar`
    } else if (zwaar > 0) {
      takenZin += `, waarvan ${zwaar === 1 ? "één" : zwaar} best zwaar ${zwaar === 1 ? "is" : "zijn"}`
    } else if (matig > 0) {
      takenZin += `, waarvan ${matig === 1 ? "één" : matig} wat aandacht ${matig === 1 ? "vraagt" : "vragen"}`
    } else {
      takenZin += " en alles gaat lekker"
    }
    takenZin += "."
    parts.push(takenZin)
  }

  return parts.join(" ")
}
