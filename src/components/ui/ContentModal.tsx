"use client"

import { useEffect, useRef, useCallback } from "react"
import { ensureAbsoluteUrl } from "@/lib/utils"

interface ContentModalProps {
  isOpen: boolean
  onClose: () => void
  titel: string
  emoji?: string | null
  beschrijving?: string | null
  inhoud?: string | null
  bron?: string | null
  bronLabel?: string | null
  url?: string | null
  telefoon?: string | null
  website?: string | null
  gemeente?: string | null
  soortHulp?: string | null
  kosten?: string | null
  doelgroep?: string | null
  dienst?: string | null
  openingstijden?: string | null
  organisatie?: string | null
}

export function ContentModal({
  isOpen,
  onClose,
  titel,
  emoji,
  beschrijving,
  inhoud,
  bron,
  bronLabel,
  url,
  telefoon,
  website,
  gemeente,
  soortHulp,
  kosten,
  doelgroep,
  dienst,
  openingstijden,
  organisatie,
}: ContentModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  // Focus trap: houd focus binnen de modal
  const handleTabKey = useCallback((e: KeyboardEvent) => {
    if (e.key !== "Tab" || !modalRef.current) return

    const focusable = modalRef.current.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
    )
    if (focusable.length === 0) return

    const first = focusable[0]
    const last = focusable[focusable.length - 1]

    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault()
        last.focus()
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
  }, [])

  // Voorkom scrollen van achtergrond + ESC toets + focus trap
  useEffect(() => {
    if (isOpen) {
      // Bewaar huidige focus om later te herstellen
      previousFocusRef.current = document.activeElement as HTMLElement
      document.body.style.overflow = "hidden"

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") onClose()
        handleTabKey(e)
      }
      document.addEventListener("keydown", handleKeyDown)

      // Focus de modal na openen
      requestAnimationFrame(() => {
        modalRef.current?.focus()
      })

      return () => {
        document.body.style.overflow = ""
        document.removeEventListener("keydown", handleKeyDown)
        // Herstel focus naar vorig element
        previousFocusRef.current?.focus()
      }
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [isOpen, onClose, handleTabKey])

  if (!isOpen) return null

  // Render inhoud met alinea's (dubbele newline = nieuwe alinea, enkele = <br>)
  const renderInhoud = (text: string) => {
    const alineas = text.split(/\n\n+/)
    return alineas.map((alinea, i) => {
      // Check of het een kopje is (begint met ##)
      if (alinea.startsWith("## ")) {
        return (
          <h3 key={i} className="font-bold text-base text-foreground mt-4 mb-2">
            {alinea.replace("## ", "")}
          </h3>
        )
      }
      // Check of het een lijst is (regels beginnen met -)
      const regels = alinea.split("\n")
      if (regels.every(r => r.startsWith("- ") || r.trim() === "")) {
        return (
          <ul key={i} className="list-disc list-inside space-y-1 mb-3 text-sm text-foreground leading-relaxed">
            {regels.filter(r => r.startsWith("- ")).map((r, j) => (
              <li key={j}>{r.replace("- ", "")}</li>
            ))}
          </ul>
        )
      }
      // Gewone alinea
      return (
        <p key={i} className="text-sm text-foreground leading-relaxed mb-3">
          {alinea.split("\n").map((regel, j, arr) => (
            <span key={j}>
              {/* Vetgedrukt: **tekst** */}
              {regel.split(/(\*\*[^*]+\*\*)/).map((deel, k) => {
                if (deel.startsWith("**") && deel.endsWith("**")) {
                  return <strong key={k}>{deel.slice(2, -2)}</strong>
                }
                return <span key={k}>{deel}</span>
              })}
              {j < arr.length - 1 && <br />}
            </span>
          ))}
        </p>
      )
    })
  }

  // Bepaal de weergavetitel: dienst als die er is, anders originele titel
  const weergaveTitel = dienst || titel
  // Organisatienaam: als dienst de titel is, dan is 'titel' de organisatienaam
  const organisatieNaam = organisatie || (dienst ? titel : null)

  // Doelgroep label vertalen
  const doelgroepLabel = doelgroep === "MANTELZORGER"
    ? "Voor mantelzorgers"
    : doelgroep === "ZORGVRAGER"
      ? "Voor zorgvragers"
      : doelgroep

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="content-modal-titel"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" aria-hidden="true" />

      {/* Modal content */}
      <div
        ref={modalRef}
        tabIndex={-1}
        className="relative bg-background rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[85vh] overflow-hidden flex flex-col outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle bar (mobiel) */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-start gap-3 px-5 pt-3 pb-3 border-b border-border">
          {emoji && <span className="text-3xl flex-shrink-0 mt-0.5" aria-hidden="true">{emoji}</span>}
          <div className="flex-1 min-w-0">
            <h2 id="content-modal-titel" className="font-bold text-lg text-foreground leading-tight">{weergaveTitel}</h2>
            {/* Soort hulp als badge onder de titel */}
            {soortHulp && (
              <span className="inline-block mt-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                {soortHulp}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 -mr-2 -mt-1 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-colors"
            aria-label="Sluiten"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto px-5 py-4 flex-1">
          {/* Beschrijving */}
          {beschrijving && (
            <p className="text-sm text-foreground leading-relaxed mb-4">
              {beschrijving}
            </p>
          )}

          {/* Volledige inhoud */}
          {inhoud && (
            <div className="mb-4">
              {renderInhoud(inhoud)}
            </div>
          )}

          {/* Details als één samenhangend blok */}
          {(organisatieNaam || gemeente || doelgroepLabel || kosten || openingstijden) && (
            <div className="space-y-2 text-sm">
              {gemeente && (
                <div className="flex gap-2">
                  <span className="text-muted-foreground w-28 flex-shrink-0">Locatie</span>
                  <span className="text-foreground">{gemeente}</span>
                </div>
              )}
              {organisatieNaam && (
                <div className="flex gap-2">
                  <span className="text-muted-foreground w-28 flex-shrink-0">Organisatie</span>
                  <span className="text-foreground">{organisatieNaam}</span>
                </div>
              )}
              {doelgroepLabel && (
                <div className="flex gap-2">
                  <span className="text-muted-foreground w-28 flex-shrink-0">Voor wie</span>
                  <span className="text-foreground">{doelgroepLabel}</span>
                </div>
              )}
              {kosten && (
                <div className="flex gap-2">
                  <span className="text-muted-foreground w-28 flex-shrink-0">Kosten</span>
                  <span className="text-foreground">{kosten}</span>
                </div>
              )}
              {openingstijden && (
                <div className="flex gap-2">
                  <span className="text-muted-foreground w-28 flex-shrink-0">Bereikbaar op</span>
                  <span className="text-foreground">{openingstijden}</span>
                </div>
              )}
            </div>
          )}

          {/* Bron */}
          {(bron || bronLabel) && (
            <p className="text-xs text-muted-foreground mt-3">
              Bron: {bronLabel || bron}
            </p>
          )}
        </div>

        {/* Footer met knoppen */}
        {(telefoon || url || website) && (
          <div className="px-5 py-4 border-t border-border space-y-2">
            {telefoon && (
              <a
                href={`tel:${telefoon}`}
                className="ker-btn ker-btn-primary w-full flex items-center justify-center gap-2"
              >
                📞 Bellen: {telefoon}
              </a>
            )}
            {(url || website) && (
              <a
                href={ensureAbsoluteUrl(url || website)}
                target="_blank"
                rel="noopener noreferrer"
                className={`ker-btn w-full flex items-center justify-center gap-2 ${telefoon ? "ker-btn-secondary" : "ker-btn-primary"}`}
              >
                🌐 {bronLabel ? `Lees meer op ${bronLabel}` : bron ? `Lees meer op ${bron}` : "Bekijk website"}
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
