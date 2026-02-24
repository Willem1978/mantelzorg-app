"use client"

import { useEffect, useState } from "react"
import { AdminSpinner } from "@/components/admin"

interface DemografieData {
  gemeenteNaam: string
  aantalTests: number
  aantalMantelzorgers?: number
  belastingNiveauVerdeling: {
    LAAG: number
    GEMIDDELD: number
    HOOG: number
  }
  gemiddeldZorguren: number
  zorgurenVerdeling: Record<string, number>
  scoreVerdeling: Record<string, number>
  leeftijdVerdeling?: Record<string, number> | null
  zorgrelatie?: Record<string, number> | null
  wijkVerdeling?: Record<string, number> | null
  zorgsince?: Record<string, number> | null
  // K-anonimiteit response
  kAnonimiteit?: boolean
  minimumNietBereikt?: boolean
  bericht?: string
  berichtMantelzorgers?: string
}

function BarSegment({ label, value, percentage, color }: { label: string; value: number; percentage: number; color: string }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-700">{label}</span>
        <span className="text-gray-500 font-medium">{value} ({percentage}%)</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-3">
        <div
          className={`h-3 rounded-full ${color}`}
          style={{ width: `${Math.max(percentage, 1)}%` }}
        />
      </div>
    </div>
  )
}

