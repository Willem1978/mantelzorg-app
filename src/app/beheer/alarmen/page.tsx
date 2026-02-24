"use client"

import { useEffect, useState } from "react"
import { AdminSpinner, AdminEmptyState } from "@/components/admin"

interface Alarm {
  id: string
  type: string
  beschrijving: string
  urgentie: string
  isAfgehandeld: boolean
  afgehandeldOp: string | null
  afgehandeldDoor: string | null
  notitie: string | null
  createdAt: string
  test: {
    id: string
    voornaam: string
    email: string
    gemeente: string | null
    totaleBelastingScore: number
    belastingNiveau: string
    completedAt: string | null
    caregiverId: string | null
  }
}

const alarmTypeLabels: Record<string, string> = {
  HOGE_BELASTING: "Hoge belasting",
  KRITIEKE_COMBINATIE: "Kritieke combinatie",
  VEEL_ZORGUREN: "Veel zorguren",
  EMOTIONELE_NOOD: "Emotionele nood",
  SOCIAAL_ISOLEMENT: "Sociaal isolement",
  FYSIEKE_KLACHTEN: "Fysieke klachten",
}

const urgentieKleur: Record<string, string> = {
  LOW: "bg-gray-100 text-gray-700 border-gray-200",
  MEDIUM: "bg-amber-50 text-amber-700 border-amber-200",
  HIGH: "bg-orange-50 text-orange-700 border-orange-200",
  CRITICAL: "bg-red-50 text-red-700 border-red-200",
}

const urgentieLabel: Record<string, string> = {
  LOW: "Laag",
  MEDIUM: "Midden",
  HIGH: "Hoog",
  CRITICAL: "Kritiek",
}

export default function AlarmenPage() {
  const [alarmen, setAlarmen] = useState<Alarm[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState("open")
  const [notitieId, setNotitieId] = useState<string | null>(null)
  const [notitie, setNotitie] = useState("")

  const laadAlarmen = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/beheer/alarmen?status=${statusFilter}`)
      const data = await res.json()
      setAlarmen(data.alarmen || [])
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    laadAlarmen()
  }, [statusFilter])

  const handleAfhandelen = async (alarmId: string) => {
    try {
      await fetch(`/api/beheer/alarmen/${alarmId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAfgehandeld: true }),
      })
      laadAlarmen()
    } catch (error) {
      console.error(error)
    }
  }

  const handleHeropenen = async (alarmId: string) => {
    try {
      await fetch(`/api/beheer/alarmen/${alarmId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAfgehandeld: false }),
      })
      laadAlarmen()
    } catch (error) {
      console.error(error)
    }
  }

  const handleNotitieOpslaan = async (alarmId: string) => {
    try {
      await fetch(`/api/beheer/alarmen/${alarmId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notitie }),
      })
      setNotitieId(null)
      setNotitie("")
      laadAlarmen()
    } catch (error) {
      console.error(error)
    }
  }

  const openAantal = alarmen.filter((a) => !a.isAfgehandeld).length
  const critiekAantal = alarmen.filter((a) => !a.isAfgehandeld && (a.urgentie === "CRITICAL" || a.urgentie === "HIGH")).length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Alarmen & Signalering</h1>
        <p className="text-gray-500 mt-1">
          {statusFilter === "open" ? `${openAantal} open alarmen` : `${alarmen.length} alarmen`}
          {critiekAantal > 0 && statusFilter === "open" && (
            <span className="text-red-600 font-medium"> ({critiekAantal} hoog/kritiek)</span>
          )}
        </p>
      </div>

      {/* Status tabs */}
      <div className="flex gap-2">
        {[
          { value: "open", label: "Open" },
          { value: "afgehandeld", label: "Afgehandeld" },
          { value: "alle", label: "Alle" },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              statusFilter === tab.value
                ? "bg-blue-100 text-blue-700"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Alarmen lijst */}
      {loading ? (
        <div className="bg-white rounded-xl border"><AdminSpinner tekst="Alarmen laden..." /></div>
      ) : alarmen.length === 0 ? (
        <div className="bg-white rounded-xl border">
          <AdminEmptyState icon="🔔" titel="Geen alarmen" beschrijving={statusFilter === "open" ? "Geen open alarmen - goed bezig!" : "Geen alarmen gevonden"} />
        </div>
      ) : (
        <div className="space-y-3">
          {alarmen.map((alarm) => (
            <div
              key={alarm.id}
              className={`rounded-xl border p-4 ${urgentieKleur[alarm.urgentie]} ${alarm.isAfgehandeld ? "opacity-60" : ""}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm">
                      {alarmTypeLabels[alarm.type] || alarm.type}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-white/50 font-medium">
                      {urgentieLabel[alarm.urgentie]}
                    </span>
                    {alarm.isAfgehandeld && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                        Afgehandeld
                      </span>
                    )}
                  </div>

                  <p className="text-sm mt-1">{alarm.beschrijving}</p>

                  <div className="mt-2 text-xs space-y-0.5 opacity-80">
                    <p>
                      Persoon: {alarm.test.voornaam} ({alarm.test.email})
                      {alarm.test.gemeente && ` - ${alarm.test.gemeente}`}
                    </p>
                    <p>
                      Score: {alarm.test.totaleBelastingScore} ({alarm.test.belastingNiveau})
                      {alarm.test.completedAt && ` - Test op ${new Date(alarm.test.completedAt).toLocaleDateString("nl-NL")}`}
                    </p>
                    <p>Alarm aangemaakt: {new Date(alarm.createdAt).toLocaleString("nl-NL")}</p>
                  </div>

                  {alarm.notitie && (
                    <div className="mt-2 p-2 bg-white/50 rounded text-xs">
                      <span className="font-medium">Notitie:</span> {alarm.notitie}
                    </div>
                  )}

                  {/* Notitie formulier */}
                  {notitieId === alarm.id && (
                    <div className="mt-2 flex gap-2">
                      <input
                        type="text"
                        value={notitie}
                        onChange={(e) => setNotitie(e.target.value)}
                        placeholder="Voeg een notitie toe..."
                        className="flex-1 px-2 py-1.5 text-xs border rounded bg-white"
                        autoFocus
                      />
                      <button
                        onClick={() => handleNotitieOpslaan(alarm.id)}
                        className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Opslaan
                      </button>
                      <button
                        onClick={() => setNotitieId(null)}
                        className="px-2 py-1.5 text-xs text-gray-500"
                      >
                        Annuleer
                      </button>
                    </div>
                  )}
                </div>

                {/* Acties */}
                <div className="flex flex-col gap-1 shrink-0">
                  {!alarm.isAfgehandeld ? (
                    <button
                      onClick={() => handleAfhandelen(alarm.id)}
                      className="px-3 py-1.5 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      Afhandelen
                    </button>
                  ) : (
                    <button
                      onClick={() => handleHeropenen(alarm.id)}
                      className="px-3 py-1.5 text-xs bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                    >
                      Heropenen
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setNotitieId(alarm.id)
                      setNotitie(alarm.notitie || "")
                    }}
                    className="px-3 py-1.5 text-xs bg-white/50 rounded-lg hover:bg-white/80"
                  >
                    Notitie
                  </button>
                  {alarm.test.caregiverId && (
                    <a
                      href={`/beheer/gebruikers/${alarm.test.caregiverId}`}
                      className="px-3 py-1.5 text-xs text-center bg-white/50 rounded-lg hover:bg-white/80"
                    >
                      Bekijk
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
