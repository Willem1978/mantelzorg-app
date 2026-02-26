"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from "react"

type SiteSettings = Record<string, string>

const SiteSettingsContext = createContext<SiteSettings>({})

// Mapping van SiteSettings sleutels naar CSS variabelen
const CSS_VAR_MAP: Record<string, string> = {
  "kleuren.primary": "--primary",
  "kleuren.primaryLight": "--primary-light",
  "kleuren.background": "--background",
  "kleuren.scoreLaag": "--accent-green",
  "kleuren.scoreGemiddeld": "--accent-amber",
  "kleuren.scoreHoog": "--accent-red",
}

/**
 * Injecteer kleuren uit SiteSettings als CSS custom properties op <html>.
 * Zo werken alle Tailwind/KER classes automatisch met de admin-kleuren.
 */
function applyCssVariables(settings: SiteSettings) {
  const root = document.documentElement
  for (const [key, cssVar] of Object.entries(CSS_VAR_MAP)) {
    const value = settings[key]
    if (value) {
      root.style.setProperty(cssVar, value)
      // Ring kleur mee-updaten met primary
      if (cssVar === "--primary") {
        root.style.setProperty("--ring", value)
      }
    }
  }
}

/**
 * Provider die site-instellingen laadt uit de database.
 * Wrap je app hiermee om overal toegang te hebben tot de instellingen.
 * Past kleuren automatisch toe als CSS variabelen.
 */
export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>({})

  useEffect(() => {
    fetch("/api/site-settings")
      .then((res) => res.json())
      .then((data) => {
        setSettings(data)
        applyCssVariables(data)
      })
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
 * Hook om alle site-instellingen op te halen als key-value map.
 * Gebruik dit voor componenten die meerdere instellingen nodig hebben.
 */
export function useSiteSettings(): SiteSettings {
  return useContext(SiteSettingsContext)
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
