import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance monitoring: sample 10% van transacties in productie
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Alleen inschakelen als DSN geconfigureerd is
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Geen PII versturen (AVG-compliance)
  sendDefaultPii: false,

  // Environment tag
  environment: process.env.NODE_ENV || "development",

  // Voorkom dat gezondheidsdata in breadcrumbs terechtkomen
  beforeBreadcrumb(breadcrumb) {
    // Filter URL's die PII kunnen bevatten
    if (breadcrumb.category === "fetch" || breadcrumb.category === "xhr") {
      const url = breadcrumb.data?.url || ""
      if (url.includes("/api/profile") || url.includes("/api/user/")) {
        breadcrumb.data = { ...breadcrumb.data, url: "[FILTERED]" }
      }
    }
    return breadcrumb
  },

  // Scrub PII uit error data
  beforeSend(event) {
    // Verwijder user IP
    if (event.user) {
      delete event.user.ip_address
      delete event.user.email
    }
    return event
  },
})
