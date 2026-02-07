"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

const hulpOpties = [
  { id: "gesprek", label: "Gesprek / luisterend oor", icon: "☕", beschrijving: "Even bijpraten, koffiedrinken" },
  { id: "boodschappen", label: "Boodschappen doen", icon: "🛒", beschrijving: "Supermarkt, apotheek" },
  { id: "vervoer", label: "Vervoer", icon: "🚗", beschrijving: "Naar afspraken of uitjes" },
  { id: "klusjes", label: "Klusjes in huis", icon: "🔧", beschrijving: "Kleine reparaties, tuin" },
  { id: "oppas", label: "Oppas/gezelschap", icon: "🏠", beschrijving: "Bij de zorgvrager zijn" },
  { id: "administratie", label: "Administratie", icon: "📋", beschrijving: "Papierwerk, formulieren" },
]

const beschikbaarheidOpties = [
  { id: "eenmalig", label: "Eenmalige taken", beschrijving: "Af en toe een taak oppakken wanneer het jou uitkomt" },
  { id: "vast", label: "Vast maatje worden", beschrijving: "Regelmatig taken voor de zorgvrager oppakken en uitvoeren" },
  { id: "beide", label: "Beide", beschrijving: "Flexibel inzetbaar - zowel eenmalig als vast" },
]

export default function WordMantelBuddyPage() {
  const router = useRouter()
  const [stap, setStap] = useState(1)
  const [formData, setFormData] = useState({
    voornaam: "",
    achternaam: "",
    email: "",
    telefoon: "",
    postcode: "",
    woonplaats: "",
    hulpvormen: [] as string[],
    beschikbaarheid: "",
    motivatie: "",
    ervaring: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

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
            <div className="w-10 h-10 bg-[var(--accent-green)] rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">M</span>
            </div>
            <span className="font-bold text-foreground text-xl">MantelBuddy</span>
          </Link>
          {stap < 4 && (
            <div className="text-sm text-muted-foreground">
              Stap {stap} van 3
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
                  Word MantelBuddy
                </h1>
                <p className="text-muted-foreground">
                  Help mantelzorgers in je buurt. Eenmalig of als vast maatje - jij kiest hoe je wilt helpen!
                </p>
              </div>

              <div className="ker-card">
                <h2 className="font-bold text-foreground mb-4">Jouw gegevens</h2>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Voornaam *</label>
                      <input
                        type="text"
                        value={formData.voornaam}
                        onChange={e => setFormData({...formData, voornaam: e.target.value})}
                        className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground"
                        placeholder="Jan"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Achternaam *</label>
                      <input
                        type="text"
                        value={formData.achternaam}
                        onChange={e => setFormData({...formData, achternaam: e.target.value})}
                        className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground"
                        placeholder="Jansen"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">E-mailadres *</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground"
                      placeholder="jan@voorbeeld.nl"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Telefoonnummer *</label>
                    <input
                      type="tel"
                      value={formData.telefoon}
                      onChange={e => setFormData({...formData, telefoon: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground"
                      placeholder="06-12345678"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Postcode *</label>
                      <input
                        type="text"
                        value={formData.postcode}
                        onChange={e => setFormData({...formData, postcode: e.target.value})}
                        className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground"
                        placeholder="1234 AB"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Woonplaats *</label>
                      <input
                        type="text"
                        value={formData.woonplaats}
                        onChange={e => setFormData({...formData, woonplaats: e.target.value})}
                        className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground"
                        placeholder="Amsterdam"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setStap(2)}
                disabled={!formData.voornaam || !formData.email || !formData.telefoon || !formData.postcode}
                className="ker-btn ker-btn-primary w-full disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ backgroundColor: "var(--accent-green)" }}
              >
                Volgende
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
                  Wat wil je doen?
                </h1>
                <p className="text-muted-foreground">
                  Selecteer de manieren waarop je wilt helpen
                </p>
              </div>

              <div className="ker-card">
                <h2 className="font-bold text-foreground mb-4">Ik wil helpen met:</h2>

                <div className="grid grid-cols-2 gap-3">
                  {hulpOpties.map(optie => (
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
                <h2 className="font-bold text-foreground mb-4">Beschikbaarheid</h2>

                <div className="space-y-3">
                  {beschikbaarheidOpties.map(optie => (
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
                  Terug
                </button>
                <button
                  onClick={() => setStap(3)}
                  disabled={formData.hulpvormen.length === 0 || !formData.beschikbaarheid}
                  className="ker-btn flex-1 disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ backgroundColor: "var(--accent-green)", color: "white" }}
                >
                  Volgende
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
                  Vertel iets over jezelf
                </h1>
                <p className="text-muted-foreground">
                  Dit helpt bij het matchen met de juiste mantelzorger
                </p>
              </div>

              <div className="ker-card">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Waarom wil je MantelBuddy worden?
                    </label>
                    <textarea
                      value={formData.motivatie}
                      onChange={e => setFormData({...formData, motivatie: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground min-h-[100px]"
                      placeholder="Vertel waarom je mantelzorgers wilt helpen..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Heb je ervaring met mantelzorg of vrijwilligerswerk? (optioneel)
                    </label>
                    <textarea
                      value={formData.ervaring}
                      onChange={e => setFormData({...formData, ervaring: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground min-h-[80px]"
                      placeholder="Bijv. zelf mantelzorger geweest, vrijwilligerswerk gedaan..."
                    />
                  </div>
                </div>
              </div>

              <div className="ker-card bg-[var(--accent-green-bg)]">
                <h3 className="font-bold text-foreground mb-2">Wat gebeurt er na aanmelding?</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--accent-green)]">✓</span>
                    Je ontvangt een bevestigingsmail
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--accent-green)]">✓</span>
                    We nemen contact op voor een kennismakingsgesprek
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--accent-green)]">✓</span>
                    Na goedkeuring word je gekoppeld aan mantelzorgers in je buurt
                  </li>
                </ul>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setStap(2)}
                  className="ker-btn ker-btn-secondary flex-1"
                >
                  Terug
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !formData.motivatie}
                  className="ker-btn flex-1 disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ backgroundColor: "var(--accent-green)", color: "white" }}
                >
                  {isSubmitting ? "Bezig..." : "Aanmelden"}
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
                Bedankt voor je aanmelding!
              </h1>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                We hebben je aanmelding ontvangen. Je ontvangt binnenkort een e-mail
                met meer informatie over de volgende stappen.
              </p>

              <div className="ker-card bg-[var(--accent-green-bg)] text-left max-w-md mx-auto mb-8">
                <h3 className="font-bold text-foreground mb-3">Volgende stappen:</h3>
                <ol className="space-y-2 text-sm">
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-[var(--accent-green)] text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
                    <span className="text-foreground">Je ontvangt een bevestigingsmail</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-[var(--accent-green)] text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
                    <span className="text-foreground">Kennismakingsgesprek (telefonisch of video)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-[var(--accent-green)] text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
                    <span className="text-foreground">VOG-aanvraag en korte training</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-[var(--accent-green)] text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">4</span>
                    <span className="text-foreground">Start als MantelBuddy!</span>
                  </li>
                </ol>
              </div>

              <Link href="/" className="ker-btn ker-btn-secondary">
                Terug naar home
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
