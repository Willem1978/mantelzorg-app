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
