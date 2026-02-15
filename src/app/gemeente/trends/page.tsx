"use client"

import { useEffect, useState } from "react"

interface TrendItem {
  maand: string
  gemiddeldeScore: number | null
  aantalTests: number
}

interface TrendsData {
  gemeenteNaam: string
  periode: { van: string; tot: string }
  trends: TrendItem[]
  // K-anonimiteit response
  kAnonimiteit?: boolean
  minimumNietBereikt?: boolean
  bericht?: string
}

export default function GemeenteTrends() {
  const [data, setData] = useState<TrendsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/gemeente/trends")
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
          <span className="text-gray-500 text-sm">Trends laden...</span>
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
          <h1 className="text-2xl font-bold text-gray-900">Trends</h1>
          <p className="text-gray-500 mt-1">Maandelijkse trends</p>
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

  const trendData = data.trends || []
  const maxTests = Math.max(...trendData.map((m) => m.aantalTests), 1)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Trends</h1>
        <p className="text-gray-500 mt-1">
          Maandelijkse trends voor <span className="font-medium text-gray-700">{data.gemeenteNaam}</span>
        </p>
      </div>

      {trendData.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <p className="text-gray-500">Nog geen trenddata beschikbaar.</p>
        </div>
      ) : (
        <>
          {/* CSS Bar Chart - Gemiddelde Score */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Gemiddelde belastingscore per maand</h2>
            <div className="flex items-end gap-2 h-48">
              {trendData.map((m) => {
                const score = m.gemiddeldeScore ?? 0
                const heightPct = (score / 24) * 100
                const barColor =
                  score <= 8
                    ? "bg-green-500"
                    : score <= 16
                    ? "bg-amber-500"
                    : "bg-red-500"

                return (
                  <div key={m.maand} className="flex-1 flex flex-col items-center justify-end h-full">
                    {m.gemiddeldeScore !== null && (
                      <span className="text-xs text-gray-600 font-medium mb-1">{m.gemiddeldeScore}</span>
                    )}
                    <div
                      className={`w-full max-w-[40px] rounded-t ${m.gemiddeldeScore !== null ? barColor : "bg-gray-200"} transition-all`}
                      style={{ height: `${m.gemiddeldeScore !== null ? Math.max(heightPct, 2) : 2}%` }}
                    />
                    <span className="text-xs text-gray-500 mt-2 truncate w-full text-center">
                      {m.maand.substring(5)}
                    </span>
                  </div>
                )
              })}
            </div>
            <div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded bg-green-500" /> Laag (0-8)
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded bg-amber-500" /> Gemiddeld (9-16)
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded bg-red-500" /> Hoog (17-24)
              </div>
            </div>
          </div>

          {/* CSS Bar Chart - Aantal Tests */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Aantal tests per maand</h2>
            <div className="flex items-end gap-2 h-40">
              {trendData.map((m) => {
                const heightPct = maxTests > 0 ? (m.aantalTests / maxTests) * 100 : 0

                return (
                  <div key={m.maand} className="flex-1 flex flex-col items-center justify-end h-full">
                    {m.aantalTests > 0 && (
                      <span className="text-xs text-gray-600 font-medium mb-1">{m.aantalTests}</span>
                    )}
                    <div
                      className="w-full max-w-[40px] rounded-t bg-emerald-500 transition-all"
                      style={{ height: `${Math.max(heightPct, 2)}%` }}
                    />
                    <span className="text-xs text-gray-500 mt-2 truncate w-full text-center">
                      {m.maand.substring(5)}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Data Table */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Maandelijks overzicht</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Maand</th>
                    <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Gem. score</th>
                    <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Aantal tests</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {trendData.map((m) => (
                    <tr key={m.maand} className="hover:bg-gray-50">
                      <td className="px-6 py-3 text-sm text-gray-900">{m.maand}</td>
                      <td className="px-6 py-3 text-sm text-right">
                        {m.gemiddeldeScore !== null ? (
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                              m.gemiddeldeScore <= 8
                                ? "bg-green-100 text-green-700"
                                : m.gemiddeldeScore <= 16
                                ? "bg-amber-100 text-amber-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {m.gemiddeldeScore}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-600 text-right">{m.aantalTests}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
