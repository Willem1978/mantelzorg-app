"use client"

import Link from "next/link"

interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[]
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav className="ker-breadcrumbs" aria-label="Navigatiepad">
      {items.map((item, index) => {
        const isLast = index === items.length - 1
        return (
          <span key={index} className="flex items-center gap-2">
            {index > 0 && (
              <span className="ker-breadcrumbs-separator" aria-hidden="true">
                &rsaquo;
              </span>
            )}
            {isLast || !item.href ? (
              <span className="ker-breadcrumbs-current" aria-current="page">
                {item.label}
              </span>
            ) : (
              <Link href={item.href}>
                {item.label}
              </Link>
            )}
          </span>
        )
      })}
    </nav>
  )
}
