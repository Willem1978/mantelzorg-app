"use client"

import DOMPurify from "isomorphic-dompurify"
import { useState, useEffect, useCallback } from "react"
import { AdminSpinner } from "@/components/admin"
import { useToast } from "@/components/ui/Toast"

// ── Types ──────────────────────────────────────────────────────────

type PipelineStap = "hiaten" | "voorstellen" | "concepten" | "herschrijven" | "verrijken" | "publiceren"

interface PipelineArtikel {
  id: string
  titel: string
  beschrijving: string
  categorie: string
  tags: string[]
  updatedAt?: string
}

interface HiatenResultaat {
  matrix: {
    tags: string[]
    tagNamen: string[]
    rijen: Array<{ categorie: string; totaal: number; cellen: number[] }>
  }
  categorieAantallen: Record<string, number>
  tagAantallen: Record<string, number>
  totaalArtikelen: number
  aantalHiaten: number
  voorstellen: Array<{
    onderwerp: string
    beschrijving?: string
    categorie?: string
    tags?: string[]
  }>
  analyse?: {
    samenvatting?: string
  }
  volledigeTekst?: string
}

const STAP_CONFIG: Record<PipelineStap, {
  label: string
  icon: string
  status?: string
  beschrijving: string
  kleur: string
}> = {
  hiaten: {
    label: "Hiaten",
    icon: "📊",
    beschrijving: "Analyseer welke content ontbreekt",
    kleur: "purple",
  },
  voorstellen: {
    label: "Voorstellen",
    icon: "💡",
    status: "VOORSTEL",
    beschrijving: "Ideeën klaar om uit te werken tot volledige artikelen",
    kleur: "yellow",
  },
  concepten: {
    label: "Concepten",
    icon: "📝",
    status: "CONCEPT",
    beschrijving: "AI-gegenereerde artikelen, klaar om te herschrijven",
    kleur: "blue",
  },
  herschrijven: {
    label: "Herschreven",
    icon: "✏️",
    status: "HERSCHREVEN",
    beschrijving: "Herschreven op B1-niveau, klaar om te verrijken",
    kleur: "orange",
  },
  verrijken: {
    label: "Verrijkt",
    icon: "🔍",
    status: "VERRIJKT",
    beschrijving: "Verrijkt met tips/FAQ/bronnen, klaar voor publicatie",
    kleur: "green",
  },
  publiceren: {
    label: "Gepubliceerd",
    icon: "✅",
    status: "GEPUBLICEERD",
    beschrijving: "Live artikelen zichtbaar voor gebruikers",
    kleur: "emerald",
  },
}

const PIPELINE_STAPPEN: PipelineStap[] = ["hiaten", "voorstellen", "concepten", "herschrijven", "verrijken", "publiceren"]

// ── Hoofdcomponent ─────────────────────────────────────────────────

