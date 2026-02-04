"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { NotificationBell } from "@/components/navigation/NotificationBell"
import { ThemeToggle } from "@/components/navigation/ThemeToggle"

interface NavbarProps {
  userRole?: "CAREGIVER" | "ORG_MEMBER" | "ORG_ADMIN" | "ADMIN"
  userName?: string
}

export function Navbar({ userRole = "CAREGIVER", userName }: NavbarProps) {
  const pathname = usePathname()

  // B1 taalgebruik - simpele menu woorden
  const caregiverLinks = [
    { href: "/dashboard", label: "Home" },
    { href: "/agenda", label: "Agenda" },
    { href: "/hulpvragen", label: "Hulp" },
    { href: "/check-in", label: "Hoe gaat het?" },
  ]

  const orgLinks = [
    { href: "/organisatie", label: "Home" },
    { href: "/organisatie/mantelzorgers", label: "Mensen" },
    { href: "/organisatie/rapportage", label: "Cijfers" },
  ]

  const links = userRole === "CAREGIVER" ? caregiverLinks : orgLinks

  return (
    <nav className="bg-card border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-14 sm:h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">M</span>
              </div>
              <span className="font-semibold text-foreground text-base sm:text-lg hidden sm:block">
                MantelzorgApp
              </span>
            </Link>

            {/* Desktop navigatie */}
            <div className="hidden md:flex ml-8 lg:ml-10 space-x-1">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "px-3 lg:px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                    pathname === link.href
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-1 sm:space-x-2">
            {userName && (
              <span className="text-sm text-muted-foreground hidden lg:block">
                Hoi <span className="font-medium text-foreground">{userName}</span>
              </span>
            )}
            <ThemeToggle />
            <NotificationBell />
            <Link
              href="/profiel"
              className="p-2 rounded-full hover:bg-secondary transition-colors"
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
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
