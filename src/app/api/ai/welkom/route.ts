import { createAnthropic } from "@ai-sdk/anthropic"
import { streamText, stepCountIs } from "ai"
import { buildWelkomPrompt } from "@/lib/ai/prompts/welkom"
import {
  createZoekHulpbronnenTool,
  createZoekArtikelenTool,
  createGemeenteInfoTool,
  createSemantischZoekenTool,
} from "@/lib/ai/tools"
import { checkRateLimit, getClientIp } from "@/lib/rate-limit"

// Vercel serverless timeout
export const maxDuration = 30

const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response(
      JSON.stringify({ error: "AI-chat is niet beschikbaar." }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    )
  }

  // Rate limiting: 20 berichten per 10 minuten per IP
  const ip = getClientIp(req)
  const rateCheck = checkRateLimit(ip, "ai-welkom", {
    maxRequests: 20,
    windowSeconds: 600,
  })

  if (!rateCheck.allowed) {
    return new Response(
      JSON.stringify({
        error: `Even rustig aan! Je kunt over ${rateCheck.resetIn} seconden weer een bericht sturen.`,
      }),
      { status: 429, headers: { "Content-Type": "application/json" } }
    )
  }

  const body = await req.json()
  const rawMessages = body.messages
  const gemeente = body.gemeente || null

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

  try {
    const result = streamText({
      model: anthropic("claude-sonnet-4-20250514"),
      system: buildWelkomPrompt(gemeente),
      messages,
      maxOutputTokens: 1500,
      stopWhen: stepCountIs(3),
      tools: {
        zoekHulpbronnen: createZoekHulpbronnenTool({ gemeente }),
        zoekArtikelen: createZoekArtikelenTool(),
        gemeenteInfo: createGemeenteInfoTool(),
        semantischZoeken: createSemantischZoekenTool(gemeente),
      },
    })

    return result.toUIMessageStreamResponse()
  } catch (error) {
    console.error("[AI Welkom] Fout:", error)
    const message = error instanceof Error ? error.message : "Onbekende fout"
    return new Response(
      JSON.stringify({ error: `Er ging iets mis: ${message}` }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}
