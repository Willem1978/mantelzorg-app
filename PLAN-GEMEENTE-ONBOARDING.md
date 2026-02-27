# Plan: Gemeente Onboarding Flow

## Overzicht

Een helder stapsgewijs proces om een gemeente volledig te onboarden:
**Aanmaken → Activeren → Gebruikers → Lokale content → Balanstest opvolging**

---

## Huidige situatie (gaps)

| Probleem | Impact |
|----------|--------|
| Geen wizard/checklist — admin moet zelf tussen pagina's navigeren | Verwarrend, stappen worden vergeten |
| `isActief` wordt niet afgedwongen in gemeente-portaal | Inactieve gemeente kan nog inloggen |
| Gemeente-record en gebruiker-aanmaak zijn losgekoppeld | Twee aparte handmatige stappen |
| Geen e-mail bij uitnodiging gemeente-medewerker | URL moet handmatig gekopieerd worden |
| Na balanstest: geen e-mail, geen notificatie, geen geplande check-in | Gebruiker valt weg na test |
| WhatsApp-tests missen alarm-detectie | Kritieke signalen gemist |
| Logged-in users krijgen geen gemeente op hun test | Data mist in gemeente-portaal |

---

## Implementatie: 5 stappen

### Stap 1: Gemeente Onboarding Wizard (`/beheer/gemeenten/nieuw`)

**Nieuwe pagina** met een stapsgewijze wizard (stepper UI):

```
Stap 1/5: Gemeente kiezen
├── PDOK autocomplete (bestaand)
├── CBS code auto-invullen (bestaand)
└── Controleer of gemeente al bestaat → waarschuwing

Stap 2/5: Contactgegevens invullen
├── E-mail, telefoon
├── Website URL
├── WMO loket URL
└── Validatie: minstens e-mail OF telefoon verplicht

Stap 3/5: Lokale hulpbronnen koppelen
├── Automatisch zoeken naar bestaande hulpbronnen voor deze gemeente
├── Toon gevonden hulpbronnen met checkbox "koppelen"
├── Mantelzorgsteunpunt naam + URL invullen
├── Respijtzorg URL, dagopvang URL
└── Knop "Hulpbronnen later toevoegen" (optioneel)

Stap 4/5: Advies per belastingniveau
├── Tekstveld advies LAAG + organisatie koppelen
├── Tekstveld advies GEMIDDELD + organisatie koppelen
├── Tekstveld advies HOOG + organisatie koppelen
└── Standaard-template teksten als placeholder

Stap 5/5: Eerste beheerder aanmaken
├── E-mailadres invoeren
├── Naam invoeren
├── Rollen selecteren (COMMUNICATIE, HULPBRONNEN, BELEID of alles)
├── Keuze: direct account aanmaken OF uitnodigingslink genereren
└── Optioneel: uitnodigingsmail automatisch versturen
```

**Na voltooiing:** Gemeente wordt aangemaakt met `isActief: true`, checklist-overzicht getoond.

**Bestanden:**
- `src/app/beheer/gemeenten/nieuw/page.tsx` — wizard UI
- `src/app/api/beheer/gemeenten/onboarding/route.ts` — gecombineerd endpoint dat gemeente + eerste gebruiker aanmaakt
- Bestaande `src/app/beheer/gemeenten/page.tsx` — link toevoegen naar wizard

---

### Stap 2: Gemeente Activering & Handhaving

**Wijzigingen in bestaande code:**

1. **`src/lib/gemeente-auth.ts`** — `getGemeenteSession()` uitbreiden:
   - Check of `Gemeente.isActief === true` voor de gemeente van de ingelogde user
   - Zo nee → redirect naar foutpagina "Gemeente is gedeactiveerd"

2. **`src/app/beheer/gemeenten/page.tsx`** — voeg "Setup status" indicator toe:
   - Groen vinkje per voltooide stap (contactgegevens, hulpbronnen, advies, beheerder)
   - Percentage completeness badge
   - Knop "Onboarding hervatten" als niet alles af is

3. **`src/app/api/beheer/gemeenten/[id]/activeer/route.ts`** — nieuw endpoint:
   - POST: toggle `isActief`
   - Valideer dat minimale setup compleet is (naam + minstens 1 beheerder)
   - Audit log

---

### Stap 3: Lokale Content Zoeken & Koppelen

**Verbetering hulpbronnen-koppeling:**

1. **Auto-search bij gemeente aanmaak:**
   - Bij selectie van gemeente in wizard → automatisch `Zorgorganisatie` records zoeken met matching `gemeente` naam
   - Toon resultaten: "We vonden X hulpbronnen voor deze gemeente"
   - Checkbox om te bevestigen/deselecteren

2. **PDOK/externe bronnen zoeken (nieuw):**
   - Zoek in bestaande hulpbronnen-database op gemeente naam
   - Suggereer standaard hulpbronnen die elke gemeente zou moeten hebben:
     - Mantelzorgsteunpunt
     - WMO loket
     - Huisartsenpost
     - Respijtzorg
   - Template met vooringevulde categorieën

