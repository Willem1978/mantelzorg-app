"use client"

import { useEffect, useState } from "react"
import { AdminSpinner } from "@/components/admin"
import { useToast } from "@/components/ui/Toast"

interface SysteemInfo {
  aantalGebruikers: number
  aantalMantelzorgers: number
  aantalBuddies: number
  aantalArtikelen: number
  aantalAlarmenOpen: number
  aantalAuditLogs: number
}

export default function InstellingenPage() {
  const [info, setInfo] = useState<SysteemInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [drempelwaardes, setDrempelwaardes] = useState({
    laagMax: 30,
    gemiddeldMax: 60,
  })
  const [opgeslagen, setOpgeslagen] = useState(false)
  const { showSuccess, showError } = useToast()

  useEffect(() => {
    const laadInfo = async () => {
      try {
        const res = await fetch("/api/beheer/instellingen")
        const data = await res.json()
        setInfo(data.systeem)
        if (data.drempelwaardes) {
          setDrempelwaardes(data.drempelwaardes)
        }
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }
    laadInfo()
  }, [])

  const handleOpslaan = async () => {
    try {
      const res = await fetch("/api/beheer/instellingen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ drempelwaardes }),
      })
      if (res.ok) {
        setOpgeslagen(true)
        setTimeout(() => setOpgeslagen(false), 3000)
        showSuccess("Instellingen succesvol opgeslagen")
      } else {
        showError("Instellingen konden niet worden opgeslagen")
      }
    } catch (error) {
      console.error(error)
      showError("Er ging iets mis bij het opslaan")
    }
  }

  if (loading) {
    return <AdminSpinner tekst="Instellingen laden..." />
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Instellingen</h1>
        <p className="text-gray-500 mt-1">Systeemconfiguratie en overzicht</p>
      </div>

      {/* Systeem statistieken */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Systeem Overzicht</h2>
        {info && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-2xl font-bold text-blue-700">{info.aantalGebruikers}</p>
              <p className="text-sm text-blue-600">Totaal gebruikers</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-2xl font-bold text-green-700">{info.aantalMantelzorgers}</p>
              <p className="text-sm text-green-600">Mantelzorgers</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <p className="text-2xl font-bold text-purple-700">{info.aantalBuddies}</p>
              <p className="text-sm text-purple-600">MantelBuddies</p>
            </div>
            <div className="bg-amber-50 rounded-lg p-4">
              <p className="text-2xl font-bold text-amber-700">{info.aantalArtikelen}</p>
              <p className="text-sm text-amber-600">Artikelen</p>
            </div>
            <div className="bg-red-50 rounded-lg p-4">
              <p className="text-2xl font-bold text-red-700">{info.aantalAlarmenOpen}</p>
              <p className="text-sm text-red-600">Open alarmen</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-2xl font-bold text-gray-700">{info.aantalAuditLogs}</p>
              <p className="text-sm text-gray-600">Audit logs</p>
            </div>
          </div>
        )}
      </div>

      {/* Belastbaarheidstest drempelwaardes */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Belastbaarheidstest Drempelwaardes</h2>
        <p className="text-sm text-gray-500 mb-4">
          Stel de scoredrempels in voor het belastbaarheidsniveau. Scores worden ingedeeld als Laag, Gemiddeld of Hoog.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Laag maximum (0 - {drempelwaardes.laagMax})
            </label>
            <input
              type="number"
              value={drempelwaardes.laagMax}
              onChange={(e) => setDrempelwaardes({ ...drempelwaardes, laagMax: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              min={1}
              max={99}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Gemiddeld maximum ({drempelwaardes.laagMax + 1} - {drempelwaardes.gemiddeldMax})
            </label>
            <input
              type="number"
              value={drempelwaardes.gemiddeldMax}
              onChange={(e) => setDrempelwaardes({ ...drempelwaardes, gemiddeldMax: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              min={drempelwaardes.laagMax + 1}
              max={100}
            />
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Hoog = alles boven {drempelwaardes.gemiddeldMax}
        </p>
        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={handleOpslaan}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            Opslaan
          </button>
          {opgeslagen && (
            <span className="text-sm text-green-600 font-medium">Instellingen opgeslagen</span>
          )}
        </div>
      </div>

      {/* Snelkoppelingen */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Snelle Acties</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <a
            href="/api/beheer/gebruikers/export"
            className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <span className="text-lg">📥</span>
            <div>
              <p className="text-sm font-medium text-gray-900">Gebruikers exporteren</p>
              <p className="text-xs text-gray-500">Download CSV van alle gebruikers</p>
            </div>
          </a>
          <a
            href="/beheer/audit"
            className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <span className="text-lg">📋</span>
            <div>
              <p className="text-sm font-medium text-gray-900">Audit Log bekijken</p>
              <p className="text-xs text-gray-500">Overzicht van alle beheeracties</p>
            </div>
          </a>
          <a
            href="/beheer/alarmen"
            className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <span className="text-lg">🔔</span>
            <div>
              <p className="text-sm font-medium text-gray-900">Open alarmen</p>
              <p className="text-xs text-gray-500">Bekijk en behandel open alarmen</p>
            </div>
          </a>
          <a
            href="/beheer/gebruikers"
            className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <span className="text-lg">👥</span>
            <div>
              <p className="text-sm font-medium text-gray-900">Gebruikersbeheer</p>
              <p className="text-xs text-gray-500">Beheer accounts en rollen</p>
            </div>
          </a>
        </div>
      </div>

      {/* App info */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Applicatie Informatie</h2>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between py-1 border-b border-gray-100">
            <dt className="text-gray-500">Applicatie</dt>
            <dd className="text-gray-900 font-medium">MantelBuddy Beheer</dd>
          </div>
          <div className="flex justify-between py-1 border-b border-gray-100">
            <dt className="text-gray-500">Framework</dt>
            <dd className="text-gray-900">Next.js</dd>
          </div>
          <div className="flex justify-between py-1 border-b border-gray-100">
            <dt className="text-gray-500">Database</dt>
            <dd className="text-gray-900">PostgreSQL (Neon)</dd>
          </div>
          <div className="flex justify-between py-1">
            <dt className="text-gray-500">Hosting</dt>
            <dd className="text-gray-900">Vercel</dd>
          </div>
        </dl>
      </div>
    </div>
  )
}
