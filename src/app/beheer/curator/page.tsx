"use client"

import { useState } from "react"
import { AdminSpinner } from "@/components/admin"
import { useToast } from "@/components/ui/Toast"

type CuratieType = "review" | "categoriseer" | "b1check" | "duplicaten" | "alles"

interface CuratieResultaat {
  type: string
  aantalItems: number
  aantalVerbeteren?: number
  aantalHerschrijven?: number
  aantalVerkeerdeCategorie?: number
  aantalTeMoeilijk?: number
  aantalGrensgebied?: number
  aantalB1Ok?: number
  aantalDuplicaten?: number
  methode?: string
  analyse: string
}

interface CuratieResponse {
  success: boolean
  type: string
  review?: CuratieResultaat
  categoriseer?: CuratieResultaat
  b1check?: CuratieResultaat
  duplicaten?: CuratieResultaat
}

const TYPE_LABELS: Record<CuratieType, string> = {
  alles: "Alles",
  review: "Kwaliteit & leesbaarheid",
  categoriseer: "Categorisering",
  b1check: "B1-taalniveau",
  duplicaten: "Duplicaten-detectie",
}

const TYPE_BESCHRIJVINGEN: Record<CuratieType, string> = {
  alles: "Voer alle analyses uit",
  review: "Beoordeel artikelen op kwaliteit, volledigheid en leesbaarheid",
  categoriseer: "Controleer of artikelen correct gecategoriseerd zijn",
  b1check: "Check of teksten voldoen aan B1-taalniveau (ERK/CEFR)",
  duplicaten: "Zoek naar overlappende of dubbele artikelen via vector similarity",
}

export default function CuratorPage() {
  const [type, setType] = useState<CuratieType>("alles")
  const [limiet, setLimiet] = useState(20)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<CuratieResponse | null>(null)
  const { showError } = useToast()

  async function runCuratie() {
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch("/api/ai/admin/curator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, limiet }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Content curatie mislukt")
      setResult(data)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Er ging iets mis"
      showError(message)
    } finally {
      setLoading(false)
    }
  }

  const secties = result
    ? [result.review, result.categoriseer, result.b1check, result.duplicaten].filter(Boolean) as CuratieResultaat[]
    : []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Content Curator</h1>
        <p className="text-gray-500 mt-1">
          Laat AI artikelen analyseren op kwaliteit, taalniveau, categorisering en duplicaten.
        </p>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Analyse type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as CuratieType)}
              className="rounded-lg border-gray-300 text-sm py-2 px-3 border focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {Object.entries(TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Aantal artikelen (max 50)</label>
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
            onClick={runCuratie}
            disabled={loading}
            className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
          >
            {loading ? "Analyseren..." : "Start analyse"}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-3">
          {TYPE_BESCHRIJVINGEN[type]}
        </p>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <AdminSpinner />
          <span className="ml-3 text-gray-500">
            AI analyseert artikelen ({TYPE_LABELS[type].toLowerCase()})... dit kan even duren
          </span>
        </div>
      )}

      {/* Resultaten */}
      {result && !loading && (
        <div className="space-y-6">
          {/* Samenvatting cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {secties.map((s) => (
              <SamenvattingCard key={s.type} data={s} />
            ))}
          </div>

          {/* Detail per sectie */}
          {secties.map((s) => (
            <CuratieCard key={s.type} data={s} />
          ))}
        </div>
      )}
    </div>
  )
}

