"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { ContentModal } from "@/components/ui/ContentModal"

/**
 * Artikelkaart syntax:
 *   {{artikelkaart:titel|beschrijving|emoji|categorie|inhoud}}
 *
 * Velden gescheiden door |. Inhoud is het laatste veld en mag zelf | bevatten.
 * - titel: Artikeltitel
 * - beschrijving: Korte beschrijving (1-2 regels)
 * - emoji: Artikel-emoji (bijv. 💡, 🧘, 📋)
 * - categorie: Categorie-slug (voor link en favoriet)
 * - inhoud: Volledige artikelinhoud (optioneel, kan lang zijn)
 */

export interface ParsedArtikelkaart {
  titel: string
  beschrijving: string
  emoji: string
  categorie: string
  inhoud: string
}

const ARTIKELKAART_REGEX = /\{\{artikelkaart:([\s\S]*?)\}\}/g

/**
 * Extraheert artikelkaarten uit tekst en retourneert schone tekst + kaarten.
 */
export function parseArtikelkaarten(text: string): { cleanText: string; artikelen: ParsedArtikelkaart[] } {
  const artikelen: ParsedArtikelkaart[] = []
  let cleanText = text.replace(ARTIKELKAART_REGEX, (_, content: string) => {
    const parts = content.split("|")
    if (parts.length >= 2 && parts[0].trim()) {
      artikelen.push({
        titel: parts[0]?.trim() || "",
        beschrijving: parts[1]?.trim() || "",
        emoji: parts[2]?.trim() || "📄",
        categorie: parts[3]?.trim() || "",
        // Alles na de 4e pipe is inhoud (mag zelf pipes bevatten)
        inhoud: parts.slice(4).join("|").trim(),
      })
    }
    return ""
  })
  cleanText = cleanText.replace(/\n{3,}/g, "\n\n").trim()
  return { cleanText, artikelen }
}

/**
 * Compact artikelkaart — inline element in het gesprek.
 * Klik opent ContentModal met volledige inhoud + opslaan/mailen.
 * Kleur: groen/teal (onderscheid van amber hulpkaarten).
 */
export function ArtikelKaart({ artikel, className }: { artikel: ParsedArtikelkaart; className?: string }) {
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <>
      <button
        className={cn(
          "flex items-center gap-2.5 px-3 py-2 rounded-xl cursor-pointer transition-all text-left w-full",
          "bg-[var(--accent-green)]/6 border border-[var(--accent-green)]/15",
          "hover:bg-[var(--accent-green)]/12 hover:border-[var(--accent-green)]/30",
          "active:scale-[0.98]",
          className
        )}
        onClick={() => setModalOpen(true)}
      >
        {/* Emoji */}
        <span className="text-lg flex-shrink-0 leading-none">{artikel.emoji || "📄"}</span>
        {/* Titel + beschrijving */}
        <div className="flex-1 min-w-0">
          <span className="text-sm font-semibold text-foreground truncate block">{artikel.titel}</span>
          {artikel.beschrijving && (
            <span className="text-[11px] text-muted-foreground line-clamp-1 block">{artikel.beschrijving}</span>
          )}
        </div>
        {/* Lees-indicator */}
        <span className="text-[11px] text-[var(--accent-green)] font-medium flex-shrink-0 whitespace-nowrap">
          Lees
        </span>
        <svg className="w-3.5 h-3.5 text-[var(--accent-green)] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      <ContentModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        titel={artikel.titel}
        emoji={artikel.emoji || undefined}
        beschrijving={artikel.beschrijving || undefined}
        inhoud={artikel.inhoud || undefined}
        favoriet={{
          type: "INFORMATIE",
          itemId: `ai-artikel-${artikel.titel.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
          categorie: artikel.categorie || "AI aanbeveling",
        }}
      />
    </>
  )
}
