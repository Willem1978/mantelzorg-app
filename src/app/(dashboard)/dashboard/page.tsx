"use client"

import { Suspense, useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { GerAvatar } from "@/components/GerAvatar"
import { DashboardGerChat, type GerChatContext } from "@/components/dashboard/DashboardGerChat"
import { BalansThermometer } from "@/components/dashboard/BalansThermometer"
import { dashboardContent } from "@/config/content"

const c = dashboardContent

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
  stappen?: {
    stapNummer: number
    titel: string
    beschrijving: string | null
    emoji: string | null
    organisatie: { id: string; naam: string; telefoon: string | null; website: string | null } | null
    artikel: { id: string; titel: string; categorie: string; emoji: string | null } | null
    externeUrl: string | null
  }[]
}

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

function buildAdviezenActions(data: DashboardData | null): { label: string; emoji: string; href: string }[] {
  const actions: { label: string; emoji: string; href: string }[] = []

  if (data?.adviezen) {
    for (const advies of data.adviezen) {
      if (actions.length >= 3) break
      if (advies.link && advies.linkTekst) {
        actions.push({ label: advies.linkTekst, emoji: advies.emoji, href: advies.link })
      } else {
        actions.push({ label: advies.titel, emoji: advies.emoji, href: "/rapport" })
      }
    }
  }

  if (actions.length < 3 && data?.test?.needsNewTest) {
    actions.push({ label: "Doe de balanstest opnieuw", emoji: "📊", href: "/belastbaarheidstest" })
  }
  if (actions.length < 3 && !data?.checkIns?.weeklyDone) {
    actions.push({ label: "Doe een check-in", emoji: "💬", href: "/check-in" })
  }
  if (actions.length < 3 && !data?.test?.hasTest) {
    actions.push({ label: "Start de balanstest", emoji: "📊", href: "/belastbaarheidstest" })
  }
  if (actions.length < 3) {
    actions.push({ label: "Zoek hulp bij mij in de buurt", emoji: "🔍", href: "/hulpvragen" })
  }
  if (actions.length < 3) {
    actions.push({ label: "Lees tips en artikelen", emoji: "📚", href: "/leren" })
  }
  if (actions.length < 3) {
    actions.push({ label: "Vind een mantelbuddy", emoji: "🤝", href: "/buddys" })
  }

  return actions.slice(0, 3)
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

  const isZwaar = (m: string | null) =>
    m === 'MOEILIJK' || m === 'ZEER_MOEILIJK' || m === 'JA' || m === 'ja'

  const zwareTaken = data?.test?.zorgtaken?.filter(t => isZwaar(t.moeilijkheid)) || []

  const gerContext: GerChatContext = {
    userName,
    hasTest: data?.test?.hasTest || false,
    hasProfile: data?.user?.profileCompleted || false,
    niveau: data?.test?.niveau,
    score: data?.test?.score,
    zwareTaken: zwareTaken.length,
    zwareTaakNaam: zwareTaken[0]?.naam || null,
    needsNewTest: data?.test?.needsNewTest || false,
    checkInDone: data?.checkIns?.weeklyDone || false,
    isFirstVisit: !data?.user?.profileCompleted && !data?.test?.hasTest,
    trend: data?.test?.trend || null,
    wellbeingTrend: data?.checkIns?.wellbeingTrend || null,
    daysSinceTest: data?.test?.daysSinceTest || null,
    openTasks: data?.tasks?.open || 0,
    overdueTasks: data?.tasks?.overdue || 0,
  }

  const adviezenActions = buildAdviezenActions(data)

  return (
    <div className="ker-page-content space-y-6">
      {/* 1. GER CHAT */}
      <DashboardGerChat context={gerContext} />

      {/* 2. COMPACTE BALANSKAART */}
      {data?.test?.hasTest && data.test.score !== undefined && data.test.niveau && (
        <BalansThermometer
          score={data.test.score}
          niveau={data.test.niveau}
          zorgtaken={data.test.zorgtaken?.map(t => ({ naam: t.naam, moeilijkheid: t.moeilijkheid }))}
          deelgebieden={data.deelgebieden}
          totaalUren={data.impactScore?.totaalUren}
          daysSinceTest={data.test.daysSinceTest}
        />
      )}

      {/* 3. JOUW STAPPENPLAN */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Jouw stappen
        </h2>
        {data?.stappen && data.stappen.length > 0 ? (
          <div className="space-y-3">
            {data.stappen.map((stap) => {
              // Bepaal link en label
              let href = "#"
              let linkLabel = ""
              if (stap.organisatie?.website) {
                href = stap.organisatie.website
                linkLabel = stap.organisatie.naam
              } else if (stap.artikel) {
                href = `/leren/${stap.artikel.categorie}`
                linkLabel = stap.artikel.titel
              } else if (stap.externeUrl) {
                href = stap.externeUrl
                linkLabel = "Bekijk meer"
              }

              const isExternal = href.startsWith("http")

              return (
                <div key={stap.stapNummer} className="relative">
                  {isExternal ? (
                    <a href={href} target="_blank" rel="noopener noreferrer" className="block">
                      <StapCard stap={stap} linkLabel={linkLabel} />
                    </a>
                  ) : href !== "#" ? (
                    <Link href={href}>
                      <StapCard stap={stap} linkLabel={linkLabel} />
                    </Link>
                  ) : (
                    <StapCard stap={stap} linkLabel={linkLabel} />
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="space-y-2">
            {adviezenActions.map((action, i) => (
              <Link key={i} href={action.href}>
                <div className="flex items-center gap-3 p-3.5 rounded-xl border-2 border-border bg-card hover:bg-primary/5 hover:border-primary/30 transition-all group">
                  <span className="text-xl w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">{action.emoji}</span>
                  <span className="text-sm font-medium text-foreground flex-1">{action.label}</span>
                  <svg className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* 4. WHATSAPP HULP */}
      <section className="border-t border-border/50 pt-4">
        <div className="flex items-center gap-2 mb-3">
          <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          <span className="text-sm font-medium text-foreground">Hulp via WhatsApp</span>
        </div>

        <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-xl border border-green-200 dark:border-green-800/30">
          <p className="text-sm text-foreground mb-4">
            Scan de QR-code of klik op de knop om Ger via WhatsApp te bereiken. Handig als je liever typt op je telefoon.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            {/* QR Code placeholder */}
            <div className="bg-white p-3 rounded-xl shadow-sm flex-shrink-0">
              <div className="w-32 h-32 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-lg">
                <div className="text-center">
                  <svg className="w-8 h-8 text-green-500 mx-auto mb-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  <span className="text-[10px] text-gray-400">QR code</span>
                </div>
              </div>
            </div>

            {/* Button */}
            <div className="flex-1 text-center sm:text-left">
              <a
                href="https://wa.me/14155238886?text=Hoi"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-3 bg-green-500 hover:bg-green-600 text-white font-medium rounded-xl transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Open WhatsApp
              </a>
              <p className="text-xs text-muted-foreground mt-2">
                Stuur &quot;Hoi&quot; om te beginnen
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

function StapCard({ stap, linkLabel }: {
  stap: {
    stapNummer: number
    titel: string
    beschrijving: string | null
    emoji: string | null
    organisatie: { id: string; naam: string; telefoon: string | null; website: string | null } | null
    artikel: { id: string; titel: string; categorie: string; emoji: string | null } | null
    externeUrl: string | null
  }
  linkLabel: string
}) {
  const stepColors = [
    "bg-primary text-primary-foreground",
    "bg-primary/80 text-primary-foreground",
    "bg-primary/60 text-primary-foreground",
  ]

  return (
    <div className="flex items-start gap-3.5 p-4 rounded-2xl border-2 border-border bg-card hover:bg-primary/5 hover:border-primary/30 transition-all group">
      {/* Stapnummer badge */}
      <div className={`w-9 h-9 rounded-xl ${stepColors[stap.stapNummer - 1] || stepColors[0]} flex items-center justify-center flex-shrink-0 font-bold text-sm shadow-sm`}>
        {stap.stapNummer}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          {stap.emoji && <span className="text-base">{stap.emoji}</span>}
          <h3 className="text-sm font-semibold text-foreground">{stap.titel}</h3>
        </div>
        {stap.beschrijving && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-1">{stap.beschrijving}</p>
        )}
        {linkLabel && (
          <span className="text-xs text-primary font-medium group-hover:underline">{linkLabel}</span>
        )}
      </div>

      {/* Arrow */}
      <svg className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </div>
  )
}
