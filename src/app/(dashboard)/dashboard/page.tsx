"use client"

import { Suspense, useEffect, useState } from "react"
import Image from "next/image"
import { useSession } from "next-auth/react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { GerAvatar } from "@/components/GerAvatar"
import { PageIntro } from "@/components/ui/PageIntro"
import { dashboardContent } from "@/config/content"

const c = dashboardContent

// Inklapbare sectie component
function CollapsibleSection({
  title,
  emoji,
  subtitle,
  defaultOpen = false,
  badge,
  children,
}: {
  title: string
  emoji: string
  subtitle?: string
  defaultOpen?: boolean
  badge?: string | number
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <section className="mb-6">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between mb-3 group"
      >
        <div className="flex items-center gap-2">
          <span className="text-2xl">{emoji}</span>
          <h2 className="text-lg font-bold text-foreground">{title}</h2>
          {badge !== undefined && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
              {badge}
            </span>
          )}
        </div>
        <svg
          className={cn(
            "w-5 h-5 text-muted-foreground transition-transform",
            open && "rotate-180"
          )}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {subtitle && !open && (
        <p className="text-sm text-muted-foreground mb-2 -mt-1">{subtitle}</p>
      )}
      {open && (
        <>
          {subtitle && <p className="text-sm text-muted-foreground mb-3 -mt-1">{subtitle}</p>}
          {children}
        </>
      )}
    </section>
  )
}

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
    lastCheckIn: string | null
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
  deelgebieden?: {
    naam: string
    emoji: string
    score: number
    maxScore: number
    percentage: number
    niveau: "LAAG" | "GEMIDDELD" | "HOOG"
    tip: string
  }[]
  adviezen?: {
    id: string
    titel: string
    tekst: string
    emoji: string
    prioriteit: "hoog" | "gemiddeld" | "laag"
    link?: string
    linkTekst?: string
  }[]
  aanbevolenArtikelen?: {
    id: string
    titel: string
    beschrijving: string
    emoji: string | null
    categorie: string
    url: string | null
  }[]
  mijlpalen?: {
    id: string
    titel: string
    beschrijving: string
    emoji: string
    datum: string | null
    behaald: boolean
  }[]
  gemeenteAdvies?: {
    naam: string
    adviesLaag?: string | null
    adviesGemiddeld?: string | null
    adviesHoog?: string | null
    mantelzorgSteunpunt?: string | null
    mantelzorgSteunpuntNaam?: string | null
    contactTelefoon?: string | null
    websiteUrl?: string | null
    wmoLoketUrl?: string | null
    respijtzorgUrl?: string | null
    dagopvangUrl?: string | null
  } | null
}

// Mapping van taak namen naar categorieën voor hulpbronnen
// Ondersteunt variaties uit web test, WhatsApp test en database
const TAAK_NAAR_CATEGORIE: Record<string, string> = {
  // Persoonlijke verzorging
  'Wassen/aankleden': 'Persoonlijke verzorging',
  'Persoonlijke verzorging': 'Persoonlijke verzorging',
  'Toiletgang': 'Persoonlijke verzorging',
  'Medicijnen': 'Persoonlijke verzorging',
  'Toezicht': 'Persoonlijke verzorging',
  'Medische zorg': 'Persoonlijke verzorging',
  // Huishoudelijke taken
  'Huishouden': 'Huishoudelijke taken',
  'Huishoudelijke taken': 'Huishoudelijke taken',
  // Vervoer
  'Vervoer': 'Vervoer',
  'Vervoer/begeleiding': 'Vervoer',
  // Administratie
  'Administratie': 'Administratie en aanvragen',
  'Administratie en aanvragen': 'Administratie en aanvragen',
  // Sociaal contact
  'Sociaal contact': 'Sociaal contact en activiteiten',
  'Sociaal contact en activiteiten': 'Sociaal contact en activiteiten',
  'Activiteiten': 'Sociaal contact en activiteiten',
  // Maaltijden - alle variaties
  'Maaltijden': 'Bereiden en/of nuttigen van maaltijden',
  'Eten maken': 'Bereiden en/of nuttigen van maaltijden',
  'Eten en drinken': 'Bereiden en/of nuttigen van maaltijden',
  // Boodschappen
  'Boodschappen': 'Boodschappen',
  // Klusjes - alle variaties
  'Klusjes': 'Klusjes in en om het huis',
  'Klusjes in huis': 'Klusjes in en om het huis',
  'Klusjes in en om huis': 'Klusjes in en om het huis',
  'Klusjes in/om huis': 'Klusjes in en om het huis',
  'Klusjes in en om het huis': 'Klusjes in en om het huis',
}

