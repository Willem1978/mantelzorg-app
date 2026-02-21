"use client"

import { useEffect, useState } from "react"

interface Zorgtaak {
  id: string
  taakId: string
  naam: string
  beschrijving: string | null
  categorie: string | null
  emoji: string | null
  icon: string | null
  kort: string | null
  routeLabel: string | null
  groep: string | null
  volgorde: number
  isActief: boolean
  createdAt: string
}

const LEEG_FORMULIER = {
  taakId: "",
  naam: "",
  beschrijving: "",
  categorie: "",
  emoji: "",
  icon: "",
  kort: "",
  routeLabel: "",
  groep: "",
  volgorde: 0,
  isActief: true,
}

export default function ZorgtakenPage() {
  const [items, setItems] = useState<Zorgtaak[]>([])
  const [loading, setLoading] = useState(true)
  const [zoek, setZoek] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [formulier, setFormulier] = useState(LEEG_FORMULIER)
  const [opslaan, setOpslaan] = useState(false)

  const laadItems = async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (zoek) params.set("zoek", zoek)

    try {
      const res = await fetch(`/api/beheer/zorgtaken?${params}`)
      const data = await res.json()
      setItems(data.zorgtaken || [])
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    laadItems()
  }, [])

  const handleNieuw = () => {
    setEditId(null)
    setFormulier(LEEG_FORMULIER)
    setShowForm(true)
  }

  const handleBewerk = (item: Zorgtaak) => {
    setEditId(item.id)
    setFormulier({
      taakId: item.taakId,
      naam: item.naam,
      beschrijving: item.beschrijving || "",
      categorie: item.categorie || "",
      emoji: item.emoji || "",
      icon: item.icon || "",
      kort: item.kort || "",
      routeLabel: item.routeLabel || "",
      groep: item.groep || "",
      volgorde: item.volgorde,
      isActief: item.isActief,
    })
    setShowForm(true)
  }

  const handleOpslaan = async () => {
    setOpslaan(true)
    try {
      const url = editId ? `/api/beheer/zorgtaken/${editId}` : "/api/beheer/zorgtaken"
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
    if (!confirm("Weet je zeker dat je deze zorgtaak wilt verwijderen?")) return

    try {
      await fetch(`/api/beheer/zorgtaken/${id}`, { method: "DELETE" })
      laadItems()
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Zorgtaken</h1>
          <p className="text-gray-500 mt-1">{items.length} zorgtaken</p>
        </div>
        <button
          onClick={handleNieuw}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          + Nieuwe zorgtaak
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={zoek}
            onChange={(e) => setZoek(e.target.value)}
            placeholder="Zoek zorgtaken..."
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
                {editId ? "Zorgtaak bewerken" : "Nieuwe zorgtaak"}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 text-xl">
                x
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Taak ID *</label>
                <input
                  type="text"
                  value={formulier.taakId}
                  onChange={(e) => setFormulier({ ...formulier, taakId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Naam *</label>
                <input
                  type="text"
                  value={formulier.naam}
                  onChange={(e) => setFormulier({ ...formulier, naam: e.target.value })}
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Categorie</label>
                <input
                  type="text"
                  value={formulier.categorie}
                  onChange={(e) => setFormulier({ ...formulier, categorie: e.target.value })}
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
                  placeholder="bijv. 🏠"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Icon</label>
                <input
                  type="text"
                  value={formulier.icon}
                  onChange={(e) => setFormulier({ ...formulier, icon: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kort</label>
                <input
                  type="text"
                  value={formulier.kort}
                  onChange={(e) => setFormulier({ ...formulier, kort: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Route label</label>
                <input
                  type="text"
                  value={formulier.routeLabel}
                  onChange={(e) => setFormulier({ ...formulier, routeLabel: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Groep</label>
                <input
                  type="text"
                  value={formulier.groep}
                  onChange={(e) => setFormulier({ ...formulier, groep: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
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

              <div className="flex items-center pt-6">
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
                disabled={opslaan || !formulier.taakId || !formulier.naam}
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
          <div className="p-8 text-center text-gray-500">Laden...</div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>Geen zorgtaken gevonden</p>
            <button onClick={handleNieuw} className="mt-2 text-blue-600 text-sm hover:underline">
              Maak de eerste zorgtaak aan
            </button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Volgorde</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">TaakId</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Naam</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Beschrijving</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Categorie</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Actief</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">Acties</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500">{item.volgorde}</td>
                  <td className="px-4 py-3 font-mono text-gray-700">{item.taakId}</td>
                  <td className="px-4 py-3 text-gray-900">
                    {item.emoji && <span className="mr-1">{item.emoji}</span>}
                    {item.naam}
                  </td>
                  <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{item.beschrijving}</td>
                  <td className="px-4 py-3">
                    {item.categorie && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                        {item.categorie}
                      </span>
                    )}
                  </td>
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
