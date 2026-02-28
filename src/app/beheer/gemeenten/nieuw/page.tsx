"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import Link from "next/link"

// ============================================
// TYPES
// ============================================

const PDOK_BASE_URL = "https://api.pdok.nl/bzk/locatieserver/search/v3_1"

interface PdokGemeente {
  naam: string
  code: string
}

interface Organisatie {
  id: string
  naam: string
  type: string
  dienst: string | null
  telefoon: string | null
  website: string | null
  gemeente: string | null
}

interface WizardData {
  // Stap 1: Gemeente
  naam: string
  code: string
  // Stap 2: Contact
  contactEmail: string
  contactTelefoon: string
  websiteUrl: string
  wmoLoketUrl: string
  // Stap 3: Hulpbronnen
  mantelzorgSteunpunt: string
  mantelzorgSteunpuntNaam: string
  respijtzorgUrl: string
  dagopvangUrl: string
  // Stap 4: Advies
  adviesLaag: string
  adviesGemiddeld: string
  adviesHoog: string
  organisatieLaagId: string
  organisatieGemiddeldId: string
  organisatieHoogId: string
  // Stap 5: Beheerder
  beheerderNaam: string
  beheerderEmail: string
}

const INITIAL_DATA: WizardData = {
  naam: "",
  code: "",
  contactEmail: "",
  contactTelefoon: "",
  websiteUrl: "",
  wmoLoketUrl: "",
  mantelzorgSteunpunt: "",
  mantelzorgSteunpuntNaam: "",
  respijtzorgUrl: "",
  dagopvangUrl: "",
  adviesLaag: "Uw belasting is laag. Blijf goed voor uzelf zorgen. Neem contact op met het mantelzorgsteunpunt als u vragen heeft.",
  adviesGemiddeld: "Uw belasting is gemiddeld. Overweeg om hulp te vragen bij specifieke taken. Het WMO loket kan u helpen met een maatwerkvoorziening.",
  adviesHoog: "Uw belasting is hoog. We raden u dringend aan om hulp te zoeken. Neem contact op met het mantelzorgsteunpunt of het WMO loket.",
  organisatieLaagId: "",
  organisatieGemiddeldId: "",
  organisatieHoogId: "",
  beheerderNaam: "",
  beheerderEmail: "",
}

const STAPPEN = [
  { nr: 1, label: "Gemeente", icon: "🏛️" },
  { nr: 2, label: "Contact", icon: "📞" },
  { nr: 3, label: "Hulpbronnen", icon: "🏥" },
  { nr: 4, label: "Advies", icon: "💡" },
  { nr: 5, label: "Beheerder", icon: "👤" },
]

// ============================================
// PDOK ZOEKEN
// ============================================

async function zoekGemeentenPdok(query: string): Promise<PdokGemeente[]> {
  if (!query || query.length < 2) return []
  try {
    const params = new URLSearchParams({
      q: `${query}*`,
      fq: "type:gemeente",
      rows: "10",
      sort: "score desc,gemeentenaam asc",
    })
    const res = await fetch(`${PDOK_BASE_URL}/free?${params}`)
    if (!res.ok) return []
    const data = await res.json()
    const results: PdokGemeente[] = (data.response?.docs || [])
      .map((doc: Record<string, string>) => ({
        naam: doc.gemeentenaam as string,
        code: doc.gemeentecode as string,
      }))
      .filter((g: PdokGemeente) => g.naam && g.code)
    // Dedupliceer op naam
    const seen = new Set<string>()
    return results.filter((g) => {
      if (seen.has(g.naam)) return false
      seen.add(g.naam)
      return true
    })
  } catch {
    return []
  }
}

// ============================================
// COMPONENT
// ============================================

