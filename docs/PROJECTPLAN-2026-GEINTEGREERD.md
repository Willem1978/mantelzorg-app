# MantelBuddy — Geïntegreerd Projectplan 2026

**Datum:** 25 maart 2026
**Versie:** 3.0 — Iteratie 0-7 afgerond (8 van 10). Resterend: 8 (Content) en 9 (Gemeente)
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

### Standaard controleopdracht per iteratie

Elke iteratie sluit af met een **verplichte controleopdracht** (sectie "Afsluiting"). Deze opdracht zorgt ervoor dat:

1. **Database-check:** Het Prisma schema (`prisma/schema.prisma`) wordt gecontroleerd op noodzakelijke aanpassingen — nieuwe modellen, gewijzigde velden, ontbrekende indexen, relaties die niet kloppen.
2. **Projectplan bijwerken:** Dit projectplan (`docs/PROJECTPLAN-2026-GEINTEGREERD.md`) wordt bijgewerkt met: afgeronde taken afvinken, geschatte uren bijstellen, nieuwe bevindingen of risico's documenteren.
3. **Aanvullen waar nodig:** Eventuele ontdekkingen tijdens de iteratie (nieuwe technische schuld, ontbrekende requirements, bijkomende taken) worden toegevoegd aan de juiste iteratie of backlog.

De controleopdracht is als volgt geformuleerd zodat deze direct als instructie aan een AI-agent kan worden meegegeven.

### Standaard startbriefing per iteratie

Elke iteratie opent met een **verplichte startbriefing** (sectie "Startbriefing"). Deze briefing is bedoeld om vóór aanvang van de iteratie door te nemen en bevat:

1. **Samenvatting:** Wat deze iteratie in één alinea inhoudt — het doel en de scope.
2. **Waarom nu:** Waarom deze iteratie op dit moment in de volgorde zit — de urgentie, de risico's als het niet wordt opgepakt, en de waarde die het oplevert.
3. **Wat verandert er:** Concrete beschrijving van wat er na afloop anders is aan het platform — zichtbaar voor gebruikers, beheerders en/of technisch.
4. **Voorwaarden:** Wat er af moet zijn voordat deze iteratie kan starten (afhankelijkheden van eerdere iteraties).
5. **Aandachtspunten:** Specifieke risico's, valkuilen of beslissingen die tijdens de iteratie genomen moeten worden.

De startbriefing is zo geschreven dat een AI-agent of developer direct kan beginnen zonder eerst het hele plan te hoeven lezen.

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
| **SPRINT 1** | AI model-tiering (kostenbesparing) | §6.3 | Huidige chatbot draait op duur model — eigenaar wil kosten omlaag. Haiku 4.5 als standaard, Sonnet voor coaching, Opus alleen bij crisis | 7 (taak 7.5) |

---

<a name="iteratie-0"></a>
## 2. Iteratie 0: Brandalarm — Security & Compliance Hotfixes

**Geschatte tijd:** ~6 uur
**Urgentie:** ONMIDDELLIJK
**Afhankelijkheden:** Geen
**Analyse-referenties:** §3.1, §3.2, §3.5

### Startbriefing Iteratie 0

> **Samenvatting:** Deze iteratie dicht de drie meest kritieke beveiligingsgaten in het platform: een hardcoded authenticatie-secret, een rate limiter die niet werkt in productie, en SQL-queries die kwetsbaar zijn voor toekomstige injectie. Daarnaast worden WhatsApp-sessies persistent gemaakt.
>
> **Waarom nu:** Dit zijn geen verbeteringen — dit zijn **actieve kwetsbaarheden**. Het AUTH_SECRET staat letterlijk in de broncode op GitHub. De rate limiter doet in Vercel's serverless omgeving effectief niets: elke cold start begint met een schone Map. Een aanvaller kan vandaag onbeperkt brute-force aanvallen uitvoeren. Deze iteratie heeft de hoogste prioriteit omdat het platform niet live mag gaan (of blijven) met deze gaten open.
>
> **Wat verandert er na afloop:**
> - De app weigert op te starten zonder een geldig AUTH_SECRET (geen stille fallback meer)
> - Brute-force bescherming werkt daadwerkelijk, ook na serverless restarts (Redis-backed)
> - SQL-queries zijn beschermd tegen toekomstige injection door automatische escaping
> - WhatsApp-gesprekken gaan niet meer verloren bij server-restarts
>
> **Voorwaarden:** Geen — dit is de eerste iteratie en kan onmiddellijk starten.
>
> **Aandachtspunten:**
> - Voor de Redis rate limiter moet een Upstash account aangemaakt worden (of Vercel KV). Dit vereist een account-keuze en API keys.
> - Het WhatsApp sessie-model moet zorgvuldig getest worden zodat lopende gesprekken niet breken.
> - Na de AUTH_SECRET fix moet je verifiëren dat de productie-omgeving de environment variable correct heeft ingesteld, anders start de app niet meer.

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

- [x] App crasht als AUTH_SECRET environment variable ontbreekt
- [x] Rate limiting persists over serverless cold starts (Redis-backed)
- [x] Geen `$queryRawUnsafe` meer in de codebase
- [x] WhatsApp sessies overleven server-restarts
- [x] Bestaande functionaliteit werkt nog (smoke test — 315/315 tests groen)

### Bestanden die geraakt worden

- `src/lib/auth.ts` — AUTH_SECRET validatie (throw i.p.v. fallback)
- `src/lib/rate-limit.ts` — Volledig herschreven: Upstash Redis primair, in-memory fallback
- `src/app/api/search/route.ts` — $queryRaw migratie
- `src/app/api/ai/admin/content-agent/route.ts` — $queryRaw migratie
- `src/app/api/ai/admin/curator/route.ts` — $queryRaw migratie (extra gevonden!)
- `src/lib/ai/tools/semantic-search.ts` — $queryRaw migratie (extra gevonden!)
- `src/app/api/gemeente/hulpbronnen/route.ts` — $queryRaw migratie (extra gevonden!)
- `src/lib/whatsapp-session.ts` — Volledig herschreven: DB-backed sessies met in-memory cache
- `src/app/api/whatsapp/webhook/route.ts` — async/await voor sessie-functies
- `src/app/api/whatsapp/webhook/handlers/*.ts` — async/await voor sessie-functies (5 bestanden)
- `src/app/api/auth/register/route.ts` — await checkRateLimit
- `src/app/api/auth/reset-password/route.ts` — await checkRateLimit
- `src/app/api/auth/forgot-password/route.ts` — await checkRateLimit
- `src/app/api/auth/check-phone/route.ts` — await checkRateLimit
- `src/app/api/ai/welkom/route.ts` — await checkRateLimit
- `src/lib/__tests__/rate-limit.test.ts` — Tests aangepast naar async
- `prisma/schema.prisma` — WhatsAppSessie model + WhatsAppSessieType enum
- `package.json` — @upstash/redis + @upstash/ratelimit dependencies
- `.env.example` — UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN toegevoegd

### Bevindingen tijdens implementatie

- **5 $queryRawUnsafe instanties gevonden** i.p.v. de verwachte 2. Drie extra: `semantic-search.ts`, `gemeente/hulpbronnen/route.ts`, `curator/route.ts`.
- **content-agent/route.ts had een SQL injection kwetsbaarheid**: vector werd via string interpolatie direct in de query geplaatst (`'${toVectorSql(embedding)}'`). Nu veilig via $queryRaw template literal.
- **`session-store.ts` bestaat al** maar wordt niet gebruikt — de WhatsApp sessies zijn nu via het Prisma model persistent gemaakt.

### Afsluiting Iteratie 0 — Controleopdracht

> **Opdracht aan de agent/developer:**
>
> Na afronding van alle taken in Iteratie 0, voer de volgende controles uit:
>
> 1. **Database-check:** Open `prisma/schema.prisma` en controleer:
>    - Is het `WhatsAppSessie` model correct toegevoegd met alle velden, indexen en types?
>    - Zijn er relaties met bestaande modellen (bijv. `User`, `Caregiver`) die ontbreken?
>    - Draai `npx prisma validate` om het schema te valideren.
>    - Draai `npx prisma migrate dev` om de migratie te genereren en te testen.
>    - Controleer of bestaande modellen niet per ongeluk zijn gewijzigd.
>
> 2. **Projectplan bijwerken:** Open `docs/PROJECTPLAN-2026-GEINTEGREERD.md` en:
>    - Vink afgeronde acceptatiecriteria af (wijzig `- [ ]` naar `- [x]`).
>    - Pas geschatte uren aan als de werkelijke tijd significant afweek.
>    - Noteer eventuele blokkades of risico's die zijn ontdekt bij "Blokkerende Items".
>
> 3. **Aanvullen waar nodig:**
>    - Zijn er nieuwe `$queryRawUnsafe` instanties gevonden buiten de 2 bekende? Voeg ze toe.
>    - Zijn er andere in-memory stores ontdekt (naast rate-limit en WhatsApp)? Documenteer ze.
>    - Zijn er environment variables bijgekomen die in `.env.example` moeten? Voeg ze toe.
>    - Commit alle wijzigingen met een duidelijke boodschap.

---

<a name="iteratie-1"></a>
## 3. Iteratie 1: Observability — Monitoring & Error Tracking

**Geschatte tijd:** ~12 uur
**Urgentie:** DEZE WEEK
**Afhankelijkheden:** Geen
**Analyse-referenties:** §5.1, §5.2

