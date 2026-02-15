"use client"

import { useEffect, useState } from "react"

interface Artikel {
  id: string
  titel: string
  beschrijving: string
  inhoud: string | null
  url: string | null
  bron: string | null
  emoji: string | null
  categorie: string
  type: string
  status: string
  belastingNiveau: string
  gemeente: string | null
  publicatieDatum: string | null
  sorteerVolgorde: number
  isActief: boolean
  createdAt: string
}

const categorieOpties = [
  { value: "", label: "Alle categorieen" },
  { value: "praktische-tips", label: "Praktische tips" },
  { value: "zelfzorg", label: "Zelfzorg" },
  { value: "rechten", label: "Rechten" },
  { value: "financieel", label: "Financieel" },
  { value: "gemeentenieuws", label: "Gemeentenieuws" },
]

const typeOpties = [
  { value: "", label: "Alle types" },
  { value: "ARTIKEL", label: "Artikel" },
  { value: "GEMEENTE_NIEUWS", label: "Gemeentenieuws" },
  { value: "TIP", label: "Tip" },
]

const statusOpties = [
  { value: "", label: "Alle statussen" },
  { value: "CONCEPT", label: "Concept" },
  { value: "GEPUBLICEERD", label: "Gepubliceerd" },
  { value: "GEARCHIVEERD", label: "Gearchiveerd" },
]

const LEEG_FORMULIER = {
  titel: "",
  beschrijving: "",
  inhoud: "",
  url: "",
  bron: "",
  emoji: "",
  categorie: "praktische-tips",
  type: "ARTIKEL",
  status: "CONCEPT",
  belastingNiveau: "ALLE",
  gemeente: "",
  publicatieDatum: "",
  sorteerVolgorde: 0,
}

