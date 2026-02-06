"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { GerAvatar } from "@/components/GerAvatar"

// Mapping van taak naar categorie voor hulpvragen pagina
const TAAK_NAAR_HULP_TAB: Record<string, { tab: 'voor-jou' | 'voor-naaste', categorie: string }> = {
  't1': { tab: 'voor-naaste', categorie: 'Administratie en aanvragen' },
  't2': { tab: 'voor-naaste', categorie: 'Administratie en aanvragen' },
  't3': { tab: 'voor-naaste', categorie: 'Boodschappen' },
  't4': { tab: 'voor-naaste', categorie: 'Sociaal contact en activiteiten' },
  't5': { tab: 'voor-naaste', categorie: 'Vervoer' },
  't6': { tab: 'voor-naaste', categorie: 'Persoonlijke verzorging' },
  't7': { tab: 'voor-naaste', categorie: 'Bereiden en/of nuttigen van maaltijden' },
  't8': { tab: 'voor-naaste', categorie: 'Huishoudelijke taken' },
  't9': { tab: 'voor-naaste', categorie: 'Klusjes in en om het huis' },
}

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
  const { data: session, status } = useSession()
  const [result, setResult] = useState<TestResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    // Wacht tot sessie geladen is
    if (status === "loading") {
      return
    }

    // Voor ingelogde gebruikers: altijd van database laden
    if (status === "authenticated" && session?.user) {
      fetchResult()
      return
    }

    // Voor niet-ingelogde gebruikers (status === "unauthenticated"): probeer localStorage
    const localResult = localStorage.getItem("belastbaarheidstest_result")
    if (localResult) {
      try {
        const parsed = JSON.parse(localResult)
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

    // Fallback: probeer toch van API (voor niet-ingelogde gebruikers zonder localStorage)
    fetchResult()
  }, [session, status])

  const fetchResult = async () => {
    try {
      // Cache busting om altijd verse data te krijgen
      const timestamp = Date.now()
      const response = await fetch(`/api/belastbaarheidstest?t=${timestamp}`, {
        cache: "no-store",
        headers: { 'Cache-Control': 'no-cache' }
      })
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

  const niveau = result.belastingNiveau
  const geselecteerdeTaken = result.taakSelecties.filter((t) => t.isGeselecteerd)
  // Ondersteuning voor zowel localStorage format (ja/soms/nee) als database format (MOEILIJK/GEMIDDELD/MAKKELIJK)
  const isZwaar = (m: string | null) => m === "ja" || m === "JA" || m === "MOEILIJK" || m === "ZEER_MOEILIJK"
  const isGemiddeld = (m: string | null) => m === "soms" || m === "SOMS" || m === "GEMIDDELD"
  const zwareTaken = geselecteerdeTaken.filter((t) => isZwaar(t.moeilijkheid))
  const gemiddeldeTaken = geselecteerdeTaken.filter((t) => isGemiddeld(t.moeilijkheid))
  const takenMetAandacht = [...zwareTaken, ...gemiddeldeTaken]

  return (
    <div className="ker-page-content">
      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        <GerAvatar size="md" />
        <div className="pt-1">
          <h1 className="text-xl font-bold text-foreground">
            Hoi {result.voornaam}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Rapport van {new Date(result.completedAt).toLocaleDateString("nl-NL", { day: "numeric", month: "long" })}
          </p>
        </div>
      </div>

      {/* ============================================ */}
      {/* HOOG NIVEAU - KRITIEKE ESCALATIE */}
      {/* ============================================ */}
      {niveau === "HOOG" && (
        <>
          {/* Urgente waarschuwing */}
          <div className="ker-card mb-4 bg-[var(--accent-red-bg)] border-2 border-[var(--accent-red)]">
            <div className="text-center mb-4">
              <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl font-bold text-white bg-[var(--emoticon-red)]">
                {result.totaleBelastingScore}
              </div>
              <h2 className="text-xl font-bold text-[var(--accent-red)] mb-2">
                Je bent overbelast
              </h2>
              <p className="text-foreground">
                Dit is niet vol te houden. Je hebt nu hulp nodig.
              </p>
            </div>
          </div>

          {/* DIRECTE ACTIE - Prominent */}
          <div className="ker-card mb-4 bg-white border-2 border-[var(--accent-red)]">
            <h3 className="font-bold text-[var(--accent-red)] mb-4 flex items-center gap-2">
              <span className="text-xl">🚨</span>
              Dit moet je nu doen
            </h3>

            <div className="space-y-3">
              {/* Huisarts */}
              <a
                href="tel:"
                className="flex items-center gap-4 p-4 bg-[var(--accent-red-bg)] rounded-xl hover:bg-red-100 transition-colors"
              >
                <div className="w-12 h-12 bg-[var(--emoticon-red)] rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xl">🏥</span>
                </div>
                <div className="flex-1">
                  <p className="font-bold text-foreground">Bel je huisarts</p>
                  <p className="text-sm text-muted-foreground">
                    Maak een afspraak om je situatie te bespreken
                  </p>
                </div>
              </a>

              {/* Gemeente mantelzorgondersteuner */}
              <a
                href={result.gemeente ? `https://www.google.com/search?q=mantelzorgondersteuning+${encodeURIComponent(result.gemeente)}` : "https://mantelzorg.nl/steunpunten"}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 p-4 bg-[var(--accent-red-bg)] rounded-xl hover:bg-red-100 transition-colors"
              >
                <div className="w-12 h-12 bg-[var(--emoticon-red)] rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xl">🏛️</span>
                </div>
                <div className="flex-1">
                  <p className="font-bold text-foreground">
                    Mantelzorgondersteuner {result.gemeente || "gemeente"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Gratis hulp vanuit je gemeente
                  </p>
                </div>
              </a>

              {/* Mantelzorglijn */}
              <a
                href="tel:0307606055"
                className="flex items-center gap-4 p-4 bg-[var(--accent-red-bg)] rounded-xl hover:bg-red-100 transition-colors"
              >
                <div className="w-12 h-12 bg-[var(--emoticon-red)] rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xl">📞</span>
                </div>
                <div className="flex-1">
                  <p className="font-bold text-foreground">Mantelzorglijn</p>
                  <p className="text-sm text-muted-foreground">
                    030 - 760 60 55 (ma-vr 9-17u)
                  </p>
                </div>
              </a>
            </div>
          </div>

          {/* Taken waar hulp bij nodig is - KLIKBAAR */}
          {takenMetAandacht.length > 0 && (
            <div className="ker-card mb-4">
              <h3 className="font-bold text-foreground mb-3">
                Deze taken moet je loslaten
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Je besteedt {result.totaleZorguren} uur per week aan zorgtaken. Dat is te veel.
              </p>
              <div className="space-y-2">
                {takenMetAandacht.map((taak) => {
                  const hulpInfo = TAAK_NAAR_HULP_TAB[taak.taakId]
                  return (
                    <Link
                      key={taak.taakId}
                      href={`/hulpvragen?tab=${hulpInfo?.tab || 'voor-naaste'}&categorie=${encodeURIComponent(hulpInfo?.categorie || taak.taakNaam)}`}
                      className="flex items-center justify-between p-3 bg-[var(--accent-red-bg)] rounded-xl hover:bg-[var(--accent-red-bg)]/80 transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-3 h-3 rounded-full",
                          isZwaar(taak.moeilijkheid) ? "bg-[var(--emoticon-red)]" : "bg-[var(--emoticon-yellow)]"
                        )} />
                        <span className="text-foreground text-sm">{taak.taakNaam}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {taak.urenPerWeek && (
                          <span className="text-muted-foreground text-sm">{taak.urenPerWeek} uur</span>
                        )}
                        <svg className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </Link>
                  )
                })}
              </div>
              <p className="text-sm text-[var(--accent-red)] mt-4 font-medium">
                Klik op een taak om hulpbronnen te bekijken
              </p>
            </div>
          )}
        </>
      )}

      {/* ============================================ */}
      {/* GEMIDDELD NIVEAU - FOCUS OP TAKEN */}
      {/* ============================================ */}
      {niveau === "GEMIDDELD" && (
        <>
          {/* Score card */}
          <div className="ker-card mb-4 bg-[var(--accent-amber-bg)] text-center">
            <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl font-bold text-white bg-[var(--emoticon-yellow)]">
              {result.totaleBelastingScore}
            </div>
            <h2 className="text-xl font-bold text-[var(--accent-amber)] mb-2">
              Je balans staat onder druk
            </h2>
            <p className="text-foreground">
              Zo doorgaan is niet houdbaar. Kijk welke taken je kunt overdragen.
            </p>
          </div>

          {/* Zorgtijd waarschuwing */}
          {result.totaleZorguren > 20 && (
            <div className="ker-card mb-4 bg-[var(--accent-amber-bg)] border-l-4 border-[var(--accent-amber)]">
              <p className="text-foreground">
                <strong>{result.totaleZorguren} uur per week</strong> is veel.
                Probeer taken te delen met anderen.
              </p>
            </div>
          )}

          {/* Taken die aandacht nodig hebben - KLIKBAAR */}
          {takenMetAandacht.length > 0 && (
            <div className="ker-card mb-4">
              <h3 className="font-bold text-foreground mb-3">
                Hier kun je hulp bij krijgen
              </h3>
              <div className="space-y-3">
                {takenMetAandacht.map((taak) => {
                  const hulpInfo = TAAK_NAAR_HULP_TAB[taak.taakId]
                  return (
                    <Link
                      key={taak.taakId}
                      href={`/hulpvragen?tab=${hulpInfo?.tab || 'voor-naaste'}&categorie=${encodeURIComponent(hulpInfo?.categorie || taak.taakNaam)}`}
                      className="block p-4 bg-muted rounded-xl hover:bg-muted/80 transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className={cn(
                          "w-3 h-3 rounded-full",
                          isZwaar(taak.moeilijkheid) ? "bg-[var(--emoticon-red)]" : "bg-[var(--emoticon-yellow)]"
                        )} />
                        <span className="font-medium text-foreground">{taak.taakNaam}</span>
                        {taak.urenPerWeek && (
                          <span className="text-muted-foreground text-sm ml-auto">{taak.urenPerWeek} uur/week</span>
                        )}
                        <svg className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                      <p className="text-sm text-muted-foreground pl-6">
                        {getHulpTip(taak.taakId)}
                      </p>
                    </Link>
                  )
                })}
              </div>
              <p className="text-sm text-primary mt-4 font-medium">
                Klik op een taak om hulpbronnen te bekijken →
              </p>
            </div>
          )}

          {/* Hulp zoeken */}
          <div className="ker-card mb-4">
            <h3 className="font-bold text-foreground mb-3">Vind hulp</h3>
            <div className="space-y-2">
              <a
                href={result.gemeente ? `https://www.google.com/search?q=mantelzorgondersteuning+${encodeURIComponent(result.gemeente)}` : "https://mantelzorg.nl/steunpunten"}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 border-2 border-border rounded-xl hover:border-primary/50 transition-colors"
              >
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-primary-foreground">🤝</span>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground text-sm">Steunpunt Mantelzorg</p>
                  <p className="text-xs text-muted-foreground">Gratis advies en ondersteuning</p>
                </div>
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
                    <p className="text-xs text-muted-foreground">Vraag hulp aan bij de gemeente</p>
                  </div>
                </a>
              )}
            </div>
          </div>
        </>
      )}

      {/* ============================================ */}
      {/* LAAG NIVEAU - POSITIEF, PREVENTIEF */}
      {/* ============================================ */}
      {niveau === "LAAG" && (
        <>
          {/* Score card - positief */}
          <div className="ker-card mb-4 bg-[var(--accent-green-bg)] text-center">
            <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl font-bold text-white bg-[var(--emoticon-green)]">
              {result.totaleBelastingScore}
            </div>
            <h2 className="text-xl font-bold text-[var(--accent-green)] mb-2">
              Goed bezig!
            </h2>
            <p className="text-foreground">
              Je hebt een goede balans. Blijf goed voor jezelf zorgen.
            </p>
          </div>

          {/* Alleen zware taken tonen als die er zijn */}
          {zwareTaken.length > 0 && (
            <div className="ker-card mb-4 border-l-4 border-[var(--accent-amber)]">
              <h3 className="font-bold text-foreground mb-3">
                Let op deze {zwareTaken.length === 1 ? "taak" : "taken"}
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                Je ervaart {zwareTaken.length === 1 ? "deze taak" : "deze taken"} als zwaar. Hier kun je hulp bij krijgen:
              </p>
              <div className="space-y-3">
                {zwareTaken.map((taak) => (
                  <div key={taak.taakId} className="p-4 bg-muted rounded-xl">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-3 h-3 rounded-full bg-[var(--emoticon-red)]" />
                      <span className="font-medium text-foreground">{taak.taakNaam}</span>
                    </div>
                    <p className="text-sm text-muted-foreground pl-6">
                      {getHulpTip(taak.taakId)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Overzicht taken (compact) */}
          {geselecteerdeTaken.length > 0 && (
            <div className="ker-card mb-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-foreground">Jouw zorgtaken</h3>
                <span className="text-sm text-muted-foreground">{result.totaleZorguren} uur/week</span>
              </div>
              <div className="space-y-2">
                {geselecteerdeTaken.map((taak) => (
                  <div key={taak.taakId} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        isZwaar(taak.moeilijkheid) ? "bg-[var(--emoticon-red)]" :
                        isGemiddeld(taak.moeilijkheid) ? "bg-[var(--emoticon-yellow)]" : "bg-[var(--emoticon-green)]"
                      )} />
                      <span className="text-foreground text-sm">{taak.taakNaam}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tips om balans te houden */}
          <div className="ker-card mb-4 bg-muted">
            <h3 className="font-bold text-foreground mb-3">Houd je balans vast</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="text-xl">💚</span>
                <p className="text-sm text-foreground">
                  Plan elke dag iets leuks voor jezelf
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-xl">🔄</span>
                <p className="text-sm text-foreground">
                  Doe deze test elke 3 maanden om je balans te checken
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-xl">🤝</span>
                <p className="text-sm text-foreground">
                  Vraag hulp voordat je het nodig hebt
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Opnieuw doen - altijd tonen */}
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
    t1: "Persoonlijke verzorging",
    t2: "Huishoudelijke taken",
    t3: "Medicijnen",
    t4: "Vervoer",
    t5: "Administratie",
    t6: "Gezelschap",
    t7: "Toezicht",
    t8: "Medische zorg",
    t9: "Klusjes",
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
    t1: "Thuiszorg kan helpen met wassen, aankleden en andere persoonlijke verzorging.",
    t2: "Huishoudelijke hulp kun je aanvragen via de WMO van je gemeente.",
    t3: "Een apotheek kan medicijnen in weekdozen klaarzetten. Thuiszorg kan toezien op inname.",
    t4: "De gemeente kan aangepast vervoer regelen (Regiotaxi, WMO-vervoer).",
    t5: "Vraag bij je gemeente naar vrijwillige hulp bij administratie en formulieren.",
    t6: "Dagbesteding of vrijwilligers kunnen voor gezelschap zorgen.",
    t7: "Respijtzorg of dagopvang kan toezicht overnemen zodat jij even rust hebt.",
    t8: "Thuiszorg of wijkverpleging kan medische handelingen overnemen.",
    t9: "Vrijwilligers of een klussenbus kunnen helpen met klussen in huis.",
  }
  return tips[taakId] || "Vraag bij je gemeente naar hulpmogelijkheden."
}
