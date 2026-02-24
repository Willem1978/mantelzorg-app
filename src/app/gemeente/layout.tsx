"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { useEffect, useMemo, useState } from "react"
import { AdminSpinner } from "@/components/admin"

// Mapping van menu-items naar vereiste gemeente subrollen
// Items zonder 'rollen' zijn altijd zichtbaar voor de hoofdadmin
const alleMenuItems = [
  { href: "/gemeente", label: "Dashboard", icon: "📊", exact: true, rollen: ["BELEID"] },
  { href: "/gemeente/demografie", label: "Demografie", icon: "👥", rollen: ["BELEID"] },
  { href: "/gemeente/trends", label: "Trends", icon: "📈", rollen: ["BELEID"] },
  { href: "/gemeente/hulpvragen", label: "Hulpvragen", icon: "🤝", rollen: ["BELEID"] },
  { href: "/gemeente/alarmen", label: "Signalering", icon: "🔔", rollen: ["BELEID"] },
  { href: "/gemeente/rapportages", label: "Rapportages", icon: "📄", rollen: ["BELEID"] },
  { href: "/gemeente/content", label: "Content", icon: "📝", rollen: ["COMMUNICATIE"] },
  { href: "/gemeente/hulpbronnen", label: "Hulpbronnen", icon: "📚", rollen: ["HULPBRONNEN"] },
  { href: "/gemeente/evenementen", label: "Evenementen", icon: "📅", rollen: ["COMMUNICATIE"] },
  { href: "/gemeente/gebruikers", label: "Gebruikers", icon: "👤", rollen: [] },
]

export default function GemeenteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const { data: session, status } = useSession()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [redirecting, setRedirecting] = useState(false)

  const userRole = (session?.user as any)?.role

  // Client-side auth redirect als fallback (via useEffect om render loop te voorkomen)
  useEffect(() => {
    if (pathname === "/gemeente/login") return

    if (status === "unauthenticated") {
      setRedirecting(true)
      window.location.href = `/gemeente/login?callbackUrl=${encodeURIComponent(pathname)}`
    } else if (status === "authenticated" && userRole !== "GEMEENTE_ADMIN" && userRole !== "ADMIN") {
      setRedirecting(true)
      window.location.href = "/gemeente/login"
    }
  }, [status, userRole, pathname])

  // Login pagina heeft geen sidebar
  if (pathname === "/gemeente/login") {
    return <>{children}</>
  }

  // Wacht tot sessie geladen is
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <AdminSpinner tekst="Portaal laden..." />
      </div>
    )
  }

  // Redirect is bezig
  if (redirecting || status === "unauthenticated") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <AdminSpinner tekst="Doorsturen naar login..." />
      </div>
    )
  }

  // Rolcontrole
  if (userRole !== "GEMEENTE_ADMIN" && userRole !== "ADMIN") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-md">
          <h2 className="text-lg font-bold text-gray-900 mb-2">Geen toegang</h2>
          <p className="text-gray-500 text-sm mb-4">Je hebt geen toegang tot het gemeenteportaal.</p>
          <a href="/gemeente/login" className="text-primary hover:underline text-sm font-medium">
            Inloggen met een ander account
          </a>
        </div>
      </div>
    )
  }

  const gemeenteNaam = (session?.user as any)?.gemeenteNaam || "Gemeente"
  const gemeenteRollen: string[] = Array.isArray((session?.user as any)?.gemeenteRollen)
    ? (session?.user as any).gemeenteRollen
    : []

  // Hoofdadmin (geen subrollen of ADMIN) ziet alles, anders filteren op rollen
  const isHoofdAdmin = userRole === "ADMIN" || gemeenteRollen.length === 0
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const menuItems = isHoofdAdmin
    ? alleMenuItems
    : alleMenuItems.filter((item) =>
        item.rollen.length === 0 || item.rollen.some((r) => gemeenteRollen.includes(r))
      )

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
              aria-label="Menu openen"
            >
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <Link href="/gemeente" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">M</span>
              </div>
              <span className="font-semibold text-gray-900">MantelBuddy</span>
              <span className="text-xs bg-primary-light text-primary px-2 py-0.5 rounded-full font-medium">
                {gemeenteNaam}
              </span>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500 hidden sm:block">
              {session?.user?.email}
            </span>
            <button
              onClick={() => signOut({ callbackUrl: "/gemeente/login" })}
              className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-100"
            >
              Uitloggen
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar overlay voor mobiel */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/30 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`
            fixed lg:static inset-y-0 left-0 z-50 lg:z-0
            w-64 bg-white border-r border-gray-200
            transform transition-transform duration-200
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
            lg:translate-x-0 lg:mt-0 mt-[57px]
          `}
        >
          <nav className="p-4 space-y-1">
            {menuItems.map((item) => {
              const isActive = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href)

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                    transition-colors
                    ${isActive
                      ? "bg-primary-light text-primary"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }
                  `}
                >
                  <span className="text-lg">{item.icon}</span>
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <div className="absolute bottom-4 left-4 right-4">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-50"
            >
              <span>←</span>
              Terug naar app
            </Link>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
