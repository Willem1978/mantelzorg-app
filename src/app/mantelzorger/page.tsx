import Link from "next/link"
import { LogoIcon } from "@/components/ui"
import { mantelzorgerContent as c } from "@/config/content"

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
            {c.title}
          </h1>
          <p className="text-muted-foreground">
            {c.subtitle}
          </p>
        </div>

        {/* Drie keuzes */}
        <div className="space-y-4">
          {/* Optie 1: Test doen (geen login nodig) */}
          <Link href="/belastbaarheidstest" className="block">
            <div className="ker-card hover:shadow-lg transition-all border-2 border-transparent hover:border-primary">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">📊</span>
                </div>
                <div className="flex-1">
                  <h2 className="font-bold text-foreground">{c.opties.balanstest.title}</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {c.opties.balanstest.beschrijving}
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
                  <h2 className="font-bold text-foreground">{c.opties.inloggen.title}</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {c.opties.inloggen.beschrijving}
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
                  <h2 className="font-bold text-foreground">{c.opties.registreren.title}</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {c.opties.registreren.beschrijving}
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
            {c.hulplijn.tekst}{" "}
            <a href="tel:0302059059" className="text-primary font-medium hover:underline">
              {c.hulplijn.label}
            </a>
            <br />
            <span className="text-xs">{c.hulplijn.tijden}</span>
          </p>
        </div>
      </main>
    </div>
  )
}
