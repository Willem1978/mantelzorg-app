"use client"

import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"
import Link from "next/link"
import { GerAvatar } from "@/components/GerAvatar"

function LoginWhatsAppForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingPhone, setIsCheckingPhone] = useState(false)
  const [error, setError] = useState("")
  const [step, setStep] = useState(searchParams.get("phone") ? 1 : 0) // 0 = phone input, 1 = login
  const [manualPhone, setManualPhone] = useState("")
  const [currentPhone, setCurrentPhone] = useState(searchParams.get("phone") || "")
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })

  // Format telefoonnummer voor weergave
  const formatPhone = (phone: string) => {
    if (phone.startsWith("+31")) {
      return "0" + phone.slice(3)
    }
    return phone
  }

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

    setCurrentPhone(normalizedPhone)
    setStep(1)
    setError("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        phoneNumber: currentPhone || undefined,
        redirect: false,
      })

      if (result?.error) {
        throw new Error("Ongeldige inloggegevens")
      }

      // Redirect naar success pagina
      router.push("/login-whatsapp/success")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Er ging iets mis")
    } finally {
      setIsLoading(false)
    }
  }

  // Stap 0: Telefoonnummer invoeren
  if (step === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="px-4 pt-8 pb-4">
          <div className="max-w-md mx-auto flex items-start gap-4">
            <GerAvatar size="lg" />
            <div className="pt-2">
              <h1 className="text-2xl font-bold text-foreground">Inloggen</h1>
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
                  Nog geen account?{" "}
                  <Link href="/register-whatsapp" className="text-primary font-medium hover:underline">
                    Maak een account aan
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // Stap 1: Login formulier
  return (
    <div className="min-h-screen bg-background">
      {/* Header met Ger */}
      <div className="px-4 pt-8 pb-4">
        <div className="max-w-md mx-auto flex items-start gap-4">
          <GerAvatar size="lg" />
          <div className="pt-2">
            <h1 className="text-2xl font-bold text-foreground">Inloggen via WhatsApp</h1>
            <p className="text-muted-foreground mt-1">
              Log in om je WhatsApp te koppelen aan je account.
            </p>
          </div>
        </div>
      </div>

      {/* WhatsApp nummer indicator */}
      {currentPhone && (
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
                <p className="text-green-700 font-bold">{formatPhone(currentPhone)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <main className="px-4 pb-8">
        <div className="max-w-md mx-auto">
          <div className="ker-card">
            <div className="bg-primary/10 border-2 border-primary/30 text-foreground px-4 py-3 rounded-xl mb-6 text-sm">
              <p className="font-medium">Koppel je WhatsApp</p>
              <p className="text-muted-foreground">Na het inloggen wordt je WhatsApp automatisch gekoppeld aan je account.</p>
            </div>

            {error && (
              <div className="bg-[#FFEBEE] border-2 border-[#F44336] text-[#C62828] px-4 py-3 rounded-xl mb-6 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                  E-mail
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
                  Wachtwoord
                </label>
                <input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="ker-input"
                  placeholder="Je wachtwoord"
                  required
                />
              </div>

              <div className="text-right">
                <Link href="/wachtwoord-vergeten" className="text-sm text-primary hover:underline">
                  Wachtwoord vergeten?
                </Link>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="ker-btn ker-btn-primary w-full"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                    Inloggen...
                  </span>
                ) : (
                  "Inloggen en WhatsApp koppelen"
                )}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-border text-center">
              <p className="text-muted-foreground">
                Nog geen account?{" "}
                <Link
                  href={currentPhone ? `/register-whatsapp?phone=${encodeURIComponent(currentPhone)}` : "/register-whatsapp"}
                  className="text-primary font-medium hover:underline"
                >
                  Maak een account aan
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function LoginWhatsAppPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LoginWhatsAppForm />
    </Suspense>
  )
}
