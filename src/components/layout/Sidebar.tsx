"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

interface SidebarLink {
  href: string
  label: string
  icon: React.ReactNode
}

interface SidebarProps {
  links: SidebarLink[]
}

export function Sidebar({ links }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen p-4">
      <nav className="space-y-1">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors",
              pathname === link.href
                ? "bg-primary-light text-primary"
                : "text-gray-600 hover:bg-gray-50"
            )}
          >
            {link.icon}
            <span className="font-medium">{link.label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  )
}
