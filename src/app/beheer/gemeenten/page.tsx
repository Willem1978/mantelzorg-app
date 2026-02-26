"use client"

import { useEffect, useState } from "react"
import { AdminSpinner, AdminEmptyState } from "@/components/admin"

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
  mantelzorgSteunpunt: string | null
  mantelzorgSteunpuntNaam: string | null
  respijtzorgUrl: string | null
  dagopvangUrl: string | null
  notities: string | null
  createdAt: string
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
  mantelzorgSteunpunt: "",
  mantelzorgSteunpuntNaam: "",
  respijtzorgUrl: "",
  dagopvangUrl: "",
  notities: "",
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

  const openNieuw = () => {
    setEditId(null)
    setFormulier(LEEG_FORMULIER)
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
      mantelzorgSteunpunt: g.mantelzorgSteunpunt || "",
      mantelzorgSteunpuntNaam: g.mantelzorgSteunpuntNaam || "",
      respijtzorgUrl: g.respijtzorgUrl || "",
      dagopvangUrl: g.dagopvangUrl || "",
      notities: g.notities || "",
    })
    setShowForm(true)
    setFoutmelding("")
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
        <button
          onClick={openNieuw}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          + Gemeente toevoegen
        </button>
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Naam *</label>
              <input
                type="text"
                value={formulier.naam}
                onChange={(e) => setFormulier({ ...formulier, naam: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                placeholder="bijv. Amsterdam"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CBS code</label>
              <input
                type="text"
                value={formulier.code}
                onChange={(e) => setFormulier({ ...formulier, code: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                placeholder="bijv. GM0363"
              />
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

          {/* Advies per niveau */}
          <h3 className="text-sm font-semibold text-gray-700 mb-3 border-b pb-2">Advies per belastingniveau</h3>
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-green-700 mb-1">Advies bij LAAG niveau</label>
              <textarea
                value={formulier.adviesLaag}
                onChange={(e) => setFormulier({ ...formulier, adviesLaag: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                placeholder="Optioneel: specifiek advies voor deze gemeente bij lage belasting"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-amber-700 mb-1">Advies bij GEMIDDELD niveau</label>
              <textarea
                value={formulier.adviesGemiddeld}
                onChange={(e) => setFormulier({ ...formulier, adviesGemiddeld: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                placeholder="Optioneel: specifiek advies voor deze gemeente bij gemiddelde belasting"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-red-700 mb-1">Advies bij HOOG niveau</label>
              <textarea
                value={formulier.adviesHoog}
                onChange={(e) => setFormulier({ ...formulier, adviesHoog: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                placeholder="Optioneel: specifiek advies voor deze gemeente bij hoge belasting"
              />
            </div>
          </div>

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
        <div className="flex items-center gap-3 mt-1">
          {heeftAdvies && (
            <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Advies ingesteld</span>
          )}
          {heeftContact && (
            <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">Contactgegevens</span>
          )}
          {heeftHulpbronnen && (
            <span className="text-xs text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">Hulpbronnen</span>
          )}
          {!heeftAdvies && !heeftContact && !heeftHulpbronnen && (
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
