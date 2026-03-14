"use client"

import { useState, useEffect, useCallback } from "react"
import { searchStreets } from "@/lib/pdok"
import { profielContent } from "@/config/content"

const c = profielContent

// ============================================
// TYPES
// ============================================

interface StreetResult {
  weergavenaam: string
  straat: string
  woonplaats: string
  gemeente: string
  postcode?: string
  wijknaam?: string
}

interface WizardData {
  // Stap 1: Over jou
  naam: string
  email: string
  telefoon: string
  // Stap 2: Jouw naaste
  naasteNaam: string
  naasteRelatie: string
  // Stap 3: Adressen
  adres: StreetResult | null
  naasteAdres: StreetResult | null
  // Stap 4: De situatie
  aandoening: string
  situatieTags: string[]
  // Stap 5: Jouw interesses
  interesseCategorieen: string[]
}

interface Tag {
  slug: string
  naam: string
  emoji?: string
  type: string
}

const STAPPEN = [
  { nummer: 1, titel: "Over jou", emoji: "\uD83D\uDC64", uitleg: "We beginnen met je basisgegevens." },
  { nummer: 2, titel: "Jouw naaste", emoji: "\uD83D\uDC9A", uitleg: "Voor wie zorg je? Dit helpt ons om passende informatie te tonen." },
  { nummer: 3, titel: "Woonadressen", emoji: "\uD83C\uDFE0", uitleg: "Met adressen vinden we hulp bij jou en je naaste in de buurt." },
  { nummer: 4, titel: "De situatie", emoji: "\uD83C\uDFE5", uitleg: "Dit helpt ons om artikelen en hulp te tonen die bij jouw situatie passen." },
  { nummer: 5, titel: "Jouw interesses", emoji: "\u2B50", uitleg: "Kies waar je meer over wilt lezen. Je kunt dit later altijd aanpassen." },
  { nummer: 6, titel: "Overzicht", emoji: "\u2705", uitleg: "Controleer je gegevens en sla ze op." },
]

const INTERESSE_CATEGORIEEN = [
  { slug: "praktische-tips", naam: "Praktische tips", emoji: "\uD83D\uDCCB", uitleg: "Slimme oplossingen voor het dagelijks leven als mantelzorger" },
  { slug: "zelfzorg-balans", naam: "Zelfzorg & balans", emoji: "\uD83E\uDDD8", uitleg: "Tips om goed voor jezelf te blijven zorgen" },
  { slug: "rechten-regelingen", naam: "Rechten & regelingen", emoji: "\u2696\uFE0F", uitleg: "Weten waar je recht op hebt" },
  { slug: "geld-financien", naam: "Geld & financien", emoji: "\uD83D\uDCB0", uitleg: "Financiele tegemoetkomingen en tips" },
  { slug: "hulpmiddelen-technologie", naam: "Hulpmiddelen", emoji: "\uD83D\uDD27", uitleg: "Hulpmiddelen en technologie die het leven makkelijker maken" },
  { slug: "werk-mantelzorg", naam: "Werk & mantelzorg", emoji: "\uD83D\uDCBC", uitleg: "Werk en zorg combineren, je rechten op het werk" },
  { slug: "samenwerken-netwerk", naam: "Samenwerken", emoji: "\uD83E\uDD1D", uitleg: "Je netwerk inschakelen en samenwerken met anderen" },
]

// ============================================
// STREET SEARCH (inline)
// ============================================

