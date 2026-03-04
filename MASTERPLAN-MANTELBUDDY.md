# MantelBuddy — Masterplan 2026

**Datum:** 4 maart 2026
**Versie:** 1.3
**Baseline:** v2.5.0 + doorontwikkelingen februari 2026 + content herstructurering + MantelCoach + dashboard redesign maart 2026
**Dit plan vervangt alle eerdere planbestanden.**

---

## Inhoudsopgave

1. [Huidige Staat van het Platform](#1-huidige-staat-van-het-platform)
2. [Fase 1: Beveiliging & Kritieke Fixes](#2-fase-1-beveiliging--kritieke-fixes-week-1)
3. [Fase 2: Technische Schuld & Stabiliteit](#3-fase-2-technische-schuld--stabiliteit-week-2-3)
4. [Fase 3: Persoonlijk Advies & Klantreis](#4-fase-3-persoonlijk-advies--klantreis-week-4-6)
5. [Fase 4: Buddy-matching & Kaartweergave](#5-fase-4-buddy-matching--kaartweergave-week-7-9)
6. [Fase 5: Gemeente Onboarding & Automatisering](#6-fase-5-gemeente-onboarding--automatisering-week-10-12)
7. [Fase 6: Content Migratie & CMS](#7-fase-6-content-migratie--cms-week-13-15)
8. [Fase 7: UX Polish, Toegankelijkheid & Performance](#8-fase-7-ux-polish-toegankelijkheid--performance-week-16-18)
9. [Fase 8: Schaalbaarheid & Toekomst](#9-fase-8-schaalbaarheid--toekomst-week-19)
10. [Overzichtstabel per Fase](#10-overzichtstabel-per-fase)

---

## 1. Huidige Staat van het Platform

### Tech Stack
| Component | Versie |
|-----------|--------|
| Frontend | Next.js 16.1.4, React 19.2.3, TailwindCSS 4 |
| Backend | Next.js API Routes (100+ endpoints), Prisma ORM |
| Database | PostgreSQL (Supabase) + pgvector |
| Auth | NextAuth.js v5 (JWT, credentials, magic links) |
| AI | Anthropic Claude (8 agents, incl. MantelCoach) + OpenAI embeddings |
| WhatsApp | Twilio |
| Hosting | Vercel |
| Tests | Vitest (29 tests) |

### Wat werkt (functionaliteitsoverzicht)

| Onderdeel | Status | Details |
|-----------|--------|---------|
| 8 AI agents | 100% | Ger (MantelCoach), Welkom, Balanscoach, Check-in, Analytics, Moderatie, Curator, Content Pipeline Agent |
| MantelCoach (Ger) | **NIEUW** 100% | Context-aware per pagina, per-deelgebied coaching, personalisatie op aandoening/situatie, B1-taal, doorcoaching |
| Belastbaarheidstest | 95% | 11 vragen, 10 zorgtaken, scoring, subdomeinen |
| Dashboard | **95%** | Ger-chat bovenaan, BalansThermometer met gekleurde balk + zorgtaken-hokjes, "Jouw stappen" sectie, WhatsApp |
| Hulpvragen | 90% | Gemeente-filtering, kleur-indicatoren, 2 tabs (voor jou + voor naaste), MantelBuddy actieknoppen |
| Leren/Informatie | 95% | 47 artikelen, 7 categorieën, 21 tags (aandoening/situatie), gemeente-nieuws, tag-filtering, gebruikersvoorkeuren |
| Content Pipeline | 90% | 6-staps workflow: Hiaten → Voorstellen → Concepten → Herschrijven → Verrijken → Publiceren. Volledig AI-gestuurd met matrix-analyse, batch-generatie en statustracking |
| Check-in systeem | 80% | Slimme frequentie, contextuele suggesties, trend |
| Beheerportaal | 90% | Artikelen, hulpbronnen, gebruikers, alarmen, audit |
| Gemeenteportaal | 80% | Dashboard, trends, rapportages |
| Auth & rollen | 85% | Login, register, magic links, ADMIN/GEMEENTE rollen |
| WhatsApp integratie | 75% | Webhook, test via WhatsApp, check-in |
| Onboarding | 80% | 5-stappen flow, profiel, gemeente-zoek |
| MantelBuddy's (/buddys) | 75% | Kaart + matching, hulpvraag plaatsen, mijn vragen beheren, buddy-reacties, chat. Vervangt /marktplaats |
| PWA | 60% | Manifest, service worker, installeerbaar (placeholder iconen) |
| UI/UX senioren | **75%** | Grote fonts, hoog contrast, Verstuur-knoppen, gekleurde thermometer, zorgtaken-hokjes |

### Bekende Problemen (uit alle analyses)

| # | Probleem | Ernst | Status |
|---|----------|-------|--------|
| 1 | ~~`.env.production` met API-keys staat in git~~ | ~~KRITIEK~~ | ✅ **OPGELOST** — in `.gitignore`, niet meer in repo |
| 2 | ~~`TAAK_NAAR_ONDERDEEL` mapping is volledig fout~~ | ~~KRITIEK~~ | ◑ **DEELS** — `options.ts` correct, WhatsApp nog hardcoded |
| 3 | ~~`niveauFilter` in hulpbronnen.ts wordt genegeerd~~ | ~~HOOG~~ | ✅ **OPGELOST** — filtert nu op zichtbaarBijLaag/Gemiddeld/Hoog |
| 4 | Input validatie ontbreekt bij 45+ API routes | HOOG | ⚠️ Minimaal — Zod alleen in `validations.ts` |
| 5 | ~~Build script gebruikt `--accept-data-loss`~~ | ~~HOOG~~ | ✅ **OPGELOST** — verwijderd |
| 6 | WhatsApp sessies in-memory (geen persistentie) | HOOG | ❌ Open |
| 7 | ~~26x~~ 16x `as any` in code (type safety) | GEMIDDELD | ◑ Verbeterd (26→16) |
| 8 | ~~Inconsistente error responses (4 formaten)~~ | ~~GEMIDDELD~~ | ✅ **OPGELOST** — `api-response.ts` helper actief |
| 9 | Geen caching strategie (94/96 routes force-dynamic) | GEMIDDELD | ❌ Open |
| 10 | ~~Ontbrekende database indexes~~ | ~~GEMIDDELD~~ | ✅ **OPGELOST** — uitgebreide indexes aanwezig |
| 11 | 170+ content-items hardcoded in broncode | GEMIDDELD | ◑ Deels (tag-systeem gereed, content nog in code) |
| 12 | `isActief` niet afgedwongen bij login | GEMIDDELD | ❌ Open — niet gecheckt in `auth.ts` |
| 13 | WhatsApp alarm-detectie ontbreekt | HOOG | ❌ Open |
| 14 | Ontbrekende cascade deletes in Prisma | LAAG | ❌ Open |
| 15 | Geen service layer (Prisma direct in routes) | LAAG | ❌ Open |

---

## 2. Fase 1: Beveiliging & Kritieke Fixes (Week 1)

> **Doel:** Alle kritieke beveiligingsproblemen oplossen en functie-brekende bugs fixen.
> **Motto:** "Eerst het huis op orde."

### 1.1 API-keys uit git verwijderen ✅ GEREED
**Prioriteit: KRITIEK — OPGELOST**

`.env.production` staat in `.gitignore` en is niet meer aanwezig in de repository.

### 1.2 Build script beveiligen ✅ GEREED
**Prioriteit: KRITIEK — OPGELOST**

`--accept-data-loss` is verwijderd. Build script gebruikt nu `prisma db push --skip-generate`.

### 1.3 TAAK_NAAR_ONDERDEEL mapping fixen ◑ DEELS GEREED
**Prioriteit: KRITIEK**

Mapping in `src/config/options.ts` is correct. **Nog te doen:** de WhatsApp handler (`src/app/api/whatsapp/webhook/handlers/belastbaarheidstest.ts`) bevat nog een hardcoded mapping (regels 318-327) die niet de centrale config gebruikt en t9/t10 mist.

### 1.4 niveauFilter activeren in hulpbronnen ✅ GEREED
**Prioriteit: HOOG — OPGELOST**

Filtert nu correct op `zichtbaarBijLaag/Gemiddeld/Hoog` velden in alle Prisma queries.

### 1.5 isActief afdwingen bij login
**Prioriteit: HOOG — NOG OPEN**

De `authorize` callback in `src/lib/auth.ts` checkt het `isActive` veld op User **niet** bij login. Inactieve gebruikers en gemeenten kunnen nog inloggen.

**Bestand:** `src/lib/auth.ts`

### 1.6 WhatsApp alarm-detectie toevoegen
**Prioriteit: HOOG — NOG OPEN**

De WhatsApp-handler voert geen alarm-detectie (`checkAlarmindicatoren()`) uit na test-voltooiing. Geen integratie met `AlarmLog` model.

**Bestand:** `src/app/api/whatsapp/webhook/handlers/belastbaarheidstest.ts`

### 1.7 Health-check endpoint ✅ GEREED
**Prioriteit: GEMIDDELD — OPGELOST**

`/api/health` endpoint operationeel met database connectie-check, latency meting en environment validatie.

### Deliverables Fase 1
- [x] Geen API-keys meer in git
- [x] Build script zonder `--accept-data-loss`
- [x] Correcte taak-naar-hulpcategorie mapping (hoofdflow; WhatsApp nog hardcoded)
- [x] Score-gebaseerde hulpbron-filtering werkt
- [ ] ~~Gemeente-login~~ Alle logins respecteren isActief
- [ ] WhatsApp alarm-detectie actief
- [ ] WhatsApp TAAK_NAAR_ONDERDEEL uit centrale config halen
- [x] Health-check endpoint operationeel

**Status:** ◑ Grotendeels gereed — 5/7 items af, 2 open (isActief + WhatsApp alarm)

---

## 3. Fase 2: Technische Schuld & Stabiliteit (Week 2-3)

> **Doel:** API-kwaliteit, type safety en testdekking verhogen.
> **Motto:** "Stevig fundament onder nieuwe features."

### 2.1 Input validatie toevoegen (Zod schemas)
**Prioriteit: HOOG**

Zod schemas toevoegen voor alle 45+ routes zonder validatie. Top prioriteit:

| Route | Reden |
|-------|-------|
| `api/belastbaarheidstest/route.ts` | Grote form, 12 vragen + taken |
| `api/intake/route.ts` | Gebruikersinvoer zonder schema |
| `api/beheer/gebruikers/[id]/route.ts` | Admin operaties |
| `api/gemeente/*/route.ts` | Filterparameters |

**Bestand:** Uitbreiden `src/lib/validations.ts` + toepassen in routes.

### 2.2 Consistente error responses ✅ GEREED
**Prioriteit: GEMIDDELD — OPGELOST**

`src/lib/api-response.ts` bevat helpers: `unauthorized()`, `forbidden()`, `notFound()`, `badRequest()`, `conflict()`, `methodNotAllowed()`, `internal()` + `apiSuccess<T>()`.

### 2.3 Type safety verbeteren
**Prioriteit: GEMIDDELD — VERBETERD**

- `as any` teruggebracht van 26 naar 16 instanties
- Resterende locaties: belastbaarheidstest (4x), content/route seed (3x), gemeente/layout (4x), WellbeingChart (1x), gemeente-auth (1x), pdf-rapport (2x)
- Focus nog nodig: `gemeente/layout.tsx` session casting, `belastbaarheidstest.ts` type casting

### 2.4 Database optimalisatie ✅ GEREED
**Prioriteit: GEMIDDELD — OPGELOST**

Uitgebreide indexes aanwezig:
- `BelastbaarheidTest`: 4 indexes (caregiverId, gemeente, isCompleted+gemeente, completedAt)
- `Zorgorganisatie`: 3 indexes (isActief+gemeente, isActief+onderdeelTest, gemeente)
- `Artikel`: 4 indexes (categorie+isActief, type+isActief, gemeente, subHoofdstuk)
- `User`, `MantelBuddy` en gerelateerde tabellen: geindexeerd

Cascade deletes nog te configureren.

### 2.5 Testdekking verhogen (29 → 50+)
**Prioriteit: GEMIDDELD**

Nieuwe tests voor:
- Belastbaarheidstest scoreberekening (edge cases)
- Deelgebieden berekening
- Dashboard API response structuur
- Auth flow (login, register, magic link)
- Gemeente resolver
- Rate limiting

**Bestand:** `__tests__/` directory uitbreiden.

### 2.6 Structured logging doorvoeren
**Prioriteit: LAAG**

Pino is al geinstalleerd. Consistent JSON-formaat doorvoeren in alle API routes.
Error boundary component met fallback UI toevoegen.

### Deliverables Fase 2
- [ ] Zod validatie op alle publieke API routes
- [x] Consistente error response helper in gebruik
- [ ] 0x `as any` in codebase (nu 16, was 26)
- [x] Database indexes toegevoegd
- [ ] 50+ werkende tests
- [ ] Structured logging actief
- [ ] Cascade deletes configureren

**Status:** ◑ Deels gereed — 2/6 items af, rest open

---

## 4. Fase 3: Persoonlijk Advies & Klantreis (Week 4-6)

> **Doel:** Direct persoonlijke, herkenbare feedback na de balanstest.
> **Motto:** "Van test naar actie — directe, persoonlijke feedback."

### 3.1 Persoonlijk advies pagina na test
**Prioriteit: HOOG**

Nieuwe pagina `/rapport/persoonlijk` die direct na de test getoond wordt:

1. **Scoreweergave met context** — Totaalscore + persoonlijke tekst
2. **Deelgebieden samenvatting** — Energie/Gevoel/Tijd met percentages en toelichting
3. **Top 3 vervolgstappen** — Op basis van zwaarste deelgebied + geselecteerde taken
4. **Gemeente-specifiek advies** — Lokale hulpbronnen en contactgegevens

**Bestanden:**
- Nieuw: `src/app/(dashboard)/rapport/persoonlijk/page.tsx`
- Nieuw: `src/lib/rapport/persoonlijk-advies.ts`
- Wijzig: `src/app/(dashboard)/belastbaarheidstest/page.tsx` (redirect na test)

### 3.2 Ger pro-actief na test ✅ GEREED
**Prioriteit: HOOG — OPGELOST**

Na test-voltooiing verschijnt direct een AgentChat component met Ger (MantelCoach) die:
- Automatisch een persoonlijk bericht genereert op basis van score, niveau, uren en taken
- Per-deelgebied (Energie/Gevoel/Tijd) coaching biedt
- Personaliseert op aandoening en situatie (dementie, werkend, jong, etc.)
- Dashboard-begroeting past zich aan op testniveau (zwaar/matig/goed)

**Bestanden:** `belastbaarheidstest/page.tsx`, `DashboardGerChat.tsx`, `balanscoach.ts` (MantelCoach prompt)

### 3.3 Gastgebruiker flow verbeteren
**Prioriteit: HOOG**

- Persoonlijk advies pagina ook voor gasten (localStorage data)
- Duidelijke CTA: "Maak een account aan om je resultaten te bewaren"
- Na account aanmaken: automatisch testresultaten koppelen

### 3.4 Dashboard herstructureren ✅ GEREED
**Prioriteit: GEMIDDELD — OPGELOST**

Dashboard volledig herontworpen (maart 2026):
- ✅ **Ger-chat bovenaan** — DashboardGerChat als eerste sectie met proactieve begroeting
- ✅ **"Jouw stappen" sectie** — Gepersonaliseerd stappenplan per gemeente en testniveau (max 3 stappen)
- ✅ **BalansThermometer redesign** — Gekleurde balk (groen/oranje/rood), zorgtaken in 3 hokjes, deelgebieden
- ✅ **Zorgtaken in hokjes** — Licht (groen), Matig (oranje), Zwaar (rood) met aantallen
- ✅ **FloatingGerChat op alle pagina's** — Context-aware per pagina met "Verstuur" knop
- ✅ **WhatsApp sectie** — QR-code + directe link naar Ger via WhatsApp

### 3.5 Noodknop / SOS functie
**Prioriteit: GEMIDDELD**

Prominente "Ik heb NU hulp nodig" knop op het dashboard:
- Mantelzorglijn: 030-164 0 164
- Huisarts (als ingevuld)
- 112 bij nood
- Crisislijn

Geen inlog vereist voor de homepage-variant.

### Deliverables Fase 3
- [ ] Persoonlijk advies pagina na balanstest (apart van rapport)
- [x] Ger genereert automatisch bericht na test (MantelCoach)
- [ ] Gastgebruikers zien ook persoonlijk advies
- [x] Dashboard geherstructureerd met Ger, stappen, balanskaart, zorgtaken-hokjes
- [ ] SOS-knop op dashboard en homepage

**Status:** ◑ Deels gereed — 2/5 items af (+ MantelCoach als bonus), 3 open

---

## 5. Fase 4: Buddy-matching & Kaartweergave (Week 7-9)

> **Doel:** Mantelzorgers koppelen aan passende vrijwilligers in de buurt.
> **Motto:** "De juiste hulp, dichtbij."

### 4.1 Database uitbreiden voor matching
**Prioriteit: HOOG**

```
MantelBuddy: + latitude (Float?), + longitude (Float?), + maxReisafstand (Int?), + biografie (String?), + profielfoto (String?)
Caregiver: + latitude (Float?), + longitude (Float?)
```

### 4.2 PDOK geocoding
**Prioriteit: HOOG**

Postcode naar coordinaten via PDOK Locatieserver (gratis, overheids-API).
Haversine formule voor afstandsberekening.

**Bestanden:**
- Nieuw: `src/lib/geocode.ts`
- Wijzig: `src/app/api/mantelbuddy/aanmelden/route.ts`

### 4.3 Match-algoritme bouwen
**Prioriteit: HOOG**

Score op basis van drie factoren:

| Factor | Gewicht | Berekening |
|--------|---------|------------|
| Taak-overlap | 50% | Hoeveel zorgtaken matchen de hulpvormen van de buddy? |
| Afstand | 30% | <5km=100%, 5-10km=70%, 10-20km=40%, >20km=10% |
| Beschikbaarheid | 20% | Past beschikbaarheid bij de vraag? + VOG + training |

**Bestanden:**
- Nieuw: `src/lib/matching.ts`
- Nieuw: `src/app/api/buddys/match/route.ts`

### 4.4 Kaartweergave met Leaflet
**Prioriteit: GEMIDDELD**

Leaflet.js (al in dependencies) voor kaartweergave:
- Locatie naaste centraal + beschikbare buddys als markers
- Matchpercentage badge op elke marker
- Profiel-popup bij klik
- Radiusfilter: 5km / 10km / 20km
- Privacy: buddy-locatie afgerond op 500m

**Bestanden:**
- Nieuw: `src/components/BuddyKaart.tsx`
- Nieuw: `src/components/BuddyMarker.tsx`
- Nieuw: `src/components/BuddyProfielPopup.tsx`

### 4.5 Buddy zoek- en matchpagina ✅ GEBOUWD
**Status: Grotendeels gereed**

Pagina `/buddys` met 3 tabs:
- **Zoek buddy** — Kaart (Leaflet) met buddys in de buurt, matchpercentage, filters op afstand/zorgtaak
- **Hulpvraag** — Hulpvraag plaatsen (vervangt oude /marktplaats functionaliteit)
- **Mijn vragen** — Overzicht eigen hulpvragen, buddy-reacties accepteren/afwijzen, chat

### 4.6 Hulpvragenflow herstructureren ✅ GEBOUWD
**Status: Gereed**

De hulpvragenpagina (`/hulpvragen`) heeft nu:
- 2 tabs: **Voor jou** (hulpbronnen/organisaties) + **Voor naaste** (zorgtaak-specifieke hulp)
- Actieknoppen onderaan: "Zoek een MantelBuddy" → `/buddys` + "Stel een hulpvraag" → `/buddys?tab=hulpvraag`
- Geen buddyhulp-tab meer (zit nu in `/buddys`)
- De standalone `/marktplaats` pagina is verwijderd; alle links wijzen naar `/buddys`

**Bestanden:**
- `src/app/(dashboard)/hulpvragen/page.tsx` (geherstructureerd)
- `src/app/(dashboard)/buddys/page.tsx` (nieuw, vervangt /marktplaats)
- `src/app/(dashboard)/marktplaats/` (verwijderd)

### Deliverables Fase 4
- [x] Werkend match-algoritme met geocoding
- [x] Kaartweergave met Leaflet en buddy-markers
- [x] Buddy zoekpagina met match% en filters
- [x] Geintegreerde hulpvragenflow (buddys + organisaties)
- [ ] Tests voor matching-algoritme en geocoding

**Geschatte doorlooptijd:** 3 weken (~48 uur)

---

## 6. Fase 5: Gemeente Onboarding & Automatisering (Week 10-12)

> **Doel:** Gemeenten snel en compleet onboarden + automatische opvolging na balanstest.
> **Motto:** "Gemeenten in 15 minuten live."

### 5.1 Gemeente onboarding wizard
**Prioriteit: HOOG**

Nieuwe pagina `/beheer/gemeenten/nieuw` met 5-stappen stepper:

1. **Gemeente kiezen** — PDOK autocomplete, CBS-code, check of gemeente al bestaat
2. **Contactgegevens** — Email, telefoon, website, WMO loket URL
3. **Lokale hulpbronnen koppelen** — Automatisch zoeken in bestaande hulpbronnen
4. **Advies per belastingniveau** — Tekstvelden LAAG/GEMIDDELD/HOOG + organisatie koppelen
5. **Eerste beheerder aanmaken** — Email, naam, rol, account of uitnodigingslink

**Bestanden:**
- Nieuw: `src/app/beheer/gemeenten/nieuw/page.tsx`
- Nieuw: `src/app/api/beheer/gemeenten/onboarding/route.ts`
- Nieuw: `src/app/api/beheer/gemeenten/hulpbronnen-zoek/route.ts`

### 5.2 Balanstest opvolging automatiseren
**Prioriteit: HOOG**

Na test-voltooiing automatisch:

| Actie | Trigger | Detail |
|-------|---------|--------|
| E-mail met resultaten | Direct na test | Score-samenvatting, top 3 tips, gemeente-contacten |
| Check-in reminder plannen | Direct na test | HOOG=1 week, GEMIDDELD=2 weken, LAAG=4 weken |
| Gemeente-notificatie | Bij CRITICAL/HIGH alarm | Geanonimiseerd naar gemeente contactemail |
| Fix: gemeente op test | Bij ingelogde user | Municipality uit Caregiver profiel |

**Bestanden:**
- Nieuw: `src/lib/email/balanstest-resultaat.ts`
- Nieuw: `src/lib/email/gemeente-alarm-notificatie.ts`
- Nieuw: `src/lib/check-in/plan-check-in.ts`
- Wijzig: `src/app/api/belastbaarheidstest/route.ts`

### 5.3 Smart check-in herinneringen
**Prioriteit: GEMIDDELD**

Proactieve herinneringen via WhatsApp of in-app:
- HOOG: wekelijks
- GEMIDDELD: tweewekelijks
- LAAG: maandelijks

Via Vercel Cron + WhatsApp (Twilio) + in-app notificatie fallback.

### 5.4 Gemeente dashboard opvolging
**Prioriteit: GEMIDDELD**

Nieuw component op gemeente-dashboard:
- Nieuwe tests deze week (waarvan HOOG)
- Open alarmen
- Geplande check-ins + niet-uitgevoerde check-ins

**Bestanden:**
- Nieuw: `src/components/gemeente/OpvolgingKaart.tsx`
- Nieuw: `src/app/api/gemeente/opvolging/route.ts`

### Deliverables Fase 5
- [ ] Werkende gemeente onboarding wizard (5 stappen)
- [ ] Automatische e-mail na balanstest
- [ ] Automatische check-in planning
- [ ] Gemeente-alarmnotificatie bij hoge belasting
- [ ] Smart check-in herinneringen
- [ ] Gemeente opvolgingsdashboard

**Geschatte doorlooptijd:** 3 weken (~48 uur)

---

## 7. Fase 6: Content Migratie & CMS (Week 13-15)

> **Doel:** Alle hardcoded content naar database verplaatsen en beheerbaar maken.
> **Motto:** "Geen tekst meer in de code."

### 6.1 Nieuwe database modellen

9 nieuwe modellen (6 origineel + 3 uit content herstructurering):

| Model | Doel | Items | Status |
|-------|------|-------|--------|
| `BalanstestVraag` | Balanstest + check-in vragen | ~16 | Gereed |
| `Zorgtaak` | Zorgtaak definities | ~10 | Gereed |
| `TaakCategorieMapping` | Taak-naar-categorie koppelingen | ~25 | Gereed |
| `ContentCategorie` | Leren/hulpvraag/WhatsApp categorieën | ~60 | Gereed |
| `FormulierOptie` | Alle dropdown/selectie opties | ~30 | Gereed |
| `AppContent` | Onboarding, tutorial, pagina-intro's | ~30 | Gereed |
| `ContentTag` | Tags voor aandoeningen (12) en situaties (9) | 21 | **NIEUW - Gereed** |
| `ArtikelTag` | Many-to-many koppeling artikelen ↔ tags | variabel | **NIEUW - Gereed** |
| `GebruikerVoorkeur` | Gebruikersvoorkeuren (categorie/tag selecties) | variabel | **NIEUW - Gereed** |

### 6.2 Content Herstructurering (maart 2026)

**Status: GEREED** — Geïmplementeerd op 2 maart 2026

#### Categorie herstructurering (5 → 7 categorieën)
| Oud | Nieuw | Actie |
|-----|-------|-------|
| praktische-tips | praktische-tips | Ongewijzigd |
| zelfzorg | zelfzorg-balans | Hernoemd |
| rechten | rechten-regelingen | Hernoemd |
| financieel | geld-financien | Hernoemd |
| hulpmiddelen-producten | hulpmiddelen-technologie | Hernoemd |
| — | werk-mantelzorg | **Nieuw** |
| — | samenwerken-netwerk | **Nieuw** |

#### Tag-systeem (21 tags)
- **12 aandoeningen:** dementie, kanker, CVA/beroerte, psychisch, verstandelijke beperking, lichamelijke beperking, ouderdom, chronisch ziek, NAH, parkinson, ALS, terminaal/palliatief
- **9 situaties:** werkend, jong, op afstand, alleenstaand, meervoudig, partnerzorg, ouder→kind, kind→ouder, rouwend

#### Verwijderd: `belastingNiveau` veld
Het `BelastingNiveauFilter` enum en `belastingNiveau` veld op `Artikel` zijn verwijderd. Content personalisatie verloopt nu via tags en gebruikersvoorkeuren i.p.v. het statische belastingniveau-filter.

#### Nieuwe API endpoints
| Endpoint | Functie |
|----------|---------|
| `GET/POST /api/beheer/content-tags` | CRUD voor tags (admin) |
| `GET /api/content/tags` | Publieke tags voor frontend |
| `GET/POST /api/user/voorkeuren` | Gebruikersvoorkeuren opslaan/laden |

#### Content Pipeline (maart 2026)

**Status: GEREED** — Volledig geïmplementeerde 6-staps content workflow.

De Content Agent pagina (`/beheer/content-agent`) is omgebouwd tot een **pipeline** met duidelijke statusovergangen:

```
📊 Hiaten → 💡 Voorstellen → 📝 Concepten → ✏️ Herschreven → 🔍 Verrijkt → ✅ Gepubliceerd
```

**ArtikelStatus enum** uitgebreid met pipeline-statussen:
| Status | Betekenis | Overgang naar |
|--------|-----------|---------------|
| `VOORSTEL` | Idee uit hiaten-analyse of online zoeken | → CONCEPT (via genereren) |
| `CONCEPT` | AI-gegenereerd artikel, klaar voor review | → HERSCHREVEN (via herschrijven) |
| `HERSCHREVEN` | Herschreven op B1-niveau | → VERRIJKT (via verrijken) |
| `VERRIJKT` | Verrijkt met tips/FAQ/bronnen | → GEPUBLICEERD (via publiceren) |
| `GEPUBLICEERD` | Live voor gebruikers | → GEARCHIVEERD |
| `GEARCHIVEERD` | Niet meer zichtbaar | — |

**Pipeline acties:**
| Stap | Actie | API type | Beschrijving |
|------|-------|----------|--------------|
| 1 | Hiaten-analyse | `hiaten-analyse` | Categorie × tag dekkingsmatrix, AI identificeert ontbrekende content |
| 2 | Voorstellen opslaan | `voorstellen-opslaan` | Geselecteerde AI-voorstellen opslaan als VOORSTEL-artikelen |
| 3 | Artikelen genereren | `batch-genereer` | Volledige artikelen genereren uit voorstellen (→ CONCEPT) |
| 4 | Herschrijven | `herschrijf` + `toepassen-herschrijving` | B1-niveau herschrijving met before/after preview (→ HERSCHREVEN) |
| 5 | Verrijken | `verrijk` + `toepassen-verrijking` | Tips, FAQ, bronnen toevoegen (→ VERRIJKT) |
| 6 | Publiceren | `wijzig-status` | Bulk-publicatie naar GEPUBLICEERD |

**Extra API endpoints:**
| Endpoint (POST type) | Functie |
|----------|---------|
| `pipeline-overzicht` | Aantallen per status + artikelen per pipeline-stap |
| `voorstellen-opslaan` | Hiaten-voorstellen opslaan als VOORSTEL-artikelen |
| `toepassen-verrijking` | Verrijkte inhoud toepassen + status → VERRIJKT |
| `wijzig-status` | Bulk statuswijziging (publiceren, archiveren, etc.) |

#### Content Agent acties (legacy, nog beschikbaar)
- Tags parameter bij alle acties (genereer, zoek-online)
- Hiaten-analyse (categorie × tag matrix)
- Batch-genereer (meerdere artikelen in één keer)
- Zoek-online (online bronnen doorzoeken)
- Individueel genereren, herschrijven, verrijken
- Bulk categoriseren

#### Frontend updates
- `/leren` pagina: 7 categorie-kaarten i.p.v. 5
- `/leren/[categorie]` pagina: tag-filter bar, tag-badges op artikelen
- `/profiel` pagina: "Jouw situatie" blok (aandoening, situatie, categorie-interesses)
- `/beheer/artikelen`: tag-selector i.p.v. belastingniveau dropdown
- `/beheer/content-agent`: categorie/tag selectors, hiaten-analyse tab

### 6.3 Seed scripts & migratie

- `scripts/seed-content.ts` — alle huidige hardcoded content naar database
- `scripts/seed-content-herstructurering.ts` — **NIEUW** — categorie slug-migratie, subcategorieën, tags

### 6.4 API endpoints (beheer + publiek)

~13 nieuwe API routes voor CRUD + read-only endpoints (inclusief tag en voorkeur endpoints).

### 6.5 Beheer pagina's (5 nieuwe secties)

| Pagina | Functie |
|--------|---------|
| `/beheer/balanstest-vragen` | Beheer balanstest en check-in vragen |
| `/beheer/zorgtaken` | Beheer zorgtaken en mappings |
| `/beheer/categorieen` | Beheer alle categorieën |
| `/beheer/formulier-opties` | Beheer formulier opties |
| `/beheer/app-content` | Beheer app content (onboarding, tutorial) |

### 6.6 Frontend refactoring

8+ bestanden omzetten van hardcoded imports naar API calls:
- `belastbaarheidstest/page.tsx`
- `check-in/page.tsx`
- `hulpvragen/page.tsx`
- `leren/page.tsx` + `[categorie]/page.tsx`
- `Onboarding.tsx`
- `Tutorial.tsx`
- `word-mantelbuddy/page.tsx`
- `whatsapp-session.ts`

### 6.7 WhatsApp sessies naar database
**Prioriteit: HOOG**

In-memory `Map` objecten vervangen door Prisma model `WhatsAppSession` met JSON data-veld en TTL van 30 minuten.

### Deliverables Fase 6
- [x] 9 nieuwe database modellen + migraties (inclusief ContentTag, ArtikelTag, GebruikerVoorkeur)
- [x] Content herstructurering: 7 categorieën, 21 tags, tag-filtering
- [x] belastingNiveau veld verwijderd, vervangen door tag-systeem
- [x] Content Agent: hiaten-analyse + batch-genereer
- [x] Gebruikersvoorkeuren (profiel pagina)
- [x] Content Pipeline: 6-staps workflow (VOORSTEL → CONCEPT → HERSCHREVEN → VERRIJKT → GEPUBLICEERD)
- [x] Pipeline UI met selectie, batch-acties, preview en statusovergangen
- [x] ArtikelStatus uitgebreid met VOORSTEL, HERSCHREVEN, VERRIJKT
- [ ] Alle overige content in database (170+ items)
- [ ] 5 nieuwe beheer pagina's
- [ ] Frontend leest volledig uit database i.p.v. code
- [ ] WhatsApp sessies persistent in database

**Geschatte doorlooptijd:** 3 weken (~48 uur)

---

## 8. Fase 7: UX Polish, Toegankelijkheid & Performance (Week 16-18)

> **Doel:** De app optimaliseren voor de doelgroep (oudere gebruikers) en sneller maken.
> **Motto:** "Snel, helder, toegankelijk."

### 7.1 Ger prominent maken ✅ GEREED
**Prioriteit: HOOG — OPGELOST**

Volledig geimplementeerd (maart 2026):
- ✅ **Dashboard**: `DashboardGerChat` bovenaan met proactieve begroeting, quick-action knoppen
- ✅ **Alle pagina's**: `FloatingGerChat` context-aware per pagina (informatie, hulp, buddys, balanstest, etc.)
- ✅ **MantelCoach branding**: Ger heet overal "Je MantelCoach", consistent kleurschema
- ✅ **Visuele upgrade**: GerAvatar component, typindicator, "Verstuur" knop consistent
- ✅ **Homepage**: Ingebedde chat met Ger

**Bestanden:** `DashboardGerChat.tsx`, `FloatingGerChat.tsx`, `GerAvatar.tsx`, `balanscoach.ts`

### 7.2 Navigatie verbeteren ✅ GROTENDEELS GEREED
**Prioriteit: GEMIDDELD**

- ✅ "Marktplaats" hernoemd naar "Mantelbuddy's" in navigatie
- ✅ Badge met buddy-matches op navigatie (amber badge voor zware taken)
- ❌ "Opgeslagen" toevoegen aan navigatie (nog te doen — lage prioriteit)

**Bestanden:** `src/components/navigation/MobileNav.tsx`, `src/components/layout/Navbar.tsx`

### 7.3 Caching strategie implementeren
**Prioriteit: GEMIDDELD**

| Type | Cache |
|------|-------|
| Statische content (artikelen, hulpbronnen) | `s-maxage=3600, stale-while-revalidate=86400` |
| Per-gebruiker data (dashboard, profiel) | `private, s-maxage=60, stale-while-revalidate=300` |
| Gemeente statistieken | `private, s-maxage=300, stale-while-revalidate=3600` |
| Mutaties & auth | `force-dynamic` (huidig behouden) |

### 7.4 N+1 queries oplossen
**Prioriteit: GEMIDDELD**

- Diepe queries opsplitsen in gerichte queries
- Database-aggregatie voor statistieken
- Paginatie toevoegen aan alle list-endpoints

### 7.5 Toegankelijkheid (WCAG 2.1 AA)
**Prioriteit: GEMIDDELD**

- Screen reader support met aria-labels
- Keyboard navigatie op alle functies
- WCAG AAA contrast audit (7:1 ratio)
- B1-taalaudit op alle teksten
- Echte PWA iconen (nu placeholders)

### 7.6 Service layer introduceren
**Prioriteit: LAAG**

Service modules per domein:
```
src/lib/services/
  caregiver.service.ts
  belastbaarheid.service.ts
  gemeente.service.ts
  beheer.service.ts
  notificatie.service.ts
```

### 7.7 Testdekking afronden (50 → 60+)
**Prioriteit: GEMIDDELD**

Aanvullende tests voor: matching-algoritme, geocoding, gemeente wizard, buddy-flow, content API.

### Deliverables Fase 7
- [x] Ger prominent op homepage en dashboard (MantelCoach + DashboardGerChat + FloatingGerChat)
- [x] Verbeterde navigatie met buddy-badges
- [ ] Caching op alle relevante routes
- [ ] N+1 queries opgelost
- [ ] WCAG 2.1 AA compliant
- [ ] 60+ tests
- [ ] Service layer voor kernfuncties

**Status:** ◑ Deels gereed — 2/7 items af (Ger + navigatie), 5 open

---

## 9. Fase 8: Schaalbaarheid & Toekomst (Week 19+)

> **Doel:** Platform klaar maken voor groei en toekomstige features.
> **Motto:** "Klaar voor de toekomst."

### 8.1 Geavanceerde features (backlog)

Deze items zijn bewust geparkeerd omdat ze pas waardevol zijn nadat de basis stevig staat:

| Feature | Reden voor later |
|---------|-----------------|
| Progressieve onboarding (week 1-4) | Complex, eerst basis goed maken |
| Actiekaarten (vandaag/week/ontlasten) | Pas na dashboard herstructurering |
| Weekplan met favorieten | Complexe feature, bewezen vraag eerst valideren |
| Contactstatus bij hulporganisaties | HulpbronContact model, pas na hulpvragenflow |
| Zorgtaken pagina (`/zorgtaken`) | Pas na content migratie |
| 2FA voor admin | **GEBLOKKEERD — zie 8.3** |
| Rich text editor uitbreiden | TipTap is al geinstalleerd |
| Media-upload (S3/Cloudinary) | Externe afhankelijkheid |
| Push notificaties | Vereist VAPID keys + backend |
| Seizoensgebonden content | Aanbevelingsengine, pas na CMS migratie |
| Email-templates beheer | Vereist email service uitbreiding |
| Gemeente-admin content per niveau | Pas na content migratie (deels gereed via tag-systeem) |
| Slimme aanbevelingsengine | Machine learning, pas na voldoende data |
| Verwerkersovereenkomsten | **GEBLOKKEERD — zie 8.4** |

### 8.2 Monitoring & observability

- APM integratie (Vercel Analytics of Sentry)
- Uptime monitoring via health-check
- Database performance monitoring
- Error tracking met context (userId, route, params)

### 8.3 2FA voor admin-accounts
**Status: GEBLOKKEERD — Mailserver nog niet operationeel**

> **MAG NIET VERGETEN WORDEN** — Dit is een essentieel beveiligingsonderdeel.

2FA (Two-Factor Authentication) voor admin- en gemeente-admin accounts kan **niet** geïmplementeerd worden zolang er geen werkende mailserver/SMTP-service is geconfigureerd. 2FA vereist:

1. **E-mailservice** voor het versturen van verificatiecodes (of als fallback-kanaal)
2. **TOTP library** (bijv. `otplib`) voor authenticator app support
3. **Recovery codes** die per e-mail verzonden kunnen worden

**Voorwaarden:**
- [ ] SMTP-service configureren (bijv. SendGrid, Resend, AWS SES)
- [ ] E-mail versturen werkend krijgen (wachtwoord reset, magic links, verificatie)
- [ ] Pas daarna: TOTP-based 2FA implementeren voor admin accounts
- [ ] QR-code scannen + backup codes flow

**Tijdlijn:** Zodra mailserver operationeel is. Prioriteit: HOOG voor productie.

### 8.4 Verwerkersovereenkomsten (AVG)
**Status: GEBLOKKEERD — Juridisch traject nog niet gestart**

> **MAG NIET VERGETEN WORDEN** — Dit is een wettelijke verplichting onder de AVG/GDPR.

Verwerkersovereenkomsten (data processing agreements) moeten afgesloten worden met alle externe dienstverleners die persoonsgegevens verwerken:

| Dienstverlener | Type gegevens | Status |
|----------------|---------------|--------|
| Supabase (database) | Alle persoonsgegevens, gezondheidsdata (Art. 9 AVG) | **TODO** |
| Vercel (hosting) | IP-adressen, sessiedata | **TODO** |
| Anthropic (AI) | Gespreksinhoud, zorgsituatie | **TODO** |
| OpenAI (embeddings) | Artikelinhoud (geen persoonsgegevens) | **TODO — controleer** |
| Twilio (WhatsApp) | Telefoonnummers, chatberichten | **TODO** |

**Acties:**
- [ ] Verwerkersovereenkomst opstellen/ondertekenen per leverancier
- [ ] DPIA (Data Protection Impact Assessment) uitvoeren vanwege gezondheidsdata
- [ ] Privacy policy updaten met alle verwerkers
- [ ] Register van verwerkingsactiviteiten bijhouden (Art. 30 AVG)
- [ ] Toezien op sub-verwerkers (Supabase → AWS, Vercel → AWS, etc.)

**Tijdlijn:** Voor lancering in productie met echte gebruikersdata. Juridisch advies inwinnen.

---

## 10. Overzichtstabel per Fase

```
Fase    Naam                              Week    Uren    Status
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1       Beveiliging & Kritieke Fixes      1       16u     ◑ 5/7 gereed (isActief + WhatsApp alarm open)
2       Technische Schuld & Stabiliteit   2-3     32u     ◑ 2/6 gereed (error helper + indexes)
3       Persoonlijk Advies & Klantreis    4-6     48u     ◑ 2/5 gereed (MantelCoach + dashboard redesign)
4       Buddy-matching & Kaartweergave    7-9     48u     ◑ Grotendeels gereed
5       Gemeente Onboarding & Auto.       10-12   48u     ○ Open
6       Content Migratie & CMS            13-15   48u     ◑ Content herstructurering + pipeline gereed
7       UX Polish & Performance           16-18   48u     ◑ 2/7 gereed (Ger prominent + navigatie)
8       Schaalbaarheid & Toekomst         19+     -       ○ Backlog
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Totaal (Fase 1-7)                                 288u

✅ RECENT AFGEROND (maart 2026):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- MantelCoach:             Ger omgebouwd tot volledige coach met deelgebied-coaching
- Dashboard redesign:      Ger bovenaan, BalansThermometer met gekleurde balk + zorgtaken-hokjes
- FloatingGerChat:         Context-aware per pagina, "Verstuur" knop, auto-start
- Security fixes:          .env uit git, build script, niveauFilter, health-check, api-response helper
- Database indexes:        Uitgebreide indexes op alle kernmodellen

⚠️  BLOKKERENDE ITEMS (MAG NIET VERGETEN):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- isActief login check:    Inactieve gebruikers kunnen nog inloggen (zie 1.5)
- WhatsApp alarm-detectie: Ontbreekt nog volledig (zie 1.6)
- 2FA voor admin:          Geblokkeerd door ontbrekende mailserver (zie 8.3)
- Verwerkersovereenkomsten: Juridisch traject nog niet gestart (zie 8.4)
```

### Afhankelijkheden tussen fases

```
Fase 1 ──→ Fase 2 ──→ Fase 3
                  └──→ Fase 4
                  └──→ Fase 5
                           └──→ Fase 6 ──→ Fase 7 ──→ Fase 8
```

- **Fase 1** is voorwaarde voor alles (beveiliging eerst)
- **Fase 2** is voorwaarde voor nieuwe features (stabiele basis)
- **Fase 3, 4, 5** kunnen deels parallel na Fase 2
- **Fase 6** bouwt voort op de features uit Fase 3-5
- **Fase 7** is de afronding met polish en performance
- **Fase 8** is een doorlopende backlog

---

## Items die NIET meer relevant zijn

De volgende items uit eerdere plannen zijn bewust geschrapt:

| Item | Reden |
|------|-------|
| PWA uitgebreide offline-modus | Basis PWA werkt, native app niet nodig |
| Contextuele hulptips bij elk formulierveld | Te gedetailleerd, geringe impact |
| Video-uitleg bij functies | Nice-to-have, geen prioriteit |
| Swipe-navigatie voor artikelen | Nice-to-have, geringe impact |
| Check-in streaks / beloningen | Gamification is onbewezen voor doelgroep |
| "Vergelijkbare mantelzorgers lezen ook..." | Vereist veel data, pas later relevant |

---

*Dit masterplan is opgesteld op 1 maart 2026 en bijgewerkt op 4 maart 2026 (v1.3). Wijzigingen v1.3: MantelCoach implementatie, dashboard redesign (BalansThermometer, zorgtaken-hokjes), FloatingGerChat context-aware, security fixes status, bekende problemen status-update.*
