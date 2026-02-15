# Module C: UI/UX Optimalisatie voor Oudere Gebruikers - Status Overzicht

Laatst bijgewerkt: 2026-02-15

---

## C1. Visueel Ontwerp

### C1.1 Typografie & Leesbaarheid

#### Afgerond
- [x] Base font-size verhoogd van 16px naar 18px
- [x] Regelafstand verhoogd naar 1.7
- [x] Atkinson Hyperlegible als primair lettertype (via Google Fonts CDN)
- [x] Geist Sans als fallback font via next/font
- [x] Grotere section titles (1.125rem → 1.375rem)
- [x] Grotere stat labels (0.75rem → 0.875rem)
- [x] Grotere badges (0.75rem → 0.875rem)
- [x] Grotere score badges (0.875rem → 1rem)
- [x] Grotere mobile nav labels (0.75rem → 0.8125rem)
- [x] Grotere list item subtitles (0.875rem → 1rem)
- [x] Letter-spacing 0.01em voor betere leesbaarheid
- [x] Tekst vergrotingsmodus (20px) via profiel toggle

#### Nog te doen
- [ ] WCAG AAA contrast audit (7:1 ratio) op alle tekst-elementen
- [ ] Heading hierarchy review (24-32px consistent)

### C1.2 Knoppen & Interactie-elementen

#### Afgerond
- [x] ConfirmDialog component voor destructieve acties (`src/components/ui/ConfirmDialog.tsx`)
- [x] Min-height 48-52px op alle ker-btn varianten

#### Nog te doen
- [ ] Audit alle knoppen: geen icon-only knoppen (altijd tekst erbij)
- [ ] Generieke knoplabels vervangen:
  - "Submit" → "Verstuur mijn antwoord"
  - "Next" → "Ga verder"
  - "Delete" → "Verwijder"
- [ ] ConfirmDialog toepassen bij alle destructieve acties (profiel verwijderen, uitloggen, etc.)
- [ ] Consistent hover/focus states controleren

### C1.3 Kleurgebruik

#### Afgerond
- [x] Hoog contrast modus toggle in profiel (`src/contexts/AccessibilityContext.tsx`)
- [x] CSS variabelen voor hoog contrast (--muted-foreground, --border, --border-strong)
- [x] Hoog contrast werkt in zowel light als dark mode

#### Nog te doen
- [ ] Audit: kleur nooit als enige indicator — altijd icoon/tekst erbij
  - Score badges: check of er naast kleur ook tekst/icoon staat
  - Alarmen: check of er naast rood ook een tekst-label is
- [ ] Consistent kleurbetekenis audit (groen=positief, oranje=waarschuwing, rood=urgent, blauw=info)

### C1.4 Layout & Navigatie

#### Afgerond
- [x] Breadcrumbs component (`src/components/ui/Breadcrumbs.tsx`)
- [x] Breadcrumbs op leren/[categorie] pagina
- [x] Breadcrumbs op gemeente-nieuws pagina
- [x] Fixed bottom navigation (MobileNav) al aanwezig

#### Nog te doen
- [ ] "Terug"-knop op alle subpagina's (check-in detail, hulpvragen detail, etc.)
- [ ] Max 3-4 keuzes per scherm review
- [ ] Geen scrollbare tabellen op mobiel — review

---

## C2. Tekstuele Begeleiding

### C2.1 Pagina-introductieteksten

#### Afgerond
- [x] PageIntro component (`src/components/ui/PageIntro.tsx`)
- [x] Dashboard: introductietekst toegevoegd
- [x] Leren: introductietekst toegevoegd
- [x] Profiel: introductietekst toegevoegd
- [x] Belastbaarheidstest: had al uitgebreide intro

#### Nog te doen
- [ ] Hulpvragen pagina: PageIntro toevoegen ("Hier vind je organisaties bij jou in de buurt...")
- [ ] MantelBuddy pagina: PageIntro toevoegen (als die pagina bestaat)
- [ ] Balanstest resultaten pagina: warm begeleidende tekst

### C2.2 Contextuele hulpteksten

#### Afgerond
- [x] CSS voor tooltips (.ker-tooltip)
- [x] CSS voor step indicator (.ker-step-indicator)
- [x] CSS voor foutmeldingen (.ker-error-message)
- [x] CSS voor succesmeldingen (.ker-success-message)

