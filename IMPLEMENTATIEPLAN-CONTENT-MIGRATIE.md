# Implementatieplan: Alle Content naar Database + Beheeromgeving

## Doel
Alle hardcoded content uit de broncode verplaatsen naar de database, zodat alles via de beheeromgeving (admin interface) beheerd kan worden. Geen content meer in de code.

---

## Huidige situatie

### Al in database + beheerbaar via beheeromgeving:
| Content | Model | Beheer pagina |
|---------|-------|---------------|
| Artikelen & Tips (47 items) | `Artikel` | `/beheer/artikelen` |
| Zorgorganisaties (100+ items) | `Zorgorganisatie` | `/beheer/hulpbronnen` |
| Intake vragen (15 items) | `IntakeQuestion` + `IntakeCategory` | Alleen seed, **geen beheer** |
| MantelBuddies | `MantelBuddy` | `/beheer/mantelbuddies` |

### NOG NIET in database - hardcoded in broncode:
| # | Content type | Locatie | Items | Impact |
|---|-------------|---------|-------|--------|
| 1 | Balanstest vragen + weegfactoren | `belastbaarheidstest/page.tsx`, `whatsapp-session.ts` | 11-12 | HOOG |
| 2 | Zorgtaak definities | `belastbaarheidstest/page.tsx`, `whatsapp-session.ts` | 9-10 | HOOG |
| 3 | Check-in vragen + opties | `check-in/page.tsx` | 5 | HOOG |
| 4 | Hulpvraag categorieën | `hulpvragen/page.tsx` | 15+ | HOOG |
| 5 | Taak-naar-categorie mappings | `hulpvragen/page.tsx` | 25+ | GEMIDDELD |
| 6 | Leren categorieën + sub-hoofdstukken | `leren/page.tsx`, `[categorie]/page.tsx` | 20+ | GEMIDDELD |
| 7 | Onboarding opties & teksten | `Onboarding.tsx` | 14 | GEMIDDELD |
| 8 | Tutorial stappen & teksten | `Tutorial.tsx` | 8 | GEMIDDELD |
| 9 | Formulier opties (relatie, uren, etc.) | Diverse bestanden | 17 | GEMIDDELD |
| 10 | WhatsApp hulpcategorieën | `whatsapp-session.ts` | 16 | GEMIDDELD |
| 11 | MantelBuddy aanmeldopties | `word-mantelbuddy/page.tsx` | 9 | LAAG |
| 12 | Pagina intro's en beschrijvingen | Diverse pages | 10+ | LAAG |
| 13 | `src/data/artikelen.ts` referentiebestand | `artikelen.ts` | 30+ | Verwijderen (duplicaat) |

**Totaal: ~170+ content-items die nu hardcoded zijn.**

---

## Nieuwe Database Modellen

### Model 1: `BalanstestVraag`
Voor: Balanstest vragen, Check-in vragen

```prisma
model BalanstestVraag {
  id           String   @id @default(cuid())
  type         VraagType // BALANSTEST, CHECKIN
  vraagId      String   @unique // unieke key, bijv. "vraag-1", "checkin-welzijn"
  vraagTekst   String   // De vraagtekst
  beschrijving String?  // Extra uitleg
  opties       Json?    // Array van antwoordopties [{label, waarde, score}]
  gewicht      Float    @default(1.0) // Weegfactor voor scoring
  emoji        String?
  volgorde     Int      @default(0)
  isActief     Boolean  @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@index([type, isActief])
}

enum VraagType {
  BALANSTEST
  CHECKIN
}
```

### Model 2: `Zorgtaak`
Voor: Zorgtaak definities (balanstest + hulpvragen)

```prisma
model Zorgtaak {
  id           String   @id @default(cuid())
  taakId       String   @unique // unieke key, bijv. "verzorging"
  naam         String   // "Persoonlijke verzorging"
  beschrijving String?  // Korte uitleg
  categorie    String?  // Groep: "Dagelijks leven", "Organisatie", etc.
  emoji        String?
  icon         String?  // Lucide icon naam
  routeLabel   String?  // "Wmo", "Zvw", etc.
  volgorde     Int      @default(0)
  isActief     Boolean  @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  mappings     TaakCategorieMapping[]

  @@index([isActief])
}
```

### Model 3: `TaakCategorieMapping`
Voor: Taak-naar-categorie mappings (25+ koppelingen)

