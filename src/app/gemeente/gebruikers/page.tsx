"use client"

import { useEffect, useState, useCallback } from "react"
import { AdminSpinner, AdminEmptyState } from "@/components/admin"

interface GemeenteGebruiker {
  id: string
  email: string
  name: string | null
  gemeenteRollen: string[]
  isActive: boolean
  createdAt: string
}

interface Uitnodiging {
  id: string
  email: string
  gemeenteRollen: string[]
  createdAt: string
  expiresAt: string
}

const rolLabels: Record<string, string> = {
  COMMUNICATIE: "Communicatie",
  HULPBRONNEN: "Hulpbronnen",
  BELEID: "Beleid",
}

const rolBeschrijvingen: Record<string, string> = {
  COMMUNICATIE: "Content en evenementen",
  HULPBRONNEN: "Hulpbronnen beheren",
  BELEID: "Dashboard, demografie, trends, hulpvragen, signalering en rapportages",
}

export default function GemeenteGebruikersPage() {
  const [gebruikers, setGebruikers] = useState<GemeenteGebruiker[]>([])
  const [uitnodigingen, setUitnodigingen] = useState<Uitnodiging[]>([])
  const [loading, setLoading] = useState(true)
  const [toonUitnodigen, setToonUitnodigen] = useState(false)
  const [formulier, setFormulier] = useState({ email: "", name: "", gemeenteRollen: [] as string[] })
  const [uitnodigenLaden, setUitnodigenLaden] = useState(false)
  const [fout, setFout] = useState("")
  const [succes, setSucces] = useState("")
  const [uitnodigingsUrl, setUitnodigingsUrl] = useState("")

  const laadGebruikers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/gemeente/gebruikers")
      const data = await res.json()
      setGebruikers(data.gebruikers || [])
      setUitnodigingen(data.uitnodigingen || [])
    } catch {
      console.error("Laden mislukt")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    laadGebruikers()
  }, [laadGebruikers])

  const toggleRol = (rol: string) => {
    setFormulier((prev) => ({
      ...prev,
      gemeenteRollen: prev.gemeenteRollen.includes(rol)
        ? prev.gemeenteRollen.filter((r) => r !== rol)
        : [...prev.gemeenteRollen, rol],
    }))
  }

  const handleUitnodigen = async (e: React.FormEvent) => {
    e.preventDefault()
    setUitnodigenLaden(true)
    setFout("")
    setSucces("")
    setUitnodigingsUrl("")

    try {
      const res = await fetch("/api/gemeente/gebruikers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formulier),
      })
      const data = await res.json()

      if (!res.ok) {
        setFout(data.error || "Er ging iets mis")
        return
      }

      setSucces(`Uitnodiging aangemaakt voor ${data.naam}`)
      setUitnodigingsUrl(data.uitnodigingsUrl)
      setFormulier({ email: "", name: "", gemeenteRollen: [] })
      laadGebruikers()
    } catch {
      setFout("Er ging iets mis bij het uitnodigen")
    } finally {
      setUitnodigenLaden(false)
    }
  }

  const kopieerLink = () => {
    navigator.clipboard.writeText(uitnodigingsUrl)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gebruikers</h1>
          <p className="text-gray-500 mt-1">Beheer medewerkers van je gemeente</p>
        </div>
        <button
          onClick={() => { setToonUitnodigen(true); setSucces(""); setUitnodigingsUrl(""); setFout("") }}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700"
        >
          + Medewerker uitnodigen
        </button>
      </div>

      {/* Uitnodiging modal */}
      {toonUitnodigen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg mx-4">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Medewerker uitnodigen</h2>

            {succes && uitnodigingsUrl ? (
              <div className="space-y-4">
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                  <p className="text-sm text-emerald-700 font-medium">{succes}</p>
                  <p className="text-xs text-emerald-600 mt-1">De uitnodiging is 7 dagen geldig.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Uitnodigingslink</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={uitnodigingsUrl}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 text-gray-600"
                    />
                    <button
                      type="button"
                      onClick={kopieerLink}
                      className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                    >
                      Kopieer
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Stuur deze link naar de medewerker. Zij kunnen hiermee een wachtwoord instellen en inloggen.</p>
                </div>
                <button
                  type="button"
                  onClick={() => { setToonUitnodigen(false); setSucces(""); setUitnodigingsUrl("") }}
                  className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200"
                >
                  Sluiten
                </button>
              </div>
            ) : (
              <form onSubmit={handleUitnodigen} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">E-mailadres *</label>
                  <input
                    type="email"
                    required
                    value={formulier.email}
                    onChange={(e) => setFormulier({ ...formulier, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="medewerker@gemeente.nl"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Naam</label>
                  <input
                    type="text"
                    value={formulier.name}
                    onChange={(e) => setFormulier({ ...formulier, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Volledige naam"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Rollen *</label>
                  <div className="space-y-2">
                    {Object.entries(rolLabels).map(([key, label]) => (
                      <label
                        key={key}
                        className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                          formulier.gemeenteRollen.includes(key)
                            ? "border-emerald-300 bg-emerald-50"
                            : "border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={formulier.gemeenteRollen.includes(key)}
                          onChange={() => toggleRol(key)}
                          className="mt-0.5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        <div>
                          <span className="text-sm font-medium text-gray-900">{label}</span>
                          <p className="text-xs text-gray-500 mt-0.5">{rolBeschrijvingen[key]}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
                {fout && (
                  <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{fout}</p>
                )}
                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={uitnodigenLaden || formulier.gemeenteRollen.length === 0}
                    className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {uitnodigenLaden ? "Uitnodigen..." : "Uitnodigen per e-mail"}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setToonUitnodigen(false); setFout("") }}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200"
                  >
                    Annuleren
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Actieve medewerkers */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
          <h2 className="text-sm font-semibold text-gray-700">Actieve medewerkers</h2>
        </div>
        {loading ? (
          <AdminSpinner tekst="Medewerkers laden..." />
        ) : gebruikers.length === 0 ? (
          <AdminEmptyState
            icon="👤"
            titel="Nog geen medewerkers"
            beschrijving="Nodig iemand uit om te beginnen."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Naam / Email</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Rollen</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Aangemaakt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {gebruikers.map((g) => (
                  <tr key={g.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{g.name || "—"}</div>
                      <div className="text-gray-500 text-xs">{g.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {g.gemeenteRollen.map((r) => (
                          <span key={r} className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                            {rolLabels[r] || r}
                          </span>
                        ))}
                        {g.gemeenteRollen.length === 0 && (
                          <span className="text-xs text-gray-400">Admin (alle rechten)</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {g.isActive ? (
                        <span className="text-xs text-emerald-600 font-medium">Actief</span>
                      ) : (
                        <span className="text-xs text-gray-400">Inactief</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {new Date(g.createdAt).toLocaleDateString("nl-NL")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Openstaande uitnodigingen */}
      {uitnodigingen.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 bg-amber-50">
            <h2 className="text-sm font-semibold text-amber-700">Openstaande uitnodigingen</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">E-mail</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Rollen</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Verstuurd</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Verloopt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {uitnodigingen.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-900">{u.email}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {u.gemeenteRollen.map((r) => (
                          <span key={r} className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                            {rolLabels[r] || r}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {new Date(u.createdAt).toLocaleDateString("nl-NL")}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {new Date(u.expiresAt).toLocaleDateString("nl-NL")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
