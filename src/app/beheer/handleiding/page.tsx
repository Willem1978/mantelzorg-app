"use client"

import { useState } from "react"
import Link from "next/link"

type SectieId =
  | "overzicht"
  | "eerste-opzet"
  | "gemeente"
  | "gemeente-portal"
  | "huisstijl"
  | "whatsapp"
  | "artikelen"
  | "hulpbronnen"
  | "app-content"
  | "balanstest"
  | "categorieen"
  | "gebruikers"
  | "buddies"
  | "alarmen"
  | "data"

const SECTIES: { id: SectieId; label: string; icon: string }[] = [
  { id: "overzicht", label: "Overzicht", icon: "📖" },
  { id: "eerste-opzet", label: "Eerste opzet", icon: "🚀" },
  { id: "gemeente", label: "Gemeente inrichten", icon: "🏛️" },
  { id: "gemeente-portal", label: "Gemeente-portal", icon: "🏢" },
  { id: "huisstijl", label: "Logo & Huisstijl", icon: "🎨" },
  { id: "whatsapp", label: "WhatsApp & Contact", icon: "💬" },
  { id: "artikelen", label: "Artikelen & Tips", icon: "📝" },
  { id: "hulpbronnen", label: "Hulpbronnen", icon: "🏥" },
  { id: "app-content", label: "App content", icon: "📱" },
  { id: "balanstest", label: "Balanstest & Check-in", icon: "❓" },
  { id: "categorieen", label: "Categorieën & Formulieren", icon: "🗂️" },
  { id: "gebruikers", label: "Gebruikersbeheer", icon: "👥" },
  { id: "buddies", label: "MantelBuddies", icon: "🤝" },
  { id: "alarmen", label: "Alarmen & Audit", icon: "🔔" },
  { id: "data", label: "Data importeren", icon: "🔄" },
]

