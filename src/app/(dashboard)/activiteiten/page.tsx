"use client"

import { useState, useEffect } from "react"
import { GerPageIntro } from "@/components/ui"

const TYPE_INFO: Record<string, { label: string; emoji: string }> = {
  LOTGENOTEN: { label: "Lotgenoten", emoji: "🤝" },
  SPORT: { label: "Sport & beweging", emoji: "🏃" },
  SOCIAAL: { label: "Sociaal", emoji: "☕" },
  EDUCATIE: { label: "Educatie", emoji: "📚" },
  RESPIJTZORG: { label: "Respijtzorg", emoji: "🌿" },
  OVERIG: { label: "Overig", emoji: "📌" },
}

interface Activiteit {
  id: string
  naam: string
  beschrijving: string | null
  locatie: string | null
  woonplaats: string
  type: string
  frequentie: string | null
  dag: string | null
  tijd: string | null
  kosten: string | null
  contactTelefoon: string | null
  contactEmail: string | null
  website: string | null
}

export default function ActiviteitenPage() {
  const [activiteiten, setActiviteiten] = useState<Activiteit[]>([])
  const [loading, setLoading] = useState(true)
  const [woonplaats, setWoonplaats] = useState("")
  const [typeFilter, setTypeFilter] = useState("")

  useEffect(() => {
    fetch("/api/activiteiten")
      .then(r => r.ok ? r.json() : { activiteiten: [] })
      .then(data => {
        setActiviteiten(data.activiteiten || [])
        setWoonplaats(data.woonplaats || "")
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = typeFilter
    ? activiteiten.filter(a => a.type === typeFilter)
    : activiteiten

  // Groepeer per type
  const perType = Object.entries(TYPE_INFO).map(([type, info]) => ({
    type,
    ...info,
    items: filtered.filter(a => a.type === type),
  })).filter(g => g.items.length > 0 || !typeFilter)

  return (
    <div className="ker-page-content space-y-6">
      <GerPageIntro
        tekst={woonplaats
          ? `Hier vind je activiteiten bij jou in de buurt in ${woonplaats}. Lotgenoten, wandelgroepen, koffieochtenden — alles wat je helpt om even op te laden.`
          : "Vul je woonplaats in bij je profiel om activiteiten in de buurt te zien."
        }
      />

      {/* Type filter chips */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setTypeFilter("")}
          className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-colors ${
            !typeFilter ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground hover:bg-primary/10"
          }`}
        >
          Alles
        </button>
        {Object.entries(TYPE_INFO).map(([type, info]) => (
          <button
            key={type}
            onClick={() => setTypeFilter(typeFilter === type ? "" : type)}
            className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-colors ${
              typeFilter === type ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground hover:bg-primary/10"
            }`}
          >
            {info.emoji} {info.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : activiteiten.length === 0 ? (
        <div className="ker-card text-center py-8">
          <span className="text-4xl block mb-3">📍</span>
          <h3 className="font-bold text-foreground">Nog geen activiteiten</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Er zijn nog geen activiteiten gevonden voor {woonplaats || "jouw woonplaats"}.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {perType.map((groep) => (
            groep.items.length > 0 && (
              <div key={groep.type}>
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2 mb-3">
                  <span>{groep.emoji}</span> {groep.label}
                </h2>
                <div className="space-y-3">
                  {groep.items.map((a) => (
                    <div key={a.id} className="ker-card">
                      <h3 className="font-bold text-foreground">{a.naam}</h3>
                      {a.beschrijving && (
                        <p className="text-sm text-muted-foreground mt-1">{a.beschrijving}</p>
                      )}
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-sm text-muted-foreground">
                        {a.locatie && <span>📍 {a.locatie}</span>}
                        {a.dag && a.tijd && <span>📅 {a.dag} {a.tijd}</span>}
                        {a.frequentie && <span>🔄 {a.frequentie.toLowerCase()}</span>}
                        {a.kosten && <span>💰 {a.kosten}</span>}
                      </div>
                      {(a.contactTelefoon || a.website) && (
                        <div className="flex gap-3 mt-3">
                          {a.contactTelefoon && (
                            <a
                              href={`tel:${a.contactTelefoon}`}
                              className="ker-btn ker-btn-sm ker-btn-secondary"
                            >
                              📞 Bellen
                            </a>
                          )}
                          {a.website && (
                            <a
                              href={a.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ker-btn ker-btn-sm ker-btn-secondary"
                            >
                              🌐 Website
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          ))}
        </div>
      )}
    </div>
  )
}
