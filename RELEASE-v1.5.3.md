# MantelZorg App v1.5.3 - Release Notes

**Releasedatum:** 16 februari 2026
**Tag:** `v1.5.3`
**Status:** Stabiele productie-release

---

## Overzicht

MantelZorg App is een uitgebreid ondersteuningsplatform voor mantelzorgers. Het biedt tools om de belasting van mantelzorgers in kaart te brengen, gepersonaliseerde hulpbronnen te vinden, en verbinding te maken met vrijwilligers (MantelBuddies) en lokale organisaties.

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
| jsPDF | 4.1.0 |
| PostgreSQL | via Prisma |

---

## Functionaliteit per Module

### 1. Authenticatie & Gebruikersbeheer

#### Registratie (`/register`)
- 3-staps registratieflow:
  1. Account aanmaken (e-mail, wachtwoord, optioneel telefoonnummer voor WhatsApp)
  2. Persoonlijke gegevens (naam, adres via PDOK-lookup)
  3. Zorgvrager-informatie (naam, relatie, adres)
- Privacy-toestemmingscheckboxen
- Automatisch inloggen na registratie

#### Inloggen (`/login`)
- E-mail + wachtwoord authenticatie
- Sessie-invalidatiewaarschuwingen bij meerdere sessies
- Wachtwoord-vergeten flow (`/wachtwoord-vergeten`, `/wachtwoord-reset`)
- WhatsApp-login via magic link (`/login-whatsapp`)
- E-mailverificatie (`/email-verificatie`)
- Uitnodigingslinks (`/uitnodiging/[token]`)
- Magic links (`/m/[token]`)
- Referral/redirect links (`/r/[code]`)

#### Sessiebeveiliging
- JWT-gebaseerde sessies (30 dagen geldig)
- Single-session enforcement: bij nieuwe login worden oude sessies ongeldig
- Sessieversie-tracking per gebruiker
- Middleware-bescherming op alle beschermde routes

#### Rollen
| Rol | Toegang |
|-----|---------|
| `CAREGIVER` | Dashboard, testen, hulpbronnen, profiel |
| `BUDDY` | MantelBuddy-functies |
| `ORG_MEMBER` | Organisatie-inzichten |
| `ORG_ADMIN` | Organisatiebeheer |
| `GEMEENTE_ADMIN` | Gemeenteportaal (sub-rollen: Communicatie, Hulpbronnen, Beleid) |
| `ADMIN` | Volledig beheerpaneel |

---

### 2. Dashboard (`/dashboard`)

Het centrale overzicht voor ingelogde mantelzorgers:

- **Persoonlijke begroeting** met Ger-avatar
- **Balansscore** met kleurgecodeerde thermometer:
  - Groen: LAAG (0-6 punten)
  - Oranje: GEMIDDELD (7-12 punten)
  - Rood: HOOG (13-24 punten)
- **Zorgtaken-overzicht**: verdeling licht/gemiddeld/zwaar
- **Score-trend** indicatoren (stijgend/dalend/stabiel)
- **Volgende stappen** - gepersonaliseerde aanbevelingen op basis van belastingsniveau
- **Zorgtaken met gekoppelde hulpbronnen**
- **Welzijnsgrafiek** uit maandelijkse check-ins
- **Aanbevolen artikelen** op basis van profiel
- **Mijlpalen/prestaties** tijdlijn
- **WhatsApp-integratie** met QR-code
- Cache-busting voor verse data

---

### 3. Belastbaarheidstest (`/balanstest`)

#### Test-flow
- 11 vragen over verschillende zorgtaken en -aspecten
- Gewogen scoresysteem (0-24 punten)
- Selectie van zorgtaken met moeilijkheidsniveau per taak
- Berekening totaal zorguren per week

#### Resultaten
- Belastingsniveau: LAAG / GEMIDDELD / HOOG
- Gepersonaliseerde aanbevelingen
- PDF-rapportgeneratie met jsPDF
- Score-visualisatie als afbeelding

