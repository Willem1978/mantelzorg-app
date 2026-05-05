"use client"

import { Suspense, useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { GerAvatar } from "@/components/GerAvatar"
import { DashboardGerChat, type GerChatContext } from "@/components/dashboard/DashboardGerChat"
import { BalansThermometer } from "@/components/dashboard/BalansThermometer"
import { ActiepuntenKaart } from "@/components/dashboard/ActiepuntenKaart"
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

  return (
    <div className="ker-page-content space-y-6">
      {/* 1. GER CHAT */}
      <DashboardGerChat context={gerContext} />

      {/* PROFIEL HERINNERING — toon als profiel niet compleet is */}
      {data?.user && !data.user.profileCompleted && (
        <ProfielHerinnering />
      )}

      {/* 3. COMPACTE BALANSKAART */}
      {data?.test?.hasTest && data.test.score !== undefined && data.test.niveau && (
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
      )}

      {/* 4. WEEKKAARTEN — "Deze week voor jou" */}
      {data?.test?.hasTest && <WeekKaartenKaart />}

      {/* 5. ACTIEPUNTEN */}
      <ActiepuntenKaart />
    </div>
  )
}

// ============================================
// PROFIEL HERINNERING — zachte nudge op dashboard
// ============================================
function ProfielHerinnering() {
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const count = parseInt(localStorage.getItem("profiel-herinnering-dismissed") || "0", 10)
    if (count >= 3) setDismissed(true)
  }, [])

  const handleDismiss = () => {
    const count = parseInt(localStorage.getItem("profiel-herinnering-dismissed") || "0", 10)
    localStorage.setItem("profiel-herinnering-dismissed", String(count + 1))
    setDismissed(true)
  }

  if (dismissed) return null

  return (
    <div className="ker-card bg-primary/5 border-primary/20">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <span className="text-xl">&#128203;</span>
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-foreground">Vul je profiel aan</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Hoe meer we over je weten, hoe persoonlijker onze tips en artikelen. Het kost maar 2 minuten.
          </p>
          <div className="flex items-center gap-3 mt-3">
            <Link
              href="/profiel"
              className="ker-btn ker-btn-primary text-sm py-2 px-4"
            >
              Profiel invullen
            </Link>
            <button
              onClick={handleDismiss}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Niet nu
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

