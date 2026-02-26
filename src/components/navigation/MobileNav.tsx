"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState, useRef } from "react"
import { cn } from "@/lib/utils"
import { useNieuwsBadge } from "@/hooks/useNieuwsBadge"

// B1 taalgebruik - simpele, duidelijke woorden
const navItems: { href: string; label: string; icon: React.ReactNode; hasBadge?: boolean; nieuwsBadge?: boolean }[] = [
  {
    href: "/dashboard",
    label: "Home",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    href: "/hulpvragen",
    label: "Hulp",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
    hasBadge: true,
  },
  {
    href: "/marktplaats",
    label: "Marktplaats",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  {
    href: "/check-in",
    label: "Check-in",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    href: "/leren",
    label: "Info & tips",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
]

export function MobileNav() {
  const pathname = usePathname()
  const [zwareTakenCount, setZwareTakenCount] = useState(0)
  const nieuwsCount = useNieuwsBadge()
  const hasFetched = useRef(false)

  useEffect(() => {
    // Alleen ophalen bij eerste mount, niet bij elke route change
    if (hasFetched.current) return
    hasFetched.current = true

    const fetchBadgeCount = async () => {
      try {
        // Gebruik lichtgewicht endpoint
        const res = await fetch("/api/nav-badge")
        if (res.ok) {
          const data = await res.json()
          setZwareTakenCount(data.count || 0)
        }
      } catch (error) {
        // Silently fail
      }
    }

    fetchBadgeCount()
  }, [])

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border md:hidden safe-area-inset-bottom">
      {/* Verhoogd naar h-20 (80px) voor betere touch targets */}
      <div className="flex justify-around items-center h-20 px-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
          const showHulpBadge = item.hasBadge && zwareTakenCount > 0
          const showNieuwsBadge = item.nieuwsBadge && nieuwsCount > 0

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                // Vergroot touch area: min 48x48px, nu 64px breed
                "flex flex-col items-center justify-center py-3 px-4 rounded-xl transition-all min-w-[64px] min-h-[56px] relative",
                isActive
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              )}
            >
              <span className={cn(
                "transition-transform duration-200 relative",
                isActive && "scale-110"
              )}>
                {item.icon}
                {showHulpBadge && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-[var(--accent-amber)] text-white text-[11px] font-bold rounded-full flex items-center justify-center">
                    {zwareTakenCount}
                  </span>
                )}
                {showNieuwsBadge && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-[var(--accent-red)] text-white text-[11px] font-bold rounded-full flex items-center justify-center animate-pulse">
                    {nieuwsCount}
                  </span>
                )}
              </span>
              <span className={cn(
                "text-xs mt-1 font-medium",
                isActive && "font-semibold"
              )}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
