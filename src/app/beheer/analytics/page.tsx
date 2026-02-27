"use client"

import { useState } from "react"
import { AdminSpinner } from "@/components/admin"
import { useToast } from "@/components/ui/Toast"

type AnalyseType = "gemeente" | "trends" | "rapport"

interface GemeenteData {
  gemeente: string
  mantelzorgers: number
  tests: {
    totaal: number
    recentZestigDagen: number
    gemiddeldeScore: number
    perNiveau: Record<string, number>
  }
  alarmen: { openstaand: number; perType: Record<string, number> }
  checkIns: { afgelopenDertigDagen: number }
  hulpvragen: {
    perCategorie: Record<string, number>
    perStatus: Record<string, number>
  }
}

interface TrendData {
  gemeente: string
  periode: string
  totaalCheckIns: number
  kritiekSignalen: number
  perMaand: {
    maand: string
    aantalCheckIns: number
    gemWelzijn: number | null
    gemFysiek: number | null
    gemEmotioneel: number | null
    gemWerkBalans: number | null
    gemSteun: number | null
    percentHulpNodig: number
  }[]
}

interface RapportData {
  data: { gemeente: GemeenteData; trends: TrendData }
  analyse: string
}

export default function AnalyticsPage() {
  const [type, setType] = useState<AnalyseType>("rapport")
  const [gemeente, setGemeente] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<GemeenteData | TrendData | RapportData | null>(null)
  const { showError } = useToast()

  async function runAnalyse() {
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch("/api/ai/admin/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          gemeente: gemeente.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Analyse mislukt")
      setResult(data)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Er ging iets mis"
      showError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics & Signalering</h1>
        <p className="text-gray-500 mt-1">
          AI-gestuurde analyse van patronen, trends en signalen in je gemeente of platform-breed.
        </p>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type analyse</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as AnalyseType)}
              className="rounded-lg border-gray-300 text-sm py-2 px-3 border focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="rapport">Volledig AI-rapport</option>
              <option value="gemeente">Gemeente-patronen</option>
              <option value="trends">Check-in trends</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Gemeente (optioneel)</label>
            <input
              type="text"
              value={gemeente}
              onChange={(e) => setGemeente(e.target.value)}
              placeholder="Bijv. Amsterdam"
              className="rounded-lg border-gray-300 text-sm py-2 px-3 border focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button
            onClick={runAnalyse}
            disabled={loading}
            className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
          >
            {loading ? "Analyseren..." : "Analyseer"}
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <AdminSpinner />
          <span className="ml-3 text-gray-500">
            {type === "rapport" ? "AI-rapport genereren... dit kan even duren" : "Data analyseren..."}
          </span>
        </div>
      )}

      {/* Resultaten */}
      {result && !loading && (
        <div className="space-y-6">
          {/* Rapport view */}
          {type === "rapport" && "analyse" in result && (
            <>
              <DataCards data={(result as RapportData).data.gemeente} />
              <TrendTable data={(result as RapportData).data.trends} />
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">AI Analyse</h2>
                <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
                  {formatMarkdown((result as RapportData).analyse)}
                </div>
              </div>
            </>
          )}

          {/* Gemeente data view */}
          {type === "gemeente" && "tests" in result && (
            <DataCards data={result as GemeenteData} />
          )}

          {/* Trends view */}
          {type === "trends" && "perMaand" in result && (
            <TrendTable data={result as TrendData} />
          )}
        </div>
      )}
    </div>
  )
}

