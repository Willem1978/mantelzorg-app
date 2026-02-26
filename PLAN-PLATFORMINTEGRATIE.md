# Beoordeling & Integratieplan: Platformplan Mantelzorgondersteuning

**Beoordeling ten opzichte van huidige codebase**
**Datum: 26-02-2026**

---

## Overzicht: Wat is er al en wat niet?

Het huidige platform heeft verrassend veel fundament al gebouwd. Hieronder een eerlijke beoordeling per onderdeel van het platformplan, met wat er al is, wat er aangepast moet worden, en wat nieuw gebouwd moet worden.

### Scoretabel per planonderdeel

| # | Onderdeel | Status | Toelichting |
|---|-----------|--------|-------------|
| 1 | Balanstest als personalisatiemotor | ✅ 90% | Test, scoring (groen/oranje/rood), subdomeinen (energie/gevoel/tijd) bestaan |
| 2 | Taakdeel met uren/zwaarte per taak | ✅ 85% | ZorgtaakSelectie met moeilijkheid + uren bestaat, impact-ranking ontbreekt |
| 3 | Hulp vinden op juiste gemeente | ✅ 95% | Twee locaties, filtering op gemeente werkt (net gefixt voor nieuwe gebruikers) |
| 4 | Profiel met 2 locaties | ✅ 100% | Caregiver.city/municipality + careRecipientCity/Municipality in DB |
| 5 | Contextbalk (locaties zichtbaar) | ❌ 0% | Moet nieuw gebouwd worden |
| 6 | Navigatie (5 items + Opgeslagen) | 🔶 60% | 4 nav-items bestaan, Zorgtaken-pagina en Opgeslagen-route ontbreken |
| 7 | Dashboard "volgende beste stap" | 🔶 50% | Adviezen bestaan, maar niet als 1-focus + 1-taak + max 3 CTA's |
| 8 | Actiekaarten (vandaag/week/ontlasten) | ❌ 0% | Nieuw concept, moet gebouwd worden |
| 9 | Contactstatus bij hulporganisaties | ❌ 0% | Geen tracking van contact-opname/afspraak/niet-gelukt |
| 10 | Weekcheck-in (60 sec) | ✅ 80% | /check-in pagina + API bestaan, interval-logica deels aanwezig |
| 11 | Her-test interval per kleur | ✅ 70% | needsNewTest + daysSinceTest bestaan, intervals moeten configureerbaar |
| 12 | Mini-plan / weekplan | ❌ 0% | Task model bestaat maar wordt niet als weekplan gebruikt |
| 13 | "Probeer dit nu" bij tips | ❌ 0% | Artikelen bestaan, maar zonder actie-koppeling |
| 14 | Opgeslagen → weekplan-suggesties | ❌ 10% | Favorieten bestaan (HULP + INFORMATIE), maar geen weekplan-integratie |
| 15 | Rapport deelbaar (PDF) | ✅ 80% | BelastbaarheidRapport model + /rapport pagina bestaan |
| 16 | Aanbevelingsmatrix (regels) | 🔶 40% | Adviezen + gemeente-advies bestaan, maar niet als gestructureerde matrix |
| 17 | Toon/empathie per score | ✅ 70% | Microcopy per niveau bestaat in content config |

---

## Gedetailleerde Beoordeling per Plansectie

### Sectie 1-2: Kern & Ontwerpprincipes

**Wat er al is:**
- `BelastbaarheidTest` model met volledige scoring (0-24 schaal)
- `BelastingNiveau` enum: `LAAG`, `GEMIDDELD`, `HOOG`
- `deelgebieden` in dashboard API: energie/gevoel/tijd met score, percentage, niveau en tip
- `ZorgtaakSelectie` met `moeilijkheid` (groen/oranje/rood) en `urenPerWeek`
- `CollapsibleSection` component voor progressive disclosure
- `adviezen` systeem met prioriteit (hoog/gemiddeld/laag), emoji, link

**Wat moet veranderen:**
- Dashboard herstructureren: van "alles tonen" naar "1 focus + 1 prioritaire taak + max 3 CTA's"
- Adviezen opsplitsen in 3 tijdsniveaus: vandaag (5 min) / deze week (20 min) / ontlasten
- Impact-ranking toevoegen: `uren × zwaarte` per taak

### Sectie 3: Profiel & Datamodel

