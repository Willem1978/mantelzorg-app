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
    emoji: "💚",
    color: "var(--accent-green)",
    ringColor: "#1B7A3D",
    ringTrack: "#E5F5EA",
    cardBg: "linear-gradient(135deg, rgba(232,245,233,0.5) 0%, rgba(255,255,255,0) 60%)",
  },
  GEMIDDELD: {
    emoji: "🧡",
    color: "var(--accent-amber)",
    ringColor: "#A85E00",
    ringTrack: "#FFF3E0",
    cardBg: "linear-gradient(135deg, rgba(255,243,224,0.5) 0%, rgba(255,255,255,0) 60%)",
  },
  HOOG: {
    emoji: "❤️",
    color: "var(--accent-red)",
    ringColor: "#A52019",
    ringTrack: "#FDECEB",
    cardBg: "linear-gradient(135deg, rgba(253,236,235,0.5) 0%, rgba(255,255,255,0) 60%)",
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
    <div className="relative w-[88px] h-[88px] flex-shrink-0">
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

/** Deelgebied naam zonder "Jouw" prefix voor in een zin */
function deelgebiedLabel(naam: string): string {
  return naam.replace(/^Jouw\s+/i, "").toLowerCase()
}

/** Niveau woord */
function niveauWoord(n: "LAAG" | "GEMIDDELD" | "HOOG"): string {
  return n === "LAAG" ? "goed" : n === "GEMIDDELD" ? "matig" : "zwaar"
}

/** Build JSX paragraphs for the narrative */
function VerhaalContent({
  niveau, userName, naasteNaam, naasteRelatie, totaalUren, zwaarCount, matigCount, totaleTaken, deelgebieden,
}: {
  niveau: "LAAG" | "GEMIDDELD" | "HOOG"
  userName: string
  naasteNaam: string | null
  naasteRelatie: string | null
  totaalUren: number | null
  zwaarCount: number
  matigCount: number
  totaleTaken: number
  deelgebieden: DeelgebiedInfo[]
}) {
  const naasteTekst = naasteNaam
    ? naasteRelatie
      ? `${naasteNaam} (je ${naasteRelatie.toLowerCase()})`
      : naasteNaam
    : naasteRelatie
      ? `je ${naasteRelatie.toLowerCase()}`
      : "je naaste"

  const urenTekst = totaalUren
    ? totaalUren >= 20
      ? <> Je besteedt <strong>{totaalUren} uur per week</strong> aan zorg — dat is een flinke klus.</>
      : <> Je besteedt zo&apos;n <strong>{totaalUren} uur per week</strong> aan zorg.</>
    : null

  // Alinea 1: Persoonlijke intro
  let intro: React.ReactNode
  if (niveau === "HOOG") {
    intro = <>{userName}, je zorgt voor <strong>{naasteTekst}</strong> en dat kost veel van je.{urenTekst} Vergeet niet om ook hulp te vragen voor jezelf.</>
  } else if (niveau === "GEMIDDELD") {
    intro = <>{userName}, je zorgt voor <strong>{naasteTekst}</strong> en hebt best wat op je bordje.{urenTekst} Houd je grenzen in de gaten.</>
  } else {
    intro = <>{userName}, je zorgt voor <strong>{naasteTekst}</strong> en houdt de balans goed.{urenTekst} Ga zo door en blijf goed voor jezelf zorgen.</>
  }

  // Alinea 2: Deelgebieden (energie, gevoel, tijd)
  const aandacht = deelgebieden.filter((dg) => dg.niveau !== "LAAG")
  let deelgebiedenBlok: React.ReactNode = null
  if (deelgebieden.length > 0) {
    deelgebiedenBlok = (
      <>
        {deelgebieden.map((dg, i) => (
          <span key={dg.naam}>
            {i > 0 && (i === deelgebieden.length - 1 ? " en " : ", ")}
            je <strong>{deelgebiedLabel(dg.naam)}</strong> is {niveauWoord(dg.niveau)}
          </span>
        ))}
        .{" "}
        {aandacht.length > 0 && aandacht.map((dg, i) => (
          <span key={dg.naam}>{i > 0 ? " " : ""}{dg.tip}</span>
        ))}
      </>
    )
  }

  // Alinea 3: Zorgtaken
  let takenBlok: React.ReactNode = null
  if (totaleTaken > 0) {
    takenBlok = (
      <>
        Je hebt <strong>{totaleTaken} {totaleTaken === 1 ? "zorgtaak" : "zorgtaken"}</strong>
        {zwaarCount > 0 && matigCount > 0
          ? <>, waarvan {zwaarCount === 1 ? "één" : zwaarCount} {zwaarCount === 1 ? "weegt" : "wegen"} zwaar en {matigCount === 1 ? "één" : matigCount} aandacht {matigCount === 1 ? "vraagt" : "vragen"}</>
          : zwaarCount > 0
            ? <>, waarvan <strong>{zwaarCount === 1 ? "één" : zwaarCount}</strong> best zwaar {zwaarCount === 1 ? "is" : "zijn"}</>
            : matigCount > 0
              ? <>, waarvan {matigCount === 1 ? "één" : matigCount} wat aandacht {matigCount === 1 ? "vraagt" : "vragen"}</>
              : <> — en alles gaat lekker</>
        }.
      </>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-base leading-relaxed text-foreground/80">{intro}</p>
      {deelgebiedenBlok && (
        <p className="text-base leading-relaxed text-foreground/80">{deelgebiedenBlok}</p>
      )}
      {takenBlok && (
        <p className="text-base leading-relaxed text-foreground/80">{takenBlok}</p>
      )}
    </div>
  )
}

/** Niveau titel */
function getNiveauTitel(niveau: "LAAG" | "GEMIDDELD" | "HOOG"): string {
  if (niveau === "HOOG") return "Het is zwaar, dat mag er zijn."
  if (niveau === "GEMIDDELD") return "Let goed op jezelf."
  return "Je balans ziet er goed uit!"
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

  const topDeelgebieden = deelgebieden.slice(0, 3)
  const titel = getNiveauTitel(niveau)

  return (
    <div className="ker-card space-y-4" style={{ background: config.cardBg }}>
      {/* Donut + titel */}
      <div className="flex items-center gap-4">
        <BalansDonut percentage={percentage} config={config} />
        <div className="flex-1 min-w-0">
          <h3 className="text-xl font-bold leading-snug" style={{ color: config.color }}>
            {titel}
          </h3>
          {daysSinceTest != null && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {daysSinceTest === 0 ? "Vandaag getest" : `${daysSinceTest} dagen geleden getest`}
            </p>
          )}
        </div>
      </div>

      {/* Persoonlijk verhaal in alinea's */}
      <VerhaalContent
        niveau={niveau}
        userName={userName}
        naasteNaam={naasteNaam ?? null}
        naasteRelatie={naasteRelatie ?? null}
        totaalUren={totaalUren ?? null}
        zwaarCount={zwaarCount}
        matigCount={matigCount}
        totaleTaken={zorgtaken.length}
        deelgebieden={topDeelgebieden}
      />

      {/* Rapport link */}
      <div className="pt-1">
        <Link
          href="/rapport"
          className="text-sm font-semibold text-primary hover:underline inline-flex items-center gap-1 min-h-[44px]"
        >
          Bekijk je volledige rapport
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  )
}
