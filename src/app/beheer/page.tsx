"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

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

  useEffect(() => {
    fetch("/api/beheer/statistieken")
      .then((res) => res.json())
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Laden...</div>
      </div>
    )
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
      kleur: "teal",
      link: "/beheer/hulpbronnen",
    },
  ]

  const kleurMap: Record<string, string> = {
    blue: "bg-blue-50 border-blue-200",
    rose: "bg-rose-50 border-rose-200",
    green: "bg-green-50 border-green-200",
    red: "bg-red-50 border-red-200",
    gray: "bg-gray-50 border-gray-200",
    amber: "bg-amber-50 border-amber-200",
    teal: "bg-teal-50 border-teal-200",
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
      </div>
    </div>
  )
}
