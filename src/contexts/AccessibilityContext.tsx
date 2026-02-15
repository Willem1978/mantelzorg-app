"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from "react"

interface AccessibilityContextType {
  highContrast: boolean
  toggleHighContrast: () => void
  largeText: boolean
  toggleLargeText: () => void
  reduceMotion: boolean
  toggleReduceMotion: () => void
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined)

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [highContrast, setHighContrast] = useState(false)
  const [largeText, setLargeText] = useState(false)
  const [reduceMotion, setReduceMotion] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const hc = localStorage.getItem("highContrast") === "true"
    const lt = localStorage.getItem("largeText") === "true"
    const rm = localStorage.getItem("reduceMotion") === "true"
    setHighContrast(hc)
    setLargeText(lt)
    setReduceMotion(rm)
  }, [])

  useEffect(() => {
    if (!mounted) return
    const root = document.documentElement
    root.classList.toggle("high-contrast", highContrast)
    localStorage.setItem("highContrast", String(highContrast))
  }, [highContrast, mounted])

  useEffect(() => {
    if (!mounted) return
    const root = document.documentElement
    root.classList.toggle("text-xl-mode", largeText)
    localStorage.setItem("largeText", String(largeText))
  }, [largeText, mounted])

  useEffect(() => {
    if (!mounted) return
    const root = document.documentElement
    root.classList.toggle("reduce-motion", reduceMotion)
    localStorage.setItem("reduceMotion", String(reduceMotion))
  }, [reduceMotion, mounted])

  const toggleHighContrast = () => setHighContrast(prev => !prev)
  const toggleLargeText = () => setLargeText(prev => !prev)
  const toggleReduceMotion = () => setReduceMotion(prev => !prev)

  if (!mounted) return null

  return (
    <AccessibilityContext.Provider value={{
      highContrast, toggleHighContrast,
      largeText, toggleLargeText,
      reduceMotion, toggleReduceMotion,
    }}>
      {children}
    </AccessibilityContext.Provider>
  )
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext)
  if (!context) {
    throw new Error("useAccessibility must be used within an AccessibilityProvider")
  }
  return context
}