```prisma
model TaakCategorieMapping {
  id           String   @id @default(cuid())
  bronNaam     String   // Naam zoals deze binnenkomt (bijv. "Wassen/aankleden")
  zorgtaakId   String   // FK naar Zorgtaak
  zorgtaak     Zorgtaak @relation(fields: [zorgtaakId], references: [id])
  bron         String?  // "WEB", "WHATSAPP" - waar komt deze mapping vandaan
  isActief     Boolean  @default(true)
  createdAt    DateTime @default(now())

  @@unique([bronNaam])
  @@index([zorgtaakId])
}
```

### Model 4: `ContentCategorie`
Voor: Leren categorieën, hulpvraag categorieën, sub-hoofdstukken

```prisma
model ContentCategorie {
  id           String   @id @default(cuid())
  type         CategorieType // LEREN, HULPVRAAG, SUB_HOOFDSTUK, WHATSAPP_HULP
  slug         String   // URL-vriendelijke key
  naam         String
  beschrijving String?
  emoji        String?
  icon         String?  // Lucide icon naam
  hint         String?  // Extra hint tekst
  parentId     String?  // Self-reference voor sub-categorieën
  parent       ContentCategorie?  @relation("CategorieHierarchie", fields: [parentId], references: [id])
  children     ContentCategorie[] @relation("CategorieHierarchie")
  metadata     Json?    // Extra data per type (bronLabelKleur, etc.)
  volgorde     Int      @default(0)
  isActief     Boolean  @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@unique([type, slug])
  @@index([type, isActief])
  @@index([parentId])
}

enum CategorieType {
  LEREN          // Leren hoofdcategorieën (Praktische tips, Zelfzorg, etc.)
  SUB_HOOFDSTUK  // Sub-hoofdstukken binnen leren categorieën
  HULPVRAAG      // Hulpvraag categorieën (Even vrij, Praten, etc.)
  HULP_ZORGVRAGER // Hulp categorieën voor zorgvrager (Verzorging, Maaltijden, etc.)
  HULP_MANTELZORGER // Hulp categorieën voor mantelzorger
  WHATSAPP_HULP  // WhatsApp specifieke hulpcategorieën
}
```

### Model 5: `FormulierOptie`
Voor: Alle dropdown/selectie opties (relatie, uren, moeilijkheid, buddy hulpvormen)

```prisma
model FormulierOptie {
  id           String   @id @default(cuid())
  groep        OptieGroep // RELATIE, UREN_PER_WEEK, ZORGDUUR, MOEILIJKHEID, BUDDY_HULPVORM, etc.
  waarde       String   // De technische waarde
  label        String   // De weergavenaam
  beschrijving String?  // Extra uitleg
  emoji        String?
  volgorde     Int      @default(0)
  isActief     Boolean  @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@unique([groep, waarde])
  @@index([groep, isActief])
}

enum OptieGroep {
  RELATIE           // partner, ouder, kind, etc.
  UREN_PER_WEEK     // 0-5, 5-10, etc.
  ZORGDUUR          // <1 jaar, 1-3 jaar, etc.
  MOEILIJKHEID      // Makkelijk, Gemiddeld, etc.
  BUDDY_HULPVORM    // gesprek, boodschappen, vervoer, etc.
  BUDDY_BESCHIKBAARHEID // eenmalig, vast, beide
}
```

### Model 6: `AppContent`
Voor: Onboarding stappen, tutorial stappen, pagina intro's, marketing teksten

```prisma
model AppContent {
  id           String      @id @default(cuid())
  type         AppContentType // ONBOARDING, TUTORIAL, PAGINA_INTRO, FEATURE_CARD
  sleutel      String      // Unieke key, bijv. "onboarding-welkom", "tutorial-stap-1"
  titel        String?
  inhoud       String?     // Hoofdtekst (markdown of plain text)
  subtekst     String?     // Secundaire tekst
  emoji        String?
  icon         String?
  afbeelding   String?     // URL naar afbeelding
  metadata     Json?       // Extra data (feature cards, knopteksten, etc.)
  volgorde     Int         @default(0)
  isActief     Boolean     @default(true)
  createdAt    DateTime    @default(now())
  updatedAt    DateTime    @updatedAt

  @@unique([type, sleutel])
  @@index([type, isActief])
}

enum AppContentType {
  ONBOARDING     // Onboarding flow stappen
  TUTORIAL       // Tutorial stappen
  PAGINA_INTRO   // Pagina titels en beschrijvingen
  FEATURE_CARD   // Feature uitleg kaarten
  MARKETING      // Landing page content
}
```