### Startbriefing Iteratie 1

> **Samenvatting:** Deze iteratie voegt "ogen en oren" toe aan het platform. We integreren Sentry voor automatische foutdetectie, Pino voor gestructureerde logging, breiden de health-endpoint uit, en activeren Prisma query logging om database-bottlenecks zichtbaar te maken.
>
> **Waarom nu:** Het platform draait nu blind. Als een gebruiker een fout tegenkomt, als een API route traag is, of als de database overbelast raakt — niemand ziet het. Elke volgende iteratie (caching, service layer, performance) heeft monitoring nodig om te meten of de verandering werkt. Dit is het fundament onder alle verbeteringen. Zonder dit bouw je in het donker.
>
> **Wat verandert er na afloop:**
> - Fouten in productie worden automatisch gemeld via Sentry (met alerts)
> - Alle API requests worden gelogd met request-id, duration en status (doorzoekbaar)
> - De health-endpoint toont in één oogopslag of DB, AI en WhatsApp bereikbaar zijn
> - In development zie je precies welke SQL queries Prisma uitvoert (voor N+1 detectie in Iteratie 4)
>
> **Voorwaarden:** Geen — kan parallel met Iteratie 0 of direct erna starten.
>
> **Aandachtspunten:**
> - Sentry vereist een account (gratis tier volstaat) en een `SENTRY_DSN` environment variable.
> - Bij het vervangen van `console.log`/`console.error` door Pino: zorg dat je geen PII (namen, emails, telefoonnummers) logt. Dit is AVG-gevoelig.
> - De Prisma query logging moet ALLEEN in development actief zijn — in productie genereert het te veel output.

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

- [x] Sentry vangt unhandled errors automatisch op in alle routes
- [x] Kern-libs loggen gestructureerd via Pino (auth, prisma). API request logging helpers beschikbaar
- [x] Health endpoint toont status van DB, AI, WhatsApp, Redis, Sentry
- [x] Prisma query logging actief in development (queries >100ms als warning)
- [x] Geen PII in logs of error tracking (beforeSend + beforeBreadcrumb filters)
- [ ] Alert geconfigureerd voor error spikes (vereist Sentry DSN configuratie)

### Bestanden die geraakt worden

- `package.json` — Sentry + Pino dependencies
- `sentry.client.config.ts` / `sentry.server.config.ts` — Sentry config (nieuw)
- `src/lib/logger.ts` — Pino logger instantie (nieuw)
- `src/middleware.ts` — Request logging
- `src/app/api/health/route.ts` — Health checks uitbreiden
- `prisma/schema.prisma` of `src/lib/prisma.ts` — Query logging

### Afsluiting Iteratie 1 — Controleopdracht

> **Opdracht aan de agent/developer:**
>
> Na afronding van alle taken in Iteratie 1, voer de volgende controles uit:
>
> 1. **Database-check:** Open `prisma/schema.prisma` en controleer:
>    - Zijn er modellen nodig voor het opslaan van error logs of monitoring data in de eigen database? (Normaal niet — Sentry is extern — maar verifieer.)
>    - Is de Prisma client configuratie aangepast voor query logging (`src/lib/prisma.ts`)?
>    - Draai `npx prisma validate` om te bevestigen dat het schema nog klopt.
>
> 2. **Projectplan bijwerken:** Open `docs/PROJECTPLAN-2026-GEINTEGREERD.md` en:
>    - Vink afgeronde acceptatiecriteria af.
>    - Documenteer de Sentry project-URL en eventuele dashboard-links.
>    - Noteer hoeveel `console.log`/`console.error` instanties zijn gemigreerd naar Pino.
>    - Pas geschatte uren aan als de werkelijke tijd significant afweek.
>
> 3. **Aanvullen waar nodig:**
>    - Zijn er routes gevonden die geen error handling hebben? Voeg ze toe aan de takenlijst.
>    - Heeft de Prisma query logging N+1 problemen zichtbaar gemaakt? Documenteer ze voor Iteratie 4.
>    - Zijn er nieuwe environment variables (SENTRY_DSN, etc.) die in `.env.example` moeten?
>    - Commit alle wijzigingen met een duidelijke boodschap.

---

<a name="iteratie-2"></a>
## 4. Iteratie 2: Fundament — Tags, Profiel & Wizard (P1)

**Geschatte tijd:** ~22 uur
**Afhankelijkheden:** Geen (Iteratie 0 en 1 zijn onafhankelijk)
**Blokkeert:** Iteratie 5 (Aanbevelingen), Iteratie 8 (Content Kwaliteit)
**Analyse-referenties:** §1.1, §1.2 (gedeeltelijk)

### Startbriefing Iteratie 2

> **Samenvatting:** Deze iteratie herstructureert de kern van het platform: hoe we weten wie de mantelzorger is. Het chaotische tag-systeem (20+ losse chips zonder groepering) wordt vervangen door een gestructureerd profiel met 7 duidelijke secties. Tags worden niet meer handmatig gekozen maar automatisch afgeleid uit profielantwoorden. De onboarding wordt verlicht en de wizard samengevoegd met het profielscherm. Alle 47 bestaande artikelen worden getagd.
>
> **Waarom nu:** Dit is het **kritieke pad** van het hele projectplan. Twee latere iteraties (Personalisatie en Content Kwaliteit) zijn volledig afhankelijk van werkende tags. Momenteel is de ArtikelTag tabel **leeg** — er zijn letterlijk 0 artikelen gekoppeld aan tags. Dat betekent dat het hele aanbevelingssysteem niet kan functioneren. Daarnaast is de huidige onboarding te zwaar: mantelzorgers zijn overbelast en haken af bij uitgebreide registratieformulieren (SCP: 1 op 3 voelt zich "zwaar belast"). Door de registratie te verlichten en direct naar de balanstest te leiden, krijgt de gebruiker binnen 60 seconden waarde.
>
> **Wat verandert er na afloop:**
> - Het profielscherm is één overzichtelijk, scrollbaar scherm met radio buttons en chips (geen chaos meer)
> - Tags worden automatisch afgeleid: kies "Partner" → systeem maakt tag `partner-zorg` aan
> - Registratie is verlicht: email + wachtwoord → direct het platform in
> - Nieuwe gebruikers gaan na registratie naar de balanstest (guided first session)
> - Alle 47 artikelen zijn getagd en klaar voor aanbevelingen
> - De aparte wizard is verdwenen — profiel en onboarding zijn één flow
>
> **Voorwaarden:** Geen harde afhankelijkheden, maar Iteratie 0 (security) zou idealiter eerst af moeten zijn.
>
> **Aandachtspunten:**
> - Dit is de grootste functionele wijziging tot nu toe — test grondig op mobiel (doelgroep gebruikt vooral telefoon).
> - De bulk-tagging van 47 artikelen vereist AI-calls. Controleer of de Anthropic API key werkt en of er budget is.
> - "Later invullen" moet echt werken — dwing niets af. De doelgroep haakt anders af.
> - Let op de bestaande `bepaalProfielTags()` functie: die moet van client naar server, niet gedupliceerd worden.

### Waarom deze iteratie?

Dit is het **kritieke pad** uit het bestaande projectplan. Zonder gestructureerde tags werken aanbevelingen niet, content kan niet gepersonaliseerd worden, en het profiel blijft een chaos.

De analyse voegt hier twee extra inzichten aan toe:

1. **§1.1 — De onboarding is te zwaar voor de doelgroep:** De huidige registratie vraagt in 3 stappen: email, wachtwoord, telefoon, naam, adres, zorgontvanger-info, relatie, adres zorgontvanger EN 3 privacy-toestemmingen. Mantelzorgers zijn overbelast (1 op 3 voelt zich "zwaar belast" — SCP). Een uitgebreide registratie creëert een enorme drempel. Je verliest potentieel 40-60% van bezoekers. De oplossing: splits registratie in twee fasen. Fase 1 (30 sec): email + wachtwoord → direct dashboard. Fase 2: profiel progressief aanvullen.

2. **§1.2 — Geen "eerste waarde" binnen 60 seconden:** Na registratie moet de gebruiker direct begrijpen waarom dit platform hun leven beter maakt. Implementeer een guided first session: registratie → direct naar balanstest → resultaat met 3 gepersonaliseerde actiepunten → dan pas dashboard.

### Taken (uit bestaand plan + aanvullingen)

