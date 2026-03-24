"use client"

import { useEffect, useState, useMemo } from "react"
import dynamic from "next/dynamic"
import { AdminSpinner, AdminEmptyState } from "@/components/admin"
import { useToast } from "@/components/ui/Toast"
import { ARTIKEL_CATEGORIEEN, ARTIKEL_TYPES, ARTIKEL_STATUSSEN, ARTIKEL_SUB_HOOFDSTUKKEN, BRON_LABELS } from "@/config/options"
import { berekenCompleteness, getCompletenessBadge } from "@/lib/artikel-completeness"

// Lazy-load rich text editor (SSR niet nodig)
const RichTextEditor = dynamic(
  () => import("@/components/ui/RichTextEditor").then((mod) => mod.RichTextEditor),
  { ssr: false, loading: () => <div className="h-[200px] bg-gray-50 rounded-lg animate-pulse" /> }
)

interface Artikel {
  id: string
  titel: string
  beschrijving: string
  inhoud: string | null
  url: string | null
  bron: string | null
  emoji: string | null
  categorie: string
  subHoofdstuk: string | null
  bronLabel: string | null
  type: string
  status: string
  gemeente: string | null
  publicatieDatum: string | null
  sorteerVolgorde: number
  isActief: boolean
  createdAt: string
  tagIds?: string[]
  tagNamen?: string[]
}

interface ContentTag {
  id: string
  type: string
  slug: string
  naam: string
  emoji: string | null
}

const categorieOpties = [
  { value: "", label: "Alle categorieen" },
  ...ARTIKEL_CATEGORIEEN,
]

// Sub-hoofdstuk opties per categorie (uit centraal config)
const subHoofdstukOpties = ARTIKEL_SUB_HOOFDSTUKKEN

const bronLabelOpties = [...BRON_LABELS]

const typeOpties = [
  { value: "", label: "Alle types" },
  ...ARTIKEL_TYPES,
]

const statusOpties = [
  { value: "", label: "Alle statussen" },
  ...ARTIKEL_STATUSSEN,
]

