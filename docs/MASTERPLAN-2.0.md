# MantelBuddy — Masterplan 2.0

**Datum:** 25 maart 2026
**Versie:** 1.0
**Status:** Ter bespreking
**Scope:** Beheeromgeving, Content Workflow, Hulpbronnen, Activiteiten, UI/UX, Dashboard

---

## Uitgangspunten

- **95% AI-gegenereerd** — AI schrijft, mens reviewt en publiceert
- **Per woonplaats zoeken** — hulpbronnen én activiteiten, met deduplicatie
- **Beheerder = jij of gemeente-medewerker die het snapt** — geen leek-proof nodig maar wel logisch
- **Ger chatbot zoekt NIET op internet** — alleen beheer-agents gebruiken web research
- **On hold items blijven on hold** (SMTP, Sentry DSN, Upstash Redis, compliance track)

---

## Deel 1: Content Werkbank (vervangt 3 losse pagina's)

### Probleem nu
Artikelen beheren, AI content genereren en content reviewen zitten op **3 verschillende pagina's** (Artikelen, Content Agent, Curator). De pipeline heeft 6 statussen maar de artikelen-pagina toont er maar 3. Artikelen raken "kwijt" tussen stappen.

### Oplossing: Eén Content Werkbank met Kanban-bord

**Eén pagina** `/beheer/content-werkbank` met:

1. **Visueel Kanban-bord** — 6 kolommen (VOORSTEL → CONCEPT → HERSCHREVEN → VERRIJKT → GEPUBLICEERD → GEARCHIVEERD) met artikel-kaartjes die je kunt verslepen
2. **Per kolom**: aantal items, gemiddelde completeness-score
3. **Filter bovenaan**: categorie, zorgthema, zoekterm
4. **Voortgangsbalk per artikel**: visueel metertje dat toont in welke fase het artikel zit en hoeveel stappen nog resteren
5. **Inline AI-acties**: klik op een kaartje → "Herschrijf naar B1", "Verrijk met FAQ", "Stel tags voor" — zonder pagina-wissel

### Nieuw: "Slim Publiceren" flow

Guided wizard voor nieuwe content:
1. **Kies categorie** (Praktische tips, Zelfzorg & balans, Rechten & regelingen, etc.)
2. **Hiaten-analyse** toont wat ontbreekt in die categorie + welke onderwerpen de meeste vraag hebben (op basis van zoekgedrag en artikelratings)
3. **AI stelt 3 onderwerpen voor** — gerangschikt op verwachte vraag
4. **Beheerder kiest er één** (of typt eigen onderwerp)
5. **AI schrijft concept** met juiste tags, B1-taal, bronvermelding
6. **Preview + review** — beheerder past aan
7. **Eén klik publiceren** met automatische tag-koppeling

**Voortgangsbalk** loopt mee door alle 7 stappen.

### Duplicate-detectie

- Bij aanmaken nieuw artikel: **automatische similarity-check** tegen bestaande artikelen
- Toont waarschuwing: "Dit lijkt op: [titel bestaand artikel] (87% overlap)"
- Beheerder kan doorgaan of samenvoegen
- **Opschoonactie**: Bestaande duplicaten (vooral werk & mantelzorg) identificeren en samenvoegen

### Tags automatisch koppelen

- Bij elke statuswijziging: AI herbeoordeelt tags
- Bij publicatie: verplichte tag-check (artikel mag niet gepubliceerd worden zonder minimaal 1 zorgthema + 1 onderwerp tag)
- Tag-suggesties tonen **waarom** een tag past (korte uitleg)

---

## Deel 2: Dashboard "Aanbevolen voor jou"

### Probleem nu
Het dashboard berekent gepersonaliseerde artikelen maar **toont ze nergens**. Er is geen leesgeschiedenis, geen rating, geen "voor jou" sectie.

### Oplossing

**Nieuwe sectie op dashboard**: "Artikelen voor jou"

