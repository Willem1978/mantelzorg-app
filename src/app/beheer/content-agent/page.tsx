"use client"

import { useState, useEffect } from "react"
import { AdminSpinner } from "@/components/admin"
import { useToast } from "@/components/ui/Toast"

type AgentType = "zoek-online" | "genereer" | "herschrijf" | "verrijk" | "categoriseer-bulk" | "hiaten-analyse" | "batch-genereer"

interface ArtikelOptie {
  id: string
  titel: string
  categorie: string
}

const TYPE_LABELS: Record<AgentType, string> = {
  "zoek-online": "Online bronnen zoeken",
  genereer: "Artikel genereren",
  herschrijf: "Artikel herschrijven",
  verrijk: "Artikel verrijken",
  "categoriseer-bulk": "Bulk categoriseren",
  "hiaten-analyse": "Hiaten-analyse",
  "batch-genereer": "Batch genereren",
}

const TYPE_ICONEN: Record<AgentType, string> = {
  "zoek-online": "🌐",
  genereer: "✨",
  herschrijf: "📝",
  verrijk: "🔍",
  "categoriseer-bulk": "🗂️",
  "hiaten-analyse": "📊",
  "batch-genereer": "🚀",
}

const TYPE_BESCHRIJVINGEN: Record<AgentType, string> = {
  "zoek-online": "Zoek relevante online bronnen en stel nieuwe artikelen voor op basis van actuele informatie en hiaten in de kennisbank",
  genereer: "Genereer een compleet nieuw artikel op B1-taalniveau over een opgegeven onderwerp",
  herschrijf: "Herschrijf een bestaand artikel: verbeter taalniveau, structuur en volledigheid",
  verrijk: "Voeg diepgang toe aan een bestaand artikel: extra tips, FAQ, bronnen en verwijzingen",
  "categoriseer-bulk": "Analyseer meerdere artikelen en corrigeer categorieën, subhoofdstukken en tags",
  "hiaten-analyse": "Analyseer de kennisbank op ontbrekende content per categorie en tag (aandoening/situatie)",
  "batch-genereer": "Genereer meerdere artikelen tegelijk op basis van voorstellen uit de hiaten-analyse",
}

