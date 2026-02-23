"use client"

import { useEffect, useState, useCallback } from "react"
import { ensureAbsoluteUrl } from "@/lib/utils"

interface Hulpbron {
  id: string
  naam: string
  beschrijving: string | null
  type: string
  telefoon: string | null
  email: string | null
  website: string | null
  adres: string | null
  gemeente: string | null
  onderdeelTest: string | null
  soortHulp: string | null
  doelgroep: string | null
  dekkingNiveau: string
  kosten: string | null
  openingstijden: string | null
  aanmeldprocedure: string | null
  voorwaarden: string | null
  dienst: string | null
  locatieOmschrijving: string | null
  isActief: boolean
}

interface Artikel {
  id: string
  titel: string
  beschrijving: string
  status: string
  publicatieDatum: string | null
  createdAt: string
}

// Categorieën per doelgroep
const CATEGORIEEN_ZORGVRAGER = [
  { label: "Administratie", value: "Administratie", emoji: "📋" },
  { label: "Plannen", value: "Plannen", emoji: "📅" },
  { label: "Boodschappen", value: "Boodschappen", emoji: "🛒" },
  { label: "Sociaal & activiteiten", value: "Sociaal & activiteiten", emoji: "👥" },
  { label: "Vervoer", value: "Vervoer", emoji: "🚗" },
  { label: "Verzorging", value: "Verzorging", emoji: "🧴" },
  { label: "Maaltijden", value: "Maaltijden", emoji: "🍽️" },
  { label: "Huishouden", value: "Huishouden", emoji: "🧹" },
  { label: "Klusjes", value: "Klusjes", emoji: "🔧" },
  { label: "Huisdieren", value: "Huisdieren", emoji: "🐕" },
]

const CATEGORIEEN_MANTELZORGER = [
  { label: "Ondersteuning", value: "Ondersteuning", emoji: "💜" },
  { label: "Vervangende mantelzorg", value: "Vervangende mantelzorg", emoji: "🔄" },
  { label: "Praten & steun", value: "Praten & steun", emoji: "💬" },
  { label: "Lotgenoten", value: "Lotgenoten", emoji: "🤝" },
  { label: "Leren & training", value: "Leren & training", emoji: "📚" },
]

