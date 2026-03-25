# MantelBuddy — Masterplan 2.0

**Datum:** 25 maart 2026
**Versie:** 2.0 — Compleet iteratieplan
**Status:** Ter bespreking
**Scope:** Beheeromgeving, Content, Hulpbronnen, Activiteiten, UI/UX, Dashboard, Design, WhatsApp, Buddy

---

## Uitgangspunten

- **95% AI-gegenereerd** — AI schrijft, mens reviewt en publiceert
- **Per woonplaats zoeken** — hulpbronnen én activiteiten, met deduplicatie
- **Beheerder = jij of gemeente-medewerker** — niet leek-proof maar wel logisch
- **Ger chatbot zoekt NIET op internet** — alleen beheer-agents gebruiken web research
- **Design-stijl:** Geïnspireerd op "Ik Sta Sterk" (VeiligheidNL) — donker paars/navy primair, roze/mauve achtergronden, geel accent, grote vette koppen, witte kaarten op kleur-achtergrond, veel witruimte, professioneel maar warm
- **On hold items blijven on hold** (SMTP, Sentry DSN, Upstash Redis, compliance track)

---

## Iteratie 1: Content Werkbank + Artikel Interactie (~39h)

**Doel:** Eén plek voor alle content, gelezen/rating tracking, dashboard aanbevelingen.

### 1.1 ArtikelInteractie model + API (4h)
- Database model: `ArtikelInteractie` (caregiverId, artikelId, gelezen, gelezenOp, rating, ratingOp)
- API endpoints: GET/POST `/api/artikel-interactie`
- Duimpje omhoog/omlaag per artikel
- Gelezen afvinken

### 1.2 Dashboard "Artikelen voor jou" (6h)
- Nieuwe sectie op dashboard: alle artikelen met 2+ tag-matches
- Meeste matches bovenaan
- Per artikel: categorie-label, emoji, titel, beschrijving
- Afvinkbaar als gelezen (grijzer, zakt naar onder)
- Duimpje omhoog/omlaag na lezen
- "Je bent helemaal bij!" als alles gelezen

### 1.3 Content Werkbank — Kanban-bord (12h)
- Eén pagina `/beheer/content-werkbank` vervangt Artikelen + Content Agent + Curator
- 6 kolommen: VOORSTEL → CONCEPT → HERSCHREVEN → VERRIJKT → GEPUBLICEERD → GEARCHIVEERD
- Drag-and-drop kaartjes tussen kolommen
- Per kolom: aantal items + gemiddelde completeness
- Filter: categorie, zorgthema, zoekterm
- Voortgangsbalk per artikel (in welke fase, hoeveel stappen nog)
- Inline AI-acties: "Herschrijf B1", "Verrijk met FAQ", "Stel tags voor"

### 1.4 "Slim Publiceren" wizard (8h)
- Stap 1: Kies categorie (Praktische tips, Zelfzorg & balans, etc.)
- Stap 2: Hiaten-analyse toont wat ontbreekt + verwachte vraag
- Stap 3: AI stelt 3 onderwerpen voor (gerangschikt op vraag)
- Stap 4: Beheerder kiest of typt eigen onderwerp
- Stap 5: AI schrijft concept (juiste tags, B1, bronvermelding)
- Stap 6: Preview + review
- Stap 7: Publiceren met tag-check
- Voortgangsbalk door alle 7 stappen

### 1.5 Duplicate-detectie (4h)
- Bij aanmaak: automatische similarity-check (vector embeddings)
- Waarschuwing: "Dit lijkt op: [titel] (87% overlap)"
- Beheerder kan doorgaan of samenvoegen
- Opschoonactie voor bestaande duplicaten (werk & mantelzorg artikelen)

### 1.6 Automatische tag-koppeling (3h)
- Bij statuswijziging: AI herbeoordeelt tags
- Bij publicatie: verplichte tag-check (min. 1 zorgthema + 1 onderwerp)
- Tag-suggesties met uitleg waarom een tag past

### 1.7 Duplicaten opschonen (2h)
- Identificeer en merge bestaande duplicaten
- Focus op werk & mantelzorg artikelen

---

## Iteratie 2: Activiteiten-agent + Hulpbronnen (~40h)

**Doel:** Lokale activiteiten ontdekken, hulpbronnen per woonplaats zoeken.

### 2.1 Activiteit database model + API (4h)
- Model: naam, beschrijving, locatie, woonplaats, gemeente, type, frequentie, dag, tijd, kosten, contact, etc.
- CRUD endpoints
- Indexen op woonplaats + gemeente + type

