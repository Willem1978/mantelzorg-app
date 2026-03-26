# MantelBuddy — Openstaande Items

**Datum:** 26 maart 2026
**Status:** Masterplan 2.0 + Projectplan 2026 + Tag-herstructurering zijn afgerond
**Dit bestand vervangt:** MASTERPLAN-2.0.md, PROJECTPLAN-2026-GEINTEGREERD.md, VOORSTEL-TAG-HERSTRUCTURERING.md

---

## 1. Externe configuratie (vereist accounts/credentials)

| # | Item | Nodig | Effort |
|---|------|-------|--------|
| 1 | **SMTP provider configureren** | Account bij bijv. Resend, Postmark of SendGrid | 2h |
| 2 | **Sentry DSN configureren** | Gratis Sentry account → DSN → `NEXT_PUBLIC_SENTRY_DSN` env var | 1h |
| 3 | **Sentry alerts instellen** | Sentry dashboard → Alert Rules | 0.5h |
| 4 | **Upstash Redis configureren** | Gratis Upstash account → URL+Token → env vars | 1h |
| 5 | **Twilio WhatsApp templates** | Goedgekeurde message templates indienen bij Twilio | 4h |

**Totaal: ~8.5h** — geen code nodig, alleen configuratie + env vars op Vercel.

---

## 2. Compliance track (juridisch/organisatorisch)

| # | Item | Wie | Urgentie |
|---|------|-----|----------|
| 1 | **DPIA uitvoeren** | Juridisch/extern | Wettelijk verplicht (Art. 9 AVG) |
| 2 | **Verwerkersovereenkomsten** | Juridisch | AVG Art. 28 (Supabase, Vercel, Anthropic, Twilio) |
| 3 | **Privacy policy herschrijven** | Juridisch | Huidige dekt niet alle AI-verwerkingen |
| 4 | **Register van verwerkingsactiviteiten** | Juridisch | AVG Art. 30 |
| 5 | **Data retention policy formaliseren** | Juridisch + technisch | Bewaartermijnen vastleggen |
| 6 | **Anthropic DPA controleren** | Juridisch | Training opt-out voor gezondheidsdata |

---

## 3. Technische verbeteringen (backlog)

### Hoge prioriteit

