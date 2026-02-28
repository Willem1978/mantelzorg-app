"use client"

import { Suspense, useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { GerAvatar } from "@/components/GerAvatar"
import { DashboardGerChat, type GerChatContext } from "@/components/dashboard/DashboardGerChat"
import { BalansThermometer } from "@/components/dashboard/BalansThermometer"
import { dashboardContent } from "@/config/content"
import { getTaakAdviesTekst } from "@/config/actiekaarten"

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

  // Context voor de Ger chat
  const gerContext: GerChatContext = {
    userName,
    hasTest: data?.test?.hasTest || false,
    hasProfile: data?.user?.profileCompleted || false,
    niveau: data?.test?.niveau,
    score: data?.test?.score,
    zwareTaken: zwareTaken.length,
    needsNewTest: data?.test?.needsNewTest || false,
    checkInDone: data?.checkIns?.weeklyDone || false,
    isFirstVisit: !data?.user?.profileCompleted && !data?.test?.hasTest,
  }

  return (
    <div className="ker-page-content">
      {/* GER CHAT — de primaire interface, neemt het hele scherm in */}
      <DashboardGerChat context={gerContext} />

      {/* BALANSTEST THERMOMETER — alleen tonen als er testresultaten zijn */}
      {data?.test?.hasTest && data.test.score !== undefined && data.test.niveau && (
        <div className="mt-6">
          <BalansThermometer
            score={data.test.score}
            niveau={data.test.niveau}
            zorgtaken={data.test.zorgtaken?.map(t => ({ naam: t.naam, moeilijkheid: t.moeilijkheid }))}
            deelgebieden={data.deelgebieden}
            totaalUren={data.impactScore?.totaalUren}
            daysSinceTest={data.test.daysSinceTest}
          />
        </div>
      )}

      {/* DETAILS — inklapbaar, onder de chat */}

      {/* Zorgtaken details */}
      {data?.test?.zorgtaken && data.test.zorgtaken.length > 0 && (
        <div className="mt-6">
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
                  <p className="text-sm font-semibold text-foreground">Hoe zwaar is het?</p>
                  <span
                    className={cn(
                      "text-sm font-bold px-2.5 py-1 rounded-full",
                      data.impactScore.niveau === "LAAG" && "bg-[var(--accent-green-bg)] text-[var(--accent-green)]",
                      data.impactScore.niveau === "GEMIDDELD" && "bg-[var(--accent-amber-bg)] text-[var(--accent-amber)]",
                      data.impactScore.niveau === "HOOG" && "bg-[var(--accent-red-bg)] text-[var(--accent-red)]"
                    )}
                  >
                    {data.impactScore.niveau === "LAAG" ? "Goed" : data.impactScore.niveau === "GEMIDDELD" ? "Matig" : "Zwaar"}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {data.impactScore.totaalUren} uur zorg per week
                </p>
                {/* Top 3 zwaarste taken */}
                {data.impactScore.perTaak.filter(t => t.impact > 0).slice(0, 3).map((t, i) => (
                  <div key={i} className="flex items-center justify-between mt-2 text-sm">
                    <span className="text-foreground">{t.naam}</span>
                    <span className="text-muted-foreground">{t.uren} uur/week</span>
                  </div>
                ))}
              </div>
            )}

            {/* Zware en matige taken */}
            <div className="space-y-2">
              {zwareTaken.map((taak, i) => {
                const adviesTekst = getTaakAdviesTekst(taak.naam, data?.test?.niveau || "GEMIDDELD")
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
                const adviesTekst = getTaakAdviesTekst(taak.naam, data?.test?.niveau || "GEMIDDELD")
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
        </div>
      )}

      {/* Meer adviezen */}
      {data?.adviezen && data.adviezen.length > 0 && (
        <CollapsibleSection
          title="Adviezen"
          emoji="💡"
          subtitle={`${data.adviezen.length} ${data.adviezen.length === 1 ? "advies" : "adviezen"} voor jou`}
        >
          <div className="space-y-3">
            {data.adviezen.map((advies) => (
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

      {/* SNELLE ACTIES — naar beneden verplaatst */}
      <section className="mt-6 mb-6">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Snelle acties
        </h2>
        <div className="grid grid-cols-3 gap-3">
          <Link href="/belastbaarheidstest">
            <div className="flex flex-col items-center gap-2 p-5 rounded-xl bg-secondary hover:bg-secondary/80 transition-all text-center min-h-[80px]">
              <span className="text-3xl">📊</span>
              <span className="text-sm font-medium text-foreground">Doe de test</span>
            </div>
          </Link>
          <Link href="/leren">
            <div className="flex flex-col items-center gap-2 p-5 rounded-xl bg-secondary hover:bg-secondary/80 transition-all text-center min-h-[80px]">
              <span className="text-3xl">📚</span>
              <span className="text-sm font-medium text-foreground">Lees een artikel</span>
            </div>
          </Link>
          <Link href="/hulpvragen">
            <div className="flex flex-col items-center gap-2 p-5 rounded-xl bg-secondary hover:bg-secondary/80 transition-all text-center min-h-[80px]">
              <span className="text-3xl">🔍</span>
              <span className="text-sm font-medium text-foreground">Vind hulp</span>
            </div>
          </Link>
        </div>
      </section>

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

      {/* WhatsApp — subtiele link onderaan */}
      <div className="text-center py-4 border-t border-border/50 mt-4">
        <a
          href="https://wa.me/14155238886?text=Hoi"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          Ook bereikbaar via WhatsApp
        </a>
      </div>
    </div>
  )
}
