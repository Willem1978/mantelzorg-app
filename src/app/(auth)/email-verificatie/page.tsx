"use client"

import { useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button, Input } from "@/components/ui"

function EmailVerificationContent() {
  const searchParams = useSearchParams()
  const success = searchParams.get("success")
  const error = searchParams.get("error")

  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")

  // B1 taalgebruik - simpele foutmeldingen
  const errorMessages: Record<string, string> = {
    missing_token: "De link is niet goed.",
    invalid_token: "Deze link werkt niet.",
    expired_token: "Deze link is te oud.",
    user_not_found: "We kennen dit e-mailadres niet.",
    server_error: "Er ging iets mis. Probeer het later.",
  }

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage("")

    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()
      setMessage(data.message || "Link verstuurd!")

      // In development, log the URL
      if (data.verifyUrl) {
        console.log("Verification URL:", data.verifyUrl)
      }
    } catch {
      setMessage("Er ging iets mis. Probeer het later opnieuw.")
    } finally {
      setIsLoading(false)
    }
  }

  // Succes scherm - B1 taalgebruik
  if (success === "true") {
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
          Je e-mail is bevestigd. Je kunt nu inloggen.
        </p>

        <div className="space-y-3">
          <Link href="/login">
            <Button className="w-full" size="lg">
              Inloggen
            </Button>
          </Link>
        </div>
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

      {error ? (
        <>
          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
            <svg className="w-7 h-7 sm:w-8 sm:h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold text-foreground text-center mb-2">
            Dat lukte niet
          </h1>

          <p className="text-muted-foreground text-center mb-6 text-sm sm:text-base">
            {errorMessages[error] || "Er ging iets mis."}
          </p>

          <form onSubmit={handleResend} className="space-y-4">
            <p className="text-sm text-muted-foreground text-center bg-secondary/50 p-3 rounded-xl">
              Vul je e-mail in voor een nieuwe link.
            </p>

            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jouw@email.nl"
              required
            />

            {message && (
              <p className="text-sm text-green-600 dark:text-green-400 text-center">
                {message}
              </p>
            )}

            <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
              Stuur nieuwe link
            </Button>
          </form>
        </>
      ) : (
        <>
          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
            <svg className="w-7 h-7 sm:w-8 sm:h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold text-foreground text-center mb-2">
            Kijk in je e-mail
          </h1>

          <p className="text-muted-foreground text-center mb-6 text-sm sm:text-base">
            We hebben je een link gestuurd. Klik erop om je account te starten.
          </p>

          <form onSubmit={handleResend} className="space-y-4">
            <p className="text-sm text-muted-foreground text-center bg-secondary/50 p-3 rounded-xl">
              Geen mail gekregen? Vul je e-mail in voor een nieuwe link.
            </p>

            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jouw@email.nl"
              required
            />

            {message && (
              <p className="text-sm text-green-600 dark:text-green-400 text-center">
                {message}
              </p>
            )}

            <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
              Stuur nieuwe link
            </Button>
          </form>
        </>
      )}

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
  )
}

export default function EmailVerificationPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-green-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center px-4 py-8">
      <Suspense fallback={
        <div className="bg-card rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-xl max-w-md w-full text-center">
          <p className="text-muted-foreground">Even laden...</p>
        </div>
      }>
        <EmailVerificationContent />
      </Suspense>
    </div>
  )
}
