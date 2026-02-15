# Module A: Beheeromgeving - Status Overzicht

Laatst bijgewerkt: 2026-02-15

---

## A1. Authenticatie & Autorisatie

### Afgerond
- [x] Admin login pagina (`/beheer/login`) met credentials-based auth
- [x] Rolgebaseerde toegang (ADMIN check op alle `/beheer/*` en `/api/beheer/*` routes)
- [x] Middleware bescherming voor `/beheer/*` routes
- [x] Audit logging systeem (`src/lib/audit.ts`) geintegreerd in alle beheer-API routes
- [x] Admin account aanmaken via seed script (`w.veenendaal@livelife.nl`)
- [x] Eenmalig setup endpoint (`/api/beheer/setup`) voor eerste admin-creatie

### Nog te doen
- [ ] Uitgebreide rollen: SUPER_ADMIN, GEMEENTE_ADMIN (schema + middleware)
- [ ] 2FA (twee-factor authenticatie) - optioneel, vereist TOTP library
- [ ] Sessie-invalidatie bij rolwijziging (sessionVersion is al aanwezig in schema)

---

## A2. Content Management (CMS)

### Afgerond
- [x] Volledige CRUD interface voor artikelen (`/beheer/artikelen`)
- [x] Categorie-toewijzing (praktische-tips, zelfzorg, rechten, financieel, gemeentenieuws)
- [x] Publicatiestatus (CONCEPT / GEPUBLICEERD / GEARCHIVEERD)
- [x] Publicatiedatum met datumpicker + automatische filtering op datum
- [x] Koppeling aan belastbaarheidsniveau (ALLE / LAAG / GEMIDDELD / HOOG)
- [x] Sorteervolgorde
- [x] Gemeentenieuws met zoekbare gemeente-dropdown (PDOK API)
- [x] Database migratie: alle 20 artikelen + 6 gemeente-nieuwsitems van `artikelen.ts` naar database
- [x] Public API endpoint `/api/artikelen` voor frontend
- [x] Frontend pagina's (`/leren/*`) omgezet naar database-queries
- [x] Audit logging op alle CRUD operaties

### Nog te doen
- [ ] Rich text editor voor uitgebreide artikelinhoud (TipTap of Lexical)
- [ ] Tags/zoekwoorden systeem voor artikelen
- [ ] Media-upload voor afbeeldingen bij artikelen (vereist S3/Cloudinary)
- [ ] Preview-functie (hoe ziet artikel eruit voor gebruiker)
- [ ] Hulpbronnen: bulk import/export (CSV)
- [ ] Organisatie-verificatie workflow
- [ ] Zorgorganisatie-kaart (visuele kaart per gemeente)
- [ ] Notificatie-triggers bij nieuw gemeentenieuws (vereist push/email service)

---

## A3. Gebruikersbeheer

### Afgerond
- [x] Gebruikerstabel met alle relevante kolommen (naam, email, rol, gemeente, belasting, status)
- [x] Zoekfunctie op naam, email, telefoonnummer
- [x] Filter op rol (Mantelzorger, MantelBuddy, Organisatie, Beheerder)
- [x] Paginering
- [x] CSV export (`/api/beheer/gebruikers/export`) met export-knop op pagina
- [x] Gebruiker detailpagina (`/beheer/gebruikers/[id]`) met:
  - Profiel informatie (naam, email, telefoon, gemeente, rol, registratiedatum)
  - Check-in overzicht met welzijn-kleuring
  - Admin notities (intern, niet zichtbaar voor gebruiker)
  - Acties: activeren/deactiveren, wachtwoord resetten, rol wijzigen, account verwijderen
- [x] Audit logging op alle gebruikersbeheer acties
- [x] Zelfverwijder-bescherming (admin kan eigen account niet verwijderen)
- [x] Schema uitbreidingen: `isActive` en `adminNotities` op User model

