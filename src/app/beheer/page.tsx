"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { AdminSpinner } from "@/components/admin"

interface Stats {
  gebruikers: {
    totaal: number
    nieuweWeek: number
    nieuweMaand: number
    mantelzorgers: number
    buddies: number
  }
  buddiesPerStatus: Record<string, number>
  tests: {
    totaal: number
    dezeMaand: number
    gemiddeldeScore: number
  }
  scoreVerdeling: Record<string, number>
  alarmen: {
    totaal: number
    open: number
  }
  hulpvragen: {
    totaal: number
    open: number
  }
  organisaties: {
    totaal: number
    actief: number
  }
}

export default function BeheerDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [seedStatus, setSeedStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [seedResult, setSeedResult] = useState<string | null>(null)
  const [embeddingStatus, setEmbeddingStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [embeddingResult, setEmbeddingResult] = useState<string | null>(null)
  const [embeddingForce, setEmbeddingForce] = useState(false)

  useEffect(() => {
    fetch("/api/beheer/statistieken")
      .then((res) => res.json())
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <AdminSpinner tekst="Dashboard laden..." />
  }

  if (!stats) {
    return (
      <div className="text-red-600 p-4">Statistieken konden niet worden geladen.</div>
    )
  }

  const kpiCards = [
    {
      label: "Totaal gebruikers",
      waarde: stats.gebruikers.totaal,
      sub: `+${stats.gebruikers.nieuweWeek} deze week`,
      icon: "👥",
      kleur: "blue",
      link: "/beheer/gebruikers",
    },
    {
      label: "Mantelzorgers",
      waarde: stats.gebruikers.mantelzorgers,
      sub: `${stats.tests.dezeMaand} tests deze maand`,
      icon: "❤️",
      kleur: "rose",
      link: "/beheer/gebruikers?rol=CAREGIVER",
    },
    {
      label: "MantelBuddies",
      waarde: stats.gebruikers.buddies,
      sub: `${stats.buddiesPerStatus?.AANGEMELD || 0} nieuwe aanmeldingen`,
      icon: "🤝",
      kleur: "green",
      link: "/beheer/mantelbuddies",
    },
    {
      label: "Open alarmen",
      waarde: stats.alarmen.open,
      sub: `${stats.alarmen.totaal} totaal`,
      icon: "🔔",
      kleur: stats.alarmen.open > 0 ? "red" : "gray",
      link: "/beheer/alarmen",
    },
    {
      label: "Gem. belastingsscore",
      waarde: stats.tests.gemiddeldeScore,
      sub: `${stats.tests.totaal} tests afgenomen`,
      icon: "📊",
      kleur: "amber",
      link: null,
    },
    {
      label: "Hulporganisaties",
      waarde: stats.organisaties.actief,
      sub: `${stats.organisaties.totaal} totaal`,
      icon: "🏥",
      kleur: "primary",
      link: "/beheer/hulpbronnen",
    },
  ]

  async function seedContent() {
    setSeedStatus("loading")
    setSeedResult(null)
    try {
      const res = await fetch("/api/beheer/seed-content", { method: "POST" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Onbekende fout")
      setSeedStatus("success")
      setSeedResult(`${data.created} nieuwe keys aangemaakt, ${data.skipped} al aanwezig.`)
    } catch (err: any) {
      setSeedStatus("error")
      setSeedResult(err.message || "Er ging iets mis")
    }
  }

  async function generateEmbeddings() {
    setEmbeddingStatus("loading")
    setEmbeddingResult(null)
    try {
      const res = await fetch("/api/ai/embeddings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "all", force: embeddingForce }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Onbekende fout")
      setEmbeddingStatus("success")
      const parts = []
      if (data.artikelen !== undefined) parts.push(`${data.artikelen} artikelen`)
      if (data.zorgorganisaties !== undefined) parts.push(`${data.zorgorganisaties} organisaties`)
      setEmbeddingResult(`Embeddings gegenereerd: ${parts.join(", ")}`)
    } catch (err: any) {
      setEmbeddingStatus("error")
      setEmbeddingResult(err.message || "Er ging iets mis")
    }
  }

  const kleurMap: Record<string, string> = {
    blue: "bg-blue-50 border-blue-200",
    rose: "bg-rose-50 border-rose-200",
    green: "bg-green-50 border-green-200",
    red: "bg-red-50 border-red-200",
    gray: "bg-gray-50 border-gray-200",
    amber: "bg-amber-50 border-amber-200",
    primary: "bg-primary-light border-primary/20",
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Overzicht van het MantelBuddy platform</p>
      </div>

      {/* KPI kaarten */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpiCards.map((card) => {
          const Wrapper = card.link ? Link : "div"
          const wrapperProps = card.link ? { href: card.link } : {}

          return (
            <Wrapper
              key={card.label}
              {...(wrapperProps as any)}
              className={`p-4 rounded-xl border ${kleurMap[card.kleur]} ${card.link ? "hover:shadow-md transition-shadow cursor-pointer" : ""}`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-600">{card.label}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{card.waarde}</p>
                  <p className="text-xs text-gray-500 mt-1">{card.sub}</p>
                </div>
                <span className="text-2xl">{card.icon}</span>
              </div>
            </Wrapper>
          )
        })}
      </div>

      {/* Score verdeling */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Belastbaarheidsverdeling</h2>
        <div className="flex gap-4">
          {[
            { niveau: "LAAG", label: "Laag (0-8)", kleur: "bg-green-500" },
            { niveau: "GEMIDDELD", label: "Gemiddeld (9-16)", kleur: "bg-amber-500" },
            { niveau: "HOOG", label: "Hoog (17-24)", kleur: "bg-red-500" },
          ].map((item) => {
            const count = stats.scoreVerdeling[item.niveau] || 0
            const totaal = Object.values(stats.scoreVerdeling).reduce((a, b) => a + b, 0)
            const percentage = totaal > 0 ? Math.round((count / totaal) * 100) : 0

            return (
              <div key={item.niveau} className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-3 h-3 rounded-full ${item.kleur}`} />
                  <span className="text-sm text-gray-600">{item.label}</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{count}</p>
                <div className="mt-2 w-full bg-gray-100 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${item.kleur}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">{percentage}%</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Snelle links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/beheer/mantelbuddies?status=AANGEMELD"
          className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow"
        >
          <h3 className="font-semibold text-gray-900">Nieuwe aanmeldingen</h3>
          <p className="text-sm text-gray-500 mt-1">
            {stats.buddiesPerStatus?.AANGEMELD || 0} MantelBuddies wachten op beoordeling
          </p>
        </Link>

        <Link
          href="/beheer/alarmen"
          className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow"
        >
          <h3 className="font-semibold text-gray-900">Open alarmen</h3>
          <p className="text-sm text-gray-500 mt-1">
            {stats.alarmen.open} alarmen vereisen aandacht
          </p>
        </Link>

        <Link
          href="/beheer/hulpbronnen"
          className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow"
        >
          <h3 className="font-semibold text-gray-900">Hulpbronnen beheren</h3>
          <p className="text-sm text-gray-500 mt-1">
            {stats.organisaties.actief} actieve organisaties
          </p>
        </Link>

        <Link
          href="/beheer/artikelen"
          className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow"
        >
          <h3 className="font-semibold text-gray-900">Artikelen beheren</h3>
          <p className="text-sm text-gray-500 mt-1">
            Beheer informatie, tips en gemeentenieuws
          </p>
        </Link>

        <Link
          href="/beheer/handleiding"
          className="bg-blue-50 rounded-xl border border-blue-200 p-4 hover:shadow-md transition-shadow"
        >
          <h3 className="font-semibold text-gray-900">Handleiding</h3>
          <p className="text-sm text-gray-500 mt-1">
            Uitleg over alle functies en het inrichten van het platform
          </p>
        </Link>
      </div>

      {/* Systeemacties */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Systeemacties</h2>
        <p className="text-sm text-gray-500 mb-4">
          Eenmalige acties voor het instellen van het platform.
        </p>
        <div className="flex items-center gap-4">
          <button
            onClick={seedContent}
            disabled={seedStatus === "loading"}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
          >
            {seedStatus === "loading" ? "Bezig..." : "Content keys laden"}
          </button>
          {seedResult && (
            <span className={`text-sm ${seedStatus === "success" ? "text-green-600" : "text-red-600"}`}>
              {seedResult}
            </span>
          )}
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Vult alle bewerkbare teksten (rapport, advies, hulptips) in de database.
          Bestaande aanpassingen worden niet overschreven.
        </p>

        <hr className="my-4 border-gray-200" />

        <h3 className="text-sm font-semibold text-gray-700 mb-2">AI Embeddings</h3>
        <p className="text-sm text-gray-500 mb-3">
          Genereer zoek-embeddings voor artikelen en hulporganisaties. Dit maakt de AI-zoekfunctie mogelijk.
        </p>
        <div className="flex items-center gap-4 flex-wrap">
          <button
            onClick={generateEmbeddings}
            disabled={embeddingStatus === "loading"}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
          >
            {embeddingStatus === "loading" ? "Bezig met genereren..." : "Embeddings genereren"}
          </button>
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={embeddingForce}
              onChange={(e) => setEmbeddingForce(e.target.checked)}
              className="rounded border-gray-300"
            />
            Alles opnieuw genereren
          </label>
          {embeddingResult && (
            <span className={`text-sm ${embeddingStatus === "success" ? "text-green-600" : "text-red-600"}`}>
              {embeddingResult}
            </span>
          )}
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Standaard worden alleen nieuwe/missende embeddings aangemaakt.
          Vink &quot;Alles opnieuw genereren&quot; aan om alle embeddings te verversen.
        </p>
      </div>
    </div>
  )
}
