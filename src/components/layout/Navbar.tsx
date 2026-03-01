"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState, useRef } from "react"
import { cn } from "@/lib/utils"
import { FavorietenIcon } from "@/components/navigation/FavorietenIcon"
import { useNieuwsBadge } from "@/hooks/useNieuwsBadge"
import { LogoIcon } from "@/components/ui"

interface NavbarProps {
  userRole?: "CAREGIVER" | "ORG_MEMBER" | "ORG_ADMIN" | "ADMIN"
  userName?: string
}

export function Navbar({ userRole = "CAREGIVER", userName }: NavbarProps) {
  const pathname = usePathname()
  const [zwareTakenCount, setZwareTakenCount] = useState(0)
  const nieuwsCount = useNieuwsBadge()
  const hasFetched = useRef(false)
  const [profielOpen, setProfielOpen] = useState(false)
  const profielRef = useRef<HTMLDivElement>(null)
  const [unreadCount, setUnreadCount] = useState(0)

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
      } catch (error) {
        // Silently fail
      }
    }

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

    fetchBadgeCount()
    fetchNotificationCount()
  }, [])

  // Sluit profiel-dropdown bij klik buiten
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profielRef.current && !profielRef.current.contains(event.target as Node)) {
        setProfielOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Sluit bij navigatie
  useEffect(() => {
    setProfielOpen(false)
  }, [pathname])

  const caregiverLinks: { href: string; label: string; hasBadge: boolean; nieuwsBadge?: boolean; matchPaths?: string[] }[] = [
    { href: "/dashboard", label: "Home", hasBadge: false },
    { href: "/leren", label: "Info & Tips", hasBadge: false },
    { href: "/hulpvragen", label: "Hulp", hasBadge: false },
    { href: "/buddys", label: "Mantelbuddy's", hasBadge: true, matchPaths: ["/buddys", "/marktplaats"] },
    { href: "/check-in", label: "Balanstest & Check-In", hasBadge: false, matchPaths: ["/check-in", "/belastbaarheidstest"] },
  ]

  const orgLinks: { href: string; label: string; hasBadge: boolean; nieuwsBadge?: boolean; matchPaths?: string[] }[] = [
    { href: "/organisatie", label: "Home", hasBadge: false },
    { href: "/organisatie/mantelzorgers", label: "Mensen", hasBadge: false },
    { href: "/organisatie/rapportage", label: "Cijfers", hasBadge: false },
  ]

  const links = userRole === "CAREGIVER" ? caregiverLinks : orgLinks

  return (
    <nav className="bg-card border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-14 sm:h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <LogoIcon size={44} />
            </Link>

            {/* Desktop navigatie */}
            <div className="hidden md:flex ml-6 lg:ml-8 gap-1">
              {links.map((link) => {
                const showHulpBadge = link.hasBadge && zwareTakenCount > 0
                const showNieuwsBadge = link.nieuwsBadge && nieuwsCount > 0
                const isActive = link.matchPaths
                  ? link.matchPaths.some(p => pathname === p || pathname.startsWith(p + "/"))
                  : (pathname === link.href || pathname.startsWith(link.href + "/"))
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "whitespace-nowrap px-3 lg:px-4 py-2 rounded-lg text-sm font-medium transition-colors relative",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    )}
                  >
                    {link.label}
                    {showHulpBadge && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-[var(--accent-amber)] text-white text-xs font-bold rounded-full flex items-center justify-center">
                        {zwareTakenCount}
                      </span>
                    )}
                    {showNieuwsBadge && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-[var(--accent-red)] text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                        {nieuwsCount}
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>
          </div>

          <div className="flex items-center space-x-1 sm:space-x-2">
            <FavorietenIcon />
            {/* Profiel dropdown met meldingen */}
            <div className="relative" ref={profielRef}>
              <button
                onClick={() => setProfielOpen(!profielOpen)}
                className="relative p-2 rounded-full hover:bg-secondary transition-colors"
                aria-label="Mijn profiel"
              >
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6 text-foreground"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
              {profielOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-card rounded-xl border border-border shadow-xl z-50">
                  <div className="p-1.5">
                    <Link
                      href="/profiel"
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-secondary transition-colors"
                    >
                      <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span className="text-sm font-medium text-foreground">Mijn profiel</span>
                    </Link>
                    <Link
                      href="/notificaties"
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-secondary transition-colors"
                    >
                      <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                      <span className="text-sm font-medium text-foreground">Meldingen</span>
                      {unreadCount > 0 && (
                        <span className="ml-auto w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                      )}
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
