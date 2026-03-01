"use client"

import { GerAvatar } from "@/components/GerAvatar"

interface GerPageIntroProps {
  tekst: string
}

export function GerPageIntro({ tekst }: GerPageIntroProps) {
  return (
    <div className="flex items-start gap-3 mb-6 px-1 animate-fade-in">
      <GerAvatar size="xs" className="!w-10 !h-10 mt-0.5" />
      <div className="flex-1 bg-primary/5 border border-primary/10 rounded-2xl rounded-tl-md px-4 py-3">
        <p className="text-sm leading-relaxed text-foreground">
          {tekst}
        </p>
      </div>
    </div>
  )
}
