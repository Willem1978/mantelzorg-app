# Volledig Verbetervoorstel - MantelBuddy App

> **Datum:** 25 februari 2026
> **Scope:** Architectuur, klantreis, content-beheer, beheeromgeving
> **Doel:** Concrete verbetervoorstellen geordend op prioriteit, met codevoorbeelden

---

## Inhoudsopgave

### DEEL A: KLANTREIS & CONTENT
1. [Klantreis: Voor de Balanstest](#1-klantreis-voor-de-balanstest)
2. [Klantreis: Na de Balanstest](#2-klantreis-na-de-balanstest)
3. [Score-Gestuurde Hulpkoppeling per Gemeente](#3-score-gestuurde-hulpkoppeling-per-gemeente)
4. [Alle Content uit de Code halen](#4-alle-content-uit-de-code-halen)
5. [Beheeromgeving: Wat Werkt Niet / Ontbreekt](#5-beheeromgeving-wat-werkt-niet--ontbreekt)

### DEEL B: TECHNISCHE ARCHITECTUUR
6. [Input Validatie (45+ routes)](#6-input-validatie-ontbreekt-bij-45-routes)
7. [Caching Strategie (94/96 routes)](#7-geen-caching-strategie-9496-routes)
8. [In-Memory WhatsApp Sessies](#8-in-memory-whatsapp-sessies)
9. [Test Coverage (0/96 routes)](#9-zero-api-test-coverage)
10. [Service Layer Abstractie](#10-service-layer-abstractie-ontbreekt)
11. [Inconsistente Error Responses](#11-inconsistente-error-responses)
12. [Database Indexes](#12-ontbrekende-database-indexes)
13. [Type Safety (as any)](#13-type-safety-as-any-verwijderen)
14. [N+1 Queries en Paginatie](#14-n1-queries-en-ontbrekende-paginatie)
15. [Build Script Risico's](#15-build-script-risicos)
16. [Ontbrekende Cascade Deletes](#16-ontbrekende-cascade-deletes)

### DEEL C: IMPLEMENTATIE ROADMAP
17. [Gefaseerd Implementatieplan](#17-implementatie-roadmap)

---

# DEEL A: KLANTREIS & CONTENT

---

## 1. Klantreis: Voor de Balanstest

### Huidige situatie

Een mantelzorger die de balanstest nog niet heeft gedaan ziet nu:

**Op het dashboard** (`src/config/content/dashboard.ts:94-99`):
```
Emoji: 📊
Titel: "Nog geen test gedaan"
Subtitel: "Ontdek hoe het met je gaat en waar je hulp bij kunt krijgen"
Knop: "Start de balanstest"
```

**Op de balanstest-pagina** (`src/config/content/balanstest.ts:18-24`):
```
Emoji: 📊
Titel: "Nog geen test gedaan"
Beschrijving: "Doe de balanstest om te zien hoe het met je gaat."
Subtekst: "Het duurt maar 5 minuten en je krijgt direct tips."
Knop: "Start de balanstest"
```

### Wat er mist

1. **Geen motivatie waarom de test belangrijk is** - De tekst zegt alleen "om te zien hoe het met je gaat" maar legt niet uit wat je ermee kunt
2. **Geen directe koppeling naar lokale hulp** - De mantelzorger wordt niet laagdrempelig meegenomen in wat er in de gemeente beschikbaar is
3. **Geen "zachte landing"** - Er is geen tussenweg voor mensen die de test niet willen maar wel hulp zoeken
4. **Taal is niet overal B1** - Sommige teksten zijn te formeel of te vaag

### Wat moet veranderen

**A. Motivatie-blok op dashboard (voor test)**

De mantelzorger die nog geen test heeft gedaan moet op het dashboard drie dingen zien:

1. **Motivatie-card** met persoonlijke, B1-toon:
   - "Hoe gaat het met jou? Veel mantelzorgers doen meer dan ze denken. Met de balanstest ontdek je in 5 minuten hoe het echt met je gaat. Je krijgt direct tips die bij jou passen."
   - Knop: "Doe de balanstest"

2. **Hulp-preview card** (NIEUW - ook zonder test):
   - "Hulp bij jou in de buurt" met 2-3 voorbeelden van lokale hulp uit de gemeente
   - Laagdrempelig: "Je hoeft niet eerst de test te doen om hulp te zoeken"
   - Knop: "Bekijk alle hulp"

3. **Social proof** (NIEUW):
   - "X mantelzorgers in [gemeente] gebruiken MantelBuddy al"
   - Of: "De meeste mantelzorgers ontdekken dat ze meer doen dan ze dachten"

**B. Deze teksten moeten NIET in code staan**

Al deze motivatieteksten moeten via de beheeromgeving aanpasbaar zijn, ook per gemeente. Zie punt 4.

**C. Implementatie**

Nieuwe content-velden nodig in de database (via SiteSettings of nieuw ContentBlock model):

```
content.dashboard.geenTest.motivatie      -> Motivatietekst (B1)
content.dashboard.geenTest.hulpPreview    -> Intro voor hulp-preview
content.dashboard.geenTest.socialProof    -> Social proof tekst
```

De hulp-preview haalt lokale hulpbronnen op via de bestaande `getHulpbronnenVoorTaken()` in `src/lib/dashboard/hulpbronnen.ts` maar dan ZONDER testresultaat - alleen op basis van gemeente.

---

## 2. Klantreis: Na de Balanstest

### Huidige situatie

Na de test ziet de mantelzorger een rapportpagina met:

**Score-weergave:** Getal 0-24 met kleur (groen/oranje/rood)

**Niveau-advies** (`src/config/content/rapport.ts:27-83`) - HARDCODED:

| Niveau | Titel | Tekst |
|--------|-------|-------|
| LAAG (0-6, groen) | "Goed bezig!" | "Je hebt een goede balans. Blijf goed voor jezelf zorgen." |
| GEMIDDELD (7-12, oranje) | "Je balans staat onder druk" | "Zo doorgaan is niet houdbaar. Kijk welke taken je kunt overdragen." |
| HOOG (13+, rood) | "Je bent overbelast" | "Dit is niet vol te houden. Je hebt nu hulp nodig." |

**Hulp-tips per taak** (`src/config/content/rapport.ts:88-99`) - HARDCODED:
```typescript
hulpTips: {
  t1: "Thuiszorg kan helpen met wassen, aankleden en andere persoonlijke verzorging.",
  t2: "Huishoudelijke hulp kun je aanvragen via de WMO van je gemeente.",
  t3: "Een apotheek kan medicijnen in weekdozen klaarzetten...",
  t4: "De gemeente kan aangepast vervoer regelen...",
  t5: "Vraag bij je gemeente naar vrijwillige hulp bij administratie...",
  // etc. voor alle 10 taken
}
```

**Dynamisch advies** (`src/lib/dashboard/advies.ts:26-149`) - Teksten HARDCODED in code:
```typescript
if (input.belastingNiveau === "HOOG") {
  adviezen.push({
    titel: "Vraag hulp",
    tekst: "Je hebt veel op je bordje. Je hoeft het niet alleen te doen...",
  })
}
```

### Wat er mist

1. **Geen subscores** - De 12 vragen gaan over 3 gebieden (fysiek, gevoel, tijd) maar de subscores worden NIET apart getoond
2. **Groen-advies is te simpel** - "Goed bezig!" zonder concrete volgende stappen
3. **Rood-advies is te generiek** - Dezelfde tekst voor iedereen, zonder gemeente-specifieke hulp
4. **Geen verschil per gemeente** - De beheerder kan niet per gemeente instellen welke hulp bij welk niveau hoort
5. **Tips per taak zijn hardcoded** - Kunnen niet via beheer aangepast worden
6. **Geen aandachtgebieden** - De 3 dimensies (fysiek, gevoel, tijd) worden niet benadrukt

### Wat moet veranderen

**A. Subscores toevoegen (fysiek, gevoel, tijd)**

De 12 vragen mappen naar 3 gebieden:

| Gebied | Vragen | Max score |
|--------|--------|-----------|
| **Fysiek** (Lichamelijk) | q1 slaap (1.5x), q2 lichaam (1.0x), q3 tijd+energie (1.0x) | 7 |
| **Gevoel** (Emotioneel) | q4 band (1.5x), q5 gedrag (1.5x), q6 verdriet (1.0x), q7 energie (1.5x) | 11 |
| **Tijd** (Praktisch) | q8 dagelijks (1.0x), q9 plannen (1.0x), q10 leuke dingen (1.0x), q11 werk (1.5x), q12 geld (1.0x) | 11 |

Implementatie vereist:

1. Mapping toevoegen in config/database:
```typescript
export const SCORE_GEBIEDEN = {
  FYSIEK: { label: "Lichamelijk", emoji: "💪", vraagIds: ["q1", "q2", "q3"] },
  GEVOEL: { label: "Gevoel", emoji: "💛", vraagIds: ["q4", "q5", "q6", "q7"] },
  TIJD:   { label: "Tijd & energie", emoji: "⏰", vraagIds: ["q8", "q9", "q10", "q11", "q12"] },
}
```

2. Subscore-opslag in database (BelastbaarheidTest model uitbreiden):
```prisma
model BelastbaarheidTest {
  // bestaande velden...
  scoreFysiek    Float?    // Subscore fysiek
  scoreGevoel    Float?    // Subscore gevoel
  scoreTijd      Float?    // Subscore tijd
}
```

3. Visuele weergave: drie balkjes op rapport-pagina, elk groen/oranje/rood

**B. Verschil in advies per totaalscore**

**Bij groen (totaal):**
- "Je hebt een goede balans. Dat is fijn! Let wel op deze punten:"
- Per subscore die oranje/rood is: specifiek aandachtgebied benoemen
- Concrete stappen: "Plan elke week iets leuks", "Doe de test over 3 maanden opnieuw"
- Hulp bij jou in de buurt (preventief, laagdrempelig)

**Bij oranje (totaal):**
- "Je doet heel veel. Dat is zwaar. Er is hulp voor je."
- Per subscore die rood is: urgente aandachtgebieden benoemen
- Concrete stappen: "Bespreek dit met je huisarts", "Zoek hulp bij deze taken"
- Hulpbronnen gekoppeld aan dit niveau (uit database, per gemeente)

**Bij rood (totaal):**
- "Je hebt nu hulp nodig. Je doet te veel alleen."
- Directe acties: bel huisarts, bel mantelzorglijn, vraag WMO-hulp
- Gemeente-specifieke hulp prominent tonen
- Alarm naar beheerder (al geimplementeerd)

**C. Alle teksten via beheer instelbaar**

Per niveau en per subscore-combinatie moet een beheerder:
1. De titel en tekst kunnen aanpassen (B1 taalgebruik)
2. Specifieke hulpbronnen kunnen koppelen
3. Dit per gemeente kunnen doen

---

## 3. Score-Gestuurde Hulpkoppeling per Gemeente

### Huidige situatie

De database heeft al velden voor score-gebaseerde zichtbaarheid op het Zorgorganisatie model:
```
zichtbaarBijLaag: boolean       // Toon bij groen
zichtbaarBijGemiddeld: boolean  // Toon bij oranje
zichtbaarBijHoog: boolean       // Toon bij rood
```

**MAAR: de hulpbronnen-logica gebruikt dit NIET!**

In `src/lib/dashboard/hulpbronnen.ts:58-59`:
```typescript
const niveauFilter: Record<string, unknown>[] = []
void belastingNiveau  // <-- BELASTINGNIVEAU WORDT GENEGEERD!
```

De `belastingNiveau` parameter wordt ontvangen maar nooit gebruikt in de queries. Alle hulpbronnen worden altijd getoond, ongeacht score.

### Wat er mist

1. **niveauFilter is leeg** - De zichtbaarheidsvelden worden nooit gecontroleerd
2. **Beheer-interface onvolledig** - Niet duidelijk of de checkboxes in het hulpbron-formulier prominent genoeg zijn
3. **Geen gemeente-specifiek advies** - Een beheerder kan niet instellen: "Bij rood in gemeente X, toon deze 3 hulpbronnen bovenaan"
4. **Geen prioritering** - Alle hulpbronnen zijn gelijkwaardig, er is geen "eerste actie" vs "overige opties"

### Wat moet veranderen

**A. Fix de niveauFilter in hulpbronnen.ts**

```typescript
// src/lib/dashboard/hulpbronnen.ts - FIX
const niveauFilter: Record<string, unknown>[] = []
if (belastingNiveau === "LAAG") {
  niveauFilter.push({ zichtbaarBijLaag: true })
} else if (belastingNiveau === "GEMIDDELD") {
  niveauFilter.push({ zichtbaarBijGemiddeld: true })
} else if (belastingNiveau === "HOOG") {
  niveauFilter.push({ zichtbaarBijHoog: true })
}
```

**B. Uitbreiding Zorgorganisatie model voor prioriteit**

```prisma
model Zorgorganisatie {
  // bestaande velden...
  prioriteitBijLaag       Int     @default(0)  // Hogere waarde = prominenter
  prioriteitBijGemiddeld  Int     @default(0)
  prioriteitBijHoog       Int     @default(0)
  actieTekstLaag          String? // "Goed om te weten"
  actieTekstGemiddeld     String? // "Dit kan je helpen"
  actieTekstHoog          String? // "Bel vandaag nog"
}
```

**C. Beheeromgeving aanpassen**

In hulpbronnen-edit pagina toevoegen:

| Veld | Type | Beschrijving |
|------|------|--------------|
| Zichtbaar bij groen | Checkbox | Toon bij lage belasting |
| Zichtbaar bij oranje | Checkbox | Toon bij gemiddelde belasting |
| Zichtbaar bij rood | Checkbox | Toon bij hoge belasting |
| Prioriteit per niveau | Nummer (0-10) | Volgorde per belastingniveau |
| Actietekst per niveau | Tekstveld | B1-tekst: "Bel vandaag nog" |

**D. Gemeente-admin kan dit zelf instellen**

In het gemeente-portal (`/gemeente/hulpbronnen/`) moet een gemeente-admin:
1. Per hulpbron in hun gemeente de score-zichtbaarheid instellen
2. Per hulpbron een actietekst schrijven per niveau
3. Een "top 3 bij rood" lijst kunnen samenstellen
4. Een "preventie-tips bij groen" lijst kunnen beheren

---

## 4. Alle Content uit de Code halen

### Probleem

Er zit een grote hoeveelheid hardcoded Nederlandse tekst in de codebase die via de beheeromgeving aanpasbaar zou moeten zijn.

### Inventaris: Alle content in code

#### 4.1 Balanstest vragen en opties

**Bestand:** `src/config/options.ts:120-162`

| Content | Regels | Items |
|---------|--------|-------|
| 12 balanstestvragen + weegfactoren | 120-133 | BALANSTEST_VRAGEN |
| 10 zorgtaken + beschrijvingen | 19-30 | ZORGTAKEN |
| 6 uren-opties | 155-162 | UREN_OPTIES |
| 3 moeilijkheids-opties | 139-143 | MOEILIJKHEID_OPTIES |
| Score drempels (0-6, 7-12, 13+) | 212-216 | getScoreLevel() |

**Status:** Er bestaat al een beheer-interface voor balanstestvragen (`/beheer/balanstest-vragen`) en zorgtaken (`/beheer/zorgtaken`). MAAR de frontend leest nog steeds uit `src/config/options.ts` in plaats van de database.

**Fix:** De belastbaarheidstest-pagina moet vragen ophalen via API in plaats van import uit config.

#### 4.2 Rapport teksten per niveau

**Bestand:** `src/config/content/rapport.ts:27-99`

Alle niveau-titels, subtitels, actie-beschrijvingen en tips staan hardcoded. Voorbeeld:
```typescript
HOOG: {
  title: "Je bent overbelast",
  subtitle: "Dit is niet vol te houden. Je hebt nu hulp nodig.",
  acties: {
    huisarts: { title: "Bel je huisarts", beschrijving: "Maak een afspraak..." },
    gemeente: { titleFn: (g) => `Mantelzorgondersteuner ${g}` },
    mantelzorglijn: { title: "Mantelzorglijn", beschrijving: "030 - 205 90 59" },
  },
}
```

**Fix:** Nieuw database-model of uitbreiding SiteSettings met categorie "rapport".

#### 4.3 Hulp-tips per taak

**Bestand:** `src/config/content/rapport.ts:88-99`

9 hardcoded tips als `t1` t/m `t9` plus `default`. Voorbeeld:
```typescript
t1: "Thuiszorg kan helpen met wassen, aankleden en andere persoonlijke verzorging.",
t2: "Huishoudelijke hulp kun je aanvragen via de WMO van je gemeente.",
```

**Fix:** Koppel deze tips aan het Zorgtaak model in de database, beheerbaar via `/beheer/zorgtaken`.

#### 4.4 Dashboard teksten

**Bestand:** `src/config/content/dashboard.ts` (125 regels)

- Begroetingen per tijdstip ("Goedemorgen!", "Goedemiddag!", "Goedenavond!")
- Score-berichten per niveau (kort + uitleg, 3 varianten)
- Check-in labels ("Super", "Goed", "Oke", "Moe", "Zwaar")
- WhatsApp-teksten
- Sectie-titels en intro's

**Status:** Deels overlap met SiteSettings (teksten.dashboard.greeting bestaat al). De rest staat in code.

#### 4.5 Advies-logica met hardcoded teksten

**Bestand:** `src/lib/dashboard/advies.ts` (149 regels)

Alle 10+ advies-templates zitten in de code:
```typescript
titel: "Vraag hulp",
tekst: "Je hebt veel op je bordje. Je hoeft het niet alleen te doen. Bel de Mantelzorglijn..."

titel: "Neem pauze",
tekst: "Respijtzorg kan je even ontlasten..."

titel: "Houd je balans in de gaten",
tekst: "Je doet al veel. Probeer elke week iets voor jezelf..."
```

**Fix:** Advies-templates naar database, beheerbaar per niveau en per gemeente.

#### 4.6 Overige content-bestanden (10 bestanden)

| Bestand | Regels | Inhoud |
|---------|--------|--------|
| `src/config/content/landing.ts` | ~100 | Landingspagina hero, features, CTA's |
| `src/config/content/mantelzorger.ts` | ~80 | Informatie-pagina mantelzorgers |
| `src/config/content/volunteer.ts` | ~60 | Vrijwilligers aanmeld-pagina |
| `src/config/content/agenda.ts` | ~40 | Agenda labels en beschrijvingen |
| `src/config/content/auth.ts` | ~50 | Login/register/vergeten teksten |
| `src/config/content/common.ts` | ~30 | Gedeelde UI-teksten |
| `src/config/content/favorieten.ts` | ~20 | Favorieten-pagina teksten |
| `src/config/content/hulpvragen.ts` | ~40 | Hulpvragen-pagina teksten |
| `src/config/content/leren.ts` | ~30 | Leren-pagina teksten |
| `src/config/content/profiel.ts` | ~40 | Profiel-pagina teksten |

### Voorgestelde oplossing

**Uitbreiden van bestaand SiteSettings model** (aanbevolen):

Het model ondersteunt al categorieen, key-value paren, types, groepering en audit trail.

Toevoegen:
```prisma
model SiteSettings {
  // bestaande velden...
  gemeente    String?   // NIEUW: null = globaal, "Zutphen" = gemeente-specifiek
}
```

Nieuwe categorieen:
```
categorie: "rapport"    -> rapport.niveaus.HOOG.title, rapport.niveaus.HOOG.subtitle, etc.
categorie: "advies"     -> advies.hoog.hulp.titel, advies.hoog.hulp.tekst, etc.
categorie: "dashboard"  -> dashboard.greeting.morning, dashboard.geenTest.motivatie, etc.
categorie: "balanstest" -> balanstest.intro, balanstest.geenTest.titel, etc.
```

Content-ophaal logica:
```typescript
// src/lib/content.ts
export async function getContent(pagina: string, gemeente?: string | null) {
  const globaal = await prisma.siteSettings.findMany({
    where: { categorie: pagina, gemeente: null }
  })
  const gemeenteContent = gemeente
    ? await prisma.siteSettings.findMany({ where: { categorie: pagina, gemeente } })
    : []

  const result: Record<string, string> = {}
  globaal.forEach(s => { result[s.sleutel] = s.waarde })
  gemeenteContent.forEach(s => { result[s.sleutel] = s.waarde }) // Override
  return result
}
```

---

## 5. Beheeromgeving: Wat Werkt Niet / Ontbreekt

### 5.1 Kleuren instellen werkt niet volledig

**Status:** De beheer-interface bestaat (`/beheer/huisstijl` tab Kleuren) met velden:
```
kleuren.scoreLaag      -> #2E7D32 (groen)
kleuren.scoreGemiddeld -> #C86800 (oranje)
kleuren.scoreHoog      -> #B71C1C (rood)
kleuren.primary        -> #2C7A7B
```

**Probleem:** Kleuren worden opgeslagen in database maar NIET dynamisch toegepast in de frontend. Componenten gebruiken hardcoded Tailwind klassen (`text-green-600`, `bg-amber-500`, `text-red-600`).

**Fix nodig:**
1. CSS custom properties genereren uit database-kleuren
2. Componenten omschrijven naar custom properties
3. Of: `useSiteSettings()` hook die kleuren als CSS variables inject

### 5.2 Score-hulp koppeling werkt niet

**Status:** Zorgorganisatie model heeft `zichtbaarBijLaag/Gemiddeld/Hoog` velden.

**Probleem:** De query in `hulpbronnen.ts` negeert het belastingniveau volledig (zie punt 3).

**Fix:** niveauFilter activeren + beheer-UI verbeteren.

### 5.3 Rapport-content niet via beheer aanpasbaar

**Status:** Geen beheer-interface voor rapport-teksten. Alles in `src/config/content/rapport.ts`.

**Fix:** Nieuwe sectie in beheeromgeving of uitbreiding huisstijl met tabblad "Rapport teksten".

### 5.4 Advies-templates niet via beheer aanpasbaar

**Status:** Alle teksten in `src/lib/dashboard/advies.ts`.

**Fix:** Advies-templates beheerbaar maken. Een beheerder moet kunnen:
- Per belastingniveau 2-3 adviezen instellen
- Per advies: titel, tekst, emoji, link, prioriteit
- Per gemeente andere adviezen instellen

### 5.5 Balanstestvragen: Beheer bestaat maar wordt niet gebruikt

**Status:** Beheer-interface op `/beheer/balanstest-vragen` bestaat, maar de frontend leest uit `src/config/options.ts`.

**Fix:** Belastbaarheidstest-pagina moet vragen uit database halen via API call.

### 5.6 Gemeente-admin mist content-beheer voor niveaus

**Status:** Gemeente-admins kunnen hulpbronnen en nieuws beheren, maar NIET:
- Advies-teksten per niveau aanpassen voor hun gemeente
- Rapport-teksten per niveau aanpassen
- "Top 3 hulp bij rood" instellen
- Preventie-tips bij groen instellen

**Fix:** Uitbreiding gemeente-portal met "Advies & Content" tabblad.

---

# DEEL B: TECHNISCHE ARCHITECTUUR

---

## 6. Input Validatie ontbreekt bij 45+ routes

### Probleem

Van de 96 API routes gebruiken er ~50 Zod-validatie. De overige parsen direct `request.json()` zonder schema.

### Huidige schemas in `src/lib/validations.ts`

Alleen: loginSchema, registerSchema, forgotPasswordSchema, resetPasswordSchema, artikelSchema, hulpbronSchema, checkInSchema.

### Routes zonder validatie (top prioriteit)

| Route | Reden |
|-------|-------|
| `api/intake/route.ts` | Handmatige check, geen schema |
| `api/belastbaarheidstest/route.ts` | Grote form, 12 vragen + taken |
| `api/balanstest/[id]/route.ts` | Gebruikersinvoer |
| `api/beheer/gebruikers/[id]/route.ts` | Admin operaties |
| `api/gemeente/*/route.ts` (alle) | Filterparameters |

### Voorbeeld: intake route

`src/app/api/intake/route.ts:29-36`:
```typescript
const body: IntakeBody = await request.json()  // TypeScript type = geen runtime check!
if (!body.answers || Object.keys(body.answers).length === 0) {
  return NextResponse.json({ error: "Geen antwoorden ontvangen" }, { status: 400 })
}
```

### Fix

Schemas toevoegen aan `src/lib/validations.ts` en overal de bestaande `validateBody()` helper gebruiken.

---

## 7. Geen Caching Strategie (94/96 routes)

### Probleem

94 van 96 routes hebben `export const dynamic = 'force-dynamic'`, wat alle caching uitschakelt. Elke pageview = verse database-query.

### Voorgestelde strategie

| Type | Voorbeeld | Cache |
|------|-----------|-------|
| Statische content | artikelen, hulpbronnen | `s-maxage=3600, stale-while-revalidate=86400` |
| Per-gebruiker data | dashboard, profiel | `private, s-maxage=60, stale-while-revalidate=300` |
| Gemeente statistieken | demografie, trends | `private, s-maxage=300, stale-while-revalidate=3600` |
| Mutaties & auth | POST/PUT/DELETE, auth | `force-dynamic` (houd huidig) |

Gebruik `revalidatePath()` bij mutaties om caches te invalideren.

---

## 8. In-Memory WhatsApp Sessies

### Probleem

`src/lib/whatsapp-session.ts:112-115` slaat sessies op in JavaScript Map objecten:
```typescript
const sessions = new Map<string, TestSession>()
const onboardingSessions = new Map<string, OnboardingSession>()
const hulpSessions = new Map<string, HulpSession>()
```

Sessies verdwijnen bij deploy/restart. Werkt niet met Vercel serverless. Geen expiratie (memory leak).

### Fix

Nieuw Prisma model WhatsAppSession met JSON data-veld, TTL van 30 minuten, en periodieke cleanup.

---

## 9. Zero API Test Coverage

### Probleem

Slechts 3 testbestanden (validations, rate-limit, advies). Geen van de 96 API routes is getest.

### Fix

1. Test helpers aanmaken met mock-auth en request builders
2. Gefaseerd testen: auth -> intake/test -> dashboard -> beheer -> gemeente -> whatsapp

---

## 10. Service Layer Abstractie ontbreekt

### Probleem

80+ routes roepen Prisma direct aan. Geen service-laag = moeilijk testbaar, duplicatie, business-logica in HTTP handlers.

### Fix

Service modules per domein:
```
src/lib/services/
  caregiver.service.ts
  intake.service.ts
  belastbaarheid.service.ts
  gemeente.service.ts
  beheer.service.ts
  notificatie.service.ts
```

Route handlers worden dan: auth check -> validatie -> service call -> response.

---

## 11. Inconsistente Error Responses

### Probleem

4 verschillende error formats: `{ error }`, `{ message }`, `{ bericht }`, `{ error: error.message }` (lekt internals).

### Fix

Centrale helper `src/lib/api-response.ts`:
```typescript
export const ApiErrors = {
  unauthorized: () => apiError("Niet ingelogd", 401),
  forbidden: () => apiError("Geen toegang", 403),
  notFound: (entity) => apiError(`${entity} niet gevonden`, 404),
  badRequest: (msg) => apiError(msg, 400),
  internal: (logErr?) => { console.error(logErr); return apiError("Er ging iets mis", 500) },
}
```

---

## 12. Ontbrekende Database Indexes

### Probleem

Kolommen die frequent gefilterd worden missen indexes, wat leidt tot full table scans.

### Ontbrekende indexes

```prisma
model BelastbaarheidTest {
  @@index([gemeente])
  @@index([isCompleted, gemeente])
  @@index([completedAt])
}

model Caregiver {
  @@index([municipality])
}
```

---

## 13. Type Safety (as any) verwijderen

### Probleem

26x `as any` in 11 bestanden. Meest impactvol: `src/middleware.ts` (4x), `src/lib/auth.ts` (6x).

### Fix

Extend NextAuth types in `src/types/next-auth.d.ts` zodat `session.user.role`, `session.user.caregiverId` etc. getypt zijn zonder cast.

---

## 14. N+1 Queries en ontbrekende paginatie

### Probleem

- `src/app/api/beheer/gebruikers/[id]/route.ts`: query met 5 niveaus diep include-nesting
- `src/app/api/gemeente/demografie/route.ts:71-81`: haalt ALLE mantelzorgers op zonder limiet

### Fix

1. Splits diepe queries in 2-3 gerichte queries
2. Database-aggregatie voor statistieken i.p.v. alles ophalen en in JS tellen
3. Paginatie toevoegen aan alle list-endpoints

---

## 15. Build Script Risico's

### Probleem

`scripts/build.js:21` gebruikt `--accept-data-loss`:
```javascript
execSync('npx prisma db push --skip-generate --accept-data-loss', { ... })
```

Kan kolommen/tabellen verwijderen bij schema-wijzigingen. Geen error handling voor prisma generate.

### Fix

1. Verwijder `--accept-data-loss`
2. Laat build falen als `prisma generate` faalt
3. Maak poort-mapping configureerbaar

---

## 16. Ontbrekende Cascade Deletes

### Probleem

BelastbaarheidTest mist `onDelete` behavior. Bij verwijderen van caregiver blijven testrecords als orphans achter.

### Fix

```prisma
caregiver Caregiver? @relation(..., onDelete: SetNull)
```

SetNull is juist (caregiverId is nullable) - testresultaten blijven bewaard voor statistieken.

---

# DEEL C: IMPLEMENTATIE ROADMAP

---

## 17. Implementatie Roadmap

### Fase 1: Quick Wins (Week 1-2)

| Taak | Impact | Effort | Punt |
|------|--------|--------|------|
| Database indexes toevoegen | Hoog | Laag | 12 |
| niveauFilter fix in hulpbronnen.ts | Hoog | Laag | 3 |
| NextAuth types (as any weg) | Medium | Laag | 13 |
| api-response.ts helper | Medium | Laag | 11 |
| Build script fixen | Medium | Laag | 15 |
| Cascade deletes | Laag | Laag | 16 |

### Fase 2: Content uit Code (Week 3-5)

| Taak | Impact | Effort | Punt |
|------|--------|--------|------|
| SiteSettings uitbreiden met gemeente-veld | Hoog | Medium | 4 |
| Rapport-teksten naar database migreren | Hoog | Medium | 4.2 |
| Advies-templates naar database | Hoog | Medium | 4.5 |
| Hulp-tips per taak naar database | Medium | Laag | 4.3 |
| Frontend vragen uit database laden | Hoog | Medium | 5.5 |
| Kleuren dynamisch toepassen | Medium | Medium | 5.1 |

### Fase 3: Klantreis Verbetering (Week 6-8)

| Taak | Impact | Effort | Punt |
|------|--------|--------|------|
| Subscores (fysiek/gevoel/tijd) toevoegen | Hoog | Medium | 2 |
| Motivatie-blok dashboard (voor test) | Hoog | Medium | 1 |
| Hulp-preview zonder test | Hoog | Medium | 1 |
| Score-gestuurde hulpkoppeling activeren | Hoog | Medium | 3 |
| Gemeente-admin content-beheer | Hoog | Hoog | 5.6 |
| Per-niveau advies via beheer | Hoog | Medium | 5.4 |

### Fase 4: Validatie & API Kwaliteit (Week 9-10)

| Taak | Impact | Effort | Punt |
|------|--------|--------|------|
| Ontbrekende Zod schemas | Hoog | Medium | 6 |
| Error responses standaardiseren | Medium | Medium | 11 |
| Caching strategie | Hoog | Medium | 7 |

### Fase 5: Architectuur & Stabiliteit (Week 11-14)

| Taak | Impact | Effort | Punt |
|------|--------|--------|------|
| Service layer modules | Hoog | Hoog | 10 |
| WhatsApp sessies naar database | Hoog | Medium | 8 |
| API tests schrijven | Hoog | Hoog | 9 |
| N+1 query optimalisaties | Medium | Medium | 14 |

---

> Dit document is gebaseerd op analyse van: 96 API routes, Prisma schema (1059 regels), 15 content-bestanden, 19 beheer-pagina's, middleware, service-bestanden, en build-configuratie.