3. **Bulk-import verbetering:**
   - Link vanuit wizard naar bestaande import-functie
   - CSV template specifiek voor gemeente-hulpbronnen

**Bestanden:**
- `src/app/beheer/gemeenten/nieuw/page.tsx` — stap 3 van wizard
- `src/app/api/beheer/gemeenten/hulpbronnen-zoek/route.ts` — zoek bestaande hulpbronnen voor gemeente
- `src/components/beheer/GemeenteHulpbronnenZoek.tsx` — zoek-component

---

### Stap 4: Balanstest Opvolging Verbeteren

Dit is het cruciale deel — wat gebeurt er NADAT iemand de test doet:

#### 4a. E-mail na balanstest
**Nieuw:** Automatische e-mail na test-voltooiing met:
- Score samenvatting (LAAG/GEMIDDELD/HOOG)
- Top 3 aanbevelingen
- Link naar volledig rapport (`/rapport`)
- Gemeente-specifieke contactgegevens (uit `Gemeente` record)
- Voor HOOG: urgente hulplijnen (Mantelzorglijn, WMO loket)

**Bestand:** `src/lib/email/balanstest-resultaat.ts`
**Trigger in:** `src/app/api/belastbaarheidstest/route.ts` (na opslaan)

#### 4b. Check-in automatisch plannen
**Nieuw:** Na test-voltooiing direct een eerste check-in reminder instellen:
- HOOG belasting → check-in reminder na 1 week
- GEMIDDELD → na 2 weken
- LAAG → na 4 weken
- Via `Notification` record met `type: CHECK_IN_REMINDER`

**Bestand:** `src/lib/check-in/plan-check-in.ts`
**Trigger in:** `src/app/api/belastbaarheidstest/route.ts`

#### 4c. Gemeente-notificatie bij alarmen
**Nieuw:** Bij CRITICAL of HIGH alarm → notificatie naar gemeente:
- E-mail naar `Gemeente.contactEmail`
- Geanonimiseerd: "Er is een nieuw alarm (type: X, urgentie: Y) in uw gemeente"
- Link naar gemeente alarmen-pagina

**Bestand:** `src/lib/email/gemeente-alarm-notificatie.ts`
**Trigger in:** `src/app/api/belastbaarheidstest/route.ts` (na alarm-detectie)

#### 4d. Fix: gemeente op test voor ingelogde users
**Bug fix:** Wanneer een ingelogde user de test doet, wordt `gemeente` niet ingevuld.
- Haal `municipality` uit `Caregiver` profiel
- Vul `BelastbaarheidTest.gemeente` in met deze waarde

**Bestand:** `src/app/api/belastbaarheidstest/route.ts`

#### 4e. Fix: WhatsApp-tests alarm-detectie
**Bug fix:** WhatsApp-handler slaat alarm-detectie over.
- Voeg `checkAlarmindicatoren()` call toe aan WhatsApp handler

**Bestand:** `src/lib/whatsapp/belastbaarheidstest.ts`

---

### Stap 5: Dashboard "Opvolging" Overzicht

**Nieuw component op gemeente-dashboard:**

```
┌─────────────────────────────────────────┐
│ 📋 Opvolging                            │
├─────────────────────────────────────────┤
│ Nieuwe tests deze week:        12       │
│ Waarvan HOOG belasting:         3       │
│ Open alarmen:                   5       │
│ Geplande check-ins:            28       │
│ Check-ins niet uitgevoerd:      4  ⚠️   │
│                                         │
│ [Bekijk alarmen] [Bekijk rapportage]    │
└─────────────────────────────────────────┘
```

**Bestanden:**
- `src/components/gemeente/OpvolgingKaart.tsx`
- `src/app/api/gemeente/opvolging/route.ts`
- Update `src/app/gemeente/page.tsx` — kaart toevoegen

---

## Prioriteit & Volgorde van bouwen

| # | Onderdeel | Complexiteit | Impact |
|---|-----------|-------------|--------|
| 1 | Gemeente Onboarding Wizard (stap 1) | Hoog | Hoog |
| 2 | Activering handhaving (stap 2) | Laag | Medium |
| 3 | Balanstest gemeente-fix + WhatsApp fix (4d, 4e) | Laag | Hoog |
| 4 | E-mail na balanstest (4a) | Medium | Hoog |
| 5 | Gemeente alarm-notificatie (4c) | Medium | Hoog |
| 6 | Lokale content zoeken in wizard (stap 3) | Medium | Medium |
| 7 | Check-in planning (4b) | Medium | Medium |
| 8 | Opvolging dashboard-kaart (stap 5) | Laag | Medium |

**Geschatte totaal: ~15-20 bestanden nieuw/gewijzigd**
