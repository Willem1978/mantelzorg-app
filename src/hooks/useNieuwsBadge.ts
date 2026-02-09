"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { gemeenteNieuws } from "@/data/artikelen"

/**
 * Hook die het aantal ongelezen gemeente-nieuwsitems berekent.
 * Gebruikt door Navbar en MobileNav voor de badge op het Informatie tabblad.
 */
export function useNieuwsBadge() {
  const [count, setCount] = useState(0)
  const hasFetched = useRef(false)
  const gemeenteRef = useRef<{ mantelzorger: string | null; zorgvrager: string | null }>({
    mantelzorger: null,
    zorgvrager: null,
  })

  const berekenCount = useCallback(() => {
    const { mantelzorger, zorgvrager } = gemeenteRef.current
    if (!mantelzorger && !zorgvrager) {
      setCount(0)
      return
    }

    const relevant = gemeenteNieuws.filter(n => {
      const g = n.gemeente.toLowerCase()
      return (
        (mantelzorger && g === mantelzorger.toLowerCase()) ||
        (zorgvrager && g === zorgvrager.toLowerCase())
      )
    })

    if (relevant.length === 0) {
      setCount(0)
      return
    }

    try {
      const gelezenRaw = localStorage.getItem("gemeente-nieuws-gelezen")
      if (!gelezenRaw) {
        setCount(relevant.length)
        return
      }
      const gelezen = JSON.parse(gelezenRaw) as string[]
      setCount(relevant.filter(n => !gelezen.includes(n.id)).length)
    } catch {
      setCount(relevant.length)
    }
  }, [])

  // Haal gemeente data op bij eerste mount
  useEffect(() => {
    if (hasFetched.current) return
    hasFetched.current = true

    const loadGemeente = async () => {
      try {
        const res = await fetch("/api/user/gemeente").catch(() => null)
        if (res?.ok) {
          const data = await res.json()
          gemeenteRef.current = {
            mantelzorger: data.mantelzorger || null,
            zorgvrager: data.zorgvrager || null,
          }
          berekenCount()
        }
      } catch {
        // Silently fail
      }
    }

    loadGemeente()
  }, [berekenCount])

  // Luister naar gelezen-event van gemeente-nieuws pagina
  useEffect(() => {
    const handleGelezen = () => berekenCount()
    window.addEventListener("gemeente-nieuws-gelezen", handleGelezen)
    return () => window.removeEventListener("gemeente-nieuws-gelezen", handleGelezen)
  }, [berekenCount])

  return count
}
