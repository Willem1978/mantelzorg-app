/**
 * Skeleton loading componenten voor betere gepercipieerde laadtijd.
 *
 * Gebruik i.p.v. spinners — skeleton screens tonen de structuur
 * van de content die geladen wordt, waardoor de app sneller aanvoelt.
 */

export function SkeletonLine({ width = "100%", height = "1rem" }: { width?: string; height?: string }) {
  return (
    <div
      className="bg-muted rounded-lg animate-pulse"
      style={{ width, height }}
      role="status"
      aria-label="Laden..."
    />
  )
}

export function SkeletonCard() {
  return (
    <div className="ker-card space-y-3" role="status" aria-label="Kaart laden...">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-muted rounded-full animate-pulse" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-muted rounded-lg animate-pulse w-3/4" />
          <div className="h-3 bg-muted rounded-lg animate-pulse w-1/2" />
        </div>
      </div>
      <div className="h-3 bg-muted rounded-lg animate-pulse" />
      <div className="h-3 bg-muted rounded-lg animate-pulse w-5/6" />
    </div>
  )
}

export function SkeletonDashboard() {
  return (
    <div className="space-y-4" role="status" aria-label="Dashboard laden...">
      {/* Welkom banner skeleton */}
      <div className="ker-card space-y-3">
        <div className="h-6 bg-muted rounded-lg animate-pulse w-2/3" />
        <div className="h-4 bg-muted rounded-lg animate-pulse w-1/2" />
      </div>

      {/* Thermometer skeleton */}
      <div className="ker-card space-y-3">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-muted rounded-full animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-5 bg-muted rounded-lg animate-pulse w-1/3" />
            <div className="h-3 bg-muted rounded-lg animate-pulse w-2/3" />
          </div>
        </div>
      </div>

      {/* Kaarten grid skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SkeletonCard />
        <SkeletonCard />
      </div>

      {/* Artikelen skeleton */}
      <div className="ker-card space-y-3">
        <div className="h-5 bg-muted rounded-lg animate-pulse w-1/3" />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 p-3 border border-border rounded-xl">
              <div className="w-8 h-8 bg-muted rounded-lg animate-pulse" />
              <div className="flex-1 space-y-1.5">
                <div className="h-4 bg-muted rounded-lg animate-pulse w-3/4" />
                <div className="h-3 bg-muted rounded-lg animate-pulse w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function SkeletonArtikelLijst() {
  return (
    <div className="space-y-3" role="status" aria-label="Artikelen laden...">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="ker-card flex items-start gap-3">
          <div className="w-10 h-10 bg-muted rounded-lg animate-pulse flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-muted rounded-lg animate-pulse w-4/5" />
            <div className="h-3 bg-muted rounded-lg animate-pulse w-full" />
            <div className="h-3 bg-muted rounded-lg animate-pulse w-2/3" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function SkeletonProfiel() {
  return (
    <div className="space-y-4" role="status" aria-label="Profiel laden...">
      <div className="h-8 bg-muted rounded-lg animate-pulse w-1/3" />
      <div className="h-4 bg-muted rounded-lg animate-pulse w-1/2" />

      {[1, 2, 3].map((i) => (
        <div key={i} className="ker-card space-y-3">
          <div className="h-5 bg-muted rounded-lg animate-pulse w-1/4" />
          <div className="space-y-2">
            {[1, 2, 3].map((j) => (
              <div key={j} className="flex justify-between py-2 border-b border-border">
                <div className="h-4 bg-muted rounded-lg animate-pulse w-1/4" />
                <div className="h-4 bg-muted rounded-lg animate-pulse w-1/3" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