// Taak-niveau advies: per taak concreet advies en alternatieven
const TAAK_ADVIES: Record<string, string> = {
  'Wassen/aankleden': 'Thuiszorg kan helpen met persoonlijke verzorging. Vraag bij je gemeente naar een PGB of indicatie.',
  'Persoonlijke verzorging': 'Thuiszorg kan helpen met persoonlijke verzorging. Vraag bij je gemeente naar een PGB of indicatie.',
  'Toiletgang': 'Een ergotherapeut kan hulpmiddelen adviseren. Thuiszorg kan ondersteunen bij toiletgang.',
  'Medicijnen': 'Een apotheek kan medicatie klaarzetten in weekdozen. Thuiszorg kan helpen met toediening.',
  'Toezicht': 'Dagopvang biedt toezicht overdag. Thuiszorg kan ook toezicht bieden op vaste tijden.',
  'Medische zorg': 'Thuiszorg kan medische handelingen overnemen. Vraag je huisarts om een indicatie.',
  'Huishouden': 'Hulp bij het huishouden kun je aanvragen via je gemeente (WMO). Er zijn ook particuliere diensten.',
  'Huishoudelijke taken': 'Hulp bij het huishouden kun je aanvragen via je gemeente (WMO). Er zijn ook particuliere diensten.',
  'Vervoer': 'Regiotaxi of vrijwillige vervoersdiensten kunnen helpen. Vraag bij je gemeente naar vervoersvoorzieningen.',
  'Vervoer/begeleiding': 'Regiotaxi of vrijwillige vervoersdiensten kunnen helpen. Vraag bij je gemeente naar vervoersvoorzieningen.',
  'Administratie': 'MEE of het sociaal wijkteam kan helpen met administratie en formulieren.',
  'Administratie en aanvragen': 'MEE of het sociaal wijkteam kan helpen met administratie en formulieren.',
  'Sociaal contact': 'Dagbesteding of een maatje-project kan sociaal contact bieden aan je naaste.',
  'Sociaal contact en activiteiten': 'Dagbesteding of een maatje-project kan sociaal contact bieden aan je naaste.',
  'Maaltijden': 'Tafeltje Dekje of maaltijdservice kan warme maaltijden bezorgen.',
  'Eten maken': 'Tafeltje Dekje of maaltijdservice kan warme maaltijden bezorgen.',
  'Eten en drinken': 'Tafeltje Dekje of maaltijdservice kan warme maaltijden bezorgen.',
  'Boodschappen': 'Online boodschappen bestellen of een vrijwilliger vragen om te helpen.',
  'Klusjes': 'Gemeente of woningcorporatie heeft vaak een klussendienst. Vrijwilligers kunnen ook helpen.',
  'Klusjes in huis': 'Gemeente of woningcorporatie heeft vaak een klussendienst. Vrijwilligers kunnen ook helpen.',
  'Klusjes in en om huis': 'Gemeente of woningcorporatie heeft vaak een klussendienst. Vrijwilligers kunnen ook helpen.',
  'Klusjes in/om huis': 'Gemeente of woningcorporatie heeft vaak een klussendienst. Vrijwilligers kunnen ook helpen.',
  'Klusjes in en om het huis': 'Gemeente of woningcorporatie heeft vaak een klussendienst. Vrijwilligers kunnen ook helpen.',
  '_default': 'Er is hulp beschikbaar voor deze taak. Bekijk welke opties er zijn in jouw buurt.',
}

// Wrapper component voor Suspense boundary
export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="ker-page-content flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    }>
      <DashboardContentView />
    </Suspense>
  )
}

