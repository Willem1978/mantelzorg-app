"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"

interface PdfDownloadButtonProps {
  testId: string
  size?: "sm" | "md"
  variant?: "icon" | "button"
  className?: string
}

export function PdfDownloadButton({ testId, size = "md", variant = "icon", className }: PdfDownloadButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (loading) return
    setLoading(true)

    try {
      const res = await fetch(`/api/balanstest/${testId}`)
      if (!res.ok) throw new Error("Ophalen mislukt")

      const data = await res.json()

      // Dynamic import zodat jsPDF niet in de initiele bundle zit
      const { generatePdfRapport } = await import("@/lib/pdf-rapport")
      generatePdfRapport(data)
    } catch (error) {
      console.error("PDF generatie mislukt:", error)
    } finally {
      setLoading(false)
    }
  }

  const spinnerIcon = (
    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )

  const downloadIcon = (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  )

  // Compact knop met label (voor in de rij naast andere knoppen)
  if (size === "sm" && variant === "button") {
    return (
      <button
        type="button"
        onClick={handleDownload}
        disabled={loading}
        className={cn(
          "flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-medium rounded-lg bg-muted text-foreground hover:bg-muted/70 transition-colors disabled:opacity-50",
          className
        )}
        aria-label="Download PDF rapport"
      >
        {loading ? spinnerIcon : downloadIcon}
        PDF
      </button>
    )
  }

  // Klein icoon-only (fallback)
  if (size === "sm") {
    return (
      <button
        type="button"
        onClick={handleDownload}
        disabled={loading}
        className={cn(
          "p-2 text-muted-foreground hover:text-primary transition-colors rounded-lg disabled:opacity-50",
          className
        )}
        aria-label="Download PDF rapport"
      >
        {loading ? spinnerIcon : downloadIcon}
      </button>
    )
  }

  // Groot (volledige breedte knop)
  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={loading}
      className={cn(
        "w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50",
        className
      )}
    >
      {loading ? (
        <>
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          PDF maken...
        </>
      ) : (
        <>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Download adviesrapport (PDF)
        </>
      )}
    </button>
  )
}
