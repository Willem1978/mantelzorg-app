"use client"

import { useState, useEffect } from "react"
import { AdminSpinner } from "@/components/admin"
import { useToast } from "@/components/ui/Toast"

type CuratieType = "review" | "categoriseer" | "b1check" | "duplicaten" | "hiaten" | "alles"

interface CuratieResultaat {
  type: string
  aantalItems?: number
  aantalVerbeteren?: number
  aantalHerschrijven?: number
  aantalVerkeerdeCategorie?: number
  aantalTeMoeilijk?: number
  aantalGrensgebied?: number
  aantalB1Ok?: number
  aantalDuplicaten?: number
  aantalHiaten?: number
  totaalArtikelen?: number
  aantalCategorieen?: number
  aantalGemeentes?: number
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
  hiaten?: CuratieResultaat
}

const TYPE_LABELS: Record<CuratieType, string> = {
  alles: "Alles",
  review: "Kwaliteit & leesbaarheid",
  categoriseer: "Categorisering",
  b1check: "B1-taalniveau",
  duplicaten: "Duplicaten-detectie",
  hiaten: "Hiaten-detectie",
}

const TYPE_BESCHRIJVINGEN: Record<CuratieType, string> = {
  alles: "Voer alle analyses uit",
  review: "Beoordeel artikelen op kwaliteit, volledigheid en leesbaarheid",
  categoriseer: "Controleer of artikelen correct gecategoriseerd zijn",
  b1check: "Check of teksten voldoen aan B1-taalniveau (ERK/CEFR)",
  duplicaten: "Zoek naar overlappende of dubbele artikelen via vector similarity",
  hiaten: "Detecteer ontbrekende content en gaps in de kennisbank",
}

interface HiatenHistorie {
  datum: string
  aantalHiaten: number
  totaalArtikelen: number
}

export default function CuratorPage() {
  const [type, setType] = useState<CuratieType>("alles")
  const [limiet, setLimiet] = useState(20)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<CuratieResponse | null>(null)
  const [hiatenHistorie, setHiatenHistorie] = useState<HiatenHistorie[]>([])
  const toast = useToast()

  // Laad hiaten-historie bij mount
  useEffect(() => {
    fetch("/api/beheer/site-settings?sleutel=curator.hiaten.historie")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.waarde) {
          try { setHiatenHistorie(JSON.parse(data.waarde)) } catch { /* skip */ }
        }
      })
      .catch(() => {})
  }, [result]) // herlaad na nieuwe analyse

  const [herschrijfLoading, setHerschrijfLoading] = useState<string | null>(null)
  const { showSuccess, showError } = toast

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

  async function herschrijfArtikel(artikelId: string) {
    setHerschrijfLoading(artikelId)
    try {
      const res = await fetch("/api/ai/admin/content-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "herschrijf", artikelId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Herschrijven mislukt")
      showSuccess("Artikel herschreven naar B1-niveau")
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Herschrijven mislukt"
      showError(msg)
    } finally {
      setHerschrijfLoading(null)
    }
  }

  const secties = result
    ? [result.review, result.categoriseer, result.b1check, result.duplicaten, result.hiaten].filter(Boolean) as CuratieResultaat[]
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

      {/* Hiaten trend */}
      {hiatenHistorie.length > 1 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Hiaten-trend</h3>
          <div className="flex items-end gap-2">
            {hiatenHistorie.slice(0, 5).reverse().map((h, i) => (
              <div key={i} className="text-center">
                <div
                  className="w-10 bg-purple-200 rounded-t"
                  style={{ height: `${Math.max(8, h.aantalHiaten * 3)}px` }}
                />
                <p className="text-xs font-medium text-gray-700 mt-1">{h.aantalHiaten}</p>
                <p className="text-xs text-gray-400">{new Date(h.datum).toLocaleDateString("nl-NL", { day: "numeric", month: "short" })}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Vorige analyse: {hiatenHistorie[1]?.aantalHiaten} hiaten, nu: {hiatenHistorie[0]?.aantalHiaten} hiaten
          </p>
        </div>
      )}

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
            <CuratieCard
              key={s.type}
              data={s}
              onHerschrijf={herschrijfArtikel}
              herschrijfLoading={herschrijfLoading}
            />
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
    data.type === "b1check" ? "📖" :
    data.type === "hiaten" ? "🕳️" : "🔍"

  const label =
    data.type === "review" ? "Kwaliteit" :
    data.type === "categoriseer" ? "Categorisering" :
    data.type === "b1check" ? "B1-taalniveau" :
    data.type === "hiaten" ? "Hiaten" : "Duplicaten"

  const badge = getBadge(data)

  const mainNumber = data.type === "hiaten" ? (data.totaalArtikelen ?? 0) : (data.aantalItems ?? 0)
  const mainLabel = data.type === "hiaten" ? "artikelen in kennisbank" : "artikelen geanalyseerd"

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
      <p className="text-2xl font-bold text-gray-900">{mainNumber}</p>
      <p className="text-xs text-gray-400 mt-1">{mainLabel}</p>
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
  if (data.type === "hiaten") {
    const n = (data.aantalHiaten ?? 0)
    if (n > 0) return { text: `${n} hiaten`, className: "bg-purple-100 text-purple-700" }
  }
  return null
}

function CuratieCard({ data, onHerschrijf, herschrijfLoading }: {
  data: CuratieResultaat
  onHerschrijf: (id: string) => void
  herschrijfLoading: string | null
}) {
  const [open, setOpen] = useState(true)

  const icon =
    data.type === "review" ? "📝" :
    data.type === "categoriseer" ? "🗂️" :
    data.type === "b1check" ? "📖" :
    data.type === "hiaten" ? "🕳️" : "🔍"

  const label =
    data.type === "review" ? "Kwaliteit & Leesbaarheid" :
    data.type === "categoriseer" ? "Categorisering" :
    data.type === "b1check" ? "B1-taalniveau Check" :
    data.type === "hiaten" ? "Hiaten-detectie" : "Duplicaten-detectie"

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
          {/* Actie-knoppen voor review en b1check resultaten */}
          {(data.type === "review" || data.type === "b1check") && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs font-medium text-gray-500 mb-2">Acties</p>
              <div className="flex flex-wrap gap-2">
                {extractArtikelIds(data.analyse).map((id) => (
                  <button
                    key={id}
                    onClick={() => onHerschrijf(id)}
                    disabled={herschrijfLoading === id}
                    className="px-3 py-1.5 text-xs bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 disabled:opacity-50"
                  >
                    {herschrijfLoading === id ? "Herschrijft..." : `Herschrijf ${id.slice(0, 8)}...`}
                  </button>
                ))}
                {extractArtikelIds(data.analyse).length === 0 && (
                  <span className="text-xs text-gray-400">Geen artikel-IDs gevonden in analyse</span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function getSubtitle(data: CuratieResultaat): string {
  if (data.type === "hiaten") {
    const parts = [`${data.totaalArtikelen ?? 0} artikelen`]
    if (data.aantalCategorieen) parts.push(`${data.aantalCategorieen} categorieën`)
    if (data.aantalGemeentes) parts.push(`${data.aantalGemeentes} gemeentes`)
    return parts.join(" · ")
  }
  const parts = [`${data.aantalItems ?? 0} artikelen`]
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

function extractArtikelIds(text: string): string[] {
  // Extract CUID-achtige IDs uit de analyse tekst (bijv. cl1234abc...)
  const matches = text.match(/\b(c[a-z0-9]{20,30})\b/g)
  return [...new Set(matches || [])]
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
