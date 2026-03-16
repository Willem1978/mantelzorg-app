# MantelBuddy — Geïntegreerd Projectplan 2026

**Datum:** 16 maart 2026
**Versie:** 2.0 — Geïntegreerd met Kritische Analyse
**Baseline:** v2.5.0
**Status:** Actief werkdocument
**Geschatte totale doorlooptijd:** ~350 uur (inclusief nieuwe aanbevelingen)

---

## Over dit plan

Dit plan integreert het bestaande Projectplan 2026 (P1-P9, ~203 uur) met de **27 kritische aanbevelingen** uit de externe platformanalyse. Per aanbeveling is beschreven:
- **Wat** er moet gebeuren
- **Waarom** het opgepakt moet worden (onderbouwing uit de analyse)
- **Waar** het in de iteratiestructuur past

Het plan is opgedeeld in **10 iteraties** die elk voor een AI-agent (of developer) in één sessie behapbaar zijn. Iteraties zijn geordend op urgentie en afhankelijkheden.

---

## Inhoudsopgave

1. [Urgentiematrix: Wat moet EERST](#urgentiematrix)
2. [Iteratie 0: Brandalarm — Security & Compliance Hotfixes](#iteratie-0)
3. [Iteratie 1: Observability — Monitoring & Error Tracking](#iteratie-1)
4. [Iteratie 2: Fundament — Tags, Profiel & Wizard (P1)](#iteratie-2)
5. [Iteratie 3: Architectuur — Service Layer & State Management](#iteratie-3)
6. [Iteratie 4: Zoeken, Caching & Performance (P4 + P7)](#iteratie-4)
7. [Iteratie 5: Personalisatie — Aanbevelingen (P2)](#iteratie-5)
8. [Iteratie 6: Toegankelijkheid & UX (P8 uitgebreid)](#iteratie-6)
9. [Iteratie 7: AI Hardening — Guardrails, Fallbacks & Kosten](#iteratie-7)
10. [Iteratie 8: Content Kwaliteit & Database Migratie (P3 + P6)](#iteratie-8)
11. [Iteratie 9: Gemeente, Klantreis & Re-engagement (P5 + nieuw)](#iteratie-9)
12. [Backlog: P9 + Resterende Strategische Items](#backlog)
13. [Compliance Track (parallel)](#compliance)
14. [Traceerbaarheid: Analyse → Plan Mapping](#mapping)

---

<a name="urgentiematrix"></a>
## 1. Urgentiematrix

De kritische analyse identificeerde items die **onmiddellijk** aandacht vereisen, ongeacht de roadmap-volgorde. Deze zijn verwerkt in Iteratie 0 en 1.

| Urgentie | Item | Analyse-ref | Waarom nu? | Iteratie |
|----------|------|-------------|-----------|----------|
| **VANDAAG** | Fix AUTH_SECRET fallback | §3.2 | Elke JWT kan vervalst worden met publiek bekend secret | 0 |
| **VANDAAG** | Upstash Redis rate limiting | §3.1 | In-memory rate limiter is effectief niet-functioneel in serverless | 0 |
| **VANDAAG** | $queryRawUnsafe → $queryRaw | §3.5 | SQL injection risico bij toekomstige wijzigingen | 0 |
| **DEZE WEEK** | Sentry error tracking | §5.1 | Zonder monitoring ben je blind voor productiefouten | 1 |
| **DEZE WEEK** | Structured logging (Pino) | §5.1 | console.error is niet doorzoekbaar of alerteerbaar | 1 |
| **DEZE MAAND** | DPIA laten uitvoeren | §3.3 | Wettelijk verplicht bij gezondheidsdata (Art. 9 AVG) | Compliance |
| **DEZE MAAND** | Verwerkersovereenkomsten | §3.4 | AVG Art. 28 overtreding zonder deze | Compliance |
| **DEZE MAAND** | Data retention policy | §3.6 | AVG dataminimalisatie vereist bewaartermijnen | Compliance |
| **SPRINT 1** | WCAG 2.1 AA basis | §2.2 | European Accessibility Act (wettelijk verplicht) | 6 |
| **SPRINT 1** | AI crisis guardrails | §6.1 | Kwetsbare doelgroep ontvangt ongecontroleerde AI-output | 7 |

---

<a name="iteratie-0"></a>
## 2. Iteratie 0: Brandalarm — Security & Compliance Hotfixes

**Geschatte tijd:** ~6 uur
**Urgentie:** ONMIDDELLIJK
**Afhankelijkheden:** Geen
**Analyse-referenties:** §3.1, §3.2, §3.5

### Waarom deze iteratie?

De analyse identificeerde drie beveiligingsproblemen die het platform **vandaag** kwetsbaar maken:

1. **AUTH_SECRET fallback (§3.2):** De app heeft een hardcoded fallback secret (`"mantelzorg-app-fallback-secret-stel-auth-secret-in-op-vercel"`). Als `AUTH_SECRET` niet is ingesteld in de environment, draait de hele authenticatie op een publiek bekend geheim. Elke JWT kan dan vervalst worden. De app moet **crashen** als AUTH_SECRET ontbreekt, niet stil doordraaien.

2. **In-memory rate limiter (§3.1):** De huidige rate limiter (`src/lib/rate-limit.ts`) gebruikt een in-memory Map. In Vercel's serverless omgeving wordt elke function invocation in een nieuw proces gestart. De rate limiter start dus telkens met een schone lei. Een aanvaller kan onbeperkt brute-force aanvallen uitvoeren door simpelweg te wachten op een cold start of door requests over meerdere functies te verspreiden. Dit is effectief **geen rate limiting**.

3. **$queryRawUnsafe (§3.5):** Twee routes (`/api/search/route.ts` en `/api/ai/admin/content-agent/route.ts`) gebruiken Prisma's `$queryRawUnsafe`. Hoewel de queries nu geparametriseerd lijken, is deze functie inherent riskant: een toekomstige developer kan per ongeluk string-concatenatie toevoegen. `$queryRaw` met template literals biedt automatische escaping.

### Taken

| # | Taak | Uur |
|---|------|-----|
| 0.1 | **AUTH_SECRET crashen i.p.v. fallback** — Vervang fallback door `throw new Error("AUTH_SECRET is required")` in `src/lib/auth.ts` | 0.5 |
| 0.2 | **Upstash Redis rate limiting** — Vervang in-memory rate limiter door Upstash Redis (of Vercel KV). Migreer `src/lib/rate-limit.ts`. Configureer Upstash project + environment variables | 2 |
| 0.3 | **$queryRawUnsafe → $queryRaw** — Migreer 2 routes naar `$queryRaw` met template literals voor automatische escaping | 1 |
| 0.4 | **WhatsApp sessies naar database** — Vervang in-memory `Map` in `src/lib/twilio.ts` door Prisma model (WhatsAppSessie) met TTL. Data gaat nu verloren bij elke serverless restart | 2.5 |

### Database-wijzigingen

```prisma
model WhatsAppSessie {
  id          String   @id @default(cuid())
  telefoonnr  String   @unique
  stap        String
  antwoorden  Json     @default("{}")
  testId      String?
  expiresAt   DateTime
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([telefoonnr])
  @@index([expiresAt])
}
```

### Acceptatiecriteria

- [ ] App crasht als AUTH_SECRET environment variable ontbreekt
- [ ] Rate limiting persists over serverless cold starts (Redis-backed)
- [ ] Geen `$queryRawUnsafe` meer in de codebase
- [ ] WhatsApp sessies overleven server-restarts
- [ ] Bestaande functionaliteit werkt nog (smoke test)

### Bestanden die geraakt worden

- `src/lib/auth.ts` — AUTH_SECRET validatie
- `src/lib/rate-limit.ts` — Redis-backed rate limiting
- `src/app/api/search/route.ts` — queryRaw migratie
- `src/app/api/ai/admin/content-agent/route.ts` — queryRaw migratie
- `src/lib/twilio.ts` — WhatsApp sessies naar DB
- `prisma/schema.prisma` — WhatsAppSessie model
- `package.json` — Upstash Redis dependency

---

<a name="iteratie-1"></a>
## 3. Iteratie 1: Observability — Monitoring & Error Tracking

**Geschatte tijd:** ~12 uur
**Urgentie:** DEZE WEEK
**Afhankelijkheden:** Geen
**Analyse-referenties:** §5.1, §5.2

### Waarom deze iteratie?

> "Wat je niet meet, kun je niet verbeteren."

De analyse (§5.1) stelt vast dat er **geen monitoring of observability** is. Geen Sentry, geen structured logging, geen performance metrics. Dit betekent dat je niet weet:
- Hoeveel errors er optreden in productie
- Welke API routes traag zijn
- Of gebruikers vastlopen in flows
- Wanneer de database overbelast raakt

Dit is het fundament waar alle andere iteraties op voortbouwen. Zonder monitoring kun je niet meten of verbeteringen werken, bugs in productie opsporen, of performance-regressies detecteren.

Daarnaast identificeert §5.2 **N+1 query risico's**: bij lijstweergaven kan Prisma zonder expliciete `include` per item een extra query uitvoeren. Bij 50 artikelen = 51 queries in plaats van 2. Prisma query logging is nodig om dit zichtbaar te maken.

### Taken

| # | Taak | Uur | Analyse-ref |
|---|------|-----|-------------|
| 1.1 | **Sentry integreren** — Error tracking, user context (zonder PII), performance tracing, alerts bij spikes. Gratis tier volstaat voor start | 4 | §5.1 |
| 1.2 | **Structured logging (Pino)** — `console.error` en `console.log` vervangen door Pino. Request logging middleware, error context, AI tool logging. Geen PII in logs | 4 | §5.1 |
| 1.3 | **Health monitoring uitbreiden** — `/api/health` uitbreiden: DB latency, AI (Anthropic) bereikbaarheid, WhatsApp (Twilio) status, disk/memory. Vercel cron voor monitoring | 2 | §5.1 |
| 1.4 | **Prisma query logging** — Development-only query logging activeren om N+1 queries zichtbaar te maken voor Iteratie 4 | 2 | §5.2 |

### Acceptatiecriteria

- [ ] Sentry vangt unhandled errors automatisch op in alle routes
- [ ] Alle API routes loggen gestructureerd via Pino (request-id, duration, status)
- [ ] Health endpoint toont status van DB, AI, WhatsApp
- [ ] Prisma query logging actief in development
- [ ] Geen PII in logs of error tracking
- [ ] Alert geconfigureerd voor error spikes

### Bestanden die geraakt worden

- `package.json` — Sentry + Pino dependencies
- `sentry.client.config.ts` / `sentry.server.config.ts` — Sentry config (nieuw)
- `src/lib/logger.ts` — Pino logger instantie (nieuw)
- `src/middleware.ts` — Request logging
- `src/app/api/health/route.ts` — Health checks uitbreiden
- `prisma/schema.prisma` of `src/lib/prisma.ts` — Query logging

---

<a name="iteratie-2"></a>
## 4. Iteratie 2: Fundament — Tags, Profiel & Wizard (P1)

**Geschatte tijd:** ~22 uur
**Afhankelijkheden:** Geen (Iteratie 0 en 1 zijn onafhankelijk)
**Blokkeert:** Iteratie 5 (Aanbevelingen), Iteratie 8 (Content Kwaliteit)
**Analyse-referenties:** §1.1, §1.2 (gedeeltelijk)

### Waarom deze iteratie?

Dit is het **kritieke pad** uit het bestaande projectplan. Zonder gestructureerde tags werken aanbevelingen niet, content kan niet gepersonaliseerd worden, en het profiel blijft een chaos.

De analyse voegt hier twee extra inzichten aan toe:

1. **§1.1 — De onboarding is te zwaar voor de doelgroep:** De huidige registratie vraagt in 3 stappen: email, wachtwoord, telefoon, naam, adres, zorgontvanger-info, relatie, adres zorgontvanger EN 3 privacy-toestemmingen. Mantelzorgers zijn overbelast (1 op 3 voelt zich "zwaar belast" — SCP). Een uitgebreide registratie creëert een enorme drempel. Je verliest potentieel 40-60% van bezoekers. De oplossing: splits registratie in twee fasen. Fase 1 (30 sec): email + wachtwoord → direct dashboard. Fase 2: profiel progressief aanvullen.

2. **§1.2 — Geen "eerste waarde" binnen 60 seconden:** Na registratie moet de gebruiker direct begrijpen waarom dit platform hun leven beter maakt. Implementeer een guided first session: registratie → direct naar balanstest → resultaat met 3 gepersonaliseerde actiepunten → dan pas dashboard.

### Taken (uit bestaand plan + aanvullingen)

| # | Taak | Uur | Bron |
|---|------|-----|------|
| 2.1 | **Tag-groepen definiëren** — `groep` veld op ContentTag. Groepen: relatie, wonen, werk, zorgduur, zorgintensiteit, levensfase, extra | 2 | P1 bestaand |
| 2.2 | **Profielscherm herstructureren** — Eén scrollbaar scherm met 7 secties. Radio buttons voor exclusieve keuzes, chips voor multi-select | 6 | P1 bestaand |
| 2.3 | **Tag-afleiding server-side** — `bepaalProfielTags()` naar backend. Bij opslaan profiel automatisch tags berekenen | 3 | P1 bestaand |
| 2.4 | **Wizard en onboarding samenvoegen** — Eén flow: welkom → profiel → balanstest. "Later invullen" optie. Registratie verlichten (§1.1) | 4 | P1 + §1.1 |
| 2.5 | **Guided first session** — Na registratie direct naar balanstest, niet dashboard. Resultaat toont 3 actiepunten. Pas dan dashboard | 2 | §1.2 (nieuw) |
| 2.6 | **Voorkeuren-API opschonen** — Duidelijk onderscheid automatische vs handmatige tags | 2 | P1 bestaand |
| 2.7 | **Bestaande artikelen taggen** — AI bulk-tagging van 47 artikelen | 3 | P1 bestaand |
| 2.8 | **Profiel-completeness + dashboard reminder** — Voortgangsbalk + "Vul je profiel aan" kaart (max 3x) | 2 | P1 bestaand |

### Database-wijzigingen

```prisma
model ContentTag {
  // bestaande velden...
  groep        String?    // "relatie" | "wonen" | "werk" | "zorgduur" | "levensfase" | "extra" | null
}
```

### Acceptatiecriteria

- [ ] Profielscherm is één scrollbaar scherm met 7 duidelijke secties
- [ ] Radio buttons voor exclusieve keuzes (wonen, werk, relatie)
- [ ] Tags worden automatisch afgeleid bij opslaan (server-side)
- [ ] Wizard en onboarding gebruiken zelfde profielscherm
- [ ] Registratie is verlicht: email + wachtwoord → direct platform
- [ ] Nieuwe gebruiker gaat na registratie naar balanstest (guided first session)
- [ ] Alle 47 artikelen zijn getagd via ArtikelTag
- [ ] Profiel-completeness indicator werkt
- [ ] "Later invullen" optie in onboarding

---

<a name="iteratie-3"></a>
## 5. Iteratie 3: Architectuur — Service Layer & State Management

**Geschatte tijd:** ~28 uur
**Afhankelijkheden:** Iteratie 1 (monitoring nodig om verbetering te meten)
**Analyse-referenties:** §4.1, §4.3

### Waarom deze iteratie?

De analyse identificeert twee fundamentele architectuurproblemen:

1. **§4.1 — Geen service layer:** Elke API route bevat direct Prisma queries, validatie, autorisatie en business logic. Routes zijn 100-300 regels lang en moeilijk te testen. Business logic is niet herbruikbaar (bijv. "maak een balanstest" is zowel nodig via API als via WhatsApp webhook). Bij 134 routes wordt dit onhoudbaar. De oplossing: introduceer een service layer (`API Route → Validation → Service → Repository → Prisma`). Begin met de 5 meest complexe domeinen.

2. **§4.3 — Geen state management:** Elke pagina heeft 10+ useState hooks en manuele fetch in useEffect. Dit betekent: geen automatische cache invalidatie bij mutaties, geen optimistic updates, geen request deduplication, geen stale-while-revalidate, en race conditions bij snelle navigatie. SWR of TanStack Query lost dit alles op.

### Taken

| # | Taak | Uur | Analyse-ref |
|---|------|-----|-------------|
| 3.1 | **Service layer — Auth & Profiel** — `auth.service.ts`, `profiel.service.ts`. Business logic uit API routes extraheren | 5 | §4.1 |
| 3.2 | **Service layer — Belastbaarheidstest** — `belastbaarheid.service.ts`. Test-creatie, scoring, resultaat-opslag | 4 | §4.1 |
| 3.3 | **Service layer — Check-in & Buddy** — `checkin.service.ts`, `buddy.service.ts` | 4 | §4.1 |
| 3.4 | **Service layer — AI Chat** — `ai-chat.service.ts`. AI business logic scheiden van HTTP handling | 3 | §4.1 |
| 3.5 | **Service layer — Gemeente & Hulpbronnen** — `gemeente.service.ts`, `hulpbron.service.ts` | 4 | §4.1 |
| 3.6 | **SWR/TanStack Query adopteren** — Installeren, hooks definiëren voor de meestgebruikte data-fetches. Automatische caching, revalidatie, loading/error states | 8 | §4.3 |

### Acceptatiecriteria

- [ ] Top-5 domeinen hebben een service layer (auth, belastbaarheid, checkin, buddy, AI)
- [ ] API routes bevatten alleen: validatie → service call → response
- [ ] Services zijn unit-testbaar zonder HTTP context
- [ ] SWR of TanStack Query is geïntegreerd op minstens 5 pagina's
- [ ] Automatische cache invalidatie werkt bij mutaties
- [ ] Geen race conditions meer bij snelle navigatie

### Bestanden die geraakt worden

- `src/services/` — Nieuwe directory met service modules
- `src/hooks/` — SWR/TanStack Query hooks
- `src/app/api/` — Refactoring van routes naar service calls
- `package.json` — SWR of @tanstack/react-query dependency

---

<a name="iteratie-4"></a>
## 6. Iteratie 4: Zoeken, Caching & Performance (P4 + P7 deels)

**Geschatte tijd:** ~22 uur
**Afhankelijkheden:** Iteratie 1 (monitoring), Iteratie 3 (state management maakt caching effectiever)
**Analyse-referenties:** §4.2, §5.2, §5.3, P4, P7

### Waarom deze iteratie?

1. **§4.2 — 94 van 96 routes zijn force-dynamic:** Bijna niets wordt gecached. Elke request is een database query. Artikelen, categorieën, formulier-opties en gemeente-informatie veranderen zelden maar worden bij elke pageload opnieuw uit de database gehaald. Bij 1000 concurrent users levert dit onnodige database-belasting op. Een gedifferentieerde caching strategie kan de database-load met 60-70% verlagen.

2. **§5.2 — N+1 query risico's:** Zonder expliciete include strategieën voert Prisma per item extra queries uit. Bij 50 artikelen = 51 queries.

3. **§5.3 — AI routes zonder streaming:** AI chat endpoints hebben een 30s timeout op Vercel. Streaming omzeilt dit.

4. **P4 — Zoeken:** Mantelzorgers moeten op betekenis kunnen zoeken. "Ik ben zo moe" moet artikelen over vermoeidheid en slaapproblemen vinden.

### Taken

| # | Taak | Uur | Bron |
|---|------|-----|------|
| 4.1 | **Caching strategie implementeren** — Statisch (ISR 1u): artikelen, categorieën, publieke content. Kort (5min): gemeente stats. Per-user (60s): dashboard. Mutaties blijven dynamic | 8 | §4.2 / P7 |
| 4.2 | **N+1 queries oplossen** — Audit alle list-endpoints. Prisma `include`/`select` met relaties. Paginatie toevoegen | 4 | §5.2 / P7 |
| 4.3 | **AI streaming consistent maken** — Verifieer dat alle 8 AI-endpoints streaming responses gebruiken. Fix waar dat niet het geval is | 2 | §5.3 |
| 4.4 | **Zoekpagina bouwen** — `/zoeken` met semantic search via pgvector. Resultaten uit artikelen + hulpbronnen | 3 | P4 |
| 4.5 | **Zoekbalk in navigatie** — Compacte zoekbalk/icoon in header | 1 | P4 |
| 4.6 | **Embeddings automatisering** — Cron route voor dagelijks bijwerken van embeddings | 1 | P4 |
| 4.7 | **Hulpbronnen semantic search** — Semantic search i.p.v. tekst-matching | 1 | P4 |
| 4.8 | **dangerouslySetInnerHTML reduceren** — Vervang zoveel mogelijk door react-markdown. Elimineer DOMPurify-afhankelijkheid waar mogelijk | 2 | §2.4 |

### Acceptatiecriteria

- [ ] Statische content wordt gecached (niet elke request naar DB)
- [ ] Dashboard laadtijd <2 seconden
- [ ] Geen N+1 queries in kritieke paden
- [ ] Alle AI-endpoints gebruiken streaming
- [ ] Zoekpagina werkt met semantic search
- [ ] "ik ben zo moe" vindt relevante artikelen
- [ ] Zoekbalk is toegankelijk vanuit elke pagina
- [ ] dangerouslySetInnerHTML gebruik is gehalveerd

---

<a name="iteratie-5"></a>
## 7. Iteratie 5: Personalisatie — Aanbevelingen (P2)

**Geschatte tijd:** ~14 uur
**Afhankelijkheden:** Iteratie 2 (tags moeten werken)
**Analyse-referenties:** P2

### Waarom deze iteratie?

Dit is de kern van de waardepropositie: **"Van zoek zelf naar aanbevolen voor jou."** Met het tag-systeem uit Iteratie 2 op zijn plek, kan content nu gepersonaliseerd worden. Dit is cruciaal voor de "time to first value" (§1.2) — gebruikers moeten direct zien dat het platform relevant is voor hun situatie.

### Taken (uit bestaand plan P2)

| # | Taak | Uur |
|---|------|-----|
| 5.1 | **Relevantie-score berekening** — Tag-overlap score. AANDOENING=3pt, SITUATIE=2pt, CATEGORIE=1pt | 4 |
| 5.2 | **Dashboard "Aanbevolen voor jou"** — Top 3-5 artikelen met match-reden | 3 |
| 5.3 | **Leren-pagina sorteren** — Relevantie-sortering + "Aanbevolen" badge | 2 |
| 5.4 | **Weekkaarten verbeteren** — Op basis van relevantie i.p.v. random | 2 |
| 5.5 | **"Meer hierover" suggesties** — Gerelateerde artikelen onderaan elk artikel | 2 |
| 5.6 | **Ger AI integratie** — Profiel-tags als context meegeven aan Ger | 1 |

### Acceptatiecriteria

- [ ] Dashboard toont "Aanbevolen voor jou" met 3-5 artikelen
- [ ] Werkende mantelzorger ziet andere artikelen dan gepensioneerde
- [ ] Match-reden is zichtbaar per aanbeveling
- [ ] Weekkaarten zijn gepersonaliseerd
- [ ] Ger gebruikt profiel-tags in gesprekken

---

<a name="iteratie-6"></a>
## 8. Iteratie 6: Toegankelijkheid & UX (P8 uitgebreid)

**Geschatte tijd:** ~30 uur
**Afhankelijkheden:** Geen (kan parallel met Iteratie 3-5)
**Analyse-referenties:** §2.1, §2.2, §2.3, P8

### Waarom deze iteratie?

De analyse is helder over de urgentie:

1. **§2.2 — WCAG 2.1 AA is nog niet bereikt:** De doelgroep bevat ouderen en mensen met beperkingen. De overheid (mogelijke opdrachtgever/subsidiegever) vereist WCAG 2.1 AA bij publiek geld. De **European Accessibility Act** (juni 2025) maakt dit wettelijk verplicht. Er zijn goede ARIA-labels, maar geen systematische focus-management, skip-links, of screen reader testing. Dit was P8 in de roadmap maar moet P3 worden qua urgentie.

2. **§2.1 — Geen extern gevalideerd design system:** Alle UI-componenten zijn custom. Elke component moet handmatig WCAG-compliant worden gemaakt. Migratie naar een headless UI-library (Radix UI of React Aria) laat accessibility-logica (focus management, ARIA states, keyboard handling) over aan bewezen libraries. Dit is een grote investering maar verlaagt de onderhoudskosten structureel.

3. **§2.3 — Geen skeleton screens:** Spinners geven geen indicatie van wat er komt. Skeleton screens verkorten de gepercipieerde laadtijd met 30-40%.

### Taken

| # | Taak | Uur | Bron |
|---|------|-----|------|
| 6.1 | **WCAG 2.1 AA audit en fixes** — Skip-links, focus-trapping in modals, axe-core audit op elke pagina, screen reader test met NVDA/VoiceOver | 8 | §2.2 / P8 |
| 6.2 | **Contrast en leesbaarheid** — WCAG AAA contrast (7:1), B1-taalaudit, min fontgrootte 16px mobiel, regelafstand 1.5 | 4 | P8 |
| 6.3 | **Skeleton screens** — Vervang spinners door skeleton screens voor dashboard, artikellijsten, profiel. Gebruik react-loading-skeleton | 4 | §2.3 |
| 6.4 | **Headless UI componenten** — Migreer kritieke componenten (modals, dropdowns, tabs, menus) naar Radix UI of React Aria. Behoud eigen Tailwind styling | 8 | §2.1 |
| 6.5 | **PWA verbeteren** — Echte app-iconen, offline fallback, cache-first, install prompt | 3 | P8 |
| 6.6 | **Optimistic updates** — Feedback bij favorieten, actiepunten, check-ins via SWR/TanStack mutaties | 3 | P8 |

### Acceptatiecriteria

- [ ] axe-core audit op hoofdpagina's: 0 critical/serious violations
- [ ] Alle interactieve elementen bereikbaar via keyboard
- [ ] Skip-to-content link op elke pagina
- [ ] Focus-trapping in alle modals
- [ ] Skeleton screens voor alle data-secties
- [ ] Kritieke UI-componenten draaien op Radix UI / React Aria
- [ ] PWA installeerbaar op iOS en Android
- [ ] Contrast ratio ≥7:1 voor tekst

---

<a name="iteratie-7"></a>
## 9. Iteratie 7: AI Hardening — Guardrails, Fallbacks & Kosten

**Geschatte tijd:** ~24 uur
**Afhankelijkheden:** Iteratie 1 (monitoring voor AI logging), Iteratie 3 (service layer voor AI)
**Analyse-referenties:** §6.1, §6.2, §6.3, §6.4

### Waarom deze iteratie?

De analyse waarschuwt nadrukkelijk over de AI-implementatie in een zorgcontext:

1. **§6.1 — Geen guardrails voor kwetsbare doelgroep:** AI-agents communiceren direct met mensen in emotionele nood. Een mantelzorger die "ik kan niet meer" typt, krijgt een AI-response. Als die response ongeschikt is (te vrolijk, oppervlakkig, foutief advies), kan dat schade aanrichten. Dit is geen gewone chatbot — dit is een zorgcontext. Er moet een safety classifier komen die crisis detecteert VOORDAT het response wordt gegenereerd. Bij crisis-detectie: vast script met professionele hulplijnnummers.

2. **§6.2 — Geen fallback bij AI-uitval:** Als Anthropic's API down is, retourneren routes een 503. Ger is een kernonderdeel — als Ger niet beschikbaar is, is het dashboard half leeg. Er moeten statische fallback-responses zijn.

3. **§6.3 — Kosten niet gebudgetteerd:** Claude Opus is duur. Bij 1000 gebruikers × 5 chats/week zonder budget-limiet lopen kosten uit de hand. Model-tiering (Haiku voor simpel, Sonnet voor medium, Opus voor complex) en per-user budgetten zijn noodzakelijk.

4. **§6.4 — Prompts niet geversioned:** System prompts staan verspreid in code. Een kleine wijziging kan Ger's gedrag drastisch veranderen. Zonder versiebeheer geen rollback of A/B testing.

### Taken

| # | Taak | Uur | Analyse-ref |
|---|------|-----|-------------|
| 7.1 | **Crisis safety classifier** — Pre-response classificatie op emotionele nood. Keywords + sentiment analyse. Bij detectie: vast script met hulplijnnummers (113 Zelfmoordpreventie, huisartsenpost, SOS Mantelzorg). Alle crisis-interacties loggen voor menselijke review | 6 | §6.1 |
| 7.2 | **AI disclaimer** — "Ger is een digitale assistent, geen hulpverlener" disclaimer in chat-interface en bij gevoelige onderwerpen | 1 | §6.1 |
| 7.3 | **Statische fallback bij AI-uitval** — Voorgedefinieerde tips en berichten per context. "Ger is even offline — hier zijn tips die bij jou passen" | 3 | §6.2 |
| 7.4 | **AI response caching** — Cache succesvolle Ger-responses (weekkaarten, welkomstberichten) voor hergebruik. Vermindert API calls en biedt fallback-data | 2 | §6.2 |
| 7.5 | **Model-tiering** — Haiku voor eenvoudige taken (welkom, weekkaarten). Sonnet voor medium (check-in, coaching). Opus alleen voor complexe analyses. Configureerbaar per agent | 4 | §6.3 |
| 7.6 | **Per-user token budget** — Max tokens/maand per gebruiker. Waarschuwing bij 80%, hard limit bij 100%. Dashboard in beheerportaal | 3 | §6.3 |
| 7.7 | **Prompt versioning** — Centraliseer alle system prompts in `src/lib/ai/prompts/` directory met versienummering. Log welke prompt-versie bij elke conversatie is gebruikt | 3 | §6.4 |
| 7.8 | **AI cost dashboard** — Overzicht in beheerportaal: kosten per agent, per gebruiker, per dag/week/maand. Alerts bij overschrijding | 2 | §6.3 |

### Acceptatiecriteria

- [ ] Crisis-berichten ("ik kan niet meer", "ik wil stoppen") triggeren vast protocol
- [ ] Hulplijnnummers worden getoond bij crisis-detectie
- [ ] Crisis-interacties worden gelogd
- [ ] AI disclaimer is zichtbaar in chat
- [ ] Bij Anthropic API uitval: vriendelijke fallback met statische tips
- [ ] Model-tiering actief: Haiku/Sonnet/Opus per agent
- [ ] Per-user budget limiet werkt
- [ ] Prompts zijn gecentraliseerd met versienummering
- [ ] Cost dashboard toont kosten per agent

---

<a name="iteratie-8"></a>
## 10. Iteratie 8: Content Kwaliteit & Database Migratie (P3 + P6)

**Geschatte tijd:** ~69 uur
**Afhankelijkheden:** Iteratie 2 (tags), Iteratie 3 (service layer)
**Analyse-referenties:** §4.4, P3, P6

### Waarom deze iteratie?

1. **§4.4 / P6 — 170+ hardcoded content items:** Test-vragen, zorgtaken, formulier-opties, onboarding-teksten staan allemaal in code. Elke tekstwijziging vereist een deployment. Een gemeente-admin kan niet zelf content aanpassen. De analyse stelt dat dit de schaalbaarheid van alle andere prioriteiten ondermijnt.

2. **P3 — Content kwaliteit:** Met het tag-systeem op zijn plek moet de content nu ook kwalitatief verbeteren. AI-gestuurde hiaten-analyse, bronvermelding, en curator-workflow.

### Taken P6 — Content naar Database

| # | Taak | Uur |
|---|------|-----|
| 8.1 | **Content migreren** — 170+ items uit config-bestanden naar database (balanstest vragen, zorgtaken, formulier-opties, onboarding teksten, navigatie, dashboard, auth, WhatsApp menu's) | 16 |
| 8.2 | **Frontend omzetten** — 8+ bestanden van hardcoded imports naar API/database queries | 12 |
| 8.3 | **Beheer pagina's bouwen** — CRUD voor balanstest-vragen, zorgtaken, categorieën, formulier-opties, app-content | 12 |
| 8.4 | **Seed script** — `seed-full-content.ts` voor eenmalige migratie + validatie + rollback | 4 |

### Taken P3 — Content Kwaliteit

| # | Taak | Uur |
|---|------|-----|
| 8.5 | **Tag-suggestie in artikel-editor** — AI-suggesties voor tags bij bewerken | 2 |
| 8.6 | **Doelgroep-specifiek genereren** — Beheerder kiest tags, AI genereert gericht artikel | 3 |
| 8.7 | **Content hiaten-analyse** — Dashboard: welke tag-combinaties missen artikelen | 4 |
| 8.8 | **Artikel completeness-score** — 0-100% per artikel (titel, tags, inhoud, B1, bron) | 3 |
| 8.9 | **Curator-resultaten opslaan + actieknoppen** — Reviews bewaren, "Herschrijf"/"Opgelost" | 4 |
| 8.10 | **Bronvermelding systeem** — ArtikelBron model, CRUD, weergave onderaan artikelen | 5 |
| 8.11 | **Data retention policy implementeren** — Automatisch opruimen: audit logs (2 jaar), berichten (1 jaar na inactiviteit), accounts (2 jaar inactiviteit na waarschuwing) | 4 |

### Database-wijzigingen

```prisma
model ArtikelBron {
  id          String   @id @default(cuid())
  artikelId   String
  naam        String
  url         String?
  type        String   // "website" | "overheid" | "onderzoek" | "organisatie"
  createdAt   DateTime @default(now())
  artikel     Artikel  @relation(fields: [artikelId], references: [id], onDelete: Cascade)
  @@index([artikelId])
}

model CuratorReview {
  id          String   @id @default(cuid())
  artikelId   String
  score       Int
  feedback    String   @db.Text
  issues      Json?
  reviewedAt  DateTime @default(now())
  resolvedAt  DateTime?
  artikel     Artikel  @relation(fields: [artikelId], references: [id], onDelete: Cascade)
  @@index([artikelId])
}
```

### Acceptatiecriteria

- [ ] Geen hardcoded content meer in `src/config/` of `src/data/`
- [ ] Beheerders kunnen content aanpassen zonder code-wijzigingen
- [ ] Seed script migreert alle content correct
- [ ] Content hiaten-dashboard werkt
- [ ] Bronvermelding systeem werkt (CRUD + weergave)
- [ ] Curator-reviews worden opgeslagen
- [ ] Data retention: automatische opruiming van oude data

---

<a name="iteratie-9"></a>
## 11. Iteratie 9: Gemeente, Klantreis & Re-engagement (P5 + nieuw)

**Geschatte tijd:** ~48 uur
**Afhankelijkheden:** Iteratie 3 (service layer), SMTP configuratie
**Analyse-referenties:** §1.3, §1.4, P5

### Waarom deze iteratie?

1. **P5 — Gemeente automatisering:** Proactieve opvolging van mantelzorgers via automatische check-in planning en gemeente-notificaties.

2. **§1.3 — Buddy-journey onderontwikkeld:** Het buddy-systeem staat op 75% en heeft geen eigen onboarding-flow. Zonder vrijwilligers werkt het matchingsysteem niet. Een platform dat afhankelijk is van twee zijden van een markt moet beide zijden gelijkwaardig bedienen. Buddies moeten behandeld worden als "klanten", niet als bijproduct.

3. **§1.4 — Geen re-engagement strategie:** Er is geen mechanisme om gebruikers terug te halen na inactiviteit. Mantelzorgers raken makkelijk overweldigd en stoppen. Zonder re-engagement verlies je 70%+ binnen 30 dagen. Er moet een retention-loop komen met herinneringen via WhatsApp/email.

### Taken P5 — Gemeente

| # | Taak | Uur |
|---|------|-----|
| 9.1 | **Automatische check-in planning** — Na balanstest: HOOG=1w, GEMIDDELD=2w, LAAG=4w. GeplandCheckin model | 8 |
| 9.2 | **Gemeente-alarmnotificatie** — Geanonimiseerde e-mail bij HIGH/CRITICAL (opt-in). Geen PII | 6 |
| 9.3 | **Gemeente opvolgingsdashboard** — Anoniem overzicht: tests, alarmen, check-ins, trends | 10 |
| 9.4 | **WhatsApp check-in herinneringen** — Geplande herinneringen met 3 snelantwoorden | 8 |

### Taken Klantreis (nieuw uit analyse)

| # | Taak | Uur | Analyse-ref |
|---|------|-----|-------------|
| 9.5 | **Buddy onboarding-flow** — Eigen landingspagina → motivatie-vragenlijst → skill-matching profiel → eerste match. Buddies als volwaardige gebruikersgroep | 8 | §1.3 |
| 9.6 | **Re-engagement loop** — Week 1: "Hoe gaat het?" (WhatsApp/email). Week 2: gepersonaliseerde tip. Maand 1: check-in. Bij inactiviteit: warm bericht van Ger | 8 | §1.4 |

### Database-wijzigingen

```prisma
model GeplandCheckin {
  id            String    @id @default(cuid())
  caregiverId   String
  geplandOp     DateTime
  verstuurdOp   DateTime?
  kanaal        String    @default("IN_APP")
  aanleiding    String
  status        String    @default("GEPLAND")
  testId        String?
  createdAt     DateTime  @default(now())
  caregiver     Caregiver @relation(fields: [caregiverId], references: [id], onDelete: Cascade)
  @@index([caregiverId, geplandOp])
  @@index([status, geplandOp])
}
```

### Acceptatiecriteria

- [ ] Automatische check-in planning na balanstest
- [ ] Gemeente ontvangt geanonimiseerde alarm-emails
- [ ] Opvolgingsdashboard toont anonieme statistieken
- [ ] WhatsApp herinneringen werken
- [ ] Buddy's hebben een eigen onboarding-flow
- [ ] Re-engagement berichten worden verstuurd bij inactiviteit

---

<a name="backlog"></a>
## 12. Backlog: P9 + Resterende Strategische Items

### Uit bestaand plan (P9)

| Feature | Complexiteit | Waarde | Afhankelijk van |
|---------|-------------|--------|----------------|
| Progressieve onboarding (week 1-4 flow) | Hoog | Hoog | Iteratie 2, 9 |
| Push notificaties (VAPID) | Gemiddeld | Hoog | Iteratie 6 (PWA) |
| 2FA voor admin (TOTP) | Gemiddeld | Hoog | SMTP config |
| Slimme aanbevelingsengine (ML) | Hoog | Hoog | Iteratie 5 |
| Contactstatus hulporganisaties | Gemiddeld | Hoog | — |
| Weekplan met favorieten | Gemiddeld | Gemiddeld | Iteratie 5 |
| Email-templates beheer | Gemiddeld | Gemiddeld | SMTP |
| Media-upload (S3/Cloudinary) | Gemiddeld | Gemiddeld | — |
| Dark mode | Laag | Laag | — |
| Multi-language support | Hoog | Laag | Iteratie 8 |

### Uit analyse — Strategisch (§7)

| Item | Bron | Toelichting |
|------|------|-------------|
| **E2E tests met Playwright** | §7.2 | 5 kritieke flows: registratie→login→dashboard, balanstest, check-in, artikel zoeken, buddy-match. 30+ unit tests is niet genoeg — geen integration of E2E tests |
| **Supabase disaster recovery** | §7.3 | Point-in-time recovery activeren, dagelijkse backups naar tweede locatie, disaster recovery plan documenteren |
| **Secundaire AI-provider** | §6.2 | OpenAI als backup voor wanneer Anthropic API down is. Verlaagt single point of failure |

---

<a name="compliance"></a>
## 13. Compliance Track (parallel aan alle iteraties)

**Dit is geen technisch werk maar juridisch/organisatorisch. Het loopt parallel aan de ontwikkel-iteraties.**

| Wanneer | Wat | Waarom (analyse-ref) | Wie |
|---------|-----|---------------------|-----|
| **Week 1** | Verwerkersovereenkomsten starten | §3.4 — AVG Art. 28 verplicht. Supabase, Vercel, Anthropic, Twilio verwerken persoonsgegevens | Juridisch/extern |
| **Week 1** | SMTP provider kiezen en configureren | Blokkeert P5 (gemeente-notificaties), 2FA, re-engagement | Technisch |
| **Week 2-4** | DPIA uitvoeren | §3.3 — Wettelijk verplicht bij gezondheidsdata (Art. 9 AVG). Boetes tot €20M mogelijk | Juridisch/extern |
| **Week 2-4** | Privacy policy herschrijven | §3.3 — Huidige policy dekt niet alle AI-verwerkingen | Juridisch |
| **Maand 2** | Register van verwerkingsactiviteiten (Art. 30) | §3.3 — Wettelijk verplicht. Alle verwerkingen, doelen, bewaartermijnen documenteren | Juridisch |
| **Maand 2** | Data retention policy formaliseren | §3.6 — AVG dataminimalisatie. Bewaartermijnen: audit logs 2j, check-ins 5j, berichten 1j, accounts 2j inactief | Juridisch + technisch |
| **Maand 3** | Anthropic DPA controleren | §3.4 — Claude onthoudt standaard conversaties voor training. Moet uit staan voor gezondheidsdata | Juridisch |

---

<a name="mapping"></a>
## 14. Traceerbaarheid: Analyse → Plan Mapping

Elke aanbeveling uit de kritische analyse is traceerbaar naar een specifieke taak in dit plan.

### Domein 1: Klantreis
| Aanbeveling | Ref | Verwerkt in |
|-------------|-----|-------------|
| Onboarding te zwaar | §1.1 | Iteratie 2, taak 2.4 |
| Geen "eerste waarde" in 60s | §1.2 | Iteratie 2, taak 2.5 |
| Buddy-journey onderontwikkeld | §1.3 | Iteratie 9, taak 9.5 |
| Geen re-engagement | §1.4 | Iteratie 9, taak 9.6 |

### Domein 2: Vormgeving & UX
| Aanbeveling | Ref | Verwerkt in |
|-------------|-----|-------------|
| Geen extern gevalideerd design system | §2.1 | Iteratie 6, taak 6.4 |
| WCAG 2.1 AA niet bereikt | §2.2 | Iteratie 6, taak 6.1 |
| Geen skeleton screens | §2.3 | Iteratie 6, taak 6.3 |
| 25x dangerouslySetInnerHTML | §2.4 | Iteratie 4, taak 4.8 |

### Domein 3: Dataveiligheid & Privacy
| Aanbeveling | Ref | Verwerkt in |
|-------------|-----|-------------|
| In-memory rate limiter | §3.1 | Iteratie 0, taak 0.2 |
| Hardcoded AUTH_SECRET | §3.2 | Iteratie 0, taak 0.1 |
| DPIA ontbreekt | §3.3 | Compliance Track, week 2-4 |
| Verwerkersovereenkomsten | §3.4 | Compliance Track, week 1 |
| $queryRawUnsafe | §3.5 | Iteratie 0, taak 0.3 |
| Geen data retention | §3.6 | Iteratie 8, taak 8.11 + Compliance Track |

### Domein 4: Architectuur
| Aanbeveling | Ref | Verwerkt in |
|-------------|-----|-------------|
| Geen service layer | §4.1 | Iteratie 3, taken 3.1-3.5 |
| 94/96 routes force-dynamic | §4.2 | Iteratie 4, taak 4.1 |
| Geen state management | §4.3 | Iteratie 3, taak 3.6 |
| 170+ hardcoded content | §4.4 | Iteratie 8, taken 8.1-8.4 |

### Domein 5: Performance
| Aanbeveling | Ref | Verwerkt in |
|-------------|-----|-------------|
| Geen monitoring/observability | §5.1 | Iteratie 1, taken 1.1-1.3 |
| N+1 query risico's | §5.2 | Iteratie 4, taak 4.2 |
| AI zonder streaming | §5.3 | Iteratie 4, taak 4.3 |

### Domein 6: AI Agents
| Aanbeveling | Ref | Verwerkt in |
|-------------|-----|-------------|
| Geen guardrails kwetsbare doelgroep | §6.1 | Iteratie 7, taken 7.1-7.2 |
| Geen fallback bij AI-uitval | §6.2 | Iteratie 7, taken 7.3-7.4 |
| Kosten niet gebudgetteerd | §6.3 | Iteratie 7, taken 7.5-7.6, 7.8 |
| Prompts niet geversioned | §6.4 | Iteratie 7, taak 7.7 |

### Domein 7: Strategisch
| Aanbeveling | Ref | Verwerkt in |
|-------------|-----|-------------|
| Roadmap te lineair | §7.1 | Dit plan: parallelle iteraties |
| Geen E2E tests | §7.2 | Backlog (Playwright) |
| Supabase single point of failure | §7.3 | Backlog (disaster recovery) |

---

## 15. Totaaloverzicht

### Urenschatting per iteratie

| # | Iteratie | Uren | Urgentie | Parallel mogelijk? |
|---|----------|------|----------|-------------------|
| **0** | Security Hotfixes | ~6 | ONMIDDELLIJK | Nee — eerst doen |
| **1** | Monitoring & Observability | ~12 | DEZE WEEK | Ja (parallel met 2) |
| **2** | Tags, Profiel & Wizard (P1) | ~22 | DEZE WEEK | Ja (parallel met 1) |
| **3** | Service Layer & State Management | ~28 | Sprint 1 | Na 1 |
| **4** | Zoeken, Caching & Performance | ~22 | Sprint 1 | Na 1, eventueel parallel met 3 |
| **5** | Personalisatie (P2) | ~14 | Sprint 2 | Na 2 |
| **6** | Toegankelijkheid & UX (P8+) | ~30 | Sprint 2 | Parallel met 5 |
| **7** | AI Hardening | ~24 | Sprint 2-3 | Na 1, 3 |
| **8** | Content Kwaliteit & DB Migratie | ~69 | Sprint 3-4 | Na 2, 3 |
| **9** | Gemeente, Klantreis & Re-engagement | ~48 | Sprint 4 | Na 3, SMTP |
| | **Totaal** | **~275** | | |
| | **+ Compliance Track** | **extern** | Parallel | |
| | **+ Backlog** | **onbepaald** | Na iteratie 9 | |

### Visuele tijdlijn

```
Week 1-2:   [Iteratie 0: Security]──→[Iteratie 1: Monitoring]
                                      [Iteratie 2: Tags/Profiel (P1)]

Week 3-6:   [Iteratie 3: Service Layer & State Mgmt]
             [Iteratie 4: Zoeken & Caching]

Week 7-10:  [Iteratie 5: Personalisatie (P2)]
             [Iteratie 6: Toegankelijkheid (P8)]
             [Iteratie 7: AI Hardening]

Week 11-16: [Iteratie 8: Content & DB Migratie (P3+P6)]
             [Iteratie 9: Gemeente & Re-engagement (P5)]

Doorlopend:  [Compliance Track: DPIA, verwerkersovereenkomsten, privacy policy]

Week 17+:   [Backlog: E2E tests, push notificaties, 2FA, etc.]
```

### Afhankelijkheidsgrafiek

```
Iteratie 0 (Security) ─── ONMIDDELLIJK, blokkeert niets technisch

Iteratie 1 (Monitoring) ──→ Iteratie 3 (Service Layer)
                         ──→ Iteratie 4 (Caching)
                         ──→ Iteratie 7 (AI Hardening)

Iteratie 2 (Tags/P1) ─────→ Iteratie 5 (Personalisatie/P2)
                     ─────→ Iteratie 8 (Content/P3+P6)

Iteratie 3 (Service Layer) → Iteratie 7 (AI Hardening)
                           → Iteratie 8 (Content)
                           → Iteratie 9 (Gemeente/P5)

Iteratie 6 (A11y) ───────── ONAFHANKELIJK (kan altijd parallel)

SMTP configuratie ────────→ Iteratie 9 (Gemeente notificaties)
```

---

## Legenda

| Symbool | Betekenis |
|---------|-----------|
| §x.y | Referentie naar de Kritische Analyse (domein.aanbeveling) |
| Px | Referentie naar het bestaande Projectplan 2026 (prioriteit) |
| ✅ | Afgerond |
| ⚠️ | Aandachtspunt / deels af |
| ❌ | Niet gestart / blokkerend |

---

*Dit geïntegreerde plan is opgesteld op 16 maart 2026. Het vervangt `VOLLEDIG-PROJECTPLAN-2026.md` als leidend document. Alle 27 aanbevelingen uit de externe kritische analyse zijn traceerbaar verwerkt.*

*Gerelateerde documenten:*
- `docs/VOLLEDIG-PROJECTPLAN-2026.md` — Oorspronkelijk projectplan (behouden als referentie)
- `docs/PLAN-HOOFDPLAN-2026.md` — Technisch hoofdplan (details per prioriteit)
- `docs/systeem-overzicht.md` — Functioneel systeemoverzicht
- `CHANGELOG.md` — Versiegeschiedenis
