"use client"

import { createContext, useContext, useState, useCallback, ReactNode } from "react"
import { cn } from "@/lib/utils"

type ToastType = "success" | "error" | "warning" | "info"

interface Toast {
  id: string
  message: string
  type: ToastType
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void
  showSuccess: (message: string) => void
  showError: (message: string) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error("useToast moet binnen ToastProvider gebruikt worden")
  }
  return context
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((message: string, type: ToastType = "info") => {
    const id = Math.random().toString(36).substring(7)
    setToasts((prev) => [...prev, { id, message, type }])

    // Auto-remove na 4 seconden (langer voor ouderen)
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4000)
  }, [])

  const showSuccess = useCallback((message: string) => showToast(message, "success"), [showToast])
  const showError = useCallback((message: string) => showToast(message, "error"), [showToast])

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  return (
    <ToastContext.Provider value={{ showToast, showSuccess, showError }}>
      {children}

      {/* Toast container - bovenaan scherm voor zichtbaarheid */}
      <div className="fixed top-4 left-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none md:left-auto md:right-4 md:max-w-sm">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              "pointer-events-auto p-4 rounded-xl shadow-lg border-2 animate-slide-up",
              "flex items-start gap-3 min-h-[56px]",
              // Kleuren per type - hoog contrast
              toast.type === "success" && "bg-[var(--accent-green-bg)] border-[var(--accent-green)] text-[var(--accent-green)]",
              toast.type === "error" && "bg-[var(--accent-red-bg)] border-[var(--accent-red)] text-[var(--accent-red)]",
              toast.type === "warning" && "bg-[var(--accent-amber-bg)] border-[var(--accent-amber)] text-[var(--accent-amber)]",
              toast.type === "info" && "bg-card border-border text-foreground"
            )}
            role="alert"
            aria-live="polite"
          >
            {/* Icoon */}
            <span className="text-xl flex-shrink-0">
              {toast.type === "success" && "✓"}
              {toast.type === "error" && "✗"}
              {toast.type === "warning" && "⚠"}
              {toast.type === "info" && "ℹ"}
            </span>

            {/* Bericht - B1 niveau, groot genoeg */}
            <p className="flex-1 text-base font-medium text-foreground leading-snug">
              {toast.message}
            </p>

            {/* Sluiten knop - groot touch target */}
            <button
              onClick={() => removeToast(toast.id)}
              className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-black/10 transition-colors"
              aria-label="Sluiten"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
