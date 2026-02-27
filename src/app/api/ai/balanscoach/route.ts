/**
 * Balanstest Coach API endpoint.
 *
 * Wordt aangeroepen NA afronding van de balanstest.
 * - Interpreteert scores en geeft persoonlijk advies
 * - Koppelt aan relevante Zorgorganisaties op basis van gemeente + belastingniveau
 * - Genereert een samenvatting voor het BelastbaarheidRapport
 *
 * De response is een streaming AI-response (toUIMessageStreamResponse).
 */
import { createAnthropic } from "@ai-sdk/anthropic"
import { streamText, stepCountIs } from "ai"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { buildBalanscoachPrompt } from "@/lib/ai/prompts/balanscoach"
import {
  createBekijkBalanstestTool,
  createZoekHulpbronnenTool,
  createZoekArtikelenTool,
  createGenereerRapportSamenvattingTool,
} from "@/lib/ai/tools"

const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response(
      JSON.stringify({ error: "AI is niet beschikbaar." }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    )
  }

  const session = await auth()
  if (!session?.user?.id) {
    return new Response("Niet ingelogd", { status: 401 })
  }

  const body = await req.json()
  const rawMessages = body.messages

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const messages = rawMessages.map((msg: any) => {
    if (msg.content !== undefined) {
      return { role: msg.role, content: msg.content }
    }
    if (msg.parts) {
      const text = msg.parts
        .filter((p: { type: string }) => p.type === "text")
        .map((p: { type: string; text?: string }) => p.text || "")
        .join("")
      return { role: msg.role, content: text }
    }
    return { role: msg.role, content: "" }
  })

  const caregiver = await prisma.caregiver.findUnique({
    where: { userId: session.user.id },
    select: { municipality: true, city: true },
  })

  const gemeente = caregiver?.municipality || caregiver?.city || null
  const userId = session.user.id

  try {
    const result = streamText({
      model: anthropic("claude-sonnet-4-20250514"),
      system: buildBalanscoachPrompt(gemeente),
      messages,
      maxOutputTokens: 1500,
      stopWhen: stepCountIs(5),
      tools: {
        bekijkBalanstest: createBekijkBalanstestTool({ userId, gemeente }),
        zoekHulpbronnen: createZoekHulpbronnenTool({ gemeente }),
        zoekArtikelen: createZoekArtikelenTool(),
        genereerRapportSamenvatting: createGenereerRapportSamenvattingTool({ userId }),
      },
    })

    return result.toUIMessageStreamResponse()
  } catch (error) {
    console.error("[Balanscoach] Fout:", error)
    const message = error instanceof Error ? error.message : "Onbekende fout"
    return new Response(
      JSON.stringify({ error: `Balanscoach fout: ${message}` }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}