export default function ContentAgentPage() {
  const [actieveStap, setActieveStap] = useState<PipelineStap>("hiaten")
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const { showError, showSuccess } = useToast()

  // Pipeline data
  const [aantallen, setAantallen] = useState<Record<string, number>>({})
  const [artikelenPerStatus, setArtikelenPerStatus] = useState<Record<string, PipelineArtikel[]>>({})
  const [geselecteerd, setGeselecteerd] = useState<Set<string>>(new Set())

  // Hiaten data
  const [hiatenResult, setHiatenResult] = useState<HiatenResultaat | null>(null)
  const [geselecteerdeVoorstellen, setGeselecteerdeVoorstellen] = useState<Set<number>>(new Set())

  // Herschrijf/verrijk preview
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [preview, setPreview] = useState<any>(null)

  // Laad pipeline overzicht
  const laadPipeline = useCallback(async () => {
    try {
      const res = await fetch("/api/ai/admin/content-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "pipeline-overzicht" }),
      })
      const data = await res.json()
      if (data.success) {
        setAantallen(data.aantallen || {})
        setArtikelenPerStatus(data.artikelenPerStatus || {})
      }
    } catch {
      // Stille fout bij initiële load
    }
  }, [])

  useEffect(() => {
    laadPipeline()
  }, [laadPipeline])

  // ── API helpers ────────────────────────────────────────────────────

  async function apiCall(body: Record<string, unknown>) {
    const res = await fetch("/api/ai/admin/content-agent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || "Verzoek mislukt")
    return data
  }

  // ── Stap 1: Hiaten-analyse ──────────────────────────────────────

  async function runHiatenAnalyse() {
    setLoading(true)
    setHiatenResult(null)
    try {
      const data = await apiCall({ type: "hiaten-analyse" })
      setHiatenResult(data)
      setGeselecteerdeVoorstellen(new Set())
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : "Hiaten-analyse mislukt")
    } finally {
      setLoading(false)
    }
  }

  async function slaVoorstellenOp() {
    if (!hiatenResult?.voorstellen || geselecteerdeVoorstellen.size === 0) return
    setActionLoading(true)
    try {
      const selected = hiatenResult.voorstellen.filter((_, i) => geselecteerdeVoorstellen.has(i))
      await apiCall({ type: "voorstellen-opslaan", voorstellen: selected })
      showSuccess(`${selected.length} voorstellen opgeslagen`)
      setGeselecteerdeVoorstellen(new Set())
      await laadPipeline()
      setActieveStap("voorstellen")
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : "Opslaan mislukt")
    } finally {
      setActionLoading(false)
    }
  }

  // ── Stap 2-5: Pipeline acties ──────────────────────────────────

  async function genereerGeselecteerde() {
    if (geselecteerd.size === 0) return
    setActionLoading(true)
    try {
      const items = (artikelenPerStatus["VOORSTEL"] || []).filter((a) => geselecteerd.has(a.id))
      const voorstellen = items.map((a) => ({
        onderwerp: a.titel,
        beschrijving: a.beschrijving,
        categorie: a.categorie,
        tags: a.tags,
      }))
      await apiCall({ type: "batch-genereer", voorstellen, opslaan: true })
      // Verwijder de voorstellen (nu geüpgraded naar CONCEPT)
      await apiCall({ type: "wijzig-status", artikelIds: Array.from(geselecteerd), nieuweStatus: "CONCEPT" })
      showSuccess(`${items.length} artikelen gegenereerd`)
      setGeselecteerd(new Set())
      await laadPipeline()
      setActieveStap("concepten")
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : "Genereren mislukt")
    } finally {
      setActionLoading(false)
    }
  }

  async function herschrijfGeselecteerde() {
    if (geselecteerd.size === 0) return
    setActionLoading(true)
    const ids = Array.from(geselecteerd)
    try {
      let verwerkt = 0
      for (const id of ids) {
        const data = await apiCall({ type: "herschrijf", artikelId: id })
        if (data.herschreven) {
          await apiCall({
            type: "toepassen-herschrijving",
            artikelId: id,
            herschrijving: data.herschreven,
          })
          verwerkt++
        }
      }
      showSuccess(`${verwerkt} artikelen herschreven`)
      setGeselecteerd(new Set())
      await laadPipeline()
      setActieveStap("herschrijven")
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : "Herschrijven mislukt")
    } finally {
      setActionLoading(false)
    }
  }

  async function verrijkGeselecteerde() {
    if (geselecteerd.size === 0) return
    setActionLoading(true)
    const ids = Array.from(geselecteerd)
    try {
      let verwerkt = 0
      for (const id of ids) {
        const data = await apiCall({ type: "verrijk", artikelId: id })
        if (data.verrijking?.inhoud) {
          await apiCall({
            type: "toepassen-verrijking",
            artikelId: id,
            verrijking: { inhoud: data.verrijking.inhoud },
          })
          verwerkt++
        }
      }
      showSuccess(`${verwerkt} artikelen verrijkt`)
      setGeselecteerd(new Set())
      await laadPipeline()
      setActieveStap("verrijken")
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : "Verrijken mislukt")
    } finally {
      setActionLoading(false)
    }
  }

  async function publiceerGeselecteerde() {
    if (geselecteerd.size === 0) return
    setActionLoading(true)
    try {
      await apiCall({
        type: "wijzig-status",
        artikelIds: Array.from(geselecteerd),
        nieuweStatus: "GEPUBLICEERD",
      })
      showSuccess(`${geselecteerd.size} artikelen gepubliceerd`)
      setGeselecteerd(new Set())
      await laadPipeline()
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : "Publiceren mislukt")
    } finally {
      setActionLoading(false)
    }
  }

  // Preview een enkel artikel (herschrijf of verrijk)
  async function bekijkPreview(artikelId: string, actie: "herschrijf" | "verrijk") {
    setActionLoading(true)
    setPreview(null)
    try {
      const data = await apiCall({ type: actie, artikelId })
      setPreview({ actie, artikelId, ...data })
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : "Preview mislukt")
    } finally {
      setActionLoading(false)
    }
  }

  async function pasPreviewToe() {
    if (!preview) return
    setActionLoading(true)
    try {
      if (preview.actie === "herschrijf" && preview.herschreven) {
        await apiCall({
          type: "toepassen-herschrijving",
          artikelId: preview.artikelId,
          herschrijving: preview.herschreven,
        })
        showSuccess("Herschrijving toegepast")
      } else if (preview.actie === "verrijk" && preview.verrijking?.inhoud) {
        await apiCall({
          type: "toepassen-verrijking",
          artikelId: preview.artikelId,
          verrijking: { inhoud: preview.verrijking.inhoud },
        })
        showSuccess("Verrijking toegepast")
      }
      setPreview(null)
      await laadPipeline()
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : "Toepassen mislukt")
    } finally {
      setActionLoading(false)
    }
  }

  // ── Selectie helpers ──────────────────────────────────────────────

  function toggleSelectie(id: string) {
    setGeselecteerd((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function selecteerAlles(items: PipelineArtikel[]) {
    const ids = items.map((a) => a.id)
    const alleGeselecteerd = ids.every((id) => geselecteerd.has(id))
    if (alleGeselecteerd) {
      setGeselecteerd(new Set())
    } else {
      setGeselecteerd(new Set(ids))
    }
  }

  // ── Huidige stap data ──────────────────────────────────────────────

  const config = STAP_CONFIG[actieveStap]
  const statusKey = config.status || ""
  const huidigeArtikelen = artikelenPerStatus[statusKey] || []

  // ── Render ─────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Content Pipeline</h1>
        <p className="text-gray-500 mt-1">
          Van hiaten-analyse tot publicatie — beheer de volledige content-workflow.
        </p>
      </div>

      {/* Pipeline stappen */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2">
        {PIPELINE_STAPPEN.map((stap, i) => {
          const s = STAP_CONFIG[stap]
          const aantal = s.status ? (aantallen[s.status] || 0) : 0
          const isActief = actieveStap === stap
          return (
            <div key={stap} className="flex items-center">
              <button
                onClick={() => {
                  setActieveStap(stap)
                  setGeselecteerd(new Set())
                  setPreview(null)
                }}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-all whitespace-nowrap ${
                  isActief
                    ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200 shadow-sm"
                    : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <span className="text-lg">{s.icon}</span>
                <div className="text-left">
                  <span className="text-sm font-medium text-gray-900 block">{s.label}</span>
                  {stap !== "hiaten" && (
                    <span className={`text-xs ${aantal > 0 ? "text-blue-600 font-semibold" : "text-gray-400"}`}>
                      {aantal}
                    </span>
                  )}
                </div>
              </button>
              {i < PIPELINE_STAPPEN.length - 1 && (
                <span className="text-gray-300 mx-1 text-lg">→</span>
              )}
            </div>
          )
        })}
      </div>

      {/* Actieve stap beschrijving */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center gap-3 mb-1">
          <span className="text-2xl">{config.icon}</span>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{config.label}</h2>
            <p className="text-sm text-gray-500">{config.beschrijving}</p>
          </div>
        </div>
      </div>

      {/* Loading overlay */}
      {(loading || actionLoading) && (
        <div className="flex items-center justify-center py-8">
          <AdminSpinner />
          <span className="ml-3 text-gray-500">
            {loading ? "Analyse wordt uitgevoerd..." : "Actie wordt uitgevoerd..."}
          </span>
        </div>
      )}

      {/* ═══ STAP: HIATEN ═══ */}
      {actieveStap === "hiaten" && !loading && (
        <div className="space-y-6">
          <button
            onClick={runHiatenAnalyse}
            disabled={loading}
            className="px-5 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 text-sm font-medium transition-colors"
          >
            📊 Start hiaten-analyse
          </button>

          {hiatenResult && (
            <>
              {/* Samenvatting cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard icon="📄" label="Totaal artikelen" waarde={hiatenResult.totaalArtikelen} />
                <StatCard icon="🔴" label="Hiaten (lege cellen)" waarde={hiatenResult.aantalHiaten} kleur="red" />
                <StatCard icon="📁" label="Categorieën" waarde={Object.keys(hiatenResult.categorieAantallen).length} />
                <StatCard icon="🏷️" label="Tags" waarde={hiatenResult.matrix.tags.length} />
              </div>

              {/* Matrix */}
              <div className="bg-white rounded-xl border border-gray-200 p-4 overflow-x-auto">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Categorie × Tag dekkingsmatrix</h3>
                <table className="text-xs w-full">
                  <thead>
                    <tr>
                      <th className="text-left p-1.5 font-medium text-gray-600 sticky left-0 bg-white">Categorie</th>
                      <th className="text-center p-1.5 font-medium text-gray-600">Totaal</th>
                      {hiatenResult.matrix.tagNamen.map((naam, i) => (
                        <th key={i} className="text-center p-1.5 font-medium text-gray-600 whitespace-nowrap">
                          {naam}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {hiatenResult.matrix.rijen.map((rij, i) => (
                      <tr key={i} className="border-t border-gray-100">
                        <td className="p-1.5 text-gray-700 font-medium sticky left-0 bg-white whitespace-nowrap">
                          {rij.categorie}
                        </td>
                        <td className="text-center p-1.5 font-semibold text-gray-800">{rij.totaal}</td>
                        {rij.cellen.map((cel, j) => (
                          <td
                            key={j}
                            className={`text-center p-1.5 ${
                              cel === 0
                                ? "text-red-600 bg-red-50 font-bold"
                                : cel <= 2
                                ? "text-yellow-600 bg-yellow-50"
                                : "text-green-600 bg-green-50"
                            }`}
                          >
                            {cel}
                          </td>
                        ))}
                      </tr>
                    ))}
                    {/* Tag totalen */}
                    <tr className="border-t-2 border-gray-300 font-semibold">
                      <td className="p-1.5 text-gray-700 sticky left-0 bg-white">Totaal per tag</td>
                      <td className="text-center p-1.5">{hiatenResult.totaalArtikelen}</td>
                      {hiatenResult.matrix.tags.map((slug, j) => (
                        <td key={j} className="text-center p-1.5 text-gray-700">
                          {hiatenResult.tagAantallen[slug] || 0}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* AI Samenvatting */}
              {hiatenResult.analyse?.samenvatting && (
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-purple-800 mb-2">AI Analyse</h3>
                  <p className="text-sm text-purple-700">{hiatenResult.analyse.samenvatting}</p>
                </div>
              )}

              {/* Voorstellen */}
              {hiatenResult.voorstellen.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-900">
                      Voorgestelde artikelen ({hiatenResult.voorstellen.length})
                    </h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          const allIdxs = hiatenResult.voorstellen.map((_, i) => i)
                          const alleGeselecteerd = allIdxs.every((i) => geselecteerdeVoorstellen.has(i))
                          setGeselecteerdeVoorstellen(alleGeselecteerd ? new Set() : new Set(allIdxs))
                        }}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        {hiatenResult.voorstellen.every((_, i) => geselecteerdeVoorstellen.has(i))
                          ? "Deselecteer alles"
                          : "Selecteer alles"}
                      </button>
                      <button
                        onClick={slaVoorstellenOp}
                        disabled={actionLoading || geselecteerdeVoorstellen.size === 0}
                        className="px-4 py-1.5 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 text-xs font-medium"
                      >
                        💡 Opslaan als voorstellen ({geselecteerdeVoorstellen.size})
                      </button>
                    </div>
                  </div>

                  {hiatenResult.voorstellen.map((v, i) => (
                    <label
                      key={i}
                      className={`flex items-start gap-3 bg-white rounded-xl border p-4 cursor-pointer transition-all ${
                        geselecteerdeVoorstellen.has(i)
                          ? "border-yellow-400 bg-yellow-50 ring-1 ring-yellow-200"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={geselecteerdeVoorstellen.has(i)}
                        onChange={() => {
                          setGeselecteerdeVoorstellen((prev) => {
                            const next = new Set(prev)
                            if (next.has(i)) next.delete(i)
                            else next.add(i)
                            return next
                          })
                        }}
                        className="mt-0.5 rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{v.onderwerp}</p>
                        {v.beschrijving && (
                          <p className="text-xs text-gray-500 mt-0.5">{v.beschrijving}</p>
                        )}
                        <div className="flex gap-2 mt-2 flex-wrap">
                          {v.categorie && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                              {v.categorie}
                            </span>
                          )}
                          {v.tags?.map((tag) => (
                            <span key={tag} className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}

              {/* Volledige analyse tekst */}
              {hiatenResult.volledigeTekst && (
                <ExpandableAnalyse tekst={hiatenResult.volledigeTekst} />
              )}
            </>
          )}
        </div>
      )}

      {/* ═══ STAP: VOORSTELLEN / CONCEPTEN / HERSCHREVEN / VERRIJKT ═══ */}
      {actieveStap !== "hiaten" && actieveStap !== "publiceren" && !loading && (
        <div className="space-y-4">
          {/* Actieknoppen */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              {huidigeArtikelen.length > 0 && (
                <button
                  onClick={() => selecteerAlles(huidigeArtikelen)}
                  className="text-xs text-blue-600 hover:underline"
                >
                  {huidigeArtikelen.every((a) => geselecteerd.has(a.id))
                    ? "Deselecteer alles"
                    : `Selecteer alles (${huidigeArtikelen.length})`}
                </button>
              )}
              {geselecteerd.size > 0 && (
                <span className="text-xs text-gray-500">{geselecteerd.size} geselecteerd</span>
              )}
            </div>

            <div className="flex gap-2 flex-wrap">
              {actieveStap === "voorstellen" && (
                <button
                  onClick={genereerGeselecteerde}
                  disabled={actionLoading || geselecteerd.size === 0}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
                >
                  ✨ Genereer artikelen ({geselecteerd.size})
                </button>
              )}
              {actieveStap === "concepten" && (
                <button
                  onClick={herschrijfGeselecteerde}
                  disabled={actionLoading || geselecteerd.size === 0}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 text-sm font-medium"
                >
                  ✏️ Herschrijf ({geselecteerd.size})
                </button>
              )}
              {actieveStap === "herschrijven" && (
                <button
                  onClick={verrijkGeselecteerde}
                  disabled={actionLoading || geselecteerd.size === 0}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm font-medium"
                >
                  🔍 Verrijk ({geselecteerd.size})
                </button>
              )}
              {actieveStap === "verrijken" && (
                <button
                  onClick={publiceerGeselecteerde}
                  disabled={actionLoading || geselecteerd.size === 0}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 text-sm font-medium"
                >
                  ✅ Publiceer ({geselecteerd.size})
                </button>
              )}
            </div>
          </div>

          {/* Artikellijst */}
          {huidigeArtikelen.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <span className="text-4xl block mb-3">{config.icon}</span>
              <p className="text-gray-500">Geen artikelen in deze stap.</p>
              <p className="text-xs text-gray-400 mt-1">
                {actieveStap === "voorstellen"
                  ? "Voer eerst een hiaten-analyse uit en sla voorstellen op."
                  : `Verwerk artikelen in de vorige stap om ze hier te krijgen.`}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {huidigeArtikelen.map((artikel) => (
                <div
                  key={artikel.id}
                  className={`flex items-start gap-3 bg-white rounded-xl border p-4 transition-all ${
                    geselecteerd.has(artikel.id)
                      ? "border-blue-400 bg-blue-50 ring-1 ring-blue-200"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={geselecteerd.has(artikel.id)}
                    onChange={() => toggleSelectie(artikel.id)}
                    className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{artikel.titel}</p>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{artikel.beschrijving}</p>
                    <div className="flex gap-2 mt-2 flex-wrap items-center">
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                        {artikel.categorie}
                      </span>
                      {artikel.tags.map((tag) => (
                        <span key={tag} className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  {/* Preview knoppen */}
                  <div className="flex gap-1">
                    {actieveStap === "concepten" && (
                      <button
                        onClick={() => bekijkPreview(artikel.id, "herschrijf")}
                        disabled={actionLoading}
                        className="text-xs text-orange-600 hover:text-orange-700 px-2 py-1 rounded hover:bg-orange-50"
                        title="Preview herschrijving"
                      >
                        ✏️
                      </button>
                    )}
                    {actieveStap === "herschrijven" && (
                      <button
                        onClick={() => bekijkPreview(artikel.id, "verrijk")}
                        disabled={actionLoading}
                        className="text-xs text-green-600 hover:text-green-700 px-2 py-1 rounded hover:bg-green-50"
                        title="Preview verrijking"
                      >
                        🔍
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Preview panel */}
          {preview && (
            <div className="bg-white rounded-xl border-2 border-blue-300 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">
                  {preview.actie === "herschrijf" ? "✏️ Herschrijf-preview" : "🔍 Verrijking-preview"}
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={pasPreviewToe}
                    disabled={actionLoading}
                    className="px-4 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-xs font-medium"
                  >
                    Toepassen
                  </button>
                  <button
                    onClick={() => setPreview(null)}
                    className="px-4 py-1.5 text-gray-600 rounded-lg hover:bg-gray-100 text-xs"
                  >
                    Sluiten
                  </button>
                </div>
              </div>

              {preview.actie === "herschrijf" && preview.herschreven && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="text-xs font-semibold text-gray-500 mb-2">ORIGINEEL</h4>
                    <p className="font-medium text-gray-900">{preview.origineel?.titel}</p>
                    <p className="text-sm text-gray-500 mt-1">{preview.origineel?.beschrijving}</p>
                  </div>
                  <div className="border border-green-200 rounded-lg p-4 bg-green-50">
                    <h4 className="text-xs font-semibold text-green-600 mb-2">HERSCHREVEN</h4>
                    <p className="font-medium text-gray-900">{preview.herschreven.titel}</p>
                    <p className="text-sm text-gray-500 mt-1">{preview.herschreven.beschrijving}</p>
                    {preview.herschreven.wijzigingen && (
                      <ul className="mt-2 space-y-1">
                        {preview.herschreven.wijzigingen.map((w: string, i: number) => (
                          <li key={i} className="text-xs text-green-700">+ {w}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}

              {preview.actie === "verrijk" && preview.verrijking && (
                <div>
                  {preview.verrijking.toegevoegdeSecties && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {preview.verrijking.toegevoegdeSecties.map((s: string, i: number) => (
                        <span key={i} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                          + {s}
                        </span>
                      ))}
                    </div>
                  )}
                  {preview.verrijking.inhoud && (
                    <div
                      className="prose prose-sm max-w-none text-gray-700 border border-gray-200 rounded-lg p-4 max-h-96 overflow-auto"
                      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(preview.verrijking.inhoud) }}
                    />
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ═══ STAP: GEPUBLICEERD ═══ */}
      {actieveStap === "publiceren" && !loading && (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <span className="text-4xl block mb-3">✅</span>
          <p className="text-2xl font-bold text-gray-900 mb-2">{aantallen["GEPUBLICEERD"] || 0}</p>
          <p className="text-gray-500">gepubliceerde artikelen</p>
          <p className="text-xs text-gray-400 mt-2">
            Beheer gepubliceerde artikelen via het artikelbeheer-scherm.
          </p>
        </div>
      )}
    </div>
  )
}

// ── Hulpcomponenten ─────────────────────────────────────────────────

function StatCard({ icon, label, waarde, kleur = "blue" }: {
  icon: string; label: string; waarde: number; kleur?: string
}) {
  const kleuren: Record<string, string> = {
    blue: "text-blue-700",
    red: "text-red-600",
    green: "text-green-700",
    purple: "text-purple-700",
  }
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center gap-2 mb-1">
        <span>{icon}</span>
        <span className="text-xs text-gray-500">{label}</span>
      </div>
      <p className={`text-2xl font-bold ${kleuren[kleur] || kleuren.blue}`}>{waarde}</p>
    </div>
  )
}

function ExpandableAnalyse({ tekst }: { tekst: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="bg-white rounded-xl border border-gray-200">
      <button
        onClick={() => setOpen(!open)}
        className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors rounded-xl"
      >
        <div className="flex items-center gap-3">
          <span className="text-lg">📄</span>
          <div>
            <h2 className="text-base font-semibold text-gray-900">Volledige AI-analyse</h2>
            <p className="text-xs text-gray-500">Klik om te tonen/verbergen</p>
          </div>
        </div>
        <span className="text-gray-400 text-lg">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="px-6 pb-6 border-t border-gray-100">
          <pre className="prose prose-sm max-w-none text-gray-700 mt-4 whitespace-pre-wrap text-xs">
            {tekst}
          </pre>
        </div>
      )}
    </div>
  )
}
