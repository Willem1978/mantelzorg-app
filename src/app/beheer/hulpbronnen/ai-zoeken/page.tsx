"use client"

import { useSession } from "next-auth/react"
import { useState, useCallback, useRef, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"

// ============================================
// TYPES
// ============================================

interface GevondenHulpbron {
  categorie: string
  categorieLabel: string
  categorieDbField: "soortHulp" | "onderdeelTest"
  categorieDbValue: string
  categorieGroep: "mantelzorger" | "naaste"
  naam: string
  beschrijving: string
  website: string
  telefoon: string
  email: string
  adres: string
  gemeente: string
  woonplaats: string
  dienst: string
  doelgroep: string
  kosten: string
  aanmeldprocedure: string
  eersteStap: string
  vertrouwen: "HOOG" | "GEMIDDELD" | "LAAG"
  bron: string
  isDuplicaat: boolean
  duplicaatVan: string | null
}

interface Voortgang {
  fase: string
  stap: string
  percentage: number
  resultaten: number
}

// Categorie metadata voor weergave
const CATEGORIE_META: Record<string, { emoji: string; groep: string }> = {
  A1: { emoji: "ℹ️", groep: "Voor de mantelzorger" },
  A2: { emoji: "🛏️", groep: "Voor de mantelzorger" },
  A3: { emoji: "💚", groep: "Voor de mantelzorger" },
  A4: { emoji: "🤝", groep: "Voor de mantelzorger" },
  A5: { emoji: "📚", groep: "Voor de mantelzorger" },
  B1: { emoji: "📋", groep: "Hulp bij taken" },
  B2: { emoji: "📅", groep: "Hulp bij taken" },
  B3: { emoji: "🛒", groep: "Hulp bij taken" },
  B4: { emoji: "🩺", groep: "Hulp bij taken" },
  B5: { emoji: "🍽️", groep: "Hulp bij taken" },
  B6: { emoji: "👥", groep: "Hulp bij taken" },
  B7: { emoji: "🚗", groep: "Hulp bij taken" },
  B8: { emoji: "🧹", groep: "Hulp bij taken" },
  B9: { emoji: "🔧", groep: "Hulp bij taken" },
  B10: { emoji: "🐕", groep: "Hulp bij taken" },
}

// ============================================
// COMPONENT
// ============================================

export default function AIZoekenPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Laden...</div>}>
      <AIZoekenContent />
    </Suspense>
  )
}

