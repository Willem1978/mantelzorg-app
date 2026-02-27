"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { ContentModal } from "@/components/ui/ContentModal"

/**
 * Hulpkaart syntax (uitgebreid):
 *   {{hulpkaart:naam|dienst|beschrijving|telefoon|website|gemeente|kosten|openingstijden}}
 *
 * Velden gescheiden door |. Lege velden = geen waarde.
 * De eerste 4 velden (naam, dienst, beschrijving, telefoon) zijn het meest gebruikt.
 * Extra velden (website, gemeente, kosten, openingstijden) worden in de detail-modal getoond.
 */

export interface ParsedHulpkaart {
  naam: string
  dienst: string
  beschrijving: string
  telefoon: string
  website: string
  gemeente: string
  kosten: string
  openingstijden: string
}

const HULPKAART_REGEX = /\{\{hulpkaart:([^}]+)\}\}/g

/**
 * Extraheert hulpkaarten uit tekst en retourneert schone tekst + kaarten.
 */
export function parseHulpkaarten(text: string): { cleanText: string; kaarten: ParsedHulpkaart[] } {
  const kaarten: ParsedHulpkaart[] = []
  const cleanText = text.replace(HULPKAART_REGEX, (_, content: string) => {
    const parts = content.split("|")
    if (parts.length >= 1 && parts[0].trim()) {
      kaarten.push({
        naam: parts[0]?.trim() || "",
        dienst: parts[1]?.trim() || "",
        beschrijving: parts[2]?.trim() || "",
        telefoon: parts[3]?.trim() || "",
        website: parts[4]?.trim() || "",
        gemeente: parts[5]?.trim() || "",
        kosten: parts[6]?.trim() || "",
        openingstijden: parts[7]?.trim() || "",
      })
    }
    return ""
  })
  return { cleanText: cleanText.trimEnd(), kaarten }
}

/**
 * Compact hulpkaart — licht, subtiel, op één regel.
 * Klik opent de ContentModal met volledige details + bel/website knoppen.
 * Kleur: zacht amber/warm (bewust anders dan de groene vervolgacties).
 */
export function HulpKaart({ kaart, className }: { kaart: ParsedHulpkaart; className?: string }) {
  const [modalOpen, setModalOpen] = useState(false)

  const displayNaam = kaart.dienst || kaart.naam
  const subLabel = kaart.naam !== displayNaam ? kaart.naam : kaart.gemeente || ""

  return (
    <>
      <div
        className={cn(
          "flex items-center gap-2.5 px-3 py-2 rounded-xl cursor-pointer transition-all",
          "bg-[var(--accent-amber-bg)]/60 border border-[var(--accent-amber)]/15 hover:border-[var(--accent-amber)]/30 hover:bg-[var(--accent-amber-bg)]",
          className
        )}
        onClick={() => setModalOpen(true)}
      >
        <div className="w-7 h-7 rounded-lg bg-[var(--accent-amber)]/10 flex items-center justify-center flex-shrink-0">
          <svg className="w-3.5 h-3.5 text-[var(--accent-amber)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{displayNaam}</p>
          {subLabel && (
            <p className="text-[11px] text-muted-foreground truncate">{subLabel}</p>
          )}
        </div>
        <span className="text-[11px] text-[var(--accent-amber)] font-medium flex-shrink-0 flex items-center gap-0.5">
          Info
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </span>
      </div>

      <ContentModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        titel={kaart.naam}
        dienst={kaart.dienst || undefined}
        beschrijving={kaart.beschrijving || undefined}
        telefoon={kaart.telefoon || undefined}
        website={kaart.website || undefined}
        gemeente={kaart.gemeente || undefined}
        kosten={kaart.kosten || undefined}
        openingstijden={kaart.openingstijden || undefined}
      />
    </>
  )
}
