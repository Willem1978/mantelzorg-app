"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"

interface GebruikerDetail {
  id: string
  email: string
  name: string | null
  role: string
  createdAt: string
  updatedAt: string
  emailVerified: string | null
  caregiver: {
    id: string
    phoneNumber: string | null
    municipality: string | null
    city: string | null
    careRecipient: string | null
    careHoursPerWeek: number | null
    onboardedAt: string | null
    profileCompleted: boolean
    tests: Array<{
      id: string
      totaleBelastingScore: number
      belastingNiveau: string
      totaleZorguren: number
      completedAt: string | null
    }>
    checkIns: Array<{
      id: string
      month: string
      overallWellbeing: number | null
      completedAt: string | null
    }>
    helpRequests: Array<{
      id: string
      title: string
      category: string
      status: string
      urgency: string
      createdAt: string
    }>
    buddyMatches: Array<{
      id: string
      status: string
      buddy: { voornaam: string; achternaam: string; email: string }
    }>
  } | null
  mantelBuddy: any
  alarmen: Array<{
    id: string
    type: string
    beschrijving: string
    urgentie: string
    isAfgehandeld: boolean
    createdAt: string
  }>
}

const rolLabels: Record<string, string> = {
  CAREGIVER: "Mantelzorger",
  BUDDY: "MantelBuddy",
  ORG_MEMBER: "Organisatie",
  ORG_ADMIN: "Org. Admin",
  ADMIN: "Beheerder",
}

const niveauKleur: Record<string, string> = {
  LAAG: "bg-green-100 text-green-700",
  GEMIDDELD: "bg-amber-100 text-amber-700",
  HOOG: "bg-red-100 text-red-700",
}

const urgentieKleur: Record<string, string> = {
  LOW: "bg-gray-100 text-gray-700",
  MEDIUM: "bg-amber-100 text-amber-700",
  HIGH: "bg-orange-100 text-orange-700",
  CRITICAL: "bg-red-100 text-red-700",
}

