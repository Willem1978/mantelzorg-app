"use client"

import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"
import Link from "next/link"
import { GerAvatar } from "@/components/GerAvatar"

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })

  const fromTest = searchParams.get("from") === "test"
  const phoneNumber = searchParams.get("phone") // WhatsApp telefoonnummer
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard" // Redirect na login
  const sessionInvalidated = searchParams.get("reason") === "session_invalidated"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        phoneNumber: phoneNumber || undefined, // Geef telefoonnummer door
        redirect: false,
      })

      if (result?.error) {
        throw new Error("Ongeldige inloggegevens")
      }

      // Redirect naar callbackUrl of dashboard
      router.push(callbackUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Er ging iets mis")
    } finally {
      setIsLoading(false)
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
              <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Welkom terug!</h1>
              <p className="text-muted-foreground mt-1 lg:mt-3 lg:text-lg">
                Vul je e-mail en wachtwoord in om verder te gaan.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Rechter kolom / Content */}
      <div className="flex-1 lg:flex lg:flex-col lg:justify-center lg:items-center lg:p-12">
        <main className="px-4 pb-8 lg:px-0 lg:w-full lg:max-w-md">
          <div className="max-w-md mx-auto lg:mx-0 lg:max-w-none">
            <div className="ker-card lg:shadow-lg">
            {sessionInvalidated && (
              <div className="bg-amber-50 border-2 border-amber-300 text-amber-800 px-4 py-3 rounded-xl mb-6 text-sm">
                <p className="font-medium">Je bent uitgelogd</p>
                <p className="text-amber-700">Je bent op een ander apparaat ingelogd. Log opnieuw in om door te gaan.</p>
              </div>
            )}

            {fromTest && (
              <div className="bg-primary/10 border-2 border-primary/30 text-foreground px-4 py-3 rounded-xl mb-6 text-sm">
                <p className="font-medium">Je hebt de test afgerond!</p>
                <p className="text-muted-foreground">Log in om je resultaten op te slaan.</p>
              </div>
            )}

            {error && (
              <div className="bg-[#FFEBEE] border-2 border-[#F44336] text-[#C62828] px-4 py-3 rounded-xl mb-6 text-sm">
                <p className="font-medium">Dat lukte niet</p>
                <p>Controleer je e-mail en wachtwoord en probeer het nog eens.</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
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
                  Het adres waarmee je bent aangemeld
                </p>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                  Je wachtwoord
                </label>
                <input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="ker-input"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
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
                  "Inloggen"
                )}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-border">
              <p className="text-center text-muted-foreground mb-4">
                Nog geen account?
              </p>
              <Link
                href="/register"
                className="ker-btn ker-btn-secondary w-full flex items-center justify-center gap-2"
              >
                Account aanmaken
              </Link>
            </div>
            </div>
          </div>

          {/* Terug links */}
          <div className="mt-4 flex justify-center gap-4 text-sm lg:text-base">
            <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
              ← Terug naar home
            </Link>
            <span className="text-muted-foreground">|</span>
            <Link href="/belastbaarheidstest" className="text-muted-foreground hover:text-foreground transition-colors">
              Doe eerst de Balanstest
            </Link>
          </div>
        </main>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
