# MantelBuddy — Verbetervoorstel & Openstaande Items

**Datum:** 26 maart 2026
**Versie:** 1.0
**Bron:** Code-audit (security, database, architectuur, AI) + openstaande items uit afgeronde plannen

---

## 1. Kritieke security fixes (direct oppakken)

| # | Probleem | Ernst | Bestand | Effort |
|---|----------|-------|---------|--------|
| S1 | **Mass assignment in PATCH activiteiten** — `...data` spread zonder validatie, aanvaller kan willekeurige velden overschrijven | 🔴 Kritiek | `api/beheer/activiteiten/route.ts` | 15 min |
| S2 | **Setup endpoint zonder auth** — kan admin accounts aanmaken zonder authenticatie | 🔴 Kritiek | `api/beheer/setup/route.ts` | 15 min |
| S3 | **SQL template interpolatie in duplicaten route** — conditionele `$queryRaw` met user input | 🔴 Kritiek | `api/beheer/content-werkbank/duplicaten/route.ts` | 15 min |
| S4 | **Geen rate limiting op AI endpoints** — chat, checkin, balanscoach zijn dure Anthropic calls zonder limiet | 🟠 Hoog | `api/ai/chat/`, `checkin/`, `balanscoach/` | 30 min |
| S5 | **Cron notificaties optionele auth** — als CRON_SECRET leeg is, kan iedereen triggeren | 🟠 Hoog | `api/cron/notificaties/route.ts` | 5 min |
| S6 | **Geen Twilio webhook signature validatie** — spoofed WhatsApp berichten mogelijk | 🟠 Hoog | `api/whatsapp/webhook/route.ts` | 30 min |
| S7 | **Missende input validatie** — activiteiten type, buddy skills, tags niet gevalideerd | 🟡 Medium | Meerdere routes | 1h |

### Oplossingen

**S1 — Mass assignment fix:**
```typescript
// Alleen toegestane velden accepteren
const { id, naam, beschrijving, type, isGevalideerd, isActief } = body
await prisma.activiteit.update({ where: { id }, data: { naam, beschrijving, type, isGevalideerd, isActief } })
```

**S5 — CRON_SECRET verplicht maken:**
```typescript
if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
}
```

---

## 2. Database verbeteringen

### Ontbrekende indexen (performance)

| # | Model | Ontbrekende index | Impact |
|---|-------|-------------------|--------|
| D1 | **Task** | `@@index([caregiverId])`, `@@index([caregiverId, dueDate])` | Full table scan op dashboard |
| D2 | **BuddyMatch** | `@@index([buddyId, status])`, `@@index([caregiverId, status])` | Trage match-queries |
| D3 | **Notification** | `@@index([userId, createdAt])` | Trage notificatie-sortering |
| D4 | **BuddyBeoordeling** | `@@index([caregiverId])` | Trage review-queries |
| D5 | **Bericht** | `@@index([matchId, isGelezen])` | Trage ongelezen-count |
| D6 | **ArtikelInteractie** | `@@index([caregiverId, gelezen])` | Trage "gelezen artikelen" query |

### N+1 query problemen

| # | Locatie | Probleem | Oplossing |
|---|---------|----------|-----------|
| N1 | `api/buddys/mijn-matches/route.ts` | Per match een aparte `count()` query voor ongelezen berichten | Vervang door `groupBy` batch query |
| N2 | `lib/dashboard/hulpbronnen.ts` | Per zorgtaak 2 aparte queries (lokaal + landelijk) | Eén batch query, groeperen in applicatie |

### Schema verbeteringen

| # | Probleem | Oplossing |
|---|----------|-----------|
| D7 | **Activiteit.type is String** — geen database-level validatie | Voeg `ActivityType` enum toe |
| D8 | **MantelBuddy.userId mist onDelete** — orphaned records mogelijk | Voeg `onDelete: SetNull` toe |
| D9 | **Unbounded queries** — findMany zonder `take` limiet | Voeg `take: 100` of paginatie toe aan artikelen, hulpbronnen |
| D10 | **Race condition BuddyMatch status** — geen optimistic locking | Voeg status-check toe aan `where` clause |

---

## 3. Architectuur verbeteringen

### Monolithische componenten (splitsen)

| # | Bestand | Regels | Actie |
|---|---------|--------|-------|
| A1 | `beheer/hulpbronnen/page.tsx` | **3.253** | Splitsen in 10+ subcomponenten |
| A2 | `profiel/page.tsx` | **1.515** | Data fetching, UI, logica scheiden |
| A3 | `hulpvragen/page.tsx` | **1.387** | Component compositie toepassen |
| A4 | `belastbaarheidstest/page.tsx` | **1.255** | StreetSearch extracten, stappen als componenten |
| A5 | `dashboard/page.tsx` | **542** | Types naar apart bestand, secties als componenten |

### Code duplicatie (extracten)

| # | Probleem | Voorkomens | Oplossing |
|---|----------|------------|-----------|
| C1 | **Auth check inline** — `const session = await auth(); if (!session...)` | 40+ routes | Extract naar `requireAdmin()` / `requireAuth()` utility |
| C2 | **Web search code 3x gedupliceerd** — DuckDuckGo scraping in zoeker, validator, zoeken-route | 3 bestanden | Extract naar `WebSearchService` |
| C3 | **htmlDecodeEntities() gedupliceerd** — identieke functie in 2 bestanden | 2x | Extract naar `lib/utils.ts` |
| C4 | **Silent catch blocks** — `catch { }` zonder logging | 10+ | Minimaal `console.error` of Sentry captureException |
| C5 | **Inconsistente error responses** — mix van `{ error: "string" }` en `{ error: { code, message } }` | 160 routes | Standaard `apiError()` utility |

### AI agent verbeteringen

