"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { AdminSpinner, AdminEmptyState } from "@/components/admin"

const PDOK_BASE_URL = "https://api.pdok.nl/bzk/locatieserver/search/v3_1"

interface Gemeente {
  id: string
  naam: string
  code: string | null
  isActief: boolean
  contactEmail: string | null
  contactTelefoon: string | null
  websiteUrl: string | null
  wmoLoketUrl: string | null
  adviesLaag: string | null
  adviesGemiddeld: string | null
  adviesHoog: string | null
  organisatieLaagId: string | null
  organisatieGemiddeldId: string | null
  organisatieHoogId: string | null
  mantelzorgSteunpunt: string | null
  mantelzorgSteunpuntNaam: string | null
  respijtzorgUrl: string | null
  dagopvangUrl: string | null
  notities: string | null
  createdAt: string
}

interface Organisatie {
  id: string
  naam: string
  type: string
  dienst: string | null
}

interface PdokGemeente {
  naam: string
  code: string
}

const LEEG_FORMULIER = {
  naam: "",
  code: "",
  isActief: true,
  contactEmail: "",
  contactTelefoon: "",
  websiteUrl: "",
  wmoLoketUrl: "",
  adviesLaag: "",
  adviesGemiddeld: "",
  adviesHoog: "",
  organisatieLaagId: "",
  organisatieGemiddeldId: "",
  organisatieHoogId: "",
  mantelzorgSteunpunt: "",
  mantelzorgSteunpuntNaam: "",
  respijtzorgUrl: "",
  dagopvangUrl: "",
  notities: "",
}

// PDOK gemeente autocomplete search
async function zoekGemeentenPdok(query: string): Promise<PdokGemeente[]> {
  if (!query || query.length < 2) return []
  try {
    const params = new URLSearchParams({
      q: `${query}*`,
      fq: "type:gemeente",
      rows: "10",
      sort: "score desc,gemeentenaam asc",
    })
    const res = await fetch(`${PDOK_BASE_URL}/free?${params}`)
    if (!res.ok) return []
    const data = await res.json()
    const results: PdokGemeente[] = (data.response?.docs || [])
      .map((doc: any) => ({
        naam: doc.gemeentenaam as string,
        code: doc.gemeentecode as string,
      }))
      .filter((g: PdokGemeente) => g.naam)
    // Deduplicate by naam
    const seen = new Set<string>()
    return results.filter((g) => {
      if (seen.has(g.naam)) return false
      seen.add(g.naam)
      return true
    })
  } catch {
    return []
  }
}

