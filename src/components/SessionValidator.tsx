"use client"

import { useSessionValidator } from "@/hooks/useSessionValidator"

/**
 * Component die de sessie validatie hook wrapt
 * Voeg deze toe aan de dashboard layout om automatisch uit te loggen
 * als de gebruiker op een ander apparaat inlogt
 */
export function SessionValidator() {
  // Valideer elke 30 seconden en bij focus
  useSessionValidator(30000)

  // Deze component rendert niets
  return null
}
