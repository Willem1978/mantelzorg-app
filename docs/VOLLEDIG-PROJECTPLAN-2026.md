# MantelBuddy — Volledig Projectplan 2026

**Datum:** 16 maart 2026
**Versie:** 1.0
**Baseline:** v2.5.0
**Status:** Actief werkdocument
**Geschatte totale doorlooptijd:** ~203 uur (P1-P8)

---

## Inhoudsopgave

1. [Projectoverzicht](#projectoverzicht)
2. [Huidige status](#huidige-status)
3. [Afhankelijkheden & volgorde](#afhankelijkheden)
4. [Prioriteit 1: Tags, Profiel & Wizard](#p1)
5. [Prioriteit 2: Aanbevelingen op basis van Tags](#p2)
6. [Prioriteit 3: Content Kwaliteit & Generatie](#p3)
7. [Prioriteit 4: Zoeken & Vindbaarheid](#p4)
8. [Prioriteit 5: Gemeente Opvolging & Automatisering](#p5)
9. [Prioriteit 6: Content uit Code naar Database](#p6)
10. [Prioriteit 7: Performance, Caching & Monitoring](#p7)
11. [Prioriteit 8: Toegankelijkheid & UX voor Ouderen](#p8)
12. [Prioriteit 9: Schaalbaarheid & Toekomst (Backlog)](#p9)
13. [Blokkerende Items & Risico's](#blokkerend)
14. [Compliance & Juridisch](#compliance)
15. [Technische Schuld](#technische-schuld)
16. [Totaaloverzicht & Tijdlijn](#tijdlijn)

---

<a name="projectoverzicht"></a>
## 1. Projectoverzicht

**MantelBuddy** is een digitaal platform voor onbetaalde mantelzorgers in Nederland. Het platform bestaat uit drie omgevingen:

| Omgeving | Gebruikers | Status |
|----------|-----------|--------|
| Mantelzorger-omgeving | Mantelzorgers & MantelBuddies | 90% af |
| Beheerportaal | Systeembeheerders | 90% af |
| Gemeenteportaal | Gemeente-medewerkers | 80% af |

**Tech Stack:** Next.js 16, React 19, TypeScript, PostgreSQL (Supabase), Prisma ORM, Claude AI (Anthropic), Tailwind CSS 4, Vercel hosting, Twilio (WhatsApp)

**Database:** 50 modellen, pgvector voor semantic search, 134 API endpoints, 66 React componenten, 47 artikelen

---

<a name="huidige-status"></a>
## 2. Huidige Status — Wat is al af?

### Afgeronde iteraties

| Iteratie | Onderwerp | Status |
|----------|-----------|--------|
| **1** | Beveiliging Dichtmaken | 11/12 ✅ (Rate limiting nog in-memory) |
| **2** | Input Validatie & Stabiliteit | 6/6 ✅ |
| **3** | Klantreis Verbeteren | 8/8 ✅ |
| **4 fase 1** | Hulpbronnen | ✅ Gebouwd |

### Feature-completeness

| Onderdeel | % | Resterende werkzaamheden |
|-----------|---|--------------------------|
| 8 AI agents (Ger, Welkom, Balanscoach, etc.) | 100% | — |
| MantelCoach (Ger) | 100% | — |
| Belastbaarheidstest | 95% | Kleine UX polish |
| Dashboard | 95% | Kleine UX polish |
| Leren/Informatie (47 artikelen) | 95% | Tags koppelen (P1) |
| Content Pipeline | 90% | Curator-resultaten opslaan (P3) |
| Beheerportaal | 90% | Content uit DB (P6) |
| Hulpvragen | 90% | Semantic search (P4) |
| Auth & rollen | 85% | 2FA voor admin (P9) |
| Check-in systeem | 80% | Automatische planning (P5) |
| Gemeenteportaal | 80% | Opvolgingsdashboard (P5) |
| Onboarding | 80% | Herstructurering (P1) |
| MantelBuddy's (matching, chat) | 75% | Verdere afronding (P9) |
| WhatsApp integratie | 75% | Check-in herinneringen (P5) |
| PWA | 60% | App-iconen, offline (P8) |

### Bekende problemen in huidige code

| Probleem | Locatie | Impact |
|----------|---------|--------|
| Rate limiting in-memory | `src/lib/rate-limit.ts` | Overleeft geen serverless restart |
| ArtikelTag tabel is LEEG | Database | Geen gepersonaliseerde content |
| Tag-afleiding alleen client-side | `bepaalProfielTags()` | Inconsistent, niet betrouwbaar |
| WhatsApp sessies in-memory Map | `src/lib/twilio.ts` | Data-verlies bij restart |
| 94/96 routes zijn force-dynamic | Hele app | Onnodige serverbelasting |
| Profiel wizard rommelig | `src/components/profiel/` | Slechte UX |
| Onboarding 3/5 stappen zonder data | Onboarding flow | Gemiste kans data te verzamelen |
| Hardcoded content (170+ items) | `src/config/`, `src/data/` | Niet beheerbaar door admins |

---

<a name="afhankelijkheden"></a>
## 3. Afhankelijkheden & Volgorde

```
KRITIEK PAD:
P1 (Tags & Profiel) ──→ P2 (Aanbevelingen) ──→ P3 (Content Kwaliteit)
     ~22 uur              ~14 uur                  ~21 uur

PARALLEL MOGELIJK (onafhankelijk van P1):
├── P4 (Zoeken & Vindbaarheid)           ~6 uur
├── P5 (Gemeente Opvolging)              ~32 uur
├── P6 (Content uit Code → Database)     ~48 uur
├── P7 (Performance & Monitoring)        ~28 uur
└── P8 (Toegankelijkheid & UX)           ~32 uur

BACKLOG (na P1-P8):
└── P9 (Schaalbaarheid & Toekomst)       Onbepaald
```

**Aanbevolen aanpak:**
1. Start met P1 (fundament voor personalisatie)
2. Doe P4 parallel met P1 (klein, onafhankelijk)
3. Na P1: start P2 + P6 parallel
4. Na P2: start P3
5. P5, P7, P8 parallel inplannen wanneer capaciteit er is

---

<a name="p1"></a>
## 4. Prioriteit 1: Tags, Profiel & Wizard Herstructurering

**Geschatte tijd:** ~22 uur
**Afhankelijkheden:** Geen
**Blokkeert:** P2, P3

### Kernprobleem

Tags staan als platte lijst door elkaar. Geen logische groepering. Woonsituatie, werkstatus, relatietype en levensfase staan allemaal als losse chips. De wizard en het profielscherm zijn niet op elkaar afgestemd. ArtikelTag tabel is LEEG — 0 artikelen zijn getagd.

### Oplossing: Gestructureerd profiel met themagroepen

Het profiel wordt één overzichtelijk scrollbaar scherm met 7 secties. Elke sectie is een concrete vraag. Tags worden AFGELEID uit antwoorden, niet handmatig gekozen.

### Taken

| # | Taak | Beschrijving | Uur |
|---|------|-------------|-----|
| 1.1 | **Tag-groepen definiëren** | `groep` veld toevoegen aan ContentTag model. Groepen: relatie, wonen, werk, zorgduur, zorgintensiteit, levensfase, extra | 2 |
| 1.2 | **Profielscherm herstructureren** | Eén scrollbaar scherm met 7 secties: (1) Voor wie zorg je? (radio), (2) Woonsituatie (radio), (3) Werk & dagbesteding (radio), (4) Aandoening van naaste (multi-select chips), (5) Zorgsituatie (slider/dropdown + radio), (6) Wat past bij jou? (4 handmatige chips), (7) Waar wil je over lezen? (interesse-chips) | 6 |
| 1.3 | **Tag-afleiding server-side** | `bepaalProfielTags()` verplaatsen naar backend API. Bij opslaan profiel automatisch tags berekenen en opslaan in GebruikerVoorkeur/ContentTag | 3 |
| 1.4 | **Wizard en onboarding samenvoegen** | Eén flow: Welkom → Profiel invullen (scrollbaar) → Belastbaarheidstest. "Later invullen" optie behouden. Aparte wizard verwijderen | 4 |
| 1.5 | **Voorkeuren-API opschonen** | Duidelijk onderscheid automatische tags (uit profiel) vs handmatige tags. Categorieën apart opslaan | 2 |
| 1.6 | **Bestaande artikelen taggen** | AI bulk-tagging van alle 47 artikelen via ArtikelTag. Per artikel: AANDOENING + SITUATIE + ONDERWERP tags | 3 |
| 1.7 | **Profiel-completeness indicator** | Voortgangsbalk op profielpagina die toont hoeveel secties zijn ingevuld | 1 |
| 1.8 | **Dashboard herinnering** | "Vul je profiel aan" kaart op dashboard (max 3x tonen, daarna niet meer) | 1 |

### Database-wijzigingen

```prisma
// ContentTag uitbreiden met groep
model ContentTag {
  // bestaande velden...
  groep        String?    // "relatie" | "wonen" | "werk" | "zorgduur" | "levensfase" | "extra" | null
}
```

**Tag-groepen mapping:**

| Groep | Tags | Input-type | Exclusief? |
|-------|------|-----------|-----------|
| `relatie` | partner-zorg, ouder-zorg, kind-zorg, broer-zus-zorg, vriend-zorg | Radio | Ja |
| `wonen` | samenwonend, dichtbij, op-afstand | Radio | Ja |
| `werk` | werkend, werkend-parttime, student, gepensioneerd, niet-werkend | Radio | Ja |
| `zorgduur` | beginnend, langdurig | Automatisch (careSince) | Ja |
| `zorgintensiteit` | intensief | Automatisch (uren ≥20/week) | — |
| `levensfase` | jong | Automatisch (leeftijd <25) | — |
| `extra` | met-kinderen, meerdere-zorgvragers, alleenstaand, rouwverwerking | Multi-select chips | Nee |

### Acceptatiecriteria

- [ ] Profielscherm is één scrollbaar scherm met 7 duidelijke secties
- [ ] Woonsituatie: 3 radio buttons (niet als tag-chips)
- [ ] Werkstatus: 5 radio buttons (niet als tag-chips)
- [ ] Relatie: radio buttons (niet als tag-chips)
- [ ] Aandoening: multi-select chips (12 opties)
- [ ] Alleen 4 handmatige tags als chips in "Wat past bij jou?"
- [ ] Tags worden automatisch afgeleid bij opslaan (server-side)
- [ ] Wizard en onboarding gebruiken zelfde profielscherm
- [ ] Alle 47 artikelen zijn getagd via ArtikelTag
- [ ] Profiel-completeness indicator werkt
- [ ] "Later invullen" optie in onboarding
- [ ] Oude profiel wizard code verwijderd

### Bestanden die geraakt worden

- `prisma/schema.prisma` — ContentTag model uitbreiden
- `src/components/profiel/` — Volledig nieuw profielscherm
- `src/lib/profiel-tags.ts` — Nieuwe server-side tag-afleiding
- `src/app/api/user/profiel/` — API voor profiel opslaan + tags berekenen
- `src/app/(dashboard)/profiel/page.tsx` — Nieuwe profielpagina
- `src/app/(auth)/onboarding/` — Onboarding flow vereenvoudigen
- `src/app/api/beheer/artikelen/bulk-tag/` — Nieuw: bulk-tagging endpoint
- `src/components/dashboard/ProfielReminder.tsx` — Nieuw: dashboard herinnering

---

<a name="p2"></a>
## 5. Prioriteit 2: Aanbevelingen op basis van Tags

**Geschatte tijd:** ~14 uur
**Afhankelijkheden:** P1 moet af zijn
**Blokkeert:** P3

### Doel

Artikelen en hulpbronnen proactief aanbevelen op basis van het profiel. "Van zoek zelf naar aanbevolen voor jou."

### Taken

| # | Taak | Beschrijving | Uur |
|---|------|-------------|-----|
| 2.1 | **Relevantie-score berekening** | Tag-overlap score per artikel per gebruiker. AANDOENING match = 3pt, SITUATIE = 2pt, CATEGORIE = 1pt. Utility functie + API endpoint | 4 |
| 2.2 | **Dashboard "Aanbevolen voor jou"** | Top 3-5 artikelen op basis van relevantie-score. Match-reden tonen ("Past bij: dementie, werkend") | 3 |
| 2.3 | **Leren-pagina sorteren** | Artikelen binnen categorie sorteren op relevantie. Badge "Aanbevolen" bij hoog-scorende artikelen | 2 |
| 2.4 | **Weekkaarten verbeteren** | Weekkaarten selecteren op basis van relevantie i.p.v. random. Gebruiker-tags meenemen bij generatie | 2 |
| 2.5 | **"Meer hierover" suggesties** | Onderaan elk artikel: gerelateerde artikelen op basis van gedeelde tags. Max 3 suggesties | 2 |
| 2.6 | **Ger AI integratie** | Gebruiker-tags als context meegeven aan Ger bij elk gesprek. Ger kan gerichtere hulp bieden | 1 |

### Acceptatiecriteria

- [ ] Dashboard toont "Aanbevolen voor jou" sectie met 3-5 artikelen
- [ ] Werkende mantelzorger ziet andere artikelen dan gepensioneerde
- [ ] Match-reden is zichtbaar per aanbeveling
- [ ] Leren-pagina heeft relevantie-sortering
- [ ] Weekkaarten zijn gepersonaliseerd op profiel-tags
- [ ] Artikelen tonen gerelateerde suggesties onderaan
- [ ] Ger gebruikt profiel-tags in gesprekken

### Bestanden die geraakt worden

- `src/lib/relevantie-score.ts` — Nieuw: score-berekening
- `src/app/api/aanbevelingen/` — Nieuw: aanbevelingen API
- `src/components/dashboard/Aanbevelingen.tsx` — Nieuw: dashboard sectie
- `src/app/(dashboard)/leren/` — Sortering toevoegen
- `src/lib/weekkaarten/` — Tags meegeven
- `src/lib/ai/agents/` — Ger context uitbreiden
- `src/components/leren/GerelateerdeArtikelen.tsx` — Nieuw

---

<a name="p3"></a>
## 6. Prioriteit 3: Content Kwaliteit & Generatie

**Geschatte tijd:** ~21 uur
**Afhankelijkheden:** P1 (tags systeem)

### Doel

Content compleet, kwalitatief en gericht genereren voor specifieke doelgroepen.

### Taken

| # | Taak | Beschrijving | Uur |
|---|------|-------------|-----|
| 3.1 | **Tag-suggestie in artikel-editor** | AI-suggesties voor tags bij bewerken/aanmaken van artikelen in beheerportaal | 2 |
| 3.2 | **Doelgroep-specifiek genereren** | Beheerder kiest tag-combinatie (bijv. "dementie + werkend"), AI genereert artikel gericht op die doelgroep | 3 |
| 3.3 | **Content hiaten-analyse** | Dashboard in beheerportaal dat toont welke tag-combinaties geen artikelen hebben. Prioriteert op basis van gebruikersaantallen per tag | 4 |
| 3.4 | **Artikel completeness-score** | 0-100% score per artikel: titel (10%), tags (20%), inhoud min. 300 woorden (30%), B1 check (20%), bron (20%). Tonen in beheeroverzicht | 3 |
| 3.5 | **Curator-resultaten opslaan** | Review-feedback per artikel bewaren in database. Geschiedenis van reviews bijhouden | 2 |
| 3.6 | **Actie-knoppen bij feedback** | "Herschrijf" / "Markeer opgelost" per issue uit curator-review. Direct vanuit feedback naar actie | 2 |
| 3.7 | **Bronvermelding systeem** | Nieuw ArtikelBron model. Per artikel: meerdere bronnen met URL, naam, type. Bronsectie onderaan artikelweergave | 5 |

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
  score       Int      // 0-100
  feedback    String   @db.Text
  issues      Json?    // Array van issues
  reviewedAt  DateTime @default(now())
  resolvedAt  DateTime?
  artikel     Artikel  @relation(fields: [artikelId], references: [id], onDelete: Cascade)

  @@index([artikelId])
}
```

### Acceptatiecriteria

- [ ] Artikel-editor toont AI tag-suggesties
- [ ] Beheerder kan doelgroep-specifiek artikel genereren
- [ ] Content hiaten-dashboard toont ontbrekende tag-combinaties
- [ ] Artikel completeness-score zichtbaar in beheeroverzicht
- [ ] Curator-reviews worden opgeslagen en zijn terug te vinden
- [ ] Actie-knoppen werken vanuit curator-feedback
- [ ] Artikelen kunnen bronnen hebben (CRUD)
- [ ] Bronnen worden getoond onderaan artikelweergave

---

<a name="p4"></a>
## 7. Prioriteit 4: Zoeken & Vindbaarheid

**Geschatte tijd:** ~6 uur
**Afhankelijkheden:** Geen (kan parallel met P1)

### Doel

Mantelzorgers kunnen zoeken op betekenis, niet alleen op exacte woorden.

### Taken

| # | Taak | Beschrijving | Uur |
|---|------|-------------|-----|
| 4.1 | **User-facing zoekpagina** | `/zoeken` pagina met zoekbalk. Resultaten uit artikelen + hulpbronnen. Semantic search via pgvector embeddings | 3 |
| 4.2 | **Zoekbalk in navigatie** | Compacte zoekbalk/icoon in header navigatie. Op klik: expand of redirect naar zoekpagina | 1 |
| 4.3 | **Embeddings automatisering** | Cron-achtige API route (`/api/cron/embeddings`) voor dagelijks embeddings bijwerken van nieuwe/gewijzigde content | 1 |
| 4.4 | **Hulpbronnen semantic search** | Hulpvragen pagina: semantic search i.p.v. tekst-matching voor het vinden van relevante organisaties | 1 |

### Acceptatiecriteria

- [ ] Zoekpagina werkt met semantic search
- [ ] "ik ben zo moe" vindt artikelen over vermoeidheid en slaapproblemen
- [ ] Zoekbalk is toegankelijk vanuit elke pagina
- [ ] Embeddings worden automatisch bijgewerkt
- [ ] Hulpbronnen zoeken gebruikt semantic search

### Bestanden die geraakt worden

- `src/app/(dashboard)/zoeken/page.tsx` — Nieuw: zoekpagina
- `src/app/api/zoeken/route.ts` — Nieuw: zoek-API met pgvector
- `src/components/navigation/` — Zoekbalk toevoegen
- `src/app/api/cron/embeddings/route.ts` — Nieuw: cron endpoint
- `src/app/api/hulpvragen/` — Semantic search toevoegen

---

<a name="p5"></a>
## 8. Prioriteit 5: Gemeente Opvolging & Automatisering

**Geschatte tijd:** ~32 uur
**Afhankelijkheden:** Geen (kan parallel)
**Let op:** E-mail configuratie nodig voor notificaties

### Doel

Proactieve opvolging van mantelzorgers. Automatische check-in planning en gemeente-notificaties.

### Taken

| # | Taak | Beschrijving | Uur |
|---|------|-------------|-----|
| 5.1 | **Automatische check-in planning** | Na balanstest automatisch check-in plannen. HOOG=1 week, GEMIDDELD=2 weken, LAAG=4 weken. Nieuw GeplandCheckin model. API endpoint voor planning + statusbeheer | 8 |
| 5.2 | **Gemeente-alarmnotificatie** | Bij HIGH/CRITICAL alarm: geanonimiseerde e-mail naar gemeente-admin (opt-in). Geen PII, alleen type + niveau + gemeente. Vereist SMTP configuratie | 6 |
| 5.3 | **Gemeente opvolgingsdashboard** | Anoniem overzicht in gemeenteportaal: tests deze week, alarmen, geplande/gemiste check-ins, trends. Grafiek met periodes | 10 |
| 5.4 | **WhatsApp check-in herinneringen** | Geplande herinneringen via WhatsApp (als gekoppeld) of in-app notificatie. Template met 3 snelantwoorden: "Gaat goed" / "Kan beter" / "Wil praten" | 8 |

### Database-wijzigingen

```prisma
model GeplandCheckin {
  id            String    @id @default(cuid())
  caregiverId   String
  geplandOp     DateTime
  verstuurdOp   DateTime?
  kanaal        String    @default("IN_APP") // IN_APP, WHATSAPP
  aanleiding    String    // "balanstest", "check-in", "alarm"
  status        String    @default("GEPLAND") // GEPLAND, VERSTUURD, VOLTOOID, VERLOPEN
  testId        String?
  createdAt     DateTime  @default(now())
  caregiver     Caregiver @relation(fields: [caregiverId], references: [id], onDelete: Cascade)

  @@index([caregiverId, geplandOp])
  @@index([status, geplandOp])
}
```

### Acceptatiecriteria

- [ ] Na balanstest wordt automatisch een check-in gepland
- [ ] Check-in frequentie is gebaseerd op belastingsniveau
- [ ] Gemeente-admin ontvangt e-mail bij kritiek alarm (opt-in)
- [ ] Gemeente-e-mail bevat GEEN persoonsgegevens
- [ ] Opvolgingsdashboard toont anonieme statistieken
- [ ] WhatsApp herinneringen worden verstuurd op geplande datum
- [ ] Snelantwoorden in WhatsApp werken correct
- [ ] Verlopen check-ins worden gemarkeerd

---

<a name="p6"></a>
## 9. Prioriteit 6: Content uit Code naar Database

**Geschatte tijd:** ~48 uur
**Afhankelijkheden:** Geen (kan parallel)

### Doel

Alle 170+ hardcoded content items naar de database verplaatsen. Beheerders kunnen content aanpassen zonder code-wijzigingen.

### Taken

| # | Taak | Beschrijving | Uur |
|---|------|-------------|-----|
| 6.1 | **Content migreren** | 170+ items uit config-bestanden naar database migreren | 16 |
| | — Balanstest vragen (12 stuks) | `src/config/balanstest-vragen.ts` → database | |
| | — Zorgtaken (15 categorieën) | `src/config/zorgtaken.ts` → database | |
| | — Formulier-opties | Diverse config bestanden → database | |
| | — Onboarding teksten | Hardcoded → AppContent model | |
| | — Navigatie labels | Hardcoded → AppContent model | |
| | — Dashboard teksten | Hardcoded → AppContent model | |
| | — Auth teksten | Hardcoded → AppContent model | |
| | — WhatsApp menu's | Hardcoded → AppContent model | |
| 6.2 | **Frontend omzetten** | 8+ bestanden van hardcoded imports naar API calls / server-side database queries | 12 |
| 6.3 | **WhatsApp sessies naar database** | In-memory `Map` in `src/lib/twilio.ts` vervangen door Prisma model met TTL (automatische opruiming na X uur) | 4 |
| 6.4 | **Beheer pagina's bouwen** | Nieuwe CRUD pagina's in beheerportaal: | 12 |
| | — `/beheer/balanstest-vragen` | Vragen bewerken, herordenen, gewicht aanpassen | |
| | — `/beheer/zorgtaken` | Zorgtaken CRUD, categorieën beheren | |
| | — `/beheer/categorieen` | Content-categorieën beheren | |
| | — `/beheer/formulier-opties` | Dropdown-opties en keuzelisjten beheren | |
| | — `/beheer/app-content` | Alle app-teksten beheren | |
| 6.5 | **Seed script** | `seed-full-content.ts` voor eenmalige migratie van alle hardcoded content naar database. Inclusief validatie en rollback-mogelijkheid | 4 |

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

- [ ] Geen hardcoded content meer in `src/config/` of `src/data/`
- [ ] Beheerders kunnen balanstest-vragen bewerken via beheerportaal
- [ ] Beheerders kunnen zorgtaken beheren via beheerportaal
- [ ] Beheerders kunnen app-teksten aanpassen zonder code-wijzigingen
- [ ] WhatsApp sessies overleven server-restarts
- [ ] Seed script migreert alle content correct
- [ ] Frontend laadt content via API/database
- [ ] Fallback naar defaults als database leeg is

---

<a name="p7"></a>
## 10. Prioriteit 7: Performance, Caching & Monitoring

**Geschatte tijd:** ~28 uur
**Afhankelijkheden:** Geen (kan parallel)

### Doel

App sneller maken en zicht krijgen op fouten.

### Taken

| # | Taak | Beschrijving | Uur |
|---|------|-------------|-----|
| 7.1 | **Caching strategie** | 94/96 routes zijn nu `force-dynamic`. Gedifferentieerde caching implementeren: | 8 |
| | — Statische content (artikelen, zorgtaken) | Cache: 1 uur, revalidate on-demand | |
| | — Per-gebruiker data (dashboard, profiel) | Cache: 60 seconden | |
| | — Gemeente statistieken | Cache: 5 minuten | |
| | — Mutaties (POST/PUT/DELETE) | Blijven dynamic | |
| 7.2 | **N+1 queries oplossen** | Diepe Prisma queries opsplitsen, database-aggregatie gebruiken, paginatie toevoegen, parallelle queries in `prefetchUserContext`. Profilen met Prisma query logging | 8 |
| 7.3 | **Sentry error tracking** | Sentry integreren: automatische error capture, user context (zonder PII), performance tracing, alerts bij spikes | 4 |
| 7.4 | **Structured logging** | Pino consistent doorvoeren in alle API routes. Request logging middleware, error context, AI tool logging. Geen PII in logs | 4 |
| 7.5 | **Health monitoring** | `/api/health` uitbreiden: DB latency meten, AI (Anthropic) bereikbaarheid checken, WhatsApp (Twilio) status, cron status, uptime. Dashboard of Vercel cron voor monitoring | 4 |

### Acceptatiecriteria

- [ ] Statische content wordt gecached (niet elke request naar DB)
- [ ] Dashboard laadtijd <2 seconden
- [ ] Geen N+1 queries meer in kritieke paden
- [ ] Sentry vangt errors automatisch op
- [ ] Alle API routes loggen gestructureerd via Pino
- [ ] Health endpoint toont status van alle services
- [ ] Geen PII in logs of error tracking

---

<a name="p8"></a>
## 11. Prioriteit 8: Toegankelijkheid & UX voor Ouderen

**Geschatte tijd:** ~32 uur
**Afhankelijkheden:** Geen (kan parallel)

### Doel

App optimaliseren voor de doelgroep: oudere, vaak vermoeide mantelzorgers.

### Taken

| # | Taak | Beschrijving | Uur |
|---|------|-------------|-----|
| 8.1 | **WCAG 2.1 AA compliance** | Screen reader support (aria-labels, aria-live), keyboard navigatie (tab order, focus visible), focus management bij modals/navigatie, skip-to-content link, alle formulier-elementen hebben labels | 8 |
| 8.2 | **Contrast en leesbaarheid** | WCAG AAA contrast (7:1 ratio), B1-taalaudit op alle teksten, minimale fontgrootte 16px op mobiel, regelafstand 1.5, max 70 karakters per regel | 6 |
| 8.3 | **PWA verbeteren** | Echte app-iconen (alle formaten), offline fallback pagina, cache-first voor statische content, install prompt op geschikt moment tonen | 4 |
| 8.4 | **Loading states** | Skeleton loaders voor alle data-secties, optimistic updates bij favorieten/actiepunten, feedback bij alle gebruikersacties (toasts), voortgangsbalken bij langere processen | 6 |
| 8.5 | **Service layer** | Prisma queries centraliseren in service modules: `caregiver.service.ts`, `belastbaarheid.service.ts`, `gemeente.service.ts`, `hulpbron.service.ts`, `notificatie.service.ts`. Eén plek voor business logic | 8 |

### Acceptatiecriteria

- [ ] WCAG 2.1 AA audit slaagt (minimaal)
- [ ] Alle interactieve elementen bereikbaar via keyboard
- [ ] Screen reader kan hele app navigeren
- [ ] Minimale fontgrootte 16px op mobiel
- [ ] Contrast ratio ≥7:1 voor tekst
- [ ] PWA installeerbaar op iOS en Android
- [ ] Offline fallback pagina werkt
- [ ] Alle data-secties hebben skeleton loaders
- [ ] Service layer bevat alle Prisma queries
- [ ] API routes gebruiken service layer (geen directe Prisma calls)

---

<a name="p9"></a>
## 12. Prioriteit 9: Schaalbaarheid & Toekomst (Backlog)

### Geprioriteerde backlog

| # | Feature | Complexiteit | Waarde | Afhankelijk van |
|---|---------|-------------|--------|----------------|
| 9.1 | Progressieve onboarding (week 1-4 flow) | Hoog | Hoog | P1 |
| 9.2 | Push notificaties (VAPID + service worker) | Gemiddeld | Hoog | P8 (PWA) |
| 9.3 | 2FA voor admin (TOTP + backup codes) | Gemiddeld | Hoog | SMTP config |
| 9.4 | Contactstatus bij hulporganisaties | Gemiddeld | Hoog | — |
| 9.5 | Slimme aanbevelingsengine (ML-based) | Hoog | Hoog | P2 |
| 9.6 | Weekplan met favorieten | Gemiddeld | Gemiddeld | P2 |
| 9.7 | Email-templates beheer | Gemiddeld | Gemiddeld | SMTP config |
| 9.8 | Media-upload (S3/Cloudinary) | Gemiddeld | Gemiddeld | — |
| 9.9 | Seizoensgebonden content-suggesties | Laag | Gemiddeld | P2, P3 |
| 9.10 | Zorgtaken pagina (`/zorgtaken`) | Laag | Gemiddeld | P6 |
| 9.11 | Real-time notificaties (WebSocket) | Hoog | Gemiddeld | — |
| 9.12 | Rich text editor uitbreiden (TipTap) | Laag | Laag | — |
| 9.13 | Dark mode volledig | Laag | Laag | — |
| 9.14 | Multi-language support | Hoog | Laag | P6 |

---

<a name="blokkerend"></a>
## 13. Blokkerende Items & Risico's

### Blokkerend

| Item | Status | Impact | Oplossing |
|------|--------|--------|-----------|
| **Rate limiting in-memory** | ⚠️ Werkt, niet persistent | Overleeft geen Vercel serverless restart. Beveiligingsrisico | Vercel KV of Upstash Redis als backing store |
| **SMTP configuratie** | ⚠️ Niet opgezet | Blokkeert: e-mail na balanstest, gemeente-alarmnotificatie (P5), 2FA (P9) | SMTP provider kiezen en configureren (bijv. Resend, SendGrid, of Postmark) |
| **WhatsApp sessies in-memory** | ⚠️ Data-verlies mogelijk | Sessies verdwijnen bij server restart → gebruiker moet opnieuw beginnen | P6 taak 6.3: migratie naar database |

### Risico's

| Risico | Kans | Impact | Mitigatie |
|--------|------|--------|-----------|
| Supabase database limiet bereikt | Laag | Hoog | Monitoring + upgrade plan |
| Anthropic API kosten stijgen | Gemiddeld | Gemiddeld | Caching van AI responses, rate limiting |
| Vercel serverless cold starts | Gemiddeld | Laag | Edge functions overwegen, caching |
| Eén developer → bus factor 1 | Hoog | Hoog | Documentatie, clean code, dit plan |

---

<a name="compliance"></a>
## 14. Compliance & Juridisch

### AVG / GDPR Verplichtingen

| Item | Status | Urgentie | Toelichting |
|------|--------|----------|------------|
| **Verwerkersovereenkomsten** | ❌ Niet gestart | **KRITIEK** | Juridisch verplicht voor: Supabase, Vercel, Anthropic, OpenAI (embeddings), Twilio. Allemaal verwerkers van persoonsgegevens |
| **DPIA (Data Protection Impact Assessment)** | ❌ Niet gestart | **KRITIEK** | Wettelijk vereist: verwerking van Art. 9 gezondheidsdata (AVG). Belastbaarheidstest = gezondheidsdata |
| **Privacy policy updaten** | ❌ Verouderd | **HOOG** | Huidige policy dekt niet alle AI-verwerkingen en derde partijen |
| **Register van verwerkingsactiviteiten (Art. 30)** | ❌ Niet gestart | **HOOG** | Wettelijk verplicht. Documenteer alle verwerkingen, doelen, bewaartermijnen |
| **Cookiebeleid** | ⚠️ Basis | Gemiddeld | Controleren op compliance met ePrivacy |
| **Recht op vergetelheid** | ✅ Geïmplementeerd | — | Account verwijderen werkt (cascade deletes) |
| **Recht op dataportabiliteit** | ✅ Geïmplementeerd | — | Data-export endpoint werkt |
| **Toestemming (consent)** | ⚠️ Basis | Gemiddeld | Consent tracking bestaat, maar moet uitgebreider |

### Aanbevolen acties

1. **Direct starten:** Verwerkersovereenkomsten met alle derde partijen
2. **Binnen 1 maand:** DPIA uitvoeren (intern of met privacy consultant)
3. **Binnen 1 maand:** Privacy policy herschrijven
4. **Binnen 2 maanden:** Verwerkingsregister opstellen

---

<a name="technische-schuld"></a>
## 15. Technische Schuld

### Hoge prioriteit

| Item | Locatie | Impact | Gerelateerd aan |
|------|---------|--------|----------------|
| 94/96 routes `force-dynamic` | Hele app | Performance | P7 |
| ArtikelTag tabel leeg | Database | Geen personalisatie | P1 |
| Tag-afleiding alleen client-side | Frontend | Inconsistente data | P1 |
| Hardcoded content (170+ items) | `src/config/`, `src/data/` | Niet beheerbaar | P6 |
| In-memory rate limiting | `src/lib/rate-limit.ts` | Beveiligingsrisico | Blokkerend item |
| In-memory WhatsApp sessies | `src/lib/twilio.ts` | Data-verlies | P6 |

### Gemiddelde prioriteit

| Item | Locatie | Impact |
|------|---------|--------|
| Geen service layer | API routes bevatten business logic | Duplicatie, moeilijk testbaar |
| Geen structured logging | Diverse API routes | Moeilijk debuggen in productie |
| Geen error tracking | Hele app | Onzichtbare fouten |
| Geen caching | Hele app | Onnodige load |
| Geen paginatie op lijsten | API endpoints | Performance bij groei |

### Lage prioriteit

| Item | Locatie | Impact |
|------|---------|--------|
| Sommige TODO's in code | Diverse bestanden | Onafgewerkte features |
| Test coverage onbekend | Tests | Mogelijke regressies |
| Bundle size niet geoptimaliseerd | Frontend | Laadtijd |

---

<a name="tijdlijn"></a>
## 16. Totaaloverzicht & Voorgestelde Tijdlijn

### Urenschatting

| Prio | Onderwerp | Uren | Status | Afhankelijk van |
|------|-----------|------|--------|----------------|
| **P1** | Tags, Profiel & Wizard | ~22 | **TE STARTEN** | — |
| **P2** | Aanbevelingen | ~14 | Wacht op P1 | P1 |
| **P3** | Content Kwaliteit | ~21 | Wacht op P1 | P1 |
| **P4** | Zoeken & Vindbaarheid | ~6 | Kan parallel | — |
| **P5** | Gemeente Opvolging | ~32 | Kan parallel | SMTP nodig |
| **P6** | Content → Database | ~48 | Kan parallel | — |
| **P7** | Performance & Monitoring | ~28 | Kan parallel | — |
| **P8** | Toegankelijkheid & UX | ~32 | Kan parallel | — |
| **P9** | Backlog | — | Later | Alles |
| | **Totaal P1-P8** | **~203** | | |

### Voorgestelde fasering

#### Fase 1: Fundament (P1 + P4) — ~28 uur
- P1: Tags, Profiel & Wizard herstructureren
- P4: Zoeken & Vindbaarheid (parallel)
- **Resultaat:** Gestructureerde tags, opgeschoond profiel, zoekfunctie

#### Fase 2: Personalisatie (P2 + start P6) — ~26 uur
- P2: Aanbevelingen op basis van tags
- P6 start: Content migratie beginnen (seed script + eerste beheer pagina's)
- **Resultaat:** Gepersonaliseerde ervaring, begin van content in database

#### Fase 3: Kwaliteit & Gemeente (P3 + P5) — ~53 uur
- P3: Content kwaliteit verbeteren
- P5: Gemeente opvolging (parallel)
- **Resultaat:** Betere content, proactieve opvolging

#### Fase 4: Afronding (rest P6 + P7 + P8) — ~96 uur
- P6 afronden: Alle content naar database
- P7: Performance & monitoring
- P8: Toegankelijkheid & UX
- **Resultaat:** Productie-klare, performante, toegankelijke app

#### Fase 5: Doorontwikkeling (P9)
- Backlog items op basis van prioriteit en feedback
- **Resultaat:** Continue verbetering

### Compliance (parallel aan alle fases)

| Wanneer | Wat |
|---------|-----|
| **Direct** | SMTP configureren, verwerkersovereenkomsten starten |
| **Fase 1-2** | DPIA uitvoeren |
| **Fase 2-3** | Privacy policy herschrijven, verwerkingsregister |
| **Fase 3-4** | Rate limiting naar Redis |

---

## Legenda

| Symbool | Betekenis |
|---------|-----------|
| ✅ | Afgerond |
| ⚠️ | Aandachtspunt / deels af |
| ❌ | Niet gestart / blokkerend |
| 🔲 | Te doen |

---

*Dit plan is opgesteld op 16 maart 2026 en is het leidende document voor alle ontwikkelwerkzaamheden aan MantelBuddy. Het vervangt en consolideert alle eerdere planbestanden.*

*Gerelateerde documenten:*
- `docs/PLAN-HOOFDPLAN-2026.md` — Technisch hoofdplan (details per prioriteit)
- `docs/systeem-overzicht.md` — Functioneel systeemoverzicht
- `CHANGELOG.md` — Versiegeschiedenis