function SamenvattingCard({ data }: { data: CuratieResultaat }) {
  const icon =
    data.type === "review" ? "📝" :
    data.type === "categoriseer" ? "🗂️" :
    data.type === "b1check" ? "📖" : "🔍"

  const label =
    data.type === "review" ? "Kwaliteit" :
    data.type === "categoriseer" ? "Categorisering" :
    data.type === "b1check" ? "B1-taalniveau" : "Duplicaten"

  const badge = getBadge(data)

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{icon}</span>
          <h3 className="text-sm font-medium text-gray-500">{label}</h3>
        </div>
        {badge && (
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge.className}`}>
            {badge.text}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900">{data.aantalItems}</p>
      <p className="text-xs text-gray-400 mt-1">artikelen geanalyseerd</p>
    </div>
  )
}

function getBadge(data: CuratieResultaat): { text: string; className: string } | null {
  if (data.type === "review") {
    const n = (data.aantalHerschrijven ?? 0)
    if (n > 0) return { text: `${n} herschrijven`, className: "bg-red-100 text-red-700" }
    const v = (data.aantalVerbeteren ?? 0)
    if (v > 0) return { text: `${v} verbeteren`, className: "bg-yellow-100 text-yellow-700" }
  }
  if (data.type === "b1check") {
    const n = (data.aantalTeMoeilijk ?? 0)
    if (n > 0) return { text: `${n} te moeilijk`, className: "bg-red-100 text-red-700" }
    const g = (data.aantalGrensgebied ?? 0)
    if (g > 0) return { text: `${g} grensgebied`, className: "bg-yellow-100 text-yellow-700" }
  }
  if (data.type === "duplicaten") {
    const n = (data.aantalDuplicaten ?? 0)
    if (n > 0) return { text: `${n} paren`, className: "bg-orange-100 text-orange-700" }
  }
  return null
}

function CuratieCard({ data }: { data: CuratieResultaat }) {
  const [open, setOpen] = useState(true)

  const icon =
    data.type === "review" ? "📝" :
    data.type === "categoriseer" ? "🗂️" :
    data.type === "b1check" ? "📖" : "🔍"

  const label =
    data.type === "review" ? "Kwaliteit & Leesbaarheid" :
    data.type === "categoriseer" ? "Categorisering" :
    data.type === "b1check" ? "B1-taalniveau Check" : "Duplicaten-detectie"

  const subtitle = getSubtitle(data)

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
            <p className="text-xs text-gray-500">{subtitle}</p>
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

function getSubtitle(data: CuratieResultaat): string {
  const parts = [`${data.aantalItems} artikelen`]
  if (data.type === "review") {
    if (data.aantalHerschrijven) parts.push(`${data.aantalHerschrijven} herschrijven`)
    if (data.aantalVerbeteren) parts.push(`${data.aantalVerbeteren} verbeteren`)
  }
  if (data.type === "b1check") {
    if (data.aantalTeMoeilijk) parts.push(`${data.aantalTeMoeilijk} te moeilijk`)
    if (data.aantalGrensgebied) parts.push(`${data.aantalGrensgebied} grensgebied`)
    if (data.aantalB1Ok) parts.push(`${data.aantalB1Ok} ok`)
  }
  if (data.type === "duplicaten" && data.methode) {
    parts.push(`methode: ${data.methode}`)
  }
  return parts.join(" · ")
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
    // Highlight HERSCHRIJVEN
    if (part.includes("HERSCHRIJVEN")) {
      const subparts = part.split(/(HERSCHRIJVEN)/g)
      return (
        <span key={i}>
          {subparts.map((sp, j) =>
            sp === "HERSCHRIJVEN" ? (
              <span key={j} className="bg-red-100 text-red-700 px-1 py-0.5 rounded text-xs font-bold">
                HERSCHRIJVEN
              </span>
            ) : sp.includes("TE_MOEILIJK") ? (
              formatTeMoeilijk(sp, j)
            ) : (
              <span key={j}>{sp}</span>
            )
          )}
        </span>
      )
    }
    // Highlight TE_MOEILIJK
    if (part.includes("TE_MOEILIJK")) {
      return formatTeMoeilijk(part, i)
    }
    // Highlight VERBETEREN
    if (part.includes("VERBETEREN")) {
      const subparts = part.split(/(VERBETEREN)/g)
      return (
        <span key={i}>
          {subparts.map((sp, j) =>
            sp === "VERBETEREN" ? (
              <span key={j} className="bg-yellow-100 text-yellow-700 px-1 py-0.5 rounded text-xs font-bold">
                VERBETEREN
              </span>
            ) : (
              <span key={j}>{sp}</span>
            )
          )}
        </span>
      )
    }
    // Highlight GRENSGEBIED
    if (part.includes("GRENSGEBIED")) {
      const subparts = part.split(/(GRENSGEBIED)/g)
      return (
        <span key={i}>
          {subparts.map((sp, j) =>
            sp === "GRENSGEBIED" ? (
              <span key={j} className="bg-yellow-100 text-yellow-700 px-1 py-0.5 rounded text-xs font-bold">
                GRENSGEBIED
              </span>
            ) : (
              <span key={j}>{sp}</span>
            )
          )}
        </span>
      )
    }
    // Highlight IDENTIEK
    if (part.includes("IDENTIEK")) {
      const subparts = part.split(/(IDENTIEK)/g)
      return (
        <span key={i}>
          {subparts.map((sp, j) =>
            sp === "IDENTIEK" ? (
              <span key={j} className="bg-red-100 text-red-700 px-1 py-0.5 rounded text-xs font-bold">
                IDENTIEK
              </span>
            ) : (
              <span key={j}>{sp}</span>
            )
          )}
        </span>
      )
    }
    // Highlight OVERLAP
    if (part.includes("OVERLAP")) {
      const subparts = part.split(/(OVERLAP)/g)
      return (
        <span key={i}>
          {subparts.map((sp, j) =>
            sp === "OVERLAP" ? (
              <span key={j} className="bg-orange-100 text-orange-700 px-1 py-0.5 rounded text-xs font-bold">
                OVERLAP
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

function formatTeMoeilijk(text: string, key: number) {
  const subparts = text.split(/(TE_MOEILIJK)/g)
  return (
    <span key={key}>
      {subparts.map((sp, j) =>
        sp === "TE_MOEILIJK" ? (
          <span key={j} className="bg-red-100 text-red-700 px-1 py-0.5 rounded text-xs font-bold">
            TE MOEILIJK
          </span>
        ) : (
          <span key={j}>{sp}</span>
        )
      )}
    </span>
  )
}