---

## Implementatie Fases

### Fase 1: Database Schema & Migratie
**Geschatte omvang: ~100 regels Prisma schema + migration**

1. Voeg 6 nieuwe modellen toe aan `prisma/schema.prisma`
2. Voeg 4 nieuwe enums toe
3. Draai `npx prisma migrate dev --name add-content-models`
4. Genereer Prisma client

### Fase 2: Seed Scripts
**Geschatte omvang: ~500 regels seed data**

Maak `scripts/seed-content.ts` dat alle huidige hardcoded content naar de database migreert:

1. **BalanstestVraag** - 11 balanstest vragen + 5 check-in vragen uit `belastbaarheidstest/page.tsx` en `check-in/page.tsx`
2. **Zorgtaak** - 10 zorgtaken uit `belastbaarheidstest/page.tsx`
3. **TaakCategorieMapping** - 25+ mappings uit `hulpvragen/page.tsx`
4. **ContentCategorie** - Alle categorieën:
   - 5 leren hoofdcategorieën
   - 15 sub-hoofdstukken
   - 6 hulpvraag categorieën
   - 15+ zorgtaak categorieën
   - 16 WhatsApp categorieën
5. **FormulierOptie** - Alle opties:
   - 5 relatie opties
   - 5 uren opties
   - 4 duur opties
   - 4 moeilijkheidsgraden
   - 9 buddy hulpvormen
6. **AppContent** - Alle app content:
   - 5 onboarding stappen
   - 8 tutorial stappen
   - 10+ pagina intro's
   - 4+ feature cards

### Fase 3: API Endpoints (Beheer)
**Geschatte omvang: ~400 regels API code**

Maak beheer API routes voor elk nieuw model:

```
/api/beheer/balanstest-vragen/
├── route.ts          (GET list, POST create)
└── [id]/route.ts     (PUT update, DELETE remove)

/api/beheer/zorgtaken/
├── route.ts          (GET list, POST create)
└── [id]/route.ts     (PUT update, DELETE remove)

/api/beheer/content-categorieen/
├── route.ts          (GET list, POST create)
└── [id]/route.ts     (PUT update, DELETE remove)

/api/beheer/formulier-opties/
├── route.ts          (GET list, POST create)
└── [id]/route.ts     (PUT update, DELETE remove)

/api/beheer/app-content/
├── route.ts          (GET list, POST create)
└── [id]/route.ts     (PUT update, DELETE remove)
```

### Fase 4: Publieke API Endpoints
**Geschatte omvang: ~200 regels API code**

Maak publieke (read-only) API routes voor frontend:

```
/api/content/balanstest-vragen?type=BALANSTEST     (GET)
/api/content/zorgtaken                              (GET)
/api/content/categorieen?type=LEREN                 (GET)
/api/content/formulier-opties?groep=RELATIE          (GET)
/api/content/app-content?type=ONBOARDING             (GET)
/api/content/taak-mappings                           (GET)
```

### Fase 5: Beheer Pagina's (Admin Interface)
**Geschatte omvang: ~1200 regels React code**

Voeg 5 nieuwe secties toe aan de beheeromgeving:

1. **`/beheer/balanstest-vragen`** - Beheer balanstest en check-in vragen
   - Tabel met vragen per type (tabs: Balanstest / Check-in)
   - Modal voor toevoegen/bewerken
   - Drag & drop voor volgorde
   - Preview van opties

2. **`/beheer/zorgtaken`** - Beheer zorgtaken en mappings
   - Tabel met zorgtaken
   - Sub-tabel met taak-categorie mappings
   - Modal voor toevoegen/bewerken

3. **`/beheer/categorieen`** - Beheer alle categorieën
   - Filter tabs per type (Leren / Hulpvraag / Sub-hoofdstuk / WhatsApp)
   - Hiërarchische weergave (parent-child)
   - Modal voor toevoegen/bewerken

4. **`/beheer/formulier-opties`** - Beheer formulier opties
   - Groep-gebaseerde weergave (tabs per OptieGroep)
   - Modal voor toevoegen/bewerken
   - Volgorde beheer

