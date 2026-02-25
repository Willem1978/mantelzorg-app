"use client"

import { cn } from "@/lib/utils"
import { emoticonColors } from "@/config/colors"

interface SmileyButtonProps {
  value: "nee" | "soms" | "ja"
  selected: boolean
  hasOtherSelection: boolean
  onClick: () => void
  disabled?: boolean
  size?: "sm" | "md" | "lg"
}

// SVG Smiley faces gebaseerd op het design
const SmileySvg = ({ type, colored }: { type: "nee" | "soms" | "ja"; colored: boolean }) => {
  const size = 48

  const color = emoticonColors[type]
  const bgColor = colored ? color.bg : "#E0E0E0"
  const faceColor = colored ? color.face : "#9E9E9E"

  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      {/* Cirkel achtergrond */}
      <circle cx="24" cy="24" r="24" fill={bgColor} />

      {/* Ogen */}
      <circle cx="16" cy="20" r="3" fill={faceColor} />
      <circle cx="32" cy="20" r="3" fill={faceColor} />

      {/* Mond gebaseerd op type */}
      {type === "nee" && (
        // Blije mond (smile)
        <path
          d="M14 30 Q24 38 34 30"
          stroke={faceColor}
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
      )}
      {type === "soms" && (
        // Neutrale mond (rechte lijn)
        <line
          x1="14"
          y1="32"
          x2="34"
          y2="32"
          stroke={faceColor}
          strokeWidth="3"
          strokeLinecap="round"
        />
      )}
      {type === "ja" && (
        // Droevige mond (frown)
        <path
          d="M14 36 Q24 28 34 36"
          stroke={faceColor}
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
      )}

      {/* Checkmark bij selectie */}
      {colored && (
        <g>
          <circle cx="38" cy="10" r="8" fill="#4CAF50" stroke="white" strokeWidth="2" />
          <path
            d="M34 10 L37 13 L42 7"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </g>
      )}
    </svg>
  )
}

export function SmileyButton({
  value,
  selected,
  hasOtherSelection,
  onClick,
  disabled = false,
  size = "md",
}: SmileyButtonProps) {
  const labels = {
    nee: "NEE",
    soms: "SOMS",
    ja: "JA",
  }

  const sizeClasses = {
    sm: "w-14 h-14",
    md: "w-16 h-16",
    lg: "w-20 h-20",
  }

  // Is gekleurd als: geselecteerd OF geen selectie gemaakt
  const isColored = selected || !hasOtherSelection

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex flex-col items-center gap-2 transition-all duration-300",
        disabled && "cursor-not-allowed"
      )}
    >
      <div
        className={cn(
          "rounded-full flex items-center justify-center transition-all duration-300",
          sizeClasses[size],
          selected && "scale-110 ring-4 ring-offset-2",
          selected && value === "nee" && "ring-[#7CB342]",
          selected && value === "soms" && "ring-[#FFD54F]",
          selected && value === "ja" && "ring-[#EF5350]",
          !selected && hasOtherSelection && "opacity-40"
        )}
      >
        <SmileySvg type={value} colored={isColored && !(!selected && hasOtherSelection)} />
      </div>
      <span
        className={cn(
          "text-sm font-bold uppercase tracking-wide transition-all duration-300",
          selected ? "text-foreground" : hasOtherSelection ? "text-gray-400" : "text-muted-foreground"
        )}
      >
        {labels[value]}
      </span>
    </button>
  )
}

// Groep component voor 3 smileys
interface SmileyGroupProps {
  value: string | null
  onChange: (value: "nee" | "soms" | "ja") => void
  disabled?: boolean
  size?: "sm" | "md" | "lg"
  order?: ("nee" | "soms" | "ja")[]
}

export function SmileyGroup({
  value,
  onChange,
  disabled = false,
  size = "md",
  order = ["nee", "soms", "ja"],
}: SmileyGroupProps) {
  const hasSelection = !!value

  return (
    <div className="flex justify-center gap-8">
      {order.map((option) => (
        <SmileyButton
          key={option}
          value={option}
          selected={value === option}
          hasOtherSelection={hasSelection && value !== option}
          onClick={() => onChange(option)}
          disabled={disabled}
          size={size}
        />
      ))}
    </div>
  )
}

// Statische smiley voor resultaat/rapport weergave
interface ResultSmileyProps {
  type: "nee" | "soms" | "ja" | "green" | "amber" | "red"
  size?: "sm" | "md" | "lg" | "xl"
}

export function ResultSmiley({ type, size = "lg" }: ResultSmileyProps) {
  // Map kleuren naar smiley types
  const mappedType = type === "green" ? "nee" : type === "amber" ? "soms" : type === "red" ? "ja" : type

  const sizeClasses = {
    sm: "w-10 h-10",
    md: "w-14 h-14",
    lg: "w-20 h-20",
    xl: "w-24 h-24",
  }

  return (
    <div className={cn("flex items-center justify-center", sizeClasses[size])}>
      <SmileySvg type={mappedType} colored={true} />
    </div>
  )
}

export default SmileyButton
