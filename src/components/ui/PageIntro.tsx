"use client"

interface PageIntroProps {
  tekst: string
  emoji?: string
}

export function PageIntro({ tekst, emoji }: PageIntroProps) {
  return (
    <div className="ker-page-intro animate-fade-in">
      <p>
        {emoji && <span className="mr-2">{emoji}</span>}
        {tekst}
      </p>
    </div>
  )
}
