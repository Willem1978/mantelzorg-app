"use client"

import Link from "next/link"

export default function PrivacyPage() {
  return (
    <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/profiel"
          className="w-10 h-10 flex items-center justify-center rounded-full bg-muted hover:bg-muted/80 transition-colors"
        >
          <svg className="w-5 h-5 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Privacy & AVG</h1>
          <p className="text-sm text-muted-foreground">Hoe wij met jouw gegevens omgaan</p>
        </div>
      </div>

      {/* Introductie */}
      <div className="ker-card">
        <h2 className="font-bold text-foreground mb-2 flex items-center gap-2">
          <span className="text-xl">🔒</span>
          Jouw privacy is belangrijk
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          MantelBuddy verwerkt persoonsgegevens in overeenstemming met de Algemene Verordening
          Gegevensbescherming (AVG/GDPR). Hieronder vind je een overzicht van welke gegevens
          we verzamelen, waarom, en wat je rechten zijn.
        </p>
      </div>

      {/* Welke gegevens */}
      <div className="ker-card">
        <h2 className="font-bold text-foreground mb-3 flex items-center gap-2">
          <span className="text-xl">📋</span>
          Welke gegevens bewaren we?
        </h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-foreground text-sm mb-1">Account gegevens</h3>
            <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
              <li>Naam en e-mailadres</li>
              <li>Wachtwoord (versleuteld opgeslagen)</li>
              <li>Telefoonnummer (optioneel, voor WhatsApp)</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-foreground text-sm mb-1">Adresgegevens</h3>
            <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
              <li>Straat, woonplaats, gemeente en wijk</li>
              <li>Postcode</li>
              <li>Adresgegevens van je naaste (optioneel)</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-foreground text-sm mb-1">Zorggegevens</h3>
            <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
              <li>Naam en relatie tot je naaste</li>
              <li>Zorgtaken en zorguren per week</li>
              <li>Resultaten van de Balanstest (belastingniveau)</li>
              <li>Maandelijkse check-in scores</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-foreground text-sm mb-1">Gebruik van de app</h3>
            <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
              <li>Opgeslagen favorieten (hulpbronnen en tips)</li>
              <li>Agenda-items</li>
              <li>Hulpvragen aan organisaties</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Waarom */}
      <div className="ker-card">
        <h2 className="font-bold text-foreground mb-3 flex items-center gap-2">
          <span className="text-xl">🎯</span>
          Waarom verzamelen we dit?
        </h2>
        <div className="space-y-3">
          <div className="flex gap-3">
            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-sm">1</span>
            </div>
            <div>
              <p className="font-medium text-foreground text-sm">Persoonlijk hulpaanbod</p>
              <p className="text-sm text-muted-foreground">
                Op basis van je locatie en belastingniveau tonen we relevante hulporganisaties bij jou in de buurt.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-sm">2</span>
            </div>
            <div>
              <p className="font-medium text-foreground text-sm">Inzicht in belasting</p>
              <p className="text-sm text-muted-foreground">
                Met de Balanstest en check-ins kun je je eigen welzijn bijhouden en trends zien.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-sm">3</span>
            </div>
            <div>
              <p className="font-medium text-foreground text-sm">WhatsApp ondersteuning</p>
              <p className="text-sm text-muted-foreground">
                Je telefoonnummer wordt alleen gebruikt om de WhatsApp chatbot te koppelen aan je account.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Beveiliging */}
      <div className="ker-card">
        <h2 className="font-bold text-foreground mb-3 flex items-center gap-2">
          <span className="text-xl">🛡️</span>
          Hoe beveiligen we je gegevens?
        </h2>
        <ul className="text-sm text-muted-foreground space-y-2 ml-4 list-disc">
          <li>Alle verbindingen zijn versleuteld via HTTPS/TLS</li>
          <li>Wachtwoorden worden gehasht opgeslagen (bcrypt) en zijn niet leesbaar</li>
          <li>Database is beveiligd en alleen toegankelijk via de applicatie</li>
          <li>Sessies verlopen automatisch na 30 dagen inactiviteit</li>
          <li>Bij inloggen op een nieuw apparaat worden oude sessies automatisch beëindigd</li>
        </ul>
      </div>

      {/* Delen met derden */}
      <div className="ker-card">
        <h2 className="font-bold text-foreground mb-3 flex items-center gap-2">
          <span className="text-xl">🤝</span>
          Delen we gegevens met anderen?
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed mb-3">
          MantelBuddy deelt <strong className="text-foreground">geen</strong> persoonsgegevens met derden,
          tenzij je daar zelf toestemming voor geeft. Specifiek:
        </p>
        <ul className="text-sm text-muted-foreground space-y-2 ml-4 list-disc">
          <li>Je gegevens worden <strong className="text-foreground">niet</strong> verkocht aan adverteerders</li>
          <li>Hulporganisaties zien alleen je hulpvraag als je die zelf indient</li>
          <li>Bij een MantelBuddy-koppeling bepaal je zelf welke informatie je deelt</li>
          <li>De WhatsApp-integratie verloopt via een beveiligde API-verbinding</li>
        </ul>
      </div>

      {/* Jouw rechten */}
      <div className="ker-card">
        <h2 className="font-bold text-foreground mb-3 flex items-center gap-2">
          <span className="text-xl">⚖️</span>
          Jouw rechten onder de AVG
        </h2>
        <div className="space-y-3">
          <div className="p-3 bg-muted rounded-xl">
            <p className="font-medium text-foreground text-sm">Recht op inzage</p>
            <p className="text-xs text-muted-foreground">
              Je kunt op je profielpagina al je opgeslagen gegevens inzien.
            </p>
          </div>
          <div className="p-3 bg-muted rounded-xl">
            <p className="font-medium text-foreground text-sm">Recht op rectificatie</p>
            <p className="text-xs text-muted-foreground">
              Je kunt je gegevens op elk moment wijzigen via je profiel.
            </p>
          </div>
          <div className="p-3 bg-muted rounded-xl">
            <p className="font-medium text-foreground text-sm">Recht op vergetelheid</p>
            <p className="text-xs text-muted-foreground">
              Je kunt je account en alle bijbehorende gegevens permanent verwijderen via je profiel.
            </p>
          </div>
          <div className="p-3 bg-muted rounded-xl">
            <p className="font-medium text-foreground text-sm">Recht op dataportabiliteit</p>
            <p className="text-xs text-muted-foreground">
              Je hebt het recht om je gegevens op te vragen in een overdraagbaar formaat.
            </p>
          </div>
        </div>
      </div>

      {/* Bewaartermijnen */}
      <div className="ker-card">
        <h2 className="font-bold text-foreground mb-3 flex items-center gap-2">
          <span className="text-xl">⏳</span>
          Bewaartermijnen
        </h2>
        <ul className="text-sm text-muted-foreground space-y-2 ml-4 list-disc">
          <li>Accountgegevens: zolang je account actief is</li>
          <li>Testresultaten: zolang je account actief is</li>
          <li>Sessiegegevens: maximaal 30 dagen</li>
          <li>Na verwijdering van je account worden alle gegevens <strong className="text-foreground">direct en permanent</strong> verwijderd</li>
        </ul>
      </div>

      {/* Contact */}
      <div className="ker-card bg-muted">
        <h2 className="font-bold text-foreground mb-2 flex items-center gap-2">
          <span className="text-xl">📧</span>
          Vragen over privacy?
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Heb je vragen over hoe we met je gegevens omgaan, of wil je gebruik maken van
          je AVG-rechten? Neem dan contact met ons op via de app of stuur een e-mail.
        </p>
      </div>

      {/* Terug naar profiel */}
      <Link
        href="/profiel"
        className="ker-btn ker-btn-secondary w-full flex items-center justify-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Terug naar profiel
      </Link>

      <div className="pb-8" />
    </div>
  )
}