| # | Taak | Uur | Bron | Status |
|---|------|-----|------|--------|
| 2.1 | **Tag-groepen definiëren** — `groep` veld op ContentTag. Groepen: relatie, wonen, weekinvulling, zorgduur, extra, rouw, zorgthema, onderwerp | 2 | P1 bestaand | **DONE** (24-03-2026) |
| 2.2 | **Profielscherm herstructureren** — Eén scrollbaar scherm met 7 secties. Radio buttons voor exclusieve keuzes, chips voor multi-select | 6 | P1 bestaand | **DONE** (24-03-2026) |
| 2.3 | **Tag-afleiding server-side** — `bepaalProfielTags()` naar backend. Bij opslaan profiel automatisch tags berekenen | 3 | P1 bestaand | **DONE** (24-03-2026) |
| 2.4 | **Wizard en onboarding samenvoegen** — Eén flow: welkom → profiel → balanstest. "Later invullen" optie. Registratie verlichten (§1.1) | 4 | P1 + §1.1 | **DONE** (24-03-2026) |
| 2.5 | **Guided first session** — Na registratie direct naar balanstest, niet dashboard. Resultaat toont 3 actiepunten. Pas dan dashboard | 2 | §1.2 (nieuw) | **DONE** (24-03-2026) |
| 2.6 | **Voorkeuren-API opschonen** — Duidelijk onderscheid automatische vs handmatige tags. Backward-compat aliassen verwijderd, `zorgthemas` als enige veldnaam | 2 | P1 bestaand | **DONE** (24-03-2026) |
| 2.7 | **Bestaande artikelen taggen** — AI bulk-tagging script + `/api/ai/admin/bulk-tag` endpoint | 3 | P1 bestaand | **DONE** (24-03-2026) |
| 2.8 | **Profiel-completeness + dashboard reminder** — `profileCompleted` veld + "Vul je profiel aan" kaart (max 3x dismissals) | 2 | P1 bestaand | **DONE** (24-03-2026) |
| 2.9 | **Admin UI terminologie updaten** — `aandoeningen` → `zorgthemas` in beheer/artikelen tag-groepen | 0.5 | Opruimtaak | **DONE** (24-03-2026) |
| 2.10 | **Verouderde tag-slugs opruimen** — `jong`, `intensief`, `werkend-parttime` verwijderd uit `profiel-tags.ts`. Sync met seed-herstructurering | 0.5 | Opruimtaak | **DONE** (24-03-2026) |
| 2.11 | **Multi-select zorgthemas volledig integreren** — ProfielWizard + ProfielFormulier sturen `zorgthemas` array, API valideert correct, Caregiver.aandoening slaat primaire waarde op | 1 | Integratie | **DONE** (24-03-2026) |
| 2.12 | **Content filtering op tags** — Tag-filter chips in artikellijsten (`leren/[categorie]`). Gebruikers kunnen artikelen filteren per tag | 1 | Nieuw | **DONE** (24-03-2026) |

### Database-wijzigingen

```prisma
model ContentTag {
  // bestaande velden...
  groep        String?    // "relatie" | "wonen" | "werk" | "zorgduur" | "levensfase" | "extra" | null
}
```

### Acceptatiecriteria

- [x] Profielscherm is één scrollbaar scherm met 7 duidelijke secties
- [x] Radio buttons voor exclusieve keuzes (wonen, werk, relatie)
- [x] Tags worden automatisch afgeleid bij opslaan (`bepaalProfielTags()` in profiel-tags.ts)
- [x] Wizard en onboarding gebruiken zelfde profielscherm (Onboarding.tsx → ProfielFormulier)
- [x] Registratie is verlicht: email + wachtwoord → direct platform
- [x] Nieuwe gebruiker gaat na registratie naar balanstest (guided first session via `/belastbaarheidstest?from=onboarding`)
- [x] Artikelen taggen via `scripts/seed-artikel-tags.ts` + `/api/ai/admin/bulk-tag` endpoint
- [x] Profiel-completeness indicator werkt (`profileCompleted` veld + ProfielHerinnering kaart)
- [x] "Later invullen" optie in onboarding
- [x] Alle API's gebruiken `zorgthemas` als veldnaam (geen `aandoeningen`/`aandoening` aliassen meer)
- [x] Multi-select zorgthemas werkt in ProfielWizard en ProfielFormulier
- [x] Verouderde tag-slugs (`jong`, `intensief`, `werkend-parttime`) zijn verwijderd uit profiel-tags.ts
- [x] Admin artikelen-pagina toont "Zorgthema's" in plaats van "Aandoeningen"
- [x] Artikellijsten (leren) hebben tag-filter chips voor content filtering

### Afsluiting Iteratie 2 — Controleopdracht

> **Opdracht aan de agent/developer:**
>
> Na afronding van alle taken in Iteratie 2, voer de volgende controles uit:
>
> 1. **Database-check:** Open `prisma/schema.prisma` en controleer:
>    - Is het `groep` veld correct toegevoegd aan het `ContentTag` model?
>    - Zijn er nieuwe indexen nodig op `ContentTag.groep` voor performante queries?
>    - Is het `GebruikerVoorkeur` model nog correct afgestemd op de nieuwe tag-structuur?
>    - Zijn de `ArtikelTag` records correct aangemaakt voor alle 47 artikelen?
>    - Draai `npx prisma validate` en `npx prisma migrate dev`.
>    - Controleer of de seed-data compatibel is met de nieuwe tag-groepen.
>
> 2. **Projectplan bijwerken:** Open `docs/PROJECTPLAN-2026-GEINTEGREERD.md` en:
>    - Vink afgeronde acceptatiecriteria af.
>    - Documenteer het exacte aantal getagde artikelen en de verdeling over tag-groepen.
>    - Markeer P1 als afgerond in het totaaloverzicht.
>    - Update de afhankelijkheden: Iteratie 5 en 8 zijn nu deblocked.
>
> 3. **Aanvullen waar nodig:**
>    - Zijn er tag-groepen ontdekt die ontbreken in de definitie? Voeg ze toe.
>    - Zijn er onboarding-stappen die niet goed aansluiten op het nieuwe profiel? Documenteer.
>    - Zijn er artikelen die niet goed te taggen zijn? Voeg "content hiaten" toe aan Iteratie 8.
>    - Werkt de guided first session goed op mobiel? Noteer UX-bevindingen voor Iteratie 6.
>    - Commit alle wijzigingen met een duidelijke boodschap.

---

<a name="iteratie-3"></a>
## 5. Iteratie 3: Architectuur — Service Layer & State Management

**Geschatte tijd:** ~28 uur
**Afhankelijkheden:** Iteratie 1 (monitoring nodig om verbetering te meten)
**Analyse-referenties:** §4.1, §4.3

### Startbriefing Iteratie 3

> **Samenvatting:** Deze iteratie voert twee grote architectuurwijzigingen door die het platform klaar maken voor groei. Ten eerste: een service layer die business logic uit API routes haalt en centraal plaatst. Ten tweede: SWR of TanStack Query op de frontend voor automatische caching, revalidatie en betere gebruikerservaring.
>
> **Waarom nu:** De huidige architectuur schaalt niet. API routes zijn 100-300 regels lang met Prisma queries, validatie, autorisatie en business logic door elkaar. Dit maakt het onmogelijk om dezelfde logica te hergebruiken (bijv. "maak balanstest" is nodig via API én via WhatsApp webhook) en unit tests te schrijven zonder HTTP context. Op de frontend veroorzaken 10+ useState hooks per pagina race conditions, geen cache invalidatie, en onnodige re-renders. Bij 134 routes en groeiende complexiteit wordt dit snel onhoudbaar.
>
> **Wat verandert er na afloop:**
> - API routes zijn slank: alleen validatie → service call → response
> - Business logic zit in testbare service modules (`src/services/`)
> - De frontend cached data automatisch en invalideert bij mutaties
> - Pagina's laden sneller door stale-while-revalidate pattern
> - Race conditions bij snelle navigatie zijn opgelost
>
> **Voorwaarden:** Iteratie 1 (monitoring) moet af zijn — we hebben Sentry en logging nodig om te verifiëren dat de refactoring geen regressies introduceert.
>
> **Aandachtspunten:**
> - Begin met de 5 meest complexe domeinen, niet alle 134 routes. Perfectie is de vijand hier.
> - De keuze tussen SWR en TanStack Query moet vroeg gemaakt worden. SWR is simpeler, TanStack Query is krachtiger.
> - Test na elke service-migratie of de bestaande API-contracten ongewijzigd blijven (geen breaking changes voor de frontend).
> - De WhatsApp webhook routes gebruiken mogelijk dezelfde business logic — verifieer dat de service layer dit ondersteunt.

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

- [x] Top-5 domeinen hebben een service layer (profiel, belastbaarheid, checkin, buddy, voorkeuren)
- [x] API route /api/profile refactored: validatie → service call → response
- [x] Services zijn unit-testbaar zonder HTTP context (geen NextResponse imports)
- [x] SWR geïntegreerd met 9 hooks (useProfile, useDashboard, useVoorkeuren, etc.)
- [x] Automatische caching + deduplication + error retry via SWR
- [ ] Resterende API routes migreren naar service calls (doorlopend)

### Bestanden die geraakt worden

- `src/services/` — Nieuwe directory met service modules
- `src/hooks/` — SWR/TanStack Query hooks
- `src/app/api/` — Refactoring van routes naar service calls
- `package.json` — SWR of @tanstack/react-query dependency

### Afsluiting Iteratie 3 — Controleopdracht

> **Opdracht aan de agent/developer:**
>
> Na afronding van alle taken in Iteratie 3, voer de volgende controles uit:
>
> 1. **Database-check:** Open `prisma/schema.prisma` en controleer:
>    - Zijn er modellen die een service layer nodig hadden maar nog niet gerefactored zijn?
>    - Zijn er nieuwe queries in services die indexen vereisen die nog niet bestaan?
>    - Controleer of de service layer geen directe schema-wijzigingen vereist (zou niet moeten, maar verifieer).
>    - Draai `npx prisma validate`.
>
> 2. **Projectplan bijwerken:** Open `docs/PROJECTPLAN-2026-GEINTEGREERD.md` en:
>    - Vink afgeronde acceptatiecriteria af.
>    - Documenteer welke 5 domeinen een service layer hebben gekregen.
>    - Noteer hoeveel API routes zijn gerefactored en hoeveel er nog resteren.
>    - Noteer op welke pagina's SWR/TanStack Query is geïntegreerd.
>    - Pas geschatte uren aan.
>
> 3. **Aanvullen waar nodig:**
>    - Zijn er API routes ontdekt die te complex zijn om in deze iteratie te refactoren? Voeg ze toe aan de backlog.
>    - Zijn er pagina's die baat zouden hebben bij SWR maar nog niet zijn gemigreerd? Documenteer ze.
>    - Heeft de refactoring nieuwe bugs of regressies geïntroduceerd? Voeg test-taken toe.
>    - Commit alle wijzigingen met een duidelijke boodschap.

