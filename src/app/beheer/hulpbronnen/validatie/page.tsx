"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState, useCallback } from "react"
import Link from "next/link"

// ============================================
// TYPES
// ============================================

interface HulpbronMetValidatie {
  id: string
  naam: string
  website: string | null
  telefoon: string | null
  gemeente: string | null
  validatieStatus: string | null
  laatsteValidatie: string | null
  bronType: string | null
  onderdeelTest: string | null
  soortHulp: string | null
  isActief: boolean
  validatieDetail: {
    status: string
    websiteBereikbaar: boolean | null
    websiteStatusCode: number | null
    telefoonGeldig: boolean | null
    opmerkingen: string | null
    gecontroleerd: string
  } | null
}

interface Tellingen {
  geldig: number
  waarschuwing: number
  ongeldig: number
  onbekend: number
  nietGecontroleerd: number
}

// ============================================
// COMPONENT
// ============================================

export default function ValidatieOverzichtPage() {
  const { data: session } = useSession()

  const [hulpbronnen, setHulpbronnen] = useState<HulpbronMetValidatie[]>([])
  const [tellingen, setTellingen] = useState<Tellingen | null>(null)
  const [gemeenten, setGemeenten] = useState<string[]>([])
  const [totaal, setTotaal] = useState(0)
  const [laden, setLaden] = useState(true)
  const [valideren, setValideren] = useState(false)

  // Filters
  const [filterStatus, setFilterStatus] = useState("alle")
  const [filterGemeente, setFilterGemeente] = useState("alle")
  const [filterBron, setFilterBron] = useState("alle")
  const [filterPeriode, setFilterPeriode] = useState("alle")
  const [pagina, setPagina] = useState(1)

  const laadData = useCallback(async () => {
    setLaden(true)
    try {
      const params = new URLSearchParams()
      if (filterStatus !== "alle") params.set("status", filterStatus)
      if (filterGemeente !== "alle") params.set("gemeente", filterGemeente)
      if (filterBron !== "alle") params.set("bron", filterBron)
      if (filterPeriode !== "alle") params.set("periode", filterPeriode)
      params.set("pagina", String(pagina))

      const response = await fetch(`/api/beheer/hulpbronnen/validatie?${params}`)
      if (!response.ok) throw new Error("Ophalen mislukt")

      const data = await response.json()
      setHulpbronnen(data.hulpbronnen)
      setTellingen(data.tellingen)
      setGemeenten(data.gemeenten)
      setTotaal(data.totaal)
    } catch (e) {
      console.error("Laden mislukt:", e)
    } finally {
      setLaden(false)
    }
  }, [filterStatus, filterGemeente, filterBron, filterPeriode, pagina])

  useEffect(() => {
    if (session?.user?.role === "ADMIN") {
      laadData()
    }
  }, [session, laadData])

  const startValidatie = useCallback(async () => {
    setValideren(true)
    try {
      const response = await fetch("/api/beheer/hulpbronnen/validatie", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gemeente: filterGemeente !== "alle" ? filterGemeente : undefined,
        }),
      })
      if (!response.ok) throw new Error("Validatie mislukt")
      // Herlaad data
      await laadData()
    } catch (e) {
      console.error("Validatie mislukt:", e)
    } finally {
      setValideren(false)
    }
  }, [filterGemeente, laadData])

  if (session?.user?.role !== "ADMIN") {
    return (
      <div className="p-8">
        <p className="text-red-600">Geen toegang.</p>
      </div>
    )
  }

  const aandacht = (tellingen?.waarschuwing || 0) + (tellingen?.ongeldig || 0)

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Hulpbronnen Validatie</h1>
          <p className="text-muted-foreground mt-1">
            Controleer of hulpbronnen nog actueel zijn. Websites en telefoonnummers worden automatisch gecheckt.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/beheer/hulpbronnen/ai-zoeken"
            className="px-4 py-2 border rounded-md hover:bg-gray-50 text-sm"
          >
            AI Zoeken
          </Link>
          <button
            onClick={startValidatie}
            disabled={valideren}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm"
          >
            {valideren ? "Bezig met valideren..." : "Nu valideren"}
          </button>
        </div>
      </div>

      {/* Tellingen */}
      {tellingen && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <StatusKaart
            label="Geldig"
            aantal={tellingen.geldig}
            kleur="green"
            actief={filterStatus === "GELDIG"}
            onClick={() => setFilterStatus(filterStatus === "GELDIG" ? "alle" : "GELDIG")}
          />
          <StatusKaart
            label="Waarschuwing"
            aantal={tellingen.waarschuwing}
            kleur="yellow"
            actief={filterStatus === "WAARSCHUWING"}
            onClick={() => setFilterStatus(filterStatus === "WAARSCHUWING" ? "alle" : "WAARSCHUWING")}
          />
          <StatusKaart
            label="Ongeldig"
            aantal={tellingen.ongeldig}
            kleur="red"
            actief={filterStatus === "ONGELDIG"}
            onClick={() => setFilterStatus(filterStatus === "ONGELDIG" ? "alle" : "ONGELDIG")}
          />
          <StatusKaart
            label="Onbekend"
            aantal={tellingen.onbekend}
            kleur="gray"
            actief={filterStatus === "ONBEKEND"}
            onClick={() => setFilterStatus(filterStatus === "ONBEKEND" ? "alle" : "ONBEKEND")}
          />
          <StatusKaart
            label="Niet gecontroleerd"
            aantal={tellingen.nietGecontroleerd}
            kleur="blue"
            actief={filterStatus === "NIET_GECONTROLEERD"}
            onClick={() => setFilterStatus(filterStatus === "NIET_GECONTROLEERD" ? "alle" : "NIET_GECONTROLEERD")}
          />
        </div>
      )}

      {/* Aandacht banner */}
      {aandacht > 0 && filterStatus === "alle" && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 flex items-center justify-between">
          <span className="text-orange-800 font-medium">
            {aandacht} hulpbronnen vereisen aandacht
          </span>
          <button
            onClick={() => setFilterStatus("WAARSCHUWING")}
            className="text-sm text-orange-700 underline hover:no-underline"
          >
            Toon waarschuwingen
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={filterGemeente}
          onChange={(e) => { setFilterGemeente(e.target.value); setPagina(1) }}
          className="px-3 py-1.5 border rounded-md text-sm"
        >
          <option value="alle">Alle gemeenten</option>
          {gemeenten.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>

        <select
          value={filterBron}
          onChange={(e) => { setFilterBron(e.target.value); setPagina(1) }}
          className="px-3 py-1.5 border rounded-md text-sm"
        >
          <option value="alle">Alle bronnen</option>
          <option value="AI_ZOEKER">AI Zoeker</option>
          <option value="HANDMATIG">Handmatig</option>
          <option value="IMPORT">Import</option>
          <option value="SOCIALE_KAART">Sociale kaart</option>
        </select>

        <select
          value={filterPeriode}
          onChange={(e) => { setFilterPeriode(e.target.value); setPagina(1) }}
          className="px-3 py-1.5 border rounded-md text-sm"
        >
          <option value="alle">Alle periodes</option>
          <option value="vandaag">Vandaag gecontroleerd</option>
          <option value="week">Deze week</option>
          <option value="maand">Deze maand</option>
          <option value="ouder">Ouder dan maand</option>
          <option value="nooit">Nooit gecontroleerd</option>
        </select>

        {(filterStatus !== "alle" || filterGemeente !== "alle" || filterBron !== "alle" || filterPeriode !== "alle") && (
          <button
            onClick={() => {
              setFilterStatus("alle")
              setFilterGemeente("alle")
              setFilterBron("alle")
              setFilterPeriode("alle")
              setPagina(1)
            }}
            className="px-3 py-1.5 text-sm text-red-600 border border-red-200 rounded-md hover:bg-red-50"
          >
            Filters wissen
          </button>
        )}

        <span className="text-sm text-muted-foreground self-center">
          {totaal} resultaten
        </span>
      </div>

      {/* Tabel */}
      {laden ? (
        <div className="text-center py-8 text-muted-foreground">Laden...</div>
      ) : hulpbronnen.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          Geen hulpbronnen gevonden met deze filters.
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-3 font-medium">Status</th>
                <th className="text-left p-3 font-medium">Naam</th>
                <th className="text-left p-3 font-medium hidden md:table-cell">Gemeente</th>
                <th className="text-left p-3 font-medium hidden md:table-cell">Categorie</th>
                <th className="text-left p-3 font-medium hidden lg:table-cell">Laatst gecontroleerd</th>
                <th className="text-left p-3 font-medium hidden lg:table-cell">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {hulpbronnen.map((h) => (
                <tr key={h.id} className="hover:bg-gray-50">
                  <td className="p-3">
                    <StatusBadge status={h.validatieStatus} />
                  </td>
                  <td className="p-3">
                    <div>
                      <Link
                        href={`/beheer/hulpbronnen`}
                        className="font-medium hover:underline"
                      >
                        {h.naam}
                      </Link>
                      {h.website && (
                        <a
                          href={h.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-xs text-blue-600 hover:underline truncate max-w-[250px]"
                        >
                          {h.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="p-3 hidden md:table-cell text-muted-foreground">
                    {h.gemeente || "Landelijk"}
                  </td>
                  <td className="p-3 hidden md:table-cell text-muted-foreground">
                    {h.onderdeelTest || h.soortHulp || "-"}
                  </td>
                  <td className="p-3 hidden lg:table-cell text-muted-foreground">
                    {h.laatsteValidatie
                      ? new Date(h.laatsteValidatie).toLocaleDateString("nl-NL")
                      : "Nooit"}
                  </td>
                  <td className="p-3 hidden lg:table-cell text-xs text-muted-foreground">
                    {h.validatieDetail?.opmerkingen || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Paginatie */}
      {totaal > 50 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setPagina((p) => Math.max(1, p - 1))}
            disabled={pagina === 1}
            className="px-3 py-1 border rounded text-sm disabled:opacity-50"
          >
            Vorige
          </button>
          <span className="text-sm self-center text-muted-foreground">
            Pagina {pagina} van {Math.ceil(totaal / 50)}
          </span>
          <button
            onClick={() => setPagina((p) => p + 1)}
            disabled={pagina >= Math.ceil(totaal / 50)}
            className="px-3 py-1 border rounded text-sm disabled:opacity-50"
          >
            Volgende
          </button>
        </div>
      )}
    </div>
  )
}

// ============================================
// HULPCOMPONENTEN
// ============================================

function StatusKaart({
  label,
  aantal,
  kleur,
  actief,
  onClick,
}: {
  label: string
  aantal: number
  kleur: "green" | "yellow" | "red" | "gray" | "blue"
  actief: boolean
  onClick: () => void
}) {
  const kleuren = {
    green: actief ? "bg-green-100 border-green-300" : "bg-green-50 border-green-200",
    yellow: actief ? "bg-yellow-100 border-yellow-300" : "bg-yellow-50 border-yellow-200",
    red: actief ? "bg-red-100 border-red-300" : "bg-red-50 border-red-200",
    gray: actief ? "bg-gray-200 border-gray-400" : "bg-gray-50 border-gray-200",
    blue: actief ? "bg-blue-100 border-blue-300" : "bg-blue-50 border-blue-200",
  }

  return (
    <button
      onClick={onClick}
      className={`p-3 rounded-lg border text-left transition-colors ${kleuren[kleur]} hover:opacity-80`}
    >
      <div className="text-2xl font-bold">{aantal}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </button>
  )
}

function StatusBadge({ status }: { status: string | null }) {
  if (!status) {
    return (
      <span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700">
        Niet gecontroleerd
      </span>
    )
  }

  const kleuren: Record<string, string> = {
    GELDIG: "bg-green-100 text-green-700",
    WAARSCHUWING: "bg-yellow-100 text-yellow-700",
    ONGELDIG: "bg-red-100 text-red-700",
    ONBEKEND: "bg-gray-100 text-gray-700",
  }

  const labels: Record<string, string> = {
    GELDIG: "Geldig",
    WAARSCHUWING: "Waarschuwing",
    ONGELDIG: "Ongeldig",
    ONBEKEND: "Onbekend",
  }

  return (
    <span className={`px-2 py-0.5 rounded-full text-xs ${kleuren[status] || kleuren.ONBEKEND}`}>
      {labels[status] || status}
    </span>
  )
}
