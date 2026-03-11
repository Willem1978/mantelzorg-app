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
  let cleanText = text.replace(HULPKAART_REGEX, (_, content: string) => {
    const parts = content.split("|")
    if (parts.length >= 1 && parts[0].trim()) {
      let naam = parts[0]?.trim() || ""
      let dienst = parts[1]?.trim() || ""
      let beschrijving = parts[2]?.trim() || ""

      // Robuustheid: als de AI per ongeluk de beschrijving in het verkeerde veld zet
      // (> 60 tekens is vrijwel zeker een beschrijving, geen korte naam/dienst)
      if (naam.length > 60 && !beschrijving) {
        beschrijving = naam
        naam = dienst || "Hulpbron"
        dienst = ""
      } else if (dienst.length > 60 && !beschrijving) {
        beschrijving = dienst
        dienst = ""
      }

      kaarten.push({
        naam,
        dienst,
        beschrijving,
        telefoon: parts[3]?.trim() || "",
        website: parts[4]?.trim() || "",
        gemeente: parts[5]?.trim() || "",
        kosten: parts[6]?.trim() || "",
        openingstijden: parts[7]?.trim() || "",
      })
    }
    return ""
  })
  // Verwijder overbodige lege regels die overblijven na het strippen van hulpkaarten
  cleanText = cleanText.replace(/\n{3,}/g, "\n\n").trim()
  return { cleanText, kaarten }
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
          "rounded-xl cursor-pointer transition-all border-2 overflow-hidden",
          "bg-white dark:bg-card border-[var(--accent-amber)]/25 hover:border-[var(--accent-amber)]/50 hover:shadow-md",
          className
        )}
        onClick={() => setModalOpen(true)}
      >
        {/* Label bovenaan */}
        <div className="bg-[var(--accent-amber)]/8 px-3 py-1 border-b border-[var(--accent-amber)]/10">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--accent-amber)]">
            Aanbevolen hulp
          </span>
        </div>
        {/* Content */}
        <div className="flex items-center gap-3 px-3 py-2.5">
          <div className="w-9 h-9 rounded-lg bg-[var(--accent-amber)]/10 flex items-center justify-center flex-shrink-0">
            {kaart.telefoon ? (
              <svg className="w-4 h-4 text-[var(--accent-amber)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-[var(--accent-amber)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{displayNaam}</p>
            {subLabel && (
              <p className="text-[11px] text-muted-foreground truncate">{subLabel}</p>
            )}
          </div>
          <div className="flex-shrink-0 bg-[var(--accent-amber)] text-white px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1">
            Bekijk
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
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
        favoriet={{
          type: "HULP",
          itemId: `ai-${(kaart.dienst || kaart.naam).toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
          categorie: "AI aanbeveling",
        }}
      />
    </>
  )
}