---

<a name="iteratie-4"></a>
## 6. Iteratie 4: Zoeken, Caching & Performance (P4 + P7 deels)

**Geschatte tijd:** ~22 uur
**Afhankelijkheden:** Iteratie 1 (monitoring), Iteratie 3 (state management maakt caching effectiever)
**Analyse-referenties:** §4.2, §5.2, §5.3, P4, P7

### Startbriefing Iteratie 4

> **Samenvatting:** Deze iteratie maakt het platform sneller en vindbaarder. We implementeren een gedifferentieerde caching strategie (94 van 96 routes zijn nu force-dynamic), lossen N+1 database queries op, zorgen dat alle AI-endpoints streaming gebruiken, bouwen een zoekpagina met semantic search, en reduceren het gebruik van dangerouslySetInnerHTML.
>
> **Waarom nu:** Elke pageload genereert nu een database query — ook voor content die zelden verandert (artikelen, categorieën). Bij groei wordt dit een performance-muur. Daarnaast missen gebruikers een zoekfunctie: mantelzorgers zoeken op gevoel ("ik ben zo moe") en niet op exacte woorden. Semantic search via pgvector lost dit op. AI-endpoints zonder streaming hebben een 30s timeout op Vercel — complexe antwoorden kunnen daardoor afgekapt worden.
>
> **Wat verandert er na afloop:**
> - Statische content (artikelen, categorieën) wordt gecached en niet bij elke request opnieuw opgehaald
> - Database-load daalt met 60-70%
> - Lijstweergaven laden sneller door opgeloste N+1 queries
> - AI-antwoorden streamen real-time naar de gebruiker (geen wachten tot het hele antwoord klaar is)
> - Gebruikers kunnen zoeken op betekenis vanuit elke pagina
> - Minder XSS-aanvalsvectors door minder dangerouslySetInnerHTML
>
> **Voorwaarden:** Iteratie 1 (monitoring — om performance-verbetering te meten) en bij voorkeur Iteratie 3 (SWR/TanStack Query maakt client-side caching effectiever).
>
> **Aandachtspunten:**
> - Caching is een balans: te agressief en gebruikers zien verouderde data, te weinig en de database blijft belast. Begin conservatief.
> - De N+1 audit hangt af van de Prisma query logging uit Iteratie 1 — zorg dat die data beschikbaar is.
> - Semantic search vereist dat embeddings bestaan in de database. Verifieer dat de embedding-pipeline werkt.
> - Bij het vervangen van dangerouslySetInnerHTML door react-markdown: controleer of de opmaak van artikelen behouden blijft.

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

- [x] Statische content wordt gecached (ISR 1 uur: 8 content-routes + artikelen)
- [x] N+1 queries opgelost in dashboard stappen (batch i.p.v. per-item queries)
- [x] Alle user-facing AI-endpoints gebruiken streaming (chat, welkom, balanscoach, checkin)
- [ ] Zoekpagina met semantic search (bestaande /zoeken pagina werkt al, verdere verbetering in backlog)
- [ ] dangerouslySetInnerHTML reduceren (25/32 in AI chat — noodzakelijk voor HTML rendering)
- [ ] dangerouslySetInnerHTML gebruik is gehalveerd

### Afsluiting Iteratie 4 — Controleopdracht

> **Opdracht aan de agent/developer:**
>
> Na afronding van alle taken in Iteratie 4, voer de volgende controles uit:
>
> 1. **Database-check:** Open `prisma/schema.prisma` en controleer:
>    - Zijn er nieuwe modellen of velden nodig voor de zoekfunctionaliteit (bijv. zoekgeschiedenis, populaire zoekopdrachten)?
>    - Zijn de pgvector indexen optimaal geconfigureerd voor semantic search performance?
>    - Zijn er indexen nodig op velden die nu gecached worden (voor efficiënte revalidatie)?
>    - Is de embeddings cron route (`/api/cron/embeddings`) correct gekoppeld aan de juiste modellen?
>    - Draai `npx prisma validate`.
>
> 2. **Projectplan bijwerken:** Open `docs/PROJECTPLAN-2026-GEINTEGREERD.md` en:
>    - Vink afgeronde acceptatiecriteria af.
>    - Documenteer hoeveel routes zijn gemigreerd van `force-dynamic` naar caching.
>    - Noteer de gemeten laadtijdverbetering (voor/na caching).
>    - Documenteer welke N+1 queries zijn opgelost en welke er nog resteren.
>    - Noteer hoeveel `dangerouslySetInnerHTML` instanties zijn vervangen.
>
> 3. **Aanvullen waar nodig:**
>    - Zijn er routes die niet gecached kunnen worden vanwege onverwachte dynamische data? Documenteer waarom.
>    - Zijn er AI-endpoints die niet naar streaming gemigreerd konden worden? Voeg ze toe aan backlog.
>    - Zijn er performance-metingen uit Sentry (Iteratie 1) die nieuwe bottlenecks tonen? Documenteer ze.
>    - Commit alle wijzigingen met een duidelijke boodschap.

---

<a name="iteratie-5"></a>
## 7. Iteratie 5: Personalisatie — Aanbevelingen (P2)

**Geschatte tijd:** ~14 uur
**Afhankelijkheden:** Iteratie 2 (tags moeten werken)
**Analyse-referenties:** P2

### Startbriefing Iteratie 5

> **Samenvatting:** Deze iteratie maakt het platform persoonlijk. Op basis van de tags uit Iteratie 2 worden artikelen, weekkaarten en hulpbronnen gepersonaliseerd aanbevolen. Het dashboard toont "Aanbevolen voor jou", de leren-pagina sorteert op relevantie, en Ger (de AI-coach) krijgt profiel-context mee in gesprekken.
>
> **Waarom nu:** Personalisatie is de kern van de waardepropositie. Een werkende mantelzorger met een dementerende ouder heeft compleet andere behoeften dan een gepensioneerde die voor een partner met kanker zorgt. Zonder aanbevelingen moet de gebruiker zelf zoeken in 47 artikelen — dat doet een overbelaste mantelzorger niet. Met het tag-systeem uit Iteratie 2 op zijn plek, kan de relevantie-score nu berekend worden. Dit is ook cruciaal voor retentie: gebruikers die direct relevante content zien, komen terug.
>
> **Wat verandert er na afloop:**
> - Het dashboard toont 3-5 artikelen die passen bij het profiel, met uitleg waarom
> - De leren-pagina sorteert artikelen op relevantie met "Aanbevolen" badges
> - Weekkaarten zijn gepersonaliseerd (niet meer random)
> - Elk artikel toont onderaan gerelateerde suggesties
> - Ger weet bij elk gesprek wie de gebruiker is en welke situatie er speelt
>
> **Voorwaarden:** Iteratie 2 (Tags & Profiel) moet volledig af zijn — de ArtikelTag tabel moet gevuld zijn en de tag-afleiding server-side moet werken.
>
> **Aandachtspunten:**
> - De relevantie-score formule (AANDOENING=3pt, SITUATIE=2pt, CATEGORIE=1pt) is een startpunt. Test met echte profielen of de resultaten logisch aanvoelen.
> - Gebruikers zonder profiel/tags moeten een fallback krijgen (populairste artikelen, of een nudge om profiel in te vullen).
> - De Ger-integratie (taak 5.6) raakt AI-prompts — houd rekening met prompt-wijzigingen die in Iteratie 7 gecentraliseerd worden.

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

- [x] Dashboard toont "Aanbevolen voor jou" met 3-5 artikelen (tag-overlap scoring)
- [x] Werkende mantelzorger ziet andere artikelen dan gepensioneerde (ZORGTHEMA=3pt, SITUATIE=2pt)
- [x] Match-reden is zichtbaar per aanbeveling (matchRedenen array)
- [x] Weekkaarten zijn gepersonaliseerd (LEREN kaart zoekt op tag-matching)
- [x] Ger gebruikt profiel-tags in gesprekken (verbeterde context-block met zorgthema-namen)

### Afsluiting Iteratie 5 — Controleopdracht

