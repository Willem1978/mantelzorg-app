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
  provincie: string | null
  dekkingNiveau: string
  dekkingWoonplaatsen: string[] | null
  dekkingWijken: string[] | null
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

const DEKKING_NIVEAUS = [
  { value: "LANDELIJK", label: "Landelijk (heel Nederland)" },
  { value: "PROVINCIE", label: "Provincie" },
  { value: "GEMEENTE", label: "Gemeente (hele gemeente)" },
  { value: "WOONPLAATS", label: "Specifieke woonplaatsen" },
  { value: "WIJK", label: "Specifieke wijken" },
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
  provincie: "",
  dekkingNiveau: "GEMEENTE",
  dekkingWoonplaatsen: null,
  dekkingWijken: null,
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

  // Beheer modus: null = keuze, "landelijk" = landelijk/provincie, "gemeentelijk" = gemeente/woonplaats/wijk
  const [beheerModus, setBeheerModus] = useState<"landelijk" | "gemeentelijk" | null>(null)
  const [beheerGemeente, setBeheerGemeente] = useState("")
  const [beheerGemeenteZoek, setBeheerGemeenteZoek] = useState("")
  const [beheerGemeenteResults, setBeheerGemeenteResults] = useState<string[]>([])
  const [beheerProvincie, setBeheerProvincie] = useState("")
  const [beheerProvincieZoek, setBeheerProvincieZoek] = useState("")
  const [beheerProvincieResults, setBeheerProvincieResults] = useState<string[]>([])

  // Data
  const [hulpbronnen, setHulpbronnen] = useState<Hulpbron[]>([])
  const [filterGemeenten, setFilterGemeenten] = useState<string[]>([])
  const [filterProvincies, setFilterProvincies] = useState<string[]>([])
  const [filterOnderdelen, setFilterOnderdelen] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  // Filters
  const [zoek, setZoek] = useState("")
  const [filterOnderdeel, setFilterOnderdeel] = useState("")
  const [filterActief, setFilterActief] = useState<string>("")

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

  // Scraper location picker (separate from form location)
  const [scrapeDekkingNiveau, setScrapeDekkingNiveau] = useState("GEMEENTE")
  const [scrapeGemeenteZoek, setScrapeGemeenteZoek] = useState("")
  const [scrapeGemeenteResults, setScrapeGemeenteResults] = useState<string[]>([])
  const [scrapeWoonplaatsen, setScrapeWoonplaatsen] = useState<string[]>([])
  const [scrapeWijken, setScrapeWijken] = useState<string[]>([])
  const [scrapeSelectedWoonplaatsen, setScrapeSelectedWoonplaatsen] = useState<string[]>([])
  const [scrapeSelectedWijken, setScrapeSelectedWijken] = useState<string[]>([])
  const [scrapeLoadingLocatie, setScrapeLoadingLocatie] = useState(false)

  // Delete confirm
  const [deleteId, setDeleteId] = useState<string | null>(null)

  // Location hierarchy (PDOK)
  const [provincies, setProvincies] = useState<string[]>([])
  const [gemeenten, setGemeenten] = useState<string[]>([])
  const [woonplaatsen, setWoonplaatsen] = useState<string[]>([])
  const [wijken, setWijken] = useState<string[]>([])
  const [gemeenteZoek, setGemeenteZoek] = useState("")
  const [gemeenteResults, setGemeenteResults] = useState<string[]>([])
  const [loadingLocatie, setLoadingLocatie] = useState(false)

  const fetchData = useCallback(async () => {
    if (!beheerModus) return
    // For gemeentelijk, require a gemeente to be selected
    if (beheerModus === "gemeentelijk" && !beheerGemeente) {
      setHulpbronnen([])
      setLoading(false)
      return
    }
    setLoading(true)
    const params = new URLSearchParams()
    params.set("modus", beheerModus)
    if (beheerModus === "gemeentelijk" && beheerGemeente) params.set("gemeente", beheerGemeente)
    if (beheerModus === "landelijk" && beheerProvincie) params.set("provincie", beheerProvincie)
    if (zoek) params.set("zoek", zoek)
    if (filterOnderdeel) params.set("onderdeelTest", filterOnderdeel)
    if (filterActief) params.set("actief", filterActief)

    const res = await fetch(`/api/beheer/hulpbronnen?${params}&t=${Date.now()}`, {
      cache: "no-store",
    })
    if (res.ok) {
      const data = await res.json()
      setHulpbronnen(data.hulpbronnen)
      setFilterGemeenten(data.filters.gemeenten)
      setFilterProvincies(data.filters.provincies || [])
      setFilterOnderdelen(data.filters.onderdelen)
    }
    setLoading(false)
  }, [beheerModus, beheerGemeente, beheerProvincie, zoek, filterOnderdeel, filterActief])

  useEffect(() => {
    if (status !== "loading" && beheerModus) {
      fetchData()
    }
  }, [status, fetchData, beheerModus])

  // Debounced search
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null)
  const handleSearch = (value: string) => {
    setZoek(value)
    if (searchTimeout) clearTimeout(searchTimeout)
    setSearchTimeout(setTimeout(() => fetchData(), 300))
  }

  // Load provincies on mount
  useEffect(() => {
    fetch("/api/beheer/locatie?type=provincies")
      .then((r) => r.json())
      .then((d) => setProvincies((d.provincies || []).map((p: any) => p.name)))
      .catch(() => {})
  }, [])

  // Load gemeenten when provincie changes
  const loadGemeenten = async (provincie: string) => {
    if (!provincie) { setGemeenten([]); return }
    setLoadingLocatie(true)
    const res = await fetch(`/api/beheer/locatie?type=gemeenten&provincie=${encodeURIComponent(provincie)}`)
    if (res.ok) {
      const data = await res.json()
      setGemeenten(data.gemeenten || [])
    }
    setLoadingLocatie(false)
  }

  // Load woonplaatsen when gemeente changes
  const loadWoonplaatsen = async (gemeente: string) => {
    if (!gemeente) { setWoonplaatsen([]); return }
    setLoadingLocatie(true)
    const res = await fetch(`/api/beheer/locatie?type=woonplaatsen&gemeente=${encodeURIComponent(gemeente)}`)
    if (res.ok) {
      const data = await res.json()
      setWoonplaatsen(data.woonplaatsen || [])
    }
    setLoadingLocatie(false)
  }

  // Load wijken when gemeente changes (for WIJK level)
  const loadWijken = async (gemeente: string) => {
    if (!gemeente) { setWijken([]); return }
    setLoadingLocatie(true)
    const res = await fetch(`/api/beheer/locatie?type=wijken&gemeente=${encodeURIComponent(gemeente)}`)
    if (res.ok) {
      const data = await res.json()
      setWijken(data.wijken || [])
    }
    setLoadingLocatie(false)
  }

  // PDOK suggest helper: calls PDOK directly from browser (CORS supported)
  const pdokSuggest = async (query: string, type: "gemeente" | "provincie"): Promise<string[]> => {
    const params = new URLSearchParams({
      q: query,
      fq: `type:${type}`,
      rows: "10",
    })
    const res = await fetch(`https://api.pdok.nl/bzk/locatieserver/search/v3_1/suggest?${params}`)
    if (!res.ok) return []
    const data = await res.json()
    const prefix = type === "gemeente" ? /^Gemeente\s+/i : /^Provincie\s+/i
    const names: string[] = (data.response?.docs || [])
      .map((doc: any) => (doc.weergavenaam || "").replace(prefix, ""))
      .filter((n: string) => n.length > 0)
    return [...new Set(names)].slice(0, 10)
  }

  // Search gemeenten for beheer modus (direct PDOK call from browser)
  useEffect(() => {
    if (beheerGemeenteZoek.length < 2) { setBeheerGemeenteResults([]); return }
    const timer = setTimeout(async () => {
      const results = await pdokSuggest(beheerGemeenteZoek, "gemeente")
      setBeheerGemeenteResults(results)
    }, 200)
    return () => clearTimeout(timer)
  }, [beheerGemeenteZoek])

  // Search provincies for beheer modus (direct PDOK call from browser)
  useEffect(() => {
    if (beheerProvincieZoek.length < 2) { setBeheerProvincieResults([]); return }
    const timer = setTimeout(async () => {
      const results = await pdokSuggest(beheerProvincieZoek, "provincie")
      setBeheerProvincieResults(results)
    }, 200)
    return () => clearTimeout(timer)
  }, [beheerProvincieZoek])

  // Search gemeenten by name (for form, direct PDOK call from browser)
  useEffect(() => {
    if (gemeenteZoek.length < 2) { setGemeenteResults([]); return }
    const timer = setTimeout(async () => {
      const results = await pdokSuggest(gemeenteZoek, "gemeente")
      setGemeenteResults(results)
    }, 200)
    return () => clearTimeout(timer)
  }, [gemeenteZoek])

  // Search gemeenten for scraper (direct PDOK call from browser)
  useEffect(() => {
    if (scrapeGemeenteZoek.length < 2) { setScrapeGemeenteResults([]); return }
    const timer = setTimeout(async () => {
      const results = await pdokSuggest(scrapeGemeenteZoek, "gemeente")
      setScrapeGemeenteResults(results)
    }, 200)
    return () => clearTimeout(timer)
  }, [scrapeGemeenteZoek])

  // Load woonplaatsen/wijken for scraper when gemeente is selected
  const loadScrapeLocatie = async (gemeente: string) => {
    if (!gemeente) {
      setScrapeWoonplaatsen([])
      setScrapeWijken([])
      return
    }
    setScrapeLoadingLocatie(true)
    const [wpRes, wkRes] = await Promise.all([
      fetch(`/api/beheer/locatie?type=woonplaatsen&gemeente=${encodeURIComponent(gemeente)}`),
      fetch(`/api/beheer/locatie?type=wijken&gemeente=${encodeURIComponent(gemeente)}`),
    ])
    if (wpRes.ok) {
      const data = await wpRes.json()
      setScrapeWoonplaatsen(data.woonplaatsen || [])
    }
    if (wkRes.ok) {
      const data = await wkRes.json()
      setScrapeWijken(data.wijken || [])
    }
    setScrapeLoadingLocatie(false)
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
      provincie: editItem.provincie || null,
      dekkingNiveau: editItem.dekkingNiveau || "GEMEENTE",
      dekkingWoonplaatsen: editItem.dekkingWoonplaatsen && editItem.dekkingWoonplaatsen.length > 0
        ? editItem.dekkingWoonplaatsen
        : null,
      dekkingWijken: editItem.dekkingWijken && editItem.dekkingWijken.length > 0
        ? editItem.dekkingWijken
        : null,
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
    const dekkingNiveau = scrapeDekkingNiveau
    const dekkingWoonplaatsen = scrapeSelectedWoonplaatsen.length > 0 ? scrapeSelectedWoonplaatsen : null
    const dekkingWijken = scrapeSelectedWijken.length > 0 ? scrapeSelectedWijken : null
    const gemeente = scrapeGemeente || result.gemeente || ""

    setEditItem({
      ...EMPTY_FORM,
      naam: result.naam,
      beschrijving: result.beschrijving,
      website: result.website,
      telefoon: result.telefoon || "",
      gemeente: dekkingNiveau === "LANDELIJK" ? null : gemeente,
      dekkingNiveau,
      dekkingWoonplaatsen,
      dekkingWijken,
      isActief: false,
    })

    // Load woonplaatsen/wijken in the form if gemeente is set
    if (gemeente && dekkingNiveau !== "LANDELIJK") {
      if (dekkingNiveau === "WOONPLAATS") loadWoonplaatsen(gemeente)
      if (dekkingNiveau === "WIJK") loadWijken(gemeente)
    }

    setShowForm(true)
  }

  if (status === "loading") {
    return (
      <div className="p-8 text-center text-muted-foreground">Laden...</div>
    )
  }

  const isLoggedIn = status === "authenticated"
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
          {beheerModus && (
            <p className="text-sm text-muted-foreground mt-1">
              {hulpbronnen.length} hulpbronnen ({actiefCount} actief, {inactiefCount} inactief)
            </p>
          )}
        </div>
        {isLoggedIn && beheerModus && (
          <div className="flex gap-2">
            <button
              onClick={() => {
                if (!showScraper) {
                  // Pre-fill scraper with current modus context
                  if (beheerModus === "gemeentelijk" && beheerGemeente) {
                    setScrapeGemeente(beheerGemeente)
                    setScrapeDekkingNiveau("GEMEENTE")
                    loadScrapeLocatie(beheerGemeente)
                  } else if (beheerModus === "landelijk") {
                    setScrapeDekkingNiveau("LANDELIJK")
                    setScrapeGemeente("")
                  }
                }
                setShowScraper(!showScraper)
              }}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-[var(--accent-amber)] text-white hover:opacity-90 transition"
            >
              🔍 Web zoeken
            </button>
            <button
              onClick={() => {
                setEditItem({
                  ...EMPTY_FORM,
                  dekkingNiveau: beheerModus === "landelijk" ? "LANDELIJK" : "GEMEENTE",
                  gemeente: beheerModus === "gemeentelijk" ? beheerGemeente : "",
                })
                setShowForm(true)
              }}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-[var(--primary)] text-white hover:opacity-90 transition"
            >
              + Toevoegen
            </button>
          </div>
        )}
      </div>

      {/* Stap 1: Keuze Landelijk of Gemeentelijk */}
      <div className="ker-card mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setBeheerModus("landelijk")
              setBeheerGemeente("")
              setBeheerGemeenteZoek("")
              setHulpbronnen([])
              setZoek("")
              setFilterOnderdeel("")
              setFilterActief("")
            }}
            className={`flex-1 py-4 px-4 rounded-lg text-center font-medium transition border-2 ${
              beheerModus === "landelijk"
                ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                : "border-[var(--border)] bg-[var(--background)] text-foreground hover:border-[var(--primary)] hover:bg-[var(--muted)]"
            }`}
          >
            <div className="text-lg mb-1">🌍</div>
            <div className="text-sm">Landelijk</div>
            <div className="text-[10px] opacity-70 mt-0.5">incl. provincie</div>
          </button>
          <button
            onClick={() => {
              setBeheerModus("gemeentelijk")
              setBeheerProvincie("")
              setHulpbronnen([])
              setZoek("")
              setFilterOnderdeel("")
              setFilterActief("")
            }}
            className={`flex-1 py-4 px-4 rounded-lg text-center font-medium transition border-2 ${
              beheerModus === "gemeentelijk"
                ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                : "border-[var(--border)] bg-[var(--background)] text-foreground hover:border-[var(--primary)] hover:bg-[var(--muted)]"
            }`}
          >
            <div className="text-lg mb-1">🏘️</div>
            <div className="text-sm">Gemeentelijk</div>
            <div className="text-[10px] opacity-70 mt-0.5">incl. woonplaats &amp; wijk</div>
          </button>
        </div>
      </div>

      {/* Landelijk: provincie filter */}
      {beheerModus === "landelijk" && (
        <div className="ker-card mb-4">
          <div className="flex flex-col gap-3">
            {/* Provincie autocomplete */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Filter op provincie (optioneel)
              </label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={beheerProvincie || beheerProvincieZoek}
                    onChange={(e) => {
                      setBeheerProvincieZoek(e.target.value)
                      if (beheerProvincie) {
                        setBeheerProvincie("")
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && beheerProvincieZoek.length >= 2 && !beheerProvincie) {
                        e.preventDefault()
                        const val = beheerProvincieZoek.trim().replace(/\b\w/g, (c) => c.toUpperCase())
                        setBeheerProvincie(val)
                        setBeheerProvincieZoek("")
                        setBeheerProvincieResults([])
                      }
                    }}
                    placeholder="Typ om een provincie te zoeken..."
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-foreground text-sm min-h-[44px]"
                  />
                  {beheerProvincie && (
                    <button
                      type="button"
                      onClick={() => {
                        setBeheerProvincie("")
                        setBeheerProvincieZoek("")
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      ✕
                    </button>
                  )}
                  {beheerProvincieResults.length > 0 && !beheerProvincie && (
                    <div className="absolute z-50 w-full mt-1 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {beheerProvincieResults.map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => {
                            setBeheerProvincie(p)
                            setBeheerProvincieZoek("")
                            setBeheerProvincieResults([])
                          }}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-[var(--muted)] transition"
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {beheerProvincieZoek.length >= 2 && !beheerProvincie && (
                  <button
                    type="button"
                    onClick={() => {
                      const val = beheerProvincieZoek.trim().replace(/\b\w/g, (c) => c.toUpperCase())
                      setBeheerProvincie(val)
                      setBeheerProvincieZoek("")
                      setBeheerProvincieResults([])
                    }}
                    className="px-4 py-2 rounded-lg text-sm font-medium bg-[var(--primary)] text-white hover:opacity-90 transition whitespace-nowrap min-h-[44px]"
                  >
                    Bevestig
                  </button>
                )}
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="Zoek op naam..."
              value={zoek}
              onChange={(e) => handleSearch(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-foreground text-sm min-h-[44px]"
            />
            <select
              value={filterOnderdeel}
              onChange={(e) => setFilterOnderdeel(e.target.value)}
              className="px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-foreground text-sm min-h-[44px]"
            >
              <option value="">Alle categorieën</option>
              {filterOnderdelen.map((o) => (
                <option key={o} value={o}>{o}</option>
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
            </div>
          </div>
        </div>
      )}

      {/* Gemeentelijk: gemeente selectie + filters */}
      {beheerModus === "gemeentelijk" && (
        <div className="ker-card mb-4">
          <div className="flex flex-col gap-3">
            {/* Gemeente autocomplete */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Selecteer gemeente
              </label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={beheerGemeente || beheerGemeenteZoek}
                    onChange={(e) => {
                      setBeheerGemeenteZoek(e.target.value)
                      if (beheerGemeente) {
                        setBeheerGemeente("")
                        setHulpbronnen([])
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && beheerGemeenteZoek.length >= 2 && !beheerGemeente) {
                        e.preventDefault()
                        const val = beheerGemeenteZoek.trim().replace(/\b\w/g, (c) => c.toUpperCase())
                        setBeheerGemeente(val)
                        setBeheerGemeenteZoek("")
                        setBeheerGemeenteResults([])
                      }
                    }}
                    placeholder="Typ om een gemeente te zoeken..."
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-foreground text-sm min-h-[44px]"
                  />
                  {beheerGemeente && (
                    <button
                      type="button"
                      onClick={() => {
                        setBeheerGemeente("")
                        setBeheerGemeenteZoek("")
                        setHulpbronnen([])
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      ✕
                    </button>
                  )}
                  {beheerGemeenteResults.length > 0 && !beheerGemeente && (
                    <div className="absolute z-50 w-full mt-1 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {beheerGemeenteResults.map((g) => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => {
                            setBeheerGemeente(g)
                            setBeheerGemeenteZoek("")
                            setBeheerGemeenteResults([])
                          }}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-[var(--muted)] transition"
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {beheerGemeenteZoek.length >= 2 && !beheerGemeente && (
                  <button
                    type="button"
                    onClick={() => {
                      const val = beheerGemeenteZoek.trim().replace(/\b\w/g, (c) => c.toUpperCase())
                      setBeheerGemeente(val)
                      setBeheerGemeenteZoek("")
                      setBeheerGemeenteResults([])
                    }}
                    className="px-4 py-2 rounded-lg text-sm font-medium bg-[var(--primary)] text-white hover:opacity-90 transition whitespace-nowrap min-h-[44px]"
                  >
                    Bevestig
                  </button>
                )}
              </div>
            </div>
            {/* Extra filters (alleen als gemeente geselecteerd) */}
            {beheerGemeente && (
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  placeholder="Zoek op naam..."
                  value={zoek}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-foreground text-sm min-h-[44px]"
                />
                <select
                  value={filterOnderdeel}
                  onChange={(e) => setFilterOnderdeel(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-foreground text-sm min-h-[44px]"
                >
                  <option value="">Alle categorieën</option>
                  {filterOnderdelen.map((o) => (
                    <option key={o} value={o}>{o}</option>
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
              </div>
            )}
          </div>
        </div>
      )}

      {/* Scraper Section */}
      {showScraper && beheerModus && (
        <div className="ker-card mb-6 border-2 border-[var(--accent-amber)]">
          <h2 className="font-bold text-lg mb-3 flex items-center gap-2">
            🔍 Hulpbronnen zoeken op het web
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Kies eerst het dekkingsgebied en de locatie. Zoek daarna naar mantelzorgorganisaties.
          </p>

          {/* Stap 1: Dekkingsniveau */}
          <div className="mb-3">
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              1. Dekkingsgebied
            </label>
            <div className="flex flex-wrap gap-2">
              {DEKKING_NIVEAUS.map((n) => (
                <button
                  key={n.value}
                  type="button"
                  onClick={() => {
                    setScrapeDekkingNiveau(n.value)
                    if (n.value === "LANDELIJK") {
                      setScrapeGemeente("")
                      setScrapeGemeenteZoek("")
                      setScrapeWoonplaatsen([])
                      setScrapeWijken([])
                      setScrapeSelectedWoonplaatsen([])
                      setScrapeSelectedWijken([])
                    }
                    if (n.value === "GEMEENTE") {
                      setScrapeSelectedWoonplaatsen([])
                      setScrapeSelectedWijken([])
                    }
                    if (n.value === "WOONPLAATS") {
                      setScrapeSelectedWijken([])
                    }
                    if (n.value === "WIJK") {
                      setScrapeSelectedWoonplaatsen([])
                    }
                  }}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition ${
                    scrapeDekkingNiveau === n.value
                      ? "bg-[var(--accent-amber)] text-white"
                      : "bg-[var(--muted)] text-foreground hover:bg-[var(--border)]"
                  }`}
                >
                  {n.label}
                </button>
              ))}
            </div>
          </div>

          {/* Stap 2: Gemeente autocomplete (niet voor LANDELIJK/PROVINCIE) */}
          {(scrapeDekkingNiveau === "GEMEENTE" || scrapeDekkingNiveau === "WOONPLAATS" || scrapeDekkingNiveau === "WIJK") && (
            <div className="mb-3">
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                2. Gemeente
              </label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={scrapeGemeente || scrapeGemeenteZoek}
                    onChange={(e) => {
                      setScrapeGemeenteZoek(e.target.value)
                      if (scrapeGemeente) {
                        setScrapeGemeente("")
                        setScrapeWoonplaatsen([])
                        setScrapeWijken([])
                        setScrapeSelectedWoonplaatsen([])
                        setScrapeSelectedWijken([])
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && scrapeGemeenteZoek.length >= 2 && !scrapeGemeente) {
                        e.preventDefault()
                        const val = scrapeGemeenteZoek.trim().replace(/\b\w/g, (c) => c.toUpperCase())
                        setScrapeGemeente(val)
                        setScrapeGemeenteZoek("")
                        setScrapeGemeenteResults([])
                        setScrapeSelectedWoonplaatsen([])
                        setScrapeSelectedWijken([])
                        loadScrapeLocatie(val)
                      }
                    }}
                    placeholder="Typ om een gemeente te zoeken..."
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-foreground text-sm min-h-[44px]"
                  />
                  {scrapeGemeente && (
                    <button
                      type="button"
                      onClick={() => {
                        setScrapeGemeente("")
                        setScrapeGemeenteZoek("")
                        setScrapeWoonplaatsen([])
                        setScrapeWijken([])
                        setScrapeSelectedWoonplaatsen([])
                        setScrapeSelectedWijken([])
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      ✕
                    </button>
                  )}
                  {scrapeGemeenteResults.length > 0 && !scrapeGemeente && (
                    <div className="absolute z-50 w-full mt-1 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {scrapeGemeenteResults.map((g) => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => {
                            setScrapeGemeente(g)
                            setScrapeGemeenteZoek("")
                            setScrapeGemeenteResults([])
                            setScrapeSelectedWoonplaatsen([])
                            setScrapeSelectedWijken([])
                            loadScrapeLocatie(g)
                          }}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-[var(--muted)] transition"
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                )}
                </div>
                {scrapeGemeenteZoek.length >= 2 && !scrapeGemeente && (
                  <button
                    type="button"
                    onClick={() => {
                      const val = scrapeGemeenteZoek.trim().replace(/\b\w/g, (c) => c.toUpperCase())
                      setScrapeGemeente(val)
                      setScrapeGemeenteZoek("")
                      setScrapeGemeenteResults([])
                      setScrapeSelectedWoonplaatsen([])
                      setScrapeSelectedWijken([])
                      loadScrapeLocatie(val)
                    }}
                    className="px-4 py-2 rounded-lg text-sm font-medium bg-[var(--accent-amber)] text-white hover:opacity-90 transition whitespace-nowrap min-h-[44px]"
                  >
                    Bevestig
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Stap 2b: Woonplaatsen selectie (alleen bij WOONPLAATS niveau) */}
          {scrapeDekkingNiveau === "WOONPLAATS" && scrapeGemeente && (
            <div className="mb-3">
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                3. Woonplaatsen in {scrapeGemeente}
                {scrapeLoadingLocatie && <span className="ml-2 text-[10px]">laden...</span>}
                {scrapeSelectedWoonplaatsen.length > 0 && (
                  <span className="ml-2 text-[10px] text-[var(--primary)]">
                    ({scrapeSelectedWoonplaatsen.length} geselecteerd)
                  </span>
                )}
              </label>
              {scrapeWoonplaatsen.length > 0 ? (
                <div className="flex flex-wrap gap-2 p-3 rounded-lg border border-[var(--border)] bg-[var(--background)] max-h-36 overflow-y-auto">
                  {scrapeWoonplaatsen.map((wp) => {
                    const selected = scrapeSelectedWoonplaatsen.includes(wp)
                    return (
                      <button
                        key={wp}
                        type="button"
                        onClick={() => {
                          setScrapeSelectedWoonplaatsen((prev) =>
                            selected ? prev.filter((w) => w !== wp) : [...prev, wp]
                          )
                        }}
                        className={`px-2 py-1 rounded text-xs font-medium transition ${
                          selected
                            ? "bg-[var(--primary)] text-white"
                            : "bg-[var(--muted)] text-foreground hover:bg-[var(--border)]"
                        }`}
                      >
                        {wp}
                      </button>
                    )
                  })}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {scrapeLoadingLocatie ? "Woonplaatsen laden..." : "Geen woonplaatsen gevonden"}
                </p>
              )}
            </div>
          )}

          {/* Stap 2b: Wijken selectie (alleen bij WIJK niveau) */}
          {scrapeDekkingNiveau === "WIJK" && scrapeGemeente && (
            <div className="mb-3">
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                3. Wijken in {scrapeGemeente}
                {scrapeLoadingLocatie && <span className="ml-2 text-[10px]">laden...</span>}
                {scrapeSelectedWijken.length > 0 && (
                  <span className="ml-2 text-[10px] text-[var(--primary)]">
                    ({scrapeSelectedWijken.length} geselecteerd)
                  </span>
                )}
              </label>
              {scrapeWijken.length > 0 ? (
                <div className="flex flex-wrap gap-2 p-3 rounded-lg border border-[var(--border)] bg-[var(--background)] max-h-36 overflow-y-auto">
                  {scrapeWijken.map((wk) => {
                    const selected = scrapeSelectedWijken.includes(wk)
                    return (
                      <button
                        key={wk}
                        type="button"
                        onClick={() => {
                          setScrapeSelectedWijken((prev) =>
                            selected ? prev.filter((w) => w !== wk) : [...prev, wk]
                          )
                        }}
                        className={`px-2 py-1 rounded text-xs font-medium transition ${
                          selected
                            ? "bg-[var(--primary)] text-white"
                            : "bg-[var(--muted)] text-foreground hover:bg-[var(--border)]"
                        }`}
                      >
                        {wk}
                      </button>
                    )
                  })}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {scrapeLoadingLocatie ? "Wijken laden..." : "Geen wijken gevonden (CBS data niet beschikbaar)"}
                </p>
              )}
            </div>
          )}

          {/* Zoekterm + Zoeken button */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
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

      {/* Geen modus geselecteerd */}
      {!beheerModus && (
        <div className="ker-card text-center py-12">
          <p className="text-muted-foreground">Kies hierboven of je landelijke of gemeentelijke hulpbronnen wilt beheren.</p>
        </div>
      )}

      {/* Gemeentelijk maar nog geen gemeente */}
      {beheerModus === "gemeentelijk" && !beheerGemeente && (
        <div className="ker-card text-center py-12">
          <p className="text-muted-foreground">Selecteer hierboven een gemeente om de hulpbronnen te bekijken.</p>
        </div>
      )}

      {/* Table */}
      {beheerModus && (beheerModus === "landelijk" || beheerGemeente) && (loading ? (
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
                  {item.dekkingNiveau === "LANDELIJK" && (
                    <span className="ker-badge ker-badge-amber text-[10px]">Landelijk</span>
                  )}
                  {item.dekkingNiveau === "PROVINCIE" && item.provincie && (
                    <span className="ker-badge text-[10px]">Prov: {item.provincie}</span>
                  )}
                  {item.dekkingNiveau === "GEMEENTE" && item.gemeente && (
                    <span className="ker-badge text-[10px]">{item.gemeente}</span>
                  )}
                  {item.dekkingNiveau === "WOONPLAATS" && item.gemeente && (
                    <span className="ker-badge text-[10px]">
                      {item.gemeente}{item.dekkingWoonplaatsen ? ` (${item.dekkingWoonplaatsen.length} wp)` : ""}
                    </span>
                  )}
                  {item.dekkingNiveau === "WIJK" && item.gemeente && (
                    <span className="ker-badge text-[10px]">
                      {item.gemeente}{item.dekkingWijken ? ` (${item.dekkingWijken.length} wk)` : ""}
                    </span>
                  )}
                  {!item.dekkingNiveau && !item.gemeente && (
                    <span className="ker-badge ker-badge-amber text-[10px]">Landelijk</span>
                  )}
                  {!item.dekkingNiveau && item.gemeente && (
                    <span className="ker-badge text-[10px]">{item.gemeente}</span>
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
              {isLoggedIn && (
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
              )}
            </div>
          ))}
        </div>
      ))}

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

            {/* Locatie sectie - eerst kiezen */}
            <div className="p-4 rounded-lg border-2 border-[var(--primary)] bg-[var(--primary)]/5 mb-4">
              <h4 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                📍 Locatie (eerst kiezen)
              </h4>

              {/* Dekking Niveau */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Dekkingsgebied *
                </label>
                <div className="flex flex-wrap gap-2">
                  {DEKKING_NIVEAUS.map((n) => (
                    <button
                      key={n.value}
                      type="button"
                      onClick={() => {
                        setEditItem({
                          ...editItem,
                          dekkingNiveau: n.value,
                          ...(n.value === "LANDELIJK" ? { gemeente: null, provincie: null, dekkingWoonplaatsen: null, dekkingWijken: null } : {}),
                          ...(n.value === "PROVINCIE" ? { gemeente: null, dekkingWoonplaatsen: null, dekkingWijken: null } : {}),
                          ...(n.value === "GEMEENTE" ? { dekkingWoonplaatsen: null, dekkingWijken: null } : {}),
                          ...(n.value === "WOONPLAATS" ? { dekkingWijken: null } : {}),
                          ...(n.value === "WIJK" ? { dekkingWoonplaatsen: null } : {}),
                        })
                        if (n.value === "PROVINCIE" && editItem.provincie) {
                          loadGemeenten(editItem.provincie)
                        }
                      }}
                      className={`px-3 py-2 rounded-lg text-xs font-medium transition ${
                        editItem.dekkingNiveau === n.value
                          ? "bg-[var(--primary)] text-white"
                          : "bg-[var(--muted)] text-foreground hover:bg-[var(--border)]"
                      }`}
                    >
                      {n.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Provincie selector */}
              {(editItem.dekkingNiveau === "PROVINCIE") && (
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    Provincie
                  </label>
                  <select
                    value={editItem.provincie || ""}
                    onChange={(e) => {
                      setEditItem({ ...editItem, provincie: e.target.value, gemeente: null })
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-foreground text-sm min-h-[44px]"
                  >
                    <option value="">-- Selecteer provincie --</option>
                    {provincies.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Gemeente selector (for GEMEENTE, WOONPLAATS and WIJK levels) */}
              {(editItem.dekkingNiveau === "GEMEENTE" || editItem.dekkingNiveau === "WOONPLAATS" || editItem.dekkingNiveau === "WIJK") && (
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    Gemeente
                  </label>
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={editItem.gemeente || gemeenteZoek}
                        onChange={(e) => {
                          setGemeenteZoek(e.target.value)
                          if (editItem.gemeente) {
                            setEditItem({ ...editItem, gemeente: null, dekkingWoonplaatsen: null })
                            setWoonplaatsen([])
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && gemeenteZoek.length >= 2 && !editItem.gemeente) {
                            e.preventDefault()
                            const val = gemeenteZoek.trim().replace(/\b\w/g, (c) => c.toUpperCase())
                            setEditItem({ ...editItem, gemeente: val, dekkingWoonplaatsen: null, dekkingWijken: null })
                            setGemeenteZoek("")
                            setGemeenteResults([])
                            if (editItem.dekkingNiveau === "WOONPLAATS") loadWoonplaatsen(val)
                            if (editItem.dekkingNiveau === "WIJK") loadWijken(val)
                          }
                        }}
                        placeholder="Typ om een gemeente te zoeken..."
                        className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-foreground text-sm min-h-[44px]"
                      />
                      {editItem.gemeente && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditItem({ ...editItem, gemeente: null, dekkingWoonplaatsen: null })
                            setGemeenteZoek("")
                            setWoonplaatsen([])
                          }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          ✕
                        </button>
                      )}
                      {gemeenteResults.length > 0 && !editItem.gemeente && (
                        <div className="absolute z-50 w-full mt-1 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg max-h-48 overflow-y-auto">
                          {gemeenteResults.map((g) => (
                            <button
                              key={g}
                              type="button"
                              onClick={() => {
                                setEditItem({ ...editItem, gemeente: g, dekkingWoonplaatsen: null, dekkingWijken: null })
                                setGemeenteZoek("")
                                setGemeenteResults([])
                                if (editItem.dekkingNiveau === "WOONPLAATS") {
                                  loadWoonplaatsen(g)
                                }
                                if (editItem.dekkingNiveau === "WIJK") {
                                  loadWijken(g)
                                }
                              }}
                              className="w-full px-3 py-2 text-left text-sm hover:bg-[var(--muted)] transition"
                            >
                              {g}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    {gemeenteZoek.length >= 2 && !editItem.gemeente && (
                      <button
                        type="button"
                        onClick={() => {
                          const val = gemeenteZoek.trim().replace(/\b\w/g, (c) => c.toUpperCase())
                          setEditItem({ ...editItem, gemeente: val, dekkingWoonplaatsen: null, dekkingWijken: null })
                          setGemeenteZoek("")
                          setGemeenteResults([])
                          if (editItem.dekkingNiveau === "WOONPLAATS") loadWoonplaatsen(val)
                          if (editItem.dekkingNiveau === "WIJK") loadWijken(val)
                        }}
                        className="px-4 py-2 rounded-lg text-sm font-medium bg-[var(--primary)] text-white hover:opacity-90 transition whitespace-nowrap min-h-[44px]"
                      >
                        Bevestig
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Woonplaatsen multiselect */}
              {editItem.dekkingNiveau === "WOONPLAATS" && editItem.gemeente && (
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    Woonplaatsen in {editItem.gemeente}
                    {loadingLocatie && <span className="ml-2 text-[10px]">laden...</span>}
                  </label>
                  {woonplaatsen.length > 0 ? (
                    <div className="flex flex-wrap gap-2 p-3 rounded-lg border border-[var(--border)] bg-[var(--background)] max-h-48 overflow-y-auto">
                      {woonplaatsen.map((wp) => {
                        const selected = (editItem.dekkingWoonplaatsen || []).includes(wp)
                        return (
                          <button
                            key={wp}
                            type="button"
                            onClick={() => {
                              const current = editItem.dekkingWoonplaatsen || []
                              const updated = selected
                                ? current.filter((w) => w !== wp)
                                : [...current, wp]
                              setEditItem({ ...editItem, dekkingWoonplaatsen: updated.length > 0 ? updated : null })
                            }}
                            className={`px-2 py-1 rounded text-xs font-medium transition ${
                              selected
                                ? "bg-[var(--primary)] text-white"
                                : "bg-[var(--muted)] text-foreground hover:bg-[var(--border)]"
                            }`}
                          >
                            {wp}
                          </button>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      {loadingLocatie ? "Woonplaatsen laden..." : "Geen woonplaatsen gevonden"}
                    </p>
                  )}
                </div>
              )}

              {/* Wijken multiselect */}
              {editItem.dekkingNiveau === "WIJK" && editItem.gemeente && (
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    Wijken in {editItem.gemeente}
                    {loadingLocatie && <span className="ml-2 text-[10px]">laden...</span>}
                  </label>
                  {wijken.length > 0 ? (
                    <div className="flex flex-wrap gap-2 p-3 rounded-lg border border-[var(--border)] bg-[var(--background)] max-h-48 overflow-y-auto">
                      {wijken.map((wk) => {
                        const selected = (editItem.dekkingWijken || []).includes(wk)
                        return (
                          <button
                            key={wk}
                            type="button"
                            onClick={() => {
                              const current = editItem.dekkingWijken || []
                              const updated = selected
                                ? current.filter((w) => w !== wk)
                                : [...current, wk]
                              setEditItem({ ...editItem, dekkingWijken: updated.length > 0 ? updated : null })
                            }}
                            className={`px-2 py-1 rounded text-xs font-medium transition ${
                              selected
                                ? "bg-[var(--primary)] text-white"
                                : "bg-[var(--muted)] text-foreground hover:bg-[var(--border)]"
                            }`}
                          >
                            {wk}
                          </button>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      {loadingLocatie ? "Wijken laden..." : "Geen wijken gevonden (CBS data niet beschikbaar)"}
                    </p>
                  )}
                </div>
              )}
            </div>
            {/* Einde locatie sectie */}

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
