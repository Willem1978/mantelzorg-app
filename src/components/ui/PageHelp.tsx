"use client"

import { useState } from "react"

interface HelpStep {
  titel: string
  beschrijving: string
  emoji: string
}

interface PageHelpProps {
  paginaNaam: string
  stappen: HelpStep[]
}

export function PageHelp({ paginaNaam, stappen }: PageHelpProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 text-primary font-medium hover:underline min-h-[48px] px-2"
        aria-label={`Uitleg over ${paginaNaam}`}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>Hoe werkt dit?</span>
      </button>

      {isOpen && (
        <div className="ker-help-overlay" onClick={() => setIsOpen(false)}>
          <div
            className="ker-help-panel"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-foreground">
                Zo werkt {paginaNaam}
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-full hover:bg-secondary transition-colors min-w-[48px] min-h-[48px] flex items-center justify-center"
                aria-label="Sluiten"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {stappen.map((stap, i) => (
                <div key={i} className="flex gap-4 items-start">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-lg">
                    {stap.emoji}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">
                      Stap {i + 1}: {stap.titel}
                    </p>
                    <p className="text-muted-foreground mt-0.5 leading-relaxed">
                      {stap.beschrijving}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="ker-btn ker-btn-primary w-full mt-6"
            >
              Begrepen!
            </button>
          </div>
        </div>
      )}
    </>
  )
}
