# MatenBuddy - Doorontwikkelplan & Verbeteringsoverzicht

**Datum:** 24 februari 2026
**Versie:** 1.3 (bijgewerkt na infrastructuur & architectuur verbeteringen)
**Project:** MatenBuddy (Mantelzorg-app)

---

## Inhoudsopgave

1. [Huidige Status](#1-huidige-status)
2. [Module A: Beheeromgeving (Admin Portal)](#2-module-a-beheeromgeving-admin-portal)
3. [Module B: Klantreis & Begeleiding](#3-module-b-klantreis--begeleiding-mantelzorger)
4. [Module C: UI/UX voor Oudere Gebruikers](#4-module-c-uiux-optimalisatie-voor-oudere-gebruikers)
5. [Module D: Gemeenteportaal](#5-module-d-gemeenteportaal--dashboard)
6. [Module E: MantelBuddy Marktplaats](#6-module-e-mantelbuddy-marktplaats--vrijwilligersomgeving)
7. [Module F: Eigen Suggesties & Innovatie](#7-module-f-eigen-suggesties--innovatie)
8. [Technische Verbeteringen](#8-technische-verbeteringen)
9. [Prioritering & Fasering](#9-prioritering--fasering)
10. [Risico's & Aandachtspunten](#10-risicos--aandachtspunten)

---

## 1. Huidige Status

> **Baseline versie: v2.5.0** (22 februari 2026)
> Deze versie is getagd in Git en kan altijd worden teruggezet als referentiepunt.

### Wat er nu is

| Onderdeel | Status | Toelichting |
|-----------|--------|-------------|
| Registratie & Login | Werkend | Email/wachtwoord, magic links, WhatsApp login |
| Belastbaarheidstest | Werkend | 11 vragen, 4 categorieën, scoreberekening, B1-teksten, helptekst bij velden |
| Dashboard | Werkend | Welzijnsoverzicht, thermometer, compact MantelBuddy blok, warme welkomst |
| Hulpvragen | Werkend | Zoeken op gemeente, filterbadges met aantallen, kleur-indicatoren per taakstatus |
| Leren/Informatie-sectie | Werkend | 44 artikelen met B1-inhoud, klikbare kaarten met detail-modal, sub-hoofdstukken, bronlabels |
| Gemeente-nieuws | Werkend | Per-item gelezen markering, "alles gelezen" knop, nieuw-bolletje |
| Favorieten | Werkend | Bookmarken van hulpbronnen en artikelen, afvinken als afgerond |
| WhatsApp Bot | Werkend | Belastbaarheidstest, registratie, menu via Twilio |
| ContentModal | Werkend | Bottom sheet (mobiel), centered popup (desktop), ESC-toets, Bellen/Website knoppen |
| MantelBuddy aanmelding | Alleen registratieformulier | Geen matching, taken, of beoordelingen |
| Beheeromgeving | Basis werkend | Hulpbronnen beheer met openingstijden, kosten, zorgverzekeraar; CSV-import; gebruikersbeheer, artikelenbeheer, alarmen |
| Gemeenteportaal | Basis werkend | Hulpbronnen beheer, gebruikersbeheer, gemeentenieuws, evenementen, content; k-anonimiteit dashboard |
| Maandelijkse check-in | Basis werkend | 5-puntsschaal welzijnscheck |
| PDF Rapport | Werkend | Download belastbaarheidstest resultaten |
| Balanstest overzicht | Werkend | Score verloop grafiek met legenda-uitleg, thermometer, takengrafieken |
| Profiel | Werkend | Persoonsgegevens, naaste-info, Jouw reis mijlpalen tijdlijn |

### Wat recent is verbeterd (v2.5.0)

- **Content-architectuur**: Artikelen nu database-driven i.p.v. hardcoded, met seed routes voor initialisatie
- **B1 taalniveau**: Alle 44 artikelinhouden herschreven in begrijpelijk Nederlands
- **TypeScript type-safety**: Proper interfaces voor alle state-variabelen (geen `any` meer in dashboard-pagina's)
- **Error logging**: Alle stille `catch {}` blokken vervangen door `console.error` voor debugging
- **Database performance**: Indexes toegevoegd op veelgebruikte query-kolommen (Account, Session, Notification, BelastbaarheidTest, HelpRequest)
- **Naamgeving**: "Respijtzorg" overal vervangen door "Vervangende mantelzorg"
- **Modal UX**: Dubbele sluiten-knop verwijderd, ESC-toets toegevoegd, dark mode fix
- **Productie-config**: ngrok-header alleen in development

### Wat recent is verbeterd (na v2.5.0, 24 feb 2026)

#### Dashboard & Navigatie
- **Dashboard opgeschoond**: Trend-banner, vervolgstappen en welzijnsgrafiek verwijderd voor overzichtelijkheid
- **Jouw reis verplaatst**: Mijlpalen-tijdlijn verplaatst van dashboard naar profielpagina
- **MantelBuddy blok compact**: Van groot kaartblok naar compacte klikbare rij
- **Filterbadges hulpvragen**: Lokaal/Alles filterknoppen tonen nu aantallen in bolletjes

#### Beheeromgeving (Admin & Gemeente)
- **Openingstijden veld**: Toegevoegd aan zowel beheer als gemeente hulpbronnenpagina's
- **Kosten veld**: Zichtbaar en bewerkbaar in beide beheeromgevingen
- **Zorgverzekeraar dropdown**: Van checkbox naar Ja/Nee dropdown
- **CSV-import uitgebreid**: Kolommen "Telefonisch te bereiken op", "Wanneer en/of Openingstijden", "Openingstijden" worden nu allemaal gemapped
- **Gemeente API**: PUT endpoint uitgebreid met openingstijden en kosten

#### UI/UX Toegankelijkheid (65+ doelgroep)
- **WCAG AA kleuren**: Amber (#F57C00 → #C86800) en rood (#C62828 → #B71C1C) contrastverbeteringen
- **Touch targets**: Alle knoppen minimaal 44px, radio buttons vergroot naar 2rem
- **Navigatie-tekst**: Mobiele navigatie lettergrootte verhoogd naar 0.875rem
- **B1-teksten app-breed**: Alle pagina-teksten herschreven: kort, helder, max 15 woorden per zin
- **Grafieklegenda's**: Uitleg toegevoegd boven score- en takengrafieken
- **Aanspreekvorm consistent**: "uw/u" → "je" in gemeente-pagina's, "jij" → "je" door hele app
- **Foutmeldingen gestandaardiseerd**: Geen technische details meer aan gebruikers, consistent B1 Nederlands
- **Warme illustraties**: Zachte primaire kleur achtergronden bij lege states
- **Helptekst formuliervelden**: Privacy-uitleg, betere validatiemeldingen

### Wat recent is verbeterd (v1.3, 24 feb 2026 - infrastructuur & architectuur)

#### Admin UI verbeteringen (punten 3-6)
- **AdminSpinner component**: Gedeelde animated spinner vervangt subtiele "Laden..." tekst in alle 17 beheer- en 10 gemeentepagina's
- **AdminEmptyState component**: Begeleiding bij lege lijsten met icon, titel, beschrijving en actieknop
- **AdminModal component**: Herbruikbare modal met ARIA role="dialog", aria-modal, aria-labelledby, focus trap, ESC-toets, backdrop click
- **Formulier feedback**: Toast notificaties voor success/error na CRUD-operaties in admin-formulieren

#### Infrastructuur & Beveiliging (punten 7-9)
- **Email service** (`src/lib/email.ts`): SMTP via nodemailer met fallback naar console.log; HTML-templates voor verificatie, wachtwoord-reset en welkomstmail
- **Rate limiting** (`src/lib/rate-limit.ts`): In-memory rate limiter op alle auth endpoints (login: 5/5min, register: 3/10min, forgot-password: 3/10min)
- **Zod validatie** (`src/lib/validations.ts`): Zod v4 schema's voor login, register, forgot-password, reset-password, artikel, hulpbron, check-in; `validateBody()` helper

#### Klantreis & Dashboard (punten 10-13)
- **Onboarding flow**: Reeds aanwezig - 5-staps welkomstflow in `src/components/Onboarding.tsx`
- **Gepersonaliseerde aanbevelingen**: Reeds aanwezig - dashboard toont relevante hulpbronnen en artikelen op basis van score
- **Check-in smart frequency**: Reeds aanwezig - LAAG: maandelijks, GEMIDDELD: tweewekelijks, HOOG: wekelijks
- **Dynamisch advies engine** (`src/lib/dashboard/advies.ts`): Geprioriteerde adviezen op basis van belastingniveau, trend, wellbeing en activiteit

#### Technische Architectuur (punten 14-16)
- **Vitest test framework**: 29 tests in 3 testbestanden (rate-limit, validations, advies); `vitest.config.ts` met @ alias support
- **Redis session store** (`src/lib/session-store.ts`): Abstract `SessionStore<T>` interface met in-memory en Redis backends; auto-detectie via REDIS_URL
- **Dashboard route gesplitst**: Van 782 → ~260 regels; modules geëxtraheerd naar `src/lib/dashboard/` (hulpbronnen, artikelen, mijlpalen, advies)

### Wat ontbreekt / nog te verbeteren

#### Hoge prioriteit
- ~~**ContentModal velden tonen**~~ ✅ **Gedaan** - soortHulp, doelgroep en bronLabel worden nu getoond
- ~~**ContentModal ARIA-attributen**~~ ✅ **Gedaan** - role="dialog", aria-modal, aria-labelledby, focus trap
- ~~**E-mailnotificaties**~~ ✅ **Gedaan** - SMTP email service met HTML-templates
- ~~**Geautomatiseerde tests**~~ ✅ **Gedaan** - Vitest met 29 tests
- ~~**Input validatie met Zod**~~ ✅ **Gedaan** - Zod v4 schema's op auth routes
- ~~**Rate limiting op API endpoints**~~ ✅ **Gedaan** - In-memory rate limiter op alle auth endpoints

#### Gemiddelde prioriteit
- ~~**Admin laadstaten**~~ ✅ **Gedaan** - AdminSpinner in alle beheer/gemeente pagina's
- ~~**Admin lege states**~~ ✅ **Gedaan** - AdminEmptyState met begeleiding in alle pagina's
- ~~**Herbruikbare AdminModal**~~ ✅ **Gedaan** - Gedeeld component met ARIA en focus trap
- **Admin tabellen mobiel**: Horizontaal scrollen op tablets/mobiel is lastig
- ~~**Formulier feedback**~~ ✅ **Gedaan** - Toast notificaties na CRUD-operaties

#### Toekomstig (ongewijzigd)
- Klantreis-begeleiding en stapsgewijze progressieve onboarding
- MantelBuddy marktplaats en matching
- Gemeenteportaal met demografische inzichten en trend-analyses
- Noodknop / SOS-functie
- Mantelzorg-dagboek

---

## 2. Module A: Beheeromgeving (Admin Portal)

### A1. Authenticatie & Autorisatie voor Beheerders

**Doel:** Veilige, rolgebaseerde toegang tot de beheeromgeving.

**Huidig:** Er bestaat een `UserRole` enum met `ADMIN`, `ORG_ADMIN`, `ORG_MEMBER`. Admin login (`/beheer/login`) is werkend met rolcontrole. Basis admin-interface aanwezig met hulpbronnen, artikelen, gebruikers, alarmen, categorieën, formulieropties en app-content beheer.

**Te bouwen:**
- **Admin login pagina** (`/beheer/login`) met extra beveiligingslaag (2FA optioneel)
- **Rolgebaseerde toegang:**
  - `SUPER_ADMIN` - Volledige toegang tot alle modules en instellingen
  - `ADMIN` - Beheer van content, gebruikers, en rapportages
  - `ORG_ADMIN` - Beheer van eigen organisatie en gekoppelde mantelzorgers
  - `GEMEENTE_ADMIN` - Toegang tot gemeenteportaal en geanonimiseerde data
- **Middleware uitbreiding** in `src/middleware.ts` voor `/beheer/*` routes
- **Audit logging** - Wie heeft wanneer wat gewijzigd

### A2. Content Management (CMS)

**Doel:** Alle informatie, tips, hulpbronnen en artikelen beheren zonder code-aanpassingen.

**Huidig (v2.5.0):** Artikelen staan nu in de database (Prisma `Artikel` model) met B1-niveau inhoud. Seed routes vullen de database met 44 artikelen. Hulpbronnen worden via de API beheerd maar met beperkte interface. De hardcoded `artikelen.ts` is vervangen door database-queries.

**Te bouwen:**

#### A2.1 Artikelen & Tips Beheer
- **CRUD interface** voor artikelen met:
  - Titel, samenvatting, volledige inhoud (rich text editor)
  - Categorie-toewijzing (Emotioneel welzijn, Praktische hulp, etc.)
  - Tags voor zoekfunctie
  - Publicatiestatus (concept / gepubliceerd / gearchiveerd)
  - Publicatiedatum en sortering
  - Koppeling aan belastbaarheidsniveau (LAAG/GEMIDDELD/HOOG)
  - Doelgroep (alle mantelzorgers / specifieke situatie)
- **Media-upload** voor afbeeldingen bij artikelen
- **Preview-functie** om te zien hoe het artikel eruitziet voor de gebruiker
- ~~**Database migratie** - Artikelen verplaatsen van `artikelen.ts` naar database~~ ✅ **Gedaan (v2.5.0)** - Artikelen nu in Prisma database met seed routes

#### A2.2 Hulpbronnen & Organisaties Beheer
- **Uitbreiding bestaand beheer** (`/beheer/hulpbronnen`):
  - ~~Bulk import/export (CSV/Excel)~~ ✅ **Gedaan** - CSV-import met kolomherkenning (naam, dienst, telefoon, openingstijden, kosten, categorie, gemeente, type, website)
  - Filteren en zoeken op gemeente, categorie, status
  - Contactgegevens validatie
  - ~~Openingstijden en beschikbaarheid~~ ✅ **Gedaan** - Openingstijden veld in beheer + gemeente, vanuit CSV-import
  - ~~Koppeling aan specifieke hulpcategorieen~~ ✅ **Gedaan** - Categorie-mapping en onderdeel mantelzorgtest
  - ~~Kosten veld~~ ✅ **Gedaan** - Kosten zichtbaar en bewerkbaar in beheer + gemeente
  - ~~Zorgverzekeraar veld~~ ✅ **Gedaan** - Dropdown (Ja/Nee) i.p.v. checkbox
- **Organisatie-verificatie workflow** - Nieuwe organisaties controleren voor publicatie
- **Zorgorganisatie-kaart** - Visuele kaart met alle hulpbronnen per gemeente

#### A2.3 Gemeentenieuws Beheer
- **Per gemeente** nieuws en updates publiceren
- **Notificatie-triggers** - Automatisch notificatie sturen bij nieuw gemeentenieuws
- **Planning** - Artikelen inplannen voor toekomstige publicatie

### A3. Gebruikersbeheer

**Doel:** Overzicht en beheer van alle gebruikers vanuit een centraal portaal.

**Te bouwen:**

#### A3.1 Gebruikersoverzicht
- **Tabel met alle gebruikers** inclusief:
  - Naam, email, telefoon, gemeente
  - Rol (Mantelzorger, MantelBuddy, Organisatie, Admin)
  - Registratiedatum en laatste activiteit
  - Belastbaarheidsscore (laatst gemeten)
  - Status (actief / inactief / geblokkeerd)
  - Onboarding-voortgang
- **Geavanceerd filteren:**
  - Op rol, gemeente, belastbaarheidsniveau
  - Op registratieperiode
  - Op activiteit (wel/niet actief afgelopen 30 dagen)
  - Op alarmstatus (actieve alarmen)
- **Zoekfunctie** op naam, email, telefoonnummer
- **Export** naar CSV/Excel

#### A3.2 Gebruiker Detailpagina
- **Profiel bekijken** (niet bewerken tenzij noodzakelijk - privacy)
- **Activiteitslog** - Logins, tests gedaan, hulpvragen gesteld
- **Belastbaarheidshistorie** - Alle testresultaten over tijd in grafiek
- **Notities** - Interne notities van beheerders (niet zichtbaar voor gebruiker)
- **Acties:**
  - Account activeren/deactiveren
  - Wachtwoord reset link sturen
  - Rol wijzigen
  - Account verwijderen (met bevestiging en AVG-compliance)

#### A3.3 MantelBuddy Beheer
- **Aanmeldingen overzicht** met status (AANGEMELD -> GOEDGEKEURD)
- **VOG-verificatie workflow** - Checklist voor verklaring omtrent gedrag
- **Training-tracking** - Welke training is voltooid
- **Beoordeling dashboard** - Gemiddelde scores, klachten
- **Matching overzicht** - Welke buddy is aan welke mantelzorger gekoppeld

#### A3.4 Alarm & Signalering Dashboard
- **Overzicht actieve alarmen** uit `AlarmLog`
- **Signaaldetectie:**
  - Hoge belasting (score >= 18)
  - Sociaal isolement (sociale score <= 2)
  - Veel zorguren (> 40 uur/week)
  - Snelle verslechtering (score > 4 punten gestegen)
  - Langdurig geen activiteit
- **Actie-opvolging** - Beheerder kan alarm als "opgepakt" markeren
- **Escalatie** - Automatisch mailen bij kritieke alarmen

### A4. Systeem & Instellingen

**Te bouwen:**
- **Applicatie-instellingen** - Belastbaarheidstest drempelwaardes, notificatie-instellingen
- **Email-templates** beheren (welkomstmail, wachtwoord reset, alarm)
- **WhatsApp-templates** beheren
- **Statistieken dashboard:**
  - Aantal actieve gebruikers per week/maand
  - Gemiddelde belastbaarheidsscore per gemeente
  - Meest bezochte artikelen
  - Conversie registratie -> onboarding voltooid
  - Aantal hulpvragen gesteld vs beantwoord

---

## 3. Module B: Klantreis & Begeleiding Mantelzorger

### B1. Onboarding Flow (Stapsgewijze Introductie)

**Doel:** De mantelzorger stap voor stap meenemen, zodat elke stap begrijpelijk is en direct waarde biedt.

**Huidig:** Er is een intake-formulier en een belastbaarheidstest, maar de samenhang en begeleiding ontbreekt.

**Te bouwen:**

#### B1.1 Welkomstflow (na registratie)
```
Stap 1: Welkomstscherm
"Welkom bij MatenBuddy! Wij helpen jou als mantelzorger.
 Wij gaan je een paar vragen stellen zodat we je goed kunnen helpen."
 [Begin ->]

Stap 2: Wie ben jij?
- Voornaam (al ingevuld vanuit registratie)
- Woonplaats/gemeente
- "Voor wie zorg je?" (partner / ouder / kind / ander familielid / kennis)
 [Volgende ->]

Stap 3: Jouw zorgsituatie
- "Hoeveel uur per week besteed je ongeveer aan mantelzorg?"
  (slider: 0-5 / 5-10 / 10-20 / 20-40 / meer dan 40)
- "Hoe lang zorg je al?"
  (minder dan 1 jaar / 1-3 jaar / 3-5 jaar / meer dan 5 jaar)
 [Volgende ->]

Stap 4: Eerste belastbaarheidstest
"We willen graag weten hoe het met je gaat.
 Beantwoord de volgende vragen eerlijk - er zijn geen foute antwoorden."
 [Start de test ->]

Stap 5: Persoonlijk resultaat
- Score visualisatie met thermometer
- "Jouw score is [X]. Dit betekent [uitleg in eenvoudige taal]"
- "Wij raden je aan om te beginnen met..."
- 3 concrete, gepersonaliseerde aanbevelingen
 [Naar mijn dashboard ->]
```

#### B1.2 Progressieve Onboarding (na eerste bezoek)
Niet alles tegelijk tonen, maar stapsgewijs functies introduceren:

**Week 1:** Dashboard + Belastbaarheidstest resultaat + 1 relevant artikel
**Week 2:** "Ken je de hulporganisaties in jouw gemeente?" -> Hulpvragen sectie
**Week 3:** "Hoe gaat het nu met je?" -> Eerste check-in herinnering
**Week 4:** "Wist je dat vrijwilligers je kunnen helpen?" -> MantelBuddy introductie

Elk nieuw onderdeel wordt geintroduceerd met:
- Een korte uitleg (1-2 zinnen, B1-niveau)
- Een visuele highlight/tooltip
- Een "Later bekijken" optie

### B2. Gepersonaliseerde Klantreis

**Doel:** Op basis van het profiel en de belastbaarheidsscore de juiste hulp op het juiste moment aanbieden.

**Te bouwen:**

#### B2.1 Dynamisch Hulpadvies
Op basis van de belastbaarheidsscore automatisch de juiste content tonen:

**Score LAAG (0-8):** Preventief
- Tips voor zelfzorg en ontspanning
- Informatieve artikelen over rechten en regelingen
- Uitnodiging voor maandelijkse check-in
- "Je doet het goed! Vergeet jezelf niet."

**Score GEMIDDELD (9-16):** Ondersteunend
- Concrete hulpbronnen in de gemeente tonen
- MantelBuddy suggestie voor praktische hulp
- Artikelen over stress-signalen herkennen
- Check-in frequentie verhogen (2x per maand)
- "Het is slim om nu hulp te zoeken, voordat het teveel wordt."

**Score HOOG (17-24):** Urgent
- Direct hulpbronnen tonen met urgente contactgegevens
- Proactief MantelBuddy matching voorstellen
- Huisarts-advies tonen
- Alarm triggeren bij beheerder
- Wekelijkse check-in aanbieden
- "Je draagt veel. Het is belangrijk dat je hulp vraagt. Dat is niet zwak, dat is slim."

#### B2.2 Slimme Aanbevelingen Engine
- **"Aanbevolen voor jou"** sectie op dashboard
- Gebaseerd op:
  - Belastbaarheidsscore per categorie (fysiek, emotioneel, sociaal, praktisch)
  - Gemeente (lokale hulpbronnen)
  - Zorgsituatie (type zorgvrager, uren per week)
  - Eerder bekeken artikelen en favorieten
  - Seizoensgebonden tips (winter: eenzaamheid, zomer: vakantie-vervanging)

#### B2.3 Mijlpalen & Motivatie
- **"Jouw reis"** tijdlijn die laat zien:
  - Wanneer geregistreerd
  - Eerste test gedaan
  - Eerste artikel gelezen
  - Eerste hulpvraag gesteld
  - Eerste check-in gedaan
  - Score-trend over tijd
- **Positieve feedback** bij verbetering:
  - "Je score is gedaald van 18 naar 14. Goed bezig!"
- **Zachte nudges** bij verslechtering:
  - "Je score is gestegen. Wil je kijken welke hulp er is?"

### B3. Check-in Systeem Uitbreiding

**Huidig:** Eenvoudige 5-puntsschaal.

**Te bouwen:**
- **Slimme frequentie** - Bij hogere scores vaker check-in aanbieden
- **Trend-analyse** - Grafiek van welzijn over tijd op dashboard
- **Contextuele vragen** - Na de score doorvragen:
  - "Wat maakt het zwaar op dit moment?" (keuzeopties)
  - "Wil je hulp zoeken?" -> Direct naar relevante hulpbron
- **WhatsApp check-in** - Automatisch bericht via WhatsApp voor check-in
- **Buddy-notificatie** - Bij sterke daling MantelBuddy op de hoogte stellen (indien gekoppeld)

---

## 4. Module C: UI/UX Optimalisatie voor Oudere Gebruikers

### C1. Visueel Ontwerp

**Doel:** Interface die intuietief en prettig is voor gebruikers van 60+.

**Te bouwen/verbeteren:**

#### C1.1 Typografie & Leesbaarheid
- **Minimale lettergrootte:** 18px voor bodytekst (nu soms 14-16px)
- **Koppen:** Duidelijk hierarchie, 24-32px
- **Regelafstand:** Minimaal 1.6 (nu soms 1.4)
- **Lettertype:** Blijf bij sans-serif, overweeg lettertype specifiek geoptimaliseerd voor leesbaarheid (bv. Atkinson Hyperlegible)
- ~~**Contrast:** WCAG AA niveau~~ ✅ **Gedaan** - Amber (#C86800) en rood (#B71C1C) aangepast voor WCAG AA compliance

#### C1.2 Knoppen & Interactie-elementen
- ~~**Minimale klikgrootte:** 44x44px consequent doorvoeren~~ ✅ **Gedaan** - ker-btn-sm min-height 44px, radio buttons 2rem met 3px border
- **Duidelijke hover/focus states** - Zichtbare rand bij focus (toetsenbordgebruik)
- **Knoppen:** Altijd met tekst, nooit alleen een icoon
- ~~**Actieknoppen:** Duidelijke actie-tekst~~ ✅ **Gedaan** - "Doe de test" → "Start de balanstest", "Bekijken" → "Bekijk resultaat", etc.
- **Bevestiging bij destructieve acties** - Extra stap bij verwijderen/annuleren

#### C1.3 Kleurgebruik
- **Hoog contrast modus** als optie (niet alleen dark/light)
- **Kleur nooit als enige indicator** - Altijd iconen of tekst erbij
- **Consistente kleurbetekenis:**
  - Groen = positief/succes
  - Oranje = aandacht/waarschuwing
  - Rood = urgent/fout (spaarzaam gebruiken)
  - Blauw = informatie/links

#### C1.4 Layout & Navigatie
- **Minder elementen per scherm** - Maximaal 3-4 keuzes tegelijk
- **Geen scrollbare tabellen** op mobiel
- **Breadcrumbs** voor navigatie-context ("Dashboard > Leren > Emotioneel welzijn")
- **"Terug" knop** altijd zichtbaar en duidelijk
- **Vaste navigatie** - Menu altijd op dezelfde plek

### C2. Tekstuele Begeleiding

**Doel:** Elke pagina bevat heldere, warme uitleg in B1-niveau Nederlands.

**Te bouwen:**

#### C2.1 Pagina-introductieteksten ✅ Gedaan
Elke pagina begint met een kort, warm welkomstblok (via `<PageIntro>` component):

- **Dashboard:** "Hier zie je hoe het met je gaat. Scrol naar beneden voor tips en hulp."
- **Belastbaarheidstest:** Introductietekst met 2-delige uitleg en B1-taal
- **Hulpvragen:** Intro per tab met uitleg over lokale/landelijke hulp
- **Leren:** "Hier vind je artikelen en tips die passen bij je situatie."
- **Rapport:** "Doe eerst de balanstest. Dan zie je hier je resultaten en tips die bij je passen."

#### C2.2 Contextuele Hulpteksten (deels gedaan)
- ~~**Foutmeldingen** in begrijpelijke taal~~ ✅ **Gedaan** - Alle foutmeldingen in B1 Nederlands, geen technische details
  - "Je e-mail of wachtwoord is niet goed. Probeer het opnieuw."
  - "Je telefoonnummer klopt niet. Gebruik het formaat: 06 12345678"
  - Global error: "Er ging iets mis bij het laden van de pagina. Lukt het niet? Sluit de app en open hem opnieuw."
- ~~**Helptekst bij formuliervelden**~~ ✅ **Gedaan** - Labels, placeholders, en helptekst bij email, wachtwoord, adres, privacy
- **Stap-indicatoren** bij formulieren ✅ Aanwezig ("stap X van 3")
- **Tooltips** bij elk invoerveld - Nog uit te breiden
- **Bevestigingsmeldingen** na acties - Deels aanwezig (toast bij login/registratie)

#### C2.3 Hulp & Uitleg Systeem
- **"Hoe werkt dit?"** knop op elke pagina
  - Opent een overlay met stap-voor-stap uitleg met screenshots
  - Optie om dit scherm niet meer te tonen
- **Video-uitleg** optie voor complexere functies (belastbaarheidstest, hulpvraag stellen)
- **"Hulp nodig?"** floating button
  - Veelgestelde vragen
  - Bel-optie voor telefonische hulp
  - WhatsApp-optie

### C3. Toegankelijkheid (Accessibility)

**Te bouwen/verbeteren:**
- **WCAG 2.1 AA kleurcontrast** ✅ **Gedaan** - Amber en rood kleuren aangepast
- **Screen reader ondersteuning** - aria-labels aanwezig; ContentModal en AdminModal hebben role="dialog", aria-modal, aria-labelledby, focus trap ✅
- **Toetsenbordnavigatie** - ESC-toets op modals ✅; verdere toetsenbordnavigatie nog nodig
- **Tekst vergrotingsmodus** - AccessibilityProvider aanwezig met high-contrast, large-text, reduce-motion
- ~~**Taalgebruik audit** - Alle teksten B1-niveau~~ ✅ **Gedaan** - Alle pagina's herschreven in B1 Nederlands, consistent "je" aanspreekvorm
- **Mobiele navigatie lettergrootte** ✅ **Gedaan** - Verhoogd naar 0.875rem

### C4. Mobiele Ervaring

**Te verbeteren:**
- **Grotere touch targets** op mobiel (minimaal 48x48px)
- **Swipe-navigatie** waar logisch (bijv. door artikelen bladeren)
- **Offline-modus** voor basisinformatie (favorieten, laatst gelezen artikelen)
- **App-achtige ervaring** via PWA (Progressive Web App)
  - Installeerbaar op thuisscherm
  - Push-notificaties
  - Offline beschikbaarheid

---

## 5. Module D: Gemeenteportaal & Dashboard

### D1. Gemeente Dashboard

**Doel:** Gemeenten inzicht geven in de mantelzorgsituatie in hun gemeente, zodat ze beleid kunnen aanpassen.

**Te bouwen:**

#### D1.1 Gemeente Login & Autorisatie ✅ Gedaan
- ~~**Aparte login** voor gemeentemedewerkers (`/gemeente/login`)~~ ✅ Werkend
- ~~**Rol:** `GEMEENTE_ADMIN` met toegang tot eigen gemeente-data~~ ✅ Werkend
- **Meerdere gebruikers per gemeente** mogelijk
- **Koppeling aan gemeente** via gemeentecode of postcode-reeks

#### D1.2 Overzichtsdashboard
- **KPI-tegels bovenaan:**
  - Totaal aantal geregistreerde mantelzorgers in gemeente
  - Gemiddelde belastbaarheidsscore
  - Aantal actieve alarmen
  - Trend t.o.v. vorige maand (pijl omhoog/omlaag)
  - Aantal MantelBuddies actief in gemeente
  - Percentage mantelzorgers met hulpvraag

#### D1.3 Demografische Inzichten (geanonimiseerd)
- **Leeftijdsverdeling** mantelzorgers
- **Type zorgrelatie** (partner, ouder, kind, etc.)
- **Gemiddeld aantal zorguren per week**
- **Verdeling over belastbaarheidsniveaus** (taartdiagram: LAAG/GEMIDDELD/HOOG)
- **Geografische spreiding** binnen gemeente (wijk-niveau indien mogelijk)

#### D1.4 Trend-analyses
- **Score-ontwikkeling over tijd** (lijn-grafiek per maand)
- **Seizoenspatronen** herkennen (hogere belasting in winter?)
- **Effectiviteit meting:**
  - Daalt de gemiddelde score na interventie?
  - Hoeveel mantelzorgers zoeken hulp na hoge score?
  - Conversie: registratie -> actief gebruik -> hulp gevonden

#### D1.5 Hulpvragen Inzichten
- **Meest gevraagde hulpcategorieen** in de gemeente
- **Onbeantwoorde hulpvragen** (signaal voor tekort aan aanbod)
- **Hulpaanbod vs. hulpvraag** balans
- **Organisaties die veel/weinig benaderd worden**

#### D1.6 Alarmen & Signalering
- **Geanonimiseerd overzicht** van alarmen:
  - Aantal hoge-belasting signalen deze maand
  - Aantal sociaal-isolement signalen
  - Trend in alarmen
- **Geen persoonlijke data** - Gemeente ziet trends, geen individuen
- **Optioneel:** Met toestemming van mantelzorger kan gemeente contact opnemen

#### D1.7 Rapportages & Export
- **Maandelijkse/kwartaalrapportage** genereren (PDF)
- **Data-export** voor beleidsrapporten (CSV, anoniem)
- **Benchmark** - Vergelijking met landelijke gemiddelden (als data beschikbaar)
- **Automatische rapportage** via email aan gemeente-contactpersoon

### D2. Gemeente Content Management (deels gedaan)

- ~~**Gemeentenieuws publiceren**~~ ✅ **Gedaan** - Gemeente kan nieuws toevoegen en beheren via `/gemeente/hulpbronnen` (informatie-tab)
- ~~**Lokale hulpbronnen beheren**~~ ✅ **Gedaan** - CRUD voor hulporganisaties met openingstijden, kosten, bereikbaarheid
- **Mantelzorgwaardering** - Informatie over gemeentelijke waardering publiceren
- ~~**Evenementen**~~ ✅ **Gedaan** - Evenementenpagina voor lokale bijeenkomsten (`/gemeente/evenementen`)

### D3. Gemeente API & Data Privacy

**Technisch:**
- **Alle data geanonimiseerd** - Geen persoonsgegevens in gemeente-dashboard
- **Aggregatie op gemeente-niveau** - Minimaal 10 gebruikers voor statistieken (k-anonimiteit)
- **AVG-compliant** - Verwerkersovereenkomst met gemeente
- **Audit trail** - Logging van alle data-toegang door gemeente

---

## 6. Module E: MantelBuddy Marktplaats & Vrijwilligersomgeving

### E1. MantelBuddy Profiel & Dashboard

**Doel:** Een complete omgeving voor vrijwilligers die mantelzorgers willen helpen.

**Huidig:** Alleen een registratieformulier (`/word-mantelbuddy`). Geen dashboard of profiel.

**Te bouwen:**

#### E1.1 MantelBuddy Dashboard (`/buddy/dashboard`)
- **Welkomstbanner** met naam en status
- **Statistieken:**
  - Aantal voltooide taken
  - Gemiddelde beoordeling (sterren)
  - Betrouwbaarheidsscore
  - "Actief sinds" datum
- **Openstaande taken in mijn buurt** (kaart of lijst)
- **Mijn reacties** (taken waar ik op gereageerd heb)
- **Mijn matches** (vaste koppelingen)
- **Nieuwe notificaties**

#### E1.2 MantelBuddy Profiel (`/buddy/profiel`)
- **Persoonlijke gegevens** bewerken
- **Hulpvormen** aanpassen (welke hulp kan ik bieden)
- **Beschikbaarheid** instellen:
  - Dagen van de week
  - Dagdelen (ochtend/middag/avond)
  - Vakantieperiodes (tijdelijk niet beschikbaar)
- **Zoekradius instellen:**
  - Schuifbalk: 1km - 5km - 10km - 15km - 25km
  - Of: alleen mijn wijk / mijn gemeente / regio
  - Kaartweergave van het zoekgebied
- **VOG-status** en **training-status** inzien
- **Mijn beoordelingen** bekijken

#### E1.3 Onboarding Flow MantelBuddy
```
Stap 1: Bevestiging aanmelding (email)
Stap 2: Kennismakingsgesprek (telefonisch/video)
Stap 3: VOG aanvragen (instructies + link)
Stap 4: Online training volgen (korte modules)
Stap 5: Profiel completeren (foto, beschikbaarheid, zoekradius)
Stap 6: Eerste taak zoeken of match accepteren
```

### E2. Takenmarktplaats

**Doel:** Mantelzorgers kunnen taken uitzetten, MantelBuddies kunnen reageren.

#### E2.1 Taak Aanmaken (Mantelzorger)
**Pagina:** `/hulpvragen/nieuwe-taak`

- **Categorie kiezen** (met iconen, grote knoppen):
  - Boodschappen doen
  - Vervoer (naar afspraak, apotheek, etc.)
  - Gezelschap (koffie drinken, wandelen)
  - Klusjes (tuin, kleine reparaties)
  - Administratie (formulieren, brieven)
  - Oppas/toezicht (even weg kunnen)
- **Omschrijving** (vrij tekstveld met voorbeeld-zinnen)
- **Wanneer:**
  - Specifieke datum + dagdeel
  - Of: "Wanneer het uitkomt" (flexibel)
  - Terugkerend: wekelijks/tweewekelijks/maandelijks
- **Locatie:** Automatisch op basis van profiel (alleen gemeente/wijk zichtbaar voor buddy)
- **Preview:** "Zo ziet je hulpvraag eruit" voor bevestiging

#### E2.2 Takenmarktplaats Overzicht (MantelBuddy)
**Pagina:** `/buddy/taken`

- **Filteropties:**
  - Afstand (slider: 1km tot 25km vanuit mijn postcode)
  - Categorie (boodschappen, vervoer, gezelschap, etc.)
  - Dagdeel (ochtend/middag/avond)
  - Type (eenmalig/terugkerend)
- **Kaartweergave** - Taken op een kaart (alleen wijk-niveau, geen exact adres)
- **Lijstweergave** - Taken als kaarten met:
  - Categorie-icoon
  - Korte omschrijving
  - Wanneer (datum + dagdeel)
  - Afstand ("2 km bij jou vandaan")
  - "Ik wil helpen" knop

#### E2.3 Reactie & Matching Flow
```
MantelBuddy klikt "Ik wil helpen"
  -> Optioneel bericht toevoegen ("Ik kan donderdag!")
  -> Reactie wordt opgeslagen (status: INTERESSE)

Mantelzorger krijgt notificatie:
  "[Voornaam] wil je helpen met [taak]!"
  -> Bekijk profiel (voornaam, beoordeling, ervaring)
  -> Accepteren of Afwijzen

Bij acceptatie:
  -> Beide partijen krijgen contactgegevens
  -> Taak status: TOEGEWEZEN
  -> Herinnering 1 dag van tevoren

Na afloop:
  -> Mantelzorger kan beoordeling achterlaten
  -> MantelBuddy kan aangeven of taak voltooid is
  -> Taak status: VOLTOOID
```

#### E2.4 Afstandsberekening
- **Postcode-gebaseerd** (privacy-vriendelijk)
- **Haversine formule** voor afstandsberekening tussen postcodes
- **PDOK integratie** voor postcode-naar-coordinaat conversie (reeds aanwezig)
- **Zoekradius** instelbaar per MantelBuddy (standaard 5km)
- **Sortering** op afstand (dichtsbijzijnde eerst)

### E3. Beoordelingssysteem

**Te bouwen:**

#### E3.1 Beoordeling door Mantelzorger
Na voltooiing van een taak:
- **Sterren** (1-5) voor:
  - Algemeen (verplicht)
  - Betrouwbaarheid ("Was [naam] op tijd?")
  - Vriendelijkheid ("Voelde je je op je gemak?")
- **Positieve feedback** (keuzeopties + vrij tekst):
  - "Heel behulpzaam"
  - "Fijn gesprek gehad"
  - "Punctueel en betrouwbaar"
- **Verbeterpunten** (optioneel, alleen zichtbaar voor admin)
- **Anoniem indienen** optie

#### E3.2 Betrouwbaarheidsscore
Automatisch berekend op basis van:
- Gemiddelde beoordeling
- Percentage taken voltooid vs. geannuleerd
- Responsetijd op taken
- Hoe lang actief als MantelBuddy
- VOG en training status

#### E3.3 Moderatie
- **Automatische flags** bij:
  - Score onder 2 sterren
  - Meer dan 2 annuleringen op rij
  - Klacht ingediend
- **Admin review** bij flags
- **Tijdelijk pauzeren** van buddy bij herhaalde klachten

### E4. Communicatie & Notificaties

**Te bouwen:**
- **In-app berichten** tussen mantelzorger en buddy (na match)
- **WhatsApp notificatie** bij nieuwe taak in zoekgebied
- **Email notificatie** bij reactie op hulpvraag
- **Push notificatie** (via PWA) voor urgente taken
- **Herinneringen** dag voor geplande taak

---

## 7. Module F: Eigen Suggesties & Innovatie

### F1. Noodknop / SOS-functie

**Wat:** Een prominente "Ik heb NU hulp nodig" knop op het dashboard.

**Waarom:** Mantelzorgers in crisis moeten direct hulp kunnen vinden zonder te zoeken.

**Hoe:**
- Grote, rode knop op dashboard (altijd zichtbaar)
- Bij klikken: directe lijst met:
  - Huisarts (uit profiel)
  - Mantelzorglijn: 030-164 0 164
  - Gekoppelde MantelBuddy bellen
  - 112 bij nood
  - Crisislijn
- Optioneel: locatie delen met vertrouwd contact

### F2. Mantelzorg-dagboek

**Wat:** Een privaat dagboek waar mantelzorgers kort kunnen opschrijven hoe hun dag was.

**Waarom:** Helpt bij emotionele verwerking en geeft inzicht in patronen.

**Hoe:**
- Dagelijkse prompt: "Hoe was je dag vandaag?" (optioneel)
- Smiley-selectie (5 niveaus) + optioneel kort bericht
- Kalenderoverzicht met kleur per dag (groen/oranje/rood)
- Privacy: alleen zichtbaar voor de gebruiker zelf
- Trends: "De afgelopen week had je meer groene dagen"

### F3. Mantelzorger Community

**Wat:** Een plek waar mantelzorgers ervaringen kunnen delen (forum/chat).

**Waarom:** Lotgenotencontact is bewezen effectief tegen eenzaamheid en overbelasting.

**Hoe:**
- **Gespreksgroepen** per thema (partner mantelzorg, ouder mantelzorg, etc.)
- **Anoniem deelnemen** mogelijk
- **Moderatie** door beheerder
- **Lokale groepen** per gemeente
- Start eenvoudig: ervaringsverhalen delen (geen real-time chat)

### F4. Slimme Herinneringen & Nudges

**Wat:** Proactieve, gepersonaliseerde herinneringen via WhatsApp of push.

**Voorbeelden:**
- "Het is 3 maanden geleden dat je de belastbaarheidstest deed. Wil je kijken hoe het nu gaat?"
- "Je hebt vorige week een artikel over respijtzorg gelezen. Wil je hulp zoeken bij een organisatie?"
- "Het is woensdag - tijd voor je wandeling!" (als ze dit als doel hebben gesteld)
- "Er is een MantelBuddy bij jou in de buurt die kan helpen met boodschappen."
- Seizoensgebonden: "De feestdagen kunnen zwaar zijn als mantelzorger. Hier zijn tips..."

### F5. Integratie met Gemeentelijke Regelingen

**Wat:** Automatisch tonen welke regelingen/toeslagen de mantelzorger mogelijk kan aanvragen.

**Hoe:**
- Database van regelingen per gemeente (mantelzorgcompliment, respijtzorg, PGB, etc.)
- Op basis van profiel (gemeente + situatie) relevante regelingen tonen
- Link naar aanvraagprocedure
- Beheerbaar via admin-portal per gemeente

### F6. Multi-taal Ondersteuning

**Wat:** De app beschikbaar maken in meerdere talen.

**Waarom:** Veel mantelzorgers in Nederland hebben een migratieachtergrond.

**Hoe:**
- Start met: Nederlands, Engels, Turks, Arabisch
- `next-intl` of `i18next` integreren
- Alle vaste teksten in vertaalbestanden
- Taalwissel in profiel en bij registratie

### F7. Offline Modus & PWA

**Wat:** De app installeerbaar maken en offline basisfunctionaliteit bieden.

**Waarom:** Oudere gebruikers met slechte internetverbinding of lage data-bundels.

**Hoe:**
- Service worker voor caching
- Offline beschikbaar: favorieten, laatst gelezen artikelen, noodcontacten
- Sync wanneer weer online
- "Toevoegen aan startscherm" prompt

### F8. Gamification (Subtiel)

**Wat:** Zachte motivatie-elementen om betrokkenheid te verhogen.

**Waarom:** Niet als "spelletje", maar als positieve bekrachtiging.

**Voorbeelden:**
- "Je hebt deze maand 3x een check-in gedaan - goed bezig!"
- "Je hebt al 5 artikelen gelezen"
- Voortgangsbalk voor profielcompleetheid
- MantelBuddy: "Je hebt al 10 mantelzorgers geholpen!"

### F9. Rapportage voor Huisarts

**Wat:** Mantelzorger kan een samenvatting van belastbaarheidstrend delen met huisarts.

**Waarom:** Huisartsen missen vaak signalen van overbelaste mantelzorgers.

**Hoe:**
- "Deel met mijn huisarts" knop bij rapport
- Genereert beknopt PDF-rapport met score-trend
- Mantelzorger kiest zelf welke data gedeeld wordt
- QR-code optie voor in de wachtkamer

### F10. Koppeling met Zorgnetwerk

**Wat:** Inzicht in het zorgnetwerk rondom de zorgvrager.

**Waarom:** Vaak zijn meerdere mantelzorgers betrokken bij dezelfde zorgvrager.

**Hoe:**
- Mantelzorger kan andere betrokkenen uitnodigen
- Gedeelde takenlijst voor de zorgvrager
- Agenda-synchronisatie (wie is wanneer aanwezig)
- Voorkomt dubbel werk en ontlast de hoofdmantelzorger

---

## 8. Technische Verbeteringen

### T1. Code-kwaliteit

| Verbetering | Prioriteit | Status | Toelichting |
|------------|-----------|--------|-------------|
| Test framework (Vitest) toevoegen | Hoog | **Gedaan** | Vitest met 29 tests (rate-limit, validations, advies) |
| Input validatie met Zod | Hoog | **Gedaan** | Zod v4 schema's op alle auth routes |
| Rate limiting (API) | Hoog | **Gedaan** | In-memory rate limiter op auth endpoints |
| Dashboard route opsplitsen | Middel | **Gedaan** | Van 782 → ~260 regels, modules in `src/lib/dashboard/` |
| WhatsApp webhook opsplitsen | Middel | Open | `webhook/route.ts` is 550+ regels |
| Error boundary componenten | Middel | **Verbeterd** | global-error.tsx en gemeente/error.tsx tonen nu gebruiksvriendelijke meldingen i.p.v. technische foutcodes |
| Logging framework (Pino/Winston) | Middel | Open | Gestructureerde logging i.p.v. console.log |
| TypeScript type-safety | Middel | **Gedaan (v2.5.0)** | `any` types vervangen door interfaces in dashboard-pagina's |
| Error logging in catch-blokken | Laag | **Gedaan (v2.5.0)** | Stille catches vervangen door `console.error` |

### T2. Infrastructuur

| Verbetering | Prioriteit | Toelichting |
|------------|-----------|-------------|
| Redis voor sessie/cache | Hoog | **Gedaan** - `SessionStore` interface met in-memory + Redis backends, auto-detectie via REDIS_URL |
| Email service (nodemailer/SMTP) | Hoog | **Gedaan** - SMTP email met HTML-templates, fallback naar console.log |
| Background jobs (Bull/Agenda) | Middel | Alarmen en notificaties synchroon in API |
| CDN voor statische assets | Laag | Performance-verbetering |
| CI/CD pipeline | Middel | Geautomatiseerd testen en deployen |
| Monitoring (Sentry) | Middel | Foutdetectie in productie |

### T3. Database

| Verbetering | Prioriteit | Status | Toelichting |
|------------|-----------|--------|-------------|
| Database indexen optimaliseren | Middel | **Gedaan (v2.5.0)** | Indexes op Account, Session, Notification, BelastbaarheidTest, HelpRequest |
| Soft deletes implementeren | Middel | Open | Data behouden voor audit/compliance |
| Database backups automatiseren | Hoog | Open | Data-verlies voorkomen |
| Row Level Security activeren | Middel | Open | `rls-enable.sql` bestaat maar is niet actief |

### T4. Beveiliging

| Verbetering | Prioriteit | Toelichting |
|------------|-----------|-------------|
| NextAuth upgraden naar stable | Hoog | Nu beta.30, beveiligingsrisico |
| CSP headers toevoegen | Middel | Content Security Policy |
| CORS configuratie | Middel | API bescherming |
| Dependency audit | Hoog | Verouderde packages controleren |
| Secrets management | Hoog | Token was per ongeluk gedeeld in chat |

---

## 9. Prioritering & Fasering

### Fase 1: Fundament (maand 1-2) ✅ Grotendeels afgerond
**Focus:** Technische basis en beveiliging versterken

1. ~~Email service implementeren (verificatie + wachtwoord reset)~~ ✅ **Gedaan**
2. ~~Rate limiting op auth endpoints~~ ✅ **Gedaan**
3. ~~Input validatie met Zod~~ ✅ **Gedaan**
4. ~~Test framework opzetten (Vitest) + eerste tests~~ ✅ **Gedaan**
5. ~~Redis voor WhatsApp sessies~~ ✅ **Gedaan** (SessionStore met Redis backend)
6. Versienummer synchroniseren

### Fase 2: Beheeromgeving (maand 2-4)
**Focus:** Admin portal opzetten

1. Admin authenticatie en rolbeheer
2. Gebruikersbeheer (overzicht, detail, zoeken)
3. Content management (artikelen naar database, CRUD)
4. Hulpbronnen beheer uitbreiden
5. Alarm & signalering dashboard
6. MantelBuddy aanmeldingen beheren

### Fase 3: Klantreis & UX (maand 3-5)
**Focus:** Gebruikerservaring optimaliseren

1. Onboarding flow (stapsgewijze welkomst)
2. ~~UI-verbeteringen voor oudere gebruikers (typografie, knoppen, contrast)~~ ✅ **Grotendeels gedaan** - WCAG AA kleuren, 44px touch targets, B1-teksten, grafieklegenda's, warme lege states
3. ~~Tekstuele begeleiding (pagina-intro's, hulpteksten, foutmeldingen)~~ ✅ **Gedaan** - PageIntro component op alle pagina's, foutmeldingen in B1 Nederlands, helptekst bij formulieren
4. ~~Gepersonaliseerde aanbevelingen op dashboard~~ ✅ **Reeds aanwezig**
5. ~~Check-in systeem uitbreiden~~ ✅ **Reeds aanwezig** (smart frequency)
6. ~~Dynamisch hulpadvies op basis van score~~ ✅ **Gedaan** (advies engine)

### Fase 4: MantelBuddy Marktplaats (maand 4-7)
**Focus:** Vrijwilligersplatform bouwen

1. MantelBuddy dashboard en profiel
2. Takenmarktplaats (aanmaken + overzicht)
3. Afstandsberekening en zoekradius
4. Reactie & matching flow
5. Beoordelingssysteem
6. Notificaties (WhatsApp + push)

### Fase 5: Gemeenteportaal (maand 6-8)
**Focus:** Inzichten voor gemeenten

1. Gemeente authenticatie en autorisatie
2. KPI-dashboard met kerncijfers
3. Demografische inzichten (geanonimiseerd)
4. Trend-analyses en grafieken
5. Rapportage-generatie (PDF/CSV)
6. Gemeente content management

### Fase 6: Innovatie (maand 8+)
**Focus:** Extra features en doorontwikkeling

1. Noodknop / SOS-functie
2. Mantelzorg-dagboek
3. PWA / Offline modus
4. Multi-taal ondersteuning
5. Huisarts-rapport delen
6. Community / lotgenotencontact
7. Gemeentelijke regelingen integratie

---

## 10. Risico's & Aandachtspunten

### Privacy & AVG
- Mantelzorger-data is gevoelig (gezondheid, zorgsituatie)
- Gemeente mag alleen geanonimiseerde/geaggregeerde data zien
- MantelBuddy mag alleen noodzakelijke gegevens zien (geen medische info)
- Verwerkersovereenkomsten nodig met gemeenten
- Recht op verwijdering moet gewaarborgd zijn (al deels aanwezig)
- Data Protection Impact Assessment (DPIA) uitvoeren

### Schaalbaarheid
- Bij groei naar meerdere gemeenten: database-performance monitoren
- WhatsApp Twilio kosten bij groeiend gebruik
- Afstandsberekening kan zwaar worden bij veel taken/buddies -> caching nodig

### Gebruikersadoptie
- Oudere doelgroep: persoonlijke introductie belangrijker dan digitale onboarding
- Samenwerking met gemeenten en huisartsen voor doorverwijzing
- WhatsApp als primair kanaal behouden (laagste drempel)

### Kwaliteitsborging MantelBuddy
- VOG-verificatie is cruciaal voor veiligheid
- Training moet inhoudelijk sterk zijn
- Moderatie en klachtenafhandeling goed inrichten
- Aansprakelijkheid bij incidenten helder vastleggen

### Technisch
- NextAuth beta kan breaking changes bevatten bij updates
- Prisma migraties zorgvuldig beheren bij schema-wijzigingen
- Geen vendor lock-in op Twilio (abstractielaag overwegen)

---

---

## Versiehistorie van dit document

| Versie | Datum | Wijzigingen |
|--------|-------|-------------|
| 1.0 | 15 feb 2026 | Eerste versie met alle modules A-F |
| 1.1 | 22 feb 2026 | Status bijgewerkt voor baseline v2.5.0: content-architectuur database-driven, B1 taalniveau, type-safety, database indexen, bugfixes |
| 1.2 | 24 feb 2026 | Uitgebreide update na UI/UX review en beheeromgeving verbeteringen: WCAG AA kleuren, B1-teksten app-breed, consistent "je" aanspreekvorm, beheer velden (openingstijden/kosten/zorgverzekeraar), CSV-import uitgebreid, grafieklegenda's, foutmeldingen gestandaardiseerd, warme lege states, dashboard opgeschoond, Jouw reis naar profiel, filterbadges hulpvragen |
| 1.3 | 24 feb 2026 | Infrastructuur & architectuur verbeteringen (punten 3-16): AdminSpinner/AdminEmptyState/AdminModal componenten in alle beheer/gemeente pagina's, email service (nodemailer SMTP), rate limiting op auth endpoints, Zod v4 validatie, dynamisch advies engine, Vitest test framework (29 tests), Redis session store, dashboard route gesplitst (782→260 regels) |

*Dit document is een levend document en zal worden bijgewerkt naarmate de ontwikkeling vordert.*