function formatMarkdown(text: string) {
  // Split by markdown headers and render with styling
  const parts = text.split(/(##\s+.+)/g)
  return parts.map((part, i) => {
    if (part.startsWith("## ")) {
      return (
        <h3 key={i} className="text-base font-semibold text-gray-900 mt-4 mb-2">
          {part.replace("## ", "")}
        </h3>
      )
    }
    return <span key={i}>{part}</span>
  })
}

function DataCards({ data }: { data: GemeenteData }) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">{data.gemeente}</h2>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Mantelzorgers" value={data.mantelzorgers} />
        <KpiCard label="Tests totaal" value={data.tests.totaal} />
        <KpiCard label="Gem. score" value={data.tests.gemiddeldeScore} />
        <KpiCard label="Open alarmen" value={data.alarmen.openstaand} color={data.alarmen.openstaand > 0 ? "red" : "green"} />
      </div>

      {/* Verdeling */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-medium text-gray-500 mb-3">Belastingniveau</h3>
          {Object.entries(data.tests.perNiveau).map(([niveau, aantal]) => (
            <div key={niveau} className="flex justify-between py-1 text-sm">
              <span className={`font-medium ${niveau === "HOOG" ? "text-red-600" : niveau === "GEMIDDELD" ? "text-yellow-600" : "text-green-600"}`}>
                {niveau}
              </span>
              <span className="text-gray-900">{aantal}</span>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-medium text-gray-500 mb-3">Alarmen per type</h3>
          {Object.entries(data.alarmen.perType).length === 0 ? (
            <p className="text-sm text-gray-400">Geen recente alarmen</p>
          ) : (
            Object.entries(data.alarmen.perType).map(([type, aantal]) => (
              <div key={type} className="flex justify-between py-1 text-sm">
                <span className="text-gray-600">{type.replace(/_/g, " ")}</span>
                <span className="text-gray-900 font-medium">{aantal}</span>
              </div>
            ))
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-medium text-gray-500 mb-3">Hulpvragen per categorie</h3>
          {Object.entries(data.hulpvragen.perCategorie).length === 0 ? (
            <p className="text-sm text-gray-400">Geen hulpvragen</p>
          ) : (
            Object.entries(data.hulpvragen.perCategorie).map(([cat, aantal]) => (
              <div key={cat} className="flex justify-between py-1 text-sm">
                <span className="text-gray-600">{cat.replace(/_/g, " ")}</span>
                <span className="text-gray-900 font-medium">{aantal}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

function KpiCard({ label, value, color }: { label: string; value: number; color?: "red" | "green" }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color === "red" ? "text-red-600" : color === "green" ? "text-green-600" : "text-gray-900"}`}>
        {value}
      </p>
    </div>
  )
}

function TrendTable({ data }: { data: TrendData }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 overflow-x-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Check-in Trends</h2>
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <span>{data.periode}</span>
          <span>Totaal: {data.totaalCheckIns} check-ins</span>
          {data.kritiekSignalen > 0 && (
            <span className="text-red-600 font-medium">{data.kritiekSignalen} kritieke signalen</span>
          )}
        </div>
      </div>

      {data.perMaand.length === 0 ? (
        <p className="text-sm text-gray-400">Geen check-in data beschikbaar</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-gray-500">
              <th className="pb-2 font-medium">Maand</th>
              <th className="pb-2 font-medium text-center">Aantal</th>
              <th className="pb-2 font-medium text-center">Welzijn</th>
              <th className="pb-2 font-medium text-center">Fysiek</th>
              <th className="pb-2 font-medium text-center">Emotioneel</th>
              <th className="pb-2 font-medium text-center">Werk/Balans</th>
              <th className="pb-2 font-medium text-center">Steun</th>
              <th className="pb-2 font-medium text-center">% Hulp nodig</th>
            </tr>
          </thead>
          <tbody>
            {data.perMaand.map((m) => (
              <tr key={m.maand} className="border-b border-gray-50">
                <td className="py-2 font-medium text-gray-900">{m.maand}</td>
                <td className="py-2 text-center text-gray-600">{m.aantalCheckIns}</td>
                <td className="py-2 text-center">{scoreCell(m.gemWelzijn)}</td>
                <td className="py-2 text-center">{scoreCell(m.gemFysiek)}</td>
                <td className="py-2 text-center">{scoreCell(m.gemEmotioneel)}</td>
                <td className="py-2 text-center">{scoreCell(m.gemWerkBalans)}</td>
                <td className="py-2 text-center">{scoreCell(m.gemSteun)}</td>
                <td className="py-2 text-center">
                  <span className={m.percentHulpNodig > 30 ? "text-red-600 font-medium" : "text-gray-600"}>
                    {m.percentHulpNodig}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p className="text-xs text-gray-400 mt-2">Scores: 1 = goed, 5 = slecht (lagere score is beter)</p>
    </div>
  )
}

function scoreCell(value: number | null) {
  if (value === null) return <span className="text-gray-300">-</span>
  const color =
    value <= 2 ? "text-green-600" : value <= 3 ? "text-yellow-600" : "text-red-600"
  return <span className={`font-medium ${color}`}>{value}</span>
}