#### Overzicht (`/balanstest/overzicht`)
- Lijst van alle afgenomen testen
- Scoretrends over tijd
- Taakmoeilijkheid-tracking
- Test-verwijderfunctie

#### Gasttoegang (`/belastbaarheidstest`)
- Standalone test zonder login
- Gastrapport (`/rapport-gast`)
- Optie om account aan te maken na test

---

### 4. Leren & Informatie (`/leren`)

#### Artikelen
- Categorieeen: Praktische tips, Zelfzorg, Rechten, Financieel
- Artikel-types: `ARTIKEL`, `GEMEENTE_NIEUWS`, `TIP`
- Status-workflow: Concept -> Gepubliceerd -> Gearchiveerd
- Filteren op belastingsniveau
- Favorieten-functionaliteit
- Ongelezen-artikelen teller

#### Gemeente-nieuws (`/leren/gemeente-nieuws`)
- Automatisch gefilterd op gemeente van de gebruiker
- Gelezen/ongelezen tracking
- Aantal nieuwe items in navigatie-badge

---

### 5. Hulpbronnen & Hulpvragen (`/hulpvragen`)

#### Hulpbronnen zoeken
- Twee tabbladen: hulp voor mantelzorger + hulp voor zorgvrager
- Filteren op categorie:
  - Persoonlijke verzorging
  - Huishoudelijke taken
  - Emotionele ondersteuning
  - Administratie
  - Vervoer
  - Respijtzorg
  - En meer
- Locatiegebaseerde resultaten (gemeente, woonplaats, wijk)
- Landelijke hulpbronnen altijd zichtbaar
- Zichtbaarheid per belastingsniveau (laag/gemiddeld/hoog)

#### Hulpvragen
- Gebruikers kunnen hulpvragen indienen
- Categorie en urgentieniveau selectie (LOW/NORMAL/HIGH/URGENT)
- Statustracking: OPEN -> IN_PROGRESS -> RESPONDED -> RESOLVED -> CLOSED
- Reactie van ondersteuningsteam

#### Favorieten (`/favorieten`)
- Opslaan van hulpbronnen en artikelen
- Types: HULP (organisaties) en INFORMATIE (artikelen)
- Snel toegankelijk vanuit dashboard

---

### 6. Maandelijkse Check-in

- 5-vragen welzijnsonderzoek (schaalscore)
- Meetpunten:
  - Algemeen welzijn
  - Fysieke gezondheid
  - Emotionele gezondheid
  - Werk-privebalans
  - Tevredenheid met ondersteuning
- Opmerkingen: hoogtepunten, uitdagingen, hulpbehoeften
- Trendvisualisatie op dashboard
- Maandelijkse cadans

---

### 7. Profiel (`/profiel`)

- Persoonlijke informatie bewerken
- Adresupdates via PDOK-lookup
- Zorgvrager-gegevens beheren
- WhatsApp-nummer koppelen

---

### 8. Agenda (`/agenda`)

- Kalenderweergave
- Evenement-types: zorgtaak, afspraak, zelfzorg, sociaal, werk, overig
- Begin/eindtijd, hele dag, terugkerend
- Herinneringsinstellingen
- Aangepaste kleuren

---

### 9. WhatsApp-integratie (Twilio)

#### Conversatieflow
Gebruikers communiceren via WhatsApp met het platform:

1. **Gastmenu** (niet-ingelogd):
   - Belastbaarheidstest starten
   - Registreren
   - Inloggen (magic link)
   - Spreken met medewerker

2. **Ingelogd menu**:
   - Test afnemen
   - Hulp vragen
   - Dashboard-link
   - Contact opnemen

3. **Testflow via WhatsApp**:
   - Vragen een voor een afgeleverd
   - Score berekend en opgeslagen
   - Optie om account aan te maken

