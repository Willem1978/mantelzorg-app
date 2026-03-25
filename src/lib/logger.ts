import pino from "pino"

/**
 * Gestructureerde logger voor MantelBuddy.
 *
 * Gebruik:
 *   import { logger } from "@/lib/logger"
 *   logger.info({ userId, action: "login" }, "Gebruiker ingelogd")
 *   logger.error({ error, route: "/api/auth" }, "Login mislukt")
 *
 * In productie: JSON-output geschikt voor Vercel/Datadog/CloudWatch.
 * In development: leesbare output met kleuren.
 */

const isProduction = process.env.NODE_ENV === "production"

export const logger = pino({
  level: process.env.LOG_LEVEL || (isProduction ? "info" : "debug"),
  ...(isProduction
    ? {
        // JSON output voor Vercel log drain
        formatters: {
          level: (label: string) => ({ level: label }),
        },
      }
    : {
        transport: {
          target: "pino/file",
          options: { destination: 1 }, // stdout
        },
      }),
})

/**
 * Maak een child logger voor een specifiek domein.
 *
 * Gebruik:
 *   const log = createLogger("auth")
 *   log.info("Login gestart")
 */
export function createLogger(domain: string) {
  return logger.child({ domain })
}

/**
 * Log een API request met gestructureerde data.
 * Gebruik aan het begin van een API route handler.
 *
 * Gebruik:
 *   const requestId = logApiRequest(request, "POST", "/api/auth/register")
 *   // ... handler logic ...
 *   logApiResponse(requestId, 200, startTime)
 */
let requestCounter = 0

export function logApiRequest(
  request: Request,
  method: string,
  route: string,
): string {
  const requestId = `req_${Date.now()}_${++requestCounter}`
  const forwarded = request.headers.get("x-forwarded-for")
  const ip = forwarded?.split(",")[0]?.trim() || "unknown"

  logger.info({
    requestId,
    method,
    route,
    ip,
    userAgent: request.headers.get("user-agent")?.substring(0, 100),
  }, `${method} ${route}`)

  return requestId
}

export function logApiResponse(
  requestId: string,
  status: number,
  startTime: number,
): void {
  const durationMs = Date.now() - startTime
  const level = status >= 500 ? "error" : status >= 400 ? "warn" : "info"

  logger[level]({
    requestId,
    status,
    durationMs,
  }, `Response ${status} (${durationMs}ms)`)
}
