# MatenBuddy - Doorontwikkelplan & Verbeteringsoverzicht

**Datum:** 16 februari 2026
**Versie:** 2.0 - Geactualiseerd na volledige code-audit
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

> **Let op:** Dit overzicht is gebaseerd op een volledige code-audit van 16 februari 2026. De vorige versie (v1.0) onderschatte de hoeveelheid gebouwde functionaliteit aanzienlijk.

### Applicatie-omvang

| Metriek | Waarde |
|---------|--------|
| Totaal pagina's/routes | ~50 pagina's |
| API routes | ~30 endpoints (~2040 regels) |
| Database modellen | 32 Prisma modellen |
| Prisma schema | 871 regels |
| Tech stack | Next.js 16.1.4, React 19.2.3, TypeScript 5.9.3, Prisma 5.22.0, TailwindCSS 4 |

### Wat er nu is (geactualiseerd)

| Onderdeel | Status | Toelichting |
|-----------|--------|-------------|
| Registratie & Login | **Werkend** | Email/wachtwoord, bcrypt (12 rounds), JWT sessies, WhatsApp koppeling |
| Belastbaarheidstest | **Werkend** | 11 vragen, 4 categorieen, scoreberekening, alarmsysteem |
| Dashboard | **Werkend** | Welzijnsoverzicht, score-gebaseerde content, "Aanbevolen voor jou", "Jouw Reis" tijdlijn |
| Hulpvragen | **Werkend** | Zoeken op gemeente, koppeling aan organisaties, favorieten |
| Leren-sectie | **Werkend** | Artikelen per categorie en belastingsniveau, gemeentenieuws |
| Favorieten | **Werkend** | Bookmarken van hulpbronnen en artikelen |
| WhatsApp Bot | **Werkend** | Belastbaarheidstest, registratie, menu via Twilio |
| Check-in systeem | **Werkend** | 5 contextuele vragen, tips per vraag, trend-visualisatie |
| PDF Rapport | **Werkend** | Download belastbaarheidstest resultaten |
| Onboarding flow | **Werkend** | 5-stappen welkomstflow na registratie |
| Beheeromgeving | **Grotendeels werkend** | Gebruikersbeheer, artikelen CMS, hulpbronnen, alarmen, buddy-beheer, statistieken |
| Gemeenteportaal | **Grotendeels werkend** | KPI-dashboard, demografie, trends, hulpvragen, alarmen, rapportages, CMS |
| MantelBuddy aanmelding | **Basis werkend** | 3-stappen registratieformulier, admin-beheer van aanmeldingen |
| UI/UX ouderen | **Grotendeels werkend** | Atkinson Hyperlegible, 18px basis, hoog contrast modus, ARIA labels, PageHelp systeem |
| PWA | **Basis werkend** | Manifest, service worker (network-first), offline caching |

### Wat ontbreekt (geactualiseerd)

**Functioneel:**
- MantelBuddy marktplaats (dashboard, profiel, takenmarktplaats, matching, beoordelingen)
- Progressieve onboarding (week-voor-week feature introductie)
- WhatsApp check-in en slimme check-in frequentie
- Noodknop/SOS-functie
- Mantelzorg-dagboek
- Community/lotgenotencontact
- Gemeentelijke regelingen integratie
- Huisarts-rapport delen
- Zorgnetwerk koppeling

**Technisch:**
- E-mailnotificaties (tokens worden aangemaakt maar niet verzonden)
- Geautomatiseerde tests (geen Vitest/Jest)
- Input validatie met schema's (geen Zod)
- Rate limiting op API endpoints
- Redis voor sessies en caching (nu in-memory)
- Background jobs voor notificaties en herinneringen
- CI/CD pipeline
- Monitoring/Sentry
- Error boundary componenten
- Gestructureerde logging (nu console.log)
- Multi-taal ondersteuning

---

## 2. Module A: Beheeromgeving (Admin Portal)

### A1. Authenticatie & Autorisatie voor Beheerders

**Doel:** Veilige, rolgebaseerde toegang tot de beheeromgeving.

**Status: GROTENDEELS GEBOUWD**

**Wat er is:**
- Admin login pagina (`/beheer/login`) met aparte loginflow
- Rolgebaseerde toegang met 6 rollen: `CAREGIVER`, `BUDDY`, `ORG_MEMBER`, `ORG_ADMIN`, `GEMEENTE_ADMIN`, `ADMIN`
- Middleware bescherming in `src/middleware.ts` voor `/beheer/*` routes (alleen ADMIN)
- Audit logging via `AuditLog` model en `src/lib/audit.ts` (logAudit functie)
- JWT sessie strategie met 30-dagen max age
- Session invalidatie bij nieuwe login (sessionVersion)

