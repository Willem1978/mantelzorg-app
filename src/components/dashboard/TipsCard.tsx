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
  high: "border-l-red-500 bg-red-50",
  medium: "border-l-yellow-500 bg-yellow-50",
  low: "border-l-green-500 bg-green-50",
}

export function TipsCard({ tips, title = "Persoonlijke tips" }: TipsCardProps) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">{title}</h2>

      <div className="space-y-3">
        {tips.map((tip) => (
          <div
            key={tip.id}
            className={cn(
              "p-4 rounded-xl border-l-4 cursor-pointer hover:shadow-md transition-shadow",
              priorityColors[tip.priority]
            )}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl">{tip.icon}</span>
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">{tip.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{tip.description}</p>
                <span className="inline-block mt-2 text-xs text-gray-500 bg-white px-2 py-1 rounded-full">
                  {tip.category}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button className="w-full mt-4 py-3 text-primary hover:text-primary/80 font-medium">
        Meer tips bekijken →
      </button>
    </div>
  )
}
