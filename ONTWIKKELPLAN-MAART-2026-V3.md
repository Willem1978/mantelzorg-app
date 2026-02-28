# Ontwikkelplan MantelBuddy — Maart 2026 v3.0

**Datum:** 28 februari 2026
**Status:** MantelBuddy v2.5.0 + 7 AI agents operationeel
**Focus:** Ger prominenter, buddy-matching met kaart, hulpvragenflow verbeteren, gemeente onboarding wizard

---

## Huidige status — wat werkt

| Onderdeel | Status |
|-----------|--------|
| 7 AI agents (Ger, Welkom, Balanscoach, Check-in, Analytics, Moderatie, Curator) | 100% |
| Balanstest met 10 zorgtaken, scoring, subdomeinen | 95% |
| Dashboard, hulpvragen, leren, agenda, check-in | 85% |
| Beheerportal (artikelen, hulpbronnen, gebruikers, alarmen) | 90% |
| Gemeenteportaal (dashboard, trends, rapportages) | 80% |
| MantelBuddy aanmelding + marktplaats (basis) | 40% |
| Buddy matching / match-percentage | 0% |
| Kaartweergave buddys in de buurt | 0% |
| Ger prominent op homepage (nu klein floating button) | 30% |
| Gemeente onboarding wizard | 0% |
| Balanstest opvolging (e-mail, check-in, alarm-notificatie) | 0% |

---

## Wat er moet gebeuren — 5 sporen

### Spoor 1: Ger prominent op de homepage

**Probleem:** Ger is nu een klein floating bubbeltje rechtsonder. Bezoekers missen het.

**Oplossing:** Ger wordt het centrale element van de homepage met een ingebed chatvenster.

#### 1A. Homepage redesign — Ger centraal
- Hero sectie: Ger avatar groot (lg) + welkomsttekst + **direct chatvenster** eronder
- Chatvenster is geen popup meer maar een ingebedde kaart (400px breed, 500px hoog)
- Suggestieknoppen prominent zichtbaar: "Doe de test", "Hulp in de buurt", "Ik ben moe"
- Twee paden (mantelzorger / buddy) komen **onder** het chatvenster
- Floating button op andere pagina's blijft bestaan als fallback

**Bestanden:**
- `src/app/page.tsx` — redesign homepage layout
- `src/components/ai/PublicGerChat.tsx` — variant "embedded" toevoegen (niet alleen floating)
- Nieuw: `src/components/ai/GerHeroChat.tsx` — ingebed chatvenster voor homepage

#### 1B. Ger op het dashboard — prominenter
- Dashboard: Ger-kaart bovenaan met laatste advies of "Hoi [naam], hoe gaat het?"
- Klik opent volledige chat (bestaande `/ai-assistent` pagina)
- Proactieve berichten: na test, na check-in, bij alarmsignalen
- Context-aware: "Je hebt je test 3 weken geleden gedaan. Tijd voor een check-in?"

**Bestanden:**
- `src/app/(dashboard)/dashboard/page.tsx` — Ger-kaart bovenaan
- `src/components/ai/GerDashboardCard.tsx` — nieuw component

#### 1C. Ger visuele upgrade
- GerAvatar animatie: subtiel knipperen of zwaaien bij hover
- Typindicator met Ger's gezicht (niet drie puntjes maar Ger die "denkt")
- Consistente groene kleurschema door alle Ger-componenten

**Bestanden:**
- `src/components/GerAvatar.tsx` — animaties toevoegen
- `src/components/ai/PublicGerChat.tsx` — visuele verbeteringen

---

### Spoor 2: Buddy-matching met matchpercentage en kaart

**Probleem:** Er is geen matching-algoritme. Buddys en mantelzorgers worden niet automatisch gematcht. Er is geen kaart.

**Oplossing:** Match-algoritme op basis van zorgtaken, locatie en beschikbaarheid + kaartweergave.

#### 2A. Match-algoritme bouwen
Score berekening op basis van drie factoren:

| Factor | Gewicht | Berekening |
|--------|---------|------------|
| **Taak-overlap** | 50% | Hoeveel van de 10 zorgtaken matchen de hulpvormen van de buddy? |
| **Afstand** | 30% | Postcode-afstand (hemelsbreed via coördinaten). <5km = 100%, 5-10km = 70%, 10-20km = 40%, >20km = 10% |
| **Beschikbaarheid** | 20% | Past de beschikbaarheid (eenmalig/vast/beide) bij de vraag? + VOG + training + score |

**Resultaat:** Match-percentage 0-100% per buddy, gesorteerd op relevantie.

**Datamodel uitbreidingen (Prisma):**
```prisma
// MantelBuddy uitbreiden
model MantelBuddy {
  // ... bestaande velden
  latitude        Float?          // Geocoded van postcode
  longitude       Float?          // Geocoded van postcode
  maxReisafstand  Int?            // Max km bereid te reizen (standaard 10)
  biografie       String?         // Korte introductie (zichtbaar voor mantelzorger)
  profielfoto     String?         // URL naar profielfoto (optioneel)
}

// Caregiver uitbreiden
model Caregiver {
  // ... bestaande velden
  latitude        Float?          // Geocoded van adres naaste
  longitude       Float?          // Geocoded van adres naaste
}
```

**Bestanden:**
- `prisma/schema.prisma` — lat/lng velden toevoegen
- Nieuw: `src/lib/matching.ts` — match-algoritme (taak-overlap + afstand + beschikbaarheid)
- Nieuw: `src/app/api/buddys/match/route.ts` — API endpoint: geeft gematchte buddys met percentage
- Nieuw: `src/app/api/buddys/geocode/route.ts` — geocode postcode via PDOK API (gratis, NL)

#### 2B. Kaartweergave met Leaflet
- Leaflet.js (gratis, open-source) voor kaartweergave
- Kaart toont: locatie naaste (centraal) + beschikbare buddys (markers met matchpercentage)
- Buddys tonen als cirkels met initialen + matchpercentage badge
- Klik op buddy: profiel-popup met hulpvormen, beoordeling, beschikbaarheid
- Radiusfilter: 5km / 10km / 20km schuifregelaar
- Privacy: buddy-locatie wordt afgerond op 500m (niet exact adres)

**Dependencies toevoegen:**
```bash
npm install leaflet react-leaflet
npm install -D @types/leaflet
```

**Bestanden:**
- Nieuw: `src/components/BuddyKaart.tsx` — Leaflet kaartcomponent
- Nieuw: `src/components/BuddyMarker.tsx` — custom marker met matchpercentage
- Nieuw: `src/components/BuddyProfielPopup.tsx` — popup bij klik op marker

#### 2C. Buddy zoek- en matchpagina
- Nieuwe pagina `/buddys` (of integratie in bestaande `/marktplaats`)
- Boven: kaart met buddys in de buurt
- Onder: lijst van buddys gesorteerd op matchpercentage
- Per buddy-kaart: voornaam, woonplaats, matchpercentage (grote badge), hulpvormen (iconen), beoordeling (sterren)
- Filter: op zorgtaak-categorie, afstand, beschikbaarheid
- CTA: "Vraag hulp aan [naam]" → opent hulpvraag-formulier gekoppeld aan buddy

**Bestanden:**
- Nieuw: `src/app/(dashboard)/buddys/page.tsx` — buddy zoek/matchpagina
- `src/app/(dashboard)/marktplaats/page.tsx` — link naar buddys-pagina toevoegen

#### 2D. Postcode geocoding via PDOK
- PDOK Locatieserver (gratis, overheids-API) voor NL postcodes
- Endpoint: `https://api.pdok.nl/bzk/locatieserver/search/v3_1/free?q={postcode}&fq=type:postcode`
- Bij buddy-aanmelding: automatisch lat/lng opslaan
- Bij profiel opslaan: automatisch lat/lng updaten
- Haversine formule voor afstandsberekening

