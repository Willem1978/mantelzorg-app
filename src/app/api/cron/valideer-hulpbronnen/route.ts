/**
 * GET /api/cron/valideer-hulpbronnen — Wekelijkse validatie van hulpbronnen.
 * Bedoeld voor Vercel Cron (elke maandag).
 *
 * Beveiligd via CRON_SECRET header.
 *
 * Controleert alle actieve zorgorganisaties:
 * - Website bereikbaar?
 * - Telefoon geldig NL-nummer?
 * - Status: GELDIG / WAARSCHUWING / ONGELDIG / ONBEKEND
 *
 * Resultaten worden opgeslagen in HulpbronValidatie tabel.
 */
import { valideerAlleHulpbronnen } from "@/lib/ai/agents/hulpbronnen-validator"

export const dynamic = "force-dynamic"
export const maxDuration = 300 // 5 minuten max

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return new Response(JSON.stringify({ error: "Niet geautoriseerd" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    })
  }

  try {
    const samenvatting = await valideerAlleHulpbronnen()

    return new Response(
      JSON.stringify({
        succes: true,
        samenvatting: {
          totaal: samenvatting.totaal,
          geldig: samenvatting.geldig,
          waarschuwing: samenvatting.waarschuwing,
          ongeldig: samenvatting.ongeldig,
          onbekend: samenvatting.onbekend,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    )
  } catch (e) {
    const bericht = e instanceof Error ? e.message : "Onbekende fout"
    console.error("Hulpbronnen validatie cron fout:", e)

    return new Response(
      JSON.stringify({ succes: false, fout: bericht }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}
