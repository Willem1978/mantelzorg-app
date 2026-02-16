"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"

const rolLabels: Record<string, string> = {
  COMMUNICATIE: "Communicatie",
  HULPBRONNEN: "Hulpbronnen",
  BELEID: "Beleid",
}

export default function UitnodigingPage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [invite, setInvite] = useState<{ email: string; gemeenteNaam: string; gemeenteRollen: string[] } | null>(null)
  const [name, setName] = useState("")
  const [password, setPassword] = useState("")
  const [passwordBevestig, setPasswordBevestig] = useState("")
  const [submitLaden, setSubmitLaden] = useState(false)
  const [submitFout, setSubmitFout] = useState("")
  const [succes, setSucces] = useState(false)

  useEffect(() => {
    async function laadInvite() {
      try {
        const res = await fetch(`/api/auth/invite?token=${token}`)
        const data = await res.json()

        if (!res.ok) {
          setError(data.error || "Ongeldige uitnodiging")
          return
        }

        setInvite(data)
      } catch {
        setError("Er ging iets mis bij het laden van de uitnodiging")
      } finally {
        setLoading(false)
      }
    }
    laadInvite()
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitFout("")

    if (password !== passwordBevestig) {
      setSubmitFout("Wachtwoorden komen niet overeen")
      return
    }

    if (password.length < 8) {
      setSubmitFout("Wachtwoord moet minimaal 8 tekens bevatten")
      return
    }

    setSubmitLaden(true)

    try {
      const res = await fetch("/api/auth/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, name, password }),
      })
      const data = await res.json()

      if (!res.ok) {
        setSubmitFout(data.error || "Er ging iets mis")
        return
      }

      setSucces(true)
    } catch {
      setSubmitFout("Er ging iets mis bij het aanmaken van je account")
    } finally {
      setSubmitLaden(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Uitnodiging laden...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl p-8 max-w-md w-full text-center shadow-sm border border-gray-200">
          <div className="text-4xl mb-4">!</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Uitnodiging ongeldig</h1>
          <p className="text-gray-500">{error}</p>
          <a href="/gemeente/login" className="inline-block mt-4 text-sm text-emerald-600 hover:text-emerald-700 font-medium">
            Naar inlogpagina
          </a>
        </div>
      </div>
    )
  }

  if (succes) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl p-8 max-w-md w-full text-center shadow-sm border border-gray-200">
          <div className="text-4xl mb-4">&#10003;</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Account aangemaakt!</h1>
          <p className="text-gray-500 mb-4">Je account voor gemeente {invite?.gemeenteNaam} is succesvol aangemaakt. Je kunt nu inloggen.</p>
          <button
            onClick={() => router.push("/gemeente/login")}
            className="px-6 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700"
          >
            Naar inlogpagina
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl p-8 max-w-md w-full shadow-sm border border-gray-200">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-emerald-600 rounded-lg flex items-center justify-center mx-auto mb-3">
            <span className="text-white font-bold text-xl">M</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900">Welkom bij MantelBuddy</h1>
          <p className="text-gray-500 text-sm mt-1">
            Je bent uitgenodigd als medewerker van gemeente <strong>{invite?.gemeenteNaam}</strong>
          </p>
        </div>

        <div className="mb-6">
          <p className="text-xs text-gray-500 mb-2">Je rollen:</p>
          <div className="flex flex-wrap gap-1">
            {invite?.gemeenteRollen.map((r) => (
              <span key={r} className="text-xs font-medium px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">
                {rolLabels[r] || r}
              </span>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-mailadres</label>
            <input
              type="email"
              readOnly
              value={invite?.email || ""}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Je naam</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Volledige naam"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Wachtwoord *</label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Minimaal 8 tekens"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Wachtwoord bevestigen *</label>
            <input
              type="password"
              required
              minLength={8}
              value={passwordBevestig}
              onChange={(e) => setPasswordBevestig(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Herhaal wachtwoord"
            />
          </div>
          {submitFout && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{submitFout}</p>
          )}
          <button
            type="submit"
            disabled={submitLaden}
            className="w-full px-4 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
          >
            {submitLaden ? "Account aanmaken..." : "Account aanmaken"}
          </button>
        </form>
      </div>
    </div>
  )
}
