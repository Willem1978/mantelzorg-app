"use client"

import { useEffect, useState } from "react"

interface HulpvragenData {
  gemeenteNaam: string
  totaalHulpvragen: number
  perCategorie: Record<string, number>
  perStatus: Record<string, number>
  perUrgentie: Record<string, number>
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
  RESPITE_CARE: "Respijtzorg",
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
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
          <span className="text-gray-500 text-sm">Hulpvragen laden...</span>
        </div>
      </div>
    )
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

      {/* Totaal overzicht */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5">
        <p className="text-sm text-emerald-700">Totaal hulpvragen</p>
        <p className="text-3xl font-bold text-emerald-800 mt-1">{data.totaalHulpvragen}</p>
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
    </div>
  )
}
