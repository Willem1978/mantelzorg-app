/**
 * Lichtgewicht telemetrie voor AI-route-aanroepen.
 *
 * Doel: kosten, latency en tool-gebruik in productie kunnen monitoren
 * zonder dat we content van gesprekken hoeven op te slaan.
 *
 * Schrijven gebeurt fire-and-forget — een trage of falende
 * telemetry-write mag de chat zelf nooit blokkeren.
 */
import { prisma } from "@/lib/prisma"

export type InteractieStatus = "ok" | "error" | "rate-limited" | "auth-error"

export interface InteractieData {
  userId: string | null
  route: string
  model?: string | null
  pagina?: string | null
  durationMs: number
  toolsCalled?: string[]
  toolsFailed?: string[]
  inputTokens?: number | null
  outputTokens?: number | null
  status: InteractieStatus
  errorBericht?: string | null
}

/**
 * Log een AI-interactie. Werkt fire-and-forget: het returned een
 * Promise die je niet hoeft te `await`-en. Eventuele errors worden
 * stil naar console gelogd zodat ze monitoring of debugging niet
 * verstoren.
 */
export function logAiInteractie(data: InteractieData): Promise<void> {
  return prisma.aiInteractie
    .create({
      data: {
        userId: data.userId,
        route: data.route,
        model: data.model ?? null,
        pagina: data.pagina ?? null,
        durationMs: Math.max(0, Math.round(data.durationMs)),
        toolsCalled: data.toolsCalled ?? [],
        toolsFailed: data.toolsFailed ?? [],
        inputTokens: data.inputTokens ?? null,
        outputTokens: data.outputTokens ?? null,
        status: data.status,
        errorBericht: data.errorBericht?.slice(0, 500) ?? null,
      },
    })
    .then(() => undefined)
    .catch((err) => {
      // Telemetrie-fout mag chat niet blokkeren. Wel loggen voor monitoring.
      console.error("[Telemetrie] Schrijven mislukt:", err instanceof Error ? err.message : err)
    })
}
