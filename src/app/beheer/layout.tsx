"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { useState } from "react"
import { LogoIcon } from "@/components/ui"

// Gegroepeerd menu — vereenvoudigd naar 5 hoofdgroepen (Masterplan 2.0 v2)
const menuGroepen: { label: string; items: { href: string; label: string; icon: string }[] }[] = [
  {
    label: "Dashboard",
    items: [
      { href: "/beheer", label: "Overzicht", icon: "📊" },
      { href: "/beheer/analytics", label: "Analytics & Signalen", icon: "📈" },
    ],
  },
  {
    label: "Content",
    items: [
      { href: "/beheer/content-werkbank", label: "Content Werkbank", icon: "📋" },
      { href: "/beheer/artikelen", label: "Artikelen & Tips", icon: "📝" },
      { href: "/beheer/curator", label: "Content Curator", icon: "✍️" },
      { href: "/beheer/content-agent", label: "Content Agent", icon: "🤖" },
      { href: "/beheer/app-content", label: "App teksten", icon: "📱" },
    ],
  },
  {
    label: "Hulpbronnen",
    items: [
      { href: "/beheer/hulpbronnen", label: "Beheren", icon: "🏥" },
      { href: "/beheer/hulpbronnen/ai-zoeken", label: "AI Zoeker", icon: "🔍" },
      { href: "/beheer/hulpbronnen/validatie", label: "Validatie", icon: "✅" },
      { href: "/beheer/activiteiten", label: "Activiteiten", icon: "🎯" },
    ],
  },
  {
    label: "Gebruikers",
    items: [
      { href: "/beheer/gebruikers", label: "Gebruikers", icon: "👥" },
      { href: "/beheer/mantelbuddies", label: "MantelBuddies", icon: "🤝" },
      { href: "/beheer/alarmen", label: "Alarmen", icon: "🔔" },
      { href: "/beheer/moderatie", label: "Moderatie", icon: "🛡️" },
    ],
  },
  {
    label: "Inrichting",
    items: [
      { href: "/beheer/gemeenten", label: "Gemeenten", icon: "🏛️" },
      { href: "/beheer/balanstest-vragen", label: "Balanstest vragen", icon: "❓" },
      { href: "/beheer/zorgtaken", label: "Zorgtaken", icon: "📋" },
      { href: "/beheer/categorieen", label: "Categorieën", icon: "🗂️" },
      { href: "/beheer/formulier-opties", label: "Formulier opties", icon: "📝" },
      { href: "/beheer/huisstijl", label: "Huisstijl", icon: "🎨" },
      { href: "/beheer/instellingen", label: "Instellingen", icon: "⚙️" },
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
    <div className="min-h-screen bg-[#F8F0F5] flex flex-col">
      {/* Header */}
      <header className="bg-[#2D1B69] text-white sticky top-0 z-50">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-white/10"
              aria-label="Menu openen"
            >
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <Link href="/beheer" className="flex items-center gap-2">
              <LogoIcon size={32} />
              <span className="font-bold text-white">MantelBuddy</span>
              <span className="text-xs bg-[#E5A825] text-[#1E1533] px-2 py-0.5 rounded-full font-bold">Beheer</span>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-white/70 hidden sm:block">
              {session?.user?.email}
            </span>
            <button
              onClick={() => signOut({ callbackUrl: "/beheer/login" })}
              className="text-sm text-white/80 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/10"
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
            w-64 bg-white border-r border-[#E4D8E8]
            transform transition-transform duration-200 overflow-y-auto
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
            lg:translate-x-0 lg:mt-0 mt-[57px]
          `}
        >
          <nav className="p-4 space-y-5">
            {menuGroepen.map((groep, gi) => (
              <div key={gi}>
                {groep.label && (
                  <p className="text-[11px] font-bold text-[#5A4D6B] uppercase tracking-wider px-3 mb-1.5">
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
                            ? "bg-[#EDE8F5] text-[#2D1B69] font-bold"
                            : "text-[#5A4D6B] hover:bg-[#F8F0F5] hover:text-[#2D1B69]"
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

          <div className="sticky bottom-0 bg-white border-t border-[#E4D8E8] p-4">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 px-3 py-2 text-sm text-[#5A4D6B] hover:text-[#2D1B69] rounded-lg hover:bg-[#F8F0F5]"
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
