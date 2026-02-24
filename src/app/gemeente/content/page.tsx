"use client"

import { useEffect, useState } from "react"

interface Article {
  id: string
  titel: string
  beschrijving: string
  status: string
  publicatieDatum: string | null
  createdAt: string
}

interface ContentData {
  artikelen: Article[]
}

const statusLabels: Record<string, string> = {
  CONCEPT: "Concept",
  GEPUBLICEERD: "Gepubliceerd",
  GEARCHIVEERD: "Gearchiveerd",
}

const statusColors: Record<string, string> = {
  CONCEPT: "bg-amber-100 text-amber-700",
  GEPUBLICEERD: "bg-green-100 text-green-700",
  GEARCHIVEERD: "bg-gray-100 text-gray-600",
}

export default function GemeenteContent() {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [titel, setTitel] = useState("")
  const [beschrijving, setBeschrijving] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const fetchArticles = () => {
    fetch("/api/gemeente/content")
      .then((res) => {
        if (!res.ok) throw new Error("Kon artikelen niet ophalen")
        return res.json()
      })
      .then((data: ContentData) => {
        setArticles(data.artikelen || [])
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchArticles()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError(null)
    setSubmitSuccess(false)

    if (!titel.trim() || !beschrijving.trim()) {
      setSubmitError("Vul beide velden in.")
      return
    }

    setSubmitting(true)

    try {
      const res = await fetch("/api/gemeente/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titel: titel.trim(), beschrijving: beschrijving.trim() }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Kon artikel niet aanmaken")
      }

      setTitel("")
      setBeschrijving("")
      setSubmitSuccess(true)

      // Refresh articles list
      setLoading(true)
      fetchArticles()

      // Clear success message after 3 seconds
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
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    } catch {
      return dateStr
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Content</h1>
        <p className="text-gray-500 mt-1">Beheer artikelen en informatiecontent voor je gemeente</p>
      </div>

      {/* Nieuw artikel form */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Nieuw artikel aanmaken</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="titel" className="block text-sm font-medium text-gray-700 mb-1">
              Titel
            </label>
            <input
              id="titel"
              type="text"
              value={titel}
              onChange={(e) => setTitel(e.target.value)}
              placeholder="Titel van het artikel"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-colors"
              disabled={submitting}
            />
          </div>

          <div>
            <label htmlFor="beschrijving" className="block text-sm font-medium text-gray-700 mb-1">
              Beschrijving
            </label>
            <textarea
              id="beschrijving"
              value={beschrijving}
              onChange={(e) => setBeschrijving(e.target.value)}
              placeholder="Beschrijving of inhoud van het artikel"
              rows={4}
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
              <p className="text-green-700 text-sm">Artikel succesvol aangemaakt!</p>
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
                Artikel aanmaken
              </>
            )}
          </button>
        </form>
      </div>

      {/* Artikelen lijst */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Artikelen</h2>
          <p className="text-sm text-gray-500 mt-0.5">{articles.length} artikel{articles.length !== 1 ? "en" : ""}</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
              <span className="text-gray-500 text-sm">Artikelen laden...</span>
            </div>
          </div>
        ) : error ? (
          <div className="p-6 text-center">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        ) : articles.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-gray-500">Nog geen artikelen aangemaakt.</p>
            <p className="text-gray-400 text-sm mt-1">Gebruik het formulier hierboven om je eerste artikel aan te maken.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {articles.map((article) => (
              <div key={article.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium text-gray-900 truncate">{article.titel}</h3>
                    <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{article.beschrijving}</p>
                  </div>
                  <div className="flex-shrink-0 flex flex-col items-end gap-1">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[article.status] || "bg-gray-100 text-gray-600"}`}>
                      {statusLabels[article.status] || article.status}
                    </span>
                    <span className="text-xs text-gray-400">
                      {article.publicatieDatum
                        ? `Gepubliceerd: ${formatDate(article.publicatieDatum)}`
                        : `Aangemaakt: ${formatDate(article.createdAt)}`}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