**Nog te bouwen:**
- 2FA (optioneel) voor admin accounts
- `SUPER_ADMIN` rol toevoegen (of bestaande ADMIN rol uitbreiden)
- Uitgebreidere audit logging (nu niet overal geintegreerd)

### A2. Content Management (CMS)

**Doel:** Alle informatie, tips, hulpbronnen en artikelen beheren zonder code-aanpassingen.

**Status: GROTENDEELS GEBOUWD**

#### A2.1 Artikelen & Tips Beheer

**Status: GEBOUWD**

**Wat er is:**
- CRUD interface op `/beheer/artikelen` met:
  - Titel, samenvatting, volledige inhoud
  - Categorie-toewijzing en type (ARTIKEL, TIP, GIDS, GEMEENTE_NIEUWS)
  - Publicatiestatus via `ArtikelStatus` enum (CONCEPT / GEPUBLICEERD / GEARCHIVEERD)
  - Koppeling aan belastbaarheidsniveau (LAAG/GEMIDDELD/HOOG)
  - Database `Artikel` model (niet meer hardcoded)

**Nog te bouwen:**
- Rich text editor (nu platte tekst)
- Media-upload voor afbeeldingen
- Preview-functie
- Tags voor zoekfunctie

#### A2.2 Hulpbronnen & Organisaties Beheer

**Status: GEBOUWD**

**Wat er is:**
- Uitgebreide CRUD op `/beheer/hulpbronnen`
- Web scraping enrichment voor hulpbronnen
- Filteren en zoeken op gemeente, categorie, status
- Meerdere resource types ondersteund
- `Zorgorganisatie` model met nationaal/provinciaal/gemeentelijk niveau

**Nog te bouwen:**
- Bulk import/export (CSV/Excel)
- Organisatie-verificatie workflow
- Zorgorganisatie-kaart (visuele kaart)
- Openingstijden en beschikbaarheid velden

#### A2.3 Gemeentenieuws Beheer

**Status: DEELS GEBOUWD**

**Wat er is:**
- Artikelen systeem ondersteunt `GEMEENTE_NIEUWS` type
- Content kan per gemeente gepubliceerd worden

**Nog te bouwen:**
- Notificatie-triggers bij nieuw gemeentenieuws
- Planning/inplannen voor toekomstige publicatie

### A3. Gebruikersbeheer

**Doel:** Overzicht en beheer van alle gebruikers vanuit een centraal portaal.

#### A3.1 Gebruikersoverzicht

**Status: GEBOUWD**

**Wat er is (`/beheer/gebruikers`):**
- Tabel met alle gebruikers (naam, email, rol, gemeente, status)
- Filteren op rol
- Zoekfunctie op naam/email
- Paginering
- CSV export
- Registratiedatum en belastbaarheidsscore getoond

**Nog te bouwen:**
- Filteren op gemeente, belastbaarheidsniveau, activiteit, alarmstatus
- Filteren op registratieperiode
- Onboarding-voortgang kolom

#### A3.2 Gebruiker Detailpagina

**Status: GEBOUWD**

**Wat er is (`/beheer/gebruikers/[id]`):**
- Profiel bekijken met alle gegevens
- Rol wijzigen
- Account activeren/deactiveren
- Wachtwoord reset
- Interne notities van beheerders
- MantelBuddy info tonen (indien van toepassing)
- Belastbaarheidstest historie
- Check-in historie
- Actieve alarmen per gebruiker
- Hulpvragen overzicht

**Nog te bouwen:**
- Belastbaarheidshistorie als grafiek (nu als lijst)
- Account verwijderen met AVG-compliance flow

#### A3.3 MantelBuddy Beheer

**Status: GEBOUWD**

**Wat er is (`/beheer/mantelbuddies`):**
- Aanmeldingen overzicht met statusfiltering
- Status workflow (AANGEMELD -> IN_BEHANDELING -> VOG_AANGEVRAAGD -> GOEDGEKEURD / INACTIEF / AFGEWEZEN)
- VOG-verificatie toggle
- Training-status toggle
- Gemiddelde beoordelingsscores per buddy
- Matching overzicht

