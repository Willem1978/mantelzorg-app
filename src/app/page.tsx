import Link from "next/link"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      {/* Header */}
      <header className="px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">M</span>
            </div>
            <span className="font-bold text-foreground text-xl">MantelBuddy</span>
          </div>
        </div>
      </header>

      {/* Hero section */}
      <main className="flex-1">
        <section className="px-4 py-12 md:py-20">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
              Samen zorgen, samen sterk
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12">
              MantelBuddy is er voor iedere mantelzorger. Krijg inzicht, informatie en zie lokale hulp.
              Vrijwillige MantelBuddy&apos;s staan klaar om bij te springen wanneer nodig.
            </p>

            {/* Two paths */}
            <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              {/* Mantelzorger kaart */}
              <Link href="/mantelzorger" className="block group">
                <div className="ker-card h-full hover:shadow-lg transition-all border-2 border-transparent hover:border-primary">
                  <div className="w-20 h-20 mx-auto mb-6 bg-[var(--accent-amber-bg)] rounded-full flex items-center justify-center">
                    <span className="text-4xl">🧡</span>
                  </div>
                  <h2 className="text-xl font-bold text-foreground mb-3">
                    Ik ben mantelzorger
                  </h2>
                  <p className="text-muted-foreground mb-6">
                    Krijg snel inzicht in je belasting en taken. Vind hulp en advies in de buurt. Roep hulp in van betrouwbare MantelBuddy&apos;s.
                  </p>
                  <div className="ker-btn ker-btn-primary w-full group-hover:bg-primary/90 flex items-center justify-center gap-2">
                    Ga verder
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>

              {/* MantelBuddy vrijwilliger kaart */}
              <Link href="/word-mantelbuddy" className="block group">
                <div className="ker-card h-full hover:shadow-lg transition-all border-2 border-transparent hover:border-[var(--accent-green)]">
                  <div className="w-20 h-20 mx-auto mb-6 bg-[var(--accent-green-bg)] rounded-full flex items-center justify-center">
                    <span className="text-4xl">🤝</span>
                  </div>
                  <h2 className="text-xl font-bold text-foreground mb-3">
                    Ik wil MantelBuddy worden
                  </h2>
                  <p className="text-muted-foreground mb-6">
                    Help mantelzorgers in je buurt. Als vast maatje of door eenmalig een taak op te pakken.
                  </p>
                  <div className="ker-btn bg-[var(--accent-green)] text-white w-full group-hover:opacity-90 flex items-center justify-center gap-2">
                    Meld je aan
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </section>

        {/* Hoe werkt het */}
        <section className="bg-card border-y border-border py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-foreground text-center mb-12">
              Hoe werkt MantelBuddy?
            </h2>

            <div className="grid md:grid-cols-2 gap-12">
              {/* Voor mantelzorgers */}
              <div>
                <h3 className="font-bold text-lg text-foreground mb-6 flex items-center gap-2">
                  <span className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm">1</span>
                  Voor mantelzorgers
                </h3>
                <div className="space-y-4 pl-10">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-[var(--accent-amber-bg)] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-sm">📊</span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Krijg inzicht</p>
                      <p className="text-sm text-muted-foreground">Doe de Balanstest en zie hoe het met je gaat</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-[var(--accent-amber-bg)] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-sm">📍</span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Vind snel hulp in de buurt</p>
                      <p className="text-sm text-muted-foreground">Lokale organisaties en advies op maat</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-[var(--accent-amber-bg)] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-sm">🤝</span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Roep hulp in van een MantelBuddy</p>
                      <p className="text-sm text-muted-foreground">Betrouwbare vrijwilligers uit je buurt</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Voor MantelBuddy's */}
              <div>
                <h3 className="font-bold text-lg text-foreground mb-6 flex items-center gap-2">
                  <span className="w-8 h-8 bg-[var(--accent-green)] rounded-full flex items-center justify-center text-white text-sm">2</span>
                  Voor MantelBuddy&apos;s
                </h3>
                <div className="space-y-4 pl-10">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-[var(--accent-green-bg)] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-sm">📝</span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Meld je aan</p>
                      <p className="text-sm text-muted-foreground">Vertel wat je wilt bijdragen</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-[var(--accent-green-bg)] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-sm">📍</span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Match in de buurt</p>
                      <p className="text-sm text-muted-foreground">We koppelen je aan iemand dichtbij</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-[var(--accent-green-bg)] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-sm">💪</span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Maak het verschil</p>
                      <p className="text-sm text-muted-foreground">Eenmalig of als vast maatje</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Wat is een MantelBuddy */}
        <section className="py-16 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-foreground mb-6">
              Wat is een MantelBuddy?
            </h2>
            <p className="text-muted-foreground text-lg mb-8">
              Een MantelBuddy is een vrijwilliger uit de buurt die mantelzorgers ondersteunt.
              Je kunt eenmalig helpen wanneer het jou uitkomt, of een vast maatje worden en
              regelmatig taken voor de zorgvrager oppakken.
            </p>

            <div className="grid sm:grid-cols-3 gap-6">
              <div className="ker-card text-center">
                <div className="w-14 h-14 mx-auto mb-4 bg-[var(--accent-green-bg)] rounded-full flex items-center justify-center">
                  <span className="text-2xl">☕</span>
                </div>
                <h3 className="font-bold text-foreground mb-2">Luisterend oor</h3>
                <p className="text-sm text-muted-foreground">
                  Even bijpraten, een kop koffie, of gewoon er zijn
                </p>
              </div>

              <div className="ker-card text-center">
                <div className="w-14 h-14 mx-auto mb-4 bg-[var(--accent-green-bg)] rounded-full flex items-center justify-center">
                  <span className="text-2xl">🛒</span>
                </div>
                <h3 className="font-bold text-foreground mb-2">Praktische hulp</h3>
                <p className="text-sm text-muted-foreground">
                  Boodschappen, vervoer, of klusjes in huis
                </p>
              </div>

              <div className="ker-card text-center">
                <div className="w-14 h-14 mx-auto mb-4 bg-[var(--accent-green-bg)] rounded-full flex items-center justify-center">
                  <span className="text-2xl">🏠</span>
                </div>
                <h3 className="font-bold text-foreground mb-2">Oppas</h3>
                <p className="text-sm text-muted-foreground">
                  Even bij de zorgvrager zijn zodat de mantelzorger even weg kan
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA section */}
        <section className="bg-primary py-12 px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-primary-foreground mb-4">
              Samen zorgen we voor elkaar
            </h2>
            <p className="text-primary-foreground/80 mb-8">
              Of je nu hulp zoekt of hulp wilt bieden - bij MantelBuddy ben je welkom.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/mantelzorger"
                className="ker-btn bg-white text-primary hover:bg-white/90"
              >
                Ik ben mantelzorger
              </Link>
              <Link
                href="/word-mantelbuddy"
                className="ker-btn bg-white/20 text-white hover:bg-white/30 border border-white/30"
              >
                Ik wil helpen
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-foreground text-card py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold">M</span>
            </div>
            <span className="font-bold text-lg">MantelBuddy</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-8 mb-8">
            <div>
              <h4 className="font-semibold mb-3">Voor mantelzorgers</h4>
              <ul className="space-y-2 text-sm text-card/70">
                <li><Link href="/mantelzorger" className="hover:text-card">Home</Link></li>
                <li><Link href="/belastbaarheidstest" className="hover:text-card">Balanstest</Link></li>
                <li><Link href="/login" className="hover:text-card">Inloggen</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Voor vrijwilligers</h4>
              <ul className="space-y-2 text-sm text-card/70">
                <li><Link href="/word-mantelbuddy" className="hover:text-card">Word MantelBuddy</Link></li>
                <li><Link href="/login" className="hover:text-card">Inloggen</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Contact</h4>
              <ul className="space-y-2 text-sm text-card/70">
                <li>info@mantelbuddy.nl</li>
                <li>Mantelzorglijn: 030 - 205 9 059</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-card/20 pt-6 text-center text-sm text-card/50">
            <p>&copy; 2026 MantelBuddy. Samen sterk voor mantelzorgers.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
