"use client"

import { useState } from "react"
import Link from "next/link"

type SectieId =
  | "overzicht"
  | "gemeente"
  | "huisstijl"
  | "artikelen"
  | "hulpbronnen"
  | "balanstest"
  | "gebruikers"
  | "alarmen"
  | "data"

const SECTIES: { id: SectieId; label: string; icon: string }[] = [
  { id: "overzicht", label: "Overzicht", icon: "📖" },
  { id: "gemeente", label: "Gemeente inrichten", icon: "🏛️" },
  { id: "huisstijl", label: "Logo & Huisstijl", icon: "🎨" },
  { id: "artikelen", label: "Artikelen & Tips", icon: "📝" },
  { id: "hulpbronnen", label: "Hulpbronnen", icon: "🏥" },
  { id: "balanstest", label: "Balanstest & Check-in", icon: "❓" },
  { id: "gebruikers", label: "Gebruikersbeheer", icon: "👥" },
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
        {actief === "gemeente" && <GemeenteSectie />}
        {actief === "huisstijl" && <HuisstijlSectie />}
        {actief === "artikelen" && <ArtikelenSectie />}
        {actief === "hulpbronnen" && <HulpbronnenSectie />}
        {actief === "balanstest" && <BalanstestSectie />}
        {actief === "gebruikers" && <GebruikersSectie />}
        {actief === "alarmen" && <AlarmenSectie />}
        {actief === "data" && <DataSectie />}
      </div>
    </div>
  )
}