| # | Probleem | Oplossing |
|---|----------|-----------|
| AI1 | **Self-fetch proxy patroon** in `ai-actie/route.ts` — HTTP request naar zichzelf | Service layer direct callen |
| AI2 | **Hardcoded model versies** — `claude-sonnet-4-20250514` direct in code | Gebruik `getModel()` uit `models.ts` |
| AI3 | **Crisis detector te simplistisch** — alleen keyword matching | Semantic analyse toevoegen, indirect signalen herkennen |
| AI4 | **Geen timeout op AI fetch calls** — proxy-route naar curator/content-agent | AbortController met timeout toevoegen |

---

## 4. Externe configuratie (vereist accounts)

| # | Item | Nodig | Effort |
|---|------|-------|--------|
| E1 | **SMTP provider configureren** | Account bij Resend, Postmark of SendGrid | 2h |
| E2 | **Sentry DSN configureren** | Gratis Sentry account → `NEXT_PUBLIC_SENTRY_DSN` env var | 1h |
| E3 | **Sentry alerts instellen** | Sentry dashboard → Alert Rules | 0.5h |
| E4 | **Upstash Redis configureren** | Gratis Upstash account → URL+Token → env vars | 1h |
| E5 | **Twilio WhatsApp templates** | Goedgekeurde message templates indienen bij Twilio | 4h |

---

## 5. Compliance track (juridisch)

| # | Item | Wie | Urgentie |
|---|------|-----|----------|
| J1 | **DPIA uitvoeren** | Juridisch/extern | Wettelijk verplicht (Art. 9 AVG) |
| J2 | **Verwerkersovereenkomsten** | Juridisch | AVG Art. 28 (Supabase, Vercel, Anthropic, Twilio) |
| J3 | **Privacy policy herschrijven** | Juridisch | Huidige dekt niet alle AI-verwerkingen |
| J4 | **Register van verwerkingsactiviteiten** | Juridisch | AVG Art. 30 |
| J5 | **Data retention policy formaliseren** | Juridisch + technisch | Bewaartermijnen vastleggen |
| J6 | **Anthropic DPA controleren** | Juridisch | Training opt-out voor gezondheidsdata |

---

## 6. Feature backlog

### Hoge prioriteit

| # | Item | Effort | Toelichting |
|---|------|--------|-------------|
| F1 | **Per-user AI token budget + cost dashboard** | 8h | Token tracking, waarschuwing bij 80%, hard limit |
| F2 | **Prompt versioning met rollback** | 6h | Prompts centraliseren met versienummers |
| F3 | **AI fallback bij Anthropic uitval** | 4h | Structuur aanwezig, UI integratie nog niet |
| F4 | **Gemeente alarm-emails** | 4h | Geblokkeerd door SMTP (E1) |
| F5 | **WhatsApp herinneringen** | 4h | Geblokkeerd door Twilio templates (E5) |
| F6 | **Bronvermelding UI in artikelen** | 3h | ArtikelBron model bestaat, UI ontbreekt |

### Medium prioriteit

| # | Item | Effort | Toelichting |
|---|------|--------|-------------|
| F7 | **E2E tests met Playwright** | 12h | 5 kritieke flows testen |
| F8 | **axe-core WCAG audit** | 4h | Browser testing met NVDA/VoiceOver |
| F9 | **Radix UI migratie** | 16h | Focus-trapping modals, dropdowns, tabs |
| F10 | **dangerouslySetInnerHTML reduceren** | 4h | 25/32 in AI chat |
| F11 | **Resterende API routes → service layer** | Doorlopend | 134 routes, top-5 zijn gedaan |
| F12 | **Supabase disaster recovery** | 4h | Point-in-time recovery, backups |

### Lage prioriteit

| # | Item | Effort |
|---|------|--------|
| F13 | Push notificaties (VAPID) | 6h |
| F14 | 2FA voor admin (TOTP) | 4h |
| F15 | ML-gebaseerde aanbevelingsengine | 16h |
| F16 | Email-templates beheer | 4h |
| F17 | Media-upload (S3/Cloudinary) | 6h |
| F18 | Dark mode | 4h |
| F19 | Multi-language support | 16h |
| F20 | Progressieve onboarding (week 1-4) | 8h |
| F21 | A/B testing framework | 6h |
| F22 | Contactstatus hulporganisaties | 4h |
| F23 | Secundaire AI-provider (OpenAI backup) | 8h |

---

## 7. Database-migraties (nog draaien op Supabase)

```sql
-- ArtikelInteractie
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

-- Activiteit
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

-- Ontbrekende indexen (bestaande tabellen)
CREATE INDEX IF NOT EXISTS "Task_caregiverId_idx" ON "Task"("caregiverId");
CREATE INDEX IF NOT EXISTS "Task_caregiverId_dueDate_idx" ON "Task"("caregiverId", "dueDate");
CREATE INDEX IF NOT EXISTS "BuddyMatch_buddyId_status_idx" ON "BuddyMatch"("buddyId", "status");
CREATE INDEX IF NOT EXISTS "BuddyMatch_caregiverId_status_idx" ON "BuddyMatch"("caregiverId", "status");
CREATE INDEX IF NOT EXISTS "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "Bericht_matchId_isGelezen_idx" ON "Bericht"("matchId", "isGelezen");
CREATE INDEX IF NOT EXISTS "ArtikelInteractie_caregiverId_gelezen_idx" ON "ArtikelInteractie"("caregiverId", "gelezen");
```

---

## 8. Wat is afgerond

### Masterplan 2.0 (5 iteraties — ~175h) ✅
### Projectplan 2026 (10 iteraties — ~350h) ✅
### Tag-herstructurering (incl. B6 rouw-sectie) ✅

---

*Laatste update: 26 maart 2026*
