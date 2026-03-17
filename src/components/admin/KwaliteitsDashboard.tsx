"use client"

import { useMemo } from "react"

interface Hulpbron {
  id: string
  naam: string
  beschrijving: string | null
  type: string
  telefoon: string | null
  email: string | null
  website: string | null
  onderdeelTest: string | null
  soortHulp: string | null
  kosten: string | null
  doelgroep: string | null
  eersteStap: string | null
  verwachtingTekst: string | null
  dienst: string | null
  isActief: boolean
}

interface KwaliteitsDashboardProps {
  hulpbronnen: Hulpbron[]
  onFilterOnvolledig: () => void
  onFilterZonderCategorie: () => void
  onFilterZonderBeschrijving: () => void
  actieveFilter: string | null
  bulkAiLoading: boolean
  onBulkAiInvullen: () => void
  bulkAiProgress?: { verwerkt: number; totaal: number } | null
}

const COMPLETENESS_FIELDS = [
  "naam", "dienst", "beschrijving", "doelgroep", "onderdeelTest",
  "soortHulp", "kosten", "eersteStap", "verwachtingTekst", "telefoon", "website",
] as const

function berekenCompleetheid(h: Hulpbron): number {
  const filled = COMPLETENESS_FIELDS.filter(key => {
    const val = h[key as keyof Hulpbron]
    return val && val !== "" && val !== "OVERIG"
  }).length
  return Math.round((filled / COMPLETENESS_FIELDS.length) * 100)
}

export function KwaliteitsDashboard({
  hulpbronnen,
  onFilterOnvolledig,
  onFilterZonderCategorie,
  onFilterZonderBeschrijving,
  actieveFilter,
  bulkAiLoading,
  onBulkAiInvullen,
  bulkAiProgress,
}: KwaliteitsDashboardProps) {
  const stats = useMemo(() => {
    const onvolledig = hulpbronnen.filter(h => berekenCompleetheid(h) < 70).length
    const zonderBeschrijving = hulpbronnen.filter(h => !h.beschrijving || h.beschrijving.trim() === "").length
    const zonderCategorie = hulpbronnen.filter(h => !h.onderdeelTest || h.onderdeelTest.trim() === "").length
    const gemiddeldeCompleetheid = hulpbronnen.length > 0
      ? Math.round(hulpbronnen.reduce((sum, h) => sum + berekenCompleetheid(h), 0) / hulpbronnen.length)
      : 0

    return { onvolledig, zonderBeschrijving, zonderCategorie, gemiddeldeCompleetheid }
  }, [hulpbronnen])

  if (hulpbronnen.length === 0) return null

  return (
    <div className="ker-card mb-4 border-l-4 border-[var(--primary)]">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          Kwaliteitsoverzicht
        </h3>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Gemiddelde compleetheid:</span>
            <div className="w-20 h-2 bg-[var(--muted)] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  stats.gemiddeldeCompleetheid >= 80
                    ? "bg-emerald-500"
                    : stats.gemiddeldeCompleetheid >= 50
                    ? "bg-amber-500"
                    : "bg-red-400"
                }`}
                style={{ width: `${stats.gemiddeldeCompleetheid}%` }}
              />
            </div>
            <span className={`text-xs font-bold ${
              stats.gemiddeldeCompleetheid >= 80
                ? "text-emerald-600"
                : stats.gemiddeldeCompleetheid >= 50
                ? "text-amber-600"
                : "text-red-500"
            }`}>
              {stats.gemiddeldeCompleetheid}%
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
        {/* Onvolledig (<70%) */}
        <button
          onClick={onFilterOnvolledig}
          className={`p-3 rounded-lg text-center transition border ${
            actieveFilter === "onvolledig"
              ? "border-red-400 bg-red-50 dark:bg-red-950/20"
              : "border-[var(--border)] bg-[var(--background)] hover:border-red-300 hover:bg-red-50/50"
          }`}
        >
          <div className={`text-xl font-bold ${stats.onvolledig > 0 ? "text-red-500" : "text-emerald-500"}`}>
            {stats.onvolledig}
          </div>
          <div className="text-[10px] text-muted-foreground">
            &lt;70% compleet
          </div>
        </button>

        {/* Zonder beschrijving */}
        <button
          onClick={onFilterZonderBeschrijving}
          className={`p-3 rounded-lg text-center transition border ${
            actieveFilter === "zonderBeschrijving"
              ? "border-amber-400 bg-amber-50 dark:bg-amber-950/20"
              : "border-[var(--border)] bg-[var(--background)] hover:border-amber-300 hover:bg-amber-50/50"
          }`}
        >
          <div className={`text-xl font-bold ${stats.zonderBeschrijving > 0 ? "text-amber-500" : "text-emerald-500"}`}>
            {stats.zonderBeschrijving}
          </div>
          <div className="text-[10px] text-muted-foreground">
            Zonder beschrijving
          </div>
        </button>

        {/* Zonder categorie */}
        <button
          onClick={onFilterZonderCategorie}
          className={`p-3 rounded-lg text-center transition border ${
            actieveFilter === "zonderCategorie"
              ? "border-blue-400 bg-blue-50 dark:bg-blue-950/20"
              : "border-[var(--border)] bg-[var(--background)] hover:border-blue-300 hover:bg-blue-50/50"
          }`}
        >
          <div className={`text-xl font-bold ${stats.zonderCategorie > 0 ? "text-blue-500" : "text-emerald-500"}`}>
            {stats.zonderCategorie}
          </div>
          <div className="text-[10px] text-muted-foreground">
            Zonder categorie
          </div>
        </button>

        {/* Totaal */}
        <div className="p-3 rounded-lg text-center border border-[var(--border)] bg-[var(--background)]">
          <div className="text-xl font-bold text-foreground">
            {hulpbronnen.length}
          </div>
          <div className="text-[10px] text-muted-foreground">
            Totaal hulpbronnen
          </div>
        </div>
      </div>

      {/* Bulk AI knop */}
      {stats.onvolledig > 0 && (
        <div className="flex items-center gap-3">
          <button
            onClick={onBulkAiInvullen}
            disabled={bulkAiLoading}
            className="px-4 py-2 rounded-lg text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2"
          >
            {bulkAiLoading ? (
              <>
                <span className="inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Bezig met invullen...
              </>
            ) : (
              <>AI: Vul alle onvolledige hulpbronnen in ({stats.onvolledig})</>
            )}
          </button>
          {bulkAiProgress && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="w-24 h-2 bg-[var(--muted)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all"
                  style={{ width: `${Math.round((bulkAiProgress.verwerkt / bulkAiProgress.totaal) * 100)}%` }}
                />
              </div>
              {bulkAiProgress.verwerkt}/{bulkAiProgress.totaal}
            </div>
          )}
          {actieveFilter && (
            <button
              onClick={onFilterOnvolledig}
              className="text-xs text-muted-foreground hover:text-foreground transition"
            >
              Filter wissen
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// Export de berekenCompleetheid functie voor hergebruik
export { berekenCompleetheid }
