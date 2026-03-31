"use client"

import { Suspense, useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { GerAvatar } from "@/components/GerAvatar"
import { BalansThermometer } from "@/components/dashboard/BalansThermometer"
import { WeekKaartenKaart } from "@/components/dashboard/WeekKaartenKaart"
import { dashboardContent } from "@/config/content"

const c = dashboardContent

interface DashboardData {
  user: {
    name: string
    email: string
    profileCompleted: boolean
    naasteNaam?: string | null
    naasteRelatie?: string | null
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

  return (
    <div className="ker-page-content space-y-6">
      {/* 1. WELKOM HEADER */}
      <div className="flex items-center gap-3">
        <GerAvatar size="sm" className="!w-10 !h-10" />
        <div>
          <h1 className="text-xl font-bold text-foreground">Hoi {userName} 👋</h1>
          <p className="text-sm text-muted-foreground">Hoe gaat het met je?</p>
        </div>
      </div>

      {/* 2. SCOREKAART — als er een test is */}
      {data?.test?.hasTest && data.test.score !== undefined && data.test.niveau ? (
        <BalansThermometer
          score={data.test.score}
          niveau={data.test.niveau}
          zorgtaken={data.test.zorgtaken?.map(t => ({ naam: t.naam, moeilijkheid: t.moeilijkheid }))}
          deelgebieden={data.deelgebieden}
          totaalUren={data.impactScore?.totaalUren}
          daysSinceTest={data.test.daysSinceTest}
          userName={userName}
          naasteNaam={data.user.naasteNaam}
          naasteRelatie={data.user.naasteRelatie}
        />
      ) : (
        /* Geen test nog — prominente CTA */
        <div className="ker-card bg-primary/5 border-primary/20">
          <div className="text-center py-4">
            <span className="text-4xl block mb-3">📊</span>
            <h2 className="text-lg font-bold text-foreground mb-2">Doe de balanstest</h2>
            <p className="text-muted-foreground mb-4">
              In 2 minuten weet je hoe het met je gaat en krijg je persoonlijke tips.
            </p>
            <Link
              href="/belastbaarheidstest"
              className="ker-btn ker-btn-primary inline-flex items-center gap-2 px-6 py-3"
            >
              Start de test
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      )}

      {/* 3. WEEKKAARTEN */}
      {data?.test?.hasTest && <WeekKaartenKaart />}

      {/* 4. RAPPORT LINK — compact */}
      {data?.test?.hasTest && (
        <Link
          href="/rapport"
          className="ker-card flex items-center justify-between group hover:border-primary/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">📋</span>
            <div>
              <p className="font-semibold text-foreground group-hover:text-primary transition-colors">Jouw rapport</p>
              <p className="text-sm text-muted-foreground">Bekijk je volledige resultaten en stappenplan</p>
            </div>
          </div>
          <svg className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      )}
    </div>
  )
}
