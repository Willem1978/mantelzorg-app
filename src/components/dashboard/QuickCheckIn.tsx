"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"

interface QuickCheckInProps {
  onSubmit?: (feeling: string) => void
}

const feelings = [
  { value: "great", label: "Super", emoji: "happy", color: "bg-green-400 hover:bg-green-500" },
  { value: "good", label: "Goed", emoji: "happy", color: "bg-green-300 hover:bg-green-400" },
  { value: "okay", label: "Oké", emoji: "neutral", color: "bg-yellow-400 hover:bg-yellow-500" },
  { value: "tired", label: "Moe", emoji: "neutral", color: "bg-yellow-300 hover:bg-yellow-400" },
  { value: "struggling", label: "Zwaar", emoji: "sad", color: "bg-red-400 hover:bg-red-500" },
]

const EmoticonHappy = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full">
    <circle cx="50" cy="50" r="45" fill="currentColor" />
    <circle cx="35" cy="42" r="5" fill="#1a1a1a" />
    <circle cx="65" cy="42" r="5" fill="#1a1a1a" />
    <path d="M 32 58 Q 50 75 68 58" stroke="#1a1a1a" strokeWidth="4" fill="none" strokeLinecap="round" />
  </svg>
)

const EmoticonNeutral = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full">
    <circle cx="50" cy="50" r="45" fill="currentColor" />
    <circle cx="35" cy="42" r="5" fill="#1a1a1a" />
    <circle cx="65" cy="42" r="5" fill="#1a1a1a" />
    <line x1="35" y1="62" x2="65" y2="62" stroke="#1a1a1a" strokeWidth="4" strokeLinecap="round" />
  </svg>
)

const EmoticonSad = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full">
    <circle cx="50" cy="50" r="45" fill="currentColor" />
    <circle cx="35" cy="42" r="5" fill="#1a1a1a" />
    <circle cx="65" cy="42" r="5" fill="#1a1a1a" />
    <path d="M 32 68 Q 50 55 68 68" stroke="#1a1a1a" strokeWidth="4" fill="none" strokeLinecap="round" />
  </svg>
)

const getEmoticon = (type: string) => {
  switch (type) {
    case "happy": return <EmoticonHappy />
    case "neutral": return <EmoticonNeutral />
    case "sad": return <EmoticonSad />
    default: return <EmoticonNeutral />
  }
}

export function QuickCheckIn({ onSubmit }: QuickCheckInProps) {
  const [selectedFeeling, setSelectedFeeling] = useState<string | null>(null)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSelect = (value: string) => {
    setSelectedFeeling(value)
    setIsSubmitted(true)
    onSubmit?.(value)

    // Reset after 3 seconds
    setTimeout(() => {
      setIsSubmitted(false)
      setSelectedFeeling(null)
    }, 3000)
  }

  if (isSubmitted) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="text-center py-4">
          <div className="w-16 h-16 mx-auto mb-3 text-green-500">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="font-medium text-gray-900">Bedankt!</p>
          <p className="text-sm text-gray-500 mt-1">Je gevoel is opgeslagen</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <h2 className="text-lg font-semibold text-gray-900 mb-2">Hoe voel je je nu?</h2>
      <p className="text-sm text-gray-500 mb-4">Een snelle check-in voor vandaag</p>

      <div className="flex justify-between gap-2">
        {feelings.map((feeling) => (
          <button
            key={feeling.value}
            onClick={() => handleSelect(feeling.value)}
            className={cn(
              "flex-1 flex flex-col items-center p-3 rounded-xl transition-all",
              "hover:scale-105 active:scale-95",
              selectedFeeling === feeling.value ? "ring-2 ring-primary" : ""
            )}
          >
            <div className={cn("w-12 h-12 rounded-full mb-2", feeling.color)}>
              {getEmoticon(feeling.emoji)}
            </div>
            <span className="text-xs font-medium text-gray-600">{feeling.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
