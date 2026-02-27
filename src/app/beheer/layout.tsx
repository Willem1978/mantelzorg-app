"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { useState } from "react"
import { LogoIcon } from "@/components/ui"

// Gegroepeerd menu — logische indeling voor beheerders
const menuGroepen: { label: string; items: { href: string; label: string; icon: string }[] }[] = [
  {
    label: "",
    items: [
      { href: "/beheer", label: "Dashboard", icon: "📊" },
    ],
  },
  {
    label: "Gebruikers & Hulp",
    items: [
      { href: "/beheer/gebruikers", label: "Gebruikers", icon: "👥" },
      { href: "/beheer/mantelbuddies", label: "MantelBuddies", icon: "🤝" },
      { href: "/beheer/alarmen", label: "Alarmen", icon: "🔔" },
    ],
  },
  {
    label: "Content",
    items: [
      { href: "/beheer/artikelen", label: "Artikelen & Tips", icon: "📝" },
      { href: "/beheer/hulpbronnen", label: "Hulpbronnen", icon: "🏥" },
      { href: "/beheer/app-content", label: "App content", icon: "📱" },
    ],
  },
  {
    label: "Test & Vragen",
    items: [
      { href: "/beheer/balanstest-vragen", label: "Balanstest & Check-in", icon: "❓" },
      { href: "/beheer/zorgtaken", label: "Zorgtaken", icon: "📋" },
      { href: "/beheer/coach-adviezen", label: "Coach adviezen", icon: "🤖" },
      { href: "/beheer/intake-vragen", label: "Intake vragen", icon: "📥" },
    ],
  },
  {
    label: "Inrichting",
    items: [
      { href: "/beheer/gemeenten", label: "Gemeenten", icon: "🏛️" },
      { href: "/beheer/huisstijl", label: "Huisstijl & Teksten", icon: "🎨" },
      { href: "/beheer/categorieen", label: "Categorieën", icon: "🗂️" },
      { href: "/beheer/formulier-opties", label: "Formulier opties", icon: "📝" },
    ],
  },
  {
    label: "Systeem",
    items: [
      { href: "/beheer/audit", label: "Audit Log", icon: "📋" },
      { href: "/beheer/data-update", label: "Data bijwerken", icon: "🔄" },
      { href: "/beheer/instellingen", label: "Instellingen", icon: "⚙️" },
      { href: "/beheer/handleiding", label: "Handleiding", icon: "📖" },
    ],
  },
]

// Platte lijst voor active-check
const alleItems = menuGroepen.flatMap((g) => g.items)

export default function BeheerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Login pagina heeft geen sidebar
  if (pathname === "/beheer/login") {
    return <>{children}</>
  }

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
            <Link href="/beheer" className="flex items-center gap-2">
              <LogoIcon size={32} />
              <span className="font-semibold text-gray-900">MantelBuddy</span>
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">Beheer</span>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500 hidden sm:block">
              {session?.user?.email}
            </span>
            <button
              onClick={() => signOut({ callbackUrl: "/beheer/login" })}
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
            transform transition-transform duration-200 overflow-y-auto
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
            lg:translate-x-0 lg:mt-0 mt-[57px]
          `}
        >
          <nav className="p-4 space-y-4">
            {menuGroepen.map((groep, gi) => (
              <div key={gi}>
                {groep.label && (
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-3 mb-1">
                    {groep.label}
                  </p>
                )}
                <div className="space-y-0.5">
                  {groep.items.map((item) => {
                    const isActive = item.href === "/beheer"
                      ? pathname === "/beheer"
                      : pathname.startsWith(item.href)

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setSidebarOpen(false)}
                        className={`
                          flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium
                          transition-colors
                          ${isActive
                            ? "bg-blue-50 text-blue-700"
                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                          }
                        `}
                      >
                        <span className="text-base">{item.icon}</span>
                        {item.label}
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}
          </nav>

          <div className="sticky bottom-0 bg-white border-t border-gray-100 p-4">
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