**Wat er al is (100%):**
```
Caregiver {
  city                      // Woonplaats mantelzorger
  municipality              // Gemeente mantelzorger
  careRecipientCity         // Woonplaats zorgvrager
  careRecipientMunicipality // Gemeente zorgvrager
}
```

**Wat moet worden toegevoegd:**
- Contextbalk-component: altijd zichtbaar op relevante pagina's
- "Wijzig"-knop in contextbalk die naar profiel linkt

### Sectie 4: Navigatie

**Huidige navigatie** (uit `Navbar.tsx`):
1. Home (`/dashboard`)
2. Informatie (`/leren`)
3. Hulp (`/hulpvragen`)
4. Balanstest (`/belastbaarheidstest`)

**Gewenste navigatie:**
1. Overzicht (`/dashboard`) — bestaat
2. Balanstest (`/balanstest`) — bestaat
3. Zorgtaken (`/zorgtaken`) — **NIEUW: aparte pagina nodig**
4. Hulp vinden (`/hulpvragen`) — bestaat
5. Tips & hulpmiddelen (`/leren`) — bestaat, naam aanpassen
6. Opgeslagen (`/favorieten`) — bestaat als route, moet in nav

**Impact:** Kleine aanpassing in `Navbar.tsx` + `navigation.ts` config. Nieuwe `/zorgtaken` pagina bouwen.

### Sectie 5: Klantreis

#### 5.1 Eerste keer — grotendeels aanwezig

| Stap | Status | Locatie in code |
|------|--------|-----------------|
| Start + CTA "Start balanstest" | ✅ | Dashboard page (geen-test state) |
| Locaties vragen | ✅ | Profiel-pagina + intake flow |
| Balanstest deel 1: 12 vragen (energie/gevoel/tijd) | ✅ | BalanstestVraag model + /balanstest page |
| Balanstest deel 2: taken + uren + zwaarte | ✅ | ZorgtaakSelectie in test flow |
| Resultaat: 1 focus + 1 taak + 1-3 CTA's | 🔶 | Resultaten bestaan, structuur moet anders |
| Mini-plan (7 dagen) | ❌ | **Nieuw te bouwen** |

#### 5.2 Terugkerend ritme

| Onderdeel | Status | Huidige implementatie |
|-----------|--------|----------------------|
| Weekcheck-in (60 sec) | ✅ | `/check-in` page + `/api/check-in` route |
| Check-in vragen (energie 1-10, thema, stap) | ✅ | BalanstestVraag type=CHECKIN + smiley-scale |
| Her-test interval per kleur | 🔶 | `CHECK_IN_FREQUENTIES` config bestaat (LAAG=maandelijks, GEMIDDELD=2x/maand, HOOG=wekelijks), maar test-interval ontbreekt |
| Opgeslagen → weekplan | ❌ | Favoriet model bestaat, weekplan-logica niet |

### Sectie 6: Actielogica

**Wat er al is:**
- `adviezen` array in dashboard data met prioriteit, link, emoji
- `TAAK_ADVIES` mapping per taak (concrete hulpteksten)
- `gemeenteAdvies` per niveau (adviesLaag/adviesGemiddeld/adviesHoog)
- `urgency` object met level (low/medium/high/critical) + messages

**Wat er ontbreekt:**
1. **Actiekaarten met 3 tijdsniveaus** — Vandaag (5 min) / Deze week (20 min) / Ontlasten
2. **Aanbevelingsmatrix als config** — Gestructureerde regels per score-combinatie
3. **Impact-score berekening** — `uren × zwaarte` per taak voor prioritering
4. **Contactstatus tracking** — "contact opgenomen" / "afspraak gepland" / "niet gelukt"

### Sectie 7: Wireflow

#### 7.4 Resultaten (het belangrijkste scherm)
Het huidige `/rapport` scherm toont veel data maar is niet gestructureerd als:
1. Statuskaart (groen/oranje/rood) + 1 zin → **gedeeltelijk aanwezig**
2. Focuskaart (energie/gevoel/tijd) → **deelgebieden bestaan**
3. Prioritaire taak (impact) + "Ontlast deze taak" → **ontbreekt**
4. CTA-rij (max 3) → **ontbreekt als gestructureerd component**

**Advies:** Niet de hele rapport-pagina herbouwen, maar een nieuw "resultaat-samenvatting" component boven de bestaande grafieken plaatsen.

