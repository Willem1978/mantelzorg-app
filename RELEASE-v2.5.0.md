# MantelBuddy v2.5.0 - Baseline Release Notes

**Releasedatum:** 22 februari 2026
**Tag:** `v2.5.0`
**Status:** Stabiele baseline-release
**Vorige release:** v2.4.0 (10 februari 2026)

---

## Overzicht

Dit is een baseline-release die als referentiepunt dient voor verdere doorontwikkeling. Versie 2.5.0 bevat een volledig vernieuwde content-architectuur, uitgebreide artikelinhoud op B1-taalniveau, bugfixes, type-safety verbeteringen en database-optimalisaties.

---

## Wat is nieuw in v2.5.0

### 1. ContentModal - Klikbare Artikelkaarten

**Component:** `src/components/ui/ContentModal.tsx`

- Artikelkaarten zijn nu klikbaar en openen een detail-modal
- **Mobiel**: Bottom sheet die van onderaf omhoog schuift (max 85vh)
- **Desktop**: Centered popup met max-width 600px
- Sluit via X-knop rechtsboven of ESC-toets (keyboard accessibility)
- Bevat optioneel: Bellen-knop (tel: link) en Website-knop (externe link)
- Gebruikt op: Leren-categoriepagina's, Hulpvragen, Gemeente-nieuws

### 2. B1-niveau Artikelinhoud (44 artikelen)

**Bestanden:** `src/data/artikel-inhoud.ts`, `src/data/artikel-inhoud-2.ts`

Alle informatieartikelen zijn voorzien van volledige inhoud in begrijpelijk Nederlands:
- **Emotioneel welzijn**: Omgaan met schuldgevoel, rouw, eenzaamheid, boosheid, grenzen stellen
- **Praktische hulp**: Dagritme, zorgdossier, medicijnen, aanpassingen huis, nachtrust
- **Rechten & regelingen**: Wmo, Wlz, mantelzorgwaardering, arbeid en zorg, PGB, cliëntondersteuning
- **Financieel**: Toeslagen, belastingaftrek, PGB budget, juridische zaken, verzekeringen
- **Zelfzorg**: Ontspanning, bewegen, slaap, voeding, sociale contacten

Elke artikel bevat:
- Markdown-formatted inhoud
- Bronvermelding (MantelzorgNL, Rijksoverheid, CAK, SVB, etc.)
- Bronlabel (Landelijk, Gemeente/Wmo, Zorgverzekeraar/Zvw, Wlz)
- Emoji-icoon

### 3. Naamgeving: "Vervangende mantelzorg"

Overal in de app is "Respijtzorg" hernoemd naar "Vervangende mantelzorg" - de officiële en begrijpelijkere term.

### 4. Bugfixes

| Bug | Locatie | Fix |
|-----|---------|-----|
| Modal niet sluitbaar met ESC-toets | ContentModal.tsx | `document.addEventListener("keydown")` handler |
| Null pointer bij favorieten toggle | FavorietButton.tsx | Null-check: `data?.favoriet?.id` |
| Case-sensitive moeilijkheid check | hulpvragen/page.tsx | `.toUpperCase()` voor WhatsApp/web compatibiliteit |
| Dark mode achtergrond wit | hulpvragen/page.tsx | `bg-white` → `bg-card` |
| Unused variabele `taken` | hulpvragen/page.tsx | Verwijderd |
| formatDatum inside component | gemeente-nieuws/page.tsx | Verplaatst buiten component |
| ngrok header in productie | next.config.ts | Conditional: alleen in development |
| Dubbele sluiten-knop modal | ContentModal.tsx | Verwijderd uit footer, alleen X bovenaan |

### 5. TypeScript Type-Safety

Vervangen `any` types door proper interfaces:

```typescript
// hulpvragen/page.tsx
interface Categorie { naam: string; icon: string; kort: string; routeLabel?: string | null }
interface CategorieGroep { groep: string; categorieen: Categorie[] }
interface HulpvraagCategorie { value: string; label: string; icon: string; hint: string }

// leren/page.tsx
interface LerenCategorie { id: string; title: string; description: string; emoji: string; href: string }

// leren/[categorie]/page.tsx
// child parameter getypt: { slug: string; naam: string; beschrijving: string }
```

