"use client"

import { Suspense, useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { GerAvatar } from "@/components/GerAvatar"
import { ResultSmiley } from "@/components/ui"

interface Hulpbron {
  naam: string
  telefoon: string | null
  website: string | null
  beschrijving: string | null
  soortHulp?: string | null
  gemeente?: string | null
  isLandelijk?: boolean
}

interface LandelijkeHulpbron {
  naam: string
  telefoon: string | null
  website: string | null
  beschrijving: string | null
  soortHulp: string | null
}

interface DashboardData {
  user: {
    name: string
    email: string
    profileCompleted: boolean
  }
  test: {
    hasTest: boolean
    score?: number
    niveau?: "LAAG" | "GEMIDDELD" | "HOOG"
    completedAt?: string
    daysSinceTest?: number
    needsNewTest: boolean
    trend?: "improved" | "same" | "worse"
    history?: { score: number; niveau: string; date: string }[]
    highScoreAreas?: { vraag: string; antwoord: string }[]
    zorgtaken?: { id: string; naam: string; uren: number | null; moeilijkheid: string | null }[]
  }
  hulpbronnen?: {
    perTaak: Record<string, Hulpbron[]>
    voorMantelzorger: Hulpbron[]
    landelijk: LandelijkeHulpbron[]
    perCategorie: Record<string, Hulpbron[]>
    mantelzorgerGemeente?: string | null
    zorgvragerGemeente?: string | null
  }
  checkIns: {
    weeklyDone: boolean
    monthlyDone: boolean
    lastCheckIn: any
    wellbeingTrend: "up" | "down" | "stable" | null
    recentScores: number[]
  }
  tasks: {
    total: number
    open: number
    overdue: number
    completedThisWeek: number
    byCategory: {
      selfCare: number
      openSelfCare: number
      completedSelfCareThisWeek: number
    }
    upcoming: {
      id: string
      title: string
      category: string
      priority: string
      dueDate: string | null
      isOverdue: boolean
    }[]
  }
  urgency: {
    level: "low" | "medium" | "high" | "critical"
    messages: string[]
  }
  selfCare: {
    weeklyGoal: number
    completed: number
    upcoming: { id: string; title: string; dueDate: string | null }[]
  }
}

// Mapping van taak namen naar categorieën voor hulpbronnen
const TAAK_NAAR_CATEGORIE: Record<string, string> = {
  'Wassen/aankleden': 'Persoonlijke verzorging',
  'Persoonlijke verzorging': 'Persoonlijke verzorging',
  'Toiletgang': 'Persoonlijke verzorging',
  'Medicijnen': 'Persoonlijke verzorging',
  'Toezicht': 'Persoonlijke verzorging',
  'Medische zorg': 'Persoonlijke verzorging',
  'Huishouden': 'Huishoudelijke taken',
  'Huishoudelijke taken': 'Huishoudelijke taken',
  'Vervoer': 'Vervoer',
  'Vervoer/begeleiding': 'Vervoer',
  'Administratie': 'Administratie en aanvragen',
  'Administratie en aanvragen': 'Administratie en aanvragen',
  'Sociaal contact': 'Sociaal contact en activiteiten',
  'Sociaal contact en activiteiten': 'Sociaal contact en activiteiten',
  'Activiteiten': 'Sociaal contact en activiteiten',
  'Maaltijden': 'Bereiden en/of nuttigen van maaltijden',
  'Boodschappen': 'Boodschappen',
  'Klusjes': 'Klusjes in en om het huis',
}

// Wrapper component voor Suspense boundary
export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="ker-page-content flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  )
}

