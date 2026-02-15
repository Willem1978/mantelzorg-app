"use client"

interface ConfirmDialogProps {
  isOpen: boolean
  titel: string
  beschrijving: string
  bevestigTekst: string
  annuleerTekst?: string
  onBevestig: () => void
  onAnnuleer: () => void
  variant?: "danger" | "warning" | "default"
}

export function ConfirmDialog({
  isOpen,
  titel,
  beschrijving,
  bevestigTekst,
  annuleerTekst = "Nee, ga terug",
  onBevestig,
  onAnnuleer,
  variant = "default",
}: ConfirmDialogProps) {
  if (!isOpen) return null

  return (
    <div className="ker-confirm-overlay" onClick={onAnnuleer}>
      <div
        className="ker-confirm-dialog"
        onClick={(e) => e.stopPropagation()}
        role="alertdialog"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-desc"
      >
        <div className="flex items-center gap-3 mb-3">
          {variant === "danger" && (
            <div className="w-10 h-10 rounded-full bg-[var(--accent-red-bg)] flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-[var(--accent-red)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
          )}
          {variant === "warning" && (
            <div className="w-10 h-10 rounded-full bg-[var(--accent-amber-bg)] flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-[var(--accent-amber)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          )}
          <h3 id="confirm-title" className="text-lg font-bold text-foreground">
            {titel}
          </h3>
        </div>

        <p id="confirm-desc" className="text-muted-foreground mb-6 leading-relaxed">
          {beschrijving}
        </p>

        <div className="flex flex-col gap-2">
          <button
            onClick={onBevestig}
            className={`ker-btn w-full ${
              variant === "danger"
                ? "bg-[var(--accent-red)] text-white hover:bg-[var(--accent-red)]/90"
                : "ker-btn-primary"
            }`}
          >
            {bevestigTekst}
          </button>
          <button
            onClick={onAnnuleer}
            className="ker-btn ker-btn-secondary w-full"
          >
            {annuleerTekst}
          </button>
        </div>
      </div>
    </div>
  )
}
