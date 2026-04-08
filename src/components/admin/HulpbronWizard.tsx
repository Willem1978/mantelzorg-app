"use client"

import { useState, useEffect, useCallback } from "react"
import { ensureAbsoluteUrl } from "@/lib/utils"

interface Hulpbron {
  id?: string
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
  eersteStap: string | null
  verwachtingTekst: string | null
  dienst: string | null
  bronLabel: string | null
  zorgverzekeraar: boolean
}

interface WizardProps {
  isOpen: boolean
  onClose: () => void
  onSave: (item: Partial<Hulpbron>) => Promise<void>
  initialData?: Partial<Hulpbron>
}

const CATEGORIEEN_ZORGVRAGER = [
  "Administratie", "Plannen", "Boodschappen", "Sociaal & activiteiten",
  "Vervoer", "Verzorging", "Maaltijden", "Huishouden", "Klusjes", "Huisdieren",
]

const CATEGORIEEN_MANTELZORGER = [
  "Ondersteuning", "Vervangende mantelzorg", "Praten, steun & lotgenoten",
  "Leren & training",
]

const SOORT_HULP_OPTIES = [
  "Belangenorganisatie", "Educatie", "Emotionele steun", "Financiele regelingen",
  "Hulplijn", "Informatie en advies", "Overheid en financieel",
  "Praktische hulp", "Professionele zorg",
  "Vervangende mantelzorg",
]

const TYPE_OPTIES = [
  "GEMEENTE", "THUISZORG", "MANTELZORGSTEUNPUNT", "RESPIJTZORG",
  "DAGBESTEDING", "HUISARTS", "SOCIAAL_WIJKTEAM", "VRIJWILLIGERS",
  "OVERIG", "LANDELIJK",
]

const BRON_LABEL_OPTIES = ["Landelijk", "Gemeente", "Zvw", "Wlz", "Wmo", "Overig"]

const STAPPEN = [
  { nummer: 1, titel: "Basisinfo", beschrijving: "Naam & website" },
  { nummer: 2, titel: "Classificatie", beschrijving: "Doelgroep & categorie" },
  { nummer: 3, titel: "Contact & praktisch", beschrijving: "Gegevens & kosten" },
  { nummer: 4, titel: "Review & activeren", beschrijving: "Controleer & activeer" },
]

const completenessFields = [
  { key: "naam", label: "Naam" },
  { key: "dienst", label: "Naam dienst" },
  { key: "beschrijving", label: "Omschrijving" },
  { key: "doelgroep", label: "Doelgroep" },
  { key: "onderdeelTest", label: "Categorie" },
  { key: "soortHulp", label: "Soort hulp" },
  { key: "kosten", label: "Kosten" },
  { key: "eersteStap", label: "Eerste stap" },
  { key: "verwachtingTekst", label: "Wat kan je verwachten" },
  { key: "telefoon", label: "Telefoon" },
  { key: "website", label: "Website" },
] as const