5. **`/beheer/app-content`** - Beheer app content
   - Filter tabs per type (Onboarding / Tutorial / Pagina / Feature)
   - Rich text editor voor inhoud
   - Preview modus
   - Modal voor toevoegen/bewerken

6. **Update navigatie** in `/beheer/layout.tsx` - 5 nieuwe menu-items

### Fase 6: Frontend Refactoring
**Geschatte omvang: ~300 regels wijzigingen verspreid over 8+ bestanden**

Vervang hardcoded data door API calls in:

1. **`belastbaarheidstest/page.tsx`** - Haal vragen en zorgtaken uit API
2. **`check-in/page.tsx`** - Haal check-in vragen uit API
3. **`hulpvragen/page.tsx`** - Haal categorieën en mappings uit API
4. **`leren/page.tsx`** + **`[categorie]/page.tsx`** - Haal categorieën en sub-hoofdstukken uit API
5. **`Onboarding.tsx`** - Haal onboarding content uit API
6. **`Tutorial.tsx`** - Haal tutorial stappen uit API
7. **`word-mantelbuddy/page.tsx`** - Haal buddy opties uit API
8. **`whatsapp-session.ts`** - Haal vragen, taken en categorieën uit API

### Fase 7: Intake Vragen Beheer
**Geschatte omvang: ~200 regels**

De `IntakeQuestion` en `IntakeCategory` modellen bestaan al maar hebben geen beheerpagina:

1. **`/beheer/intake-vragen`** - Nieuwe beheerpagina
2. **API routes** voor CRUD op IntakeQuestion/IntakeCategory
3. **Frontend**: `intake/page.tsx` haalt vragen al uit API (check en fix indien nodig)

### Fase 8: Opruimen
**Geschatte omvang: ~50 regels verwijderen**

1. Verwijder `src/data/artikelen.ts` (duplicaat van seed data)
2. Verwijder alle hardcoded content-arrays uit componenten
3. Verwijder ongebruikte interfaces/types

---

## Navigatie Beheeromgeving (na implementatie)

```
📊 Dashboard
👥 Gebruikers
📝 Artikelen & Tips          (bestaand)
🏥 Hulpbronnen               (bestaand)
🤝 MantelBuddies             (bestaand)
── NIEUW ──────────────────
❓ Balanstest & Check-in Vragen
📋 Zorgtaken & Categorieën
🗂️ Content Categorieën
📝 Formulier Opties
📱 App Content (Onboarding/Tutorial)
📥 Intake Vragen
── SYSTEEM ──────────────────
⚠️ Alarmen                   (bestaand)
📜 Audit Log                 (bestaand)
⚙️ Instellingen              (bestaand)
```

---

## Volgorde van uitvoering

| Stap | Fase | Wat | Afhankelijkheid |
|------|------|-----|-----------------|
| 1 | Fase 1 | Database modellen + migratie | Geen |
| 2 | Fase 2 | Seed scripts (initiële data) | Stap 1 |
| 3 | Fase 3+4 | API endpoints (beheer + publiek) | Stap 1 |
| 4 | Fase 5 | Beheer pagina's | Stap 3 |
| 5 | Fase 6 | Frontend refactoring | Stap 3 |
| 6 | Fase 7 | Intake vragen beheer | Stap 1 |
| 7 | Fase 8 | Opruimen | Stap 5+6 |

---

## Risico's en aandachtspunten

1. **WhatsApp integratie** - `whatsapp-session.ts` gebruikt dezelfde vragen/taken; deze moet synchroon mee-refactoren
2. **Seed data** - Bestaande productiedata moet behouden blijven bij migratie
3. **Performance** - Content wordt nu statisch geladen; na migratie zijn er API calls nodig. Overweeg caching (React cache, ISR, of in-memory)
4. **Volgorde** - Zorgtaken en categorieën worden op meerdere plekken gebruikt; alles moet tegelijk omgezet worden
5. **Bestaande tests** - `BelastbaarheidAntwoord` slaat `vraagId` op als string; dit moet compatible blijven

---

## Samenvatting

- **6 nieuwe database modellen** + 4 enums
- **5 nieuwe beheer pagina's** + 1 bestaand model (intake) krijgt beheer
- **~10 API routes** (beheer + publiek)
- **8+ frontend bestanden** gerefactored
- **~2500 regels** code totaal (nieuw + wijzigingen)
- **170+ content items** verhuizen van code naar database
