"use client"

import { useState, useEffect, useRef } from "react"
import { cn } from "@/lib/utils"

export interface AddressInfo {
  straat: string
  woonplaats: string
  gemeente: string
}

interface AddressSearchProps {
  value?: AddressInfo | null
  onChange: (address: AddressInfo | null) => void
  placeholder?: string
  label?: string
  error?: string
  disabled?: boolean
}

interface Suggestion {
  weergavenaam: string
  straat: string
  huisnummer: string
  woonplaats: string
  gemeente: string
}

export function AddressSearch({
  value,
  onChange,
  placeholder = "Typ je straat of postcode",
  label,
  error,
  disabled = false,
}: AddressSearchProps) {
  const [query, setQuery] = useState("")
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [selectedDisplay, setSelectedDisplay] = useState("")
  const wrapperRef = useRef<HTMLDivElement>(null)

  // Set display value when value changes
  useEffect(() => {
    if (value) {
      setSelectedDisplay(`${value.straat}, ${value.woonplaats}`)
    } else {
      setSelectedDisplay("")
    }
  }, [value])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Search addresses
  useEffect(() => {
    const searchAddresses = async () => {
      if (query.length < 3) {
        setSuggestions([])
        return
      }

      setIsLoading(true)
      try {
        const response = await fetch(`/api/location/address-search?q=${encodeURIComponent(query)}`)
        if (response.ok) {
          const data = await response.json()
          setSuggestions(data.addresses || [])
        }
      } catch (error) {
        console.error("Search error:", error)
        setSuggestions([])
      } finally {
        setIsLoading(false)
      }
    }

    const debounce = setTimeout(searchAddresses, 300)
    return () => clearTimeout(debounce)
  }, [query])

  const handleSelect = (suggestion: Suggestion) => {
    onChange({
      straat: suggestion.straat,
      woonplaats: suggestion.woonplaats,
      gemeente: suggestion.gemeente,
    })
    setSelectedDisplay(`${suggestion.straat}, ${suggestion.woonplaats}`)
    setIsOpen(false)
    setQuery("")
  }

  const handleClear = () => {
    onChange(null)
    setSelectedDisplay("")
    setQuery("")
  }

  return (
    <div ref={wrapperRef} className="relative w-full">
      {label && (
        <label className="block text-sm font-medium text-foreground mb-2">
          {label}
        </label>
      )}

      {/* Selected value display */}
      {selectedDisplay && !isOpen ? (
        <div className="flex items-center justify-between w-full px-4 py-3 bg-teal-50 border-2 border-teal-200 rounded-xl">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-teal-900 font-medium">{selectedDisplay}</span>
          </div>
          <button
            type="button"
            onClick={handleClear}
            disabled={disabled}
            className="text-teal-600 hover:text-teal-800 disabled:opacity-50"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ) : (
        /* Search input */
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setIsOpen(true)
            }}
            onFocus={() => setIsOpen(true)}
            placeholder={placeholder}
            disabled={disabled}
            className={cn(
              "ker-input",
              error && "border-red-500"
            )}
          />
          {isLoading && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <svg className="animate-spin h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
          )}
        </div>
      )}

      {/* Suggestions dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSelect(suggestion)}
              className="w-full px-4 py-3 text-left hover:bg-teal-50 transition-colors first:rounded-t-xl last:rounded-b-xl"
            >
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                <span className="text-gray-900">{suggestion.weergavenaam}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No results message */}
      {isOpen && query.length >= 3 && !isLoading && suggestions.length === 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg p-4 text-center text-gray-500">
          Geen adressen gevonden
        </div>
      )}

      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  )
}
