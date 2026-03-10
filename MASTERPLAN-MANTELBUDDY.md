# MantelBuddy — Masterplan 2026

**Datum:** 4 maart 2026
**Versie:** 2.0
**Baseline:** v2.5.0 + MantelCoach + dashboard redesign + AI chatbot verbeteringen maart 2026
**Dit plan vervangt alle eerdere planbestanden.**

---

## Inhoudsopgave

1. [Huidige Staat van het Platform](#1-huidige-staat-van-het-platform)
2. [Iteratie 1: Beveiliging Dichtmaken](#2-iteratie-1-beveiliging-dichtmaken-week-1-2)
3. [Iteratie 2: Input Validatie & Stabiliteit](#3-iteratie-2-input-validatie--stabiliteit-week-3-4)
4. [Iteratie 3: Mantelzorger Klantreis Verbeteren](#4-iteratie-3-mantelzorger-klantreis-verbeteren-week-5-7)
5. [Iteratie 4: Gemeente Onboarding & Automatisering](#5-iteratie-4-gemeente-onboarding--automatisering-week-8-10)
6. [Iteratie 5: Content uit Code naar Database](#6-iteratie-5-content-uit-code-naar-database-week-11-13)
7. [Iteratie 6: Performance, Caching & Monitoring](#7-iteratie-6-performance-caching--monitoring-week-14-16)
8. [Iteratie 7: Toegankelijkheid & UX voor Ouderen](#8-iteratie-7-toegankelijkheid--ux-voor-ouderen-week-17-18)
9. [Iteratie 8: Schaalbaarheid & Toekomst](#9-iteratie-8-schaalbaarheid--toekomst-week-19)
10. [Overzichtstabel](#10-overzichtstabel)
11. [Blokkerende Items](#11-blokkerende-items)

---

## 1. Huidige Staat van het Platform

### Tech Stack

| Component | Versie |
|-----------|--------|
| Frontend | Next.js 16.1.4, React 19.2.3, TailwindCSS 4 |
| Backend | Next.js API Routes (124 endpoints), Prisma ORM |
| Database | PostgreSQL (Supabase) + pgvector (40 modellen) |
| Auth | NextAuth.js v5-beta (JWT, credentials, magic links) |
| AI | Anthropic Claude (8 agents + MantelCoach) + OpenAI embeddings |
| WhatsApp | Twilio |
| Hosting | Vercel |
| Tests | Vitest (10 testbestanden, ~29 tests) |

### Omvang applicatie

| Metriek | Aantal |
|---------|--------|
| Pagina's | 74 |
| API routes | 124 |
| Database modellen | 40 |
| React componenten | 59 |
| Config bestanden | 21 |
| Hardcoded content items | 170+ |

### Wat werkt

| Onderdeel | Status | Details |
|-----------|--------|---------|
| 8 AI agents | 100% | Ger (MantelCoach), Welkom, Balanscoach, Check-in, Analytics, Moderatie, Curator, Content Pipeline |
| MantelCoach (Ger) | 100% | Context-aware, proactief, actiepunten-opvolging, stille-nood herkenning, doorpraat-modus |
| Belastbaarheidstest | 95% | 11 vragen, 10 zorgtaken, scoring, subdomeinen |
| Dashboard | 95% | Ger-chat, BalansThermometer, "Jouw stappen", WhatsApp |
| Hulpvragen | 90% | Gemeente-filtering, 2 tabs, MantelBuddy actieknoppen |
| Leren/Informatie | 95% | 47 artikelen, 7 categorieën, 21 tags, voorkeuren |
| Content Pipeline | 90% | 6-staps AI workflow: Hiaten → Voorstellen → Concepten → Herschrijven → Verrijken → Publiceren |
| Check-in systeem | 80% | Slimme frequentie, contextuele suggesties, trend, doorpraat-modus bij slechte scores |
| Beheerportaal | 90% | Artikelen, hulpbronnen, gebruikers, alarmen, audit |
| Gemeenteportaal | 80% | Dashboard, trends, rapportages |
| Auth & rollen | 85% | Login, register, magic links, ADMIN/GEMEENTE rollen |
| WhatsApp integratie | 75% | Webhook, test via WhatsApp, check-in |
| Onboarding | 80% | 5-stappen flow, profiel, gemeente-zoek |
| MantelBuddy's | 75% | Kaart + matching, hulpvraag, reacties, chat |
| PWA | 60% | Manifest, service worker, installeerbaar |

---

## 2. Iteratie 1: Beveiliging Dichtmaken (Week 1-2)

> **Doel:** Alle beveiligingsgaten dichten. Niets anders tot dit klaar is.
> **Motto:** "Eerst het huis op slot."

### 1.1 isActief afdwingen bij login
**Prioriteit: KRITIEK — NOG OPEN**

De `authorize` callback in `auth.ts` checkt `isActive` NIET. Inactieve gebruikers kunnen inloggen.

**Actie:**
```typescript
// src/lib/auth.ts — in authorize callback
const user = await prisma.user.findUnique({ where: { email } })
if (!user || !user.isActive) {
  throw new Error("Account niet actief")
}
```

**Bestand:** `src/lib/auth.ts`
**Test:** Login poging met `isActive: false` → moet 401 geven

---

### 1.2 XSS in chat componenten fixen
**Prioriteit: KRITIEK**

Alle AI chat componenten gebruiken `dangerouslySetInnerHTML` ZONDER sanitization. Als de AI markdown met `**<script>alert('xss')</script>**` retourneert, wordt dit als HTML gerenderd.

**Getroffen bestanden:**
- `src/components/ai/AiChat.tsx` (regels 383, 389)
- `src/components/ai/AgentChat.tsx`
- `src/components/ai/FloatingGerChat.tsx`
- Alle componenten met `formatMessage()` functie

**Actie:** Voeg DOMPurify sanitization toe aan ALLE `dangerouslySetInnerHTML` calls, net als in `ContentModal.tsx` waar het WEL goed is:
```typescript
const clean = DOMPurify.sanitize(formatted, {
  ALLOWED_TAGS: ["strong", "em", "p", "br", "ul", "ol", "li", "a"],
  ALLOWED_ATTR: ["href", "target", "rel"],
})
```

---

### 1.3 Gevoelige data uit logs verwijderen
**Prioriteit: KRITIEK**

Auth module logt e-mailadressen bij fouten (regels 26, 42, 52 in `auth.ts`). Dit lekt PII en maakt e-mail enumeratie mogelijk.

**Actie:** Vervang `console.error("[AUTH] Gebruiker niet gevonden:", credentials.email)` door `console.error("[AUTH] Login mislukt voor gebruiker")` zonder e-mailadres.

**Bestand:** `src/lib/auth.ts`

---

### 1.3 Content Security Policy aanscherpen
**Prioriteit: HOOG**

Huidige CSP bevat `'unsafe-eval' 'unsafe-inline'` wat het hele doel van CSP ondermijnt.

**Actie:**
- Verwijder `'unsafe-eval'`
- Vervang `'unsafe-inline'` door nonce-based approach
- Voeg `Content-Security-Policy-Report-Only` header toe voor testen
- Voeg ontbrekende headers toe: `Cross-Origin-Opener-Policy`, `Cross-Origin-Embedder-Policy`

**Bestand:** `next.config.ts` (regels 34-45)

---

### 1.4 Telefoon-enumeratie endpoint beveiligen
**Prioriteit: HOOG**

`/api/auth/check-phone` onthult of een telefoonnummer bestaat in de database. Dit is een enumeratie-aanval vector.

**Actie:** Altijd dezelfde response teruggeven ongeacht of het nummer bestaat. Of dit endpoint verwijderen als het niet strikt nodig is.

**Bestand:** `src/app/api/auth/check-phone/route.ts`

---

### 1.5 Rate limiting versterken
**Prioriteit: HOOG**

Huidige rate limiting is:
- In-memory (overleeft geen restart op Vercel serverless)
- Alleen IP-gebaseerd (geen account-based)
- IP spoofbaar via X-Forwarded-For

**Actie:**
1. Voeg Vercel KV of Upstash Redis toe als backing store
2. Voeg account-based rate limiting toe voor ingelogde gebruikers
3. Valideer X-Forwarded-For alleen van vertrouwde proxies
4. Voeg rate limiting toe aan ALLE admin endpoints

**Bestanden:** `src/lib/rate-limit.ts`, alle `/api/beheer/*` routes

---

### 1.6 CORS headers configureren
**Prioriteit: HOOG**

Geen CORS policy geconfigureerd. Cross-origin requests van kwaadaardige sites naar API endpoints zijn mogelijk.

**Actie:** Expliciet CORS configureren in `next.config.ts`:
- Alleen eigen domein toestaan
- Credentials: true
- Specifieke methoden whitelist

**Bestand:** `next.config.ts`

---

### 1.7 WhatsApp alarm-detectie toevoegen
**Prioriteit: HOOG — NOG OPEN**

WhatsApp handler voert geen `checkAlarmindicatoren()` uit na test-voltooiing. Geen integratie met AlarmLog.

**Actie:** Na test-voltooiing in WhatsApp flow: alarm-indicatoren checken en AlarmLog aanmaken.

**Bestand:** `src/app/api/whatsapp/webhook/handlers/belastbaarheidstest.ts`

---

### 1.8 WhatsApp TAAK_NAAR_ONDERDEEL centraliseren
**Prioriteit: GEMIDDELD**

WhatsApp handler bevat nog hardcoded mapping (regels 318-327) die niet de centrale config (`options.ts`) gebruikt en t9/t10 mist.

**Bestand:** `src/app/api/whatsapp/webhook/handlers/belastbaarheidstest.ts`

---

### 1.9 Sessie-beveiliging versterken
**Prioriteit: GEMIDDELD**

- JWT max age is 30 dagen — te lang voor een zorgapplicatie
- Geen CSRF token validatie op state-changing endpoints
- Geen sessie-invalidatie bij wachtwoord reset

**Actie:**
1. JWT max age naar 7 dagen
2. Voeg CSRF token toe via NextAuth middleware
3. Invalideer alle sessies bij wachtwoord reset (verhoog `sessionVersion`)

**Bestand:** `src/lib/auth.ts`

---

### 1.10 Wachtwoord-eisen versterken
**Prioriteit: GEMIDDELD**

Huidige eis: minimaal 8 karakters. Geen complexiteitseis.

**Actie:** Voeg toe: minimaal 1 hoofdletter, 1 cijfer, 1 speciaal teken. Biedt wachtwoord-sterkte indicator in UI.

**Bestand:** `src/lib/validations.ts` (regels 24, 60)

---

### 1.11 Audit logging uitbreiden
**Prioriteit: GEMIDDELD**

Alleen `logAudit()` in cleanup route gevonden. Ontbreekt bij: wachtwoord resets, rolwijzigingen, login pogingen, API key wijzigingen.

**Actie:** Audit logging toevoegen aan alle gevoelige operaties:
- Login (succes + mislukt)
- Wachtwoord reset
- Rolwijzigingen
- Gebruiker deactiveren
- Hulpbron wijzigingen
- Alarm afhandeling

**Bestanden:** Alle relevante API routes + `src/lib/audit.ts`

---

### Deliverables Iteratie 1
- [ ] isActief check bij login actief
- [ ] XSS in chat componenten gefixed (DOMPurify)
- [ ] Geen PII in logs
- [ ] CSP aangescherpt (geen unsafe-eval/inline)
- [ ] Telefoon-enumeratie gefixed
- [ ] Rate limiting met Redis backing
- [ ] CORS headers geconfigureerd
- [ ] WhatsApp alarm-detectie actief
- [ ] WhatsApp mapping uit centrale config
- [ ] Sessie max age naar 7 dagen + CSRF
- [ ] Sterkere wachtwoord-eisen
- [ ] Audit logging op alle gevoelige operaties

**Geschatte doorlooptijd:** 2 weken (~32 uur)

---

## 3. Iteratie 2: Input Validatie & Stabiliteit (Week 3-4)

> **Doel:** Alle API routes valideren, type safety verhogen, tests uitbreiden.
> **Motto:** "Vertrouw niets wat binnenkomt."

### 2.1 Zod validatie op alle publieke API routes
**Prioriteit: HOOG**

45+ routes missen input validatie. Uitbreiden van `src/lib/validations.ts` en toepassen op:

| Route | Reden | Prioriteit |
|-------|-------|------------|
| `api/belastbaarheidstest` | Grote form, 12 vragen + taken | P0 |
| `api/intake` | Gebruikersinvoer zonder schema | P0 |
| `api/beheer/gebruikers/[id]` | Admin operaties | P0 |
| `api/gemeente/*/route.ts` | Filterparameters | P1 |
| `api/check-in` | Welzijnsscores | P1 |
| `api/hulpvragen` | Hulpvraag creatie | P1 |
| `api/buddys/*` | Match operaties | P1 |
| `api/calendar` | Event creatie | P2 |
| `api/user/*` | Profiel wijzigingen | P2 |

**Bestand:** `src/lib/validations.ts` uitbreiden + toepassen in routes

---

### 2.2 DOMPurify consistent toepassen
**Prioriteit: HOOG**

DOMPurify wordt alleen in `/api/beheer/hulpbronnen/zoeken` gebruikt. Alle user-generated content (hulpvragen, berichten, profiel-velden) mist sanitization.

**Actie:** Centrale `sanitize()` helper in `src/lib/sanitize.ts` en toepassen op alle tekstvelden bij opslaan.

---

### 2.3 Type safety verbeteren (16 → 0 `as any`)
**Prioriteit: GEMIDDELD**

Resterende locaties:
- belastbaarheidstest (4x)
- content/route seed (3x)
- gemeente/layout (4x)
- WellbeingChart (1x)
- gemeente-auth (1x)
- pdf-rapport (2x)
- AI prefetch-context (1x eslint-disable)

**Actie:** Elk bestand doorlopen en propere typering toevoegen.

---

### 2.4 Cascade deletes configureren
**Prioriteit: GEMIDDELD**

Prisma schema mist cascade deletes. Als een User verwijderd wordt, blijven orphaned records achter.

**Actie:** `onDelete: Cascade` toevoegen aan:
- Caregiver → User
- BelastbaarheidTest → Caregiver
- MonthlyCheckIn → Caregiver
- Task → Caregiver
- AlarmLog → BelastbaarheidTest
- Alle child-relaties

**Bestand:** `prisma/schema.prisma`

---

### 2.5 Testdekking verhogen (10 → 30+ bestanden)
**Prioriteit: GEMIDDELD**

Huidige tests (10 bestanden) dekken alleen lib utilities. Ontbreken:

| Categorie | Nieuwe tests |
|-----------|-------------|
| Auth | Login flow, register, magic link, isActief check |
| API routes | Belastbaarheidstest, check-in, hulpvragen, dashboard |
| AI | Prefetch-context, actiepunten tool, context block builder |
| Matching | Edge cases, afstandsberekening, scoring |
| Gemeente | Resolver, contact, onboarding |
| Security | Rate limit bypass, CSRF, auth middleware |

---

### 2.6 Error boundary component
**Prioriteit: LAAG**

`ErrorBoundary.tsx` bestaat maar mist fallback UI. Voeg vriendelijke foutmelding toe met "Probeer opnieuw" knop.

---

### Deliverables Iteratie 2
- [ ] Zod validatie op alle 45+ routes
- [ ] DOMPurify op alle user-generated content
- [ ] 0x `as any` in codebase
- [ ] Cascade deletes in Prisma schema
- [ ] 30+ testbestanden met 80+ tests
- [ ] Error boundary met fallback UI

**Geschatte doorlooptijd:** 2 weken (~32 uur)

---

## 4. Iteratie 3: Mantelzorger Klantreis Verbeteren (Week 5-7)

> **Doel:** De reis van "ik heb hulp nodig" naar "ik krijg hulp" zo kort en makkelijk mogelijk maken.
> **Motto:** "Van zorgen naar geholpen worden — in drie stappen."

### 3.1 Persoonlijk advies pagina na balanstest
**Prioriteit: HOOG**

Nieuwe pagina `/rapport/persoonlijk` direct na test-voltooiing:

1. **Scoreweergave met context** — Totaalscore + persoonlijke tekst
2. **Deelgebieden samenvatting** — Energie/Gevoel/Tijd met percentages
3. **Top 3 vervolgstappen** — Op basis van zwaarste deelgebied + taken
4. **Gemeente-specifiek advies** — Lokale hulpbronnen + contactgegevens
5. **Ger verschijnt** — Proactief met: "Dit valt me op..."

**Bestanden:**
- Nieuw: `src/app/(dashboard)/rapport/persoonlijk/page.tsx`
- Nieuw: `src/lib/rapport/persoonlijk-advies.ts`
- Wijzig: `src/app/(dashboard)/belastbaarheidstest/page.tsx` (redirect na test)

---

### 3.2 "Eerste stap" bij hulp aanbieden
**Prioriteit: HOOG**

Mantelzorgers zien een hulpkaart maar weten niet wat de eerste stap is. Database uitbreiden:

```prisma
model Zorgorganisatie {
  // bestaande velden...
  eersteStap        String?   // "Bel en vraag naar een intake-gesprek"
  verwachtingTekst  String?   // "Ze komen bij je thuis kijken"
  financiering      String?   // "Gratis via WMO-indicatie"
}
```

**Prompt-aanpassing:** Ger noemt altijd de eerste stap als die beschikbaar is.

**Beheerportaal:** 3 extra inputvelden bij hulpbron-beheer.

**Fallback:** Per categorie standaard-zinnen als het veld leeg is:
- Huishoudelijke hulp: "Bel en vraag naar een intake-gesprek"
- Dagbesteding: "Bel en vraag naar de mogelijkheden"
- Persoonlijke verzorging: "Neem contact op voor een indicatie-gesprek"
- Respijtzorg: "Bel en vraag hoe zij jou kunnen ontlasten"

---

### 3.3 SOS / Noodknop
**Prioriteit: HOOG**

Prominente "Ik heb NU hulp nodig" knop op dashboard en homepage:
- Mantelzorglijn: 030-164 0 164
- Huisarts (als ingevuld in profiel)
- 112 bij acuut gevaar
- Crisislijn

**Geen inlog vereist** voor de homepage-variant.

**Bestanden:**
- Nieuw: `src/components/SOSKnop.tsx`
- Wijzig: `src/app/(dashboard)/dashboard/page.tsx`
- Wijzig: `src/app/page.tsx` (homepage)

---

### 3.4 Gastgebruiker flow verbeteren
**Prioriteit: GEMIDDELD**

- Persoonlijk advies pagina ook voor gasten (localStorage data)
- Duidelijke CTA: "Maak een account aan om je resultaten te bewaren"
- Na account aanmaken: automatisch testresultaten koppelen

---

### 3.5 Actiepunten zichtbaar in UI
**Prioriteit: GEMIDDELD**

Het actiepunten-systeem (gebouwd in de AI tools) zichtbaar maken voor de gebruiker:
- Nieuwe sectie op dashboard: "Jouw actiepunten"
- Checkbox om af te vinken (status: TODO → DONE)
- Ger verwijst ernaar in elk gesprek

**Bestanden:**
- Nieuw: `src/components/dashboard/ActiepuntenKaart.tsx`
- Nieuw: `src/app/api/actiepunten/route.ts`

---

### 3.6 E-mail na balanstest
**Prioriteit: GEMIDDELD**

Automatisch na test-voltooiing:
- Score-samenvatting
- Top 3 tips
- Gemeente-contactgegevens
- Link naar rapport

**Vereist:** Werkende SMTP configuratie

**Bestanden:**
- Nieuw: `src/lib/email/balanstest-resultaat.ts`
- Wijzig: `src/app/api/belastbaarheidstest/route.ts`

---

### Deliverables Iteratie 3
- [ ] Persoonlijk advies pagina na balanstest
- [ ] "Eerste stap" veld per hulpbron + in AI prompt
- [ ] SOS noodknop op dashboard en homepage
- [ ] Gastgebruiker flow met localStorage
- [ ] Actiepunten zichtbaar op dashboard
- [ ] E-mail na balanstest (indien SMTP beschikbaar)

**Geschatte doorlooptijd:** 3 weken (~48 uur)

---

## 5. Iteratie 4: Gemeente Onboarding & Automatisering (Week 8-10)

> **Doel:** Gemeenten snel live krijgen + automatische opvolging na balanstest.
> **Motto:** "Gemeenten in 15 minuten live."

### 4.1 Gemeente onboarding wizard
**Prioriteit: HOOG**

Nieuwe pagina `/beheer/gemeenten/nieuw` met 5-stappen stepper:

1. **Gemeente kiezen** — PDOK autocomplete, CBS-code, check duplicaat
2. **Contactgegevens** — Email, telefoon, website, WMO loket URL
3. **Lokale hulpbronnen koppelen** — Automatisch zoeken in bestaande hulpbronnen
4. **Hulpverleners per belastingniveau** — Organisatie koppelen per niveau (LAAG/GEMIDDELD/HOOG)
5. **Eerste beheerder aanmaken** — Email, naam, rol, uitnodigingslink

**Bestanden:**
- Nieuw: `src/app/beheer/gemeenten/nieuw/page.tsx`
- Nieuw: `src/app/api/beheer/gemeenten/onboarding/route.ts`

---

### 4.2 Automatische check-in planning
**Prioriteit: HOOG**

Na test-voltooiing automatisch reminder plannen:
- HOOG: 1 week
- GEMIDDELD: 2 weken
- LAAG: 4 weken

Via Vercel Cron + WhatsApp (Twilio) + in-app notificatie.

**Bestanden:**
- Nieuw: `src/lib/check-in/plan-check-in.ts`
- Nieuw: `src/app/api/cron/check-in-reminders/route.ts`

---

### 4.3 Gemeente-alarmnotificatie
**Prioriteit: HOOG**

Bij CRITICAL/HIGH alarm: geanonimiseerde notificatie naar gemeente contactemail.
- Alleen: belastingniveau, gemeente, type alarm
- NIET: naam, geboortedatum, of andere PII
- Opt-in per gemeente

**Bestanden:**
- Nieuw: `src/lib/email/gemeente-alarm-notificatie.ts`
- Wijzig: `src/lib/ai/tools/registreer-alarm.ts`

---

### 4.4 Gemeente opvolgingsdashboard
**Prioriteit: GEMIDDELD**

Nieuw component op gemeente-dashboard:
- Nieuwe tests deze week (waarvan HOOG)
- Open alarmen
- Geplande check-ins + niet-uitgevoerde check-ins

**Bestanden:**
- Nieuw: `src/components/gemeente/OpvolgingKaart.tsx`
- Nieuw: `src/app/api/gemeente/opvolging/route.ts`

---

### 4.5 Smart check-in herinneringen via WhatsApp
**Prioriteit: GEMIDDELD**

Proactieve herinneringen:
- HOOG: wekelijks via WhatsApp
- GEMIDDELD: tweewekelijks
- LAAG: maandelijks

---

### Deliverables Iteratie 4
- [ ] Werkende gemeente onboarding wizard (5 stappen)
- [ ] Automatische check-in planning na test
- [ ] Gemeente-alarmnotificatie (geanonimiseerd)
- [ ] Gemeente opvolgingsdashboard
- [ ] WhatsApp check-in herinneringen

**Geschatte doorlooptijd:** 3 weken (~48 uur)

---

## 6. Iteratie 5: Content uit Code naar Database (Week 11-13)

> **Doel:** Alle 170+ hardcoded content items naar de database verplaatsen.
> **Motto:** "Geen tekst meer in de code."

### 5.1 Resterende content migreren

170+ items staan nog hardcoded in broncode. Migratie per categorie:

| Categorie | Bestanden | Items |
|-----------|-----------|-------|
| Balanstest vragen | `config/content/balanstest.ts` | ~16 |
| Zorgtaken definities | `config/options.ts` | ~10 |
| Formulier opties | `config/options.ts` | ~30 |
| Onboarding teksten | `components/Onboarding.tsx` | ~15 |
| Tutorial stappen | `components/Tutorial.tsx` | ~8 |
| Pagina-intro's | diverse pagina's | ~20 |
| Navigatie labels | `config/content/navigation.ts` | ~15 |
| Dashboard teksten | `config/content/dashboard.ts` | ~20 |
| Auth teksten | `config/content/auth.ts` | ~15 |
| WhatsApp menu's | `whatsapp-session.ts` | ~20 |

**Bestaande modellen die al klaar zijn:**
- `BalanstestVraag` ✅
- `Zorgtaak` ✅
- `ContentCategorie` ✅
- `FormulierOptie` ✅
- `AppContent` ✅

---

### 5.2 Frontend omzetten naar API calls

8+ bestanden moeten van hardcoded imports naar database queries:

| Bestand | Nu | Straks |
|---------|-----|--------|
| `belastbaarheidstest/page.tsx` | Import uit config | API call naar BalanstestVraag |
| `check-in/page.tsx` | Hardcoded vragen | API call |
| `hulpvragen/page.tsx` | Config import | Database query |
| `leren/page.tsx` | Mix | Volledig database |
| `Onboarding.tsx` | Hardcoded stappen | AppContent API |
| `Tutorial.tsx` | Hardcoded | AppContent API |
| `word-mantelbuddy/page.tsx` | Hardcoded | Database |
| `whatsapp-session.ts` | In-memory + hardcoded | Database sessies + content |

---

### 5.3 WhatsApp sessies naar database
**Prioriteit: HOOG**

In-memory `Map` vervangen door Prisma model met JSON data-veld en TTL van 30 minuten.

---

### 5.4 Beheer pagina's afbouwen

5 beheerpagina's die nog gebouwd moeten worden:

| Pagina | Functie | Model |
|--------|---------|-------|
| `/beheer/balanstest-vragen` | Vragen beheren | BalanstestVraag |
| `/beheer/zorgtaken` | Zorgtaken + mappings | Zorgtaak |
| `/beheer/categorieen` | Categorieën | ContentCategorie |
| `/beheer/formulier-opties` | Formulier opties | FormulierOptie |
| `/beheer/app-content` | App teksten | AppContent |

---

### 5.5 Seed scripts

- `scripts/seed-full-content.ts` — Eenmalig: alle hardcoded content → database
- Migratie-check script dat valideert dat alle content in DB aanwezig is

---

### Deliverables Iteratie 5
- [ ] Alle 170+ content items in database
- [ ] 8+ frontend bestanden lezen uit database
- [ ] WhatsApp sessies persistent
- [ ] 5 beheerpagina's voor content CRUD
- [ ] Seed script + migratie-check

**Geschatte doorlooptijd:** 3 weken (~48 uur)

---

## 7. Iteratie 6: Performance, Caching & Monitoring (Week 14-16)

> **Doel:** App snel maken en zicht krijgen op fouten en prestaties.
> **Motto:** "Wat je niet meet, kun je niet verbeteren."

### 6.1 Caching strategie implementeren
**Prioriteit: HOOG**

94/96 routes zijn nu `force-dynamic`. Implementeer gedifferentieerde caching:

| Type | Cache |
|------|-------|
| Statische content (artikelen, hulpbronnen) | `s-maxage=3600, stale-while-revalidate=86400` |
| Per-gebruiker data (dashboard, profiel) | `private, s-maxage=60, stale-while-revalidate=300` |
| Gemeente statistieken | `private, s-maxage=300, stale-while-revalidate=3600` |
| Mutaties & auth | `force-dynamic` (behouden) |
| AI responses | Niet cachen (altijd vers) |

---

### 6.2 N+1 queries oplossen
**Prioriteit: HOOG**

- Diepe Prisma queries opsplitsen in gerichte queries
- Database-aggregatie voor statistieken (COUNT, SUM in SQL i.p.v. JS)
- Paginatie op alle list-endpoints
- `prefetchUserContext` kan parallel i.p.v. sequentieel queries doen

---

### 6.3 Error tracking implementeren
**Prioriteit: HOOG**

Geen error tracking aanwezig. Fouten verdwijnen in Vercel logs.

**Actie:** Sentry integreren:
- Automatische error capture op server en client
- User context (zonder PII) bij errors
- Performance tracing op kritieke routes
- Alert regels voor nieuwe fouten

---

### 6.4 Structured logging doorvoeren
**Prioriteit: GEMIDDELD**

Pino is geïnstalleerd maar inconsistent gebruikt. Doorvoeren in alle API routes:
- Request logging (method, path, status, duration)
- Error logging met context (route, userId-hash, params)
- AI tool call logging (welke tool, hoe lang, result)
- Geen PII in logs (geen email, naam, telefoon)

---

### 6.5 Health monitoring uitbreiden
**Prioriteit: GEMIDDELD**

`/api/health` uitbreiden met:
- Database latency check
- AI provider bereikbaarheid
- WhatsApp webhook status
- Laatst succesvol geplande cron job
- Uptime monitoring (externe service: UptimeRobot of Checkly)

---

### 6.6 Database performance monitoring
**Prioriteit: LAAG**

- Slow query logging (> 500ms)
- Connection pool monitoring
- Index usage analyse

---

### Deliverables Iteratie 6
- [ ] Caching op alle relevante routes
- [ ] N+1 queries opgelost
- [ ] Sentry error tracking actief
- [ ] Structured logging in alle API routes
- [ ] Health monitoring met externe checks
- [ ] Database performance baseline

**Geschatte doorlooptijd:** 3 weken (~48 uur)

---

## 8. Iteratie 7: Toegankelijkheid & UX voor Ouderen (Week 17-18)

> **Doel:** De app optimaliseren voor de doelgroep: oudere, vaak vermoeide mantelzorgers.
> **Motto:** "Snel, helder, toegankelijk — ook met moeie ogen."

### 7.1 WCAG 2.1 AA compliance
**Prioriteit: HOOG**

- Screen reader support met aria-labels op alle interactieve elementen
- Keyboard navigatie op ALLE functies (tabben, enter, escape)
- Focus management bij modals en dynamische content
- Skip-to-content link
- Formulier labels consistent gekoppeld

---

### 7.2 Contrast en leesbaarheid
**Prioriteit: HOOG**

- WCAG AAA contrast audit (7:1 ratio) op alle teksten
- B1-taalaudit op ALLE gebruikersgerichte teksten
- Minimale fontgrootte: 16px op mobiel, 18px op desktop
- Regelafstand minimaal 1.5
- Maximale regelbreedte: 70 karakters

---

### 7.3 PWA verbeteren
**Prioriteit: GEMIDDELD**

- Echte app-iconen (nu placeholders)
- Offline fallback pagina
- Cache-first voor statische content
- Install prompt op mobiel verbeteren

---

### 7.4 Loading states en feedback
**Prioriteit: GEMIDDELD**

- Skeleton loaders op alle datapagina's
- Optimistic updates bij knoppen (favoriet, check-in, etc.)
- Duidelijke feedback bij acties: "Opgeslagen!", "Verstuurd!", "Fout — probeer opnieuw"
- Voortgangsbalken bij langere processen (test, onboarding)

---

### 7.5 Service layer introduceren
**Prioriteit: LAAG**

Prisma queries staan nu direct in API routes. Centraliseer in service modules:

```
src/lib/services/
  caregiver.service.ts      — profiel, test, check-in
  belastbaarheid.service.ts — test, score, rapport
  gemeente.service.ts       — config, hulpbronnen, contact
  hulpbron.service.ts       — zoeken, filteren, koppelen
  notificatie.service.ts    — email, whatsapp, in-app
```

---

### Deliverables Iteratie 7
- [ ] WCAG 2.1 AA audit passed
- [ ] Alle teksten WCAG AAA contrast
- [ ] B1-taalaudit op alle teksten
- [ ] PWA met echte iconen en offline fallback
- [ ] Skeleton loaders op alle datapagina's
- [ ] Service layer voor kernfuncties (optioneel)

**Geschatte doorlooptijd:** 2 weken (~32 uur)

---

## 9. Iteratie 8: Schaalbaarheid & Toekomst (Week 19+)

> **Doel:** Platform klaar maken voor groei en toekomstige features.
> **Motto:** "Klaar voor de toekomst."

### 8.1 Geavanceerde features (backlog)

| Feature | Complexiteit | Waarde |
|---------|-------------|--------|
| Progressieve onboarding (week 1-4 flow) | Hoog | Hoog |
| Weekplan met favorieten | Gemiddeld | Gemiddeld |
| Contactstatus bij hulporganisaties | Gemiddeld | Hoog |
| Zorgtaken pagina (`/zorgtaken`) | Laag | Gemiddeld |
| 2FA voor admin (TOTP + backup codes) | Gemiddeld | Hoog |
| Rich text editor uitbreiden (TipTap) | Laag | Laag |
| Media-upload (S3/Cloudinary) | Gemiddeld | Gemiddeld |
| Push notificaties (VAPID + service worker) | Gemiddeld | Hoog |
| Seizoensgebonden content-suggesties | Laag | Gemiddeld |
| Email-templates beheer | Gemiddeld | Gemiddeld |
| Slimme aanbevelingsengine | Hoog | Hoog |
| Real-time notificaties (WebSocket) | Hoog | Gemiddeld |
| Dark mode | Laag | Laag |

### 8.2 Monitoring & observability

- APM integratie (Vercel Analytics + Sentry Performance)
- Custom metrics: gemiddelde test-duur, AI response tijd, actieve gebruikers
- Dashboard voor operationele metrics
- Alert escalatie (Slack/email bij kritieke fouten)

### 8.3 2FA voor admin-accounts
**Status: GEBLOKKEERD — Mailserver nog niet operationeel**

> **MAG NIET VERGETEN WORDEN** — Essentieel beveiligingsonderdeel.

Vereist:
1. Werkende SMTP service (SendGrid, Resend, of AWS SES)
2. TOTP library (`otplib`) voor authenticator app
3. Recovery codes per e-mail
4. QR-code scan + backup codes flow

### 8.4 Verwerkersovereenkomsten (AVG/GDPR)
**Status: GEBLOKKEERD — Juridisch traject niet gestart**

> **MAG NIET VERGETEN WORDEN** — Wettelijke verplichting onder de AVG.

| Dienstverlener | Type gegevens | Status |
|----------------|---------------|--------|
| Supabase (database) | Alle persoonsgegevens, gezondheidsdata (Art. 9 AVG) | TODO |
| Vercel (hosting) | IP-adressen, sessiedata | TODO |
| Anthropic (AI) | Gespreksinhoud, zorgsituatie | TODO |
| OpenAI (embeddings) | Artikelinhoud (geen persoonsgegevens) | TODO — controleer |
| Twilio (WhatsApp) | Telefoonnummers, chatberichten | TODO |

**Acties:**
- [ ] Verwerkersovereenkomst per leverancier
- [ ] DPIA uitvoeren (gezondheidsdata = Art. 9 AVG)
- [ ] Privacy policy updaten
- [ ] Register van verwerkingsactiviteiten (Art. 30 AVG)

---

## 10. Overzichtstabel

```
Iteratie  Naam                                Week    Uren    Focus
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1         Beveiliging Dichtmaken              1-2     32u     11 security items
2         Input Validatie & Stabiliteit       3-4     32u     45+ routes + tests
3         Mantelzorger Klantreis              5-7     48u     Persoonlijk advies, SOS, actiepunten
4         Gemeente Onboarding & Auto.         8-10    48u     Wizard, reminders, alarmen
5         Content uit Code naar Database      11-13   48u     170+ items migreren
6         Performance, Caching & Monitoring   14-16   48u     Sentry, caching, N+1
7         Toegankelijkheid & UX              17-18   32u     WCAG AA, B1-taal, PWA
8         Schaalbaarheid & Toekomst          19+     —       Backlog + blokkerende items
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Totaal (Iteratie 1-7)                                288u
```

### Afhankelijkheden

```
Iteratie 1 (Security) ──→ Iteratie 2 (Validatie) ──→ Iteratie 3 (Klantreis)
                                                  └──→ Iteratie 4 (Gemeente)
                                                  └──→ Iteratie 5 (Content)
                                                            └──→ Iteratie 6 (Performance)
                                                                      └──→ Iteratie 7 (UX)
                                                                                └──→ Iteratie 8 (Toekomst)
```

**Iteratie 1 is ALTIJD EERST.** Geen nieuwe features tot de beveiliging op orde is.

---

## 11. Blokkerende Items

```
⚠️  BLOKKERENDE ITEMS (MAG NIET VERGETEN):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECURITY (Iteratie 1):
- XSS in chat componenten:    dangerouslySetInnerHTML ZONDER DOMPurify in AiChat, AgentChat, FloatingGerChat
- isActief login check:        Inactieve gebruikers kunnen inloggen
- PII in logs:                 E-mailadressen worden gelogd bij auth fouten
- CSP te permissief:           unsafe-eval en unsafe-inline in Content Security Policy
- Telefoon-enumeratie:         /api/auth/check-phone onthult of nummer bestaat
- Rate limiting in-memory:     Overleeft geen Vercel serverless restart

COMPLIANCE (Iteratie 8):
- 2FA voor admin:              Geblokkeerd door ontbrekende mailserver
- Verwerkersovereenkomsten:    Juridisch traject niet gestart (AVG verplichting)
- DPIA:                        Vereist voor Art. 9 gezondheidsdata

FUNCTIONALITEIT:
- WhatsApp alarm-detectie:     Ontbreekt volledig
- WhatsApp mapping hardcoded:  Niet uit centrale config
- E-mail service:              SMTP niet geconfigureerd
```

---

## Wat is veranderd t.o.v. v1.3

| Aspect | v1.3 | v2.0 |
|--------|------|------|
| Structuur | 8 fases (week-gebaseerd) | 8 iteraties (doel-gebaseerd) |
| Security | 7 items, 5 af | 11 items, uitgebreide analyse |
| AI chatbots | Basis prompts | Proactief + actiepunten + doorpraat-modus + stille nood |
| Nieuwe items | — | CSP aanscherpen, PII uit logs, CORS, telefoon-enumeratie, Sentry, "eerste stap" bij hulp |
| Tests | 29 → 50+ | 10 bestanden → 30+ bestanden |
| Geschrapt | Fases waren vaag | Elke iteratie heeft concrete deliverables |
| Blokkerende items | 4 items | 11 items met uitleg |

---

*Dit masterplan is opgesteld op 4 maart 2026 (v2.0). Vervangt v1.3 volledig. Gebaseerd op: volledige codebase-analyse (124 API routes, 40 DB modellen, 74 pagina's), security audit, architectuur-review, en AI chatbot verbeteringen.*
