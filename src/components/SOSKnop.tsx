"use client"

import { useState } from "react"

interface SOSKnopProps {
  /** Compact mode voor in header/navbar */
  compact?: boolean
  /** Huisarts telefoonnummer uit profiel (optioneel) */
  huisartsTelefoon?: string | null
}

const noodcontacten = [
  {
    naam: "Mantelzorglijn",
    telefoon: "030-164 0 164",
    telLink: "tel:0301640164",
    beschrijving: "Voor vragen, advies en een luisterend oor",
    emoji: "🧡",
    openingstijden: "Ma-vr 9:00-18:00",
  },
  {
    naam: "113 Zelfmoordpreventie",
    telefoon: "0900-0113",
    telLink: "tel:09000113",
    beschrijving: "Bij suïcidale gedachten, 24/7 bereikbaar",
    emoji: "💛",
    openingstijden: "24/7",
  },
  {
    naam: "Crisislijn",
    telefoon: "0800-0113",
    telLink: "tel:08000113",
    beschrijving: "Gratis, anoniem, 24 uur per dag",
    emoji: "📞",
    openingstijden: "24/7",
  },
]

export function SOSKnop({ compact = false, huisartsTelefoon }: SOSKnopProps) {
  const [open, setOpen] = useState(false)

  if (compact) {
    return (
      <>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-colors"
          aria-label="Noodhulp nodig"
        >
          <span aria-hidden="true">🆘</span>
          <span className="hidden sm:inline">Noodhulp</span>
        </button>

        {open && <SOSModal huisartsTelefoon={huisartsTelefoon} onClose={() => setOpen(false)} />}
      </>
    )
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full p-4 bg-red-50 hover:bg-red-100 border-2 border-red-200 hover:border-red-300 rounded-xl transition-all group"
        aria-label="Ik heb nu hulp nodig"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-2xl" aria-hidden="true">🆘</span>
          </div>
          <div className="text-left flex-1">
            <p className="font-bold text-red-900 text-base">
              Ik heb NU hulp nodig
            </p>
            <p className="text-sm text-red-700">
              Direct contact met hulpverleners
            </p>
          </div>
          <svg
            className="w-5 h-5 text-red-400 group-hover:text-red-600 transition-colors flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </button>

      {open && <SOSModal huisartsTelefoon={huisartsTelefoon} onClose={() => setOpen(false)} />}
    </>
  )
}

function SOSModal({
  huisartsTelefoon,
  onClose,
}: {
  huisartsTelefoon?: string | null
  onClose: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Noodhulp contacten"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative w-full max-w-md mx-4 mb-0 sm:mb-0 bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-red-600 text-white px-6 py-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl" aria-hidden="true">🆘</span>
              <h2 className="text-lg font-bold">Hulp nodig?</h2>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
              aria-label="Sluiten"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-sm text-white/90 mt-1">
            Kies wie je wilt bellen. Je bent niet alleen.
          </p>
        </div>

        {/* 112 prominent */}
        <div className="px-6 pt-4">
          <a
            href="tel:112"
            className="flex items-center gap-4 p-4 bg-red-50 border-2 border-red-300 rounded-xl hover:bg-red-100 transition-colors"
          >
            <div className="w-14 h-14 bg-red-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-2xl font-bold">112</span>
            </div>
            <div className="flex-1">
              <p className="font-bold text-red-900 text-lg">112 - Noodgeval</p>
              <p className="text-sm text-red-700">Bij direct gevaar voor jezelf of een ander</p>
            </div>
          </a>
        </div>

        {/* Huisarts indien beschikbaar */}
        {huisartsTelefoon && (
          <div className="px-6 pt-3">
            <a
              href={`tel:${huisartsTelefoon.replace(/[^0-9+]/g, "")}`}
              className="flex items-center gap-4 p-4 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors"
            >
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-2xl" aria-hidden="true">🩺</span>
              </div>
              <div className="flex-1">
                <p className="font-bold text-blue-900">Je huisarts</p>
                <p className="text-sm text-blue-700">{huisartsTelefoon}</p>
              </div>
              <svg className="w-5 h-5 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </a>
          </div>
        )}

        {/* Noodcontacten */}
        <div className="px-6 pt-3 pb-6 space-y-3">
          {noodcontacten.map((contact) => (
            <a
              key={contact.naam}
              href={contact.telLink}
              className="flex items-center gap-4 p-4 bg-card border border-border rounded-xl hover:bg-muted transition-colors"
            >
              <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-2xl" aria-hidden="true">{contact.emoji}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-foreground">{contact.naam}</p>
                </div>
                <p className="text-sm text-muted-foreground">{contact.beschrijving}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm font-semibold text-primary">{contact.telefoon}</span>
                  <span className="text-xs text-muted-foreground">({contact.openingstijden})</span>
                </div>
              </div>
              <svg className="w-5 h-5 text-muted-foreground flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </a>
          ))}

          {/* Extra info */}
          <p className="text-xs text-center text-muted-foreground pt-2">
            Je gegevens worden niet gedeeld als je belt. Alle gesprekken zijn vertrouwelijk.
          </p>
        </div>
      </div>
    </div>
  )
}