export default function GemeenteDemografie() {
  const [data, setData] = useState<DemografieData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/gemeente/demografie")
      .then((res) => {
        if (!res.ok) throw new Error("Kon data niet ophalen")
        return res.json()
      })
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <AdminSpinner tekst="Demografie laden..." />
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p className="text-red-700 font-medium">Er ging iets mis</p>
        <p className="text-red-600 text-sm mt-1">{error}</p>
      </div>
    )
  }

  if (!data) return null

  // K-anonimiteit check
  if (data.minimumNietBereikt) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Demografie</h1>
          <p className="text-gray-500 mt-1">Demografische inzichten</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-8 text-center">
          <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-amber-800">K-anonimiteit minimum niet bereikt</h2>
          <p className="text-amber-700 mt-2 max-w-md mx-auto">{data.bericht}</p>
        </div>
      </div>
    )
  }

  const niveauColors: Record<string, string> = {
    LAAG: "bg-green-50 border-green-200 text-green-700",
    GEMIDDELD: "bg-amber-50 border-amber-200 text-amber-700",
    HOOG: "bg-red-50 border-red-200 text-red-700",
  }

  const niveauLabels: Record<string, string> = {
    LAAG: "Laag",
    GEMIDDELD: "Gemiddeld",
    HOOG: "Hoog",
  }

  const niveauDotColors: Record<string, string> = {
    LAAG: "bg-green-500",
    GEMIDDELD: "bg-amber-500",
    HOOG: "bg-red-500",
  }

  const niveauTotaal =
    data.belastingNiveauVerdeling.LAAG +
    data.belastingNiveauVerdeling.GEMIDDELD +
    data.belastingNiveauVerdeling.HOOG

  // Transform object verdelingen naar arrays met percentages
  const zorgurenEntries = Object.entries(data.zorgurenVerdeling || {})
  const zorgurenTotaal = zorgurenEntries.reduce((sum, [, v]) => sum + v, 0)

  const scoreEntries = Object.entries(data.scoreVerdeling || {})
  const scoreTotaal = scoreEntries.reduce((sum, [, v]) => sum + v, 0)

  const zorgurenBarColors = ["bg-primary/70", "bg-primary", "bg-amber-500", "bg-red-500"]
  const scoreBarColors = ["bg-green-500", "bg-amber-500", "bg-red-500"]
  const leeftijdBarColors = ["bg-sky-400", "bg-sky-500", "bg-blue-500", "bg-indigo-500", "bg-purple-500", "bg-gray-400"]
  const relatieBarColors = ["bg-rose-400", "bg-pink-500", "bg-fuchsia-500", "bg-violet-500", "bg-purple-400", "bg-gray-400"]
  const zorgduurBarColors = ["bg-primary/70", "bg-primary", "bg-cyan-500", "bg-blue-500", "bg-gray-400"]

  const leeftijdEntries = Object.entries(data.leeftijdVerdeling || {}).filter(([, v]) => v > 0)
  const leeftijdTotaal = leeftijdEntries.reduce((sum, [, v]) => sum + v, 0)

  const relatieEntries = Object.entries(data.zorgrelatie || {}).filter(([, v]) => v > 0)
  const relatieTotaal = relatieEntries.reduce((sum, [, v]) => sum + v, 0)

  const wijkEntries = Object.entries(data.wijkVerdeling || {}).sort(([, a], [, b]) => b - a)
  const wijkTotaal = wijkEntries.reduce((sum, [, v]) => sum + v, 0)

  const zorgduurEntries = Object.entries(data.zorgsince || {}).filter(([, v]) => v > 0)
  const zorgduurTotaal = zorgduurEntries.reduce((sum, [, v]) => sum + v, 0)

  const relatieLabels: Record<string, string> = {
    partner: "Partner",
    ouder: "Ouder",
    kind: "Kind",
    familielid: "Familielid",
    kennis: "Kennis/vriend",
    "Overig/Onbekend": "Overig/Onbekend",
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Demografie</h1>
        <p className="text-gray-500 mt-1">
          Demografische inzichten voor <span className="font-medium text-gray-700">{data.gemeenteNaam}</span>
          {" "}&middot; {data.aantalTests} tests afgenomen
        </p>
      </div>

      {/* Belastingniveau verdeling - Colored cards */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Belastingniveau verdeling</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {(["LAAG", "GEMIDDELD", "HOOG"] as const).map((niveau) => {
            const count = data.belastingNiveauVerdeling[niveau]
            const pct = niveauTotaal > 0 ? Math.round((count / niveauTotaal) * 100) : 0

            return (
              <div key={niveau} className={`rounded-xl border p-5 ${niveauColors[niveau]}`}>
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-3 h-3 rounded-full ${niveauDotColors[niveau]}`} />
                  <span className="text-sm font-medium">{niveauLabels[niveau]}</span>
                </div>
                <p className="text-3xl font-bold">{count}</p>
                <p className="text-sm opacity-75 mt-1">{pct}% van totaal</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Zorguren verdeling */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Zorguren verdeling</h2>
        <p className="text-sm text-gray-500 mb-4">Gemiddeld {data.gemiddeldZorguren} uur per week</p>
        {zorgurenEntries.length > 0 ? (
          <div className="space-y-3">
            {zorgurenEntries.map(([label, aantal], i) => (
              <BarSegment
                key={label}
                label={`${label} uur/week`}
                value={aantal}
                percentage={zorgurenTotaal > 0 ? Math.round((aantal / zorgurenTotaal) * 100) : 0}
                color={zorgurenBarColors[i % zorgurenBarColors.length]}
              />
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">Geen zorguren data beschikbaar.</p>
        )}
      </div>

      {/* Score verdeling */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Score verdeling</h2>
        {scoreEntries.length > 0 ? (
          <div className="space-y-3">
            {scoreEntries.map(([label, aantal], i) => (
              <BarSegment
                key={label}
                label={`Score ${label}`}
                value={aantal}
                percentage={scoreTotaal > 0 ? Math.round((aantal / scoreTotaal) * 100) : 0}
                color={scoreBarColors[i % scoreBarColors.length]}
              />
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">Geen score data beschikbaar.</p>
        )}
      </div>

      {/* Leeftijdverdeling */}
      {data.leeftijdVerdeling && leeftijdEntries.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Leeftijdverdeling</h2>
          <p className="text-sm text-gray-500 mb-4">{data.aantalMantelzorgers || leeftijdTotaal} mantelzorgers</p>
          <div className="space-y-3">
            {leeftijdEntries.map(([label, aantal], i) => (
              <BarSegment
                key={label}
                label={`${label} jaar`}
                value={aantal}
                percentage={leeftijdTotaal > 0 ? Math.round((aantal / leeftijdTotaal) * 100) : 0}
                color={leeftijdBarColors[i % leeftijdBarColors.length]}
              />
            ))}
          </div>
        </div>
      )}

      {/* Zorgrelatie */}
      {data.zorgrelatie && relatieEntries.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Zorgrelatie</h2>
          <div className="space-y-3">
            {relatieEntries.map(([label, aantal], i) => (
              <BarSegment
                key={label}
                label={relatieLabels[label] || label}
                value={aantal}
                percentage={relatieTotaal > 0 ? Math.round((aantal / relatieTotaal) * 100) : 0}
                color={relatieBarColors[i % relatieBarColors.length]}
              />
            ))}
          </div>
        </div>
      )}

      {/* Wijkverdeling */}
      {data.wijkVerdeling && wijkEntries.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Per wijk</h2>
          <div className="space-y-3">
            {wijkEntries.slice(0, 15).map(([label, aantal], i) => (
              <BarSegment
                key={label}
                label={label}
                value={aantal}
                percentage={wijkTotaal > 0 ? Math.round((aantal / wijkTotaal) * 100) : 0}
                color={i < 5 ? "bg-primary" : i < 10 ? "bg-primary/70" : "bg-primary/50"}
              />
            ))}
          </div>
          {wijkEntries.length > 15 && (
            <p className="text-sm text-gray-400 mt-3">En {wijkEntries.length - 15} andere wijken...</p>
          )}
        </div>
      )}

      {/* Zorgduur */}
      {data.zorgsince && zorgduurEntries.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Zorgduur</h2>
          <div className="space-y-3">
            {zorgduurEntries.map(([label, aantal], i) => (
              <BarSegment
                key={label}
                label={label}
                value={aantal}
                percentage={zorgduurTotaal > 0 ? Math.round((aantal / zorgduurTotaal) * 100) : 0}
                color={zorgduurBarColors[i % zorgduurBarColors.length]}
              />
            ))}
          </div>
        </div>
      )}

      {/* K-anonimiteit waarschuwing voor mantelzorgerdata */}
      {data.berichtMantelzorgers && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-amber-700 text-sm">{data.berichtMantelzorgers}</p>
        </div>
      )}
    </div>
  )
}
