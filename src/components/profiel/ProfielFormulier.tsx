"use client"

import { useState, useEffect, useCallback } from "react"
import { searchStreets } from "@/lib/pdok"
import { profielContent } from "@/config/content"
import { bepaalProfielTags, AUTOMATISCHE_TAG_SLUGS } from "@/lib/profiel-tags"

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

interface Tag {
  slug: string
  naam: string
  emoji?: string
  type: string
}

export interface ProfielFormulierData {
  // Over jou
  naam: string
  email: string
  telefoon: string
  adres: StreetResult | null
  // Naaste
  naasteNaam: string
  naasteRelatie: string
  naasteAdres: StreetResult | null
  // Zorgsituatie
  woonsituatie: string
  werkstatus: string
  // Zorgthema's (multi-select)
  zorgthemas: string[]
  // Situatie-tags
  situatieTags: string[]
  // Interesses
  interesseCategorieen: string[]
  // Bestaande data (voor tag-afleiding)
  careHoursPerWeek?: number | null
  careSince?: string | null
  dateOfBirth?: string | null
}

interface ProfielFormulierProps {
  onSave: () => void
  onSkip?: () => void
  showSkip?: boolean
  variant?: "onboarding" | "profiel"
}

// ============================================
// INTERESSE CATEGORIEËN
// ============================================

const INTERESSE_CATEGORIEEN = [
  { slug: "praktische-tips", naam: "Praktische tips", emoji: "\uD83D\uDCCB", uitleg: "Slimme oplossingen voor het dagelijks leven als mantelzorger." },
  { slug: "zelfzorg-balans", naam: "Zelfzorg en balans", emoji: "\uD83E\uDDD8", uitleg: "Tips om goed voor jezelf te blijven zorgen." },
  { slug: "rechten-regelingen", naam: "Rechten en regelingen", emoji: "\u2696\uFE0F", uitleg: "Weten waar je recht op hebt. Over WMO, PGB en andere regelingen." },
  { slug: "geld-financien", naam: "Geld en financien", emoji: "\uD83D\uDCB0", uitleg: "Financiele tegemoetkomingen en bespaartips." },
  { slug: "hulpmiddelen-technologie", naam: "Hulpmiddelen", emoji: "\uD83D\uDD27", uitleg: "Hulpmiddelen en technologie die het leven makkelijker maken." },
  { slug: "werk-mantelzorg", naam: "Werk en mantelzorg", emoji: "\uD83D\uDCBC", uitleg: "Hoe combineer je werk met zorgen?" },
  { slug: "samenwerken-netwerk", naam: "Samen zorgen", emoji: "\uD83E\uDD1D", uitleg: "Hoe schakel je mensen om je heen in?" },
]

// ============================================
// WOONSITUATIE & WERKSTATUS OPTIES
// ============================================

const WOONSITUATIE_OPTIES = [
  { value: "samen", label: "We wonen samen", emoji: "\uD83C\uDFE0" },
  { value: "dichtbij", label: "Dichtbij (zelfde stad/dorp)", emoji: "\uD83D\uDCCD" },
  { value: "op-afstand", label: "Op afstand (andere stad/regio)", emoji: "\uD83D\uDE97" },
]

const WERKSTATUS_OPTIES = [
  { value: "fulltime", label: "Ja, ik werk fulltime", emoji: "\uD83D\uDCBC" },
  { value: "parttime", label: "Ja, ik werk parttime", emoji: "\uD83D\uDD50" },
  { value: "niet-werkend", label: "Nee, ik werk niet", emoji: "\uD83C\uDFE0" },
  { value: "student", label: "Ik studeer", emoji: "\uD83C\uDF93" },
  { value: "gepensioneerd", label: "Ik ben gepensioneerd", emoji: "\uD83D\uDC74" },
]

// ============================================
// STREET SEARCH (inline)
// ============================================

function FormStreetSearch({ label, value, onChange, placeholder }: {
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
            <button type="button" onClick={() => onChange(null)} className="p-2 text-muted-foreground hover:text-foreground hover:bg-background rounded-lg transition-colors" aria-label="Adres wijzigen">
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
// RADIO GROUP
// ============================================

function RadioGroup({ value, options, onChange }: {
  value: string
  options: { value: string; label: string; emoji: string }[]
  onChange: (value: string) => void
}) {
  return (
    <div className="space-y-2">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(value === option.value ? "" : option.value)}
          className={`w-full text-left p-3 rounded-xl border-2 transition-all flex items-center gap-3 ${
            value === option.value
              ? "bg-primary/10 border-primary"
              : "bg-card border-border hover:border-primary/30"
          }`}
        >
          <span className="text-xl flex-shrink-0">{option.emoji}</span>
          <span className={`font-medium ${value === option.value ? "text-primary" : "text-foreground"}`}>
            {option.label}
          </span>
          <div className={`ml-auto w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
            value === option.value ? "border-primary bg-primary" : "border-muted-foreground/30"
          }`}>
            {value === option.value && <div className="w-2 h-2 rounded-full bg-white" />}
          </div>
        </button>
      ))}
    </div>
  )
}

