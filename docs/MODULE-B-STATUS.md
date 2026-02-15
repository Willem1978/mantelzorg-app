# Module B: Personalisatie & Engagement - Status Overzicht

Laatst bijgewerkt: 2026-02-15

---

## B1. Welkomstflow & Onboarding

### Afgerond
- [x] 5-stappen onboarding welkomstflow (`src/components/Onboarding.tsx`)
  - Stap 1: Welkom met Ger-avatar
  - Stap 2: Gemeente zoeken (PDOK) + wie zorg je voor
  - Stap 3: Zorgsituatie (uren/week + duur)
  - Stap 4: App-uitleg (functies overzicht)
  - Stap 5: Klaar + doorverwijzing naar belastbaarheidstest
- [x] Onboarding profiel API (`/api/user/onboarding-profiel`) - slaat gemeente, zorgontvanger, uren, duur op
- [x] DashboardShell integratie - toont Onboarding voor nieuwe gebruikers
- [x] Scheiding Onboarding (nieuw) vs Tutorial (herbekijken vanuit profiel)
- [x] Middleware bescherming voor `/onboarding` route

### Nog te doen
- [ ] B1.2: Progressieve onboarding (week 1-4 stapsgewijs functies introduceren)
  - Week 1: Alleen dashboard + belastbaarheidstest
  - Week 2: Unlock leren-sectie
  - Week 3: Unlock hulpvragen
  - Week 4: Volledig platform beschikbaar
- [ ] Onboarding analytics (welke stap wordt het vaakst overgeslagen)
- [ ] Terugkeer-flow als gebruiker onboarding halverwege verlaat

---

## B2. Dynamisch Hulpadvies (Dashboard Personalisatie)

### Afgerond
- [x] Trend motivatie-banner op dashboard (score verbeterd/verslechterd)
- [x] "Aanbevolen voor jou" artikelen-sectie (3 artikelen op basis van belastingNiveau)
  - LAAG: zelfzorg, praktische-tips
  - GEMIDDELD: rechten, praktische-tips, zelfzorg
  - HOOG: zelfzorg, rechten, financieel
- [x] "Jouw reis" mijlpalen-tijdlijn (registratie, profiel, eerste test, favoriet, check-in, score verbeterd)
- [x] Welzijn trend bar chart op dashboard (kleur per score)
- [x] Favorieten query in dashboard API

### Nog te doen
- [ ] B2.2: Slimme aanbevelingen engine
  - Seizoensgebonden content (winter: "warm houden", zomer: "respijtzorg vakanties")
  - Eerder bekeken artikelen uitsluiten
  - Aanbevelingen op basis van check-in antwoorden
- [ ] Gemeentenieuws automatisch tonen voor gebruikers uit die gemeente
- [ ] "Vergelijkbare mantelzorgers lezen ook..." sectie
- [ ] Gepersonaliseerde tips op basis van zorgsituatie (type zorgontvanger)

---

## B3. Check-in Systeem Uitbreiding

### Afgerond
- [x] Slimme frequentie op basis van belastingNiveau
  - LAAG: maandelijks (30 dagen)
  - GEMIDDELD: 2x per maand (14 dagen)
  - HOOG: wekelijks (7 dagen)
- [x] Contextuele opvolgingssuggesties na check-in
  - Emotioneel zwaar → Praten met iemand
  - Huishouden/zorgtaken → Hulp zoeken bij taken
  - Tijd voor mezelf → Tips voor zelfzorg
  - Administratie → Je rechten als mantelzorger
  - Moe → Rust en ontspanning
  - Geen steun → Hulp in jouw gemeente
- [x] Trend-analyse grafiek op dashboard (welzijn over tijd)

### Nog te doen
- [ ] WhatsApp check-in - Automatisch bericht via WhatsApp (vereist WhatsApp Business API)
- [ ] Buddy-notificatie bij sterke daling (indien MantelBuddy gekoppeld)
- [ ] Push-notificatie herinneringen voor check-in
- [ ] Check-in streaks / beloningen ("5 check-ins op rij!")

---

## Bestanden overzicht

### Aangemaakte bestanden
- `src/components/Onboarding.tsx` - 5-stappen welkomstflow
- `src/app/api/user/onboarding-profiel/route.ts` - Onboarding profiel API

### Gewijzigde bestanden
- `src/components/layout/DashboardShell.tsx` - Onboarding integratie
- `src/middleware.ts` - /onboarding route bescherming
- `src/app/api/dashboard/route.ts` - Aanbevolen artikelen, mijlpalen, favorieten
- `src/app/(dashboard)/dashboard/page.tsx` - Trend banner, artikelen, mijlpalen, welzijn chart
- `src/app/check-in/page.tsx` - Contextuele opvolgingssuggesties
- `src/app/api/check-in/route.ts` - Slimme frequentie

---

## Samenvatting

**Afgerond:** ~60% van Module B is gebouwd en functioneel
**Belangrijkste openstaand:** Progressieve onboarding (week 1-4), slimme aanbevelingen engine, WhatsApp check-in, buddy-notificaties
**Externe afhankelijkheden nodig voor:** WhatsApp (Business API), Push-notificaties (Web Push / FCM)
