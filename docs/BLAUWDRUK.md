# MantelBuddy — Technische & Functionele Blauwdruk

**Datum:** 26 maart 2026
**Versie:** 1.0
**Platform:** mantelbuddy.nl

---

## 1. Wat is MantelBuddy?

MantelBuddy is een digitaal platform dat mantelzorgers in Nederland ondersteunt. Het combineert AI-coaching, lokale hulpbronnen, een buddy-systeem en gemeenteportalen in één webapp. De AI-coach "Ger" begeleidt mantelzorgers met persoonlijk advies op B1-taalniveau.

---

## 2. Kerncijfers

| Metriek | Aantal |
|---------|--------|
| Regels code (TypeScript/TSX) | 93.301 |
| Bronbestanden | 458 |
| Pagina's | 85 |
| API route-bestanden | 152 |
| HTTP endpoints | 216 |
| React componenten | 70 |
| Database modellen | 57 |
| AI tools/agents/prompts | 27 |
| Services | 7 |
| Config bestanden | 21 |
| Scripts | 20 |
| Dependencies (productie) | 36 |
| Dependencies (dev) | 17 |

---

## 3. Tech Stack

| Laag | Technologie | Versie |
|------|-------------|--------|
| Framework | Next.js | 16.1.4 |
| Frontend | React | 19.2.3 |
| Taal | TypeScript | 5.9.3 |
| Styling | Tailwind CSS | 4.x |
| Database ORM | Prisma | 5.22.0 |
| Database | PostgreSQL (Supabase) + pgvector | — |
| Auth | NextAuth.js | 5.0.0-beta.30 |
| AI LLM | Anthropic Claude (Haiku/Sonnet) | via @ai-sdk/anthropic |
| AI Embeddings | OpenAI text-embedding-3-small | 1536 dimensies |
| WhatsApp | Twilio | — |
| Rate Limiting | Upstash Redis | 2.0.8 |
| Monitoring | Sentry | 10.45.0 |
| Logging | Pino | 10.3.1 |
| Validatie | Zod | 4.3.6 |
| Data Fetching | SWR | 2.4.1 |
| Rich Text Editor | TipTap | 3.20.0 |
| Kaarten | Leaflet / React-Leaflet | — |
| PDF Export | jsPDF + AutoTable | — |
| Hosting | Vercel | — |
| Adres-lookup | PDOK (overheids-API) | — |

---

## 4. Gebruikersrollen & Features

### 4.1 Mantelzorger (primaire gebruiker)

**Dashboard & Assessment**
| Feature | Beschrijving |
|---------|-------------|
| Dashboard | Persoonlijk overzicht met balansscore, weekkaarten, actiepunten, aanbevolen artikelen |
| Belastbaarheidstest | 12 vragen + zorgtaken-selectie met uren en zwaarte, score 0-24 |
| Balansthermometer | Visuele weergave van belastingsniveau met deelgebieden |
| Check-in | Wekelijkse/maandelijkse welzijnscheck met smiley-knoppen |
| Progressie & badges | 7 badges: eerste check-in, profiel compleet, artikelen gelezen, etc. |

**AI Coach "Ger"**
| Feature | Beschrijving |
|---------|-------------|
| AI Assistent | Warme, empathische coach die Nederlands spreekt op B1-niveau |
| Crisis-detectie | 25+ Nederlandse crisis-signalen worden herkend, automatische doorverwijzing naar 113/huisarts/Mantelzorglijn |
| Profiel-context | Ger kent je zorgsituatie, testresultaten en check-in historie |
| 13 AI-tools | Ger kan hulpbronnen zoeken, artikelen vinden, actiepunten aanmaken, rapporten genereren |

**Content & Hulp**
| Feature | Beschrijving |
|---------|-------------|
| Artikelen (Leren) | Educatieve artikelen op B1-niveau, gepersonaliseerd op profiel-tags |
| Hulpbronnen | Lokale organisaties gefilterd op gemeente en zorgtaak |
| Activiteiten | Lokale activiteiten: lotgenoten, sport, sociaal, respijtzorg |
| Zoeken | Semantic search via pgvector over artikelen + hulpbronnen |
| Favorieten | Bewaar hulpbronnen en artikelen |
| Artikel interactie | Gelezen markeren + duimpje omhoog/omlaag |

**Profiel & Export**
| Feature | Beschrijving |
|---------|-------------|
| Profiel | 6 zorgthema's, 5 gestructureerde secties (B1-B5), rouw-sectie (B6) |
| Rapport | Persoonlijk PDF-rapport met testtrend, voor keukentafelgesprek |
| Agenda | Zorgtaken plannen met herinneringen |
| Privacy | AVG-toestemmingen beheren (privacy, gegevensverwerking, gezondheidsdata) |

