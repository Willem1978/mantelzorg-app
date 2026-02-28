"use client"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="nl">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif" }}>
        <div style={{
          minHeight: "100vh",
          backgroundColor: "#f9fafb",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1rem",
        }}>
          <div style={{
            maxWidth: "28rem",
            width: "100%",
            backgroundColor: "white",
            borderRadius: "1rem",
            boxShadow: "0 10px 15px -3px rgba(0,0,0,.1)",
            padding: "2rem",
            textAlign: "center",
          }}>
            <h1 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#111827", marginBottom: "0.5rem" }}>
              Oeps, dat lukte niet
            </h1>
            <p style={{ color: "#6b7280", fontSize: "0.875rem", marginBottom: "0.5rem" }}>
              Er ging iets fout bij het laden van de pagina. Probeer het opnieuw.
            </p>
            <p style={{ color: "#9ca3af", fontSize: "0.75rem", marginBottom: "1rem" }}>
              Lukt het niet? Sluit de app en open hem opnieuw.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "1.5rem" }}>
              <button
                onClick={reset}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  backgroundColor: "#2C7A7B",
                  color: "white",
                  border: "none",
                  borderRadius: "0.75rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  fontSize: "1rem",
                }}
              >
                Opnieuw proberen
              </button>
              <a
                href="/"
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "2px solid #e5e7eb",
                  color: "#374151",
                  borderRadius: "0.75rem",
                  fontWeight: 600,
                  textDecoration: "none",
                  display: "block",
                  boxSizing: "border-box",
                  fontSize: "1rem",
                }}
              >
                Naar homepage
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
