"use client"

import { useEffect, useRef, useCallback, ReactNode } from "react"

interface AdminModalProps {
  isOpen: boolean
  onClose: () => void
  titel: string
  children: ReactNode
  footer?: ReactNode
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl"
}

const maxWidthClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
}

export function AdminModal({
  isOpen,
  onClose,
  titel,
  children,
  footer,
  maxWidth = "2xl",
}: AdminModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  const handleTabKey = useCallback((e: KeyboardEvent) => {
    if (e.key !== "Tab" || !modalRef.current) return
    const focusable = modalRef.current.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
    )
    if (focusable.length === 0) return
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault()
        last.focus()
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
  }, [])

  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement
      document.body.style.overflow = "hidden"
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") onClose()
        handleTabKey(e)
      }
      document.addEventListener("keydown", handleKeyDown)
      requestAnimationFrame(() => {
        modalRef.current?.focus()
      })
      return () => {
        document.body.style.overflow = ""
        document.removeEventListener("keydown", handleKeyDown)
        previousFocusRef.current?.focus()
      }
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [isOpen, onClose, handleTabKey])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black/30 z-50 flex items-start justify-center pt-10 overflow-y-auto"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-modal-titel"
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        className={`bg-white rounded-xl shadow-xl w-full ${maxWidthClasses[maxWidth]} m-4 p-6 space-y-4 outline-none`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 id="admin-modal-titel" className="text-lg font-semibold text-gray-900">
            {titel}
          </h2>
          <button
            onClick={onClose}
            className="p-2 -mr-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Sluiten"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div>{children}</div>
        {footer && (
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