export function HulpbronWizard({ isOpen, onClose, onSave, initialData }: WizardProps) {
  const [stap, setStap] = useState(1)
  const [item, setItem] = useState<Partial<Hulpbron>>(initialData || {
    naam: "",
    website: "",
    beschrijving: "",
    type: "OVERIG",
    telefoon: "",
    email: "",
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
    eersteStap: "",
    verwachtingTekst: "",
    dienst: "",
    bronLabel: "",
    zorgverzekeraar: false,
  })
  const [aiLoading, setAiLoading] = useState(false)
  const [aiDone, setAiDone] = useState(false)
  const [saving, setSaving] = useState(false)

  // Reset when opened
  useEffect(() => {
    if (isOpen) {
      setStap(1)
      setAiDone(false)
      setItem(initialData || {
        naam: "", website: "", beschrijving: "", type: "OVERIG",
        telefoon: "", email: "", adres: "", postcode: "", woonplaats: "",
        gemeente: "", provincie: "", dekkingNiveau: "GEMEENTE",
        dekkingWoonplaatsen: null, dekkingWijken: null, isActief: false,
        onderdeelTest: "", soortHulp: "", openingstijden: "",
        zichtbaarBijLaag: false, zichtbaarBijGemiddeld: false, zichtbaarBijHoog: true,
        kosten: "", doelgroep: "", aanmeldprocedure: "", eersteStap: "",
        verwachtingTekst: "", dienst: "", bronLabel: "", zorgverzekeraar: false,
      })
    }
  }, [isOpen, initialData])

  const handleAiInvullen = useCallback(async () => {
    if (!item.naam && !item.website) return
    setAiLoading(true)
    try {
      const res = await fetch("/api/beheer/hulpbronnen/ai-invullen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formulier: item, modus: "alles" }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.suggesties) {
          const updates: Partial<Hulpbron> = {}
          for (const [key, value] of Object.entries(data.suggesties)) {
            if (value && key in item) {
              const currentVal = item[key as keyof Hulpbron]
              if (!currentVal || currentVal === "" || currentVal === "OVERIG") {
                (updates as Record<string, unknown>)[key] = value
              }
            }
          }
          setItem(prev => ({ ...prev, ...updates }))
          setAiDone(true)
        }
      }
    } catch {
      // silent
    }
    setAiLoading(false)
  }, [item])

  const handleSave = async () => {
    setSaving(true)
    await onSave(item)
    setSaving(false)
  }

  // Completeness
  const filledCount = completenessFields.filter(f => {
    const val = item[f.key as keyof Hulpbron]
    return val && val !== "" && val !== "OVERIG"
  }).length
  const completenessPercent = Math.round((filledCount / completenessFields.length) * 100)

  const categorieOpties = item.doelgroep === "ZORGVRAGER"
    ? CATEGORIEEN_ZORGVRAGER
    : item.doelgroep === "MANTELZORGER"
    ? CATEGORIEEN_MANTELZORGER
    : [...CATEGORIEEN_ZORGVRAGER, ...CATEGORIEEN_MANTELZORGER]

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 overflow-y-auto">
      <div className="ker-card max-w-2xl w-full my-8">
        {/* Header met stappen */}
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-lg text-foreground">
            Nieuwe hulpbron toevoegen
          </h3>
          <button
            onClick={onClose}
            className="p-2 -mr-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-[var(--muted)] transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Stappen indicator */}
        <div className="flex items-center gap-1 mb-6">
          {STAPPEN.map((s, i) => (
            <div key={s.nummer} className="flex items-center flex-1">
              <button
                onClick={() => {
                  if (s.nummer < stap) setStap(s.nummer)
                }}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition w-full ${
                  stap === s.nummer
                    ? "bg-[var(--primary)] text-white"
                    : stap > s.nummer
                    ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 cursor-pointer"
                    : "bg-[var(--muted)] text-muted-foreground"
                }`}
                disabled={s.nummer > stap}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                  stap === s.nummer
                    ? "bg-white/20 text-white"
                    : stap > s.nummer
                    ? "bg-emerald-500 text-white"
                    : "bg-[var(--border)] text-muted-foreground"
                }`}>
                  {stap > s.nummer ? "✓" : s.nummer}
                </span>
                <span className="hidden sm:inline truncate">{s.titel}</span>
              </button>
              {i < STAPPEN.length - 1 && (
                <div className={`w-4 h-0.5 mx-1 shrink-0 ${
                  stap > s.nummer ? "bg-emerald-400" : "bg-[var(--border)]"
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Stap 1: Basisinfo */}
        {stap === 1 && (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Vul de naam en website in. AI vult daarna automatisch de rest aan.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Naam organisatie *
              </label>
              <input
                type="text"
                value={item.naam || ""}
                onChange={(e) => setItem({ ...item, naam: e.target.value })}
                placeholder="bijv. Meander Medisch Centrum"
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-foreground text-sm min-h-[44px]"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Website
              </label>
              <input
                type="url"
                value={item.website || ""}
                onChange={(e) => setItem({ ...item, website: e.target.value })}
                placeholder="bijv. https://www.meander-mc.nl"
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-foreground text-sm min-h-[44px]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Naam dienst (optioneel)
              </label>
              <input
                type="text"
                value={item.dienst || ""}
                onChange={(e) => setItem({ ...item, dienst: e.target.value })}
                placeholder="bijv. Dagbesteding ouderen"
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-foreground text-sm min-h-[44px]"
              />
            </div>
          </div>
        )}

        {/* Stap 2: Classificatie */}
        {stap === 2 && (
          <div className="space-y-4">
            {aiDone && (
              <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 text-sm text-emerald-800 dark:text-emerald-200">
                AI heeft de velden vooraf ingevuld. Controleer en pas aan waar nodig.
              </div>
            )}

            {/* Beschrijving */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Omschrijving (B1-taalniveau)
              </label>
              <textarea
                value={item.beschrijving || ""}
                onChange={(e) => setItem({ ...item, beschrijving: e.target.value })}
                rows={3}
                placeholder="Korte beschrijving in eenvoudige taal..."
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-foreground text-sm"
              />
            </div>

            {/* Doelgroep */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Doelgroep *
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setItem({ ...item, doelgroep: "MANTELZORGER", onderdeelTest: "" })}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition border-2 ${
                    item.doelgroep === "MANTELZORGER"
                      ? "border-purple-500 bg-purple-500 text-white"
                      : "border-[var(--border)] text-foreground hover:border-purple-400"
                  }`}
                >
                  Voor de mantelzorger
                </button>
                <button
                  type="button"
                  onClick={() => setItem({ ...item, doelgroep: "ZORGVRAGER", onderdeelTest: "" })}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition border-2 ${
                    item.doelgroep === "ZORGVRAGER"
                      ? "border-primary bg-primary text-white"
                      : "border-[var(--border)] text-foreground hover:border-primary/60"
                  }`}
                >
                  Voor de zorgvrager
                </button>
              </div>
            </div>

            {/* Categorie */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Categorie
              </label>
              <select
                value={item.onderdeelTest || ""}
                onChange={(e) => setItem({ ...item, onderdeelTest: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-foreground text-sm min-h-[44px]"
              >
                <option value="">-- Selecteer --</option>
                {categorieOpties.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </div>

            {/* Soort hulp */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Soort hulp
              </label>
              <select
                value={item.soortHulp || ""}
                onChange={(e) => setItem({ ...item, soortHulp: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-foreground text-sm min-h-[44px]"
              >
                <option value="">-- Selecteer --</option>
                {SOORT_HULP_OPTIES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Type organisatie */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Type organisatie
                </label>
                <select
                  value={item.type || "OVERIG"}
                  onChange={(e) => setItem({ ...item, type: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-foreground text-sm min-h-[44px]"
                >
                  {TYPE_OPTIES.map((t) => (
                    <option key={t} value={t}>{t.replace(/_/g, " ")}</option>
                  ))}
                </select>
              </div>

              {/* Bron */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Bron
                </label>
                <select
                  value={item.bronLabel || ""}
                  onChange={(e) => setItem({ ...item, bronLabel: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-foreground text-sm min-h-[44px]"
                >
                  <option value="">-- Geen --</option>
                  {BRON_LABEL_OPTIES.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Stap 3: Contact & praktisch */}
        {stap === 3 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Telefoon
                </label>
                <input
                  type="text"
                  value={item.telefoon || ""}
                  onChange={(e) => setItem({ ...item, telefoon: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-foreground text-sm min-h-[44px]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={item.email || ""}
                  onChange={(e) => setItem({ ...item, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-foreground text-sm min-h-[44px]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Bereikbaarheid
                </label>
                <input
                  type="text"
                  value={item.openingstijden || ""}
                  onChange={(e) => setItem({ ...item, openingstijden: e.target.value })}
                  placeholder="bijv. Ma-Vr 9:00-17:00"
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-foreground text-sm min-h-[44px]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Vergoed door zorgverzekeraar
                </label>
                <select
                  value={item.zorgverzekeraar ? "ja" : "nee"}
                  onChange={(e) => setItem({ ...item, zorgverzekeraar: e.target.value === "ja" })}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-foreground text-sm min-h-[44px]"
                >
                  <option value="nee">Nee</option>
                  <option value="ja">Ja</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Kosten
              </label>
              <input
                type="text"
                value={item.kosten || ""}
                onChange={(e) => setItem({ ...item, kosten: e.target.value })}
                placeholder="bijv. Gratis, Eigen bijdrage, Via zorgverzekeraar"
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-foreground text-sm min-h-[44px]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Eerste stap
              </label>
              <input
                type="text"
                value={item.eersteStap || ""}
                onChange={(e) => setItem({ ...item, eersteStap: e.target.value })}
                placeholder="bijv. Bel en vraag naar een intake-gesprek"
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-foreground text-sm min-h-[44px]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Wat kan je verwachten?
              </label>
              <input
                type="text"
                value={item.verwachtingTekst || ""}
                onChange={(e) => setItem({ ...item, verwachtingTekst: e.target.value })}
                placeholder="bijv. Ze komen bij je thuis kijken wat er nodig is"
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-foreground text-sm min-h-[44px]"
              />
            </div>
          </div>
        )}

        {/* Stap 4: Review & activeren */}
        {stap === 4 && (
          <div className="space-y-4">
            {/* Compleetheid */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--muted)]">
              <div className="w-32 h-3 bg-[var(--background)] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    completenessPercent === 100
                      ? "bg-emerald-500"
                      : completenessPercent >= 70
                      ? "bg-amber-500"
                      : "bg-red-400"
                  }`}
                  style={{ width: `${completenessPercent}%` }}
                />
              </div>
              <span className={`text-sm font-bold ${
                completenessPercent === 100
                  ? "text-emerald-600"
                  : completenessPercent >= 70
                  ? "text-amber-600"
                  : "text-red-500"
              }`}>
                {completenessPercent}% compleet
              </span>
            </div>

            {/* Overzicht */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
              <ReviewRij label="Naam" waarde={item.naam} />
              <ReviewRij label="Dienst" waarde={item.dienst} />
              <ReviewRij label="Website" waarde={item.website} isLink />
              <ReviewRij label="Doelgroep" waarde={item.doelgroep === "MANTELZORGER" ? "Mantelzorger" : item.doelgroep === "ZORGVRAGER" ? "Zorgvrager" : ""} />
              <ReviewRij label="Categorie" waarde={item.onderdeelTest} />
              <ReviewRij label="Soort hulp" waarde={item.soortHulp} />
              <ReviewRij label="Type" waarde={item.type?.replace(/_/g, " ")} />
              <ReviewRij label="Bron" waarde={item.bronLabel} />
              <ReviewRij label="Telefoon" waarde={item.telefoon} />
              <ReviewRij label="Email" waarde={item.email} />
              <ReviewRij label="Kosten" waarde={item.kosten} />
              <ReviewRij label="Bereikbaarheid" waarde={item.openingstijden} />
              <ReviewRij label="Eerste stap" waarde={item.eersteStap} />
              <ReviewRij label="Verwachting" waarde={item.verwachtingTekst} />
              <ReviewRij label="Vergoed" waarde={item.zorgverzekeraar ? "Ja" : "Nee"} />
            </div>

            {item.beschrijving && (
              <div>
                <span className="text-xs font-medium text-muted-foreground">Omschrijving:</span>
                <p className="text-sm text-foreground mt-1 p-2 rounded bg-[var(--muted)]">
                  {item.beschrijving}
                </p>
              </div>
            )}

            {/* Activeren */}
            <div className="p-4 rounded-lg border-2 border-emerald-300 bg-emerald-50 dark:bg-emerald-950/20">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={item.isActief || false}
                  onChange={(e) => setItem({ ...item, isActief: e.target.checked })}
                  className="w-5 h-5 rounded"
                />
                <div>
                  <span className="font-medium text-foreground">Direct activeren</span>
                  <p className="text-xs text-muted-foreground">
                    Hiermee wordt de hulpbron zichtbaar voor gebruikers
                  </p>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* Navigatie knoppen */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-[var(--border)]">
          <div>
            {stap > 1 && (
              <button
                onClick={() => setStap(stap - 1)}
                className="px-4 py-2 rounded-lg text-sm bg-[var(--muted)] text-foreground hover:bg-[var(--border)] transition min-h-[44px]"
              >
                Vorige
              </button>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-[var(--muted)] transition min-h-[44px]"
            >
              Annuleren
            </button>

            {stap === 1 && (
              <button
                onClick={async () => {
                  // Trigger AI en ga naar stap 2
                  setStap(2)
                  if (item.naam || item.website) {
                    await handleAiInvullen()
                  }
                }}
                disabled={!item.naam || aiLoading}
                className="px-6 py-2 rounded-lg text-sm font-medium bg-[var(--primary)] text-white hover:opacity-90 transition disabled:opacity-50 min-h-[44px] flex items-center gap-2"
              >
                {aiLoading ? (
                  <>
                    <span className="inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    AI analyseert...
                  </>
                ) : (
                  <>Volgende &rarr;</>
                )}
              </button>
            )}

            {stap === 2 && (
              <button
                onClick={() => setStap(3)}
                className="px-6 py-2 rounded-lg text-sm font-medium bg-[var(--primary)] text-white hover:opacity-90 transition min-h-[44px]"
              >
                Volgende &rarr;
              </button>
            )}

            {stap === 3 && (
              <button
                onClick={() => setStap(4)}
                className="px-6 py-2 rounded-lg text-sm font-medium bg-[var(--primary)] text-white hover:opacity-90 transition min-h-[44px]"
              >
                Bekijk overzicht &rarr;
              </button>
            )}

            {stap === 4 && (
              <button
                onClick={handleSave}
                disabled={saving || !item.naam}
                className="px-6 py-2 rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition disabled:opacity-50 min-h-[44px]"
              >
                {saving ? "Opslaan..." : "Opslaan & toevoegen"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function ReviewRij({ label, waarde, isLink }: { label: string; waarde?: string | null; isLink?: boolean }) {
  return (
    <div className="flex items-baseline gap-2 py-1">
      <span className="text-xs text-muted-foreground w-24 shrink-0">{label}:</span>
      {waarde && waarde !== "OVERIG" ? (
        isLink ? (
          <a
            href={ensureAbsoluteUrl(waarde)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[var(--primary)] hover:underline truncate"
          >
            {waarde}
          </a>
        ) : (
          <span className="text-xs text-foreground">{waarde}</span>
        )
      ) : (
        <span className="text-xs text-muted-foreground italic">Niet ingevuld</span>
      )}
    </div>
  )
}