function AIZoekenContent() {
  const { data: session } = useSession()
  const searchParams = useSearchParams()

  // Zoekstaat
  const [gemeente, setGemeente] = useState("")

  // Lees gemeente uit URL query param (vanuit wizard)
  useEffect(() => {
    const g = searchParams.get("gemeente")
    if (g) setGemeente(g)
  }, [searchParams])
  const [isZoeken, setIsZoeken] = useState(false)
  const [voortgang, setVoortgang] = useState<Voortgang | null>(null)
  const [resultaten, setResultaten] = useState<GevondenHulpbron[]>([])
  const [fout, setFout] = useState<string | null>(null)

  // Selectie en bewerking
  const [geselecteerd, setGeselecteerd] = useState<Set<number>>(new Set())
  const [bewerkIndex, setBewerkIndex] = useState<number | null>(null)
  const [bewerkData, setBewerkData] = useState<GevondenHulpbron | null>(null)

  // Filters
  const [filterCategorie, setFilterCategorie] = useState<string>("alle")
  const [filterVertrouwen, setFilterVertrouwen] = useState<string>("alle")
  const [filterGroep, setFilterGroep] = useState<string>("alle")

  // Opslaan
  const [isOpslaan, setIsOpslaan] = useState(false)
  const [opslaanResultaat, setOpslaanResultaat] = useState<{ aangemaakt: number; fouten: string[] } | null>(null)

  const abortRef = useRef<AbortController | null>(null)

  // ============================================
  // ZOEKEN
  // ============================================

  const startZoeken = useCallback(async () => {
    if (!gemeente.trim()) return

    setIsZoeken(true)
    setVoortgang(null)
    setResultaten([])
    setFout(null)
    setGeselecteerd(new Set())
    setOpslaanResultaat(null)

    abortRef.current = new AbortController()

    try {
      const response = await fetch("/api/beheer/gemeenten/ai-zoek-hulpbronnen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gemeente: gemeente.trim() }),
        signal: abortRef.current.signal,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Zoeken mislukt")
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error("Geen stream ontvangen")

      const decoder = new TextDecoder()
      let buffer = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })

        // Parse SSE events
        const lines = buffer.split("\n")
        buffer = ""

        let eventType = ""
        for (const line of lines) {
          if (line.startsWith("event: ")) {
            eventType = line.slice(7).trim()
          } else if (line.startsWith("data: ")) {
            const data = line.slice(6)
            try {
              const parsed = JSON.parse(data)
              if (eventType === "voortgang") {
                setVoortgang(parsed)
              } else if (eventType === "resultaat") {
                setResultaten(parsed.resultaten || [])
                // Selecteer standaard alle niet-duplicaten
                const nietDuplicaten = new Set<number>()
                ;(parsed.resultaten || []).forEach((r: GevondenHulpbron, i: number) => {
                  if (!r.isDuplicaat) nietDuplicaten.add(i)
                })
                setGeselecteerd(nietDuplicaten)
              } else if (eventType === "fout") {
                setFout(parsed.bericht)
              }
            } catch {
              // Incomplete JSON, bewaar in buffer
              buffer = line + "\n"
            }
          } else if (line.trim() === "") {
            eventType = ""
          } else {
            buffer += line + "\n"
          }
        }
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        setFout((e as Error).message || "Onbekende fout bij zoeken")
      }
    } finally {
      setIsZoeken(false)
    }
  }, [gemeente])

  const stopZoeken = useCallback(() => {
    abortRef.current?.abort()
    setIsZoeken(false)
  }, [])

  // ============================================
  // SELECTIE
  // ============================================

  const toggleSelectie = useCallback((index: number) => {
    setGeselecteerd((prev) => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }, [])

  const selecteerAlleZichtbare = useCallback(() => {
    const zichtbare = gefilterdeResultaten()
    const indices = zichtbare.map((r) => resultaten.indexOf(r))
    setGeselecteerd((prev) => {
      const next = new Set(prev)
      for (const i of indices) {
        if (!resultaten[i].isDuplicaat) next.add(i)
      }
      return next
    })
  }, [resultaten, filterCategorie, filterVertrouwen, filterGroep])

  const deselecteerAlleZichtbare = useCallback(() => {
    const zichtbare = gefilterdeResultaten()
    const indices = new Set(zichtbare.map((r) => resultaten.indexOf(r)))
    setGeselecteerd((prev) => {
      const next = new Set(prev)
      for (const i of indices) next.delete(i)
      return next
    })
  }, [resultaten, filterCategorie, filterVertrouwen, filterGroep])

  // ============================================
  // BEWERKEN
  // ============================================

  const startBewerken = useCallback((index: number) => {
    setBewerkIndex(index)
    setBewerkData({ ...resultaten[index] })
  }, [resultaten])

  const opslaanBewerking = useCallback(() => {
    if (bewerkIndex === null || !bewerkData) return
    setResultaten((prev) => {
      const next = [...prev]
      next[bewerkIndex] = bewerkData
      return next
    })
    setBewerkIndex(null)
    setBewerkData(null)
  }, [bewerkIndex, bewerkData])

  const annuleerBewerking = useCallback(() => {
    setBewerkIndex(null)
    setBewerkData(null)
  }, [])

  // ============================================
  // OPSLAAN
  // ============================================

  const slaGeselecteerdeOp = useCallback(async () => {
    const teOpslaanIndices = Array.from(geselecteerd)
    const teOpslaan = teOpslaanIndices.map((i) => resultaten[i])

    if (teOpslaan.length === 0) return

    setIsOpslaan(true)
    setOpslaanResultaat(null)

    try {
      const response = await fetch("/api/beheer/gemeenten/ai-zoek-hulpbronnen/opslaan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hulpbronnen: teOpslaan }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Opslaan mislukt")
      }

      setOpslaanResultaat(data)
      // Verwijder opgeslagen items uit selectie
      setGeselecteerd(new Set())
    } catch (e) {
      setFout((e as Error).message)
    } finally {
      setIsOpslaan(false)
    }
  }, [geselecteerd, resultaten])

  // ============================================
  // FILTERS
  // ============================================

  // eslint-disable-next-line react-hooks/exhaustive-deps
  function gefilterdeResultaten(): GevondenHulpbron[] {
    return resultaten.filter((r) => {
      if (filterCategorie !== "alle" && r.categorie !== filterCategorie) return false
      if (filterVertrouwen !== "alle" && r.vertrouwen !== filterVertrouwen) return false
      if (filterGroep !== "alle" && r.categorieGroep !== filterGroep) return false
      return true
    })
  }

  // Groepeer per categorie voor overzicht
  function getCategorieTellingen(): Record<string, number> {
    const tellingen: Record<string, number> = {}
    for (const r of resultaten) {
      const key = r.categorie
      tellingen[key] = (tellingen[key] || 0) + 1
    }
    return tellingen
  }

  const gefilterd = gefilterdeResultaten()
  const tellingen = getCategorieTellingen()
  const aantalGeselecteerdZichtbaar = gefilterd.filter((r) =>
    geselecteerd.has(resultaten.indexOf(r))
  ).length

  // Unieke categorieën in resultaten
  const beschikbareCategorieën = [...new Set(resultaten.map((r) => r.categorie))].sort()

  // ============================================
  // RENDER
  // ============================================

  if (session?.user?.role !== "ADMIN") {
    return (
      <div className="p-8">
        <p className="text-red-600">Geen toegang. Je moet beheerder zijn.</p>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">AI Hulpbronnen Zoeker</h1>
        <p className="text-muted-foreground mt-1">
          Zoek automatisch hulpbronnen voor een gemeente. De AI zoekt per categorie
          en laat je de resultaten beoordelen voordat ze worden toegevoegd.
        </p>
      </div>

      {/* Zoekbalk */}
      <div className="flex gap-3 items-end">
        <div className="flex-1">
          <label htmlFor="gemeente" className="block text-sm font-medium mb-1">
            Gemeente
          </label>
          <input
            id="gemeente"
            type="text"
            value={gemeente}
            onChange={(e) => setGemeente(e.target.value)}
            placeholder="Bijv. Nijmegen, Arnhem, Utrecht..."
            className="w-full px-3 py-2 border rounded-md"
            disabled={isZoeken}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !isZoeken) startZoeken()
            }}
          />
        </div>
        {isZoeken ? (
          <button
            onClick={stopZoeken}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Stoppen
          </button>
        ) : (
          <button
            onClick={startZoeken}
            disabled={!gemeente.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            Zoeken
          </button>
        )}
      </div>

      {/* Voortgangsbalk */}
      {voortgang && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span>{voortgang.stap}</span>
            <span>{voortgang.percentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 rounded-full h-2 transition-all duration-300"
              style={{ width: `${voortgang.percentage}%` }}
            />
          </div>
          {voortgang.resultaten > 0 && (
            <p className="text-xs text-muted-foreground">
              {voortgang.resultaten} ruwe resultaten gevonden
            </p>
          )}
        </div>
      )}

      {/* Foutmelding */}
      {fout && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {fout}
        </div>
      )}

      {/* Opslaan resultaat */}
      {opslaanResultaat && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800 font-medium">
            {opslaanResultaat.aangemaakt} hulpbronnen opgeslagen
          </p>
          {opslaanResultaat.fouten.length > 0 && (
            <ul className="mt-2 text-sm text-red-600">
              {opslaanResultaat.fouten.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
          )}
          <p className="text-sm text-green-700 mt-2">
            De hulpbronnen zijn nu zichtbaar op het dashboard, in Ger, en op de hulpvragen-pagina.
          </p>
        </div>
      )}

      {/* Resultaten */}
      {resultaten.length > 0 && (
        <>
          {/* Categorie-overzicht */}
          <div className="bg-white border rounded-lg p-4">
            <h2 className="font-semibold mb-3">Overzicht per categorie</h2>
            <div className="flex flex-wrap gap-2">
              {beschikbareCategorieën.map((cat) => {
                const meta = CATEGORIE_META[cat]
                const r = resultaten.find((r) => r.categorie === cat)
                return (
                  <button
                    key={cat}
                    onClick={() => setFilterCategorie(filterCategorie === cat ? "alle" : cat)}
                    className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                      filterCategorie === cat
                        ? "bg-blue-100 border-blue-300 text-blue-800"
                        : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                    }`}
                  >
                    {meta?.emoji || "📌"} {r?.categorieLabel || cat} ({tellingen[cat] || 0})
                  </button>
                )
              })}
              {filterCategorie !== "alle" && (
                <button
                  onClick={() => setFilterCategorie("alle")}
                  className="px-3 py-1.5 rounded-full text-sm border bg-gray-100 hover:bg-gray-200"
                >
                  Toon alle
                </button>
              )}
            </div>
          </div>

          {/* Filters + acties */}
          <div className="flex flex-wrap gap-3 items-center justify-between">
            <div className="flex gap-2 items-center flex-wrap">
              <select
                value={filterGroep}
                onChange={(e) => setFilterGroep(e.target.value)}
                className="px-3 py-1.5 border rounded-md text-sm"
              >
                <option value="alle">Alle groepen</option>
                <option value="mantelzorger">Voor de mantelzorger</option>
                <option value="naaste">Hulp bij taken</option>
              </select>

              <select
                value={filterVertrouwen}
                onChange={(e) => setFilterVertrouwen(e.target.value)}
                className="px-3 py-1.5 border rounded-md text-sm"
              >
                <option value="alle">Alle vertrouwen</option>
                <option value="HOOG">Hoog vertrouwen</option>
                <option value="GEMIDDELD">Gemiddeld vertrouwen</option>
                <option value="LAAG">Laag vertrouwen</option>
              </select>

              <span className="text-sm text-muted-foreground">
                {gefilterd.length} van {resultaten.length} resultaten
              </span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={selecteerAlleZichtbare}
                className="px-3 py-1.5 text-sm border rounded-md hover:bg-gray-50"
              >
                Alles selecteren
              </button>
              <button
                onClick={deselecteerAlleZichtbare}
                className="px-3 py-1.5 text-sm border rounded-md hover:bg-gray-50"
              >
                Niets selecteren
              </button>
              <button
                onClick={slaGeselecteerdeOp}
                disabled={geselecteerd.size === 0 || isOpslaan}
                className="px-4 py-1.5 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {isOpslaan
                  ? "Opslaan..."
                  : `${aantalGeselecteerdZichtbaar} toevoegen`}
              </button>
            </div>
          </div>

          {/* Resultatenlijst */}
          <div className="space-y-3">
            {gefilterd.map((hulpbron, _fi) => {
              const globalIndex = resultaten.indexOf(hulpbron)
              const isSelected = geselecteerd.has(globalIndex)
              const meta = CATEGORIE_META[hulpbron.categorie]
              const isEditing = bewerkIndex === globalIndex

              return (
                <div
                  key={globalIndex}
                  className={`border rounded-lg p-4 transition-colors ${
                    hulpbron.isDuplicaat
                      ? "bg-yellow-50 border-yellow-200 opacity-60"
                      : isSelected
                      ? "bg-blue-50 border-blue-200"
                      : "bg-white"
                  }`}
                >
                  {isEditing && bewerkData ? (
                    // Bewerkformulier
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <h3 className="font-semibold">Bewerken</h3>
                        <div className="flex gap-2">
                          <button
                            onClick={opslaanBewerking}
                            className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                          >
                            Opslaan
                          </button>
                          <button
                            onClick={annuleerBewerking}
                            className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
                          >
                            Annuleren
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <BewerkVeld label="Naam" waarde={bewerkData.naam} onChange={(v) => setBewerkData({ ...bewerkData, naam: v })} />
                        <BewerkVeld label="Dienst" waarde={bewerkData.dienst} onChange={(v) => setBewerkData({ ...bewerkData, dienst: v })} />
                        <BewerkVeld label="Beschrijving" waarde={bewerkData.beschrijving} onChange={(v) => setBewerkData({ ...bewerkData, beschrijving: v })} groot />
                        <BewerkVeld label="Telefoon" waarde={bewerkData.telefoon} onChange={(v) => setBewerkData({ ...bewerkData, telefoon: v })} />
                        <BewerkVeld label="Email" waarde={bewerkData.email} onChange={(v) => setBewerkData({ ...bewerkData, email: v })} />
                        <BewerkVeld label="Website" waarde={bewerkData.website} onChange={(v) => setBewerkData({ ...bewerkData, website: v })} />
                        <BewerkVeld label="Adres" waarde={bewerkData.adres} onChange={(v) => setBewerkData({ ...bewerkData, adres: v })} />
                        <BewerkVeld label="Woonplaats" waarde={bewerkData.woonplaats} onChange={(v) => setBewerkData({ ...bewerkData, woonplaats: v })} />
                        <BewerkVeld label="Kosten" waarde={bewerkData.kosten} onChange={(v) => setBewerkData({ ...bewerkData, kosten: v })} />
                        <BewerkVeld label="Aanmeldprocedure" waarde={bewerkData.aanmeldprocedure} onChange={(v) => setBewerkData({ ...bewerkData, aanmeldprocedure: v })} />
                        <BewerkVeld label="Eerste stap" waarde={bewerkData.eersteStap} onChange={(v) => setBewerkData({ ...bewerkData, eersteStap: v })} />
                        <BewerkVeld label="Doelgroep" waarde={bewerkData.doelgroep} onChange={(v) => setBewerkData({ ...bewerkData, doelgroep: v })} />
                      </div>
                    </div>
                  ) : (
                    // Weergave
                    <div className="flex gap-3">
                      {/* Checkbox */}
                      <div className="pt-1">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectie(globalIndex)}
                          disabled={hulpbron.isDuplicaat}
                          className="w-5 h-5 rounded border-gray-300"
                        />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold">{hulpbron.naam}</h3>
                              <span className={`px-2 py-0.5 rounded-full text-xs ${
                                hulpbron.vertrouwen === "HOOG"
                                  ? "bg-green-100 text-green-700"
                                  : hulpbron.vertrouwen === "GEMIDDELD"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : "bg-red-100 text-red-700"
                              }`}>
                                {hulpbron.vertrouwen === "HOOG" ? "Hoog" : hulpbron.vertrouwen === "GEMIDDELD" ? "Gemiddeld" : "Laag"} vertrouwen
                              </span>
                              {hulpbron.isDuplicaat && (
                                <span className="px-2 py-0.5 rounded-full text-xs bg-yellow-100 text-yellow-700">
                                  Duplicaat
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground flex-wrap">
                              <span>{meta?.emoji} {hulpbron.categorieLabel}</span>
                              <span>|</span>
                              <span>{hulpbron.categorieGroep === "mantelzorger" ? "Voor mantelzorger" : "Bij taken naaste"}</span>
                              {hulpbron.woonplaats && (
                                <>
                                  <span>|</span>
                                  <span>Woonplaats: {hulpbron.woonplaats}</span>
                                </>
                              )}
                              <span>|</span>
                              <span>Bron: {hulpbron.bron}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => startBewerken(globalIndex)}
                            className="px-2 py-1 text-xs border rounded hover:bg-gray-50 shrink-0"
                          >
                            Bewerken
                          </button>
                        </div>

                        {hulpbron.beschrijving && (
                          <p className="text-sm mt-2">{hulpbron.beschrijving}</p>
                        )}

                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
                          {hulpbron.dienst && <span>Dienst: {hulpbron.dienst}</span>}
                          {hulpbron.telefoon && <span>Tel: {hulpbron.telefoon}</span>}
                          {hulpbron.website && (
                            <a
                              href={hulpbron.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline truncate max-w-[200px]"
                            >
                              {hulpbron.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                            </a>
                          )}
                          {hulpbron.kosten && <span>Kosten: {hulpbron.kosten}</span>}
                        </div>

                        {hulpbron.eersteStap && (
                          <p className="text-xs mt-1 text-green-700">
                            Eerste stap: {hulpbron.eersteStap}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Onderaan opslaan-knop */}
          {geselecteerd.size > 0 && (
            <div className="sticky bottom-4 bg-white border rounded-lg shadow-lg p-4 flex justify-between items-center">
              <span className="font-medium">
                {geselecteerd.size} hulpbronnen geselecteerd
              </span>
              <button
                onClick={slaGeselecteerdeOp}
                disabled={isOpslaan}
                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {isOpslaan ? "Opslaan..." : "Toevoegen aan database"}
              </button>
            </div>
          )}
        </>
      )}

      {/* Lege staat */}
      {!isZoeken && resultaten.length === 0 && !fout && (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg">Voer een gemeente in en klik op &ldquo;Zoeken&rdquo;</p>
          <p className="text-sm mt-2">
            De AI zoekt in 15 categorieën naar hulpbronnen voor mantelzorgers.
          </p>
        </div>
      )}
    </div>
  )
}

// ============================================
// HULPCOMPONENT: Bewerkbaar veld
// ============================================

function BewerkVeld({
  label,
  waarde,
  onChange,
  groot,
}: {
  label: string
  waarde: string
  onChange: (v: string) => void
  groot?: boolean
}) {
  return (
    <div className={groot ? "md:col-span-2" : ""}>
      <label className="block text-xs font-medium text-gray-600 mb-1">
        {label}
      </label>
      {groot ? (
        <textarea
          value={waarde}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className="w-full px-2 py-1.5 border rounded text-sm"
        />
      ) : (
        <input
          type="text"
          value={waarde}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-2 py-1.5 border rounded text-sm"
        />
      )}
    </div>
  )
}
