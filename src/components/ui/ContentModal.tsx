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
            <h2 className="font-bold text-lg text-foreground leading-tight">{titel}</h2>
            {bronLabel && (
              <span className={`inline-block text-xs px-2 py-0.5 rounded-full mt-1 ${bronLabelKleur(bronLabel)}`}>
                {bronLabel}
              </span>
            )}
            {soortHulp && (
              <span className="inline-block text-xs px-2 py-0.5 rounded-full mt-1 bg-primary/10 text-primary ml-1">
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
          {/* Korte beschrijving */}
          {beschrijving && (
            <p className="text-sm text-muted-foreground leading-relaxed mb-4 italic">
              {beschrijving}
            </p>
          )}

          {/* Volledige inhoud */}
          {inhoud && (
            <div className="mb-4">
              {renderInhoud(inhoud)}
            </div>
          )}

          {/* Info-blokken voor organisaties */}
          {(gemeente || kosten) && (
            <div className="space-y-2 mb-4">
              {gemeente && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">📍</span>
                  <span className="text-foreground">{gemeente}</span>
                </div>
              )}
              {kosten && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">💰</span>
                  <span className="text-foreground">{kosten}</span>
                </div>
              )}
            </div>
          )}

          {/* Bron */}
          {bron && (
            <p className="text-xs text-muted-foreground mb-4">
              Bron: {bron}
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
                🌐 {bron ? `Lees meer op ${bron}` : "Bekijk website"}
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function bronLabelKleur(label: string | null): string {
  if (!label) return "bg-muted text-muted-foreground"
  switch (label) {
    case "Landelijk": return "bg-primary/10 text-primary"
    case "Gemeente (Wmo)": return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
    case "Zorgverzekeraar (Zvw)": return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
    case "Wlz": return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
    default: return "bg-muted text-muted-foreground"
  }
}