#### 7.5 Overzicht (dashboard)
Huidige dashboard secties:
1. Welkom + Ger avatar ✅
2. Jouw Balans (thermometer + deelgebieden) ✅
3. Jouw Volgende Stap (adviezen) ✅
4. Zorgtaken (zwaar/gemiddeld/licht) ✅
5. Aanbevolen Artikelen ✅
6. WhatsApp integratie ✅

**Wat moet veranderen:**
- Contextbalk toevoegen
- "Volgende Stap" herstructureren naar 1 focus + max 3 CTA's
- "Zorgtaken" sorteren op impact (uren × zwaarte)
- Weekcheck-in knop toevoegen

#### 7.6 Taakdetail → Hulpkaart → Contactstatus
**Volledig nieuw te bouwen:**
- Taakdetail-pagina met ontlastopties + top organisaties
- Contactstatus-tracking (nieuw DB-veld)
- Organisatie-detailweergave met contactknoppen

#### 7.7 Tips & hulpmiddelen
**Bestaand:** `/leren` met categorieën, artikelen, gemeente-nieuws
**Toe te voegen:**
- "Probeer dit nu"-actie per artikel
- "Zet in mijn weekplan"-knop → Favoriet + weekplan-suggestie

---

## Integratieplan: Fasering

### Fase 1: Fundament (lokale routing + profiel + actielogica)

#### 1A. Contextbalk component — NIEUW
**Bestanden:**
- `src/components/layout/ContextBar.tsx` (nieuw)
- `src/components/layout/Navbar.tsx` (aanpassen — contextbalk integreren)

**Data:** Gebruikt bestaande `Caregiver.city` + `Caregiver.careRecipientCity` uit dashboard API.

**Geschatte omvang:** Klein (1 component, ~50 regels)

#### 1B. Impact-score berekening — AANPASSING
**Bestanden:**
- `src/lib/dashboard/hulpbronnen.ts` — impact ranking toevoegen
- `src/app/api/dashboard/route.ts` — impact meesturen

**Logica:**
```
impact = urenPerWeek × moeilijkheidScore
moeilijkheidScore: MOEILIJK/ZEER_MOEILIJK=3, GEMIDDELD/SOMS=2, MAKKELIJK/NEE=1
```

**Data:** Alle velden bestaan al in `ZorgtaakSelectie`. Alleen berekening + sortering toevoegen.

**Geschatte omvang:** Klein (berekening in API, 20-30 regels)

#### 1C. Contactstatus bij hulporganisaties — DB + API + UI
**Database wijziging (Prisma):**
```prisma
model HulpbronContact {
  id              String   @id @default(cuid())
  caregiverId     String
  organisatieNaam String
  gemeente        String?
  status          ContactStatus @default(NIEUW)
  notitie         String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  caregiver       Caregiver @relation(...)

  @@unique([caregiverId, organisatieNaam])
}

enum ContactStatus {
  NIEUW
  CONTACT_OPGENOMEN
  AFSPRAAK_GEPLAND
  GEREGELD
  NIET_GELUKT
}
```

**Bestanden:**
- `prisma/schema.prisma` — nieuw model
- `src/app/api/hulpbron-contact/route.ts` — CRUD API (nieuw)
- `src/app/(dashboard)/hulpvragen/page.tsx` — statusknop per organisatie

**Geschatte omvang:** Medium (migratie + API + UI-aanpassing)

#### 1D. Navigatie aanpassen
**Bestanden:**
- `src/config/content/navigation.ts` — items toevoegen/hernoemen
- `src/components/layout/Navbar.tsx` — volgorde aanpassen

**Aanpassingen:**
- "Informatie" → "Tips" (hernoemen)
- "Opgeslagen" toevoegen (linkt naar bestaande `/favorieten`)
- Later: "Zorgtaken" toevoegen wanneer die pagina klaar is

**Geschatte omvang:** Klein

---

### Fase 2: Resultaat → Actie (meest zichtbaar)

#### 2A. Actiekaarten systeem — NIEUW CONCEPT
**Aanpak:** Geen nieuw DB-model nodig. Gebruik een config-gebaseerde aanbevelingsmatrix die regels bevat per score-combinatie.

**Bestanden:**
- `src/config/actiekaarten.ts` (nieuw) — matrix met regels
- `src/lib/dashboard/acties.ts` (nieuw) — logica die score → acties vertaalt

