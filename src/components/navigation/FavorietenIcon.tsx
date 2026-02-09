"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"

export function FavorietenIcon() {
  const [count, setCount] = useState(0)
  const hasFetched = useRef(false)

  useEffect(() => {
    if (hasFetched.current) return
    hasFetched.current = true

    const fetchCount = async () => {
      try {
        const res = await fetch("/api/favorieten/count")
        if (res.ok) {
          const data = await res.json()
          setCount(data.count || 0)
        }
      } catch (error) {
        // Silently fail
      }
    }

    fetchCount()
  }, [])

  return (
    <Link
      href="/favorieten"
      className="relative p-2 rounded-full hover:bg-secondary transition-colors"
      aria-label="Mijn favorieten"
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
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-primary text-primary-foreground text-[11px] font-bold rounded-full flex items-center justify-center">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  )
}
