"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import Link from "next/link"
import { AddressSearch, AddressInfo } from "@/components/ui/AddressSearch"
import { GerAvatar } from "@/components/GerAvatar"

const RELATIE_OPTIES = [
  "Partner",
  "Ouder",
  "Kind",
  "Broer/zus",
  "Schoonouder",
  "Vriend(in)",
  "Buurman/vrouw",
  "Anders",
]

export default function RegisterPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    // Stap 1: Account
    email: "",
    password: "",
    passwordConfirm: "",
    phoneNumber: "",
    // Stap 2: Jouw gegevens
    name: "",
    address: null as AddressInfo | null,
    // Stap 3: Naaste
    careRecipientName: "",
    careRecipientRelation: "",
    careRecipientAddress: null as AddressInfo | null,
    // Privacy
    privacyConsent: false,
    dataProcessingConsent: false,
  })

  // Valideer telefoonnummer: moet beginnen met 06 en 10 cijfers hebben
  const validatePhoneNumber = (phone: string): boolean => {
    const cleaned = phone.replace(/[\s-]/g, '')
    return /^06\d{8}$/.test(cleaned)
  }

  // Normaliseer telefoonnummer naar +31 formaat
  const normalizePhoneNumber = (phone: string): string => {
    const cleaned = phone.replace(/[\s-]/g, '')
    if (cleaned.startsWith('06')) {
      return '+31' + cleaned.substring(1)
    }
    return cleaned
  }

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!formData.email) {
      setError("Vul je e-mailadres in")
      return
    }

    if (formData.password.length < 8) {
      setError("Je wachtwoord moet minimaal 8 tekens zijn")
      return
    }

    if (formData.password !== formData.passwordConfirm) {
      setError("De wachtwoorden zijn niet hetzelfde")
      return
    }

    if (formData.phoneNumber && !validatePhoneNumber(formData.phoneNumber)) {
      setError("Vul een geldig telefoonnummer in (06 + 8 cijfers)")
      return
    }

    setStep(2)
  }

  const handleStep2Submit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!formData.name.trim()) {
      setError("Vul je naam in")
      return
    }

    if (!formData.address) {
      setError("Kies je adres")
      return
    }

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
      setError("Kies je relatie tot je naaste")
      return
    }

    if (!formData.careRecipientAddress) {
      setError("Kies het adres van je naaste")
      return
    }

    if (!formData.privacyConsent || !formData.dataProcessingConsent) {
      setError("Je moet akkoord gaan met de voorwaarden")
      return
    }

    setIsLoading(true)

    try {
      const phoneNumber = formData.phoneNumber ? normalizePhoneNumber(formData.phoneNumber) : undefined

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          phoneNumber,
          // Eigen locatie
          street: formData.address?.straat,
          city: formData.address?.woonplaats,
          municipality: {
            code: "",
            name: formData.address?.gemeente || "",
            provinceCode: "",
            provinceName: "",
          },
          // Naaste info
          careRecipientName: formData.careRecipientName,
          careRecipientRelation: formData.careRecipientRelation,
          careRecipientStreet: formData.careRecipientAddress?.straat,
          careRecipientCity: formData.careRecipientAddress?.woonplaats,
          careRecipientMunicipality: formData.careRecipientAddress?.gemeente,
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
        router.push("/login?registered=true")
        return
      }

      router.push("/dashboard")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Er ging iets mis")
    } finally {
      setIsLoading(false)
    }
  }

  const getStepTitle = () => {
    switch (step) {
      case 1: return "Maak een account"
      case 2: return "Over jou"
      case 3: return "Over je naaste"
      default: return ""
    }
  }

  const getStepSubtitle = () => {
    switch (step) {
      case 1: return "Vul je e-mail en wachtwoord in. Zo kun je later weer inloggen."
      case 2: return "Vul je naam en adres in. Met je adres zoeken we hulp bij jou in de buurt."
      case 3: return "Bijna klaar! Vul de gegevens van je naaste in."
      default: return ""
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row">
      {/* Desktop: linker kolom met Ger en welkomstboodschap */}
      <div className="lg:w-1/2 lg:bg-primary/5 lg:flex lg:flex-col lg:justify-center lg:items-center lg:p-12">
        {/* Mobiel: Header met Ger */}
        <div className="px-4 pt-8 pb-4 lg:p-0 lg:text-center lg:max-w-md">
          <div className="flex items-start gap-4 lg:flex-col lg:items-center lg:gap-6">
            <GerAvatar size="lg" className="lg:w-32 lg:h-32" />
            <div className="pt-2 lg:pt-0">
              <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
                {getStepTitle()}
              </h1>
              <p className="text-muted-foreground mt-1 lg:mt-3 lg:text-lg">
                {getStepSubtitle()}
              </p>
            </div>
          </div>

          {/* Stappen indicator - nu in de linker kolom op desktop */}
          <div className="mt-4 lg:mt-8 flex justify-center lg:justify-center">
            <div className="ker-pill lg:text-base lg:px-6 lg:py-2">
              stap <span className="font-bold mx-1">{step}</span> van 3
            </div>
          </div>
        </div>
      </div>

      {/* Rechter kolom / Content */}
      <div className="flex-1 lg:flex lg:flex-col lg:justify-center lg:items-center lg:p-12">
        <main className="px-4 pb-8 lg:px-0 lg:w-full lg:max-w-md">
          <div className="max-w-md mx-auto lg:mx-0 lg:max-w-none">
            <div className="ker-card lg:shadow-lg">
            {error && (
              <div className="bg-[#FFEBEE] border-2 border-[#F44336] text-[#C62828] px-4 py-3 rounded-xl mb-6 text-sm">
                {error}
              </div>
            )}

            {/* STAP 1: Account gegevens */}
            {step === 1 && (
              <form onSubmit={handleStep1Submit} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                    Je e-mailadres
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="ker-input"
                    placeholder="naam@voorbeeld.nl"
                    required
                    autoComplete="email"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Hier sturen we belangrijke berichten naartoe
                  </p>
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
                    placeholder="Minimaal 8 tekens"
                    required
                    autoComplete="new-password"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Kies iets dat je makkelijk onthoudt
                  </p>
                </div>

                <div>
                  <label htmlFor="passwordConfirm" className="block text-sm font-medium text-foreground mb-2">
                    Typ je wachtwoord nog een keer
                  </label>
                  <input
                    id="passwordConfirm"
                    type="password"
                    value={formData.passwordConfirm}
                    onChange={(e) => setFormData({ ...formData, passwordConfirm: e.target.value })}
                    className="ker-input"
                    placeholder="Hetzelfde als hierboven"
                    required
                    autoComplete="new-password"
                  />
                </div>

                <div>
                  <label htmlFor="phoneNumber" className="block text-sm font-medium text-foreground mb-2">
                    Je mobiele nummer <span className="text-muted-foreground font-normal">(niet verplicht)</span>
                  </label>
                  <input
                    id="phoneNumber"
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    className="ker-input"
                    placeholder="06 12345678"
                    autoComplete="tel"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Dan kun je MantelBuddy ook via WhatsApp gebruiken
                  </p>
                </div>

                <button type="submit" className="ker-btn ker-btn-primary w-full">
                  Ga verder
                </button>
              </form>
            )}

            {/* STAP 2: Eigen gegevens */}
            {step === 2 && (
              <form onSubmit={handleStep2Submit} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                    Hoe mogen we je noemen?
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="ker-input"
                    placeholder="Je voornaam"
                    required
                    autoComplete="given-name"
                  />
                </div>

                <AddressSearch
                  label="Waar woon jij?"
                  value={formData.address}
                  onChange={(address) => setFormData({ ...formData, address })}
                  placeholder="Begin met typen, bijv. Kerkstraat of 1234AB"
                />
                <p className="text-xs text-muted-foreground -mt-2">
                  Dit hebben we nodig om hulp bij jou in de buurt te vinden
                </p>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="ker-btn ker-btn-secondary flex-1"
                  >
                    ← Terug
                  </button>
                  <button type="submit" className="ker-btn ker-btn-primary flex-1">
                    Ga verder
                  </button>
                </div>
              </form>
            )}

            {/* STAP 3: Naaste gegevens */}
            {step === 3 && (
              <form onSubmit={handleStep3Submit} className="space-y-4">
                <div>
                  <label htmlFor="careRecipientName" className="block text-sm font-medium text-foreground mb-2">
                    Hoe heet degene voor wie je zorgt?
                  </label>
                  <input
                    id="careRecipientName"
                    type="text"
                    value={formData.careRecipientName}
                    onChange={(e) => setFormData({ ...formData, careRecipientName: e.target.value })}
                    className="ker-input"
                    placeholder="Voornaam"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Wie is dat voor jou?
                  </label>
                  <p className="text-xs text-muted-foreground mb-3">Tik op wat van toepassing is</p>
                  <div className="grid grid-cols-2 gap-2">
                    {RELATIE_OPTIES.map((relatie) => (
                      <button
                        key={relatie}
                        type="button"
                        onClick={() => setFormData({ ...formData, careRecipientRelation: relatie })}
                        className={`px-3 py-3 rounded-xl border-2 text-sm transition-colors ${
                          formData.careRecipientRelation === relatie
                            ? "border-primary bg-primary/10 text-primary font-medium"
                            : "border-border hover:border-primary/30"
                        }`}
                      >
                        {relatie}
                      </button>
                    ))}
                  </div>
                </div>

                <AddressSearch
                  label="Waar woont je naaste?"
                  value={formData.careRecipientAddress}
                  onChange={(address) => setFormData({ ...formData, careRecipientAddress: address })}
                  placeholder="Begin met typen, bijv. Kerkstraat of 1234AB"
                />
                <p className="text-xs text-muted-foreground -mt-2">
                  Zo vinden we hulp bij je naaste in de buurt
                </p>

                {/* Privacy */}
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
                    ← Terug
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="ker-btn ker-btn-primary flex-1"
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                        Even geduld...
                      </span>
                    ) : (
                      "Klaar!"
                    )}
                  </button>
                </div>
              </form>
            )}

            <div className="mt-6 pt-6 border-t border-border text-center">
              <p className="text-muted-foreground lg:text-base">
                Heb je al een account?{" "}
                <Link href="/login" className="text-primary font-medium hover:underline transition-colors">
                  Log in
                </Link>
              </p>
            </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
