"use client"

import { useSession } from "next-auth/react"
import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"

// ============================================
// TYPES
// ============================================

interface BasisGegevens {
  naam: string
  website: string
  telefoon: string
  beschrijving: string
}

interface LocatieGegevens {
  dekkingNiveau: "LANDELIJK" | "REGIONAAL" | "LOKAAL"
  woonplaats: string
}

interface AISuggesties {
  beschrijving?: string
  dienst?: string
  doelgroep?: string
  onderdeelTest?: string
  soortHulp?: string
  type?: string
  bronLabel?: string
  kosten?: string
  eersteStap?: string
  verwachtingTekst?: string
  zorgverzekeraar?: boolean
  [key: string]: unknown
}

// ============================================
// DESIGN TOKENS
// ============================================

const colors = {
  primary: "#2D1B69",
  accent: "#E5A825",
  background: "#F8F0F5",
  lightPurple: "#EDE8F5",
  white: "#FFFFFF",
  textDark: "#1a1a2e",
  textMuted: "#6b7280",
  error: "#dc2626",
  success: "#16a34a",
} as const

// ============================================
// STEP LABELS
// ============================================

const STEPS = [
  { number: 1, label: "Basis" },
  { number: 2, label: "Locatie" },
  { number: 3, label: "AI verrijkt" },
] as const

// ============================================
// COMPONENT
// ============================================