4. **Onboarding via WhatsApp**:
   - Persoonlijke gegevens verzamelen
   - E-mail en wachtwoord instellen
   - Account aanmaken
   - Zorgvrager-gegevens

5. **Hulpverzoek via WhatsApp**:
   - Beschrijving en urgentie verzamelen
   - Opslaan als hulpvraag
   - Koppelen aan lokale organisaties

#### Technisch
- Twilio webhook: `/api/whatsapp/webhook`
- Sessiemanagement: in-memory sessie-tracking
- Interactieve knoppen en quick replies
- TwiML-formaat voor responses
- Media-ondersteuning (afbeeldingen, documenten)

---

### 10. MantelBuddy-systeem

#### Aanmelding vrijwilliger (`/word-mantelbuddy`)
- Persoonlijke gegevens
- Hulpvormen selectie: gesprek, boodschappen, vervoer, klusjes, oppas, administratie
- Beschikbaarheid: eenmalig, vast, beide
- Motivatie en ervaring
- Gemeente zoeken via PDOK

#### Statusworkflow
```
AANGEMELD -> IN_BEHANDELING -> VOG_AANGEVRAAGD -> GOEDGEKEURD
                                               -> AFGEWEZEN
                                               -> INACTIEF
```

#### Matching & Taken
- BuddyMatch: koppeling mantelzorger-vrijwilliger
  - Status: VOORGESTELD -> BUDDY_AKKOORD -> CAREGIVER_AKKOORD -> ACTIEF
- BuddyTaak: taken aangeboden door mantelzorger
  - Status: OPEN -> REACTIES -> TOEGEWEZEN -> VOLTOOID
- Beoordelingssysteem (1-5 sterren) op betrouwbaarheid, vriendelijkheid, kwaliteit
- Taakstatistieken per vrijwilliger

---

### 11. Beheerpaneel (`/beheer`) - ADMIN rol

#### Dashboard
- KPI-kaarten: Totaal gebruikers, Mantelzorgers, MantelBuddies, Alarmen, Gem. score, Organisaties
- Scoreverdeling-visualisatie (LAAG/GEMIDDELD/HOOG)
- Snelkoppelingen naar beheergebieden

#### Gebruikersbeheer (`/beheer/gebruikers`)
- Lijst alle gebruikers met filters (rol, status, datum)
- Individuele gebruikersdetails met bewerkfunctie
- Actief/inactief status toggle
- Exporteren naar Excel (`.xlsx`)

#### MantelBuddy-beheer (`/beheer/mantelbuddies`)
- Statusworkflow volgen en bijwerken
- VOG-verificatiestatus
- Training-voltooiing
- Beoordelingen en reviews inzien
- Filteren op status

#### Alarmenbeheer (`/beheer/alarmen`)
- Alarmtypes:
  - HOGE_BELASTING
  - KRITIEKE_COMBINATIE
  - VEEL_ZORGUREN
  - EMOTIONELE_NOOD
  - SOCIAAL_ISOLEMENT
  - FYSIEKE_KLACHTEN
- Urgentieniveaus: LOW, MEDIUM, HIGH, CRITICAL
- Afhandeling met notities en timestamp
- Tracking: wie heeft afgehandeld en wanneer

#### Contentbeheer (`/beheer/artikelen`)
- CRUD voor artikelen
- Categorieen: Praktische tips, Zelfzorg, Rechten, Financieel, Gemeente-nieuws
- Status: CONCEPT -> GEPUBLICEERD -> GEARCHIVEERD
- Doelgroep op belastingsniveau
- Publicatiedatum plannen
- Sorteervolgorde

#### Organisatiebeheer (`/beheer/hulpbronnen`)
- CRUD voor zorgorganisaties
- Types: Gemeente, Thuiszorg, Mantelzorgsteunpunt, Respijtzorg, Dagbesteding, Huisarts, Sociaal wijkteam, Vrijwilligers, Landelijk, Overig
- Dekkingsgebied: gemeente, woonplaats, wijk, provincie, landelijk
- Servicedetails: openingstijden, aanmeldprocedure, doelgroep, kosten
- Zichtbaarheid per belastingsniveau
- Data-verrijkingsfunctie