### 6. Error Logging

11 stille `catch {}` blokken vervangen door `console.error()` in:
- `leren/page.tsx` (7 catch-blokken)
- `hulpvragen/page.tsx` (1 catch-blok)
- `leren/[categorie]/page.tsx` (1 catch-blok)
- `leren/gemeente-nieuws/page.tsx` (1 catch-blok)
- `FavorietButton.tsx` (1 catch-blok)

### 7. Database Performance Indexes

Toegevoegd aan Prisma schema en uitgevoerd in Supabase:

```sql
CREATE INDEX "Account_userId_idx" ON "Account"("userId");
CREATE INDEX "Session_userId_idx" ON "Session"("userId");
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");
CREATE INDEX "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");
CREATE INDEX "BelastbaarheidTest_caregiverId_idx" ON "BelastbaarheidTest"("caregiverId");
CREATE INDEX "HelpRequest_caregiverId_idx" ON "HelpRequest"("caregiverId");
```

---

## Gewijzigde bestanden

| Bestand | Type wijziging |
|---------|---------------|
| `src/components/ui/ContentModal.tsx` | ESC-handler, footer cleanup |
| `src/components/FavorietButton.tsx` | Null-check, error logging |
| `src/app/(dashboard)/hulpvragen/page.tsx` | Interfaces, case-fix, dark mode, error logging |
| `src/app/(dashboard)/leren/page.tsx` | Interface, error logging |
| `src/app/(dashboard)/leren/[categorie]/page.tsx` | Typed parameter, error logging |
| `src/app/(dashboard)/leren/gemeente-nieuws/page.tsx` | formatDatum moved, error logging |
| `src/data/artikel-inhoud.ts` | Nieuw: B1 artikelinhoud (deel 1) |
| `src/data/artikel-inhoud-2.ts` | Nieuw: B1 artikelinhoud (deel 2) |
| `next.config.ts` | ngrok header conditional |
| `prisma/schema.prisma` | Database indexes |
| `CHANGELOG.md` | v2.5.0 entry |
| `DOORONTWIKKELPLAN.md` | Status update v1.1 |

---

## Git Commits (sinds v2.4.0)

| Hash | Beschrijving |
|------|-------------|
| `3981155` | Add full B1-level article content with clickable modal detail view |
| `a267dd8` | Replace 'Respijtzorg' with 'Vervangende mantelzorg' throughout the app |
| `a0cbacf` | Remove duplicate close button from modal footer, keep only top-right X |
| `b984a79` | Fix bugs: ESC key for modal, null checks, case-sensitivity, dark mode |
| `015992b` | Add missing database indexes and restrict ngrok header to dev only |
| `27fba92` | Replace any types with proper interfaces, add error logging to catch blocks |

---

## Hoe deze versie terughalen

```bash
# Tag bekijken
git show v2.5.0

# Terugzetten naar deze versie
git checkout v2.5.0

# Nieuwe branch maken vanaf deze versie
git checkout -b mijn-branch v2.5.0
```

---

## Tech Stack

| Component | Versie |
|-----------|--------|
| Next.js | 16.1.4 |
| React | 19.2.3 |
| TypeScript | 5.9.3 |
| Prisma ORM | 5.22.0 |
| NextAuth.js | 5.0.0-beta.30 |
| Tailwind CSS | 4.x |
| Twilio (WhatsApp) | 5.12.0 |
| PostgreSQL | via Supabase |
| Hosting | Vercel |

---

## Deployment

- **Platform:** Vercel (automatische deploys vanuit `main` branch)
- **Database:** Supabase PostgreSQL
- **WhatsApp:** Twilio Sandbox
- **Branch:** `claude/setup-vercel-connection-nwNhg` → merge naar `main`

---

*Voor het volledige doorontwikkelplan, zie `DOORONTWIKKELPLAN.md`.*
*Voor de volledige versiegeschiedenis, zie `CHANGELOG.md`.*
