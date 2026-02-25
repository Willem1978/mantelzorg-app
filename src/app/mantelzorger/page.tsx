import Link from "next/link"
import { LogoIcon } from "@/components/ui"

export default function MantelzorgerPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      {/* Header */}
      <header className="px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-center">
          <Link href="/" className="flex items-center gap-3">
            <LogoIcon size={40} />
            <span className="font-bold text-foreground text-xl">MantelBuddy</span>
          </Link>
        </div>
      </header>

      <main className="px-4 py-8 max-w-2xl mx-auto">
        {/* Intro */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 bg-[var(--accent-amber-bg)] rounded-full flex items-center justify-center">
            <span className="text-4xl">🧡</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-3">
            Welkom, mantelzorger
          </h1>
          <p className="text-muted-foreground">
            Fijn dat je er bent. MantelBuddy helpt je met inzicht in je belasting,
            lokale hulpbronnen en praktisch advies.
          </p>
        </div>

        {/* Twee keuzes */}
        <div className="space-y-4">
          {/* Optie 1: Test doen (geen login nodig) */}
          <Link href="/belastbaarheidstest" className="block">
            <div className="ker-card hover:shadow-lg transition-all border-2 border-transparent hover:border-primary">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">📊</span>
                </div>
                <div className="flex-1">
                  <h2 className="font-bold text-foreground">Doe de Balanstest</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Ontdek in 5 minuten hoe het met je gaat. Geen account nodig.
                  </p>
                </div>
                <svg className="w-5 h-5 text-muted-foreground flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>

          {/* Optie 2: Inloggen */}
          <Link href="/login" className="block">
            <div className="ker-card hover:shadow-lg transition-all border-2 border-transparent hover:border-primary">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">👤</span>
                </div>
                <div className="flex-1">
                  <h2 className="font-bold text-foreground">Ik heb al een account</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Log in om je dashboard, resultaten en hulpbronnen te zien.
                  </p>
                </div>
                <svg className="w-5 h-5 text-muted-foreground flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>

          {/* Optie 3: Registreren */}
          <Link href="/register" className="block">
            <div className="ker-card hover:shadow-lg transition-all border-2 border-transparent hover:border-[var(--accent-green)]">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-[var(--accent-green-bg)] rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">✨</span>
                </div>
                <div className="flex-1">
                  <h2 className="font-bold text-foreground">Maak een account aan</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Bewaar je resultaten, vind lokale hulp en krijg persoonlijk advies.
                  </p>
                </div>
                <svg className="w-5 h-5 text-muted-foreground flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>
        </div>

        {/* Hulplijn */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Direct met iemand praten?{" "}
            <a href="tel:0302059059" className="text-primary font-medium hover:underline">
              Mantelzorglijn: 030 - 205 90 59
            </a>
            <br />
            <span className="text-xs">(ma-vr, gratis)</span>
          </p>
        </div>
      </main>
    </div>
  )
}