| # | Item | Effort | Toelichting |
|---|------|--------|-------------|
| 1 | **Per-user AI token budget + cost dashboard** | 8h | Token tracking per gebruiker, waarschuwing bij 80%, hard limit |
| 2 | **Prompt versioning met rollback** | 6h | Alle system prompts centraliseren in src/lib/ai/prompts/ met versienummers |
| 3 | **AI fallback bij Anthropic uitval** | 4h | Structuur aanwezig, UI integratie nog niet |
| 4 | **Gemeente alarm-emails** | 4h | Geblokkeerd door SMTP configuratie (#1 hierboven) |
| 5 | **WhatsApp herinneringen** | 4h | Geblokkeerd door Twilio templates (#5 hierboven) |

### Medium prioriteit

| # | Item | Effort | Toelichting |
|---|------|--------|-------------|
| 6 | **E2E tests met Playwright** | 12h | 5 kritieke flows: registratie, balanstest, check-in, zoeken, buddy-match |
| 7 | **axe-core WCAG audit** | 4h | Vereist browser testing met NVDA/VoiceOver |
| 8 | **Radix UI migratie** | 16h | Focus-trapping modals, dropdowns, tabs → headless components |
| 9 | **dangerouslySetInnerHTML reduceren** | 4h | 25/32 in AI chat — meeste noodzakelijk voor HTML rendering |
| 10 | **Resterende API routes → service layer** | Doorlopend | 134 routes, top-5 domeinen zijn gedaan |
| 11 | **Bronvermelding UI in artikelen** | 3h | ArtikelBron model bestaat, UI ontbreekt |
| 12 | **Supabase disaster recovery** | 4h | Point-in-time recovery, dagelijkse backups |

### Lage prioriteit (features)

| # | Item | Effort | Toelichting |
|---|------|--------|-------------|
| 13 | **Push notificaties (VAPID)** | 6h | PWA push notifications |
| 14 | **2FA voor admin (TOTP)** | 4h | Geblokkeerd door SMTP |
| 15 | **ML-gebaseerde aanbevelingsengine** | 16h | Leren van ratings + gedrag |
| 16 | **Email-templates beheer** | 4h | Geblokkeerd door SMTP |
| 17 | **Media-upload (S3/Cloudinary)** | 6h | Afbeeldingen bij artikelen |
| 18 | **Dark mode** | 4h | CSS variabelen staan klaar in globals.css |
| 19 | **Multi-language support** | 16h | i18n framework |
| 20 | **Progressieve onboarding (week 1-4 flow)** | 8h | Geleidelijke profiel-aanvulling |
| 21 | **A/B testing framework** | 6h | Feature flags + variant tracking |
| 22 | **Contactstatus hulporganisaties** | 4h | Hulpbronnen-validator checkt al websites |
| 23 | **Secundaire AI-provider (OpenAI backup)** | 8h | Verlaagt single point of failure |

---

## 4. Wat is afgerond

### Masterplan 2.0 (alle 5 iteraties — ~175h)
- ✅ Iteratie 1: Content Werkbank + Artikel Interactie (ArtikelInteractie model, Kanban, Slim Publiceren, duplicate-detectie, auto-tags)
- ✅ Iteratie 2: Activiteiten + Hulpbronnen (Activiteit model, AI-zoeker, beheer + gebruikerspagina, hulpbronnen wizard)
- ✅ Iteratie 3: Design System + UI/UX (paurs/navy kleurenpalet, beheer-sidebar, zoekbalk, balanstest restyled)
- ✅ Iteratie 4: AI Agents + Analytics (artikel analytics, gewogen hiaten-analyse, WhatsApp check-in, proactieve notificaties)
- ✅ Iteratie 5: Buddy + Gemeente + Progressie (buddy onboarding, gemeente CTA, progressie-systeem, data-export, onboarding conversie)

### Projectplan 2026 (10 iteraties — ~350h)
- ✅ Iteratie 0: Security hotfixes (AUTH_SECRET, rate limiting, SQL injection, WhatsApp sessies)
- ✅ Iteratie 1: Monitoring (Sentry, Pino logging, health checks, Prisma query logging)
- ✅ Iteratie 2: Tags, Profiel & Wizard (6 zorgthema's, profielscherm, onboarding, bulk-tagging)
- ✅ Iteratie 3: Service Layer & SWR (5 services, 9 SWR hooks)
- ✅ Iteratie 4: Caching & Performance (ISR, N+1 fix, streaming)
- ✅ Iteratie 5: Personalisatie (relevantie-score, dashboard aanbevelingen, Ger context)
- ✅ Iteratie 6: Toegankelijkheid (skip-links, ARIA, skeleton screens, PWA)
- ✅ Iteratie 7: AI Hardening (crisis-detectie, model-tiering, disclaimer)
- ✅ Iteratie 8: Content & DB Migratie (content-loader, completeness, hiaten, data retention)
- ✅ Iteratie 9: Gemeente & Re-engagement (check-in planning, alarmen, re-engagement service)

### Tag-herstructurering
- ✅ 6 overkoepelende zorgthema's (vervangt 12 specifieke ziektes)
- ✅ B1-B5 gestructureerde profielsecties (radio buttons + multi-select)
- ✅ B6 Rouw-sectie (eigen respectvolle plek in profiel)
- ✅ Automatische tag-afleiding (bepaalProfielTags)
- ✅ Artikelen getagd via bulk-tag endpoint
- ✅ Relevantie-score op basis van tags

---

## 5. Database-migraties nog draaien

De volgende modellen zijn toegevoegd aan het Prisma schema maar moeten nog op Supabase gedraaid worden:

```sql
-- ArtikelInteractie (Masterplan 2.0, Iteratie 1)
CREATE TABLE "ArtikelInteractie" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
  "caregiverId" TEXT NOT NULL,
  "artikelId" TEXT NOT NULL,
  "gelezen" BOOLEAN NOT NULL DEFAULT false,
  "gelezenOp" TIMESTAMP(3),
  "rating" INTEGER,
  "ratingOp" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ArtikelInteractie_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ArtikelInteractie_caregiverId_artikelId_key" UNIQUE ("caregiverId", "artikelId"),
  CONSTRAINT "ArtikelInteractie_caregiverId_fkey" FOREIGN KEY ("caregiverId") REFERENCES "Caregiver"("id") ON DELETE CASCADE,
  CONSTRAINT "ArtikelInteractie_artikelId_fkey" FOREIGN KEY ("artikelId") REFERENCES "Artikel"("id") ON DELETE CASCADE
);
CREATE INDEX "ArtikelInteractie_caregiverId_idx" ON "ArtikelInteractie"("caregiverId");
CREATE INDEX "ArtikelInteractie_artikelId_idx" ON "ArtikelInteractie"("artikelId");
CREATE INDEX "ArtikelInteractie_rating_idx" ON "ArtikelInteractie"("rating");

-- Activiteit (Masterplan 2.0, Iteratie 2)
CREATE TABLE "Activiteit" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
  "naam" TEXT NOT NULL,
  "beschrijving" TEXT,
  "locatie" TEXT,
  "adres" TEXT,
  "woonplaats" TEXT NOT NULL,
  "gemeente" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "frequentie" TEXT,
  "dag" TEXT,
  "tijd" TEXT,
  "kosten" TEXT,
  "contactNaam" TEXT,
  "contactTelefoon" TEXT,
  "contactEmail" TEXT,
  "website" TEXT,
  "bronUrl" TEXT,
  "isGevalideerd" BOOLEAN NOT NULL DEFAULT false,
  "isActief" BOOLEAN NOT NULL DEFAULT true,
  "laatsteValidatie" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Activiteit_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Activiteit_woonplaats_type_idx" ON "Activiteit"("woonplaats", "type");
CREATE INDEX "Activiteit_gemeente_type_idx" ON "Activiteit"("gemeente", "type");
CREATE INDEX "Activiteit_isGevalideerd_isActief_idx" ON "Activiteit"("isGevalideerd", "isActief");
```

---

*Laatste update: 26 maart 2026*
