"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState, useRef } from "react"
import { cn } from "@/lib/utils"

// 3-pilaren navigatie: Home, Ger, Aanbod + Profiel-icoon
const navItems: { href: string; label: string; icon: React.ReactNode; matchPaths?: string[] }[] = [
  {
    href: "/dashboard",
    label: "Home",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
    matchPaths: ["/dashboard", "/check-in", "/rapport", "/progressie", "/balanstest"],
  },
  {
    href: "/ai-assistent",
    label: "Ger",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
    matchPaths: ["/ai-assistent", "/zoeken"],
  },
  {
    href: "/aanbod",
    label: "Aanbod",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
    matchPaths: ["/aanbod", "/hulpvragen", "/leren", "/buddys", "/activiteiten", "/favorieten"],
  },
]

export function MobileNav() {
  const pathname = usePathname()
  const [unreadCount, setUnreadCount] = useState(0)
  const hasFetched = useRef(false)

  useEffect(() => {
    if (hasFetched.current) return
    hasFetched.current = true

    const fetchNotificationCount = async () => {
      try {
        const res = await fetch("/api/notifications")
        if (res.ok) {
          const data = await res.json()
          const unread = (data.notifications || []).filter((n: { isRead: boolean }) => !n.isRead).length
          setUnreadCount(unread)
        }
      } catch {
        // Silently fail
      }
    }

    fetchNotificationCount()
  }, [])

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border md:hidden safe-area-inset-bottom">
      <div className="flex justify-around items-center h-20 px-1">
        {navItems.map((item) => {
          const isActive = item.matchPaths
            ? item.matchPaths.some(p => pathname === p || pathname.startsWith(p + "/"))
            : (pathname === item.href || pathname.startsWith(item.href + "/"))

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
                "transition-transform duration-200",
                isActive && "scale-110"
              )}>
                {item.icon}
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

        {/* Profiel-icoon */}
        <Link
          href="/profiel"
          className={cn(
            "flex flex-col items-center justify-center py-3 px-4 rounded-xl transition-all min-w-[64px] min-h-[56px] relative",
            (pathname === "/profiel" || pathname.startsWith("/profiel/") || pathname === "/agenda" || pathname === "/notificaties")
              ? "text-primary bg-primary/10"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
          )}
        >
          <span className={cn(
            "transition-transform duration-200 relative",
            (pathname === "/profiel" || pathname.startsWith("/profiel/")) && "scale-110"
          )}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </span>
          <span className={cn(
            "text-xs mt-1 font-medium",
            (pathname === "/profiel" || pathname.startsWith("/profiel/")) && "font-semibold"
          )}>
            Profiel
          </span>
        </Link>
      </div>
    </nav>
  )
}
