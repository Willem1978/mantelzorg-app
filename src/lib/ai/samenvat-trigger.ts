/**
 * Helper voor het opslaan van een gesprek-samenvatting aan het eind
 * van een chat-sessie. Gebruikt navigator.sendBeacon zodat de request
 * betrouwbaar overleeft als de gebruiker de tab sluit of naar een
 * andere pagina navigeert. Valt terug op fetch met keepalive wanneer
 * sendBeacon niet beschikbaar is (oudere browsers).
 *
 * Faalt stil — de gebruiker hoeft hier niets van te merken. Logt naar
 * console voor debugging: check DevTools → Console voor
 * "[SamenvatTrigger]" berichten om te verifiëren dat de save gestart is.
 */
export interface SamenvatMessage {
  role: string
  content: string
}

export function triggerSamenvat(messages: SamenvatMessage[]): void {
  if (typeof window === "undefined") return

  const echteBerichten = messages.filter(
    (m) => m.content.trim() !== "" && !m.content.startsWith("[pagina:"),
  )

  if (echteBerichten.length < 4) {
    // eslint-disable-next-line no-console
    console.log(
      `[SamenvatTrigger] Skip — te weinig echte berichten (${echteBerichten.length}/4).`,
    )
    return
  }

  const body = JSON.stringify({ messages: echteBerichten })
  const url = "/api/ai/samenvat"

  // sendBeacon is expliciet ontworpen voor "opslaan-bij-verlaten" en
  // overleeft page-close waar fetch (zelfs met keepalive) soms
  // gecancelled wordt.
  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: "application/json" })
      const success = navigator.sendBeacon(url, blob)
      // eslint-disable-next-line no-console
      console.log(
        `[SamenvatTrigger] sendBeacon → ${success ? "verstuurd" : "MISLUKT"} (${echteBerichten.length} berichten)`,
      )
      if (success) return
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("[SamenvatTrigger] sendBeacon exception, fallback naar fetch:", err)
  }

  // Fallback: fetch met keepalive
  try {
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    })
      .then(() => {
        // eslint-disable-next-line no-console
        console.log(`[SamenvatTrigger] fetch fallback verstuurd (${echteBerichten.length} berichten)`)
      })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.warn("[SamenvatTrigger] fetch fallback mislukt:", err)
      })
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("[SamenvatTrigger] fetch exception:", err)
  }
}
