import { cn } from "@/lib/utils"

interface ProgressProps {
  value: number
  max?: number
  className?: string
  showLabel?: boolean
  color?: "primary" | "amber" | "red" | "green"
}

export function Progress({
  value,
  max = 100,
  className,
  showLabel = false,
  color = "primary",
}: ProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)

  const colors = {
    primary: "bg-primary",
    amber: "bg-amber-500",
    red: "bg-red-500",
    green: "bg-green-500",
  }

  return (
    <div className={cn("w-full", className)}>
      <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-300", colors[color])}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <p className="text-sm text-gray-600 mt-1">{Math.round(percentage)}%</p>
      )}
    </div>
  )
}