- Toont **alle artikelen met minimaal 2+ tag-matches** met het profiel
- Gesorteerd op meeste matches bovenaan
- Per artikel: **categorie-label** (bijv. "Zelfzorg & balans"), emoji, titel, korte beschrijving
- **Gelezen-status**: afvinkbaar vinkje — artikel gaat naar "Gelezen" maar blijft zichtbaar (grijzer, onderaan)
- **Rating**: duimpje omhoog/omlaag na het lezen
- Als alles gelezen: "Je bent helemaal bij! We laten je weten als er nieuwe artikelen zijn."

### Database-wijzigingen

```
model ArtikelInteractie {
  id          String   @id @default(cuid())
  caregiverId String
  artikelId   String
  gelezen     Boolean  @default(false)
  gelezenOp   DateTime?
  rating      Int?     // 1 = duimpje omlaag, 2 = duimpje omhoog
  ratingOp    DateTime?
  createdAt   DateTime @default(now())

  caregiver   Caregiver @relation(...)
  artikel     Artikel   @relation(...)

  @@unique([caregiverId, artikelId])
}
```

### Beheerportaal: Artikel Analytics

Nieuwe kaart op beheer-dashboard:
- Top 10 meest gelezen artikelen
- Top 10 hoogst gewaardeerde artikelen (meeste duimpjes omhoog)
- Artikelen met veel duimpjes omlaag (actie nodig)
- AI leert van ratings: hiaten-analyse weegt populaire onderwerpen zwaarder

---

## Deel 3: Hulpbronnen Herontwerp

### Probleem nu
Het hulpbronnen-formulier is 600+ regels, te technisch, te veel velden tegelijk. De AI hulpbronnen-zoeker zoekt al op internet maar alleen bij gemeente-onboarding, niet per woonplaats.

### Oplossing

**A. Zoeken per woonplaats (niet alleen gemeente)**

De hulpbronnen-zoeker wordt uitgebreid:
- Input: woonplaats (of postcode)
- AI zoekt via web_search per woonplaats
- Deduplicatie: als een landelijke organisatie al bestaat, niet opnieuw toevoegen
- Resultaat: lijst met lokale + regionale + landelijke hulpbronnen

**B. Vereenvoudigd beheerformulier**

In plaats van 20+ velden tegelijk → **3-staps wizard**:

1. **Stap 1: Basis** — Naam, website, telefoon, korte beschrijving
2. **Stap 2: Locatie** — Niveau kiezen (landelijk/provincie/gemeente/woonplaats/wijk) + locatie selecteren via kaart of zoeken
3. **Stap 3: AI verrijkt** — AI vult automatisch: categorieën, doelgroep, openingstijden, kosten, type hulp. Beheerder reviewt en past aan.

**C. "Zoek & Voeg Toe" flow**

Nieuwe flow voor het toevoegen van hulpbronnen per woonplaats:
1. Beheerder kiest woonplaats
2. AI zoekt op internet (deep research)
3. Toont gevonden organisaties met "Toevoegen" knop per stuk
4. Bij toevoegen: AI vult alle velden in, beheerder reviewt

---

## Deel 4: Activiteiten-agent (NIEUW)

### Wat het is
Derde content-pijler naast Artikelen en Hulpbronnen. Lokale activiteiten en initiatieven die mantelzorgers kunnen helpen.

### Voorbeelden
- Alzheimer-café (wekelijks, buurthuis De Magneet)
- Wandelgroep voor mantelzorgers (maandags 10:00)
- Kaartclub senioren (woensdag, wijkcentrum)
- Lotgenotengroep jonge mantelzorgers
- Yoga voor stress (donderdagavond)
- Koffieochtend mantelzorgers (gemeentehuis)
- Respijtzorgdag (maandelijks)

### Database model

