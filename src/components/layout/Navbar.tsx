"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState, useRef } from "react"
import { cn } from "@/lib/utils"
import { LogoIcon } from "@/components/ui"

interface NavbarProps {
  userRole?: "CAREGIVER" | "ORG_MEMBER" | "ORG_ADMIN" | "ADMIN"
  userName?: string
}

export function Navbar({ userRole = "CAREGIVER", userName }: NavbarProps) {
  const pathname = usePathname()
  const [profielOpen, setProfielOpen] = useState(false)
  const profielRef = useRef<HTMLDivElement>(null)
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

  // 3-pilaren navigatie voor mantelzorgers
  const caregiverLinks: { href: string; label: string; matchPaths?: string[] }[] = [
    { href: "/dashboard", label: "Home", matchPaths: ["/dashboard", "/check-in", "/rapport", "/progressie", "/balanstest"] },
    { href: "/ai-assistent", label: "Ger", matchPaths: ["/ai-assistent", "/zoeken"] },
    { href: "/aanbod", label: "Aanbod", matchPaths: ["/aanbod", "/hulpvragen", "/leren", "/buddys", "/activiteiten", "/favorieten"] },
  ]

  const orgLinks: { href: string; label: string; matchPaths?: string[] }[] = [
    { href: "/organisatie", label: "Home" },
    { href: "/organisatie/mantelzorgers", label: "Mensen" },
    { href: "/organisatie/rapportage", label: "Cijfers" },
  ]

  const links = userRole === "CAREGIVER" ? caregiverLinks : orgLinks

  return (
    <nav className="bg-card border-b border-border sticky top-0 z-50 shadow-sm" aria-label="Hoofdnavigatie">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-14 sm:h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <LogoIcon size={44} />
            </Link>

            {/* Desktop navigatie — 3 pilaren */}
            <div className="hidden md:flex ml-6 lg:ml-8 gap-1">
              {links.map((link) => {
                const isActive = link.matchPaths
                  ? link.matchPaths.some(p => pathname === p || pathname.startsWith(p + "/"))
                  : (pathname === link.href || pathname.startsWith(link.href + "/"))
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "whitespace-nowrap px-4 lg:px-5 py-2 rounded-lg text-sm font-medium transition-colors relative",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    )}
                  >
                    {link.label}
                  </Link>
                )
              })}
            </div>
          </div>

          <div className="flex items-center space-x-1 sm:space-x-2">
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
                    <Link
                      href="/agenda"
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-secondary transition-colors"
                    >
                      <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm font-medium text-foreground">Agenda</span>
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