export default function GemeentenPage() {
  const [items, setItems] = useState<Gemeente[]>([])
  const [loading, setLoading] = useState(true)
  const [zoek, setZoek] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [formulier, setFormulier] = useState(LEEG_FORMULIER)
  const [opslaan, setOpslaan] = useState(false)
  const [foutmelding, setFoutmelding] = useState("")

  // PDOK autocomplete state
  const [pdokSuggesties, setPdokSuggesties] = useState<PdokGemeente[]>([])
  const [pdokOpen, setPdokOpen] = useState(false)
  const [pdokLoading, setPdokLoading] = useState(false)
  const pdokTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pdokWrapperRef = useRef<HTMLDivElement>(null)

  // Organisatie state
  const [organisaties, setOrganisaties] = useState<Organisatie[]>([])
  const [orgLoading, setOrgLoading] = useState(false)

  const laadItems = async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (zoek) params.set("zoek", zoek)
    try {
      const res = await fetch(`/api/beheer/gemeenten?${params}`)
      const data = await res.json()
      setItems(data.gemeenten || [])
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { laadItems() }, [zoek])

  // Laad organisaties voor de huidige gemeente (als er een naam ingevuld is)
  const laadOrganisaties = useCallback(async (gemeenteNaam: string) => {
    if (!gemeenteNaam.trim()) {
      setOrganisaties([])
      return
    }
    setOrgLoading(true)
    try {
      const params = new URLSearchParams({ gemeente: gemeenteNaam })
      const res = await fetch(`/api/beheer/hulpbronnen?${params}`)
      const data = await res.json()
      setOrganisaties(
        (data.hulpbronnen || []).map((o: any) => ({
          id: o.id,
          naam: o.naam,
          type: o.type,
          dienst: o.dienst || null,
        }))
      )
    } catch {
      setOrganisaties([])
    } finally {
      setOrgLoading(false)
    }
  }, [])

  // PDOK zoeken bij typing in naam-veld
  const handleNaamChange = (value: string) => {
    setFormulier((f) => ({ ...f, naam: value }))
    if (pdokTimerRef.current) clearTimeout(pdokTimerRef.current)
    if (value.length >= 2) {
      setPdokLoading(true)
      pdokTimerRef.current = setTimeout(async () => {
        const results = await zoekGemeentenPdok(value)
        setPdokSuggesties(results)
        setPdokOpen(results.length > 0)
        setPdokLoading(false)
      }, 300)
    } else {
      setPdokSuggesties([])
      setPdokOpen(false)
      setPdokLoading(false)
    }
  }

  const selecteerPdokGemeente = (g: PdokGemeente) => {
    setFormulier((f) => ({ ...f, naam: g.naam, code: g.code }))
    setPdokOpen(false)
    setPdokSuggesties([])
    // Laad organisaties voor de geselecteerde gemeente
    laadOrganisaties(g.naam)
  }

  // Sluit PDOK dropdown bij klik buiten
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (pdokWrapperRef.current && !pdokWrapperRef.current.contains(e.target as Node)) {
        setPdokOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const openNieuw = () => {
    setEditId(null)
    setFormulier(LEEG_FORMULIER)
    setOrganisaties([])
    setShowForm(true)
    setFoutmelding("")
  }

  const openBewerk = (g: Gemeente) => {
    setEditId(g.id)
    setFormulier({
      naam: g.naam,
      code: g.code || "",
      isActief: g.isActief,
      contactEmail: g.contactEmail || "",
      contactTelefoon: g.contactTelefoon || "",
      websiteUrl: g.websiteUrl || "",
      wmoLoketUrl: g.wmoLoketUrl || "",
      adviesLaag: g.adviesLaag || "",
      adviesGemiddeld: g.adviesGemiddeld || "",
      adviesHoog: g.adviesHoog || "",
      organisatieLaagId: g.organisatieLaagId || "",
      organisatieGemiddeldId: g.organisatieGemiddeldId || "",
      organisatieHoogId: g.organisatieHoogId || "",
      mantelzorgSteunpunt: g.mantelzorgSteunpunt || "",
      mantelzorgSteunpuntNaam: g.mantelzorgSteunpuntNaam || "",
      respijtzorgUrl: g.respijtzorgUrl || "",
      dagopvangUrl: g.dagopvangUrl || "",
      notities: g.notities || "",
    })
    setShowForm(true)
    setFoutmelding("")
    // Laad organisaties voor deze gemeente
    laadOrganisaties(g.naam)
  }

  const handleOpslaan = async () => {
    if (!formulier.naam.trim()) {
      setFoutmelding("Gemeente naam is verplicht")
      return
    }
    setOpslaan(true)
    setFoutmelding("")
    try {
      const url = editId ? `/api/beheer/gemeenten/${editId}` : "/api/beheer/gemeenten"
      const method = editId ? "PUT" : "POST"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formulier),
      })
      if (res.ok) {
        setShowForm(false)
        laadItems()
      } else {
        const data = await res.json()
        setFoutmelding(data.error || "Opslaan mislukt")
      }
    } catch {
      setFoutmelding("Er ging iets mis")
    } finally {
      setOpslaan(false)
    }
  }

  const handleVerwijder = async (id: string, naam: string) => {
    if (!confirm(`Weet je zeker dat je "${naam}" wilt verwijderen?`)) return
    try {
      await fetch(`/api/beheer/gemeenten/${id}`, { method: "DELETE" })
      laadItems()
    } catch {
      // negeer
    }
  }

  if (loading) return <AdminSpinner tekst="Gemeenten laden..." />

  const actief = items.filter((g) => g.isActief)
  const inactief = items.filter((g) => !g.isActief)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gemeenten</h1>
          <p className="text-gray-500 mt-1">
            Beheer gemeenten en hun specifieke content en advies
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/beheer/gemeenten/nieuw"
            className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
          >
            Wizard
          </Link>
          <button
            onClick={openNieuw}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            + Snel toevoegen
          </button>
        </div>
      </div>

      {/* Zoek */}
      <input
        type="text"
        placeholder="Zoek gemeente..."
        value={zoek}
        onChange={(e) => setZoek(e.target.value)}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {/* Formulier */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {editId ? "Gemeente bewerken" : "Nieuwe gemeente"}
          </h2>

          {foutmelding && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {foutmelding}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 mb-6">
            {/* Naam met PDOK autocomplete */}
            <div ref={pdokWrapperRef} className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">Naam *</label>
              <div className="relative">
                <input
                  type="text"
                  value={formulier.naam}
                  onChange={(e) => handleNaamChange(e.target.value)}
                  onFocus={() => { if (pdokSuggesties.length > 0) setPdokOpen(true) }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm pr-8"
                  placeholder="Typ om te zoeken via PDOK..."
                  autoComplete="off"
                />
                {pdokLoading && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2">
                    <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
              {/* PDOK dropdown */}
              {pdokOpen && pdokSuggesties.length > 0 && (
                <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {pdokSuggesties.map((g) => (
                    <button
                      key={g.code + g.naam}
                      type="button"
                      onClick={() => selecteerPdokGemeente(g)}
                      className="w-full text-left px-3 py-2 hover:bg-blue-50 text-sm flex items-center justify-between gap-2"
                    >
                      <span className="font-medium text-gray-900">{g.naam}</span>
                      <span className="text-xs text-gray-400 font-mono shrink-0">{g.code}</span>
                    </button>
                  ))}
                  <div className="px-3 py-1.5 text-[10px] text-gray-400 border-t border-gray-100">
                    Bron: PDOK Locatieserver
                  </div>
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CBS code</label>
              <input
                type="text"
                value={formulier.code}
                onChange={(e) => setFormulier({ ...formulier, code: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50"
                placeholder="Wordt automatisch ingevuld"
                readOnly={!!formulier.code && formulier.naam.length > 0}
              />
              {formulier.code && (
                <p className="text-[10px] text-gray-400 mt-0.5">Automatisch ingevuld via PDOK</p>
              )}
            </div>
          </div>

          {/* Contactgegevens */}
          <h3 className="text-sm font-semibold text-gray-700 mb-3 border-b pb-2">Contactgegevens</h3>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
              <input
                type="email"
                value={formulier.contactEmail}
                onChange={(e) => setFormulier({ ...formulier, contactEmail: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telefoon</label>
              <input
                type="text"
                value={formulier.contactTelefoon}
                onChange={(e) => setFormulier({ ...formulier, contactTelefoon: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
              <input
                type="url"
                value={formulier.websiteUrl}
                onChange={(e) => setFormulier({ ...formulier, websiteUrl: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">WMO loket URL</label>
              <input
                type="url"
                value={formulier.wmoLoketUrl}
                onChange={(e) => setFormulier({ ...formulier, wmoLoketUrl: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
          </div>

          {/* Hulpbronnen */}
          <h3 className="text-sm font-semibold text-gray-700 mb-3 border-b pb-2">Hulpbronnen</h3>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mantelzorgsteunpunt naam</label>
              <input
                type="text"
                value={formulier.mantelzorgSteunpuntNaam}
                onChange={(e) => setFormulier({ ...formulier, mantelzorgSteunpuntNaam: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mantelzorgsteunpunt URL</label>
              <input
                type="url"
                value={formulier.mantelzorgSteunpunt}
                onChange={(e) => setFormulier({ ...formulier, mantelzorgSteunpunt: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Respijtzorg URL</label>
              <input
                type="url"
                value={formulier.respijtzorgUrl}
                onChange={(e) => setFormulier({ ...formulier, respijtzorgUrl: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dagopvang URL</label>
              <input
                type="url"
                value={formulier.dagopvangUrl}
                onChange={(e) => setFormulier({ ...formulier, dagopvangUrl: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
          </div>

          {/* Advies per niveau + organisatie koppeling */}
          <h3 className="text-sm font-semibold text-gray-700 mb-3 border-b pb-2">
            Advies en organisatie per belastingniveau
          </h3>

          {!formulier.naam.trim() && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
              Selecteer eerst een gemeente via PDOK om organisaties te kunnen koppelen.
            </div>
          )}

          <div className="space-y-4 mb-6">
            {/* LAAG */}
            <div className="p-4 rounded-lg border border-green-200 bg-green-50/50">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-sm font-semibold text-green-800">LAAG niveau</span>
              </div>
              <textarea
                value={formulier.adviesLaag}
                onChange={(e) => setFormulier({ ...formulier, adviesLaag: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-2"
                placeholder="Optioneel: specifiek advies bij lage belasting"
              />
              <label className="block text-xs font-medium text-green-700 mb-1">Gekoppelde organisatie</label>
              <select
                value={formulier.organisatieLaagId}
                onChange={(e) => setFormulier({ ...formulier, organisatieLaagId: e.target.value })}
                disabled={!formulier.naam.trim() || orgLoading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">-- Geen organisatie --</option>
                {organisaties.map((o) => (
                  <option key={o.id} value={o.id}>{o.naam}{o.dienst ? ` — ${o.dienst}` : ''}</option>
                ))}
              </select>
            </div>

            {/* GEMIDDELD */}
            <div className="p-4 rounded-lg border border-amber-200 bg-amber-50/50">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="text-sm font-semibold text-amber-800">GEMIDDELD niveau</span>
              </div>
              <textarea
                value={formulier.adviesGemiddeld}
                onChange={(e) => setFormulier({ ...formulier, adviesGemiddeld: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-2"
                placeholder="Optioneel: specifiek advies bij gemiddelde belasting"
              />
              <label className="block text-xs font-medium text-amber-700 mb-1">Gekoppelde organisatie</label>
              <select
                value={formulier.organisatieGemiddeldId}
                onChange={(e) => setFormulier({ ...formulier, organisatieGemiddeldId: e.target.value })}
                disabled={!formulier.naam.trim() || orgLoading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">-- Geen organisatie --</option>
                {organisaties.map((o) => (
                  <option key={o.id} value={o.id}>{o.naam}{o.dienst ? ` — ${o.dienst}` : ''}</option>
                ))}
              </select>
            </div>

            {/* HOOG */}
            <div className="p-4 rounded-lg border border-red-200 bg-red-50/50">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-sm font-semibold text-red-800">HOOG niveau</span>
              </div>
              <textarea
                value={formulier.adviesHoog}
                onChange={(e) => setFormulier({ ...formulier, adviesHoog: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-2"
                placeholder="Optioneel: specifiek advies bij hoge belasting"
              />
              <label className="block text-xs font-medium text-red-700 mb-1">Gekoppelde organisatie</label>
              <select
                value={formulier.organisatieHoogId}
                onChange={(e) => setFormulier({ ...formulier, organisatieHoogId: e.target.value })}
                disabled={!formulier.naam.trim() || orgLoading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">-- Geen organisatie --</option>
                {organisaties.map((o) => (
                  <option key={o.id} value={o.id}>{o.naam}{o.dienst ? ` — ${o.dienst}` : ''}</option>
                ))}
              </select>
            </div>
          </div>

          {orgLoading && (
            <p className="text-xs text-gray-500 mb-4">Organisaties laden...</p>
          )}

          {/* Notities + status */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Notities</label>
            <textarea
              value={formulier.notities}
              onChange={(e) => setFormulier({ ...formulier, notities: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              placeholder="Interne notities over deze gemeente"
            />
          </div>

          <div className="flex items-center gap-4 mb-6">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={formulier.isActief}
                onChange={(e) => setFormulier({ ...formulier, isActief: e.target.checked })}
                className="rounded border-gray-300"
              />
              Actief
            </label>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleOpslaan}
              disabled={opslaan}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {opslaan ? "Opslaan..." : editId ? "Bijwerken" : "Toevoegen"}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
            >
              Annuleren
            </button>
          </div>
        </div>
      )}

      {/* Actieve gemeenten */}
      {actief.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">
              Actieve gemeenten ({actief.length})
            </h2>
          </div>
          <div className="divide-y divide-gray-100">
            {actief.map((g) => (
              <GemeenteRij key={g.id} gemeente={g} onEdit={openBewerk} onDelete={handleVerwijder} />
            ))}
          </div>
        </div>
      )}

      {/* Inactieve gemeenten */}
      {inactief.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 opacity-75">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-500">
              Inactieve gemeenten ({inactief.length})
            </h2>
          </div>
          <div className="divide-y divide-gray-100">
            {inactief.map((g) => (
              <GemeenteRij key={g.id} gemeente={g} onEdit={openBewerk} onDelete={handleVerwijder} />
            ))}
          </div>
        </div>
      )}

      {items.length === 0 && !showForm && (
        <AdminEmptyState
          titel="Nog geen gemeenten"
          beschrijving="Voeg gemeenten toe om per gemeente advies en content in te richten."
          actieLabel="Eerste gemeente toevoegen"
          onActie={openNieuw}
        />
      )}
    </div>
  )
}

function GemeenteRij({
  gemeente: g,
  onEdit,
  onDelete,
}: {
  gemeente: Gemeente
  onEdit: (g: Gemeente) => void
  onDelete: (id: string, naam: string) => void
}) {
  const heeftAdvies = g.adviesLaag || g.adviesGemiddeld || g.adviesHoog
  const heeftContact = g.contactEmail || g.contactTelefoon || g.websiteUrl
  const heeftHulpbronnen = g.mantelzorgSteunpunt || g.respijtzorgUrl || g.dagopvangUrl
  const heeftOrganisaties = g.organisatieLaagId || g.organisatieGemiddeldId || g.organisatieHoogId

  return (
    <div className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3">
          <span className="font-medium text-gray-900">{g.naam}</span>
          {g.code && (
            <span className="text-xs text-gray-400 font-mono">{g.code}</span>
          )}
          {!g.isActief && (
            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Inactief</span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-1 flex-wrap">
          {heeftAdvies && (
            <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Advies ingesteld</span>
          )}
          {heeftContact && (
            <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">Contactgegevens</span>
          )}
          {heeftHulpbronnen && (
            <span className="text-xs text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">Hulpbronnen</span>
          )}
          {heeftOrganisaties && (
            <span className="text-xs text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">Organisaties gekoppeld</span>
          )}
          {!heeftAdvies && !heeftContact && !heeftHulpbronnen && !heeftOrganisaties && (
            <span className="text-xs text-gray-400">Nog niet ingericht</span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onEdit(g)}
          className="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg"
        >
          Bewerken
        </button>
        <button
          onClick={() => onDelete(g.id, g.naam)}
          className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg"
        >
          Verwijder
        </button>
      </div>
    </div>
  )
}