**Nog te bouwen:**
- Uitgebreider beoordeling dashboard met klachtenafhandeling

#### A3.4 Alarm & Signalering Dashboard

**Status: GEBOUWD**

**Wat er is (`/beheer/alarmen`):**
- Overzicht actieve alarmen uit `AlarmLog`
- Filteren op status (actief/opgelost)
- Alarm als "opgepakt" / "opgelost" markeren
- Notities toevoegen aan alarmen
- Directe link naar gebruiker detail

**Nog te bouwen:**
- Automatische escalatie via email bij kritieke alarmen
- Dashboard visualisatie van alarm-trends

### A4. Systeem & Instellingen

**Status: DEELS GEBOUWD**

**Wat er is:**
- Statistieken dashboard (`/beheer/statistieken`) met basis-KPI's
- Basis applicatie-instellingen

**Nog te bouwen:**
- Applicatie-instellingen (belastbaarheidstest drempelwaardes, notificatie-instellingen)
- Email-templates beheren (welkomstmail, wachtwoord reset, alarm)
- WhatsApp-templates beheren (templates bestaan in code maar zijn niet beheerbaar)
- Uitgebreidere statistieken:
  - Conversie registratie -> onboarding voltooid
  - Meest bezochte artikelen
  - Aantal hulpvragen gesteld vs beantwoord

---

## 3. Module B: Klantreis & Begeleiding Mantelzorger

### B1. Onboarding Flow (Stapsgewijze Introductie)

**Doel:** De mantelzorger stap voor stap meenemen, zodat elke stap begrijpelijk is en direct waarde biedt.

#### B1.1 Welkomstflow (na registratie)

**Status: GEBOUWD** (`/onboarding` - 5 stappen)
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

**Status: NIET GEBOUWD**

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

**Status: GEBOUWD** - Dashboard toont content gefilterd op belastingNiveau (LAAG/GEMIDDELD/HOOG).

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

**Status: DEELS GEBOUWD** - "Aanbevolen voor jou" sectie bestaat, filtert op belastingNiveau.

- **"Aanbevolen voor jou"** sectie op dashboard
- **Wat er is:** Filtering op belastbaarheidsniveau
- **Nog toe te voegen:** Filtering gebaseerd op:
  - Belastbaarheidsscore per categorie (fysiek, emotioneel, sociaal, praktisch)
  - Gemeente (lokale hulpbronnen)
  - Zorgsituatie (type zorgvrager, uren per week)
  - Eerder bekeken artikelen en favorieten
  - Seizoensgebonden tips (winter: eenzaamheid, zomer: vakantie-vervanging)

#### B2.3 Mijlpalen & Motivatie

**Status: GEBOUWD** - "Jouw Reis" tijdlijn en trend-indicator met bemoediging zijn geimplementeerd.

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

**Status: DEELS GEBOUWD**

**Wat er is:**
- Uitgebreid 5-vragen systeem (niet meer alleen 5-puntsschaal)
- Contextuele tips per vraag
- Trend-visualisatie op dashboard

**Nog te bouwen:**
- **Slimme frequentie** - Bij hogere scores vaker check-in aanbieden
- **WhatsApp check-in** - Automatisch bericht via WhatsApp voor check-in
- **Buddy-notificatie** - Bij sterke daling MantelBuddy op de hoogte stellen (indien gekoppeld)

---

## 4. Module C: UI/UX Optimalisatie voor Oudere Gebruikers

### C1. Visueel Ontwerp

**Doel:** Interface die intuietief en prettig is voor gebruikers van 60+.

**Te bouwen/verbeteren:**

#### C1.1 Typografie & Leesbaarheid

**Status: GEBOUWD**

**Wat er is:**
- Minimale lettergrootte 18px voor bodytekst
- Atkinson Hyperlegible font (specifiek voor leesbaarheid)
- Regelafstand 1.7
- Tekstvergrotingsmodus beschikbaar

**Nog te verbeteren:**
- WCAG AAA niveau (7:1 ratio) volledig doorvoeren
- Koppen hierarchie consistent maken (24-32px)

#### C1.2 Knoppen & Interactie-elementen

**Status: GROTENDEELS GEBOUWD**

**Wat er is:**
- 48x48px minimale klikgrootte doorgevoerd
- Focus states geimplementeerd
- Nederlandse actie-teksten ("Ga verder", "Verstuur", etc.)

**Nog te verbeteren:**
- Consequent doorvoeren dat knoppen altijd tekst hebben (nooit alleen icoon)
- Bevestiging bij destructieve acties consequent toepassen

