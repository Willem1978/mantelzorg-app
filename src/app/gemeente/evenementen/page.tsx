"use client"

import { useEffect, useState } from "react"

interface Evenement {
  id: string
  titel: string
  beschrijving: string
  inhoud: string | null
  url: string | null
  emoji: string | null
  status: string
  publicatieDatum: string | null
  createdAt: string
}

interface EvenementenData {
  gemeenteNaam: string
  evenementen: Evenement[]
}

export default function GemeenteEvenementen() {
  const [data, setData] = useState<EvenementenData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [titel, setTitel] = useState("")
  const [beschrijving, setBeschrijving] = useState("")
  const [datum, setDatum] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const fetchEvenementen = () => {
    fetch("/api/gemeente/evenementen")
      .then((res) => {
        if (!res.ok) throw new Error("Kon evenementen niet ophalen")
        return res.json()
      })
      .then((data: EvenementenData) => {
        setData(data)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchEvenementen()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError(null)
    setSubmitSuccess(false)

    if (!titel.trim() || !beschrijving.trim()) {
      setSubmitError("Vul titel en beschrijving in.")
      return
    }

    if (!datum) {
      setSubmitError("Kies een datum voor het evenement.")
      return
    }

    setSubmitting(true)

    try {
      const res = await fetch("/api/gemeente/evenementen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titel: titel.trim(),
          beschrijving: beschrijving.trim(),
          publicatieDatum: datum,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Kon evenement niet aanmaken")
      }

      setTitel("")
      setBeschrijving("")
      setDatum("")
      setSubmitSuccess(true)

      // Refresh list
      setLoading(true)
      fetchEvenementen()

      setTimeout(() => setSubmitSuccess(false), 3000)
    } catch (err: any) {
      setSubmitError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-"
    try {
      return new Date(dateStr).toLocaleDateString("nl-NL", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    } catch {
      return dateStr
    }
  }

  const isUpcoming = (dateStr: string | null) => {
    if (!dateStr) return false
    return new Date(dateStr) >= new Date(new Date().toDateString())
  }

  const upcomingEvenementen = data?.evenementen.filter((e) => isUpcoming(e.publicatieDatum)) || []
  const pastEvenementen = data?.evenementen.filter((e) => !isUpcoming(e.publicatieDatum)) || []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Evenementen</h1>
        <p className="text-gray-500 mt-1">Beheer evenementen voor mantelzorgers in uw gemeente</p>
      </div>

      {/* Nieuw evenement form */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Nieuw evenement aanmaken</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="titel" className="block text-sm font-medium text-gray-700 mb-1">
                Titel
              </label>
              <input
                id="titel"
                type="text"
                value={titel}
                onChange={(e) => setTitel(e.target.value)}
                placeholder="Naam van het evenement"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-colors"
                disabled={submitting}
              />
            </div>

            <div>
              <label htmlFor="datum" className="block text-sm font-medium text-gray-700 mb-1">
                Datum
              </label>
              <input
                id="datum"
                type="date"
                value={datum}
                onChange={(e) => setDatum(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-colors"
                disabled={submitting}
              />
            </div>
          </div>

          <div>
            <label htmlFor="beschrijving" className="block text-sm font-medium text-gray-700 mb-1">
              Beschrijving
            </label>
            <textarea
              id="beschrijving"
              value={beschrijving}
              onChange={(e) => setBeschrijving(e.target.value)}
              placeholder="Beschrijving van het evenement"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-colors resize-vertical"
              disabled={submitting}
            />
          </div>

          {submitError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-700 text-sm">{submitError}</p>
            </div>
          )}

          {submitSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-green-700 text-sm">Evenement succesvol aangemaakt!</p>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Aanmaken...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Evenement aanmaken
              </>
            )}
          </button>
        </form>
      </div>

      {/* Loading / Error state */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
            <span className="text-gray-500 text-sm">Evenementen laden...</span>
          </div>
        </div>
      ) : error ? (
        <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      ) : (
        <>
          {/* Aankomende evenementen */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Aankomende evenementen</h2>
                <p className="text-sm text-gray-500">
                  {upcomingEvenementen.length} evenement{upcomingEvenementen.length !== 1 ? "en" : ""}
                </p>
              </div>
            </div>

            {upcomingEvenementen.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-gray-500">Geen aankomende evenementen.</p>
                <p className="text-gray-400 text-sm mt-1">Maak hierboven een nieuw evenement aan.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {upcomingEvenementen.map((evenement) => (
                  <div
                    key={evenement.id}
                    className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <span className="text-sm font-medium text-emerald-600">
                        {formatDate(evenement.publicatieDatum)}
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-900">{evenement.titel}</h3>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-3">{evenement.beschrijving}</p>
                    <div className="mt-3">
                      <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        Gepland
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Afgelopen evenementen */}
          {pastEvenementen.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Afgelopen evenementen</h2>
                  <p className="text-sm text-gray-500">
                    {pastEvenementen.length} evenement{pastEvenementen.length !== 1 ? "en" : ""}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pastEvenementen.map((evenement) => (
                  <div
                    key={evenement.id}
                    className="bg-white rounded-xl border border-gray-200 p-5 opacity-75"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <span className="text-sm font-medium text-gray-500">
                        {formatDate(evenement.publicatieDatum)}
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-700">{evenement.titel}</h3>
                    <p className="text-sm text-gray-400 mt-1 line-clamp-3">{evenement.beschrijving}</p>
                    <div className="mt-3">
                      <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                        Afgelopen
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
