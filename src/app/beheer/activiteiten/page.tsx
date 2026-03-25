"use client"

import { useState, useEffect, useCallback } from "react"

const TYPES = [
  { value: "", label: "Alle types" },
  { value: "LOTGENOTEN", label: "Lotgenoten" },
  { value: "SPORT", label: "Sport & beweging" },
  { value: "SOCIAAL", label: "Sociaal" },
  { value: "EDUCATIE", label: "Educatie" },
  { value: "RESPIJTZORG", label: "Respijtzorg" },
  { value: "OVERIG", label: "Overig" },
]

interface Activiteit {
  id: string
  naam: string
  beschrijving: string | null
  locatie: string | null
  woonplaats: string
  gemeente: string
  type: string
  frequentie: string | null
  dag: string | null
  tijd: string | null
  kosten: string | null
  contactTelefoon: string | null
  website: string | null
  isGevalideerd: boolean
  isActief: boolean
}

export default function BeheerActiviteitenPage() {
  const [activiteiten, setActiviteiten] = useState<Activiteit[]>([])
  const [loading, setLoading] = useState(true)
  const [woonplaatsFilter, setWoonplaatsFilter] = useState("")
  const [typeFilter, setTypeFilter] = useState("")
  const [zoekTerm, setZoekTerm] = useState("")
  const [aiZoeken, setAiZoeken] = useState(false)
  const [aiWoonplaats, setAiWoonplaats] = useState("")

  const fetchActiviteiten = useCallback(async () => {
    const params = new URLSearchParams()
    if (woonplaatsFilter) params.set("woonplaats", woonplaatsFilter)
    if (typeFilter) params.set("type", typeFilter)
    try {
      const res = await fetch(`/api/beheer/activiteiten?${params}`)
      if (res.ok) {
        const data = await res.json()
        setActiviteiten(data.activiteiten || [])
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [woonplaatsFilter, typeFilter])

  useEffect(() => { fetchActiviteiten() }, [fetchActiviteiten])

  const toggleValidatie = async (id: string, isGevalideerd: boolean) => {
    await fetch("/api/beheer/activiteiten", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isGevalideerd: !isGevalideerd }),
    })
    setActiviteiten(prev => prev.map(a =>
      a.id === id ? { ...a, isGevalideerd: !isGevalideerd } : a
    ))
  }

  const startAIZoeken = async () => {
    if (!aiWoonplaats) return
    setAiZoeken(true)
    try {
      const res = await fetch("/api/beheer/activiteiten/ai-zoeken", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ woonplaats: aiWoonplaats }),
      })
      if (res.ok) {
        await fetchActiviteiten()
      }
    } catch {
      // silent
    } finally {
      setAiZoeken(false)
    }
  }

  const gefilterd = activiteiten.filter(a =>
    !zoekTerm || a.naam.toLowerCase().includes(zoekTerm.toLowerCase()) ||
    a.beschrijving?.toLowerCase().includes(zoekTerm.toLowerCase())
  )

  const woonplaatsen = [...new Set(activiteiten.map(a => a.woonplaats))].sort()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#2D1B69]">Activiteiten</h1>
          <p className="text-sm text-[#5A4D6B] mt-1">{activiteiten.length} activiteiten</p>
        </div>
      </div>

      {/* AI Zoeken */}
      <div className="p-4 bg-[#EDE8F5] rounded-xl border border-[#2D1B69]/10">
        <h3 className="font-bold text-[#2D1B69] mb-2">AI Activiteiten Zoeker</h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={aiWoonplaats}
            onChange={(e) => setAiWoonplaats(e.target.value)}
            placeholder="Woonplaats..."
            className="flex-1 px-3 py-2 border border-[#D4C6D9] rounded-lg text-sm bg-white focus:border-[#2D1B69] focus:outline-none"
          />
          <button
            onClick={startAIZoeken}
            disabled={!aiWoonplaats || aiZoeken}
            className="px-4 py-2 bg-[#E5A825] text-[#1E1533] font-bold rounded-lg text-sm disabled:opacity-40 hover:bg-[#d49b20] transition-colors"
          >
            {aiZoeken ? "Zoeken..." : "Zoek activiteiten"}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <input
          type="text"
          placeholder="Zoek op naam..."
          value={zoekTerm}
          onChange={(e) => setZoekTerm(e.target.value)}
          className="px-3 py-2 border border-[#D4C6D9] rounded-lg text-sm bg-white focus:border-[#2D1B69] focus:outline-none w-48"
        />
        <select
          value={woonplaatsFilter}
          onChange={(e) => setWoonplaatsFilter(e.target.value)}
          className="px-3 py-2 border border-[#D4C6D9] rounded-lg text-sm bg-white"
        >
          <option value="">Alle woonplaatsen</option>
          {woonplaatsen.map(w => <option key={w} value={w}>{w}</option>)}
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 border border-[#D4C6D9] rounded-lg text-sm bg-white"
        >
          {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>

      {/* Lijst */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2D1B69]" />
        </div>
      ) : (
        <div className="space-y-3">
          {gefilterd.map((a) => (
            <div key={a.id} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                      a.isGevalideerd ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                    }`}>
                      {a.isGevalideerd ? "Gevalideerd" : "Te reviewen"}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[#EDE8F5] text-[#2D1B69]">{a.type}</span>
                  </div>
                  <h3 className="font-semibold text-[#1E1533] mt-1">{a.naam}</h3>
                  {a.beschrijving && <p className="text-sm text-[#5A4D6B] mt-1 line-clamp-2">{a.beschrijving}</p>}
                  <div className="flex flex-wrap gap-3 mt-2 text-xs text-[#5A4D6B]">
                    <span>📍 {a.woonplaats}</span>
                    {a.frequentie && <span>🔄 {a.frequentie}</span>}
                    {a.dag && <span>📅 {a.dag}</span>}
                    {a.tijd && <span>🕐 {a.tijd}</span>}
                    {a.kosten && <span>💰 {a.kosten}</span>}
                  </div>
                </div>
                <button
                  onClick={() => toggleValidatie(a.id, a.isGevalideerd)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                    a.isGevalideerd
                      ? "bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600"
                      : "bg-green-100 text-green-700 hover:bg-green-200"
                  }`}
                >
                  {a.isGevalideerd ? "Intrekken" : "Valideer"}
                </button>
              </div>
            </div>
          ))}
          {gefilterd.length === 0 && (
            <p className="text-center py-8 text-[#5A4D6B]">Geen activiteiten gevonden.</p>
          )}
        </div>
      )}
    </div>
  )
}