#### Audit Log (`/beheer/audit`)
- Alle beheeracties bijgehouden
- Gebruiker, actietype, entiteit, timestamp, IP-adres
- Zoeken en filteren

#### Instellingen (`/beheer/instellingen`)
- Systeemconfiguratie
- Feature toggles

---

### 12. Gemeenteportaal (`/gemeente`) - GEMEENTE_ADMIN rol

#### Dashboard
- K-anonimiteitscheck (minimaal 5 records voor statistieken)
- KPI-kaarten:
  - Totaal mantelzorgers in gemeente
  - Gemiddelde belastingsscore met trend
  - Actieve alarmen
  - Open hulpvragen
- Scoreverdeling grafiek met percentages
- Trendindicatoren: stijgend (rood), stabiel (grijs), dalend (groen)

#### Modules
| Module | Pad | Functie |
|--------|-----|---------|
| Gebruikers | `/gemeente/gebruikers` | Mantelzorgers in gemeente inzien |
| Hulpbronnen | `/gemeente/hulpbronnen` | Lokale organisaties beheren |
| Hulpvragen | `/gemeente/hulpvragen` | Hulpvragen afhandelen |
| Alarmen | `/gemeente/alarmen` | Hoge-belasting situaties monitoren |
| Content | `/gemeente/content` | Gemeente-nieuws publiceren |
| Demografie | `/gemeente/demografie` | Bevolkingsstatistieken en leeftijdsverdeling |
| Evenementen | `/gemeente/evenementen` | Lokale evenementen organiseren |
| Trends | `/gemeente/trends` | Historische trendanalyse |
| Rapportages | `/gemeente/rapportages` | Rapporten genereren en exporteren |

---

### 13. PDOK-integratie (Locatie)

- Adres zoeken: `/api/location/search`, `/api/location/address-search`
- Gemeente zoeken: `/api/pdok/gemeenten` (wildcard matching)
- Locatie-details opvragen: `/api/location/lookup`
- Gebruikt bij:
  - Registratie (adresinvoer)
  - Profiel (adreswijziging)
  - Hulpbronnen (locatiegebaseerd zoeken)
  - MantelBuddy-aanmelding (gemeente selectie)
- Retourneert: gemeente, woonplaats, postcode, straat

---

### 14. PDF-rapportgeneratie

- jsPDF + AutoTable voor rapportopmaak
- Inhoud:
  - Belastingsscore en niveau
  - Zorgtakenoverzicht met moeilijkheidsniveaus
  - Aanbevelingen op basis van score
  - Lokale hulpbronnen
- Score-visualisatie als embedded afbeelding
- Download via `/rapport` pagina

---

## Database Schema (Prisma/PostgreSQL)

### Kernmodellen
| Model | Beschrijving |
|-------|-------------|
| `User` | Gebruikersaccount (e-mail, wachtwoord, rol, gemeente) |
| `Caregiver` | Mantelzorgerprofiel (persoonsgegevens, zorgvrager, zorguren) |
| `MantelBuddy` | Vrijwilligersprofiel (hulpvormen, beschikbaarheid, status, beoordelingen) |

### Assessment
| Model | Beschrijving |
|-------|-------------|
| `BelastbaarheidTest` | Testresultaat (score 0-24, niveau, zorguren) |
| `BelastbaarheidAntwoord` | Individueel antwoord (vraag, score, wegingsfactor) |
| `ZorgtaakSelectie` | Geselecteerde zorgtaak (naam, moeilijkheid, uren) |
| `BelastbaarheidRapport` | Rapport (samenvatting, aandachtspunten, aanbevelingen, PDF) |
| `AlarmLog` | Alarm bij hoge belasting (type, urgentie, afhandeling) |