// ============================================
// SECTIE COMPONENTEN
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
            <td>Artikelen publiceren, hulpbronnen toevoegen, app-teksten aanpassen</td>
            <td>Wekelijks/maandelijks</td>
          </tr>
          <tr>
            <td><strong>Test &amp; Vragen</strong></td>
            <td>Balanstest vragen beheren, zorgtaken configureren, intake aanpassen</td>
            <td>Bij opzet/wijziging</td>
          </tr>
          <tr>
            <td><strong>Inrichting</strong></td>
            <td>Gemeente toevoegen, huisstijl aanpassen, categorieën en formulieren</td>
            <td>Bij opzet/wijziging</td>
          </tr>
          <tr>
            <td><strong>Systeem</strong></td>
            <td>Audit log bekijken, data importeren, instellingen, deze handleiding</td>
            <td>Indien nodig</td>
          </tr>
        </tbody>
      </table>

      <h3>Eerste keer opstarten?</h3>
      <p>Als je het platform voor het eerst inricht, volg dan deze volgorde:</p>
      <ol>
        <li><strong>Content keys laden</strong> — Ga naar het <BeheerLink href="/beheer" label="Dashboard" /> en klik op &ldquo;Content keys laden&rdquo;</li>
        <li><strong>Huisstijl instellen</strong> — Stel je logo, kleuren en teksten in via <BeheerLink href="/beheer/huisstijl" label="Huisstijl & Teksten" /></li>
        <li><strong>Gemeente toevoegen</strong> — Voeg je gemeente(n) toe via <BeheerLink href="/beheer/gemeenten" label="Gemeenten" /></li>
        <li><strong>Hulpbronnen importeren</strong> — Importeer lokale hulporganisaties via <BeheerLink href="/beheer/data-update" label="Data bijwerken" /></li>
        <li><strong>Artikelen toevoegen</strong> — Publiceer tips en informatie via <BeheerLink href="/beheer/artikelen" label="Artikelen & Tips" /></li>
      </ol>
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

      <h3>Tips</h3>
      <ul>
        <li>Je kunt meerdere gemeenten toevoegen — elke gemeente krijgt eigen content</li>
        <li>Inactieve gemeenten worden niet getoond aan gebruikers</li>
        <li>Het advies per niveau verschijnt in het rapport en dashboard van de mantelzorger</li>
      </ul>
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

      <h3>Branding &amp; Logo</h3>
      <ul>
        <li><strong>Logo uploaden</strong> — Sleep een PNG, JPG of SVG (max 500KB) naar het uploadveld</li>
        <li><strong>App naam</strong> — De naam die overal in de app verschijnt</li>
        <li><strong>Tagline</strong> — Korte beschrijving onder de naam</li>
      </ul>

      <h3>Kleuren</h3>
      <p>Pas de kleuren aan van de app. Elke kleur heeft een kleurpicker en een tekstveld voor de hex-code.</p>
      <ul>
        <li><strong>Primaire kleur</strong> — Knoppen, links, accenten</li>
        <li><strong>Secundaire kleur</strong> — Achtergronden, badges</li>
        <li><strong>Accentkleuren</strong> — Rood (hoog), amber (gemiddeld), groen (laag)</li>
      </ul>
      <p>
        <strong>Let op:</strong> Wijzigingen worden pas actief na klikken op &ldquo;Opslaan&rdquo;.
        De floating balk onderaan toont hoeveel onopgeslagen wijzigingen er zijn.
      </p>

      <h3>Teksten</h3>
      <p>
        Hier pas je alle teksten aan die in de app verschijnen: begroetingen, knoppen, adviestksten, etc.
        Elke tekst heeft een sleutel (bijv. <code>advies.hoog-hulp.titel</code>) en een bewerkbare waarde.
      </p>

      <h3>Hoe het werkt (technisch)</h3>
      <p>
        Alle instellingen worden opgeslagen in de SiteSettings tabel in de database.
        De app laadt deze bij het starten. Na een wijziging wordt de cache automatisch ververst.
      </p>
      <p>
        Om alle teksten beschikbaar te maken, klik je eenmalig op &ldquo;Content keys laden&rdquo; op het <BeheerLink href="/beheer" label="Dashboard" />.
        Dit vult de SiteSettings tabel met alle bewerkbare teksten.
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
          <li><strong>Sub-hoofdstuk</strong> — Verschijnt automatisch per categorie</li>
          <li><strong>Type</strong> — Artikel, Tip, Gemeente nieuws, Video</li>
          <li><strong>Belastingniveau</strong> — Toon bij alle niveaus, of alleen bij Laag/Gemiddeld/Hoog</li>
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
        Gebruikers uit die gemeente zien het bericht in hun &ldquo;Info &amp; tips&rdquo; sectie.
      </p>

      <h3>Sortering</h3>
      <p>
        Gebruik het veld &ldquo;Sorteervolgorde&rdquo; om de positie te bepalen. Lager nummer = eerder getoond.
        Artikelen met hetzelfde nummer worden op publicatiedatum gesorteerd (nieuwste eerst).
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
      </ul>

      <h3>CSV import</h3>
      <p>
        Grote aantallen hulpbronnen importeer je via CSV. Ga naar <BeheerLink href="/beheer/data-update" label="Data bijwerken" />.
        Zie het tabblad &ldquo;Data importeren&rdquo; voor meer details over het CSV-formaat.
      </p>

      <h3>Tips</h3>
      <ul>
        <li>Zet inactieve hulpbronnen op &ldquo;Inactief&rdquo; i.p.v. verwijderen — zo bewaar je de historie</li>
        <li>De &ldquo;Soort hulp&rdquo; bepaalt waar de hulpbron verschijnt in de zoekresultaten</li>
        <li>Vul het veld &ldquo;Onderdeel test&rdquo; in om de hulpbron te koppelen aan een specifieke zorgtaak</li>
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
        <li><strong>Sectie</strong> — Groepering van vragen (bijv. &ldquo;Fysiek&rdquo;, &ldquo;Emotioneel&rdquo;)</li>
        <li><strong>Omgekeerd scoren</strong> — Voor positieve vragen (hogere score = beter)</li>
      </ul>

      <h3>Drempelwaardes</h3>
      <p>
        De score wordt ingedeeld in drie niveaus. Je stelt de grenzen in bij{" "}
        <BeheerLink href="/beheer/instellingen" label="Instellingen" />:
      </p>
      <ul>
        <li><strong className="text-green-700">Laag</strong> — Score 0 t/m drempel 1 (standaard 30)</li>
        <li><strong className="text-amber-700">Gemiddeld</strong> — Score drempel 1+1 t/m drempel 2 (standaard 60)</li>
        <li><strong className="text-red-700">Hoog</strong> — Score boven drempel 2</li>
      </ul>

      <h3>Zorgtaken</h3>
      <p>
        Zorgtaken (bijv. &ldquo;Persoonlijke verzorging&rdquo;, &ldquo;Huishoudelijke taken&rdquo;) worden apart beheerd via{" "}
        <BeheerLink href="/beheer/zorgtaken" label="Zorgtaken" />.
        Per taak registreert de mantelzorger het aantal uren en de zwaarte.
      </p>
      <p>
        Op basis van de combinatie taak + zwaarte + belastingniveau worden automatisch advieskaarten gegenereerd.
        De teksten hiervoor staan in de actiekaarten-configuratie.
      </p>
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
      </p>

      <h3>Rollen</h3>
      <table>
        <thead>
          <tr>
            <th>Rol</th>
            <th>Toegang</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>CAREGIVER</strong></td>
            <td>Mantelzorger — Dashboard, balanstest, check-in, hulpvragen</td>
          </tr>
          <tr>
            <td><strong>BUDDY</strong></td>
            <td>MantelBuddy — Profiel, marktplaats, beschikbaarheid</td>
          </tr>
          <tr>
            <td><strong>GEMEENTE_ADMIN</strong></td>
            <td>Gemeente beheerder — Beperkt beheer voor eigen gemeente</td>
          </tr>
          <tr>
            <td><strong>ADMIN</strong></td>
            <td>Platform beheerder — Volledig beheerpaneel</td>
          </tr>
        </tbody>
      </table>

      <h3>Acties</h3>
      <ul>
        <li><strong>Rol wijzigen</strong> — Klik op een gebruiker en wijzig de rol</li>
        <li><strong>Account deactiveren</strong> — Blokkeert de toegang zonder te verwijderen</li>
        <li><strong>Wachtwoord resetten</strong> — Stuurt een reset-link</li>
        <li><strong>Admin notities</strong> — Voeg interne opmerkingen toe (niet zichtbaar voor de gebruiker)</li>
      </ul>

      <h3>MantelBuddies</h3>
      <p>
        Nieuwe MantelBuddy-aanmeldingen moeten worden goedgekeurd via{" "}
        <BeheerLink href="/beheer/mantelbuddies" label="MantelBuddies" />.
        Je kunt de status wijzigen: Aangemeld → Goedgekeurd → Actief → Gepauzeerd → Gestopt.
      </p>

      <h3>Exporteren</h3>
      <p>
        Via <BeheerLink href="/beheer/instellingen" label="Instellingen" /> kun je alle gebruikers exporteren als CSV-bestand.
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
        Het systeem genereert automatisch alarmen wanneer een mantelzorger een hoog risico heeft.
        Bekijk en behandel ze via <BeheerLink href="/beheer/alarmen" label="Alarmen" />.
      </p>
      <ul>
        <li><strong>Open</strong> — Nog niet behandeld, vereist aandacht</li>
        <li><strong>Behandeld</strong> — Afgehandeld met notitie</li>
      </ul>
      <p>
        Klik op een alarm om details te zien. Voeg een notitie toe en markeer als behandeld.
      </p>

      <h3>Audit Log</h3>
      <p>
        Alle beheeracties worden gelogd in de <BeheerLink href="/beheer/audit" label="Audit Log" />.
        Je ziet wie wat heeft gedaan en wanneer. Gebruik de filters om specifieke acties te zoeken.
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
      <p>Upload een CSV-bestand met hulpbronnen. Het bestand moet de volgende kolommen bevatten:</p>
      <table>
        <thead>
          <tr>
            <th>Kolom</th>
            <th>Verplicht</th>
            <th>Voorbeeld</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>Naam organisatie</td><td>Ja</td><td>Stichting Present</td></tr>
          <tr><td>Omschrijving dienst</td><td>Nee</td><td>Vrijwillige thuishulp</td></tr>
          <tr><td>Gemeente</td><td>Nee</td><td>Zutphen</td></tr>
          <tr><td>Soort organisatie</td><td>Nee</td><td>VRIJWILLIGERS</td></tr>
          <tr><td>Soort hulp</td><td>Nee</td><td>Praktische hulp</td></tr>
          <tr><td>Telefoonnummer</td><td>Nee</td><td>0575-123456</td></tr>
          <tr><td>Website</td><td>Nee</td><td>https://example.nl</td></tr>
          <tr><td>Kosten</td><td>Nee</td><td>Gratis</td></tr>
          <tr><td>Categorie</td><td>Nee</td><td>Huishoudelijke taken</td></tr>
          <tr><td>Doelgroep</td><td>Nee</td><td>MANTELZORGER</td></tr>
        </tbody>
      </table>
      <p>
        Het CSV-bestand mag tab-, puntkomma- of komma-gescheiden zijn.
        De eerste rij moet kolomnamen bevatten.
      </p>

      <h3>Zutphen data laden</h3>
      <p>
        Er is een vooraf ingebouwde dataset voor de gemeente Zutphen.
        Klik op &ldquo;Zutphen data bijwerken&rdquo; om deze te laden.
        <strong> Let op:</strong> dit vervangt bestaande Zutphen-data.
      </p>

      <h3>Content keys laden</h3>
      <p>
        Op het <BeheerLink href="/beheer" label="Dashboard" /> staat de knop &ldquo;Content keys laden&rdquo;.
        Dit vult de SiteSettings tabel met alle bewerkbare teksten.
        Bestaande aanpassingen worden <strong>niet</strong> overschreven.
      </p>
    </>
  )
}
