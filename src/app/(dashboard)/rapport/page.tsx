"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { GerAvatar } from "@/components/GerAvatar"

interface TestResult {
  voornaam: string
  totaleBelastingScore: number
  belastingNiveau: "LAAG" | "GEMIDDELD" | "HOOG"
  totaleZorguren: number
  gemeente: string | null
  completedAt: string
  antwoorden: Array<{
    vraagId: string
    vraagTekst: string
    antwoord: string
    score: number
  }>
  taakSelecties: Array<{
    taakId: string
    taakNaam: string
    isGeselecteerd: boolean
    urenPerWeek: number | null
    moeilijkheid: string | null
  }>
  alarmLogs: Array<{
    type: string
    beschrijving: string
    urgentie: string
  }>
}

export default function RapportPage() {
  const [result, setResult] = useState<TestResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    // Probeer eerst van localStorage te laden
    const localResult = localStorage.getItem("belastbaarheidstest_result")
    if (localResult) {
      try {
        const parsed = JSON.parse(localResult)
        // Converteer lokale format naar API format
        setResult({
          voornaam: parsed.gegevens?.naam?.split(" ")[0] || "Jij",
          totaleBelastingScore: parsed.score || 0,
          belastingNiveau: getBelastingNiveau(parsed.score || 0),
          totaleZorguren: parsed.totaleUren || 0,
          gemeente: parsed.gegevens?.mantelzorgerStraat?.gemeente || null,
          completedAt: parsed.completedAt || new Date().toISOString(),
          antwoorden: Object.entries(parsed.antwoorden || {}).map(([vraagId, antwoord]) => ({
            vraagId,
            vraagTekst: getVraagTekst(vraagId),
            antwoord: antwoord as string,
            score: getAntwoordScore(antwoord as string),
          })),
          taakSelecties: Object.entries(parsed.taken || {}).map(([taakId, taak]) => {
            const t = taak as { isGeselecteerd: boolean; uren: string; belasting: string }
            return {
              taakId,
              taakNaam: getTaakNaam(taakId),
              isGeselecteerd: t.isGeselecteerd,
              urenPerWeek: getUrenGetal(t.uren),
              moeilijkheid: t.belasting || null,
            }
          }),
          alarmLogs: [],
        })
        setLoading(false)
        return
      } catch {
        // Negeer parse errors
      }
    }

    // Anders van API laden
    fetchResult()
  }, [])

  const fetchResult = async () => {
    try {
      const response = await fetch("/api/belastbaarheidstest")
      if (!response.ok) {
        if (response.status === 404) {
          setError("Je hebt nog geen test gedaan.")
        } else if (response.status === 401) {
          setError("Log in om je rapport te bekijken.")
        } else {
          setError("Er ging iets mis.")
        }
        return
      }
      const data = await response.json()
      setResult(data)
    } catch {
      setError("Kan rapport niet laden.")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="ker-page-content flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Laden...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="ker-page-content">
        <div className="flex items-start gap-4 mb-6">
          <GerAvatar size="md" />
          <div className="pt-1">
            <h1 className="text-xl font-bold text-foreground">Geen rapport</h1>
            <p className="text-muted-foreground mt-1">{error}</p>
          </div>
        </div>

        <div className="ker-card text-center">
          <div className="w-16 h-16 bg-[var(--accent-amber-bg)] rounded-full mx-auto mb-4 flex items-center justify-center">
            <span className="text-3xl">📋</span>
          </div>
          <p className="text-foreground mb-6">
            Doe eerst de Balanstest om je rapport te zien.
          </p>
          <Link href="/belastbaarheidstest" className="ker-btn ker-btn-primary inline-block">
            Start de Balanstest
          </Link>
        </div>
      </div>
    )
  }

  if (!result) return null

  const niveau = getNiveauInfo(result.belastingNiveau)
  const geselecteerdeTaken = result.taakSelecties.filter((t) => t.isGeselecteerd)
  const zwareTaken = geselecteerdeTaken.filter((t) => t.moeilijkheid === "ja" || t.moeilijkheid === "soms")

  return (
    <div className="ker-page-content">
      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        <GerAvatar size="md" />
        <div className="pt-1">
          <h1 className="text-xl font-bold text-foreground">
            Hoi {result.voornaam}!
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Rapport van {new Date(result.completedAt).toLocaleDateString("nl-NL", { day: "numeric", month: "long" })}
          </p>
        </div>
      </div>

      {/* Score card */}
      <div className={cn(
        "ker-card mb-4 text-center",
        niveau.kleur === "green" && "bg-[var(--accent-green-bg)]",
        niveau.kleur === "amber" && "bg-[var(--accent-amber-bg)]",
        niveau.kleur === "red" && "bg-[var(--accent-red-bg)]"
      )}>
        <div className={cn(
          "w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl font-bold text-white",
          niveau.kleur === "green" && "bg-[var(--emoticon-green)]",
          niveau.kleur === "amber" && "bg-[var(--emoticon-yellow)]",
          niveau.kleur === "red" && "bg-[var(--emoticon-red)]"
        )}>
          {result.totaleBelastingScore}
        </div>
        <h2 className={cn(
          "text-xl font-bold mb-2",
          niveau.kleur === "green" && "text-[var(--accent-green)]",
          niveau.kleur === "amber" && "text-[var(--accent-amber)]",
          niveau.kleur === "red" && "text-[var(--accent-red)]"
        )}>
          {niveau.label}
        </h2>
        <p className="text-foreground">{niveau.beschrijving}</p>
      </div>

      {/* Alarmen */}
      {result.alarmLogs.length > 0 && (
        <div className="ker-card mb-4 bg-[var(--accent-red-bg)] border-2 border-[var(--accent-red)]">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-[var(--emoticon-red)] flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold">!</span>
            </div>
            <div>
              <p className="font-bold text-[var(--accent-red)] mb-1">Let op!</p>
              {result.alarmLogs.map((alarm, index) => (
                <p key={index} className="text-sm text-[var(--accent-red)]">
                  {alarm.beschrijving}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Zorgtijd */}
      <div className="ker-card mb-4">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Zorgtijd per week</span>
          <span className="text-2xl font-bold text-foreground">{result.totaleZorguren} uur</span>
        </div>
        {result.totaleZorguren > 40 && (
          <div className="mt-3 p-3 bg-[var(--accent-red-bg)] rounded-xl">
            <p className="text-[var(--accent-red)] text-sm">
              Meer dan 40 uur per week is erg veel. Zoek hulp.
            </p>
          </div>
        )}
        {result.totaleZorguren > 20 && result.totaleZorguren <= 40 && (
          <div className="mt-3 p-3 bg-[var(--accent-amber-bg)] rounded-xl">
            <p className="text-[var(--accent-amber)] text-sm">
              Dit is veel. Kijk of je wat taken kunt delen.
            </p>
          </div>
        )}
      </div>

      {/* Taken overzicht */}
      {geselecteerdeTaken.length > 0 && (
        <div className="ker-card mb-4">
          <h3 className="font-bold text-foreground mb-3">Jouw zorgtaken</h3>
          <div className="space-y-2">
            {geselecteerdeTaken.map((taak) => (
              <div key={taak.taakId} className="flex items-center justify-between p-3 bg-muted rounded-xl">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-3 h-3 rounded-full",
                    taak.moeilijkheid === "ja" ? "bg-[var(--emoticon-red)]" :
                    taak.moeilijkheid === "soms" ? "bg-[var(--emoticon-yellow)]" : "bg-[var(--emoticon-green)]"
                  )} />
                  <span className="text-foreground text-sm">{taak.taakNaam}</span>
                </div>
                {taak.urenPerWeek && (
                  <span className="text-muted-foreground text-sm">{taak.urenPerWeek} uur</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hulp bij zware taken */}
      {zwareTaken.length > 0 && (
        <div className="ker-card mb-4">
          <h3 className="font-bold text-foreground mb-3">Hier kun je hulp bij krijgen</h3>
          <div className="space-y-3">
            {zwareTaken.map((taak) => (
              <div key={taak.taakId} className="p-4 bg-[var(--primary-light)] rounded-xl">
                <p className="font-medium text-foreground mb-1">{taak.taakNaam}</p>
                <p className="text-sm text-muted-foreground">
                  {getHulpTip(taak.taakId)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hulp vinden */}
      <div className="ker-card mb-4">
        <h3 className="font-bold text-foreground mb-3">
          Hulp in {result.gemeente || "je buurt"}
        </h3>
        <div className="space-y-2">
          <a
            href="https://www.regelhulp.nl/thema/mantelzorg"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 border-2 border-border rounded-xl hover:border-primary/50 transition-colors"
          >
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-primary-foreground">📋</span>
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground text-sm">Regelhulp.nl</p>
              <p className="text-xs text-muted-foreground">Hulp van de overheid</p>
            </div>
            <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>

          <a
            href="https://mantelzorg.nl/steunpunten"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 border-2 border-border rounded-xl hover:border-primary/50 transition-colors"
          >
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-primary-foreground">🤝</span>
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground text-sm">Steunpunt Mantelzorg</p>
              <p className="text-xs text-muted-foreground">Praat met iemand die het begrijpt</p>
            </div>
            <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>

          {result.gemeente && (
            <a
              href={`https://www.google.com/search?q=WMO+loket+${encodeURIComponent(result.gemeente)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 border-2 border-border rounded-xl hover:border-primary/50 transition-colors"
            >
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-primary-foreground">🏛️</span>
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground text-sm">WMO loket {result.gemeente}</p>
                <p className="text-xs text-muted-foreground">Vraag ondersteuning aan</p>
              </div>
              <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          )}
        </div>
      </div>

      {/* Tips */}
      <div className="ker-card mb-4 bg-muted">
        <h3 className="font-bold text-foreground mb-3">Tips voor jou</h3>
        <div className="space-y-3">
          {result.belastingNiveau === "HOOG" && (
            <div className="flex items-start gap-3">
              <span className="text-xl">🚨</span>
              <p className="text-sm text-foreground">
                Neem contact op met je huisarts. Je hebt ondersteuning nodig.
              </p>
            </div>
          )}
          {result.belastingNiveau === "GEMIDDELD" && (
            <div className="flex items-start gap-3">
              <span className="text-xl">⏰</span>
              <p className="text-sm text-foreground">
                Plan elke dag iets leuks voor jezelf, al is het maar 15 minuten.
              </p>
            </div>
          )}
          <div className="flex items-start gap-3">
            <span className="text-xl">💡</span>
            <p className="text-sm text-foreground">
              Vraag familie of vrienden om een taak over te nemen.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-xl">💜</span>
            <p className="text-sm text-foreground">
              Je doet het goed. Vergeet niet om ook voor jezelf te zorgen.
            </p>
          </div>
        </div>
      </div>

      {/* Opnieuw doen */}
      <Link
        href="/belastbaarheidstest"
        className="ker-btn ker-btn-secondary w-full flex items-center justify-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Doe de test opnieuw
      </Link>
    </div>
  )
}

// Helper functies

function getBelastingNiveau(score: number): "LAAG" | "GEMIDDELD" | "HOOG" {
  if (score <= 6) return "LAAG"
  if (score <= 12) return "GEMIDDELD"
  return "HOOG"
}

function getNiveauInfo(niveau: string) {
  switch (niveau) {
    case "LAAG":
      return { label: "Lage belasting", kleur: "green", beschrijving: "Je bent goed in balans" }
    case "GEMIDDELD":
      return { label: "Gemiddelde belasting", kleur: "amber", beschrijving: "Let op jezelf" }
    case "HOOG":
      return { label: "Hoge belasting", kleur: "red", beschrijving: "Je hebt hulp nodig" }
    default:
      return { label: "Onbekend", kleur: "gray", beschrijving: "" }
  }
}

function getVraagTekst(vraagId: string): string {
  const vragen: Record<string, string> = {
    q1: "Slaap je minder goed door de zorg?",
    q2: "Heb je last van je lichaam door het zorgen?",
    q3: "Kost het zorgen veel tijd en energie?",
    q4: "Is de band met je naaste veranderd?",
    q5: "Maakt het gedrag van je naaste je verdrietig, bang of boos?",
    q6: "Heb je verdriet dat je naaste anders is dan vroeger?",
    q7: "Slokt de zorg al je energie op?",
    q8: "Pas je je dagelijks leven aan voor de zorg?",
    q9: "Pas je regelmatig je plannen aan om te helpen?",
    q10: "Kom je niet meer toe aan dingen die je leuk vindt?",
    q11: "Kost het zorgen net zoveel tijd als je werk?",
  }
  return vragen[vraagId] || vraagId
}

function getTaakNaam(taakId: string): string {
  const taken: Record<string, string> = {
    t1: "Administratie en geldzaken",
    t2: "Regelen en afspraken maken",
    t3: "Boodschappen doen",
    t4: "Bezoek en gezelschap",
    t5: "Vervoer naar afspraken",
    t6: "Persoonlijke verzorging",
    t7: "Eten en drinken",
    t8: "Huishouden",
    t9: "Klusjes in en om huis",
  }
  return taken[taakId] || taakId
}

function getAntwoordScore(antwoord: string): number {
  if (antwoord === "ja") return 2
  if (antwoord === "soms") return 1
  return 0
}

function getUrenGetal(uren: string): number | null {
  const map: Record<string, number> = {
    "0-2": 1,
    "2-4": 3,
    "4-8": 6,
    "8-12": 10,
    "12-24": 18,
    "24+": 30,
  }
  return map[uren] || null
}

function getHulpTip(taakId: string): string {
  const tips: Record<string, string> = {
    t1: "Vraag bij je gemeente naar ondersteuning bij administratie.",
    t2: "Een casemanager kan helpen met het regelen van zorg.",
    t3: "Er zijn vrijwilligers die boodschappen kunnen doen.",
    t4: "Vraag naar dagbesteding of vrijwilligers voor bezoek.",
    t5: "De gemeente kan vervoer regelen naar afspraken.",
    t6: "Thuiszorg kan helpen met persoonlijke verzorging.",
    t7: "Maaltijdservice kan helpen met eten maken.",
    t8: "Huishoudelijke hulp kun je aanvragen via de gemeente.",
    t9: "Vrijwilligers kunnen helpen met klusjes.",
  }
  return tips[taakId] || "Vraag bij je gemeente naar hulpmogelijkheden."
}
