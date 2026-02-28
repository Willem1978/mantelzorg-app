"use client"

import { useEffect } from "react"

export default function GemeenteError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Gemeente portaal error:", error)
  }, [error])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-14 h-14 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Oeps, dat lukte niet</h1>
          <p className="text-gray-500 text-sm mb-2">
            Er ging iets fout in het gemeenteportaal. Probeer het opnieuw.
          </p>
          <p className="text-gray-400 text-xs mb-4">
            Lukt het niet? Log opnieuw in of neem contact op met de beheerder.
          </p>
          <div className="flex flex-col gap-3 mt-6">
            <button
              onClick={reset}
              className="w-full py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors"
            >
              Opnieuw proberen
            </button>
            <a
              href="/gemeente/login"
              className="w-full py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors inline-block"
            >
              Naar inlogpagina
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
