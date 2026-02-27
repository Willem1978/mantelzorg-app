# MantelBuddy - Doorontwikkelplan Maart 2026

**Datum:** 27 februari 2026
**Versie:** 2.0
**Project:** MantelBuddy (Mantelzorg-app)
**Baseline:** v2.5.0 + doorontwikkelingen februari 2026

---

## Inhoudsopgave

1. [Samenvatting & Visie](#1-samenvatting--visie)
2. [Kritieke Fixes (Sprint 1: week 1)](#2-kritieke-fixes-sprint-1)
3. [Test-naar-Advies Flow Verbetering](#3-test-naar-advies-flow-verbetering)
4. [Nieuwe Ontwikkelingen Maart 2026](#4-nieuwe-ontwikkelingen-maart-2026)
5. [Technische Verbeteringen](#5-technische-verbeteringen)
6. [Planning & Fasering](#6-planning--fasering)
7. [KPI's & Meetpunten](#7-kpis--meetpunten)

---

## 1. Samenvatting & Visie

### Waar staan we nu (eind februari 2026)

MantelBuddy is een werkend platform met:
- **Belastbaarheidstest** (11 vragen, 3 deelgebieden, scoreberekening)
- **AI Coach "Ger"** (Claude Sonnet, 5 gespecialiseerde agents)
- **Dashboard** met thermometer, advies en hulpbronnen
- **Hulpvragen** met gemeente-specifieke organisaties
- **Informatie/Leren** met 44 B1-artikelen
- **Gemeente- en beheerportaal** met analytics
- **WhatsApp-integratie** via Twilio
- **Vector search** voor semantisch zoeken

### Focus Maart 2026

> **Kernthema: "Van test naar actie - directe, persoonlijke feedback"**

De belangrijkste feedback van gebruikers is: *"Ik heb de test gedaan maar ik krijg niet het gevoel dat ik feedback krijg op mijn specifieke situatie."*

Maart 2026 richt zich daarom op:
1. **Direct persoonlijk advies** na de balanstest (geen omweg via apart chatscherm)
2. **Bevestiging en herkenbaarheid** - de gebruiker moet zichzelf herkennen in het advies
3. **Concrete vervolgstappen** die aansluiten bij de testuitkomst
4. **Technische robuustheid** - env-variabelen, beveiliging, monitoring

---

## 2. Kritieke Fixes (Sprint 1)

### 2.1 Beveiliging: API-keys uit git verwijderen
**Prioriteit: KRITIEK**

`.env.production` staat in git en bevat API-keys (OpenAI). Dit moet direct worden opgelost.

**Actie:**
- [ ] `.env.production` toevoegen aan `.gitignore`
- [ ] Keys verwijderen uit git-historie (of keys roteren)
- [ ] API-keys verplaatsen naar Vercel Environment Variables
- [ ] Documentatie bijwerken voor team

### 2.2 Database connectiviteit lokale ontwikkeling
**Prioriteit: HOOG**

Er is geen `.env.local` aanwezig. Zonder database-connectie kan niets lokaal getest worden.

**Actie:**
- [ ] `.env.local` configureren met Supabase credentials
- [ ] Prisma client genereren en connectie valideren
- [ ] Controleren of bestaande accounts en testdata correct opgehaald worden
- [ ] Health-check endpoint toevoegen (`/api/health`)

### 2.3 Account verificatie
**Prioriteit: HOOG**

Mechanisme toevoegen zodat we eenvoudig kunnen controleren of een specifiek account bestaat en wat de status is.

**Actie:**
- [ ] Admin endpoint: `/api/beheer/zoek-account?email=xxx` (alleen voor ADMIN)
- [ ] Toon in beheerportaal: laatste login, aantal tests, account status
- [ ] Check of profiel compleet is (naam, gemeente, telefoonnummer)

---

## 3. Test-naar-Advies Flow Verbetering

### Probleem
De huidige flow na het invullen van de balanstest geeft te weinig **directe, herkenbare feedback**:

1. Gebruiker vult test in → score wordt berekend
2. Redirect naar dashboard of gastrapport
3. Dashboard toont score + thermometer + generiek advies
4. AI coach Ger is beschikbaar maar moet apart geopend worden
5. **Gat:** Er is geen moment waarop de gebruiker persoonlijk, warm en specifiek wordt aangesproken over hun situatie

### Oplossing: "Jouw Persoonlijk Advies" scherm

Direct na de test een tussenliggende pagina tonen die:

#### 3.1 Directe Scoreweergave met Context
```
┌────────────────────────────────────────────┐
│  Jouw score: 14 van 24                     │
│  [████████████░░░░░░] GEMIDDELD            │
│                                             │
│  "Je draagt best veel op je schouders,      │
│   [Voornaam]. Dat is niet niks."            │
└────────────────────────────────────────────┘
```

#### 3.2 Deelgebieden Samenvatting
```
┌────────────────────────────────────────────┐
│  ⚡ Jouw Energie: 65% belast               │
│  "Je slaapt minder goed en je voelt je     │
│   vaak moe. Dat is logisch bij zoveel      │
│   zorgtaken."                              │
│                                             │
│  💛 Jouw Gevoel: 40% belast                │
│  "Je maakt je soms zorgen, maar je hebt    │
│   nog steeds plezier in dingen."           │
│                                             │
│  ⏰ Jouw Tijd: 80% belast                  │
│  "Je hebt weinig tijd voor jezelf. Dit     │
│   is het punt waar hulp het meeste         │
│   verschil maakt."                         │
└────────────────────────────────────────────┘
```

#### 3.3 Persoonlijke Vervolgstappen (max 3)
Op basis van de **zwaarste deelgebied** + **geselecteerde taken**:

```
Wat je nu kunt doen:

1. 🏥 Bel het Sociaal Wijkteam Zutphen
   030-123 4567 — Gratis, direct hulp regelen
   [Bel nu]

2. 📖 Lees: "5 tips om beter te slapen als mantelzorger"
   3 minuten leestijd
   [Lees artikel]

3. 🤖 Praat met Ger (onze AI-hulp)
   "Ger kan je helpen uitzoeken welke hulp
    bij je past."
   [Start gesprek]
```

#### 3.4 Gemeente-specifiek Advies
Als de gemeente bekend is, direct het lokale advies tonen:
```
┌────────────────────────────────────────────┐
│  📍 Hulp in gemeente Zutphen              │
│                                             │
│  "In Zutphen kun je terecht bij het        │
│   Mantelzorgsteunpunt voor gratis advies.  │
│   Ze helpen je met het aanvragen van       │
│   ondersteuning via de Wmo."              │
│                                             │
│  Mantelzorgsteunpunt Zutphen              │
│  📞 0575-123456 | 🌐 Website              │
└────────────────────────────────────────────┘
```

### Implementatie

**Nieuwe pagina:** `/rapport/persoonlijk`
**Nieuwe component:** `<PersoonlijkAdvies />`
**Wijzigingen in:**
- `belastbaarheidstest/page.tsx` → redirect naar `/rapport/persoonlijk` i.p.v. `/dashboard`
- `api/belastbaarheidstest/route.ts` → rapport direct meegeven in response
- `lib/dashboard/advies.ts` → uitbreiden met deelgebied-specifiek advies
- Nieuwe helper: `lib/rapport/persoonlijk-advies.ts`

---

## 4. Nieuwe Ontwikkelingen Maart 2026

### 4.1 Ger Pro-actief na Test (Hoge Prioriteit)

**Wat:** Direct na de test een automatisch bericht van Ger tonen (geen handmatige chat nodig).

**Hoe:**
- Na score-berekening: API-call naar `/api/ai/balanscoach` met de testresultaten
- Ger genereert een **kort, warm, persoonlijk bericht** (max 150 woorden)
- Dit bericht wordt opgeslagen bij het `BelastbaarheidRapport`
- Getoond op de persoonlijk-advies pagina als "Ger zegt:"

**Voorbeeld:**
> "Hoi [Voornaam], ik zie dat je veel doet voor je naaste. Vooral het gebrek aan tijd voor jezelf valt me op — je hebt aangegeven dat je weinig aan je hobby's toekomt en dat de zorg veel uren kost. Dat is zwaar. Wist je dat het Sociaal Wijkteam je kan helpen om taken te verdelen? Dat is gratis en je hoeft het niet alleen te doen."

### 4.2 Smart Check-in Herinneringen (Gemiddelde Prioriteit)

**Wat:** Proactieve herinneringen via WhatsApp of in-app.

**Frequentie op basis van score:**
- HOOG: Wekelijks een check-in herinnering
- GEMIDDELD: Tweewekelijks
- LAAG: Maandelijks

**Implementatie:**
- Cron job of Vercel Cron (`vercel.json`)
- Stuur WhatsApp bericht via Twilio
- Fallback: in-app notificatie

### 4.3 Verbeterd Dashboard (Gemiddelde Prioriteit)

**Wat:** Dashboard dat direct reageert op testresultaten.

**Wijzigingen:**
- **"Sinds je laatste test"** blok als de test recent is (<7 dagen)
- **Zwaarste taken uitgelicht** met concrete hulplinks
- **Trend-indicator** als er meerdere tests zijn
- **Ger-widget** onderin: "Heb je een vraag? Praat met Ger"

### 4.4 Gastgebruiker Flow Verbetering (Hoge Prioriteit)

**Probleem:** Gasten die de test doen krijgen minder feedback en worden niet genoeg aangemoedigd om een account te maken.

**Oplossing:**
- Persoonlijk advies pagina ook voor gasten (localStorage data)
- Duidelijke CTA: "Maak een account aan om je resultaten te bewaren"
- Na account aanmaken: automatisch de testresultaten koppelen
- Zachte reminder: "Over 3 maanden kun je je test opnieuw doen om te zien of het beter gaat"

### 4.5 PWA Basis (Lage Prioriteit)

**Wat:** De app installeerbaar maken op het startscherm.

**Implementatie:**
- `manifest.json` met app-naam, iconen, kleuren
- Service worker voor basis-caching
- "Toevoegen aan startscherm" prompt
- Offline: noodcontacten + favorieten beschikbaar

### 4.6 Noodknop / SOS (Gemiddelde Prioriteit)

**Wat:** Prominente "Ik heb NU hulp nodig" knop.

**Implementatie:**
- Rode pulserende knop onderin het dashboard (vast gepositioneerd)
- Bij klik: overlay met directe contacten:
  - Mantelzorglijn: 030-164 0 164
  - Huisarts (als ingevuld)
  - 112 bij nood
  - Crisislijn
- Geen inlog vereist voor de homepage-variant

---

## 5. Technische Verbeteringen

### 5.1 Testdekking Uitbreiden
**Huidig:** 29 tests (rate-limit, validations, advies)

**Doel Maart 2026:** 60+ tests

**Nieuwe tests voor:**
- [ ] Belastbaarheidstest scoreberekening (edge cases)
- [ ] Deelgebieden berekening
- [ ] Impact score berekening
- [ ] Dashboard API response structuur
- [ ] Auth flow (login, register, magic link)
- [ ] Gemeente resolver
- [ ] Hulpkaart parsing
- [ ] PDF rapport generatie

### 5.2 Error Monitoring
- [ ] Structured logging (JSON format)
- [ ] Error boundary component met fallback UI
- [ ] API error tracking met context (userId, route, params)
- [ ] Health-check endpoint voor uptime monitoring

### 5.3 Performance
- [ ] Database query optimalisatie (N+1 queries in dashboard)
- [ ] React.memo op zware componenten
- [ ] Image optimalisatie (next/image consistent)
- [ ] Bundle size analyse en code-splitting

### 5.4 Database Migraties
- [ ] Nieuw veld: `BelastbaarheidRapport.gerBericht` (String?) - automatisch Ger advies
- [ ] Nieuw veld: `User.laatsteActiviteit` (DateTime?) - voor inactiviteit detectie
- [ ] Nieuw model: `SmartReminder` - geplande herinneringen per gebruiker
- [ ] Index optimalisatie op veelgebruikte queries

---

## 6. Planning & Fasering

### Sprint 1: 1-7 maart 2026 — "Fundament"
| Taak | Prioriteit | Geschatte uren |
|------|-----------|---------------|
| API-keys uit git + naar Vercel env vars | KRITIEK | 2u |
| .env.local + database connectie valideren | HOOG | 2u |
| Account verificatie endpoint | HOOG | 3u |
| Health-check endpoint | GEMIDDELD | 1u |
| **Totaal** | | **8u** |

### Sprint 2: 8-14 maart 2026 — "Persoonlijk Advies"
| Taak | Prioriteit | Geschatte uren |
|------|-----------|---------------|
| Persoonlijk advies pagina ontwerp + bouw | HOOG | 8u |
| Deelgebied-specifieke adviesteksten | HOOG | 4u |
| Gemeente-specifiek advies integratie | HOOG | 3u |
| Ger pro-actief bericht na test | HOOG | 5u |
| Gastgebruiker flow aanpassing | HOOG | 4u |
| **Totaal** | | **24u** |

### Sprint 3: 15-21 maart 2026 — "Engagement"
| Taak | Prioriteit | Geschatte uren |
|------|-----------|---------------|
| Smart check-in herinneringen | GEMIDDELD | 6u |
| Dashboard verbeteringen | GEMIDDELD | 5u |
| Noodknop / SOS functie | GEMIDDELD | 4u |
| Testdekking uitbreiden (40+ tests) | GEMIDDELD | 6u |
| **Totaal** | | **21u** |

### Sprint 4: 22-31 maart 2026 — "Polish & PWA"
| Taak | Prioriteit | Geschatte uren |
|------|-----------|---------------|
| PWA basis (manifest, service worker) | LAAG | 5u |
| Error monitoring & structured logging | GEMIDDELD | 4u |
| Performance optimalisatie | LAAG | 4u |
| Resterende tests (60+ totaal) | GEMIDDELD | 4u |
| Documentatie bijwerken | LAAG | 2u |
| **Totaal** | | **19u** |

### Totaal Maart 2026: ~72 uur

---

## 7. KPI's & Meetpunten

### Gebruikerservaring
| Metric | Huidig | Doel Maart 2026 |
|--------|--------|-----------------|
| % gebruikers dat advies ziet na test | ~40% (moeten chat openen) | 95% (automatisch) |
| Gemiddelde tijd test → persoonlijk advies | ~30s (via dashboard) | <5s (directe pagina) |
| % gasten dat account aanmaakt na test | Onbekend | >15% |
| % gebruikers dat terugkomt voor check-in | Onbekend | >25% |

### Technisch
| Metric | Huidig | Doel Maart 2026 |
|--------|--------|-----------------|
| Testdekking (aantal tests) | 29 | 60+ |
| API-keys in git | 2 (onveilig) | 0 |
| Health-check endpoint | Nee | Ja |
| PWA installeerbaar | Nee | Ja |
| Structured error logging | Nee | Ja |

### Platform
| Metric | Huidig | Doel Maart 2026 |
|--------|--------|-----------------|
| Gemiddelde laadtijd dashboard | ~300ms | <200ms |
| Beschikbare gemeenten met lokaal advies | Beperkt | Zutphen + 2 extra |
| Automatische herinneringen | Geen | WhatsApp + in-app |

---

## Appendix: Bestaande Architectuur

### Tech Stack
- **Frontend:** Next.js 16.1.4, React 19, TailwindCSS 4
- **Backend:** Next.js API Routes, Prisma ORM
- **Database:** PostgreSQL (Supabase) + pgvector
- **Auth:** NextAuth.js v5 (JWT, credentials)
- **AI:** Anthropic Claude Sonnet (5 agents) + OpenAI embeddings
- **WhatsApp:** Twilio
- **Hosting:** Vercel (CDG1 region)
- **Tests:** Vitest (29 tests)

### AI Agents Overzicht
| Agent | Route | Doel |
|-------|-------|------|
| Ger (Assistent) | `/api/ai/chat` | Hoofdcoach voor ingelogde gebruikers |
| Welkom | `/api/ai/welkom` | Homepage chat voor bezoekers |
| Balanscoach | `/api/ai/balanscoach` | Advies na balanstest |
| Check-in Buddy | `/api/ai/checkin` | Maandelijkse check-in begeleiding |
| Analytics | `/api/ai/admin/analytics` | Patronen en trends (admin) |
| Moderatie | `/api/ai/admin/moderate` | Content moderatie (admin) |

### Database Modellen (kern)
| Model | Records | Doel |
|-------|---------|------|
| User | - | Accounts met rollen |
| Caregiver | - | Mantelzorger profielen |
| BelastbaarheidTest | - | Testresultaten |
| Zorgorganisatie | - | Hulpbronnen |
| Artikel | - | Informatieartikelen |
| Gemeente | - | Gemeente-instellingen |
| CoachAdvies | - | AI coach configuratie |

---

*Dit plan is opgesteld op basis van een grondige code-review van de volledige MantelBuddy codebase op 27 februari 2026.*
