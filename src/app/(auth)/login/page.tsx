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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      })

      if (result?.error) {
        throw new Error("Ongeldige inloggegevens")
      }

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
            <h1 className="text-2xl font-bold text-foreground">Welkom terug!</h1>
            <p className="text-muted-foreground mt-1">
              Log in om verder te gaan met je MantelzorgApp.
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="px-4 pb-8">
        <div className="max-w-md mx-auto">
          <div className="ker-card">
            {fromTest && (
              <div className="bg-primary/10 border-2 border-primary/30 text-foreground px-4 py-3 rounded-xl mb-6 text-sm">
                <p className="font-medium">Je hebt de test afgerond!</p>
                <p className="text-muted-foreground">Log in om je resultaten op te slaan.</p>
              </div>
            )}

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
                  "Inloggen"
                )}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-border text-center">
              <p className="text-muted-foreground">
                Nog geen account?{" "}
                <Link href="/register" className="text-primary font-medium hover:underline">
                  Registreer hier
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