```
model Activiteit {
  id              String   @id @default(cuid())
  naam            String
  beschrijving    String   @db.Text
  locatie         String   // Adres of naam locatie
  woonplaats      String
  gemeente        String
  type            String   // "lotgenoten", "sport", "sociaal", "educatie", "respijt", "overig"
  frequentie      String?  // "wekelijks", "maandelijks", "eenmalig", "dagelijks"
  dag             String?  // "maandag", "dinsdag", etc.
  tijd            String?  // "10:00-12:00"
  kosten          String?  // "Gratis", "€5 per keer", etc.
  contact         String?  // Naam contactpersoon
  telefoon        String?
  website         String?
  email           String?
  bronUrl         String?  // URL waar info gevonden is
  doelgroep       String?  // "mantelzorgers", "ouderen", "iedereen"
  isActief        Boolean  @default(true)
  isGevalideerd   Boolean  @default(false)
  laatsteCheck    DateTime?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([woonplaats])
  @@index([gemeente])
  @@index([type])
}
```

### Activiteiten-zoeker agent

- Zoekt via web_search per **woonplaats**
- Bronnen: gemeente-websites, socialekaart.nl, buurthuizen, sportverenigingen, VNG, Mezzo
- Per woonplaats zoekt op: "mantelzorg activiteiten [woonplaats]", "buurthuis [woonplaats]", "lotgenoten [woonplaats]", "wandelgroep senioren [woonplaats]"
- Deduplicatie: als activiteit al bestaat (zelfde naam + woonplaats) → skip
- Resultaten opslaan met `isGevalideerd: false` — beheerder reviewt

### Weergave voor mantelzorger

Nieuwe pagina `/activiteiten` of sectie in `/hulp`:
- Gefilterd op woonplaats van de mantelzorger (automatisch)
- Categorieën: Lotgenoten, Sport & beweging, Sociaal, Educatie, Respijtzorg, Overig
- Per activiteit: naam, wanneer, waar, kosten, contact
- Koppeling met profiel-tags: lotgenoten-groepen voor relevante zorgthema's

### Beheer

Nieuwe pagina `/beheer/activiteiten`:
- Lijst + zoek/filter op woonplaats, type, gemeente
- "Zoek activiteiten" knop → AI zoekt per woonplaats
- Review-flow: AI vindt → beheerder valideert → gepubliceerd
- Periodieke hervalidatie (maandelijks: bestaat de activiteit nog?)

---

## Deel 5: UI/UX Verbeteringen

### Problemen geïdentificeerd

1. **TipsCard component bestaat maar wordt niet getoond op dashboard**
2. **"Voor jou" betekent twee verschillende dingen** (aanbevelingen vs. opgeslagen favorieten)
3. **Geen leesvoortgang** — gebruiker weet niet wat al gelezen is
4. **Beheer-sidebar heeft 25+ items** — overweldigend
5. **Inconsistente styling** — knoppen en spacing verschillen per pagina
6. **Profiel-completeness op dashboard klopt niet altijd**

### Oplossingen

**Dashboard herindeling:**
1. Welkom + Ger (compact)
2. **"Artikelen voor jou"** (NIEUW — aanbevolen + lees/rating)
3. Balansthermometer (als test gedaan)
4. Weekkaarten
5. Actiepunten
6. **"Activiteiten bij jou in de buurt"** (NIEUW)

**Beheer-sidebar vereenvoudigen:**
Huidige 25+ items → **5 hoofdgroepen**:
1. **Dashboard** (overzicht + analytics)
2. **Content** (Content Werkbank — vervangt artikelen + content agent + curator)
3. **Hulpbronnen** (zoeken + beheren + validatie)
4. **Activiteiten** (NIEUW — zoeken + beheren)
5. **Inrichting** (gemeenten, gebruikers, instellingen)

**Favorieten hernoemen:**
- "Voor jou" tab → "Mijn hulpbronnen"
- Geen verwarring meer met dashboard-aanbevelingen

---

## Deel 6: AI Agent Upgrades

### Content-agent: web research toevoegen

De content-agent moet bij "zoek-online" modus **daadwerkelijk** het internet doorzoeken:
- Anthropic web_search tool toevoegen (zoals hulpbronnen-zoeker al heeft)
- Zoekt op betrouwbare bronnen: mantelzorg.nl, rijksoverheid.nl, mezzo.nl, vilans.nl
- Artikel bevat automatisch bronvermelding met URL

### Hiaten-analyse: gewogen op vraag

Huidige hiaten-analyse telt alleen "hoeveel artikelen per categorie × tag".

