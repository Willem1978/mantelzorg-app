"use client"

import { useEffect, useState, useCallback } from "react"

interface Actiepunt {
  id: string
  title: string
  description: string | null
  category: string
  priority: string
  status: string
  isSuggested: boolean
  suggestedReason: string | null
  dueDate: string | null
  createdAt: string
}

const priorityConfig: Record<string, { color: string; label: string }> = {
  HIGH: { color: "text-red-600", label: "Belangrijk" },
  MEDIUM: { color: "text-amber-600", label: "Normaal" },
  LOW: { color: "text-green-600", label: "Laag" },
}

export function ActiepuntenKaart() {
  const [actiepunten, setActiepunten] = useState<Actiepunt[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)

  const fetchActiepunten = useCallback(async () => {
    try {
      const res = await fetch("/api/actiepunten")
      if (res.ok) {
        const data = await res.json()
        setActiepunten(data.actiepunten || [])
      }
    } catch {
      // Stille fout — component verbergt zichzelf als er geen data is
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchActiepunten()
  }, [fetchActiepunten])

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "COMPLETED" ? "TODO" : "COMPLETED"
    setUpdating(id)

    try {
      const res = await fetch("/api/actiepunten", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      })

      if (res.ok) {
        setActiepunten((prev) =>
          prev.map((a) =>
            a.id === id ? { ...a, status: newStatus } : a
          )
        )

        // Verwijder voltooide items na korte delay (visuele feedback)
        if (newStatus === "COMPLETED") {
          setTimeout(() => {
            setActiepunten((prev) => prev.filter((a) => a.id !== id))
          }, 1500)
        }
      }
    } catch {
      // Fout — niets doen
    } finally {
      setUpdating(null)
    }
  }

  if (loading) {
    return (
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Jouw actiepunten
        </h2>
        <div className="animate-pulse space-y-2">
          <div className="h-14 bg-muted rounded-xl" />
          <div className="h-14 bg-muted rounded-xl" />
        </div>
      </section>
    )
  }

  // Toon niets als er geen actiepunten zijn
  if (actiepunten.length === 0) return null

  return (
    <section>
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
        Jouw actiepunten
      </h2>
      <div className="space-y-2">
        {actiepunten.map((actiepunt) => {
          const isCompleted = actiepunt.status === "COMPLETED"
          const isUpdating = updating === actiepunt.id
          const pConfig = priorityConfig[actiepunt.priority] || priorityConfig.MEDIUM

          return (
            <div
              key={actiepunt.id}
              className={`flex items-start gap-3 p-3.5 rounded-xl border-2 transition-all ${
                isCompleted
                  ? "bg-green-50 border-green-200 opacity-60"
                  : "bg-card border-border hover:border-primary/30"
              }`}
            >
              {/* Checkbox */}
              <button
                onClick={() => toggleStatus(actiepunt.id, actiepunt.status)}
                disabled={isUpdating}
                className={`mt-0.5 w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                  isCompleted
                    ? "bg-green-500 border-green-500 text-white"
                    : "border-muted-foreground/30 hover:border-primary"
                } ${isUpdating ? "opacity-50" : ""}`}
                aria-label={isCompleted ? "Markeer als niet afgerond" : "Markeer als afgerond"}
              >
                {isCompleted && (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {isUpdating && (
                  <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                )}
              </button>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${isCompleted ? "line-through text-muted-foreground" : "text-foreground"}`}>
                  {actiepunt.title}
                </p>
                {actiepunt.suggestedReason && !isCompleted && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {actiepunt.isSuggested ? "Voorgesteld door Ger" : actiepunt.suggestedReason}
                  </p>
                )}
              </div>

              {/* Priority indicator */}
              {!isCompleted && actiepunt.priority === "HIGH" && (
                <span className={`text-xs font-semibold ${pConfig.color} flex-shrink-0`}>
                  {pConfig.label}
                </span>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
