"use client"

import { cn } from "@/lib/utils"

interface Tip {
  id: string
  title: string
  description: string
  category: string
  icon: string
  priority: "high" | "medium" | "low"
}

interface TipsCardProps {
  tips: Tip[]
  title?: string
}

const priorityColors = {
  high: "border-l-accent-red bg-accent-red-bg",
  medium: "border-l-accent-amber bg-accent-amber-bg",
  low: "border-l-accent-green bg-accent-green-bg",
}

export function TipsCard({ tips, title = "Persoonlijke tips" }: TipsCardProps) {
  return (
    <div className="bg-card rounded-2xl p-6 shadow-[0_2px_12px_rgba(45,35,25,0.05)] border border-border">
      <h2 className="text-lg font-semibold text-foreground mb-4">{title}</h2>

      <div className="space-y-3">
        {tips.map((tip) => (
          <div
            key={tip.id}
            className={cn(
              "p-4 rounded-xl border-l-4 cursor-pointer hover:shadow-md transition-shadow min-h-[48px]",
              priorityColors[tip.priority]
            )}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl">{tip.icon}</span>
              <div className="flex-1">
                <h3 className="font-medium text-foreground">{tip.title}</h3>
                <p className="text-base text-muted-foreground mt-1">{tip.description}</p>
                <span className="inline-block mt-2 text-sm text-muted-foreground bg-card px-3 py-1 rounded-full border border-border">
                  {tip.category}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button className="w-full mt-4 py-3 text-primary hover:text-primary/80 font-medium min-h-[48px] text-base">
        Meer tips bekijken →
      </button>
    </div>
  )
}
