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
          "bg-card border border-border rounded-xl p-3 shadow-sm cursor-pointer hover:shadow-md hover:border-primary/30 transition-all",
          className
        )}
        onClick={() => setModalOpen(true)}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-foreground">{displayNaam}</p>
            {kaart.beschrijving && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{kaart.beschrijving}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 mt-2">
          {kaart.gemeente && (
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
              {kaart.gemeente}
            </span>
          )}
          <span className="text-xs text-primary font-medium ml-auto">Lees meer</span>
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
