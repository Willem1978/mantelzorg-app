"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { GerAvatar } from "@/components/GerAvatar"

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
    perTaak: Record<string, Hulpbron[]>           // Hulp bij zorgtaken (locatie zorgvrager)
    voorMantelzorger: Hulpbron[]                  // Hulp voor mantelzorger (locatie mantelzorger)
    landelijk: LandelijkeHulpbron[]               // Landelijke hulplijnen
    perCategorie: Record<string, Hulpbron[]>      // Alle hulpbronnen per categorie
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

export default function DashboardPage() {
  const { data: session } = useSession()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState("daar")

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const res = await fetch("/api/dashboard")
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

    if (session?.user) {
      loadDashboard()
    } else {
      setLoading(false)
    }
  }, [session])

  if (loading) {
    return (
      <div className="ker-page-content flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

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

      {/* Urgentie Banner */}
      {data?.urgency && data.urgency.messages.length > 0 && (
        <div
          className={cn(
            "rounded-xl p-4 mb-6",
            data.urgency.level === "critical" && "bg-red-100 border-2 border-red-500",
            data.urgency.level === "high" && "bg-[var(--accent-red-bg)] border-l-4 border-l-[var(--accent-red)]",
            data.urgency.level === "medium" && "bg-[var(--accent-amber-bg)] border-l-4 border-l-[var(--accent-amber)]",
            data.urgency.level === "low" && "bg-[var(--accent-green-bg)] border-l-4 border-l-[var(--accent-green)]"
          )}
        >
          <div className="flex items-start gap-3">
            <span className="text-2xl">
              {data.urgency.level === "critical" && "🚨"}
              {data.urgency.level === "high" && "⚠️"}
              {data.urgency.level === "medium" && "📋"}
              {data.urgency.level === "low" && "✨"}
            </span>
            <div>
              <p className="font-semibold text-foreground">
                {data.urgency.level === "high" || data.urgency.level === "critical"
                  ? "Let op jezelf!"
                  : "Aandachtspunten"}
              </p>
              <ul className="text-sm text-muted-foreground mt-1 space-y-0.5">
                {data.urgency.messages.map((msg, i) => (
                  <li key={i}>• {msg}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* SECTIE: Zelfzorg (Jouw welzijn centraal) */}
      <section className="mb-8">
        <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
          <span className="text-2xl">💜</span> Jouw Welzijn
        </h2>

        {/* Balanstest Resultaat of CTA */}
        {data?.test?.hasTest ? (
          <div className="space-y-4">
            {/* Huidige Score Card */}
            <div
              className={cn(
                "ker-card",
                data.test.niveau === "LAAG" && "bg-[var(--accent-green-bg)]",
                data.test.niveau === "GEMIDDELD" && "bg-[var(--accent-amber-bg)]",
                data.test.niveau === "HOOG" && "bg-[var(--accent-red-bg)]"
              )}
            >
              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    "w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white flex-shrink-0",
                    data.test.niveau === "LAAG" && "bg-[var(--emoticon-green)]",
                    data.test.niveau === "GEMIDDELD" && "bg-[var(--emoticon-yellow)]",
                    data.test.niveau === "HOOG" && "bg-[var(--emoticon-red)]"
                  )}
                >
                  {data.test.score}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3
                      className={cn(
                        "font-bold text-lg",
                        data.test.niveau === "LAAG" && "text-[var(--accent-green)]",
                        data.test.niveau === "GEMIDDELD" && "text-[var(--accent-amber)]",
                        data.test.niveau === "HOOG" && "text-[var(--accent-red)]"
                      )}
                    >
                      {data.test.niveau === "LAAG" && "Lage belasting"}
                      {data.test.niveau === "GEMIDDELD" && "Gemiddelde belasting"}
                      {data.test.niveau === "HOOG" && "Hoge belasting"}
                    </h3>
                    {data.test.trend && (
                      <span className="text-sm">
                        {data.test.trend === "improved" && "📈 Verbeterd!"}
                        {data.test.trend === "worse" && "📉 Aandacht nodig"}
                        {data.test.trend === "same" && "➡️ Stabiel"}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {data.test.daysSinceTest} dagen geleden •{" "}
                    <Link href="/rapport" className="text-primary hover:underline">
                      Bekijk rapport →
                    </Link>
                  </p>
                </div>
              </div>

              {/* Aandachtspunten */}
              {data.test.highScoreAreas && data.test.highScoreAreas.length > 0 && (
                <div className="mt-4 pt-4 border-t border-black/10">
                  <p className="text-sm font-medium text-foreground mb-2">Aandachtspunten:</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {data.test.highScoreAreas.slice(0, 3).map((area, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-[var(--accent-red)]">•</span>
                        <span>{area.vraag}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Kwartaal Test Reminder */}
            {data.test.needsNewTest && (
              <Link href="/belastbaarheidstest" className="block">
                <div className="ker-card bg-primary text-primary-foreground hover:opacity-95 transition-opacity">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold">Tijd voor je kwartaal check</h3>
                      <p className="text-primary-foreground/80 text-sm mt-1">
                        Vergelijk met je vorige resultaat
                      </p>
                    </div>
                    <span className="text-3xl">📊</span>
                  </div>
                </div>
              </Link>
            )}

            {/* Score Geschiedenis */}
            {data.test.history && data.test.history.length > 1 && (
              <div className="ker-card">
                <h4 className="font-medium text-foreground mb-3">Voortgang</h4>
                <div className="flex items-end gap-2 h-20">
                  {data.test.history.slice().reverse().map((h, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center">
                      <div
                        className={cn(
                          "w-full rounded-t transition-all",
                          h.niveau === "LAAG" && "bg-[var(--emoticon-green)]",
                          h.niveau === "GEMIDDELD" && "bg-[var(--emoticon-yellow)]",
                          h.niveau === "HOOG" && "bg-[var(--emoticon-red)]"
                        )}
                        style={{ height: `${(h.score / 24) * 100}%`, minHeight: "8px" }}
                      />
                      <span className="text-xs text-muted-foreground mt-1">
                        {new Date(h.date).toLocaleDateString("nl-NL", { month: "short" })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <Link href="/belastbaarheidstest" className="block">
            <div className="ker-card bg-primary text-primary-foreground hover:opacity-95 transition-opacity">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-xl">Doe de Balanstest</h3>
                  <p className="text-primary-foreground/80 mt-1">
                    Ontdek hoe het met je gaat (5 min)
                  </p>
                </div>
                <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-3xl">📊</span>
                </div>
              </div>
            </div>
          </Link>
        )}

        {/* Wekelijkse Check-in */}
        <div className="mt-4 grid grid-cols-2 gap-3">
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
              {data?.checkIns?.recentScores?.[0] && (
                <p className="text-xs text-muted-foreground mt-1">
                  Welzijn: {data.checkIns.recentScores[0]}/10
                </p>
              )}
            </div>
          </Link>

          <div
            className={cn(
              "ker-card text-center py-4",
              data?.checkIns?.monthlyDone
                ? "bg-[var(--accent-green-bg)]"
                : "bg-muted"
            )}
          >
            <span className="text-2xl">{data?.checkIns?.monthlyDone ? "✅" : "📅"}</span>
            <p className="font-medium text-sm mt-2">Maand check-in</p>
            <p className="text-xs text-muted-foreground mt-1">
              {data?.checkIns?.monthlyDone ? "Voltooid" : "Eind van de maand"}
            </p>
          </div>
        </div>
      </section>

      {/* SECTIE: Zelfzorg Taken */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <span className="text-2xl">🌱</span> Zelfzorg Doelen
          </h2>
          <Link href="/taken?category=SELF_CARE" className="text-sm text-primary hover:underline">
            Alle doelen →
          </Link>
        </div>

        {/* Progress */}
        <div className="ker-card mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Deze week</span>
            <span className="text-sm text-muted-foreground">
              {data?.selfCare?.completed || 0}/{data?.selfCare?.weeklyGoal || 3} activiteiten
            </span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--emoticon-green)] rounded-full transition-all"
              style={{
                width: `${Math.min(
                  ((data?.selfCare?.completed || 0) / (data?.selfCare?.weeklyGoal || 3)) * 100,
                  100
                )}%`,
              }}
            />
          </div>
        </div>

        {/* Zelfzorg suggesties */}
        <div className="space-y-2">
          {data?.selfCare?.upcoming && data.selfCare.upcoming.length > 0 ? (
            data.selfCare.upcoming.map((task) => (
              <div key={task.id} className="ker-card flex items-center gap-3 py-3">
                <div className="w-8 h-8 rounded-full bg-[var(--accent-green-bg)] flex items-center justify-center">
                  <span>🎯</span>
                </div>
                <span className="flex-1 text-sm">{task.title}</span>
                <button className="text-primary text-sm hover:underline">✓ Gedaan</button>
              </div>
            ))
          ) : (
            <div className="ker-card text-center py-6 bg-muted">
              <p className="text-muted-foreground">Geen zelfzorg doelen gepland</p>
              <Link href="/taken/nieuw?category=SELF_CARE" className="text-primary text-sm hover:underline mt-2 inline-block">
                + Voeg toe
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* SECTIE: Zorgtaken Overzicht */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <span className="text-2xl">📋</span> Zorgtaken
          </h2>
          <Link href="/taken" className="text-sm text-primary hover:underline">
            Alle taken →
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="ker-card text-center py-3">
            <p className="text-2xl font-bold text-foreground">{data?.tasks?.open || 0}</p>
            <p className="text-xs text-muted-foreground">Open</p>
          </div>
          <div className="ker-card text-center py-3">
            <p className={cn(
              "text-2xl font-bold",
              (data?.tasks?.overdue || 0) > 0 ? "text-[var(--accent-red)]" : "text-foreground"
            )}>
              {data?.tasks?.overdue || 0}
            </p>
            <p className="text-xs text-muted-foreground">Verlopen</p>
          </div>
          <div className="ker-card text-center py-3">
            <p className="text-2xl font-bold text-[var(--accent-green)]">
              {data?.tasks?.completedThisWeek || 0}
            </p>
            <p className="text-xs text-muted-foreground">Afgerond</p>
          </div>
        </div>

        {/* Upcoming Tasks */}
        {data?.tasks?.upcoming && data.tasks.upcoming.length > 0 && (
          <div className="space-y-2">
            {data.tasks.upcoming.map((task) => (
              <Link key={task.id} href={`/taken/${task.id}`} className="block">
                <div
                  className={cn(
                    "ker-card flex items-center gap-3 py-3 hover:border-primary/50 transition-colors",
                    task.isOverdue && "border-l-4 border-l-[var(--accent-red)]"
                  )}
                >
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center",
                      task.priority === "HIGH" && "bg-[var(--accent-red-bg)]",
                      task.priority === "MEDIUM" && "bg-[var(--accent-amber-bg)]",
                      task.priority === "LOW" && "bg-muted"
                    )}
                  >
                    {getCategoryIcon(task.category)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{task.title}</p>
                    {task.dueDate && (
                      <p
                        className={cn(
                          "text-xs",
                          task.isOverdue ? "text-[var(--accent-red)]" : "text-muted-foreground"
                        )}
                      >
                        {task.isOverdue ? "Verlopen: " : ""}
                        {new Date(task.dueDate).toLocaleDateString("nl-NL", {
                          day: "numeric",
                          month: "short",
                        })}
                      </p>
                    )}
                  </div>
                  <svg
                    className="w-4 h-4 text-muted-foreground"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Zorgtaken uit test */}
        {data?.test?.zorgtaken && data.test.zorgtaken.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium text-muted-foreground mb-2">
              Jouw zorgtaken ({data.test.zorgtaken.length}):
            </p>
            <div className="flex flex-wrap gap-2">
              {data.test.zorgtaken.map((taak, i) => (
                <span
                  key={i}
                  className={cn(
                    "text-xs px-2 py-1 rounded-full",
                    taak.moeilijkheid === "JA" && "bg-[var(--accent-red-bg)] text-[var(--accent-red)]",
                    taak.moeilijkheid === "SOMS" && "bg-[var(--accent-amber-bg)] text-[var(--accent-amber)]",
                    (!taak.moeilijkheid || taak.moeilijkheid === "NEE") && "bg-muted text-muted-foreground"
                  )}
                >
                  {taak.moeilijkheid === "JA" && "🔴 "}
                  {taak.moeilijkheid === "SOMS" && "🟡 "}
                  {(!taak.moeilijkheid || taak.moeilijkheid === "NEE") && "🟢 "}
                  {taak.naam}
                  {taak.uren && ` (${taak.uren}u/w)`}
                </span>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* SECTIE: Hulp nodig? - Link naar hulp pagina */}
      {data?.test?.zorgtaken && data.test.zorgtaken.some(t => t.moeilijkheid === 'JA' || t.moeilijkheid === 'SOMS') && (
        <section className="mb-8">
          <Link href="/hulpvragen" className="block">
            <div className="ker-card bg-gradient-to-r from-primary/5 to-primary/10 hover:from-primary/10 hover:to-primary/15 transition-all">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">💜</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">Hulp zoeken</h3>
                  <p className="text-sm text-muted-foreground">
                    {data.test.zorgtaken.filter(t => t.moeilijkheid === 'JA' || t.moeilijkheid === 'SOMS').length} zware taken - bekijk hulpbronnen
                  </p>
                </div>
                <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>
        </section>
      )}

      {/* Snelle acties */}
      <section className="mb-8">
        <h2 className="text-sm font-bold text-foreground uppercase tracking-wide mb-3">
          Snel naar
        </h2>
        <div className="grid grid-cols-4 gap-2">
          <Link href="/check-in" className="block">
            <div className="ker-card flex flex-col items-center gap-1 py-3 hover:border-primary/50 transition-colors">
              <span className="text-xl">😊</span>
              <span className="text-xs text-center">Check-in</span>
            </div>
          </Link>
          <Link href="/hulpvragen" className="block">
            <div className="ker-card flex flex-col items-center gap-1 py-3 hover:border-primary/50 transition-colors">
              <span className="text-xl">🤝</span>
              <span className="text-xs text-center">Hulp</span>
            </div>
          </Link>
          <Link href="/agenda" className="block">
            <div className="ker-card flex flex-col items-center gap-1 py-3 hover:border-primary/50 transition-colors">
              <span className="text-xl">📅</span>
              <span className="text-xs text-center">Agenda</span>
            </div>
          </Link>
          <Link href="/profiel" className="block">
            <div className="ker-card flex flex-col items-center gap-1 py-3 hover:border-primary/50 transition-colors">
              <span className="text-xl">👤</span>
              <span className="text-xs text-center">Profiel</span>
            </div>
          </Link>
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

function getCategoryIcon(category: string): string {
  switch (category) {
    case "SELF_CARE":
      return "🌱"
    case "ADMINISTRATION":
      return "📄"
    case "APPOINTMENTS":
      return "📅"
    case "SOCIAL":
      return "👥"
    case "HEALTH":
      return "💊"
    default:
      return "📋"
  }
}

