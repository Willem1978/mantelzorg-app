"use client"

import { cn } from "@/lib/utils"

interface Category {
  id: string
  name: string
  questionsCount: number
  answeredCount: number
}

interface IntakeProgressProps {
  categories: Category[]
  currentCategoryId: string
  onCategoryClick?: (categoryId: string) => void
}

export function IntakeProgress({
  categories,
  currentCategoryId,
  onCategoryClick,
}: IntakeProgressProps) {
  const totalQuestions = categories.reduce((acc, cat) => acc + cat.questionsCount, 0)
  const totalAnswered = categories.reduce((acc, cat) => acc + cat.answeredCount, 0)
  const overallProgress = totalQuestions > 0 ? (totalAnswered / totalQuestions) * 100 : 0

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-semibold text-gray-900">Voortgang</h3>
          <span className="text-sm text-gray-500">
            {totalAnswered} / {totalQuestions} vragen
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${overallProgress}%` }}
          />
        </div>
      </div>

      <div className="space-y-2">
        {categories.map((category, index) => {
          const isComplete = category.answeredCount === category.questionsCount
          const isCurrent = category.id === currentCategoryId
          const progress = category.questionsCount > 0
            ? (category.answeredCount / category.questionsCount) * 100
            : 0

          return (
            <button
              key={category.id}
              onClick={() => onCategoryClick?.(category.id)}
              className={cn(
                "w-full text-left p-3 rounded-lg transition-all",
                isCurrent && "bg-primary-light border-2 border-primary/30",
                !isCurrent && "hover:bg-gray-50 border-2 border-transparent"
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center space-x-2">
                  <span
                    className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium",
                      isComplete && "bg-primary text-white",
                      isCurrent && !isComplete && "bg-primary/10 text-primary",
                      !isCurrent && !isComplete && "bg-gray-200 text-gray-600"
                    )}
                  >
                    {isComplete ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      index + 1
                    )}
                  </span>
                  <span className={cn(
                    "text-sm font-medium",
                    isCurrent ? "text-primary" : "text-gray-700"
                  )}>
                    {category.name}
                  </span>
                </div>
                <span className="text-xs text-gray-500">
                  {category.answeredCount}/{category.questionsCount}
                </span>
              </div>
              <div className="ml-8 w-full bg-gray-200 rounded-full h-1">
                <div
                  className={cn(
                    "h-1 rounded-full transition-all duration-300",
                    isComplete ? "bg-primary" : "bg-primary/40"
                  )}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