### 2.2 Activiteiten-zoeker agent (8h)
- web_search per woonplaats (Anthropic tool)
- Zoektermen: "mantelzorg activiteiten [woonplaats]", "buurthuis [woonplaats]", "lotgenoten [woonplaats]", "wandelgroep senioren [woonplaats]"
- Bronnen: gemeente-websites, socialekaart.nl, buurthuizen, sportverenigingen
- Deduplicatie op naam + woonplaats
- Opslaan als `isGevalideerd: false`

### 2.3 Beheer-pagina activiteiten (8h)
- Lijst + filter op woonplaats, type, gemeente
- "Zoek activiteiten" knop → AI zoekt per woonplaats
- Review-flow: AI vindt → beheerder valideert → gepubliceerd
- Maandelijkse hervalidatie

### 2.4 Gebruikerspagina activiteiten (6h)
- Gefilterd op woonplaats mantelzorger (automatisch)
- Categorieën: Lotgenoten, Sport, Sociaal, Educatie, Respijtzorg, Overig
- Per activiteit: naam, wanneer, waar, kosten, contact
- Lotgenoten voor iedereen (niet alleen alleenstaanden)

### 2.5 Hulpbronnen-zoeker per woonplaats (4h)
- Uitbreiden bestaande agent: input = woonplaats i.p.v. alleen gemeente
- Deduplicatie landelijke organisaties
- Resultaat: lokaal + regionaal + landelijk

### 2.6 Hulpbronnen wizard vereenvoudigen (6h)
- Van 20+ velden → 3 stappen: Basis → Locatie → AI verrijkt
- Stap 1: naam, website, telefoon, beschrijving
- Stap 2: dekkingsniveau + locatie (kaart/zoeken)
- Stap 3: AI vult rest in, beheerder reviewt

### 2.7 "Zoek & Voeg Toe" flow (4h)
- Beheerder kiest woonplaats
- AI zoekt op internet (deep research)
- Toont gevonden organisaties met "Toevoegen" knop
- Bij toevoegen: AI vult alle velden, beheerder reviewt

---

## Iteratie 3: Design System + UI/UX Herindeling (~38h)

**Doel:** Professionele uitstraling, consistente UI, betere navigatie.

### 3.1 Design system implementeren (10h)
**Geïnspireerd op "Ik Sta Sterk" (VeiligheidNL):**
- Kleurenpalet: donker paars/navy primair, mauve/roze achtergronden, geel/goud accent
- Typografie: grote vette koppen (Nunito Black), rustige body tekst
- Kaarten: witte kaarten met rounded corners op gekleurde achtergrond
- Radio buttons: wit op kleur (zoals valrisico-test)
- Resultaat-pagina's: illustraties in cirkels, tip-grid
- Navigatie: "Terug" + "Volgende" balk onderaan bij flows
- Veel witruimte, professioneel maar warm
- CSS variabelen herschrijven in globals.css
- Alle bestaande componenten (Button, Card, Input) aanpassen

### 3.2 Dashboard herindeling (6h)
1. Welkom + Ger (compact)
2. **"Artikelen voor jou"** (nieuw)
3. Balansthermometer
4. Weekkaarten
5. Actiepunten
6. **"Activiteiten bij jou in de buurt"** (nieuw)
- Zoekbalk bovenaan elke pagina (niet alleen via Ger)

### 3.3 Beheer-sidebar vereenvoudigen (4h)
Van 25+ items → 5 hoofdgroepen:
1. Dashboard (overzicht + analytics + artikel ratings)
2. Content (Werkbank — één plek)
3. Hulpbronnen (zoeken + beheren + validatie)
4. Activiteiten (zoeken + beheren)
5. Inrichting (gemeenten, gebruikers, instellingen)

### 3.4 Favorieten hernoemen (2h)
- "Voor jou" tab → "Mijn hulpbronnen"
- Geen verwarring met dashboard-aanbevelingen

### 3.5 Zoekbalk in navigatie (4h)
- Compacte zoekbalk/icoon in header (elke pagina)
- Semantic search via pgvector
- Resultaten uit artikelen + hulpbronnen + activiteiten

### 3.6 Consistente UI doorvoeren (6h)
- Alle pagina's: zelfde spacing, knoppen, kaarten
- Mobile-first check op alle pagina's
- Loading states: skeleton screens i.p.v. spinners

### 3.7 Balanstest restylen (6h)
- Stijl zoals "Ik Sta Sterk" valrisico-test
- Gekleurde achtergrond per vraag
- Witte antwoord-kaarten met radio buttons
- Voortgangsbalk onderaan
- Resultaat-pagina met iconen in cirkels + tip-grid

---

## Iteratie 4: AI Agents + Analytics (~28h)

**Doel:** Slimmere AI, betere inzichten, web research voor content.