**Bestanden:**
- Nieuw: `src/lib/geocode.ts` — PDOK geocoding + Haversine afstandsberekening
- `src/app/api/mantelbuddy/aanmelden/route.ts` — geocoding toevoegen bij aanmelding

---

### Spoor 3: Hulpvragen en buddyhulp verbeteren

**Probleem:** Hulpvragen gaan nu via HelpRequest (richting organisaties) OF via BuddyTaak (marktplaats). Dit is verwarrend. De 10 zorgtaken moeten centraal staan.

**Oplossing:** Eén flow: mantelzorger kiest zorgtaak → ziet gematchte buddys in de buurt → vraagt hulp aan.

#### 3A. Hulpvragenflow herstructureren
1. Mantelzorger opent `/hulpvragen` of `/buddys`
2. Kiest uit de 10 zorgtaken (grid met iconen, net als balanstest)
3. Ziet twee tabs:
   - **Buddys in de buurt** — gematchte vrijwilligers met percentage + kaart
   - **Organisaties** — professionele hulpbronnen (bestaande functionaliteit)
4. Bij buddy: "Vraag hulp" → eenvoudig formulier (wat, wanneer, extra info)
5. Buddy krijgt notificatie → kan reageren met bericht
6. Mantelzorger ziet reacties en kiest buddy

**Bestanden:**
- `src/app/(dashboard)/hulpvragen/page.tsx` — refactor: tabs toevoegen (buddys + organisaties)
- `src/app/api/marktplaats/route.ts` — uitbreiden met match-data

#### 3B. Hulpvraag gekoppeld aan naaste-locatie
- Hulpvraag gebruikt locatie van de **naaste** (careRecipientCity/Municipality)
- Kaart centraal op adres naaste
- Buddys in de buurt van de naaste (niet van de mantelzorger zelf)
- Dit is logisch: de buddy komt bij de naaste aan huis

**Bestanden:**
- `src/lib/matching.ts` — gebruik naaste-locatie voor afstandsberekening
- `src/app/api/buddys/match/route.ts` — careRecipient locatie als centrum

#### 3C. Navigatie aanpassen
- Navigatie-item "Hulp" krijgt submenu of badge met buddy-matches
- "Marktplaats" hernoemen naar "Buddyhulp" of integreren in "Hulpvragen"
- Mobile nav: icoon aanpassen, badge met aantal beschikbare buddys

**Bestanden:**
- `src/config/content/navigation.ts` — labels en routes aanpassen
- `src/components/navigation/MobileNav.tsx` — badge logic

---

### Spoor 4: Gemeente Onboarding Wizard

**Probleem:** Gemeenten moeten nu handmatig aangemaakt worden via losse pagina's. Stappen worden vergeten, `isActief` wordt niet afgedwongen, en er is geen opvolging na de balanstest (geen e-mail, geen geplande check-in, geen alarm-notificatie naar gemeente).

**Oplossing:** Stapsgewijze wizard die het complete onboarding-proces begeleidt + automatische opvolging.

#### 4A. Onboarding wizard (`/beheer/gemeenten/nieuw`)
Nieuwe pagina met stepper UI (5 stappen):

1. **Gemeente kiezen** — PDOK autocomplete (al beschikbaar), CBS-code auto-invullen, check of gemeente al bestaat
2. **Contactgegevens** — e-mail, telefoon, website, WMO loket URL (minimaal e-mail of telefoon verplicht)
3. **Lokale hulpbronnen koppelen** — automatisch zoeken naar bestaande `Zorgorganisatie` records voor deze gemeente, checkboxes om te koppelen, standaard-suggesties (mantelzorgsteunpunt, WMO loket, huisartsenpost, respijtzorg)
4. **Advies per belastingniveau** — tekstvelden voor advies LAAG/GEMIDDELD/HOOG + organisatie koppelen per niveau, standaard-templates als placeholder
5. **Eerste beheerder aanmaken** — e-mailadres + naam, rol kiezen (COMMUNICATIE/HULPBRONNEN/BELEID/alles), direct account aanmaken of uitnodigingslink genereren

