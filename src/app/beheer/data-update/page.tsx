"use client"

import { useState, useRef } from "react"

interface ImportResultaat {
  success?: boolean
  toegevoegd?: number
  fouten?: number
  totaalRijen?: number
  foutDetails?: string[]
  error?: string
}

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim())
  if (lines.length < 2) return []

  // Detect separator: tab, semicolon, or comma
  const firstLine = lines[0]
  const separator = firstLine.includes("\t") ? "\t" : firstLine.includes(";") ? ";" : ","

  const headers = lines[0].split(separator).map((h) => h.trim().replace(/^["']|["']$/g, ""))
  const rows: Record<string, string>[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(separator).map((v) => v.trim().replace(/^["']|["']$/g, ""))
    const row: Record<string, string> = {}
    headers.forEach((h, j) => {
      if (h && values[j]) row[h] = values[j]
    })
    if (Object.keys(row).length > 0) rows.push(row)
  }
  return rows
}

export default function DataUpdatePage() {
  // Zutphen update
  const [bezig, setBezig] = useState(false)
  const [resultaat, setResultaat] = useState<{
    success?: boolean
    verwijderd?: number
    toegevoegd?: number
    fouten?: number
    landelijkBijgewerkt?: number
    error?: string
  } | null>(null)

  // CSV Import
  const [importBezig, setImportBezig] = useState(false)
  const [importResultaat, setImportResultaat] = useState<ImportResultaat | null>(null)
  const [csvRows, setCsvRows] = useState<Record<string, string>[]>([])
  const [csvHeaders, setCsvHeaders] = useState<string[]>([])
  const [importGemeente, setImportGemeente] = useState("")
  const [importDekkingNiveau, setImportDekkingNiveau] = useState("GEMEENTE")
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImportResultaat(null)
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      const rows = parseCSV(text)
      setCsvRows(rows)
      if (rows.length > 0) {
        setCsvHeaders(Object.keys(rows[0]))
      }
    }
    reader.readAsText(file, "utf-8")
  }

  const handleImport = async () => {
    if (csvRows.length === 0) return
    if (!importGemeente && importDekkingNiveau !== "LANDELIJK") {
      alert("Vul een gemeente in of kies 'Landelijk' als dekkingsgebied.")
      return
    }
    if (!confirm(`Weet je zeker dat je ${csvRows.length} hulpbronnen wilt importeren?`)) {
      return
    }

    setImportBezig(true)
    setImportResultaat(null)
    try {
      const res = await fetch("/api/beheer/hulpbronnen/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rows: csvRows,
          gemeente: importDekkingNiveau === "LANDELIJK" ? null : importGemeente,
          dekkingNiveau: importDekkingNiveau,
          provincie: null,
        }),
      })
      const data = await res.json()
      setImportResultaat(data)
    } catch {
      setImportResultaat({ error: "Er ging iets mis bij het importeren." })
    } finally {
      setImportBezig(false)
    }
  }

  const resetImport = () => {
    setCsvRows([])
    setCsvHeaders([])
    setImportResultaat(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const verwachteKolommen = [
    { naam: "naam", verplicht: true, toelichting: "Naam van de organisatie" },
    { naam: "beschrijving", verplicht: false, toelichting: "Korte omschrijving" },
    { naam: "doelgroep", verplicht: false, toelichting: "MANTELZORGER of ZORGVRAGER" },
    { naam: "categorie", verplicht: false, toelichting: "Bijv. Persoonlijke verzorging, Emotionele steun" },
    { naam: "soortHulp", verplicht: false, toelichting: "Bijv. Praktische hulp, Informatie en advies" },
    { naam: "type", verplicht: false, toelichting: "GEMEENTE, THUISZORG, VRIJWILLIGERS, OVERIG, etc." },
    { naam: "telefoon", verplicht: false, toelichting: "Telefoonnummer" },
    { naam: "email", verplicht: false, toelichting: "E-mailadres" },
    { naam: "website", verplicht: false, toelichting: "URL" },
    { naam: "adres", verplicht: false, toelichting: "Straat + huisnummer" },
    { naam: "postcode", verplicht: false, toelichting: "Bijv. 7201 AA" },
    { naam: "woonplaats", verplicht: false, toelichting: "Vestigingsplaats" },
    { naam: "openingstijden", verplicht: false, toelichting: "Bijv. Ma-Vr 9:00-17:00" },
    { naam: "kosten", verplicht: false, toelichting: "Bijv. Gratis, Eigen bijdrage" },
    { naam: "aanmeldprocedure", verplicht: false, toelichting: "Bijv. Via website, Bel direct" },
    { naam: "bronLabel", verplicht: false, toelichting: "Landelijk, Gemeente, Zvw, Wlz, Wmo, Overig" },
    { naam: "zorgverzekeraar", verplicht: false, toelichting: "ja of nee" },
    { naam: "isActief", verplicht: false, toelichting: "ja of nee (standaard: ja)" },
  ]

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Data bijwerken</h1>
      <p className="text-gray-600 mb-8">
        Hulpbronnen bijwerken of importeren via CSV-bestand.
      </p>

      {/* CSV Import */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          CSV importeren
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Importeer hulpbronnen vanuit een CSV-bestand (komma, puntkomma of tab-gescheiden).
          Alleen de kolom <code className="bg-gray-100 px-1 rounded">naam</code> is verplicht.
        </p>

        {/* Verwachte kolommen */}
        <details className="mb-4">
          <summary className="text-sm font-medium text-blue-600 cursor-pointer hover:underline">
            Welke kolommen kan het bestand bevatten?
          </summary>
          <div className="mt-2 overflow-x-auto">
            <table className="w-full text-xs border border-gray-200 rounded">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left px-3 py-1.5 border-b">Kolom</th>
                  <th className="text-left px-3 py-1.5 border-b">Verplicht</th>
                  <th className="text-left px-3 py-1.5 border-b">Toelichting</th>
                </tr>
              </thead>
              <tbody>
                {verwachteKolommen.map((k) => (
                  <tr key={k.naam} className="border-b border-gray-100">
                    <td className="px-3 py-1.5 font-mono">{k.naam}</td>
                    <td className="px-3 py-1.5">{k.verplicht ? "Ja" : "Nee"}</td>
                    <td className="px-3 py-1.5 text-gray-600">{k.toelichting}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>

        {/* Dekkingsgebied + Gemeente */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Dekkingsgebied voor alle rijen
            </label>
            <select
              value={importDekkingNiveau}
              onChange={(e) => setImportDekkingNiveau(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
            >
              <option value="LANDELIJK">Landelijk</option>
              <option value="GEMEENTE">Gemeente</option>
            </select>
          </div>
          {importDekkingNiveau !== "LANDELIJK" && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Gemeente
              </label>
              <input
                type="text"
                value={importGemeente}
                onChange={(e) => setImportGemeente(e.target.value)}
                placeholder="Bijv. Zutphen"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
              />
            </div>
          )}
        </div>

        {/* Bestand kiezen */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-600 mb-1">
            CSV-bestand
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.tsv,.txt"
            onChange={handleFileSelect}
            className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>

        {/* Preview */}
        {csvRows.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-700">
                {csvRows.length} rijen gevonden, {csvHeaders.length} kolommen: {csvHeaders.join(", ")}
              </p>
              <button
                onClick={resetImport}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Wissen
              </button>
            </div>
            <div className="overflow-x-auto max-h-48 border border-gray-200 rounded-lg">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 sticky top-0">
                    <th className="px-2 py-1.5 text-left text-gray-500">#</th>
                    {csvHeaders.map((h) => (
                      <th key={h} className="px-2 py-1.5 text-left font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {csvRows.slice(0, 5).map((row, i) => (
                    <tr key={i} className="border-t border-gray-100">
                      <td className="px-2 py-1 text-gray-400">{i + 1}</td>
                      {csvHeaders.map((h) => (
                        <td key={h} className="px-2 py-1 max-w-[200px] truncate">{row[h] || ""}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {csvRows.length > 5 && (
                <p className="text-xs text-gray-400 px-2 py-1 bg-gray-50">
                  ...en {csvRows.length - 5} meer
                </p>
              )}
            </div>

            <button
              onClick={handleImport}
              disabled={importBezig}
              className={`mt-3 px-5 py-2.5 rounded-lg font-medium text-white ${
                importBezig ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {importBezig ? "Bezig met importeren..." : `${csvRows.length} hulpbronnen importeren`}
            </button>
          </div>
        )}

        {/* Import resultaat */}
        {importResultaat && (
          <div className={`mt-4 p-4 rounded-lg ${importResultaat.error ? "bg-red-50 border border-red-200" : "bg-green-50 border border-green-200"}`}>
            {importResultaat.error ? (
              <p className="text-red-700">{importResultaat.error}</p>
            ) : (
              <div className="text-green-800">
                <p className="font-medium mb-2">Import afgerond!</p>
                <ul className="text-sm space-y-1">
                  <li>Toegevoegd: {importResultaat.toegevoegd} van {importResultaat.totaalRijen}</li>
                  {(importResultaat.fouten ?? 0) > 0 && (
                    <li className="text-red-600">Fouten: {importResultaat.fouten}</li>
                  )}
                </ul>
                {importResultaat.foutDetails && importResultaat.foutDetails.length > 0 && (
                  <details className="mt-2">
                    <summary className="text-xs text-red-600 cursor-pointer">Foutdetails bekijken</summary>
                    <ul className="mt-1 text-xs space-y-0.5 text-red-600">
                      {importResultaat.foutDetails.map((f, i) => (
                        <li key={i}>{f}</li>
                      ))}
                    </ul>
                  </details>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Zutphen update */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          Zutphen hulpbronnen (hardcoded data)
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Vervangt alle Zutphen hulpbronnen door de data uit de Sociale Kaart Zutphen 2026.
          Landelijke bronnen blijven behouden.
        </p>

        <button
          onClick={handleUpdate}
          disabled={bezig}
          className={`px-5 py-2.5 rounded-lg font-medium text-white ${
            bezig ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {bezig ? "Bezig met bijwerken..." : "Zutphen data bijwerken"}
        </button>

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