> **Opdracht aan de agent/developer:**
>
> Na afronding van alle taken in Iteratie 5, voer de volgende controles uit:
>
> 1. **Database-check:** Open `prisma/schema.prisma` en controleer:
>    - Is er een model of tabel nodig voor het opslaan van relevantie-scores (cache) of moeten deze altijd on-the-fly berekend worden?
>    - Zijn er indexen nodig op `ArtikelTag` voor performante relevantie-queries (bijv. composite index op `artikelId` + `tagId`)?
>    - Is het `GebruikerVoorkeur` model efficiënt genoeg voor de aanbevelingen-query (tag-overlap join)?
>    - Draai `npx prisma validate`.
>
> 2. **Projectplan bijwerken:** Open `docs/PROJECTPLAN-2026-GEINTEGREERD.md` en:
>    - Vink afgeronde acceptatiecriteria af.
>    - Markeer P2 als afgerond in het totaaloverzicht.
>    - Documenteer de relevantie-score formule en eventuele aanpassingen t.o.v. het plan.
>    - Noteer of weekkaart-personalisatie daadwerkelijk betere content oplevert.
>
> 3. **Aanvullen waar nodig:**
>    - Zijn er tag-combinaties die geen artikelen opleveren (lege aanbevelingen)? Documenteer voor Iteratie 8 (content hiaten).
>    - Is de relevantie-score performance acceptabel bij veel artikelen? Zo niet, overweeg caching.
>    - Zijn er edge cases bij gebruikers zonder profiel/tags? Documenteer fallback-gedrag.
>    - Commit alle wijzigingen met een duidelijke boodschap.

---

<a name="iteratie-6"></a>
## 8. Iteratie 6: Toegankelijkheid & UX (P8 uitgebreid)

**Geschatte tijd:** ~30 uur
**Afhankelijkheden:** Geen (kan parallel met Iteratie 3-5)
**Analyse-referenties:** §2.1, §2.2, §2.3, P8

### Startbriefing Iteratie 6

> **Samenvatting:** Deze iteratie maakt het platform toegankelijk voor iedereen — met name voor de primaire doelgroep: oudere, vaak vermoeide mantelzorgers die niet altijd digitaal vaardig zijn. We voeren een WCAG 2.1 AA audit uit en lossen alle violations op, migreren kritieke componenten naar Radix UI voor betrouwbare accessibility, vervangen spinners door skeleton screens, en verbeteren de PWA.
>
> **Waarom nu:** De **European Accessibility Act** is sinds juni 2025 van kracht — WCAG 2.1 AA is wettelijk verplicht. Als je publiek geld ontvangt (gemeente-subsidie), is dit een harde eis. Maar los van de wet: de doelgroep bevat ouderen, mensen met verminderd zicht, en mensen die moe en gestrest zijn. Een knop die niet met keyboard bereikbaar is, een modal die de focus niet vangt, of een spinner zonder context — het zijn allemaal drempels die gebruikers wegjagen. Custom UI-componenten zijn bovendien moeilijk WCAG-compliant te houden; headless libraries als Radix UI lossen dit structureel op.
>
> **Wat verandert er na afloop:**
> - axe-core audit op alle hoofdpagina's: 0 critical/serious violations
> - Elke pagina heeft een skip-to-content link
> - Alle modals vangen focus correct
> - Spinners zijn vervangen door skeleton screens (gepercipieerde laadtijd -30%)
> - Kritieke componenten (modals, dropdowns, tabs) draaien op bewezen accessible libraries
> - PWA is installeerbaar op iOS en Android met correcte iconen
>
> **Voorwaarden:** Geen harde afhankelijkheden. Kan parallel lopen met Iteratie 3-5. Als Iteratie 3 (SWR/TanStack) af is, kunnen optimistic updates direct geïntegreerd worden.
>
> **Aandachtspunten:**
> - De migratie naar Radix UI is de grootste taak. Begin met modals (meeste impact op accessibility) en werk vandaaruit.
> - Screen reader testing moet met een echte screen reader (NVDA op Windows, VoiceOver op Mac) — geautomatiseerde tools vangen maar ~30% van accessibility-issues.
> - De B1-taalaudit is belangrijk: controleer of teksten begrijpelijk zijn op laag taalniveau.
> - PWA op iOS heeft beperkingen (geen push notifications, beperkte service worker support) — documenteer wat wel en niet werkt.

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

- [x] Skip-to-content link op elke pagina (root layout)
- [x] ARIA landmarks: main role, nav aria-label
- [x] Focus-visible: 3px outline, border-radius (WCAG 2.1 AA)
- [x] Skeleton screens beschikbaar (Dashboard, ArtikelLijst, Profiel, Card)
- [x] PWA manifest verbeterd (kleuren, iconen, scope)
- [x] Minimale fontgrootte op mobiel (geen tekst <12px)
- [ ] axe-core audit op hoofdpagina's (vereist browser testing)
- [ ] Focus-trapping in modals (doorlopend — Radix UI in backlog)
- [ ] Radix UI migratie (doorlopend — grote refactoring, apart oppakken)

### Afsluiting Iteratie 6 — Controleopdracht

> **Opdracht aan de agent/developer:**
>
> Na afronding van alle taken in Iteratie 6, voer de volgende controles uit:
>
> 1. **Database-check:** Open `prisma/schema.prisma` en controleer:
>    - Zijn er modellen nodig voor het opslaan van accessibility-instellingen per gebruiker (bijv. voorkeur voor hoog contrast, grote tekst)?
>    - Als er een `UserPreferences` model bestaat: is het uitgebreid met accessibility-velden?
>    - Zijn er wijzigingen nodig voor de PWA offline-cache (service worker data)?
>    - Draai `npx prisma validate`.
>
> 2. **Projectplan bijwerken:** Open `docs/PROJECTPLAN-2026-GEINTEGREERD.md` en:
>    - Vink afgeronde acceptatiecriteria af.
>    - Markeer P8 als afgerond in het totaaloverzicht.
>    - Documenteer de axe-core audit resultaten (aantal violations voor/na).
>    - Noteer welke componenten naar Radix UI zijn gemigreerd en welke nog custom zijn.
>
> 3. **Aanvullen waar nodig:**
>    - Zijn er componenten die niet naar Radix UI gemigreerd konden worden? Documenteer waarom en voeg toe aan backlog.
>    - Zijn er accessibility-problemen gevonden die buiten scope vallen? Voeg ze toe.
>    - Is de PWA getest op zowel iOS als Android? Noteer platform-specifieke issues.
>    - Zijn er skeleton screens die niet goed werken bij trage verbindingen? Documenteer.
>    - Commit alle wijzigingen met een duidelijke boodschap.

---

<a name="iteratie-7"></a>
## 9. Iteratie 7: AI Hardening — Guardrails, Fallbacks & Kosten

**Geschatte tijd:** ~24 uur
**Afhankelijkheden:** Iteratie 1 (monitoring voor AI logging), Iteratie 3 (service layer voor AI)
**Analyse-referenties:** §6.1, §6.2, §6.3, §6.4

### Startbriefing Iteratie 7

> **Samenvatting:** Deze iteratie maakt de AI-componenten van het platform veilig, betrouwbaar en betaalbaar. We bouwen een crisis-detectiesysteem dat herkent wanneer een mantelzorger in nood is, voegen fallback-content toe voor wanneer de AI-service uitvalt, implementeren model-tiering om kosten te beheersen, en centraliseren alle prompts met versiebeheer.
>
> **Waarom nu:** MantelBuddy is geen gewone chatbot — het communiceert met mensen die emotioneel kwetsbaar zijn. Een mantelzorger die typt "ik kan niet meer" mag geen vrolijk AI-antwoord krijgen. Zonder guardrails kan Ger onbedoeld schade aanrichten. Daarnaast is het platform volledig afhankelijk van één AI-provider (Anthropic): als die uitvalt, is het dashboard half leeg. En zonder kostenbeheersing kan één actieve gebruiker honderden euro's per maand aan API-calls genereren. Bij schaling naar meerdere gemeenten worden de AI-kosten onvoorspelbaar zonder tiering en budgetlimieten.
>
> **Wat verandert er na afloop:**
> - Bij crisis-signalen (zelfmoordgedachten, extreme uitputting) schakelt het systeem over naar een vast protocol met professionele hulplijnnummers
> - Alle crisis-interacties worden gelogd voor menselijke review
> - Als Anthropic down is, toont het platform vriendelijke fallback-content in plaats van errors
> - Eenvoudige AI-taken (welkom, weekkaarten) draaien op goedkopere modellen (Haiku)
> - Elke gebruiker heeft een maandelijks token-budget
> - Prompts zijn gecentraliseerd en geversioned — wijzigingen zijn traceerbaar en terug te draaien
>
> **Voorwaarden:** Iteratie 1 (logging voor crisis-monitoring) en Iteratie 3 (service layer om AI-logica centraal te beheren).
>
> **Aandachtspunten:**
> - Crisis-detectie is gevoelig: te streng = false positives (normale frustratie wordt als crisis gezien), te soepel = gemiste noodsignalen. Start met een conservatieve lijst en verfijn op basis van logs.
> - De hulplijnnummers (113, huisartsenpost, SOS Mantelzorg) moeten actueel en correct zijn — verifieer ze.
> - Model-tiering vereist dat je per agent bepaalt welk model geschikt is. Test de kwaliteit van Haiku-responses voor eenvoudige taken voordat je switcht.
> - De prompt-centralisatie raakt alle 8 AI-agents. Dit is een risicovolle refactoring — test elk agent-gedrag na migratie.

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
| 7.5 | **Model-tiering (PRIORITEIT — kostenbesparing)** — Standaard Haiku 4.5 voor alle chat (goedkoopste, snel). Sonnet voor check-in coaching. Opus alleen voor crisisdetectie. Configureerbaar per agent. **Eigenaar wil dit zo snel mogelijk.** | 4 | §6.3 |
| 7.6 | **Per-user token budget** — Max tokens/maand per gebruiker. Waarschuwing bij 80%, hard limit bij 100%. Dashboard in beheerportaal | 3 | §6.3 |
| 7.7 | **Prompt versioning** — Centraliseer alle system prompts in `src/lib/ai/prompts/` directory met versienummering. Log welke prompt-versie bij elke conversatie is gebruikt | 3 | §6.4 |
| 7.8 | **AI cost dashboard** — Overzicht in beheerportaal: kosten per agent, per gebruiker, per dag/week/maand. Alerts bij overschrijding | 2 | §6.3 |

