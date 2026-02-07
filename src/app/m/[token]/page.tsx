"use client"

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { GerAvatar } from '@/components/GerAvatar'

/**
 * Korte magic link pagina: /m/[token]
 * Verifieert token en logt gebruiker automatisch in
 */
export default function MagicLinkPage() {
  const router = useRouter()
  const params = useParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [error, setError] = useState('')

  useEffect(() => {
    async function verifyAndLogin() {
      try {
        const token = params.token as string

        if (!token) {
          setStatus('error')
          setError('Geen token gevonden')
          return
        }

        // Verifieer token via API
        const response = await fetch(`/api/auth/verify-magic-link`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        })

        const data = await response.json()

        if (!response.ok) {
          setStatus('error')
          setError(data.error || 'Link is ongeldig of verlopen')
          return
        }

        // Token is geldig - log in met de credentials die de API teruggeeft
        const result = await signIn('credentials', {
          email: data.email,
          password: data.tempPassword, // Tijdelijk wachtwoord voor deze sessie
          redirect: false,
        })

        if (result?.error) {
          setStatus('error')
          setError('Inloggen mislukt')
          return
        }

        setStatus('success')

        // Redirect naar dashboard na korte delay
        setTimeout(() => {
          router.push('/dashboard')
        }, 1000)

      } catch (err) {
        console.error('Magic link error:', err)
        setStatus('error')
        setError('Er ging iets mis')
      }
    }

    verifyAndLogin()
  }, [params.token, router])

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="ker-card text-center">
          <div className="mb-6 flex justify-center">
            <GerAvatar size="lg" />
          </div>

          {status === 'loading' && (
            <>
              <h1 className="text-xl font-bold text-foreground mb-2">Even geduld...</h1>
              <p className="text-muted-foreground mb-6">Je wordt automatisch ingelogd.</p>
              <div className="flex justify-center">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-foreground mb-2">Gelukt!</h1>
              <p className="text-muted-foreground">Je gaat naar je dashboard...</p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-foreground mb-2">Oeps!</h1>
              <p className="text-muted-foreground mb-4">{error}</p>
              <button
                onClick={() => router.push('/login')}
                className="ker-btn ker-btn-primary w-full"
              >
                Naar inloggen
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
