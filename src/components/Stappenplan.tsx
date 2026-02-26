"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"

interface Stap {
  nummer: number
  titel: string
  beschrijving: string
  emoji: string
  link?: string
  linkTekst?: string
  kleur: "red" | "amber" | "green" | "blue"
}

interface GemeenteAdvies {
  naam: string
  adviesLaag?: string | null
  adviesGemiddeld?: string | null
  adviesHoog?: string | null
  mantelzorgSteunpunt?: string | null
  mantelzorgSteunpuntNaam?: string | null
  contactTelefoon?: string | null
  websiteUrl?: string | null
  wmoLoketUrl?: string | null
  respijtzorgUrl?: string | null
  dagopvangUrl?: string | null
}

interface StappenplanProps {
  niveau: "LAAG" | "GEMIDDELD" | "HOOG"
  zwaarsteKTaak?: string | null
  zwaksteGebied?: { naam: string; emoji: string } | null
  gemeente?: string | null
  gemeenteAdvies?: GemeenteAdvies | null
}

function getStappen(props: StappenplanProps): Stap[] {
  const { niveau, zwaarsteKTaak, zwaksteGebied, gemeente, gemeenteAdvies } = props

  if (niveau === "HOOG") {
    const stappen: Stap[] = [
      {
        nummer: 1,
        titel: "Bel de Mantelzorglijn",
        beschrijving: "Praat met iemand die luistert en advies geeft. Gratis en anoniem.",
        emoji: "📞",
        link: "tel:0302059059",
        linkTekst: "Bel nu: 030 - 205 90 59",
        kleur: "red",
      },
      {
        nummer: 2,
        titel: gemeente
          ? `Neem contact op met gemeente ${gemeente}`
          : "Neem contact op met je gemeente",
        beschrijving: gemeenteAdvies?.adviesHoog
          || "Vraag naar mantelzorgondersteuning. Je hebt recht op hulp.",
        emoji: "🏛️",
        link: gemeenteAdvies?.wmoLoketUrl
          || (gemeente
            ? `https://www.google.com/search?q=mantelzorgondersteuning+${encodeURIComponent(gemeente)}`
            : "/hulpvragen?tab=voor-jou"),
        linkTekst: gemeenteAdvies?.wmoLoketUrl ? "Naar WMO-loket" : "Zoek contactgegevens",
        kleur: "red",
      },
      {
        nummer: 3,
        titel: zwaarsteKTaak
          ? `Zoek hulp voor: ${zwaarsteKTaak}`
          : "Zoek vervangende zorg",
        beschrijving: "Je hoeft niet alles alleen te doen. Kijk welke hulp er is.",
        emoji: "🤝",
        link: "/hulpvragen?tab=voor-naaste",
        linkTekst: "Bekijk hulpmogelijkheden",
        kleur: "amber",
      },
    ]

    // Voeg mantelzorgsteunpunt toe als beschikbaar via gemeente
    if (gemeenteAdvies?.mantelzorgSteunpunt) {
      stappen.push({
        nummer: 4,
        titel: gemeenteAdvies.mantelzorgSteunpuntNaam || "Mantelzorgsteunpunt",
        beschrijving: "Zij kennen de hulp in jouw gemeente en helpen je op weg.",
        emoji: "🏠",
        link: gemeenteAdvies.mantelzorgSteunpunt,
        linkTekst: "Bezoek steunpunt",
        kleur: "blue",
      })
    }

    return stappen
  }

  if (niveau === "GEMIDDELD") {
    const stappen: Stap[] = []

    if (zwaarsteKTaak) {
      stappen.push({
        nummer: 1,
        titel: `Zoek hulp voor: ${zwaarsteKTaak}`,
        beschrijving: "Deze taak kost je veel. Kijk of iemand kan bijspringen.",
        emoji: "🤝",
        link: "/hulpvragen?tab=voor-naaste",
        linkTekst: "Bekijk hulpmogelijkheden",
        kleur: "amber",
      })
    }

    if (zwaksteGebied) {
      stappen.push({
        nummer: stappen.length + 1,
        titel: `Werk aan: ${zwaksteGebied.naam}`,
        beschrijving: zwaksteGebied.naam === "Jouw energie"
          ? "Probeer vaste rusttijden in te bouwen en slaap te verbeteren."
          : zwaksteGebied.naam === "Jouw gevoel"
          ? "Praat met iemand die je vertrouwt over hoe je je voelt."
          : "Kijk of je taken kunt delen of plannen kunt aanpassen.",
        emoji: zwaksteGebied.emoji,
        link: "/leren/zelfzorg",
        linkTekst: "Lees tips",
        kleur: "amber",
      })
    }

    // Gemeente-specifiek advies voor GEMIDDELD
    if (gemeenteAdvies?.adviesGemiddeld) {
      stappen.push({
        nummer: stappen.length + 1,
        titel: `Tip van gemeente ${gemeenteAdvies.naam}`,
        beschrijving: gemeenteAdvies.adviesGemiddeld,
        emoji: "🏛️",
        link: gemeenteAdvies.websiteUrl || undefined,
        linkTekst: gemeenteAdvies.websiteUrl ? "Meer informatie" : undefined,
        kleur: "blue",
      })
    }

    stappen.push({
      nummer: stappen.length + 1,
      titel: "Doe over een maand een check-in",
      beschrijving: "Houd bij hoe het gaat. Zo merk je op tijd als het te veel wordt.",
      emoji: "✅",
      link: "/check-in",
      linkTekst: "Plan een check-in",
      kleur: "blue",
    })

    return stappen
  }

  // LAAG
  const stappen: Stap[] = [
    {
      nummer: 1,
      titel: "Goed bezig! Blijf dit doen",
      beschrijving: gemeenteAdvies?.adviesLaag
        || "Je balans is goed. Blijf goed voor jezelf zorgen.",
      emoji: "💚",
      kleur: "green",
    },
    {
      nummer: 2,
      titel: "Doe maandelijks een check-in",
      beschrijving: "Zo houd je in de gaten hoe het gaat.",
      emoji: "✅",
      link: "/check-in",
      linkTekst: "Naar check-in",
      kleur: "blue",
    },
  ]

  return stappen
}

