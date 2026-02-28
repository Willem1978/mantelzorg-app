"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

// Leaflet types — dynamisch geladen (geen SSR)
let L: typeof import("leaflet") | null = null
let MapContainer: any = null
let TileLayer: any = null
let CircleMarker: any = null
let Popup: any = null
let useMap: any = null

export interface BuddyOpKaart {
  buddyId: string
  voornaam: string
  woonplaats: string
  hulpvormen: string[]
  beschikbaarheid: string
  vogGoedgekeurd: boolean
  matchPercentage: number
  afstandKm: number | null
  latitude: number
  longitude: number
}

interface BuddyKaartProps {
  buddys: BuddyOpKaart[]
  centrumLat?: number
  centrumLng?: number
  radiusKm: number
  onRadiusChange: (km: number) => void
  onBuddyClick?: (buddyId: string) => void
  className?: string
}

// Kleur op basis van matchpercentage
function matchKleur(pct: number): string {
  if (pct >= 75) return "#16a34a" // groen
  if (pct >= 50) return "#f59e0b" // amber
  return "#94a3b8" // grijs
}

// Resize handler component
function MapResizer({ center }: { center: [number, number] }) {
  const map = useMap?.()
  useEffect(() => {
    if (map) {
      map.invalidateSize()
      map.setView(center, map.getZoom())
    }
  }, [map, center])
  return null
}

export function BuddyKaart({
  buddys,
  centrumLat = 52.0907, // Utrecht default
  centrumLng = 5.1214,
  radiusKm,
  onRadiusChange,
  onBuddyClick,
  className,
}: BuddyKaartProps) {
  const [loaded, setLoaded] = useState(false)

  // Dynamisch laden van Leaflet (SSR-safe)
  useEffect(() => {
    async function loadLeaflet() {
      if (L) {
        setLoaded(true)
        return
      }
      const leaflet = await import("leaflet")
      const rl = await import("react-leaflet")
      L = leaflet
      MapContainer = rl.MapContainer
      TileLayer = rl.TileLayer
      CircleMarker = rl.CircleMarker
      Popup = rl.Popup
      useMap = rl.useMap

      // Fix Leaflet default icons
      leaflet.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      })

      setLoaded(true)
    }
    loadLeaflet()
  }, [])

  // Zoom op basis van radius
  const zoomForRadius: Record<number, number> = { 5: 13, 10: 12, 20: 11 }
  const zoom = zoomForRadius[radiusKm] || 12

  if (!loaded || !MapContainer) {
    return (
      <div className={cn("bg-muted rounded-xl flex items-center justify-center", className)} style={{ minHeight: 300 }}>
        <div className="text-muted-foreground text-sm">Kaart laden...</div>
      </div>
    )
  }

  const center: [number, number] = [centrumLat, centrumLng]

  return (
    <div className={cn("relative", className)}>
      {/* Leaflet CSS */}
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />

      {/* Radius filter */}
      <div className="absolute top-3 right-3 z-[1000] bg-card/95 backdrop-blur-sm border border-border rounded-xl px-3 py-2 shadow-md">
        <label className="text-xs text-muted-foreground block mb-1">Afstand</label>
        <div className="flex gap-1">
          {[5, 10, 20].map((km) => (
            <button
              key={km}
              onClick={() => onRadiusChange(km)}
              className={cn(
                "px-2.5 py-1 rounded-lg text-xs font-medium transition-all",
                radiusKm === km
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-secondary"
              )}
            >
              {km} km
            </button>
          ))}
        </div>
      </div>

      <MapContainer
        center={center}
        zoom={zoom}
        className="rounded-xl z-0"
        style={{ height: 340, width: "100%" }}
        scrollWheelZoom={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
        />
        <MapResizer center={center} />

        {/* Centrum marker (naaste locatie) */}
        <CircleMarker
          center={center}
          radius={8}
          pathOptions={{ color: "#ef4444", fillColor: "#ef4444", fillOpacity: 0.3, weight: 2 }}
        >
          <Popup>
            <span className="text-sm font-medium">Locatie naaste</span>
          </Popup>
        </CircleMarker>

        {/* Buddy markers */}
        {buddys.map((b) => (
          <CircleMarker
            key={b.buddyId}
            center={[b.latitude, b.longitude]}
            radius={10}
            pathOptions={{
              color: matchKleur(b.matchPercentage),
              fillColor: matchKleur(b.matchPercentage),
              fillOpacity: 0.7,
              weight: 2,
            }}
            eventHandlers={{
              click: () => onBuddyClick?.(b.buddyId),
            }}
          >
            <Popup>
              <div className="min-w-[160px]">
                <p className="font-semibold text-sm">{b.voornaam}</p>
                <p className="text-xs text-gray-500">{b.woonplaats}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className="inline-block px-2 py-0.5 rounded-full text-xs font-bold text-white"
                    style={{ backgroundColor: matchKleur(b.matchPercentage) }}
                  >
                    {b.matchPercentage}% match
                  </span>
                  {b.afstandKm != null && (
                    <span className="text-xs text-gray-500">{b.afstandKm} km</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {b.hulpvormen.slice(0, 3).map((h) => (
                    <span key={h} className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded">{h}</span>
                  ))}
                </div>
                {b.vogGoedgekeurd && (
                  <p className="text-[10px] text-green-600 mt-1">✓ VOG geverifieerd</p>
                )}
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>

      {/* Buddy count overlay */}
      <div className="absolute bottom-3 left-3 z-[1000] bg-card/95 backdrop-blur-sm border border-border rounded-lg px-2.5 py-1.5 shadow-sm">
        <span className="text-xs font-medium text-foreground">
          {buddys.length} buddy{buddys.length !== 1 ? "'s" : ""} in beeld
        </span>
      </div>
    </div>
  )
}