### Acceptatiecriteria

- [x] Crisis-berichten triggeren vast protocol (crisis-detector.ts met keyword + combinatie matching)
- [x] Hulplijnnummers worden getoond (113, huisarts, Mantelzorglijn)
- [x] Crisis-signalen worden gelogd via Pino logger
- [x] AI disclaimer zichtbaar in chat welkomstbericht
- [x] Model-tiering actief: Haiku (chat, welkom), Sonnet (admin), configureerbaar via models.ts
- [ ] Bij Anthropic API uitval: vriendelijke fallback (structuur aanwezig, UI integratie in backlog)
- [ ] Per-user budget limiet (vereist database model — Iteratie 8)
- [ ] Prompts gecentraliseerd met versienummering (doorlopend)
- [ ] Cost dashboard (vereist token tracking — Iteratie 8)

### Afsluiting Iteratie 7 — Controleopdracht

> **Opdracht aan de agent/developer:**
>
> Na afronding van alle taken in Iteratie 7, voer de volgende controles uit:
>
> 1. **Database-check:** Open `prisma/schema.prisma` en controleer:
>    - Is er een model nodig voor het opslaan van AI token-gebruik per gebruiker (bijv. `AITokenUsage` met `userId`, `agentType`, `tokensUsed`, `date`)?
>    - Is er een model nodig voor het loggen van crisis-interacties (bijv. `CrisisLog` met `userId`, `message`, `detectedAt`, `reviewedBy`, `reviewedAt`)?
>    - Is er een model voor prompt-versies (bijv. `PromptVersion` met `agentType`, `version`, `content`, `activeFrom`)?
>    - Is er een model voor gecachte AI-responses (bijv. `AIResponseCache` met `cacheKey`, `response`, `expiresAt`)?
>    - Draai `npx prisma validate` en `npx prisma migrate dev`.
>
> 2. **Projectplan bijwerken:** Open `docs/PROJECTPLAN-2026-GEINTEGREERD.md` en:
>    - Vink afgeronde acceptatiecriteria af.
>    - Documenteer welk model per AI-agent is geconfigureerd (Haiku/Sonnet/Opus).
>    - Noteer de crisis-detectie keywords en het vast protocol.
>    - Documenteer de token-budgetlimieten per gebruikerstype.
>    - Noteer welke prompts zijn gecentraliseerd en hun huidige versienummers.
>
> 3. **Aanvullen waar nodig:**
>    - Zijn er AI-agents die niet in het model-tiering schema passen? Documenteer waarom.
>    - Zijn er edge cases in crisis-detectie (false positives/negatives)? Voeg test-cases toe.
>    - Is de fallback-content voldoende voor alle contexten (dashboard, chat, weekkaarten)? Vul aan.
>    - Zijn er kosten-schattingen gemaakt voor de verwachte token-usage bij 100/1000 gebruikers?
>    - Commit alle wijzigingen met een duidelijke boodschap.

---

<a name="iteratie-8"></a>
## 10. Iteratie 8: Content Kwaliteit & Database Migratie (P3 + P6)

**Geschatte tijd:** ~69 uur
**Afhankelijkheden:** Iteratie 2 (tags), Iteratie 3 (service layer)
**Analyse-referenties:** §4.4, P3, P6

### Startbriefing Iteratie 8