**WhatsApp**
| Feature | Beschrijving |
|---------|-------------|
| Balanstest via WhatsApp | Volledige test-flow via smiley-knoppen |
| Onboarding via WhatsApp | Account aanmaken, adres-lookup via PDOK |
| Check-in via WhatsApp | "Hoe gaat het?" met 3 quick replies |
| Hulp zoeken via WhatsApp | Lokale organisaties vinden per categorie |

### 4.2 MantelBuddy (vrijwilliger)

| Feature | Beschrijving |
|---------|-------------|
| Buddy Dashboard | Overzicht van openstaande hulpvragen en actieve matches |
| Onboarding wizard | Motivatie-vragenlijst, skill-matching, beschikbaarheid |
| Matching | Automatische matching op afstand, beschikbaarheid en taak-overlap |
| Chat | 1-op-1 berichten met gekoppelde mantelzorger |
| Beoordelingen | Feedback ontvangen na afgeronde taken |

### 4.3 Beheerder (admin)

**Content Management**
| Feature | Beschrijving |
|---------|-------------|
| Content Werkbank | Kanban-bord met 6 kolommen (Voorstel → Gepubliceerd) |
| Slim Publiceren | 7-stappen wizard: categorie → hiaten → AI voorstellen → concept → publiceer |
| Content Agent | AI genereert, herschrijft en verrijkt artikelen |
| Content Curator | AI beoordeelt kwaliteit, B1-niveau, duplicaten |
| Artikel analytics | Top gelezen, hoogst gewaardeerd, meest negatief |

**Hulpbronnen**
| Feature | Beschrijving |
|---------|-------------|
| AI Hulpbronnen Zoeker | Zoekt automatisch per gemeente in 15 categorieën via web search |
| Hulpbronnen Validator | Wekelijkse controle: website bereikbaar? Telefoon geldig? |
| Hulpbronnen Wizard | Vereenvoudigd toevoegen: 3 stappen (basis → locatie → AI verrijkt) |
| Activiteiten Zoeker | AI zoekt lokale activiteiten per woonplaats |

**Gebruikers & Monitoring**
| Feature | Beschrijving |
|---------|-------------|
| Gebruikersbeheer | Zoeken, filteren, details bekijken, deactiveren |
| MantelBuddies beheer | Vrijwilligers goedkeuren, VOG-check, training |
| Alarmen | Crisis-signalen en hoge belasting automatisch gedetecteerd |
| Moderatie | Berichten en reacties controleren |
| Audit Log | Alle systeemwijzigingen bijgehouden |

**Inrichting**
| Feature | Beschrijving |
|---------|-------------|
| Gemeenten | Gemeente-configuratie met stappen, hulpbronnen, advies per niveau |
| Balanstest vragen | CRUD voor de 12 testvragen met weegfactoren |
| Zorgtaken | Beheer van zorgtaak-categorieën |
| Huisstijl | White-label configuratie (kleuren, logo, teksten) |
| App content | Alle UI-teksten aanpasbaar |

### 4.4 Gemeente

| Feature | Beschrijving |
|---------|-------------|
| Dashboard | Geanonimiseerde statistieken (k-anonimiteit ≥ 10) |
| Demografie | Verdeling naar leeftijd, zorgtype, belastingsniveau |
| Trends | Historische trend-analyse over tijd |
| Alarmen | Crisis-signalen monitoren (geanonimiseerd, geen PII) |
| Hulpbronnen | Lokale organisaties beheren |
| Rapportages | Officiële rapporten voor beleid |
| CTA's | "Stuur informatiepakket" en "Plan informatiebijeenkomst" |

---

## 5. AI Architectuur

### Model-tiering (kostenbesparing 80-95%)

| Agent | Model | Reden |
|-------|-------|-------|
| Ger chat (standaard) | Haiku 4.5 | Snel, goedkoop, voldoende voor gesprek |
| Welkom chat (publiek) | Haiku 4.5 | Hoog volume, lage kosten |
| Check-in coaching | Sonnet | Meer diepgang nodig |
| Content generatie | Sonnet | Kwaliteit belangrijk |
| Admin agents | Sonnet | Complexe taken |
| Crisis-detectie | Keyword-based | Geen API-call nodig |

### AI Tools (13 stuks, beschikbaar voor Ger)

