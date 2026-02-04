"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { GerAvatar } from "@/components/GerAvatar"

const zorgtaken = [
  { id: "t1", naam: "Administratie en geldzaken" },
  { id: "t2", naam: "Regelen en afspraken maken" },
  { id: "t3", naam: "Boodschappen doen" },
  { id: "t4", naam: "Bezoek en gezelschap" },
  { id: "t5", naam: "Vervoer naar afspraken" },
  { id: "t6", naam: "Persoonlijke verzorging" },
  { id: "t7", naam: "Eten en drinken" },
  { id: "t8", naam: "Huishouden" },
  { id: "t9", naam: "Klusjes in en om huis" },
]

const urenOpties = [
  { value: "0-2", label: "Tot 2 uur", uren: 1 },
  { value: "2-4", label: "2-4 uur", uren: 3 },
  { value: "4-8", label: "4-8 uur", uren: 6 },
  { value: "8-12", label: "8-12 uur", uren: 10 },
  { value: "12-24", label: "12-24 uur", uren: 18 },
  { value: "24+", label: "24+ uur", uren: 30 },
]

interface TestData {
  gegevens: {
    naam: string
    email: string
  }
  antwoorden: Record<string, string>
  taken: Record<string, { isGeselecteerd: boolean; uren: string; belasting: string }>
  score: number
  niveau: string
  totaleUren: number
  completedAt: string
}

const getBelastingNiveau = (score: number) => {
  if (score <= 6) return { niveau: "Laag", kleur: "green", beschrijving: "Je bent goed in balans. Blijf goed voor jezelf zorgen!" }
  if (score <= 12) return { niveau: "Gemiddeld", kleur: "amber", beschrijving: "Let op jezelf. Plan regelmatig rust in." }
  return { niveau: "Hoog", kleur: "red", beschrijving: "Je hebt ondersteuning nodig. Neem contact op met je huisarts." }
}

