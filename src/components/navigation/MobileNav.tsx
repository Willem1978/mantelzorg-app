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
]

// Items in het Meer-menu
const meerItems: { href: string; label: string; icon: string }[] = [
  { href: "/ai-assistent", label: "Vraag Ger", icon: "🤖" },
  { href: "/leren", label: "Info & tips", icon: "💡" },
  { href: "/agenda", label: "Agenda", icon: "📅" },
  { href: "/belastbaarheidstest", label: "Balanstest", icon: "📊" },
  { href: "/profiel", label: "Mijn profiel", icon: "👤" },
  { href: "/rapport", label: "Mijn rapport", icon: "📋" },
]

export function MobileNav() {
  const pathname = usePathname()
  const [zwareTakenCount, setZwareTakenCount] = useState(0)
  const nieuwsCount = useNieuwsBadge()
  const hasFetched = useRef(false)
  const [meerOpen, setMeerOpen] = useState(false)

  useEffect(() => {
    if (hasFetched.current) return
    hasFetched.current = true

    const fetchBadgeCount = async () => {
      try {
        const res = await fetch("/api/nav-badge")
        if (res.ok) {
          const data = await res.json()
          setZwareTakenCount(data.count || 0)
        }
      } catch {
        // Silently fail
      }
    }

    fetchBadgeCount()
  }, [])

  // Sluit Meer-menu bij navigatie
  useEffect(() => {
    setMeerOpen(false)
  }, [pathname])

  const isMeerActive = meerItems.some(
    (item) => pathname === item.href || pathname.startsWith(item.href + "/")
  )

  return (
    <>
      {/* Overlay + Meer-menu sheet */}
      {meerOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/30"
            onClick={() => setMeerOpen(false)}
          />
          <div className="fixed bottom-20 left-0 right-0 z-50 px-4 pb-2 md:hidden animate-slide-up">
            <div className="bg-card rounded-2xl border border-border shadow-xl p-3">
              <div className="grid grid-cols-3 gap-2">
                {meerItems.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all",
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-foreground hover:bg-secondary"
                      )}
                    >
                      <span className="text-2xl">{item.icon}</span>
                      <span className="text-xs font-medium">{item.label}</span>
                    </Link>
                  )
                })}
                {/* WhatsApp link */}
                <a
                  href="https://wa.me/14155238886?text=Hoi"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl text-foreground hover:bg-secondary transition-all"
                >
                  <span className="text-2xl">💬</span>
                  <span className="text-xs font-medium">WhatsApp</span>
                </a>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Bottom nav bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border md:hidden safe-area-inset-bottom">
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

          {/* Meer-knop */}
          <button
            onClick={() => setMeerOpen(!meerOpen)}
            className={cn(
              "flex flex-col items-center justify-center py-3 px-4 rounded-xl transition-all min-w-[64px] min-h-[56px]",
              meerOpen || isMeerActive
                ? "text-primary bg-primary/10"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
            )}
          >
            <svg className={cn(
              "w-6 h-6 transition-transform duration-200",
              meerOpen && "rotate-45"
            )} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span className={cn(
              "text-xs mt-1 font-medium",
              (meerOpen || isMeerActive) && "font-semibold"
            )}>
              Meer
            </span>
          </button>
        </div>
      </nav>
    </>
  )
}