| Tool | Functie |
|------|---------|
| bekijkGebruikerStatus | Profiel, teststatus, check-in historie |
| bekijkBalanstest | Scores, deelgebieden, zorgtaken, advies |
| bekijkTestTrend | Vergelijk huidige test met eerdere |
| zoekHulpbronnen | Lokale organisaties zoeken |
| zoekArtikelen | Educatieve artikelen vinden |
| semantischZoeken | Gecombineerde zoekactie over alles |
| registreerAlarm | Crisis-alert loggen |
| bekijkCheckInTrend | Welzijnstrend analyseren |
| genereerRapportSamenvatting | PDF-rapport maken |
| bekijkGemeenteAdvies | Gemeente-specifieke tips |
| slaActiepuntOp | Actiepunt aanmaken vanuit gesprek |
| bekijkActiepunten | Openstaande actiepunten bekijken |
| bekijkGemeente | Gemeente-informatie opvragen |

### AI Agents (achtergrond)

| Agent | Functie | Trigger |
|-------|---------|---------|
| Hulpbronnen-zoeker | Web search per gemeente in 15 categorieën | Admin knop |
| Hulpbronnen-validator | Website + telefoon check, AI-correctievoorstellen | Wekelijkse cron |
| Content Agent | Artikel genereren, herschrijven, verrijken | Admin werkbank |
| Curator | Kwaliteitsbeoordeling, B1-check, duplicaten, hiaten | Admin dashboard |

---

## 6. Database Architectuur

### 57 modellen in 8 domeinen

**Authenticatie (5):** User, Account, Session, VerificationToken, PasswordResetToken

**Mantelzorger (8):** Caregiver, IntakeCategory, IntakeQuestion, IntakeResponse, BelastbaarheidTest, BelastbaarheidAntwoord, ZorgtaakSelectie, BelastbaarheidRapport

**Monitoring (4):** MonthlyCheckIn, Task, Notification, AlarmLog

**Content (8):** Artikel, ArtikelTag, ArtikelBron, ContentTag, ContentCategorie, CuratorReview, GebruikerVoorkeur, AppContent

**Hulpbronnen (3):** Zorgorganisatie, HulpbronValidatie, Activiteit

**Buddy-systeem (6):** MantelBuddy, BuddyMatch, BuddyTaak, BuddyTaakReactie, BuddyBeoordeling, Bericht

**Gemeente (4):** Gemeente, GemeenteStap, GeplandCheckin, ReEngagementBericht

**Overig (8):** Favoriet, WeekKaart, WhatsAppSessie, CalendarEvent, CoachAdvies, SiteSettings, FormulierOptie, ArtikelInteractie

**Relaties:** 40+ foreign keys met CASCADE/SET NULL, 30+ indexen, pgvector embeddings op Artikel

---

## 7. Externe Koppelingen

| Service | Doel | Kosten |
|---------|------|--------|
| Anthropic (Claude) | AI-coach, content generatie, hulpbronnen zoeken | ~$0.25/1K berichten (Haiku) |
| OpenAI | Text embeddings voor semantic search | ~$0.02/1M tokens |
| Twilio | WhatsApp berichten | ~$0.005/bericht |
| Supabase | PostgreSQL database + pgvector | Gratis tier / $25/maand pro |
| Vercel | Hosting (Next.js) | Gratis tier / $20/maand pro |
| PDOK | Adres/postcode lookup | Gratis (overheids-API) |
| Upstash | Redis rate limiting | Gratis tier / $10/maand |
| Sentry | Error tracking | Gratis tier |

---

## 8. Security & Compliance

**Geïmplementeerd:**
- JWT authenticatie met bcrypt (12 rounds) password hashing
- Role-based access control (4 rollen) via middleware
- Rate limiting op auth endpoints (Redis-backed)
- CORS + CSP + HSTS headers
- XSS-bescherming via DOMPurify
- SQL injection beschermd via Prisma ORM
- Audit logging op kritieke acties
- Crisis-detectie met professionele doorverwijzing
- AVG-toestemmingen (privacy, gegevensverwerking, gezondheidsdata)
- Session-invalidatie bij nieuwe login

**Nog te configureren:**
- SMTP voor transactionele email
- Sentry DSN voor productie-monitoring
- Upstash Redis voor persistente rate limiting
- Twilio WhatsApp templates (goedkeuring)
- DPIA (wettelijk verplicht bij gezondheidsdata)
- Verwerkersovereenkomsten (AVG Art. 28)

---

## 9. Design System

**Stijl:** Geïnspireerd op "Ik Sta Sterk" (VeiligheidNL)

| Element | Waarde |
|---------|--------|
| Primair | Donker paurs/navy `#2D1B69` |
| Achtergrond | Zacht mauve `#F8F0F5` |
| Accent (CTA) | Warm goud `#E5A825` |
| Kaarten | Wit op gekleurde achtergrond |
| Koppen | Nunito Black (weight 900) |
| Body tekst | 18px, line-height 1.75 |
| Border radius | 1.25rem (kaarten), 0.75rem (knoppen) |
| Toegankelijkheid | WCAG 2.1 AA, skip-links, ARIA landmarks, min 48px touch targets |