Upgrade: **weeg op basis van**:
- Artikelratings (duimpjes) — populaire onderwerpen zwaarder
- Zoekgedrag — wat zoeken gebruikers in Ger-chat?
- Profieldata — welke zorgthema's komen het meest voor?
- Resultaat: "Er zijn 0 artikelen over respijtzorg voor werkende mantelzorgers. 43% van gebruikers werkt — dit is een hoge-prioriteit hiaat."

### Activiteiten-agent (NIEUW)

Zoals beschreven in Deel 4. Zoekt per woonplaats via web_search.

---

## Deel 7: Prioritering & Fasering

### Fase 1: Content Werkbank + Dashboard (hoogste impact)

| # | Taak | Geschatte tijd |
|---|------|---------------|
| 1.1 | ArtikelInteractie model + API (gelezen/rating) | 4h |
| 1.2 | Dashboard "Artikelen voor jou" sectie | 6h |
| 1.3 | Content Werkbank Kanban-bord (basis) | 12h |
| 1.4 | "Slim Publiceren" wizard met voortgangsbalk | 8h |
| 1.5 | Duplicate-detectie bij aanmaak | 4h |
| 1.6 | Automatische tag-koppeling + verplichte check | 3h |
| 1.7 | Bestaande duplicaten opschonen (werk & mantelzorg) | 2h |
| | **Subtotaal Fase 1** | **~39h** |

### Fase 2: Activiteiten-agent + Hulpbronnen herontwerp

| # | Taak | Geschatte tijd |
|---|------|---------------|
| 2.1 | Activiteit database model + API | 4h |
| 2.2 | Activiteiten-zoeker agent (web_search per woonplaats) | 8h |
| 2.3 | Beheer-pagina activiteiten (zoek + review + CRUD) | 8h |
| 2.4 | Gebruikerspagina activiteiten (gefilterd op woonplaats) | 6h |
| 2.5 | Hulpbronnen-zoeker uitbreiden: per woonplaats | 4h |
| 2.6 | Hulpbronnen wizard vereenvoudigen (3 stappen) | 6h |
| 2.7 | "Zoek & Voeg Toe" flow voor hulpbronnen | 4h |
| | **Subtotaal Fase 2** | **~40h** |

### Fase 3: UI/UX + Beheer herindeling

| # | Taak | Geschatte tijd |
|---|------|---------------|
| 3.1 | Dashboard herindeling + activiteiten sectie | 6h |
| 3.2 | Beheer-sidebar vereenvoudigen (5 groepen) | 4h |
| 3.3 | Content-agent web research toevoegen | 4h |
| 3.4 | Hiaten-analyse wegen op vraag/ratings | 6h |
| 3.5 | Favorieten hernoemen + opschonen | 2h |
| 3.6 | Artikel analytics in beheerportaal | 4h |
| 3.7 | Consistente UI componenten doorvoeren | 6h |
| | **Subtotaal Fase 3** | **~32h** |

### Totaal: ~111 uur (3 fasen)

---

## On Hold (ongewijzigd)

- SMTP provider configureren
- Sentry DSN configureren
- Upstash Redis configureren
- Compliance track (DPIA, verwerkersovereenkomsten, privacy policy)
- Sentry alerts instellen

## Backlog (na Masterplan 2.0)

- E2E tests met Playwright
- Push notificaties (VAPID)
- 2FA voor admin (TOTP)
- ML-gebaseerde aanbevelingsengine
- Email-templates beheer
- Media-upload (S3/Cloudinary)
- Dark mode
- Multi-language support
- Per-user AI token budget
- AI cost dashboard
- Prompt versioning met rollback

---

## Database-wijzigingen overzicht

| Model | Doel | Fase |
|-------|------|------|
| ArtikelInteractie | Gelezen/rating tracking per gebruiker | Fase 1 |
| Activiteit | Lokale activiteiten en initiatieven | Fase 2 |

SQL-scripts worden bij elke fase aangeleverd.

---

*Dit plan vervangt het vorige projectplan als leidend document voor de volgende release.*
