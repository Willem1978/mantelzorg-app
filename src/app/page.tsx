import Link from "next/link"
import { LogoIcon } from "@/components/ui"
import { landingContent as c } from "@/config/content"
import { GerAvatar } from "@/components/GerAvatar"
import { GerHeroChat } from "@/components/ai/GerHeroChat"
import { PublicGerChat } from "@/components/ai/PublicGerChat"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      {/* Header */}
      <header className="px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-center">
          <div className="flex items-center gap-3">
            <LogoIcon size={40} />
            <span className="font-bold text-foreground text-xl">MantelBuddy</span>
          </div>
        </div>
      </header>

      {/* Hero section — Ger centraal */}
      <main className="flex-1">
        <section className="px-4 py-8 md:py-14">
          <div className="max-w-4xl mx-auto text-center">
            {/* Ger introductie */}
            <div className="flex flex-col items-center mb-6">
              <GerAvatar size="lg" />
              <h1 className="mt-4 text-3xl md:text-4xl font-bold text-foreground">
                {c.hero.title}
              </h1>
              <p className="mt-2 text-lg text-muted-foreground max-w-xl mx-auto">
                {c.hero.subtitle}
              </p>
            </div>

            {/* Ingebed Ger chatvenster */}
            <div className="mb-12">
              <GerHeroChat />
            </div>

            {/* Two paths — onder het chatvenster */}
            <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              {/* Mantelzorger kaart */}
              <Link href="/mantelzorger" className="block group">
                <div className="ker-card h-full hover:shadow-lg transition-all border-2 border-transparent hover:border-primary">
                  <div className="w-16 h-16 mx-auto mb-4 bg-[var(--accent-amber-bg)] rounded-full flex items-center justify-center">
                    <span className="text-3xl">🧡</span>
                  </div>
                  <h2 className="text-xl font-bold text-foreground mb-2">
                    {c.cards.mantelzorger.title}
                  </h2>
                  <p className="text-muted-foreground mb-4 text-sm">
                    {c.cards.mantelzorger.beschrijving}
                  </p>
                  <div className="ker-btn ker-btn-primary w-full group-hover:bg-primary/90 flex items-center justify-center gap-2">
                    {c.cards.mantelzorger.button}
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>

              {/* MantelBuddy vrijwilliger kaart */}
              <Link href="/word-mantelbuddy" className="block group">
                <div className="ker-card h-full hover:shadow-lg transition-all border-2 border-transparent hover:border-[var(--accent-green)]">
                  <div className="w-16 h-16 mx-auto mb-4 bg-[var(--accent-green-bg)] rounded-full flex items-center justify-center">
                    <span className="text-3xl">🤝</span>
                  </div>
                  <h2 className="text-xl font-bold text-foreground mb-2">
                    {c.cards.buddy.title}
                  </h2>
                  <p className="text-muted-foreground mb-4 text-sm">
                    {c.cards.buddy.beschrijving}
                  </p>
                  <div className="ker-btn bg-[var(--accent-green)] text-white w-full group-hover:opacity-90 flex items-center justify-center gap-2">
                    {c.cards.buddy.button}
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
              {c.howItWorks.title}
            </h2>

            <div className="grid md:grid-cols-2 gap-12">
              {/* Voor mantelzorgers */}
              <div>
                <h3 className="font-bold text-lg text-foreground mb-6 flex items-center gap-2">
                  <span className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm">1</span>
                  {c.howItWorks.mantelzorgers.label}
                </h3>
                <div className="space-y-4 pl-10">
                  {c.howItWorks.mantelzorgers.stappen.map((stap, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-[var(--accent-amber-bg)] flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-sm">{["📊", "📍", "🤝"][i]}</span>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{stap.title}</p>
                        <p className="text-sm text-muted-foreground">{stap.beschrijving}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Voor MantelBuddy's */}
              <div>
                <h3 className="font-bold text-lg text-foreground mb-6 flex items-center gap-2">
                  <span className="w-8 h-8 bg-[var(--accent-green)] rounded-full flex items-center justify-center text-white text-sm">2</span>
                  {c.howItWorks.buddys.label}
                </h3>
                <div className="space-y-4 pl-10">
                  {c.howItWorks.buddys.stappen.map((stap, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-[var(--accent-green-bg)] flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-sm">{["📝", "📍", "💪"][i]}</span>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{stap.title}</p>
                        <p className="text-sm text-muted-foreground">{stap.beschrijving}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Wat is een MantelBuddy */}
        <section className="py-16 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-foreground mb-6">
              {c.watIsEenBuddy.title}
            </h2>
            <p className="text-muted-foreground text-lg mb-8">
              {c.watIsEenBuddy.beschrijving}
            </p>

            <div className="grid sm:grid-cols-3 gap-6">
              {c.watIsEenBuddy.opties.map((optie, i) => (
                <div key={i} className="ker-card text-center">
                  <div className="w-14 h-14 mx-auto mb-4 bg-[var(--accent-green-bg)] rounded-full flex items-center justify-center">
                    <span className="text-2xl">{["☕", "🛒", "🏠"][i]}</span>
                  </div>
                  <h3 className="font-bold text-foreground mb-2">{optie.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {optie.beschrijving}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA section */}
        <section className="bg-primary py-12 px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-primary-foreground mb-4">
              {c.cta.title}
            </h2>
            <p className="text-primary-foreground/80 mb-8">
              {c.cta.beschrijving}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/mantelzorger"
                className="ker-btn bg-white text-primary hover:bg-white/90"
              >
                {c.cta.mantelzorgerButton}
              </Link>
              <Link
                href="/word-mantelbuddy"
                className="ker-btn bg-white/20 text-white hover:bg-white/30 border border-white/30"
              >
                {c.cta.helpenButton}
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Floating Ger chat — fallback op alle pagina's */}
      <PublicGerChat />

      {/* Footer */}
      <footer className="bg-foreground text-card py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <LogoIcon size={32} />
            <span className="font-bold text-lg">MantelBuddy</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-8 mb-8">
            <div>
              <h4 className="font-semibold mb-3">{c.footer.mantelzorgers.title}</h4>
              <ul className="space-y-2 text-sm text-card/70">
                <li><Link href="/mantelzorger" className="hover:text-card">{c.footer.mantelzorgers.links.home}</Link></li>
                <li><Link href="/belastbaarheidstest" className="hover:text-card">{c.footer.mantelzorgers.links.balanstest}</Link></li>
                <li><Link href="/login" className="hover:text-card">{c.footer.mantelzorgers.links.inloggen}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">{c.footer.vrijwilligers.title}</h4>
              <ul className="space-y-2 text-sm text-card/70">
                <li><Link href="/word-mantelbuddy" className="hover:text-card">{c.footer.vrijwilligers.links.wordBuddy}</Link></li>
                <li><Link href="/login" className="hover:text-card">{c.footer.vrijwilligers.links.inloggen}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">{c.footer.contact.title}</h4>
              <ul className="space-y-2 text-sm text-card/70">
                <li>{c.footer.contact.email}</li>
                <li>{c.footer.contact.mantelzorglijn}</li>
                <li className="pt-2"><Link href="/beheer/hulpbronnen" className="hover:text-card">{c.footer.contact.beheer}</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-card/20 pt-6 text-center text-sm text-card/50">
            <p>{c.footer.copyright}</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
