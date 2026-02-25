"use client"

import { branding } from "@/config/branding"
import { useEffect, useState } from "react"

interface LogoIconProps {
  size?: number
  className?: string
}

// Module-level cache: slechts 1 fetch voor alle LogoIcon instanties
let cachedLogo: string | null | undefined = undefined
let fetchPromise: Promise<string | null> | null = null

function fetchCustomLogo(): Promise<string | null> {
  if (!fetchPromise) {
    fetchPromise = fetch("/api/site-settings")
      .then((r) => (r.ok ? r.json() : {}))
      .then((data: Record<string, string>) => {
        const logo = data["branding.logo"] || null
        cachedLogo = logo
        return logo
      })
      .catch(() => {
        cachedLogo = null
        return null
      })
  }
  return fetchPromise
}

export function LogoIcon({ size = 32, className }: LogoIconProps) {
  const [customLogo, setCustomLogo] = useState<string | null>(
    cachedLogo !== undefined ? cachedLogo : null
  )

  useEffect(() => {
    if (cachedLogo !== undefined) {
      setCustomLogo(cachedLogo)
      return
    }
    fetchCustomLogo().then(setCustomLogo)
  }, [])

  // Custom logo geupload via beheer → toon als <img>
  if (customLogo) {
    return (
      <img
        src={customLogo}
        alt={branding.appName}
        width={size}
        height={size}
        className={className}
        style={{ objectFit: "contain" }}
      />
    )
  }

  // Fallback: standaard SVG logo
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 48"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
      fill="none"
    >
      {/* Left figure */}
      <circle cx="16" cy="10" r="6" fill={branding.logoColors.left}/>
      <path d="M16 16C9 22 5 33 24 46C17 37 12 27 16 16Z" fill={branding.logoColors.left}/>
      {/* Right figure */}
      <circle cx="32" cy="10" r="6" fill={branding.logoColors.right}/>
      <path d="M32 16C39 22 43 33 24 46C31 37 36 27 32 16Z" fill={branding.logoColors.right}/>
    </svg>
  )
}
