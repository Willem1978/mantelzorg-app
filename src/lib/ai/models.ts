/**
 * AI Model Configuratie — Centraal beheer van welk model per agent draait.
 *
 * Kostenbesparing door model-tiering:
 *   Haiku 4.5:  $0.80/$4.00 per 1M tokens — standaard voor chat, welkom, weekkaarten
 *   Sonnet 4:   $3.00/$15.00 per 1M tokens — voor coaching, check-in analyse
 *   Opus 4:     $15.00/$75.00 per 1M tokens — alleen voor crisis-detectie (toekomst)
 *
 * Door Haiku als standaard te gebruiken bespaar je 80-95% op AI-kosten.
 */

import { createAnthropic } from "@ai-sdk/anthropic"

// Singleton Anthropic client
let _client: ReturnType<typeof createAnthropic> | null = null

export function getAnthropicClient() {
  if (!_client) {
    _client = createAnthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    })
  }
  return _client
}

// ============================================
// MODEL TIERING
// ============================================

export const AI_MODELS = {
  // Goedkoopste — standaard voor alle chat en eenvoudige taken
  HAIKU: "claude-haiku-4-5-20251001",

  // Medium — voor coaching, check-in analyse, complexere gesprekken
  SONNET: "claude-sonnet-4-20250514",

  // Duurste — alleen voor crisis-detectie en zeer complexe analyses
  OPUS: "claude-opus-4-20250514",
} as const

/**
 * Model-toewijzing per AI-agent.
 * Wijzig hier welk model elke agent gebruikt.
 */
export const AGENT_MODELS = {
  // User-facing chat agents — Haiku (goedkoop, snel)
  "ger-chat": AI_MODELS.HAIKU,
  "ger-welkom": AI_MODELS.HAIKU,
  "ger-balanscoach": AI_MODELS.HAIKU,
  "ger-checkin": AI_MODELS.HAIKU,

  // Admin agents — Haiku (bulk operaties, kosten beperken)
  "admin-bulk-tag": AI_MODELS.HAIKU,
  "admin-tag-suggestie": AI_MODELS.HAIKU,
  "admin-moderate": AI_MODELS.HAIKU,

  // Admin agents — Sonnet (complexere analyses)
  "admin-curator": AI_MODELS.SONNET,
  "admin-analytics": AI_MODELS.SONNET,
  "admin-content-agent": AI_MODELS.SONNET,
} as const

export type AgentName = keyof typeof AGENT_MODELS

/**
 * Haal het model op voor een specifieke agent.
 * Gebruik: getModelForAgent("ger-chat")
 */
export function getModelForAgent(agent: AgentName) {
  const client = getAnthropicClient()
  const modelId = AGENT_MODELS[agent]
  return client(modelId)
}
