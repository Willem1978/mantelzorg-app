"use client"

interface AdminEmptyStateProps {
  icon?: string
  titel: string
  beschrijving?: string
  actieLabel?: string
  onActie?: () => void
}

export function AdminEmptyState({
  icon = "📭",
  titel,
  beschrijving,
  actieLabel,
  onActie,
}: AdminEmptyStateProps) {
  return (
    <div className="p-8 text-center">
      <span className="text-4xl block mb-3">{icon}</span>
      <p className="text-gray-700 font-medium">{titel}</p>
      {beschrijving && (
        <p className="text-gray-400 text-sm mt-1">{beschrijving}</p>
      )}
      {actieLabel && onActie && (
        <button
          onClick={onActie}
          className="mt-3 text-blue-600 text-sm font-medium hover:underline"
        >
          {actieLabel}
        </button>
      )}
    </div>
  )
}
