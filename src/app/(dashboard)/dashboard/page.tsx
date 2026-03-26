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

      {/* 2. ARTIKELEN VOOR JOU — aanbevelingen + gelezen/rating */}
      {data?.aanbevolenArtikelen && data.aanbevolenArtikelen.length > 0 && (
        <ArtikelenVoorJou artikelen={data.aanbevolenArtikelen} />
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

      {/* 6. WHATSAPP HULP — met QR code */}
      <div className="ker-card bg-green-50/60 dark:bg-green-950/10 border border-green-200/40 dark:border-green-800/20">
        <div className="flex items-center gap-4">
          {/* QR Code */}
          <div className="flex-shrink-0">
            <div className="w-20 h-20 bg-white rounded-xl p-1.5 shadow-sm">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent("https://wa.me/14155238886?text=Hoi")}&format=svg`}
                alt="Scan om te chatten via WhatsApp"
                className="w-full h-full"
                width={68}
                height={68}
              />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </div>
              <p className="text-base font-semibold text-foreground">Ger via WhatsApp</p>
            </div>
            <p className="text-sm text-foreground/70 leading-snug">
              Scan de QR-code of tik hieronder om Ger te openen op je telefoon.
            </p>
            <a
              href="https://wa.me/14155238886?text=Hoi"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 mt-2 text-sm font-semibold text-green-700 dark:text-green-400 hover:underline min-h-[44px]"
            >
              Open WhatsApp
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </div>
      </div>
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

// ============================================
// ARTIKELEN VOOR JOU — met gelezen/rating
// ============================================
interface AanbevolenArtikel {
  id: string
  titel: string
  beschrijving: string
  emoji: string | null
  categorie: string
  url: string | null
}

function ArtikelenVoorJou({ artikelen }: { artikelen: AanbevolenArtikel[] }) {
  const [interacties, setInteracties] = useState<Record<string, { gelezen: boolean; rating: number | null }>>({})
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    fetch("/api/artikel-interactie?all=true")
      .then(r => r.ok ? r.json() : { interacties: [] })
      .then(data => {
        const map: Record<string, { gelezen: boolean; rating: number | null }> = {}
        for (const i of data.interacties || []) {
          map[i.artikelId] = { gelezen: i.gelezen, rating: i.rating }
        }
        setInteracties(map)
      })
      .catch(() => {})
  }, [])

  const toggleGelezen = async (artikelId: string) => {
    const current = interacties[artikelId]?.gelezen || false
    setInteracties(prev => ({
      ...prev,
      [artikelId]: { ...prev[artikelId], gelezen: !current, rating: prev[artikelId]?.rating ?? null },
    }))
    await fetch("/api/artikel-interactie", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ artikelId, gelezen: !current }),
    })
  }

  const setRating = async (artikelId: string, rating: number) => {
    const currentRating = interacties[artikelId]?.rating
    const newRating = currentRating === rating ? null : rating
    setInteracties(prev => ({
      ...prev,
      [artikelId]: { gelezen: prev[artikelId]?.gelezen ?? false, rating: newRating },
    }))
    await fetch("/api/artikel-interactie", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ artikelId, rating: newRating }),
    })
  }

  // Sorteer: ongelezen bovenaan, gelezen onderaan
  const sorted = [...artikelen].sort((a, b) => {
    const aGelezen = interacties[a.id]?.gelezen ? 1 : 0
    const bGelezen = interacties[b.id]?.gelezen ? 1 : 0
    return aGelezen - bGelezen
  })

  const allGelezen = sorted.every(a => interacties[a.id]?.gelezen)
  const visible = showAll ? sorted : sorted.slice(0, 5)

  return (
    <div className="ker-card">
      <div className="ker-section-header">
        <span className="ker-section-icon">📚</span>
        <h2 className="ker-section-title">Artikelen voor jou</h2>
      </div>

      {allGelezen && (
        <div className="text-center py-4 text-muted-foreground">
          <span className="text-2xl block mb-1">🎉</span>
          <p className="font-semibold">Je bent helemaal bij!</p>
          <p className="text-sm mt-1">Alle aanbevolen artikelen zijn gelezen.</p>
        </div>
      )}

      <div className="space-y-2">
        {visible.map((artikel) => {
          const isGelezen = interacties[artikel.id]?.gelezen || false
          const currentRating = interacties[artikel.id]?.rating ?? null

          return (
            <div
              key={artikel.id}
              className={`flex items-start gap-3 p-3 rounded-xl transition-all ${
                isGelezen ? "opacity-60" : ""
              }`}
            >
              {/* Gelezen checkbox */}
              <button
                onClick={() => toggleGelezen(artikel.id)}
                className={`mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                  isGelezen
                    ? "bg-primary border-primary text-primary-foreground"
                    : "border-border hover:border-primary"
                }`}
                title={isGelezen ? "Markeer als ongelezen" : "Markeer als gelezen"}
              >
                {isGelezen && (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>

              {/* Artikel info */}
              <Link
                href={artikel.url || `/leren/${artikel.categorie?.toLowerCase().replace(/\s+/g, "-")}`}
                className="flex-1 min-w-0 group"
              >
                <div className="flex items-start gap-2">
                  <span className="text-xl flex-shrink-0">{artikel.emoji || "📄"}</span>
                  <div>
                    <p className={`font-semibold group-hover:text-primary transition-colors line-clamp-1 ${
                      isGelezen ? "line-through text-muted-foreground" : "text-foreground"
                    }`}>
                      {artikel.titel}
                    </p>
                    <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                      {artikel.beschrijving}
                    </p>
                  </div>
                </div>
              </Link>

              {/* Duimpjes */}
              <div className="flex items-center gap-1 flex-shrink-0 mt-1">
                <button
                  onClick={() => setRating(artikel.id, 2)}
                  className={`p-1.5 rounded-lg transition-colors ${
                    currentRating === 2 ? "bg-accent-green-bg text-accent-green" : "text-muted-foreground/40 hover:text-accent-green"
                  }`}
                  title="Duimpje omhoog"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M2 20h2c.55 0 1-.45 1-1v-9c0-.55-.45-1-1-1H2v11zm19.83-7.12c.11-.25.17-.52.17-.8V11c0-1.1-.9-2-2-2h-5.5l.92-4.65c.05-.22.02-.46-.08-.66-.23-.45-.52-.86-.88-1.22L14 2 7.59 8.41C7.21 8.79 7 9.3 7 9.83v7.84C7 18.95 8.05 20 9.34 20h8.11c.7 0 1.36-.37 1.72-.97l2.66-6.15z"/>
                  </svg>
                </button>
                <button
                  onClick={() => setRating(artikel.id, 1)}
                  className={`p-1.5 rounded-lg transition-colors ${
                    currentRating === 1 ? "bg-accent-red-bg text-accent-red" : "text-muted-foreground/40 hover:text-accent-red"
                  }`}
                  title="Duimpje omlaag"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M22 4h-2c-.55 0-1 .45-1 1v9c0 .55.45 1 1 1h2V4zM2.17 11.12c-.11.25-.17.52-.17.8V13c0 1.1.9 2 2 2h5.5l-.92 4.65c-.05.22-.02.46.08.66.23.45.52.86.88 1.22L10 22l6.41-6.41c.38-.38.59-.89.59-1.42V6.34C17 5.05 15.95 4 14.66 4h-8.1c-.71 0-1.36.37-1.72.97l-2.67 6.15z"/>
                  </svg>
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {artikelen.length > 5 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="block w-full text-center text-sm font-semibold text-primary hover:text-primary/80 mt-3 py-2"
        >
          {showAll ? "Toon minder" : `Toon alle ${artikelen.length} artikelen`}
        </button>
      )}

      <Link
        href="/leren"
        className="block text-center text-sm font-semibold text-primary hover:text-primary/80 mt-2 py-2 border-t border-border"
      >
        Bekijk alle artikelen →
      </Link>
    </div>
  )
}
