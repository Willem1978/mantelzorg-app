"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import Link from "next/link"
import { LocationSearch } from "@/components/ui/LocationSearch"
import { GerAvatar } from "@/components/GerAvatar"

interface MunicipalityInfo {
  code: string
  name: string
  provinceCode: string
  provinceName: string
}

export default function RegisterPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    passwordConfirm: "",
    municipality: null as MunicipalityInfo | null,
    privacyConsent: false,
    dataProcessingConsent: false,
  })

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

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

    if (!formData.municipality) {
      setError("Kies je gemeente")
      return
    }

    if (!formData.privacyConsent || !formData.dataProcessingConsent) {
      setError("Je moet akkoord gaan")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          municipality: formData.municipality,
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
        // Registratie gelukt maar inloggen niet - stuur naar login pagina
        router.push("/login?registered=true")
        return
      }

      // Redirect naar dashboard
      router.push("/dashboard")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Er ging iets mis")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header met Ger */}
      <div className="px-4 pt-8 pb-4">
        <div className="max-w-md mx-auto flex items-start gap-4">
          <GerAvatar size="lg" />
          <div className="pt-2">
            <h1 className="text-2xl font-bold text-foreground">
              {step === 1 ? "Maak een account" : "Nog even dit"}
            </h1>
            <p className="text-muted-foreground mt-1">
              {step === 1
                ? "Stap 1: Kies je e-mail en wachtwoord"
                : "Stap 2: Waar woon je?"}
            </p>
          </div>
        </div>
      </div>

      {/* Stappen indicator */}
      <div className="px-4 pb-4">
        <div className="max-w-md mx-auto">
          <div className="flex justify-center">
            <div className="ker-pill">
              stap <span className="font-bold mx-1">{step}</span> van 2
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

            {step === 1 ? (
              <form onSubmit={handleStep1Submit} className="space-y-4">
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
                  Volgende stap
                </button>
              </form>
            ) : (
              <form onSubmit={handleStep2Submit} className="space-y-4">
                <LocationSearch
                  label="Je gemeente"
                  value={formData.municipality}
                  onChange={(municipality) => setFormData({ ...formData, municipality })}
                  placeholder="Typ je postcode of gemeente"
                />

                {/* Privacy uitleg */}
                <div className="bg-muted rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                      <span className="text-primary-foreground text-sm font-bold">i</span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground mb-1">Je gegevens zijn veilig</p>
                      <p className="text-sm text-muted-foreground">
                        We slaan je adres niet op. We bewaren alleen je gemeente.
                        Zo kunnen we hulp in de buurt laten zien.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Toestemming */}
                <div className="space-y-3">
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
                        regels over privacy
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
                    onClick={() => setStep(1)}
                    className="ker-btn ker-btn-secondary flex-1"
                  >
                    Terug
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="ker-btn ker-btn-primary flex-1"
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                        Bezig...
                      </span>
                    ) : (
                      "Klaar"
                    )}
                  </button>
                </div>
              </form>
            )}

            <div className="mt-6 pt-6 border-t border-border text-center">
              <p className="text-muted-foreground">
                Heb je al een account?{" "}
                <Link href="/login" className="text-primary font-medium hover:underline">
                  Log in
                </Link>
              </p>
            </div>
          </div>

          {/* Terug naar test link */}
          <div className="mt-4 text-center">
            <Link href="/belastbaarheidstest" className="text-sm text-muted-foreground hover:text-foreground">
              ← Terug naar de Balanstest
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
