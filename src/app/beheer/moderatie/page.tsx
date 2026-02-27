"use client"

import { useState } from "react"
import { AdminSpinner } from "@/components/admin"
import { useToast } from "@/components/ui/Toast"

type ModeratieType = "beoordelingen" | "hulpvragen" | "reacties" | "alles"

interface ModeratieResultaat {
  type: string
  aantalItems: number
  aantalActieNodig?: number
  analyse: string
}

interface ModeratieResponse {
  success: boolean
  type: string
  beoordelingen?: ModeratieResultaat
  hulpvragen?: ModeratieResultaat
  reacties?: ModeratieResultaat
}

export default function ModeratiePage() {
  const [type, setType] = useState<ModeratieType>("alles")
  const [limiet, setLimiet] = useState(20)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ModeratieResponse | null>(null)
  const { showError } = useToast()

  async function runModeratie() {
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch("/api/ai/admin/moderate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, limiet }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Moderatie mislukt")
      setResult(data)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Er ging iets mis"
      showError(message)
    } finally {
      setLoading(false)
    }
  }

  const secties = result
    ? [result.beoordelingen, result.hulpvragen, result.reacties].filter(Boolean) as ModeratieResultaat[]
    : []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">AI Moderatie</h1>
        <p className="text-gray-500 mt-1">
          Laat AI beoordelingen, hulpvragen en taakreacties analyseren op kwaliteit en verdachte patronen.
        </p>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Wat modereren?</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as ModeratieType)}
              className="rounded-lg border-gray-300 text-sm py-2 px-3 border focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="alles">Alles</option>
              <option value="beoordelingen">Buddy-beoordelingen</option>
              <option value="hulpvragen">Hulpvragen (open)</option>
              <option value="reacties">Taakreacties</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Aantal items (max 50)</label>
            <input
              type="number"
              min={1}
              max={50}
              value={limiet}
              onChange={(e) => setLimiet(Number(e.target.value))}
              className="rounded-lg border-gray-300 text-sm py-2 px-3 border w-24 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button
            onClick={runModeratie}
            disabled={loading}
            className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
          >
            {loading ? "Modereren..." : "Start moderatie"}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-3">
          AI analyseert de meest recente items op kwaliteit, verdachte patronen, en items die actie vereisen.
        </p>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <AdminSpinner />
          <span className="ml-3 text-gray-500">
            AI modereert {type === "alles" ? "alle categorieën" : type}... dit kan even duren
          </span>
        </div>
      )}

      {/* Resultaten */}
      {result && !loading && (
        <div className="space-y-6">
          {/* Samenvatting */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {secties.map((s) => (
              <div key={s.type} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-500 capitalize">{s.type}</h3>
                  {(s.aantalActieNodig ?? 0) > 0 && (
                    <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
                      {s.aantalActieNodig} actie(s)
                    </span>
                  )}
                </div>
                <p className="text-2xl font-bold text-gray-900">{s.aantalItems}</p>
                <p className="text-xs text-gray-400 mt-1">items geanalyseerd</p>
              </div>
            ))}
          </div>

          {/* Detail per sectie */}
          {secties.map((s) => (
            <ModeratieCard key={s.type} data={s} />
          ))}
        </div>
      )}
    </div>
  )
}

function ModeratieCard({ data }: { data: ModeratieResultaat }) {
  const [open, setOpen] = useState(true)

  const icon =
    data.type === "beoordelingen" ? "⭐" : data.type === "hulpvragen" ? "🆘" : "💬"

  const label =
    data.type === "beoordelingen"
      ? "Buddy-beoordelingen"
      : data.type === "hulpvragen"
        ? "Hulpvragen"
        : "Taakreacties"

  return (
    <div className="bg-white rounded-xl border border-gray-200">
      <button
        onClick={() => setOpen(!open)}
        className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors rounded-t-xl"
      >
        <div className="flex items-center gap-3">
          <span className="text-lg">{icon}</span>
          <div>
            <h2 className="text-base font-semibold text-gray-900">{label}</h2>
            <p className="text-xs text-gray-500">
              {data.aantalItems} items
              {(data.aantalActieNodig ?? 0) > 0 && (
                <span className="text-red-600 ml-2">{data.aantalActieNodig} vereisen actie</span>
              )}
            </p>
          </div>
        </div>
        <span className="text-gray-400 text-lg">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="px-6 pb-6 border-t border-gray-100">
          <div className="prose prose-sm max-w-none text-gray-700 mt-4 whitespace-pre-wrap">
            {formatAnalyse(data.analyse)}
          </div>
        </div>
      )}
    </div>
  )
}

function formatAnalyse(text: string) {
  const parts = text.split(/(##\s+.+)/g)
  return parts.map((part, i) => {
    if (part.startsWith("## ")) {
      return (
        <h3 key={i} className="text-base font-semibold text-gray-900 mt-4 mb-2">
          {part.replace("## ", "")}
        </h3>
      )
    }
    // Highlight ACTIE_NODIG
    if (part.includes("ACTIE_NODIG")) {
      const subparts = part.split(/(ACTIE_NODIG)/g)
      return (
        <span key={i}>
          {subparts.map((sp, j) =>
            sp === "ACTIE_NODIG" ? (
              <span key={j} className="bg-red-100 text-red-700 px-1 py-0.5 rounded text-xs font-bold">
                ACTIE NODIG
              </span>
            ) : (
              <span key={j}>{sp}</span>
            )
          )}
        </span>
      )
    }
    // Highlight AANDACHT
    if (part.includes("AANDACHT")) {
      const subparts = part.split(/(AANDACHT)/g)
      return (
        <span key={i}>
          {subparts.map((sp, j) =>
            sp === "AANDACHT" ? (
              <span key={j} className="bg-yellow-100 text-yellow-700 px-1 py-0.5 rounded text-xs font-bold">
                AANDACHT
              </span>
            ) : (
              <span key={j}>{sp}</span>
            )
          )}
        </span>
      )
    }
    return <span key={i}>{part}</span>
  })
}