// ============================================
// MAIN COMPONENT
// ============================================

export function ProfielFormulier({ onSave, onSkip, showSkip = false, variant = "profiel" }: ProfielFormulierProps) {
  const [data, setData] = useState<ProfielFormulierData>({
    naam: "", email: "", telefoon: "",
    adres: null,
    naasteNaam: "", naasteRelatie: "",
    naasteAdres: null,
    woonsituatie: "", werkstatus: "",
    zorgthemas: [],
    situatieTags: [],
    interesseCategorieen: [],
  })
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState("")
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [beschikbareTags, setBeschikbareTags] = useState<Tag[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Bereken automatische tags op basis van huidige data
  const automatischeTags = bepaalProfielTags({
    werkstatus: data.werkstatus || null,
    woonsituatie: data.woonsituatie || null,
    careRecipient: data.naasteRelatie || null,
    careHoursPerWeek: data.careHoursPerWeek,
    careSince: data.careSince ? new Date(data.careSince) : null,
    dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
  })

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
          woonsituatie: p.woonsituatie || prev.woonsituatie,
          werkstatus: p.werkstatus || prev.werkstatus,
          careHoursPerWeek: p.careHoursPerWeek,
          careSince: p.careSince,
          dateOfBirth: p.dateOfBirth,
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
        setBeschikbareTags([...(tagData.zorgthemas || []), ...(tagData.situaties || [])])
      }

      if (voorkeurRes.ok) {
        const vData = await voorkeurRes.json()
        // Zorgthema's als array (nieuw) of fallback naar single
        const loadedZorgthemas = vData.zorgthemas?.length > 0
          ? vData.zorgthemas
          : vData.aandoening ? [vData.aandoening] : []

        // Situatie-tags: filter zorgthema's eruit (die zitten nu apart)
        const zorgthemaSlugs = new Set(loadedZorgthemas)
        const loadedSituatieTags = vData.voorkeuren
          ?.filter((v: { type: string; slug: string }) =>
            v.type === "TAG" && !zorgthemaSlugs.has(v.slug)
          )
          .map((v: { slug: string }) => v.slug) || []

        const loadedInteresses = vData.voorkeuren
          ?.filter((v: { type: string }) => v.type === "CATEGORIE")
          .map((v: { slug: string }) => v.slug) || []

        setData((prev) => ({
          ...prev,
          zorgthemas: loadedZorgthemas,
          situatieTags: loadedSituatieTags,
          interesseCategorieen: loadedInteresses,
        }))
      }
    } catch {
      // Stille fout bij laden
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  // Opslaan
  const handleSave = async () => {
    setIsSaving(true)
    setSaveError("")
    setSaveSuccess(false)

    try {
      // 1. Profiel data opslaan
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
          woonsituatie: data.woonsituatie || null,
          werkstatus: data.werkstatus || null,
        }),
      })

      // 2. Combineer handmatige situatie-tags met automatische
      const alleSituatieTags = [...new Set([...automatischeTags, ...data.situatieTags])]

      // 3. Voorkeuren opslaan (situatie-tags + interesses)
      const voorkeuren = [
        ...alleSituatieTags.map((slug) => ({ type: "TAG", slug })),
        ...data.interesseCategorieen.map((slug) => ({ type: "CATEGORIE", slug })),
      ]

      await fetch("/api/user/voorkeuren", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          aandoeningen: data.zorgthemas,
          voorkeuren,
        }),
      })

      // 3. Naaste gegevens opslaan in sessionStorage (voor Ger)
      if (data.naasteNaam) {
        sessionStorage.setItem("naaste_gegevens", JSON.stringify({
          naam: data.naasteNaam,
          relatie: data.naasteRelatie,
        }))
      }

      setSaveSuccess(true)
      setTimeout(() => onSave(), 1500)
    } catch {
      setSaveError("Het opslaan is niet gelukt. Wil je het nog een keer proberen?")
    } finally {
      setIsSaving(false)
    }
  }

  // Tags filteren
  const zorgthemas = beschikbareTags.filter((t) => t.type === "ZORGTHEMA")
  const situaties = beschikbareTags.filter((t) => t.type === "SITUATIE")

  // Handmatige situatie-tags: filter automatische tags eruit voor weergave
  const handmatigeSituaties = situaties.filter(
    (t) => !(AUTOMATISCHE_TAG_SLUGS as readonly string[]).includes(t.slug)
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="ker-page-content space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-foreground">
          {variant === "onboarding" ? "Vertel ons over jezelf" : "Mijn profiel"}
        </h1>
        <p className="text-base text-foreground/70 leading-relaxed">
          Help ons je beter te helpen. Hoe meer we weten, hoe persoonlijker onze tips en artikelen.
          Je kunt alles later nog aanpassen.
        </p>
      </div>

      {/* ============================================ */}
      {/* SECTIE 1: Over jou */}
      {/* ============================================ */}
      <section className="ker-card space-y-4">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <span>&#128100;</span> Over jou
        </h2>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Hoe heet je? *</label>
          <input
            value={data.naam}
            onChange={(e) => setData({ ...data, naam: e.target.value })}
            className="ker-input"
            placeholder="Je volledige naam"
          />
        </div>

        <FormStreetSearch
          label="Waar woon je?"
          value={data.adres}
          onChange={(adres) => setData({ ...data, adres })}
          placeholder="Begin met typen, bijv. Kerkstraat 1 of 1234 AB"
        />

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Telefoonnummer</label>
          <input
            type="tel"
            value={data.telefoon}
            onChange={(e) => setData({ ...data, telefoon: e.target.value })}
            className="ker-input"
            placeholder="06 12345678"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Niet verplicht. Handig als je MantelBuddy ook via WhatsApp wilt gebruiken.
          </p>
        </div>
      </section>

      {/* ============================================ */}
      {/* SECTIE 2: Voor wie zorg je? */}
      {/* ============================================ */}
      <section className="ker-card space-y-4">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <span>&#128154;</span> Voor wie zorg je?
        </h2>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Hoe heet degene voor wie je zorgt?
          </label>
          <input
            value={data.naasteNaam}
            onChange={(e) => setData({ ...data, naasteNaam: e.target.value })}
            className="ker-input"
            placeholder="Voornaam of roepnaam"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Wat is jullie relatie?
          </label>
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

        <FormStreetSearch
          label={`Waar woont ${data.naasteNaam || "je naaste"}?`}
          value={data.naasteAdres}
          onChange={(adres) => setData({ ...data, naasteAdres: adres })}
          placeholder="Begin met typen, bijv. Kerkstraat 1 of 1234 AB"
        />
      </section>

      {/* ============================================ */}
      {/* SECTIE 3: Woonsituatie */}
      {/* ============================================ */}
      <section className="ker-card space-y-4">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <span>&#127968;</span> Woonsituatie
        </h2>
        <p className="text-sm text-foreground/70">
          Waar woont {data.naasteNaam || "je naaste"} ten opzichte van jou?
        </p>
        <RadioGroup
          value={data.woonsituatie}
          options={WOONSITUATIE_OPTIES}
          onChange={(v) => setData({ ...data, woonsituatie: v })}
        />
      </section>

      {/* ============================================ */}
      {/* SECTIE 4: Werk */}
      {/* ============================================ */}
      <section className="ker-card space-y-4">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <span>&#128188;</span> Werk
        </h2>
        <p className="text-sm text-foreground/70">
          Werk je naast het zorgen?
        </p>
        <RadioGroup
          value={data.werkstatus}
          options={WERKSTATUS_OPTIES}
          onChange={(v) => setData({ ...data, werkstatus: v })}
        />
      </section>

      {/* ============================================ */}
      {/* SECTIE 5: Zorgthema (multi-select) */}
      {/* ============================================ */}
      <section className="ker-card space-y-4">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <span>&#129658;</span> Zorgsituatie van {data.naasteNaam || "je naaste"}
        </h2>
        <p className="text-sm text-foreground/70 leading-relaxed">
          Waarmee heeft {data.naasteNaam || "je naaste"} te maken?
          Je mag er meerdere kiezen.
        </p>
        <div className="flex flex-wrap gap-2">
          {zorgthemas.map((tag) => {
            const selected = data.zorgthemas.includes(tag.slug)
            return (
              <button
                key={tag.slug}
                type="button"
                onClick={() => setData({
                  ...data,
                  zorgthemas: selected
                    ? data.zorgthemas.filter((s) => s !== tag.slug)
                    : [...data.zorgthemas, tag.slug],
                })}
                className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-all border-2 ${
                  selected
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card border-border text-foreground hover:border-primary/30"
                }`}
              >
                {tag.emoji && <span className="mr-1.5">{tag.emoji}</span>}
                {tag.naam}
              </button>
            )
          })}
        </div>
        <p className="text-xs text-muted-foreground">
          Staat het er niet bij? Geen probleem. Je kunt gewoon doorgaan.
        </p>
      </section>

      {/* ============================================ */}
      {/* SECTIE 6: Jouw situatie (handmatige tags) */}
      {/* ============================================ */}
      <section className="ker-card space-y-4">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <span>&#127991;&#65039;</span> Jouw situatie
        </h2>
        <p className="text-sm text-foreground/70 leading-relaxed">
          Herken je jezelf hierin? Kies wat past. Je mag er meerdere kiezen.
        </p>

        {/* Automatisch afgeleide tags tonen als info */}
        {automatischeTags.length > 0 && (
          <div className="p-3 bg-primary/5 rounded-xl border border-primary/20">
            <p className="text-xs font-medium text-primary mb-2">
              Op basis van je profiel herkennen we:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {automatischeTags.map((slug) => {
                const tag = situaties.find((t) => t.slug === slug)
                if (!tag) return null
                return (
                  <span key={slug} className="px-2 py-1 bg-primary/10 text-primary rounded-lg text-xs font-medium">
                    {tag.emoji && <span className="mr-1">{tag.emoji}</span>}
                    {tag.naam}
                  </span>
                )
              })}
            </div>
          </div>
        )}

        {/* Handmatige situatie-tags */}
        <div className="flex flex-wrap gap-2">
          {handmatigeSituaties.map((tag) => {
            const selected = data.situatieTags.includes(tag.slug)
            return (
              <button
                key={tag.slug}
                type="button"
                onClick={() => setData({
                  ...data,
                  situatieTags: selected
                    ? data.situatieTags.filter((s) => s !== tag.slug)
                    : [...data.situatieTags, tag.slug],
                })}
                className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-all border-2 ${
                  selected
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card border-border text-foreground hover:border-primary/30"
                }`}
              >
                {tag.emoji && <span className="mr-1.5">{tag.emoji}</span>}
                {tag.naam}
              </button>
            )
          })}
        </div>
      </section>

      {/* ============================================ */}
      {/* SECTIE 7: Interesses */}
      {/* ============================================ */}
      <section className="ker-card space-y-4">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <span>&#128218;</span> Waar wil je meer over lezen?
        </h2>
        <p className="text-sm text-foreground/70">
          Kies de onderwerpen die jou aanspreken.
        </p>

        <div className="space-y-2">
          {INTERESSE_CATEGORIEEN.map((cat) => {
            const selected = data.interesseCategorieen.includes(cat.slug)
            return (
              <button
                key={cat.slug}
                type="button"
                onClick={() => setData({
                  ...data,
                  interesseCategorieen: selected
                    ? data.interesseCategorieen.filter((s) => s !== cat.slug)
                    : [...data.interesseCategorieen, cat.slug],
                })}
                className={`w-full text-left p-3 rounded-xl border-2 transition-all ${
                  selected
                    ? "bg-primary/5 border-primary"
                    : "bg-card border-border hover:border-primary/30"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xl flex-shrink-0">{cat.emoji}</span>
                    <div>
                      <p className="font-semibold text-foreground text-sm">{cat.naam}</p>
                      <p className="text-xs text-foreground/60 leading-snug">{cat.uitleg}</p>
                    </div>
                  </div>
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 ml-2 transition-all ${
                    selected ? "bg-primary border-primary text-white" : "border-muted-foreground/30"
                  }`}>
                    {selected && (
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </section>

      {/* ============================================ */}
      {/* FOUTMELDING & SUCCES */}
      {/* ============================================ */}
      {saveError && (
        <div className="p-3 bg-[var(--accent-red-bg)] text-[var(--accent-red)] rounded-xl text-sm">
          {saveError}
        </div>
      )}

      {saveSuccess && (
        <div className="p-3 bg-primary/10 text-primary rounded-xl text-sm text-center font-medium">
          Profiel opgeslagen!
        </div>
      )}

      {/* ============================================ */}
      {/* KNOPPEN */}
      {/* ============================================ */}
      <div className="space-y-3 pb-6">
        <button
          onClick={handleSave}
          disabled={isSaving || !data.naam.trim()}
          className="ker-btn ker-btn-primary w-full"
        >
          {isSaving ? "Even geduld..." : "Profiel opslaan"}
        </button>

        {showSkip && onSkip && (
          <button
            onClick={onSkip}
            className="ker-btn w-full bg-muted text-foreground hover:bg-muted/80"
          >
            Later invullen
          </button>
        )}

        <p className="text-xs text-muted-foreground text-center">
          Je kunt dit later altijd aanpassen in je profiel.
        </p>
      </div>
    </div>
  )
}
