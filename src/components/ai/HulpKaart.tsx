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
 * Compact hulpkaart in de chat.
 * Toont naam + korte beschrijving + "Lees meer".
 * Klik opent de ContentModal met volledige details + bel/website knoppen.
 */
export function HulpKaart({ kaart, className }: { kaart: ParsedHulpkaart; className?: string }) {
  const [modalOpen, setModalOpen] = useState(false)

  // Gebruik dienst als display-naam als die er is, anders naam
  const displayNaam = kaart.dienst || kaart.naam

  return (
    <>
      <div
        className={cn(
          "bg-[var(--primary-light)] border-l-[3px] border-l-primary border border-primary/20 rounded-xl p-3 cursor-pointer hover:shadow-md hover:border-primary/40 transition-all",
          className
        )}
        onClick={() => setModalOpen(true)}
      >
        <div className="flex items-start gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-foreground">{displayNaam}</p>
            {kaart.naam !== displayNaam && kaart.naam && (
              <p className="text-xs text-primary/70 font-medium">{kaart.naam}</p>
            )}
            {kaart.beschrijving && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{kaart.beschrijving}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 mt-2 ml-10">
          {kaart.gemeente && (
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
              {kaart.gemeente}
            </span>
          )}
          <button className="text-xs text-primary font-semibold ml-auto flex items-center gap-1 hover:underline">
            Lees meer
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
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
      />
    </>
  )
}
