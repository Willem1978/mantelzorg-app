# Plan: Content & Zoek Fundament — "Stevig als een Huis"

**Datum:** 14 maart 2026
**Versie:** 1.0
**Doel:** Het zoeken naar informatie en hulpbronnen robuust, relevant en tastbaar maken. Content beter matchen aan gebruikers. Bronvermelding op orde. Hiaten in content systematisch opsporen en opvullen.

---

## Inhoudsopgave

1. [Probleemanalyse: Wat mist er nu?](#1-probleemanalyse)
2. [Stap 1: Hulpbronnen Tastbaar Maken](#2-stap-1-hulpbronnen-tastbaar-maken)
3. [Stap 2: Tagging & Matching Verbeteren](#3-stap-2-tagging--matching-verbeteren)
4. [Stap 3: Artikelen Scoren & Relevantie](#4-stap-3-artikelen-scoren--relevantie)
5. [Stap 4: Voorgestelde Artikelen Slimmer Maken](#5-stap-4-voorgestelde-artikelen-slimmer-maken)
6. [Stap 5: Content Hiaten & Prioriteitsmatrix](#6-stap-5-content-hiaten--prioriteitsmatrix)
7. [Stap 6: Bronvermelding & Auteurschap](#7-stap-6-bronvermelding--auteurschap)
8. [Database Wijzigingen (totaaloverzicht)](#8-database-wijzigingen)
9. [Bouwvolgorde & Afhankelijkheden](#9-bouwvolgorde)
10. [Acceptatiecriteria per Stap](#10-acceptatiecriteria)

---

## 1. Probleemanalyse

### Wat werkt al goed
- 47+ artikelen in 7 categorieën met 21 tags
- Semantisch zoeken via pgvector embeddings
- AI content agent kan artikelen genereren, herschrijven en verrijken
- Hulpbronnen zoeker vindt lokale organisaties per gemeente
- Weekkaarten linken naar artikelen

### Wat mist of niet goed genoeg is

| Probleem | Impact | Waar zit het? |
|----------|--------|---------------|
| **Hulpbronnen zijn niet tastbaar** — beschrijvingen te vaag, geen concrete "wat kun je verwachten", geen stappen | Mantelzorger weet niet wat ze aan een organisatie hebben | Zorgorganisatie model + AI zoeker output |
| **Tags onvoldoende benut** — artikelen matchen op categorie maar nauwelijks op aandoening/situatie van de gebruiker | Iemand met dementie-naaste krijgt dezelfde content als iemand met kanker-naaste | ArtikelTag + GebruikerVoorkeur |
| **Geen gebruikersfeedback op content** — geen scores, geen "was dit nuttig?", geen leesgeschiedenis | Geen data om relevantie te verbeteren | Ontbreekt volledig |
| **Voorgestelde artikelen te willekeurig** — weekkaarten en Ger suggereren op basis van categorie, niet op persoonlijke match | Gemiste kans voor persoonlijke relevantie | Weekkaarten + AI tools |
| **Zoekwoorden-matching onvolledig** — artikelen zoeken op titel/beschrijving, niet op synoniemen of gerelateerde termen | "PGB aanvragen" vindt niks als artikel "Persoonsgebonden budget" heet | zoekArtikelen tool |
| **Content hiaten niet zichtbaar** — curator kan hiaten detecteren maar geen prioriteitsmatrix | Dementie (700.000+ mantelzorgers) heeft evenveel artikelen als zeldzame aandoeningen | Content agent + curator |
| **Bronvermelding ontbreekt** — geen "geschreven door", geen bronlinks bij AI-gegenereerde artikelen | Vertrouwen en transparantie ontbreken | Artikel model |
| **Hulpbronnen zoekervaring** — geen filters voor de mantelzorger zelf, geen sortering op afstand/relevantie | Zoeken voelt als blaadjes door een telefoonboek | Frontend + API |

---

## 2. Stap 1: Hulpbronnen Tastbaar Maken

> **Doel:** Elke hulpbron voelt concreet — de mantelzorger weet precies wat ze kunnen verwachten, wat de eerste stap is, en wat het kost.

### 1.1 Zorgorganisatie velden verrijken

De velden `eersteStap` en `verwachtingTekst` bestaan al maar zijn bij de meeste hulpbronnen leeg. Daarnaast ontbreken velden voor een tastbare ervaring.

**Nieuwe velden op Zorgorganisatie:**

```prisma
// Toevoegen aan Zorgorganisatie
wachttijd         String?   // "Meestal binnen 2 weken" — verwachte wachttijd
bereikbaarheid    String?   // "Ma-vr 9-17" — samengevatte bereikbaarheid
ervaringTekst     String?   // "Ze komen bij je thuis voor een gesprek van 30 min" — wat gebeurt er
geschiktVoor      String[]  // ["dementie", "parkinson"] — voor welke aandoeningen specifiek geschikt
```

### 1.2 AI Zoeker: verplicht eersteStap en ervaringTekst

De hulpbronnen-zoeker (`hulpbronnen-zoeker.ts`) schrijft nu beschrijvingen maar vult `eersteStap` en `verwachtingTekst` niet consequent in.

**Wijziging in prompt:**
- Maak `eersteStap` een **verplicht** veld in de AI-output
- Voeg `ervaringTekst` toe als verplicht veld (1-2 zinnen: wat kun je verwachten bij eerste contact)
- Fallback per categorie als de AI het niet kan bepalen (al gedefinieerd in masterplan 3.2)

**Wijziging in `hulpbronnen-zoeker.ts`:**
- Output schema uitbreiden met verplichte velden
- Validatie: weiger resultaten zonder eersteStap (of vul automatisch fallback in)

### 1.3 Frontend: hulpbronkaart redesign

Huidige kaart toont: naam, beschrijving, telefoon, website. Dat is een telefoonboek.

**Nieuwe kaart-indeling:**

```
┌──────────────────────────────────────────────────┐
│ 🏥 Thuiszorg Arnhem                    ⭐ 4.2/5  │
│ Huishoudelijke hulp en persoonlijke verzorging    │
│                                                   │
│ 📋 Eerste stap: Bel voor een gratis intake        │
│ 🕐 Wachttijd: Meestal binnen 2 weken             │
│ 💰 Kosten: Gratis via Wmo-indicatie               │
│ 📍 Arnhem en omstreken                            │
│                                                   │
│ 📞 026-123 4567    🌐 Website    ✉️ Mail           │
│                                                   │
│ [💾 Bewaar] [📤 Deel] [👍 Nuttig] [👎 Niet nuttig] │
└──────────────────────────────────────────────────┘
```

### 1.4 Hulpbronnen zoek-UI verbeteren

**Filters toevoegen op de hulpbronnen-pagina:**
- Categorie (dropdown met zorgtaken)
- Aandoening (op basis van profiel, met optie om te wijzigen)
- Soort hulp (praktisch / emotioneel / financieel / administratief)
- Afstand/dekkingsgebied (gemeente / regio / landelijk)

**Sortering:**
- Relevantie (standaard — op basis van profiel-match)
- Afstand (dichtstbijzijnde eerst)
- Beoordeling (hoogst gewaardeerd eerst)
- Alfabetisch

### 1.5 Batch-verrijking bestaande hulpbronnen

Admin-tool om alle bestaande hulpbronnen die `eersteStap` of `ervaringTekst` missen te laten verrijken door de AI. Werkt in batches van 5 om API-kosten te beperken.

**Bestand:** `src/app/api/beheer/hulpbronnen/verrijk-batch/route.ts`

---

## 3. Stap 2: Tagging & Matching Verbeteren

> **Doel:** Artikelen en hulpbronnen koppelen aan de specifieke situatie van de gebruiker via een slimmer tagsysteem.

### 2.1 Tag-taxonomie uitbreiden

Het huidige `ContentTag` model heeft 2 types: AANDOENING en SITUATIE. Dit is te beperkt.

**Uitbreiding TagType enum:**

```prisma
enum TagType {
  AANDOENING    // dementie, kanker, CVA, parkinson, psychisch
  SITUATIE      // werkend, jong, op-afstand, samenwonend
  ONDERWERP     // NIEUW: financien, wmo, medicatie, nachtrust, voeding
  DOELGROEP     // NIEUW: partner, kind, ouder, buur, professional
  LEVENSFASE    // NIEUW: begin-mantelzorg, langdurig, rouw-na-verlies
}
```

**Nieuwe tags per type (voorbeelden):**

| Type | Tags |
|------|------|
| ONDERWERP | financien, wmo-aanvragen, pgb, eigen-bijdrage, medicatie, nachtrust, voeding, veiligheid-thuis, hulpmiddelen, dagbesteding, vervoer, respijtzorg |
| DOELGROEP | partner, kind, ouder-van, buurman-vrouw, mantelzorger-op-afstand |
| LEVENSFASE | net-begonnen, al-jaren-bezig, crisis, rouw-na-verlies, opname-naaste |

### 2.2 Artikelen bulk-taggen

Bestaande 47+ artikelen moeten getagd worden met de nieuwe tag-types.

**Aanpak:** AI-gestuurde bulk-tagging via de content agent:
1. Lees alle artikelen zonder tags (of alleen met AANDOENING/SITUATIE tags)
2. AI analyseert titel + beschrijving + inhoud
3. Stelt relevante tags voor uit alle 5 types
4. Beheerder reviewt en bevestigt

**Nieuw endpoint:** `POST /api/ai/admin/content-agent` met type `"tag-bulk"`

### 2.3 Zoekwoorden / synoniemen op tags

Probleem: een gebruiker zoekt "PGB" maar de tag heet "persoonsgebonden-budget". Of zoekt "thuishulp" terwijl de categorie "Huishoudelijke taken" heet.

**Uitbreiding ContentTag model:**

```prisma
model ContentTag {
  // bestaande velden...
  synoniemen     String[]   // NIEUW: ["PGB", "persoonsgebonden budget", "pgb aanvragen"]
}
```

De zoektools (`zoekArtikelen`, `zoekHulpbronnen`, `semantischZoeken`) zoeken dan ook in synoniemen.

### 2.4 Automatische tag-suggesties in profiel

Bij stap 3 van de profielwizard (zorgsituatie) en stap 4 (interesses):
- Na selectie van aandoening → automatisch relevante ONDERWERP-tags voorstellen
- Voorbeeld: selecteer "Dementie" → automatisch suggereer "dagbesteding", "veiligheid-thuis", "nachtrust", "financien"

**Technisch:** Mapping-tabel `AandoeningOnderwerp` of een JSON-configuratie die aandoening → relevante onderwerpen koppelt.

### 2.5 Hulpbronnen taggen

Hulpbronnen (Zorgorganisatie) hebben nu `onderdeelTest` als categorie maar geen tags.

**Nieuwe koppeltabel:**

```prisma
model ZorgorganisatieTag {
  id                String          @id @default(cuid())
  zorgorganisatieId String
  tagId             String
  zorgorganisatie   Zorgorganisatie @relation(fields: [zorgorganisatieId], references: [id], onDelete: Cascade)
  tag               ContentTag      @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@unique([zorgorganisatieId, tagId])
  @@index([tagId])
}
```

Hiermee kunnen hulpbronnen dezelfde tags krijgen als artikelen. Een hulpbron voor dagbesteding bij dementie krijgt tags: `dementie` + `dagbesteding`. Dit maakt cross-matching mogelijk.

---

## 4. Stap 3: Artikelen Scoren & Relevantie

> **Doel:** Gebruikers kunnen artikelen en hulpbronnen beoordelen. Dit verbetert aanbevelingen en geeft inzicht in content-kwaliteit.

### 3.1 ContentScore model

```prisma
model ContentScore {
  id            String    @id @default(cuid())
  caregiverId   String
  type          ScoreType // ARTIKEL of HULPBRON
  itemId        String    // Artikel ID of Zorgorganisatie ID
  score         Int       // 1-5 sterren, of simpeler: 1 (niet nuttig) / 5 (nuttig)
  feedback      String?   // Optionele vrije tekst ("Dit was verouderd", "Heel duidelijk!")
  createdAt     DateTime  @default(now())
  caregiver     Caregiver @relation(fields: [caregiverId], references: [id], onDelete: Cascade)

  @@unique([caregiverId, type, itemId])
  @@index([type, itemId])
  @@index([caregiverId])
}

enum ScoreType {
  ARTIKEL
  HULPBRON
}
```

### 3.2 Leesgeschiedenis

```prisma
model LeesGeschiedenis {
  id            String    @id @default(cuid())
  caregiverId   String
  artikelId     String
  gelezenOp     DateTime  @default(now())
  leestijd      Int?      // Geschatte leestijd in seconden (scroll tracking)
  caregiver     Caregiver @relation(fields: [caregiverId], references: [id], onDelete: Cascade)

  @@unique([caregiverId, artikelId])
  @@index([caregiverId])
  @@index([artikelId])
}
```

### 3.3 "Was dit nuttig?" component

Na het lezen van een artikel of bekijken van een hulpbron:

```
┌──────────────────────────────────────┐
│ Was dit nuttig?                       │
│                                       │
│ [👍 Ja, nuttig]    [👎 Nee, niet echt] │
│                                       │
│ (optioneel:)                          │
│ [Verouderde informatie]               │
│ [Te ingewikkeld geschreven]           │
│ [Niet relevant voor mijn situatie]    │
│ [Contactgegevens kloppen niet]        │
└──────────────────────────────────────┘
```

**Snelle feedback-opties (zonder vrije tekst):**
- Verouderde informatie
- Te ingewikkeld geschreven
- Niet relevant voor mijn situatie
- Contactgegevens kloppen niet (alleen bij hulpbronnen)
- Heel duidelijk en praktisch (positief)

### 3.4 Score-aggregatie op content

Op het Artikel en Zorgorganisatie model worden berekende velden bijgehouden (gecached):

```prisma
// Toevoegen aan Artikel
gemiddeldeScore   Float?    // Gemiddelde van alle scores
aantalScores      Int       @default(0)
aantalGelezen     Int       @default(0) // Aantal unieke lezers

// Toevoegen aan Zorgorganisatie
gemiddeldeScore   Float?
aantalScores      Int       @default(0)
```

**Herberekening:** Na elke nieuwe score wordt het gemiddelde opnieuw berekend (simple UPDATE met subquery).

### 3.5 Score-data gebruiken in zoekresultaten

- Zoekresultaten tonen gemiddelde score als er >= 3 beoordelingen zijn
- Bij gelijke relevantie: sorteer op score
- AI assistenten zien ook de score en kunnen zeggen: "Dit artikel wordt door andere mantelzorgers als heel nuttig beoordeeld"

---

## 5. Stap 4: Voorgestelde Artikelen Slimmer Maken

> **Doel:** De juiste artikelen bij de juiste gebruiker, op het juiste moment.

### 4.1 Persoonlijke relevantie-score berekenen

Voor elk artikel berekenen we een **relevantie-score** per gebruiker op basis van:

| Factor | Gewicht | Bron |
|--------|---------|------|
| Aandoening-match | 30% | Profiel aandoening ↔ artikel AANDOENING-tag |
| Situatie-match | 15% | Profiel situatie-tags ↔ artikel SITUATIE-tags |
| Onderwerp-match | 20% | Profiel interesses ↔ artikel ONDERWERP-tags |
| Belastingniveau-match | 15% | Hoge belasting → meer zelfzorg/rechten artikelen |
| Gemeenschapsscore | 10% | Gemiddelde beoordeling door andere gebruikers |
| Nieuwheid | 10% | Recenter = relevanter (met decay) |

**Implementatie:** SQL query of Prisma query die per gebruiker een ranked list genereert.

**Locaties waar dit gebruikt wordt:**
1. Dashboard: "Aanbevolen voor jou" sectie (top 3)
2. Leren-pagina: gesorteerd op relevantie i.p.v. volgorde
3. Weekkaarten LEREN-type: kies artikel met hoogste relevantie-score
4. AI assistenten: suggereer hoogst-scorende artikelen eerst

### 4.2 "Aanbevolen voor jou" dashboard-sectie

Nieuwe component op het dashboard:

```
┌──────────────────────────────────────────────────┐
│ 📚 Aanbevolen voor jou                            │
│                                                   │
│ Op basis van je situatie (dementie, werkend)       │
│                                                   │
│ ┌─────────────────────────┐ ┌─────────────────────┐
│ │ 💰 PGB aanvragen: zo     │ │ 😴 Slaaptips voor   │
│ │ doe je dat               │ │ mantelzorgers       │
│ │ ⭐ 4.5  •  3 min lezen   │ │ ⭐ 4.8  •  2 min    │
│ └─────────────────────────┘ └─────────────────────┘
│                                                   │
│ [Bekijk alle aanbevelingen →]                     │
└──────────────────────────────────────────────────┘
```

### 4.3 Weekkaarten LEREN slimmer vullen

Huidige weekkaarten LEREN-type selecteert artikelen op basis van ContentTag en categorie-matching. Verbeteren met:
1. Relevantie-score als primair selectiecriterium
2. Niet-gelezen artikelen prefereren boven gelezen
3. Artikelen met hoge community-score prefereren
4. Afwisseling in categorieën (niet 3 weken achtereen dezelfde categorie)

### 4.4 "Meer hierover" suggesties

Onderaan elk artikel: gerelateerde artikelen op basis van gedeelde tags.

```
┌──────────────────────────────────────┐
│ 📖 Meer hierover                      │
│                                       │
│ • Hoe vraag je Wmo-hulp aan?          │
│ • Eigen bijdrage: wat betaal je?      │
│ • Respijtzorg: even op adem komen     │
└──────────────────────────────────────┘
```

**Logica:** Artikelen met >= 2 gedeelde tags, gesorteerd op relevantie-score.

---

## 6. Stap 5: Content Hiaten & Prioriteitsmatrix

> **Doel:** Systematisch in kaart brengen waar te weinig content over is, gewogen naar hoeveel mantelzorgers het betreft.

### 5.1 Impactmatrix: aandoening × aantal mantelzorgers

Niet elke aandoening treft evenveel mantelzorgers. Dementie treft ~700.000 mantelzorgers, een zeldzame aandoening misschien 500. De content-dekking moet dit weerspiegelen.

**Nieuwe tabel:**

```prisma
model AandoeningGewicht {
  id                String   @id @default(cuid())
  tagSlug           String   @unique  // verwijst naar ContentTag.slug
  geschatAantal     Int      // Geschat aantal mantelzorgers in NL
  prioriteit        Int      @default(5) // 1-10, berekend of handmatig
  bronVermelding    String?  // "CBS 2024", "Alzheimer Nederland"
  updatedAt         DateTime @updatedAt
}
```

**Initiële data (indicatief):**

| Aandoening | Geschat aantal mantelzorgers | Prioriteit |
|------------|------------------------------|------------|
| Dementie | 700.000 | 10 |
| Kanker | 350.000 | 9 |
| Psychische aandoeningen | 300.000 | 9 |
| CVA/Beroerte | 200.000 | 8 |
| Hart- en vaatziekten | 180.000 | 8 |
| Ouderdomsklachten (algemeen) | 500.000 | 9 |
| Verstandelijke beperking | 150.000 | 7 |
| Parkinson | 80.000 | 6 |
| MS | 40.000 | 5 |
| NAH (niet-aangeboren hersenletsel) | 60.000 | 5 |
| ALS | 5.000 | 3 |

### 5.2 Onderwerp-impactmatrix

Niet elk onderwerp is even relevant. Financiën en regelingen raken iedereen; erfenissen een klein deel.

**Dezelfde aanpak voor ONDERWERP-tags:**

```prisma
model OnderwerpGewicht {
  id              String   @id @default(cuid())
  tagSlug         String   @unique
  relevantieBreedte  Int   // 1-10: hoeveel % van mantelzorgers dit betreft
  urgentie        Int      // 1-10: hoe urgent is dit onderwerp
  prioriteit      Int      // berekend: (breedte × 0.6) + (urgentie × 0.4)
  updatedAt       DateTime @updatedAt
}
```

| Onderwerp | Breedte | Urgentie | Prioriteit |
|-----------|---------|----------|------------|
| Financiën/vergoedingen | 9 | 8 | 8.6 |
| Wmo aanvragen | 8 | 9 | 8.4 |
| Overbelasting herkennen | 9 | 9 | 9.0 |
| Respijtzorg | 7 | 8 | 7.4 |
| Dagbesteding | 7 | 6 | 6.6 |
| Nachtrust | 8 | 7 | 7.6 |
| Medicatie beheer | 6 | 7 | 6.4 |
| Erfenis/testament | 3 | 3 | 3.0 |
| Huisdieren tijdens zorg | 2 | 2 | 2.0 |

### 5.3 Content-dekking dashboard

Nieuw beheer-component dat de impactmatrix combineert met huidige content:

```
┌──────────────────────────────────────────────────────┐
│ 📊 Content Dekking — Hiaten Analyse                   │
│                                                       │
│ Aandoening          Prioriteit  Artikelen  Dekking    │
│ ──────────────────────────────────────────────────    │
│ 🔴 Dementie           10          3         LAAG     │
│ 🔴 Kanker              9          2         LAAG     │
│ 🟡 Psychisch           9          4         GEMIDDELD │
│ 🟢 CVA/Beroerte        8          5         GOED     │
│ 🔴 Ouderdom            9          1         LAAG     │
│                                                       │
│ Onderwerp           Prioriteit  Artikelen  Dekking    │
│ ──────────────────────────────────────────────────    │
│ 🔴 Financiën           8.6        2         LAAG     │
│ 🔴 Wmo aanvragen       8.4        1         LAAG     │
│ 🟢 Overbelasting       9.0        6         GOED     │
│ 🟡 Respijtzorg         7.4        3         GEMIDDELD │
│                                                       │
│ [🤖 Genereer artikelen voor hiaten]                   │
│ [📥 Exporteer rapport]                                │
└──────────────────────────────────────────────────────┘
```

**Dekking-berekening:**
- LAAG: < 3 artikelen voor een prioriteit 7+ onderwerp
- GEMIDDELD: 3-5 artikelen
- GOED: 6+ artikelen
- (Drempelwaarden schalen mee met prioriteit: voor prioriteit 10 is GOED pas bij 8+ artikelen)

### 5.4 Content agent integratie

De content agent (`zoek-online` functie) krijgt de impactmatrix mee in de prompt:

```
PRIORITEITEN VOOR NIEUWE CONTENT:
De volgende hiaten zijn het meest urgent (hoge prioriteit, weinig artikelen):
1. Dementie — financiën en vergoedingen (0 artikelen, prioriteit 8.6)
2. Dementie — dagbesteding (1 artikel, prioriteit 6.6)
3. Kanker — overbelasting herkennen (0 artikelen, prioriteit 9.0)
...

Genereer artikelen die deze hiaten vullen, met voorkeur voor onderwerpen
die de meeste mantelzorgers raken.
```

### 5.5 Kruistabel: aandoening × onderwerp

De ultieme hiaten-analyse is een kruistabel: per aandoening × per onderwerp → hoeveel artikelen?

Dit wordt een beheer-pagina met een heatmap:

```
              | Financiën | Wmo | Overbelasting | Respijtzorg | Nachtrust |
──────────────|-----------|-----|---------------|-------------|-----------|
Dementie      |    🔴 0    | 🔴 0|     🟡 2      |    🟡 1     |   🔴 0    |
Kanker        |    🔴 0    | 🔴 0|     🔴 1      |    🔴 0     |   🟡 1    |
Psychisch     |    🟡 1    | 🟡 1|     🟢 3      |    🟡 2     |   🟡 1    |
Ouderdom      |    🔴 0    | 🔴 0|     🔴 0      |    🔴 0     |   🔴 0    |
```

**Celkleuring:**
- 🔴 Rood: 0 artikelen bij hoge-prioriteit combinatie
- 🟡 Geel: 1-2 artikelen
- 🟢 Groen: 3+ artikelen

**Klik op een cel → "Genereer artikel over [aandoening] + [onderwerp]"**

---

## 7. Stap 6: Bronvermelding & Auteurschap

> **Doel:** Transparant zijn over waar informatie vandaan komt en wie het geschreven heeft.

### 6.1 Bronvermelding-model

```prisma
model ArtikelBron {
  id          String   @id @default(cuid())
  artikelId   String
  bronNaam    String   // "Alzheimer Nederland", "Rijksoverheid", "MantelBuddy AI"
  bronUrl     String?  // Link naar de originele bron
  bronType    BronType // WEBSITE, ONDERZOEK, ORGANISATIE, AI_SAMENVATTING
  citaat      String?  // Optioneel: specifiek citaat of passage
  geraadpleegd DateTime @default(now()) // Datum waarop bron geraadpleegd is
  artikel     Artikel  @relation(fields: [artikelId], references: [id], onDelete: Cascade)

  @@index([artikelId])
}

enum BronType {
  WEBSITE           // Externe website (mantelzorg.nl, mezzo.nl, etc.)
  ONDERZOEK         // Wetenschappelijk onderzoek of rapport
  ORGANISATIE       // Informatie van een specifieke organisatie
  OVERHEID          // Rijksoverheid, gemeente, etc.
  AI_SAMENVATTING   // Door MantelBuddy AI samengesteld uit meerdere bronnen
}
```

### 6.2 Uitbreiding Artikel model

```prisma
// Toevoegen aan Artikel
auteur           String?   // "MantelBuddy", "Redactie MantelBuddy", of externe auteur
auteurType       AuteurType @default(REDACTIE)
bronnen          ArtikelBron[]

enum AuteurType {
  REDACTIE          // Geschreven door MantelBuddy redactie (menselijk)
  AI_GEGENEREERD    // Volledig AI-gegenereerd
  AI_SAMENGESTELD   // Door AI samengesteld uit meerdere bronnen — DIT IS DE BELANGRIJKSTE
  EXTERN            // Overgenomen van externe bron (met toestemming)
}
```

### 6.3 Bronvermelding in artikel-weergave

Onderaan elk artikel wordt een duidelijke bronsectie getoond:

```
┌──────────────────────────────────────────────────┐
│ ───────────────────────────────────────────────── │
│                                                   │
│ ℹ️ Over dit artikel                                │
│                                                   │
│ Dit artikel is geschreven door MantelBuddy op     │
│ basis van informatie uit de volgende bronnen:      │
│                                                   │
│ • Alzheimer Nederland — Mantelzorg bij dementie   │
│   alzheimer-nederland.nl/mantelzorg               │
│ • Rijksoverheid — Wmo aanvragen                   │
│   rijksoverheid.nl/wmo                            │
│ • Mezzo — Respijtzorg regelen                     │
│   mezzo.nl/respijtzorg                            │
│                                                   │
│ Geraadpleegd: maart 2026                          │
│ Laatst bijgewerkt: 14 maart 2026                  │
│                                                   │
│ ⚠️ Dit artikel is informatief bedoeld en vervangt  │
│ geen professioneel advies.                         │
└──────────────────────────────────────────────────┘
```

**Specifiek voor AI_SAMENGESTELD artikelen:**
> "Dit artikel is door MantelBuddy samengesteld op basis van informatie uit meerdere bronnen. De informatie is zorgvuldig geselecteerd en in begrijpelijke taal herschreven."

### 6.4 Content agent: bronnen automatisch vastleggen

Bij de functies `genereer`, `herschrijf` en `verrijk`:
1. De AI krijgt de instructie om gebruikte bronnen te benoemen in een apart JSON-blok
2. Na generatie worden bronnen automatisch opgeslagen in `ArtikelBron`
3. Het `auteurType` wordt automatisch gezet:
   - `genereer` → `AI_SAMENGESTELD`
   - `herschrijf` van extern artikel → `AI_SAMENGESTELD`
   - Handmatig geschreven → `REDACTIE`

**Prompt-aanpassing voor content agent:**
```
BELANGRIJK: Vermeld bij elk gegenereerd artikel ALLE bronnen die je hebt gebruikt.
Geef per bron: naam, URL (indien beschikbaar), en type (website/onderzoek/organisatie/overheid).

Als je informatie uit meerdere bronnen combineert tot een nieuw verhaal:
- Zet auteurType op "AI_SAMENGESTELD"
- Vermeld ALLE originele bronnen
- Maak duidelijk dat MantelBuddy dit artikel heeft samengesteld
```

### 6.5 Beheerportaal: bronnen beheren

Bij het bewerken van een artikel in het beheerportaal:
- Sectie "Bronnen" met mogelijkheid om bronnen toe te voegen/verwijderen
- Dropdown voor auteurType
- Automatisch ingevuld bij AI-generatie, handmatig aanpasbaar

---

## 8. Database Wijzigingen (totaaloverzicht)

### Nieuwe modellen

| Model | Doel |
|-------|------|
| `ContentScore` | Gebruiker-scores op artikelen en hulpbronnen |
| `LeesGeschiedenis` | Welke artikelen heeft de gebruiker gelezen |
| `ZorgorganisatieTag` | Tags op hulpbronnen (koppeltabel) |
| `ArtikelBron` | Bronvermelding per artikel |
| `AandoeningGewicht` | Impactgewicht per aandoening-tag |
| `OnderwerpGewicht` | Impactgewicht per onderwerp-tag |

### Uitbreidingen bestaande modellen

| Model | Nieuwe velden |
|-------|---------------|
| `Zorgorganisatie` | `wachttijd`, `bereikbaarheid`, `ervaringTekst`, `geschiktVoor[]`, `gemiddeldeScore`, `aantalScores` |
| `Artikel` | `auteur`, `auteurType`, `gemiddeldeScore`, `aantalScores`, `aantalGelezen` |
| `ContentTag` | `synoniemen[]` |

### Uitbreidingen bestaande enums

| Enum | Nieuwe waarden |
|------|----------------|
| `TagType` | `ONDERWERP`, `DOELGROEP`, `LEVENSFASE` |

### Nieuwe enums

| Enum | Waarden |
|------|---------|
| `ScoreType` | `ARTIKEL`, `HULPBRON` |
| `AuteurType` | `REDACTIE`, `AI_GEGENEREERD`, `AI_SAMENGESTELD`, `EXTERN` |
| `BronType` | `WEBSITE`, `ONDERZOEK`, `ORGANISATIE`, `OVERHEID`, `AI_SAMENVATTING` |

---

## 9. Bouwvolgorde

```
Stap 1: Hulpbronnen Tastbaar          ~16 uur
├── 1.1 DB migratie (nieuwe velden)         2 uur
├── 1.2 AI zoeker prompt aanpassen          3 uur
├── 1.3 Hulpbronkaart redesign              4 uur
├── 1.4 Zoek-UI met filters                 5 uur
└── 1.5 Batch-verrijking tool               2 uur

Stap 2: Tagging & Matching            ~14 uur
├── 2.1 Tag-taxonomie uitbreiden            2 uur
├── 2.2 Bulk-taggen met AI                  3 uur
├── 2.3 Synoniemen op tags                  2 uur
├── 2.4 Profiel tag-suggesties              3 uur
└── 2.5 Hulpbronnen taggen                  4 uur

Stap 3: Scoren & Relevantie           ~12 uur
├── 3.1 ContentScore + LeesGeschiedenis     2 uur
├── 3.2 "Was dit nuttig?" component         3 uur
├── 3.3 Score-aggregatie                    2 uur
├── 3.4 Score in zoekresultaten             2 uur
└── 3.5 Leesgeschiedenis tracking           3 uur

Stap 4: Voorgestelde Artikelen         ~12 uur
├── 4.1 Relevantie-score berekening         4 uur
├── 4.2 "Aanbevolen voor jou" sectie        3 uur
├── 4.3 Weekkaarten LEREN verbeteren        2 uur
└── 4.4 "Meer hierover" suggesties          3 uur

Stap 5: Content Hiaten                ~10 uur
├── 5.1 AandoeningGewicht + seed data       2 uur
├── 5.2 OnderwerpGewicht + seed data        2 uur
├── 5.3 Content-dekking dashboard           3 uur
├── 5.4 Content agent integratie            2 uur
└── 5.5 Kruistabel hiaten-analyse           1 uur

Stap 6: Bronvermelding                ~10 uur
├── 6.1 ArtikelBron model + migratie        2 uur
├── 6.2 Artikel auteur-velden               1 uur
├── 6.3 Bronsectie in artikel-weergave      3 uur
├── 6.4 Content agent bronnen vastleggen    2 uur
└── 6.5 Beheerportaal bronnen-sectie        2 uur

─────────────────────────────────────────────
Totaal geschat:                        ~74 uur
```

### Afhankelijkheden

```
Stap 1 (Hulpbronnen) ──→ Stap 3 (Scoren) ──→ Stap 4 (Aanbevelingen)
                     │                    │
Stap 2 (Tagging) ───┘                    └──→ Stap 5 (Hiaten)
                                          │
Stap 6 (Bronvermelding) ─────────────────┘ (onafhankelijk, kan parallel)
```

**Stap 1 en 2** kunnen deels parallel gebouwd worden.
**Stap 6** is volledig onafhankelijk en kan op elk moment.
**Stap 3** vereist dat stap 1 en 2 af zijn (tags nodig voor scoring).
**Stap 4 en 5** vereisen stap 3.

---

## 10. Acceptatiecriteria per Stap

### Stap 1: Hulpbronnen Tastbaar
- [ ] Elke hulpbron heeft een `eersteStap` (ingevuld of fallback)
- [ ] Hulpbronkaart toont: eerste stap, kosten, wachttijd (indien beschikbaar)
- [ ] Filters werken: categorie, soort hulp, dekkingsgebied
- [ ] Sortering op relevantie (standaard) en alfabetisch
- [ ] Batch-verrijking kan 50+ hulpbronnen verwerken

### Stap 2: Tagging & Matching
- [ ] 5 tag-types beschikbaar (AANDOENING, SITUATIE, ONDERWERP, DOELGROEP, LEVENSFASE)
- [ ] Alle bestaande artikelen getagd met minimaal 2 tag-types
- [ ] Synoniemen werken in zoekopdrachten
- [ ] Profiel-wizard stelt relevante tags voor na aandoening-selectie
- [ ] Hulpbronnen kunnen getagd worden

### Stap 3: Scoren & Relevantie
- [ ] Gebruiker kan artikel beoordelen met 👍/👎 + optionele reden
- [ ] Gebruiker kan hulpbron beoordelen
- [ ] Gemiddelde score zichtbaar bij >= 3 beoordelingen
- [ ] Leesgeschiedenis wordt bijgehouden (zonder merkbare vertraging)

### Stap 4: Voorgestelde Artikelen
- [ ] Dashboard toont "Aanbevolen voor jou" met 2-3 artikelen
- [ ] Aanbevelingen zijn persoonlijk (andere situatie = andere artikelen)
- [ ] Weekkaarten LEREN gebruiken relevantie-score
- [ ] Onderaan artikel staan 2-3 gerelateerde artikelen

### Stap 5: Content Hiaten
- [ ] Beheerder ziet content-dekking per aandoening en onderwerp
- [ ] Rode cellen in kruistabel zijn klikbaar → "Genereer artikel"
- [ ] Content agent gebruikt prioriteitsmatrix in voorstellen
- [ ] Prioriteitsdata is handmatig aanpasbaar door beheerder

### Stap 6: Bronvermelding
- [ ] Elk artikel toont bronsectie (indien bronnen aanwezig)
- [ ] AI-gegenereerde artikelen worden gemarkeerd als "Samengesteld door MantelBuddy"
- [ ] Content agent slaat bronnen automatisch op
- [ ] Beheerder kan bronnen toevoegen/bewerken
- [ ] Disclaimer "informatief bedoeld" onderaan elk artikel

---

## Relatie tot Masterplan

Dit plan vervangt **geen** bestaande iteraties maar voegt een nieuwe iteratie toe die **vóór** iteratie 5 (Content uit Code naar Database) komt, omdat het de content-infrastructuur fundamenteel verbetert.

**Voorgestelde inpassing:**

```
Iteratie 1-3: AFGEROND
Iteratie 4:   Gemeente Onboarding (fase 2: on hold)
─── NIEUW ──────────────────────────────────────
Iteratie 4B:  Content & Zoek Fundament (~74 uur, 4-5 weken)
────────────────────────────────────────────────
Iteratie 5:   Content uit Code naar Database
Iteratie 6:   Performance
Iteratie 7:   Toegankelijkheid
Iteratie 8:   Schaalbaarheid
```

---

*Dit plan is opgesteld op 14 maart 2026 en wacht op goedkeuring voordat de bouw begint.*
