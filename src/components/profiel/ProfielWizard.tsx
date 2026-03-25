"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { searchStreets } from "@/lib/pdok"

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
  naam: string
  email: string
  telefoon: string
  adres: StreetResult | null
  naasteNaam: string
  naasteRelatie: string
  naasteAdres: StreetResult | null
  woonsituatie: string
  werkstatus: string
  zorgduur: string
  zorgthemas: string[]
  situatieTags: string[]
  interesseCategorieen: string[]
}

interface Tag {
  slug: string
  naam: string
  emoji?: string
  type: string
  groep?: string | null
}

// B1: Relatie — radio buttons
const RELATIE_OPTIES = [
  { value: "partner", label: "Ik zorg voor mijn partner", emoji: "\uD83D\uDC91" },
  { value: "ouder", label: "Ik zorg voor mijn ouder(s)", emoji: "\uD83D\uDC75" },
  { value: "kind", label: "Ik zorg voor mijn kind", emoji: "\uD83D\uDC67" },
  { value: "anders", label: "Ik zorg voor iemand anders (familie/vriend/buur)", emoji: "\uD83E\uDD1D" },
]

// B4: Zorgduur — radio buttons
const ZORGDUUR_OPTIES = [
  { value: "kort", label: "Kort (minder dan 1 jaar)", emoji: "\uD83C\uDF31" },
  { value: "paar-jaar", label: "Een paar jaar (1\u20135 jaar)", emoji: "\uD83D\uDCC5" },
  { value: "lang", label: "Al lang (meer dan 5 jaar)", emoji: "\u231B" },
]

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
// 5 STAPPEN + BEDANKPAGINA
// ============================================

const TOTAAL_STAPPEN = 5

const STAPPEN = [
  {
    nummer: 1,
    titel: "Over jou",
    emoji: "\uD83D\uDC64",
    uitleg: "Fijn dat je er bent. We willen je graag leren kennen zodat we je zo goed mogelijk kunnen helpen. We vragen je naam, zodat we je persoonlijk kunnen aanspreken. En je adres, zodat we hulp kunnen zoeken die dicht bij jou in de buurt is. Je telefoonnummer is niet verplicht, maar handig als je MantelBuddy ook via WhatsApp wilt gebruiken.",
  },
  {
    nummer: 2,
    titel: "Jouw naaste",
    emoji: "\uD83D\uDC9A",
    uitleg: "Je zorgt voor iemand die belangrijk voor je is. Dat is bijzonder. We vragen de naam van je naaste en jullie relatie, zodat we persoonlijker met je kunnen praten. Het adres van je naaste helpt ons om hulp te vinden in de buurt waar de zorg plaatsvindt. Dat is soms een andere plek dan waar jij woont.",
  },
  {
    nummer: 3,
    titel: "De zorgsituatie",
    emoji: "\uD83D\uDCAC",
    uitleg: "We begrijpen dat dit een gevoelig onderwerp kan zijn. Je hoeft alleen te delen wat je wilt. De vragen hieronder helpen ons om je betere tips te geven en artikelen te tonen die echt bij jouw situatie passen. Alles wat je hier invult wordt vertrouwelijk behandeld en is alleen voor jou zichtbaar.",
  },
  {
    nummer: 4,
    titel: "Waar wil je meer over lezen?",
    emoji: "\u2B50",
    uitleg: "Als mantelzorger heb je soms behoefte aan informatie, maar niet altijd over hetzelfde. Kies hieronder de onderwerpen die jou op dit moment aanspreken. Zo kunnen we je artikelen en tips laten zien die voor jou het meest nuttig zijn. Je kunt dit later altijd nog veranderen.",
  },
  {
    nummer: 5,
    titel: "Overzicht",
    emoji: "\uD83D\uDCCB",
    uitleg: "Hier zie je alles wat je hebt ingevuld. Klopt er iets niet? Tik dan op 'Aanpassen' om het te wijzigen. Als alles goed is, tik je onderaan op 'Opslaan'.",
  },
]

