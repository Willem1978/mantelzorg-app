"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { ContentModal } from "@/components/ui/ContentModal"

/**
 * Artikelkaart syntax — twee formats ondersteund:
 *
 * NIEUW (voorkeur): {{artikelkaart:id|titel|emoji|categorie}}
 *   De client haalt de volledige inhoud op via /api/artikelen/[id]
 *   zodragebruiker de kaart aanklikt. Robuust tegen | in de inhoud,
 *   bespaart tokens en garandeert altijd actuele content.
 *
 * OUD (backwards compatible): {{artikelkaart:titel|beschrijving|emoji|categorie|inhoud}}
 *   De inhoud staat inline in de token. Wordt nog herkend voor oude
 *   gesprekken in localStorage.
 *
 * Heuristiek: een cuid-id begint typisch met "c" en is 24+ tekens
 * lang zonder spaties. Als het eerste veld daar aan voldoet, gaan we
 * uit van het nieuwe format (4 velden).
 */

export interface ParsedArtikelkaart {
  id?: string
  titel: string
  beschrijving: string
  emoji: string
  categorie: string
  inhoud: string
}

const ARTIKELKAART_REGEX = /\{\{artikelkaart:([\s\S]*?)\}\}/g
const CUID_LIKE = /^c[a-z0-9]{15,}$/i

export function parseArtikelkaarten(text: string): { cleanText: string; artikelen: ParsedArtikelkaart[] } {
  const artikelen: ParsedArtikelkaart[] = []
  let cleanText = text.replace(ARTIKELKAART_REGEX, (_, content: string) => {
    const parts = content.split("|").map((p) => p.trim())
    if (parts.length === 0 || !parts[0]) return ""

    const eerste = parts[0]
    const lijktOpId = CUID_LIKE.test(eerste) && !eerste.includes(" ")

    if (lijktOpId) {
      // Nieuw format: id | titel | emoji | categorie (geen inhoud — die komt via API)
      artikelen.push({
        id: eerste,
        titel: parts[1] || "",
        beschrijving: "",
        emoji: parts[2] || "📄",
        categorie: parts[3] || "",
        inhoud: "",
      })
    } else {
      // Oud format: titel | beschrijving | emoji | categorie | inhoud
      artikelen.push({
        titel: eerste,
        beschrijving: parts[1] || "",
        emoji: parts[2] || "📄",
        categorie: parts[3] || "",
        inhoud: parts.slice(4).join("|"),
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
  const [inhoud, setInhoud] = useState<string>(artikel.inhoud || "")
  const [beschrijving, setBeschrijving] = useState<string>(artikel.beschrijving || "")
  const [laden, setLaden] = useState(false)

  // Bij nieuwe id-syntax: haal inhoud op zodra de modal opent (lazy).
  // We slaan het lokaal op, zodat heropenen geen tweede fetch doet.
  useEffect(() => {
    if (!modalOpen || !artikel.id || inhoud) return
    let cancelled = false
    setLaden(true)
    fetch(`/api/artikelen/${artikel.id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data?.artikel) return
        setInhoud(data.artikel.inhoud || "")
        if (data.artikel.beschrijving && !beschrijving) {
          setBeschrijving(data.artikel.beschrijving)
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLaden(false)
      })
    return () => {
      cancelled = true
    }
  }, [modalOpen, artikel.id, inhoud, beschrijving])

  // FavorietId stabiel: gebruik artikel-id als beschikbaar, anders titel-slug
  const favorietItemId = artikel.id
    ? `artikel-${artikel.id}`
    : `ai-artikel-${artikel.titel.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`

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
        onClick={() => {
          setModalOpen(true)
          // Klik-tracking (niet-blocking)
          fetch("/api/ai/suggestie-klik", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "ARTIKEL",
              itemKey: artikel.id || artikel.titel,
              categorie: artikel.categorie || null,
              titel: artikel.titel,
            }),
          }).catch(() => {})
        }}
      >
        {/* Emoji */}
        <span className="text-lg flex-shrink-0 leading-none">{artikel.emoji || "📄"}</span>
        {/* Titel + beschrijving */}
        <div className="flex-1 min-w-0">
          <span className="text-sm font-semibold text-foreground truncate block">{artikel.titel}</span>
          {beschrijving && (
            <span className="text-[11px] text-muted-foreground line-clamp-1 block">{beschrijving}</span>
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
        beschrijving={beschrijving || undefined}
        inhoud={laden ? "Bezig met laden…" : inhoud || undefined}
        favoriet={{
          type: "INFORMATIE",
          itemId: favorietItemId,
          categorie: artikel.categorie || "AI aanbeveling",
        }}
      />
    </>
  )
}
