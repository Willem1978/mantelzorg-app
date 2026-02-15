"use client"

import { useState } from "react"

interface Report {
  id: string
  title: string
  description: string
  format: "CSV" | "Rapport"
  icon: string
}

const reports: Report[] = [
  {
    id: "demografisch-overzicht",
    title: "Demografisch overzicht",
    description: "Overzicht van mantelzorgers per leeftijdsgroep, zorguren en belastingniveau. Bevat geanonimiseerde statistieken.",
    format: "CSV",
    icon: "csv",
  },
  {
    id: "belastbaarheid-rapport",
    title: "Belastbaarheid rapport",
    description: "Gedetailleerd rapport met gemiddelde belastingsscores, trends en verdeling per niveau. Opgemaakt als afdrukbaar document.",
    format: "Rapport",
    icon: "rapport",
  },
  {
    id: "hulpvragen-export",
    title: "Hulpvragen export",
    description: "Export van hulpvragen per categorie, status en urgentie. Inclusief aantallen en percentages.",
    format: "CSV",
    icon: "csv",
  },
  {
    id: "signalering-rapport",
    title: "Signalering rapport",
    description: "Overzicht van alarmen en signaleringen met type-verdeling, urgentieniveaus en afhandelstatus.",
    format: "Rapport",
    icon: "rapport",
  },
  {
    id: "maandrapportage",
    title: "Maandrapportage",
    description: "Samenvatting van alle kerngegevens. Geschikt voor bestuurlijke rapportage. Kan direct afgedrukt worden als PDF.",
    format: "Rapport",
    icon: "rapport",
  },
  {
    id: "trend-analyse",
    title: "Trend analyse",
    description: "Maandelijkse trendgegevens met belastingsscores en testaantallen. Exporteerbaar voor eigen analyses.",
    format: "CSV",
    icon: "csv",
  },
]

export default function GemeenteRapportages() {
  const [downloading, setDownloading] = useState<string | null>(null)

  const handleDownload = async (report: Report) => {
    setDownloading(report.id)

    try {
      if (report.format === "CSV") {
        // CSV exports via de API
        const res = await fetch("/api/gemeente/rapportages?format=csv")
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error || "Kon rapport niet downloaden")
        }
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `mantelbuddy-rapportage-${report.id}.csv`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      } else {
        // Rapport exports als downloadbaar HTML-bestand
        const res = await fetch("/api/gemeente/rapportages?format=rapport")
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error || "Kon rapport niet downloaden")
        }
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `mantelbuddy-${report.id}.html`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }
    } catch (err: any) {
      alert(`Fout bij downloaden: ${err.message}`)
    } finally {
      setDownloading(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Rapportages</h1>
        <p className="text-gray-500 mt-1">Download geanonimiseerde rapporten en exports</p>
      </div>

      {/* Info banner */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5">
        <div className="flex gap-3">
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 text-emerald-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-emerald-800">Over rapportages</h3>
            <p className="text-sm text-emerald-700 mt-1">
              Alle rapportages bevatten uitsluitend geanonimiseerde en geaggregeerde gegevens.
              Data wordt pas beschikbaar gesteld wanneer het k-anonimiteitsminimum is bereikt.
              Rapportages zijn beschikbaar in CSV-formaat (voor eigen analyses in Excel) en
              PDF-formaat (voor bestuurlijke rapportage).
            </p>
          </div>
        </div>
      </div>

      {/* Export formaat uitleg */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-green-700 font-bold text-xs">CSV</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">CSV Export</h3>
              <p className="text-xs text-gray-500">Kommagescheiden bestand</p>
            </div>
          </div>
          <p className="text-sm text-gray-600">
            Geschikt voor import in Excel, Google Sheets of andere analyse-tools.
            Bevat ruwe cijfers die u zelf kunt bewerken en visualiseren.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Rapport</h3>
              <p className="text-xs text-gray-500">Opgemaakt document</p>
            </div>
          </div>
          <p className="text-sm text-gray-600">
            Kant-en-klaar opgemaakt rapport met samenvattingen en kerncijfers.
            Open in de browser en druk af als PDF via Ctrl+P / Cmd+P.
          </p>
        </div>
      </div>

      {/* Beschikbare rapportages */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Beschikbare rapportages</h2>
        <div className="space-y-3">
          {reports.map((report) => (
            <div key={report.id} className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                report.format === "CSV" ? "bg-green-100" : "bg-blue-100"
              }`}>
                <span className={`font-bold text-xs ${
                  report.format === "CSV" ? "text-green-700" : "text-blue-700"
                }`}>
                  {report.format === "CSV" ? "CSV" : "HTML"}
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900">{report.title}</h3>
                <p className="text-sm text-gray-500 mt-0.5">{report.description}</p>
              </div>

              <button
                onClick={() => handleDownload(report)}
                disabled={downloading === report.id}
                className="flex-shrink-0 inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {downloading === report.id ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Bezig...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