function WizardStreetSearch({ label, value, onChange, placeholder }: {
  label: string
  value: StreetResult | null
  onChange: (street: StreetResult | null) => void
  placeholder?: string
}) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<StreetResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)

  const handleSearch = async (searchQuery: string) => {
    setQuery(searchQuery)
    if (searchQuery.length < 2) { setResults([]); setShowResults(false); return }
    setIsSearching(true)
    try {
      const searchResults = await searchStreets(searchQuery)
      setResults(searchResults.map((r) => ({
        weergavenaam: r.weergavenaam,
        straat: r.straat || "",
        woonplaats: r.woonplaats || "",
        gemeente: r.gemeente || "",
      })))
      setShowResults(true)
    } catch { setResults([]) }
    finally { setIsSearching(false) }
  }

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-foreground mb-2">{label}</label>
      {value ? (
        <div className="p-3 bg-muted rounded-xl">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <p className="font-medium text-foreground">{value.straat}</p>
              <p className="text-sm text-muted-foreground">
                {value.postcode && `${value.postcode}, `}{value.woonplaats}
              </p>
              <p className="text-xs text-muted-foreground">Gemeente: {value.gemeente}</p>
            </div>
            <button type="button" onClick={() => onChange(null)} className="p-2 text-muted-foreground hover:text-foreground hover:bg-background rounded-lg transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
          </div>
        </div>
      ) : (
        <div className="relative">
          <input value={query} onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => query.length >= 2 && setShowResults(true)}
            placeholder={placeholder || "Zoek op postcode of straatnaam"}
            className="ker-input" />
          {isSearching && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
      )}
      {showResults && results.length > 0 && (
        <div className="absolute z-20 w-full mt-2 bg-card border-2 border-border rounded-xl shadow-lg max-h-52 overflow-auto">
          {results.map((result, index) => (
            <button key={index} type="button"
              onClick={() => { onChange(result); setQuery(""); setShowResults(false) }}
              className="w-full text-left px-4 py-3 hover:bg-muted transition-colors border-b border-border last:border-b-0">
              <span className="font-medium text-foreground">{result.straat}</span>
              <span className="text-muted-foreground">, {result.woonplaats}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================
// MAIN WIZARD
// ============================================

interface ProfielWizardProps {
  onComplete: () => void
  onCancel: () => void
}

export function ProfielWizard({ onComplete, onCancel }: ProfielWizardProps) {
  const [stap, setStap] = useState(1)
  const [data, setData] = useState<WizardData>({
    naam: "", email: "", telefoon: "",
    naasteNaam: "", naasteRelatie: "",
    adres: null, naasteAdres: null,
    aandoening: "", situatieTags: [],
    interesseCategorieen: [],
  })
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState("")
  const [beschikbareTags, setBeschikbareTags] = useState<Tag[]>([])

  // Laad bestaande gegevens
  const loadProfile = useCallback(async () => {
    try {
      const [profileRes, tagRes, voorkeurRes] = await Promise.all([
        fetch("/api/profile"),
        fetch("/api/content/tags"),
        fetch("/api/user/voorkeuren"),
      ])

      if (profileRes.ok) {
        const p = await profileRes.json()
        const hasAdres = p.straat || p.woonplaats || p.gemeente
        const hasNaasteAdres = p.naasteStraat || p.naasteWoonplaats || p.naasteGemeente

        setData((prev) => ({
          ...prev,
          naam: p.naam || prev.naam,
          email: p.email || prev.email,
          telefoon: p.telefoon || prev.telefoon,
          naasteNaam: p.naasteNaam || prev.naasteNaam,
          naasteRelatie: p.naasteRelatie || prev.naasteRelatie,
          adres: hasAdres ? {
            weergavenaam: [p.straat, p.woonplaats].filter(Boolean).join(", "),
            straat: p.straat || "", woonplaats: p.woonplaats || "",
            gemeente: p.gemeente || "", postcode: p.postcode || "",
            wijknaam: p.wijk || "",
          } : prev.adres,
          naasteAdres: hasNaasteAdres ? {
            weergavenaam: [p.naasteStraat, p.naasteWoonplaats].filter(Boolean).join(", "),
            straat: p.naasteStraat || "", woonplaats: p.naasteWoonplaats || "",
            gemeente: p.naasteGemeente || "", wijknaam: p.naasteWijk || "",
          } : prev.naasteAdres,
        }))
      }

      if (tagRes.ok) {
        const tagData = await tagRes.json()
        setBeschikbareTags([...(tagData.aandoeningen || []), ...(tagData.situaties || [])])
      }

      if (voorkeurRes.ok) {
        const vData = await voorkeurRes.json()
        setData((prev) => ({
          ...prev,
          aandoening: vData.aandoening || prev.aandoening,
          situatieTags: vData.voorkeuren?.filter((v: { type: string }) => v.type === "TAG").map((v: { slug: string }) => v.slug) || prev.situatieTags,
          interesseCategorieen: vData.voorkeuren?.filter((v: { type: string }) => v.type === "CATEGORIE").map((v: { slug: string }) => v.slug) || prev.interesseCategorieen,
        }))
      }
    } catch {
      // Stille fout bij laden
    }
  }, [])

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  // Tussentijds opslaan per stap
  const saveStep = async () => {
    try {
      // Sla profiel data op (stap 1-3)
      if (stap <= 3) {
        await fetch("/api/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            naam: data.naam,
            telefoon: data.telefoon || undefined,
            straat: data.adres?.straat,
            woonplaats: data.adres?.woonplaats,
            postcode: data.adres?.postcode,
            gemeente: data.adres?.gemeente,
            wijk: data.adres?.wijknaam,
            naasteNaam: data.naasteNaam,
            naasteRelatie: data.naasteRelatie,
            naasteStraat: data.naasteAdres?.straat,
            naasteWoonplaats: data.naasteAdres?.woonplaats,
            naasteGemeente: data.naasteAdres?.gemeente,
            naasteWijk: data.naasteAdres?.wijknaam,
          }),
        })
      }

      // Sla voorkeuren op (stap 4-5)
      if (stap === 4 || stap === 5) {
        const voorkeuren = [
          ...data.situatieTags.map((slug) => ({ type: "TAG", slug })),
          ...data.interesseCategorieen.map((slug) => ({ type: "CATEGORIE", slug })),
        ]
        await fetch("/api/user/voorkeuren", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            aandoening: data.aandoening || null,
            voorkeuren,
          }),
        })
      }
    } catch {
      // Tussentijds opslaan is best-effort
    }
  }

  const handleNext = async () => {
    await saveStep()
    if (stap < 6) setStap(stap + 1)
  }

  const handlePrev = () => {
    if (stap > 1) setStap(stap - 1)
  }

  const handleFinish = async () => {
    setIsSaving(true)
    setSaveError("")
    try {
      // Sla alles op
      await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          naam: data.naam,
          telefoon: data.telefoon || undefined,
          straat: data.adres?.straat,
          woonplaats: data.adres?.woonplaats,
          postcode: data.adres?.postcode,
          gemeente: data.adres?.gemeente,
          wijk: data.adres?.wijknaam,
          naasteNaam: data.naasteNaam,
          naasteRelatie: data.naasteRelatie,
          naasteStraat: data.naasteAdres?.straat,
          naasteWoonplaats: data.naasteAdres?.woonplaats,
          naasteGemeente: data.naasteAdres?.gemeente,
          naasteWijk: data.naasteAdres?.wijknaam,
        }),
      })

      const voorkeuren = [
        ...data.situatieTags.map((slug) => ({ type: "TAG", slug })),
        ...data.interesseCategorieen.map((slug) => ({ type: "CATEGORIE", slug })),
      ]
      await fetch("/api/user/voorkeuren", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          aandoening: data.aandoening || null,
          voorkeuren,
        }),
      })

      // Update sessionStorage
      sessionStorage.setItem("naaste_gegevens", JSON.stringify({
        naam: data.naasteNaam,
        relatie: data.naasteRelatie,
      }))

      onComplete()
    } catch {
      setSaveError("Opslaan mislukt. Probeer het opnieuw.")
    } finally {
      setIsSaving(false)
    }
  }

  const canProceed = (): boolean => {
    switch (stap) {
      case 1: return data.naam.trim().length > 0
      case 2: return true // Alles optioneel
      case 3: return true // Adressen optioneel
      case 4: return true // Tags optioneel
      case 5: return true // Interesses optioneel
      case 6: return true
      default: return true
    }
  }

  const currentStap = STAPPEN[stap - 1]
  const progress = (stap / 6) * 100

  // Aandoeningen en situaties apart
  const aandoeningen = beschikbareTags.filter((t) => t.type === "AANDOENING")
  const situaties = beschikbareTags.filter((t) => t.type === "SITUATIE")

  return (
    <div className="ker-page-content">
      {/* Header + voortgang */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <button onClick={onCancel} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Annuleren
          </button>
          <span className="text-sm font-medium text-muted-foreground">
            Stap {stap} van 6
          </span>
        </div>

        {/* Voortgangsbalk */}
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Stap stepper */}
        <div className="flex justify-between mt-3">
          {STAPPEN.map((s) => (
            <button
              key={s.nummer}
              onClick={() => s.nummer < stap && setStap(s.nummer)}
              className={`flex flex-col items-center gap-0.5 transition-all ${
                s.nummer === stap
                  ? "opacity-100"
                  : s.nummer < stap
                    ? "opacity-60 cursor-pointer hover:opacity-80"
                    : "opacity-30"
              }`}
              disabled={s.nummer > stap}
            >
              <span className="text-lg">{s.nummer < stap ? "\u2705" : s.emoji}</span>
              <span className="text-[10px] font-medium text-muted-foreground hidden sm:block">{s.titel}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Stap titel + uitleg */}
      <div className="mb-5">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <span>{currentStap.emoji}</span>
          {currentStap.titel}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">{currentStap.uitleg}</p>
      </div>

      {/* Stap inhoud */}
      <div className="space-y-4 min-h-[200px]">
        {/* STAP 1: Over jou */}
        {stap === 1 && (
          <div className="ker-card space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Naam *</label>
              <input
                value={data.naam}
                onChange={(e) => setData({ ...data, naam: e.target.value })}
                className="ker-input"
                placeholder="Je volledige naam"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">E-mail</label>
              <input
                type="email"
                value={data.email}
                className="ker-input bg-muted"
                disabled
                title="E-mail kan niet gewijzigd worden"
              />
              <p className="text-xs text-muted-foreground mt-1">Je e-mail is gekoppeld aan je account en kan niet gewijzigd worden.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Telefoonnummer</label>
              <input
                type="tel"
                value={data.telefoon}
                onChange={(e) => setData({ ...data, telefoon: e.target.value })}
                className="ker-input"
                placeholder="06 12345678"
                autoComplete="tel"
              />
              <p className="text-xs text-muted-foreground mt-1">Voor WhatsApp koppeling. Niet verplicht.</p>
            </div>
          </div>
        )}

        {/* STAP 2: Jouw naaste */}
        {stap === 2 && (
          <div className="ker-card space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Naam van je naaste</label>
              <input
                value={data.naasteNaam}
                onChange={(e) => setData({ ...data, naasteNaam: e.target.value })}
                className="ker-input"
                placeholder="Naam van degene voor wie je zorgt"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Wat is jullie relatie?</label>
              <select
                value={data.naasteRelatie}
                onChange={(e) => setData({ ...data, naasteRelatie: e.target.value })}
                className="ker-input"
              >
                {c.relatieOpties.map((optie) => (
                  <option key={optie.value} value={optie.value}>{optie.label}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* STAP 3: Woonadressen */}
        {stap === 3 && (
          <div className="space-y-4">
            <div className="ker-card space-y-4">
              <h3 className="font-semibold text-foreground">Waar woon jij?</h3>
              <WizardStreetSearch
                label="Jouw adres"
                value={data.adres}
                onChange={(adres) => setData({ ...data, adres })}
                placeholder="Begin met typen, bijv. Kerkstraat"
              />
            </div>
            <div className="ker-card space-y-4">
              <h3 className="font-semibold text-foreground">Waar woont je naaste?</h3>
              <WizardStreetSearch
                label={data.naasteNaam ? `Adres van ${data.naasteNaam}` : "Adres van je naaste"}
                value={data.naasteAdres}
                onChange={(adres) => setData({ ...data, naasteAdres: adres })}
                placeholder="Begin met typen, bijv. Kerkstraat"
              />
              <p className="text-xs text-muted-foreground">
                Met deze adressen zoeken we hulp dichtbij, zowel voor jou als voor je naaste.
              </p>
            </div>
          </div>
        )}

        {/* STAP 4: De situatie */}
        {stap === 4 && (
          <div className="space-y-4">
            {/* Aandoening */}
            <div className="ker-card space-y-3">
              <h3 className="font-semibold text-foreground">
                Welke aandoening heeft {data.naasteNaam || "je naaste"}?
              </h3>
              <p className="text-sm text-muted-foreground">
                Dit helpt ons om relevante artikelen en hulp te tonen.
              </p>
              <div className="flex flex-wrap gap-2">
                {aandoeningen.map((tag) => (
                  <button
                    key={tag.slug}
                    onClick={() => setData({ ...data, aandoening: data.aandoening === tag.slug ? "" : tag.slug })}
                    className={`px-3 py-2 rounded-xl text-sm font-medium transition-all border-2 ${
                      data.aandoening === tag.slug
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card border-border text-foreground hover:border-primary/30"
                    }`}
                  >
                    {tag.emoji && <span className="mr-1">{tag.emoji}</span>}
                    {tag.naam}
                  </button>
                ))}
              </div>
            </div>

            {/* Situatietags */}
            <div className="ker-card space-y-3">
              <h3 className="font-semibold text-foreground">Herken je jezelf hierin?</h3>
              <p className="text-sm text-muted-foreground">
                Kies wat op jouw situatie van toepassing is. Je mag meerdere kiezen.
              </p>
              <div className="flex flex-wrap gap-2">
                {situaties.map((tag) => {
                  const selected = data.situatieTags.includes(tag.slug)
                  return (
                    <button
                      key={tag.slug}
                      onClick={() => setData({
                        ...data,
                        situatieTags: selected
                          ? data.situatieTags.filter((s) => s !== tag.slug)
                          : [...data.situatieTags, tag.slug],
                      })}
                      className={`px-3 py-2 rounded-xl text-sm font-medium transition-all border-2 ${
                        selected
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-card border-border text-foreground hover:border-primary/30"
                      }`}
                    >
                      {tag.emoji && <span className="mr-1">{tag.emoji}</span>}
                      {tag.naam}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* STAP 5: Jouw interesses */}
        {stap === 5 && (
          <div className="space-y-3">
            {INTERESSE_CATEGORIEEN.map((cat) => {
              const selected = data.interesseCategorieen.includes(cat.slug)
              return (
                <button
                  key={cat.slug}
                  onClick={() => setData({
                    ...data,
                    interesseCategorieen: selected
                      ? data.interesseCategorieen.filter((s) => s !== cat.slug)
                      : [...data.interesseCategorieen, cat.slug],
                  })}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                    selected
                      ? "bg-primary/5 border-primary"
                      : "bg-card border-border hover:border-primary/30"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{cat.emoji}</span>
                      <div>
                        <p className="font-semibold text-foreground">{cat.naam}</p>
                        <p className="text-sm text-muted-foreground">{cat.uitleg}</p>
                      </div>
                    </div>
                    <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                      selected ? "bg-primary border-primary text-white" : "border-muted-foreground/30"
                    }`}>
                      {selected && (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}

        {/* STAP 6: Overzicht */}
        {stap === 6 && (
          <div className="space-y-4">
            {/* Over jou */}
            <div className="ker-card">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <span>{STAPPEN[0].emoji}</span> Over jou
                </h3>
                <button onClick={() => setStap(1)} className="text-xs text-primary font-medium hover:underline">Aanpassen</button>
              </div>
              <div className="text-sm space-y-1 text-foreground/80">
                <p><strong>Naam:</strong> {data.naam || "-"}</p>
                <p><strong>E-mail:</strong> {data.email || "-"}</p>
                {data.telefoon && <p><strong>Telefoon:</strong> {data.telefoon}</p>}
              </div>
            </div>

            {/* Naaste */}
            <div className="ker-card">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <span>{STAPPEN[1].emoji}</span> Jouw naaste
                </h3>
                <button onClick={() => setStap(2)} className="text-xs text-primary font-medium hover:underline">Aanpassen</button>
              </div>
              <div className="text-sm space-y-1 text-foreground/80">
                <p><strong>Naam:</strong> {data.naasteNaam || "-"}</p>
                <p><strong>Relatie:</strong> {data.naasteRelatie ? c.relatieOpties.find((o) => o.value === data.naasteRelatie)?.label || data.naasteRelatie : "-"}</p>
              </div>
            </div>

            {/* Adressen */}
            <div className="ker-card">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <span>{STAPPEN[2].emoji}</span> Woonadressen
                </h3>
                <button onClick={() => setStap(3)} className="text-xs text-primary font-medium hover:underline">Aanpassen</button>
              </div>
              <div className="text-sm space-y-1 text-foreground/80">
                <p><strong>Jouw adres:</strong> {data.adres ? `${data.adres.straat}, ${data.adres.woonplaats}` : "Nog niet ingevuld"}</p>
                <p><strong>Adres naaste:</strong> {data.naasteAdres ? `${data.naasteAdres.straat}, ${data.naasteAdres.woonplaats}` : "Nog niet ingevuld"}</p>
              </div>
            </div>

            {/* Situatie + interesses */}
            <div className="ker-card">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <span>{STAPPEN[3].emoji}</span> Situatie & interesses
                </h3>
                <button onClick={() => setStap(4)} className="text-xs text-primary font-medium hover:underline">Aanpassen</button>
              </div>
              <div className="text-sm space-y-1 text-foreground/80">
                {data.aandoening && (
                  <p><strong>Aandoening:</strong> {aandoeningen.find((a) => a.slug === data.aandoening)?.naam || data.aandoening}</p>
                )}
                {data.situatieTags.length > 0 && (
                  <p><strong>Situatie:</strong> {data.situatieTags.map((s) => situaties.find((t) => t.slug === s)?.naam || s).join(", ")}</p>
                )}
                {data.interesseCategorieen.length > 0 && (
                  <p><strong>Interesses:</strong> {data.interesseCategorieen.map((s) => INTERESSE_CATEGORIEEN.find((c) => c.slug === s)?.naam || s).join(", ")}</p>
                )}
                {!data.aandoening && data.situatieTags.length === 0 && data.interesseCategorieen.length === 0 && (
                  <p className="text-muted-foreground">Nog niets gekozen</p>
                )}
              </div>
            </div>

            {saveError && (
              <div className="p-3 bg-[var(--accent-red-bg)] text-[var(--accent-red)] rounded-xl text-sm">
                {saveError}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigatie knoppen */}
      <div className="flex gap-3 mt-6">
        {stap > 1 && (
          <button onClick={handlePrev} className="ker-btn flex-1 bg-muted text-foreground hover:bg-muted/80">
            Vorige
          </button>
        )}
        {stap < 6 ? (
          <button
            onClick={handleNext}
            disabled={!canProceed()}
            className="ker-btn ker-btn-primary flex-1"
          >
            Volgende
          </button>
        ) : (
          <button
            onClick={handleFinish}
            disabled={isSaving}
            className="ker-btn ker-btn-primary flex-1"
          >
            {isSaving ? "Opslaan..." : "Opslaan"}
          </button>
        )}
      </div>
    </div>
  )
}