export default function RapportGastPage() {
  const router = useRouter()
  const [testData, setTestData] = useState<TestData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem("belastbaarheidstest_result")
    if (stored) {
      try {
        setTestData(JSON.parse(stored))
      } catch { /* ignore */ }
    }
    setLoading(false)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!testData) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header met Ger */}
        <div className="px-4 pt-8 pb-4">
          <div className="max-w-md mx-auto flex items-start gap-4">
            <GerAvatar size="lg" />
            <div className="pt-2">
              <h1 className="text-2xl font-bold text-foreground">Geen rapport</h1>
              <p className="text-muted-foreground mt-1">
                Heb je de test al ingevuld?
              </p>
            </div>
          </div>
        </div>

        <main className="max-w-md mx-auto px-4 py-6">
          <div className="ker-card text-center">
            <div className="w-16 h-16 bg-[#FFF8E1] rounded-full mx-auto mb-4 flex items-center justify-center">
              <svg className="w-8 h-8 text-[#FF9800]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="text-foreground mb-6">
              Er is nog geen rapport gevonden. Start eerst de Balanstest.
            </p>
            <button onClick={() => router.push("/belastbaarheidstest")} className="ker-btn ker-btn-primary w-full">
              Start de Balanstest
            </button>
          </div>
        </main>
      </div>
    )
  }

  const niveau = getBelastingNiveau(testData.score)
  const alleTaken = Object.entries(testData.taken)
    .filter(([, data]) => data.isGeselecteerd)
    .map(([taakId]) => zorgtaken.find((t) => t.id === taakId)!)
    .filter(Boolean)

  return (
    <div className="min-h-screen bg-background">
      {/* Header met Ger */}
      <div className="px-4 pt-8 pb-4">
        <div className="max-w-md mx-auto flex items-start gap-4">
          <GerAvatar size="md" />
          <div className="pt-1">
            <h1 className="text-2xl font-bold text-foreground">
              Hoi{testData.gegevens.naam ? ` ${testData.gegevens.naam.split(" ")[0]}` : ""}!
            </h1>
            <p className="text-muted-foreground mt-1">
              Hier is je persoonlijke rapport
            </p>
          </div>
        </div>
      </div>

      {/* Gast badge */}
      <div className="px-4 pb-4">
        <div className="max-w-md mx-auto flex justify-center">
          <div className="ker-pill">
            <span className="text-muted-foreground">Je bekijkt dit als</span>
            <span className="font-bold ml-1">gast</span>
          </div>
        </div>
      </div>

      <main className="max-w-md mx-auto px-4 pb-32 space-y-4">
        {/* Score card */}
        <div className={cn(
          "ker-card text-center",
          niveau.kleur === "green" && "bg-[#E8F5E9]",
          niveau.kleur === "amber" && "bg-[#FFF8E1]",
          niveau.kleur === "red" && "bg-[#FFEBEE]"
        )}>
          <div className={cn(
            "w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl font-bold text-white",
            niveau.kleur === "green" && "bg-[#4CAF50]",
            niveau.kleur === "amber" && "bg-[#FF9800]",
            niveau.kleur === "red" && "bg-[#F44336]"
          )}>
            {testData.score}
          </div>
          <h2 className={cn(
            "text-xl font-bold mb-2",
            niveau.kleur === "green" && "text-[#2E7D32]",
            niveau.kleur === "amber" && "text-[#F57C00]",
            niveau.kleur === "red" && "text-[#C62828]"
          )}>
            {niveau.niveau} belasting
          </h2>
          <p className="text-foreground">{niveau.beschrijving}</p>
        </div>

        {/* Uren */}
        {testData.totaleUren > 0 && (
          <div className="ker-card">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Zorgtijd per week</span>
              <span className="text-xl font-bold text-foreground">{testData.totaleUren} uur</span>
            </div>
          </div>
        )}

        {/* Taken overzicht */}
        {alleTaken.length > 0 && (
          <div className="ker-card">
            <h3 className="font-bold text-foreground mb-3">Jouw zorgtaken</h3>
            <div className="space-y-2">
              {alleTaken.map((taak) => {
                const taakData = testData.taken[taak.id]
                const urenLabel = urenOpties.find(o => o.value === taakData.uren)?.label || ""
                return (
                  <div key={taak.id} className="flex items-center justify-between text-sm">
                    <span className="text-foreground">{taak.naam}</span>
                    <span className="text-muted-foreground">{urenLabel}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Tip */}
        <div className="ker-card bg-muted">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
              <span className="text-primary-foreground text-sm font-bold">i</span>
            </div>
            <div>
              <p className="font-medium text-foreground mb-1">Tip voor jou</p>
              <p className="text-sm text-foreground">
                {niveau.kleur === "red"
                  ? "Neem vandaag nog contact op met je huisarts of MantelzorgNL (030-659 98 98)."
                  : niveau.kleur === "amber"
                  ? "Plan deze week een moment voor jezelf. Al is het maar 15 minuten."
                  : "Blijf goed voor jezelf zorgen en vraag om hulp als het nodig is."}
              </p>
            </div>
          </div>
        </div>

        {/* Hulpbronnen */}
        <div className="ker-card">
          <h3 className="font-bold text-foreground mb-3">Hulp vinden</h3>
          <a
            href="https://www.mantelzorg.nl"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-3 border-2 border-border rounded-xl hover:border-primary/50 transition-colors"
          >
            <div>
              <p className="font-medium text-foreground">MantelzorgNL</p>
              <p className="text-sm text-muted-foreground">Informatie en ondersteuning</p>
            </div>
            <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>

        {/* Account aanmaken melding */}
        <div className="ker-card bg-primary/5 border-2 border-primary/20">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-foreground">Je bekijkt dit als gast</p>
              <p className="text-sm text-muted-foreground">
                Maak een account aan om je rapport te bewaren en je voortgang te volgen.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4">
        <div className="max-w-md mx-auto flex gap-3">
          <Link href="/register?from=test" className="flex-1">
            <button className="ker-btn ker-btn-primary w-full">
              Account aanmaken
            </button>
          </Link>
          <Link href="/belastbaarheidstest" className="flex-1">
            <button className="ker-btn ker-btn-secondary w-full">
              Opnieuw
            </button>
          </Link>
        </div>
      </footer>
    </div>
  )
}
