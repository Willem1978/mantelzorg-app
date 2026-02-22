"use client"

import { useState } from "react"

export default function DataUpdatePage() {
  const [bezig, setBezig] = useState(false)
  const [resultaat, setResultaat] = useState<{
    success?: boolean
    verwijderd?: number
    toegevoegd?: number
    fouten?: number
    landelijkBijgewerkt?: number
    error?: string
  } | null>(null)

  const handleUpdate = async () => {
    if (!confirm("Weet je zeker dat je de Zutphen hulpbronnen wilt bijwerken? De oude worden verwijderd en vervangen door de nieuwe.")) {
      return
    }

    setBezig(true)
    setResultaat(null)

    try {
      const res = await fetch("/api/seed/zutphen", { method: "POST" })
      const data = await res.json()
      setResultaat(data)
    } catch {
      setResultaat({ error: "Er ging iets mis. Probeer het opnieuw." })
    } finally {
      setBezig(false)
    }
  }

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Data bijwerken</h1>
      <p className="text-gray-600 mb-8">
        Hier kun je de hulpbronnen in de database bijwerken.
      </p>

      {/* Zutphen update */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          Zutphen hulpbronnen
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Vervangt alle Zutphen hulpbronnen door de data uit de Sociale Kaart Zutphen 2026.
          Landelijke bronnen blijven behouden.
        </p>

        <button
          onClick={handleUpdate}
          disabled={bezig}
          className={`
            px-5 py-2.5 rounded-lg font-medium text-white
            ${bezig
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
            }
          `}
        >
          {bezig ? "Bezig met bijwerken..." : "Zutphen data bijwerken"}
        </button>

        {/* Resultaat */}
        {resultaat && (
          <div className={`mt-4 p-4 rounded-lg ${resultaat.error ? "bg-red-50 border border-red-200" : "bg-green-50 border border-green-200"}`}>
            {resultaat.error ? (
              <p className="text-red-700">{resultaat.error}</p>
            ) : (
              <div className="text-green-800">
                <p className="font-medium mb-2">Bijwerken gelukt!</p>
                <ul className="text-sm space-y-1">
                  <li>Oude hulpbronnen verwijderd: {resultaat.verwijderd}</li>
                  <li>Nieuwe hulpbronnen toegevoegd: {resultaat.toegevoegd}</li>
                  <li>Landelijke bronnen bijgewerkt: {resultaat.landelijkBijgewerkt}</li>
                  {(resultaat.fouten ?? 0) > 0 && (
                    <li className="text-red-600">Fouten: {resultaat.fouten}</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
