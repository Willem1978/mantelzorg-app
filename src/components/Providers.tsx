"use client"

import { SessionProvider } from "next-auth/react"
import { ToastProvider } from "@/components/ui/Toast"
import { SiteSettingsProvider } from "@/lib/site-settings"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ToastProvider>
        <SiteSettingsProvider>{children}</SiteSettingsProvider>
      </ToastProvider>
    </SessionProvider>
  )
}
