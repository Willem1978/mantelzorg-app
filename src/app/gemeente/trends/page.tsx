"use client"

import { useEffect, useState } from "react"

interface TrendItem {
  maand: string
  gemiddeldeScore: number | null
  aantalTests: number
}

interface SeizoenItem {
  kwartaal: string
  gemiddeldeScore: number | null
  aantalTests: number
}

interface Effectiviteit {
  registratieNaarTest: {
    mantelzorgersMetTest: number
    totaalMantelzorgers: number
    percentage: number
  }
  testNaarHulpvraag: {
    mantelzorgersMetHulpvraag: number
    totaalMetTest: number
    percentage: number
  }
  scoreVerbetering: number
}

interface JaarVergelijking {
  huidigJaar: { jaar: number; gemiddeldeScore: number | null; aantalTests: number }
  vorigJaar: { jaar: number; gemiddeldeScore: number | null; aantalTests: number }
  verschil: number | null
}

interface TrendsData {
  gemeenteNaam: string
  periode: { van: string; tot: string }
  trends: TrendItem[]
  seizoensData?: SeizoenItem[]
  effectiviteit?: Effectiviteit
  jaarVergelijking?: JaarVergelijking | null
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

          {/* Seizoenspatronen */}
          {data.seizoensData && data.seizoensData.some(s => s.aantalTests > 0) && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Seizoenspatronen</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {data.seizoensData.map((s) => {
                  const kwartaalLabels: Record<string, string> = {
                    Q1: "Jan - Mrt",
                    Q2: "Apr - Jun",
                    Q3: "Jul - Sep",
                    Q4: "Okt - Dec",
                  }
                  const score = s.gemiddeldeScore ?? 0
                  const scoreColor = score <= 8 ? "text-green-600" : score <= 16 ? "text-amber-600" : "text-red-600"
                  return (
                    <div key={s.kwartaal} className="bg-gray-50 rounded-xl p-4 text-center">
                      <p className="text-sm font-medium text-gray-500">{s.kwartaal}</p>
                      <p className="text-xs text-gray-400">{kwartaalLabels[s.kwartaal] || s.kwartaal}</p>
                      <p className={`text-2xl font-bold mt-2 ${s.gemiddeldeScore !== null ? scoreColor : "text-gray-300"}`}>
                        {s.gemiddeldeScore !== null ? s.gemiddeldeScore : "-"}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">{s.aantalTests} tests</p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Effectiviteit */}
          {data.effectiviteit && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Effectiviteit</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
                  <p className="text-sm text-blue-700 font-medium">Registratie naar test</p>
                  <p className="text-3xl font-bold text-blue-800 mt-1">
                    {data.effectiviteit.registratieNaarTest.percentage}%
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    {data.effectiviteit.registratieNaarTest.mantelzorgersMetTest} van {data.effectiviteit.registratieNaarTest.totaalMantelzorgers}
                  </p>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-5">
                  <p className="text-sm text-purple-700 font-medium">Test naar hulpvraag</p>
                  <p className="text-3xl font-bold text-purple-800 mt-1">
                    {data.effectiviteit.testNaarHulpvraag.percentage}%
                  </p>
                  <p className="text-xs text-purple-600 mt-1">
                    {data.effectiviteit.testNaarHulpvraag.mantelzorgersMetHulpvraag} van {data.effectiviteit.testNaarHulpvraag.totaalMetTest}
                  </p>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5">
                  <p className="text-sm text-emerald-700 font-medium">Score verbetering</p>
                  <p className="text-3xl font-bold text-emerald-800 mt-1">
                    {data.effectiviteit.scoreVerbetering}
                  </p>
                  <p className="text-xs text-emerald-600 mt-1">
                    Mantelzorgers met lagere score bij hertest
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Jaarvergelijking */}
          {data.jaarVergelijking && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Jaarvergelijking</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-xl p-5 text-center">
                  <p className="text-sm text-gray-500">{data.jaarVergelijking.vorigJaar.jaar}</p>
                  <p className="text-2xl font-bold text-gray-800 mt-1">
                    {data.jaarVergelijking.vorigJaar.gemiddeldeScore ?? "-"}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{data.jaarVergelijking.vorigJaar.aantalTests} tests</p>
                </div>
                <div className="flex items-center justify-center">
                  {data.jaarVergelijking.verschil !== null ? (
                    <div className={`rounded-full px-4 py-2 ${
                      data.jaarVergelijking.verschil < 0
                        ? "bg-green-100 text-green-700"
                        : data.jaarVergelijking.verschil > 0
                        ? "bg-red-100 text-red-700"
                        : "bg-gray-100 text-gray-600"
                    }`}>
                      <span className="text-lg font-bold">
                        {data.jaarVergelijking.verschil > 0 ? "+" : ""}{data.jaarVergelijking.verschil}
                      </span>
                    </div>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </div>
                <div className="bg-gray-50 rounded-xl p-5 text-center">
                  <p className="text-sm text-gray-500">{data.jaarVergelijking.huidigJaar.jaar}</p>
                  <p className="text-2xl font-bold text-gray-800 mt-1">
                    {data.jaarVergelijking.huidigJaar.gemiddeldeScore ?? "-"}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{data.jaarVergelijking.huidigJaar.aantalTests} tests</p>
                </div>
              </div>
              {data.jaarVergelijking.verschil !== null && data.jaarVergelijking.verschil < 0 && (
                <p className="text-sm text-green-600 mt-3 text-center">
                  De gemiddelde belastingscore is gedaald ten opzichte van vorig jaar (positief)
                </p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
