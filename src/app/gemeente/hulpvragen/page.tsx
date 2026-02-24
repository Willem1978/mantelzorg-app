"use client"

import { useEffect, useState } from "react"
import { AdminSpinner } from "@/components/admin"

interface HulpvragenData {
  gemeenteNaam: string
  totaalHulpvragen: number
  perCategorie: Record<string, number>
  perStatus: Record<string, number>
  perUrgentie: Record<string, number>
  onbeantwoord?: number
  gemiddeldeReactietijd?: number | null
  topOrganisaties?: { naam: string; aantal: number }[]
  recenteTrend?: {
    huidige30Dagen: number
    vorige30Dagen: number
    trend: "stijgend" | "dalend" | "stabiel"
  }
  // K-anonimiteit response
  kAnonimiteit?: boolean
  minimumNietBereikt?: boolean
  bericht?: string
}

const statusLabels: Record<string, string> = {
  OPEN: "Open",
  IN_PROGRESS: "In behandeling",
  RESPONDED: "Beantwoord",
  RESOLVED: "Opgelost",
  CLOSED: "Gesloten",
}

const statusColors: Record<string, string> = {
  OPEN: "bg-blue-100 text-blue-700 border-blue-200",
  IN_PROGRESS: "bg-amber-100 text-amber-700 border-amber-200",
  RESPONDED: "bg-purple-100 text-purple-700 border-purple-200",
  RESOLVED: "bg-green-100 text-green-700 border-green-200",
  CLOSED: "bg-gray-100 text-gray-700 border-gray-200",
}

const urgentieLabels: Record<string, string> = {
  LOW: "Laag",
  NORMAL: "Normaal",
  HIGH: "Hoog",
  URGENT: "Urgent",
}

const urgentieColors: Record<string, string> = {
  LOW: "bg-green-100 text-green-700 border-green-200",
  NORMAL: "bg-blue-100 text-blue-700 border-blue-200",
  HIGH: "bg-amber-100 text-amber-700 border-amber-200",
  URGENT: "bg-red-100 text-red-700 border-red-200",
}

const categorieLabels: Record<string, string> = {
  RESPITE_CARE: "Vervangende mantelzorg",
  EMOTIONAL_SUPPORT: "Emotionele steun",
  PRACTICAL_HELP: "Praktische hulp",
  FINANCIAL_ADVICE: "Financieel advies",
  INFORMATION: "Informatie",
  OTHER: "Overig",
}

export default function GemeenteHulpvragen() {
  const [data, setData] = useState<HulpvragenData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/gemeente/hulpvragen")
      .then((res) => {
        if (!res.ok) throw new Error("Kon data niet ophalen")
        return res.json()
      })
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <AdminSpinner tekst="Hulpvragen laden..." />
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
          <h1 className="text-2xl font-bold text-gray-900">Hulpvragen</h1>
          <p className="text-gray-500 mt-1">Inzichten in hulpvragen</p>
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

  const categorieEntries = Object.entries(data.perCategorie || {}).filter(([, v]) => v > 0)
  const statusEntries = Object.entries(data.perStatus || {}).filter(([, v]) => v > 0)
  const urgentieEntries = Object.entries(data.perUrgentie || {}).filter(([, v]) => v > 0)

  const categorieCardColors = [
    "bg-emerald-50 border-emerald-200 text-emerald-700",
    "bg-blue-50 border-blue-200 text-blue-700",
    "bg-purple-50 border-purple-200 text-purple-700",
    "bg-rose-50 border-rose-200 text-rose-700",
    "bg-amber-50 border-amber-200 text-amber-700",
    "bg-teal-50 border-teal-200 text-teal-700",
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Hulpvragen</h1>
        <p className="text-gray-500 mt-1">
          Inzichten voor <span className="font-medium text-gray-700">{data.gemeenteNaam}</span>
          {" "}&middot; {data.totaalHulpvragen} hulpvragen totaal
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5">
          <p className="text-sm text-emerald-700">Totaal hulpvragen</p>
          <p className="text-3xl font-bold text-emerald-800 mt-1">{data.totaalHulpvragen}</p>
        </div>

        {data.onbeantwoord !== undefined && (
          <div className={`rounded-xl border p-5 ${
            data.onbeantwoord > 0
              ? "bg-red-50 border-red-300 ring-2 ring-red-200"
              : "bg-green-50 border-green-200"
          }`}>
            <p className={`text-sm font-medium ${data.onbeantwoord > 0 ? "text-red-700" : "text-green-700"}`}>
              Onbeantwoord (&gt;7 dagen)
            </p>
            <p className={`text-3xl font-bold mt-1 ${data.onbeantwoord > 0 ? "text-red-800" : "text-green-800"}`}>
              {data.onbeantwoord}
            </p>
            <p className={`text-xs mt-1 ${data.onbeantwoord > 0 ? "text-red-600" : "text-green-600"}`}>
              {data.onbeantwoord > 0 ? "Vereist aandacht" : "Alles beantwoord"}
            </p>
          </div>
        )}

        {data.gemiddeldeReactietijd !== undefined && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
            <p className="text-sm text-blue-700">Gem. reactietijd</p>
            <p className="text-3xl font-bold text-blue-800 mt-1">
              {data.gemiddeldeReactietijd !== null ? `${data.gemiddeldeReactietijd}d` : "-"}
            </p>
            <p className="text-xs text-blue-600 mt-1">In dagen</p>
          </div>
        )}

        {data.recenteTrend && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
            <p className="text-sm text-gray-600">Trend (30 dagen)</p>
            <p className="text-3xl font-bold text-gray-800 mt-1">{data.recenteTrend.huidige30Dagen}</p>
            <p className="text-xs mt-1">
              {data.recenteTrend.trend === "stijgend" && (
                <span className="text-amber-600">Stijgend (was {data.recenteTrend.vorige30Dagen})</span>
              )}
              {data.recenteTrend.trend === "dalend" && (
                <span className="text-green-600">Dalend (was {data.recenteTrend.vorige30Dagen})</span>
              )}
              {data.recenteTrend.trend === "stabiel" && (
                <span className="text-gray-500">Stabiel</span>
              )}
            </p>
          </div>
        )}
      </div>

      {/* Per Status */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Per status</h2>
        {statusEntries.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {statusEntries.map(([status, count]) => (
              <div key={status} className={`rounded-lg border p-4 text-center ${statusColors[status] || "bg-gray-50 border-gray-200 text-gray-700"}`}>
                <p className="text-2xl font-bold">{count}</p>
                <p className="text-sm font-medium mt-1">{statusLabels[status] || status}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">Geen status data beschikbaar.</p>
        )}
      </div>

      {/* Per Urgentie */}
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

      {/* Per Categorie */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Per categorie</h2>
        {categorieEntries.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {categorieEntries.map(([categorie, count], i) => (
              <div key={categorie} className={`rounded-lg border p-4 ${categorieCardColors[i % categorieCardColors.length]}`}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{categorieLabels[categorie] || categorie}</span>
                  <span className="text-lg font-bold">{count}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">Geen categorie data beschikbaar.</p>
        )}
      </div>

      {/* Top organisaties */}
      {data.topOrganisaties && data.topOrganisaties.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Top organisaties</h2>
          <div className="space-y-3">
            {data.topOrganisaties.map((org, i) => {
              const maxAantal = data.topOrganisaties![0].aantal
              const pct = maxAantal > 0 ? (org.aantal / maxAantal) * 100 : 0
              return (
                <div key={i} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">{org.naam}</span>
                    <span className="text-gray-500 font-medium">{org.aantal} hulpvragen</span>
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
        </div>
      )}
    </div>
  )
}