export default function HulpbronToevoegenPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  // Wizard state
  const [currentStep, setCurrentStep] = useState(1)

  // Step 1: Basis
  const [basis, setBasis] = useState<BasisGegevens>({
    naam: "",
    website: "",
    telefoon: "",
    beschrijving: "",
  })

  // Step 2: Locatie
  const [locatie, setLocatie] = useState<LocatieGegevens>({
    dekkingNiveau: "LOKAAL",
    woonplaats: "",
  })

  // Step 3: AI
  const [aiSuggesties, setAiSuggesties] = useState<AISuggesties | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)

  // Saving
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Validation
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  // ============================================
  // VALIDATION
  // ============================================

  const validateStep1 = useCallback((): boolean => {
    const errors: Record<string, string> = {}
    if (!basis.naam.trim()) {
      errors.naam = "Naam is verplicht"
    }
    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }, [basis.naam])

  const validateStep2 = useCallback((): boolean => {
    const errors: Record<string, string> = {}
    if (locatie.dekkingNiveau !== "LANDELIJK" && !locatie.woonplaats.trim()) {
      errors.woonplaats = "Woonplaats is verplicht voor regionaal/lokaal"
    }
    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }, [locatie.dekkingNiveau, locatie.woonplaats])

  // ============================================
  // NAVIGATION
  // ============================================

  const handleNext = useCallback(() => {
    if (currentStep === 1 && !validateStep1()) return
    if (currentStep === 2 && !validateStep2()) return
    setValidationErrors({})
    setCurrentStep((s) => Math.min(s + 1, 3))
  }, [currentStep, validateStep1, validateStep2])

  const handleBack = useCallback(() => {
    setValidationErrors({})
    setCurrentStep((s) => Math.max(s - 1, 1))
  }, [])

  // ============================================
  // AI ENRICHMENT
  // ============================================

  const handleAiInvullen = useCallback(async () => {
    setAiLoading(true)
    setAiError(null)
    setAiSuggesties(null)

    try {
      const formulier = {
        naam: basis.naam,
        website: basis.website,
        telefoon: basis.telefoon,
        beschrijving: basis.beschrijving,
        dekkingNiveau: locatie.dekkingNiveau,
        woonplaats: locatie.woonplaats,
      }

      const res = await fetch("/api/beheer/hulpbronnen/ai-invullen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formulier, modus: "alles" }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `Fout ${res.status}`)
      }

      const data = await res.json()
      setAiSuggesties(data.suggesties || {})
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "AI-invulling mislukt")
    } finally {
      setAiLoading(false)
    }
  }, [basis, locatie])

  // ============================================
  // SAVE
  // ============================================

  const handleSave = useCallback(async () => {
    setSaving(true)
    setSaveError(null)

    try {
      const payload = {
        naam: basis.naam,
        website: basis.website || null,
        telefoon: basis.telefoon || null,
        beschrijving: aiSuggesties?.beschrijving || basis.beschrijving || null,
        dekkingNiveau: locatie.dekkingNiveau,
        woonplaats: locatie.woonplaats || null,
        // AI-enriched fields
        dienst: aiSuggesties?.dienst || null,
        doelgroep: aiSuggesties?.doelgroep || null,
        onderdeelTest: aiSuggesties?.onderdeelTest || null,
        soortHulp: aiSuggesties?.soortHulp || null,
        type: aiSuggesties?.type || "OVERIG",
        bronLabel: aiSuggesties?.bronLabel || null,
        kosten: aiSuggesties?.kosten || null,
        eersteStap: aiSuggesties?.eersteStap || null,
        verwachtingTekst: aiSuggesties?.verwachtingTekst || null,
        zorgverzekeraar: aiSuggesties?.zorgverzekeraar || false,
        isActief: true,
        zichtbaarBijLaag: true,
        zichtbaarBijGemiddeld: true,
        zichtbaarBijHoog: true,
      }

      const res = await fetch("/api/beheer/hulpbronnen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `Fout ${res.status}`)
      }

      setSaveSuccess(true)
      setTimeout(() => router.push("/beheer/hulpbronnen"), 1500)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Opslaan mislukt")
    } finally {
      setSaving(false)
    }
  }, [basis, locatie, aiSuggesties, router])

  // ============================================
  // AUTH CHECK
  // ============================================

  if (status === "loading") {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: colors.background }}>
        <p style={{ color: colors.textMuted }}>Laden...</p>
      </div>
    )
  }

  if (!session?.user) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: colors.background }}>
        <p style={{ color: colors.error }}>Je moet ingelogd zijn om hulpbronnen toe te voegen.</p>
      </div>
    )
  }

  // ============================================
  // RENDER
  // ============================================

  return (
    <div style={{ minHeight: "100vh", background: colors.background, padding: "2rem 1rem" }}>
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: "2rem" }}>
          <button
            onClick={() => router.push("/beheer/hulpbronnen")}
            style={{
              background: "none",
              border: "none",
              color: colors.primary,
              cursor: "pointer",
              fontSize: "0.875rem",
              padding: 0,
              marginBottom: "0.5rem",
              display: "block",
            }}
          >
            &larr; Terug naar overzicht
          </button>
          <h1 style={{ color: colors.primary, fontSize: "1.5rem", fontWeight: 700, margin: 0 }}>
            Hulpbron toevoegen
          </h1>
          <p style={{ color: colors.textMuted, fontSize: "0.875rem", margin: "0.25rem 0 0" }}>
            Zoek &amp; Voeg Toe in 3 stappen
          </p>
        </div>

        {/* Progress bar */}
        <div style={{ marginBottom: "2rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
            {STEPS.map((step) => (
              <span
                key={step.number}
                style={{
                  fontSize: "0.75rem",
                  fontWeight: currentStep >= step.number ? 600 : 400,
                  color: currentStep >= step.number ? colors.primary : colors.textMuted,
                }}
              >
                {step.number}. {step.label}
              </span>
            ))}
          </div>
          <div style={{ height: 8, borderRadius: 4, background: colors.lightPurple, overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                width: `${(currentStep / 3) * 100}%`,
                background: `linear-gradient(90deg, ${colors.primary}, ${colors.accent})`,
                borderRadius: 4,
                transition: "width 0.3s ease",
              }}
            />
          </div>
        </div>

        {/* Card */}
        <div
          style={{
            background: colors.white,
            borderRadius: 12,
            padding: "1.5rem",
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
            border: `1px solid ${colors.lightPurple}`,
          }}
        >
          {/* =========== STEP 1: BASIS =========== */}
          {currentStep === 1 && (
            <div>
              <h2 style={{ color: colors.primary, fontSize: "1.125rem", fontWeight: 600, marginTop: 0 }}>
                Basisgegevens
              </h2>
              <p style={{ color: colors.textMuted, fontSize: "0.875rem", marginBottom: "1.5rem" }}>
                Vul de belangrijkste gegevens van de hulpbron in.
              </p>

              <FieldGroup label="Naam *" error={validationErrors.naam}>
                <input
                  type="text"
                  value={basis.naam}
                  onChange={(e) => setBasis((b) => ({ ...b, naam: e.target.value }))}
                  placeholder="Bijv. Mantelzorglijn"
                  style={inputStyle(!!validationErrors.naam)}
                />
              </FieldGroup>

              <FieldGroup label="Website">
                <input
                  type="url"
                  value={basis.website}
                  onChange={(e) => setBasis((b) => ({ ...b, website: e.target.value }))}
                  placeholder="https://www.voorbeeld.nl"
                  style={inputStyle(false)}
                />
              </FieldGroup>

              <FieldGroup label="Telefoon">
                <input
                  type="tel"
                  value={basis.telefoon}
                  onChange={(e) => setBasis((b) => ({ ...b, telefoon: e.target.value }))}
                  placeholder="030-1234567"
                  style={inputStyle(false)}
                />
              </FieldGroup>

              <FieldGroup label="Beschrijving">
                <textarea
                  value={basis.beschrijving}
                  onChange={(e) => setBasis((b) => ({ ...b, beschrijving: e.target.value }))}
                  placeholder="Korte beschrijving van wat deze hulpbron biedt..."
                  rows={3}
                  style={{ ...inputStyle(false), resize: "vertical" as const }}
                />
              </FieldGroup>
            </div>
          )}

          {/* =========== STEP 2: LOCATIE =========== */}
          {currentStep === 2 && (
            <div>
              <h2 style={{ color: colors.primary, fontSize: "1.125rem", fontWeight: 600, marginTop: 0 }}>
                Locatie &amp; bereik
              </h2>
              <p style={{ color: colors.textMuted, fontSize: "0.875rem", marginBottom: "1.5rem" }}>
                Geef aan waar deze hulpbron beschikbaar is.
              </p>

              <FieldGroup label="Dekkingsniveau">
                <select
                  value={locatie.dekkingNiveau}
                  onChange={(e) =>
                    setLocatie((l) => ({
                      ...l,
                      dekkingNiveau: e.target.value as LocatieGegevens["dekkingNiveau"],
                    }))
                  }
                  style={inputStyle(false)}
                >
                  <option value="LANDELIJK">Landelijk</option>
                  <option value="REGIONAAL">Regionaal</option>
                  <option value="LOKAAL">Lokaal</option>
                </select>
              </FieldGroup>

              {locatie.dekkingNiveau !== "LANDELIJK" && (
                <FieldGroup label="Woonplaats" error={validationErrors.woonplaats}>
                  <input
                    type="text"
                    value={locatie.woonplaats}
                    onChange={(e) => setLocatie((l) => ({ ...l, woonplaats: e.target.value }))}
                    placeholder="Bijv. Utrecht"
                    style={inputStyle(!!validationErrors.woonplaats)}
                  />
                </FieldGroup>
              )}
            </div>
          )}

          {/* =========== STEP 3: AI VERRIJKT =========== */}
          {currentStep === 3 && (
            <div>
              <h2 style={{ color: colors.primary, fontSize: "1.125rem", fontWeight: 600, marginTop: 0 }}>
                AI-verrijking
              </h2>
              <p style={{ color: colors.textMuted, fontSize: "0.875rem", marginBottom: "1.5rem" }}>
                Laat AI de overige velden invullen op basis van de basisgegevens. Controleer het resultaat voordat je opslaat.
              </p>

              {/* Summary of entered data */}
              <div
                style={{
                  background: colors.lightPurple,
                  borderRadius: 8,
                  padding: "1rem",
                  marginBottom: "1rem",
                  fontSize: "0.875rem",
                }}
              >
                <strong style={{ color: colors.primary }}>Ingevoerde gegevens:</strong>
                <ul style={{ margin: "0.5rem 0 0", paddingLeft: "1.25rem", color: colors.textDark }}>
                  <li><strong>Naam:</strong> {basis.naam}</li>
                  {basis.website && <li><strong>Website:</strong> {basis.website}</li>}
                  {basis.telefoon && <li><strong>Telefoon:</strong> {basis.telefoon}</li>}
                  {basis.beschrijving && <li><strong>Beschrijving:</strong> {basis.beschrijving}</li>}
                  <li><strong>Dekking:</strong> {locatie.dekkingNiveau.toLowerCase()}</li>
                  {locatie.woonplaats && <li><strong>Woonplaats:</strong> {locatie.woonplaats}</li>}
                </ul>
              </div>

              {/* AI button */}
              {!aiSuggesties && !aiLoading && (
                <button
                  onClick={handleAiInvullen}
                  style={{
                    width: "100%",
                    padding: "0.875rem",
                    background: `linear-gradient(135deg, ${colors.primary}, ${colors.primary}dd)`,
                    color: colors.white,
                    border: "none",
                    borderRadius: 8,
                    fontSize: "1rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    marginBottom: "1rem",
                  }}
                >
                  Laat AI invullen
                </button>
              )}

              {/* Loading */}
              {aiLoading && (
                <div
                  style={{
                    textAlign: "center",
                    padding: "2rem",
                    color: colors.primary,
                    fontSize: "0.875rem",
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      border: `3px solid ${colors.lightPurple}`,
                      borderTopColor: colors.primary,
                      borderRadius: "50%",
                      animation: "spin 0.8s linear infinite",
                      margin: "0 auto 1rem",
                    }}
                  />
                  AI analyseert de hulpbron...
                  <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
              )}

              {/* Error */}
              {aiError && (
                <div
                  style={{
                    background: "#fef2f2",
                    border: "1px solid #fecaca",
                    borderRadius: 8,
                    padding: "0.75rem 1rem",
                    color: colors.error,
                    fontSize: "0.875rem",
                    marginBottom: "1rem",
                  }}
                >
                  {aiError}
                  <button
                    onClick={handleAiInvullen}
                    style={{
                      display: "block",
                      marginTop: "0.5rem",
                      background: "none",
                      border: "none",
                      color: colors.primary,
                      cursor: "pointer",
                      textDecoration: "underline",
                      fontSize: "0.875rem",
                      padding: 0,
                    }}
                  >
                    Opnieuw proberen
                  </button>
                </div>
              )}

              {/* AI results */}
              {aiSuggesties && (
                <div>
                  <h3 style={{ color: colors.primary, fontSize: "1rem", fontWeight: 600, margin: "1rem 0 0.75rem" }}>
                    AI-suggesties
                  </h3>
                  <div
                    style={{
                      background: colors.lightPurple,
                      borderRadius: 8,
                      padding: "1rem",
                      fontSize: "0.875rem",
                    }}
                  >
                    {Object.entries(aiSuggesties).map(([key, value]) => {
                      if (value === null || value === undefined || value === "") return null
                      const label = fieldLabel(key)
                      return (
                        <div key={key} style={{ marginBottom: "0.5rem" }}>
                          <strong style={{ color: colors.primary }}>{label}:</strong>{" "}
                          <span style={{ color: colors.textDark }}>
                            {typeof value === "boolean" ? (value ? "Ja" : "Nee") : String(value)}
                          </span>
                        </div>
                      )
                    })}
                  </div>

                  <button
                    onClick={handleAiInvullen}
                    style={{
                      background: "none",
                      border: "none",
                      color: colors.primary,
                      cursor: "pointer",
                      fontSize: "0.8125rem",
                      textDecoration: "underline",
                      padding: "0.5rem 0 0",
                    }}
                  >
                    Opnieuw laten analyseren
                  </button>
                </div>
              )}

              {/* Save */}
              {saveError && (
                <div
                  style={{
                    background: "#fef2f2",
                    border: "1px solid #fecaca",
                    borderRadius: 8,
                    padding: "0.75rem 1rem",
                    color: colors.error,
                    fontSize: "0.875rem",
                    marginTop: "1rem",
                  }}
                >
                  {saveError}
                </div>
              )}

              {saveSuccess && (
                <div
                  style={{
                    background: "#f0fdf4",
                    border: "1px solid #bbf7d0",
                    borderRadius: 8,
                    padding: "0.75rem 1rem",
                    color: colors.success,
                    fontSize: "0.875rem",
                    marginTop: "1rem",
                  }}
                >
                  Hulpbron opgeslagen! Je wordt doorgestuurd...
                </div>
              )}
            </div>
          )}

          {/* =========== NAVIGATION BUTTONS =========== */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: "1.5rem",
              paddingTop: "1rem",
              borderTop: `1px solid ${colors.lightPurple}`,
            }}
          >
            {currentStep > 1 ? (
              <button onClick={handleBack} style={secondaryButtonStyle}>
                Vorige
              </button>
            ) : (
              <div />
            )}

            {currentStep < 3 ? (
              <button onClick={handleNext} style={primaryButtonStyle}>
                Volgende
              </button>
            ) : (
              <button
                onClick={handleSave}
                disabled={saving || saveSuccess}
                style={{
                  ...primaryButtonStyle,
                  opacity: saving || saveSuccess ? 0.6 : 1,
                  cursor: saving || saveSuccess ? "not-allowed" : "pointer",
                  background: colors.accent,
                  color: colors.textDark,
                }}
              >
                {saving ? "Opslaan..." : saveSuccess ? "Opgeslagen!" : "Opslaan"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================
// HELPER COMPONENTS
// ============================================

function FieldGroup({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div style={{ marginBottom: "1rem" }}>
      <label
        style={{
          display: "block",
          fontSize: "0.875rem",
          fontWeight: 500,
          color: colors.textDark,
          marginBottom: "0.25rem",
        }}
      >
        {label}
      </label>
      {children}
      {error && (
        <p style={{ color: colors.error, fontSize: "0.75rem", margin: "0.25rem 0 0" }}>
          {error}
        </p>
      )}
    </div>
  )
}

// ============================================
// STYLES
// ============================================

function inputStyle(hasError: boolean): React.CSSProperties {
  return {
    width: "100%",
    padding: "0.625rem 0.75rem",
    border: `1px solid ${hasError ? colors.error : "#d1d5db"}`,
    borderRadius: 8,
    fontSize: "0.875rem",
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "inherit",
  }
}

const primaryButtonStyle: React.CSSProperties = {
  padding: "0.625rem 1.5rem",
  background: colors.primary,
  color: colors.white,
  border: "none",
  borderRadius: 8,
  fontSize: "0.875rem",
  fontWeight: 600,
  cursor: "pointer",
}

const secondaryButtonStyle: React.CSSProperties = {
  padding: "0.625rem 1.5rem",
  background: "transparent",
  color: colors.primary,
  border: `1px solid ${colors.primary}`,
  borderRadius: 8,
  fontSize: "0.875rem",
  fontWeight: 500,
  cursor: "pointer",
}

// ============================================
// FIELD LABEL MAP
// ============================================

function fieldLabel(key: string): string {
  const labels: Record<string, string> = {
    beschrijving: "Beschrijving",
    dienst: "Dienst",
    doelgroep: "Doelgroep",
    onderdeelTest: "Categorie",
    soortHulp: "Soort hulp",
    type: "Type organisatie",
    bronLabel: "Bron label",
    kosten: "Kosten",
    eersteStap: "Eerste stap",
    verwachtingTekst: "Wat kun je verwachten",
    zorgverzekeraar: "Via zorgverzekeraar",
  }
  return labels[key] || key
}