Na voltooiing: gemeente aangemaakt met `isActief: true`, checklist-overzicht getoond.

**Bestanden:**
- Nieuw: `src/app/beheer/gemeenten/nieuw/page.tsx` — wizard UI (stepper)
- Nieuw: `src/app/api/beheer/gemeenten/onboarding/route.ts` — gecombineerd endpoint dat gemeente + hulpbronnen + advies + gebruiker aanmaakt
- Nieuw: `src/app/api/beheer/gemeenten/hulpbronnen-zoek/route.ts` — zoek bestaande hulpbronnen voor gemeente
- `src/app/beheer/gemeenten/page.tsx` — link naar wizard + setup-status indicator

#### 4B. Activering & handhaving
- `isActief` check afdwingen in gemeente-portaal login (nu kan een inactieve gemeente nog inloggen)
- Setup-status indicator op gemeenten-overzicht: groen vinkje per voltooide stap, percentage completeness
- Knop "Onboarding hervatten" als niet alles af is

**Bestanden:**
- `src/lib/gemeente-auth.ts` — `isActief` check toevoegen
- `src/app/beheer/gemeenten/page.tsx` — setup-status badges
- Nieuw: `src/app/api/beheer/gemeenten/[id]/activeer/route.ts` — toggle `isActief` met validatie

#### 4C. Balanstest opvolging automatiseren
Na test-voltooiing automatisch:
- **E-mail** met score-samenvatting, top 3 aanbevelingen, link naar rapport, gemeente-specifieke contactgegevens
- **Check-in reminder plannen**: HOOG → 1 week, GEMIDDELD → 2 weken, LAAG → 4 weken
- **Gemeente-notificatie bij alarm**: geanonimiseerde e-mail naar `Gemeente.contactEmail` bij CRITICAL/HIGH alarm
- **Fix: gemeente op test** voor ingelogde users (haal municipality uit Caregiver profiel)
- **Fix: WhatsApp alarm detectie** — `checkAlarmindicatoren()` toevoegen aan WhatsApp handler

**Bestanden:**
- Nieuw: `src/lib/email/balanstest-resultaat.ts` — e-mail template na test
- Nieuw: `src/lib/email/gemeente-alarm-notificatie.ts` — alarm-notificatie template
- Nieuw: `src/lib/check-in/plan-check-in.ts` — auto-planning check-in reminder
- `src/app/api/belastbaarheidstest/route.ts` — triggers toevoegen
- `src/lib/whatsapp/belastbaarheidstest.ts` — alarm detectie fix

#### 4D. Gemeente dashboard opvolging
Nieuw component op gemeente-dashboard met:
- Nieuwe tests deze week (waarvan HOOG)
- Open alarmen
- Geplande check-ins + niet-uitgevoerde check-ins
- Knoppen naar alarmen en rapportage

**Bestanden:**
- Nieuw: `src/components/gemeente/OpvolgingKaart.tsx`
- Nieuw: `src/app/api/gemeente/opvolging/route.ts`
- `src/app/gemeente/page.tsx` — kaart toevoegen

---

### Spoor 5: Technische verbeteringen en bugfixes

#### 5A. Kritieke fixes (eerst doen)
- [ ] **TAAK_NAAR_ONDERDEEL mapping fixen** — alle 9 mappings zijn verkeerd (zie PLAN.md)
- [ ] **API keys uit git verwijderen** — .env.production bevat OpenAI keys

**Bestanden:**
- `src/config/options.ts` — TAAK_NAAR_ONDERDEEL fixen
- `.env.production` — verwijderen, naar Vercel env vars

