"use client"

import { useEffect, useState } from "react"

interface DashboardData {
  gemeenteNaam: string
  totaalMantelzorgers: number
  totaalTests: number
  gemiddeldeScore: number
  niveauVerdeling: {
    LAAG: number
    GEMIDDELD: number
    HOOG: number
  }
  actieveAlarmen: number
  scoreTrend: "omhoog" | "omlaag" | "stabiel" | null
  hulpvragen: {
    totaal: number
    open: number
  }
  nieuweDezeMaand: number
  // K-anonimiteit response
  kAnonimiteit?: boolean
  minimumNietBereikt?: boolean
  bericht?: string
}

function TrendIcon({ trend }: { trend: "omhoog" | "omlaag" | "stabiel" | null }) {
  if (!trend) return null
  if (trend === "omhoog") {
    return (
      <span className="inline-flex items-center text-red-600 text-sm font-medium" title="Score stijgt (meer belasting)">
        <svg className="w-4 h-4 mr-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
        Stijgend
      </span>
    )
  }
  if (trend === "omlaag") {
    return (
      <span className="inline-flex items-center text-green-600 text-sm font-medium" title="Score daalt (minder belasting)">
        <svg className="w-4 h-4 mr-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
        Dalend
      </span>
    )
  }
  return (
    <span className="inline-flex items-center text-gray-500 text-sm font-medium" title="Score is stabiel">
      <svg className="w-4 h-4 mr-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
      </svg>
      Stabiel
    </span>
  )
}

export default function GemeenteDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/gemeente/dashboard")
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
          <span className="text-gray-500 text-sm">Dashboard laden...</span>
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
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Gemeente overzicht</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-8 text-center">
          <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v.01M12 9v3m0 0a9 9 0 110 18 9 9 0 010-18z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-amber-800">K-anonimiteit minimum niet bereikt</h2>
          <p className="text-amber-700 mt-2 max-w-md mx-auto">{data.bericht}</p>
          <p className="text-amber-600 text-sm mt-4">
            Huidig aantal mantelzorgers: <span className="font-semibold">{data.totaalMantelzorgers}</span>
          </p>
        </div>
      </div>
    )
  }

  const niveauTotaal = data.niveauVerdeling.LAAG + data.niveauVerdeling.GEMIDDELD + data.niveauVerdeling.HOOG
  const laagPct = niveauTotaal > 0 ? (data.niveauVerdeling.LAAG / niveauTotaal) * 100 : 0
  const gemiddeldPct = niveauTotaal > 0 ? (data.niveauVerdeling.GEMIDDELD / niveauTotaal) * 100 : 0
  const hoogPct = niveauTotaal > 0 ? (data.niveauVerdeling.HOOG / niveauTotaal) * 100 : 0

  const kpiTiles = [
    {
      label: "Mantelzorgers",
      value: data.totaalMantelzorgers,
      sub: `${data.nieuweDezeMaand} nieuwe deze maand`,
      color: "bg-emerald-50 border-emerald-200",
      iconColor: "text-emerald-600",
    },
    {
      label: "Gem. belastingscore",
      value: data.gemiddeldeScore,
      sub: <TrendIcon trend={data.scoreTrend} />,
      color: "bg-blue-50 border-blue-200",
      iconColor: "text-blue-600",
    },
    {
      label: "Actieve alarmen",
      value: data.actieveAlarmen,
      sub: "Niet afgehandeld",
      color: data.actieveAlarmen > 0 ? "bg-red-50 border-red-200" : "bg-gray-50 border-gray-200",
      iconColor: data.actieveAlarmen > 0 ? "text-red-600" : "text-gray-500",
    },
    {
      label: "Open hulpvragen",
      value: data.hulpvragen.open,
      sub: `${data.hulpvragen.totaal} totaal`,
      color: "bg-amber-50 border-amber-200",
      iconColor: "text-amber-600",
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">
          Overzicht voor <span className="font-medium text-gray-700">{data.gemeenteNaam}</span>
          {" "}&middot; {data.totaalTests} tests afgenomen
        </p>
      </div>

      {/* KPI Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiTiles.map((tile) => (
          <div key={tile.label} className={`p-5 rounded-xl border ${tile.color}`}>
            <p className="text-sm text-gray-600">{tile.label}</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{tile.value}</p>
            <div className="mt-2 text-xs text-gray-500">{tile.sub}</div>
          </div>
        ))}
      </div>

      {/* Niveau Verdeling */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Belastingsniveau verdeling</h2>

        {niveauTotaal === 0 ? (
          <p className="text-gray-500 text-sm">Nog geen testresultaten beschikbaar.</p>
        ) : (
          <>
            {/* Horizontal stacked bar */}
            <div className="w-full h-8 rounded-full overflow-hidden flex bg-gray-100">
              {laagPct > 0 && (
                <div
                  className="bg-green-500 h-full flex items-center justify-center text-white text-xs font-medium"
                  style={{ width: `${laagPct}%` }}
                >
                  {laagPct >= 10 && `${Math.round(laagPct)}%`}
                </div>
              )}
              {gemiddeldPct > 0 && (
                <div
                  className="bg-amber-500 h-full flex items-center justify-center text-white text-xs font-medium"
                  style={{ width: `${gemiddeldPct}%` }}
                >
                  {gemiddeldPct >= 10 && `${Math.round(gemiddeldPct)}%`}
                </div>
              )}
              {hoogPct > 0 && (
                <div
                  className="bg-red-500 h-full flex items-center justify-center text-white text-xs font-medium"
                  style={{ width: `${hoogPct}%` }}
                >
                  {hoogPct >= 10 && `${Math.round(hoogPct)}%`}
                </div>
              )}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-sm text-gray-600">Laag: {data.niveauVerdeling.LAAG} ({Math.round(laagPct)}%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="text-sm text-gray-600">Gemiddeld: {data.niveauVerdeling.GEMIDDELD} ({Math.round(gemiddeldPct)}%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-sm text-gray-600">Hoog: {data.niveauVerdeling.HOOG} ({Math.round(hoogPct)}%)</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