### Content & Organisaties
| Model | Beschrijving |
|-------|-------------|
| `Artikel` | Kennisbankartikelen (categorie, type, status, gemeente) |
| `Zorgorganisatie` | Hulpverlenende organisatie (type, dekking, zichtbaarheid) |
| `Organisation` | Koppelorganisatie voor gebruikers |
| `Favoriet` | Opgeslagen items (HULP/INFORMATIE) |

### Communicatie
| Model | Beschrijving |
|-------|-------------|
| `Notification` | Gebruikersnotificatie (type, titel, gelezen-status) |
| `HelpRequest` | Hulpvraag (categorie, urgentie, status, reactie) |
| `MonthlyCheckIn` | Maandelijkse welzijnscheck (5 scores + opmerkingen) |
| `CalendarEvent` | Agenda-item (type, tijd, herhaling, herinnering) |
| `Task` | Gebruikerstaak (categorie, prioriteit, status) |

### MantelBuddy
| Model | Beschrijving |
|-------|-------------|
| `BuddyMatch` | Koppeling mantelzorger-vrijwilliger |
| `BuddyTaak` | Aangeboden taak door mantelzorger |
| `BuddyTaakReactie` | Reactie van vrijwilliger op taak |
| `BuddyBeoordeling` | Beoordeling/review (scores 1-5) |

### Sessie & Tokens
| Model | Beschrijving |
|-------|-------------|
| `Session` | NextAuth sessie |
| `Account` | OAuth account-koppeling |
| `VerificationToken` | E-mailverificatie |
| `MagicLinkToken` | Wachtwoordloos inloggen |
| `PasswordResetToken` | Wachtwoord-reset |
| `InviteToken` | Uitnodigingslinks |
| `IntakeCategory/Question/Response` | Intake-vragenlijst |

---

## API-overzicht

### Publieke endpoints
| Endpoint | Methode | Beschrijving |
|----------|---------|-------------|
| `/api/auth/[...nextauth]` | GET/POST | NextAuth handler |
| `/api/auth/register` | POST | Registratie |
| `/api/auth/login` | POST | Inloggen |
| `/api/auth/forgot-password` | POST | Wachtwoord vergeten |
| `/api/auth/reset-password` | POST | Wachtwoord resetten |
| `/api/auth/verify-email` | POST | E-mail verificatie |
| `/api/auth/verify-magic-link` | POST | Magic link verificatie |
| `/api/auth/check-phone` | POST | Telefoonnummer validatie |
| `/api/belastbaarheidstest` | POST | Gasttest indienen |
| `/api/whatsapp/webhook` | POST | Twilio webhook |
| `/api/mantelbuddy/aanmelden` | POST | Vrijwilliger aanmelding |
| `/api/pdok/gemeenten` | GET | Gemeente zoeken |
| `/api/location/*` | GET | Adres/locatie zoeken |

### Beschermde endpoints (login vereist)
| Endpoint | Methode | Beschrijving |
|----------|---------|-------------|
| `/api/dashboard` | GET | Dashboard-data |
| `/api/profile` | GET/PUT | Profielbeheer |
| `/api/balanstest/*` | GET/DELETE | Testresultaten |
| `/api/hulpvragen` | GET/POST | Hulpvragen |
| `/api/favorieten` | GET/POST/DELETE | Favorieten |
| `/api/artikelen` | GET | Artikelen ophalen |
| `/api/notifications` | GET/PUT | Notificaties |
| `/api/check-in` | POST | Maandelijkse check-in |
| `/api/calendar` | GET/POST | Agenda |
| `/api/nav-badge` | GET | Navigatie-badges |
| `/api/intake` | GET/POST | Intake vragen |