#### C1.3 Kleurgebruik

**Status: DEELS GEBOUWD**

**Wat er is:**
- Hoog contrast modus beschikbaar
- Consistente kleurbetekenis in de meeste componenten

**Nog te verbeteren:**
- Kleur nooit als enige indicator - altijd iconen of tekst erbij (audit nodig)
- Consistente kleurbetekenis overal doorvoeren:
  - Groen = positief/succes
  - Oranje = aandacht/waarschuwing
  - Rood = urgent/fout (spaarzaam gebruiken)
  - Blauw = informatie/links

#### C1.4 Layout & Navigatie

**Status: DEELS GEBOUWD**

**Wat er is:**
- Breadcrumbs geimplementeerd
- Terug-knoppen op pagina's
- Vaste navigatie

**Nog te verbeteren:**
- Minder elementen per scherm - maximaal 3-4 keuzes tegelijk
- Geen scrollbare tabellen op mobiel (responsive tables audit)

### C2. Tekstuele Begeleiding

**Doel:** Elke pagina bevat heldere, warme uitleg in B1-niveau Nederlands.

**Te bouwen:**

#### C2.1 Pagina-introductieteksten

**Status: GEBOUWD** - `PageIntro` component met warme welkomstteksten op alle hoofdpagina's.

Elke pagina begint met een kort, warm welkomstblok:

**Dashboard:**
> "Welkom terug, [voornaam]! Hier zie je in een oogopslag hoe het met je gaat en wat je kunt doen."

**Belastbaarheidstest:**
> "Met deze korte vragenlijst kijken we samen hoe het met je gaat. Er zijn geen goede of foute antwoorden. Wees eerlijk - dat helpt ons om je beter te helpen."

**Hulpvragen:**
> "Hier vind je organisaties bij jou in de buurt die je kunnen helpen. Je hoeft niet alles alleen te doen."

**Leren:**
> "Hier vind je artikelen en tips die passen bij jouw situatie. We hebben ze voor je geselecteerd."

**MantelBuddy:**
> "Een MantelBuddy is een vrijwilliger uit je buurt die je wil helpen. Dat kan een boodschap doen zijn, of gewoon even een kopje koffie drinken."

#### C2.2 Contextuele Hulpteksten

**Status: GEBOUWD**

**Wat er is:**
- Tooltips bij invoervelden
- Nederlandse foutmeldingen in begrijpelijke taal
- Stap-indicatoren bij formulieren
- Bevestigingsmeldingen na acties

#### C2.3 Hulp & Uitleg Systeem

**Status: GEBOUWD**

**Wat er is:**
- `PageHelp` component: "Hoe werkt dit?" overlay met stap-voor-stap uitleg
- `HelpButton` floating button op pagina's
- Hulplijn verwijzingen

**Nog te bouwen:**
- Video-uitleg optie voor complexere functies
- "Niet meer tonen" optie voor help-overlays

### C3. Toegankelijkheid (Accessibility)

**Status: GROTENDEELS GEBOUWD**

**Wat er is:**
- ARIA labels en screen reader ondersteuning
- Toetsenbordnavigatie geimplementeerd
- Tekst vergrotingsmodus (schakelaar)
- "Verminder animaties" optie (prefers-reduced-motion)

**Nog te verbeteren:**
- Volledige WCAG 2.1 AA compliance audit
- Taalgebruik audit - alle teksten controleren op B1-niveau

### C4. Mobiele Ervaring

**Status: DEELS GEBOUWD**

**Wat er is:**
- 48x48px touch targets
- PWA manifest (`/public/manifest.json`) - "MantelBuddy", standalone mode
- Service worker (`/public/sw.js`) - network-first strategie, precaching van /, /dashboard, /manifest.json
- API calls worden overgeslagen bij caching

**Nog te bouwen:**
- Swipe-navigatie waar logisch
- Offline-pagina voor als er geen verbinding is
- Push-notificaties
- Installatie-prompt ("Toevoegen aan startscherm")
- Offline beschikbaarheid van favorieten en gelezen artikelen

---

## 5. Module D: Gemeenteportaal & Dashboard

> **Status: GROTENDEELS GEBOUWD** - Het volledige gemeenteportaal is geimplementeerd met dashboard, inzichten, en CMS.

### D1. Gemeente Dashboard