**Config-structuur (voorbeeld):**
```typescript
export const AANBEVELINGS_MATRIX: AanbevelingsRegel[] = [
  {
    conditie: { totaal: "HOOG" },
    focus: "Ontlasten nu",
    acties: {
      vandaag: "Kies 1 taak om te schrappen of uit te stellen",
      dezeWeek: "Plan 1 respijtmoment",
      ontlasten: "organisaties" // → toont top 3 lokale organisaties
    }
  },
  {
    conditie: { totaal: "GEMIDDELD", deelgebied: { tijd: "HOOG" } },
    focus: "Tijd",
    acties: {
      vandaag: "3 must-do's, rest parkeren",
      dezeWeek: "Maak weekplanning/zorgrooster",
      ontlasten: "clientondersteuning"
    }
  },
  // ... overige regels uit sectie 8 van het plan
]
```

**Koppeling:** Gebruikt bestaande `deelgebieden` + `belastingNiveau` uit dashboard API.

**Geschatte omvang:** Medium (config + logica + UI-componenten)

#### 2B. Dashboard herstructureren
**Bestand:** `src/app/(dashboard)/dashboard/page.tsx`

**Aanpassingen:**
1. Contextbalk bovenaan integreren
2. "Volgende Stap" sectie vervangen door:
   - 1 focuskaart (uit aanbevelingsmatrix)
   - Max 3 actiekaarten (vandaag / deze week / ontlasten)
3. Zorgtaken sorteren op impact-score
4. Check-in knop toevoegen (linkt naar bestaande `/check-in`)

**Geen breaking changes:** Bestaande data-interface `DashboardData` wordt uitgebreid, niet veranderd.

**Geschatte omvang:** Medium-groot (veel UI-werk, maar bestaande data)

#### 2C. Resultatenscherm herontwerp
**Bestand:** `src/app/(dashboard)/rapport/page.tsx` of apart resultaat-component

**Aanpak:** Nieuw samenvattingsblok boven bestaande rapport-inhoud:
1. Statuskaart (groen/oranje/rood) + 1 zin
2. Focusdomein (energie/gevoel/tijd) + uitleg
3. Prioritaire taak (impact) + "Ontlast deze taak"
4. CTA-rij (max 3 actiekaarten)

**Geschatte omvang:** Medium

#### 2D. Zorgtaken pagina — NIEUW
**Bestanden:**
- `src/app/(dashboard)/zorgtaken/page.tsx` (nieuw)
- Hergebruikt data uit dashboard API (zorgtaken + hulpbronnen)

**Inhoud:**
- Alle geselecteerde zorgtaken, gesorteerd op impact
- Per taak: uren, zwaarte, 2 ontlastopties, top organisaties
- Contactstatus per organisatie (uit 1C)
- Link naar hulpvragen voor meer opties

**Geschatte omvang:** Medium-groot

#### 2E. "Probeer dit nu" bij artikelen
**Database:** Uitbreiden van `Artikel` model:
```prisma
model Artikel {
  // ... bestaande velden
  actieTekst    String?  // "Probeer dit nu" tekst
  actieLink     String?  // Link naar actie
}
```

**Bestanden:**
- `prisma/schema.prisma` — 2 velden toevoegen
- `src/app/(dashboard)/leren/[categorie]/page.tsx` — actieknop tonen
- `src/app/beheer/artikelen/page.tsx` — velden in beheer

**Geschatte omvang:** Klein

---

### Fase 3: Ritme & Motivatie (retentie)

#### 3A. Weekcheck-in optimaliseren
**Bestaand:** `/check-in` pagina + `/api/check-in` route werken al.

**Aanpassingen:**
- Verkorten tot 60 sec (3-4 vragen max)
- Energie (1-10 schaal) → lastigste thema → kies 1 stap
- Suggesties tonen op basis van antwoorden (bestaat al: `getContextueleHulp()`)

**Her-test interval per kleur:**
```typescript
// Toevoegen aan config/options.ts
export const HERTEST_INTERVAL = {
  LAAG: 28,      // 4 weken
  GEMIDDELD: 14,  // 2 weken
  HOOG: 7,        // 1 week
}
```

**Bestaande logica:** `needsNewTest` + `daysSinceTest` in dashboard API — alleen intervallen aanpassen.

**Geschatte omvang:** Klein

#### 3B. Weekplan met favorieten
**Aanpak:** Bestaand `Favoriet` model uitbreiden:
```prisma
model Favoriet {
  // ... bestaande velden
  inWeekplan    Boolean  @default(false)
  weekplanDatum DateTime?
  weekplanStatus String? // "gepland" | "gedaan" | "niet_gelukt"
}
```

