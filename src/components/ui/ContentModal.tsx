"use client"

import { useEffect } from "react"
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
  // Voorkom scrollen van achtergrond + ESC toets
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
      const handleEsc = (e: KeyboardEvent) => {
        if (e.key === "Escape") onClose()
      }
      document.addEventListener("keydown", handleEsc)
      return () => {
        document.body.style.overflow = ""
        document.removeEventListener("keydown", handleEsc)
      }
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [isOpen, onClose])

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

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Modal content */}
      <div
        className="relative bg-background rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle bar (mobiel) */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-start gap-3 px-5 pt-3 pb-3 border-b border-border">
          {emoji && <span className="text-3xl flex-shrink-0 mt-0.5">{emoji}</span>}
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-lg text-foreground leading-tight">{weergaveTitel}</h2>
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
          {(organisatieNaam || gemeente || kosten || openingstijden || telefoon || doelgroep) && (
            <div className="space-y-2 text-sm">
              {gemeente && (
                <div className="flex gap-2">
                  <span className="text-muted-foreground w-24 flex-shrink-0">Locatie</span>
                  <span className="text-foreground">{gemeente}</span>
                </div>
              )}
              {organisatieNaam && (
                <div className="flex gap-2">
                  <span className="text-muted-foreground w-24 flex-shrink-0">Organisatie</span>
                  <span className="text-foreground">{organisatieNaam}</span>
                </div>
              )}
              {telefoon && (
                <div className="flex gap-2">
                  <span className="text-muted-foreground w-24 flex-shrink-0">Telefoon</span>
                  <span className="text-foreground">{telefoon}</span>
                </div>
              )}
              {openingstijden && (
                <div className="flex gap-2">
                  <span className="text-muted-foreground w-24 flex-shrink-0">Bereikbaar</span>
                  <span className="text-foreground">{openingstijden}</span>
                </div>
              )}
              {doelgroep && (
                <div className="flex gap-2">
                  <span className="text-muted-foreground w-24 flex-shrink-0">Doelgroep</span>
                  <span className="text-foreground">{doelgroep}</span>
                </div>
              )}
              {kosten && (
                <div className="flex gap-2">
                  <span className="text-muted-foreground w-24 flex-shrink-0">Kosten</span>
                  <span className="text-foreground">{kosten}</span>
                </div>
              )}
            </div>
          )}

          {/* Bron */}
          {(bron || bronLabel) && (
            <p className="text-xs text-muted-foreground mt-3">
              Bron: {bron || bronLabel}
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
                🌐 {(bron || bronLabel) ? `Lees meer op ${bron || bronLabel}` : "Bekijk website"}
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