**Doel:** Gemeenten inzicht geven in de mantelzorgsituatie in hun gemeente, zodat ze beleid kunnen aanpassen.

#### D1.1 Gemeente Login & Autorisatie

**Status: GEBOUWD** (`/gemeente/login`)

**Wat er is:**
- Aparte login voor gemeentemedewerkers
- `GEMEENTE_ADMIN` rol met middleware-bescherming
- Toegang tot alleen eigen gemeente-data

#### D1.2 Overzichtsdashboard

**Status: GEBOUWD** (`/gemeente/dashboard`)

**Wat er is:**
- KPI-tegels met kerncijfers
- Score-verdeling visualisatie
- Trend-indicatoren

#### D1.3 Demografische Inzichten (geanonimiseerd)

**Status: GEBOUWD** (`/gemeente/demografie`)

#### D1.4 Trend-analyses

**Status: GEBOUWD** (`/gemeente/trends`)

#### D1.5 Hulpvragen Inzichten

**Status: GEBOUWD** (`/gemeente/hulpvragen`)

#### D1.6 Alarmen & Signalering

**Status: GEBOUWD** (`/gemeente/alarmen`)

#### D1.7 Rapportages & Export

**Status: GEBOUWD** (`/gemeente/rapportages`)

**Nog te bouwen voor D1.x:**
- Benchmark - vergelijking met landelijke gemiddelden
- Automatische rapportage via email aan gemeente-contactpersoon
- Seizoenspatronen herkenning
- Effectiviteitsmetingen (conversie, interventie-effect)

### D2. Gemeente Content Management

**Status: GEBOUWD**

**Wat er is:**
- Content pagina (`/gemeente/content`)
- Evenementen pagina (`/gemeente/evenementen`)
- Hulpbronnen pagina (`/gemeente/hulpbronnen`)

**Nog te bouwen:**
- Mantelzorgwaardering informatie publiceren

### D3. Gemeente API & Data Privacy

**Status: DEELS GEBOUWD**

**Wat er is:**
- K-anonimiteit check (minimaal 10 gebruikers voor statistieken)
- Data op gemeente-niveau geaggregeerd

**Nog te bouwen:**
- Volledige audit trail voor gemeente data-toegang
- Data Protection Impact Assessment (DPIA)
- Formele verwerkersovereenkomst-support

---

## 6. Module E: MantelBuddy Marktplaats & Vrijwilligersomgeving

> **Status: GROTENDEELS NOG TE BOUWEN** - Database modellen bestaan (BuddyMatch, BuddyTaak, BuddyBeoordeling), maar de frontend en API zijn nog niet geimplementeerd. Alleen het registratieformulier en admin-beheer zijn gebouwd.

### E1. MantelBuddy Profiel & Dashboard

**Doel:** Een complete omgeving voor vrijwilligers die mantelzorgers willen helpen.

**Huidig:** Registratieformulier (`/word-mantelbuddy`, 3 stappen). Admin-beheer van buddies op `/beheer/mantelbuddies`. Geen buddy-eigen dashboard of profiel.

**Te bouwen:**

#### E1.1 MantelBuddy Dashboard (`/buddy/dashboard`) - **NIET GEBOUWD**
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

#### E1.2 MantelBuddy Profiel (`/buddy/profiel`) - **NIET GEBOUWD**
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

#### E1.3 Onboarding Flow MantelBuddy - **DEELS** (alleen 3-stappen registratie)
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

#### E2.1 Taak Aanmaken (Mantelzorger) - **NIET GEBOUWD** (DB model `BuddyTaak` bestaat)
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

#### E2.2 Takenmarktplaats Overzicht (MantelBuddy) - **NIET GEBOUWD**
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

#### E2.3 Reactie & Matching Flow - **NIET GEBOUWD** (DB model `BuddyMatch` bestaat)
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

#### E2.4 Afstandsberekening - **NIET GEBOUWD**
- **Postcode-gebaseerd** (privacy-vriendelijk)
- **Haversine formule** voor afstandsberekening tussen postcodes
- **PDOK integratie** voor postcode-naar-coordinaat conversie (reeds aanwezig)
- **Zoekradius** instelbaar per MantelBuddy (standaard 5km)
- **Sortering** op afstand (dichtsbijzijnde eerst)

### E3. Beoordelingssysteem - **NIET GEBOUWD** (DB model `BuddyBeoordeling` bestaat)

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

### E4. Communicatie & Notificaties - **NIET GEBOUWD**

