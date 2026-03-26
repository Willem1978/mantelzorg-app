import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.caregiverId) {
      return new NextResponse("Niet ingelogd", { status: 401 })
    }

    const caregiverId = session.user.caregiverId

    // Fetch all data in parallel
    const [caregiver, tests, artikelenGelezen, favorietenCount] =
      await Promise.all([
        prisma.caregiver.findUnique({
          where: { id: caregiverId },
          include: {
            user: { select: { name: true, email: true } },
          },
        }),
        prisma.belastbaarheidTest.findMany({
          where: { caregiverId },
          orderBy: { createdAt: "desc" },
          take: 5,
          select: {
            totaleBelastingScore: true,
            belastingNiveau: true,
            totaleZorguren: true,
            createdAt: true,
          },
        }),
        prisma.artikelInteractie.count({
          where: { caregiverId, gelezen: true },
        }),
        prisma.favoriet.count({
          where: { caregiverId },
        }),
      ])

    const naam = caregiver?.user?.name || "Mantelzorger"
    const datum = new Date().toLocaleDateString("nl-NL", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })

    const niveauKleur = (niveau: string) => {
      switch (niveau) {
        case "LAAG":
          return "#22c55e"
        case "GEMIDDELD":
          return "#f59e0b"
        case "HOOG":
          return "#ef4444"
        default:
          return "#6b7280"
      }
    }

    const niveauLabel = (niveau: string) => {
      switch (niveau) {
        case "LAAG":
          return "Laag"
        case "GEMIDDELD":
          return "Gemiddeld"
        case "HOOG":
          return "Hoog"
        default:
          return niveau
      }
    }

    const testRijen = tests
      .map(
        (t) => `
        <tr>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb;">
            ${t.createdAt.toLocaleDateString("nl-NL", { year: "numeric", month: "short", day: "numeric" })}
          </td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb;">
            ${t.totaleBelastingScore}
          </td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb;">
            <span style="color: ${niveauKleur(t.belastingNiveau)}; font-weight: 600;">
              ${niveauLabel(t.belastingNiveau)}
            </span>
          </td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb;">
            ${t.totaleZorguren} uur/week
          </td>
        </tr>`
      )
      .join("")

    const html = `<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MantelBuddy Rapport - ${naam}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #1a1a2e;
      line-height: 1.6;
      padding: 40px;
      max-width: 800px;
      margin: 0 auto;
    }
    @media print {
      body { padding: 20px; }
      .no-print { display: none; }
    }
    .header {
      text-align: center;
      margin-bottom: 32px;
      padding-bottom: 24px;
      border-bottom: 3px solid #6366f1;
    }
    .header h1 { color: #6366f1; font-size: 28px; margin-bottom: 4px; }
    .header p { color: #6b7280; font-size: 14px; }
    .section { margin-bottom: 28px; }
    .section h2 {
      font-size: 18px;
      color: #1a1a2e;
      margin-bottom: 12px;
      padding-bottom: 6px;
      border-bottom: 1px solid #e5e7eb;
    }
    table { width: 100%; border-collapse: collapse; font-size: 14px; }
    th {
      text-align: left;
      padding: 8px 12px;
      background: #f3f4f6;
      font-weight: 600;
      border-bottom: 2px solid #e5e7eb;
    }
    .stat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .stat-card {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 16px;
      text-align: center;
    }
    .stat-card .value { font-size: 24px; font-weight: 700; color: #6366f1; }
    .stat-card .label { font-size: 13px; color: #6b7280; margin-top: 4px; }
    .footer {
      margin-top: 40px;
      padding-top: 16px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      font-size: 12px;
      color: #9ca3af;
    }
    .print-btn {
      display: inline-block;
      background: #6366f1;
      color: white;
      border: none;
      padding: 10px 24px;
      border-radius: 8px;
      font-size: 14px;
      cursor: pointer;
      margin-bottom: 24px;
    }
    .print-btn:hover { background: #4f46e5; }
  </style>
</head>
<body>
  <div class="no-print" style="text-align: center;">
    <button class="print-btn" onclick="window.print()">
      Opslaan als PDF / Afdrukken
    </button>
  </div>

  <div class="header">
    <h1>MantelBuddy</h1>
    <p>Persoonlijk rapport voor ${naam} &mdash; ${datum}</p>
  </div>

  <div class="section">
    <h2>Overzicht</h2>
    <div class="stat-grid">
      <div class="stat-card">
        <div class="value">${tests.length}</div>
        <div class="label">Balanstesten afgenomen</div>
      </div>
      <div class="stat-card">
        <div class="value">${artikelenGelezen}</div>
        <div class="label">Artikelen gelezen</div>
      </div>
      <div class="stat-card">
        <div class="value">${favorietenCount}</div>
        <div class="label">Hulpbronnen bewaard</div>
      </div>
      <div class="stat-card">
        <div class="value">${caregiver?.careHoursPerWeek ?? "—"}</div>
        <div class="label">Zorguren per week</div>
      </div>
    </div>
  </div>

  ${
    tests.length > 0
      ? `
  <div class="section">
    <h2>Balanstest trend (laatste ${tests.length})</h2>
    <table>
      <thead>
        <tr>
          <th>Datum</th>
          <th>Score</th>
          <th>Niveau</th>
          <th>Zorguren</th>
        </tr>
      </thead>
      <tbody>
        ${testRijen}
      </tbody>
    </table>
  </div>`
      : `
  <div class="section">
    <h2>Balanstest</h2>
    <p style="color: #6b7280;">Nog geen balanstesten afgenomen.</p>
  </div>`
  }

  <div class="section">
    <h2>Profielgegevens</h2>
    <table>
      <tbody>
        <tr>
          <td style="padding: 6px 12px; font-weight: 600; width: 200px;">Naam</td>
          <td style="padding: 6px 12px;">${naam}</td>
        </tr>
        <tr>
          <td style="padding: 6px 12px; font-weight: 600;">Woonplaats</td>
          <td style="padding: 6px 12px;">${caregiver?.city || "—"}</td>
        </tr>
        <tr>
          <td style="padding: 6px 12px; font-weight: 600;">Gemeente</td>
          <td style="padding: 6px 12px;">${caregiver?.municipality || "—"}</td>
        </tr>
        <tr>
          <td style="padding: 6px 12px; font-weight: 600;">Zorgt voor</td>
          <td style="padding: 6px 12px;">${caregiver?.careRecipientName || caregiver?.careRecipient || "—"}</td>
        </tr>
        <tr>
          <td style="padding: 6px 12px; font-weight: 600;">Mantelzorger sinds</td>
          <td style="padding: 6px 12px;">${caregiver?.careSince ? caregiver.careSince.toLocaleDateString("nl-NL", { year: "numeric", month: "long" }) : "—"}</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="footer">
    <p>Dit rapport is gegenereerd door MantelBuddy op ${datum}.</p>
    <p>Neem dit rapport mee naar een keukentafelgesprek of huisarts.</p>
  </div>
</body>
</html>`

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    })
  } catch (error) {
    console.error("Export rapport error:", error)
    return new NextResponse("Er ging iets mis bij het genereren van het rapport", {
      status: 500,
    })
  }
}
