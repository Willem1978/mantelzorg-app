"use client"

import { GerPageIntro } from "@/components/ui"

export default function RapportExportPage() {
  const handleExport = () => {
    window.open("/api/export/rapport", "_blank")
  }

  return (
    <div className="space-y-6">
      <div className="ker-section-header">
        <h1 className="text-2xl font-bold text-foreground">
          Exporteer je rapport
        </h1>
      </div>

      <GerPageIntro tekst="Je kunt een overzicht van je gegevens exporteren als rapport. Dit is handig om mee te nemen naar een keukentafelgesprek of je huisarts." />

      <div className="ker-card p-6 space-y-4">
        <h2 className="text-lg font-semibold text-foreground">
          Persoonlijk rapport
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Dit rapport bevat een overzicht van je balanstesten, gelezen artikelen,
          bewaarde hulpbronnen en je profielgegevens. Het rapport opent in een
          nieuw tabblad en kan worden opgeslagen als PDF via de afdrukfunctie van
          je browser.
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Dit rapport kun je meenemen naar een keukentafelgesprek of huisarts.
        </p>
        <button
          onClick={handleExport}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Exporteer je rapport
        </button>
      </div>
    </div>
  )
}