**Te bouwen:**
- **In-app berichten** tussen mantelzorger en buddy (na match)
- **WhatsApp notificatie** bij nieuwe taak in zoekgebied
- **Email notificatie** bij reactie op hulpvraag
- **Push notificatie** (via PWA) voor urgente taken
- **Herinneringen** dag voor geplande taak

---

## 7. Module F: Eigen Suggesties & Innovatie

### F1. Noodknop / SOS-functie - **NIET GEBOUWD**

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

### F2. Mantelzorg-dagboek - **NIET GEBOUWD**

**Wat:** Een privaat dagboek waar mantelzorgers kort kunnen opschrijven hoe hun dag was.

**Waarom:** Helpt bij emotionele verwerking en geeft inzicht in patronen.

**Hoe:**
- Dagelijkse prompt: "Hoe was je dag vandaag?" (optioneel)
- Smiley-selectie (5 niveaus) + optioneel kort bericht
- Kalenderoverzicht met kleur per dag (groen/oranje/rood)
- Privacy: alleen zichtbaar voor de gebruiker zelf
- Trends: "De afgelopen week had je meer groene dagen"

### F3. Mantelzorger Community - **NIET GEBOUWD**

**Wat:** Een plek waar mantelzorgers ervaringen kunnen delen (forum/chat).

**Waarom:** Lotgenotencontact is bewezen effectief tegen eenzaamheid en overbelasting.

**Hoe:**
- **Gespreksgroepen** per thema (partner mantelzorg, ouder mantelzorg, etc.)
- **Anoniem deelnemen** mogelijk
- **Moderatie** door beheerder
- **Lokale groepen** per gemeente
- Start eenvoudig: ervaringsverhalen delen (geen real-time chat)

### F4. Slimme Herinneringen & Nudges - **NIET GEBOUWD** (WhatsApp templates bestaan in code maar geen scheduler)

**Wat:** Proactieve, gepersonaliseerde herinneringen via WhatsApp of push.

**Voorbeelden:**
- "Het is 3 maanden geleden dat je de belastbaarheidstest deed. Wil je kijken hoe het nu gaat?"
- "Je hebt vorige week een artikel over respijtzorg gelezen. Wil je hulp zoeken bij een organisatie?"
- "Het is woensdag - tijd voor je wandeling!" (als ze dit als doel hebben gesteld)
- "Er is een MantelBuddy bij jou in de buurt die kan helpen met boodschappen."
- Seizoensgebonden: "De feestdagen kunnen zwaar zijn als mantelzorger. Hier zijn tips..."

### F5. Integratie met Gemeentelijke Regelingen - **NIET GEBOUWD**

**Wat:** Automatisch tonen welke regelingen/toeslagen de mantelzorger mogelijk kan aanvragen.

**Hoe:**
- Database van regelingen per gemeente (mantelzorgcompliment, respijtzorg, PGB, etc.)
- Op basis van profiel (gemeente + situatie) relevante regelingen tonen
- Link naar aanvraagprocedure
- Beheerbaar via admin-portal per gemeente

### F6. Multi-taal Ondersteuning - **NIET GEBOUWD** (alle content hardcoded in Nederlands)

**Wat:** De app beschikbaar maken in meerdere talen.

**Waarom:** Veel mantelzorgers in Nederland hebben een migratieachtergrond.

**Hoe:**
- Start met: Nederlands, Engels, Turks, Arabisch
- `next-intl` of `i18next` integreren
- Alle vaste teksten in vertaalbestanden
- Taalwissel in profiel en bij registratie

### F7. Offline Modus & PWA - **DEELS GEBOUWD** (manifest + basis service worker)

**Wat:** De app installeerbaar maken en offline basisfunctionaliteit bieden.

**Waarom:** Oudere gebruikers met slechte internetverbinding of lage data-bundels.

**Hoe:**
- Service worker voor caching
- Offline beschikbaar: favorieten, laatst gelezen artikelen, noodcontacten
- Sync wanneer weer online
- "Toevoegen aan startscherm" prompt

### F8. Gamification (Subtiel) - **MINIMAAL** (mijlpalen in B2.3)

**Wat:** Zachte motivatie-elementen om betrokkenheid te verhogen.

**Waarom:** Niet als "spelletje", maar als positieve bekrachtiging.

**Voorbeelden:**
- "Je hebt deze maand 3x een check-in gedaan - goed bezig!"
- "Je hebt al 5 artikelen gelezen"
- Voortgangsbalk voor profielcompleetheid
- MantelBuddy: "Je hebt al 10 mantelzorgers geholpen!"

