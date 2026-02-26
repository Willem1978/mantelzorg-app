"use client"

import { useState, useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { ZORGTAKEN } from "@/config/options"
import { marktplaatsContent } from "@/config/content"
import { Button, Card, CardContent, PageIntro, Breadcrumbs } from "@/components/ui"

const c = marktplaatsContent

// ============================================
// TYPES
// ============================================

interface BuddyTaak {
  id: string
  titel: string
  beschrijving: string | null
  categorie: string
  datum: string | null
  tijdstip: string | null
  isFlexibel: boolean
  status: string
  createdAt: string
  reacties: {
    id: string
    status: string
    bericht: string | null
    buddy: {
      voornaam: string
      woonplaats: string
      gemiddeldeScore: number
    }
  }[]
}

interface MarktplaatsData {
  taken: BuddyTaak[]
  zorgtaakZwaarte: Record<string, string>
  gemeente: string | null
}

// ============================================
// CATEGORIE MAPPING
// ============================================

// Map de 10 ZORGTAKEN naar BuddyTaakCategorie enum values
const ZORGTAAK_NAAR_CATEGORIE: Record<string, string> = {
  t1: "OPPAS",           // Persoonlijke verzorging → Oppas (bij zorgvrager zijn)
  t2: "KLUSJES",         // Huishoudelijke taken → Klusjes
  t3: "OVERIG",          // Maaltijden → Overig
  t4: "BOODSCHAPPEN",    // Boodschappen → Boodschappen
  t5: "ADMINISTRATIE",   // Administratie → Administratie
  t6: "VERVOER",         // Vervoer → Vervoer
  t7: "GESPREK",         // Sociaal contact → Gesprek
  t8: "KLUSJES",         // Klusjes → Klusjes
  t9: "ADMINISTRATIE",   // Plannen & organiseren → Administratie
  t10: "OVERIG",         // Huisdieren → Overig
}

// Zwaarte badge helper
function zwaarteBadge(moeilijkheid: string | undefined) {
  if (!moeilijkheid) return null
  const m = moeilijkheid.toLowerCase()
  if (m === "ja" || m === "zwaar") {
    return { label: c.zwaarteBadge.zwaar.label, kleur: c.zwaarteBadge.zwaar.kleur }
  }
  if (m === "soms" || m === "matig") {
    return { label: c.zwaarteBadge.matig.label, kleur: c.zwaarteBadge.matig.kleur }
  }
  return { label: c.zwaarteBadge.goed.label, kleur: c.zwaarteBadge.goed.kleur }
}

// Status badge helper
function statusBadge(status: string) {
  const label = c.mijnVragen.status[status] || status
  const kleur = c.mijnVragen.statusKleur[status] || "bg-gray-100 text-gray-600"
  return { label, kleur }
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function MarktplaatsPage() {
  const searchParams = useSearchParams()
  const preselectedTaak = searchParams.get("taak")

  const [data, setData] = useState<MarktplaatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Stappen: "overzicht" | "kies-taak" | "formulier" | "succes"
  const [stap, setStap] = useState<"overzicht" | "kies-taak" | "formulier" | "succes">("overzicht")
  const [gekozenTaak, setGekozenTaak] = useState<string | null>(preselectedTaak)

  // Formulier
  const [titel, setTitel] = useState("")
  const [beschrijving, setBeschrijving] = useState("")
  const [wanneer, setWanneer] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const hasFetched = useRef(false)

  // ============================================
  // DATA LADEN
  // ============================================

  useEffect(() => {
    if (hasFetched.current) return
    hasFetched.current = true

    const fetchData = async () => {
      try {
        const res = await fetch("/api/marktplaats")
        if (!res.ok) throw new Error("Laden mislukt")
        const json = await res.json()
        setData(json)
      } catch {
        setError(c.errors.laden)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Als er een taak-id in de URL zit, ga direct naar formulier
  useEffect(() => {
    if (preselectedTaak && data) {
      setGekozenTaak(preselectedTaak)
      setStap("formulier")
    }
  }, [preselectedTaak, data])

  // ============================================
  // FORMULIER VERSTUREN
  // ============================================

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!gekozenTaak) return

    const taakDef = ZORGTAKEN.find((t) => t.id === gekozenTaak)
    if (!taakDef) return

    const categorie = ZORGTAAK_NAAR_CATEGORIE[gekozenTaak] || "OVERIG"
    const volledigeTitel = titel || `Hulp bij ${taakDef.naam.toLowerCase()}`

    setSubmitting(true)
    setSubmitError(null)

    try {
      const res = await fetch("/api/marktplaats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titel: volledigeTitel,
          beschrijving: [beschrijving, wanneer ? `Wanneer: ${wanneer}` : ""]
            .filter(Boolean)
            .join("\n\n"),
          categorie,
          isFlexibel: true,
        }),
      })

      if (!res.ok) throw new Error("Versturen mislukt")

      // Refresh data
      const refreshRes = await fetch("/api/marktplaats")
      if (refreshRes.ok) {
        const json = await refreshRes.json()
        setData(json)
      }

      setStap("succes")
      setTitel("")
      setBeschrijving("")
      setWanneer("")
    } catch {
      setSubmitError(c.errors.versturen)
    } finally {
      setSubmitting(false)
    }
  }

  // ============================================
  // LOADING / ERROR
  // ============================================

  if (loading) {
    return (
      <div className="ker-page">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-secondary rounded w-1/3" />
            <div className="h-4 bg-secondary rounded w-2/3" />
            <div className="grid grid-cols-2 gap-3 mt-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-24 bg-secondary rounded-2xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="ker-page">
        <div className="max-w-2xl mx-auto px-4 py-8 text-center">
          <p className="text-lg text-muted-foreground">{error}</p>
          <Button
            className="mt-4"
            onClick={() => {
              hasFetched.current = false
              setError(null)
              setLoading(true)
            }}
          >
            Opnieuw proberen
          </Button>
        </div>
      </div>
    )
  }

  // ============================================
  // SUCCES PAGINA
  // ============================================

  if (stap === "succes") {
    return (
      <div className="ker-page">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <Breadcrumbs items={[
            { label: c.breadcrumb.home, href: "/dashboard" },
            { label: c.breadcrumb.marktplaats },
          ]} />

          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎉</div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              {c.succes.title}
            </h1>
            <p className="text-muted-foreground text-lg mb-8">
              {c.succes.tekst}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                variant="outline"
                onClick={() => {
                  setStap("kies-taak")
                  setGekozenTaak(null)
                }}
              >
                {c.succes.nogEen}
              </Button>
              <Link href="/dashboard">
                <Button>{c.succes.naarDashboard}</Button>
              </Link>
            </div>
          </div>

          {/* Toon bestaande hulpvragen eronder */}
          {data && data.taken.length > 0 && (
            <MijnHulpvragen taken={data.taken} />
          )}
        </div>
      </div>
    )
  }

  // ============================================
  // FORMULIER
  // ============================================

  if (stap === "formulier" && gekozenTaak) {
    const taakDef = ZORGTAKEN.find((t) => t.id === gekozenTaak)

    return (
      <div className="ker-page">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <Breadcrumbs items={[
            { label: c.breadcrumb.home, href: "/dashboard" },
            { label: c.breadcrumb.marktplaats, href: "/marktplaats" },
            { label: taakDef?.naam || "Hulpvraag" },
          ]} />

          <PageIntro
            emoji={taakDef?.emoji || "📝"}
            tekst={`${c.formulier.title} — je vraagt hulp bij: ${taakDef?.naam || "onbekend"}`}
          />

          <form onSubmit={handleSubmit} className="space-y-5 mt-6">
            {/* Wat heb je nodig */}
            <div>
              <label
                htmlFor="titel"
                className="block text-sm font-semibold text-foreground mb-1.5"
              >
                {c.formulier.watHebJeNodig}
              </label>
              <input
                id="titel"
                type="text"
                value={titel}
                onChange={(e) => setTitel(e.target.value)}
                placeholder={c.formulier.watHebJeNodigPlaceholder}
                className="ker-input w-full"
              />
            </div>

            {/* Wanneer */}
            <div>
              <label
                htmlFor="wanneer"
                className="block text-sm font-semibold text-foreground mb-1.5"
              >
                {c.formulier.wanneer}
              </label>
              <input
                id="wanneer"
                type="text"
                value={wanneer}
                onChange={(e) => setWanneer(e.target.value)}
                placeholder={c.formulier.wanneerPlaceholder}
                className="ker-input w-full"
              />
            </div>

            {/* Extra info */}
            <div>
              <label
                htmlFor="beschrijving"
                className="block text-sm font-semibold text-foreground mb-1.5"
              >
                {c.formulier.extraInfo}
              </label>
              <textarea
                id="beschrijving"
                value={beschrijving}
                onChange={(e) => setBeschrijving(e.target.value)}
                placeholder={c.formulier.extraInfoPlaceholder}
                rows={3}
                className="ker-input w-full resize-none"
              />
            </div>

            {submitError && (
              <p className="text-sm text-accent-red">{submitError}</p>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setStap("kies-taak")
                  setGekozenTaak(null)
                }}
                className="flex-1"
              >
                {c.formulier.annuleren}
              </Button>
              <Button
                type="submit"
                isLoading={submitting}
                className="flex-1"
              >
                {submitting ? c.formulier.bezig : c.formulier.verstuur}
              </Button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  // ============================================
  // OVERZICHT + TAAK SELECTIE
  // ============================================

  return (
    <div className="ker-page">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Breadcrumbs items={[
          { label: c.breadcrumb.home, href: "/dashboard" },
          { label: c.breadcrumb.marktplaats },
        ]} />

        <PageIntro
          emoji="🤝"
          tekst={`${c.title} — ${c.subtitle}`}
        />

        {/* Gemeente badge */}
        {data?.gemeente && (
          <div className="flex items-center gap-2 mt-2 mb-4">
            <span className="ker-badge bg-primary/10 text-primary text-sm px-3 py-1 rounded-full">
              📍 {data.gemeente}
            </span>
          </div>
        )}

        {/* Intro kaart */}
        <Card className="mb-6 border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <h2 className="font-semibold text-foreground mb-1">
              {c.intro.title}
            </h2>
            <p className="text-sm text-muted-foreground">
              {c.intro.beschrijving}
            </p>
          </CardContent>
        </Card>

        {/* Taak selectie grid */}
        <h2 className="text-lg font-semibold text-foreground mb-1">
          {c.taakSelectie.title}
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          {c.taakSelectie.subtitle}
        </p>

        <div className="grid grid-cols-2 gap-3">
          {ZORGTAKEN.map((taak) => {
            const badge = zwaarteBadge(data?.zorgtaakZwaarte[taak.dbValue])

            return (
              <button
                key={taak.id}
                onClick={() => {
                  setGekozenTaak(taak.id)
                  setStap("formulier")
                }}
                className={cn(
                  "flex flex-col items-start p-4 rounded-2xl border-2 transition-all text-left",
                  "min-h-[96px] hover:shadow-md active:scale-[0.98]",
                  "bg-card border-border hover:border-primary/40",
                  "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2"
                )}
              >
                <span className="text-2xl mb-1">{taak.emoji}</span>
                <span className="font-medium text-sm text-foreground leading-tight">
                  {taak.naam}
                </span>
                <span className="text-xs text-muted-foreground mt-0.5">
                  {taak.beschrijving}
                </span>
                {badge && (
                  <span
                    className={cn(
                      "mt-2 text-xs font-semibold px-2 py-0.5 rounded-full",
                      badge.kleur
                    )}
                  >
                    {badge.label}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Mijn hulpvragen */}
        {data && data.taken.length > 0 && (
          <div className="mt-8">
            <MijnHulpvragen taken={data.taken} />
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================
// MIJN HULPVRAGEN COMPONENT
// ============================================

function MijnHulpvragen({ taken }: { taken: BuddyTaak[] }) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-foreground mb-3">
        {c.mijnVragen.title}
      </h2>

      {taken.length === 0 ? (
        <p className="text-muted-foreground text-sm">{c.mijnVragen.leeg}</p>
      ) : (
        <div className="space-y-3">
          {taken.map((taak) => {
            const sb = statusBadge(taak.status)
            const datum = new Date(taak.createdAt).toLocaleDateString("nl-NL", {
              day: "numeric",
              month: "short",
            })

            return (
              <Card key={taak.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-foreground truncate">
                        {taak.titel}
                      </h3>
                      {taak.beschrijving && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {taak.beschrijving}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-muted-foreground">
                          {datum}
                        </span>
                        <span
                          className={cn(
                            "text-xs font-medium px-2 py-0.5 rounded-full",
                            sb.kleur
                          )}
                        >
                          {sb.label}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Reacties van buddy's */}
                  {taak.reacties.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <p className="text-xs font-semibold text-foreground mb-2">
                        {taak.reacties.length} reactie{taak.reacties.length !== 1 ? "s" : ""}
                      </p>
                      {taak.reacties.map((reactie) => (
                        <div
                          key={reactie.id}
                          className="flex items-center gap-2 text-sm text-muted-foreground"
                        >
                          <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                            {reactie.buddy.voornaam.charAt(0)}
                          </span>
                          <span>
                            {reactie.buddy.voornaam} uit {reactie.buddy.woonplaats}
                          </span>
                          {reactie.buddy.gemiddeldeScore > 0 && (
                            <span className="text-xs">
                              ⭐ {reactie.buddy.gemiddeldeScore.toFixed(1)}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
