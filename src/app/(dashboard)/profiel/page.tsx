"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { signOut } from "next-auth/react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { GerAvatar } from "@/components/GerAvatar"
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

interface UserProfile {
  naam: string
  email: string
  telefoon: string
  adres: StreetResult | null
  naasteNaam: string
  naasteRelatie: string
  naasteAdres: StreetResult | null
  testScore?: number
  testNiveau?: string
  testDatum?: string
}

// ============================================
// STREET SEARCH COMPONENT
// ============================================

interface StreetSearchProps {
  label: string
  value: StreetResult | null
  onChange: (street: StreetResult | null) => void
  placeholder?: string
}

function StreetSearch({ label, value, onChange, placeholder }: StreetSearchProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<StreetResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)

  const handleSearch = async (searchQuery: string) => {
    setQuery(searchQuery)
    if (searchQuery.length < 2) {
      setResults([])
      setShowResults(false)
      return
    }
    setIsSearching(true)
    try {
      const searchResults = await searchStreets(searchQuery)
      const mapped: StreetResult[] = searchResults.map((r) => ({
        weergavenaam: r.weergavenaam,
        straat: r.straat || "",
        woonplaats: r.woonplaats || "",
        gemeente: r.gemeente || "",
      }))
      setResults(mapped)
      setShowResults(true)
    } catch {
      setResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const handleSelect = (street: StreetResult) => {
    onChange(street)
    setQuery("")
    setShowResults(false)
  }

  const handleClear = () => {
    onChange(null)
    setQuery("")
  }

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-foreground mb-2">
        {label}
      </label>
      {value ? (
        <div className="p-3 bg-muted rounded-xl">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <p className="font-medium text-foreground">{value.straat}</p>
              <p className="text-sm text-muted-foreground">
                {value.postcode && `${value.postcode}, `}{value.woonplaats}
              </p>
              {value.wijknaam && (
                <p className="text-xs text-primary mt-1">Wijk: {value.wijknaam}</p>
              )}
              <p className="text-xs text-muted-foreground">Gemeente: {value.gemeente}</p>
            </div>
            <button
              type="button"
              onClick={handleClear}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-background rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
          </div>
        </div>
      ) : (
        <div className="relative">
          <input
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => query.length >= 2 && setShowResults(true)}
            placeholder={placeholder || "Zoek op postcode of straatnaam"}
            className="ker-input"
          />
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
            <button
              key={index}
              type="button"
              onClick={() => handleSelect(result)}
              className="w-full text-left px-4 py-3 hover:bg-muted transition-colors border-b border-border last:border-b-0"
            >
              <span className="font-medium text-foreground">{result.straat}</span>
              <span className="text-muted-foreground">, {result.woonplaats}</span>
              {result.wijknaam && (
                <span className="block text-xs text-primary">Wijk: {result.wijknaam}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function formatPhoneNumber(phone: string): string {
  if (!phone) return "-"
  // Verwijder whatsapp: prefix indien aanwezig
  const cleaned = phone.replace("whatsapp:", "")
  // Format +316... naar 06...
  if (cleaned.startsWith("+31")) {
    const local = cleaned.slice(3)
    return `0${local.slice(0, 1)} ${local.slice(1, 5)} ${local.slice(5)}`
  }
  return cleaned
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function ProfielPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile>({
    naam: "",
    email: "",
    telefoon: "",
    adres: null,
    naasteNaam: "",
    naasteRelatie: "",
    naasteAdres: null,
  })
  const [isEditing, setIsEditing] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [isChangingPhone, setIsChangingPhone] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [saveMessage, setSaveMessage] = useState("")
  const [phoneInput, setPhoneInput] = useState("")
  const [phoneError, setPhoneError] = useState("")
  const [passwordData, setPasswordData] = useState({
    current: "",
    new: "",
    confirm: "",
  })
  const [passwordError, setPasswordError] = useState("")

  useEffect(() => {
    // Laad profiel uit API
    const loadProfile = async () => {
      try {
        const res = await fetch("/api/profile")
        if (res.ok) {
          const data = await res.json()
          setProfile((prev) => ({
            ...prev,
            naam: data.naam || prev.naam,
            email: data.email || prev.email,
            telefoon: data.telefoon || prev.telefoon,
            adres: data.straat ? {
              weergavenaam: `${data.straat}, ${data.woonplaats}`,
              straat: data.straat,
              woonplaats: data.woonplaats,
              gemeente: data.gemeente,
              postcode: data.postcode,
              wijknaam: data.wijk,
            } : prev.adres,
            naasteNaam: data.naasteNaam || prev.naasteNaam,
            naasteRelatie: data.naasteRelatie || prev.naasteRelatie,
            naasteAdres: data.naasteStraat ? {
              weergavenaam: `${data.naasteStraat}, ${data.naasteWoonplaats}`,
              straat: data.naasteStraat,
              woonplaats: data.naasteWoonplaats,
              gemeente: data.naasteGemeente,
              wijknaam: data.naasteWijk,
            } : prev.naasteAdres,
          }))
        }
      } catch {
        // Fall back to localStorage
      }
    }
    loadProfile()

    // Laad test resultaten uit localStorage (voor weergave)
    const testResult = localStorage.getItem("belastbaarheidstest_result")
    if (testResult) {
      try {
        const parsed = JSON.parse(testResult)
        setProfile((prev) => ({
          ...prev,
          testScore: parsed.score,
          testNiveau: parsed.niveau,
          testDatum: parsed.completedAt,
        }))
      } catch {
        // Negeer parse errors
      }
    }
  }, [])

  const handleSave = async () => {
    setIsSaving(true)
    setSaveMessage("")

    try {
      // Sla profiel op via API
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          naam: profile.naam,
          // Locatie mantelzorger
          straat: profile.adres?.straat,
          woonplaats: profile.adres?.woonplaats,
          postcode: profile.adres?.postcode,
          gemeente: profile.adres?.gemeente,
          wijk: profile.adres?.wijknaam,
          // Naaste
          naasteNaam: profile.naasteNaam,
          naasteRelatie: profile.naasteRelatie,
          naasteStraat: profile.naasteAdres?.straat,
          naasteWoonplaats: profile.naasteAdres?.woonplaats,
          naasteGemeente: profile.naasteAdres?.gemeente,
          naasteWijk: profile.naasteAdres?.wijknaam,
        }),
      })

      if (!res.ok) throw new Error("API error")

      // Update ook localStorage voor offline toegang
      const testResult = localStorage.getItem("belastbaarheidstest_result")
      if (testResult) {
        const parsed = JSON.parse(testResult)
        parsed.gegevens = {
          ...parsed.gegevens,
          naam: profile.naam,
          email: profile.email,
          mantelzorgerStraat: profile.adres,
          zorgvragerStraat: profile.naasteAdres,
        }
        localStorage.setItem("belastbaarheidstest_result", JSON.stringify(parsed))
      }

      localStorage.setItem("naaste_gegevens", JSON.stringify({
        naam: profile.naasteNaam,
        relatie: profile.naasteRelatie,
      }))

      setSaveMessage("Gegevens opgeslagen!")
      setIsEditing(false)

      setTimeout(() => setSaveMessage(""), 3000)
    } catch (error) {
      console.error("Save error:", error)
      setSaveMessage("Er ging iets mis")
    } finally {
      setIsSaving(false)
    }
  }

  const handlePasswordChange = async () => {
    setPasswordError("")

    if (passwordData.new.length < 8) {
      setPasswordError("Wachtwoord moet minimaal 8 tekens zijn")
      return
    }

    if (passwordData.new !== passwordData.confirm) {
      setPasswordError("Wachtwoorden komen niet overeen")
      return
    }

    setIsSaving(true)
    try {
      // Hier zou je normaal een API call doen
      // await fetch("/api/user/password", { ... })

      // Simuleer succes
      await new Promise((resolve) => setTimeout(resolve, 1000))

      setSaveMessage("Wachtwoord gewijzigd!")
      setIsChangingPassword(false)
      setPasswordData({ current: "", new: "", confirm: "" })

      setTimeout(() => setSaveMessage(""), 3000)
    } catch {
      setPasswordError("Er ging iets mis")
    } finally {
      setIsSaving(false)
    }
  }

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      localStorage.removeItem("belastbaarheidstest_result")
      localStorage.removeItem("intake_answers")
      localStorage.removeItem("intake_scores")
      localStorage.removeItem("intake_completed")
      localStorage.removeItem("naaste_gegevens")

      await signOut({ redirect: false })
      router.push("/")
    } catch {
      router.push("/")
    }
  }

  // Telefoonnummer normaliseren naar +31 formaat
  const normalizePhoneNumber = (phone: string): string => {
    // Verwijder alle niet-cijfers behalve +
    let cleaned = phone.replace(/[^\d+]/g, "")

    // Als het begint met 06, vervang door +316
    if (cleaned.startsWith("06")) {
      cleaned = "+31" + cleaned.slice(1)
    }
    // Als het begint met 316, voeg + toe
    else if (cleaned.startsWith("316")) {
      cleaned = "+" + cleaned
    }
    // Als het begint met 0031, vervang door +31
    else if (cleaned.startsWith("0031")) {
      cleaned = "+31" + cleaned.slice(4)
    }

    return cleaned
  }

  // Telefoonnummer valideren
  const isValidPhoneNumber = (phone: string): boolean => {
    const normalized = normalizePhoneNumber(phone)
    // Nederlandse mobiel: +316XXXXXXXX (12 tekens)
    return /^\+316\d{8}$/.test(normalized)
  }

  const handlePhoneChange = async () => {
    setPhoneError("")

    if (!phoneInput.trim()) {
      // Leeg = ontkoppelen
      setIsSaving(true)
      try {
        const res = await fetch("/api/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ telefoon: null }),
        })

        if (!res.ok) throw new Error("API error")

        setProfile({ ...profile, telefoon: "" })
        setSaveMessage("Telefoonnummer ontkoppeld!")
        setIsChangingPhone(false)
        setPhoneInput("")

        setTimeout(() => setSaveMessage(""), 3000)
      } catch {
        setPhoneError("Er ging iets mis")
      } finally {
        setIsSaving(false)
      }
      return
    }

    if (!isValidPhoneNumber(phoneInput)) {
      setPhoneError("Voer een geldig 06-nummer in (bijv. 06 12345678)")
      return
    }

    setIsSaving(true)
    try {
      const normalized = normalizePhoneNumber(phoneInput)

      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telefoon: normalized }),
      })

      if (!res.ok) throw new Error("API error")

      setProfile({ ...profile, telefoon: normalized })
      setSaveMessage("Telefoonnummer opgeslagen!")
      setIsChangingPhone(false)
      setPhoneInput("")

      setTimeout(() => setSaveMessage(""), 3000)
    } catch {
      setPhoneError("Er ging iets mis")
    } finally {
      setIsSaving(false)
    }
  }

  const getNiveauInfo = (niveau: string | undefined) => {
    switch (niveau?.toLowerCase()) {
      case "laag":
        return { label: "Lage belasting", kleur: "green" }
      case "gemiddeld":
        return { label: "Gemiddelde belasting", kleur: "amber" }
      case "hoog":
        return { label: "Hoge belasting", kleur: "red" }
      default:
        return null
    }
  }

  const niveau = profile.testNiveau ? getNiveauInfo(profile.testNiveau) : null

  // ============================================
  // TELEFOONNUMMER WIJZIGEN SCHERM
  // ============================================

  if (isChangingPhone) {
    return (
      <div className="ker-page-content">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => {
              setIsChangingPhone(false)
              setPhoneInput("")
              setPhoneError("")
            }}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <svg className="w-6 h-6 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-foreground">Telefoonnummer wijzigen</h1>
        </div>

        <div className="ker-card">
          <div className="space-y-4">
            {profile.telefoon && (
              <div className="p-3 bg-muted rounded-xl">
                <p className="text-sm text-muted-foreground">Huidig nummer</p>
                <p className="font-bold text-foreground">{formatPhoneNumber(profile.telefoon)}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Nieuw telefoonnummer
              </label>
              <input
                type="tel"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                className="ker-input"
                placeholder="06 12345678"
                autoComplete="tel"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Dit nummer wordt gekoppeld aan je WhatsApp account
              </p>
            </div>

            {phoneError && (
              <div className="p-3 bg-[var(--accent-red-bg)] text-[var(--accent-red)] rounded-xl text-sm">
                {phoneError}
              </div>
            )}

            <div className="space-y-2">
              <button
                onClick={handlePhoneChange}
                disabled={isSaving}
                className="ker-btn ker-btn-primary w-full"
              >
                {isSaving ? "Opslaan..." : phoneInput.trim() ? "Nummer opslaan" : "Nummer ontkoppelen"}
              </button>

              {profile.telefoon && (
                <button
                  onClick={() => {
                    setPhoneInput("")
                    handlePhoneChange()
                  }}
                  disabled={isSaving}
                  className="ker-btn w-full bg-[var(--accent-red-bg)] text-[var(--accent-red)] hover:bg-[var(--accent-red)] hover:text-white transition-colors"
                >
                  Nummer ontkoppelen
                </button>
              )}
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="text-sm text-amber-800">
                <strong>Let op:</strong> Als je een nieuw nummer koppelt, wordt het oude nummer ontkoppeld.
                Berichten via WhatsApp worden dan aan het nieuwe nummer gekoppeld.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ============================================
  // WACHTWOORD WIJZIGEN SCHERM
  // ============================================

  if (isChangingPassword) {
    return (
      <div className="ker-page-content">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => setIsChangingPassword(false)}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <svg className="w-6 h-6 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-foreground">Wachtwoord wijzigen</h1>
        </div>

        <div className="ker-card">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Huidig wachtwoord
              </label>
              <input
                type="password"
                value={passwordData.current}
                onChange={(e) => setPasswordData({ ...passwordData, current: e.target.value })}
                className="ker-input"
                placeholder="Je huidige wachtwoord"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Nieuw wachtwoord
              </label>
              <input
                type="password"
                value={passwordData.new}
                onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
                className="ker-input"
                placeholder="Minimaal 8 tekens"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Bevestig nieuw wachtwoord
              </label>
              <input
                type="password"
                value={passwordData.confirm}
                onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
                className="ker-input"
                placeholder="Herhaal nieuw wachtwoord"
              />
            </div>

            {passwordError && (
              <div className="p-3 bg-[var(--accent-red-bg)] text-[var(--accent-red)] rounded-xl text-sm">
                {passwordError}
              </div>
            )}

            <button
              onClick={handlePasswordChange}
              disabled={isSaving || !passwordData.current || !passwordData.new || !passwordData.confirm}
              className="ker-btn ker-btn-primary w-full"
            >
              {isSaving ? "Opslaan..." : "Wachtwoord wijzigen"}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ============================================
  // BEWERKEN SCHERM
  // ============================================

  if (isEditing) {
    return (
      <div className="ker-page-content">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => setIsEditing(false)}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <svg className="w-6 h-6 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-foreground">Gegevens bewerken</h1>
        </div>

        <div className="space-y-4">
          {/* Mijn gegevens */}
          <div className="ker-card">
            <h2 className="font-bold text-foreground mb-4 flex items-center gap-2">
              <span className="text-xl">👤</span>
              Mijn gegevens
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Naam</label>
                <input
                  value={profile.naam}
                  onChange={(e) => setProfile({ ...profile, naam: e.target.value })}
                  className="ker-input"
                  placeholder="Je volledige naam"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">E-mail</label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  className="ker-input"
                  placeholder="je@email.nl"
                />
              </div>

              <StreetSearch
                label="Mijn adres"
                value={profile.adres}
                onChange={(adres) => setProfile({ ...profile, adres })}
                placeholder="Zoek op postcode of straatnaam"
              />
            </div>
          </div>

          {/* Mijn naaste */}
          <div className="ker-card">
            <h2 className="font-bold text-foreground mb-4 flex items-center gap-2">
              <span className="text-xl">❤️</span>
              Voor wie zorg ik
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Naam van je naaste</label>
                <input
                  value={profile.naasteNaam}
                  onChange={(e) => setProfile({ ...profile, naasteNaam: e.target.value })}
                  className="ker-input"
                  placeholder="Naam van degene voor wie je zorgt"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Relatie</label>
                <select
                  value={profile.naasteRelatie}
                  onChange={(e) => setProfile({ ...profile, naasteRelatie: e.target.value })}
                  className="ker-input"
                >
                  <option value="">Selecteer...</option>
                  <option value="partner">Partner</option>
                  <option value="ouder">Ouder</option>
                  <option value="kind">Kind</option>
                  <option value="broer_zus">Broer of zus</option>
                  <option value="vriend">Vriend(in)</option>
                  <option value="buur">Buurman/buurvrouw</option>
                  <option value="anders">Anders</option>
                </select>
              </div>

              <StreetSearch
                label="Adres van je naaste"
                value={profile.naasteAdres}
                onChange={(adres) => setProfile({ ...profile, naasteAdres: adres })}
                placeholder="Zoek op postcode of straatnaam"
              />
            </div>
          </div>

          {/* Opslaan knop */}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="ker-btn ker-btn-primary w-full"
          >
            {isSaving ? "Opslaan..." : "Gegevens opslaan"}
          </button>
        </div>
      </div>
    )
  }

  // ============================================
  // NORMAAL PROFIEL SCHERM
  // ============================================

  return (
    <div className="ker-page-content">
      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        <GerAvatar size="lg" />
        <div className="pt-2">
          <h1 className="text-2xl font-bold text-foreground">
            {profile.naam || "Mijn profiel"}
          </h1>
          <p className="text-muted-foreground mt-1">
            Jouw gegevens en instellingen
          </p>
        </div>
      </div>

      {/* Save message */}
      {saveMessage && (
        <div className="mb-4 p-3 bg-[var(--accent-green-bg)] text-[var(--accent-green)] rounded-xl text-sm font-medium">
          {saveMessage}
        </div>
      )}

      <div className="space-y-4">
        {/* Mijn gegevens */}
        <div className="ker-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-foreground flex items-center gap-2">
              <span className="text-xl">👤</span>
              Mijn gegevens
            </h2>
            <button
              onClick={() => setIsEditing(true)}
              className="text-primary text-sm font-medium hover:underline"
            >
              Bewerken
            </button>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-muted-foreground">Naam</span>
              <span className="font-medium text-foreground">{profile.naam || "-"}</span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-muted-foreground">E-mail</span>
              <span className="font-medium text-foreground text-right">{profile.email || "-"}</span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-muted-foreground">Telefoon</span>
              <div className="flex items-center gap-2">
                <span className="font-medium text-foreground">
                  {profile.telefoon ? formatPhoneNumber(profile.telefoon) : "-"}
                </span>
                <button
                  onClick={() => {
                    setPhoneInput(profile.telefoon || "")
                    setIsChangingPhone(true)
                  }}
                  className="p-1 text-primary hover:bg-primary/10 rounded transition-colors"
                  title="Telefoonnummer wijzigen"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="py-2 border-b border-border">
              <span className="text-muted-foreground block mb-1">Adres</span>
              {profile.adres ? (
                <div>
                  <span className="font-medium text-foreground">{profile.adres.straat}</span>
                  <span className="text-muted-foreground block text-sm">
                    {profile.adres.postcode && `${profile.adres.postcode}, `}{profile.adres.woonplaats}
                  </span>
                  {profile.adres.wijknaam && (
                    <span className="text-primary text-xs">Wijk: {profile.adres.wijknaam}</span>
                  )}
                </div>
              ) : (
                <span className="text-muted-foreground">-</span>
              )}
            </div>

            <div className="flex justify-between items-center py-2">
              <span className="text-muted-foreground">Gemeente</span>
              <span className="font-medium text-foreground">{profile.adres?.gemeente || "-"}</span>
            </div>
          </div>
        </div>

        {/* Mijn naaste */}
        <div className="ker-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-foreground flex items-center gap-2">
              <span className="text-xl">❤️</span>
              Voor wie zorg ik
            </h2>
            <button
              onClick={() => setIsEditing(true)}
              className="text-primary text-sm font-medium hover:underline"
            >
              Bewerken
            </button>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-muted-foreground">Naam</span>
              <span className="font-medium text-foreground">{profile.naasteNaam || "-"}</span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-muted-foreground">Relatie</span>
              <span className="font-medium text-foreground">
                {profile.naasteRelatie ? {
                  partner: "Partner",
                  ouder: "Ouder",
                  kind: "Kind",
                  broer_zus: "Broer/zus",
                  vriend: "Vriend(in)",
                  buur: "Buurman/buurvrouw",
                  anders: "Anders",
                }[profile.naasteRelatie] : "-"}
              </span>
            </div>

            <div className="py-2">
              <span className="text-muted-foreground block mb-1">Adres</span>
              {profile.naasteAdres ? (
                <div>
                  <span className="font-medium text-foreground">{profile.naasteAdres.straat}</span>
                  <span className="text-muted-foreground block text-sm">
                    {profile.naasteAdres.postcode && `${profile.naasteAdres.postcode}, `}{profile.naasteAdres.woonplaats}
                  </span>
                  {profile.naasteAdres.wijknaam && (
                    <span className="text-primary text-xs">Wijk: {profile.naasteAdres.wijknaam}</span>
                  )}
                </div>
              ) : (
                <span className="text-muted-foreground">-</span>
              )}
            </div>
          </div>
        </div>

        {/* Test resultaat */}
        {profile.testScore !== undefined && niveau && (
          <Link href="/rapport" className="block">
            <div className={cn(
              "ker-card",
              niveau.kleur === "green" && "bg-[var(--accent-green-bg)]",
              niveau.kleur === "amber" && "bg-[var(--accent-amber-bg)]",
              niveau.kleur === "red" && "bg-[var(--accent-red-bg)]"
            )}>
              <h2 className="font-bold text-foreground mb-3 flex items-center gap-2">
                <span className="text-xl">📊</span>
                Laatste Balanstest
              </h2>

              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold text-white flex-shrink-0",
                  niveau.kleur === "green" && "bg-[var(--emoticon-green)]",
                  niveau.kleur === "amber" && "bg-[var(--emoticon-yellow)]",
                  niveau.kleur === "red" && "bg-[var(--emoticon-red)]"
                )}>
                  {profile.testScore}
                </div>
                <div className="flex-1">
                  <p className={cn(
                    "font-bold",
                    niveau.kleur === "green" && "text-[var(--accent-green)]",
                    niveau.kleur === "amber" && "text-[var(--accent-amber)]",
                    niveau.kleur === "red" && "text-[var(--accent-red)]"
                  )}>
                    {niveau.label}
                  </p>
                  {profile.testDatum && (
                    <p className="text-sm text-muted-foreground">
                      {new Date(profile.testDatum).toLocaleDateString("nl-NL", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  )}
                </div>
                <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>
        )}

        {/* WhatsApp koppeling */}
        <div className="ker-card bg-green-50 border-2 border-green-200">
          <h2 className="font-bold text-foreground mb-4 flex items-center gap-2">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </div>
            WhatsApp
          </h2>

          {/* QR Code naar WhatsApp */}
          <div className="flex justify-center mb-4">
            <div className="bg-white p-3 rounded-xl shadow-sm">
              <img
                src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://wa.me/14155238886?text=Hoi"
                alt="Scan QR code om WhatsApp te starten"
                width={120}
                height={120}
                className="rounded-lg"
              />
            </div>
          </div>
          <p className="text-center text-sm text-green-700 mb-4">
            Scan de QR code om direct te chatten
          </p>

          {profile.telefoon && profile.telefoon.length > 3 ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-white rounded-xl">
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Gekoppeld nummer</p>
                  <p className="font-bold text-green-700">{formatPhoneNumber(profile.telefoon)}</p>
                </div>
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <p className="text-sm text-green-700">
                ✨ Je kunt MantelBuddy gebruiken via WhatsApp!
              </p>
              <a
                href="https://wa.me/14155238886?text=Hoi"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-green-500 text-white font-medium rounded-lg hover:bg-green-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Open WhatsApp
              </a>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="p-3 bg-white rounded-xl border border-amber-200">
                <p className="text-sm text-amber-700 font-medium">📱 Nog niet gekoppeld</p>
                <p className="text-xs text-amber-600 mt-1">
                  Start een WhatsApp chat om je nummer automatisch te koppelen.
                </p>
              </div>
              <a
                href="https://wa.me/14155238886?text=Hoi"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-green-500 text-white font-medium rounded-lg hover:bg-green-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Start WhatsApp Chat
              </a>
            </div>
          )}
        </div>

        {/* Account instellingen */}
        <div className="ker-card">
          <h2 className="font-bold text-foreground mb-4 flex items-center gap-2">
            <span className="text-xl">⚙️</span>
            Account
          </h2>

          <div className="space-y-2">
            <button
              onClick={() => setIsChangingPassword(true)}
              className="w-full flex items-center gap-3 p-3 rounded-xl border-2 border-border hover:border-primary/50 transition-colors text-left"
            >
              <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">Wachtwoord wijzigen</p>
              </div>
              <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Hulp */}
        <div className="ker-card bg-muted">
          <h2 className="font-bold text-foreground mb-3 flex items-center gap-2">
            <span className="text-xl">🆘</span>
            Hulp nodig?
          </h2>
          <p className="text-sm text-foreground mb-3">
            Bel de Mantelzorglijn voor persoonlijk advies.
          </p>
          <a
            href="tel:0302059059"
            className="ker-btn ker-btn-secondary w-full flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            030 - 205 9 059
          </a>
        </div>

        {/* Uitloggen */}
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="ker-btn w-full bg-[var(--accent-red-bg)] text-[var(--accent-red)] hover:bg-[var(--accent-red)] hover:text-white transition-colors flex items-center justify-center gap-2"
        >
          {isLoggingOut ? (
            <>
              <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Uitloggen...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Uitloggen
            </>
          )}
        </button>

        {/* Versie info */}
        <div className="text-center pt-4 pb-8">
          <p className="text-xs text-muted-foreground">
            MantelBuddy v1.0
          </p>
        </div>
      </div>
    </div>
  )
}
