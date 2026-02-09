# Changelog

Alle belangrijke wijzigingen aan MantelBuddy worden hier gedocumenteerd.

Het formaat is gebaseerd op [Keep a Changelog](https://keepachangelog.com/nl/1.0.0/),
en dit project volgt [Semantic Versioning](https://semver.org/lang/nl/).

## [2.2.0] - 2026-02-09

### Toegevoegd
- **Informatieartikelen**: 5 artikelen per categorie (Praktische tips, Zelfzorg, Rechten, Financieel) met bronnen van MantelzorgNL, Rijksoverheid, Dementie.nl e.a.
- **Categorie subpagina's** (`/leren/[categorie]`): Dynamische pagina's met artikellijsten per categorie, hartjes en bronlinks
- **Gemeente nieuws** (`/leren/gemeente-nieuws`): Nieuwspagina met updates uit de gemeente van de mantelzorger en zorgvrager
- **Nieuw-indicator bolletje**: Rood bolletje op gemeente-nieuws met aantal ongelezen items (localStorage)
- **Artikelen databestand** (`src/data/artikelen.ts`): Centraal bestand met alle artikelen en gemeente-nieuws

### Gewijzigd
- **Leren hoofdpagina**: Gemeente-nieuws sectie bovenaan met dynamische gemeentenaam, artikelaantallen per categorie, compactere uitleg tekst

---

## [2.1.0] - 2026-02-09

### Toegevoegd
- **Favorieten systeem**: Hartje op elk item bij Hulp en Informatie pagina's om te bewaren
- **Favorieten pagina** (`/favorieten`): Gecategoriseerd overzicht van bewaarde items
- **Afvinken als afgerond**: Favorieten markeren als uitgevoerd (blijven in hun categorie)
- **Hart-icoon in navbar**: Badge met aantal favorieten, tussen zon en bel
- **FavorietButton component**: Herbruikbaar hart-knop met animatie
- **4 API endpoints**: Favorieten toevoegen, verwijderen, afvinken, bulk-check

### Gewijzigd
- **Navigatie**: "Leren" hernoemd naar "Informatie" (desktop) / "Info" (mobiel)
- **Leren pagina**: Titel naar "Informatie, leren en tips", hartjes op categoriekaarten
- **Hulpvragen pagina**: Hartjes op alle hulporganisaties (lokaal en landelijk), compactere header
- **Tekstuele begeleiding**: B1-niveau uitleg over favorieten op elke pagina
- **Favorieten pagina UX**: 4 gelijke categorietabs (2x2 grid), subtielere knoppen, afgeronde items binnen eigen categorie, rode verwijder-knop

### Technisch
- Nieuw `Favoriet` model in Prisma (type HULP/INFORMATIE, unieke constraint)
- Nieuw `FavorietType` enum
- Hart-bounce CSS animatie
- Custom event `favorieten-updated` voor real-time badge updates

---

## [2.0.0] - 2026-02-09 ⭐ Stabiele release

Eerste volledig afgeronde versie van MantelBuddy. Deze tag markeert de baseline voor verdere doorontwikkeling.

### Alle functionaliteit
- **WhatsApp Bot**: Belastbaarheidstest via WhatsApp met score-infographics
- **Dashboard**: Score-thermometer, urgentie-indicatie, zorgtaken met kleur-codering
- **Hulpvragen**: Categorieën met kleur-indicatoren en koppeling naar lokale hulporganisaties
- **Lokale hulp**: Hulporganisaties Nijmegen en Arnhem per taakcategorie (geen max limiet)
- **Authenticatie**: Magic link login, single-session, telefoonnummer koppeling
- **UX/UI**: Responsive design, B1 taalniveau, ouderenvriendelijk
- **Categorieën**: Inclusief Huisdieren en Plannen en organiseren

### Sinds v1.5.4
- Hulpvragen kleur-indicatoren per taakstatus
- UX/UI verbeteringen: toegankelijkheid en ouderenvriendelijkheid
- WhatsApp nummering consistent (menu altijd op 0)
- Tekstuele begeleiding verbeterd naar B1 niveau
- Responsive layout verbeteringen
- Uitbreiding hulporganisaties Nijmegen en Arnhem per taakcategorie
- Categorieën Huisdieren en Plannen en organiseren toegevoegd
- Telefoonnummer niet meer gewist bij profiel update
- Leren & Tips sectie verwijderd van dashboard

---

## [1.5.4] - 2025-02-07

### Gewijzigd
- **Dashboard thermometer**: Nummering (0/8/16/24) verwijderd, "Laatste meting:" toegevoegd bij datum
- **WhatsApp balansscore**: Link naar dashboard/rapport toegevoegd

### Opgelost
- **WhatsApp test opnieuw**: Fix voor bug waarbij "1" typen na score zien niet naar nieuwe test ging

## [1.5.3] - 2025-02-07

### Gewijzigd
- **Test/Check-in footer**: Vereenvoudigd - alleen "terug" knop, MB logo en actieknoppen verwijderd
- **WhatsApp berichten**: Dynamische nummering ("Typ je keuze 1 of 2" ipv hardcoded "1, 2 of 3")
- **Profiel pagina**: Telefoonnummer toont "-" ipv "undefined" wanneer niet ingevuld

## [1.5.2] - 2025-02-07

### Opgelost
- **Telefoonnummer bug**: Fix voor bug waarbij telefoonnummer als "undefined" string werd opgeslagen
  - Auth: Validatie toegevoegd om ongeldige telefoonwaarden te filteren
  - Profile API: Validatie toegevoegd bij opslaan telefoon
  - Database: Bestaande "undefined" waarden gefixed naar null

## [1.5.0] - 2025-02-07

### Toegevoegd
- **Dashboard thermometer**: Score wordt nu getoond als thermometer/voortgangsbalk
  - Balk wordt gevuld op basis van score (bijv. 13/24 = 54% gevuld)
  - Kleur verandert per niveau: groen (0-8), oranje (9-16), rood (17-24)
  - Streepjes tonen de zone-grenzen
  - Labels 0, 8, 16, 24 onder de balk

### Gewijzigd
- **Dashboard layout**: Score prominent boven thermometer, titel en datum in header

## [1.4.4] - 2025-02-07

### Gewijzigd
- **Dashboard urgentiebox**: "Zoek hulp" knop verwijderd, alleen Mantelzorglijn telefoonnummer getoond

## [1.4.3] - 2025-02-07

### Gewijzigd
- **Hulpvragen pagina**: "Stel een vraag" sectie vervangen door "Schakel de hulp van een MantelBuddy in!"
- **Hulpvragen pagina**: Nieuwe tekst over lokale vrijwillige MantelBuddies
- **Hulpvragen pagina**: Call-to-action knop "Vraag een MantelBuddy aan"

### Verwijderd
- **Hulpvragen pagina**: "Meer hulp zoeken? Zoek op Zorgkaart Nederland" sectie verwijderd

## [1.4.2] - 2025-02-07

### Gewijzigd
- **Dashboard score blok**: Cleaner design - compacter, overzichtelijker
- **Dashboard**: "Bekijk volledig rapport" link onderaan score blok ipv midden
- **Taak kleuren**: Klusjes (zwaar) krijgt nu rode arcering, Huishouden/Eten maken (matig) krijgen oranje arcering

### Opgelost
- Fix: Taaknamen mapping uitgebreid voor alle variaties (Eten maken, Klusjes in huis, etc.)
- Fix: Zorgtaken in hulpvragen pagina toonden geen kleur bij bepaalde taaknamen

## [1.4.1] - 2025-02-07

### Gewijzigd
- **Hulpvragen pagina**: "Kies hieronder waar je hulp bij zoekt" tekst verplaatst naar boven de tabknoppen
- **Urgentiebox**: Mantelzorglijn wordt nu als telefoonnummer getoond (030-2059059) ipv knop
- **Urgentiebox**: "Bekijk rapport" knop verwijderd uit urgentiebox

## [1.4.0] - 2025-02-07

### Gewijzigd
- **Dashboard score weergave**: Smiley vervangen door numerieke score (bijv. "12/24") in grote gekleurde cirkel
- **Score uitleg**: Toegevoegd bij score ("Score 0-8: Je houdt het goed vol..." etc.)
- **Urgentie sectie**: Bij hoge of gemiddelde belasting verschijnt nu een melding met tips en hulplinks
- **Zorgtaken kleuren**: Taken in hulpvragen pagina tonen nu correct hun moeilijkheidsniveau met kleuren

### Opgelost
- Fix: Zorgtaken telden niet correct omdat WhatsApp test "JA/SOMS/NEE" gebruikt ipv "MOEILIJK/GEMIDDELD/MAKKELIJK"
- Fix: Dashboard toonde 0/0/0 voor taken verdeling
- Fix: Hulpvragen pagina categorieën toonden geen kleur-indicators

### Technisch
- Uniforme moeilijkheid check functies die beide formats ondersteunen (web + WhatsApp)
- Dashboard API, dashboard pagina en hulpvragen pagina bijgewerkt

## [1.3.0] - 2025-02-07

### Toegevoegd
- **Telefoonnummer wijzigen in profiel**: Gebruikers kunnen nu hun 06-nummer aanpassen of ontkoppelen
- **Single-session login**: Bij inloggen op een nieuw apparaat worden andere browser-sessies automatisch uitgelogd
- **Session validatie**: Periodieke check (elke 30 sec + bij tab focus) of sessie nog geldig is
- **Melding bij uitloggen**: Duidelijke melding op login pagina wanneer je door andere sessie bent uitgelogd

### Gewijzigd
- Homepage: Inlogknop verwijderd uit header
- `/mantelzorger` pagina: Redirect nu direct naar `/login`
- Login pagina: Verbeterde tekst en prominente "Account aanmaken" knop
- WhatsApp buttons: Nu altijd als tekst met nummers (Twilio Sandbox ondersteunt geen interactieve buttons)

### Technisch
- Nieuw `sessionVersion` veld in User tabel (Prisma)
- Nieuwe API endpoint `/api/auth/validate-session`
- Nieuwe component `SessionValidator` met `useSessionValidator` hook

## [1.2.0] - 2025-02-07

### Toegevoegd
- WhatsApp sectie in profiel met QR code
- WhatsApp sectie in dashboard met QR code
- Telefoonnummer weergave in profiel

### Opgelost
- Fix: "undefined" bij WhatsApp nummer in profiel wanneer niet gekoppeld
- Fix: Magic link login werkt nu correct (client-side auth ipv server-side)

## [1.1.0] - 2025-02-07

### Toegevoegd
- SVG smileys voor emoticon weergave
- Korte magic links (`/m/[token]`) voor WhatsApp
- WhatsApp buttons met genummerde opties

### Gewijzigd
- Design system verbeteringen

## [1.0.0] - 2025-02-06

### Eerste release
- Balanstest (12 vragen belastbaarheidstest)
- Dashboard met overzicht
- Profiel beheer
- WhatsApp integratie via Twilio
- Magic link authenticatie
- Locatie zoeken via PDOK API
- Check-in functionaliteit
