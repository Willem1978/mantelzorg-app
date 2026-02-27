/**
 * Check-in Buddy API endpoint.
 *
 * Wordt aangeroepen na de maandelijkse check-in.
 * - Voert een empathisch gesprek over hoe het gaat
 * - Detecteert alarmsignalen (EMOTIONELE_NOOD, SOCIAAL_ISOLEMENT, etc.)
 * - Stelt proactief hulpbronnen voor
 * - Schrijft AlarmLog bij kritieke signalen
 *
 * Het eerste bericht bevat de check-in antwoorden als context.
 */
import { createAnthropic } from "@ai-sdk/anthropic"
import { streamText, stepCountIs } from "ai"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { buildCheckinBuddyPrompt } from "@/lib/ai/prompts/checkin-buddy"
import {
  createBekijkBalanstestTool,
  createBekijkCheckInTrendTool,
  createZoekHulpbronnenTool,
  createZoekArtikelenTool,
  createRegistreerAlarmTool,
} from "@/lib/ai/tools"

// Vercel serverless function timeout: AI tool calls + DB queries need more than default 10s
export const maxDuration = 30

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
      system: buildCheckinBuddyPrompt(gemeente),
      messages,
      maxOutputTokens: 1000,
      stopWhen: stepCountIs(5),
      tools: {
        bekijkBalanstest: createBekijkBalanstestTool({ userId, gemeente }),
        bekijkCheckInTrend: createBekijkCheckInTrendTool({ userId }),
        zoekHulpbronnen: createZoekHulpbronnenTool({ gemeente }),
        zoekArtikelen: createZoekArtikelenTool(),
        registreerAlarm: createRegistreerAlarmTool({ userId }),
      },
    })

    return result.toUIMessageStreamResponse()
  } catch (error) {
    console.error("[Check-in Buddy] Fout:", error)
    const message = error instanceof Error ? error.message : "Onbekende fout"
    return new Response(
      JSON.stringify({ error: `Check-in buddy fout: ${message}` }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}
