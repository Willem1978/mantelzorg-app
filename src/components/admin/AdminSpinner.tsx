"use client"

interface AdminSpinnerProps {
  tekst?: string
}

export function AdminSpinner({ tekst = "Laden..." }: AdminSpinnerProps) {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        <span className="text-gray-500 text-sm">{tekst}</span>
      </div>
    </div>
  )
}