export default function GemeenteOnboardingWizard() {
  const router = useRouter()
  const [stap, setStap] = useState(1)
  const [data, setData] = useState<WizardData>(INITIAL_DATA)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [gemeenteId, setGemeenteId] = useState<string | null>(null)

  // PDOK zoeken
  const [pdokQuery, setPdokQuery] = useState("")
  const [pdokResults, setPdokResults] = useState<PdokGemeente[]>([])
  const [pdokLoading, setPdokLoading] = useState(false)

  // Hulpbronnen
  const [organisaties, setOrganisaties] = useState<Organisatie[]>([])
  const [orgLoading, setOrgLoading] = useState(false)

  // PDOK autocomplete
  useEffect(() => {
    if (pdokQuery.length < 2) {
      setPdokResults([])
      return
    }
    setPdokLoading(true)
    const timeout = setTimeout(async () => {
      const results = await zoekGemeentenPdok(pdokQuery)
      setPdokResults(results)
      setPdokLoading(false)
    }, 300)
    return () => clearTimeout(timeout)
  }, [pdokQuery])

  // Hulpbronnen laden wanneer gemeente naam bekend is
  const loadOrganisaties = useCallback(async () => {
    if (!data.naam) return
    setOrgLoading(true)
    try {
      const res = await fetch(`/api/beheer/gemeenten/hulpbronnen-zoek?gemeente=${encodeURIComponent(data.naam)}`)
      if (res.ok) {
        const result = await res.json()
        setOrganisaties(result.organisaties || [])
      }
    } catch {
      // Silently fail
    } finally {
      setOrgLoading(false)
    }
  }, [data.naam])

  useEffect(() => {
    if (stap === 3 && data.naam) {
      loadOrganisaties()
    }
  }, [stap, data.naam, loadOrganisaties])

  function updateData(field: keyof WizardData, value: string) {
    setData((prev) => ({ ...prev, [field]: value }))
  }

  function selectGemeente(g: PdokGemeente) {
    setData((prev) => ({ ...prev, naam: g.naam, code: g.code }))
    setPdokQuery(g.naam)
    setPdokResults([])
  }

  function canProceed(): boolean {
    switch (stap) {
      case 1: return !!data.naam.trim()
      case 2: return !!(data.contactEmail.trim() || data.contactTelefoon.trim())
      case 3: return true // Optioneel
      case 4: return true // Optioneel maar templates zijn standaard ingevuld
      case 5: return true // Beheerder is optioneel
      default: return true
    }
  }

  async function handleSubmit() {
    setIsSubmitting(true)
    setError(null)

    try {
      const res = await fetch("/api/beheer/gemeenten/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Onboarding mislukt")
      }

      const result = await res.json()
      setGemeenteId(result.gemeente.id)
      setSuccess(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Er ging iets mis")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Succes scherm
  if (success) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-card border border-border rounded-2xl p-8 text-center">
          <div className="w-16 h-16 bg-[var(--accent-green-bg)] rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">✅</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            {data.naam} is aangemaakt!
          </h1>
          <p className="text-muted-foreground mb-6">
            De gemeente is succesvol opgezet en geactiveerd.
          </p>

          <div className="bg-muted rounded-xl p-4 mb-6 text-left space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Gemeente</span>
              <span className="font-medium text-foreground">{data.naam}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">CBS-code</span>
              <span className="font-medium text-foreground">{data.code || "—"}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Contact</span>
              <span className="font-medium text-foreground">{data.contactEmail || data.contactTelefoon}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Advies ingesteld</span>
              <span className="font-medium text-foreground">
                {data.adviesLaag || data.adviesGemiddeld || data.adviesHoog ? "Ja" : "Nee"}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Beheerder</span>
              <span className="font-medium text-foreground">{data.beheerderEmail || "Geen"}</span>
            </div>
          </div>

          <div className="flex gap-3">
            <Link
              href="/beheer/gemeenten"
              className="ker-btn ker-btn-secondary flex-1 text-center"
            >
              Terug naar overzicht
            </Link>
            <Link
              href={`/beheer/gemeenten`}
              className="ker-btn ker-btn-primary flex-1 text-center"
            >
              Gemeente bewerken
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/beheer/gemeenten"
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-3 text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Gemeenten
        </Link>
        <h1 className="text-2xl font-bold text-foreground">Nieuwe gemeente instellen</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Doorloop 5 stappen om een gemeente volledig op te zetten.
        </p>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-1 mb-8 overflow-x-auto">
        {STAPPEN.map((s) => (
          <div
            key={s.nr}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all flex-shrink-0",
              stap === s.nr
                ? "bg-primary text-primary-foreground"
                : stap > s.nr
                  ? "bg-[var(--accent-green-bg)] text-[var(--accent-green)]"
                  : "bg-muted text-muted-foreground"
            )}
          >
            <span>{stap > s.nr ? "✓" : s.icon}</span>
            <span className="hidden sm:inline">{s.label}</span>
            <span className="sm:hidden">{s.nr}</span>
          </div>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-[var(--accent-red-bg)] border border-[var(--accent-red)]/20 rounded-xl p-4 mb-4">
          <p className="text-sm text-foreground">{error}</p>
        </div>
      )}

      {/* Stap content */}
      <div className="bg-card border border-border rounded-2xl p-6 mb-6">
        {/* STAP 1: Gemeente kiezen */}
        {stap === 1 && (
          <div>
            <h2 className="text-lg font-bold text-foreground mb-1">🏛️ Gemeente kiezen</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Zoek de gemeente via PDOK. De CBS-code wordt automatisch ingevuld.
            </p>

            <div className="relative">
              <input
                type="text"
                value={pdokQuery}
                onChange={(e) => {
                  setPdokQuery(e.target.value)
                  if (data.naam && e.target.value !== data.naam) {
                    updateData("naam", "")
                    updateData("code", "")
                  }
                }}
                placeholder="Typ een gemeentenaam..."
                className="ker-input w-full"
                autoFocus
              />
              {pdokLoading && (
                <div className="absolute right-3 top-3">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                </div>
              )}

              {pdokResults.length > 0 && !data.naam && (
                <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-xl shadow-lg max-h-60 overflow-y-auto">
                  {pdokResults.map((g) => (
                    <button
                      key={g.code}
                      onClick={() => selectGemeente(g)}
                      className="w-full text-left px-4 py-3 hover:bg-muted transition-colors border-b border-border last:border-0"
                    >
                      <p className="font-medium text-foreground text-sm">{g.naam}</p>
                      <p className="text-xs text-muted-foreground">CBS: {g.code}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {data.naam && (
              <div className="mt-4 bg-[var(--accent-green-bg)] rounded-xl p-4 flex items-center gap-3">
                <span className="text-2xl">✅</span>
                <div>
                  <p className="font-semibold text-foreground">{data.naam}</p>
                  <p className="text-xs text-muted-foreground">CBS-code: {data.code}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STAP 2: Contactgegevens */}
        {stap === 2 && (
          <div>
            <h2 className="text-lg font-bold text-foreground mb-1">📞 Contactgegevens</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Minimaal een e-mailadres of telefoonnummer is verplicht.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">E-mailadres</label>
                <input
                  type="email"
                  value={data.contactEmail}
                  onChange={(e) => updateData("contactEmail", e.target.value)}
                  placeholder="wmo@gemeente.nl"
                  className="ker-input w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Telefoon</label>
                <input
                  type="tel"
                  value={data.contactTelefoon}
                  onChange={(e) => updateData("contactTelefoon", e.target.value)}
                  placeholder="088-1234567"
                  className="ker-input w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Website</label>
                <input
                  type="url"
                  value={data.websiteUrl}
                  onChange={(e) => updateData("websiteUrl", e.target.value)}
                  placeholder="https://www.gemeente.nl"
                  className="ker-input w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">WMO loket URL</label>
                <input
                  type="url"
                  value={data.wmoLoketUrl}
                  onChange={(e) => updateData("wmoLoketUrl", e.target.value)}
                  placeholder="https://www.gemeente.nl/wmo"
                  className="ker-input w-full"
                />
              </div>
            </div>
          </div>
        )}

        {/* STAP 3: Hulpbronnen */}
        {stap === 3 && (
          <div>
            <h2 className="text-lg font-bold text-foreground mb-1">🏥 Lokale hulpbronnen</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Koppel bestaande hulporganisaties aan deze gemeente.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Mantelzorgsteunpunt naam</label>
                <input
                  type="text"
                  value={data.mantelzorgSteunpuntNaam}
                  onChange={(e) => updateData("mantelzorgSteunpuntNaam", e.target.value)}
                  placeholder="bijv. Steunpunt Mantelzorg Rivierenland"
                  className="ker-input w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Mantelzorgsteunpunt URL</label>
                <input
                  type="url"
                  value={data.mantelzorgSteunpunt}
                  onChange={(e) => updateData("mantelzorgSteunpunt", e.target.value)}
                  placeholder="https://..."
                  className="ker-input w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Respijtzorg URL</label>
                <input
                  type="url"
                  value={data.respijtzorgUrl}
                  onChange={(e) => updateData("respijtzorgUrl", e.target.value)}
                  placeholder="https://..."
                  className="ker-input w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Dagopvang URL</label>
                <input
                  type="url"
                  value={data.dagopvangUrl}
                  onChange={(e) => updateData("dagopvangUrl", e.target.value)}
                  placeholder="https://..."
                  className="ker-input w-full"
                />
              </div>

              {/* Gevonden organisaties */}
              {orgLoading && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                  Hulpbronnen zoeken voor {data.naam}...
                </div>
              )}
              {!orgLoading && organisaties.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-foreground mb-2">
                    {organisaties.length} lokale organisaties gevonden
                  </p>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {organisaties.slice(0, 10).map((org) => (
                      <div key={org.id} className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg text-sm">
                        <span className="text-green-600">✓</span>
                        <span className="font-medium text-foreground">{org.naam}</span>
                        {org.dienst && <span className="text-xs text-muted-foreground">({org.dienst})</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STAP 4: Advies per niveau */}
        {stap === 4 && (
          <div>
            <h2 className="text-lg font-bold text-foreground mb-1">💡 Advies per belastingniveau</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Pas de adviesteksten aan die mantelzorgers zien na hun balanstest.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  <span className="inline-block w-3 h-3 rounded-full bg-green-500 mr-1.5" />
                  Advies bij lage belasting
                </label>
                <textarea
                  value={data.adviesLaag}
                  onChange={(e) => updateData("adviesLaag", e.target.value)}
                  rows={3}
                  className="ker-input w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  <span className="inline-block w-3 h-3 rounded-full bg-amber-500 mr-1.5" />
                  Advies bij gemiddelde belasting
                </label>
                <textarea
                  value={data.adviesGemiddeld}
                  onChange={(e) => updateData("adviesGemiddeld", e.target.value)}
                  rows={3}
                  className="ker-input w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  <span className="inline-block w-3 h-3 rounded-full bg-red-500 mr-1.5" />
                  Advies bij hoge belasting
                </label>
                <textarea
                  value={data.adviesHoog}
                  onChange={(e) => updateData("adviesHoog", e.target.value)}
                  rows={3}
                  className="ker-input w-full"
                />
              </div>

              {/* Organisatie koppelen per niveau */}
              {organisaties.length > 0 && (
                <>
                  <p className="text-sm font-medium text-foreground mt-4">Organisatie koppelen per niveau</p>
                  {(["Laag", "Gemiddeld", "Hoog"] as const).map((niveau) => {
                    const field = `organisatie${niveau}Id` as keyof WizardData
                    return (
                      <div key={niveau}>
                        <label className="block text-xs text-muted-foreground mb-1">
                          Doorverwijzing bij {niveau.toLowerCase()} belasting
                        </label>
                        <select
                          value={data[field]}
                          onChange={(e) => updateData(field, e.target.value)}
                          className="ker-input w-full"
                        >
                          <option value="">Geen specifieke organisatie</option>
                          {organisaties.map((org) => (
                            <option key={org.id} value={org.id}>{org.naam}</option>
                          ))}
                        </select>
                      </div>
                    )
                  })}
                </>
              )}
            </div>
          </div>
        )}

        {/* STAP 5: Beheerder */}
        {stap === 5 && (
          <div>
            <h2 className="text-lg font-bold text-foreground mb-1">👤 Eerste beheerder</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Optioneel: maak direct een gemeentebeheerder-account aan.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Naam beheerder</label>
                <input
                  type="text"
                  value={data.beheerderNaam}
                  onChange={(e) => updateData("beheerderNaam", e.target.value)}
                  placeholder="Jan de Vries"
                  className="ker-input w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">E-mailadres beheerder</label>
                <input
                  type="email"
                  value={data.beheerderEmail}
                  onChange={(e) => updateData("beheerderEmail", e.target.value)}
                  placeholder="j.devries@gemeente.nl"
                  className="ker-input w-full"
                />
              </div>

              {!data.beheerderEmail && (
                <div className="bg-muted rounded-xl p-3">
                  <p className="text-xs text-muted-foreground">
                    Je kunt ook later een beheerder toevoegen via het gebruikersbeheer.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Navigatie */}
      <div className="flex gap-3">
        {stap > 1 && (
          <button
            onClick={() => setStap(stap - 1)}
            className="ker-btn ker-btn-secondary flex-1"
          >
            Vorige
          </button>
        )}
        {stap < 5 ? (
          <button
            onClick={() => setStap(stap + 1)}
            disabled={!canProceed()}
            className={cn(
              "ker-btn flex-1",
              canProceed()
                ? "ker-btn-primary"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
          >
            Volgende
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !canProceed()}
            className={cn(
              "ker-btn ker-btn-primary flex-1",
              isSubmitting && "opacity-70 cursor-wait"
            )}
          >
            {isSubmitting ? "Bezig met opzetten..." : `${data.naam} activeren`}
          </button>
        )}
      </div>
    </div>
  )
}
