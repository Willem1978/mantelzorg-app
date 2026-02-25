"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from "react"

type SiteSettings = Record<string, string>

const SiteSettingsContext = createContext<SiteSettings>({})

/**
 * Provider die site-instellingen laadt uit de database.
 * Wrap je app hiermee om overal toegang te hebben tot de instellingen.
 */
export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>({})

  useEffect(() => {
    fetch("/api/site-settings")
      .then((res) => res.json())
      .then((data) => setSettings(data))
      .catch(() => {
        // Gebruik defaults als de API niet beschikbaar is
      })
  }, [])

  return (
    <SiteSettingsContext.Provider value={settings}>
      {children}
    </SiteSettingsContext.Provider>
  )
}

/**
 * Hook om een site-instelling op te halen met fallback naar default.
 *
 * @example
 * const appName = useSiteSetting("branding.appName", "MantelBuddy")
 * const primary = useSiteSetting("kleuren.primary", "#2C7A7B")
 */
export function useSiteSetting(key: string, defaultValue: string = ""): string {
  const settings = useContext(SiteSettingsContext)
  return settings[key] || defaultValue
}

/**
 * Hook om het custom logo op te halen (base64 of leeg).
 */
export function useSiteLogo(): string | null {
  const logo = useSiteSetting("branding.logo")
  return logo || null
}