function DashboardContent() {
  const { data: session, status } = useSession()
  const searchParams = useSearchParams()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState("daar")

  // Check of we van de test komen (dan forceren we refresh)
  const fromTest = searchParams.get("from") === "test"

  useEffect(() => {
    // Wacht tot sessie geladen is
    if (status === "loading") {
      return
    }

    const loadDashboard = async () => {
      try {
        // Altijd cache busting - verse data ophalen
        const timestamp = Date.now()
        const url = `/api/dashboard?t=${timestamp}`

        const res = await fetch(url, {
          // Forceer verse data
          cache: "no-store",
          headers: {
            'Cache-Control': 'no-cache'
          }
        })
        if (res.ok) {
          const dashboardData = await res.json()
          setData(dashboardData)
          if (dashboardData.user?.name) {
            setUserName(dashboardData.user.name.split(" ")[0])
          }
        }
      } catch (error) {
        console.error("Failed to load dashboard:", error)
      } finally {
        setLoading(false)
      }
    }

    if (status === "authenticated" && session?.user) {
      loadDashboard()
    } else {
      setLoading(false)
    }
  }, [session, status, fromTest])

  if (loading) {
    return (
      <div className="ker-page-content flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Bereken zware taken (database gebruikt MOEILIJK/ZEER_MOEILIJK/GEMIDDELD/MAKKELIJK)
  const zwareTaken = data?.test?.zorgtaken?.filter(t =>
    t.moeilijkheid === 'MOEILIJK' || t.moeilijkheid === 'ZEER_MOEILIJK'
  ) || []
  const matigTaken = data?.test?.zorgtaken?.filter(t => t.moeilijkheid === 'GEMIDDELD') || []
  const lichtTaken = data?.test?.zorgtaken?.filter(t =>
    !t.moeilijkheid || t.moeilijkheid === 'MAKKELIJK'
  ) || []

  // Genereer aanbevolen acties
  const getAanbevolenActies = () => {
    const acties: { icon: string; titel: string; beschrijving: string; href: string; prioriteit: number }[] = []

    // Actie 0: Nog geen test gedaan - ALTIJD EERSTE
    if (!data?.test?.hasTest) {
      acties.push({
        icon: "📊",
        titel: "Doe de Balanstest",
        beschrijving: "Ontdek hoe het met je gaat",
        href: "/belastbaarheidstest",
        prioriteit: 0
      })
    }

    // Actie 1: Bij hoge belasting - bel mantelzorglijn
    if (data?.test?.niveau === "HOOG") {
      acties.push({
        icon: "📞",
        titel: "Bel de Mantelzorglijn",
        beschrijving: "Praat met iemand over je situatie",
        href: "tel:0302059059",
        prioriteit: 1
      })
    }

    // Actie 2: Hulp zoeken bij zware taken
    if (zwareTaken.length > 0 || matigTaken.length > 0) {
      const totaal = zwareTaken.length + matigTaken.length
      acties.push({
        icon: "🤝",
        titel: "Zoek hulp bij je taken",
        beschrijving: `${totaal} ${totaal === 1 ? 'taak' : 'taken'} waar je hulp bij kunt krijgen`,
        href: "/hulpvragen",
        prioriteit: 2
      })
    }

    // Actie 3: Check-in doen
    if (!data?.checkIns?.weeklyDone) {
      acties.push({
        icon: "📝",
        titel: "Doe je wekelijkse check-in",
        beschrijving: "Even kijken hoe het met je gaat",
        href: "/check-in",
        prioriteit: 3
      })
    }

    // Actie 4: Leer over mantelzorg (educatie)
    acties.push({
      icon: "📚",
      titel: "Tips voor mantelzorgers",
      beschrijving: "Ontdek praktische tips en informatie",
      href: "https://www.mantelzorg.nl/tips",
      prioriteit: 4
    })

    // Actie 5: Tijd voor jezelf plannen
    if ((data?.selfCare?.completed || 0) < (data?.selfCare?.weeklyGoal || 3)) {
      acties.push({
        icon: "🌱",
        titel: "Plan tijd voor jezelf",
        beschrijving: "Zelfzorg is geen luxe, maar noodzaak",
        href: "/taken?category=SELF_CARE",
        prioriteit: 5
      })
    }

    // Actie 6: Verlopen taken
    if ((data?.tasks?.overdue || 0) > 0) {
      acties.push({
        icon: "⏰",
        titel: "Bekijk verlopen taken",
        beschrijving: `${data?.tasks?.overdue} ${data?.tasks?.overdue === 1 ? 'taak' : 'taken'} nog open`,
        href: "/taken",
        prioriteit: 6
      })
    }

    // Actie 7: Kwartaal test (alleen als er al een test is)
    if (data?.test?.hasTest && data?.test?.needsNewTest) {
      acties.push({
        icon: "📊",
        titel: "Doe je kwartaal check",
        beschrijving: "Vergelijk met je vorige resultaat",
        href: "/belastbaarheidstest",
        prioriteit: 7
      })
    }

    return acties.sort((a, b) => a.prioriteit - b.prioriteit).slice(0, 3)
  }

  const aanbevolenActies = getAanbevolenActies()

  return (
    <div className="ker-page-content">
      {/* Header met Ger */}
      <div className="flex items-start gap-4 mb-6">
        <GerAvatar size="lg" />
        <div className="pt-2">
          <h1 className="text-2xl font-bold text-foreground">
            Hoi {userName}!
          </h1>
          <p className="text-muted-foreground mt-1">
            {getGreeting()}
          </p>
        </div>
      </div>

      {/* SECTIE 1: Jouw Score Overzicht */}
      {data?.test?.hasTest ? (
        <section className="mb-8">
          <div
            className={cn(
              "ker-card",
              data.test.niveau === "LAAG" && "bg-[var(--accent-green-bg)] border-[var(--accent-green)]",
              data.test.niveau === "GEMIDDELD" && "bg-[var(--accent-amber-bg)] border-[var(--accent-amber)]",
              data.test.niveau === "HOOG" && "bg-[var(--accent-red-bg)] border-[var(--accent-red)]"
            )}
          >
            {/* Score Header */}
            <div className="flex items-center gap-4 mb-4">
              <div className="flex-shrink-0">
                <ResultSmiley
                  type={data.test.niveau === "LAAG" ? "green" : data.test.niveau === "GEMIDDELD" ? "amber" : "red"}
                  size="xl"
                />
              </div>
              <div className="flex-1">
                <h2
                  className={cn(
                    "font-bold text-xl",
                    data.test.niveau === "LAAG" && "text-[var(--accent-green)]",
                    data.test.niveau === "GEMIDDELD" && "text-[var(--accent-amber)]",
                    data.test.niveau === "HOOG" && "text-[var(--accent-red)]"
                  )}
                >
                  {data.test.niveau === "LAAG" && "Lage belasting"}
                  {data.test.niveau === "GEMIDDELD" && "Gemiddelde belasting"}
                  {data.test.niveau === "HOOG" && "Hoge belasting"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {data.test.daysSinceTest} dagen geleden
                  {data.test.trend && (
                    <span className="ml-2">
                      {data.test.trend === "improved" && "📈 Verbeterd"}
                      {data.test.trend === "worse" && "📉 Aandacht nodig"}
                      {data.test.trend === "same" && "➡️ Stabiel"}
                    </span>
                  )}
                </p>
                <Link
                  href="/rapport"
                  className="inline-flex items-center gap-1 mt-2 px-3 py-1.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
                >
                  Bekijk rapport
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>

            {/* Score Verdeling */}
            <div className="grid grid-cols-3 gap-2 text-center mb-4">
              <div className="bg-white/50 rounded-lg p-2">
                <p className="text-xl font-bold text-[var(--accent-green)]">{lichtTaken.length}</p>
                <p className="text-xs text-muted-foreground">Gaat goed</p>
              </div>
              <div className="bg-white/50 rounded-lg p-2">
                <p className="text-xl font-bold text-[var(--accent-amber)]">{matigTaken.length}</p>
                <p className="text-xs text-muted-foreground">Matig zwaar</p>
              </div>
              <div className="bg-white/50 rounded-lg p-2">
                <p className="text-xl font-bold text-[var(--accent-red)]">{zwareTaken.length}</p>
                <p className="text-xs text-muted-foreground">Zwaar</p>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section className="mb-8">
          <div className="ker-card">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                <span className="text-3xl">📊</span>
              </div>
              <div className="flex-1">
                <h2 className="font-bold text-xl text-foreground">
                  Nog geen test gedaan
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Doe de test om inzicht te krijgen in je belasting
                </p>
              </div>
            </div>
            <Link
              href="/belastbaarheidstest"
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground font-medium rounded-lg hover:opacity-90 transition-opacity"
            >
              Doe de test
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </section>
      )}

      {/* SECTIE 2: Jouw Eerste 3 Acties */}
      {aanbevolenActies.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <span className="text-2xl">🎯</span> Jouw Eerste Stappen
          </h2>

          <div className="space-y-3">
            {aanbevolenActies.map((actie, i) => (
              <Link key={i} href={actie.href} className="block">
                <div className="ker-card hover:border-primary/50 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-2xl">{actie.icon}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center">
                          {i + 1}
                        </span>
                        <h3 className="font-semibold">{actie.titel}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{actie.beschrijving}</p>
                    </div>
                    <svg className="w-5 h-5 text-muted-foreground flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* SECTIE 3: Je Zorgtaken met Hulp */}
      {data?.test?.zorgtaken && data.test.zorgtaken.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <span className="text-2xl">📋</span> Je Zorgtaken
            </h2>
            <Link href="/hulpvragen" className="text-sm text-primary hover:underline">
              Alle hulp →
            </Link>
          </div>

          <div className="space-y-3">
            {/* Zware taken eerst */}
            {zwareTaken.map((taak, i) => {
              const categorie = TAAK_NAAR_CATEGORIE[taak.naam]
              const hulpbronnen = categorie ? (data?.hulpbronnen?.perCategorie?.[categorie] || []) : []
              const aantalHulp = hulpbronnen.length

              return (
                <Link key={`zwaar-${i}`} href="/hulpvragen" className="block">
                  <div className="ker-card border-l-4 border-l-[var(--accent-red)] hover:border-primary/50 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">🔴</span>
                        <span className="font-semibold">{taak.naam}</span>
                        {taak.uren && <span className="text-xs text-muted-foreground">({taak.uren}u/week)</span>}
                      </div>
                      <span className="text-xs bg-[var(--accent-red-bg)] text-[var(--accent-red)] px-2 py-1 rounded-full font-medium">
                        Zwaar
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-primary">
                      <span>🤝</span>
                      <span>{aantalHulp > 0 ? `${aantalHulp} hulpbron${aantalHulp > 1 ? 'nen' : ''} beschikbaar` : 'Zoek hulp'}</span>
                      <span>→</span>
                    </div>
                  </div>
                </Link>
              )
            })}

            {/* Matig zware taken */}
            {matigTaken.map((taak, i) => {
              const categorie = TAAK_NAAR_CATEGORIE[taak.naam]
              const hulpbronnen = categorie ? (data?.hulpbronnen?.perCategorie?.[categorie] || []) : []
              const aantalHulp = hulpbronnen.length

              return (
                <Link key={`matig-${i}`} href="/hulpvragen" className="block">
                  <div className="ker-card border-l-4 border-l-[var(--accent-amber)] hover:border-primary/50 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">🟡</span>
                        <span className="font-semibold">{taak.naam}</span>
                        {taak.uren && <span className="text-xs text-muted-foreground">({taak.uren}u/week)</span>}
                      </div>
                      <span className="text-xs bg-[var(--accent-amber-bg)] text-[var(--accent-amber)] px-2 py-1 rounded-full font-medium">
                        Matig
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-primary">
                      <span>🤝</span>
                      <span>{aantalHulp > 0 ? `${aantalHulp} hulpbron${aantalHulp > 1 ? 'nen' : ''} beschikbaar` : 'Zoek hulp'}</span>
                      <span>→</span>
                    </div>
                  </div>
                </Link>
              )
            })}

            {/* Lichte taken - compact */}
            {lichtTaken.length > 0 && (
              <div className="ker-card bg-[var(--accent-green-bg)]/30">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">🟢</span>
                  <span className="font-medium text-muted-foreground">Taken die goed gaan ({lichtTaken.length})</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {lichtTaken.map((taak, i) => (
                    <span key={i} className="text-xs bg-white/50 px-2 py-1 rounded-full">
                      {taak.naam}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* SECTIE: Educatie & Tips */}
      <section className="mb-8">
        <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
          <span className="text-2xl">📚</span> Leren & Tips
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <a
            href="https://www.mantelzorg.nl/tips"
            target="_blank"
            rel="noopener noreferrer"
            className="ker-card hover:border-primary/50 transition-colors"
          >
            <span className="text-2xl block mb-2">💡</span>
            <p className="font-medium text-sm">Praktische tips</p>
            <p className="text-xs text-muted-foreground mt-1">Voor het dagelijks leven</p>
          </a>
          <a
            href="https://www.mantelzorg.nl/zelfzorg"
            target="_blank"
            rel="noopener noreferrer"
            className="ker-card hover:border-primary/50 transition-colors"
          >
            <span className="text-2xl block mb-2">🧘</span>
            <p className="font-medium text-sm">Zelfzorg tips</p>
            <p className="text-xs text-muted-foreground mt-1">Zorg ook voor jezelf</p>
          </a>
          <a
            href="https://www.mantelzorg.nl/rechten"
            target="_blank"
            rel="noopener noreferrer"
            className="ker-card hover:border-primary/50 transition-colors"
          >
            <span className="text-2xl block mb-2">⚖️</span>
            <p className="font-medium text-sm">Je rechten</p>
            <p className="text-xs text-muted-foreground mt-1">Waar heb je recht op?</p>
          </a>
          <a
            href="https://www.mantelzorg.nl/financieel"
            target="_blank"
            rel="noopener noreferrer"
            className="ker-card hover:border-primary/50 transition-colors"
          >
            <span className="text-2xl block mb-2">💰</span>
            <p className="font-medium text-sm">Financieel</p>
            <p className="text-xs text-muted-foreground mt-1">Vergoedingen & regelingen</p>
          </a>
        </div>
      </section>

      {/* SECTIE 4: Check-in Status */}
      <section className="mb-8">
        <Link href="/check-in" className="block">
          <div
            className={cn(
              "ker-card text-center py-4",
              data?.checkIns?.weeklyDone
                ? "bg-[var(--accent-green-bg)]"
                : "border-2 border-dashed border-primary/30 hover:border-primary"
            )}
          >
            <span className="text-2xl">{data?.checkIns?.weeklyDone ? "✅" : "📝"}</span>
            <p className="font-medium text-sm mt-2">
              {data?.checkIns?.weeklyDone ? "Check-in gedaan" : "Wekelijkse check-in"}
            </p>
          </div>
        </Link>
      </section>

      {/* SECTIE 5: WhatsApp */}
      <section className="mb-8">
        <div className="ker-card bg-green-50 border-2 border-green-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </div>
            <div>
              <h2 className="font-bold text-green-800">MantelBuddy via WhatsApp</h2>
              <p className="text-sm text-green-700">Gebruik mij ook op je telefoon!</p>
            </div>
          </div>
          <p className="text-sm text-green-800 mb-3">
            Scan de QR code of klik op de button om MantelBuddy toe te voegen aan je WhatsApp.
          </p>
          <a
            href="https://wa.me/14155238886?text=Hoi"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-green-500 text-white font-medium rounded-lg hover:bg-green-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Open WhatsApp chat
          </a>
        </div>
      </section>

      {/* Bemoediging */}
      <div className="text-center py-6">
        <p className="text-muted-foreground font-medium text-lg">
          Je doet het goed 💜
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          Vergeet niet: jouw welzijn is ook belangrijk
        </p>
      </div>
    </div>
  )
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return "Goedemorgen! Hoe voel je je vandaag?"
  if (hour < 18) return "Goedemiddag! Hoe gaat het met je?"
  return "Goedenavond! Hoe was je dag?"
}