export default function GemeenteHulpbronnen() {
  // Tabs
  const [activeTab, setActiveTab] = useState<"informatie" | "hulp">("hulp")

  // Informatie tab state
  const [artikelen, setArtikelen] = useState<Artikel[]>([])
  const [artikelenLoading, setArtikelenLoading] = useState(false)
  const [artikelenError, setArtikelenError] = useState<string | null>(null)
  const [gemeenteNaam, setGemeenteNaam] = useState("")

  // Informatie form
  const [nieuwsTitel, setNieuwsTitel] = useState("")
  const [nieuwsBeschrijving, setNieuwsBeschrijving] = useState("")
  const [nieuwsSubmitting, setNieuwsSubmitting] = useState(false)
  const [nieuwsError, setNieuwsError] = useState<string | null>(null)
  const [nieuwsSuccess, setNieuwsSuccess] = useState(false)

  // Hulp tab state
  const [hulpbronnen, setHulpbronnen] = useState<Hulpbron[]>([])
  const [hulpLoading, setHulpLoading] = useState(false)
  const [hulpError, setHulpError] = useState<string | null>(null)
  const [doelgroep, setDoelgroep] = useState<string>("ZORGVRAGER")
  const [categorie, setCategorie] = useState<string>("")
  const [zoek, setZoek] = useState("")

  // Detail/bewerk modal
  const [selectedHulpbron, setSelectedHulpbron] = useState<Hulpbron | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [editData, setEditData] = useState<Partial<Hulpbron>>({})
  const [editSubmitting, setEditSubmitting] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  // Verwijder bevestiging
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [deleteSubmitting, setDeleteSubmitting] = useState(false)

  // Hulp form (toevoegen)
  const [showHulpForm, setShowHulpForm] = useState(false)
  const [hulpNaam, setHulpNaam] = useState("")
  const [hulpBeschrijving, setHulpBeschrijving] = useState("")
  const [hulpDoelgroep, setHulpDoelgroep] = useState("")
  const [hulpCategorie, setHulpCategorie] = useState("")
  const [hulpTelefoon, setHulpTelefoon] = useState("")
  const [hulpEmail, setHulpEmail] = useState("")
  const [hulpWebsite, setHulpWebsite] = useState("")
  const [hulpSubmitting, setHulpSubmitting] = useState(false)
  const [hulpSubmitError, setHulpSubmitError] = useState<string | null>(null)
  const [hulpSubmitSuccess, setHulpSubmitSuccess] = useState(false)

  // Feedback
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null)

  // Fetch informatie
  const fetchInformatie = useCallback(() => {
    setArtikelenLoading(true)
    setArtikelenError(null)
    fetch("/api/gemeente/hulpbronnen?sectie=informatie")
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body.error || "Kon gemeentenieuws niet ophalen")
        }
        return res.json()
      })
      .then((data) => {
        setArtikelen(data.artikelen || [])
        setGemeenteNaam(data.gemeenteNaam || "")
      })
      .catch((err) => setArtikelenError(err.message))
      .finally(() => setArtikelenLoading(false))
  }, [])

  // Fetch hulp
  const fetchHulp = useCallback(() => {
    setHulpLoading(true)
    setHulpError(null)
    const params = new URLSearchParams({ sectie: "hulp" })
    if (doelgroep) params.set("doelgroep", doelgroep)
    if (categorie) params.set("onderdeelTest", categorie)
    if (zoek) params.set("zoek", zoek)

    fetch(`/api/gemeente/hulpbronnen?${params}`)
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body.error || "Kon hulpbronnen niet ophalen")
        }
        return res.json()
      })
      .then((data) => {
        setHulpbronnen(data.hulpbronnen || [])
        if (data.gemeenteNaam) setGemeenteNaam(data.gemeenteNaam)
      })
      .catch((err) => setHulpError(err.message))
      .finally(() => setHulpLoading(false))
  }, [doelgroep, categorie, zoek])

  useEffect(() => {
    if (activeTab === "informatie") fetchInformatie()
    else fetchHulp()
  }, [activeTab, fetchInformatie, fetchHulp])

  // Gemeentenieuws toevoegen
  const handleNieuwsSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setNieuwsError(null)
    setNieuwsSuccess(false)
    if (!nieuwsTitel.trim() || !nieuwsBeschrijving.trim()) {
      setNieuwsError("Vul titel en beschrijving in.")
      return
    }
    setNieuwsSubmitting(true)
    try {
      const res = await fetch("/api/gemeente/hulpbronnen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sectie: "informatie", titel: nieuwsTitel.trim(), beschrijving: nieuwsBeschrijving.trim() }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Kon nieuws niet toevoegen")
      }
      setNieuwsTitel("")
      setNieuwsBeschrijving("")
      setNieuwsSuccess(true)
      fetchInformatie()
      setTimeout(() => setNieuwsSuccess(false), 3000)
    } catch (err: any) {
      setNieuwsError(err.message)
    } finally {
      setNieuwsSubmitting(false)
    }
  }

  // Hulpbron toevoegen
  const handleHulpSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setHulpSubmitError(null)
    setHulpSubmitSuccess(false)
    if (!hulpNaam.trim()) {
      setHulpSubmitError("Naam is verplicht.")
      return
    }
    setHulpSubmitting(true)
    try {
      const res = await fetch("/api/gemeente/hulpbronnen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sectie: "hulp",
          naam: hulpNaam.trim(),
          beschrijving: hulpBeschrijving.trim() || undefined,
          doelgroep: hulpDoelgroep || undefined,
          onderdeelTest: hulpCategorie || undefined,
          telefoon: hulpTelefoon.trim() || undefined,
          email: hulpEmail.trim() || undefined,
          website: hulpWebsite.trim() || undefined,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Kon hulpbron niet toevoegen")
      }
      setHulpNaam(""); setHulpBeschrijving(""); setHulpDoelgroep(""); setHulpCategorie("")
      setHulpTelefoon(""); setHulpEmail(""); setHulpWebsite("")
      setShowHulpForm(false)
      setHulpSubmitSuccess(true)
      fetchHulp()
      setTimeout(() => setHulpSubmitSuccess(false), 3000)
    } catch (err: any) {
      setHulpSubmitError(err.message)
    } finally {
      setHulpSubmitting(false)
    }
  }

  // Hulpbron bewerken
  const handleEditSubmit = async () => {
    if (!selectedHulpbron) return
    setEditError(null)
    setEditSubmitting(true)
    try {
      const res = await fetch("/api/gemeente/hulpbronnen", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedHulpbron.id, ...editData }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Kon hulpbron niet bijwerken")
      }
      setSelectedHulpbron(null)
      setEditMode(false)
      setFeedbackMsg("Hulpbron bijgewerkt")
      fetchHulp()
      setTimeout(() => setFeedbackMsg(null), 3000)
    } catch (err: any) {
      setEditError(err.message)
    } finally {
      setEditSubmitting(false)
    }
  }

  // Hulpbron verwijderen
  const handleDelete = async (id: string) => {
    setDeleteSubmitting(true)
    try {
      const res = await fetch(`/api/gemeente/hulpbronnen?id=${id}`, { method: "DELETE" })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Kon hulpbron niet verwijderen")
      }
      setDeleteConfirmId(null)
      setSelectedHulpbron(null)
      setFeedbackMsg("Hulpbron verwijderd")
      fetchHulp()
      setTimeout(() => setFeedbackMsg(null), 3000)
    } catch (err: any) {
      setFeedbackMsg(err.message)
    } finally {
      setDeleteSubmitting(false)
    }
  }

  // Open detail modal
  const openDetail = (item: Hulpbron) => {
    setSelectedHulpbron(item)
    setEditMode(false)
    setEditError(null)
    setEditData({
      naam: item.naam,
      beschrijving: item.beschrijving || "",
      doelgroep: item.doelgroep || "",
      onderdeelTest: item.onderdeelTest || "",
      telefoon: item.telefoon || "",
      email: item.email || "",
      website: item.website || "",
    })
  }

  // Actieve categorieën op basis van doelgroep
  const activeCategorieList = doelgroep === "MANTELZORGER" ? CATEGORIEEN_MANTELZORGER : CATEGORIEEN_ZORGVRAGER

  // Categorieën voor het toevoegformulier
  const hulpFormCategorieOpties = hulpDoelgroep === "ZORGVRAGER"
    ? CATEGORIEEN_ZORGVRAGER
    : hulpDoelgroep === "MANTELZORGER"
    ? CATEGORIEEN_MANTELZORGER
    : [...CATEGORIEEN_ZORGVRAGER, ...CATEGORIEEN_MANTELZORGER]

  const isLandelijk = (item: Hulpbron) => item.dekkingNiveau === "LANDELIJK" || !item.gemeente

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Hulpbronnen</h1>
        <p className="text-gray-500 mt-1">
          Beheer informatie en hulp voor mantelzorgers{gemeenteNaam ? ` in ${gemeenteNaam}` : ""}
        </p>
      </div>

      {/* Feedback */}
      {feedbackMsg && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-green-700 text-sm">{feedbackMsg}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab("informatie")}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition ${
            activeTab === "informatie"
              ? "border-emerald-600 text-emerald-600"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          }`}
        >
          Informatie
        </button>
        <button
          onClick={() => setActiveTab("hulp")}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition ${
            activeTab === "hulp"
              ? "border-emerald-600 text-emerald-600"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          }`}
        >
          Hulp
        </button>
      </div>

      {/* === INFORMATIE TAB === */}
      {activeTab === "informatie" && (
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-sm text-blue-700">
              Hier beheert u gemeentenieuws voor mantelzorgers in {gemeenteNaam || "uw gemeente"}.
              Landelijke informatie-artikelen worden centraal beheerd door de beheerder.
            </p>
          </div>

          {/* Nieuw gemeentenieuws form */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Gemeentenieuws toevoegen</h2>
            <form onSubmit={handleNieuwsSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titel *</label>
                <input type="text" value={nieuwsTitel} onChange={(e) => setNieuwsTitel(e.target.value)}
                  placeholder="Titel van het nieuwsbericht"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  disabled={nieuwsSubmitting} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Beschrijving *</label>
                <textarea value={nieuwsBeschrijving} onChange={(e) => setNieuwsBeschrijving(e.target.value)}
                  placeholder="Beschrijving van het nieuws" rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-vertical"
                  disabled={nieuwsSubmitting} />
              </div>
              {nieuwsError && <div className="bg-red-50 border border-red-200 rounded-lg p-3"><p className="text-red-700 text-sm">{nieuwsError}</p></div>}
              {nieuwsSuccess && <div className="bg-green-50 border border-green-200 rounded-lg p-3"><p className="text-green-700 text-sm">Gemeentenieuws toegevoegd!</p></div>}
              <button type="submit" disabled={nieuwsSubmitting}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50">
                {nieuwsSubmitting ? "Toevoegen..." : "+ Nieuws toevoegen"}
              </button>
            </form>
          </div>

          {/* Bestaand gemeentenieuws */}
          {artikelenLoading ? (
            <LoadingSpinner tekst="Gemeentenieuws laden..." />
          ) : artikelenError ? (
            <ErrorBox tekst={artikelenError} />
          ) : artikelen.length === 0 ? (
            <EmptyState tekst="Nog geen gemeentenieuws." sub="Voeg hierboven uw eerste nieuwsbericht toe." />
          ) : (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-gray-900">Gemeentenieuws ({artikelen.length})</h2>
              {artikelen.map((artikel) => (
                <div key={artikel.id} className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">{artikel.titel}</h3>
                      <p className="text-sm text-gray-500 mt-1">{artikel.beschrijving}</p>
                    </div>
                    <span className={`flex-shrink-0 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      artikel.status === "GEPUBLICEERD" ? "bg-green-100 text-green-700"
                        : artikel.status === "CONCEPT" ? "bg-yellow-100 text-yellow-700"
                        : "bg-gray-100 text-gray-600"
                    }`}>
                      {artikel.status === "GEPUBLICEERD" ? "Gepubliceerd" : artikel.status === "CONCEPT" ? "Concept" : "Gearchiveerd"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    {artikel.publicatieDatum ? new Date(artikel.publicatieDatum).toLocaleDateString("nl-NL") : new Date(artikel.createdAt).toLocaleDateString("nl-NL")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* === HULP TAB === */}
      {activeTab === "hulp" && (
        <div className="space-y-5">
          {/* Doelgroep selector */}
          <div className="flex gap-3">
            <button
              onClick={() => { setDoelgroep("MANTELZORGER"); setCategorie(""); setZoek("") }}
              className={`flex-1 py-3 px-4 rounded-xl text-center font-medium transition border-2 ${
                doelgroep === "MANTELZORGER"
                  ? "border-purple-500 bg-purple-500 text-white shadow-md"
                  : "border-gray-200 bg-white text-gray-700 hover:border-purple-300 hover:bg-purple-50"
              }`}
            >
              <div className="text-lg mb-0.5">💜</div>
              <div className="text-sm">Voor de mantelzorger</div>
            </button>
            <button
              onClick={() => { setDoelgroep("ZORGVRAGER"); setCategorie(""); setZoek("") }}
              className={`flex-1 py-3 px-4 rounded-xl text-center font-medium transition border-2 ${
                doelgroep === "ZORGVRAGER"
                  ? "border-emerald-500 bg-emerald-500 text-white shadow-md"
                  : "border-gray-200 bg-white text-gray-700 hover:border-emerald-300 hover:bg-emerald-50"
              }`}
            >
              <div className="text-lg mb-0.5">🤲</div>
              <div className="text-sm">Voor de zorgvrager</div>
            </button>
          </div>

          {/* Categorie filter chips */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setCategorie("")}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition border ${
                !categorie
                  ? "bg-gray-800 text-white border-gray-800"
                  : "bg-white text-gray-600 border-gray-300 hover:border-gray-400"
              }`}
            >
              Alle
            </button>
            {activeCategorieList.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setCategorie(categorie === cat.value ? "" : cat.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition border ${
                  categorie === cat.value
                    ? doelgroep === "MANTELZORGER"
                      ? "bg-purple-500 text-white border-purple-500"
                      : "bg-emerald-500 text-white border-emerald-500"
                    : "bg-white text-gray-600 border-gray-300 hover:border-gray-400"
                }`}
              >
                {cat.emoji} {cat.label}
              </button>
            ))}
          </div>

          {/* Zoekbalk + toevoegen knop */}
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Zoek op naam..."
              value={zoek}
              onChange={(e) => setZoek(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            />
            <button
              onClick={() => { setShowHulpForm(!showHulpForm); setHulpDoelgroep(doelgroep); setHulpCategorie(categorie) }}
              className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors whitespace-nowrap"
            >
              + Toevoegen
            </button>
          </div>

          {/* Hulpbron toevoegen form */}
          {showHulpForm && (
            <div className="bg-white rounded-xl border-2 border-emerald-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Nieuwe hulpbron toevoegen</h2>
              <form onSubmit={handleHulpSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Naam *</label>
                  <input type="text" value={hulpNaam} onChange={(e) => setHulpNaam(e.target.value)}
                    placeholder="Naam van de organisatie"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                    disabled={hulpSubmitting} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Doelgroep</label>
                  <div className="flex gap-2">
                    <button type="button"
                      onClick={() => { setHulpDoelgroep("MANTELZORGER"); setHulpCategorie("") }}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition border-2 ${
                        hulpDoelgroep === "MANTELZORGER" ? "border-purple-500 bg-purple-500 text-white" : "border-gray-200 text-gray-700 hover:border-purple-300"
                      }`}>
                      💜 Mantelzorger
                    </button>
                    <button type="button"
                      onClick={() => { setHulpDoelgroep("ZORGVRAGER"); setHulpCategorie("") }}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition border-2 ${
                        hulpDoelgroep === "ZORGVRAGER" ? "border-emerald-500 bg-emerald-500 text-white" : "border-gray-200 text-gray-700 hover:border-emerald-300"
                      }`}>
                      🤲 Zorgvrager
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categorie</label>
                  <select value={hulpCategorie} onChange={(e) => setHulpCategorie(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white"
                    disabled={hulpSubmitting}>
                    <option value="">-- Selecteer --</option>
                    {hulpFormCategorieOpties.map((c) => (
                      <option key={c.value} value={c.value}>{c.emoji} {c.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Beschrijving</label>
                  <textarea value={hulpBeschrijving} onChange={(e) => setHulpBeschrijving(e.target.value)}
                    placeholder="Beschrijving van de hulpbron" rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-vertical"
                    disabled={hulpSubmitting} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Telefoon</label>
                    <input type="text" value={hulpTelefoon} onChange={(e) => setHulpTelefoon(e.target.value)}
                      placeholder="Telefoonnummer" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none" disabled={hulpSubmitting} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input type="email" value={hulpEmail} onChange={(e) => setHulpEmail(e.target.value)}
                      placeholder="email@voorbeeld.nl" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none" disabled={hulpSubmitting} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                    <input type="url" value={hulpWebsite} onChange={(e) => setHulpWebsite(e.target.value)}
                      placeholder="https://..." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none" disabled={hulpSubmitting} />
                  </div>
                </div>

                {hulpSubmitError && <div className="bg-red-50 border border-red-200 rounded-lg p-3"><p className="text-red-700 text-sm">{hulpSubmitError}</p></div>}
                <div className="flex gap-2">
                  <button type="submit" disabled={hulpSubmitting}
                    className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50">
                    {hulpSubmitting ? "Toevoegen..." : "Hulpbron toevoegen"}
                  </button>
                  <button type="button" onClick={() => setShowHulpForm(false)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors">
                    Annuleren
                  </button>
                </div>
              </form>
            </div>
          )}

          {hulpSubmitSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-green-700 text-sm">Hulpbron succesvol toegevoegd!</p>
            </div>
          )}

          {/* Hulpbronnen lijst */}
          {hulpLoading ? (
            <LoadingSpinner tekst="Hulpbronnen laden..." />
          ) : hulpError ? (
            <ErrorBox tekst={hulpError} />
          ) : hulpbronnen.length === 0 ? (
            <EmptyState
              tekst={categorie
                ? `Geen hulpbronnen gevonden in "${activeCategorieList.find(c => c.value === categorie)?.label || categorie}".`
                : doelgroep
                ? `Geen hulpbronnen gevonden voor ${doelgroep === "MANTELZORGER" ? "mantelzorgers" : "zorgvragers"}.`
                : "Geen hulpbronnen gevonden."
              }
              sub="Pas de filters aan of voeg een nieuwe hulpbron toe."
            />
          ) : (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-gray-900">
                Hulpbronnen ({hulpbronnen.length})
                {categorie && <span className="text-sm font-normal text-gray-500 ml-2">
                  in {activeCategorieList.find(c => c.value === categorie)?.label || categorie}
                </span>}
              </h2>
              {hulpbronnen.map((item) => (
                <div key={item.id}
                  className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => openDetail(item)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-gray-900">{item.naam}</h3>
                        {item.doelgroep === "MANTELZORGER" && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-purple-100 text-purple-700">Mantelzorger</span>
                        )}
                        {item.doelgroep === "ZORGVRAGER" && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-100 text-emerald-700">Zorgvrager</span>
                        )}
                        {isLandelijk(item) && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-700">Landelijk</span>
                        )}
                      </div>
                      {item.beschrijving && (
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">{item.beschrijving}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-400 flex-wrap">
                        {item.onderdeelTest && (
                          <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-600">{item.onderdeelTest}</span>
                        )}
                        {item.telefoon && <span>Tel: {item.telefoon}</span>}
                        {item.email && <span>Email: {item.email}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {!isLandelijk(item) && (
                        <>
                          <button
                            onClick={(e) => { e.stopPropagation(); openDetail(item); setEditMode(true) }}
                            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition"
                            title="Bewerken"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(item.id) }}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition"
                            title="Verwijderen"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </>
                      )}
                      <span className="text-gray-300 ml-1">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </span>
                    </div>
                  </div>

                  {/* Verwijder bevestiging inline */}
                  {deleteConfirmId === item.id && (
                    <div className="mt-3 pt-3 border-t border-red-100 flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                      <span className="text-sm text-red-700">Weet je het zeker?</span>
                      <button
                        onClick={() => handleDelete(item.id)}
                        disabled={deleteSubmitting}
                        className="px-3 py-1 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 disabled:opacity-50"
                      >
                        {deleteSubmitting ? "Bezig..." : "Ja, verwijderen"}
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(null)}
                        className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-lg hover:bg-gray-200"
                      >
                        Annuleren
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* === DETAIL/BEWERK MODAL === */}
      {selectedHulpbron && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setSelectedHulpbron(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">
                {editMode ? "Hulpbron bewerken" : "Hulpbron details"}
              </h2>
              <div className="flex items-center gap-2">
                {!editMode && !isLandelijk(selectedHulpbron) && (
                  <button onClick={() => setEditMode(true)}
                    className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
                    Bewerken
                  </button>
                )}
                <button onClick={() => setSelectedHulpbron(null)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-5 space-y-4">
              {editMode ? (
                /* Bewerk formulier */
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Naam</label>
                    <input type="text" value={editData.naam || ""}
                      onChange={(e) => setEditData({ ...editData, naam: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Beschrijving</label>
                    <textarea value={editData.beschrijving || ""}
                      onChange={(e) => setEditData({ ...editData, beschrijving: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-vertical" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Doelgroep</label>
                      <select value={editData.doelgroep || ""}
                        onChange={(e) => setEditData({ ...editData, doelgroep: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500 outline-none">
                        <option value="">-- Geen --</option>
                        <option value="MANTELZORGER">Mantelzorger</option>
                        <option value="ZORGVRAGER">Zorgvrager</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Categorie</label>
                      <select value={editData.onderdeelTest || ""}
                        onChange={(e) => setEditData({ ...editData, onderdeelTest: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500 outline-none">
                        <option value="">-- Geen --</option>
                        {[...CATEGORIEEN_ZORGVRAGER, ...CATEGORIEEN_MANTELZORGER].map((c) => (
                          <option key={c.value} value={c.value}>{c.emoji} {c.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Telefoon</label>
                      <input type="text" value={editData.telefoon || ""}
                        onChange={(e) => setEditData({ ...editData, telefoon: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input type="email" value={editData.email || ""}
                        onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                      <input type="url" value={editData.website || ""}
                        onChange={(e) => setEditData({ ...editData, website: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
                    </div>
                  </div>
                  {editError && <div className="bg-red-50 border border-red-200 rounded-lg p-3"><p className="text-red-700 text-sm">{editError}</p></div>}
                  <div className="flex gap-2 pt-2">
                    <button onClick={handleEditSubmit} disabled={editSubmitting}
                      className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors">
                      {editSubmitting ? "Opslaan..." : "Opslaan"}
                    </button>
                    <button onClick={() => setEditMode(false)}
                      className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors">
                      Annuleren
                    </button>
                  </div>
                </>
              ) : (
                /* Detail weergave */
                <>
                  <div className="flex items-center gap-2 flex-wrap">
                    {selectedHulpbron.doelgroep === "MANTELZORGER" && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">💜 Mantelzorger</span>
                    )}
                    {selectedHulpbron.doelgroep === "ZORGVRAGER" && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">🤲 Zorgvrager</span>
                    )}
                    {isLandelijk(selectedHulpbron) && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">Landelijk</span>
                    )}
                    {selectedHulpbron.onderdeelTest && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">{selectedHulpbron.onderdeelTest}</span>
                    )}
                  </div>

                  {selectedHulpbron.beschrijving && (
                    <p className="text-sm text-gray-600 leading-relaxed">{selectedHulpbron.beschrijving}</p>
                  )}

                  {selectedHulpbron.dienst && (
                    <DetailRow label="Dienst" value={selectedHulpbron.dienst} />
                  )}
                  {selectedHulpbron.soortHulp && (
                    <DetailRow label="Soort hulp" value={selectedHulpbron.soortHulp} />
                  )}
                  {selectedHulpbron.kosten && (
                    <DetailRow label="Kosten" value={selectedHulpbron.kosten} />
                  )}
                  {selectedHulpbron.aanmeldprocedure && (
                    <DetailRow label="Aanmelden" value={selectedHulpbron.aanmeldprocedure} />
                  )}
                  {selectedHulpbron.voorwaarden && (
                    <DetailRow label="Voorwaarden" value={selectedHulpbron.voorwaarden} />
                  )}
                  {selectedHulpbron.openingstijden && (
                    <DetailRow label="Openingstijden" value={selectedHulpbron.openingstijden} />
                  )}
                  {(selectedHulpbron.adres || selectedHulpbron.locatieOmschrijving) && (
                    <DetailRow label="Locatie" value={selectedHulpbron.locatieOmschrijving || selectedHulpbron.adres || ""} />
                  )}

                  {/* Contact */}
                  <div className="border-t border-gray-100 pt-4 space-y-2">
                    <h3 className="text-sm font-semibold text-gray-700">Contact</h3>
                    {selectedHulpbron.telefoon && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="text-gray-400">Tel:</span>
                        <a href={`tel:${selectedHulpbron.telefoon}`} className="text-emerald-600 hover:underline">{selectedHulpbron.telefoon}</a>
                      </div>
                    )}
                    {selectedHulpbron.email && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="text-gray-400">Email:</span>
                        <a href={`mailto:${selectedHulpbron.email}`} className="text-emerald-600 hover:underline">{selectedHulpbron.email}</a>
                      </div>
                    )}
                    {selectedHulpbron.website && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="text-gray-400">Website:</span>
                        <a href={ensureAbsoluteUrl(selectedHulpbron.website)} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline truncate">{selectedHulpbron.website.replace(/^https?:\/\//, "")}</a>
                      </div>
                    )}
                    {!selectedHulpbron.telefoon && !selectedHulpbron.email && !selectedHulpbron.website && (
                      <p className="text-sm text-gray-400">Geen contactgegevens beschikbaar.</p>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Helper components
function LoadingSpinner({ tekst }: { tekst: string }) {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
        <span className="text-gray-500 text-sm">{tekst}</span>
      </div>
    </div>
  )
}

function ErrorBox({ tekst }: { tekst: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
      <p className="text-red-700 text-sm">{tekst}</p>
    </div>
  )
}

function EmptyState({ tekst, sub }: { tekst: string; sub: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
      <p className="text-gray-500">{tekst}</p>
      <p className="text-gray-400 text-sm mt-1">{sub}</p>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <span className="text-sm font-medium text-gray-500 w-28 flex-shrink-0">{label}</span>
      <span className="text-sm text-gray-700">{value}</span>
    </div>
  )
}
