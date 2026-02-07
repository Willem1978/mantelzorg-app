"use client"

import { useEffect, useCallback } from "react"
import { signOut } from "next-auth/react"
import { useRouter } from "next/navigation"

/**
 * Hook die periodiek controleert of de sessie nog geldig is
 * Als de gebruiker op een ander apparaat inlogt, wordt deze sessie automatisch beëindigd
 */
export function useSessionValidator(intervalMs: number = 30000) {
  const router = useRouter()

  const validateSession = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/validate-session")
      const data = await response.json()

      if (!data.valid && data.reason === "session_invalidated") {
        // Toon een korte melding en log uit
        if (typeof window !== "undefined") {
          // Gebruik een simpele alert of toast
          alert("Je bent op een ander apparaat ingelogd. Je wordt nu uitgelogd.")
        }

        // Log uit zonder redirect (we doen de redirect zelf)
        await signOut({ redirect: false })

        // Redirect naar login
        router.push("/login?reason=session_invalidated")
      }
    } catch (error) {
      // Negeer netwerk fouten - we proberen het later opnieuw
      console.error("Session validation error:", error)
    }
  }, [router])

  useEffect(() => {
    // Valideer direct bij mount
    validateSession()

    // Valideer periodiek
    const interval = setInterval(validateSession, intervalMs)

    // Valideer ook bij focus (als gebruiker terugkomt naar de tab)
    const handleFocus = () => {
      validateSession()
    }

    window.addEventListener("focus", handleFocus)

    return () => {
      clearInterval(interval)
      window.removeEventListener("focus", handleFocus)
    }
  }, [validateSession, intervalMs])
}