const LEEG_FORMULIER = {
  titel: "",
  beschrijving: "",
  inhoud: "",
  url: "",
  bron: "",
  emoji: "",
  categorie: "dagelijks-zorgen",
  subHoofdstuk: "",
  bronLabel: "",
  type: "ARTIKEL",
  status: "CONCEPT",
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
  const [beschikbareTags, setBeschikbareTags] = useState<{ zorgthemas: ContentTag[]; situaties: ContentTag[]; onderwerpen: ContentTag[] }>({ zorgthemas: [], situaties: [], onderwerpen: [] })
  const [geselecteerdeTags, setGeselecteerdeTags] = useState<string[]>([])
  const [tagSuggestieLoading, setTagSuggestieLoading] = useState(false)
  const [filterCompleteness, setFilterCompleteness] = useState<"" | "incompleet" | "gedeeltelijk" | "compleet">("")
  const { showSuccess, showError } = useToast()

  // D.4: Completeness stats
  const completenessStats = useMemo(() => {
    if (artikelen.length === 0) return null
    const scores = artikelen.map((a) => {
      const tagCount = a.tagIds?.length || 0
      return berekenCompleteness({ ...a, tagCount }).score
    })
    const gemiddeld = Math.round(scores.reduce((s, v) => s + v, 0) / scores.length)
    const compleet = scores.filter((s) => s > 80).length
    const gedeeltelijk = scores.filter((s) => s >= 50 && s <= 80).length
    const incompleet = scores.filter((s) => s < 50).length
    return { gemiddeld, compleet, gedeeltelijk, incompleet }
  }, [artikelen])

  // Filter artikelen op completeness
  const gefilterd = useMemo(() => {
    if (!filterCompleteness) return artikelen
    return artikelen.filter((a) => {
      const score = berekenCompleteness({ ...a, tagCount: a.tagIds?.length || 0 }).score
      if (filterCompleteness === "compleet") return score > 80
      if (filterCompleteness === "gedeeltelijk") return score >= 50 && score <= 80
      return score < 50
    })
  }, [artikelen, filterCompleteness])

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

  useEffect(() => {
    fetch("/api/content/tags")
      .then((r) => r.json())
      .then((data) => setBeschikbareTags(data))
      .catch(() => {})
  }, [])

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
    setGeselecteerdeTags([])
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
      subHoofdstuk: artikel.subHoofdstuk || "",
      bronLabel: artikel.bronLabel || "",
      type: artikel.type,
      status: artikel.status,
      gemeente: artikel.gemeente || "",
      publicatieDatum: artikel.publicatieDatum ? artikel.publicatieDatum.split("T")[0] : "",
      sorteerVolgorde: artikel.sorteerVolgorde,
    })
    setGeselecteerdeTags(artikel.tagIds || [])
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
        body: JSON.stringify({ ...formulier, tagIds: geselecteerdeTags }),
      })

      setShowForm(false)
      showSuccess(editId ? "Artikel bijgewerkt" : "Artikel aangemaakt")
      laadArtikelen()
    } catch (error) {
      console.error(error)
      showError("Er ging iets mis. Probeer het opnieuw.")
    } finally {
      setOpslaan(false)
    }
  }

  const handleVerwijder = async (id: string) => {
    if (!confirm("Weet je zeker dat je dit artikel wilt verwijderen?")) return

    try {
      await fetch(`/api/beheer/artikelen/${id}`, { method: "DELETE" })
      showSuccess("Artikel verwijderd")
      laadArtikelen()
    } catch (error) {
      console.error(error)
      showError("Er ging iets mis. Probeer het opnieuw.")
    }
  }

  const toggleTag = (tagId: string) => {
    setGeselecteerdeTags((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    )
  }

  const suggereerTags = async () => {
    if (!formulier.titel && !formulier.beschrijving) {
      showError("Vul eerst een titel en beschrijving in")
      return
    }
    setTagSuggestieLoading(true)
    try {
      const res = await fetch("/api/ai/admin/tag-suggestie", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titel: formulier.titel,
          beschrijving: formulier.beschrijving,
          inhoud: formulier.inhoud,
          categorie: formulier.categorie,
        }),
      })
      const data = await res.json()
      if (data.tagIds?.length > 0) {
        setGeselecteerdeTags((prev) => [...new Set([...prev, ...data.tagIds])])
        showSuccess(`${data.tagIds.length} tags gesuggereerd`)
      } else {
        showError("Geen relevante tags gevonden")
      }
    } catch {
      showError("Tag-suggestie mislukt")
    } finally {
      setTagSuggestieLoading(false)
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

      {/* D.4: Content-gezondheid overzicht */}
      {completenessStats && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-6 flex-wrap">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{artikelen.length}</p>
              <p className="text-xs text-gray-500">artikelen</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{completenessStats.gemiddeld}%</p>
              <p className="text-xs text-gray-500">gem. compleet</p>
            </div>
            <button
              onClick={() => setFilterCompleteness(filterCompleteness === "compleet" ? "" : "compleet")}
              className={`text-center px-3 py-1 rounded-lg ${filterCompleteness === "compleet" ? "bg-green-100 ring-2 ring-green-400" : "hover:bg-green-50"}`}
            >
              <p className="text-2xl font-bold text-green-600">{completenessStats.compleet}</p>
              <p className="text-xs text-gray-500">compleet</p>
            </button>
            <button
              onClick={() => setFilterCompleteness(filterCompleteness === "gedeeltelijk" ? "" : "gedeeltelijk")}
              className={`text-center px-3 py-1 rounded-lg ${filterCompleteness === "gedeeltelijk" ? "bg-amber-100 ring-2 ring-amber-400" : "hover:bg-amber-50"}`}
            >
              <p className="text-2xl font-bold text-amber-600">{completenessStats.gedeeltelijk}</p>
              <p className="text-xs text-gray-500">gedeeltelijk</p>
            </button>
            <button
              onClick={() => setFilterCompleteness(filterCompleteness === "incompleet" ? "" : "incompleet")}
              className={`text-center px-3 py-1 rounded-lg ${filterCompleteness === "incompleet" ? "bg-red-100 ring-2 ring-red-400" : "hover:bg-red-50"}`}
            >
              <p className="text-2xl font-bold text-red-600">{completenessStats.incompleet}</p>
              <p className="text-xs text-gray-500">incompleet</p>
            </button>
          </div>
        </div>
      )}

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
                <RichTextEditor
                  content={formulier.inhoud}
                  onChange={(html) => setFormulier({ ...formulier, inhoud: html })}
                  placeholder="Schrijf hier de uitgebreide artikelinhoud..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categorie *</label>
                <select
                  value={formulier.categorie}
                  onChange={(e) => {
                    const nieuweCat = e.target.value
                    const updates: any = { categorie: nieuweCat, subHoofdstuk: "" }
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

              {/* Sub-hoofdstuk (dynamisch op basis van categorie) */}
              {subHoofdstukOpties[formulier.categorie] && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sub-hoofdstuk</label>
                  <select
                    value={formulier.subHoofdstuk}
                    onChange={(e) => setFormulier({ ...formulier, subHoofdstuk: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    {subHoofdstukOpties[formulier.categorie].map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Bronlabel */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bronlabel</label>
                <select
                  value={formulier.bronLabel}
                  onChange={(e) => setFormulier({ ...formulier, bronLabel: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  {bronLabelOpties.map((o) => (
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

              {/* Tags sectie */}
              <div className="col-span-2 border-t border-gray-200 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">Tags</label>
                  <button
                    type="button"
                    onClick={suggereerTags}
                    disabled={tagSuggestieLoading}
                    className="px-3 py-1 text-xs bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 disabled:opacity-50"
                  >
                    {tagSuggestieLoading ? "AI denkt na..." : "AI tag-suggestie"}
                  </button>
                </div>

                {(["zorgthemas", "situaties", "onderwerpen"] as const).map((groep) => {
                  const tags = beschikbareTags[groep]
                  if (!tags?.length) return null
                  const label = groep === "zorgthemas" ? "Zorgthema's" : groep === "situaties" ? "Situaties" : "Onderwerpen"
                  return (
                    <div key={groep} className="mb-3">
                      <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {tags.map((tag) => {
                          const isSelected = geselecteerdeTags.includes(tag.id)
                          return (
                            <button
                              key={tag.id}
                              type="button"
                              onClick={() => toggleTag(tag.id)}
                              className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                                isSelected
                                  ? "bg-blue-100 border-blue-300 text-blue-700"
                                  : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                              }`}
                            >
                              {tag.emoji ? `${tag.emoji} ` : ""}{tag.naam}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
                {geselecteerdeTags.length > 0 && (
                  <p className="text-xs text-gray-400 mt-1">{geselecteerdeTags.length} tags geselecteerd</p>
                )}
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
          <AdminSpinner tekst="Artikelen laden..." />
        ) : gefilterd.length === 0 ? (
          <AdminEmptyState icon="📝" titel="Geen artikelen gevonden" beschrijving="Voeg je eerste artikel toe" actieLabel="Nieuw artikel aanmaken" onActie={handleNieuw} />
        ) : (
          <div className="divide-y divide-gray-100">
            {gefilterd.map((artikel) => {
              const cs = berekenCompleteness({ ...artikel, tagCount: artikel.tagIds?.length || 0 })
              const badge = getCompletenessBadge(cs.score)
              return (
              <div key={artikel.id} className="p-4 hover:bg-gray-50 flex items-start gap-4">
                <span className="text-2xl">{artikel.emoji || "📄"}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-medium text-gray-900">{artikel.titel}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${statusKleur[artikel.status]}`}>
                      {artikel.status}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${badge.className}`}>
                      {cs.score}%
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
                  {artikel.tagNamen && artikel.tagNamen.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {artikel.tagNamen.slice(0, 5).map((t, i) => (
                        <span key={i} className="text-xs px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600">{t}</span>
                      ))}
                      {artikel.tagNamen.length > 5 && (
                        <span className="text-xs text-gray-400">+{artikel.tagNamen.length - 5}</span>
                      )}
                    </div>
                  )}
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
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