### 4.1 Content-agent web research (4h)
- Anthropic web_search tool toevoegen
- Zoekt op betrouwbare bronnen bij artikel-generatie
- Automatische bronvermelding met URL

### 4.2 Hiaten-analyse gewogen op vraag (6h)
- Weeg op artikelratings (duimpjes)
- Weeg op zoekgedrag (wat vraagt men aan Ger?)
- Weeg op profieldata (welke zorgthema's meest voorkomend?)
- Output: "0 artikelen over respijtzorg voor werkenden. 43% werkt — hoge prioriteit."

### 4.3 Artikel analytics in beheerportaal (4h)
- Top 10 meest gelezen
- Top 10 hoogst gewaardeerd (duimpjes omhoog)
- Artikelen met veel duimpjes omlaag (actie nodig)
- Trend over tijd

### 4.4 WhatsApp uitbreiden (8h)
- Dagelijks check-in via WhatsApp ("Hoe gaat het?" → smiley)
- Weekkaarten sturen via WhatsApp
- Activiteiten in de buurt delen
- Artikelen als korte samenvatting + link

### 4.5 Proactieve notificaties (6h)
- "Je hebt 2 weken geen check-in gedaan"
- Seizoensgebonden tips ("Winter — tips voor thuiszorg bij kou")
- Milestone-vieringen ("Je gebruikt MantelBuddy al 3 maanden!")
- Nieuwe artikelen die matchen met profiel

---

## Iteratie 5: Buddy-systeem + Gemeente (~30h)

**Doel:** Buddy-werving verbeteren, gemeente-portaal actiever maken.

### 5.1 Buddy onboarding-flow (8h)
- Motivatie-vragenlijst (waarom wil je helpen?)
- Skill-matching profiel (wat kun je goed?)
- Onboarding na acceptatie (verwachtingen, training)
- Feedback-loop na matches (hoe ging het?)

### 5.2 Gemeente-portaal call-to-action (6h)
- "Stuur informatiepakket" workflow (geanonimiseerd)
- "Plan informatiebijeenkomst" optie
- Benchmark: vergelijking met andere gemeenten

### 5.3 Onboarding conversion verbeteren (4h)
- "Probeer zonder account" prominenter (anonieme balanstest)
- Tracking waar mensen afhaken
- Versimpelde registratie (alleen email → direct waarde)

### 5.4 Data-export voor mantelzorger (4h)
- PDF rapport: balanstest trend over tijd
- Overzicht gelezen artikelen + favorieten
- Exporteerbare hulpbronnenlijst (voor keukentafelgesprek)

### 5.5 Progressie-systeem (8h)
- Visueel: "Je voortgang als mantelzorger"
- Badges: eerste check-in, 10 artikelen gelezen, profiel compleet
- Niet gamification maar erkenning
- "Je doet het goed — vergeet niet voor jezelf te zorgen"

---

## Totaaloverzicht

| Iteratie | Focus | Uren |
|----------|-------|------|
| **1** | Content Werkbank + Artikel Interactie | ~39h |
| **2** | Activiteiten + Hulpbronnen per woonplaats | ~40h |
| **3** | Design System + UI/UX Herindeling | ~38h |
| **4** | AI Agents + Analytics + WhatsApp | ~28h |
| **5** | Buddy + Gemeente + Progressie | ~30h |
| | **Totaal** | **~175h** |

---

## On Hold (ongewijzigd)

- SMTP provider configureren
- Sentry DSN configureren
- Upstash Redis configureren
- Compliance track (DPIA, verwerkersovereenkomsten, privacy policy)
- Sentry alerts instellen

## Backlog (na Masterplan 2.0)

### Technisch
- E2E tests met Playwright
- Push notificaties (VAPID)
- 2FA voor admin (TOTP)
- Per-user AI token budget + cost dashboard
- Prompt versioning met rollback
- Supabase disaster recovery

### Features
- ML-gebaseerde aanbevelingsengine (leren van ratings + gedrag)
- Email-templates beheer
- Media-upload (S3/Cloudinary) voor artikelen
- Dark mode
- Multi-language support
- Progressieve onboarding (week 1-4 flow)
- A/B testing framework
- Contactstatus hulporganisaties (is deze organisatie nog bereikbaar?)

---

## Database-wijzigingen

| Model | Doel | Iteratie |
|-------|------|----------|
| ArtikelInteractie | Gelezen/rating per gebruiker per artikel | 1 |
| Activiteit | Lokale activiteiten en initiatieven | 2 |

SQL-scripts worden bij elke iteratie aangeleverd.

---

*Dit plan vervangt MASTERPLAN-2.0.md v1 en het vorige projectplan als leidend document.*
