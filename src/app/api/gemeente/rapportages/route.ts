import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getGemeenteSession, K_ANONIMITEIT_MINIMUM } from "@/lib/gemeente-auth"

// GET: Genereer een CSV-rapportage met geanonimiseerde data
export async function GET(request: Request) {
  const { error, gemeenteNaam, userId } = await getGemeenteSession()
  if (error) return error

  const { searchParams } = new URL(request.url)
  const format = searchParams.get("format") || "json"

  try {
    // Tel mantelzorgers
    const totalCaregivers = await prisma.caregiver.count({
      where: {
        OR: [
          { municipality: { equals: gemeenteNaam, mode: "insensitive" } },
          { careRecipientMunicipality: { equals: gemeenteNaam, mode: "insensitive" } },
        ],
      },
    })

    if (totalCaregivers < K_ANONIMITEIT_MINIMUM) {
      return NextResponse.json({
        kAnonimiteit: true,
        bericht: `Onvoldoende gebruikers voor rapportage (minimaal ${K_ANONIMITEIT_MINIMUM}).`,
      })
    }

    // Haal alle voltooide tests op
    const tests = await prisma.belastbaarheidTest.findMany({
      where: {
        isCompleted: true,
        gemeente: { equals: gemeenteNaam, mode: "insensitive" },
      },
      select: {
        totaleBelastingScore: true,
        belastingNiveau: true,
        totaleZorguren: true,
        completedAt: true,
      },
      orderBy: { completedAt: "desc" },
    })

    // Alarmen
    const alarmen = await prisma.alarmLog.groupBy({
      by: ["type"],
      _count: true,
      where: {
        test: { gemeente: { equals: gemeenteNaam, mode: "insensitive" } },
      },
    })

    // Audit log
    if (userId) {
      await prisma.auditLog.create({
        data: {
          userId,
          actie: "EXPORT",
          entiteit: "Rapportage",
          details: { format, gemeente: gemeenteNaam },
        },
      })
    }

    // Bouw maanddata op (gebruikt door CSV en rapport)
    const maandData = new Map<string, { count: number; scoreSum: number; uren: number; laag: number; gemiddeld: number; hoog: number }>()

    for (const test of tests) {
      const maand = test.completedAt
        ? `${test.completedAt.getFullYear()}-${String(test.completedAt.getMonth() + 1).padStart(2, "0")}`
        : "onbekend"

      const entry = maandData.get(maand) || { count: 0, scoreSum: 0, uren: 0, laag: 0, gemiddeld: 0, hoog: 0 }
      entry.count++
      entry.scoreSum += test.totaleBelastingScore
      entry.uren += test.totaleZorguren
      if (test.belastingNiveau === "LAAG") entry.laag++
      else if (test.belastingNiveau === "GEMIDDELD") entry.gemiddeld++
      else entry.hoog++
      maandData.set(maand, entry)
    }

    const gesorteerd = Array.from(maandData.entries()).sort(([a], [b]) => a.localeCompare(b))

    if (format === "csv") {
      const csvHeaders = "Maand,Aantal Tests,Gemiddelde Score,Niveau Laag,Niveau Gemiddeld,Niveau Hoog,Gem. Zorguren"
      const csvRows = gesorteerd
        .map(([maand, d]) => `${maand},${d.count},${(d.scoreSum / d.count).toFixed(1)},${d.laag},${d.gemiddeld},${d.hoog},${(d.uren / d.count).toFixed(0)}`)

      const csv = [csvHeaders, ...csvRows].join("\n")

      return new Response(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="mantelbuddy-${gemeenteNaam}-rapportage.csv"`,
        },
      })
    }

    if (format === "rapport") {
      // Genereer een downloadbaar HTML-rapport
      const niveauLaag = tests.filter(t => t.belastingNiveau === "LAAG").length
      const niveauGemiddeld = tests.filter(t => t.belastingNiveau === "GEMIDDELD").length
      const niveauHoog = tests.filter(t => t.belastingNiveau === "HOOG").length
      const gemScore = tests.length > 0
        ? (tests.reduce((s, t) => s + t.totaleBelastingScore, 0) / tests.length).toFixed(1)
        : "0"
      const gemUren = tests.length > 0
        ? Math.round(tests.reduce((s, t) => s + t.totaleZorguren, 0) / tests.length)
        : 0
      const datum = new Date().toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" })

      const html = `<!DOCTYPE html>
<html lang="nl">
<head>
<meta charset="UTF-8">
<title>MantelBuddy Rapportage - ${gemeenteNaam}</title>
<style>
  :root { --primary: #2C7A7B; }
  body { font-family: 'Montserrat', 'Open Sans', 'Segoe UI', Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px 20px; color: #2D3748; }
  h1 { color: var(--primary); border-bottom: 3px solid var(--primary); padding-bottom: 12px; }
  h2 { color: var(--primary); margin-top: 32px; }
  .meta { color: #4A5568; font-size: 14px; margin-bottom: 24px; }
  .kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin: 24px 0; }
  .kpi { background: color-mix(in srgb, var(--primary) 10%, white); border: 1px solid color-mix(in srgb, var(--primary) 30%, white); border-radius: 12px; padding: 20px; text-align: center; }
  .kpi .value { font-size: 32px; font-weight: bold; color: var(--primary); }
  .kpi .label { font-size: 13px; color: #6b7280; margin-top: 4px; }
  table { width: 100%; border-collapse: collapse; margin: 16px 0; }
  th { background: #f9fafb; text-align: left; padding: 10px 12px; border-bottom: 2px solid #e5e7eb; font-size: 13px; color: #6b7280; text-transform: uppercase; }
  td { padding: 10px 12px; border-bottom: 1px solid #f3f4f6; font-size: 14px; }
  tr:hover td { background: #f9fafb; }
  .niveau-bar { display: flex; height: 24px; border-radius: 12px; overflow: hidden; margin: 8px 0; }
  .niveau-laag { background: #22c55e; }
  .niveau-gemiddeld { background: #f59e0b; }
  .niveau-hoog { background: #ef4444; }
  .legend { display: flex; gap: 24px; font-size: 13px; color: #6b7280; }
  .legend-dot { width: 12px; height: 12px; border-radius: 50%; display: inline-block; margin-right: 6px; vertical-align: middle; }
  .footer { margin-top: 48px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af; text-align: center; }
  .alarmen-list { list-style: none; padding: 0; }
  .alarmen-list li { padding: 8px 12px; background: #fef3c7; border-radius: 8px; margin-bottom: 8px; font-size: 14px; }
  @media print { body { padding: 20px; } .kpi-grid { grid-template-columns: repeat(3, 1fr); } }
</style>
</head>
<body>
<h1>MantelBuddy Rapportage</h1>
<p class="meta">Gemeente <strong>${gemeenteNaam}</strong> &middot; Gegenereerd op ${datum}</p>

<h2>Kerncijfers</h2>
<div class="kpi-grid">
  <div class="kpi"><div class="value">${totalCaregivers}</div><div class="label">Mantelzorgers</div></div>
  <div class="kpi"><div class="value">${tests.length}</div><div class="label">Voltooide tests</div></div>
  <div class="kpi"><div class="value">${gemScore}</div><div class="label">Gem. belastingscore</div></div>
</div>
<div class="kpi-grid">
  <div class="kpi"><div class="value">${gemUren}</div><div class="label">Gem. zorguren/week</div></div>
  <div class="kpi"><div class="value">${alarmen.reduce((s, a) => s + a._count, 0)}</div><div class="label">Totaal alarmen</div></div>
  <div class="kpi"><div class="value">${niveauHoog}</div><div class="label">Hoge belasting</div></div>
</div>

<h2>Belastingniveau verdeling</h2>
${tests.length > 0 ? `
<div class="niveau-bar">
  <div class="niveau-laag" style="width:${(niveauLaag / tests.length * 100).toFixed(0)}%"></div>
  <div class="niveau-gemiddeld" style="width:${(niveauGemiddeld / tests.length * 100).toFixed(0)}%"></div>
  <div class="niveau-hoog" style="width:${(niveauHoog / tests.length * 100).toFixed(0)}%"></div>
</div>
<div class="legend">
  <span><span class="legend-dot" style="background:#22c55e"></span>Laag: ${niveauLaag} (${(niveauLaag / tests.length * 100).toFixed(0)}%)</span>
  <span><span class="legend-dot" style="background:#f59e0b"></span>Gemiddeld: ${niveauGemiddeld} (${(niveauGemiddeld / tests.length * 100).toFixed(0)}%)</span>
  <span><span class="legend-dot" style="background:#ef4444"></span>Hoog: ${niveauHoog} (${(niveauHoog / tests.length * 100).toFixed(0)}%)</span>
</div>` : `<p>Geen testgegevens beschikbaar.</p>`}

<h2>Maandelijks overzicht</h2>
<table>
  <thead><tr><th>Maand</th><th>Tests</th><th>Gem. score</th><th>Laag</th><th>Gemiddeld</th><th>Hoog</th><th>Gem. uren</th></tr></thead>
  <tbody>
${gesorteerd.map(([maand, d]) => `    <tr><td>${maand}</td><td>${d.count}</td><td>${(d.scoreSum / d.count).toFixed(1)}</td><td>${d.laag}</td><td>${d.gemiddeld}</td><td>${d.hoog}</td><td>${(d.uren / d.count).toFixed(0)}</td></tr>`).join("\n")}
  </tbody>
</table>

${alarmen.length > 0 ? `
<h2>Alarmen per type</h2>
<ul class="alarmen-list">
${alarmen.map(a => `  <li><strong>${a.type.replace(/_/g, " ")}</strong>: ${a._count} keer</li>`).join("\n")}
</ul>` : ""}

<div class="footer">
  <p>Dit rapport is gegenereerd door MantelBuddy. Alle gegevens zijn geanonimiseerd en voldoen aan k-anonimiteitseisen (min. ${K_ANONIMITEIT_MINIMUM} gebruikers).</p>
  <p>&copy; ${new Date().getFullYear()} MantelBuddy</p>
</div>
</body>
</html>`

      return new Response(html, {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Content-Disposition": `attachment; filename="mantelbuddy-${gemeenteNaam}-rapportage.html"`,
        },
      })
    }

    // JSON format
    return NextResponse.json({
      gemeenteNaam,
      periode: "Alle beschikbare data",
      totaalTests: tests.length,
      totaalMantelzorgers: totalCaregivers,
      niveauVerdeling: {
        laag: tests.filter(t => t.belastingNiveau === "LAAG").length,
        gemiddeld: tests.filter(t => t.belastingNiveau === "GEMIDDELD").length,
        hoog: tests.filter(t => t.belastingNiveau === "HOOG").length,
      },
      alarmen: alarmen.map(a => ({ type: a.type, aantal: a._count })),
    })
  } catch (err) {
    console.error("Rapportage error:", err)
    return NextResponse.json({ error: "Interne fout" }, { status: 500 })
  }
}