export default function ContentAgentPage() {
  const [type, setType] = useState<AgentType>("zoek-online")
  const [onderwerp, setOnderwerp] = useState("")
  const [artikelId, setArtikelId] = useState("")
  const [limiet, setLimiet] = useState(20)
  const [opslaan, setOpslaan] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedCategorie, setSelectedCategorie] = useState("")
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [result, setResult] = useState<any>(null)
  const [artikelen, setArtikelen] = useState<ArtikelOptie[]>([])
  const [toepassenLoading, setToepassenLoading] = useState(false)
  const { showError, showSuccess } = useToast()

  // Haal artikelen op voor de selectielijst
  useEffect(() => {
    if (type === "herschrijf" || type === "verrijk") {
      fetch("/api/beheer/artikelen?limiet=100")
        .then((res) => res.json())
        .then((data) => {
          if (data.artikelen) {
            setArtikelen(
              data.artikelen.map((a: { id: string; titel: string; categorie: string }) => ({
                id: a.id,
                titel: a.titel,
                categorie: a.categorie,
              }))
            )
          }
        })
        .catch(() => {
          // Stille fout
        })
    }
  }, [type])

  async function runAgent() {
    setLoading(true)
    setResult(null)
    try {
      const body: Record<string, unknown> = { type }

      if (type === "zoek-online" && onderwerp) body.onderwerp = onderwerp
      if (type === "genereer") {
        if (!onderwerp.trim()) {
          showError("Vul een onderwerp in")
          setLoading(false)
          return
        }
        body.onderwerp = onderwerp
        body.opslaan = opslaan
        if (selectedCategorie) body.categorie = selectedCategorie
        if (selectedTags.length > 0) body.tags = selectedTags
      }
      if (type === "herschrijf") {
        if (!artikelId) {
          showError("Selecteer een artikel")
          setLoading(false)
          return
        }
        body.artikelId = artikelId
        if (onderwerp) body.onderwerp = onderwerp // als instructie
      }
      if (type === "verrijk") {
        if (!artikelId) {
          showError("Selecteer een artikel")
          setLoading(false)
          return
        }
        body.artikelId = artikelId
      }
      if (type === "categoriseer-bulk") {
        body.limiet = limiet
      }
      if (type === "hiaten-analyse") {
        // geen extra input nodig
      }
      if (type === "batch-genereer") {
        if (!result?.voorstellen || result.voorstellen.length === 0) {
          showError("Voer eerst een hiaten-analyse of zoek-online uit om voorstellen te genereren")
          setLoading(false)
          return
        }
        body.voorstellen = result.voorstellen
      }

      const res = await fetch("/api/ai/admin/content-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Content Agent mislukt")
      setResult(data)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Er ging iets mis"
      showError(message)
    } finally {
      setLoading(false)
    }
  }

  async function toepassenCategorisering() {
    if (!result?.wijzigingen || result.wijzigingen.length === 0) return
    setToepassenLoading(true)
    try {
      const res = await fetch("/api/ai/admin/content-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "toepassen",
          wijzigingen: result.wijzigingen,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      showSuccess(`${data.aantalVerwerkt} artikelen bijgewerkt`)
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : "Toepassen mislukt")
    } finally {
      setToepassenLoading(false)
    }
  }

  async function toepassenHerschrijving() {
    if (!result?.herschreven || !result?.artikelId) return
    setToepassenLoading(true)
    try {
      const res = await fetch("/api/ai/admin/content-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "toepassen-herschrijving",
          artikelId: result.artikelId,
          herschrijving: result.herschreven,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      showSuccess("Artikel bijgewerkt met herschreven versie")
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : "Toepassen mislukt")
    } finally {
      setToepassenLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Content Agent</h1>
        <p className="text-gray-500 mt-1">
          AI-gestuurde content-agent: zoek, genereer, herschrijf en verrijk artikelen automatisch.
        </p>
      </div>

      {/* Agent type selectie */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {(Object.keys(TYPE_LABELS) as AgentType[]).map((t) => (
          <button
            key={t}
            onClick={() => {
              setType(t)
              setResult(null)
            }}
            className={`p-3 rounded-xl border text-left transition-all ${
              type === t
                ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200"
                : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
            }`}
          >
            <span className="text-xl block mb-1">{TYPE_ICONEN[t]}</span>
            <span className="text-sm font-medium text-gray-900 block">{TYPE_LABELS[t]}</span>
          </button>
        ))}
      </div>

      {/* Invoervelden per type */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <p className="text-sm text-gray-500 mb-4">{TYPE_BESCHRIJVINGEN[type]}</p>

        <div className="space-y-4">
          {/* Onderwerp invoer */}
          {(type === "zoek-online" || type === "genereer") && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {type === "zoek-online" ? "Onderwerp (optioneel)" : "Onderwerp"}
              </label>
              <input
                type="text"
                value={onderwerp}
                onChange={(e) => setOnderwerp(e.target.value)}
                placeholder={
                  type === "zoek-online"
                    ? "bijv. dementie, jonge mantelzorgers, respijtzorg..."
                    : "bijv. Hoe ga je om met schuldgevoel als mantelzorger?"
                }
                className="w-full rounded-lg border-gray-300 text-sm py-2 px-3 border focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          )}

          {/* Artikel selectie */}
          {(type === "herschrijf" || type === "verrijk") && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Selecteer een artikel</label>
              <select
                value={artikelId}
                onChange={(e) => setArtikelId(e.target.value)}
                className="w-full rounded-lg border-gray-300 text-sm py-2 px-3 border focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">-- Kies een artikel --</option>
                {artikelen.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.titel} ({a.categorie})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Extra instructies bij herschrijven */}
          {type === "herschrijf" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Specifieke instructies (optioneel)
              </label>
              <input
                type="text"
                value={onderwerp}
                onChange={(e) => setOnderwerp(e.target.value)}
                placeholder="bijv. Maak korter, voeg meer voorbeelden toe, focus op financieel..."
                className="w-full rounded-lg border-gray-300 text-sm py-2 px-3 border focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          )}

          {/* Limiet bij bulk */}
          {type === "categoriseer-bulk" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Aantal artikelen (max 50)
              </label>
              <input
                type="number"
                min={1}
                max={50}
                value={limiet}
                onChange={(e) => setLimiet(Number(e.target.value))}
                className="rounded-lg border-gray-300 text-sm py-2 px-3 border w-24 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          )}

          {/* Categorie selectie bij genereren */}
          {type === "genereer" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categorie (optioneel)</label>
              <select
                value={selectedCategorie}
                onChange={(e) => setSelectedCategorie(e.target.value)}
                className="w-full rounded-lg border-gray-300 text-sm py-2 px-3 border focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">-- Automatisch --</option>
                <option value="dagelijks-zorgen">Dagelijks zorgen</option>
                <option value="zelfzorg-balans">Zelfzorg &amp; balans</option>
                <option value="rechten-regelingen">Rechten &amp; regelingen</option>
                <option value="geld-financien">Geld &amp; financien</option>
                <option value="hulpmiddelen-technologie">Hulpmiddelen &amp; technologie</option>
                <option value="werk-mantelzorg">Werk &amp; mantelzorg</option>
                <option value="samenwerken-netwerk">Samenwerken &amp; netwerk</option>
              </select>
            </div>
          )}

          {/* Tags selectie bij genereren */}
          {type === "genereer" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tags (optioneel)</label>
              <div className="flex flex-wrap gap-2">
                {["dementie", "kanker", "cva-beroerte", "hartfalen", "copd", "diabetes", "psychisch", "ouderdom", "terminaal", "jong", "werkend", "op-afstand", "beginnend", "langdurig"].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setSelectedTags((prev) =>
                      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
                    )}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                      selectedTags.includes(tag)
                        ? "bg-blue-100 text-blue-700 border-blue-300"
                        : "bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Opslaan optie bij genereren */}
          {type === "genereer" && (
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={opslaan}
                onChange={(e) => setOpslaan(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              Direct opslaan als concept-artikel
            </label>
          )}

          {/* Batch-genereer info */}
          {type === "batch-genereer" && (
            <div className="text-sm text-gray-600">
              {result?.voorstellen?.length > 0 ? (
                <p>Er zijn <strong>{result.voorstellen.length}</strong> voorstellen klaar om te genereren.</p>
              ) : (
                <p>Voer eerst een <strong>hiaten-analyse</strong> of <strong>online zoeken</strong> uit om voorstellen te verzamelen.</p>
              )}
            </div>
          )}

          <button
            onClick={runAgent}
            disabled={loading}
            className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
          >
            {loading ? "Bezig..." : `${TYPE_ICONEN[type]} ${TYPE_LABELS[type]}`}
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <AdminSpinner />
          <span className="ml-3 text-gray-500">
            Content Agent werkt ({TYPE_LABELS[type].toLowerCase()})... dit kan even duren
          </span>
        </div>
      )}

      {/* Resultaten */}
      {result && !loading && (
        <div className="space-y-6">
          {/* Samenvatting */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ResultCard
              icon={TYPE_ICONEN[type]}
              label={TYPE_LABELS[type]}
              waarde={getHoofdWaarde(result)}
              detail={getDetail(result)}
            />
            {result.type === "zoek-online" && result.aantalVoorstellen > 0 && (
              <ResultCard
                icon="📋"
                label="Voorstellen"
                waarde={`${result.aantalVoorstellen}`}
                detail="nieuwe artikelen voorgesteld"
              />
            )}
            {result.type === "categoriseer-bulk" && (
              <ResultCard
                icon="🔄"
                label="Wijzigingen"
                waarde={`${result.aantalWijzigingen || 0}`}
                detail="artikelen moeten aangepast"
              />
            )}
            {result.type === "genereer" && result.opgeslagen && (
              <ResultCard
                icon="💾"
                label="Opgeslagen"
                waarde="Ja"
                detail="als concept-artikel"
                kleur="green"
              />
            )}
          </div>

          {/* Acties */}
          {result.type === "categoriseer-bulk" && result.wijzigingen?.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-yellow-800">
                    {result.wijzigingen.length} wijzigingen gevonden
                  </h3>
                  <p className="text-xs text-yellow-600 mt-1">
                    Wil je deze categorisatie-wijzigingen direct toepassen in de database?
                  </p>
                </div>
                <button
                  onClick={toepassenCategorisering}
                  disabled={toepassenLoading}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 text-sm font-medium"
                >
                  {toepassenLoading ? "Bezig..." : "Wijzigingen toepassen"}
                </button>
              </div>
            </div>
          )}

          {result.type === "herschrijf" && result.herschreven && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-blue-800">
                    Herschreven versie klaar
                  </h3>
                  <p className="text-xs text-blue-600 mt-1">
                    Wil je het originele artikel vervangen door de herschreven versie?
                  </p>
                </div>
                <button
                  onClick={toepassenHerschrijving}
                  disabled={toepassenLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
                >
                  {toepassenLoading ? "Bezig..." : "Herschrijving toepassen"}
                </button>
              </div>
            </div>
          )}

          {/* Gegenereerd artikel preview */}
          {result.type === "genereer" && result.artikel && (
            <ArtikelPreview artikel={result.artikel} />
          )}

          {/* Herschreven artikel vergelijking */}
          {result.type === "herschrijf" && result.herschreven && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <h3 className="text-sm font-semibold text-gray-500 mb-2">Origineel</h3>
                <p className="font-medium text-gray-900">{result.origineel?.titel}</p>
                <p className="text-sm text-gray-500 mt-1">{result.origineel?.beschrijving}</p>
              </div>
              <div className="bg-white rounded-xl border border-green-200 p-4">
                <h3 className="text-sm font-semibold text-green-600 mb-2">Herschreven</h3>
                <p className="font-medium text-gray-900">{result.herschreven.titel}</p>
                <p className="text-sm text-gray-500 mt-1">{result.herschreven.beschrijving}</p>
                {result.herschreven.wijzigingen && (
                  <ul className="mt-2 space-y-1">
                    {result.herschreven.wijzigingen.map((w: string, i: number) => (
                      <li key={i} className="text-xs text-green-700 flex items-start gap-1">
                        <span>+</span> {w}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {/* Verrijking preview */}
          {result.type === "verrijk" && result.verrijking && (
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">
                Verrijking voor: {result.artikel?.titel}
              </h3>
              {result.verrijking.toegevoegdeSecties && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {result.verrijking.toegevoegdeSecties.map((s: string, i: number) => (
                    <span key={i} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                      + {s}
                    </span>
                  ))}
                </div>
              )}
              {result.gerelateerdeArtikelen?.length > 0 && (
                <p className="text-xs text-gray-500">
                  Gerelateerd: {result.gerelateerdeArtikelen.join(", ")}
                </p>
              )}
            </div>
          )}

          {/* Voorstellen bij zoek-online */}
          {result.type === "zoek-online" && result.voorstellen?.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-900">Artikel-voorstellen</h3>
              {result.voorstellen.map((v: {
                titel?: string
                beschrijving?: string
                categorie?: string
                bronNaam?: string
                relevantie?: string
              }, i: number) => (
                <div key={i} className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">{v.titel || "Zonder titel"}</h4>
                      <p className="text-xs text-gray-500 mt-1">{v.beschrijving || ""}</p>
                    </div>
                    {v.categorie && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full whitespace-nowrap ml-2">
                        {v.categorie}
                      </span>
                    )}
                  </div>
                  {v.bronNaam && (
                    <p className="text-xs text-gray-400 mt-2">Bron: {v.bronNaam}</p>
                  )}
                  {v.relevantie && (
                    <p className="text-xs text-gray-400">{v.relevantie}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Hiaten-analyse resultaat */}
          {result.type === "hiaten-analyse" && result.matrix && (
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Categorie x Tag Matrix</h3>
              <div className="overflow-x-auto">
                <table className="text-xs w-full">
                  <thead>
                    <tr>
                      <th className="text-left p-1 font-medium text-gray-600">Categorie</th>
                      {result.matrix.tags?.map((tag: string) => (
                        <th key={tag} className="text-center p-1 font-medium text-gray-600">{tag}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.matrix.rijen?.map((rij: { categorie: string; cellen: number[] }, i: number) => (
                      <tr key={i} className="border-t border-gray-100">
                        <td className="p-1 text-gray-700">{rij.categorie}</td>
                        {rij.cellen?.map((cel: number, j: number) => (
                          <td key={j} className={`text-center p-1 ${cel === 0 ? "text-red-500 font-bold" : "text-gray-600"}`}>
                            {cel}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Batch-genereer resultaat */}
          {result.type === "batch-genereer" && result.gegenereerd > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-green-800">
                {result.gegenereerd} artikelen gegenereerd
              </h3>
              <p className="text-xs text-green-600 mt-1">
                {result.opgeslagen || 0} opgeslagen, {result.mislukt || 0} mislukt
              </p>
            </div>
          )}

          {/* Categorisatie wijzigingen */}
          {result.type === "categoriseer-bulk" && result.wijzigingen?.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-900">Voorgestelde wijzigingen</h3>
              {result.wijzigingen.map((w: {
                id: string
                titel?: string
                huidigeCategorie?: string
                nieuweCategorie?: string
                reden?: string
              }, i: number) => (
                <div key={i} className="bg-white rounded-lg border border-gray-200 p-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{w.titel || w.id}</p>
                    <p className="text-xs text-gray-500">{w.reden || ""}</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="bg-red-50 text-red-600 px-2 py-0.5 rounded">{w.huidigeCategorie}</span>
                    <span className="text-gray-400">&rarr;</span>
                    <span className="bg-green-50 text-green-600 px-2 py-0.5 rounded">{w.nieuweCategorie}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Volledige AI-analyse */}
          <div className="bg-white rounded-xl border border-gray-200">
            <button
              onClick={() => {
                const el = document.getElementById("analyse-detail")
                if (el) el.classList.toggle("hidden")
              }}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors rounded-xl"
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">📄</span>
                <div>
                  <h2 className="text-base font-semibold text-gray-900">Volledige AI-analyse</h2>
                  <p className="text-xs text-gray-500">Klik om de volledige tekst te tonen/verbergen</p>
                </div>
              </div>
              <span className="text-gray-400 text-lg">▼</span>
            </button>
            <div id="analyse-detail" className="hidden px-6 pb-6 border-t border-gray-100">
              <div className="prose prose-sm max-w-none text-gray-700 mt-4 whitespace-pre-wrap">
                {formatAnalyse(result.analyse || result.volledigeTekst || "")}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Hulpcomponenten ─────────────────────────────────────────────────

function ResultCard({
  icon,
  label,
  waarde,
  detail,
  kleur = "blue",
}: {
  icon: string
  label: string
  waarde: string
  detail: string
  kleur?: "blue" | "green" | "yellow"
}) {
  const kleuren = {
    blue: "text-blue-700",
    green: "text-green-700",
    yellow: "text-yellow-700",
  }
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{icon}</span>
        <h3 className="text-sm font-medium text-gray-500">{label}</h3>
      </div>
      <p className={`text-2xl font-bold ${kleuren[kleur]}`}>{waarde}</p>
      <p className="text-xs text-gray-400 mt-1">{detail}</p>
    </div>
  )
}

function ArtikelPreview({ artikel }: { artikel: {
  titel: string
  beschrijving: string
  inhoud: string
  categorie: string
  tags?: string[]
} }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{artikel.categorie}</span>
        {artikel.tags?.map((tag: string) => (
          <span key={tag} className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full">{tag}</span>
        ))}
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">{artikel.titel}</h2>
      <p className="text-gray-600 mb-4">{artikel.beschrijving}</p>
      <div
        className="prose prose-sm max-w-none text-gray-700"
        dangerouslySetInnerHTML={{ __html: artikel.inhoud }}
      />
    </div>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getHoofdWaarde(result: any): string {
  if (result.type === "zoek-online") return `${result.aantalVoorstellen || 0}`
  if (result.type === "genereer") return result.artikel ? "1" : "0"
  if (result.type === "herschrijf") return result.herschreven ? "Klaar" : "Mislukt"
  if (result.type === "verrijk") return result.verrijking ? "Klaar" : "Mislukt"
  if (result.type === "categoriseer-bulk") return `${result.aantalItems || 0}`
  if (result.type === "hiaten-analyse") return `${result.aantalHiaten || 0}`
  if (result.type === "batch-genereer") return `${result.gegenereerd || 0}`
  return "—"
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getDetail(result: any): string {
  if (result.type === "zoek-online") return "artikel-voorstellen"
  if (result.type === "genereer") return result.opgeslagen ? "opgeslagen als concept" : "artikel gegenereerd"
  if (result.type === "herschrijf") return "artikel herschreven"
  if (result.type === "verrijk") return "artikel verrijkt"
  if (result.type === "categoriseer-bulk") return "artikelen geanalyseerd"
  if (result.type === "hiaten-analyse") return "hiaten gevonden"
  if (result.type === "batch-genereer") return "artikelen gegenereerd"
  return ""
}

function formatAnalyse(text: string) {
  if (!text) return null
  const parts = text.split(/(##\s+.+)/g)
  return parts.map((part, i) => {
    if (part.startsWith("## ")) {
      return (
        <h3 key={i} className="text-base font-semibold text-gray-900 mt-4 mb-2">
          {part.replace("## ", "")}
        </h3>
      )
    }
    // Highlight JSON blokken
    if (part.includes("```json")) {
      const subparts = part.split(/(```json[\s\S]*?```)/g)
      return (
        <span key={i}>
          {subparts.map((sp, j) =>
            sp.startsWith("```json") ? (
              <pre key={j} className="bg-gray-50 rounded-lg p-3 text-xs overflow-auto my-2 border border-gray-200">
                <code>{sp.replace(/```json\s*/, "").replace(/```/, "")}</code>
              </pre>
            ) : (
              <span key={j}>{sp}</span>
            )
          )}
        </span>
      )
    }
    return <span key={i}>{part}</span>
  })
}
