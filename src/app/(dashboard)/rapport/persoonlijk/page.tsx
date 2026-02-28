"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { GerAvatar } from "@/components/GerAvatar"

interface DeelgebiedScore {
  naam: string
  emoji: string
  score: number
  maxScore: number
  percentage: number
  niveau: "LAAG" | "GEMIDDELD" | "HOOG"
  tip: string
}

interface Advies {
  id: string
  titel: string
  tekst: string
  emoji: string
  prioriteit: "hoog" | "gemiddeld" | "laag"
  link?: string
  linkTekst?: string
}

interface Zorgtaak {
  id: string
  naam: string
  uren: number | null
  moeilijkheid: string
}

interface GemeenteAdvies {
  naam: string
  adviesLaag?: string | null
  adviesGemiddeld?: string | null
  adviesHoog?: string | null
  mantelzorgSteunpunt?: string | null
  mantelzorgSteunpuntNaam?: string | null
  contactEmail?: string | null
  contactTelefoon?: string | null
}

interface DashboardData {
  test: {
    hasTest: boolean
    score?: number
    niveau?: string
    completedAt?: string
    trend?: "improved" | "same" | "worse" | null
    zorgtaken?: Zorgtaak[]
  }
  deelgebieden: DeelgebiedScore[]
  adviezen: Advies[]
  gemeenteAdvies: GemeenteAdvies | null
  locatie: {
    mantelzorger: { gemeente: string | null }
    zorgvrager: { gemeente: string | null }
  }
}

function NiveauBadge({ niveau }: { niveau: string }) {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    LAAG: { bg: "bg-green-100", text: "text-green-800", label: "Laag" },
    GEMIDDELD: { bg: "bg-amber-100", text: "text-amber-800", label: "Gemiddeld" },
    HOOG: { bg: "bg-red-100", text: "text-red-800", label: "Hoog" },
  }
  const c = config[niveau] || config.LAAG
  return (
    <span className={cn("px-3 py-1 rounded-full text-sm font-semibold", c.bg, c.text)}>
      {c.label}
    </span>
  )
}

function ScoreThermometer({ score, maxScore = 24 }: { score: number; maxScore?: number }) {
  const percentage = Math.min(100, Math.round((score / maxScore) * 100))
  const color = percentage < 30 ? "bg-green-500" : percentage < 60 ? "bg-amber-500" : "bg-red-500"

  return (
    <div className="w-full">
      <div className="flex justify-between text-sm text-muted-foreground mb-1">
        <span>0</span>
        <span className="font-bold text-foreground text-lg">{score}</span>
        <span>{maxScore}</span>
      </div>
      <div className="w-full h-4 bg-muted rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-700", color)}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground mt-1 text-center">
        Hoe lager, hoe beter
      </p>
    </div>
  )
}

