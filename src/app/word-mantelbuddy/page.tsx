"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { searchGemeenten } from "@/lib/pdok"
import { LogoIcon } from "@/components/ui"
import { volunteerContent as c } from "@/config/content"

export default function WordMantelBuddyPage() {
  const router = useRouter()
  const [stap, setStap] = useState(1)
  const [formData, setFormData] = useState({
    voornaam: "",
    achternaam: "",
    email: "",
    telefoon: "",
    postcode: "",
    gemeente: "",
    hulpvormen: [] as string[],
    beschikbaarheid: "",
    motivatie: "",
    ervaring: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [gemeenteQuery, setGemeenteQuery] = useState("")
  const [gemeenteResults, setGemeenteResults] = useState<string[]>([])
  const [showGemeenteResults, setShowGemeenteResults] = useState(false)
  const [isSearchingGemeente, setIsSearchingGemeente] = useState(false)

  const handleGemeenteSearch = async (query: string) => {
    setGemeenteQuery(query)
    if (query.length < 2) {
      setGemeenteResults([])
      setShowGemeenteResults(false)
      return
    }
    setIsSearchingGemeente(true)
    try {
      const results = await searchGemeenten(query)
      setGemeenteResults(results)
      setShowGemeenteResults(true)
    } catch {
      setGemeenteResults([])
    } finally {
      setIsSearchingGemeente(false)
    }
  }

  const handleGemeenteSelect = (gemeente: string) => {
    setFormData(prev => ({ ...prev, gemeente }))
    setGemeenteQuery("")
    setShowGemeenteResults(false)
  }

  const handleGemeenteClear = () => {
    setFormData(prev => ({ ...prev, gemeente: "" }))
    setGemeenteQuery("")
  }

  const toggleHulpvorm = (id: string) => {
    setFormData(prev => ({
      ...prev,
      hulpvormen: prev.hulpvormen.includes(id)
        ? prev.hulpvormen.filter(h => h !== id)
        : [...prev.hulpvormen, id]
    }))
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      const response = await fetch("/api/mantelbuddy/aanmelden", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setStap(4) // Bedankt pagina
      }
    } catch (error) {
      console.error("Error:", error)
    }
    setIsSubmitting(false)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="px-4 py-4 border-b border-border">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <LogoIcon size={40} />
            <span className="font-bold text-foreground text-xl">MantelBuddy</span>
          </Link>
          {stap < 4 && (
            <div className="text-sm text-muted-foreground">
              {c.progress(stap)}
            </div>
          )}
        </div>
      </header>

      <main className="px-4 py-8">
        <div className="max-w-2xl mx-auto">

          {/* STAP 1: Intro en gegevens */}
          {stap === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <div className="w-20 h-20 mx-auto mb-4 bg-[var(--accent-green-bg)] rounded-full flex items-center justify-center">
                  <span className="text-4xl">🤝</span>
                </div>
                <h1 className="text-2xl font-bold text-foreground mb-2">
                  {c.stap1.title}
                </h1>
                <p className="text-muted-foreground">
                  {c.stap1.subtitle}
                </p>
              </div>

              <div className="ker-card">
                <h2 className="font-bold text-foreground mb-4">{c.stap1.gegevensTitle}</h2>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">{c.stap1.labels.voornaam}</label>
                      <input
                        type="text"
                        value={formData.voornaam}
                        onChange={e => setFormData({...formData, voornaam: e.target.value})}
                        className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground"
                        placeholder={c.stap1.placeholders.voornaam}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">{c.stap1.labels.achternaam}</label>
                      <input
                        type="text"
                        value={formData.achternaam}
                        onChange={e => setFormData({...formData, achternaam: e.target.value})}
                        className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground"
                        placeholder={c.stap1.placeholders.achternaam}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">{c.stap1.labels.email}</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground"
                      placeholder={c.stap1.placeholders.email}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">{c.stap1.labels.telefoon}</label>
                    <input
                      type="tel"
                      value={formData.telefoon}
                      onChange={e => setFormData({...formData, telefoon: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground"
                      placeholder={c.stap1.placeholders.telefoon}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">{c.stap1.labels.postcode}</label>
                    <input
                      type="text"
                      value={formData.postcode}
                      onChange={e => setFormData({...formData, postcode: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground"
                      placeholder={c.stap1.placeholders.postcode}
                    />
                  </div>

                  <div className="relative">
                    <label className="block text-sm font-medium text-foreground mb-1">{c.stap1.labels.gemeente}</label>
                    {formData.gemeente ? (
                      <div className="px-4 py-3 bg-[var(--accent-green-bg)] rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span>📍</span>
                          <span className="font-medium text-foreground">{formData.gemeente}</span>
                        </div>
                        <button
                          type="button"
                          onClick={handleGemeenteClear}
                          className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <div className="relative">
                        <input
                          type="text"
                          value={gemeenteQuery}
                          onChange={e => handleGemeenteSearch(e.target.value)}
                          onFocus={() => gemeenteQuery.length >= 2 && setShowGemeenteResults(true)}
                          className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground"
                          placeholder={c.stap1.placeholders.gemeente}
                          autoComplete="off"
                        />
                        {isSearchingGemeente && (
                          <div className="absolute right-4 top-1/2 -translate-y-1/2">
                            <div className="w-5 h-5 border-2 border-[var(--accent-green)] border-t-transparent rounded-full animate-spin" />
                          </div>
                        )}
                      </div>
                    )}
                    {showGemeenteResults && gemeenteResults.length > 0 && (
                      <div className="absolute z-20 w-full mt-1 bg-card border border-border rounded-xl shadow-lg max-h-52 overflow-auto">
                        {gemeenteResults.map((gemeente) => (
                          <button
                            key={gemeente}
                            type="button"
                            onClick={() => handleGemeenteSelect(gemeente)}
                            className="w-full text-left px-4 py-3 hover:bg-muted transition-colors border-b border-border last:border-b-0"
                          >
                            <span className="mr-2">📍</span>
                            {gemeente}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setStap(2)}
                disabled={!formData.voornaam || !formData.email || !formData.telefoon || !formData.postcode || !formData.gemeente}
                className="ker-btn ker-btn-primary w-full disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ backgroundColor: "var(--accent-green)" }}
              >
                {c.stap1.volgende}
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}

          {/* STAP 2: Wat wil je doen */}
          {stap === 2 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-foreground mb-2">
                  {c.stap2.title}
                </h1>
                <p className="text-muted-foreground">
                  {c.stap2.subtitle}
                </p>
              </div>

              <div className="ker-card">
                <h2 className="font-bold text-foreground mb-4">{c.stap2.hulpTitle}</h2>

                <div className="grid grid-cols-2 gap-3">
                  {c.hulpOpties.map(optie => (
                    <button
                      key={optie.id}
                      onClick={() => toggleHulpvorm(optie.id)}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        formData.hulpvormen.includes(optie.id)
                          ? "border-[var(--accent-green)] bg-[var(--accent-green-bg)]"
                          : "border-border hover:border-[var(--accent-green)]/50"
                      }`}
                    >
                      <div className="text-2xl mb-2">{optie.icon}</div>
                      <div className="font-medium text-foreground text-sm">{optie.label}</div>
                      <div className="text-xs text-muted-foreground">{optie.beschrijving}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="ker-card">
                <h2 className="font-bold text-foreground mb-4">{c.stap2.beschikbaarheidTitle}</h2>

                <div className="space-y-3">
                  {c.beschikbaarheidOpties.map(optie => (
                    <button
                      key={optie.id}
                      onClick={() => setFormData({...formData, beschikbaarheid: optie.id})}
                      className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                        formData.beschikbaarheid === optie.id
                          ? "border-[var(--accent-green)] bg-[var(--accent-green-bg)]"
                          : "border-border hover:border-[var(--accent-green)]/50"
                      }`}
                    >
                      <div className="font-medium text-foreground">{optie.label}</div>
                      <div className="text-sm text-muted-foreground">{optie.beschrijving}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setStap(1)}
                  className="ker-btn ker-btn-secondary flex-1"
                >
                  {c.stap2.terug}
                </button>
                <button
                  onClick={() => setStap(3)}
                  disabled={formData.hulpvormen.length === 0 || !formData.beschikbaarheid}
                  className="ker-btn flex-1 disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ backgroundColor: "var(--accent-green)", color: "white" }}
                >
                  {c.stap2.volgende}
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* STAP 3: Motivatie */}
          {stap === 3 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-foreground mb-2">
                  {c.stap3.title}
                </h1>
                <p className="text-muted-foreground">
                  {c.stap3.subtitle}
                </p>
              </div>

              <div className="ker-card">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      {c.stap3.motivatieLabel}
                    </label>
                    <textarea
                      value={formData.motivatie}
                      onChange={e => setFormData({...formData, motivatie: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground min-h-[100px]"
                      placeholder={c.stap3.motivatiePlaceholder}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      {c.stap3.ervaringLabel}
                    </label>
                    <textarea
                      value={formData.ervaring}
                      onChange={e => setFormData({...formData, ervaring: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground min-h-[80px]"
                      placeholder={c.stap3.ervaringPlaceholder}
                    />
                  </div>
                </div>
              </div>

              <div className="ker-card bg-[var(--accent-green-bg)]">
                <h3 className="font-bold text-foreground mb-2">{c.stap3.naAanmelding.title}</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {c.stap3.naAanmelding.stappen.map((stap, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-[var(--accent-green)]">✓</span>
                      {stap}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setStap(2)}
                  className="ker-btn ker-btn-secondary flex-1"
                >
                  {c.stap3.terug}
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !formData.motivatie}
                  className="ker-btn flex-1 disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ backgroundColor: "var(--accent-green)", color: "white" }}
                >
                  {isSubmitting ? c.stap3.bezig : c.stap3.aanmelden}
                  {!isSubmitting && (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STAP 4: Bedankt */}
          {stap === 4 && (
            <div className="text-center py-12">
              <div className="w-24 h-24 mx-auto mb-6 bg-[var(--accent-green-bg)] rounded-full flex items-center justify-center">
                <span className="text-5xl">🎉</span>
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-4">
                {c.stap4.title}
              </h1>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                {c.stap4.subtitle}
              </p>

              <div className="ker-card bg-[var(--accent-green-bg)] text-left max-w-md mx-auto mb-8">
                <h3 className="font-bold text-foreground mb-3">{c.stap4.volgendeStappen.title}</h3>
                <ol className="space-y-2 text-sm">
                  {c.stap4.volgendeStappen.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="w-6 h-6 bg-[var(--accent-green)] text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">{i + 1}</span>
                      <span className="text-foreground">{item}</span>
                    </li>
                  ))}
                </ol>
              </div>

              <Link href="/" className="ker-btn ker-btn-secondary">
                {c.stap4.terugNaarHome}
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
