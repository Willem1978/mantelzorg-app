"use client"

import { useEffect, useState } from "react"
import { AdminSpinner, AdminEmptyState } from "@/components/admin"

interface IntakeVraag {
  id: string
  categoryId: string
  question: string
  description: string | null
  type: string
  options: any | null
  order: number
  isRequired: boolean
  createdAt: string
}

const categoryOpties = [
  { value: "", label: "Alle categorieen" },
  { value: "PERSOONLIJK", label: "Persoonlijk" },
  { value: "ZORGVRAGER", label: "Zorgvrager" },
  { value: "ZORGSITUATIE", label: "Zorgsituatie" },
  { value: "BELASTING", label: "Belasting" },
  { value: "HULPBEHOEFTE", label: "Hulpbehoefte" },
]

const typeOpties = [
  { value: "SCALE", label: "Schaal" },
  { value: "MULTIPLE_CHOICE", label: "Meerkeuze" },
  { value: "YES_NO", label: "Ja/Nee" },
  { value: "TEXT", label: "Tekst" },
]

const LEEG_FORMULIER = {
  categoryId: "PERSOONLIJK",
  question: "",
  description: "",
  type: "SCALE",
  options: "",
  order: 0,
  isRequired: true,
}

export default function IntakeVragenPage() {
  const [items, setItems] = useState<IntakeVraag[]>([])
  const [loading, setLoading] = useState(true)
  const [filterCategorie, setFilterCategorie] = useState("")
  const [zoek, setZoek] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [formulier, setFormulier] = useState(LEEG_FORMULIER)
  const [opslaan, setOpslaan] = useState(false)

  const laadItems = async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filterCategorie) params.set("categoryId", filterCategorie)
    if (zoek) params.set("zoek", zoek)

    try {
      const res = await fetch(`/api/beheer/intake-vragen?${params}`)
      const data = await res.json()
      setItems(data.vragen || [])
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    laadItems()
  }, [filterCategorie])

  const handleNieuw = () => {
    setEditId(null)
    setFormulier(LEEG_FORMULIER)
    setShowForm(true)
  }

  const handleBewerk = (item: IntakeVraag) => {
    setEditId(item.id)
    setFormulier({
      categoryId: item.categoryId,
      question: item.question,
      description: item.description || "",
      type: item.type,
      options: item.options ? JSON.stringify(item.options, null, 2) : "",
      order: item.order,
      isRequired: item.isRequired,
    })
    setShowForm(true)
  }

  const handleOpslaan = async () => {
    setOpslaan(true)
    try {
      const url = editId ? `/api/beheer/intake-vragen/${editId}` : "/api/beheer/intake-vragen"
      const method = editId ? "PUT" : "POST"

      const body: any = { ...formulier }
      if (body.options) {
        try {
          body.options = JSON.parse(body.options)
        } catch {
          body.options = null
        }
      } else {
        body.options = null
      }

      await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
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
    if (!confirm("Weet je zeker dat je deze intake vraag wilt verwijderen?")) return

    try {
      await fetch(`/api/beheer/intake-vragen/${id}`, { method: "DELETE" })
      laadItems()
    } catch (error) {
      console.error(error)
    }
  }

  const getTypeLabel = (type: string) => {
    const found = typeOpties.find((t) => t.value === type)
    return found ? found.label : type
  }

  const getCategorieLabel = (categoryId: string) => {
    const found = categoryOpties.find((c) => c.value === categoryId)
    return found ? found.label : categoryId
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Intake Vragen</h1>
          <p className="text-gray-500 mt-1">{items.length} vragen</p>
        </div>
        <button
          onClick={handleNieuw}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          + Nieuwe vraag
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-wrap gap-3">
          <select
            value={filterCategorie}
            onChange={(e) => setFilterCategorie(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            {categoryOpties.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <div className="flex-1 flex gap-2">
            <input
              type="text"
              value={zoek}
              onChange={(e) => setZoek(e.target.value)}
              placeholder="Zoek vragen..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm min-w-[200px]"
              onKeyDown={(e) => e.key === "Enter" && laadItems()}
            />
            <button onClick={laadItems} className="px-3 py-2 bg-gray-100 rounded-lg text-sm hover:bg-gray-200">
              Zoek
            </button>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-start justify-center pt-10 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl m-4 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                {editId ? "Vraag bewerken" : "Nieuwe intake vraag"}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 text-xl">
                x
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categorie *</label>
                <select
                  value={formulier.categoryId}
                  onChange={(e) => setFormulier({ ...formulier, categoryId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  {categoryOpties.filter((o) => o.value).map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                <select
                  value={formulier.type}
                  onChange={(e) => setFormulier({ ...formulier, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  {typeOpties.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Vraag *</label>
                <textarea
                  value={formulier.question}
                  onChange={(e) => setFormulier({ ...formulier, question: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  required
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Beschrijving</label>
                <textarea
                  value={formulier.description}
                  onChange={(e) => setFormulier({ ...formulier, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>

              {formulier.type === "MULTIPLE_CHOICE" && (
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Opties (JSON)</label>
                  <textarea
                    value={formulier.options}
                    onChange={(e) => setFormulier({ ...formulier, options: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                    placeholder='[{"label": "Optie 1", "value": "optie1"}, ...]'
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Volgorde</label>
                <input
                  type="number"
                  value={formulier.order}
                  onChange={(e) => setFormulier({ ...formulier, order: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>

              <div className="flex items-center pt-6">
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={formulier.isRequired}
                    onChange={(e) => setFormulier({ ...formulier, isRequired: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  Verplicht
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
                disabled={opslaan || !formulier.question || !formulier.categoryId}
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
          <AdminSpinner tekst="Intake vragen laden..." />
        ) : items.length === 0 ? (
          <AdminEmptyState
            icon="📥"
            titel="Geen intake vragen gevonden"
            actieLabel="Maak de eerste intake vraag aan"
            onActie={handleNieuw}
          />
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Volgorde</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Categorie</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Vraag</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Type</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Verplicht</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">Acties</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500">{item.order}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                      {getCategorieLabel(item.categoryId)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-900 max-w-xs truncate">{item.question}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-700">
                      {getTypeLabel(item.type)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${item.isRequired ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {item.isRequired ? "Verplicht" : "Optioneel"}
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
