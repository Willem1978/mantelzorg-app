"use client"

import { cn } from "@/lib/utils"

/**
 * Hulpkaart syntax:
 *   {{hulpkaart:naam|beschrijving|telefoon|website}}
 *
 * Velden gescheiden door |. Lege velden = geen waarde.
 * Voorbeeld:
 *   {{hulpkaart:Thuiszorg Plus|Hulp bij huishoudelijke taken|030-1234567|https://thuiszorgplus.nl}}
 *   {{hulpkaart:Mantelzorglijn|Telefonische steun voor mantelzorgers|030-205 90 59|}}
 */

export interface ParsedHulpkaart {
  naam: string
  beschrijving: string
  telefoon: string
  website: string
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
        beschrijving: parts[1]?.trim() || "",
        telefoon: parts[2]?.trim() || "",
        website: parts[3]?.trim() || "",
      })
    }
    return ""
  })
  return { cleanText: cleanText.trimEnd(), kaarten }
}

function ensureAbsoluteUrl(url: string): string {
  if (!url) return ""
  if (url.startsWith("http://") || url.startsWith("https://")) return url
  return `https://${url}`
}

/**
 * Rendert een hulpkaart in de chat met naam, beschrijving, bel- en website-knoppen.
 */
export function HulpKaart({ kaart, className }: { kaart: ParsedHulpkaart; className?: string }) {
  return (
    <div className={cn("bg-card border border-border rounded-xl p-3 shadow-sm", className)}>
      {/* Naam + beschrijving */}
      <p className="font-semibold text-sm text-foreground">{kaart.naam}</p>
      {kaart.beschrijving && (
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{kaart.beschrijving}</p>
      )}

      {/* Actieknoppen */}
      {(kaart.telefoon || kaart.website) && (
        <div className="flex gap-2 mt-2">
          {kaart.telefoon && (
            <a
              href={`tel:${kaart.telefoon.replace(/\s/g, "")}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              Bel {kaart.telefoon}
            </a>
          )}
          {kaart.website && (
            <a
              href={ensureAbsoluteUrl(kaart.website)}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity",
                kaart.telefoon
                  ? "bg-card border border-primary/30 text-primary hover:bg-primary/5"
                  : "bg-primary text-primary-foreground hover:opacity-90"
              )}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Website
            </a>
          )}
        </div>
      )}
    </div>
  )
}
