"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"

interface DateRangeFilterProps {
  onChange: (range: { van: string; tot: string } | null) => void
  className?: string
}

const PRESETS = [
  { label: "Vandaag", days: 0 },
  { label: "7 dagen", days: 7 },
  { label: "30 dagen", days: 30 },
  { label: "90 dagen", days: 90 },
  { label: "Dit jaar", days: -1 },
  { label: "Alles", days: -2 },
]

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0]
}

export function DateRangeFilter({ onChange, className }: DateRangeFilterProps) {
  const [activePreset, setActivePreset] = useState<number>(-2) // "Alles" default
  const [customVan, setCustomVan] = useState("")
  const [customTot, setCustomTot] = useState("")
  const [showCustom, setShowCustom] = useState(false)

  function applyPreset(days: number) {
    setActivePreset(days)
    setShowCustom(false)

    if (days === -2) {
      // Alles
      onChange(null)
      return
    }

    const tot = new Date()
    let van: Date

    if (days === -1) {
      // Dit jaar
      van = new Date(tot.getFullYear(), 0, 1)
    } else if (days === 0) {
      // Vandaag
      van = new Date(tot.getFullYear(), tot.getMonth(), tot.getDate())
    } else {
      van = new Date(tot)
      van.setDate(van.getDate() - days)
    }

    onChange({ van: formatDate(van), tot: formatDate(tot) })
  }

  function applyCustom() {
    if (customVan && customTot) {
      setActivePreset(-3) // custom
      onChange({ van: customVan, tot: customTot })
    }
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map((p) => (
          <button
            key={p.days}
            type="button"
            onClick={() => applyPreset(p.days)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
              activePreset === p.days
                ? "bg-blue-100 text-blue-700"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            )}
          >
            {p.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setShowCustom(!showCustom)}
          className={cn(
            "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
            showCustom || activePreset === -3
              ? "bg-blue-100 text-blue-700"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          )}
        >
          Aangepast
        </button>
      </div>

      {showCustom && (
        <div className="flex items-center gap-2 mt-2">
          <input
            type="date"
            value={customVan}
            onChange={(e) => setCustomVan(e.target.value)}
            className="px-2 py-1.5 border rounded-lg text-sm"
          />
          <span className="text-gray-400">t/m</span>
          <input
            type="date"
            value={customTot}
            onChange={(e) => setCustomTot(e.target.value)}
            className="px-2 py-1.5 border rounded-lg text-sm"
          />
          <button
            type="button"
            onClick={applyCustom}
            disabled={!customVan || !customTot}
            className="px-3 py-1.5 bg-primary text-white rounded-lg text-sm font-medium disabled:opacity-50"
          >
            Toepassen
          </button>
        </div>
      )}
    </div>
  )
}
