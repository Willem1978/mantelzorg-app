"use client"

import { useAccessibility } from "@/contexts/AccessibilityContext"

export function AccessibilitySettings() {
  const { highContrast, toggleHighContrast, largeText, toggleLargeText, reduceMotion, toggleReduceMotion } = useAccessibility()

  return (
    <div className="space-y-3">
      <h3 className="font-bold text-lg text-foreground">Weergave-instellingen</h3>
      <p className="text-muted-foreground mb-4">Pas de app aan zodat het prettig is om te gebruiken.</p>

      <ToggleOption
        label="Grotere tekst"
        beschrijving="Maakt alle tekst iets groter"
        isActive={largeText}
        onToggle={toggleLargeText}
        emoji="🔤"
      />

      <ToggleOption
        label="Hoog contrast"
        beschrijving="Maakt tekst en randen scherper"
        isActive={highContrast}
        onToggle={toggleHighContrast}
        emoji="🔲"
      />

      <ToggleOption
        label="Minder beweging"
        beschrijving="Schakelt animaties uit"
        isActive={reduceMotion}
        onToggle={toggleReduceMotion}
        emoji="🎯"
      />
    </div>
  )
}

function ToggleOption({
  label,
  beschrijving,
  isActive,
  onToggle,
  emoji,
}: {
  label: string
  beschrijving: string
  isActive: boolean
  onToggle: () => void
  emoji: string
}) {
  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all min-h-[64px]"
      style={{
        borderColor: isActive ? "var(--primary)" : "var(--border)",
        background: isActive ? "var(--primary-light)" : "var(--card)",
      }}
      role="switch"
      aria-checked={isActive}
    >
      <span className="text-2xl flex-shrink-0">{emoji}</span>
      <div className="flex-1 text-left">
        <p className="font-semibold text-foreground">{label}</p>
        <p className="text-sm text-muted-foreground">{beschrijving}</p>
      </div>
      <div
        className="w-12 h-7 rounded-full transition-colors flex-shrink-0 relative"
        style={{
          background: isActive ? "var(--primary)" : "var(--border)",
        }}
      >
        <div
          className="absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform"
          style={{
            transform: isActive ? "translateX(22px)" : "translateX(2px)",
          }}
        />
      </div>
    </button>
  )
}
