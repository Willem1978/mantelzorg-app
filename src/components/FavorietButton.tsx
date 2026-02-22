"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"

interface FavorietButtonProps {
  type: "HULP" | "INFORMATIE"
  itemId: string
  titel: string
  beschrijving?: string
  categorie?: string
  url?: string
  telefoon?: string
  icon?: string
  initialFavorited?: boolean
  initialFavorietId?: string
  onToggle?: (isFavorited: boolean) => void
  size?: "sm" | "md"
}

export function FavorietButton({
  type,
  itemId,
  titel,
  beschrijving,
  categorie,
  url,
  telefoon,
  icon,
  initialFavorited = false,
  initialFavorietId,
  onToggle,
  size = "sm",
}: FavorietButtonProps) {
  const [isFavorited, setIsFavorited] = useState(initialFavorited)
  const [favorietId, setFavorietId] = useState(initialFavorietId)
  const [isAnimating, setIsAnimating] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (isLoading) return

    setIsLoading(true)
    setIsAnimating(true)
    setTimeout(() => setIsAnimating(false), 400)

    // Optimistic update
    const wasFavorited = isFavorited
    setIsFavorited(!wasFavorited)

    try {
      if (wasFavorited && favorietId) {
        // Verwijderen
        const res = await fetch(`/api/favorieten/${favorietId}`, {
          method: "DELETE",
        })
        if (!res.ok) throw new Error()
        setFavorietId(undefined)
      } else {
        // Toevoegen
        const res = await fetch("/api/favorieten", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type,
            itemId,
            titel,
            beschrijving,
            categorie,
            url,
            telefoon,
            icon,
          }),
        })
        if (!res.ok) throw new Error()
        const data = await res.json()
        setFavorietId(data?.favoriet?.id)
      }

      onToggle?.(!wasFavorited)
      // Update navbar badge
      window.dispatchEvent(new Event("favorieten-updated"))
    } catch (error) {
      console.error("Fout bij favorieten toggle:", error)
      setIsFavorited(wasFavorited)
    } finally {
      setIsLoading(false)
    }
  }

  const sizeClasses = size === "sm"
    ? "w-10 h-10 min-w-[40px]"
    : "w-12 h-12 min-w-[48px]"

  const iconSize = size === "sm" ? "w-5 h-5" : "w-6 h-6"

  return (
    <button
      onClick={handleToggle}
      disabled={isLoading}
      className={cn(
        "flex items-center justify-center rounded-full transition-all",
        "hover:bg-primary/10 active:scale-95",
        sizeClasses,
        isAnimating && "animate-heart-bounce",
      )}
      aria-label={isFavorited ? "Verwijderen uit favorieten" : "Toevoegen aan favorieten"}
      title={isFavorited ? "Verwijderen uit favorieten" : "Bewaar als favoriet"}
    >
      <svg
        className={cn(
          iconSize,
          "transition-colors duration-200",
          isFavorited ? "text-primary fill-primary" : "text-muted-foreground",
        )}
        fill={isFavorited ? "currentColor" : "none"}
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
    </button>
  )
}