**Bestanden:**
- `prisma/schema.prisma` — velden toevoegen
- `src/app/(dashboard)/favorieten/page.tsx` — weekplan-weergave
- Dashboard — weekplan-suggesties tonen

**Geschatte omvang:** Medium

#### 3C. Rapport deelbaar
**Bestaand:** `BelastbaarheidRapport` model + `/rapport` pagina bestaan al.

**Aanpassingen:**
- PDF-export verbeteren met actiekaarten + focuspunt
- Deelknop (link genereren) — `/rapport-gast` route bestaat al

**Geschatte omvang:** Klein-medium

---

## Datamodel-wijzigingen Samenvatting

### Nieuwe modellen:
```
HulpbronContact (contactstatus bij organisaties)
```

### Uitbreidingen bestaande modellen:
```
Artikel          + actieTekst, actieLink
Favoriet         + inWeekplan, weekplanDatum, weekplanStatus
```

### Nieuwe config-bestanden:
```
src/config/actiekaarten.ts    (aanbevelingsmatrix)
src/lib/dashboard/acties.ts   (score → acties logica)
```

### Nieuwe pagina's:
```
src/app/(dashboard)/zorgtaken/page.tsx
```

### Nieuwe componenten:
```
src/components/layout/ContextBar.tsx
src/components/dashboard/ActieKaart.tsx
src/components/dashboard/FocusKaart.tsx
src/components/hulp/ContactStatus.tsx
```

---

## Wat NIET nodig is (al gebouwd)

Het volgende hoeft **niet** gebouwd te worden omdat het al bestaat:

1. **Balanstest (deel 1 + 2)** — Compleet werkend met scoring
2. **Hulpbronnen filtering op gemeente** — Werkt voor beide locaties
3. **Check-in flow** — Pagina + API + contextual suggesties
4. **Artikelen/tips systeem** — CMS met categorieën, beheer, publicatie
5. **Favorieten** — HULP + INFORMATIE types met opslaan/verwijderen
6. **Gemeente-specifiek advies** — Model met adviesLaag/Gemiddeld/Hoog
7. **Rapport pagina** — Resultaten + trends + history
8. **Alarm systeem** — AlarmLog bij hoge belasting
9. **Notificaties** — Notification model met types
10. **WhatsApp integratie** — Webhook, check-in via WhatsApp
11. **Beheerportaal** — Alle content beheerbaar
12. **Gemeente portaal** — Eigen portaal per gemeente
13. **MantelBuddy systeem** — Vrijwilligers matching

---

## Prioritering: Wat heeft de meeste impact?

### Prioriteit 1 (Grootste gebruikersimpact, minste bouwwerk):
1. **Dashboard herstructureren** (2B) — 1 focus + max 3 CTA's
2. **Actiekaarten config** (2A) — Aanbevelingsmatrix als config
3. **Impact-score berekening** (1B) — Simpele berekening toevoegen
4. **Contextbalk** (1A) — Klein component, grote UX-winst

### Prioriteit 2 (Belangrijk voor actie-conversie):
5. **Contactstatus** (1C) — Tracking van hulp-zoekactie
6. **Zorgtaken pagina** (2D) — Aparte pagina voor taak-ontlasting
7. **Resultatenscherm** (2C) — Focus-samenvatting boven rapport

### Prioriteit 3 (Retentie en volhouden):
8. **Weekplan met favorieten** (3B)
9. **Check-in optimalisatie** (3A)
10. **"Probeer dit nu" bij artikelen** (2E)
11. **Navigatie aanpassen** (1D)

---

## Conclusie

**Het platform is voor ~60% al gebouwd.** De kern (test, scoring, hulpbronnen, content) is solide. De grootste gap zit in de **actielaag**: het vertalen van inzicht naar concrete, getimede acties met status-tracking. Dit is precies wat het platformplan beschrijft.

De voorgestelde wijzigingen passen binnen de bestaande architectuur:
- Prisma models worden uitgebreid, niet vervangen
- Dashboard data-interface wordt uitgebreid
- Bestaande API routes worden aangevuld
- UI-componenten volgen bestaande patronen (Tailwind + shadcn/ui)
- Config-gedreven aanpak past bij bestaande `options.ts` structuur

**Grootste risico:** De dashboard-pagina is al groot (~1300 regels). Bij herstructurering is het verstandig om secties naar aparte componenten te verplaatsen.
