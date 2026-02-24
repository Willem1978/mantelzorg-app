"use client"

import { useEffect, useState } from "react"
import { AdminSpinner } from "@/components/admin"

interface AlarmenData {
  gemeenteNaam: string
  totaalAlarmen: number
  perType: Record<string, number>
  perUrgentie: Record<string, number>
  afhandelStatus: {
    afgehandeld: number
    nietAfgehandeld: number
  }
  recenteAlarmen: number
  // K-anonimiteit response
  kAnonimiteit?: boolean
  minimumNietBereikt?: boolean
  bericht?: string
}

const urgentieLabels: Record<string, string> = {
  LOW: "Laag",
  MEDIUM: "Gemiddeld",
  HIGH: "Hoog",
  CRITICAL: "Kritiek",
}

const urgentieColors: Record<string, string> = {
  LOW: "bg-green-100 text-green-700 border-green-200",
  MEDIUM: "bg-blue-100 text-blue-700 border-blue-200",
  HIGH: "bg-amber-100 text-amber-700 border-amber-200",
  CRITICAL: "bg-red-100 text-red-700 border-red-200",
}

const typeLabels: Record<string, string> = {
  HOGE_BELASTING: "Hoge belasting",
  KRITIEKE_COMBINATIE: "Kritieke combinatie",
  VEEL_ZORGUREN: "Veel zorguren",
  EMOTIONELE_NOOD: "Emotionele nood",
  SOCIAAL_ISOLEMENT: "Sociaal isolement",
  FYSIEKE_KLACHTEN: "Fysieke klachten",
}

export default function GemeenteAlarmen() {
  const [data, setData] = useState<AlarmenData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/gemeente/alarmen")
      .then((res) => {
        if (!res.ok) throw new Error("Kon data niet ophalen")
        return res.json()
      })
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <AdminSpinner tekst="Alarmen laden..." />
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
          <h1 className="text-2xl font-bold text-gray-900">Signalering</h1>
          <p className="text-gray-500 mt-1">Alarm overzicht</p>
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

  const typeEntries = Object.entries(data.perType || {}).filter(([, v]) => v > 0)
  const urgentieEntries = Object.entries(data.perUrgentie || {}).filter(([, v]) => v > 0)
  const maxTypeCount = Math.max(...typeEntries.map(([, c]) => c), 1)
  const { afgehandeld, nietAfgehandeld } = data.afhandelStatus

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Signalering</h1>
        <p className="text-gray-500 mt-1">
          Alarm overzicht voor <span className="font-medium text-gray-700">{data.gemeenteNaam}</span>
        </p>
      </div>

      {/* Top KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Niet-afgehandeld - prominent */}
        <div className={`rounded-xl border p-5 ${nietAfgehandeld > 0 ? "bg-red-50 border-red-300 ring-2 ring-red-200" : "bg-green-50 border-green-200"}`}>
          <div className="flex items-center gap-2 mb-1">
            <svg className={`w-5 h-5 ${nietAfgehandeld > 0 ? "text-red-600" : "text-green-600"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className={`text-sm font-medium ${nietAfgehandeld > 0 ? "text-red-700" : "text-green-700"}`}>Niet afgehandeld</p>
          </div>
          <p className={`text-4xl font-bold ${nietAfgehandeld > 0 ? "text-red-800" : "text-green-800"}`}>
            {nietAfgehandeld}
          </p>
          <p className={`text-xs mt-1 ${nietAfgehandeld > 0 ? "text-red-600" : "text-green-600"}`}>
            {nietAfgehandeld > 0 ? "Vereist aandacht" : "Alles afgehandeld"}
          </p>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
          <p className="text-sm text-gray-600">Afgehandeld</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{afgehandeld}</p>
          <p className="text-xs text-gray-500 mt-1">Van {data.totaalAlarmen} totaal</p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
          <p className="text-sm text-blue-700">Totaal alarmen</p>
          <p className="text-3xl font-bold text-blue-800 mt-1">{data.totaalAlarmen}</p>
          <p className="text-xs text-blue-600 mt-1">Alle alarmen</p>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5">
          <p className="text-sm text-emerald-700">Laatste 30 dagen</p>
          <p className="text-3xl font-bold text-emerald-800 mt-1">{data.recenteAlarmen}</p>
          <p className="text-xs text-emerald-600 mt-1">Nieuwe alarmen</p>
        </div>
      </div>

      {/* Per type */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Per type</h2>
        {typeEntries.length > 0 ? (
          <div className="space-y-3">
            {typeEntries
              .sort(([, a], [, b]) => b - a)
              .map(([type, count]) => {
                const pct = maxTypeCount > 0 ? (count / maxTypeCount) * 100 : 0
                return (
                  <div key={type} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-700">{typeLabels[type] || type.replace(/_/g, " ")}</span>
                      <span className="text-gray-500 font-medium">{count}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2.5">
                      <div
                        className="h-2.5 rounded-full bg-emerald-500"
                        style={{ width: `${Math.max(pct, 2)}%` }}
                      />
                    </div>
                  </div>
                )
              })}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">Geen type data beschikbaar.</p>
        )}
      </div>

      {/* Per urgentie */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Per urgentie</h2>
        {urgentieEntries.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {urgentieEntries.map(([urgentie, count]) => (
              <div key={urgentie} className={`rounded-lg border p-4 text-center ${urgentieColors[urgentie] || "bg-gray-50 border-gray-200 text-gray-700"}`}>
                <p className="text-2xl font-bold">{count}</p>
                <p className="text-sm font-medium mt-1">{urgentieLabels[urgentie] || urgentie}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">Geen urgentie data beschikbaar.</p>
        )}
      </div>
    </div>
  )
}
