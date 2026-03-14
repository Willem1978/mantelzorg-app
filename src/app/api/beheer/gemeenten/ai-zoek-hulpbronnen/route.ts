/**
 * POST /api/beheer/gemeenten/ai-zoek-hulpbronnen
 *
 * Start de AI Hulpbronnen Zoeker voor een gemeente.
 * Retourneert een SSE stream met voortgang + eindresultaat.
 *
 * Request body: { gemeente: string }
 * Response: Server-Sent Events stream
 *
 * Events:
 * - voortgang: { fase, stap, percentage, resultaten }
 * - resultaat: GevondenHulpbron[]
 * - fout: { bericht: string }
 */
import { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { zoekHulpbronnenVoorGemeente } from "@/lib/ai/agents/hulpbronnen-zoeker"

export const dynamic = "force-dynamic"
export const maxDuration = 300 // 5 minuten — 15 categorieën × ~15s per stuk

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return new Response(JSON.stringify({ error: "Niet geautoriseerd" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    })
  }

  const { gemeente } = await request.json()

  if (!gemeente || typeof gemeente !== "string" || gemeente.length < 2) {
    return new Response(JSON.stringify({ error: "Gemeente is verplicht" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    })
  }

  // SSE stream opzetten
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (event: string, data: unknown) => {
        const json = JSON.stringify(data)
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${json}\n\n`))
      }

      try {
        const resultaten = await zoekHulpbronnenVoorGemeente(
          gemeente,
          (voortgang) => {
            sendEvent("voortgang", voortgang)
          },
        )

        sendEvent("resultaat", {
          gemeente,
          resultaten,
          totaal: resultaten.length,
        })
      } catch (e) {
        const bericht = e instanceof Error ? e.message : "Onbekende fout"
        sendEvent("fout", { bericht })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  })
}