#### Nog te doen
- [ ] Echte tooltips toepassen op formuliervelden:
  - Email: "Vul hier je e-mailadres in, bijvoorbeeld jan@gmail.com"
  - Telefoon: "Je telefoonnummer, bijvoorbeeld 06-12345678"
  - Adres: "Begin met typen, we zoeken het voor je op"
- [ ] Foutmeldingen verbeteren op login/registratie/profiel forms:
  - "Invalid email" → "Dit e-mailadres klopt niet. Controleer of je een @ hebt gebruikt."
  - "Field required" → "Vergeet niet om je naam in te vullen"
- [ ] Bevestigingsmeldingen na acties ("Je antwoord is opgeslagen. Goed gedaan!")
- [ ] Step indicator toepassen in belastbaarheidstest ("Stap 2 van 4 — Je bent al halverwege!")

### C2.3 Hulp & Uitleg systeem

#### Afgerond
- [x] HelpButton floating "Hulp nodig?" knop met FAQ overlay (`src/components/ui/HelpButton.tsx`)
- [x] Mantelzorglijn belknop in hulpmenu
- [x] Veelgestelde vragen (5 items)
- [x] PageHelp "Hoe werkt dit?" component (`src/components/ui/PageHelp.tsx`)
- [x] HelpButton geïntegreerd in DashboardShell

#### Nog te doen
- [ ] PageHelp plaatsen op specifieke pagina's:
  - Dashboard: "Zo werkt je overzicht" (3 stappen)
  - Balanstest: "Zo werkt de balanstest" (4 stappen)
  - Hulpvragen: "Zo vind je hulp" (3 stappen)
  - Leren: "Zo vind je informatie" (3 stappen)
- [ ] "Niet meer tonen" optie in PageHelp (localStorage)
- [ ] Video-uitleg optie voor complexe functies (nice-to-have)
- [ ] WhatsApp optie in hulpmenu (nice-to-have)

---

## C3. Toegankelijkheid (OVERGESLAGEN - later oppakken)

### Nog te doen
- [ ] Volledige WCAG 2.1 AA compliance audit
- [ ] Screen reader support met aria-labels
- [ ] Keyboard navigatie — alle functies zonder muis
- [ ] Taalaudit — alle teksten laten controleren op B1-niveau

---

## C4. Mobiele Ervaring

#### Afgerond
- [x] PWA manifest.json (`public/manifest.json`)
- [x] Service worker met network-first caching (`public/sw.js`)
- [x] Apple touch icon configuratie
- [x] Viewport meta tags (themeColor, maximumScale: 5)
- [x] SW registratie in DashboardShell
- [x] Verminder animaties optie (prefers-reduced-motion + toggle)
- [x] safe-area-inset support in footer nav

#### Nog te doen
- [ ] **Echte PWA iconen** maken (nu placeholder bestanden in public/icons/)
- [ ] Offline modus verbeteren: favorieten en recent gelezen artikelen cachen
- [ ] Swipe-navigatie voor artikelen bladeren (nice-to-have)
- [ ] Push notificaties (complex — vereist backend + VAPID keys)

---

## Bestanden aangemaakt in Module C

| Bestand | Beschrijving |
|---|---|
| `src/components/ui/PageIntro.tsx` | Warme welkomstblokken per pagina |
| `src/components/ui/Breadcrumbs.tsx` | Navigatie-broodkruimels |
| `src/components/ui/HelpButton.tsx` | Floating "Hulp nodig?" knop + FAQ overlay |
| `src/components/ui/PageHelp.tsx` | "Hoe werkt dit?" stap-voor-stap uitleg overlay |
| `src/components/ui/ConfirmDialog.tsx` | Bevestigingsdialoog voor destructieve acties |
| `src/components/AccessibilitySettings.tsx` | Weergave-instellingen (tekst, contrast, animaties) |
| `src/contexts/AccessibilityContext.tsx` | Context voor toegankelijkheidsinstellingen |
| `public/manifest.json` | PWA manifest |
| `public/sw.js` | Service worker |
| `public/icons/icon-192.png` | PWA icoon (placeholder) |
| `public/icons/icon-512.png` | PWA icoon (placeholder) |
