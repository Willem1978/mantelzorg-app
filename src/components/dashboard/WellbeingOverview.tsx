"use client"

import { cn } from "@/lib/utils"

interface WellbeingCategory {
  id: string
  name: string
  score: number // 1-3 (1=hulp nodig, 2=aandacht, 3=goed)
  description: string
}

interface WellbeingOverviewProps {
  categories: WellbeingCategory[]
  lastUpdated?: string
}

// Emoticon components
const EmoticonHappy = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={cn("w-full h-full", className)}>
    <circle cx="50" cy="50" r="45" fill="currentColor" />
    <circle cx="35" cy="42" r="5" fill="#1a1a1a" />
    <circle cx="65" cy="42" r="5" fill="#1a1a1a" />
    <path
      d="M 32 58 Q 50 75 68 58"
      stroke="#1a1a1a"
      strokeWidth="4"
      fill="none"
      strokeLinecap="round"
    />
  </svg>
)

const EmoticonNeutral = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={cn("w-full h-full", className)}>
    <circle cx="50" cy="50" r="45" fill="currentColor" />
    <circle cx="35" cy="42" r="5" fill="#1a1a1a" />
    <circle cx="65" cy="42" r="5" fill="#1a1a1a" />
    <line
      x1="35"
      y1="62"
      x2="65"
      y2="62"
      stroke="#1a1a1a"
      strokeWidth="4"
      strokeLinecap="round"
    />
  </svg>
)

const EmoticonSad = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={cn("w-full h-full", className)}>
    <circle cx="50" cy="50" r="45" fill="currentColor" />
    <circle cx="35" cy="42" r="5" fill="#1a1a1a" />
    <circle cx="65" cy="42" r="5" fill="#1a1a1a" />
    <path
      d="M 32 68 Q 50 55 68 68"
      stroke="#1a1a1a"
      strokeWidth="4"
      fill="none"
      strokeLinecap="round"
    />
  </svg>
)

const getEmoticon = (score: number) => {
  if (score >= 3) return <EmoticonHappy className="text-green-400" />
  if (score >= 2) return <EmoticonNeutral className="text-yellow-400" />
  return <EmoticonSad className="text-red-400" />
}

const getStatusLabel = (score: number) => {
  if (score >= 3) return { text: "Goed", color: "text-green-600 bg-green-50" }
  if (score >= 2) return { text: "Aandacht", color: "text-yellow-600 bg-yellow-50" }
  return { text: "Hulp nodig", color: "text-red-600 bg-red-50" }
}

export function WellbeingOverview({ categories, lastUpdated }: WellbeingOverviewProps) {
  // Calculate overall score
  const totalScore = categories.reduce((acc, cat) => acc + cat.score, 0)
  const avgScore = totalScore / categories.length
  const overallStatus = getStatusLabel(avgScore)

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Jouw welzijn</h2>
        {lastUpdated && (
          <span className="text-xs text-gray-500">Bijgewerkt: {lastUpdated}</span>
        )}
      </div>

      {/* Overall status */}
      <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 rounded-xl">
        <div className="w-16 h-16">
          {getEmoticon(avgScore)}
        </div>
        <div>
          <p className="text-sm text-gray-600">Algemeen welzijn</p>
          <span className={cn(
            "inline-block mt-1 px-3 py-1 rounded-full text-sm font-medium",
            overallStatus.color
          )}>
            {overallStatus.text}
          </span>
        </div>
      </div>

      {/* Category breakdown */}
      <div className="space-y-3">
        {categories.map((category) => {
          const status = getStatusLabel(category.score)
          return (
            <div
              key={category.id}
              className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
            >
              <div className="w-10 h-10 flex-shrink-0">
                {getEmoticon(category.score)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{category.name}</p>
                <p className="text-sm text-gray-500 truncate">{category.description}</p>
              </div>
              <span className={cn(
                "flex-shrink-0 px-2 py-1 rounded-full text-xs font-medium",
                status.color
              )}>
                {status.text}
              </span>
            </div>
          )
        })}
      </div>

      {/* Action button */}
      <button className="w-full mt-4 py-3 bg-teal-50 hover:bg-teal-100 text-teal-700 font-medium rounded-xl transition-colors">
        Bekijk details
      </button>
    </div>
  )
}