export default function GebruikerDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [gebruiker, setGebruiker] = useState<GebruikerDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [rolWijzigen, setRolWijzigen] = useState(false)
  const [nieuweRol, setNieuweRol] = useState("")

  useEffect(() => {
    fetch(`/api/beheer/gebruikers/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setGebruiker(data.gebruiker)
        setNieuweRol(data.gebruiker?.role || "")
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id])

  const handleRolWijzigen = async () => {
    if (!gebruiker || nieuweRol === gebruiker.role) return

    try {
      await fetch(`/api/beheer/gebruikers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: nieuweRol }),
      })
      setGebruiker({ ...gebruiker, role: nieuweRol })
      setRolWijzigen(false)
    } catch (error) {
      console.error(error)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-gray-500">Laden...</div>
  }

  if (!gebruiker) {
    return <div className="text-red-600 p-4">Gebruiker niet gevonden</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700">
          ← Terug
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{gebruiker.name || gebruiker.email}</h1>
          <p className="text-gray-500">{gebruiker.email}</p>
        </div>
      </div>

      {/* Profiel info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Profiel</h2>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">Rol</dt>
              <dd>
                {rolWijzigen ? (
                  <div className="flex items-center gap-2">
                    <select
                      value={nieuweRol}
                      onChange={(e) => setNieuweRol(e.target.value)}
                      className="text-sm border border-gray-300 rounded px-2 py-1"
                    >
                      {Object.entries(rolLabels).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                    <button onClick={handleRolWijzigen} className="text-blue-600 text-xs">Opslaan</button>
                    <button onClick={() => setRolWijzigen(false)} className="text-gray-400 text-xs">Annuleer</button>
                  </div>
                ) : (
                  <span className="flex items-center gap-2">
                    <span className="font-medium">{rolLabels[gebruiker.role]}</span>
                    <button onClick={() => setRolWijzigen(true)} className="text-blue-600 text-xs">Wijzig</button>
                  </span>
                )}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Geregistreerd</dt>
              <dd>{new Date(gebruiker.createdAt).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" })}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Email geverifieerd</dt>
              <dd>{gebruiker.emailVerified ? "Ja" : "Nee"}</dd>
            </div>
            {gebruiker.caregiver && (
              <>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Telefoon</dt>
                  <dd>{gebruiker.caregiver.phoneNumber || "—"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Gemeente</dt>
                  <dd>{gebruiker.caregiver.municipality || "—"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Woonplaats</dt>
                  <dd>{gebruiker.caregiver.city || "—"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Zorgt voor</dt>
                  <dd>{gebruiker.caregiver.careRecipient || "—"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Zorguren/week</dt>
                  <dd>{gebruiker.caregiver.careHoursPerWeek || "—"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Onboarding</dt>
                  <dd>{gebruiker.caregiver.onboardedAt ? "Voltooid" : "Niet voltooid"}</dd>
                </div>
              </>
            )}
          </dl>
        </div>

        {/* MantelBuddy info */}
        {gebruiker.mantelBuddy && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">MantelBuddy profiel</h2>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Naam</dt>
                <dd>{gebruiker.mantelBuddy.voornaam} {gebruiker.mantelBuddy.achternaam}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Status</dt>
                <dd className="font-medium">{gebruiker.mantelBuddy.status}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">VOG</dt>
                <dd>{gebruiker.mantelBuddy.vogGoedgekeurd ? "Goedgekeurd" : "Niet afgerond"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Training</dt>
                <dd>{gebruiker.mantelBuddy.trainingVoltooid ? "Voltooid" : "Niet afgerond"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Score</dt>
                <dd>{gebruiker.mantelBuddy.gemiddeldeScore || "—"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Taken voltooid</dt>
                <dd>{gebruiker.mantelBuddy.aantalTakenVoltooid}</dd>
              </div>
            </dl>
          </div>
        )}
      </div>

      {/* Belastbaarheidstests */}
      {gebruiker.caregiver?.tests && gebruiker.caregiver.tests.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Belastbaarheidstests ({gebruiker.caregiver.tests.length})</h2>
          <div className="space-y-2">
            {gebruiker.caregiver.tests.map((test) => (
              <div key={test.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${niveauKleur[test.belastingNiveau]}`}>
                    Score: {test.totaleBelastingScore}
                  </span>
                  <span className="text-sm text-gray-600">
                    Niveau: {test.belastingNiveau}
                  </span>
                </div>
                <span className="text-xs text-gray-500">
                  {test.completedAt ? new Date(test.completedAt).toLocaleDateString("nl-NL") : "—"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Alarmen */}
      {gebruiker.alarmen && gebruiker.alarmen.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Alarmen ({gebruiker.alarmen.length})</h2>
          <div className="space-y-2">
            {gebruiker.alarmen.map((alarm) => (
              <div key={alarm.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${urgentieKleur[alarm.urgentie]}`}>
                    {alarm.urgentie}
                  </span>
                  <span className="text-sm text-gray-700">{alarm.beschrijving}</span>
                </div>
                <div className="flex items-center gap-2">
                  {alarm.isAfgehandeld ? (
                    <span className="text-xs text-green-600">Afgehandeld</span>
                  ) : (
                    <span className="text-xs text-red-600 font-medium">Open</span>
                  )}
                  <span className="text-xs text-gray-400">
                    {new Date(alarm.createdAt).toLocaleDateString("nl-NL")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hulpvragen */}
      {gebruiker.caregiver?.helpRequests && gebruiker.caregiver.helpRequests.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Hulpvragen ({gebruiker.caregiver.helpRequests.length})</h2>
          <div className="space-y-2">
            {gebruiker.caregiver.helpRequests.map((hr) => (
              <div key={hr.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-900">{hr.title}</p>
                  <p className="text-xs text-gray-500">{hr.category} - {hr.urgency}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  hr.status === "OPEN" ? "bg-blue-100 text-blue-700" :
                  hr.status === "RESOLVED" ? "bg-green-100 text-green-700" :
                  "bg-gray-100 text-gray-700"
                }`}>
                  {hr.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