function DashboardContentView() {
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

  if (!data && status === "unauthenticated") {
    return (
      <div className="ker-page-content">
        <div className="ker-card bg-primary/5 text-center">
          <div className="flex justify-center mb-4">
            <GerAvatar size="lg" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">{c.loggedOut.title}</h1>
          <p className="text-muted-foreground mb-6">{c.loggedOut.subtitle}</p>
          <Link
            href="/api/auth/signin"
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground font-medium rounded-lg hover:opacity-90 transition-opacity"
          >
            {c.loggedOut.loginButton}
          </Link>
        </div>
      </div>
    )
  }

  // Bereken zware taken
  // Database kan twee formats hebben:
  // 1. Web test: MOEILIJK/ZEER_MOEILIJK/GEMIDDELD/MAKKELIJK
  // 2. WhatsApp test: JA/SOMS/NEE
  const isZwaar = (m: string | null) =>
    m === 'MOEILIJK' || m === 'ZEER_MOEILIJK' || m === 'JA' || m === 'ja'
  const isMatig = (m: string | null) =>
    m === 'GEMIDDELD' || m === 'SOMS' || m === 'soms'
  const isLicht = (m: string | null) =>
    !m || m === 'MAKKELIJK' || m === 'NEE' || m === 'nee'

  const zwareTaken = data?.test?.zorgtaken?.filter(t => isZwaar(t.moeilijkheid)) || []
  const matigTaken = data?.test?.zorgtaken?.filter(t => isMatig(t.moeilijkheid)) || []
  const lichtTaken = data?.test?.zorgtaken?.filter(t => isLicht(t.moeilijkheid)) || []

  return (
    <div className="ker-page-content">
      {/* Header met Ger */}
      <div className="flex items-center gap-4 mb-4">
        <GerAvatar size="lg" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {c.greeting(userName)}
          </h1>
          <p className="text-muted-foreground mt-1">
            {getGreeting()}
          </p>
        </div>
      </div>

      {/* C2.1: Warme welkomsttekst */}
      <PageIntro tekst={c.pageIntro} />

          {/* SECTIE 1: Jouw Balans */}
          {data?.test?.hasTest ? (
            <section className="mb-8">
          {/* Score Card — persoonlijk en warm */}
          <div className="ker-card overflow-hidden">
            {/* Header: persoonlijke titel */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-bold text-lg text-foreground">
                  {data.test.niveau && `${c.scoreMessages[data.test.niveau].kort} ${c.scoreMessages[data.test.niveau].emoji}`}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {data.test.daysSinceTest === 0 ? c.tijd.vandaag : c.tijd.dagenGeleden(data.test.daysSinceTest || 0)}
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                {data.test.niveau && c.scoreMessages[data.test.niveau].uitleg}
              </p>
            </div>

            {/* Score + Thermometer */}
            <div className="relative">
              <div className="flex justify-between items-end mb-2">
                <span
                  className={cn(
                    "text-3xl font-bold",
                    data.test.niveau === "LAAG" && "text-[var(--accent-green)]",
                    data.test.niveau === "GEMIDDELD" && "text-[var(--accent-amber)]",
                    data.test.niveau === "HOOG" && "text-[var(--accent-red)]"
                  )}
                >
                  {data.test.score}
                  <span className="text-lg font-normal text-muted-foreground">{c.score.maxScore}</span>
                </span>
              </div>

              {/* Thermometer balk */}
              <div className="relative h-6 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn(
                    "absolute left-0 top-0 h-full rounded-full transition-all duration-500",
                    data.test.niveau === "LAAG" && "bg-[var(--accent-green)]",
                    data.test.niveau === "GEMIDDELD" && "bg-[var(--accent-amber)]",
                    data.test.niveau === "HOOG" && "bg-[var(--accent-red)]"
                  )}
                  style={{ width: `${((data.test.score || 0) / 24) * 100}%` }}
                />
                <div className="absolute inset-0 flex">
                  <div className="flex-1 border-r border-white/30" />
                  <div className="flex-1 border-r border-white/30" />
                  <div className="flex-1" />
                </div>
              </div>
            </div>

            {/* Deelgebied-scores — Energie, Gevoel, Tijd */}
            {data.deelgebieden && data.deelgebieden.length > 0 && (
              <div className="mt-5 pt-4 border-t border-border/50">
                <p className="text-sm font-semibold text-foreground mb-3">Jouw scores per gebied</p>
                <div className="grid grid-cols-3 gap-2">
                  {data.deelgebieden.map((dg) => (
                    <div
                      key={dg.naam}
                      className={cn(
                        "rounded-xl p-3 text-center",
                        dg.niveau === "LAAG" && "bg-[var(--accent-green-bg)]",
                        dg.niveau === "GEMIDDELD" && "bg-[var(--accent-amber-bg)]",
                        dg.niveau === "HOOG" && "bg-[var(--accent-red-bg)]"
                      )}
                    >
                      <p className="text-lg mb-0.5">{dg.emoji}</p>
                      <p
                        className={cn(
                          "text-xs font-semibold",
                          dg.niveau === "LAAG" && "text-[var(--accent-green)]",
                          dg.niveau === "GEMIDDELD" && "text-[var(--accent-amber)]",
                          dg.niveau === "HOOG" && "text-[var(--accent-red)]"
                        )}
                      >
                        {dg.naam}
                      </p>
                      <div className="mt-1.5 h-1.5 bg-white/50 dark:bg-white/10 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full",
                            dg.niveau === "LAAG" && "bg-[var(--accent-green)]",
                            dg.niveau === "GEMIDDELD" && "bg-[var(--accent-amber)]",
                            dg.niveau === "HOOG" && "bg-[var(--accent-red)]"
                          )}
                          style={{ width: `${dg.percentage}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1">{dg.percentage}%</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Jouw taken — kleurblokken */}
            {(data.test.zorgtaken?.length || 0) > 0 && (
              <div className="mt-5 pt-4 border-t border-border/50">
                <p className="text-sm font-semibold text-foreground mb-3">{c.zorgtaken.title}</p>
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-xl bg-[var(--accent-green-bg)] p-3 text-center">
                    <p className="text-2xl font-bold text-[var(--accent-green)]">{lichtTaken.length}</p>
                    <p className="text-sm text-[var(--accent-green)] font-medium">{c.zorgtaken.niveaus.licht}</p>
                  </div>
                  <div className="rounded-xl bg-[var(--accent-amber-bg)] p-3 text-center">
                    <p className="text-2xl font-bold text-[var(--accent-amber)]">{matigTaken.length}</p>
                    <p className="text-sm text-[var(--accent-amber)] font-medium">{c.zorgtaken.niveaus.matig}</p>
                  </div>
                  <div className="rounded-xl bg-[var(--accent-red-bg)] p-3 text-center">
                    <p className="text-2xl font-bold text-[var(--accent-red)]">{zwareTaken.length}</p>
                    <p className="text-sm text-[var(--accent-red)] font-medium">{c.zorgtaken.niveaus.zwaar}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Bekijk rapport link */}
            <Link
              href="/rapport"
              className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-border/50 text-sm font-medium text-primary hover:underline"
            >
              {c.score.bekijkResultaten}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

        </section>
      ) : (
        <section className="mb-8">
          <div className="ker-card">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                <span className="text-3xl">{c.geenTest.emoji}</span>
              </div>
              <div className="flex-1">
                <h2 className="font-bold text-xl text-foreground">
                  {c.geenTest.title}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {c.geenTest.subtitle}
                </p>
              </div>
            </div>
            <Link
              href="/belastbaarheidstest"
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground font-medium rounded-lg hover:opacity-90 transition-opacity"
            >
              {c.geenTest.button}
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </section>
      )}


          {/* SECTIE 2: Jouw volgende stap — 1 prominente actie + overige samenvouwbaar */}
          {data?.adviezen && data.adviezen.length > 0 && (
            <section className="mb-6">
              {/* Prominente eerste actie */}
              {(() => {
                const topAdvies = data.adviezen[0]
                return (
                  <div
                    className={cn(
                      "ker-card border-l-4 mb-3",
                      topAdvies.prioriteit === "hoog" && "border-l-[var(--accent-red)] bg-[var(--accent-red-bg)]",
                      topAdvies.prioriteit === "gemiddeld" && "border-l-[var(--accent-amber)] bg-[var(--accent-amber-bg)]",
                      topAdvies.prioriteit === "laag" && "border-l-[var(--accent-green)] bg-[var(--accent-green-bg)]"
                    )}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">🎯</span>
                      <h2 className="text-base font-bold text-foreground">Jouw volgende stap</h2>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-2xl flex-shrink-0">{topAdvies.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm text-foreground">{topAdvies.titel}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{topAdvies.tekst}</p>
                        {topAdvies.link && topAdvies.linkTekst && (
                          <Link
                            href={topAdvies.link}
                            className={cn(
                              "inline-flex items-center gap-1.5 mt-3 text-sm font-medium rounded-lg px-4 py-2 transition-colors",
                              topAdvies.prioriteit === "hoog" && "bg-[var(--accent-red)] text-white hover:opacity-90",
                              topAdvies.prioriteit === "gemiddeld" && "bg-[var(--accent-amber)] text-white hover:opacity-90",
                              topAdvies.prioriteit === "laag" && "bg-[var(--accent-green)] text-white hover:opacity-90"
                            )}
                          >
                            {topAdvies.linkTekst}
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })()}

              {/* Overige adviezen — inklapbaar */}
              {data.adviezen.length > 1 && (
                <CollapsibleSection
                  title="Meer adviezen"
                  emoji="💡"
                  subtitle={`${data.adviezen.length - 1} extra ${data.adviezen.length - 1 === 1 ? "advies" : "adviezen"} voor jou`}
                >
                  <div className="space-y-3">
                    {data.adviezen.slice(1).map((advies) => (
                      <div
                        key={advies.id}
                        className={cn(
                          "ker-card border-l-4",
                          advies.prioriteit === "hoog" && "border-l-[var(--accent-red)] bg-[var(--accent-red-bg)]",
                          advies.prioriteit === "gemiddeld" && "border-l-[var(--accent-amber)] bg-[var(--accent-amber-bg)]",
                          advies.prioriteit === "laag" && "border-l-[var(--accent-green)] bg-[var(--accent-green-bg)]"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-2xl flex-shrink-0">{advies.emoji}</span>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm text-foreground">{advies.titel}</h3>
                            <p className="text-sm text-muted-foreground mt-1">{advies.tekst}</p>
                            {advies.link && advies.linkTekst && (
                              <Link
                                href={advies.link}
                                className="inline-flex items-center gap-1 mt-2 text-sm font-medium text-primary hover:underline"
                              >
                                {advies.linkTekst}
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CollapsibleSection>
              )}
            </section>
          )}

          {/* SECTIE 3: Zorgtaken — zware/matige taken altijd zichtbaar, lichte inklapbaar */}
          {data?.test?.zorgtaken && data.test.zorgtaken.length > 0 && (
            <section className="mb-6">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2 mb-3">
                <span className="text-2xl">{c.zorgtaken.sectionEmoji}</span> {c.zorgtaken.sectionTitle}
              </h2>

              {/* Zware en matige taken — altijd zichtbaar met taak-advies */}
              {(zwareTaken.length > 0 || matigTaken.length > 0) && (
                <div className="space-y-3 mb-3">
                  {zwareTaken.map((taak, i) => {
                    const categorie = TAAK_NAAR_CATEGORIE[taak.naam]
                    const hulpbronnen = categorie ? (data?.hulpbronnen?.perCategorie?.[categorie] || []) : []
                    const aantalHulp = hulpbronnen.length
                    const hulpLink = categorie
                      ? `/hulpvragen?tab=voor-naaste&categorie=${encodeURIComponent(categorie)}`
                      : '/hulpvragen?tab=voor-naaste'
                    const adviesTekst = TAAK_ADVIES[taak.naam] || TAAK_ADVIES._default

                    return (
                      <Link key={`zwaar-${i}`} href={hulpLink} className="block">
                        <div className="ker-card bg-[var(--accent-red-bg)] border-l-4 border-[var(--accent-red)] hover:shadow-md transition-all">
                          <div className="flex items-start justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm">{taak.naam}</span>
                              {taak.uren && <span className="text-xs text-muted-foreground">{c.zorgtaken.urenPerWeek(taak.uren)}</span>}
                            </div>
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[var(--accent-red)]/15 text-[var(--accent-red)]">
                              {c.zorgtaken.niveaus.zwaar}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">{adviesTekst}</p>
                          <div className="flex items-center gap-2 text-xs font-medium text-primary">
                            <span>🤝</span>
                            <span>{aantalHulp > 0 ? c.zorgtaken.hulpbronCount(aantalHulp) : c.zorgtaken.zoekHulp}</span>
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>
                      </Link>
                    )
                  })}

                  {matigTaken.map((taak, i) => {
                    const categorie = TAAK_NAAR_CATEGORIE[taak.naam]
                    const hulpbronnen = categorie ? (data?.hulpbronnen?.perCategorie?.[categorie] || []) : []
                    const aantalHulp = hulpbronnen.length
                    const hulpLink = categorie
                      ? `/hulpvragen?tab=voor-naaste&categorie=${encodeURIComponent(categorie)}`
                      : '/hulpvragen?tab=voor-naaste'
                    const adviesTekst = TAAK_ADVIES[taak.naam] || TAAK_ADVIES._default

                    return (
                      <Link key={`matig-${i}`} href={hulpLink} className="block">
                        <div className="ker-card bg-[var(--accent-amber-bg)] border-l-4 border-[var(--accent-amber)] hover:shadow-md transition-all">
                          <div className="flex items-start justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm">{taak.naam}</span>
                              {taak.uren && <span className="text-xs text-muted-foreground">{c.zorgtaken.urenPerWeek(taak.uren)}</span>}
                            </div>
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[var(--accent-amber)]/15 text-[var(--accent-amber)]">
                              {c.zorgtaken.niveaus.matig}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">{adviesTekst}</p>
                          <div className="flex items-center gap-2 text-xs font-medium text-primary">
                            <span>🤝</span>
                            <span>{aantalHulp > 0 ? c.zorgtaken.hulpbronCount(aantalHulp) : c.zorgtaken.zoekHulp}</span>
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}

              {/* Lichte taken — compact, altijd ingeklapt */}
              {lichtTaken.length > 0 && (
                <CollapsibleSection
                  title={c.zorgtaken.goedeTaken}
                  emoji="💚"
                  badge={lichtTaken.length}
                >
                  <div className="flex flex-wrap gap-2">
                    {lichtTaken.map((taak, i) => (
                      <span key={i} className="text-sm bg-[var(--accent-green-bg)] text-foreground px-2.5 py-1 rounded-full">
                        {taak.naam}
                      </span>
                    ))}
                  </div>
                </CollapsibleSection>
              )}
            </section>
          )}

          {/* SECTIE 4: Aanbevolen artikelen — inklapbaar */}
          {data?.aanbevolenArtikelen && data.aanbevolenArtikelen.length > 0 && (
            <CollapsibleSection
              title={c.artikelen.title}
              emoji={c.artikelen.emoji}
              subtitle={
                data.test?.niveau
                  ? c.artikelen.perNiveau[data.test.niveau]
                  : c.artikelen.default
              }
              badge={data.aanbevolenArtikelen.length}
            >
              <div className="space-y-2">
                {data.aanbevolenArtikelen.map((artikel) => (
                  <Link
                    key={artikel.id}
                    href={`/leren/${artikel.categorie}`}
                    className="block"
                  >
                    <div className="ker-card hover:border-primary/50 transition-all py-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl flex-shrink-0">{artikel.emoji || "📄"}</span>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm truncate">{artikel.titel}</h3>
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {artikel.beschrijving}
                          </p>
                        </div>
                        <svg className="w-4 h-4 text-muted-foreground flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
              <Link
                href="/leren"
                className="flex items-center justify-center gap-1 mt-3 text-sm font-medium text-primary hover:underline"
              >
                {c.artikelen.meerBekijken}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </CollapsibleSection>
          )}

          {/* SECTIE 5: WhatsApp — inklapbaar */}
          <CollapsibleSection
            title={c.whatsapp.title}
            emoji="💬"
            subtitle={c.whatsapp.subtitle}
          >
            <div className="ker-card bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800">
              {/* QR Code */}
              <div className="flex justify-center mb-4">
                <div className="bg-white p-3 rounded-xl shadow-sm">
                  <Image
                    src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://wa.me/14155238886?text=Hoi"
                    alt={c.whatsapp.qrAlt}
                    width={120}
                    height={120}
                    className="rounded-lg"
                    unoptimized
                  />
                </div>
              </div>

              {/* WhatsApp knop */}
              <a
                href="https://wa.me/14155238886?text=Hoi"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 bg-green-500 text-white font-medium rounded-lg hover:bg-green-600 transition-colors min-h-[48px]"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                {c.whatsapp.openButton}
              </a>
            </div>
          </CollapsibleSection>
    </div>
  )
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return c.greetings.morning
  if (hour < 18) return c.greetings.afternoon
  return c.greetings.evening
}