60+ CSS componentklassen (ker-card, ker-btn, ker-input, ker-pill, etc.)

---

## 10. Waardeberekening

### Wat zou dit gekost hebben bij een software bureau?

#### Ontwikkelkosten

| Onderdeel | Uren (bureau) | Uurtarief | Kosten |
|-----------|---------------|-----------|--------|
| **Frontend** (85 pagina's, 70 componenten, design system, responsive, dark mode) | 800h | €125 | €100.000 |
| **Backend** (216 API endpoints, auth, middleware, rate limiting) | 600h | €125 | €75.000 |
| **Database** (57 modellen, migraties, indexen, pgvector) | 200h | €125 | €25.000 |
| **AI integratie** (Ger coach, 13 tools, 4 agents, crisis-detectie, model-tiering) | 400h | €150 | €60.000 |
| **WhatsApp integratie** (Twilio, 4 flows, sessie-management) | 200h | €125 | €25.000 |
| **Beheerportaal** (28 admin pagina's, Content Werkbank, Slim Publiceren) | 300h | €125 | €37.500 |
| **Gemeente-portaal** (10 pagina's, geanonimiseerde statistieken) | 150h | €125 | €18.750 |
| **Buddy-systeem** (matching, chat, onboarding, beoordelingen) | 200h | €125 | €25.000 |
| **Testing & QA** (unit tests, integratie, security audit) | 200h | €100 | €20.000 |
| **DevOps** (Vercel, Supabase, CI/CD, monitoring) | 100h | €125 | €12.500 |
| **Subtotaal ontwikkeling** | **3.150h** | | **€398.750** |

#### Projectmanagement & Design

| Onderdeel | Uren | Uurtarief | Kosten |
|-----------|------|-----------|--------|
| Projectmanagement | 400h | €110 | €44.000 |
| UX/UI Design | 300h | €100 | €30.000 |
| Functioneel ontwerp | 200h | €110 | €22.000 |
| Architectuur & technisch ontwerp | 150h | €140 | €21.000 |
| **Subtotaal PM & Design** | **1.050h** | | **€117.000** |

#### Content & Specialistisch

| Onderdeel | Uren/Eenheden | Tarief | Kosten |
|-----------|---------------|--------|--------|
| Content schrijven (47 artikelen, B1-niveau) | 150h | €85 | €12.750 |
| Content strategie & taxonomie | 80h | €100 | €8.000 |
| Juridisch advies (AVG, DPIA, verwerkersovereenkomsten) | 60h | €200 | €12.000 |
| Domeinexpertise mantelzorg | 80h | €100 | €8.000 |
| **Subtotaal content & specialistisch** | **370h** | | **€40.750** |

#### Totaaloverzicht

| Categorie | Uren | Kosten |
|-----------|------|--------|
| Ontwikkeling | 3.150h | €398.750 |
| PM & Design | 1.050h | €117.000 |
| Content & Specialistisch | 370h | €40.750 |
| **Totaal** | **4.570h** | **€556.500** |

#### Aanvullende kosten bij een bureau

| Post | Kosten |
|------|--------|
| Overhead & marge bureau (25%) | €139.125 |
| Onvoorzien (10%) | €55.650 |
| **Grand total inclusief bureau-marge** | **€751.275** |

### Doorlopende kosten (per maand)

| Post | Kosten/maand |
|------|-------------|
| Vercel hosting (Pro) | €20 |
| Supabase database (Pro) | €25 |
| Anthropic AI (geschat 1.000 gebruikers) | €50-200 |
| OpenAI embeddings | €5 |
| Twilio WhatsApp | €25-100 |
| Upstash Redis | €10 |
| Sentry monitoring | €0 (gratis tier) |
| Domein + SSL | €5 |
| **Totaal operationeel** | **€140-365/maand** |

### Samenvatting waarde

| | |
|--|--|
| **Geschatte ontwikkelwaarde** | **€550.000 - €750.000** |
| **Regels code** | 93.301 |
| **Waarde per regel** | ~€6-8 |
| **Equivalente teamgrootte** | 4-6 developers, 8-12 maanden |
| **Operationele kosten** | €140-365/maand |

---

## 11. Wat is afgerond

- ✅ Projectplan 2026 (10 iteraties, ~350h)
- ✅ Masterplan 2.0 (5 iteraties, ~175h)
- ✅ Tag-herstructurering (6 zorgthema's, B1-B6 profiel)
- ✅ Design system (paurs/navy, Ik Sta Sterk stijl)
- ✅ Content Werkbank + Slim Publiceren
- ✅ Activiteiten-systeem
- ✅ Buddy onboarding
- ✅ Progressie-systeem
- ✅ Gemeente CTA's
- ✅ Proactieve notificaties

---

*Laatste update: 26 maart 2026*
