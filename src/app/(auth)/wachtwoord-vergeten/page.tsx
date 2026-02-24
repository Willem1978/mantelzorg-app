"use client"

import { useState } from "react"
import Link from "next/link"
import { Button, Input } from "@/components/ui"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Er ging iets mis. Probeer het later opnieuw.")
      }

      setIsSuccess(true)

      // In development, show the reset link
      if (data.resetUrl) {
        console.log("Reset URL:", data.resetUrl)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Er ging iets mis. Probeer het later opnieuw.")
    } finally {
      setIsLoading(false)
    }
  }

  // Succes scherm - B1 taalgebruik
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-light to-green-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center px-4 py-8">
        <div className="bg-card rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-xl max-w-md w-full text-center">
          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
            <svg className="w-7 h-7 sm:w-8 sm:h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
            Kijk in je e-mail
          </h1>

          <p className="text-muted-foreground mb-4 sm:mb-6 text-sm sm:text-base">
            We hebben je een link gestuurd. Klik erop om een nieuw wachtwoord te kiezen.
          </p>

          <p className="text-sm text-muted-foreground mb-4 sm:mb-6 bg-secondary/50 p-3 rounded-xl">
            Geen mail? Kijk bij ongewenste e-mail (spam).
          </p>

          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full"
              size="lg"
              onClick={() => {
                setIsSuccess(false)
                setEmail("")
              }}
            >
              Nog een keer proberen
            </Button>

            <Link href="/login">
              <Button className="w-full" size="lg">
                Naar inloggen
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Formulier - B1 taalgebruik
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-light to-green-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center px-4 py-8">
      <div className="bg-card rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-xl max-w-md w-full">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 sm:gap-3 mb-6 sm:mb-8">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary rounded-xl flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-xl sm:text-2xl">M</span>
          </div>
          <span className="font-bold text-lg sm:text-xl text-foreground">MantelzorgApp</span>
        </div>

        <h1 className="text-xl sm:text-2xl font-bold text-foreground text-center mb-2">
          Wachtwoord vergeten?
        </h1>

        <p className="text-muted-foreground text-center mb-6 text-sm sm:text-base">
          Geen probleem! Vul je e-mail in. Dan sturen we je een link.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          <Input
            type="email"
            label="Je e-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="jouw@email.nl"
            required
          />

          <Button
            type="submit"
            className="w-full"
            size="lg"
            isLoading={isLoading}
          >
            Stuur mij een link
          </Button>
        </form>

        <div className="mt-6 text-center">
          <Link
            href="/login"
            className="text-sm text-primary hover:underline inline-flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Terug naar inloggen
          </Link>
        </div>
      </div>
    </div>
  )
}
