"use client"

import { useEffect, useState, useCallback, Suspense } from "react"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"

interface Gebruiker {
  id: string
  email: string
  name: string | null
  role: string
  createdAt: string
  municipality: string | null
  phoneNumber: string | null
  onboarded: boolean
  profileCompleted: boolean
  careHoursPerWeek: number | null
  buddyStatus: string | null
  buddyScore: number | null
  laatsteTest: {
    totaleBelastingScore: number
    belastingNiveau: string
    completedAt: string
  } | null
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

function GebruikersContent() {
  const [gebruikers, setGebruikers] = useState<Gebruiker[]>([])
  const [totaal, setTotaal] = useState(0)
  const [pagina, setPagina] = useState(1)
  const [totaalPaginas, setTotaalPaginas] = useState(1)
  const [loading, setLoading] = useState(true)
  const [zoekInput, setZoekInput] = useState("")
  const searchParams = useSearchParams()
  const router = useRouter()

  const rol = searchParams.get("rol") || ""
  const zoek = searchParams.get("zoek") || ""

  const laadGebruikers = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (zoek) params.set("zoek", zoek)
    if (rol) params.set("rol", rol)
    params.set("pagina", String(pagina))

    try {
      const res = await fetch(`/api/beheer/gebruikers?${params}`)
      const data = await res.json()
      setGebruikers(data.gebruikers || [])
      setTotaal(data.totaal || 0)
      setTotaalPaginas(data.totaalPaginas || 1)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }, [zoek, rol, pagina])

  useEffect(() => {
    laadGebruikers()
  }, [laadGebruikers])

  useEffect(() => {
    setZoekInput(zoek)
  }, [zoek])

  const handleZoek = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams(searchParams.toString())
    if (zoekInput) params.set("zoek", zoekInput)
    else params.delete("zoek")
    params.delete("pagina")
    router.push(`/beheer/gebruikers?${params}`)
  }

  const setRolFilter = (nieuwRol: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (nieuwRol) params.set("rol", nieuwRol)
    else params.delete("rol")
    params.delete("pagina")
    router.push(`/beheer/gebruikers?${params}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gebruikers</h1>
          <p className="text-gray-500 mt-1">{totaal} gebruikers gevonden</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
        <form onSubmit={handleZoek} className="flex gap-2">
          <input
            type="text"
            value={zoekInput}
            onChange={(e) => setZoekInput(e.target.value)}
            placeholder="Zoek op naam, email of telefoonnummer..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
          >
            Zoeken
          </button>
        </form>

        <div className="flex flex-wrap gap-2">
          {[
            { value: "", label: "Alle rollen" },
            { value: "CAREGIVER", label: "Mantelzorgers" },
            { value: "BUDDY", label: "MantelBuddies" },
            { value: "ORG_MEMBER", label: "Organisaties" },
            { value: "ADMIN", label: "Beheerders" },
          ].map((r) => (
            <button
              key={r.value}
              onClick={() => setRolFilter(r.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                rol === r.value
                  ? "bg-blue-100 text-blue-700"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabel */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Laden...</div>
        ) : gebruikers.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Geen gebruikers gevonden</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Naam / Email</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Rol</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Gemeente</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Belasting</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Geregistreerd</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {gebruikers.map((g) => (
                  <tr key={g.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link href={`/beheer/gebruikers/${g.id}`} className="hover:text-blue-600">
                        <div className="font-medium text-gray-900">{g.name || "—"}</div>
                        <div className="text-gray-500 text-xs">{g.email}</div>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                        {rolLabels[g.role] || g.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{g.municipality || "—"}</td>
                    <td className="px-4 py-3">
                      {g.laatsteTest ? (
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${niveauKleur[g.laatsteTest.belastingNiveau]}`}>
                          {g.laatsteTest.totaleBelastingScore} - {g.laatsteTest.belastingNiveau}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">Geen test</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {g.onboarded ? (
                        <span className="text-xs text-green-600 font-medium">Actief</span>
                      ) : (
                        <span className="text-xs text-gray-400">Niet onboarded</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {new Date(g.createdAt).toLocaleDateString("nl-NL")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginering */}
        {totaalPaginas > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
            <p className="text-sm text-gray-500">
              Pagina {pagina} van {totaalPaginas}
            </p>
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

export default function GebruikersPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Laden...</div>}>
      <GebruikersContent />
    </Suspense>
  )
}
