"use client"

import { useEffect, useState, useCallback } from "react"
import { AdminSpinner } from "@/components/admin"
import { useToast } from "@/components/ui/Toast"

interface CoachAdvies {
  id: string | null
  sleutel: string
  label: string
  advies: string
  isActief: boolean
}

interface AdviesGroep {
  titel: string
  emoji: string
  beschrijving: string
  items: CoachAdvies[]
}

function groepeerAdviezen(adviezen: CoachAdvies[]): AdviesGroep[] {
  const groepen: AdviesGroep[] = [
    {
      titel: "Totaalscore",
      emoji: "📊",
      beschrijving: "Advies op basis van de totale belastingsscore (0-24 punten)",
      items: adviezen.filter((a) => a.sleutel.startsWith("totaal.")),
    },
    {
      titel: "Energie",
      emoji: "⚡",
      beschrijving: "Advies over het deelgebied Energie (slaap, lichaam, energieniveau)",
      items: adviezen.filter((a) => a.sleutel.startsWith("energie.")),
    },
    {
      titel: "Gevoel",
      emoji: "💛",
      beschrijving: "Advies over het deelgebied Gevoel (relatie, emotie, verdriet)",
      items: adviezen.filter((a) => a.sleutel.startsWith("gevoel.")),
    },
    {
      titel: "Tijd",
      emoji: "⏰",
      beschrijving: "Advies over het deelgebied Tijd (dagelijks leven, plannen, hobby's)",
      items: adviezen.filter((a) => a.sleutel.startsWith("tijd.")),
    },
    {
      titel: "Zorgtaken",
      emoji: "📋",
      beschrijving: "Advies per zorgtaak wanneer deze als zwaar wordt ervaren",
      items: adviezen.filter((a) => a.sleutel.startsWith("taak.")),
    },
  ]
  return groepen.filter((g) => g.items.length > 0)
}

function niveauKleur(sleutel: string): string {
  if (sleutel.includes(".LAAG")) return "border-l-green-500 bg-green-50/50"
  if (sleutel.includes(".GEMIDDELD")) return "border-l-amber-500 bg-amber-50/50"
  if (sleutel.includes(".HOOG")) return "border-l-red-500 bg-red-50/50"
  return "border-l-blue-500 bg-blue-50/50"
}

function niveauLabel(sleutel: string): string {
  if (sleutel.includes(".LAAG")) return "🟢 Groen"
  if (sleutel.includes(".GEMIDDELD")) return "🟠 Oranje"
  if (sleutel.includes(".HOOG")) return "🔴 Rood"
  return ""
}

export default function CoachAdviezenPage() {
  const [adviezen, setAdviezen] = useState<CoachAdvies[]>([])
  const [loading, setLoading] = useState(true)
  const [bewerkingen, setBewerkingen] = useState<Record<string, string>>({})
  const [opslaanStatus, setOpslaanStatus] = useState<Record<string, "saving" | "saved" | "error">>({})
  const { showSuccess, showError } = useToast()

  const laadAdviezen = useCallback(async () => {
    try {
      const res = await fetch("/api/beheer/coach-adviezen")
      const data = await res.json()
      setAdviezen(data.adviezen || [])
    } catch {
      showError("Kon adviezen niet laden")
    } finally {
      setLoading(false)
    }
  }, [showError])

  useEffect(() => {
    laadAdviezen()
  }, [laadAdviezen])

  const handleChange = (sleutel: string, waarde: string) => {
    setBewerkingen((prev) => ({ ...prev, [sleutel]: waarde }))
  }

  const handleOpslaan = async (item: CoachAdvies) => {
    const advies = bewerkingen[item.sleutel] ?? item.advies
    setOpslaanStatus((prev) => ({ ...prev, [item.sleutel]: "saving" }))

    try {
      const res = await fetch("/api/beheer/coach-adviezen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sleutel: item.sleutel,
          label: item.label,
          advies,
        }),
      })

      if (res.ok) {
        setOpslaanStatus((prev) => ({ ...prev, [item.sleutel]: "saved" }))
        setBewerkingen((prev) => {
          const next = { ...prev }
          delete next[item.sleutel]
          return next
        })
        showSuccess(`"${item.label}" opgeslagen`)
        setTimeout(() => {
          setOpslaanStatus((prev) => {
            const next = { ...prev }
            delete next[item.sleutel]
            return next
          })
        }, 2000)
      } else {
        setOpslaanStatus((prev) => ({ ...prev, [item.sleutel]: "error" }))
        showError("Opslaan mislukt")
      }
    } catch {
      setOpslaanStatus((prev) => ({ ...prev, [item.sleutel]: "error" }))
      showError("Opslaan mislukt")
    }
  }

  const groepen = groepeerAdviezen(adviezen)

  if (loading) {
    return (
      <div className="p-8 flex justify-center">
        <AdminSpinner />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Coach Adviezen</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configureer de adviezen die Ger (AI-coach) geeft op basis van testresultaten.
          Deze teksten worden gebruikt bij de totaalscore, deelgebieden en zorgtaken.
        </p>
      </div>

      {groepen.map((groep) => (
        <div key={groep.titel} className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">{groep.emoji}</span>
            <div>
              <h2 className="text-lg font-semibold text-foreground">{groep.titel}</h2>
              <p className="text-xs text-muted-foreground">{groep.beschrijving}</p>
            </div>
          </div>

          <div className="space-y-2">
            {groep.items.map((item) => {
              const huidigeWaarde = bewerkingen[item.sleutel] ?? item.advies
              const isGewijzigd = bewerkingen[item.sleutel] !== undefined
              const status = opslaanStatus[item.sleutel]
              const niveau = niveauLabel(item.sleutel)

              return (
                <div
                  key={item.sleutel}
                  className={`border-l-4 rounded-lg p-4 ${niveauKleur(item.sleutel)}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">
                        {item.label}
                      </span>
                      {niveau && (
                        <span className="text-xs text-muted-foreground">{niveau}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {status === "saved" && (
                        <span className="text-xs text-green-600">Opgeslagen</span>
                      )}
                      {status === "error" && (
                        <span className="text-xs text-red-600">Fout</span>
                      )}
                      <button
                        onClick={() => handleOpslaan(item)}
                        disabled={!isGewijzigd || status === "saving"}
                        className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                          isGewijzigd
                            ? "bg-primary text-primary-foreground hover:opacity-90"
                            : "bg-muted text-muted-foreground cursor-not-allowed"
                        }`}
                      >
                        {status === "saving" ? "Opslaan..." : "Opslaan"}
                      </button>
                    </div>
                  </div>
                  <textarea
                    value={huidigeWaarde}
                    onChange={(e) => handleChange(item.sleutel, e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground resize-y focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="Voer het advies in..."
                  />
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
