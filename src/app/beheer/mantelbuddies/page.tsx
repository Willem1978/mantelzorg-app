"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { AdminSpinner, AdminEmptyState } from "@/components/admin"

interface Buddy {
  id: string
  voornaam: string
  achternaam: string
  email: string
  telefoon: string
  postcode: string
  woonplaats: string
  hulpvormen: string[]
  beschikbaarheid: string
  motivatie: string | null
  status: string
  vogGoedgekeurd: boolean
  trainingVoltooid: boolean
  isActief: boolean
  gemiddeldeScore: number
  aantalBeoordelingen: number
  aantalTakenVoltooid: number
  aantalMatches: number
  actieveMatches: number
  createdAt: string
}

const statusStappen = [
  { value: "AANGEMELD", label: "Aangemeld", kleur: "bg-blue-100 text-blue-700" },
  { value: "IN_BEHANDELING", label: "In behandeling", kleur: "bg-amber-100 text-amber-700" },
  { value: "VOG_AANGEVRAAGD", label: "VOG aangevraagd", kleur: "bg-purple-100 text-purple-700" },
  { value: "GOEDGEKEURD", label: "Goedgekeurd", kleur: "bg-green-100 text-green-700" },
  { value: "INACTIEF", label: "Inactief", kleur: "bg-gray-100 text-gray-700" },
  { value: "AFGEWEZEN", label: "Afgewezen", kleur: "bg-red-100 text-red-700" },
]

const hulpvormLabels: Record<string, string> = {
  gesprek: "Gesprek",
  boodschappen: "Boodschappen",
  vervoer: "Vervoer",
  klusjes: "Klusjes",
  oppas: "Oppas",
  administratie: "Administratie",
}

function MantelBuddiesContent() {
  const [buddies, setBuddies] = useState<Buddy[]>([])
  const [loading, setLoading] = useState(true)
  const [zoek, setZoek] = useState("")
  const [selectedBuddy, setSelectedBuddy] = useState<Buddy | null>(null)
  const searchParams = useSearchParams()
  const router = useRouter()

  const statusFilter = searchParams.get("status") || ""

  const laadBuddies = async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (statusFilter) params.set("status", statusFilter)
    if (zoek) params.set("zoek", zoek)

    try {
      const res = await fetch(`/api/beheer/mantelbuddies?${params}`)
      const data = await res.json()
      setBuddies(data.buddies || [])
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    laadBuddies()
  }, [statusFilter])

  const handleStatusWijzig = async (buddyId: string, nieuweStatus: string) => {
    try {
      await fetch(`/api/beheer/mantelbuddies/${buddyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nieuweStatus }),
      })
      laadBuddies()
      if (selectedBuddy?.id === buddyId) {
        setSelectedBuddy({ ...selectedBuddy, status: nieuweStatus })
      }
    } catch (error) {
      console.error(error)
    }
  }

  const handleToggle = async (buddyId: string, veld: string, waarde: boolean) => {
    try {
      await fetch(`/api/beheer/mantelbuddies/${buddyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [veld]: waarde }),
      })
      laadBuddies()
    } catch (error) {
      console.error(error)
    }
  }

  const setStatusFilter = (status: string) => {
    const params = new URLSearchParams()
    if (status) params.set("status", status)
    router.push(`/beheer/mantelbuddies?${params}`)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">MantelBuddies</h1>
        <p className="text-gray-500 mt-1">{buddies.length} vrijwilligers</p>
      </div>

      {/* Status filters */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setStatusFilter("")}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
            !statusFilter ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Alle ({buddies.length})
        </button>
        {statusStappen.map((s) => {
          const count = buddies.filter((b) => b.status === s.value).length
          return (
            <button
              key={s.value}
              onClick={() => setStatusFilter(s.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                statusFilter === s.value ? s.kleur : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {s.label} ({count})
            </button>
          )
        })}
      </div>

      {/* Zoeken */}
      <div className="flex gap-2">
        <input
          type="text"
          value={zoek}
          onChange={(e) => setZoek(e.target.value)}
          placeholder="Zoek op naam, email of woonplaats..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
          onKeyDown={(e) => e.key === "Enter" && laadBuddies()}
        />
        <button onClick={laadBuddies} className="px-4 py-2 bg-gray-100 rounded-lg text-sm hover:bg-gray-200">
          Zoek
        </button>
      </div>

      {/* Buddies lijst */}
      <div className="space-y-3">
        {loading ? (
          <AdminSpinner tekst="MantelBuddies laden..." />
        ) : buddies.length === 0 ? (
          <AdminEmptyState icon="🤝" titel="Geen MantelBuddies gevonden" beschrijving="Er hebben zich nog geen MantelBuddies aangemeld" />
        ) : (
          buddies.map((buddy) => {
            const statusInfo = statusStappen.find((s) => s.value === buddy.status)

            return (
              <div key={buddy.id} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="font-semibold text-gray-900">
                        {buddy.voornaam} {buddy.achternaam}
                      </h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusInfo?.kleur}`}>
                        {statusInfo?.label}
                      </span>
                      {buddy.vogGoedgekeurd && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-600">VOG OK</span>
                      )}
                      {buddy.trainingVoltooid && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-600">Training OK</span>
                      )}
                    </div>
                    <div className="mt-1 text-sm text-gray-500 space-y-0.5">
                      <p>{buddy.email} | {buddy.telefoon}</p>
                      <p>{buddy.postcode} {buddy.woonplaats}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {buddy.hulpvormen.map((h) => (
                          <span key={h} className="text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                            {hulpvormLabels[h] || h}
                          </span>
                        ))}
                      </div>
                    </div>

                    {buddy.motivatie && (
                      <p className="mt-2 text-sm text-gray-600 italic">
                        &ldquo;{buddy.motivatie}&rdquo;
                      </p>
                    )}

                    <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                      <span>Score: {buddy.gemiddeldeScore || "—"}</span>
                      <span>Taken: {buddy.aantalTakenVoltooid}</span>
                      <span>Matches: {buddy.actieveMatches}/{buddy.aantalMatches}</span>
                      <span>Sinds: {new Date(buddy.createdAt).toLocaleDateString("nl-NL")}</span>
                    </div>
                  </div>

                  {/* Acties */}
                  <div className="flex flex-col gap-2 shrink-0">
                    <select
                      value={buddy.status}
                      onChange={(e) => handleStatusWijzig(buddy.id, e.target.value)}
                      className="px-2 py-1.5 text-xs border border-gray-300 rounded-lg"
                    >
                      {statusStappen.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                    <div className="flex gap-2">
                      <label className="flex items-center gap-1 text-xs text-gray-600">
                        <input
                          type="checkbox"
                          checked={buddy.vogGoedgekeurd}
                          onChange={(e) => handleToggle(buddy.id, "vogGoedgekeurd", e.target.checked)}
                          className="rounded"
                        />
                        VOG
                      </label>
                      <label className="flex items-center gap-1 text-xs text-gray-600">
                        <input
                          type="checkbox"
                          checked={buddy.trainingVoltooid}
                          onChange={(e) => handleToggle(buddy.id, "trainingVoltooid", e.target.checked)}
                          className="rounded"
                        />
                        Training
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default function MantelBuddiesPage() {
  return (
    <Suspense fallback={<AdminSpinner tekst="MantelBuddies laden..." />}>
      <MantelBuddiesContent />
    </Suspense>
  )
}
