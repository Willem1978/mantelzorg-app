"use client"

import { useEffect, useState } from "react"
import { AdminSpinner, AdminEmptyState } from "@/components/admin"

interface ContentCategorie {
  id: string
  type: string
  slug: string
  naam: string
  beschrijving: string | null
  emoji: string | null
  icon: string | null
  hint: string | null
  parentId: string | null
  parent?: ContentCategorie | null
  metadata: any | null
  volgorde: number
  isActief: boolean
  createdAt: string
}

const tabs = [
  { label: "Leren", value: "LEREN" },
  { label: "Sub-hoofdstuk", value: "SUB_HOOFDSTUK" },
  { label: "Hulpvraag", value: "HULPVRAAG" },
  { label: "Zorgvrager", value: "ZORGVRAGER" },
  { label: "Mantelzorger", value: "MANTELZORGER" },
]

const LEEG_FORMULIER = {
  type: "LEREN",
  slug: "",
  naam: "",
  beschrijving: "",
  emoji: "",
  icon: "",
  hint: "",
  parentId: "",
  metadata: "",
  volgorde: 0,
  isActief: true,
}

export default function CategorieenPage() {
  const [items, setItems] = useState<ContentCategorie[]>([])
  const [alleItems, setAlleItems] = useState<ContentCategorie[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("LEREN")
  const [zoek, setZoek] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [formulier, setFormulier] = useState(LEEG_FORMULIER)
  const [opslaan, setOpslaan] = useState(false)

  const laadItems = async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (activeTab) params.set("type", activeTab)
    if (zoek) params.set("zoek", zoek)

    try {
      const res = await fetch(`/api/beheer/content-categorieen?${params}`)
      const data = await res.json()
      setItems(data.categorieen || [])
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const laadAlleItems = async () => {
    try {
      const res = await fetch(`/api/beheer/content-categorieen`)
      const data = await res.json()
      setAlleItems(data.categorieen || [])
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    laadItems()
  }, [activeTab])

  useEffect(() => {
    laadAlleItems()
  }, [])

  const handleNieuw = () => {
    setEditId(null)
    setFormulier({ ...LEEG_FORMULIER, type: activeTab })
    setShowForm(true)
  }

  const handleBewerk = (item: ContentCategorie) => {
    setEditId(item.id)
    setFormulier({
      type: item.type,
      slug: item.slug,
      naam: item.naam,
      beschrijving: item.beschrijving || "",
      emoji: item.emoji || "",
      icon: item.icon || "",
      hint: item.hint || "",
      parentId: item.parentId || "",
      metadata: item.metadata ? JSON.stringify(item.metadata, null, 2) : "",
      volgorde: item.volgorde,
      isActief: item.isActief,
    })
    setShowForm(true)
  }

  const handleOpslaan = async () => {
    setOpslaan(true)
    try {
      const url = editId ? `/api/beheer/content-categorieen/${editId}` : "/api/beheer/content-categorieen"
      const method = editId ? "PUT" : "POST"

      const body: any = { ...formulier }
      if (body.metadata) {
        try {
          body.metadata = JSON.parse(body.metadata)
        } catch {
          body.metadata = null
        }
      } else {
        body.metadata = null
      }
      if (!body.parentId) body.parentId = null

      await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      setShowForm(false)
      laadItems()
      laadAlleItems()
    } catch (error) {
      console.error(error)
    } finally {
      setOpslaan(false)
    }
  }

  const handleVerwijder = async (id: string) => {
    if (!confirm("Weet je zeker dat je deze categorie wilt verwijderen?")) return

    try {
      await fetch(`/api/beheer/content-categorieen/${id}`, { method: "DELETE" })
      laadItems()
      laadAlleItems()
    } catch (error) {
      console.error(error)
    }
  }

  const getParentNaam = (parentId: string | null) => {
    if (!parentId) return null
    const parent = alleItems.find((i) => i.id === parentId)
    return parent ? parent.naam : parentId
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Content Categorieen</h1>
          <p className="text-gray-500 mt-1">{items.length} categorieen</p>
        </div>
        <button
          onClick={handleNieuw}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          + Nieuwe categorie
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
            placeholder="Zoek categorieen..."
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
                {editId ? "Categorie bewerken" : "Nieuwe categorie"}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 text-xl">
                x
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                <select
                  value={formulier.type}
                  onChange={(e) => setFormulier({ ...formulier, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  {tabs.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slug *</label>
                <input
                  type="text"
                  value={formulier.slug}
                  onChange={(e) => setFormulier({ ...formulier, slug: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  required
                />
              </div>

              <div className="col-span-2">
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Emoji</label>
                <input
                  type="text"
                  value={formulier.emoji}
                  onChange={(e) => setFormulier({ ...formulier, emoji: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  placeholder="bijv. 📚"
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

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Hint</label>
                <input
                  type="text"
                  value={formulier.hint}
                  onChange={(e) => setFormulier({ ...formulier, hint: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Parent categorie</label>
                <select
                  value={formulier.parentId}
                  onChange={(e) => setFormulier({ ...formulier, parentId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="">Geen parent</option>
                  {alleItems
                    .filter((i) => i.id !== editId)
                    .map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.emoji ? `${i.emoji} ` : ""}{i.naam} ({i.type})
                      </option>
                    ))}
                </select>
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

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Metadata (JSON)</label>
                <textarea
                  value={formulier.metadata}
                  onChange={(e) => setFormulier({ ...formulier, metadata: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                  placeholder='{"key": "value"}'
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
                disabled={opslaan || !formulier.slug || !formulier.naam}
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
          <AdminSpinner tekst="Categorieën laden..." />
        ) : items.length === 0 ? (
          <AdminEmptyState icon="🗂️" titel="Geen categorieën gevonden" actieLabel="Nieuwe categorie aanmaken" onActie={handleNieuw} />
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Volgorde</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Slug</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Naam</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Beschrijving</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Emoji/Icon</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Parent</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Actief</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">Acties</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500">{item.volgorde}</td>
                  <td className="px-4 py-3 font-mono text-gray-700">{item.slug}</td>
                  <td className="px-4 py-3 text-gray-900">{item.naam}</td>
                  <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{item.beschrijving}</td>
                  <td className="px-4 py-3">
                    {item.emoji && <span className="mr-1">{item.emoji}</span>}
                    {item.icon && <span className="text-gray-400 text-xs">{item.icon}</span>}
                    {!item.emoji && !item.icon && <span className="text-gray-300">-</span>}
                  </td>
                  <td className="px-4 py-3">
                    {item.parentId ? (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-700">
                        {getParentNaam(item.parentId)}
                      </span>
                    ) : (
                      <span className="text-gray-300">-</span>
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
