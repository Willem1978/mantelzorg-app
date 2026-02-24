"use client"

import { Suspense, useEffect, useState } from "react"
import Image from "next/image"
import { useSession } from "next-auth/react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { cn, ensureAbsoluteUrl } from "@/lib/utils"
import { GerAvatar } from "@/components/GerAvatar"
import { PageIntro } from "@/components/ui/PageIntro"

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

  if (!data && status === "unauthenticated") {
    return (
      <div className="ker-page-content">
        <div className="flex items-center gap-4 mb-6">
          <GerAvatar size="lg" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Welkom!</h1>
            <p className="text-muted-foreground mt-1">Log in om je dashboard te zien.</p>
          </div>
        </div>
        <Link
          href="/api/auth/signin"
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground font-medium rounded-lg hover:opacity-90 transition-opacity"
        >
          Inloggen
        </Link>
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
            Hoi {userName}!
          </h1>
          <p className="text-muted-foreground mt-1">
            {getGreeting()}
          </p>
        </div>
      </div>

      {/* C2.1: Warme welkomsttekst */}
      <PageIntro tekst="Hier zie je in een oogopslag hoe het met je gaat en wat je kunt doen. Scroll naar beneden voor tips en hulp." />

          {/* SECTIE 1: Jouw Balans */}
          {data?.test?.hasTest ? (
            <section className="mb-8">
          {/* Score Card — persoonlijk en warm */}
          <div className="ker-card overflow-hidden">
            {/* Header: persoonlijke titel */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-bold text-lg text-foreground">
                  {data.test.niveau === "LAAG" && "Je houdt het goed vol 💚"}
                  {data.test.niveau === "GEMIDDELD" && "Je doet heel veel 🧡"}
                  {data.test.niveau === "HOOG" && "Je doet te veel ❤️"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {data.test.daysSinceTest === 0 ? "Vandaag" : `${data.test.daysSinceTest}d geleden`}
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                {data.test.niveau === "LAAG" && "Goed bezig! Je balans is in orde. Blijf goed op jezelf letten en neem af en toe bewust een moment van rust. Zo houd je het vol op de lange termijn."}
                {data.test.niveau === "GEMIDDELD" && "Je draagt veel op je schouders en dat is niet niks. Het is verstandig om te kijken of iemand je ergens mee kan helpen. Denk aan familie, buren, of professionele ondersteuning in je gemeente. Kleine stappen maken al een groot verschil."}
                {data.test.niveau === "HOOG" && "Je hebt heel veel op je bordje en dat vraagt te veel van je. Het is belangrijk dat je hier niet alleen mee doorgaat. Neem contact op met een mantelzorgondersteuner in je gemeente of bel de Mantelzorglijn (030 - 205 90 59, gratis). Zij kunnen samen met jou kijken wat er mogelijk is."}
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
                  <span className="text-lg font-normal text-muted-foreground">/24</span>
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

            {/* Jouw taken — kleurblokken */}
            {(data.test.zorgtaken?.length || 0) > 0 && (
              <div className="mt-5 pt-4 border-t border-border/50">
                <p className="text-sm font-semibold text-foreground mb-3">Jouw zorgtaken</p>
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-xl bg-[var(--accent-green-bg)] p-3 text-center">
                    <p className="text-2xl font-bold text-[var(--accent-green)]">{lichtTaken.length}</p>
                    <p className="text-sm text-[var(--accent-green)] font-medium">Gaan goed</p>
                  </div>
                  <div className="rounded-xl bg-[var(--accent-amber-bg)] p-3 text-center">
                    <p className="text-2xl font-bold text-[var(--accent-amber)]">{matigTaken.length}</p>
                    <p className="text-sm text-[var(--accent-amber)] font-medium">Matig</p>
                  </div>
                  <div className="rounded-xl bg-[var(--accent-red-bg)] p-3 text-center">
                    <p className="text-2xl font-bold text-[var(--accent-red)]">{zwareTaken.length}</p>
                    <p className="text-sm text-[var(--accent-red)] font-medium">Zwaar</p>
                  </div>
                </div>
              </div>
            )}

            {/* Bekijk rapport link */}
            <Link
              href="/rapport"
              className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-border/50 text-sm font-medium text-primary hover:underline"
            >
              Bekijk volledig rapport
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


              {/* SECTIE 3: Je Zorgtaken met Hulp */}
          {data?.test?.zorgtaken && data.test.zorgtaken.length > 0 && (
            <section className="mb-8">
            <div className="mb-4">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2 mb-2">
                <span className="text-2xl">📋</span> Je Zorgtaken
              </h2>
              <p className="text-sm text-muted-foreground">
                Dit zijn de taken die je doet. Bij rode en oranje taken kun je hulp zoeken.
                Tik op een taak voor hulp bij jou in de buurt.
              </p>
            </div>

            <div className="space-y-3">
            {/* Zware taken eerst */}
            {zwareTaken.map((taak, i) => {
              const categorie = TAAK_NAAR_CATEGORIE[taak.naam]
              const hulpbronnen = categorie ? (data?.hulpbronnen?.perCategorie?.[categorie] || []) : []
              const aantalHulp = hulpbronnen.length
              // Link naar hulpvragen met tab en categorie pre-geselecteerd
              const hulpLink = categorie
                ? `/hulpvragen?tab=voor-naaste&categorie=${encodeURIComponent(categorie)}`
                : '/hulpvragen?tab=voor-naaste'

              return (
                <Link key={`zwaar-${i}`} href={hulpLink} className="block">
                  <div className="ker-card bg-[var(--accent-red-bg)] border-[3px] border-[var(--accent-red)] hover:shadow-md transition-all">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{taak.naam}</span>
                        {taak.uren && <span className="text-sm text-muted-foreground">({taak.uren}u/week)</span>}
                      </div>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[var(--accent-red)]/15 text-[var(--accent-red)]">
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
              // Link naar hulpvragen met tab en categorie pre-geselecteerd
              const hulpLink = categorie
                ? `/hulpvragen?tab=voor-naaste&categorie=${encodeURIComponent(categorie)}`
                : '/hulpvragen?tab=voor-naaste'

              return (
                <Link key={`matig-${i}`} href={hulpLink} className="block">
                  <div className="ker-card bg-[var(--accent-amber-bg)] border-[3px] border-[var(--accent-amber)] hover:shadow-md transition-all">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{taak.naam}</span>
                        {taak.uren && <span className="text-sm text-muted-foreground">({taak.uren}u/week)</span>}
                      </div>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[var(--accent-amber)]/15 text-[var(--accent-amber)]">
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
              <div className="ker-card bg-[var(--accent-green-bg)] border-[3px] border-[var(--accent-green)]">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-medium text-foreground">Taken die goed gaan</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[var(--accent-green)]/15 text-[var(--accent-green)]">
                    {lichtTaken.length}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {lichtTaken.map((taak, i) => (
                    <span key={i} className="text-sm bg-white/50 dark:bg-white/10 px-2.5 py-1 rounded-full">
                      {taak.naam}
                    </span>
                  ))}
                </div>
              </div>
            )}
            </div>
          </section>
        )}


          {/* SECTIE 4: Aanbevolen voor jou */}
          {data?.aanbevolenArtikelen && data.aanbevolenArtikelen.length > 0 && (
            <section className="mb-8">
              <div className="mb-4">
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2 mb-2">
                  <span className="text-2xl">💡</span> Aanbevolen voor jou
                </h2>
                <p className="text-sm text-muted-foreground">
                  {data.test?.niveau === "LAAG" && "Tips om het goed te blijven doen."}
                  {data.test?.niveau === "GEMIDDELD" && "Artikelen die je nu kunnen helpen."}
                  {data.test?.niveau === "HOOG" && "Belangrijke informatie voor jou."}
                  {!data.test?.niveau && "Artikelen die voor jou interessant kunnen zijn."}
                </p>
              </div>
              <div className="space-y-2">
                {data.aanbevolenArtikelen.map((artikel) => (
                  <Link
                    key={artikel.id}
                    href={artikel.url ? ensureAbsoluteUrl(artikel.url) : `/leren/${artikel.categorie}`}
                    target={artikel.url ? "_blank" : undefined}
                    rel={artikel.url ? "noopener noreferrer" : undefined}
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
                Bekijk alle artikelen
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </section>
          )}

          {/* SECTIE: WhatsApp met QR code */}
          <section className="mb-8">
            <div className="ker-card bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </div>
                <h2 className="font-bold text-base text-foreground">Gebruik MantelBuddy ook via WhatsApp</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Scan de QR code met je telefoon, of tik op de knop als je al op je telefoon zit.
              </p>

              {/* QR Code */}
              <div className="flex justify-center mb-4">
                <div className="bg-white p-3 rounded-xl shadow-sm">
                  <Image
                    src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://wa.me/14155238886?text=Hoi"
                    alt="Scan QR code om WhatsApp te starten"
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
                Open WhatsApp
              </a>
            </div>
          </section>
    </div>
  )
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return "Goedemorgen! Hoe voel je je vandaag?"
  if (hour < 18) return "Goedemiddag! Hoe gaat het met je?"
  return "Goedenavond! Hoe was je dag?"
}
