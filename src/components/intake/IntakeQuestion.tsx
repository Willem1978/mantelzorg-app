"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

// 3 antwoordopties met emoticons (KER-stijl)
const emotionOptions = [
  {
    value: "nee",
    label: "NEE",
    score: 3,
    bgColor: "bg-green-400",
    hoverColor: "hover:bg-green-500",
    selectedColor: "bg-green-500 ring-4 ring-green-200",
    emoji: "happy"
  },
  {
    value: "soms",
    label: "SOMS",
    score: 2,
    bgColor: "bg-yellow-400",
    hoverColor: "hover:bg-yellow-500",
    selectedColor: "bg-yellow-500 ring-4 ring-yellow-200",
    emoji: "neutral"
  },
  {
    value: "ja",
    label: "JA",
    score: 1,
    bgColor: "bg-red-400",
    hoverColor: "hover:bg-red-500",
    selectedColor: "bg-red-500 ring-4 ring-red-200",
    emoji: "sad"
  },
]

// SVG Emoticons
const EmoticonHappy = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full">
    <circle cx="50" cy="50" r="45" fill="currentColor" />
    <circle cx="35" cy="40" r="6" fill="#1a1a1a" />
    <circle cx="65" cy="40" r="6" fill="#1a1a1a" />
    <path
      d="M 30 60 Q 50 80 70 60"
      stroke="#1a1a1a"
      strokeWidth="4"
      fill="none"
      strokeLinecap="round"
    />
  </svg>
)

const EmoticonNeutral = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full">
    <circle cx="50" cy="50" r="45" fill="currentColor" />
    <circle cx="35" cy="40" r="6" fill="#1a1a1a" />
    <circle cx="65" cy="40" r="6" fill="#1a1a1a" />
    <line
      x1="35"
      y1="65"
      x2="65"
      y2="65"
      stroke="#1a1a1a"
      strokeWidth="4"
      strokeLinecap="round"
    />
  </svg>
)

const EmoticonSad = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full">
    <circle cx="50" cy="50" r="45" fill="currentColor" />
    <circle cx="35" cy="40" r="6" fill="#1a1a1a" />
    <circle cx="65" cy="40" r="6" fill="#1a1a1a" />
    <path
      d="M 30 70 Q 50 55 70 70"
      stroke="#1a1a1a"
      strokeWidth="4"
      fill="none"
      strokeLinecap="round"
    />
  </svg>
)

const getEmoticon = (type: string) => {
  switch (type) {
    case "happy":
      return <EmoticonHappy />
    case "neutral":
      return <EmoticonNeutral />
    case "sad":
      return <EmoticonSad />
    default:
      return <EmoticonNeutral />
  }
}

interface IntakeQuestionProps {
  question: string
  description?: string
  tip?: string
  type?: "THREE_CHOICE" | "TEXT"
  value?: string
  onChange: (value: string) => void
  onAutoAdvance?: () => void
  required?: boolean
}

export function IntakeQuestion({
  question,
  description,
  tip,
  type = "THREE_CHOICE",
  value,
  onChange,
  onAutoAdvance,
  required = true,
}: IntakeQuestionProps) {
  const [selectedValue, setSelectedValue] = useState<string | null>(value || null)
  const [isTransitioning, setIsTransitioning] = useState(false)

  // Reset selected value when question changes
  useEffect(() => {
    setSelectedValue(value || null)
    setIsTransitioning(false)
  }, [question, value])

  const handleOptionClick = (optionValue: string) => {
    if (isTransitioning) return

    setSelectedValue(optionValue)
    setIsTransitioning(true)
    onChange(optionValue)

    // Auto-advance after 0.8 seconds
    if (type !== "TEXT" && onAutoAdvance) {
      setTimeout(() => {
        onAutoAdvance()
        setIsTransitioning(false)
      }, 800)
    }
  }

  return (
    <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100">
      {/* Question */}
      <h3 className="text-xl md:text-2xl font-medium text-gray-800 text-center mb-8 leading-relaxed">
        {question}
      </h3>

      {type === "THREE_CHOICE" && (
        <div className="flex justify-center items-end gap-6 md:gap-10 mb-8">
          {emotionOptions.map((option) => {
            const isSelected = selectedValue === option.value

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => handleOptionClick(option.value)}
                disabled={isTransitioning && !isSelected}
                className={cn(
                  "flex flex-col items-center transition-all duration-300",
                  "transform hover:scale-110 active:scale-95",
                  isTransitioning && !isSelected && "opacity-40 cursor-not-allowed"
                )}
              >
                {/* Emoticon */}
                <div
                  className={cn(
                    "w-20 h-20 md:w-24 md:h-24 rounded-full transition-all duration-300",
                    isSelected ? option.selectedColor : option.bgColor,
                    !isSelected && option.hoverColor,
                    isSelected && "transform scale-110 animate-emoticon-bounce animate-emoticon-pulse"
                  )}
                >
                  {getEmoticon(option.emoji)}
                </div>
                {/* Label */}
                <span className={cn(
                  "mt-3 font-bold text-sm md:text-base tracking-wide transition-all duration-300",
                  isSelected ? "text-gray-900 scale-110" : "text-gray-600"
                )}>
                  {option.label}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {type === "TEXT" && (
        <div className="mb-6">
          <textarea
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Typ hier je antwoord..."
            className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-primary min-h-[150px] resize-none text-lg transition-colors"
          />
        </div>
      )}

      {/* Tip/Info box */}
      {tip && (
        <div className="flex items-start gap-3 bg-gray-50 rounded-2xl p-4 mt-4">
          <div className="flex-shrink-0 w-10 h-10 bg-primary rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-gray-600 text-sm leading-relaxed pt-2">
            {tip}
          </p>
        </div>
      )}

      {/* Visual feedback indicator */}
      {isTransitioning && type !== "TEXT" && (
        <div className="flex justify-center mt-4">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
          </div>
        </div>
      )}
    </div>
  )
}