### F9. Rapportage voor Huisarts - **NIET GEBOUWD** (PDF export bestaat maar niet voor delen met huisarts)

**Wat:** Mantelzorger kan een samenvatting van belastbaarheidstrend delen met huisarts.

**Waarom:** Huisartsen missen vaak signalen van overbelaste mantelzorgers.

**Hoe:**
- "Deel met mijn huisarts" knop bij rapport
- Genereert beknopt PDF-rapport met score-trend
- Mantelzorger kiest zelf welke data gedeeld wordt
- QR-code optie voor in de wachtkamer

### F10. Koppeling met Zorgnetwerk - **NIET GEBOUWD**

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
| Test framework (Vitest) toevoegen | Hoog | **Ontbreekt** | Geen testbestanden, geen testconfig |
| Input validatie met Zod | Hoog | **Ontbreekt** | Handmatige validatie per route |
| Rate limiting (API) | Hoog | **Ontbreekt** | Geen bescherming op endpoints |
| Dashboard route opsplitsen | Middel | **Niet gedaan** | `dashboard/route.ts` is ~896 regels |
| WhatsApp webhook opsplitsen | Middel | **Niet gedaan** | `webhook/route.ts` is groot |
| Error boundary componenten | Middel | **Ontbreekt** | Geen `error.tsx` bestanden, geen ErrorBoundary |
| Logging framework (Pino/Winston) | Middel | **Ontbreekt** | ~11 console.log/error instanties, geen structuur |

### T2. Infrastructuur

| Verbetering | Prioriteit | Status | Toelichting |
|------------|-----------|--------|-------------|
| Redis voor sessie/cache | Hoog | **Ontbreekt** | WhatsApp sessies in-memory (`whatsapp-session.ts` heeft TODO voor Redis) |
| Email service (Resend/SendGrid) | Hoog | **Ontbreekt** | Tokens worden aangemaakt, emails niet verzonden (console.log in dev) |
| Background jobs (Bull/Agenda) | Middel | **Ontbreekt** | WhatsApp reminder templates bestaan maar geen scheduler |
| CDN voor statische assets | Laag | **Ontbreekt** | Performance-verbetering |
| CI/CD pipeline | Middel | **Ontbreekt** | Geen `.github/workflows/`, geen GitHub Actions |
| Monitoring (Sentry) | Middel | **Ontbreekt** | Geen error tracking, geen alerting |

### T3. Database

| Verbetering | Prioriteit | Status | Toelichting |
|------------|-----------|--------|-------------|
| Database indexen optimaliseren | Middel | **Basis aanwezig** | Indexen op AuditLog (userId, entiteit, createdAt) |
| Soft deletes implementeren | Middel | **Ontbreekt** | Geen `deletedAt` velden in schema |
| Database backups automatiseren | Hoog | **Ontbreekt** | Geen backup-strategie |
| Row Level Security activeren | Middel | **Ontbreekt** | Niet geconfigureerd in Prisma schema |

### T4. Beveiliging

| Verbetering | Prioriteit | Status | Toelichting |
|------------|-----------|--------|-------------|
| NextAuth upgraden naar stable | Hoog | **Beta 5.0.0-beta.30** | Beta software in productie |
| CSP headers toevoegen | Middel | **Ontbreekt** | Geen Content Security Policy |
| CORS configuratie | Middel | **Ontbreekt** | Geen CORS headers in middleware |
| Dependency audit | Hoog | **Niet gedaan** | Verouderde packages controleren |
| Secrets management | Hoog | **Onduidelijk** | Geen duidelijke secrets-strategie |

---

## 9. Prioritering & Fasering (Geactualiseerd)

> **NB:** De oorspronkelijke fasering is herzien. Fase 2 (Beheeromgeving), Fase 3 (Klantreis & UX) en Fase 5 (Gemeenteportaal) zijn grotendeels al gebouwd. De nieuwe fasering richt zich op wat nog ontbreekt.

### Fase 1: Technisch Fundament (prioriteit HOOG)
**Focus:** Kritieke technische gaps dichten

1. Email service implementeren (verificatie + wachtwoord reset) - **KRITIEK**
2. Rate limiting op auth en API endpoints
3. Input validatie met Zod schemas
4. Test framework opzetten (Vitest) + eerste tests
5. Redis voor WhatsApp sessies en caching
6. Error boundary componenten toevoegen
7. NextAuth upgraden naar stable release

