"use client"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui"
import { cn } from "@/lib/utils"

interface WellbeingScore {
  label: string
  value: number
  previousValue?: number
  color: "teal" | "amber" | "red" | "green"
}

interface WellbeingCardProps {
  scores: WellbeingScore[]
  lastCheckIn?: string
}

export function WellbeingCard({ scores, lastCheckIn }: WellbeingCardProps) {
  const getScoreColor = (value: number) => {
    if (value >= 7) return "text-green-600"
    if (value >= 5) return "text-amber-600"
    return "text-red-600"
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
            <span className="text-xs text-gray-500">
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
                className="bg-gray-50 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">{score.label}</span>
                  {trend && (
                    <span className={cn(
                      "text-xs",
                      trend === "up" && "text-green-600",
                      trend === "down" && "text-red-600",
                      trend === "stable" && "text-gray-400"
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
                  <span className="text-gray-400 text-sm mb-1">/10</span>
                </div>
                {/* Progress bar */}
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={cn(
                      "h-2 rounded-full transition-all duration-500",
                      score.value >= 7 && "bg-green-500",
                      score.value >= 5 && score.value < 7 && "bg-amber-500",
                      score.value < 5 && "bg-red-500"
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