#### 5B. Persoonlijk advies na balanstest
- Pagina `/rapport/persoonlijk` verbeteren met directe feedback
- Score + subdomeinen + top 3 actiestappen
- Ger automatisch bericht na test
- Gastenflow: advies tonen zonder login, account aanmoedigen

**Bestanden:**
- `src/app/(dashboard)/rapport/persoonlijk/page.tsx` — uitbreiden
- `src/app/api/ai/balanscoach/route.ts` — proactief bericht genereren

#### 5C. Testdekking uitbreiden
- Van 29 naar 60+ tests
- Focus op: matching-algoritme, geocoding, API routes, wizard
- E2E tests voor hulpvragenflow

#### 5D. Performance en monitoring
- Structured logging (pino) consistent doorvoeren
- Error boundaries op alle pagina's
- API response caching waar mogelijk

---

## Prioriteitsvolgorde

| # | Taak | Impact | Inspanning | Sprint |
|---|------|--------|------------|--------|
| 1 | 5A: Kritieke fixes (mapping, API keys) | Hoog | Laag | Week 1 |
| 2 | 2A: Match-algoritme + geocoding | Hoog | Gemiddeld | Week 1-2 |
| 3 | 1A: Homepage redesign — Ger centraal | Hoog | Gemiddeld | Week 1-2 |
| 4 | 2D: PDOK geocoding integratie | Hoog | Laag | Week 1 |
| 5 | 2B: Leaflet kaartweergave | Hoog | Gemiddeld | Week 2 |
| 6 | 3A: Hulpvragenflow herstructureren | Hoog | Hoog | Week 2-3 |
| 7 | 2C: Buddy zoek/matchpagina | Hoog | Gemiddeld | Week 2-3 |
| 8 | 4A: Gemeente onboarding wizard | Hoog | Hoog | Week 2-3 |
| 9 | 1B: Ger op dashboard prominenter | Gemiddeld | Laag | Week 3 |
| 10 | 4B: Activering & handhaving gemeente | Gemiddeld | Laag | Week 3 |
| 11 | 3B: Hulpvraag bij naaste-locatie | Gemiddeld | Laag | Week 3 |
| 12 | 4C: Balanstest opvolging (e-mail, check-in, alarm) | Hoog | Gemiddeld | Week 3-4 |
| 13 | 5B: Persoonlijk advies na test | Gemiddeld | Gemiddeld | Week 3-4 |
| 14 | 4D: Gemeente dashboard opvolging | Gemiddeld | Laag | Week 4 |
| 15 | 3C: Navigatie aanpassen | Laag | Laag | Week 4 |
| 16 | 1C: Ger visuele upgrade | Laag | Laag | Week 4 |
| 17 | 5C: Testdekking | Gemiddeld | Hoog | Doorlopend |
| 18 | 5D: Performance/monitoring | Laag | Gemiddeld | Doorlopend |

---

## Technische architectuur

### Nieuwe dependencies

```json
{
  "leaflet": "^1.9.4",
  "react-leaflet": "^4.2.1",
  "@types/leaflet": "^1.9.12"
}
```

### Nieuwe bestanden overzicht