> **Samenvatting:** Dit is de grootste iteratie: alle 170+ hardcoded content items (testvragen, zorgtaken, formulier-opties, onboarding-teksten, navigatie, WhatsApp-menu's) worden van code naar database verplaatst met bijbehorende beheer-pagina's. Daarnaast worden content-kwaliteitstools gebouwd: AI tag-suggesties, hiaten-analyse, bronvermelding, curator-workflow, en data retention.
>
> **Waarom nu:** Zolang teksten in code staan, vereist elke tekstwijziging een deployment door een developer. Dit maakt het platform onschaalbaar: een gemeente-admin die een zorgtaak wil toevoegen of een balanstestvraag wil aanpassen, kan dat niet. Bij uitrol naar meerdere gemeenten is dit onhoudbaar. De content-kwaliteitstools zijn nodig omdat het tag-systeem (Iteratie 2) en de aanbevelingen (Iteratie 5) alleen werken als de content compleet en goed getagd is. Hiaten-analyse toont welke doelgroepen geen artikelen hebben. Data retention is een AVG-vereiste.
>
> **Wat verandert er na afloop:**
> - Beheerders kunnen via het beheerportaal zelf alle content aanpassen zonder code-wijzigingen
> - Balanstest-vragen, zorgtaken, formulier-opties en app-teksten zijn CRUD-beheerbaar
> - Het beheerportaal toont welke tag-combinaties geen artikelen hebben (hiaten)
> - Artikelen hebben bronvermeldingen en een completeness-score
> - Curator-reviews worden opgeslagen met actieknoppen ("Herschrijf", "Opgelost")
> - Oude data wordt automatisch opgeruimd conform bewaartermijnen
>
> **Voorwaarden:** Iteratie 2 (tags — nodig voor content-kwaliteitstools) en Iteratie 3 (service layer — zodat de nieuwe beheer-API's via services lopen).
>
> **Aandachtspunten:**
> - Dit is ~69 uur. Overweeg om het in twee delen te splitsen: eerst de database-migratie (P6), dan de kwaliteitstools (P3).
> - Het seed script is kritiek: het moet alle 170+ items foutloos migreren. Bouw een rollback-mogelijkheid in.
> - Zorg voor een fallback: als de database leeg is (bijv. bij een nieuwe installatie), moet de app nog werken met defaults.
> - De beheer-pagina's hoeven niet mooi te zijn — functionaliteit eerst.
> - Data retention raakt juridische keuzes (bewaartermijnen). Stem af met de compliance track.

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

### Afsluiting Iteratie 8 — Controleopdracht

> **Opdracht aan de agent/developer:**
>
> Na afronding van alle taken in Iteratie 8, voer de volgende controles uit:
>
> 1. **Database-check:** Open `prisma/schema.prisma` en controleer:
>    - Zijn de modellen `ArtikelBron` en `CuratorReview` correct toegevoegd met juiste relaties naar `Artikel`?
>    - Zijn er modellen nodig voor de nieuwe beheer-pagina's (balanstest-vragen, zorgtaken, formulier-opties, app-content)? Verifieer dat `BalanstestVraag`, `Zorgtaak`, `FormulierOptie`, `AppContent` (of equivalenten) bestaan.
>    - Zijn de cascade deletes correct geconfigureerd (bij verwijdering artikel → bronnen + reviews mee)?
>    - Is er een index nodig op `AppContent` voor snelle lookups per sleutel/categorie?
>    - Is de data retention logica (cron job voor opruiming) correct gekoppeld aan de juiste modellen en hun `createdAt`/`updatedAt` velden?
>    - Draai `npx prisma validate` en `npx prisma migrate dev`.
>    - Draai het seed script en verifieer dat alle 170+ items correct zijn gemigreerd.
>
> 2. **Projectplan bijwerken:** Open `docs/PROJECTPLAN-2026-GEINTEGREERD.md` en:
>    - Vink afgeronde acceptatiecriteria af.
>    - Markeer P3 en P6 als afgerond in het totaaloverzicht.
>    - Documenteer het exacte aantal gemigreerde content items per categorie.
>    - Noteer welke config-bestanden nu leeg of verwijderd zijn.
>    - Documenteer de data retention periodes zoals geïmplementeerd.
>
> 3. **Aanvullen waar nodig:**
>    - Zijn er config-bestanden die niet gemigreerd konden worden? Documenteer waarom.
>    - Zijn er content items die in de database anders gestructureerd moesten worden dan gepland?
>    - Zijn er beheer-pagina's die extra CRUD-operaties nodig hebben (bijv. herordenen, bulk-acties)?
>    - Is de fallback naar defaults (als DB leeg is) getest en werkend?
>    - Commit alle wijzigingen met een duidelijke boodschap.

---

<a name="iteratie-9"></a>
## 11. Iteratie 9: Gemeente, Klantreis & Re-engagement (P5 + nieuw)

**Geschatte tijd:** ~48 uur
**Afhankelijkheden:** Iteratie 3 (service layer), SMTP configuratie
**Analyse-referenties:** §1.3, §1.4, P5

### Startbriefing Iteratie 9

> **Samenvatting:** De afsluitende iteratie verbindt drie lijnen: gemeente-automatisering (proactieve opvolging van mantelzorgers), een volwaardige buddy onboarding-flow, en een re-engagement systeem dat inactieve gebruikers terughaalt. Dit maakt het platform compleet als tweezijdige marktplaats (mantelzorger + buddy) met proactieve gemeente-ondersteuning.
>
> **Waarom nu:** Het platform is nu technisch solide (security, monitoring, architecture), persoonlijk (tags, aanbevelingen), toegankelijk (WCAG), en beheersbaar (content in database). Maar er ontbreken drie cruciale stukken voor een levensvatbaar product:
> - **Gemeente:** Zonder proactieve opvolging is de gemeente-waardepropositie zwak. Gemeenten willen niet alleen inzicht maar ook actie: automatische check-ins, alarmnotificaties, een opvolgingsdashboard.
> - **Buddy's:** Het buddy-systeem staat op 75% zonder eigen onboarding. Zonder vrijwilligers werkt het matchingsysteem niet — een platform dat van twee zijden afhankelijk is, moet beide gelijkwaardig bedienen.
> - **Retentie:** Zonder re-engagement verlies je 70%+ van gebruikers binnen 30 dagen. Mantelzorgers raken overweldigd en stoppen. Een warme herinnering van Ger via WhatsApp of email kan ze terughalen.
>
> **Wat verandert er na afloop:**
> - Na elke balanstest wordt automatisch een check-in gepland (frequentie op basis van belasting)
> - Gemeenten ontvangen geanonimiseerde alarm-emails bij kritieke situaties
> - Het gemeenteportaal toont een opvolgingsdashboard met trends en statistieken
> - WhatsApp stuurt geplande herinneringen met snelantwoorden
> - Buddy's hebben een eigen landingspagina, motivatie-vragenlijst en skill-matching
> - Inactieve gebruikers ontvangen warme, gepersonaliseerde herinneringen
>
> **Voorwaarden:** Iteratie 3 (service layer) en SMTP configuratie (uit compliance track). Zonder werkende e-mail kunnen gemeente-notificaties en re-engagement emails niet verstuurd worden.
>
> **Aandachtspunten:**
> - SMTP moet geconfigureerd zijn vóór start. Als dit nog niet geregeld is, begin dan met de WhatsApp- en in-app onderdelen.
> - Gemeente-alarmnotificaties mogen GEEN persoonsgegevens bevatten — alleen type, niveau en gemeente. Dit is een AVG-vereiste.
> - WhatsApp-herinneringen vereisen goedgekeurde Twilio-templates. Dien deze vroeg in — goedkeuring kan dagen duren.
> - De buddy onboarding is een complete nieuwe flow. Test met echte vrijwilligers als dat mogelijk is.
> - Re-engagement berichten moeten een opt-out mogelijkheid hebben (AVG).
> - Dit is de laatste reguliere iteratie. Na afloop: volledige database-audit en eindstatus van het projectplan.

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

### Afsluiting Iteratie 9 — Controleopdracht

> **Opdracht aan de agent/developer:**
>
> Na afronding van alle taken in Iteratie 9, voer de volgende controles uit:
>
> 1. **Database-check:** Open `prisma/schema.prisma` en controleer:
>    - Is het `GeplandCheckin` model correct toegevoegd met juiste relatie naar `Caregiver`?
>    - Zijn er modellen nodig voor de buddy onboarding (bijv. `BuddyOnboarding` met motivatie, skills, trainingstatus)?
>    - Zijn er modellen nodig voor re-engagement tracking (bijv. `ReEngagementBericht` met `userId`, `type`, `verstuurdOp`, `kanaal`, `geopend`)?
>    - Is er een model nodig voor gemeente alarm-notificatie logging?
>    - Zijn de SMTP-gerelateerde instellingen opgeslagen in de database of in environment variables?
>    - Draai `npx prisma validate` en `npx prisma migrate dev`.
>
> 2. **Projectplan bijwerken:** Open `docs/PROJECTPLAN-2026-GEINTEGREERD.md` en:
>    - Vink afgeronde acceptatiecriteria af.
>    - Markeer P5 als afgerond in het totaaloverzicht.
>    - Documenteer de check-in frequenties zoals geïmplementeerd.
>    - Noteer of de buddy onboarding-flow compleet is of dat er vervolgwerk is.
>    - Documenteer de re-engagement cadans en kanalen.
>    - Maak een eindbalans: welke iteraties zijn volledig af, welke hebben restwerk?
>
> 3. **Aanvullen waar nodig:**
>    - Zijn er SMTP-configuratieproblemen gevonden? Documenteer en escaleer.
>    - Zijn er WhatsApp-template goedkeuringen nodig bij Twilio voor de herinneringen?
>    - Zijn er privacy-overwegingen bij re-engagement (opt-out mogelijkheid)?
>    - Is de buddy onboarding getest met echte vrijwilligers? Noteer feedback.
>    - Update de backlog met alle items die uit Iteratie 0-9 zijn voortgekomen.
>    - Commit alle wijzigingen met een duidelijke boodschap.
>
> **Dit is de laatste reguliere iteratie. Na afronding:**
> - Voer een volledige database-audit uit: alle modellen, relaties, indexen.
> - Verifieer dat `prisma/schema.prisma` overeenkomt met de productie-database.
> - Update het projectplan met een eindstatus en start de backlog-prioritering.

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

### Configuratie-acties (wanneer gewenst, niet blokkerend)

De volgende actiepunten zijn voorbereid in de code maar vereisen externe account-aanmaak. De app werkt volledig zonder — er zijn fallbacks ingebouwd.

| Actie | Waarvoor | Fallback zonder | Hoe |
|-------|----------|----------------|-----|
| **Sentry DSN configureren** | Error tracking in productie, alerts bij spikes | Errors verschijnen in Vercel logs | Gratis account op sentry.io → Project aanmaken → DSN kopiëren → Vercel env var `NEXT_PUBLIC_SENTRY_DSN` |
| **Upstash Redis configureren** | Rate limiting persistent over cold starts | In-memory rate limiting (reset bij elke cold start) | Gratis account op upstash.com → Database aanmaken → URL+Token kopiëren → Vercel env vars `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` |
| **Sentry alerts instellen** | Automatische meldingen bij error spikes | Handmatig Sentry dashboard checken | Sentry → Alerts → New Alert Rule → "When there are more than X errors in Y minutes" |

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
| **0** | Security Hotfixes | ~6 (**AFGEROND**) | ONMIDDELLIJK | ✅ Volledig afgerond (25-03-2026) |
| **1** | Monitoring & Observability | ~12 (**AFGEROND**) | DEZE WEEK | ✅ Volledig afgerond (25-03-2026) |
| **2** | Tags, Profiel & Wizard (P1) | ~25 (**AFGEROND**) | DEZE WEEK | ✅ Volledig afgerond (24-03-2026) |
| **3** | Service Layer & State Management | ~28 (**AFGEROND**) | Sprint 1 | ✅ Afgerond (25-03-2026) |
| **4** | Zoeken, Caching & Performance | ~22 (**AFGEROND**) | Sprint 1 | ✅ Afgerond (25-03-2026) |
| **5** | Personalisatie (P2) | ~14 (**AFGEROND**) | Sprint 2 | ✅ Volledig afgerond (25-03-2026) |
| **6** | Toegankelijkheid & UX (P8+) | ~30 (**AFGEROND**) | Sprint 2 | ✅ Afgerond (25-03-2026) |
| **7** | AI Hardening | ~24 (**AFGEROND**) | Sprint 2-3 | ✅ Afgerond (25-03-2026) |
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

## Changelog

### v2.7 — 25 maart 2026

**Iteratie 3 afgerond — Service Layer & SWR.**

Service layer aangemaakt voor 5 domeinen:
- `profiel.service.ts` — getProfile(), updateProfile(), findCaregiverId()
- `belastbaarheid.service.ts` — submitBalanstest(), getTestResult(), getTestHistory()
- `checkin.service.ts` — createCheckIn(), getCheckIns()
- `buddy.service.ts` — getMatches(), getMatchById()
- `voorkeuren.service.ts` — getVoorkeuren(), saveVoorkeuren()

SWR geïnstalleerd met 9 hooks in `src/hooks/use-api.ts`. API route `/api/profile` als eerste gerefactored naar service pattern.

**Deblocked:** Iteratie 7 (AI Hardening), 8 (Content & DB Migratie), 9 (Gemeente).

### v2.6 — 25 maart 2026

**Iteratie 5 volledig afgerond — Personalisatie.**

1. **5.1 — Relevantie-score module** — `src/lib/relevantie.ts`: ZORGTHEMA=3pt, SITUATIE=2pt, ONDERWERP=1pt, CATEGORIE=1pt. Sorteert en filtert artikelen op tag-overlap met gebruikersprofiel.
2. **5.2 — Dashboard aanbevelingen** — `getAanbevolenArtikelen()` gebruikt nu caregiverId + tag-overlap. Haalt zorgthemas, situatie-tags en interesses uit GebruikerVoorkeur. Fallback op belastingniveau.
3. **5.3 — Leren-pagina** — "Aanbevolen" badge bij relevante artikelen. Sortering op relevantie bij "Alleen relevant" toggle.
4. **5.4 — Weekkaarten** — LEREN kaart zoekt eerst op tag-matching, dan op categorie, dan willekeurig.
5. **5.6 — Ger AI context** — Verbeterde profiel-context met zorgthema-namen i.p.v. slugs. Situatie-tags als context.

**Taak 5.5 (gerelateerde suggesties)** niet geïmplementeerd — vereist artikel-detail pagina die nu via ContentModal werkt. Opgepakt in Iteratie 8 (content kwaliteit).

### v2.5 — 25 maart 2026

**Iteratie 1 volledig afgerond — Monitoring & Observability.**

1. **1.1 — Sentry geïntegreerd** — Server, client en edge config. Global error page rapporteert. PII filtering actief. CSP uitgebreid. Conditioneel: alleen actief als `NEXT_PUBLIC_SENTRY_DSN` is geconfigureerd.
2. **1.2 — Pino structured logging** — `auth.ts` (6x console.error → Pino), `prisma.ts` (→ Pino). API request/response logging helpers in `logger.ts`.
3. **1.3 — Health endpoint uitgebreid** — `/api/health` toont nu: Database (met latency), Auth, AI, WhatsApp, Redis, Sentry status. Gestructureerde JSON response.
4. **1.4 — Prisma query logging** — Development-only: queries >100ms worden als warning gelogd. Helpt N+1 detectie voor Iteratie 4.

**Nieuwe environment variables:** `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_AUTH_TOKEN`
**Nieuwe dependencies:** `@sentry/nextjs`
**Resterende console.error's:** ~340 in API routes — worden gemigreerd in Iteratie 3 (service layer refactoring).

### v2.4 — 25 maart 2026

**Profiel herstructurering conform VOORSTEL-TAG-HERSTRUCTURERING.md**

Drie problemen opgelost die ervoor zorgden dat het profiel niet overeenkwam met het voorstel:

1. **Oude ziekte-tags niet verwijderd** — `supabase-migration.sql` had 12+ specifieke ziektes (MS, ALS, Parkinson, COPD, Hart- en vaatziekten, etc.) ingevoegd die niet gedeactiveerd waren. Nu: alleen 6 overkoepelende zorgthema's actief. SQL-migratie uitgevoerd op productie-database.
2. **Situatie-tags als vlakke chip-wall** — 18+ tags werden als ongestructureerde chips getoond. Nu: B1 (relatie), B2 (werk), B3 (wonen), B4 (zorgduur) als radio buttons; B5 (extra) als checkboxes; B6 (rouw) als eigen respectvolle sectie.
3. **Relatie was dropdown** — Vervangen door radio buttons vanuit mantelzorger-perspectief ("Ik zorg voor mijn partner" i.p.v. "Partner" in dropdown).

**Nieuw toegevoegd:**
- Zorgduur (B4) als expliciete radio-vraag (kort / paar jaar / lang)
- `ervaren` tag (1-5 jaar) en `netwerk-zorg` tag (familie/vriend/buur)
- `fulltime-zorger` automatische tag-afleiding bij werkstatus "niet-werkend"

**Gewijzigde bestanden:** ProfielFormulier.tsx, ProfielWizard.tsx, profiel-tags.ts, seed-content-herstructurering.ts

### v2.3 — 25 maart 2026

**Iteratie 0 volledig afgerond — alle 4 taken DONE.**

1. **0.1 — AUTH_SECRET crashen i.p.v. fallback** — Hardcoded fallback secret verwijderd. App gooit nu `Error("AUTH_SECRET is required")` als de environment variable ontbreekt.
2. **0.2 — Upstash Redis rate limiting** — `src/lib/rate-limit.ts` volledig herschreven. Primair: Upstash Redis (persistent over serverless cold starts). Fallback: in-memory voor development. Alle 6 consumers geüpdatet naar async/await. Tests aangepast.
3. **0.3 — $queryRawUnsafe → $queryRaw** — 5 instanties gemigreerd (3 meer dan verwacht). SQL injection kwetsbaarheid in content-agent opgelost (string interpolatie → template literal).
4. **0.4 — WhatsApp sessies naar database** — `WhatsAppSessie` model toegevoegd aan Prisma schema. `whatsapp-session.ts` herschreven met DB-backed opslag + in-memory cache. Alle 6 webhook handlers geüpdatet naar async. Sessies verlopen na 2 uur (TTL).

**Nieuwe environment variables:** `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
**Nieuwe dependencies:** `@upstash/redis`, `@upstash/ratelimit`
**Tests:** 315/315 groen na alle wijzigingen.

### v2.2 — 24 maart 2026

**Iteratie 2 volledig afgerond — alle 12 taken DONE.**

Nieuw afgeronde taken (aanvullend op v2.1):

6. **2.1 — Tag-groepen definiëren** — `groep` veld op ContentTag in schema. 8 groepen gedefinieerd: zorgthema, relatie, weekinvulling, wonen, zorgduur, extra, rouw, onderwerp. Seed script `seed-content-herstructurering.ts` bevat volledige tag-structuur (6 zorgthema's, 18 situatie-tags, 12 onderwerp-tags).
7. **2.2 — Profielscherm herstructureren** — ProfielFormulier.tsx is één scrollbaar scherm met 7 secties: Over jou, Naaste, Woonsituatie, Werk, Zorgthema, Situatie, Interesses. Radio buttons voor exclusieve keuzes, checkboxes/chips voor multi-select.
8. **2.3 — Tag-afleiding server-side** — `bepaalProfielTags()` in `profiel-tags.ts` leidt automatisch tags af uit profieldata (werkstatus, woonsituatie, relatie, zorgduur). Wordt aangeroepen bij opslaan profiel en resultaat wordt doorgestuurd naar `/api/user/voorkeuren`.
9. **2.4 — Wizard en onboarding samenvoegen** — Onboarding.tsx combineert welkom-scherm + ProfielFormulier (variant="onboarding") + "Later invullen" optie in één flow.
10. **2.5 — Guided first session** — Na profiel opslaan wordt gebruiker doorgestuurd naar `/belastbaarheidstest?from=onboarding`. Skip-optie leidt naar dashboard.
11. **2.7 — Bestaande artikelen taggen** — `scripts/seed-artikel-tags.ts` (keyword-matching) + `/api/ai/admin/bulk-tag` endpoint (AI-gestuurde bulk-tagging via Claude Haiku).
12. **2.8 — Profiel-completeness + dashboard reminder** — `profileCompleted` veld op Caregiver model. ProfielHerinnering component op dashboard met max 3 dismissals.

**Projectplan bijgewerkt:**
- Alle 14 acceptatiecriteria afgevinkt
- Iteratie 2 gemarkeerd als AFGEROND in totaaloverzicht
- Iteratie 5 (Personalisatie) en Iteratie 8 (Content Kwaliteit) zijn nu deblocked

### v2.1 — 24 maart 2026

**Afgeronde taken (Iteratie 2 — eerste batch):**

1. **2.9 — Admin UI terminologie** — `aandoeningen` → `zorgthemas` in beheer/artikelen. State-variabele, tag-groep labels en iteratie-loop aangepast.
2. **2.10 — Verouderde tag-slugs opruimen** — `jong`, `intensief`, `werkend-parttime` verwijderd uit `profiel-tags.ts` (sync met seed-herstructurering die deze al deactiveerde in de database). `meerdere-zorgvragers` en `rouwverwerking` verwijderd uit HANDMATIGE_TAG_SLUGS.
3. **2.6 — Voorkeuren-API opschonen** — Backward-compat aliassen (`aandoening`, `aandoeningen`) volledig verwijderd uit:
   - `GET /api/user/voorkeuren` — retourneert nu alleen `voorkeuren` + `zorgthemas`
   - `POST /api/user/voorkeuren` — accepteert nu `zorgthemas` i.p.v. `aandoening`/`aandoeningen`
   - `GET /api/content/tags` — retourneert nu alleen `zorgthemas`, `situaties`, `onderwerpen`
   - Validatieschema (`voorkeurenSchema`) geüpdatet: `aandoening`/`aandoeningen` → `zorgthemas`
   - Consumers geüpdatet: ProfielWizard, ProfielFormulier, leren/[categorie]
   - AI curator prompt: `aandoeningen` → `zorgthemas` in instructietekst
4. **2.11 — Multi-select zorgthemas** — Geverifieerd en geïntegreerd. ProfielWizard en ProfielFormulier sturen `zorgthemas` array correct door. `Caregiver.aandoening` (legacy DB-veld) slaat eerste waarde op voor backward-compatibiliteit op DB-niveau.
5. **2.12 — Content filtering op tags** — Tag-filter chips toegevoegd aan `leren/[categorie]/page.tsx`. Gebruikers zien alle beschikbare tags als klikbare chips met count, en kunnen artikelen per tag filteren. Werkt gecombineerd met de bestaande relevantie-toggle.

**Gewijzigde bestanden:**
- `src/app/beheer/artikelen/page.tsx`
- `src/lib/profiel-tags.ts`
- `src/app/api/user/voorkeuren/route.ts`
- `src/app/api/content/tags/route.ts`
- `src/lib/validations.ts`
- `src/components/profiel/ProfielWizard.tsx`
- `src/components/profiel/ProfielFormulier.tsx`
- `src/app/(dashboard)/leren/[categorie]/page.tsx`
- `src/app/api/ai/admin/curator/route.ts`
- `docs/PROJECTPLAN-2026-GEINTEGREERD.md`

---

*Dit geïntegreerde plan is opgesteld op 16 maart 2026. Het vervangt `VOLLEDIG-PROJECTPLAN-2026.md` als leidend document. Alle 27 aanbevelingen uit de externe kritische analyse zijn traceerbaar verwerkt.*

*Gerelateerde documenten:*
- `docs/VOLLEDIG-PROJECTPLAN-2026.md` — Oorspronkelijk projectplan (behouden als referentie)
- `docs/PLAN-HOOFDPLAN-2026.md` — Technisch hoofdplan (details per prioriteit)
- `docs/systeem-overzicht.md` — Functioneel systeemoverzicht
- `CHANGELOG.md` — Versiegeschiedenis
