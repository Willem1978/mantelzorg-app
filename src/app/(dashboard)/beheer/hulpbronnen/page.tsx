"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState, useCallback } from "react"

// Types
interface Hulpbron {
  id: string
  naam: string
  beschrijving: string | null
  type: string
  telefoon: string | null
  email: string | null
  website: string | null
  adres: string | null
  postcode: string | null
  woonplaats: string | null
  gemeente: string | null
  isActief: boolean
  onderdeelTest: string | null
  soortHulp: string | null
  openingstijden: string | null
  zichtbaarBijLaag: boolean
  zichtbaarBijGemiddeld: boolean
  zichtbaarBijHoog: boolean
  kosten: string | null
  doelgroep: string | null
  aanmeldprocedure: string | null
}

interface ScrapedResult {
  naam: string
  beschrijving: string
  website: string
  telefoon?: string
  gemeente?: string
}

const ONDERDEEL_OPTIES = [
  "Administratie en aanvragen",
  "Bereiden en/of nuttigen van maaltijden",
  "Boodschappen",
  "Huishoudelijke taken",
  "Klusjes in en om het huis",
  "Mantelzorgondersteuning",
  "Persoonlijke verzorging",
  "Sociaal contact en activiteiten",
  "Vervoer",
]

const SOORT_HULP_OPTIES = [
  "Educatie",
  "Emotionele steun",
  "Informatie en advies",
  "Persoonlijke begeleiding",
  "Praktische hulp",
  "Vervangende mantelzorg",
]

const TYPE_OPTIES = [
  "GEMEENTE",
  "THUISZORG",
  "MANTELZORGSTEUNPUNT",
  "RESPIJTZORG",
  "DAGBESTEDING",
  "HUISARTS",
  "SOCIAAL_WIJKTEAM",
  "VRIJWILLIGERS",
  "OVERIG",
  "LANDELIJK",
]

const EMPTY_FORM: Partial<Hulpbron> = {
  naam: "",
  beschrijving: "",
  type: "OVERIG",
  telefoon: "",
  email: "",
  website: "",
  adres: "",
  postcode: "",
  woonplaats: "",
  gemeente: "",
  isActief: false,
  onderdeelTest: "",
  soortHulp: "",
  openingstijden: "",
  zichtbaarBijLaag: false,
  zichtbaarBijGemiddeld: false,
  zichtbaarBijHoog: true,
  kosten: "",
  doelgroep: "",
  aanmeldprocedure: "",
}