const INTERESSE_CATEGORIEEN = [
  { slug: "praktische-tips", naam: "Praktische tips", emoji: "\uD83D\uDCCB", uitleg: "Slimme oplossingen voor het dagelijks leven als mantelzorger. Denk aan handige hulpmiddelen, plannen en organiseren." },
  { slug: "zelfzorg-balans", naam: "Zelfzorg en balans", emoji: "\uD83E\uDDD8", uitleg: "Tips om goed voor jezelf te blijven zorgen. Want als het met jou goed gaat, kun je beter zorgen voor een ander." },
  { slug: "rechten-regelingen", naam: "Rechten en regelingen", emoji: "\u2696\uFE0F", uitleg: "Weten waar je recht op hebt. Over WMO, PGB, mantelzorgwaardering en andere regelingen." },
  { slug: "geld-financien", naam: "Geld en financien", emoji: "\uD83D\uDCB0", uitleg: "Financiele tegemoetkomingen en bespaartips. Mantelzorg kost soms ook geld, daar is hulp voor." },
  { slug: "hulpmiddelen-technologie", naam: "Hulpmiddelen", emoji: "\uD83D\uDD27", uitleg: "Hulpmiddelen en slimme technologie die het dagelijks leven makkelijker maken. Van tilliften tot handige apps." },
  { slug: "werk-mantelzorg", naam: "Werk en mantelzorg", emoji: "\uD83D\uDCBC", uitleg: "Hoe combineer je werk met zorgen? Over je rechten op het werk en het gesprek met je werkgever." },
  { slug: "samenwerken-netwerk", naam: "Samen zorgen", emoji: "\uD83E\uDD1D", uitleg: "Hoe schakel je mensen om je heen in? Tips om hulp te vragen en samen de zorg te verdelen." },
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
// MAIN WIZARD
// ============================================

interface ProfielWizardProps {
  onComplete: () => void
  onCancel: () => void
}

export function ProfielWizard({ onComplete, onCancel }: ProfielWizardProps) {
  const router = useRouter()
  const [stap, setStap] = useState(1)
  const [opgeslagen, setOpgeslagen] = useState(false)
  const [data, setData] = useState<WizardData>({
    naam: "", email: "", telefoon: "",
    adres: null,
    naasteNaam: "", naasteRelatie: "",
    naasteAdres: null,
    woonsituatie: "", werkstatus: "", zorgduur: "",
    zorgthemas: [], situatieTags: [],
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
          woonsituatie: p.woonsituatie || prev.woonsituatie,
          werkstatus: p.werkstatus || prev.werkstatus,
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
        const loadedZorgthemas = vData.zorgthemas?.length > 0 ? vData.zorgthemas : []

        const allTags = vData.voorkeuren
          ?.filter((v: { type: string }) => v.type === "TAG")
          .map((v: { slug: string }) => v.slug) || []

        // Zorgduur afleiden uit opgeslagen tags
        let zorgduurValue = ""
        if (allTags.includes("beginnend")) zorgduurValue = "kort"
        else if (allTags.includes("ervaren")) zorgduurValue = "paar-jaar"
        else if (allTags.includes("langdurig")) zorgduurValue = "lang"

        const loadedInteresses = vData.voorkeuren
          ?.filter((v: { type: string }) => v.type === "CATEGORIE")
          .map((v: { slug: string }) => v.slug) || []

        setData((prev) => ({
          ...prev,
          zorgthemas: loadedZorgthemas,
          situatieTags: situatieTagsClean,
          zorgduur: zorgduurValue || prev.zorgduur,
          interesseCategorieen: loadedInteresses,
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
  const saveProfileData = async () => {
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
  }

  const saveVoorkeurenData = async () => {
    // Combineer handmatige situatie-tags + rouw + zorgduur-tag
    const zorgduurTagMap: Record<string, string> = {
      kort: "beginnend",
      "paar-jaar": "ervaren",
      lang: "langdurig",
    }
    const alleSituatieTags = [...new Set([
      ...data.situatieTags,
      ...(data.zorgduur && zorgduurTagMap[data.zorgduur] ? [zorgduurTagMap[data.zorgduur]] : []),
    ])]

    const voorkeuren = [
      ...alleSituatieTags.map((slug) => ({ type: "TAG", slug })),
      ...data.interesseCategorieen.map((slug) => ({ type: "CATEGORIE", slug })),
    ]
    await fetch("/api/user/voorkeuren", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        zorgthemas: data.zorgthemas,
        voorkeuren,
      }),
    })
  }

  const saveStep = async () => {
    try {
      if (stap === 1 || stap === 2) await saveProfileData()
      if (stap === 3 || stap === 4) await saveVoorkeurenData()
    } catch {
      // Tussentijds opslaan is best-effort
    }
  }

  const handleNext = async () => {
    await saveStep()
    if (stap < TOTAAL_STAPPEN) setStap(stap + 1)
  }

  const handlePrev = () => {
    if (stap > 1) setStap(stap - 1)
  }

  const handleFinish = async () => {
    setIsSaving(true)
    setSaveError("")
    try {
      await saveProfileData()
      await saveVoorkeurenData()

      sessionStorage.setItem("naaste_gegevens", JSON.stringify({
        naam: data.naasteNaam,
        relatie: data.naasteRelatie,
      }))

      setOpgeslagen(true)
    } catch {
      setSaveError("Het opslaan is niet gelukt. Wil je het nog een keer proberen?")
    } finally {
      setIsSaving(false)
    }
  }

  const canProceed = (): boolean => {
    if (stap === 1) return data.naam.trim().length > 0
    return true
  }

  // Zorgthema's en situaties apart
  const zorgthemas = beschikbareTags.filter((t) => t.type === "ZORGTHEMA")
  const situaties = beschikbareTags.filter((t) => t.type === "SITUATIE")

  // ============================================
  // WIZARD
  // ============================================

  const currentStap = STAPPEN[stap - 1]
  const progress = (stap / TOTAAL_STAPPEN) * 100

  return (
    <div className="ker-page-content">
      {/* Header + voortgang */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <button onClick={onCancel} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Annuleren
          </button>
          <span className="text-sm font-medium text-muted-foreground">
            Stap {stap} van {TOTAAL_STAPPEN}
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
        <p className="text-base text-foreground/70 mt-2 leading-relaxed">
          {currentStap.uitleg}
        </p>
      </div>

      {/* Stap inhoud */}
      <div className="space-y-4 min-h-[200px]">

        {/* ============================================ */}
        {/* STAP 1: Over jou + jouw adres */}
        {/* ============================================ */}
        {stap === 1 && (
          <div className="space-y-4">
            <div className="ker-card space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Hoe heet je? *</label>
                <input
                  value={data.naam}
                  onChange={(e) => setData({ ...data, naam: e.target.value })}
                  className="ker-input"
                  placeholder="Je volledige naam"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Je e-mailadres</label>
                <input
                  type="email"
                  value={data.email}
                  className="ker-input bg-muted"
                  disabled
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Dit is het e-mailadres van je account. Dit kun je hier niet wijzigen.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Je telefoonnummer</label>
                <input
                  type="tel"
                  value={data.telefoon}
                  onChange={(e) => setData({ ...data, telefoon: e.target.value })}
                  className="ker-input"
                  placeholder="06 12345678"
                  autoComplete="tel"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Niet verplicht. Handig als je MantelBuddy ook via WhatsApp wilt gebruiken.
                </p>
              </div>
            </div>

            <div className="ker-card space-y-4">
              <div>
                <h3 className="font-semibold text-foreground mb-1">Waar woon jij?</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Met je adres zoeken we hulp en organisaties dicht bij jou in de buurt.
                </p>
                <WizardStreetSearch
                  label="Jouw adres"
                  value={data.adres}
                  onChange={(adres) => setData({ ...data, adres })}
                  placeholder="Begin met typen, bijv. Kerkstraat 1 of 1234 AB"
                />
              </div>
            </div>
          </div>
        )}

        {/* ============================================ */}
        {/* STAP 2: Jouw naaste + adres naaste */}
        {/* ============================================ */}
        {stap === 2 && (
          <div className="space-y-4">
            <div className="ker-card space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Hoe heet degene voor wie je zorgt?
                </label>
                <input
                  value={data.naasteNaam}
                  onChange={(e) => setData({ ...data, naasteNaam: e.target.value })}
                  className="ker-input"
                  placeholder="Voornaam of roepnaam"
                  autoFocus
                />
                <p className="text-xs text-muted-foreground mt-1">
                  We gebruiken deze naam in onze gesprekken met jou. Zo voelt het persoonlijker.
                </p>
              </div>
              {/* B1: Relatie — radio buttons */}
              <div>
                <p className="text-sm font-medium text-foreground mb-2">
                  Wat is jullie relatie?
                </p>
                <RadioGroup
                  value={RELATIE_OPTIES.find((o) => o.value === data.naasteRelatie)?.value
                    || (["broer_zus", "vriend", "buur"].includes(data.naasteRelatie) ? "anders" : data.naasteRelatie)}
                  options={RELATIE_OPTIES}
                  onChange={(v) => setData({ ...data, naasteRelatie: v })}
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Dit helpt ons om te begrijpen hoe jouw zorgsituatie eruitziet.
                </p>
              </div>
            </div>

            <div className="ker-card space-y-4">
              <div>
                <h3 className="font-semibold text-foreground mb-1">
                  Waar woont {data.naasteNaam || "je naaste"}?
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  De zorg vindt vaak plaats bij je naaste thuis. Met dit adres zoeken we hulp in de goede gemeente.
                  {data.adres && " Woont je naaste bij jou? Dan hoef je dit niet in te vullen."}
                </p>
                <WizardStreetSearch
                  label={`Adres van ${data.naasteNaam || "je naaste"}`}
                  value={data.naasteAdres}
                  onChange={(adres) => setData({ ...data, naasteAdres: adres })}
                  placeholder="Begin met typen, bijv. Kerkstraat 1 of 1234 AB"
                />
              </div>
            </div>
          </div>
        )}

        {/* ============================================ */}
        {/* STAP 3: De zorgsituatie (voorzichtig) */}
        {/* ============================================ */}
        {stap === 3 && (
          <div className="space-y-4">
            {/* Empathische intro kaart */}
            <div className="p-4 bg-primary/5 rounded-xl border border-primary/20">
              <p className="text-sm text-foreground/80 leading-relaxed">
                We weten dat zorgen voor iemand veel van je vraagt. De vragen hieronder
                zijn er om jou beter te helpen — niet om te oordelen. Je hoeft niets in te
                vullen wat je niet wilt delen.
              </p>
            </div>

            {/* Aandoening */}
            <div className="ker-card space-y-3">
              <h3 className="font-semibold text-foreground">
                Waarmee heeft {data.naasteNaam || "je naaste"} te maken?
              </h3>
              <p className="text-sm text-foreground/70 leading-relaxed">
                Elke zorgsituatie is anders. Als we weten waarmee {data.naasteNaam || "je naaste"} te
                maken heeft, kunnen we je artikelen en tips laten zien die daar echt bij passen.
                Kies wat het meest van toepassing is. Je kunt dit altijd later nog wijzigen.
              </p>
              <div className="flex flex-wrap gap-2">
                {zorgthemas.map((tag) => {
                  const selected = data.zorgthemas.includes(tag.slug)
                  return (
                    <button
                      key={tag.slug}
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
            </div>

            {/* Woonsituatie */}
            <div className="ker-card space-y-3">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <span>&#127968;</span> Woonsituatie
              </h3>
              <p className="text-sm text-foreground/70">
                Waar woont {data.naasteNaam || "je naaste"} ten opzichte van jou?
              </p>
              <RadioGroup
                value={data.woonsituatie}
                options={WOONSITUATIE_OPTIES}
                onChange={(v) => setData({ ...data, woonsituatie: v })}
              />
            </div>

            {/* Werk */}
            <div className="ker-card space-y-3">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <span>&#128188;</span> Werk
              </h3>
              <p className="text-sm text-foreground/70">
                Werk je naast het zorgen?
              </p>
              <RadioGroup
                value={data.werkstatus}
                options={WERKSTATUS_OPTIES}
                onChange={(v) => setData({ ...data, werkstatus: v })}
              />
            </div>

            {/* Hoe lang zorg je al? */}
            <div className="ker-card space-y-3">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <span>&#9203;</span> Hoe lang zorg je al?
              </h3>
              <RadioGroup
                value={data.zorgduur}
                options={ZORGDUUR_OPTIES}
                onChange={(v) => setData({ ...data, zorgduur: v })}
              />
            </div>

            {/* Extra situatietags (B5) */}
            {situaties.filter((t) => t.groep === "extra").length > 0 && (
              <div className="ker-card space-y-3">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <span>&#127991;&#65039;</span> Wat speelt er nog meer?
                </h3>
                <p className="text-sm text-foreground/70 leading-relaxed">
                  Optioneel. Herken je jezelf hierin?
                </p>
                <div className="space-y-2">
                  {situaties.filter((t) => t.groep === "extra").map((tag) => {
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
                        className={`w-full text-left p-3 rounded-xl border-2 transition-all flex items-center gap-3 ${
                          selected
                            ? "bg-primary/10 border-primary"
                            : "bg-card border-border hover:border-primary/30"
                        }`}
                      >
                        {tag.emoji && <span className="text-xl flex-shrink-0">{tag.emoji}</span>}
                        <span className={`font-medium ${selected ? "text-primary" : "text-foreground"}`}>
                          {tag.naam}
                        </span>
                        <div className={`ml-auto w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                          selected ? "bg-primary border-primary text-white" : "border-muted-foreground/30"
                        }`}>
                          {selected && (
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

          </div>
        )}

        {/* ============================================ */}
        {/* STAP 4: Jouw interesses */}
        {/* ============================================ */}
        {stap === 4 && (
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
                      <span className="text-2xl flex-shrink-0">{cat.emoji}</span>
                      <div>
                        <p className="font-semibold text-foreground">{cat.naam}</p>
                        <p className="text-sm text-foreground/60 leading-snug">{cat.uitleg}</p>
                      </div>
                    </div>
                    <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 ml-2 transition-all ${
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
            <p className="text-xs text-muted-foreground text-center pt-1">
              Je kunt dit later altijd nog aanpassen in je profiel.
            </p>
          </div>
        )}

        {/* ============================================ */}
        {/* STAP 5: Overzicht + Bedankt (gecombineerd) */}
        {/* ============================================ */}
        {stap === 5 && (
          <div className="space-y-4">
            {/* Bedankt bericht (verschijnt na opslaan) */}
            {opgeslagen && (
              <div className="ker-card text-center py-6 space-y-4 bg-primary/5 border-primary/20">
                <div className="text-4xl">&#127881;</div>
                <h3 className="text-xl font-bold text-foreground">
                  Bedankt{data.naam ? `, ${data.naam.split(" ")[0]}` : ""}!
                </h3>
                <div className="space-y-2 text-base text-foreground/80 leading-relaxed">
                  <p>Je profiel is opgeslagen. We gebruiken deze gegevens om je zo goed mogelijk te helpen.</p>
                  {data.naasteNaam && (
                    <p className="text-primary font-medium">
                      Fijn dat je er bent voor {data.naasteNaam}. En vergeet niet: je mag er ook zijn voor jezelf.
                    </p>
                  )}
                </div>
                <div className="pt-2 space-y-2 max-w-xs mx-auto">
                  <button
                    onClick={() => router.push("/dashboard")}
                    className="ker-btn ker-btn-primary w-full"
                  >
                    Naar mijn dashboard
                  </button>
                  <button
                    onClick={onComplete}
                    className="ker-btn w-full bg-muted text-foreground hover:bg-muted/80"
                  >
                    Terug naar profiel
                  </button>
                </div>
              </div>
            )}

            {/* Overzicht kaarten */}
            <div className="ker-card">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <span>{STAPPEN[0].emoji}</span> Over jou
                </h3>
                {!opgeslagen && (
                  <button onClick={() => setStap(1)} className="text-xs text-primary font-semibold hover:underline">Aanpassen</button>
                )}
              </div>
              <div className="text-sm space-y-1 text-foreground/80">
                <p><strong>Naam:</strong> {data.naam || "-"}</p>
                <p><strong>E-mail:</strong> {data.email || "-"}</p>
                {data.telefoon && <p><strong>Telefoon:</strong> {data.telefoon}</p>}
                <p><strong>Adres:</strong> {data.adres ? `${data.adres.straat}, ${data.adres.woonplaats}` : "Nog niet ingevuld"}</p>
              </div>
            </div>

            <div className="ker-card">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <span>{STAPPEN[1].emoji}</span> Jouw naaste
                </h3>
                {!opgeslagen && (
                  <button onClick={() => setStap(2)} className="text-xs text-primary font-semibold hover:underline">Aanpassen</button>
                )}
              </div>
              <div className="text-sm space-y-1 text-foreground/80">
                <p><strong>Naam:</strong> {data.naasteNaam || "-"}</p>
                <p><strong>Relatie:</strong> {data.naasteRelatie ? RELATIE_OPTIES.find((o) => o.value === data.naasteRelatie)?.label || data.naasteRelatie : "-"}</p>
                <p><strong>Adres:</strong> {data.naasteAdres ? `${data.naasteAdres.straat}, ${data.naasteAdres.woonplaats}` : "Nog niet ingevuld"}</p>
              </div>
            </div>

            <div className="ker-card">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <span>{STAPPEN[2].emoji}</span> De zorgsituatie
                </h3>
                {!opgeslagen && (
                  <button onClick={() => setStap(3)} className="text-xs text-primary font-semibold hover:underline">Aanpassen</button>
                )}
              </div>
              <div className="text-sm space-y-1 text-foreground/80">
                {data.zorgthemas.length > 0 ? (
                  <p><strong>Zorgthema:</strong> {data.zorgthemas.map((s) => zorgthemas.find((t) => t.slug === s)?.naam || s).join(", ")}</p>
                ) : (
                  <p><strong>Zorgthema:</strong> <span className="text-muted-foreground">Niet ingevuld</span></p>
                )}
                <p><strong>Woonsituatie:</strong> {WOONSITUATIE_OPTIES.find((o) => o.value === data.woonsituatie)?.label || <span className="text-muted-foreground">Niet ingevuld</span>}</p>
                <p><strong>Werk:</strong> {WERKSTATUS_OPTIES.find((o) => o.value === data.werkstatus)?.label || <span className="text-muted-foreground">Niet ingevuld</span>}</p>
                <p><strong>Zorgduur:</strong> {ZORGDUUR_OPTIES.find((o) => o.value === data.zorgduur)?.label || <span className="text-muted-foreground">Niet ingevuld</span>}</p>
                {data.situatieTags.length > 0 && (
                  <p><strong>Extra:</strong> {data.situatieTags.map((s) => situaties.find((t) => t.slug === s)?.naam || s).join(", ")}</p>
                )}
              </div>
            </div>

            <div className="ker-card">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <span>{STAPPEN[3].emoji}</span> Interesses
                </h3>
                {!opgeslagen && (
                  <button onClick={() => setStap(4)} className="text-xs text-primary font-semibold hover:underline">Aanpassen</button>
                )}
              </div>
              <div className="text-sm text-foreground/80">
                {data.interesseCategorieen.length > 0 ? (
                  <p>{data.interesseCategorieen.map((s) => INTERESSE_CATEGORIEEN.find((ic) => ic.slug === s)?.naam || s).join(", ")}</p>
                ) : (
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

      {/* Navigatie knoppen (verborgen na opslaan) */}
      {!opgeslagen && (
        <div className="flex gap-3 mt-6">
          {stap > 1 && (
            <button onClick={handlePrev} className="ker-btn flex-1 bg-muted text-foreground hover:bg-muted/80">
              Vorige
            </button>
          )}
          {stap < TOTAAL_STAPPEN ? (
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
              {isSaving ? "Even geduld..." : "Alles opslaan"}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