```
src/
├── lib/
│   ├── matching.ts                    # Match-algoritme (taak-overlap + afstand + beschikbaarheid)
│   ├── geocode.ts                     # PDOK geocoding + Haversine formule
│   ├── email/
│   │   ├── balanstest-resultaat.ts    # E-mail template na balanstest
│   │   └── gemeente-alarm-notificatie.ts  # Alarm-notificatie naar gemeente
│   └── check-in/
│       └── plan-check-in.ts           # Auto-planning check-in reminder
├── components/
│   ├── ai/
│   │   ├── GerHeroChat.tsx            # Ingebed chatvenster homepage
│   │   └── GerDashboardCard.tsx       # Ger-kaart voor dashboard
│   ├── BuddyKaart.tsx                 # Leaflet kaartcomponent
│   ├── BuddyMarker.tsx               # Custom marker met matchpercentage
│   ├── BuddyProfielPopup.tsx          # Popup bij klik op buddy
│   ├── beheer/
│   │   └── GemeenteHulpbronnenZoek.tsx  # Hulpbronnen-zoek in wizard
│   └── gemeente/
│       └── OpvolgingKaart.tsx         # Opvolging dashboard-kaart
├── app/
│   ├── (dashboard)/
│   │   └── buddys/
│   │       └── page.tsx               # Buddy zoek/matchpagina
│   ├── beheer/
│   │   └── gemeenten/
│   │       └── nieuw/
│   │           └── page.tsx           # Gemeente onboarding wizard
│   └── api/
│       ├── buddys/
│       │   ├── match/route.ts         # Match API endpoint
│       │   └── geocode/route.ts       # Geocoding endpoint
│       ├── beheer/gemeenten/
│       │   ├── onboarding/route.ts    # Wizard submit endpoint
│       │   ├── hulpbronnen-zoek/route.ts  # Hulpbronnen zoeken voor gemeente
│       │   └── [id]/activeer/route.ts # Toggle isActief
│       └── gemeente/
│           └── opvolging/route.ts     # Opvolgingsdata endpoint
```

### Gewijzigde bestanden overzicht

```
src/
├── app/
│   ├── page.tsx                       # Homepage redesign
│   ├── (dashboard)/
│   │   ├── dashboard/page.tsx         # Ger-kaart toevoegen
│   │   ├── hulpvragen/page.tsx        # Tabs: buddys + organisaties
│   │   └── marktplaats/page.tsx       # Link naar buddys
│   ├── beheer/
│   │   └── gemeenten/page.tsx         # Link naar wizard + setup-status
│   ├── gemeente/
│   │   └── page.tsx                   # Opvolgingskaart toevoegen
│   └── api/
│       └── belastbaarheidstest/route.ts  # E-mail + check-in triggers
├── components/
│   ├── GerAvatar.tsx                  # Animaties
│   ├── ai/PublicGerChat.tsx           # Embedded variant
│   └── navigation/MobileNav.tsx       # Badge updates
├── config/
│   ├── options.ts                     # TAAK_NAAR_ONDERDEEL fix
│   └── content/navigation.ts         # Route labels
├── lib/
│   ├── gemeente-auth.ts              # isActief check
│   └── whatsapp/belastbaarheidstest.ts  # Alarm detectie fix
├── prisma/
│   └── schema.prisma                  # lat/lng velden
```

---

## Wat NIET meer relevant is uit eerdere plannen

| Eerder gepland | Waarom niet meer relevant/urgent |
|----------------|-------------------------------|
| Content migratie naar database | Grootste deel al gedaan (artikelen, hulpbronnen, intake). Overige items werken prima hardcoded |
| PWA uitbreiding | Basis PWA werkt al (manifest + service worker). Native app niet nodig |
| SOS-knop | Mantelzorglijn telefoon staat overal al. Crisis-detectie zit in Ger |
| Weekplan met favorieten | Complexe feature met weinig bewezen vraag. Eerst basisflow goed maken |
| Actiekaarten concept | Te abstract. Ger + buddymatching biedt concreter resultaat |

---

## Samenvatting

Dit plan focust op vier dingen die het meeste verschil maken:

1. **Ger is het gezicht** — niet verstopt maar centraal, op de homepage en het dashboard
2. **Buddys vinden die passen** — matchpercentage + kaart maakt het concreet en vertrouwenwekkend
3. **Eén hulpvragenflow** — niet twee losse systemen, maar zorgtaak → buddy of organisatie in één beweging
4. **Gemeenten goed onboarden** — wizard voor snelle setup + automatische opvolging na balanstest (e-mail, check-in, alarmnotificatie)

De technische basis (7 AI agents, 10 zorgtaken, balanstest, profielen met twee locaties, gemeenteportaal) is er al. Nu gaat het om het verbinden van die elementen tot een samenhangende ervaring — zowel voor eindgebruikers als voor gemeenten.
