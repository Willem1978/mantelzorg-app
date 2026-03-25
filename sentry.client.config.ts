import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance monitoring
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Replay: vang sessies op bij errors (geen PII)
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: process.env.NODE_ENV === "production" ? 0.5 : 0,

  // Alleen inschakelen als DSN geconfigureerd is
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Geen PII versturen
  sendDefaultPii: false,

  environment: process.env.NODE_ENV || "development",

  // Scrub PII
  beforeSend(event) {
    if (event.user) {
      delete event.user.ip_address
      delete event.user.email
    }
    return event
  },
})
