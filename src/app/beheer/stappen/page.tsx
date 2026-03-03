"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { AdminSpinner, AdminEmptyState } from "@/components/admin"

interface StapData {
  id: string
  gemeenteNaam: string
  niveau: "LAAG" | "GEMIDDELD" | "HOOG"
  stapNummer: number
  titel: string
  beschrijving: string | null
  emoji: string | null
  organisatieId: string | null
  artikelId: string | null
  externeUrl: string | null
  isActief: boolean
}

interface OrgOption {
  id: string
  naam: string
  gemeente: string | null
}

interface ArtikelOption {
  id: string
  titel: string
  categorie: string
  emoji: string | null
}

const NIVEAUS = ["LAAG", "GEMIDDELD", "HOOG"] as const
const NIVEAU_LABELS: Record<string, string> = {
  LAAG: "Laag",
  GEMIDDELD: "Gemiddeld",
  HOOG: "Hoog",
}
const NIVEAU_KLEUREN: Record<string, string> = {
  LAAG: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  GEMIDDELD: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  HOOG: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
}

export default function StappenBeheerPage() {
  const [stappen, setStappen] = useState<StapData[]>([])
  const [organisaties, setOrganisaties] = useState<OrgOption[]>([])
  const [artikelen, setArtikelen] = useState<ArtikelOption[]>([])
  const [gemeenten, setGemeenten] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Filter staat
  const [selectedGemeente, setSelectedGemeente] = useState("_default")

  // Formulier staat
  const [editStap, setEditStap] = useState<{
    niveau: string
    stapNummer: number
    titel: string
    beschrijving: string
    emoji: string
    organisatieId: string
    artikelId: string
    externeUrl: string
  } | null>(null)

  const hasFetched = useRef(false)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/beheer/stappen?gemeente=${encodeURIComponent(selectedGemeente)}`)
      if (!res.ok) throw new Error("Laden mislukt")
      const data = await res.json()
      setStappen(data.stappen || [])
      setOrganisaties(data.organisaties || [])
      setArtikelen(data.artikelen || [])
      setGemeenten(data.gemeenten || [])
    } catch {
      setError("Fout bij laden van stappen")
    } finally {
      setLoading(false)
    }
  }, [selectedGemeente])

  useEffect(() => {
    if (hasFetched.current && selectedGemeente === "_default") return
    hasFetched.current = true
    loadData()
  }, [loadData, selectedGemeente])

  // Herlaad bij gemeente wissel
  useEffect(() => {
    if (!hasFetched.current) return
    loadData()
  }, [selectedGemeente, loadData])

  const openEditor = (niveau: string, stapNummer: number) => {
    const bestaand = stappen.find(
      (s) => s.niveau === niveau && s.stapNummer === stapNummer
    )
    setEditStap({
      niveau,
      stapNummer,
      titel: bestaand?.titel || "",
      beschrijving: bestaand?.beschrijving || "",
      emoji: bestaand?.emoji || "",
      organisatieId: bestaand?.organisatieId || "",
      artikelId: bestaand?.artikelId || "",
      externeUrl: bestaand?.externeUrl || "",
    })
    setError(null)
    setSuccess(null)
  }

  const handleSave = async () => {
    if (!editStap || !editStap.titel.trim()) {
      setError("Titel is verplicht")
      return
    }

    setSaving(true)
    setError(null)

    try {
      const res = await fetch("/api/beheer/stappen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gemeenteNaam: selectedGemeente,
          niveau: editStap.niveau,
          stapNummer: editStap.stapNummer,
          titel: editStap.titel,
          beschrijving: editStap.beschrijving || null,
          emoji: editStap.emoji || null,
          organisatieId: editStap.organisatieId || null,
          artikelId: editStap.artikelId || null,
          externeUrl: editStap.externeUrl || null,
        }),
      })

      if (!res.ok) throw new Error("Opslaan mislukt")

      setSuccess("Stap opgeslagen")
      setEditStap(null)
      await loadData()
    } catch {
      setError("Fout bij opslaan")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Weet je zeker dat je deze stap wilt verwijderen?")) return

    try {
      const res = await fetch(`/api/beheer/stappen?id=${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Verwijderen mislukt")
      setSuccess("Stap verwijderd")
      await loadData()
    } catch {
      setError("Fout bij verwijderen")
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Stappenplan beheer</h1>
        <AdminSpinner />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Stappenplan beheer</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configureer de 3 stappen die gebruikers zien op hun dashboard, per gemeente en belastingniveau.
          </p>
        </div>
      </div>

      {/* Gemeente selector */}
      <div className="mb-6 flex items-center gap-3">
        <label className="text-sm font-medium text-foreground">Gemeente:</label>
        <select
          value={selectedGemeente}
          onChange={(e) => setSelectedGemeente(e.target.value)}
          className="px-3 py-2 rounded-lg border border-border bg-card text-foreground text-sm min-w-[200px]"
        >
          <option value="_default">Standaard (alle gemeenten)</option>
          {gemeenten.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
      </div>

      {/* Feedback */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/30 rounded-lg">
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/30 rounded-lg">
          <p className="text-sm text-emerald-700 dark:text-emerald-300">{success}</p>
        </div>
      )}

      {/* Stappen per niveau */}
      <div className="space-y-8">
        {NIVEAUS.map((niveau) => {
          const niveauStappen = stappen.filter((s) => s.niveau === niveau)

          return (
            <div key={niveau}>
              <div className="flex items-center gap-2 mb-4">
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${NIVEAU_KLEUREN[niveau]}`}>
                  {NIVEAU_LABELS[niveau]}
                </span>
                <h2 className="text-lg font-semibold text-foreground">belastingniveau</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map((stapNr) => {
                  const stap = niveauStappen.find((s) => s.stapNummer === stapNr)
                  const isEditing = editStap?.niveau === niveau && editStap?.stapNummer === stapNr

                  if (isEditing && editStap) {
                    return (
                      <div key={stapNr} className="border-2 border-primary rounded-xl p-4 bg-card space-y-3">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="w-7 h-7 rounded-lg bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                            {stapNr}
                          </span>
                          <span className="text-sm font-semibold text-foreground">Stap {stapNr} bewerken</span>
                        </div>

                        <div>
                          <label className="text-xs font-medium text-muted-foreground mb-1 block">Emoji</label>
                          <input
                            type="text"
                            value={editStap.emoji}
                            onChange={(e) => setEditStap({ ...editStap, emoji: e.target.value })}
                            placeholder="bijv. 📋"
                            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
                            maxLength={4}
                          />
                        </div>

                        <div>
                          <label className="text-xs font-medium text-muted-foreground mb-1 block">Titel *</label>
                          <input
                            type="text"
                            value={editStap.titel}
                            onChange={(e) => setEditStap({ ...editStap, titel: e.target.value })}
                            placeholder="Titel van de stap"
                            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-medium text-muted-foreground mb-1 block">Beschrijving</label>
                          <textarea
                            value={editStap.beschrijving}
                            onChange={(e) => setEditStap({ ...editStap, beschrijving: e.target.value })}
                            placeholder="Korte beschrijving"
                            rows={2}
                            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm resize-none"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-medium text-muted-foreground mb-1 block">
                            Link naar organisatie (hulpkaart)
                          </label>
                          <select
                            value={editStap.organisatieId}
                            onChange={(e) => setEditStap({ ...editStap, organisatieId: e.target.value, artikelId: "" })}
                            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
                          >
                            <option value="">Geen organisatie</option>
                            {organisaties.map((org) => (
                              <option key={org.id} value={org.id}>
                                {org.naam}{org.gemeente ? ` (${org.gemeente})` : ""}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-xs font-medium text-muted-foreground mb-1 block">
                            Of link naar artikel
                          </label>
                          <select
                            value={editStap.artikelId}
                            onChange={(e) => setEditStap({ ...editStap, artikelId: e.target.value, organisatieId: "" })}
                            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
                          >
                            <option value="">Geen artikel</option>
                            {artikelen.map((art) => (
                              <option key={art.id} value={art.id}>
                                {art.emoji || ""} {art.titel}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-xs font-medium text-muted-foreground mb-1 block">
                            Of externe URL
                          </label>
                          <input
                            type="url"
                            value={editStap.externeUrl}
                            onChange={(e) => setEditStap({ ...editStap, externeUrl: e.target.value })}
                            placeholder="https://..."
                            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
                          />
                        </div>

                        <div className="flex gap-2 pt-1">
                          <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex-1 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50"
                          >
                            {saving ? "Opslaan..." : "Opslaan"}
                          </button>
                          <button
                            onClick={() => setEditStap(null)}
                            className="px-3 py-2 rounded-lg border border-border text-foreground text-sm font-medium hover:bg-muted"
                          >
                            Annuleren
                          </button>
                        </div>
                      </div>
                    )
                  }

                  return (
                    <div
                      key={stapNr}
                      className={`border rounded-xl p-4 transition-all ${
                        stap
                          ? "border-border bg-card hover:border-primary/30 cursor-pointer"
                          : "border-dashed border-border/50 bg-muted/30 hover:bg-muted/50 cursor-pointer"
                      }`}
                      onClick={() => openEditor(niveau, stapNr)}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold ${
                          stap ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                        }`}>
                          {stapNr}
                        </span>
                        {stap ? (
                          <span className="text-sm font-semibold text-foreground">{stap.titel}</span>
                        ) : (
                          <span className="text-sm text-muted-foreground italic">Stap {stapNr} instellen...</span>
                        )}
                      </div>

                      {stap && (
                        <>
                          {stap.emoji && <span className="text-lg">{stap.emoji}</span>}
                          {stap.beschrijving && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{stap.beschrijving}</p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            {stap.organisatieId && (
                              <span className="text-[10px] bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full font-medium">
                                Organisatie
                              </span>
                            )}
                            {stap.artikelId && (
                              <span className="text-[10px] bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full font-medium">
                                Artikel
                              </span>
                            )}
                            {stap.externeUrl && (
                              <span className="text-[10px] bg-gray-100 dark:bg-gray-800/30 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded-full font-medium">
                                Externe link
                              </span>
                            )}
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDelete(stap.id) }}
                              className="ml-auto text-xs text-red-500 hover:text-red-700 font-medium"
                            >
                              Verwijder
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {stappen.length === 0 && !editStap && (
        <AdminEmptyState
          titel="Nog geen stappen geconfigureerd"
          beschrijving={`Klik op een stap hierboven om het stappenplan voor "${selectedGemeente === "_default" ? "alle gemeenten" : selectedGemeente}" in te richten.`}
        />
      )}
    </div>
  )
}