export default function BeheerHulpbronnenPage() {
  const { data: session, status } = useSession()

  // Data
  const [hulpbronnen, setHulpbronnen] = useState<Hulpbron[]>([])
  const [filterGemeenten, setFilterGemeenten] = useState<string[]>([])
  const [filterOnderdelen, setFilterOnderdelen] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [zoek, setZoek] = useState("")
  const [filterGemeente, setFilterGemeente] = useState("")
  const [filterOnderdeel, setFilterOnderdeel] = useState("")
  const [filterActief, setFilterActief] = useState<string>("")
  const [filterLandelijk, setFilterLandelijk] = useState(false)

  // Edit modal
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<Partial<Hulpbron>>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  // Scraper
  const [showScraper, setShowScraper] = useState(false)
  const [scrapeGemeente, setScrapeGemeente] = useState("")
  const [scrapeZoekterm, setScrapeZoekterm] = useState("")
  const [scrapeResults, setScrapeResults] = useState<ScrapedResult[]>([])
  const [scraping, setScraping] = useState(false)

  // Delete confirm
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (zoek) params.set("zoek", zoek)
    if (filterGemeente) params.set("gemeente", filterGemeente)
    if (filterOnderdeel) params.set("onderdeelTest", filterOnderdeel)
    if (filterActief) params.set("actief", filterActief)
    if (filterLandelijk) params.set("landelijk", "true")

    const res = await fetch(`/api/beheer/hulpbronnen?${params}&t=${Date.now()}`, {
      cache: "no-store",
    })
    if (res.ok) {
      const data = await res.json()
      setHulpbronnen(data.hulpbronnen)
      setFilterGemeenten(data.filters.gemeenten)
      setFilterOnderdelen(data.filters.onderdelen)
    }
    setLoading(false)
  }, [zoek, filterGemeente, filterOnderdeel, filterActief, filterLandelijk])

  useEffect(() => {
    if (status === "authenticated") {
      fetchData()
    }
  }, [status, fetchData])

  // Debounced search
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null)
  const handleSearch = (value: string) => {
    setZoek(value)
    if (searchTimeout) clearTimeout(searchTimeout)
    setSearchTimeout(setTimeout(() => fetchData(), 300))
  }

  // CRUD
  const handleSave = async () => {
    setSaving(true)
    const isEdit = !!editItem.id
    const url = isEdit
      ? `/api/beheer/hulpbronnen/${editItem.id}`
      : "/api/beheer/hulpbronnen"

    const body = {
      ...editItem,
      gemeente: editItem.gemeente || null,
      onderdeelTest: editItem.onderdeelTest || null,
      soortHulp: editItem.soortHulp || null,
    }

    const res = await fetch(url, {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })

    if (res.ok) {
      setShowForm(false)
      setEditItem(EMPTY_FORM)
      fetchData()
    }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    await fetch(`/api/beheer/hulpbronnen/${id}`, { method: "DELETE" })
    setDeleteId(null)
    fetchData()
  }

  const handleToggleActief = async (item: Hulpbron) => {
    await fetch(`/api/beheer/hulpbronnen/${item.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...item, isActief: !item.isActief }),
    })
    fetchData()
  }

  // Scraper
  const handleScrape = async () => {
    setScraping(true)
    setScrapeResults([])
    const res = await fetch("/api/beheer/hulpbronnen/zoeken", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gemeente: scrapeGemeente, zoekterm: scrapeZoekterm }),
    })
    if (res.ok) {
      const data = await res.json()
      setScrapeResults(data.resultaten || [])
    }
    setScraping(false)
  }

  const handleAddFromScrape = (result: ScrapedResult) => {
    setEditItem({
      ...EMPTY_FORM,
      naam: result.naam,
      beschrijving: result.beschrijving,
      website: result.website,
      telefoon: result.telefoon || "",
      gemeente: result.gemeente || scrapeGemeente || "",
      isActief: false, // Pending review
    })
    setShowForm(true)
  }

  if (status === "loading") {
    return (
      <div className="p-8 text-center text-muted-foreground">Laden...</div>
    )
  }

  const actiefCount = hulpbronnen.filter((h) => h.isActief).length
  const inactiefCount = hulpbronnen.filter((h) => !h.isActief).length

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <span className="text-2xl">🗂️</span> Hulpbronnen Beheer
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {hulpbronnen.length} hulpbronnen ({actiefCount} actief, {inactiefCount} inactief)
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowScraper(!showScraper)}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-[var(--accent-amber)] text-white hover:opacity-90 transition"
          >
            🔍 Web zoeken
          </button>
          <button
            onClick={() => {
              setEditItem(EMPTY_FORM)
              setShowForm(true)
            }}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-[var(--primary)] text-white hover:opacity-90 transition"
          >
            + Toevoegen
          </button>
        </div>
      </div>

      {/* Scraper Section */}
      {showScraper && (
        <div className="ker-card mb-6 border-2 border-[var(--accent-amber)]">
          <h2 className="font-bold text-lg mb-3 flex items-center gap-2">
            🔍 Hulpbronnen zoeken op het web
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Zoek automatisch naar mantelzorgorganisaties per gemeente. Resultaten kun je beoordelen en toevoegen.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <input
              type="text"
              placeholder="Gemeente (bijv. Amsterdam)"
              value={scrapeGemeente}
              onChange={(e) => setScrapeGemeente(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-foreground text-sm min-h-[44px]"
            />
            <input
              type="text"
              placeholder="Zoekterm (bijv. respijtzorg, dagbesteding)"
              value={scrapeZoekterm}
              onChange={(e) => setScrapeZoekterm(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-foreground text-sm min-h-[44px]"
            />
            <button
              onClick={handleScrape}
              disabled={scraping || (!scrapeGemeente && !scrapeZoekterm)}
              className="px-6 py-2 rounded-lg text-sm font-medium bg-[var(--accent-amber)] text-white hover:opacity-90 transition disabled:opacity-50 min-h-[44px]"
            >
              {scraping ? "Zoeken..." : "Zoeken"}
            </button>
          </div>

          {scrapeResults.length > 0 && (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              <p className="text-sm font-medium text-muted-foreground">
                {scrapeResults.length} resultaten gevonden:
              </p>
              {scrapeResults.map((result, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-3 rounded-lg border border-[var(--border)] bg-[var(--background)]"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-foreground truncate">
                      {result.naam}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                      {result.beschrijving}
                    </p>
                    {result.website && (
                      <p className="text-xs text-[var(--primary)] truncate mt-0.5">
                        {result.website}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleAddFromScrape(result)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--accent-green)] text-white hover:opacity-90 transition whitespace-nowrap"
                  >
                    + Toevoegen
                  </button>
                </div>
              ))}
            </div>
          )}

          {scraping && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Bezig met zoeken op DuckDuckGo en De Sociale Kaart...
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="ker-card mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Zoek op naam, beschrijving of gemeente..."
            value={zoek}
            onChange={(e) => handleSearch(e.target.value)}
            className="flex-1 px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-foreground text-sm min-h-[44px]"
          />
          <select
            value={filterGemeente}
            onChange={(e) => {
              setFilterGemeente(e.target.value)
              setFilterLandelijk(false)
            }}
            className="px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-foreground text-sm min-h-[44px]"
          >
            <option value="">Alle gemeenten</option>
            {filterGemeenten.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
          <select
            value={filterOnderdeel}
            onChange={(e) => setFilterOnderdeel(e.target.value)}
            className="px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-foreground text-sm min-h-[44px]"
          >
            <option value="">Alle categorieën</option>
            {filterOnderdelen.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
          <select
            value={filterActief}
            onChange={(e) => setFilterActief(e.target.value)}
            className="px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-foreground text-sm min-h-[44px]"
          >
            <option value="">Alles</option>
            <option value="true">Actief</option>
            <option value="false">Inactief</option>
          </select>
          <label className="flex items-center gap-2 text-sm text-foreground whitespace-nowrap min-h-[44px]">
            <input
              type="checkbox"
              checked={filterLandelijk}
              onChange={(e) => {
                setFilterLandelijk(e.target.checked)
                if (e.target.checked) setFilterGemeente("")
              }}
              className="w-4 h-4"
            />
            Landelijk
          </label>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Laden...</div>
      ) : hulpbronnen.length === 0 ? (
        <div className="ker-card text-center py-12">
          <p className="text-muted-foreground">Geen hulpbronnen gevonden</p>
          <p className="text-sm text-muted-foreground mt-1">
            Pas je filters aan of voeg een nieuwe hulpbron toe
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {hulpbronnen.map((item) => (
            <div
              key={item.id}
              className={`ker-card p-4 flex flex-col sm:flex-row sm:items-center gap-3 ${
                !item.isActief ? "opacity-60 border-dashed" : ""
              }`}
            >
              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-sm text-foreground">
                    {item.naam}
                  </span>
                  {item.isActief ? (
                    <span className="ker-badge ker-badge-green text-[10px]">Actief</span>
                  ) : (
                    <span className="ker-badge ker-badge-red text-[10px]">Inactief</span>
                  )}
                  {item.gemeente ? (
                    <span className="ker-badge text-[10px]">{item.gemeente}</span>
                  ) : (
                    <span className="ker-badge ker-badge-amber text-[10px]">Landelijk</span>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-wrap mt-1">
                  {item.onderdeelTest && (
                    <span className="text-[10px] text-muted-foreground bg-[var(--muted)] px-1.5 py-0.5 rounded">
                      {item.onderdeelTest}
                    </span>
                  )}
                  {item.soortHulp && (
                    <span className="text-[10px] text-muted-foreground bg-[var(--muted)] px-1.5 py-0.5 rounded">
                      {item.soortHulp}
                    </span>
                  )}
                  {item.type && (
                    <span className="text-[10px] text-muted-foreground">
                      {item.type}
                    </span>
                  )}
                </div>
                {item.beschrijving && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                    {item.beschrijving}
                  </p>
                )}
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  {item.telefoon && <span>📞 {item.telefoon}</span>}
                  {item.website && (
                    <a
                      href={item.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[var(--primary)] hover:underline truncate max-w-[200px]"
                    >
                      🌐 {item.website.replace("https://", "").replace("http://", "")}
                    </a>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => handleToggleActief(item)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    item.isActief
                      ? "bg-[var(--accent-red-bg)] text-[var(--accent-red)] hover:bg-[var(--accent-red)] hover:text-white"
                      : "bg-[var(--accent-green-bg)] text-[var(--accent-green)] hover:bg-[var(--accent-green)] hover:text-white"
                  }`}
                >
                  {item.isActief ? "Deactiveer" : "Activeer"}
                </button>
                <button
                  onClick={() => {
                    setEditItem(item)
                    setShowForm(true)
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--muted)] text-foreground hover:bg-[var(--border)] transition"
                >
                  Bewerk
                </button>
                <button
                  onClick={() => setDeleteId(item.id)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-[var(--accent-red)] hover:bg-[var(--accent-red-bg)] transition"
                >
                  Verwijder
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="ker-card max-w-sm w-full">
            <h3 className="font-bold text-lg text-foreground mb-2">Verwijderen?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Weet je zeker dat je deze hulpbron wilt verwijderen? Dit kan niet ongedaan worden.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 rounded-lg text-sm bg-[var(--muted)] text-foreground hover:bg-[var(--border)] transition"
              >
                Annuleren
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-[var(--accent-red)] text-white hover:opacity-90 transition"
              >
                Verwijderen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="ker-card max-w-2xl w-full my-8">
            <h3 className="font-bold text-lg text-foreground mb-4">
              {editItem.id ? "Hulpbron bewerken" : "Nieuwe hulpbron"}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Naam */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Naam *
                </label>
                <input
                  type="text"
                  value={editItem.naam || ""}
                  onChange={(e) =>
                    setEditItem({ ...editItem, naam: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-foreground text-sm min-h-[44px]"
                />
              </div>

              {/* Beschrijving */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Beschrijving
                </label>
                <textarea
                  value={editItem.beschrijving || ""}
                  onChange={(e) =>
                    setEditItem({ ...editItem, beschrijving: e.target.value })
                  }
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-foreground text-sm"
                />
              </div>

              {/* Gemeente */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Gemeente (leeg = landelijk)
                </label>
                <input
                  type="text"
                  value={editItem.gemeente || ""}
                  onChange={(e) =>
                    setEditItem({ ...editItem, gemeente: e.target.value })
                  }
                  placeholder="Bijv. Amsterdam (leeg = landelijk)"
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-foreground text-sm min-h-[44px]"
                />
              </div>

              {/* Type */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Type organisatie
                </label>
                <select
                  value={editItem.type || "OVERIG"}
                  onChange={(e) =>
                    setEditItem({ ...editItem, type: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-foreground text-sm min-h-[44px]"
                >
                  {TYPE_OPTIES.map((t) => (
                    <option key={t} value={t}>
                      {t.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
              </div>

              {/* Onderdeel Test (categorie) */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Categorie (onderdeel test)
                </label>
                <select
                  value={editItem.onderdeelTest || ""}
                  onChange={(e) =>
                    setEditItem({ ...editItem, onderdeelTest: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-foreground text-sm min-h-[44px]"
                >
                  <option value="">-- Geen --</option>
                  {ONDERDEEL_OPTIES.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </div>

              {/* Soort Hulp */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Soort hulp (voor mantelzorger)
                </label>
                <select
                  value={editItem.soortHulp || ""}
                  onChange={(e) =>
                    setEditItem({ ...editItem, soortHulp: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-foreground text-sm min-h-[44px]"
                >
                  <option value="">-- Geen --</option>
                  {SOORT_HULP_OPTIES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {/* Telefoon */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Telefoon
                </label>
                <input
                  type="text"
                  value={editItem.telefoon || ""}
                  onChange={(e) =>
                    setEditItem({ ...editItem, telefoon: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-foreground text-sm min-h-[44px]"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={editItem.email || ""}
                  onChange={(e) =>
                    setEditItem({ ...editItem, email: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-foreground text-sm min-h-[44px]"
                />
              </div>

              {/* Website */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Website
                </label>
                <input
                  type="url"
                  value={editItem.website || ""}
                  onChange={(e) =>
                    setEditItem({ ...editItem, website: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-foreground text-sm min-h-[44px]"
                />
              </div>

              {/* Adres */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Adres
                </label>
                <input
                  type="text"
                  value={editItem.adres || ""}
                  onChange={(e) =>
                    setEditItem({ ...editItem, adres: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-foreground text-sm min-h-[44px]"
                />
              </div>

              {/* Woonplaats */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Woonplaats
                </label>
                <input
                  type="text"
                  value={editItem.woonplaats || ""}
                  onChange={(e) =>
                    setEditItem({ ...editItem, woonplaats: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-foreground text-sm min-h-[44px]"
                />
              </div>

              {/* Zichtbaarheid */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-muted-foreground mb-2">
                  Zichtbaar bij belastingniveau
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={editItem.zichtbaarBijLaag || false}
                      onChange={(e) =>
                        setEditItem({ ...editItem, zichtbaarBijLaag: e.target.checked })
                      }
                      className="w-4 h-4"
                    />
                    <span className="text-[var(--accent-green)]">Laag</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={editItem.zichtbaarBijGemiddeld || false}
                      onChange={(e) =>
                        setEditItem({ ...editItem, zichtbaarBijGemiddeld: e.target.checked })
                      }
                      className="w-4 h-4"
                    />
                    <span className="text-[var(--accent-amber)]">Gemiddeld</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={editItem.zichtbaarBijHoog || false}
                      onChange={(e) =>
                        setEditItem({ ...editItem, zichtbaarBijHoog: e.target.checked })
                      }
                      className="w-4 h-4"
                    />
                    <span className="text-[var(--accent-red)]">Hoog</span>
                  </label>
                </div>
              </div>

              {/* Actief */}
              <div className="sm:col-span-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={editItem.isActief || false}
                    onChange={(e) =>
                      setEditItem({ ...editItem, isActief: e.target.checked })
                    }
                    className="w-4 h-4"
                  />
                  <span className="font-medium text-foreground">Actief (zichtbaar voor gebruikers)</span>
                </label>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex gap-2 justify-end mt-6">
              <button
                onClick={() => {
                  setShowForm(false)
                  setEditItem(EMPTY_FORM)
                }}
                className="px-4 py-2 rounded-lg text-sm bg-[var(--muted)] text-foreground hover:bg-[var(--border)] transition min-h-[44px]"
              >
                Annuleren
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !editItem.naam}
                className="px-6 py-2 rounded-lg text-sm font-medium bg-[var(--primary)] text-white hover:opacity-90 transition disabled:opacity-50 min-h-[44px]"
              >
                {saving ? "Opslaan..." : editItem.id ? "Bijwerken" : "Toevoegen"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
