"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn, signOut, useSession } from "next-auth/react"
import Link from "next/link"
import { GerAvatar } from "@/components/GerAvatar"

interface AddressInfo {
  street?: string
  city?: string
  municipality?: string
  postalCode?: string
  huisnummer?: string
}

const RELATIE_OPTIES = [
  'Partner',
  'Ouder',
  'Schoonouder',
  'Kind',
  'Broer/zus',
  'Vriend(in)',
  'Buur',
  'Anders',
]

function RegisterWhatsAppForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const phoneNumber = searchParams.get("phone") || ""
  const userName = searchParams.get("name") || ""

  const [isLoading, setIsLoading] = useState(false)
  const [isLookingUp, setIsLookingUp] = useState(false)
  const [isCheckingPhone, setIsCheckingPhone] = useState(!!phoneNumber)
  const [existingAccount, setExistingAccount] = useState(false)
  const [error, setError] = useState("")
  const [step, setStep] = useState(phoneNumber ? 1 : 0) // Stap 0 = telefoonnummer invoeren
  const [manualPhone, setManualPhone] = useState("")
  const [formData, setFormData] = useState({
    // Stap 1: Account
    name: userName,
    email: "",
    password: "",
    passwordConfirm: "",
    phoneNumber: phoneNumber,
    // Stap 2: Eigen adres
    ownPostcode: "",
    ownHuisnummer: "",
    ownAddress: null as AddressInfo | null,
    // Stap 3: Naaste
    careRecipientName: "",
    careRecipientRelation: "",
    carePostcode: "",
    careHuisnummer: "",
    careAddress: null as AddressInfo | null,
    // Privacy
    privacyConsent: false,
    dataProcessingConsent: false,
  })

  // Check telefoonnummer als die er is
  useEffect(() => {
    if (!phoneNumber) {
      // Geen telefoonnummer - toon invoerveld (stap 0)
      return
    }

    // Check of dit telefoonnummer al aan een account is gekoppeld
    const checkExistingAccount = async () => {
      try {
        const res = await fetch(`/api/auth/check-phone?phone=${encodeURIComponent(phoneNumber)}`)
        const data = await res.json()
        setExistingAccount(data.exists)
      } catch (error) {
        console.error("Failed to check phone:", error)
      } finally {
        setIsCheckingPhone(false)
      }
    }

    checkExistingAccount()
  }, [phoneNumber])

  // Telefoonnummer handmatig invoeren en doorgaan
  const handlePhoneSubmit = async () => {
    if (!manualPhone.trim()) {
      setError("Vul je telefoonnummer in")
      return
    }

    // Normaliseer telefoonnummer naar +31 formaat
    let normalizedPhone = manualPhone.trim()
    if (normalizedPhone.startsWith("06")) {
      normalizedPhone = "+31" + normalizedPhone.slice(1)
    } else if (normalizedPhone.startsWith("0031")) {
      normalizedPhone = "+" + normalizedPhone.slice(2)
    } else if (!normalizedPhone.startsWith("+")) {
      normalizedPhone = "+31" + normalizedPhone.replace(/^0/, "")
    }

    setIsCheckingPhone(true)
    setError("")

    try {
      const res = await fetch(`/api/auth/check-phone?phone=${encodeURIComponent(normalizedPhone)}`)
      const data = await res.json()

      if (data.exists) {
        setExistingAccount(true)
        setFormData(prev => ({ ...prev, phoneNumber: normalizedPhone }))
      } else {
        setFormData(prev => ({ ...prev, phoneNumber: normalizedPhone }))
        setStep(1)
      }
    } catch (error) {
      console.error("Failed to check phone:", error)
      setError("Er ging iets mis. Probeer het opnieuw.")
    } finally {
      setIsCheckingPhone(false)
    }
  }

  // Uitloggen als al ingelogd (voor schone registratie)
  const handleLogoutAndRegister = async () => {
    await signOut({ redirect: false })
    setIsCheckingPhone(false)
    setExistingAccount(false)
  }

  // PDOK adres lookup
  const lookupAddress = async (postcode: string, huisnummer: string): Promise<AddressInfo | null> => {
    try {
      const response = await fetch(
        `/api/location/lookup?postcode=${encodeURIComponent(postcode)}&huisnummer=${encodeURIComponent(huisnummer)}`
      )
      if (response.ok) {
        const data = await response.json()
        return {
          street: data.straat,
          city: data.woonplaats,
          municipality: data.gemeente,
          postalCode: postcode.replace(/\s/g, '').toUpperCase(),
          huisnummer,
        }
      }
    } catch (error) {
      console.error("Address lookup error:", error)
    }
    return null
  }

  // Valideer postcode formaat
  const isValidPostcode = (postcode: string): boolean => {
    const clean = postcode.replace(/\s/g, '').toUpperCase()
    return /^\d{4}[A-Z]{2}$/.test(clean)
  }

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!formData.name.trim()) {
      setError("Vul je naam in")
      return
    }

    if (formData.password !== formData.passwordConfirm) {
      setError("De wachtwoorden zijn niet hetzelfde")
      return
    }

    if (formData.password.length < 8) {
      setError("Je wachtwoord moet 8 tekens of meer zijn")
      return
    }

    setStep(2)
  }

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!isValidPostcode(formData.ownPostcode)) {
      setError("Vul een geldige postcode in (bijv. 1234 AB)")
      return
    }

    if (!formData.ownHuisnummer.trim()) {
      setError("Vul je huisnummer in")
      return
    }

    // Lookup adres
    setIsLookingUp(true)
    const address = await lookupAddress(formData.ownPostcode, formData.ownHuisnummer)
    setIsLookingUp(false)

    if (!address) {
      setError("Adres niet gevonden. Controleer je postcode en huisnummer.")
      return
    }

    setFormData({ ...formData, ownAddress: address })
    setStep(3)
  }

  const handleStep3Submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!formData.careRecipientName.trim()) {
      setError("Vul de naam van je naaste in")
      return
    }

    if (!formData.careRecipientRelation) {
      setError("Kies je relatie")
      return
    }

    if (!isValidPostcode(formData.carePostcode)) {
      setError("Vul een geldige postcode in voor je naaste")
      return
    }

    if (!formData.careHuisnummer.trim()) {
      setError("Vul het huisnummer van je naaste in")
      return
    }

    if (!formData.privacyConsent || !formData.dataProcessingConsent) {
      setError("Je moet akkoord gaan met de voorwaarden")
      return
    }

    // Lookup care recipient adres
    setIsLookingUp(true)
    const careAddress = await lookupAddress(formData.carePostcode, formData.careHuisnummer)
    setIsLookingUp(false)

    if (!careAddress) {
      setError("Adres van naaste niet gevonden. Controleer postcode en huisnummer.")
      return
    }

    setFormData({ ...formData, careAddress })

    // Nu registreren
    await submitRegistration(careAddress)
  }

  const submitRegistration = async (careAddress: AddressInfo) => {
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          phoneNumber: formData.phoneNumber,
          // Eigen adres
          postalCode: formData.ownAddress?.postalCode,
          street: formData.ownAddress?.street,
          city: formData.ownAddress?.city,
          municipality: {
            code: "",
            name: formData.ownAddress?.municipality || "",
            provinceCode: "",
            provinceName: "",
          },
          // Naaste info
          careRecipientName: formData.careRecipientName,
          careRecipientRelation: formData.careRecipientRelation,
          careRecipientStreet: careAddress.street,
          careRecipientCity: careAddress.city,
          careRecipientMunicipality: careAddress.municipality,
          // Privacy
          privacyConsent: formData.privacyConsent,
          dataProcessingConsent: formData.dataProcessingConsent,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Het is niet gelukt")
      }

      // Automatisch inloggen na registratie
      const signInResult = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      })

      if (signInResult?.error) {
        router.push("/register-whatsapp/success")
        return
      }

      router.push("/register-whatsapp/success")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Er ging iets mis")
    } finally {
      setIsLoading(false)
    }
  }

  // Format telefoonnummer voor weergave
  const formatPhone = (phone: string) => {
    if (phone.startsWith("+31")) {
      return "0" + phone.slice(3)
    }
    return phone
  }

  const totalSteps = 3

  // Loading state
  if (isCheckingPhone) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Even checken...</p>
        </div>
      </div>
    )
  }

  // Stap 0: Telefoonnummer invoeren (als er geen ?phone= parameter is)
  if (step === 0 && !phoneNumber) {
    return (
      <div className="min-h-screen bg-background">
        <div className="px-4 pt-8 pb-4">
          <div className="max-w-md mx-auto flex items-start gap-4">
            <GerAvatar size="lg" />
            <div className="pt-2">
              <h1 className="text-2xl font-bold text-foreground">Account aanmaken</h1>
              <p className="text-muted-foreground mt-1">
                Koppel je WhatsApp aan je account.
              </p>
            </div>
          </div>
        </div>
        <main className="px-4 pb-8">
          <div className="max-w-md mx-auto">
            <div className="ker-card">
              <div className="bg-primary/10 border-2 border-primary/30 rounded-xl p-4 mb-6">
                <p className="text-foreground font-medium">📱 WhatsApp koppelen</p>
                <p className="text-muted-foreground text-sm mt-1">
                  Vul je telefoonnummer in om je WhatsApp te koppelen aan je account.
                </p>
              </div>

              {error && (
                <div className="bg-[#FFEBEE] border-2 border-[#F44336] text-[#C62828] px-4 py-3 rounded-xl mb-6 text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-2">
                    Telefoonnummer
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    value={manualPhone}
                    onChange={(e) => setManualPhone(e.target.value)}
                    className="ker-input"
                    placeholder="06 12345678"
                    autoFocus
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Hetzelfde nummer als je WhatsApp
                  </p>
                </div>

                <button
                  onClick={handlePhoneSubmit}
                  disabled={isCheckingPhone}
                  className="ker-btn ker-btn-primary w-full"
                >
                  {isCheckingPhone ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                      Controleren...
                    </span>
                  ) : (
                    "Doorgaan"
                  )}
                </button>
              </div>

              <div className="mt-6 pt-6 border-t border-border text-center">
                <p className="text-muted-foreground">
                  Heb je al een account?{" "}
                  <Link href="/login-whatsapp" className="text-primary font-medium hover:underline">
                    Log in
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // Als dit telefoonnummer al gekoppeld is aan een account
  const displayPhone = formData.phoneNumber || phoneNumber
  if (existingAccount) {
    return (
      <div className="min-h-screen bg-background">
        <div className="px-4 pt-8 pb-4">
          <div className="max-w-md mx-auto flex items-start gap-4">
            <GerAvatar size="lg" />
            <div className="pt-2">
              <h1 className="text-2xl font-bold text-foreground">Al een account!</h1>
              <p className="text-muted-foreground mt-1">
                Dit telefoonnummer is al gekoppeld aan een account.
              </p>
            </div>
          </div>
        </div>
        <main className="px-4 pb-8">
          <div className="max-w-md mx-auto">
            <div className="ker-card">
              <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 mb-6">
                <p className="text-green-800 font-medium">📱 {formatPhone(displayPhone)}</p>
                <p className="text-green-700 text-sm mt-1">Is al gekoppeld aan je account</p>
              </div>

              <p className="text-muted-foreground mb-6">
                Je hebt al een account met dit WhatsApp nummer. Log in om verder te gaan.
              </p>

              <Link
                href={`/login-whatsapp?phone=${encodeURIComponent(displayPhone)}`}
                className="ker-btn ker-btn-primary w-full block text-center"
              >
                Inloggen
              </Link>

              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground text-center mb-3">
                  Wil je toch een nieuw account maken?
                </p>
                <button
                  onClick={() => {
                    setExistingAccount(false)
                    setStep(1)
                  }}
                  className="ker-btn ker-btn-secondary w-full"
                >
                  Nieuw account maken
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // Als er een sessie is (al ingelogd met ander account)
  if (session) {
    return (
      <div className="min-h-screen bg-background">
        <div className="px-4 pt-8 pb-4">
          <div className="max-w-md mx-auto flex items-start gap-4">
            <GerAvatar size="lg" />
            <div className="pt-2">
              <h1 className="text-2xl font-bold text-foreground">Al ingelogd</h1>
              <p className="text-muted-foreground mt-1">
                Je bent al ingelogd met een ander account.
              </p>
            </div>
          </div>
        </div>
        <main className="px-4 pb-8">
          <div className="max-w-md mx-auto">
            <div className="ker-card">
              <div className="bg-primary/10 rounded-xl p-4 mb-6">
                <p className="font-medium">Ingelogd als:</p>
                <p className="text-primary">{session.user?.email}</p>
              </div>

              <p className="text-muted-foreground mb-6">
                Wil je dit WhatsApp nummer ({formatPhone(phoneNumber)}) koppelen aan je huidige account, of een nieuw account maken?
              </p>

              <div className="space-y-3">
                <Link
                  href="/dashboard"
                  className="ker-btn ker-btn-primary w-full block text-center"
                >
                  Naar mijn dashboard
                </Link>

                <button
                  onClick={handleLogoutAndRegister}
                  className="ker-btn ker-btn-secondary w-full"
                >
                  Uitloggen en nieuw account maken
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header met Ger */}
      <div className="px-4 pt-8 pb-4">
        <div className="max-w-md mx-auto flex items-start gap-4">
          <GerAvatar size="lg" />
          <div className="pt-2">
            <h1 className="text-2xl font-bold text-foreground">
              {step === 1 && "Maak je account"}
              {step === 2 && "Waar woon je?"}
              {step === 3 && "Voor wie zorg je?"}
            </h1>
            <p className="text-muted-foreground mt-1">
              {step === 1 && "Verbind je WhatsApp met je account"}
              {step === 2 && "Zodat we hulp in de buurt kunnen tonen"}
              {step === 3 && "Vertel over je naaste"}
            </p>
          </div>
        </div>
      </div>

      {/* WhatsApp nummer indicator */}
      <div className="px-4 pb-4">
        <div className="max-w-md mx-auto">
          <div className="bg-green-50 border-2 border-green-200 rounded-xl p-3 flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </div>
            <div>
              <p className="text-sm text-green-800 font-medium">Je WhatsApp nummer</p>
              <p className="text-green-700 font-bold">{formatPhone(phoneNumber)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stappen indicator */}
      <div className="px-4 pb-4">
        <div className="max-w-md mx-auto">
          <div className="flex justify-center">
            <div className="ker-pill">
              stap <span className="font-bold mx-1">{step}</span> van {totalSteps}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="px-4 pb-8">
        <div className="max-w-md mx-auto">
          <div className="ker-card">
            {error && (
              <div className="bg-[#FFEBEE] border-2 border-[#F44336] text-[#C62828] px-4 py-3 rounded-xl mb-6 text-sm">
                {error}
              </div>
            )}

            {/* STAP 1: Account gegevens */}
            {step === 1 && (
              <form onSubmit={handleStep1Submit} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                    Je naam
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="ker-input"
                    placeholder="Hoe mag ik je noemen?"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                    Je e-mail
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="ker-input"
                    placeholder="jouw@email.nl"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                    Kies een wachtwoord
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="ker-input"
                    placeholder="Minstens 8 tekens"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="passwordConfirm" className="block text-sm font-medium text-foreground mb-2">
                    Herhaal je wachtwoord
                  </label>
                  <input
                    id="passwordConfirm"
                    type="password"
                    value={formData.passwordConfirm}
                    onChange={(e) => setFormData({ ...formData, passwordConfirm: e.target.value })}
                    className="ker-input"
                    placeholder="Typ het nog een keer"
                    required
                  />
                </div>

                <button type="submit" className="ker-btn ker-btn-primary w-full">
                  Volgende
                </button>
              </form>
            )}

            {/* STAP 2: Eigen adres */}
            {step === 2 && (
              <form onSubmit={handleStep2Submit} className="space-y-4">
                <div>
                  <label htmlFor="ownPostcode" className="block text-sm font-medium text-foreground mb-2">
                    Je postcode
                  </label>
                  <input
                    id="ownPostcode"
                    type="text"
                    value={formData.ownPostcode}
                    onChange={(e) => setFormData({ ...formData, ownPostcode: e.target.value })}
                    className="ker-input"
                    placeholder="1234 AB"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="ownHuisnummer" className="block text-sm font-medium text-foreground mb-2">
                    Je huisnummer
                  </label>
                  <input
                    id="ownHuisnummer"
                    type="text"
                    value={formData.ownHuisnummer}
                    onChange={(e) => setFormData({ ...formData, ownHuisnummer: e.target.value })}
                    className="ker-input"
                    placeholder="123"
                    required
                  />
                </div>

                {/* Privacy uitleg */}
                <div className="bg-muted rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                      <span className="text-primary-foreground text-sm font-bold">i</span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground mb-1">Je gegevens zijn veilig</p>
                      <p className="text-sm text-muted-foreground">
                        We gebruiken je adres alleen om hulp in de buurt te tonen.
                        Je exacte adres wordt niet gedeeld.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="ker-btn ker-btn-secondary flex-1"
                  >
                    Terug
                  </button>
                  <button
                    type="submit"
                    disabled={isLookingUp}
                    className="ker-btn ker-btn-primary flex-1"
                  >
                    {isLookingUp ? "Zoeken..." : "Volgende"}
                  </button>
                </div>
              </form>
            )}

            {/* STAP 3: Naaste info */}
            {step === 3 && (
              <form onSubmit={handleStep3Submit} className="space-y-4">
                {/* Toon eigen adres */}
                {formData.ownAddress && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-4">
                    <p className="text-sm text-green-800">
                      <span className="font-medium">Jouw adres:</span> {formData.ownAddress.street} {formData.ownHuisnummer}, {formData.ownAddress.city}
                    </p>
                  </div>
                )}

                <div>
                  <label htmlFor="careRecipientName" className="block text-sm font-medium text-foreground mb-2">
                    Naam van je naaste
                  </label>
                  <input
                    id="careRecipientName"
                    type="text"
                    value={formData.careRecipientName}
                    onChange={(e) => setFormData({ ...formData, careRecipientName: e.target.value })}
                    className="ker-input"
                    placeholder="Voor wie zorg je?"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Wat is je relatie?
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {RELATIE_OPTIES.map((relatie) => (
                      <button
                        key={relatie}
                        type="button"
                        onClick={() => setFormData({ ...formData, careRecipientRelation: relatie })}
                        className={`p-3 rounded-xl border-2 text-sm font-medium transition-colors ${
                          formData.careRecipientRelation === relatie
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border hover:border-primary/30"
                        }`}
                      >
                        {relatie}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label htmlFor="carePostcode" className="block text-sm font-medium text-foreground mb-2">
                    Postcode van je naaste
                  </label>
                  <input
                    id="carePostcode"
                    type="text"
                    value={formData.carePostcode}
                    onChange={(e) => setFormData({ ...formData, carePostcode: e.target.value })}
                    className="ker-input"
                    placeholder="1234 AB"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="careHuisnummer" className="block text-sm font-medium text-foreground mb-2">
                    Huisnummer van je naaste
                  </label>
                  <input
                    id="careHuisnummer"
                    type="text"
                    value={formData.careHuisnummer}
                    onChange={(e) => setFormData({ ...formData, careHuisnummer: e.target.value })}
                    className="ker-input"
                    placeholder="123"
                    required
                  />
                </div>

                {/* Toestemming */}
                <div className="space-y-3 pt-2">
                  <label className="flex items-start gap-3 cursor-pointer p-4 rounded-xl border-2 border-border hover:border-primary/30 transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.privacyConsent}
                      onChange={(e) => setFormData({ ...formData, privacyConsent: e.target.checked })}
                      className="mt-0.5 h-5 w-5 text-primary rounded border-border focus:ring-primary"
                    />
                    <span className="text-sm text-foreground">
                      Ik ga akkoord met de{" "}
                      <Link href="/privacy" className="text-primary hover:underline">
                        privacyregels
                      </Link>
                    </span>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer p-4 rounded-xl border-2 border-border hover:border-primary/30 transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.dataProcessingConsent}
                      onChange={(e) => setFormData({ ...formData, dataProcessingConsent: e.target.checked })}
                      className="mt-0.5 h-5 w-5 text-primary rounded border-border focus:ring-primary"
                    />
                    <span className="text-sm text-foreground">
                      Jullie mogen mijn gegevens gebruiken om mij te helpen
                    </span>
                  </label>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="ker-btn ker-btn-secondary flex-1"
                  >
                    Terug
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading || isLookingUp}
                    className="ker-btn ker-btn-primary flex-1"
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                        Bezig...
                      </span>
                    ) : isLookingUp ? (
                      "Zoeken..."
                    ) : (
                      "Account maken"
                    )}
                  </button>
                </div>
              </form>
            )}

            <div className="mt-6 pt-6 border-t border-border text-center">
              <p className="text-muted-foreground">
                Heb je al een account?{" "}
                <Link href={`/login-whatsapp?phone=${encodeURIComponent(phoneNumber)}`} className="text-primary font-medium hover:underline">
                  Log in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function RegisterWhatsAppPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <RegisterWhatsAppForm />
    </Suspense>
  )
}