export function Stappenplan(props: StappenplanProps) {
  const stappen = getStappen(props)

  return (
    <div className="ker-card mb-4">
      <h3 className="font-bold text-foreground mb-1 flex items-center gap-2">
        <span className="text-xl">🎯</span>
        Jouw stappenplan
      </h3>
      <p className="text-sm text-muted-foreground mb-4">
        Concrete stappen om je situatie te verbeteren
      </p>

      <div className="relative">
        {/* Verticale lijn */}
        <div className="absolute left-5 top-3 bottom-3 w-0.5 bg-border" />

        <div className="space-y-4">
          {stappen.map((stap) => (
            <div key={stap.nummer} className="relative flex gap-4">
              {/* Stap nummer */}
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-sm z-10",
                  stap.kleur === "red" && "bg-[var(--accent-red)]",
                  stap.kleur === "amber" && "bg-[var(--accent-amber)]",
                  stap.kleur === "green" && "bg-[var(--accent-green)]",
                  stap.kleur === "blue" && "bg-primary"
                )}
              >
                {stap.nummer}
              </div>

              {/* Inhoud */}
              <div className="flex-1 pb-1">
                <div className="flex items-center gap-2 mb-1">
                  <span>{stap.emoji}</span>
                  <h4 className="font-semibold text-sm text-foreground">{stap.titel}</h4>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{stap.beschrijving}</p>
                {stap.link && stap.linkTekst && (
                  stap.link.startsWith("tel:") || stap.link.startsWith("http") ? (
                    <a
                      href={stap.link}
                      target={stap.link.startsWith("http") ? "_blank" : undefined}
                      rel={stap.link.startsWith("http") ? "noopener noreferrer" : undefined}
                      className={cn(
                        "inline-flex items-center gap-1.5 text-sm font-medium rounded-lg px-3 py-1.5 transition-colors",
                        stap.kleur === "red" && "bg-[var(--accent-red-bg)] text-[var(--accent-red)] hover:bg-red-100",
                        stap.kleur === "amber" && "bg-[var(--accent-amber-bg)] text-[var(--accent-amber)] hover:bg-amber-100",
                        stap.kleur === "green" && "bg-[var(--accent-green-bg)] text-[var(--accent-green)] hover:bg-green-100",
                        stap.kleur === "blue" && "bg-primary/10 text-primary hover:bg-primary/20"
                      )}
                    >
                      {stap.linkTekst}
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </a>
                  ) : (
                    <Link
                      href={stap.link}
                      className={cn(
                        "inline-flex items-center gap-1.5 text-sm font-medium rounded-lg px-3 py-1.5 transition-colors",
                        stap.kleur === "red" && "bg-[var(--accent-red-bg)] text-[var(--accent-red)] hover:bg-red-100",
                        stap.kleur === "amber" && "bg-[var(--accent-amber-bg)] text-[var(--accent-amber)] hover:bg-amber-100",
                        stap.kleur === "green" && "bg-[var(--accent-green-bg)] text-[var(--accent-green)] hover:bg-green-100",
                        stap.kleur === "blue" && "bg-primary/10 text-primary hover:bg-primary/20"
                      )}
                    >
                      {stap.linkTekst}
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
