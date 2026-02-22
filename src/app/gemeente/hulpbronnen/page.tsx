"use client"

import { useEffect, useState, useCallback } from "react"

// Zorgorganisatie interface (hulp tab)
interface Hulpbron {
  id: string
  naam: string
  beschrijving: string | null
  type: string
  telefoon: string | null
  email: string | null
  website: string | null
  gemeente: string | null
  onderdeelTest: string | null
  soortHulp: string | null
  doelgroep: string | null
  dekkingNiveau: string
  isActief: boolean
}

// Artikel interface (informatie tab)
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
  "Persoonlijke verzorging",
  "Bereiden en/of nuttigen van maaltijden",
  "Boodschappen",
  "Huishoudelijke taken",
  "Klusjes in en om het huis",
  "Administratie en aanvragen",
  "Sociaal contact en activiteiten",
  "Vervoer",
]

const CATEGORIEEN_MANTELZORGER = [
  "Mantelzorgondersteuning",
  "Vervangende mantelzorg",
  "Emotionele steun",
  "Lotgenotencontact",
  "Leren en training",
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
  const [doelgroep, setDoelgroep] = useState<string>("")
  const [zoek, setZoek] = useState("")

  // Hulp form
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

  // Fetch informatie (gemeentenieuws)
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

  // Fetch hulp (zorgorganisaties)
  const fetchHulp = useCallback(() => {
    setHulpLoading(true)
    setHulpError(null)
    const params = new URLSearchParams({ sectie: "hulp" })
    if (doelgroep) params.set("doelgroep", doelgroep)
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
  }, [doelgroep, zoek])

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
        body: JSON.stringify({
          sectie: "informatie",
          titel: nieuwsTitel.trim(),
          beschrijving: nieuwsBeschrijving.trim(),
        }),
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
      setHulpNaam("")
      setHulpBeschrijving("")
      setHulpDoelgroep("")
      setHulpCategorie("")
      setHulpTelefoon("")
      setHulpEmail("")
      setHulpWebsite("")
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

  // Categorieën op basis van doelgroep
  const hulpFormCategorieOpties = hulpDoelgroep === "ZORGVRAGER"
    ? CATEGORIEEN_ZORGVRAGER
    : hulpDoelgroep === "MANTELZORGER"
    ? CATEGORIEEN_MANTELZORGER
    : [...CATEGORIEEN_ZORGVRAGER, ...CATEGORIEEN_MANTELZORGER.filter((c) => !CATEGORIEEN_ZORGVRAGER.includes(c))]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Hulpbronnen</h1>
        <p className="text-gray-500 mt-1">
          Beheer informatie en hulp voor mantelzorgers{gemeenteNaam ? ` in ${gemeenteNaam}` : ""}
        </p>
      </div>

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
                <input
                  type="text"
                  value={nieuwsTitel}
                  onChange={(e) => setNieuwsTitel(e.target.value)}
                  placeholder="Titel van het nieuwsbericht"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  disabled={nieuwsSubmitting}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Beschrijving *</label>
                <textarea
                  value={nieuwsBeschrijving}
                  onChange={(e) => setNieuwsBeschrijving(e.target.value)}
                  placeholder="Beschrijving van het nieuws"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-vertical"
                  disabled={nieuwsSubmitting}
                />
              </div>
              {nieuwsError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-700 text-sm">{nieuwsError}</p>
                </div>
              )}
              {nieuwsSuccess && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-green-700 text-sm">Gemeentenieuws toegevoegd!</p>
                </div>
              )}
              <button
                type="submit"
                disabled={nieuwsSubmitting}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                {nieuwsSubmitting ? "Toevoegen..." : "+ Nieuws toevoegen"}
              </button>
            </form>
          </div>

          {/* Bestaand gemeentenieuws */}
          {artikelenLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
                <span className="text-gray-500 text-sm">Gemeentenieuws laden...</span>
              </div>
            </div>
          ) : artikelenError ? (
            <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
              <p className="text-red-700 text-sm">{artikelenError}</p>
            </div>
          ) : artikelen.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
              <p className="text-gray-500">Nog geen gemeentenieuws.</p>
              <p className="text-gray-400 text-sm mt-1">Voeg hierboven uw eerste nieuwsbericht toe.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-gray-900">
                Gemeentenieuws ({artikelen.length})
              </h2>
              {artikelen.map((artikel) => (
                <div key={artikel.id} className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">{artikel.titel}</h3>
                      <p className="text-sm text-gray-500 mt-1">{artikel.beschrijving}</p>
                    </div>
                    <span className={`flex-shrink-0 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      artikel.status === "GEPUBLICEERD"
                        ? "bg-green-100 text-green-700"
                        : artikel.status === "CONCEPT"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-gray-100 text-gray-600"
                    }`}>
                      {artikel.status === "GEPUBLICEERD" ? "Gepubliceerd" : artikel.status === "CONCEPT" ? "Concept" : "Gearchiveerd"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    {artikel.publicatieDatum
                      ? new Date(artikel.publicatieDatum).toLocaleDateString("nl-NL")
                      : new Date(artikel.createdAt).toLocaleDateString("nl-NL")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* === HULP TAB === */}
      {activeTab === "hulp" && (
        <div className="space-y-6">
          {/* Doelgroep selector */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Voor wie is de hulp?
            </label>
            <div className="flex gap-3">
              <button
                onClick={() => { setDoelgroep("MANTELZORGER"); setZoek("") }}
                className={`flex-1 py-3 px-4 rounded-lg text-center font-medium transition border-2 ${
                  doelgroep === "MANTELZORGER"
                    ? "border-purple-500 bg-purple-500 text-white"
                    : "border-gray-200 bg-white text-gray-700 hover:border-purple-300 hover:bg-purple-50"
                }`}
              >
                <div className="text-lg mb-1">💜</div>
                <div className="text-sm">Voor de mantelzorger</div>
              </button>
              <button
                onClick={() => { setDoelgroep("ZORGVRAGER"); setZoek("") }}
                className={`flex-1 py-3 px-4 rounded-lg text-center font-medium transition border-2 ${
                  doelgroep === "ZORGVRAGER"
                    ? "border-emerald-500 bg-emerald-500 text-white"
                    : "border-gray-200 bg-white text-gray-700 hover:border-emerald-300 hover:bg-emerald-50"
                }`}
              >
                <div className="text-lg mb-1">🤲</div>
                <div className="text-sm">Voor de zorgvrager</div>
              </button>
            </div>
            {doelgroep && (
              <button
                onClick={() => { setDoelgroep(""); setZoek("") }}
                className="mt-2 text-xs text-gray-400 hover:text-gray-600 transition"
              >
                Filter wissen
              </button>
            )}
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
              onClick={() => setShowHulpForm(!showHulpForm)}
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
                  <input
                    type="text"
                    value={hulpNaam}
                    onChange={(e) => setHulpNaam(e.target.value)}
                    placeholder="Naam van de organisatie"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                    disabled={hulpSubmitting}
                  />
                </div>

                {/* Doelgroep keuze */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Doelgroep</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => { setHulpDoelgroep("MANTELZORGER"); setHulpCategorie("") }}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition border-2 ${
                        hulpDoelgroep === "MANTELZORGER"
                          ? "border-purple-500 bg-purple-500 text-white"
                          : "border-gray-200 text-gray-700 hover:border-purple-300"
                      }`}
                    >
                      💜 Mantelzorger
                    </button>
                    <button
                      type="button"
                      onClick={() => { setHulpDoelgroep("ZORGVRAGER"); setHulpCategorie("") }}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition border-2 ${
                        hulpDoelgroep === "ZORGVRAGER"
                          ? "border-emerald-500 bg-emerald-500 text-white"
                          : "border-gray-200 text-gray-700 hover:border-emerald-300"
                      }`}
                    >
                      🤲 Zorgvrager
                    </button>
                  </div>
                </div>

                {/* Categorie */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categorie</label>
                  <select
                    value={hulpCategorie}
                    onChange={(e) => setHulpCategorie(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white"
                    disabled={hulpSubmitting}
                  >
                    <option value="">-- Selecteer --</option>
                    {hulpFormCategorieOpties.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Beschrijving</label>
                  <textarea
                    value={hulpBeschrijving}
                    onChange={(e) => setHulpBeschrijving(e.target.value)}
                    placeholder="Beschrijving van de hulpbron"
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-vertical"
                    disabled={hulpSubmitting}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Telefoon</label>
                    <input
                      type="text"
                      value={hulpTelefoon}
                      onChange={(e) => setHulpTelefoon(e.target.value)}
                      placeholder="Telefoonnummer"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                      disabled={hulpSubmitting}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={hulpEmail}
                      onChange={(e) => setHulpEmail(e.target.value)}
                      placeholder="email@voorbeeld.nl"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                      disabled={hulpSubmitting}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                    <input
                      type="url"
                      value={hulpWebsite}
                      onChange={(e) => setHulpWebsite(e.target.value)}
                      placeholder="https://..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                      disabled={hulpSubmitting}
                    />
                  </div>
                </div>

                {hulpSubmitError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-red-700 text-sm">{hulpSubmitError}</p>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={hulpSubmitting}
                    className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                  >
                    {hulpSubmitting ? "Toevoegen..." : "Hulpbron toevoegen"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowHulpForm(false)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
                  >
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
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
                <span className="text-gray-500 text-sm">Hulpbronnen laden...</span>
              </div>
            </div>
          ) : hulpError ? (
            <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
              <p className="text-red-700 text-sm">{hulpError}</p>
            </div>
          ) : hulpbronnen.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
              <p className="text-gray-500">
                {doelgroep
                  ? `Geen hulpbronnen gevonden voor ${doelgroep === "MANTELZORGER" ? "mantelzorgers" : "zorgvragers"}.`
                  : "Geen hulpbronnen gevonden."}
              </p>
              <p className="text-gray-400 text-sm mt-1">Kies een doelgroep of voeg een nieuwe hulpbron toe.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-gray-900">
                Hulpbronnen ({hulpbronnen.length})
              </h2>
              {hulpbronnen.map((item) => (
                <div key={item.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
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
                        {item.dekkingNiveau === "LANDELIJK" && (
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
                        {item.telefoon && <span>📞 {item.telefoon}</span>}
                        {item.email && <span>📧 {item.email}</span>}
                        {item.website && (
                          <a
                            href={item.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-600 hover:text-emerald-700 hover:underline truncate max-w-[200px]"
                          >
                            🌐 {item.website.replace(/^https?:\/\//, "")}
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
