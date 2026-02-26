"use client"

import { Suspense, useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { GerAvatar } from "@/components/GerAvatar"
import { ContextBalk } from "@/components/dashboard/ContextBalk"
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
    zorgtaken?: { id: string; naam: string; uren: number | null; moeilijkheid: string | null }[]
  }
  hulpbronnen?: {
    perTaak: Record<string, { naam: string; telefoon: string | null; website: string | null; beschrijving: string | null }[]>
    voorMantelzorger: { naam: string; telefoon: string | null; website: string | null; beschrijving: string | null }[]
    landelijk: { naam: string; telefoon: string | null; website: string | null; beschrijving: string | null; soortHulp: string | null }[]
    perCategorie: Record<string, { naam: string; telefoon: string | null; website: string | null; beschrijving: string | null }[]>
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
  impactScore?: {
    totaal: number
    totaalUren: number
    niveau: "LAAG" | "GEMIDDELD" | "HOOG"
    perTaak: { naam: string; uren: number; zwaarte: number; impact: number }[]
  } | null
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

  const fromTest = searchParams.get("from") === "test"

  useEffect(() => {
    if (status === "loading") return

    const loadDashboard = async () => {
      try {
        const timestamp = Date.now()
        const res = await fetch(`/api/dashboard?t=${timestamp}`, {
          cache: "no-store",
          headers: { 'Cache-Control': 'no-cache' }
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
  const isZwaar = (m: string | null) =>
    m === 'MOEILIJK' || m === 'ZEER_MOEILIJK' || m === 'JA' || m === 'ja'
  const isMatig = (m: string | null) =>
    m === 'GEMIDDELD' || m === 'SOMS' || m === 'soms'
  const isLicht = (m: string | null) =>
    !m || m === 'MAKKELIJK' || m === 'NEE' || m === 'nee'

  const zwareTaken = data?.test?.zorgtaken?.filter(t => isZwaar(t.moeilijkheid)) || []
  const matigTaken = data?.test?.zorgtaken?.filter(t => isMatig(t.moeilijkheid)) || []
  const lichtTaken = data?.test?.zorgtaken?.filter(t => isLicht(t.moeilijkheid)) || []

  // Bepaal max 3 CTA's op basis van urgentie
  const ctas: { label: string; href: string; emoji: string; variant: "primary" | "secondary" }[] = []

  if (!data?.test?.hasTest) {
    ctas.push({ label: "Start de balanstest", href: "/belastbaarheidstest", emoji: "📊", variant: "primary" })
  } else {
    if (zwareTaken.length > 0) {
      ctas.push({ label: "Hulp zoeken", href: "/hulpvragen?tab=voor-naaste", emoji: "🤝", variant: "primary" })
    }
    if (!data?.checkIns?.weeklyDone) {
      ctas.push({ label: "Check-in doen", href: "/check-in", emoji: "💬", variant: "secondary" })
    }
    if (data?.test?.needsNewTest) {
      ctas.push({ label: "Nieuwe balanstest", href: "/belastbaarheidstest", emoji: "📊", variant: "secondary" })
    }
    if (ctas.length < 3) {
      ctas.push({ label: "Plan je agenda", href: "/agenda", emoji: "📅", variant: "secondary" })
    }
    if (ctas.length < 3) {
      ctas.push({ label: "Bekijk je rapport", href: "/rapport", emoji: "📋", variant: "secondary" })
    }
  }

  // Focuskaart: wat is nu het belangrijkst?
  const topAdvies = data?.adviezen?.[0]

  return (
    <div className="ker-page-content">
      {/* Compacte header */}
      <div className="flex items-center gap-3 mb-3">
        <GerAvatar size="md" />
        <div>
          <h1 className="text-xl font-bold text-foreground">
            {c.greeting(userName)}
          </h1>
          <p className="text-sm text-muted-foreground">
            {getGreeting()}
          </p>
        </div>
      </div>

      {/* CONTEXTBALK — compact statusoverzicht */}
      {data?.test?.hasTest && (
        <ContextBalk
          niveau={data.test.niveau || null}
          score={data.test.score || null}
          totaalUren={data.impactScore?.totaalUren || null}
          impactTotaal={data.impactScore?.totaal || null}
          impactNiveau={data.impactScore?.niveau || null}
          daysSinceTest={data.test.daysSinceTest || null}
          zwareTaken={zwareTaken.length}
          checkInDone={data.checkIns?.weeklyDone || false}
        />
      )}

      {/* FOCUS — 1 kaart met het belangrijkste */}
      {!data?.test?.hasTest ? (
        <section className="mb-6">
          <div className="ker-card">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">{c.geenTest.emoji}</span>
              </div>
              <div className="flex-1">
                <h2 className="font-bold text-lg text-foreground">
                  {c.geenTest.title}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {c.geenTest.subtitle}
                </p>
              </div>
            </div>
          </div>
        </section>
      ) : topAdvies ? (
        <section className="mb-6">
          <div
            className={cn(
              "ker-card border-l-4",
              topAdvies.prioriteit === "hoog" && "border-l-[var(--accent-red)] bg-[var(--accent-red-bg)]",
              topAdvies.prioriteit === "gemiddeld" && "border-l-[var(--accent-amber)] bg-[var(--accent-amber-bg)]",
              topAdvies.prioriteit === "laag" && "border-l-[var(--accent-green)] bg-[var(--accent-green-bg)]"
            )}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl flex-shrink-0">{topAdvies.emoji}</span>
              <div className="flex-1 min-w-0">
                <h2 className="font-bold text-base text-foreground">{topAdvies.titel}</h2>
                <p className="text-sm text-muted-foreground mt-1">{topAdvies.tekst}</p>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {/* MAX 3 CTA'S — grote knoppen */}
      <section className="mb-8">
        <div className="grid gap-2">
          {ctas.slice(0, 3).map((cta, i) => (
            <Link key={i} href={cta.href}>
              <div
                className={cn(
                  "flex items-center gap-3 p-4 rounded-xl transition-all",
                  cta.variant === "primary"
                    ? "bg-primary text-primary-foreground hover:opacity-90"
                    : "bg-secondary hover:bg-secondary/80 text-foreground"
                )}
              >
                <span className="text-xl">{cta.emoji}</span>
                <span className="font-medium">{cta.label}</span>
                <svg className="w-4 h-4 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* DETAILS — inklapbaar */}

      {/* Zorgtaken details */}
      {data?.test?.zorgtaken && data.test.zorgtaken.length > 0 && (
        <CollapsibleSection
          title={c.zorgtaken.sectionTitle}
          emoji={c.zorgtaken.sectionEmoji}
          subtitle={c.zorgtaken.subtitle}
          badge={zwareTaken.length > 0 ? `${zwareTaken.length} zwaar` : undefined}
        >
          {/* Impact-score tonen */}
          {data.impactScore && (
            <div className="ker-card mb-3 p-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-foreground">Zorgdruk</p>
                <span
                  className={cn(
                    "text-xs font-bold px-2 py-0.5 rounded-full",
                    data.impactScore.niveau === "LAAG" && "bg-[var(--accent-green-bg)] text-[var(--accent-green)]",
                    data.impactScore.niveau === "GEMIDDELD" && "bg-[var(--accent-amber-bg)] text-[var(--accent-amber)]",
                    data.impactScore.niveau === "HOOG" && "bg-[var(--accent-red-bg)] text-[var(--accent-red)]"
                  )}
                >
                  {data.impactScore.niveau === "LAAG" ? "Beheersbaar" : data.impactScore.niveau === "GEMIDDELD" ? "Aandacht nodig" : "Te zwaar"}
                </span>
              </div>
              <div className="flex items-baseline gap-3 text-sm text-muted-foreground">
                <span>{data.impactScore.totaalUren} uur/week</span>
                <span>·</span>
                <span>Impact: {data.impactScore.totaal}</span>
              </div>
              {/* Top 3 zwaarste taken */}
              {data.impactScore.perTaak.filter(t => t.impact > 0).slice(0, 3).map((t, i) => (
                <div key={i} className="flex items-center justify-between mt-2 text-xs">
                  <span className="text-foreground">{t.naam}</span>
                  <span className="text-muted-foreground">{t.uren}u × {t.zwaarte} = {t.impact}</span>
                </div>
              ))}
            </div>
          )}

          {/* Zware en matige taken */}
          <div className="space-y-2">
            {zwareTaken.map((taak, i) => {
              const adviesTekst = TAAK_ADVIES[taak.naam] || TAAK_ADVIES._default
              return (
                <Link key={`zwaar-${i}`} href="/hulpvragen?tab=voor-naaste" className="block">
                  <div className="ker-card bg-[var(--accent-red-bg)] border-l-4 border-[var(--accent-red)] hover:shadow-md transition-all py-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-sm">{taak.naam}</span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[var(--accent-red)]/15 text-[var(--accent-red)]">
                        {c.zorgtaken.niveaus.zwaar}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{adviesTekst}</p>
                  </div>
                </Link>
              )
            })}
            {matigTaken.map((taak, i) => {
              const adviesTekst = TAAK_ADVIES[taak.naam] || TAAK_ADVIES._default
              return (
                <Link key={`matig-${i}`} href="/hulpvragen?tab=voor-naaste" className="block">
                  <div className="ker-card bg-[var(--accent-amber-bg)] border-l-4 border-[var(--accent-amber)] hover:shadow-md transition-all py-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-sm">{taak.naam}</span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[var(--accent-amber)]/15 text-[var(--accent-amber)]">
                        {c.zorgtaken.niveaus.matig}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{adviesTekst}</p>
                  </div>
                </Link>
              )
            })}
          </div>

          {lichtTaken.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {lichtTaken.map((taak, i) => (
                <span key={i} className="text-sm bg-[var(--accent-green-bg)] text-foreground px-2.5 py-1 rounded-full">
                  {taak.naam}
                </span>
              ))}
            </div>
          )}
        </CollapsibleSection>
      )}

      {/* Meer adviezen */}
      {data?.adviezen && data.adviezen.length > 1 && (
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

      {/* Aanbevolen artikelen */}
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
        </CollapsibleSection>
      )}
    </div>
  )
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return c.greetings.morning
  if (hour < 18) return c.greetings.afternoon
  return c.greetings.evening
}