export default function HandleidingPage() {
  const [actief, setActief] = useState<SectieId>("overzicht")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Handleiding Beheer</h1>
        <p className="text-gray-500 mt-1">
          Uitleg over alle functies en hoe je het platform inricht en beheert.
        </p>
      </div>

      {/* Navigatie */}
      <div className="flex flex-wrap gap-2">
        {SECTIES.map((s) => (
          <button
            key={s.id}
            onClick={() => setActief(s.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              actief === s.id
                ? "bg-blue-100 text-blue-700"
                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            <span>{s.icon}</span>
            {s.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 prose prose-sm max-w-none prose-headings:text-gray-900 prose-p:text-gray-600 prose-strong:text-gray-900 prose-a:text-blue-600">
        {actief === "overzicht" && <OverzichtSectie />}
        {actief === "eerste-opzet" && <EersteOpzetSectie />}
        {actief === "gemeente" && <GemeenteSectie />}
        {actief === "gemeente-portal" && <GemeentePortalSectie />}
        {actief === "huisstijl" && <HuisstijlSectie />}
        {actief === "whatsapp" && <WhatsAppSectie />}
        {actief === "artikelen" && <ArtikelenSectie />}
        {actief === "hulpbronnen" && <HulpbronnenSectie />}
        {actief === "app-content" && <AppContentSectie />}
        {actief === "balanstest" && <BalanstestSectie />}
        {actief === "categorieen" && <CategorieenSectie />}
        {actief === "gebruikers" && <GebruikersSectie />}
        {actief === "buddies" && <BuddiesSectie />}
        {actief === "alarmen" && <AlarmenSectie />}
        {actief === "data" && <DataSectie />}
      </div>
    </div>
  )
}

// ============================================
// HULPCOMPONENTEN
// ============================================

function Stap({ nummer, titel, children }: { nummer: number; titel: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4 mb-4">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-sm flex items-center justify-center">
        {nummer}
      </div>
      <div className="flex-1">
        <h4 className="font-semibold text-gray-900 mb-1">{titel}</h4>
        <div className="text-gray-600 text-sm">{children}</div>
      </div>
    </div>
  )
}

function BeheerLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-1 text-blue-600 hover:underline font-medium">
      {label}
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  )
}

function LetOp({ children }: { children: React.ReactNode }) {
  return (
    <div className="not-prose my-4 p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
      <strong>Let op:</strong> {children}
    </div>
  )
}

// ============================================
// SECTIES
// ============================================

// ── OVERZICHT ──

function OverzichtSectie() {
  return (
    <>
      <h2>Wat is MantelBuddy Beheer?</h2>
      <p>
        Het beheerpaneel is de plek waar je het MantelBuddy platform inricht en beheert.
        Je kunt hier content toevoegen, gebruikers beheren, gemeenten inrichten en de look &amp; feel aanpassen.
      </p>

      <h3>Structuur van het beheer</h3>
      <p>Het beheer is opgedeeld in vijf groepen:</p>

      <table>
        <thead>
          <tr>
            <th>Groep</th>
            <th>Wat doe je hier?</th>
            <th>Hoe vaak?</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Gebruikers &amp; Hulp</strong></td>
            <td>Gebruikers beheren, MantelBuddies goedkeuren, alarmen afhandelen</td>
            <td>Dagelijks/wekelijks</td>
          </tr>
          <tr>
            <td><strong>Content</strong></td>
            <td>Artikelen publiceren, hulpbronnen toevoegen, app content aanpassen</td>
            <td>Wekelijks/maandelijks</td>
          </tr>
          <tr>
            <td><strong>Test &amp; Vragen</strong></td>
            <td>Balanstest vragen beheren, zorgtaken configureren, intake aanpassen</td>
            <td>Bij opzet/wijziging</td>
          </tr>
          <tr>
            <td><strong>Inrichting</strong></td>
            <td>Gemeente toevoegen, huisstijl aanpassen, categorieën en formulier opties</td>
            <td>Bij opzet/wijziging</td>
          </tr>
          <tr>
            <td><strong>Systeem</strong></td>
            <td>Audit log bekijken, data importeren, instellingen, deze handleiding</td>
            <td>Indien nodig</td>
          </tr>
        </tbody>
      </table>

      <h3>Twee beheerpanelen</h3>
      <p>Er zijn twee aparte beheerpanelen:</p>
      <ul>
        <li><strong>/beheer</strong> — Platform beheer (deze handleiding). Voor ADMIN-gebruikers. Je beheert het hele platform.</li>
        <li><strong>/gemeente</strong> — Gemeente-portal. Voor GEMEENTE_ADMIN-gebruikers. Beperkt beheer voor één gemeente (statistieken, content, hulpbronnen, alarmen).</li>
      </ul>
      <p>Beide panelen hebben een eigen inlog en eigen sidebar.</p>

      <h3>Nieuw hier? Start bij &ldquo;Eerste opzet&rdquo;</h3>
      <p>
        Als je het platform voor het eerst inricht, lees dan eerst de sectie{" "}
        <strong>Eerste opzet</strong> hierboven. Daar staat stap voor stap wat je moet doen.
      </p>
    </>
  )
}

// ── EERSTE OPZET ──

function EersteOpzetSectie() {
  return (
    <>
      <h2>Eerste opzet — Stap voor stap</h2>
      <p>Volg deze stappen om het platform voor het eerst in te richten.</p>

      <Stap nummer={1} titel="Content keys laden">
        <p>
          Ga naar het <BeheerLink href="/beheer" label="Dashboard" /> en klik op de knop{" "}
          <strong>&ldquo;Content keys laden&rdquo;</strong>.
        </p>
        <p>
          Dit vult de database met alle bewerkbare teksten (advies, rapport, hulptips, begroetingen, etc.).
          Bestaande aanpassingen worden niet overschreven — je kunt dit veilig meerdere keren uitvoeren.
        </p>
      </Stap>

      <Stap nummer={2} titel="Huisstijl instellen">
        <p>
          Ga naar <BeheerLink href="/beheer/huisstijl" label="Huisstijl & Teksten" />.
        </p>
        <ul>
          <li><strong>Tab &ldquo;Branding&rdquo;</strong> — Upload je logo, stel de app-naam en tagline in</li>
          <li><strong>Tab &ldquo;Kleuren&rdquo;</strong> — Pas de primaire kleur, accentkleuren en achtergrondkleuren aan</li>
          <li><strong>Tab &ldquo;Teksten&rdquo;</strong> — Pas begroetingen, knoppen en adviesteksten aan</li>
        </ul>
        <p>Klik op &ldquo;Opslaan&rdquo; als je klaar bent.</p>
      </Stap>

      <Stap nummer={3} titel="WhatsApp-nummer instellen">
        <p>
          Het WhatsApp-nummer staat in <BeheerLink href="/beheer/huisstijl" label="Huisstijl & Teksten" />,
          tab &ldquo;Branding&rdquo;, sleutel <code>branding.whatsappNumber</code>.
        </p>
        <p>Vul hier het nummer in dat je Twilio-account gebruikt (met landcode, bijv. +31612345678).</p>
      </Stap>

      <Stap nummer={4} titel="Gemeente toevoegen">
        <p>
          Ga naar <BeheerLink href="/beheer/gemeenten" label="Gemeenten" /> en voeg je gemeente(n) toe.
          Vul contactgegevens, hulpbronlinks en advies per belastingniveau in.
          Zie de sectie &ldquo;Gemeente inrichten&rdquo; voor details.
        </p>
      </Stap>

      <Stap nummer={5} titel="Hulpbronnen importeren">
        <p>
          Ga naar <BeheerLink href="/beheer/data-update" label="Data bijwerken" /> en importeer lokale hulporganisaties.
          Je kunt een CSV-bestand uploaden of de ingebouwde Zutphen-data laden als voorbeeld.
        </p>
      </Stap>

      <Stap nummer={6} titel="Artikelen toevoegen">
        <p>
          Ga naar <BeheerLink href="/beheer/artikelen" label="Artikelen & Tips" /> en publiceer informatieve artikelen.
          Er zijn al standaard-artikelen geladen bij de installatie.
        </p>
      </Stap>

      <Stap nummer={7} titel="App content controleren">
        <p>
          Ga naar <BeheerLink href="/beheer/app-content" label="App content" /> en controleer de onboarding-teksten,
          tutorials en pagina-intro&apos;s. Pas ze aan voor je doelgroep.
        </p>
      </Stap>

      <Stap nummer={8} titel="Testen">
        <p>
          Maak een testaccount aan (rol CAREGIVER), doorloop de balanstest, doe een check-in,
          en bekijk of alles goed verschijnt. Controleer de gemeente-specifieke content.
        </p>
      </Stap>

      <LetOp>
        Vergeet niet de drempelwaardes voor de balanstest te controleren in{" "}
        <BeheerLink href="/beheer/instellingen" label="Instellingen" />. Standaard: Laag 0-30, Gemiddeld 31-60, Hoog 60+.
      </LetOp>
    </>
  )
}

// ── GEMEENTE ──

function GemeenteSectie() {
  return (
    <>
      <h2>Een gemeente inrichten</h2>
      <p>
        Elke gemeente kan eigen contactgegevens, advies per belastingniveau en links naar lokale hulp hebben.
        Dit wordt getoond aan mantelzorgers die in die gemeente wonen.
      </p>

      <h3>Stappenplan</h3>
      <Stap nummer={1} titel="Ga naar Gemeenten">
        <p>Open <BeheerLink href="/beheer/gemeenten" label="Gemeenten" /> in het beheer.</p>
      </Stap>

      <Stap nummer={2} titel="Klik op '+ Gemeente toevoegen'">
        <p>Vul in:</p>
        <ul>
          <li><strong>Naam</strong> — Officiële gemeentenaam (bijv. &ldquo;Zutphen&rdquo;)</li>
          <li><strong>CBS code</strong> — Optioneel, bijv. &ldquo;GM0301&rdquo;</li>
        </ul>
      </Stap>

      <Stap nummer={3} titel="Vul contactgegevens in">
        <ul>
          <li><strong>E-mail</strong> — Contactadres van de gemeente of het steunpunt</li>
          <li><strong>Telefoon</strong> — Telefoonnummer voor mantelzorgers</li>
          <li><strong>Website</strong> — Hoofdwebsite van de gemeente</li>
          <li><strong>WMO loket URL</strong> — Directe link naar het WMO-loket</li>
        </ul>
      </Stap>

      <Stap nummer={4} titel="Stel hulpbronnen in">
        <ul>
          <li><strong>Mantelzorgsteunpunt naam</strong> — Bijv. &ldquo;Stichting Present Zutphen&rdquo;</li>
          <li><strong>Mantelzorgsteunpunt URL</strong> — Link naar het steunpunt</li>
          <li><strong>Respijtzorg URL</strong> — Link naar respijtzorg-info</li>
          <li><strong>Dagopvang URL</strong> — Link naar dagopvang-informatie</li>
        </ul>
      </Stap>

      <Stap nummer={5} titel="Schrijf advies per belastingniveau">
        <p>Dit zijn de teksten die mantelzorgers zien na hun balanstest:</p>
        <ul>
          <li><strong className="text-green-700">Laag</strong> — Bemoedigend, bijv. &ldquo;In Zutphen kunt u terecht bij...&rdquo;</li>
          <li><strong className="text-amber-700">Gemiddeld</strong> — Richting geven, bijv. &ldquo;Neem contact op met het mantelzorgsteunpunt...&rdquo;</li>
          <li><strong className="text-red-700">Hoog</strong> — Urgent, bijv. &ldquo;Bel direct het WMO-loket voor ondersteuning...&rdquo;</li>
        </ul>
      </Stap>

      <Stap nummer={6} titel="Zet op Actief en sla op">
        <p>Zorg dat het vinkje &ldquo;Actief&rdquo; aanstaat. Klik &ldquo;Toevoegen&rdquo; of &ldquo;Bijwerken&rdquo;.</p>
      </Stap>

      <h3>Waar verschijnt gemeente-content?</h3>
      <ul>
        <li><strong>Dashboard</strong> — Gemeente-specifiek advies bij de balanstest-resultaten</li>
        <li><strong>Rapport</strong> — Links naar WMO-loket, steunpunt, respijtzorg</li>
        <li><strong>Info &amp; tips</strong> — Gemeente nieuws-artikelen</li>
        <li><strong>Hulp zoeken</strong> — Hulpbronnen gefilterd op gemeente</li>
      </ul>

      <h3>Tips</h3>
      <ul>
        <li>Je kunt meerdere gemeenten toevoegen — elke gemeente krijgt eigen content</li>
        <li>Inactieve gemeenten worden niet getoond aan gebruikers</li>
        <li>Gebruikers kiezen hun gemeente bij het aanmaken van hun profiel</li>
      </ul>
    </>
  )
}

// ── GEMEENTE PORTAL ──

function GemeentePortalSectie() {
  return (
    <>
      <h2>De gemeente-portal</h2>
      <p>
        Naast dit beheerpaneel (<code>/beheer</code>) bestaat er een apart portaal voor gemeentemedewerkers
        op <code>/gemeente</code>. Dit portaal heeft een eigen inlog en beperkte functies.
      </p>

      <h3>Wie heeft toegang?</h3>
      <p>
        Gebruikers met de rol <strong>GEMEENTE_ADMIN</strong> hebben toegang tot de gemeente-portal.
        Ze zien alleen data van hun eigen gemeente. Maak deze accounts aan via{" "}
        <BeheerLink href="/beheer/gebruikers" label="Gebruikers" />.
      </p>

      <h3>Subrollen</h3>
      <p>Gemeente-admins kunnen extra subrollen krijgen die bepalen welke secties ze zien:</p>
      <table>
        <thead>
          <tr><th>Subrol</th><th>Toegang tot</th></tr>
        </thead>
        <tbody>
          <tr><td><strong>BELEID</strong></td><td>Dashboard, demografie, trends, hulpvragen, alarmen, rapportages</td></tr>
          <tr><td><strong>COMMUNICATIE</strong></td><td>Content, evenementen</td></tr>
          <tr><td><strong>HULPBRONNEN</strong></td><td>Hulpbronnen beheer</td></tr>
        </tbody>
      </table>
      <p>Zonder subrol heeft een gemeente-admin toegang tot alle secties.</p>

      <h3>Functies in de gemeente-portal</h3>
      <ul>
        <li><strong>Dashboard</strong> — KPI&apos;s en statistieken voor de eigen gemeente</li>
        <li><strong>Demografie</strong> — Overzicht van mantelzorgers in de gemeente</li>
        <li><strong>Trends</strong> — Ontwikkeling van belastingscores over tijd</li>
        <li><strong>Hulpvragen</strong> — Openstaande hulpvragen in de gemeente</li>
        <li><strong>Alarmen</strong> — Signalering van hoog-risico situaties</li>
        <li><strong>Content</strong> — Gemeente nieuws publiceren</li>
        <li><strong>Hulpbronnen</strong> — Lokale hulporganisaties beheren</li>
        <li><strong>Evenementen</strong> — Lokale evenementen toevoegen</li>
      </ul>

      <LetOp>
        Gemeente-admins zien alleen geanonimiseerde data als er minder dan 10 mantelzorgers in hun gemeente zijn
        (privacy-drempel).
      </LetOp>

      <h3>Een gemeente-admin aanmaken</h3>
      <Stap nummer={1} titel="Maak een gebruiker aan">
        <p>Ga naar <BeheerLink href="/beheer/gebruikers" label="Gebruikers" />, klik &ldquo;+ Nieuwe gebruiker&rdquo;.</p>
      </Stap>
      <Stap nummer={2} titel="Stel de rol in op GEMEENTE_ADMIN">
        <p>Selecteer &ldquo;GEMEENTE_ADMIN&rdquo; als rol.</p>
      </Stap>
      <Stap nummer={3} titel="Koppel aan een gemeente">
        <p>Vul de gemeentenaam in. Deze moet overeenkomen met een actieve gemeente uit <BeheerLink href="/beheer/gemeenten" label="Gemeenten" />.</p>
      </Stap>
    </>
  )
}

// ── HUISSTIJL ──

function HuisstijlSectie() {
  return (
    <>
      <h2>Logo en huisstijl aanpassen</h2>
      <p>
        Via <BeheerLink href="/beheer/huisstijl" label="Huisstijl & Teksten" /> pas je het uiterlijk van de app aan.
        Er zijn drie tabbladen:
      </p>

      <h3>Tab 1: Branding &amp; Logo</h3>
      <table>
        <thead><tr><th>Instelling</th><th>Sleutel</th><th>Wat doet het?</th></tr></thead>
        <tbody>
          <tr><td>Logo</td><td><code>branding.logo</code></td><td>App-logo (PNG/JPG/SVG, max 500KB)</td></tr>
          <tr><td>App naam</td><td><code>branding.appName</code></td><td>Naam overal in de app (standaard: MantelBuddy)</td></tr>
          <tr><td>Tagline</td><td><code>branding.tagline</code></td><td>Korte beschrijving onder de naam</td></tr>
          <tr><td>Beschrijving</td><td><code>branding.description</code></td><td>Langere beschrijving voor metadata</td></tr>
          <tr><td>Contact e-mail</td><td><code>branding.contactEmail</code></td><td>E-mailadres voor support</td></tr>
          <tr><td>Mantelzorglijn</td><td><code>branding.mantelzorglijn</code></td><td>Telefoonnummer Mantelzorglijn</td></tr>
          <tr><td>WhatsApp nummer</td><td><code>branding.whatsappNumber</code></td><td>Nummer voor WhatsApp-bot</td></tr>
        </tbody>
      </table>

      <h3>Tab 2: Kleuren</h3>
      <p>Elke kleur heeft een kleurpicker + tekstveld voor de hex-code.</p>
      <table>
        <thead><tr><th>Instelling</th><th>Sleutel</th><th>Waar gebruikt?</th></tr></thead>
        <tbody>
          <tr><td>Primaire kleur</td><td><code>kleuren.primary</code></td><td>Knoppen, links, accenten</td></tr>
          <tr><td>Primair licht</td><td><code>kleuren.primaryLight</code></td><td>Hover-states, subtiele accenten</td></tr>
          <tr><td>Achtergrond</td><td><code>kleuren.background</code></td><td>Pagina-achtergrond</td></tr>
          <tr><td>Score laag</td><td><code>kleuren.scoreLaag</code></td><td>Groene kleur voor &ldquo;laag&rdquo; niveau</td></tr>
          <tr><td>Score gemiddeld</td><td><code>kleuren.scoreGemiddeld</code></td><td>Oranje kleur voor &ldquo;gemiddeld&rdquo;</td></tr>
          <tr><td>Score hoog</td><td><code>kleuren.scoreHoog</code></td><td>Rode kleur voor &ldquo;hoog&rdquo;</td></tr>
        </tbody>
      </table>

      <h3>Tab 3: Teksten</h3>
      <p>
        Alle teksten in de app zijn aanpasbaar: begroetingen, knoppen, adviesteksten, rapportteksten.
        Elke tekst heeft een sleutel (bijv. <code>advies.hoog-hulp.titel</code>) en een bewerkbare waarde.
      </p>

      <LetOp>
        Wijzigingen worden pas actief na klikken op &ldquo;Opslaan&rdquo;.
        De floating balk onderaan toont hoeveel onopgeslagen wijzigingen er zijn.
        Kleuren worden automatisch als CSS-variabelen geladen — geen herstart nodig.
      </LetOp>

      <h3>Hoe het technisch werkt</h3>
      <p>
        Alle instellingen staan in de <strong>SiteSettings</strong> tabel in de database.
        De app laadt deze via <code>/api/site-settings</code> en injecteert kleuren als CSS-variabelen
        (<code>--primary</code>, <code>--accent-green</code>, etc.) op de <code>&lt;html&gt;</code> tag.
      </p>
      <p>
        Om alle teksten beschikbaar te maken, klik je eenmalig op &ldquo;Content keys laden&rdquo; op het{" "}
        <BeheerLink href="/beheer" label="Dashboard" />. Dit maakt ~42 bewerkbare instellingen aan.
        Bestaande aanpassingen worden niet overschreven.
      </p>
    </>
  )
}

// ── WHATSAPP ──

function WhatsAppSectie() {
  return (
    <>
      <h2>WhatsApp en contactgegevens</h2>

      <h3>WhatsApp-nummer wijzigen</h3>
      <p>Het WhatsApp-nummer wordt op twee plekken gebruikt:</p>
      <ul>
        <li>De &ldquo;Ook bereikbaar via WhatsApp&rdquo; link op het dashboard</li>
        <li>De WhatsApp-optie in het &ldquo;Meer&rdquo;-menu van de mobiele navigatie</li>
      </ul>

      <Stap nummer={1} titel="Ga naar Huisstijl & Teksten">
        <p>Open <BeheerLink href="/beheer/huisstijl" label="Huisstijl & Teksten" />, tabblad &ldquo;Branding &amp; Logo&rdquo;.</p>
      </Stap>
      <Stap nummer={2} titel="Zoek branding.whatsappNumber">
        <p>Wijzig de waarde naar je eigen Twilio WhatsApp-nummer, inclusief landcode (bijv. <code>+31612345678</code>).</p>
      </Stap>
      <Stap nummer={3} titel="Sla op">
        <p>Klik &ldquo;Opslaan&rdquo;. De wijziging is direct actief.</p>
      </Stap>

      <h3>Mantelzorglijn wijzigen</h3>
      <p>
        Het landelijke telefoonnummer staat in dezelfde tab, sleutel <code>branding.mantelzorglijn</code>.
        Standaard: 030 - 205 90 59. Pas dit aan als je een eigen hulplijn hebt.
      </p>

      <h3>Contact e-mail wijzigen</h3>
      <p>
        Sleutel <code>branding.contactEmail</code>. Dit wordt gebruikt voor &ldquo;neem contact op&rdquo; links in de app.
      </p>
    </>
  )
}

// ── ARTIKELEN ──

function ArtikelenSectie() {
  return (
    <>
      <h2>Artikelen en tips beheren</h2>
      <p>
        Via <BeheerLink href="/beheer/artikelen" label="Artikelen & Tips" /> publiceer je informatie voor mantelzorgers.
      </p>

      <h3>Een artikel aanmaken</h3>
      <Stap nummer={1} titel="Klik op '+ Nieuw artikel'">
        <p>Er opent een formulier met alle velden.</p>
      </Stap>

      <Stap nummer={2} titel="Vul de basisgegevens in">
        <ul>
          <li><strong>Titel</strong> — Kort en duidelijk (B1-niveau)</li>
          <li><strong>Beschrijving</strong> — Samenvatting in 1-2 zinnen</li>
          <li><strong>Uitgebreide inhoud</strong> — Optioneel: de volledige tekst</li>
          <li><strong>Emoji</strong> — Icoon dat bij het artikel verschijnt</li>
        </ul>
      </Stap>

      <Stap nummer={3} titel="Stel categorie en type in">
        <ul>
          <li><strong>Categorie</strong> — Bijv. &ldquo;Praktische tips&rdquo;, &ldquo;Emotionele steun&rdquo;, &ldquo;Rechten en regelingen&rdquo;</li>
          <li><strong>Sub-hoofdstuk</strong> — Verschijnt automatisch per categorie (zie Categorieën)</li>
          <li><strong>Type</strong> — Artikel, Tip, Gemeente nieuws, Video</li>
          <li><strong>Belastingniveau</strong> — Toon bij alle niveaus, of alleen bij Laag/Gemiddeld/Hoog</li>
          <li><strong>Bronlabel</strong> — Bijv. &ldquo;Landelijk&rdquo;, &ldquo;Gemeente (Wmo)&rdquo;, &ldquo;Zorgverzekeraar&rdquo;</li>
        </ul>
      </Stap>

      <Stap nummer={4} titel="Publiceer het artikel">
        <ul>
          <li><strong>Status: Concept</strong> — Niet zichtbaar voor gebruikers</li>
          <li><strong>Status: Gepubliceerd</strong> — Zichtbaar in de app</li>
          <li><strong>Status: Gearchiveerd</strong> — Verborgen maar niet verwijderd</li>
          <li><strong>Publicatiedatum</strong> — Optioneel: pas zichtbaar vanaf die datum</li>
        </ul>
      </Stap>

      <h3>Gemeente nieuws</h3>
      <p>
        Kies type &ldquo;Gemeente nieuws&rdquo; om een bericht voor een specifieke gemeente te publiceren.
        Er verschijnt dan een gemeente-zoekveld. Gebruikers uit die gemeente zien het bericht
        in hun &ldquo;Info &amp; tips&rdquo; sectie.
      </p>

      <h3>Sortering</h3>
      <p>
        &ldquo;Sorteervolgorde&rdquo; bepaalt de positie. Lager nummer = eerder getoond.
        Bij gelijk nummer: op publicatiedatum (nieuwste eerst).
      </p>
    </>
  )
}

// ── HULPBRONNEN ──

function HulpbronnenSectie() {
  return (
    <>
      <h2>Hulpbronnen beheren</h2>
      <p>
        Hulpbronnen zijn organisaties die hulp bieden aan mantelzorgers of zorgvragers.
        Ze verschijnen op de &ldquo;Hulp&rdquo; pagina en worden aanbevolen op basis van zorgtaken.
      </p>

      <h3>Een hulpbron toevoegen</h3>
      <p>Open <BeheerLink href="/beheer/hulpbronnen" label="Hulpbronnen" /> en klik op &ldquo;+ Nieuwe hulpbron&rdquo;.</p>
      <ul>
        <li><strong>Naam</strong> — Naam van de organisatie</li>
        <li><strong>Beschrijving</strong> — Wat doen ze? (B1-niveau)</li>
        <li><strong>Type</strong> — Gemeente, Thuiszorg, Vrijwilligers, etc.</li>
        <li><strong>Contactgegevens</strong> — Telefoon, e-mail, website, adres</li>
        <li><strong>Dekking</strong> — Landelijk, regionaal, per gemeente of per wijk</li>
        <li><strong>Zichtbaarheid per niveau</strong> — Toon bij Laag, Gemiddeld en/of Hoog belasting</li>
        <li><strong>Onderdeel test</strong> — Koppel aan een zorgtaak (bijv. &ldquo;Huishoudelijke taken&rdquo;)</li>
        <li><strong>Soort hulp</strong> — Bijv. &ldquo;Praktische hulp&rdquo;, &ldquo;Informatie en advies&rdquo;</li>
      </ul>

      <h3>CSV import</h3>
      <p>
        Grote aantallen hulpbronnen importeer je via CSV. Zie de sectie{" "}
        <strong>Data importeren</strong> voor het CSV-formaat.
      </p>

      <h3>Tips</h3>
      <ul>
        <li>Zet inactieve hulpbronnen op &ldquo;Inactief&rdquo; i.p.v. verwijderen — zo bewaar je de historie</li>
        <li>De &ldquo;Soort hulp&rdquo; bepaalt waar de hulpbron verschijnt in de zoekresultaten</li>
        <li>Hulpbronnen zonder gemeente worden als &ldquo;landelijk&rdquo; getoond</li>
      </ul>
    </>
  )
}

// ── APP CONTENT ──

function AppContentSectie() {
  return (
    <>
      <h2>App content beheren</h2>
      <p>
        Via <BeheerLink href="/beheer/app-content" label="App content" /> beheer je de teksten die gebruikers
        zien bij het eerste gebruik en in speciale secties van de app.
      </p>

      <h3>Content types</h3>
      <table>
        <thead><tr><th>Type</th><th>Waar verschijnt het?</th><th>Voorbeeld</th></tr></thead>
        <tbody>
          <tr>
            <td><strong>ONBOARDING</strong></td>
            <td>Welkomstschermen bij eerste keer inloggen</td>
            <td>&ldquo;Welkom bij MantelBuddy! Laten we je profiel instellen.&rdquo;</td>
          </tr>
          <tr>
            <td><strong>TUTORIAL</strong></td>
            <td>Uitleg bij functies (bijv. eerste balanstest)</td>
            <td>&ldquo;De balanstest duurt 5 minuten en helpt je inzicht te krijgen.&rdquo;</td>
          </tr>
          <tr>
            <td><strong>PAGINA_INTRO</strong></td>
            <td>Intro-tekst bovenaan pagina&apos;s</td>
            <td>De tekst bovenaan de hulppagina of marktplaats</td>
          </tr>
          <tr>
            <td><strong>FEATURE_CARD</strong></td>
            <td>Uitlichtkaarten op de landingspagina of dashboard</td>
            <td>&ldquo;Nieuw: doe de wekelijkse check-in!&rdquo;</td>
          </tr>
        </tbody>
      </table>

      <h3>Een content-item aanmaken</h3>
      <ul>
        <li><strong>Titel</strong> — Korte koptekst</li>
        <li><strong>Tekst</strong> — De inhoud (B1-niveau)</li>
        <li><strong>Type</strong> — Kies uit de vier types hierboven</li>
        <li><strong>Volgorde</strong> — Bepaalt de positie (lager = eerder)</li>
        <li><strong>Actief</strong> — Aan/uit zetten zonder te verwijderen</li>
      </ul>
    </>
  )
}

// ── BALANSTEST ──

function BalanstestSectie() {
  return (
    <>
      <h2>Balanstest en check-in beheren</h2>
      <p>
        De balanstest meet de belasting van mantelzorgers. De check-in is een korte wekelijkse peilmeting.
        Beide worden beheerd via <BeheerLink href="/beheer/balanstest-vragen" label="Balanstest & Check-in" />.
      </p>

      <h3>Balanstest vragen</h3>
      <p>De balanstest bestaat uit vragen die elk een score opleveren. Per vraag kun je instellen:</p>
      <ul>
        <li><strong>Tekst</strong> — De vraag (B1-niveau)</li>
        <li><strong>Gewicht</strong> — Hoe zwaar telt deze vraag mee (standaard 1)</li>
        <li><strong>Sectie</strong> — Groepering (bijv. &ldquo;Fysiek&rdquo;, &ldquo;Emotioneel&rdquo;, &ldquo;Sociaal&rdquo;)</li>
        <li><strong>Omgekeerd scoren</strong> — Voor positieve vragen (hogere score = beter)</li>
      </ul>

      <h3>Drempelwaardes</h3>
      <p>
        De totaalscore wordt ingedeeld in drie niveaus. Stel de grenzen in bij{" "}
        <BeheerLink href="/beheer/instellingen" label="Instellingen" />:
      </p>
      <table>
        <thead><tr><th>Niveau</th><th>Standaard bereik</th><th>Betekenis</th></tr></thead>
        <tbody>
          <tr><td className="text-green-700"><strong>Laag</strong></td><td>0 - 30</td><td>Beheersbare belasting</td></tr>
          <tr><td className="text-amber-700"><strong>Gemiddeld</strong></td><td>31 - 60</td><td>Aandacht nodig</td></tr>
          <tr><td className="text-red-700"><strong>Hoog</strong></td><td>61+</td><td>Overbelast, hulp nodig</td></tr>
        </tbody>
      </table>

      <h3>Zorgtaken</h3>
      <p>
        Zorgtaken worden apart beheerd via <BeheerLink href="/beheer/zorgtaken" label="Zorgtaken" />.
        Per taak registreert de mantelzorger het aantal uren en de zwaarte (nee/soms/ja).
      </p>
      <p>
        Op basis van taak + zwaarte + belastingniveau worden automatisch <strong>actiekaarten</strong> gegenereerd
        met concreet advies (bijv. &ldquo;Vraag thuiszorg aan via je gemeente&rdquo;).
      </p>

      <h3>Check-in vragen</h3>
      <p>
        Check-in vragen worden ook beheerd in <BeheerLink href="/beheer/balanstest-vragen" label="Balanstest & Check-in" />.
        Dit zijn korte vragen voor de wekelijkse/maandelijkse check-in.
      </p>
    </>
  )
}

// ── CATEGORIEËN ──

function CategorieenSectie() {
  return (
    <>
      <h2>Categorieën en formulier opties</h2>

      <h3>Categorieën</h3>
      <p>
        Via <BeheerLink href="/beheer/categorieen" label="Categorieën" /> beheer je de categorieën
        voor content en hulpvragen. Er zijn verschillende types:
      </p>
      <table>
        <thead><tr><th>Type</th><th>Waarvoor?</th><th>Voorbeeld</th></tr></thead>
        <tbody>
          <tr><td><strong>LEREN</strong></td><td>Hoofdcategorieën voor artikelen</td><td>&ldquo;Praktische tips&rdquo;, &ldquo;Zelfzorg&rdquo;</td></tr>
          <tr><td><strong>SUB_HOOFDSTUK</strong></td><td>Subcategorieën onder een hoofdcategorie</td><td>&ldquo;Hulpmiddelen aanvragen&rdquo; onder &ldquo;Rechten&rdquo;</td></tr>
          <tr><td><strong>HULPVRAAG</strong></td><td>Types hulpvragen</td><td>&ldquo;Huishouden&rdquo;, &ldquo;Vervoer&rdquo;</td></tr>
          <tr><td><strong>ZORGVRAGER</strong></td><td>Categorieën voor zorgvrager-hulp</td><td>&ldquo;Persoonlijke verzorging&rdquo;</td></tr>
          <tr><td><strong>MANTELZORGER</strong></td><td>Categorieën voor mantelzorger-hulp</td><td>&ldquo;Emotionele steun&rdquo;</td></tr>
        </tbody>
      </table>
      <p>
        Elke categorie heeft een <strong>slug</strong> (URL-vriendelijke naam), een <strong>emoji</strong>,
        een <strong>volgorde</strong>, en optioneel een <strong>bovenliggende categorie</strong> (voor hiërarchie).
      </p>

      <h3>Formulier opties</h3>
      <p>
        Via <BeheerLink href="/beheer/formulier-opties" label="Formulier opties" /> beheer je de keuzes
        in dropdown-menu&apos;s door de hele app. Opties zijn gegroepeerd per type:
      </p>
      <ul>
        <li><strong>RELATIE</strong> — Relatie tot de zorgvrager (partner, ouder, kind, etc.)</li>
        <li><strong>Overige groepen</strong> — Andere dropdowns die in formulieren voorkomen</li>
      </ul>
      <p>
        Per optie stel je een <strong>label</strong> (wat de gebruiker ziet), een <strong>waarde</strong> (wat in de database komt),
        en een <strong>volgorde</strong> in.
      </p>

      <LetOp>
        Wees voorzichtig met het wijzigen van bestaande waarden — dit kan historische data onleesbaar maken.
        Voeg liever nieuwe opties toe en deactiveer oude opties.
      </LetOp>
    </>
  )
}

// ── GEBRUIKERS ──

function GebruikersSectie() {
  return (
    <>
      <h2>Gebruikers beheren</h2>
      <p>
        Via <BeheerLink href="/beheer/gebruikers" label="Gebruikers" /> zie je alle geregistreerde accounts.
        Je kunt zoeken, filteren op rol, en gebruikers bewerken.
      </p>

      <h3>Rollen</h3>
      <table>
        <thead>
          <tr><th>Rol</th><th>Toegang</th><th>Hoe aanmaken?</th></tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>CAREGIVER</strong></td>
            <td>Dashboard, balanstest, check-in, hulpvragen, rapport</td>
            <td>Registreert zichzelf via de app</td>
          </tr>
          <tr>
            <td><strong>BUDDY</strong></td>
            <td>Profiel, marktplaats, beschikbaarheid</td>
            <td>Meldt zich aan als vrijwilliger, moet goedgekeurd worden</td>
          </tr>
          <tr>
            <td><strong>GEMEENTE_ADMIN</strong></td>
            <td>Gemeente-portal: statistieken, content, hulpbronnen</td>
            <td>Aanmaken via Gebruikers, koppelen aan gemeente</td>
          </tr>
          <tr>
            <td><strong>ADMIN</strong></td>
            <td>Volledig beheerpaneel (/beheer)</td>
            <td>Aanmaken via Gebruikers of database</td>
          </tr>
        </tbody>
      </table>

      <h3>Acties per gebruiker</h3>
      <p>Klik op een gebruiker om het detail-scherm te openen:</p>
      <ul>
        <li><strong>Rol wijzigen</strong> — Selecteer een andere rol</li>
        <li><strong>Account deactiveren</strong> — Blokkeert de toegang zonder te verwijderen</li>
        <li><strong>Wachtwoord resetten</strong> — Stuurt een reset-link naar het e-mailadres</li>
        <li><strong>Admin notities</strong> — Interne opmerkingen (niet zichtbaar voor de gebruiker)</li>
      </ul>

      <h3>Exporteren</h3>
      <p>
        Via <BeheerLink href="/beheer/instellingen" label="Instellingen" /> &rarr; &ldquo;Gebruikers exporteren&rdquo;
        download je een CSV met alle gebruikers.
      </p>
    </>
  )
}

// ── BUDDIES ──

function BuddiesSectie() {
  return (
    <>
      <h2>MantelBuddies beheren</h2>
      <p>
        MantelBuddies zijn vrijwilligers die mantelzorgers ondersteunen.
        Beheer ze via <BeheerLink href="/beheer/mantelbuddies" label="MantelBuddies" />.
      </p>

      <h3>Goedkeuringsproces</h3>
      <p>Een MantelBuddy doorloopt deze statussen:</p>
      <table>
        <thead><tr><th>Status</th><th>Betekenis</th><th>Actie</th></tr></thead>
        <tbody>
          <tr>
            <td><strong>AANGEMELD</strong></td>
            <td>Heeft zich aangemeld als vrijwilliger</td>
            <td>Beoordeel de aanmelding, controleer gegevens</td>
          </tr>
          <tr>
            <td><strong>GOEDGEKEURD</strong></td>
            <td>Aanmelding is beoordeeld en akkoord</td>
            <td>Wacht op VOG en/of training</td>
          </tr>
          <tr>
            <td><strong>ACTIEF</strong></td>
            <td>Volledig actief, zichtbaar op marktplaats</td>
            <td>Kan gekoppeld worden aan mantelzorgers</td>
          </tr>
          <tr>
            <td><strong>GEPAUZEERD</strong></td>
            <td>Tijdelijk niet beschikbaar</td>
            <td>Niet zichtbaar op marktplaats</td>
          </tr>
          <tr>
            <td><strong>GESTOPT</strong></td>
            <td>Definitief gestopt</td>
            <td>Niet meer actief</td>
          </tr>
        </tbody>
      </table>

      <h3>VOG en Training</h3>
      <p>Bij elke MantelBuddy kun je twee vinkjes instellen:</p>
      <ul>
        <li><strong>VOG goedgekeurd</strong> — De Verklaring Omtrent het Gedrag is ontvangen en akkoord</li>
        <li><strong>Training voltooid</strong> — De buddy heeft de vereiste training afgerond</li>
      </ul>
      <p>
        Beide vinkjes zijn optioneel maar worden aanbevolen voor kwaliteitsborging.
        Ze staan los van de statuswijziging — je kunt een buddy goedkeuren zonder VOG,
        maar het is best practice om beide af te vinken voordat je op &ldquo;Actief&rdquo; zet.
      </p>

      <h3>Filteren</h3>
      <p>
        Gebruik het statusfilter bovenaan de pagina om snel te zien welke buddies op beoordeling wachten.
        Filter op &ldquo;AANGEMELD&rdquo; om nieuwe aanmeldingen te zien.
      </p>
    </>
  )
}

// ── ALARMEN ──

function AlarmenSectie() {
  return (
    <>
      <h2>Alarmen en audit</h2>

      <h3>Alarmen</h3>
      <p>
        Het systeem genereert automatisch alarmen wanneer een mantelzorger een hoog risico vertoont.
        Bekijk en behandel ze via <BeheerLink href="/beheer/alarmen" label="Alarmen" />.
      </p>
      <p>Situaties die een alarm triggeren:</p>
      <ul>
        <li>Balanstest score boven de &ldquo;Hoog&rdquo; drempel</li>
        <li>Sterk verslechterende trend in check-ins</li>
        <li>Meerdere zware zorgtaken gecombineerd met hoog belastingniveau</li>
      </ul>

      <h3>Een alarm behandelen</h3>
      <Stap nummer={1} titel="Open het alarm">
        <p>Klik op een alarm om de details te zien (welke gebruiker, score, context).</p>
      </Stap>
      <Stap nummer={2} titel="Voeg een notitie toe">
        <p>Beschrijf welke actie je hebt ondernomen (bijv. &ldquo;Telefonisch contact gehad&rdquo;).</p>
      </Stap>
      <Stap nummer={3} titel="Markeer als behandeld">
        <p>Het alarm verdwijnt uit de &ldquo;Open&rdquo; lijst maar blijft in het archief.</p>
      </Stap>

      <h3>Audit Log</h3>
      <p>
        Alle beheeracties worden gelogd in de <BeheerLink href="/beheer/audit" label="Audit Log" />.
        Je ziet wie wat heeft gedaan en wanneer. Gebruik de filters om specifieke acties te zoeken.
        Acties die worden gelogd: aanmaken, bewerken, verwijderen van content, gebruikers, instellingen, etc.
      </p>
    </>
  )
}

// ── DATA ──

function DataSectie() {
  return (
    <>
      <h2>Data importeren en bijwerken</h2>
      <p>
        Via <BeheerLink href="/beheer/data-update" label="Data bijwerken" /> importeer je grote hoeveelheden data.
      </p>

      <h3>CSV importeren</h3>
      <p>Upload een CSV-bestand met hulpbronnen. Ondersteund formaat:</p>
      <table>
        <thead>
          <tr><th>Kolom</th><th>Verplicht</th><th>Voorbeeld</th></tr>
        </thead>
        <tbody>
          <tr><td>Naam organisatie</td><td>Ja</td><td>Stichting Present</td></tr>
          <tr><td>Omschrijving dienst</td><td>Nee</td><td>Vrijwillige thuishulp</td></tr>
          <tr><td>Gemeente</td><td>Nee</td><td>Zutphen</td></tr>
          <tr><td>Soort organisatie</td><td>Nee</td><td>VRIJWILLIGERS</td></tr>
          <tr><td>Soort hulp</td><td>Nee</td><td>Praktische hulp</td></tr>
          <tr><td>Naam dienst</td><td>Nee</td><td>Maaltijdservice</td></tr>
          <tr><td>Telefoonnummer</td><td>Nee</td><td>0575-123456</td></tr>
          <tr><td>Telefonisch te bereiken op</td><td>Nee</td><td>Ma-Vr 9:00-17:00</td></tr>
          <tr><td>Website</td><td>Nee</td><td>https://example.nl</td></tr>
          <tr><td>Kosten</td><td>Nee</td><td>Gratis</td></tr>
          <tr><td>Categorie</td><td>Nee</td><td>Huishoudelijke taken</td></tr>
          <tr><td>Doelgroep</td><td>Nee</td><td>MANTELZORGER of ZORGVRAGER</td></tr>
        </tbody>
      </table>
      <p>
        Het CSV-bestand mag tab-, puntkomma- of komma-gescheiden zijn.
        De eerste rij moet kolomnamen bevatten. Na upload zie je een preview.
      </p>

      <h3>Zutphen data laden</h3>
      <p>
        Er is een vooraf ingebouwde dataset voor de gemeente Zutphen.
        Klik op &ldquo;Zutphen data bijwerken&rdquo; om deze te laden.
      </p>
      <LetOp>
        Dit vervangt bestaande Zutphen-data. Handmatige wijzigingen aan Zutphen-hulpbronnen gaan verloren.
      </LetOp>

      <h3>Content keys laden</h3>
      <p>
        Op het <BeheerLink href="/beheer" label="Dashboard" /> staat de knop &ldquo;Content keys laden&rdquo;.
        Dit maakt alle bewerkbare SiteSettings-instellingen aan in de database (~42 keys voor branding,
        kleuren en teksten). Bestaande aanpassingen worden <strong>niet</strong> overschreven.
        Je kunt dit veilig meerdere keren uitvoeren.
      </p>
    </>
  )
}
