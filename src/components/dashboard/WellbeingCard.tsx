"use client"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui"
import { cn } from "@/lib/utils"

interface WellbeingScore {
  label: string
  value: number
  previousValue?: number
  color: "primary" | "amber" | "red" | "green"
}

interface WellbeingCardProps {
  scores: WellbeingScore[]
  lastCheckIn?: string
}

export function WellbeingCard({ scores, lastCheckIn }: WellbeingCardProps) {
  const getScoreColor = (value: number) => {
    if (value >= 7) return "text-accent-green"
    if (value >= 5) return "text-accent-amber"
    return "text-accent-red"
  }

  const getTrend = (current: number, previous?: number) => {
    if (!previous) return null
    if (current > previous) return "up"
    if (current < previous) return "down"
    return "stable"
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle>Hoe gaat het met je?</CardTitle>
          {lastCheckIn && (
            <span className="text-sm text-muted-foreground">
              Laatste check-in: {lastCheckIn}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {scores.map((score) => {
            const trend = getTrend(score.value, score.previousValue)
            return (
              <div
                key={score.label}
                className="bg-secondary rounded-xl p-4 border border-border"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-base text-foreground font-medium">{score.label}</span>
                  {trend && (
                    <span className={cn(
                      "text-sm font-bold",
                      trend === "up" && "text-accent-green",
                      trend === "down" && "text-accent-red",
                      trend === "stable" && "text-muted-foreground"
                    )}>
                      {trend === "up" && "↑"}
                      {trend === "down" && "↓"}
                      {trend === "stable" && "→"}
                    </span>
                  )}
                </div>
                <div className="flex items-end space-x-2">
                  <span className={cn("text-3xl font-bold", getScoreColor(score.value))}>
                    {score.value}
                  </span>
                  <span className="text-muted-foreground text-base mb-1">/10</span>
                </div>
                {/* Progress bar */}
                <div className="mt-2 w-full bg-muted rounded-full h-2.5">
                  <div
                    className={cn(
                      "h-2.5 rounded-full transition-all duration-500",
                      score.value >= 7 && "bg-accent-green",
                      score.value >= 5 && score.value < 7 && "bg-accent-amber",
                      score.value < 5 && "bg-accent-red"
                    )}
                    style={{ width: `${score.value * 10}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
