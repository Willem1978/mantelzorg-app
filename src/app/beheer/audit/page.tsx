"use client"

import { useEffect, useState } from "react"

interface AuditEntry {
  id: string
  userId: string
  actie: string
  entiteit: string
  entiteitId: string | null
  details: any
  createdAt: string
  gebruiker: { name: string | null; email: string }
}

const actieKleur: Record<string, string> = {
  CREATE: "bg-green-100 text-green-700",
  UPDATE: "bg-blue-100 text-blue-700",
  DELETE: "bg-red-100 text-red-700",
  EXPORT: "bg-purple-100 text-purple-700",
  LOGIN: "bg-gray-100 text-gray-700",
}

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [pagina, setPagina] = useState(1)
  const [totaalPaginas, setTotaalPaginas] = useState(1)
  const [filterEntiteit, setFilterEntiteit] = useState("")
  const [filterActie, setFilterActie] = useState("")

  const laadLogs = async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filterEntiteit) params.set("entiteit", filterEntiteit)
    if (filterActie) params.set("actie", filterActie)
    params.set("pagina", String(pagina))

    try {
      const res = await fetch(`/api/beheer/audit?${params}`)
      const data = await res.json()
      setLogs(data.logs || [])
      setTotaalPaginas(data.totaalPaginas || 1)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    laadLogs()
  }, [pagina, filterEntiteit, filterActie])

  const formatDetails = (details: any) => {
    if (!details) return ""
    return Object.entries(details)
      .map(([k, v]) => `${k}: ${v}`)
      .join(", ")
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>
        <p className="text-gray-500 mt-1">Overzicht van alle beheeracties</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-wrap gap-3">
          <select
            value={filterEntiteit}
            onChange={(e) => { setFilterEntiteit(e.target.value); setPagina(1) }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="">Alle entiteiten</option>
            <option value="User">Gebruikers</option>
            <option value="Artikel">Artikelen</option>
            <option value="MantelBuddy">MantelBuddies</option>
            <option value="Alarm">Alarmen</option>
          </select>
          <select
            value={filterActie}
            onChange={(e) => { setFilterActie(e.target.value); setPagina(1) }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="">Alle acties</option>
            <option value="CREATE">Aangemaakt</option>
            <option value="UPDATE">Bijgewerkt</option>
            <option value="DELETE">Verwijderd</option>
            <option value="EXPORT">Geexporteerd</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Laden...</div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Geen audit logs gevonden</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Datum/Tijd</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Gebruiker</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Actie</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Entiteit</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString("nl-NL", {
                        day: "2-digit", month: "2-digit", year: "numeric",
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{log.gebruiker.name || "—"}</div>
                      <div className="text-xs text-gray-500">{log.gebruiker.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${actieKleur[log.actie] || "bg-gray-100 text-gray-700"}`}>
                        {log.actie}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{log.entiteit}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs max-w-xs truncate">
                      {formatDetails(log.details)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totaalPaginas > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
            <p className="text-sm text-gray-500">Pagina {pagina} van {totaalPaginas}</p>
            <div className="flex gap-2">
              <button
                onClick={() => setPagina(Math.max(1, pagina - 1))}
                disabled={pagina <= 1}
                className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 disabled:opacity-50 hover:bg-gray-100"
              >
                Vorige
              </button>
              <button
                onClick={() => setPagina(Math.min(totaalPaginas, pagina + 1))}
                disabled={pagina >= totaalPaginas}
                className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 disabled:opacity-50 hover:bg-gray-100"
              >
                Volgende
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
