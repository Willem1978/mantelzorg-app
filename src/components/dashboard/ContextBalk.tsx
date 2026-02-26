"use client"

import { cn } from "@/lib/utils"
import Link from "next/link"

interface ContextBalkProps {
  niveau: "LAAG" | "GEMIDDELD" | "HOOG" | null
  score: number | null
  totaalUren: number | null
  impactTotaal: number | null
  impactNiveau: "LAAG" | "GEMIDDELD" | "HOOG" | null
  daysSinceTest: number | null
  zwareTaken: number
  checkInDone: boolean
}

const NIVEAU_CONFIG = {
  LAAG: {
    label: "Goed",
    color: "bg-[var(--accent-green)] text-white",
    bgColor: "bg-[var(--accent-green-bg)]",
    textColor: "text-[var(--accent-green)]",
  },
  GEMIDDELD: {
    label: "Let op",
    color: "bg-[var(--accent-amber)] text-white",
    bgColor: "bg-[var(--accent-amber-bg)]",
    textColor: "text-[var(--accent-amber)]",
  },
  HOOG: {
    label: "Zwaar",
    color: "bg-[var(--accent-red)] text-white",
    bgColor: "bg-[var(--accent-red-bg)]",
    textColor: "text-[var(--accent-red)]",
  },
}

export function ContextBalk({
  niveau,
  score,
  totaalUren,
  impactTotaal,
  impactNiveau,
  daysSinceTest,
  zwareTaken,
  checkInDone,
}: ContextBalkProps) {
  if (!niveau) return null

  const config = NIVEAU_CONFIG[niveau]
  const impactConfig = impactNiveau ? NIVEAU_CONFIG[impactNiveau] : null

  return (
    <div className={cn("rounded-xl p-3 mb-4", config.bgColor)}>
      <div className="flex items-center justify-between gap-3">
        {/* Links: Balans status */}
        <div className="flex items-center gap-2.5 min-w-0">
          <span className={cn("text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0", config.color)}>
            {config.label}
          </span>
          <div className="min-w-0">
            <p className={cn("text-sm font-semibold", config.textColor)}>
              Balans: {score}/24
            </p>
          </div>
        </div>

        {/* Rechts: kerncijfers */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground flex-shrink-0">
          {totaalUren !== null && totaalUren > 0 && (
            <span title="Uren zorg per week">{totaalUren}u/w</span>
          )}
          {zwareTaken > 0 && (
            <span className="text-[var(--accent-red)]" title="Zware taken">
              {zwareTaken} zwaar
            </span>
          )}
          {impactTotaal !== null && impactConfig && (
            <span className={cn("font-semibold", impactConfig.textColor)} title="Impact-score (uren x zwaarte)">
              IS:{impactTotaal}
            </span>
          )}
          {!checkInDone && (
            <Link
              href="/check-in"
              className="text-primary font-medium hover:underline"
            >
              Check-in
            </Link>
          )}
        </div>
      </div>

      {/* Verloop-indicator */}
      {daysSinceTest !== null && daysSinceTest > 60 && (
        <p className="text-xs text-muted-foreground mt-1.5">
          Test is {daysSinceTest} dagen oud — <Link href="/belastbaarheidstest" className="text-primary font-medium hover:underline">doe een nieuwe</Link>
        </p>
      )}
    </div>
  )
}
