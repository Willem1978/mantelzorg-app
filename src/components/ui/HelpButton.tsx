"use client"

import { useState } from "react"

interface HelpItem {
  vraag: string
  antwoord: string
}

const veelgesteldeVragen: HelpItem[] = [
  {
    vraag: "Hoe doe ik de balanstest?",
    antwoord: "Ga naar 'Balanstest' in het menu. Je beantwoordt korte vragen over hoe het met je gaat. Aan het einde zie je je score en tips."
  },
  {
    vraag: "Wat is een check-in?",
    antwoord: "Een check-in is een kort momentje om bij te houden hoe het met je gaat. Je beantwoordt een paar vragen en krijgt persoonlijke tips."
  },
  {
    vraag: "Hoe vind ik hulp bij mij in de buurt?",
    antwoord: "Ga naar 'Hulp' in het menu. Daar vind je organisaties en hulpverleners bij jou in de buurt."
  },
  {
    vraag: "Kan ik mijn gegevens aanpassen?",
    antwoord: "Ja! Ga naar je profiel via het icoontje rechtsboven of via 'Profiel' in het menu onderaan."
  },
  {
    vraag: "Is mijn informatie veilig?",
    antwoord: "Ja. Je gegevens worden veilig opgeslagen en niet gedeeld met derden. Bekijk onze privacyverklaring voor meer informatie."
  },
]

export function HelpButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [openItem, setOpenItem] = useState<number | null>(null)

  return (
    <>
      <div className="ker-help-float">
        <button
          onClick={() => setIsOpen(true)}
          className="ker-help-float-btn"
          aria-label="Hulp nodig? Open het hulpmenu"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Hulp nodig?</span>
        </button>
      </div>

      {isOpen && (
        <div className="ker-help-overlay" onClick={() => setIsOpen(false)}>
          <div
            className="ker-help-panel"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-foreground">Hulp & Veelgestelde vragen</h2>
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

            <div className="space-y-2 mb-6">
              {veelgesteldeVragen.map((item, i) => (
                <div key={i} className="border border-border rounded-xl overflow-hidden">
                  <button
                    onClick={() => setOpenItem(openItem === i ? null : i)}
                    className="w-full flex items-center justify-between p-4 text-left font-medium text-foreground hover:bg-secondary/50 transition-colors min-h-[52px]"
                  >
                    <span>{item.vraag}</span>
                    <svg
                      className={`w-5 h-5 text-muted-foreground transition-transform flex-shrink-0 ml-2 ${openItem === i ? "rotate-180" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {openItem === i && (
                    <div className="px-4 pb-4 text-muted-foreground leading-relaxed">
                      {item.antwoord}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="ker-card bg-primary-light border-primary/20">
              <p className="font-semibold text-foreground mb-2">Meer hulp nodig?</p>
              <p className="text-muted-foreground mb-3">
                Bel de gratis Mantelzorglijn voor persoonlijk advies.
              </p>
              <a
                href="tel:0302059059"
                className="ker-btn ker-btn-primary w-full"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                Bel 030 - 205 90 59
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