export default function ArtikelenPage() {
  const [artikelen, setArtikelen] = useState<Artikel[]>([])
  const [loading, setLoading] = useState(true)
  const [filterCategorie, setFilterCategorie] = useState("")
  const [filterType, setFilterType] = useState("")
  const [filterStatus, setFilterStatus] = useState("")
  const [zoek, setZoek] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [formulier, setFormulier] = useState(LEEG_FORMULIER)
  const [opslaan, setOpslaan] = useState(false)
  const [gemeenteZoek, setGemeenteZoek] = useState("")
  const [gemeenteOpties, setGemeenteOpties] = useState<string[]>([])
  const [showGemeenteDropdown, setShowGemeenteDropdown] = useState(false)

  const laadArtikelen = async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filterCategorie) params.set("categorie", filterCategorie)
    if (filterType) params.set("type", filterType)
    if (filterStatus) params.set("status", filterStatus)
    if (zoek) params.set("zoek", zoek)

    try {
      const res = await fetch(`/api/beheer/artikelen?${params}`)
      const data = await res.json()
      setArtikelen(data.artikelen || [])
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    laadArtikelen()
  }, [filterCategorie, filterType, filterStatus])

  const zoekGemeenten = async (query: string) => {
    setGemeenteZoek(query)
    if (query.length < 2) {
      setGemeenteOpties([])
      setShowGemeenteDropdown(false)
      return
    }
    try {
      const res = await fetch(`/api/beheer/locatie?type=gemeenten&zoek=${encodeURIComponent(query)}`)
      const data = await res.json()
      setGemeenteOpties(data.gemeenten || [])
      setShowGemeenteDropdown(true)
    } catch {
      setGemeenteOpties([])
    }
  }

  const selecteerGemeente = (gemeente: string) => {
    setFormulier({ ...formulier, gemeente })
    setGemeenteZoek(gemeente)
    setShowGemeenteDropdown(false)
  }

  const handleNieuw = () => {
    setEditId(null)
    setFormulier(LEEG_FORMULIER)
    setGemeenteZoek("")
    setShowForm(true)
  }

  const handleBewerk = (artikel: Artikel) => {
    setEditId(artikel.id)
    setFormulier({
      titel: artikel.titel,
      beschrijving: artikel.beschrijving,
      inhoud: artikel.inhoud || "",
      url: artikel.url || "",
      bron: artikel.bron || "",
      emoji: artikel.emoji || "",
      categorie: artikel.categorie,
      type: artikel.type,
      status: artikel.status,
      belastingNiveau: artikel.belastingNiveau,
      gemeente: artikel.gemeente || "",
      publicatieDatum: artikel.publicatieDatum ? artikel.publicatieDatum.split("T")[0] : "",
      sorteerVolgorde: artikel.sorteerVolgorde,
    })
    setGemeenteZoek(artikel.gemeente || "")
    setShowForm(true)
  }

  const handleOpslaan = async () => {
    setOpslaan(true)
    try {
      const url = editId ? `/api/beheer/artikelen/${editId}` : "/api/beheer/artikelen"
      const method = editId ? "PUT" : "POST"

      await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formulier),
      })

      setShowForm(false)
      laadArtikelen()
    } catch (error) {
      console.error(error)
    } finally {
      setOpslaan(false)
    }
  }

  const handleVerwijder = async (id: string) => {
    if (!confirm("Weet je zeker dat je dit artikel wilt verwijderen?")) return

    try {
      await fetch(`/api/beheer/artikelen/${id}`, { method: "DELETE" })
      laadArtikelen()
    } catch (error) {
      console.error(error)
    }
  }

  const statusKleur: Record<string, string> = {
    CONCEPT: "bg-gray-100 text-gray-700",
    GEPUBLICEERD: "bg-green-100 text-green-700",
    GEARCHIVEERD: "bg-amber-100 text-amber-700",
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Artikelen & Tips</h1>
          <p className="text-gray-500 mt-1">{artikelen.length} artikelen</p>
        </div>
        <button
          onClick={handleNieuw}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          + Nieuw artikel
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
            {categorieOpties.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            {typeOpties.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            {statusOpties.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <div className="flex-1 flex gap-2">
            <input
              type="text"
              value={zoek}
              onChange={(e) => setZoek(e.target.value)}
              placeholder="Zoek artikelen..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm min-w-[200px]"
              onKeyDown={(e) => e.key === "Enter" && laadArtikelen()}
            />
            <button onClick={laadArtikelen} className="px-3 py-2 bg-gray-100 rounded-lg text-sm hover:bg-gray-200">
              Zoek
            </button>
          </div>
        </div>
      </div>

      {/* Artikel formulier modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-start justify-center pt-10 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl m-4 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                {editId ? "Artikel bewerken" : "Nieuw artikel"}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 text-xl">
                x
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Titel *</label>
                <input
                  type="text"
                  value={formulier.titel}
                  onChange={(e) => setFormulier({ ...formulier, titel: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  required
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Beschrijving *</label>
                <textarea
                  value={formulier.beschrijving}
                  onChange={(e) => setFormulier({ ...formulier, beschrijving: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  required
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Uitgebreide inhoud</label>
                <textarea
                  value={formulier.inhoud}
                  onChange={(e) => setFormulier({ ...formulier, inhoud: e.target.value })}
                  rows={5}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  placeholder="Optioneel: uitgebreide artikelinhoud..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categorie *</label>
                <select
                  value={formulier.categorie}
                  onChange={(e) => {
                    const nieuweCat = e.target.value
                    const updates: any = { categorie: nieuweCat }
                    if (nieuweCat === "gemeentenieuws") updates.type = "GEMEENTE_NIEUWS"
                    setFormulier({ ...formulier, ...updates })
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  {categorieOpties.filter((o) => o.value).map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={formulier.type}
                  onChange={(e) => setFormulier({ ...formulier, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  {typeOpties.filter((o) => o.value).map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={formulier.status}
                  onChange={(e) => setFormulier({ ...formulier, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  {statusOpties.filter((o) => o.value).map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Belastingniveau</label>
                <select
                  value={formulier.belastingNiveau}
                  onChange={(e) => setFormulier({ ...formulier, belastingNiveau: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="ALLE">Alle niveaus</option>
                  <option value="LAAG">Laag</option>
                  <option value="GEMIDDELD">Gemiddeld</option>
                  <option value="HOOG">Hoog</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL (extern)</label>
                <input
                  type="url"
                  value={formulier.url}
                  onChange={(e) => setFormulier({ ...formulier, url: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bron</label>
                <input
                  type="text"
                  value={formulier.bron}
                  onChange={(e) => setFormulier({ ...formulier, bron: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  placeholder="bijv. MantelzorgNL"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Emoji</label>
                <input
                  type="text"
                  value={formulier.emoji}
                  onChange={(e) => setFormulier({ ...formulier, emoji: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  placeholder="bijv. 💡"
                />
              </div>

              {formulier.type === "GEMEENTE_NIEUWS" && (
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gemeente *</label>
                  <input
                    type="text"
                    value={gemeenteZoek}
                    onChange={(e) => zoekGemeenten(e.target.value)}
                    onFocus={() => gemeenteZoek.length >= 2 && setShowGemeenteDropdown(true)}
                    onBlur={() => setTimeout(() => setShowGemeenteDropdown(false), 200)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    placeholder="Typ om gemeente te zoeken..."
                  />
                  {formulier.gemeente && (
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                        {formulier.gemeente}
                      </span>
                      <button
                        type="button"
                        onClick={() => { setFormulier({ ...formulier, gemeente: "" }); setGemeenteZoek("") }}
                        className="text-xs text-gray-400 hover:text-red-500"
                      >
                        Verwijder
                      </button>
                    </div>
                  )}
                  {showGemeenteDropdown && gemeenteOpties.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {gemeenteOpties.map((g) => (
                        <button
                          key={g}
                          type="button"
                          onMouseDown={() => selecteerGemeente(g)}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 hover:text-blue-700"
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Publicatiedatum</label>
                <input
                  type="date"
                  value={formulier.publicatieDatum}
                  onChange={(e) => setFormulier({ ...formulier, publicatieDatum: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
                <p className="text-xs text-gray-400 mt-1">Leeg = direct zichtbaar bij publicatie</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sorteervolgorde</label>
                <input
                  type="number"
                  value={formulier.sorteerVolgorde}
                  onChange={(e) => setFormulier({ ...formulier, sorteerVolgorde: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
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
                disabled={opslaan || !formulier.titel || !formulier.beschrijving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {opslaan ? "Opslaan..." : editId ? "Bijwerken" : "Aanmaken"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Artikelen lijst */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Laden...</div>
        ) : artikelen.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>Geen artikelen gevonden</p>
            <button onClick={handleNieuw} className="mt-2 text-blue-600 text-sm hover:underline">
              Maak het eerste artikel aan
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {artikelen.map((artikel) => (
              <div key={artikel.id} className="p-4 hover:bg-gray-50 flex items-start gap-4">
                <span className="text-2xl">{artikel.emoji || "📄"}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-medium text-gray-900">{artikel.titel}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${statusKleur[artikel.status]}`}>
                      {artikel.status}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                      {artikel.categorie}
                    </span>
                    {artikel.type !== "ARTIKEL" && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-700">
                        {artikel.type === "GEMEENTE_NIEUWS" ? `Gemeente${artikel.gemeente ? `: ${artikel.gemeente}` : ""}` : artikel.type}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">{artikel.beschrijving}</p>
                  {artikel.publicatieDatum && (
                    <span className="text-xs text-gray-400">
                      Publicatie: {new Date(artikel.publicatieDatum).toLocaleDateString("nl-NL")}
                    </span>
                  )}
                  {artikel.bron && (
                    <p className="text-xs text-gray-400 mt-1">Bron: {artikel.bron}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleBewerk(artikel)}
                    className="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg"
                  >
                    Bewerk
                  </button>
                  <button
                    onClick={() => handleVerwijder(artikel.id)}
                    className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    Verwijder
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