### Fase 2: Beheeromgeving Afronden (prioriteit MIDDEL)
**Focus:** Resterende gaps in de admin portal

~~1. Admin authenticatie en rolbeheer~~ **KLAAR**
~~2. Gebruikersbeheer (overzicht, detail, zoeken)~~ **KLAAR**
~~3. Content management (artikelen naar database, CRUD)~~ **KLAAR**
~~4. Hulpbronnen beheer~~ **KLAAR**
~~5. Alarm & signalering dashboard~~ **KLAAR**
~~6. MantelBuddy aanmeldingen beheren~~ **KLAAR**

**Wat nog moet:**
1. Rich text editor voor artikelen
2. Email-templates beheerbaar maken
3. WhatsApp-templates beheerbaar maken
4. Automatische escalatie bij kritieke alarmen
5. Geavanceerde filters (gemeente, activiteit, alarmstatus)

### Fase 3: Klantreis & UX Afronden (prioriteit MIDDEL)
**Focus:** Resterende UX-verbeteringen

~~1. Onboarding flow~~ **KLAAR**
~~2. UI-verbeteringen (typografie, knoppen)~~ **GROTENDEELS KLAAR**
~~3. Tekstuele begeleiding~~ **KLAAR**
~~4. Gepersonaliseerde aanbevelingen~~ **DEELS KLAAR**
~~5. Dynamisch hulpadvies~~ **KLAAR**

**Wat nog moet:**
1. Progressieve onboarding (week-voor-week introductie)
2. Slimme aanbevelingen uitbreiden (seizoen, gedrag, zorgsituatie)
3. WhatsApp check-in integratie
4. Slimme check-in frequentie
5. WCAG 2.1 AA audit en afronding
6. B1-niveau taalgebruik audit

### Fase 4: MantelBuddy Marktplaats (prioriteit HOOG - grootste open module)
**Focus:** Vrijwilligersplatform bouwen - dit is de grootste ongebouwde module

1. MantelBuddy dashboard (`/buddy/dashboard`)
2. MantelBuddy profiel (`/buddy/profiel`) met beschikbaarheid en zoekradius
3. Buddy onboarding flow (VOG, training, profiel completeren)
4. Taak aanmaken door mantelzorger
5. Takenmarktplaats overzicht voor buddies
6. Reactie & matching flow
7. Afstandsberekening (postcode-gebaseerd)
8. Beoordelingssysteem
9. Notificaties (WhatsApp + push + in-app)

### Fase 5: Gemeenteportaal Afronden (prioriteit LAAG)
**Focus:** Resterende gaps - meeste functionaliteit is al gebouwd

~~1. Gemeente authenticatie en autorisatie~~ **KLAAR**
~~2. KPI-dashboard~~ **KLAAR**
~~3. Demografische inzichten~~ **KLAAR**
~~4. Trend-analyses~~ **KLAAR**
~~5. Rapportage-generatie~~ **KLAAR**
~~6. Gemeente content management~~ **KLAAR**

**Wat nog moet:**
1. Benchmark vergelijking met landelijke gemiddelden
2. Automatische rapportage via email
3. Audit trail voor gemeente data-toegang
4. DPIA uitvoeren

### Fase 6: Innovatie (prioriteit LAAG)
**Focus:** Extra features en doorontwikkeling

1. Noodknop / SOS-functie
2. Mantelzorg-dagboek
3. Slimme herinneringen & nudges (scheduler + background jobs)
4. PWA uitbreiden (offline pagina, push notificaties, installatie-prompt)
5. Multi-taal ondersteuning
6. Huisarts-rapport delen
7. Community / lotgenotencontact
8. Gemeentelijke regelingen integratie
9. Zorgnetwerk koppeling

### Fase 7: Infrastructuur & Productie-readiness
**Focus:** Professionalisering voor productie-gebruik

1. CI/CD pipeline (GitHub Actions)
2. Gestructureerde logging (Pino/Winston)
3. Monitoring (Sentry)
4. Database backups automatiseren
5. Soft deletes implementeren
6. CSP en CORS headers
7. Background jobs framework (Bull/Agenda)
8. Dependency audit en security scan

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

*Dit document is een levend document en zal worden bijgewerkt naarmate de ontwikkeling vordert.*
*Laatste update: 16 februari 2026 - Volledige code-audit uitgevoerd en alle statussen geactualiseerd.*