export default function PersoonlijkRapportPage() {
  const { status } = useSession()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status !== "authenticated") return

    async function fetchData() {
      try {
        const res = await fetch("/api/dashboard")
        if (!res.ok) throw new Error("Kon gegevens niet ophalen")
        const json = await res.json()
        setData(json)
      } catch {
        setError("Er ging iets mis bij het laden van je resultaten.")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [status])

  if (status === "loading" || loading) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-2/3" />
          <div className="h-4 bg-muted rounded w-1/2" />
          <div className="h-32 bg-muted rounded" />
          <div className="h-24 bg-muted rounded" />
        </div>
      </div>
    )
  }

  if (error || !data?.test?.hasTest) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center">
        <GerAvatar size="lg" className="mx-auto mb-4" />
        <h1 className="text-xl font-bold mb-2">Geen testresultaten gevonden</h1>
        <p className="text-muted-foreground mb-6">
          Doe eerst de balanstest. Dan laat ik je zien hoe het met je gaat en wat je kunt doen.
        </p>
        <Link
          href="/belastbaarheidstest"
          className="ker-btn ker-btn-primary inline-block"
        >
          Start de balanstest
        </Link>
      </div>
    )
  }

  const { test, deelgebieden, adviezen, gemeenteAdvies } = data
  const niveau = test.niveau || "LAAG"
  const zwareTaken = test.zorgtaken?.filter(
    (t) => t.moeilijkheid === "MOEILIJK" || t.moeilijkheid === "ZEER_MOEILIJK" || t.moeilijkheid === "JA"
  ) || []

  // Gemeente-specifiek advies op basis van niveau
  const gemeenteAdviesTekst = gemeenteAdvies
    ? niveau === "HOOG"
      ? gemeenteAdvies.adviesHoog
      : niveau === "GEMIDDELD"
        ? gemeenteAdvies.adviesGemiddeld
        : gemeenteAdvies.adviesLaag
    : null

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-8">
      {/* Header met Ger */}
      <div className="flex items-start gap-4">
        <GerAvatar size="md" />
        <div>
          <h1 className="text-xl font-bold text-foreground">
            Je persoonlijke advies
          </h1>
          <p className="text-muted-foreground">
            Op basis van je balanstest van{" "}
            {test.completedAt
              ? new Date(test.completedAt).toLocaleDateString("nl-NL", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })
              : "vandaag"}
          </p>
        </div>
      </div>

      {/* Score overzicht */}
      <section className="bg-card rounded-xl p-6 border shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Je belastingscore</h2>
          <NiveauBadge niveau={niveau} />
        </div>
        <ScoreThermometer score={test.score || 0} />

        {test.trend && (
          <div className={cn(
            "mt-4 p-3 rounded-lg text-sm",
            test.trend === "improved" && "bg-green-50 text-green-800",
            test.trend === "worse" && "bg-red-50 text-red-800",
            test.trend === "same" && "bg-blue-50 text-blue-800",
          )}>
            {test.trend === "improved" && "📉 Je score is verbeterd ten opzichte van je vorige test. Goed bezig!"}
            {test.trend === "worse" && "📈 Je score is hoger dan vorige keer. Het is goed dat je dit bijhoudt."}
            {test.trend === "same" && "➡️ Je score is gelijk gebleven."}
          </div>
        )}
      </section>

      {/* Deelgebieden */}
      {deelgebieden.length > 0 && (
        <section className="bg-card rounded-xl p-6 border shadow-sm">
          <h2 className="text-lg font-bold mb-4">Hoe het gaat per gebied</h2>
          <div className="space-y-5">
            {deelgebieden.map((d) => (
              <div key={d.naam}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium">
                    {d.emoji} {d.naam}
                  </span>
                  <NiveauBadge niveau={d.niveau} />
                </div>
                <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden mb-1">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      d.niveau === "LAAG" && "bg-green-500",
                      d.niveau === "GEMIDDELD" && "bg-amber-500",
                      d.niveau === "HOOG" && "bg-red-500",
                    )}
                    style={{ width: `${d.percentage}%` }}
                  />
                </div>
                <p className="text-sm text-muted-foreground">{d.tip}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Zware taken */}
      {zwareTaken.length > 0 && (
        <section className="bg-card rounded-xl p-6 border shadow-sm">
          <h2 className="text-lg font-bold mb-3">Taken die je zwaar vindt</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Bij deze taken kun je misschien hulp zoeken.
          </p>
          <div className="space-y-2">
            {zwareTaken.map((t) => (
              <div key={t.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <span className="font-medium text-red-900">{t.naam}</span>
                {t.uren && (
                  <span className="text-sm text-red-700">{t.uren} uur/week</span>
                )}
              </div>
            ))}
          </div>
          <Link
            href="/hulpvragen?tab=voor-naaste"
            className="ker-btn ker-btn-primary w-full mt-4 text-center block"
          >
            Zoek hulp bij deze taken
          </Link>
        </section>
      )}

      {/* Top 3 concrete acties */}
      <section className="bg-card rounded-xl p-6 border shadow-sm">
        <h2 className="text-lg font-bold mb-1">Jouw top 3 acties</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Dit zijn de belangrijkste stappen voor jou op dit moment.
        </p>
        <div className="space-y-3">
          {(() => {
            const acties: { nr: number; tekst: string; link: string; linkLabel: string }[] = []

            // Actie 1: Gebaseerd op niveau
            if (niveau === "HOOG") {
              acties.push({
                nr: 1,
                tekst: "Neem contact op met het WMO-loket of mantelzorgsteunpunt in je gemeente voor professionele ondersteuning.",
                link: "/hulpvragen?tab=voor-jou",
                linkLabel: "Zoek hulp",
              })
            } else if (niveau === "GEMIDDELD") {
              acties.push({
                nr: 1,
                tekst: "Bekijk of je hulp kunt krijgen bij de taken die je het zwaarst vindt.",
                link: "/hulpvragen?tab=voor-naaste",
                linkLabel: "Bekijk hulpopties",
              })
            } else {
              acties.push({
                nr: 1,
                tekst: "Blijf zorgen voor jezelf. Plan regelmatig iets leuks voor jezelf in.",
                link: "/leren",
                linkLabel: "Lees tips",
              })
            }

            // Actie 2: Gebaseerd op zware taken
            if (zwareTaken.length > 0) {
              acties.push({
                nr: 2,
                tekst: `Zoek een MantelBuddy die kan helpen met ${zwareTaken[0]?.naam?.toLowerCase() || "zware taken"}.`,
                link: "/buddys",
                linkLabel: "Zoek een buddy",
              })
            } else {
              acties.push({
                nr: 2,
                tekst: "Maak contact met andere mantelzorgers. Een luisterend oor helpt enorm.",
                link: "/buddys",
                linkLabel: "Vind een buddy",
              })
            }

            // Actie 3: Check-in planning
            acties.push({
              nr: 3,
              tekst: "Plan je volgende check-in. Zo houd je bij hoe het met je gaat.",
              link: "/dashboard",
              linkLabel: "Naar dashboard",
            })

            return acties.map((a) => (
              <div key={a.nr} className="flex items-start gap-3 p-3 bg-primary/5 rounded-lg">
                <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold flex-shrink-0">
                  {a.nr}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-foreground">{a.tekst}</p>
                  <Link href={a.link} className="text-xs font-semibold text-primary hover:underline mt-1 inline-block">
                    {a.linkLabel} →
                  </Link>
                </div>
              </div>
            ))
          })()}
        </div>
      </section>

      {/* Persoonlijke adviezen */}
      {adviezen.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-bold">Wat je kunt doen</h2>
          {adviezen.map((a) => (
            <div
              key={a.id}
              className={cn(
                "p-4 rounded-xl border",
                a.prioriteit === "hoog" && "bg-red-50 border-red-200",
                a.prioriteit === "gemiddeld" && "bg-amber-50 border-amber-200",
                a.prioriteit === "laag" && "bg-green-50 border-green-200",
              )}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{a.emoji}</span>
                <div className="flex-1">
                  <h3 className="font-bold text-foreground">{a.titel}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{a.tekst}</p>
                  {a.link && a.linkTekst && (
                    <Link
                      href={a.link}
                      className="inline-block mt-2 text-sm font-semibold text-primary hover:underline"
                    >
                      {a.linkTekst} →
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Gemeente-specifiek advies */}
      {gemeenteAdvies && gemeenteAdviesTekst && (
        <section className="bg-primary/5 rounded-xl p-6 border border-primary/20">
          <h2 className="text-lg font-bold mb-2">
            Advies van gemeente {gemeenteAdvies.naam}
          </h2>
          <p className="text-sm text-muted-foreground mb-4">{gemeenteAdviesTekst}</p>
          <div className="space-y-2 text-sm">
            {gemeenteAdvies.mantelzorgSteunpunt && (
              <a
                href={gemeenteAdvies.mantelzorgSteunpunt}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-primary hover:underline"
              >
                🏠 {gemeenteAdvies.mantelzorgSteunpuntNaam || "Mantelzorg steunpunt"}
              </a>
            )}
            {gemeenteAdvies.contactTelefoon && (
              <a href={`tel:${gemeenteAdvies.contactTelefoon}`} className="flex items-center gap-2 text-primary hover:underline">
                📞 {gemeenteAdvies.contactTelefoon}
              </a>
            )}
            {gemeenteAdvies.contactEmail && (
              <a href={`mailto:${gemeenteAdvies.contactEmail}`} className="flex items-center gap-2 text-primary hover:underline">
                ✉️ {gemeenteAdvies.contactEmail}
              </a>
            )}
          </div>
        </section>
      )}

      {/* Praat met Ger */}
      <section className="bg-card rounded-xl p-6 border shadow-sm text-center">
        <GerAvatar size="md" className="mx-auto mb-3" />
        <h2 className="text-lg font-bold mb-2">Wil je erover praten?</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Ger kan je verder helpen met vragen over je situatie, hulpbronnen zoeken of gewoon even luisteren.
        </p>
        <Link
          href="/dashboard"
          className="ker-btn ker-btn-primary inline-block"
        >
          Praat met Ger
        </Link>
      </section>

      {/* Acties onderaan */}
      <div className="flex flex-col sm:flex-row gap-3 pb-8">
        <Link href="/dashboard" className="ker-btn ker-btn-secondary flex-1 text-center">
          Naar mijn dashboard
        </Link>
        <Link href="/hulpvragen" className="ker-btn ker-btn-secondary flex-1 text-center">
          Zoek hulp bij jou in de buurt
        </Link>
      </div>
    </div>
  )
}
