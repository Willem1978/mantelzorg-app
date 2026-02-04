import Link from "next/link"
import { GerAvatar } from "@/components/GerAvatar"

export default function HomePage() {
  return (
    <div className="ker-page">
      {/* Header */}
      <header className="ker-header">
        <div className="ker-header-content">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">K</span>
            </div>
            <span className="font-bold text-foreground text-xl">KER</span>
          </div>
          <Link
            href="/login"
            className="ker-btn ker-btn-secondary text-sm py-2 px-4"
          >
            Inloggen
          </Link>
        </div>
      </header>

      {/* Hero section */}
      <main className="flex-1">
        <section className="px-4 py-8 md:py-16">
          <div className="max-w-2xl mx-auto">
            {/* Welkom met Ger */}
            <div className="flex items-start gap-4 mb-8">
              <GerAvatar size="lg" />
              <div className="pt-2">
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                  Welkom bij KER
                </h1>
                <p className="text-muted-foreground mt-1">
                  Jouw digitale mantelzorgconsulent
                </p>
              </div>
            </div>

            {/* Intro card */}
            <div className="ker-card mb-6">
              <p className="text-foreground text-lg leading-relaxed">
                Zorgen voor een naaste is waardevol werk. Maar soms ook zwaar.
                Wij helpen je om <strong>grip te houden</strong> op je eigen welzijn.
              </p>
            </div>

            {/* CTA */}
            <Link href="/belastbaarheidstest" className="block">
              <div className="ker-card bg-primary text-primary-foreground hover:bg-primary/90 transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-bold text-xl">Doe de Balanstest</h2>
                    <p className="text-primary-foreground/80 mt-1">
                      Ontdek in 10 minuten hoe het met je gaat
                    </p>
                  </div>
                  <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </section>

        {/* Hoe het werkt */}
        <section className="bg-card border-y border-border py-12 px-4">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-xl font-bold text-foreground text-center mb-8">
              Hoe werkt het?
            </h2>

            <div className="space-y-4">
              {/* Stap 1 */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg flex-shrink-0">
                  1
                </div>
                <div className="pt-2">
                  <h3 className="font-bold text-foreground">Doe de balanstest</h3>
                  <p className="text-muted-foreground mt-1">
                    Beantwoord vragen over je situatie en hoe je je voelt.
                  </p>
                </div>
              </div>

              {/* Stap 2 */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg flex-shrink-0">
                  2
                </div>
                <div className="pt-2">
                  <h3 className="font-bold text-foreground">Krijg inzicht</h3>
                  <p className="text-muted-foreground mt-1">
                    Zie direct hoe belast je bent en wat je kunt doen.
                  </p>
                </div>
              </div>

              {/* Stap 3 */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg flex-shrink-0">
                  3
                </div>
                <div className="pt-2">
                  <h3 className="font-bold text-foreground">Vind hulp</h3>
                  <p className="text-muted-foreground mt-1">
                    Ontdek welke ondersteuning er voor jou is in je gemeente.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-12 px-4">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-xl font-bold text-foreground text-center mb-8">
              Wat bieden wij?
            </h2>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="ker-card">
                <div className="w-12 h-12 rounded-full bg-[var(--accent-green-bg)] flex items-center justify-center mb-3">
                  <span className="text-2xl">📊</span>
                </div>
                <h3 className="font-bold text-foreground">Persoonlijk inzicht</h3>
                <p className="text-muted-foreground mt-1 text-sm">
                  Begrijp hoe zwaar de mantelzorg voor jou is en volg dit over tijd.
                </p>
              </div>

              <div className="ker-card">
                <div className="w-12 h-12 rounded-full bg-[var(--accent-amber-bg)] flex items-center justify-center mb-3">
                  <span className="text-2xl">🤝</span>
                </div>
                <h3 className="font-bold text-foreground">Lokale hulp</h3>
                <p className="text-muted-foreground mt-1 text-sm">
                  Vind ondersteuning bij jou in de buurt, afgestemd op jouw situatie.
                </p>
              </div>

              <div className="ker-card">
                <div className="w-12 h-12 rounded-full bg-[var(--primary-light)] flex items-center justify-center mb-3">
                  <span className="text-2xl">💬</span>
                </div>
                <h3 className="font-bold text-foreground">Tips op maat</h3>
                <p className="text-muted-foreground mt-1 text-sm">
                  Krijg praktische tips die passen bij jouw zorgsituatie.
                </p>
              </div>

              <div className="ker-card">
                <div className="w-12 h-12 rounded-full bg-[var(--accent-red-bg)] flex items-center justify-center mb-3">
                  <span className="text-2xl">📱</span>
                </div>
                <h3 className="font-bold text-foreground">Altijd toegankelijk</h3>
                <p className="text-muted-foreground mt-1 text-sm">
                  Je rapport en tips zijn altijd beschikbaar, ook op je telefoon.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA section */}
        <section className="bg-primary py-12 px-4">
          <div className="max-w-md mx-auto text-center">
            <h2 className="text-2xl font-bold text-primary-foreground mb-4">
              Klaar om te beginnen?
            </h2>
            <p className="text-primary-foreground/80 mb-6">
              De balanstest is gratis en duurt ongeveer 10 minuten.
            </p>
            <Link
              href="/belastbaarheidstest"
              className="ker-btn bg-white text-primary hover:bg-white/90 w-full md:w-auto"
            >
              Start de Balanstest
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-foreground text-card py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold">K</span>
            </div>
            <span className="font-bold text-lg">KER</span>
          </div>

          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <h4 className="font-semibold mb-3">Contact</h4>
              <ul className="space-y-2 text-sm text-card/70">
                <li>info@ker.nl</li>
                <li>Mantelzorglijn: 030 - 205 9 059</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Links</h4>
              <ul className="space-y-2 text-sm text-card/70">
                <li><a href="#" className="hover:text-card">Privacy</a></li>
                <li><a href="#" className="hover:text-card">Voorwaarden</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-card/20 pt-6 text-center text-sm text-card/50">
            <p>© 2026 KER. Samen sterk voor mantelzorgers.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
