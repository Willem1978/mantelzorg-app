"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { wellbeingChartColors } from "@/config/colors"

interface CheckIn {
  month: string
  overallWellbeing: number | null
  physicalHealth: number | null
  emotionalHealth: number | null
}

interface WellbeingChartProps {
  className?: string
}

export function WellbeingChart({ className }: WellbeingChartProps) {
  const [checkIns, setCheckIns] = useState<CheckIn[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeMetric, setActiveMetric] = useState<"overall" | "physical" | "emotional">("overall")

  useEffect(() => {
    fetchCheckIns()
  }, [])

  const fetchCheckIns = async () => {
    try {
      const res = await fetch("/api/check-in")
      if (res.ok) {
        const data = await res.json()
        setCheckIns(data.checkIns || [])
      }
    } catch (error) {
      console.error("Failed to fetch check-ins:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const metrics = [
    { key: "overall", label: "Algemeen", color: wellbeingChartColors.algemeen },
    { key: "physical", label: "Fysiek", color: wellbeingChartColors.fysiek },
    { key: "emotional", label: "Emotioneel", color: wellbeingChartColors.emotioneel },
  ]

  const getDataForMetric = (metric: string) => {
    return checkIns.map(c => {
      switch (metric) {
        case "physical": return c.physicalHealth
        case "emotional": return c.emotionalHealth
        default: return c.overallWellbeing
      }
    }).reverse()
  }

  const data = getDataForMetric(activeMetric)
  const maxValue = 4 // Max score is 4
  const chartHeight = 120

  // Get month labels
  const monthLabels = checkIns.map(c => {
    const date = new Date(c.month)
    return date.toLocaleDateString("nl-NL", { month: "short" })
  }).reverse()

  // Calculate average
  const validData = data.filter((d): d is number => d !== null)
  const average = validData.length > 0
    ? (validData.reduce((a, b) => a + b, 0) / validData.length).toFixed(1)
    : "-"

  // Get trend
  const getTrend = () => {
    if (validData.length < 2) return null
    const recent = validData.slice(-3)
    const older = validData.slice(0, Math.min(3, validData.length - 3))
    if (older.length === 0) return null

    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length

    if (recentAvg > olderAvg + 0.3) return "up"
    if (recentAvg < olderAvg - 0.3) return "down"
    return "stable"
  }

  const trend = getTrend()

  if (isLoading) {
    return (
      <div className={cn("bg-card rounded-2xl p-6 border border-border", className)}>
        <div className="animate-pulse">
          <div className="h-6 bg-muted rounded w-1/3 mb-4" />
          <div className="h-32 bg-muted rounded" />
        </div>
      </div>
    )
  }

  if (checkIns.length === 0) {
    return (
      <div className={cn("bg-card rounded-2xl p-6 border border-border", className)}>
        <h3 className="font-semibold text-foreground mb-4">Welzijnsverloop</h3>
        <div className="text-center py-8 text-muted-foreground">
          <span className="text-4xl mb-2 block">📊</span>
          <p>Nog geen check-in data beschikbaar</p>
          <p className="text-sm mt-1">Doe je eerste check-in om je voortgang te zien</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("bg-card rounded-2xl p-6 border border-border", className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground">Welzijnsverloop</h3>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-foreground">{average}</span>
          <span className="text-sm text-muted-foreground">/4</span>
          {trend && (
            <span className={cn(
              "ml-2",
              trend === "up" && "text-green-500",
              trend === "down" && "text-red-500",
              trend === "stable" && "text-yellow-500"
            )}>
              {trend === "up" && "↑"}
              {trend === "down" && "↓"}
              {trend === "stable" && "→"}
            </span>
          )}
        </div>
      </div>

      {/* Metric tabs */}
      <div className="flex gap-2 mb-4">
        {metrics.map((metric) => (
          <button
            key={metric.key}
            onClick={() => setActiveMetric(metric.key as any)}
            className={cn(
              "px-3 py-1.5 rounded-full text-sm font-medium transition-all",
              activeMetric === metric.key
                ? "text-white"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            )}
            style={{
              backgroundColor: activeMetric === metric.key ? metric.color : undefined
            }}
          >
            {metric.label}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="relative" style={{ height: chartHeight + 40 }}>
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-8 w-6 flex flex-col justify-between text-xs text-muted-foreground">
          <span>4</span>
          <span>2</span>
          <span>0</span>
        </div>

        {/* Chart area */}
        <div className="ml-8 h-full">
          {/* Grid lines */}
          <div className="absolute left-8 right-0 top-0" style={{ height: chartHeight }}>
            {[0, 1, 2, 3, 4].map((line) => (
              <div
                key={line}
                className="absolute w-full border-t border-border"
                style={{ top: `${(line / 4) * 100}%` }}
              />
            ))}
          </div>

          {/* Bars / Line */}
          <div className="relative flex items-end justify-between gap-1 h-full pb-8" style={{ height: chartHeight }}>
            {data.map((value, index) => {
              const height = value !== null ? (value / maxValue) * 100 : 0
              const activeColor = metrics.find(m => m.key === activeMetric)?.color || wellbeingChartColors.algemeen

              return (
                <div
                  key={index}
                  className="flex-1 flex flex-col items-center"
                >
                  <div
                    className="w-full max-w-8 rounded-t-lg transition-all duration-500 animate-slide-up"
                    style={{
                      height: `${height}%`,
                      backgroundColor: value !== null ? activeColor : "#e5e7eb",
                      opacity: value !== null ? 1 : 0.3,
                    }}
                  />
                </div>
              )
            })}
          </div>

          {/* X-axis labels */}
          <div className="flex justify-between mt-2">
            {monthLabels.map((label, index) => (
              <span
                key={index}
                className="flex-1 text-center text-xs text-muted-foreground"
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-border">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-xs text-muted-foreground">Goed (3-4)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <span className="text-xs text-muted-foreground">Aandacht (2)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-xs text-muted-foreground">Hulp nodig (1)</span>
        </div>
      </div>
    </div>
  )
}