### Admin endpoints (`/api/beheer/*`)
| Endpoint | Methode | Beschrijving |
|----------|---------|-------------|
| `/api/beheer/statistieken` | GET | KPI-dashboard |
| `/api/beheer/gebruikers` | GET | Gebruikerslijst |
| `/api/beheer/gebruikers/[id]` | GET/PUT | Gebruikersdetail |
| `/api/beheer/gebruikers/export` | GET | Excel-export |
| `/api/beheer/mantelbuddies` | GET/POST | MantelBuddy-lijst |
| `/api/beheer/mantelbuddies/[id]` | PUT | Buddy status-update |
| `/api/beheer/alarmen` | GET | Alarmenlijst |
| `/api/beheer/alarmen/[id]` | GET/PUT | Alarm afhandelen |
| `/api/beheer/artikelen` | GET/POST | Contentbeheer |
| `/api/beheer/artikelen/[id]` | PUT/DELETE | Artikel bewerken |
| `/api/beheer/hulpbronnen` | GET/POST | Organisatiebeheer |
| `/api/beheer/hulpbronnen/[id]` | PUT/DELETE | Organisatie bewerken |
| `/api/beheer/hulpbronnen/verrijk` | POST | Data-verrijking |
| `/api/beheer/instellingen` | GET/PUT | Systeeminstellingen |
| `/api/beheer/audit` | GET | Audit log |

### Gemeente endpoints (`/api/gemeente/*`)
| Endpoint | Methode | Beschrijving |
|----------|---------|-------------|
| `/api/gemeente/dashboard` | GET | Gemeente KPI's |
| `/api/gemeente/gebruikers` | GET | Lokale mantelzorgers |
| `/api/gemeente/hulpbronnen` | GET | Lokale organisaties |
| `/api/gemeente/hulpvragen` | GET | Hulpvragen |
| `/api/gemeente/alarmen` | GET | Alarmen |
| `/api/gemeente/content` | GET/POST | Gemeente-nieuws |
| `/api/gemeente/demografie` | GET | Demografische data |
| `/api/gemeente/evenementen` | GET | Evenementen |
| `/api/gemeente/trends` | GET | Trendanalyse |
| `/api/gemeente/rapportages` | GET | Rapportages |

---

## Omgevingsvariabelen

| Variabele | Vereist | Beschrijving |
|-----------|---------|-------------|
| `DATABASE_URL` | Ja | PostgreSQL connection string (pooled) |
| `DIRECT_URL` | Ja | Directe database connectie (migraties) |
| `NEXTAUTH_SECRET` | Ja | Sessie-encryptiesleutel |
| `NEXTAUTH_URL` | Ja | App URL (fallback: https://mantelzorg-app.vercel.app) |
| `TWILIO_ACCOUNT_SID` | Ja* | Twilio Account SID |
| `TWILIO_AUTH_TOKEN` | Ja* | Twilio Auth Token |
| `TWILIO_MESSAGING_SERVICE_SID` | Ja* | Twilio Messaging Service |
| `TWILIO_CONTENT_SID_MAIN_MENU` | Ja* | WhatsApp template: hoofdmenu |
| `TWILIO_CONTENT_SID_TEST_ANSWER` | Ja* | WhatsApp template: testantwoord |
| `TWILIO_CONTENT_SID_ONBOARDING` | Ja* | WhatsApp template: onboarding |

*Vereist voor WhatsApp-functionaliteit

---

## Deployment

- **Platform:** Vercel
- **Build commando:** `node scripts/build.js` (prisma generate + db push + next build)
- **Node.js:** Compatibel met Vercel runtime
- **Database:** PostgreSQL (Supabase of vergelijkbaar)

---

## Bekende beperkingen

1. WhatsApp-sessiemanagement is in-memory (geen persistentie bij serverherstart)
2. MantelBuddy matching-functionaliteit is gedeeltelijk geimplementeerd (database-modellen klaar, UI in ontwikkeling)
3. NextAuth v5 is nog in beta (`5.0.0-beta.30`)
4. Single-session enforcement kan vervelend zijn bij meerdere apparaten

---

*Deze release is volledig gedocumenteerd op 16 februari 2026.*
