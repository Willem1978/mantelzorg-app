"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

// ── Types ──────────────────────────────────────────────────────────

type Stap = 1 | 2 | 3 | 4 | 5 | 6 | 7

interface Hiaat {
  categorie: string
  ontbreekt: string[]
  prioriteit: number
}

interface VoorgestelOnderwerp {
  titel: string
  beschrijving: string
  tags: string[]
  reden: string
}

// ── Categorieën ────────────────────────────────────────────────────

const CATEGORIEEN = [
  { slug: "praktische-tips", label: "Praktische tips", emoji: "🔧" },
  { slug: "zelfzorg-balans", label: "Zelfzorg & balans", emoji: "🧘" },
  { slug: "rechten-regelingen", label: "Rechten & regelingen", emoji: "⚖️" },
  { slug: "financieel", label: "Geld & financiën", emoji: "💰" },
  { slug: "hulpmiddelen-producten", label: "Hulpmiddelen", emoji: "🔧" },
  { slug: "werk-mantelzorg", label: "Werk & mantelzorg", emoji: "💼" },
  { slug: "samen-zorgen", label: "Samen zorgen", emoji: "🤝" },
]

// ── Wizard Component ───────────────────────────────────────────────

export default function SlimPublicerenPage() {
  const router = useRouter()
  const [stap, setStap] = useState<Stap>(1)
  const [loading, setLoading] = useState(false)

  // Stap 1: Categorie
  const [categorie, setCategorie] = useState("")

  // Stap 2: Hiaten
  const [hiaten, setHiaten] = useState<Hiaat[]>([])

  // Stap 3: Voorstellen
  const [voorstellen, setVoorstellen] = useState<VoorgestelOnderwerp[]>([])

  // Stap 4: Gekozen onderwerp
  const [gekozenOnderwerp, setGekozenOnderwerp] = useState("")
  const [eigenOnderwerp, setEigenOnderwerp] = useState("")

  // Stap 5: Gegenereerd concept
  const [concept, setConcept] = useState<{ titel: string; beschrijving: string; inhoud: string; tags: string[] } | null>(null)

  // Stap 6: Preview / bewerking
  const [bewerkTitel, setBewerkTitel] = useState("")
  const [bewerkBeschrijving, setBewerkBeschrijving] = useState("")

  // Stap 7: Publicatie
  const [gepubliceerdId, setGepubliceerdId] = useState<string | null>(null)

  // Stap 2: Laad hiaten na categorie-keuze
  const laadHiaten = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/ai/admin/curator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "hiaten" }),
      })
      if (res.ok) {
        const data = await res.json()
        // Filter hiaten voor gekozen categorie
        const relevant = (data.hiaten || [])
          .filter((h: Hiaat) => !categorie || h.categorie === categorie)
          .slice(0, 5)
        setHiaten(relevant)
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
      setStap(2)
    }
  }

  // Stap 3: Genereer voorstellen
  const genereerVoorstellen = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/beheer/content-werkbank/voorstellen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categorie, hiaten }),
      })
      if (res.ok) {
        const data = await res.json()
        setVoorstellen(data.voorstellen || [])
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
      setStap(3)
    }
  }

  // Stap 5: Genereer concept
  const genereerConcept = async () => {
    setLoading(true)
    const onderwerp = gekozenOnderwerp || eigenOnderwerp
    try {
      const res = await fetch("/api/beheer/content-werkbank/genereer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categorie, onderwerp }),
      })
      if (res.ok) {
        const data = await res.json()
        setConcept(data.concept)
        setBewerkTitel(data.concept?.titel || "")
        setBewerkBeschrijving(data.concept?.beschrijving || "")
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
      setStap(6)
    }
  }

  // Stap 7: Publiceer
  const publiceer = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/beheer/content-werkbank/publiceer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titel: bewerkTitel,
          beschrijving: bewerkBeschrijving,
          inhoud: concept?.inhoud,
          categorie,
          tags: concept?.tags || [],
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setGepubliceerdId(data.artikelId)
        setStap(7)
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  const progressPercent = (stap / 7) * 100

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => stap > 1 ? setStap((stap - 1) as Stap) : router.push("/beheer/content-werkbank")}
          className="text-sm text-[#5A4D6B] hover:text-[#2D1B69] mb-2 flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {stap > 1 ? "Vorige stap" : "Terug naar werkbank"}
        </button>
        <h1 className="text-2xl font-extrabold text-[#2D1B69]">Slim Publiceren</h1>
      </div>

      {/* Voortgangsbalk */}
      <div className="w-full bg-[#E4D8E8] h-2 rounded-full">
        <div
          className="h-full bg-[#E5A825] rounded-full transition-all duration-500"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
      <p className="text-sm text-[#5A4D6B]">Stap {stap} van 7</p>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2D1B69]" />
            <p className="text-sm text-[#5A4D6B]">AI is aan het werk...</p>
          </div>
        </div>
      )}

      {/* STAP 1: Kies categorie */}
      {!loading && stap === 1 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-[#1E1533]">Kies een categorie</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {CATEGORIEEN.map((cat) => (
              <button
                key={cat.slug}
                onClick={() => setCategorie(cat.slug)}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  categorie === cat.slug
                    ? "border-[#2D1B69] bg-[#EDE8F5]"
                    : "border-[#D4C6D9] bg-white hover:border-[#2D1B69]/30"
                }`}
              >
                <span className="text-2xl">{cat.emoji}</span>
                <p className="font-semibold text-[#1E1533] mt-1">{cat.label}</p>
              </button>
            ))}
          </div>
          <button
            onClick={laadHiaten}
            disabled={!categorie}
            className="w-full py-3 bg-[#2D1B69] text-white font-bold rounded-xl disabled:opacity-40 hover:bg-[#3D2B7A] transition-colors"
          >
            Volgende →
          </button>
        </div>
      )}

      {/* STAP 2: Hiaten-analyse */}
      {!loading && stap === 2 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-[#1E1533]">Wat ontbreekt er?</h2>
          {hiaten.length > 0 ? (
            <div className="space-y-3">
              {hiaten.map((h, i) => (
                <div key={i} className="p-4 bg-white rounded-xl border border-[#D4C6D9]">
                  <p className="font-semibold text-[#1E1533]">{h.categorie}</p>
                  <ul className="mt-1 space-y-1">
                    {h.ontbreekt.map((o, j) => (
                      <li key={j} className="text-sm text-[#5A4D6B] flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#E5A825]" /> {o}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[#5A4D6B] py-4">Geen hiaten gevonden. Je kunt toch een nieuw artikel schrijven.</p>
          )}
          <button
            onClick={genereerVoorstellen}
            className="w-full py-3 bg-[#2D1B69] text-white font-bold rounded-xl hover:bg-[#3D2B7A] transition-colors"
          >
            AI stelt onderwerpen voor →
          </button>
        </div>
      )}

      {/* STAP 3: AI voorstellen */}
      {!loading && stap === 3 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-[#1E1533]">Kies een onderwerp</h2>
          <div className="space-y-3">
            {voorstellen.map((v, i) => (
              <button
                key={i}
                onClick={() => { setGekozenOnderwerp(v.titel); setStap(4) }}
                className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                  gekozenOnderwerp === v.titel
                    ? "border-[#2D1B69] bg-[#EDE8F5]"
                    : "border-[#D4C6D9] bg-white hover:border-[#2D1B69]/30"
                }`}
              >
                <p className="font-semibold text-[#1E1533]">{v.titel}</p>
                <p className="text-sm text-[#5A4D6B] mt-1">{v.beschrijving}</p>
                <p className="text-xs text-[#2D1B69] mt-2 italic">{v.reden}</p>
              </button>
            ))}
          </div>
          {voorstellen.length === 0 && (
            <p className="text-[#5A4D6B]">Geen voorstellen beschikbaar.</p>
          )}
        </div>
      )}

      {/* STAP 4: Bevestig of eigen onderwerp */}
      {!loading && stap === 4 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-[#1E1533]">Bevestig onderwerp</h2>
          {gekozenOnderwerp && (
            <div className="p-4 bg-[#EDE8F5] rounded-xl border border-[#2D1B69]/20">
              <p className="font-semibold text-[#2D1B69]">{gekozenOnderwerp}</p>
            </div>
          )}
          <div>
            <label className="text-sm font-semibold text-[#1E1533] block mb-1">Of typ je eigen onderwerp:</label>
            <input
              type="text"
              value={eigenOnderwerp}
              onChange={(e) => { setEigenOnderwerp(e.target.value); if (e.target.value) setGekozenOnderwerp("") }}
              placeholder="Bijv. 'Hoe ga je om met schuldgevoel als mantelzorger?'"
              className="w-full px-4 py-3 border border-[#D4C6D9] rounded-xl bg-white focus:border-[#2D1B69] focus:outline-none"
            />
          </div>
          <button
            onClick={genereerConcept}
            disabled={!gekozenOnderwerp && !eigenOnderwerp}
            className="w-full py-3 bg-[#E5A825] text-[#1E1533] font-bold rounded-xl disabled:opacity-40 hover:bg-[#d49b20] transition-colors"
          >
            AI schrijft concept →
          </button>
        </div>
      )}

      {/* STAP 5 wordt overgeslagen (loading → stap 6) */}

      {/* STAP 6: Preview + review */}
      {!loading && stap === 6 && concept && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-[#1E1533]">Preview & bewerken</h2>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-semibold text-[#1E1533] block mb-1">Titel</label>
              <input
                type="text"
                value={bewerkTitel}
                onChange={(e) => setBewerkTitel(e.target.value)}
                className="w-full px-4 py-3 border border-[#D4C6D9] rounded-xl bg-white focus:border-[#2D1B69] focus:outline-none"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-[#1E1533] block mb-1">Beschrijving</label>
              <textarea
                value={bewerkBeschrijving}
                onChange={(e) => setBewerkBeschrijving(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border border-[#D4C6D9] rounded-xl bg-white focus:border-[#2D1B69] focus:outline-none"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-[#1E1533] block mb-1">Inhoud (AI-gegenereerd)</label>
              <div className="p-4 bg-white rounded-xl border border-[#D4C6D9] text-sm text-[#1E1533] whitespace-pre-wrap max-h-80 overflow-y-auto">
                {concept.inhoud}
              </div>
            </div>
            {concept.tags.length > 0 && (
              <div>
                <label className="text-sm font-semibold text-[#1E1533] block mb-1">Tags</label>
                <div className="flex flex-wrap gap-1">
                  {concept.tags.map((t, i) => (
                    <span key={i} className="text-xs bg-[#EDE8F5] text-[#2D1B69] px-2 py-1 rounded-full">{t}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setStap(4)}
              className="flex-1 py-3 border-2 border-[#D4C6D9] text-[#5A4D6B] font-semibold rounded-xl hover:border-[#2D1B69] transition-colors"
            >
              Opnieuw genereren
            </button>
            <button
              onClick={publiceer}
              className="flex-1 py-3 bg-[#2D1B69] text-white font-bold rounded-xl hover:bg-[#3D2B7A] transition-colors"
            >
              Publiceren
            </button>
          </div>
        </div>
      )}

      {/* STAP 7: Succes */}
      {!loading && stap === 7 && (
        <div className="text-center py-8 space-y-4">
          <span className="text-5xl block">🎉</span>
          <h2 className="text-xl font-bold text-[#2D1B69]">Artikel gepubliceerd!</h2>
          <p className="text-[#5A4D6B]">Het artikel is beschikbaar in de Content Werkbank.</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => { setStap(1); setCategorie(""); setConcept(null); setGekozenOnderwerp(""); setEigenOnderwerp("") }}
              className="px-6 py-2.5 border-2 border-[#2D1B69] text-[#2D1B69] font-semibold rounded-xl hover:bg-[#EDE8F5] transition-colors"
            >
              Nog een artikel
            </button>
            <button
              onClick={() => router.push("/beheer/content-werkbank")}
              className="px-6 py-2.5 bg-[#2D1B69] text-white font-bold rounded-xl hover:bg-[#3D2B7A] transition-colors"
            >
              Naar werkbank
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
