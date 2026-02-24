"use client"

import { useEffect, useState } from "react"
import { AdminSpinner, AdminEmptyState } from "@/components/admin"

interface FormulierOptie {
  id: string
  groep: string
  waarde: string
  label: string
  beschrijving: string | null
  emoji: string | null
  volgorde: number
  isActief: boolean
  createdAt: string
}

const tabs = [
  { label: "Relatie", value: "RELATIE" },
  { label: "Uren/week", value: "UREN_PER_WEEK" },
  { label: "Zorgduur", value: "ZORGDUUR" },
  { label: "Uren balanstest", value: "UREN_BALANSTEST" },
  { label: "Buddy hulpvorm", value: "BUDDY_HULPVORM" },
  { label: "Check-in hulp", value: "CHECKIN_HULP" },
]

const LEEG_FORMULIER = {
  groep: "RELATIE",
  waarde: "",
  label: "",
  beschrijving: "",
  emoji: "",
  volgorde: 0,
  isActief: true,
}

export default function FormulierOptiesPage() {
  const [items, setItems] = useState<FormulierOptie[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("RELATIE")
  const [zoek, setZoek] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [formulier, setFormulier] = useState(LEEG_FORMULIER)
  const [opslaan, setOpslaan] = useState(false)

  const laadItems = async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (activeTab) params.set("groep", activeTab)
    if (zoek) params.set("zoek", zoek)

    try {
      const res = await fetch(`/api/beheer/formulier-opties?${params}`)
      const data = await res.json()
      setItems(data.opties || [])
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    laadItems()
  }, [activeTab])

  const handleNieuw = () => {
    setEditId(null)
    setFormulier({ ...LEEG_FORMULIER, groep: activeTab })
    setShowForm(true)
  }

  const handleBewerk = (item: FormulierOptie) => {
    setEditId(item.id)
    setFormulier({
      groep: item.groep,
      waarde: item.waarde,
      label: item.label,
      beschrijving: item.beschrijving || "",
      emoji: item.emoji || "",
      volgorde: item.volgorde,
      isActief: item.isActief,
    })
    setShowForm(true)
  }

  const handleOpslaan = async () => {
    setOpslaan(true)
    try {
      const url = editId ? `/api/beheer/formulier-opties/${editId}` : "/api/beheer/formulier-opties"
      const method = editId ? "PUT" : "POST"

      await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formulier),
      })

      setShowForm(false)
      laadItems()
    } catch (error) {
      console.error(error)
    } finally {
      setOpslaan(false)
    }
  }

  const handleVerwijder = async (id: string) => {
    if (!confirm("Weet je zeker dat je deze optie wilt verwijderen?")) return

    try {
      await fetch(`/api/beheer/formulier-opties/${id}`, { method: "DELETE" })
      laadItems()
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Formulier Opties</h1>
          <p className="text-gray-500 mt-1">{items.length} opties</p>
        </div>
        <button
          onClick={handleNieuw}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          + Nieuwe optie
        </button>
      </div>

      {/* Tabs & Zoek */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-wrap gap-2 mb-3">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.value
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={zoek}
            onChange={(e) => setZoek(e.target.value)}
            placeholder="Zoek opties..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm min-w-[200px]"
            onKeyDown={(e) => e.key === "Enter" && laadItems()}
          />
          <button onClick={laadItems} className="px-3 py-2 bg-gray-100 rounded-lg text-sm hover:bg-gray-200">
            Zoek
          </button>
        </div>
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-start justify-center pt-10 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl m-4 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                {editId ? "Optie bewerken" : "Nieuwe optie"}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 text-xl">
                x
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Groep *</label>
                <select
                  value={formulier.groep}
                  onChange={(e) => setFormulier({ ...formulier, groep: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  {tabs.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Waarde *</label>
                <input
                  type="text"
                  value={formulier.waarde}
                  onChange={(e) => setFormulier({ ...formulier, waarde: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  required
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Label *</label>
                <input
                  type="text"
                  value={formulier.label}
                  onChange={(e) => setFormulier({ ...formulier, label: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  required
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Beschrijving</label>
                <textarea
                  value={formulier.beschrijving}
                  onChange={(e) => setFormulier({ ...formulier, beschrijving: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Emoji</label>
                <input
                  type="text"
                  value={formulier.emoji}
                  onChange={(e) => setFormulier({ ...formulier, emoji: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  placeholder="bijv. 💛"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Volgorde</label>
                <input
                  type="number"
                  value={formulier.volgorde}
                  onChange={(e) => setFormulier({ ...formulier, volgorde: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>

              <div className="flex items-center pt-2">
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={formulier.isActief}
                    onChange={(e) => setFormulier({ ...formulier, isActief: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  Actief
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
              >
                Annuleren
              </button>
              <button
                onClick={handleOpslaan}
                disabled={opslaan || !formulier.waarde || !formulier.label}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {opslaan ? "Opslaan..." : editId ? "Bijwerken" : "Aanmaken"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabel */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <AdminSpinner tekst="Opties laden..." />
        ) : items.length === 0 ? (
          <AdminEmptyState icon="📝" titel="Geen opties gevonden" actieLabel="Nieuwe optie aanmaken" onActie={handleNieuw} />
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Volgorde</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Waarde</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Label</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Beschrijving</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Emoji</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Actief</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">Acties</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500">{item.volgorde}</td>
                  <td className="px-4 py-3 font-mono text-gray-700">{item.waarde}</td>
                  <td className="px-4 py-3 text-gray-900">
                    {item.emoji && <span className="mr-1">{item.emoji}</span>}
                    {item.label}
                  </td>
                  <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{item.beschrijving}</td>
                  <td className="px-4 py-3">{item.emoji || <span className="text-gray-300">-</span>}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${item.isActief ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {item.isActief ? "Actief" : "Inactief"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleBewerk(item)}
                      className="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg"
                    >
                      Bewerk
                    </button>
                    <button
                      onClick={() => handleVerwijder(item.id)}
                      className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      Verwijder
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
