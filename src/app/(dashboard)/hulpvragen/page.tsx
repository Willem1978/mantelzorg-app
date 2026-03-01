"use client"

import Link from "next/link"
import { GerPageIntro } from "@/components/ui"

export default function HulpPage() {
  return (
    <div className="ker-page-content">
      <GerPageIntro tekst="Hier vind je hulp. Je kunt een MantelBuddy zoeken of een hulpvraag plaatsen in de buurt. Wat kan ik voor jou doen?" />

      <h1 className="text-xl font-bold text-foreground mb-2">Hulp</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Kies wat je wilt doen. Je vindt alles onder Mantelbuddy&apos;s.
      </p>

      <div className="space-y-3">
        {/* Zoek een MantelBuddy */}
        <Link href="/buddys">
          <div className="flex items-center gap-4 p-5 rounded-2xl border-2 border-border bg-card hover:bg-primary/5 hover:border-primary/30 transition-all group">
            <span className="text-3xl w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              🤝
            </span>
            <div className="flex-1">
              <h2 className="text-base font-semibold text-foreground">Zoek een MantelBuddy</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Vind vrijwilligers in de buurt die jou kunnen helpen bij je zorgtaken.
              </p>
            </div>
            <svg className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </Link>

        {/* Stel een hulpvraag */}
        <Link href="/buddys?tab=hulpvraag">
          <div className="flex items-center gap-4 p-5 rounded-2xl border-2 border-border bg-card hover:bg-primary/5 hover:border-primary/30 transition-all group">
            <span className="text-3xl w-14 h-14 rounded-xl bg-[var(--accent-amber-bg)] flex items-center justify-center flex-shrink-0">
              📝
            </span>
            <div className="flex-1">
              <h2 className="text-base font-semibold text-foreground">Stel een hulpvraag in de buurt</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Plaats een hulpvraag zodat buddy&apos;s in jouw buurt kunnen reageren.
              </p>
            </div>
            <svg className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </Link>
      </div>
    </div>
  )
}