### Nog te doen
- [ ] Filter op registratieperiode (datum-range)
- [ ] Filter op activiteit (actief/inactief laatste 30 dagen)
- [ ] Filter op alarmstatus (gebruikers met actieve alarmen)
- [ ] Activiteitslog per gebruiker (logins, tests, hulpvragen)
- [ ] Belastbaarheidshistorie grafiek (alle testresultaten over tijd)
- [ ] MantelBuddy beheer uitbreiding:
  - [ ] VOG-verificatie workflow (checklist)
  - [ ] Training-tracking details
  - [ ] Matching overzicht (buddy <-> mantelzorger koppelingen)
- [ ] Automatische escalatie e-mails bij kritieke alarmen (vereist mailservice)

---

## A4. Systeem & Instellingen

### Afgerond
- [x] Instellingen pagina (`/beheer/instellingen`) met:
  - Systeemoverzicht (aantal gebruikers, mantelzorgers, buddies, artikelen, alarmen, audit logs)
  - Belastbaarheidstest drempelwaardes configuratie (UI)
  - Snelle acties (export, audit log, alarmen, gebruikersbeheer)
  - Applicatie-informatie
- [x] Instellingen API (`/api/beheer/instellingen`)
- [x] Audit log pagina (`/beheer/audit`) met filtering op entiteit/actie en paginering
- [x] Audit log API (`/api/beheer/audit`)
- [x] Beheer navigatie sidebar met alle menu-items

### Nog te doen
- [ ] Drempelwaardes persistent opslaan (nu alleen UI, niet opgeslagen in DB - vereist Settings model)
- [ ] Email-templates beheren (welkomstmail, wachtwoord reset, alarm) - vereist email service
- [ ] WhatsApp-templates beheren - vereist WhatsApp Business API
- [ ] Statistieken dashboard uitbreiden:
  - [ ] Aantal actieve gebruikers per week/maand (grafiek)
  - [ ] Gemiddelde belastbaarheidsscore per gemeente
  - [ ] Meest bezochte artikelen
  - [ ] Conversie registratie -> onboarding voltooid
  - [ ] Aantal hulpvragen gesteld vs beantwoord

---

## Bestanden overzicht

### Aangemaakte bestanden
- `src/lib/audit.ts` - Audit logging helper
- `src/app/api/beheer/audit/route.ts` - Audit log API
- `src/app/api/beheer/gebruikers/export/route.ts` - CSV export
- `src/app/api/beheer/instellingen/route.ts` - Instellingen API
- `src/app/api/beheer/setup/route.ts` - Eenmalig admin setup
- `src/app/api/artikelen/route.ts` - Public artikelen API
- `src/app/beheer/audit/page.tsx` - Audit log viewer
- `src/app/beheer/instellingen/page.tsx` - Instellingen pagina

### Gewijzigde bestanden
- `prisma/schema.prisma` - isActive, adminNotities op User
- `prisma/seed.ts` - Admin user + 26 artikelen
- `src/app/api/beheer/artikelen/route.ts` - Audit logging
- `src/app/api/beheer/artikelen/[id]/route.ts` - Audit logging
- `src/app/api/beheer/gebruikers/[id]/route.ts` - DELETE, deactivate, password reset, notes
- `src/app/api/beheer/mantelbuddies/[id]/route.ts` - Audit logging
- `src/app/api/beheer/alarmen/[id]/route.ts` - Audit logging
- `src/app/beheer/layout.tsx` - Navigatie uitgebreid
- `src/app/beheer/artikelen/page.tsx` - Publicatiedatum, gemeentenieuws
- `src/app/beheer/gebruikers/page.tsx` - Export knop
- `src/app/beheer/gebruikers/[id]/page.tsx` - Volledig herbouwd met acties
- `src/app/(dashboard)/leren/page.tsx` - Database queries
- `src/app/(dashboard)/leren/[categorie]/page.tsx` - Database queries
- `src/app/(dashboard)/leren/gemeente-nieuws/page.tsx` - Database queries
- `src/hooks/useNieuwsBadge.ts` - Database queries

---

## Samenvatting

**Afgerond:** ~70% van Module A is gebouwd en functioneel
**Belangrijkste openstaand:** Rich text editor, media-upload, geavanceerde filters, activiteitslog/grafieken, email/WhatsApp templates, statistieken dashboard
**Externe afhankelijkheden nodig voor:** Media-upload (S3), email (SendGrid/Resend), WhatsApp (Business API), 2FA (TOTP)
