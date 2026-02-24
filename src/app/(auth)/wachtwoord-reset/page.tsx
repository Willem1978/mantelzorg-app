"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button, Input } from "@/components/ui"

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!token) {
      setError("Deze link werkt niet. Vraag een nieuwe aan.")
    }
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (password !== confirmPassword) {
      setError("De wachtwoorden zijn niet hetzelfde")
      return
    }

    if (password.length < 8) {
      setError("Je wachtwoord moet 8 tekens of meer zijn")
      return
    }

    setIsLoading(true)

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Er ging iets mis. Probeer het later opnieuw.")
      }

      setIsSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Er ging iets mis. Probeer het later opnieuw.")
    } finally {
      setIsLoading(false)
    }
  }

  // Succes scherm - B1 taalgebruik
  if (isSuccess) {
    return (
      <div className="bg-card rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-xl max-w-md w-full text-center">
        <div className="w-14 h-14 sm:w-16 sm:h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
          <svg className="w-7 h-7 sm:w-8 sm:h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
          Gelukt!
        </h1>

        <p className="text-muted-foreground mb-6 text-sm sm:text-base">
          Je hebt een nieuw wachtwoord. Je kan nu inloggen.
        </p>

        <Link href="/login">
          <Button className="w-full" size="lg">
            Naar inloggen
          </Button>
        </Link>
      </div>
    )
  }

  // Formulier - B1 taalgebruik
  return (
    <div className="bg-card rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-xl max-w-md w-full">
      {/* Logo */}
      <div className="flex items-center justify-center gap-2 sm:gap-3 mb-6 sm:mb-8">
        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary rounded-xl flex items-center justify-center">
          <span className="text-primary-foreground font-bold text-xl sm:text-2xl">M</span>
        </div>
        <span className="font-bold text-lg sm:text-xl text-foreground">MantelzorgApp</span>
      </div>

      <h1 className="text-xl sm:text-2xl font-bold text-foreground text-center mb-2">
        Nieuw wachtwoord
      </h1>

      <p className="text-muted-foreground text-center mb-6 text-sm sm:text-base">
        Kies een nieuw wachtwoord.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        <Input
          type="password"
          label="Je nieuwe wachtwoord"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Minstens 8 tekens"
          required
          minLength={8}
          disabled={!token}
        />

        <Input
          type="password"
          label="Typ het nog een keer"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Herhaal je wachtwoord"
          required
          disabled={!token}
        />

        <Button
          type="submit"
          className="w-full"
          size="lg"
          isLoading={isLoading}
          disabled={!token}
        >
          Opslaan
        </Button>
      </form>

      <div className="mt-6 text-center">
        <Link
          href="/wachtwoord-vergeten"
          className="text-sm text-primary hover:underline"
        >
          Nieuwe link aanvragen
        </Link>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-green-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center px-4">
      <Suspense fallback={
        <div className="bg-card rounded-3xl p-8 shadow-xl max-w-md w-full text-center">
          <p className="text-muted-foreground">Laden...</p>
        </div>
      }>
        <ResetPasswordForm />
      </Suspense>
    </div>
  )
}
