"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { gemeenteNieuws } from "@/data/artikelen"

/**
 * Hook die het aantal ongelezen gemeente-nieuwsitems berekent.
 * Leest gezien-status uit de database.
 * Gebruikt door Navbar en MobileNav voor de badge op het Informatie tabblad.
 */
export function useNieuwsBadge() {
  const [count, setCount] = useState(0)
  const hasFetched = useRef(false)
  const gemeenteRef = useRef<{ mantelzorger: string | null; zorgvrager: string | null }>({
    mantelzorger: null,
    zorgvrager: null,
  })
  const gelezenRef = useRef<string[]>([])

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

    const gelezen = gelezenRef.current
    setCount(relevant.filter(n => !gelezen.includes(n.id)).length)
  }, [])

  // Haal gemeente data + gelezen IDs op bij eerste mount
  useEffect(() => {
    if (hasFetched.current) return
    hasFetched.current = true

    const loadData = async () => {
      try {
        const [gemeenteRes, gelezenRes] = await Promise.all([
          fetch("/api/user/gemeente").catch(() => null),
          fetch("/api/user/gelezen-nieuws").catch(() => null),
        ])

        if (gemeenteRes?.ok) {
          const data = await gemeenteRes.json()
          gemeenteRef.current = {
            mantelzorger: data.mantelzorger || null,
            zorgvrager: data.zorgvrager || null,
          }
        }

        if (gelezenRes?.ok) {
          const data = await gelezenRes.json()
          if (Array.isArray(data.gelezenIds)) {
            gelezenRef.current = data.gelezenIds
          }
        }

        berekenCount()
      } catch {
        // Silently fail
      }
    }

    loadData()
  }, [berekenCount])

  // Luister naar gezien-event van gemeente-nieuws pagina
  // Bij event: haal verse data op uit database
  useEffect(() => {
    const handleGezien = async () => {
      try {
        const res = await fetch("/api/user/gelezen-nieuws").catch(() => null)
        if (res?.ok) {
          const data = await res.json()
          if (Array.isArray(data.gelezenIds)) {
            gelezenRef.current = data.gelezenIds
          }
        }
      } catch {
        // Silently fail
      }
      berekenCount()
    }
    window.addEventListener("gemeente-nieuws-gelezen", handleGezien)
    return () => window.removeEventListener("gemeente-nieuws-gelezen", handleGezien)
  }, [berekenCount])

  return count
}
