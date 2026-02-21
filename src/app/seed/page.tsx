"use client"

import { useState } from "react"

const steps = [
  { label: "Stap 1: Artikelen + Nieuws + Admin", endpoint: "/api/seed/artikelen", description: "Admin user, 44 artikelen, 6 gemeente nieuws items, intake vragen" },
  { label: "Stap 2: Content", endpoint: "/api/seed/content", description: "Balanstest vragen, zorgtaken, categorieen, formulier opties, app content" },
  { label: "Stap 3: Zorgorganisaties", endpoint: "/api/seed/organisaties", description: "195+ organisaties in Nijmegen, Arnhem en landelijk" },
]

export default function SeedPage() {
  const [results, setResults] = useState<Record<string, { status: string; data?: any }>>({})
  const [loading, setLoading] = useState<string | null>(null)

  async function runSeed(endpoint: string) {
    setLoading(endpoint)
    setResults(prev => ({ ...prev, [endpoint]: { status: "loading" } }))

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
      const data = await res.json()
      setResults(prev => ({
        ...prev,
        [endpoint]: { status: res.ok ? "success" : "error", data },
      }))
    } catch (e) {
      setResults(prev => ({
        ...prev,
        [endpoint]: { status: "error", data: { error: String(e) } },
      }))
    } finally {
      setLoading(null)
    }
  }

  async function runAll() {
    for (const step of steps) {
      await runSeed(step.endpoint)
    }
  }

  return (
    <div style={{ maxWidth: 600, margin: "40px auto", padding: 20, fontFamily: "system-ui" }}>
      <h1 style={{ fontSize: 24, marginBottom: 8 }}>Database Seeder</h1>
      <p style={{ color: "#666", marginBottom: 24 }}>Klik op de knoppen om de database te vullen met content.</p>

      <button
        onClick={runAll}
        disabled={loading !== null}
        style={{
          width: "100%", padding: "12px 20px", marginBottom: 24,
          background: loading ? "#ccc" : "#7c3aed", color: "white",
          border: "none", borderRadius: 8, fontSize: 16, cursor: loading ? "wait" : "pointer",
        }}
      >
        Alles in een keer uitvoeren
      </button>

      {steps.map((step) => {
        const result = results[step.endpoint]
        return (
          <div key={step.endpoint} style={{ marginBottom: 16, padding: 16, border: "1px solid #e5e7eb", borderRadius: 8 }}>
            <h3 style={{ margin: "0 0 4px 0", fontSize: 16 }}>{step.label}</h3>
            <p style={{ margin: "0 0 12px 0", color: "#666", fontSize: 14 }}>{step.description}</p>
            <button
              onClick={() => runSeed(step.endpoint)}
              disabled={loading !== null}
              style={{
                padding: "8px 16px",
                background: result?.status === "success" ? "#16a34a" : loading === step.endpoint ? "#ccc" : "#2563eb",
                color: "white", border: "none", borderRadius: 6, fontSize: 14,
                cursor: loading ? "wait" : "pointer",
              }}
            >
              {loading === step.endpoint ? "Bezig..." : result?.status === "success" ? "Klaar!" : "Uitvoeren"}
            </button>
            {result?.data && (
              <pre style={{ marginTop: 8, padding: 8, background: "#f3f4f6", borderRadius: 4, fontSize: 12, overflow: "auto" }}>
                {JSON.stringify(result.data, null, 2)}
              </pre>
            )}
          </div>
        )
      })}

      <p style={{ marginTop: 24, color: "#ef4444", fontSize: 13 }}>
        Verwijder deze pagina na gebruik! (src/app/seed/page.tsx)
      </p>
    </div>
  )
}
