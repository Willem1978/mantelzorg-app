# Plan: Content & Zoek Fundament — "Stevig als een Huis"

**Datum:** 14 maart 2026
**Versie:** 1.1
**Doel:** Artikelen proactief aanbevelen aan mantelzorgers op basis van hun persoonlijke profiel (tags), in plaats van hen door 100+ artikelen te laten zoeken. Hulpbronnen tastbaar maken. Content gericht genereren voor specifieke doelgroepen. Bronvermelding op orde.

---

## Kernvisie

> **Van "zoek zelf" naar "aanbevolen voor jou"**
>
> Een werkende mantelzorger met een dementerende moeder moet andere artikelen zien dan een gepensioneerde mantelzorger met een partner met kanker. Door profiel-tags (zoals *werkende mantelzorger*, *mantelzorger met gezin*, *dementie*, *op afstand*) te koppelen aan artikelen, kan het systeem de juiste content bij de juiste persoon brengen — zonder dat ze zelf hoeven te zoeken.
>
> Dit principe geldt ook voor het **genereren** van nieuwe artikelen: de AI content agent schrijft artikelen voor specifieke tag-combinaties (bijv. "financiën + werkende mantelzorger + dementie"), zodat elke doelgroep relevante content krijgt.

---

## Inhoudsopgave

1. [Probleemanalyse: Wat mist er nu?](#1-probleemanalyse)
2. [Stap 1: Tagging & Profiel-matching](#2-stap-1-tagging--profiel-matching)
3. [Stap 2: Aanbevolen Artikelen](#3-stap-2-aanbevolen-artikelen)
4. [Stap 3: Gerichte Artikelgeneratie](#4-stap-3-gerichte-artikelgeneratie)
5. [Stap 4: Hulpbronnen Tastbaar Maken](#5-stap-4-hulpbronnen-tastbaar-maken)
6. [Stap 5: Artikel Compleetheid & Kwaliteitsbeheer](#6-stap-5-artikel-compleetheid--kwaliteitsbeheer)
7. [Stap 6: Content Hiaten & Prioriteitsmatrix](#7-stap-6-content-hiaten--prioriteitsmatrix)
8. [Stap 6: Scoren & Feedback](#8-stap-6-scoren--feedback)
9. [Stap 7: Bronvermelding & Auteurschap](#9-stap-7-bronvermelding--auteurschap)
10. [Database Wijzigingen (totaaloverzicht)](#10-database-wijzigingen)
11. [Bouwvolgorde & Afhankelijkheden](#11-bouwvolgorde)
12. [Acceptatiecriteria per Stap](#12-acceptatiecriteria)

---

## 1. Probleemanalyse

### Wat werkt al goed
- 47+ artikelen in 7 categorieën met 21 tags
- ContentTag model met AANDOENING en SITUATIE types
- ArtikelTag koppeltabel (many-to-many)
- GebruikerVoorkeur model voor gebruikerspreferenties
- Semantisch zoeken via pgvector embeddings
- AI content agent kan artikelen genereren, herschrijven en verrijken
- Hulpbronnen zoeker vindt lokale organisaties per gemeente
- Weekkaarten linken naar artikelen

### Wat mist of niet goed genoeg is

| Probleem | Impact | Waar zit het? |
|----------|--------|---------------|
| **Tags onvoldoende benut voor artikelaanbevelingen** — artikelen matchen op categorie + belastingniveau, maar niet op profiel-tags (aandoening, situatie, levensfase) | Een werkende mantelzorger met dementie-naaste krijgt dezelfde artikelen als een gepensioneerde met kanker-naaste | `getAanbevolenArtikelen()` + ArtikelTag + GebruikerVoorkeur |
| **Geen profiel-tags voor specifieke doelgroepen** — het systeem kent alleen AANDOENING en SITUATIE tags, maar mist combinatie-tags zoals "werkende mantelzorger", "mantelzorger met gezin", "jong mantelzorger" | Artikelen kunnen niet worden geschreven/gematcht voor specifieke doelgroepen | ContentTag model + TagType enum |
| **Artikelen worden niet gericht gegenereerd** — de content agent maakt generieke artikelen, niet specifiek voor een doelgroep (bijv. "Financiën voor werkende mantelzorgers met dementie-naaste") | Alle artikelen zijn te generiek; de persoonlijke herkenning ontbreekt | Content agent prompts |
| **Geen "aanbevolen voor jou" op dashboard** — het dashboard toont weekkaarten maar geen persoonlijke artikellijst op basis van profiel | Mantelzorger moet zelf zoeken in 100+ artikelen | Dashboard + leren-pagina |
| **Geen gebruikersfeedback op content** — geen scores, geen "was dit nuttig?", geen leesgeschiedenis | Geen data om aanbevelingen te verbeteren | Ontbreekt volledig |
| **Hulpbronnen zijn niet tastbaar** — beschrijvingen te vaag, geen concrete "wat kun je verwachten", geen stappen | Mantelzorger weet niet wat ze aan een organisatie hebben | Zorgorganisatie model + AI zoeker output |
| **Zoekwoorden-matching onvolledig** — "PGB aanvragen" vindt niks als artikel "Persoonsgebonden budget" heet | Relevante artikelen worden niet gevonden | zoekArtikelen tool |
| **Content hiaten niet zichtbaar per doelgroep** — curator kan hiaten detecteren maar niet per tag-combinatie | Dementie (700.000+ mantelzorgers) heeft evenveel artikelen als zeldzame aandoeningen | Content agent + curator |
| **Bronvermelding ontbreekt** — geen "geschreven door", geen bronlinks bij AI-gegenereerde artikelen | Vertrouwen en transparantie ontbreken | Artikel model |

---

## 2. Stap 1: Tagging & Profiel-matching

> **Doel:** Het fundament leggen — een slim tagsysteem dat mantelzorgers profileert en artikelen koppelt aan hun specifieke situatie. Dit is de basis voor alle aanbevelingen.

### 1.1 Tag-taxonomie uitbreiden

Het huidige `ContentTag` model heeft 2 types: AANDOENING en SITUATIE. Dit is onvoldoende om doelgroepen als "werkende mantelzorger met dementie-naaste" te herkennen.

**Uitbreiding TagType enum:**

```prisma
enum TagType {
  AANDOENING    // dementie, kanker, CVA, parkinson, psychisch
  SITUATIE      // werkend, jong, op-afstand, samenwonend, met-gezin
  ONDERWERP     // NIEUW: financien, wmo, medicatie, nachtrust, voeding
  DOELGROEP     // NIEUW: partner, kind, ouder, buur, professional
  LEVENSFASE    // NIEUW: begin-mantelzorg, langdurig, rouw-na-verlies
}
```

**Specifieke profieltags voor matching (voorbeelden):**

| Type | Tags | Waarom? |
|------|------|---------|
| SITUATIE | `werkend`, `werkend-parttime`, `met-gezin`, `jong-mantelzorger`, `op-afstand`, `samenwonend`, `alleenstaand`, `mantelzorger-van-kind`, `dubbele-mantelzorg` | Dit zijn de "herkenningslabels" waarmee een mantelzorger zich identificeert. Een artikel "Werk en zorg combineren" wordt getagd met `werkend` en matcht dan automatisch met alle werkende mantelzorgers. |
| AANDOENING | `dementie`, `kanker`, `CVA`, `parkinson`, `psychisch`, `verstandelijke-beperking`, `NAH`, `ouderdomsklachten`, `hartfalen`, `MS`, `ALS` | De aandoening van de naaste bepaalt welke zorgspecifieke artikelen relevant zijn. |
| ONDERWERP | `financien`, `wmo-aanvragen`, `pgb`, `eigen-bijdrage`, `medicatie`, `nachtrust`, `voeding`, `veiligheid-thuis`, `hulpmiddelen`, `dagbesteding`, `vervoer`, `respijtzorg`, `werk-zorg-balans`, `zelfzorg`, `emotionele-steun` | Inhoudelijke onderwerpen die de relevantie van een artikel bepalen. |
| DOELGROEP | `partner-mantelzorger`, `kind-mantelzorger`, `ouder-van-zorgkind`, `buur-mantelzorger`, `mantelzorger-op-afstand` | De relatie met de zorgvrager bepaalt de toon en relevantie. |
| LEVENSFASE | `net-begonnen`, `al-jaren-bezig`, `crisis`, `rouw-na-verlies`, `opname-naaste`, `terugval-na-behandeling` | Waar de mantelzorger in het zorgtraject zit. |

### 1.2 Profiel-tags ophalen uit bestaande data

Het systeem kent al veel over de mantelzorger uit de intake en belastbaarheidstest. Deze data moet omgezet worden naar profiel-tags:

| Bestaande data | → Profiel-tag |
|----------------|---------------|
| `caregiver.aandoening = "dementie"` | Tag: `dementie` (AANDOENING) |
| Werkt (uit intake/profiel) | Tag: `werkend` (SITUATIE) |
| Heeft thuiswonende kinderen | Tag: `met-gezin` (SITUATIE) |
| Woont niet samen met naaste | Tag: `op-afstand` (SITUATIE) |
| `belastingTest.zorgtaken` bevat meerdere taken | Tag: `dubbele-mantelzorg` (SITUATIE) |
| Leeftijd < 25 | Tag: `jong-mantelzorger` (SITUATIE) |
| Zorgt al > 3 jaar | Tag: `al-jaren-bezig` (LEVENSFASE) |
| Net geregistreerd, < 1 jaar zorgen | Tag: `net-begonnen` (LEVENSFASE) |

**Technisch:** Functie `bepaalProfielTags(caregiver)` die op basis van profieldata automatisch de juiste tags berekent. Deze draait bij:
- Eerste login na registratie
- Na intake-gesprek met Ger
- Na voltooien belastbaarheidstest
- Handmatig door gebruiker (tag-voorkeuren instellen)

### 1.3 Artikelen taggen voor doelgroepen

Elk artikel krijgt tags die bepalen voor **wie** het relevant is. Voorbeeld:

| Artikel | Tags |
|---------|------|
| "Werk en mantelzorg combineren: 7 tips" | `werkend`, `werk-zorg-balans` |
| "Dementie: veiligheid in huis" | `dementie`, `veiligheid-thuis`, `samenwonend` |
| "Financiële steun als je voor je kind zorgt" | `ouder-van-zorgkind`, `financien` |
| "Als je moeder je niet meer herkent" | `dementie`, `kind-mantelzorger`, `emotionele-steun` |
| "Mantelzorg naast je gezin: hoe houd je balans?" | `met-gezin`, `zelfzorg`, `werk-zorg-balans` |
| "Respijtzorg: even op adem komen" | `respijtzorg`, `al-jaren-bezig`, `zelfzorg` |

### 1.4 Bestaande artikelen bulk-taggen

De 47+ bestaande artikelen moeten getagd worden met de nieuwe tag-types.

**Aanpak:** AI-gestuurde bulk-tagging via de content agent:
1. Lees alle artikelen zonder tags (of alleen met AANDOENING/SITUATIE tags)
2. AI analyseert titel + beschrijving + inhoud
3. Stelt relevante tags voor uit alle 5 types
4. Beheerder reviewt en bevestigt per artikel

**Nieuw endpoint:** `POST /api/ai/admin/content-agent` met type `"tag-bulk"`

### 1.5 Zoekwoorden / synoniemen op tags

Probleem: een gebruiker zoekt "PGB" maar de tag heet "persoonsgebonden-budget". Of zoekt "thuishulp" terwijl de categorie "Huishoudelijke taken" heet.

**Uitbreiding ContentTag model:**

```prisma
model ContentTag {
  // bestaande velden...
  synoniemen     String[]   // NIEUW: ["PGB", "persoonsgebonden budget", "pgb aanvragen"]
}
```

De zoektools (`zoekArtikelen`, `zoekHulpbronnen`, `semantischZoeken`) zoeken dan ook in synoniemen.

### 1.6 Hulpbronnen taggen

Hulpbronnen (Zorgorganisatie) krijgen dezelfde tags als artikelen. Een hulpbron voor dagbesteding bij dementie krijgt tags: `dementie` + `dagbesteding`. Dit maakt cross-matching mogelijk: als een mantelzorger een artikel over dagbesteding leest, kunnen we ook de bijpassende hulpbron tonen.

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

### 1.7 Tag-voorkeuren in profiel

De mantelzorger kan in het profiel zelf tags aan/uitzetten:

```
┌──────────────────────────────────────────────────┐
│ Je situatie                                       │
│                                                   │
│ Dit helpt ons om de juiste artikelen te tonen.    │
│                                                   │
│ ✅ Werkende mantelzorger                          │
│ ✅ Mantelzorger met gezin                         │
│ ☐  Jong mantelzorger                              │
│ ☐  Mantelzorg op afstand                          │
│ ✅ Dementie (naaste)                              │
│ ☐  Net begonnen met zorgen                        │
│ ✅ Al jaren bezig                                  │
│                                                   │
│ [Opslaan]                                          │
└──────────────────────────────────────────────────┘
```

Automatisch ingevuld vanuit profiel-data (1.2), handmatig aanpasbaar.

---

## 3. Stap 2: Aanbevolen Artikelen

> **Doel:** De juiste artikelen bij de juiste gebruiker, automatisch. Van "zoek zelf" naar "dit is voor jou".

### 2.1 Persoonlijke relevantie-score berekenen

De huidige `getAanbevolenArtikelen()` matcht alleen op categorie + belastingniveau. Dit wordt vervangen door een **persoonlijke relevantie-score** per artikel, berekend op basis van tag-overlap:

| Factor | Gewicht | Hoe? |
|--------|---------|------|
| **Tag-overlap** | 40% | Hoeveel van de profiel-tags van de gebruiker matchen met de tags van het artikel? Een artikel met 3/4 matchende tags scoort hoger dan 1/4. |
| **Aandoening-match** | 25% | Extra gewicht als de aandoening-tag matcht — dit is de belangrijkste dimensie. |
| **Situatie-match** | 15% | "Werkend" of "met gezin" als profiel-tag matcht met artikel-tag. |
| **Belastingniveau-match** | 10% | Hoge belasting → zelfzorg en rechten-artikelen krijgen bonus. |
| **Community-score** | 5% | Gemiddelde beoordeling door andere gebruikers. |
| **Nog niet gelezen** | 5% | Ongelezen artikelen krijgen een kleine bonus. |

**Voorbeeld berekening:**

Mantelzorger: Tags = `[werkend, dementie, met-gezin, al-jaren-bezig]`, belasting = HOOG

| Artikel | Tags | Overlap | Score |
|---------|------|---------|-------|
| "Werk en mantelzorg: 7 tips" | `werkend, werk-zorg-balans` | 1/4 + werkend-match | **72%** |
| "Dementie & werk: beide combineren" | `werkend, dementie, werk-zorg-balans` | 2/4 + aandoening | **89%** |
| "Kanker en kinderen: hoe leg je uit" | `kanker, ouder-van-zorgkind` | 0/4 | **12%** |
| "Mantelzorg naast je gezin" | `met-gezin, zelfzorg` | 1/4 + situatie | **68%** |

De mantelzorger ziet dus "Dementie & werk" bovenaan, daarna "Werk en mantelzorg", dan "Mantelzorg naast je gezin". Het kanker-artikel verschijnt niet.

### 2.2 "Aanbevolen voor jou" op dashboard

Nieuwe sectie op het dashboard die de top 3-5 artikelen toont op basis van de relevantie-score:

```
┌──────────────────────────────────────────────────┐
│ 📖 Aanbevolen voor jou                            │
│                                                   │
│ Op basis van je situatie: dementie, werkend,       │
│ mantelzorger met gezin                             │
│                                                   │
│ ┌─────────────────────────────────────────────────┐
│ │ 🧠 Dementie en werk combineren                  │
│ │ Praktische tips voor als je werkt en zorgt voor  │
│ │ iemand met dementie                              │
│ │ ⭐ 4.5  •  3 min lezen  •  89% match             │
│ └─────────────────────────────────────────────────┘
│ ┌─────────────────────────────────────────────────┐
│ │ 💼 Werk en mantelzorg: 7 tips                    │
│ │ Hoe bespreek je het op werk? Welke rechten heb   │
│ │ je? Tips om het vol te houden.                   │
│ │ ⭐ 4.2  •  5 min lezen  •  72% match             │
│ └─────────────────────────────────────────────────┘
│ ┌─────────────────────────────────────────────────┐
│ │ 👨‍👩‍👧 Mantelzorg naast je gezin                    │
│ │ Hoe houd je balans als je ook kinderen hebt?     │
│ │ ⭐ 4.8  •  4 min lezen  •  68% match             │
│ └─────────────────────────────────────────────────┘
│                                                   │
│ [Bekijk alle aanbevelingen →]                     │
└──────────────────────────────────────────────────┘
```

### 2.3 Leren-pagina sorteren op relevantie

De huidige leren-pagina toont artikelen op volgorde van `sorteerVolgorde`. Met tags kan dit worden:

1. **Standaard: gesorteerd op relevantie** — de persoonlijke relevantie-score bepaalt de volgorde
2. **Optioneel: filter op tag** — bijv. "Toon alleen artikelen over dementie" of "Toon alleen voor werkende mantelzorgers"
3. **"Nieuw voor jou"** — artikelen die je nog niet gelezen hebt, gesorteerd op relevantie

### 2.4 Weekkaarten LEREN slimmer vullen

Huidige weekkaarten LEREN-type selecteert artikelen op basis van categorie. Verbeteren met:
1. **Relevantie-score als primair selectiecriterium** — kies het hoogst scorende artikel dat nog niet is getoond
2. Niet-gelezen artikelen prefereren boven gelezen
3. Artikelen met hoge community-score prefereren
4. Afwisseling in categorieën (niet 3 weken achtereen dezelfde categorie)

### 2.5 "Meer hierover" suggesties

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

### 2.6 Ger (AI-assistent) integratie

Ger krijgt de profiel-tags mee in de context en kan:
- Bij vragen proactief het best matchende artikel suggereren
- Zeggen: "Ik heb een artikel dat speciaal is geschreven voor werkende mantelzorgers met dementie in de familie — wil je dat lezen?"
- Bij het tonen van een artikel de match-reden vermelden ("Dit past bij jouw situatie als werkende mantelzorger")

---

## 4. Stap 3: Gerichte Artikelgeneratie

> **Doel:** Artikelen schrijven voor specifieke doelgroepen op basis van tag-combinaties, zodat elke mantelzorger content vindt die écht bij hen past.

### 3.1 Doelgroep-specifieke artikelen genereren

De content agent genereert nu generieke artikelen. Met het tagsysteem kan de agent **gericht** schrijven voor specifieke tag-combinaties:

**Voorbeeld generatie-opdrachten:**

| Doelgroep (tags) | Onderwerp | Artikel |
|------------------|-----------|---------|
| `werkend` + `dementie` | Werk-zorgbalans | "Dementie en werk: zo combineer je het" |
| `met-gezin` + `kanker` | Emotionele steun | "Je partner heeft kanker: hoe leg je het uit aan je kinderen?" |
| `jong-mantelzorger` + `psychisch` | Zelfzorg | "Jong en mantelzorger: het is oké om hulp te vragen" |
| `op-afstand` + `ouderdomsklachten` | Praktisch | "Op afstand zorgen: hoe houd je grip?" |
| `werkend` + `met-gezin` | Financieel | "Mantelzorgverlof en andere financiële regelingen voor werkende ouders" |
| `al-jaren-bezig` + `dementie` | Emotioneel | "Als de zorg al jaren duurt: hoe voorkom je dat je opbrandt?" |

### 3.2 Slimme generatie-voorstellen op basis van data

De admin hoeft niet zelf te bedenken welke artikelen er moeten komen. De agent analyseert:

1. **Wat wordt veel gelezen?** — LeesGeschiedenis data: welke categorieën/tags zijn populair?
2. **Wat scoort goed?** — ContentScore data: welke artikelen beoordelen gebruikers als nuttig?
3. **Wat ontbreekt?** — De generatie-matrix (3.3): welke tag-combinaties hebben geen artikelen?
4. **Wie zijn de gebruikers?** — Profiel-tags: hoeveel werkende mantelzorgers zijn er vs. jonge mantelzorgers?

**Workflow:**

1. Admin opent "Artikelen genereren" pagina
2. Geeft aan: **hoeveel artikelen** wil ik laten genereren (bijv. 5, 10, 20)
3. De agent analyseert de data en presenteert een **voorstel**:

```
┌──────────────────────────────────────────────────────┐
│ 🤖 Voorstel: 10 artikelen genereren                   │
│                                                       │
│ Op basis van: 234 actieve gebruikers, leesgedrag,     │
│ scores en ontbrekende tag-combinaties                  │
│                                                       │
│ Prioriteit  Doelgroep              Onderwerp           │
│ ──────────────────────────────────────────────────     │
│ 1. ⭐⭐⭐  werkend + dementie       Financiën          │
│    → 87 werkende mantelzorgers, 0 artikelen            │
│ 2. ⭐⭐⭐  met-gezin + kanker       Kinderen uitleggen │
│    → 62 mantelzorgers met gezin, 0 artikelen           │
│ 3. ⭐⭐   werkend + dementie       Zelfzorg            │
│    → Zelfzorg-artikelen scoren gem. 4.6/5              │
│ 4. ⭐⭐   op-afstand + ouderdom    Praktische tips     │
│    → 45 mantelzorgers op afstand, 1 artikel            │
│ 5. ⭐⭐   jong + psychisch         Emotionele steun   │
│    → "Emotionele steun" categorie meest gelezen        │
│ ... (5 meer)                                           │
│                                                       │
│ [✏️ Aanpassen voorstel]  [🚀 Genereer alle 10]         │
└──────────────────────────────────────────────────────┘
```

4. Admin kan het voorstel aanpassen (artikelen verwijderen, tags wijzigen, onderwerp aanpassen)
5. Klikt "Genereer" → content agent schrijft alle artikelen met de juiste tags
6. Artikelen komen in status CONCEPT, klaar voor review

### 3.3 Generatie-matrix: welke combinaties bestaan er nog niet?

Het systeem toont welke tag-combinaties al gedekt zijn en welke niet:

```
                 | werkend | met-gezin | op-afstand | jong | al-jaren |
─────────────────|---------|-----------|------------|------|----------|
dementie         |   🟢 3   |    🔴 0    |    🟡 1     | 🔴 0  |   🟡 1    |
kanker           |   🔴 0   |    🔴 0    |    🔴 0     | 🔴 0  |   🔴 0    |
psychisch        |   🔴 0   |    🔴 0    |    🔴 0     | 🟡 1  |   🔴 0    |
ouderdom         |   🟡 1   |    🔴 0    |    🟡 1     | 🔴 0  |   🟡 2    |
```

**Klik op een rode cel → "Genereer artikel voor [situatie] + [aandoening]"**

### 3.4 Content agent prompt aanpassen

De content agent krijgt een nieuwe functie `"genereer-voor-doelgroep"`:

```
Schrijf een artikel voor mantelzorgers met de volgende kenmerken:
- Situatie: werkende mantelzorger met gezin
- Aandoening naaste: dementie
- Onderwerp: financiële regelingen

Het artikel moet:
1. Geschreven zijn in B1-taalniveau (eenvoudig Nederlands)
2. Specifiek ingaan op de combinatie werk + gezin + dementie
3. Concrete, uitvoerbare tips bevatten
4. Herkenbare voorbeelden gebruiken
5. Een "eerste stap" bevatten (1 concrete actie die de lezer vandaag kan doen)

Tags voor dit artikel: werkend, met-gezin, dementie, financien
```

### 3.5 Batch-generatie per doelgroep

Admin kan ook handmatig een doelgroep + aandoening selecteren en aangeven hoeveel artikelen:

1. Selecteer doelgroep: "werkende mantelzorger"
2. Selecteer aandoening: "dementie"
3. Selecteer aantal: 5
4. Systeem toont ontbrekende onderwerpen: financieel, zelfzorg, praktisch, emotioneel, rechten
5. Content agent genereert 5 artikelen met de juiste tags
6. Admin reviewt en publiceert

---

## 5. Stap 4: Hulpbronnen Tastbaar Maken

> **Doel:** Elke hulpbron voelt concreet — de mantelzorger weet precies wat ze kunnen verwachten, wat de eerste stap is, en wat het kost.

### 4.1 Zorgorganisatie velden verrijken

De velden `eersteStap` en `verwachtingTekst` bestaan al maar zijn bij de meeste hulpbronnen leeg.

**Nieuwe velden op Zorgorganisatie:**

```prisma
wachttijd         String?   // "Meestal binnen 2 weken"
bereikbaarheid    String?   // "Ma-vr 9-17"
ervaringTekst     String?   // "Ze komen bij je thuis voor een gesprek van 30 min"
geschiktVoor      String[]  // ["dementie", "parkinson"] — specifieke aandoeningen
```

### 4.2 AI Zoeker: verplicht eersteStap en ervaringTekst

**Wijziging in `hulpbronnen-zoeker.ts`:**
- `eersteStap` wordt verplicht in de AI-output
- `ervaringTekst` wordt verplicht (1-2 zinnen: wat kun je verwachten)
- Fallback per categorie als de AI het niet kan bepalen

### 4.3 Frontend: hulpbronkaart redesign

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

### 4.4 Hulpbronnen zoek-UI met filters

**Filters:**
- Categorie (zorgtaken)
- Aandoening (op basis van profiel)
- Soort hulp (praktisch / emotioneel / financieel)
- Dekkingsgebied (gemeente / regio / landelijk)

### 4.5 Batch-verrijking bestaande hulpbronnen

Admin-tool voor AI-verrijking van bestaande hulpbronnen (eersteStap, ervaringTekst). Batches van 5.

---

## 6. Stap 5: Artikel Compleetheid & Kwaliteitsbeheer

> **Doel:** Elk artikel doorloopt een kwaliteitsproces. De beheerder ziet in één oogopslag welke artikelen "af" zijn en welke stappen nog missen. Via agents kunnen ontbrekende stappen automatisch worden uitgevoerd.

### 5.1 Artikel-compleetheidscore

Elk artikel heeft een kwaliteitsproces dat uit meerdere stappen bestaat. De voortgang wordt uitgedrukt als een **percentage**:

| Stap | Gewicht | Beschrijving | Automatiseerbaar? |
|------|---------|-------------|-------------------|
| **Tags toegekend** | 15% | Minimaal 2 tag-types (AANDOENING + SITUATIE of ONDERWERP) | Ja (AI agent) |
| **B1-taalcheck** | 15% | Artikel gecontroleerd op B1-taalniveau | Ja (curator) |
| **Inhoud compleet** | 15% | `inhoud` veld is gevuld (niet alleen beschrijving) | Nee |
| **Bronvermelding** | 10% | Minimaal 1 bron vermeld (ArtikelBron) | Ja (content agent) |
| **Categorie + subhoofdstuk** | 10% | Correct gecategoriseerd | Ja (AI agent) |
| **Emoji/icoon** | 5% | Visueel herkenbaar | Ja (AI agent) |
| **SEO/beschrijving** | 10% | Beschrijving aanwezig en < 160 tekens | Ja (AI agent) |
| **Review door beheerder** | 10% | Handmatig goedgekeurd | Nee |
| **Embedding gegenereerd** | 5% | Vector embedding voor semantisch zoeken | Ja (automatisch) |
| **Publicatie-check** | 5% | Status = GEPUBLICEERD, publicatieDatum ingesteld | Nee |

**Compleetheidscore = som van voltooide stappen × gewicht**

Voorbeeld: een artikel met tags (15%) + B1-check (15%) + inhoud (15%) + categorie (10%) = **55%**

### 5.2 Compleetheids-dashboard voor beheerder

```
┌──────────────────────────────────────────────────────────────┐
│ 📋 Artikel Kwaliteitsbeheer                                   │
│                                                               │
│ Filters: [Compleetheid ▼] [Status ▼] [Categorie ▼] [Tags ▼] │
│                                                               │
│ ○ Toon alleen: □ <50%  □ 50-79%  □ 80-99%  ☑ Alle           │
│                                                               │
│ Artikel                          Status      Compleet  Actie  │
│ ─────────────────────────────────────────────────────────────│
│ 🔴 Dementie en werk combineren    CONCEPT      35%     [▶]   │
│    ⬜ Tags  ⬜ B1  ✅ Inhoud  ⬜ Bron  ✅ Cat                  │
│                                                               │
│ 🟡 Wmo aanvragen stap voor stap   HERSCHREVEN  65%     [▶]   │
│    ✅ Tags  ✅ B1  ✅ Inhoud  ⬜ Bron  ✅ Cat  ⬜ Review       │
│                                                               │
│ 🟢 Slaaptips voor mantelzorgers   GEPUBLICEERD 95%     [▶]   │
│    ✅ Tags  ✅ B1  ✅ Inhoud  ✅ Bron  ✅ Cat  ✅ Review       │
│    ⬜ Embedding                                               │
│                                                               │
│ Geselecteerd: 12 artikelen                                    │
│ [🤖 Tags toevoegen]  [🤖 B1-check]  [🤖 Bronnen zoeken]      │
│ [🤖 Embeddings genereren]  [🤖 Alle ontbrekende stappen]      │
└──────────────────────────────────────────────────────────────┘
```

### 5.3 Batch-acties via agents

De beheerder kan artikelen selecteren en per ontbrekende stap een agent starten:

| Actie | Agent | Wat doet het? |
|-------|-------|---------------|
| **Tags toevoegen** | Content agent `"tag-bulk"` | AI leest artikel en stelt tags voor uit alle 5 types. Beheerder reviewt. |
| **B1-taalcheck** | Curator `"b1check"` | Controleert taalniveau, markeert moeilijke passages. |
| **Bronnen zoeken** | Content agent `"zoek-bronnen"` | Zoekt online bronnen die bij het artikel passen en voegt ze toe. |
| **Categoriseren** | Content agent `"categoriseer-bulk"` | AI bepaalt juiste categorie en subhoofdstuk. |
| **Embeddings** | Embeddings API | Genereert vector embedding voor semantisch zoeken. |
| **Alle stappen** | Sequentieel | Voert alle ontbrekende stappen achtereenvolgens uit. |

### 5.4 Per-artikel actie-overzicht

Bij klik op een artikel ziet de beheerder exact welke stappen nog ontbreken en kan per stap kiezen:

```
┌──────────────────────────────────────────────────┐
│ 📝 Dementie en werk combineren — 35% compleet     │
│                                                   │
│ ✅ Inhoud compleet (1.423 woorden)                │
│ ✅ Categorie: praktische-tips > dagelijks-zorgen  │
│ ⬜ Tags — geen tags toegekend                     │
│    [🤖 AI tags laten voorstellen]  [✏️ Handmatig] │
│ ⬜ B1-taalcheck — niet uitgevoerd                 │
│    [🤖 B1-check uitvoeren]                        │
│ ⬜ Bronvermelding — geen bronnen                  │
│    [🤖 Bronnen zoeken]  [✏️ Handmatig toevoegen]  │
│ ⬜ Emoji — niet ingesteld                         │
│    [🤖 Suggestie]  [✏️ Handmatig]                 │
│ ⬜ Review — niet beoordeeld                       │
│    [✅ Goedkeuren]  [❌ Afwijzen met opmerking]     │
│ ⬜ Embedding — niet gegenereerd                   │
│    [🤖 Genereer]                                   │
│ ⬜ Publicatie — status is CONCEPT                  │
│    [📢 Publiceer]  [📅 Plan publicatie]             │
│                                                   │
│ [🤖 Alle ontbrekende stappen uitvoeren]            │
└──────────────────────────────────────────────────┘
```

### 5.5 Filteren en sorteren op compleetheid

De beheerder kan het overzicht filteren op:
- **Compleetheidspercentage**: < 50%, 50-79%, 80-99%, 100%
- **Ontbrekende stap**: "Toon alle artikelen zonder tags", "zonder B1-check", etc.
- **Status**: CONCEPT, HERSCHREVEN, VERRIJKT, GEPUBLICEERD
- **Categorie**: per artikelcategorie
- **Tags**: per tag (bijv. "toon alle dementie-artikelen")

**Sortering:**
- Compleetheid (laagst eerst — prioriteer onafgemaakte artikelen)
- Laatst bewerkt
- Populairiteit (leesaantallen)
- Alfabetisch

---

## 7. Stap 6a: Content Hiaten & Prioriteitsmatrix

> **Doel:** Systematisch in kaart brengen waar te weinig content over is, gewogen naar hoeveel mantelzorgers het betreft. Gecombineerd met de generatie-matrix uit Stap 3.

### 6.1 Impactmatrix: aandoening × aantal mantelzorgers

```prisma
model AandoeningGewicht {
  id                String   @id @default(cuid())
  tagSlug           String   @unique
  geschatAantal     Int      // Geschat aantal mantelzorgers in NL
  prioriteit        Int      @default(5) // 1-10
  bronVermelding    String?  // "CBS 2024", "Alzheimer Nederland"
  updatedAt         DateTime @updatedAt
}
```

| Aandoening | Geschat aantal | Prioriteit |
|------------|----------------|------------|
| Dementie | 700.000 | 10 |
| Ouderdomsklachten | 500.000 | 9 |
| Kanker | 350.000 | 9 |
| Psychisch | 300.000 | 9 |
| CVA/Beroerte | 200.000 | 8 |
| Hart- en vaatziekten | 180.000 | 8 |
| Verstandelijke beperking | 150.000 | 7 |
| Parkinson | 80.000 | 6 |
| NAH | 60.000 | 5 |
| MS | 40.000 | 5 |
| ALS | 5.000 | 3 |

### 6.2 Onderwerp-impactmatrix

```prisma
model OnderwerpGewicht {
  id                 String   @id @default(cuid())
  tagSlug            String   @unique
  relevantieBreedte  Int      // 1-10
  urgentie           Int      // 1-10
  prioriteit         Int      // berekend
  updatedAt          DateTime @updatedAt
}
```

| Onderwerp | Breedte | Urgentie | Prioriteit |
|-----------|---------|----------|------------|
| Overbelasting herkennen | 9 | 9 | 9.0 |
| Financiën/vergoedingen | 9 | 8 | 8.6 |
| Wmo aanvragen | 8 | 9 | 8.4 |
| Nachtrust | 8 | 7 | 7.6 |
| Respijtzorg | 7 | 8 | 7.4 |
| Dagbesteding | 7 | 6 | 6.6 |
| Medicatie beheer | 6 | 7 | 6.4 |

### 6.3 Gecombineerde hiaten-analyse (met generatie-matrix)

De hiaten-analyse uit 6.1/6.2 wordt gecombineerd met de generatie-matrix uit Stap 3.3. Dit geeft een 3-dimensionaal beeld:

**Dimensie 1:** Aandoening × Onderwerp (welke combinatie mist?)
**Dimensie 2:** Situatie × Aandoening (voor welke doelgroep mist het?)
**Dimensie 3:** Prioriteit × Dekking (waar moeten we het eerst schrijven?)

De "Genereer artikelen" knop op de hiaten-pagina roept direct de slimme generatie-workflow aan (Stap 3.2).

### 6.4 Content-dekking dashboard

```
┌──────────────────────────────────────────────────────┐
│ 📊 Content Dekking                                    │
│                                                       │
│ Totaal: 47 artikelen  •  Gemiddelde compleetheid: 62% │
│                                                       │
│ Per doelgroep:                                        │
│ 🔴 Werkende mantelzorger    3 artikelen (nodig: 10+)  │
│ 🔴 Mantelzorger met gezin   1 artikel   (nodig: 8+)   │
│ 🟡 Jong mantelzorger        4 artikelen (nodig: 6+)   │
│ 🟡 Op afstand               2 artikelen (nodig: 6+)   │
│ 🟢 Algemeen                 37 artikelen              │
│                                                       │
│ [🤖 Genereer voor hiaten (10 artikelen)]              │
│ [📊 Bekijk generatie-matrix]                          │
└──────────────────────────────────────────────────────┘
```

---

## 8. Stap 6b: Scoren & Feedback

> **Doel:** Gebruikers kunnen artikelen en hulpbronnen beoordelen. Dit verbetert aanbevelingen en geeft inzicht in content-kwaliteit. De feedback-data voedt de slimme generatie (Stap 3).

### 6.1 ContentScore model

```prisma
model ContentScore {
  id            String    @id @default(cuid())
  caregiverId   String
  type          ScoreType // ARTIKEL of HULPBRON
  itemId        String    // Artikel ID of Zorgorganisatie ID
  score         Int       // 1 (niet nuttig) / 5 (nuttig)
  feedback      String?   // Optionele vrije tekst
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

### 6.2 LeesGeschiedenis

```prisma
model LeesGeschiedenis {
  id            String    @id @default(cuid())
  caregiverId   String
  artikelId     String
  gelezenOp     DateTime  @default(now())
  leestijd      Int?      // Geschatte leestijd in seconden
  caregiver     Caregiver @relation(fields: [caregiverId], references: [id], onDelete: Cascade)

  @@unique([caregiverId, artikelId])
  @@index([caregiverId])
  @@index([artikelId])
}
```

### 6.3 "Was dit nuttig?" component

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

### 6.4 Score-aggregatie en gebruik

Op Artikel en Zorgorganisatie worden gecachte velden bijgehouden:

```prisma
// Toevoegen aan Artikel
gemiddeldeScore   Float?
aantalScores      Int       @default(0)
aantalGelezen     Int       @default(0)

// Toevoegen aan Zorgorganisatie
gemiddeldeScore   Float?
aantalScores      Int       @default(0)
```

- Score zichtbaar bij >= 3 beoordelingen
- AI assistenten kunnen zeggen: "Dit artikel wordt door andere mantelzorgers als heel nuttig beoordeeld"
- **Slimme generatie (Stap 3.2) gebruikt deze data** om te bepalen welk soort artikelen populair zijn

---

## 9. Stap 7: Bronvermelding & Auteurschap

> **Doel:** Transparant zijn over waar informatie vandaan komt en wie het geschreven heeft.

### 7.1 Bronvermelding-model

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

### 7.2 Uitbreiding Artikel model

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

### 7.3 Bronvermelding in artikel-weergave

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

### 7.4 Content agent: bronnen automatisch vastleggen

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

### 7.5 Beheerportaal: bronnen beheren

Bij het bewerken van een artikel in het beheerportaal:
- Sectie "Bronnen" met mogelijkheid om bronnen toe te voegen/verwijderen
- Dropdown voor auteurType
- Automatisch ingevuld bij AI-generatie, handmatig aanpasbaar

---

## 10. Database Wijzigingen (totaaloverzicht)

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
| `Artikel` | `auteur`, `auteurType`, `gemiddeldeScore`, `aantalScores`, `aantalGelezen`, `compleetheidsScore` (berekend) |
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

## 11. Bouwvolgorde

```
Stap 1: Tagging & Profiel-matching     ~16 uur  ← FUNDAMENT
├── 1.1 TagType enum uitbreiden              1 uur
├── 1.2 Nieuwe tags seeden (40+ tags)        2 uur
├── 1.3 bepaalProfielTags() functie          3 uur
├── 1.4 Bulk-taggen bestaande artikelen (AI) 3 uur
├── 1.5 Synoniemen op ContentTag             1 uur
├── 1.6 ZorgorganisatieTag koppeltabel       2 uur
├── 1.7 Tag-voorkeuren in profiel UI         3 uur
└── 1.8 GebruikerVoorkeur integratie         1 uur

Stap 2: Aanbevolen Artikelen           ~14 uur
├── 2.1 Relevantie-score berekening          4 uur
├── 2.2 "Aanbevolen voor jou" dashboard      3 uur
├── 2.3 Leren-pagina sorteren op relevantie  2 uur
├── 2.4 Weekkaarten LEREN verbeteren         2 uur
├── 2.5 "Meer hierover" suggesties           2 uur
└── 2.6 Ger AI-assistent integratie          1 uur

Stap 3: Gerichte Artikelgeneratie      ~14 uur
├── 3.1 Doelgroep-specifiek genereren        3 uur
├── 3.2 Slimme generatie-voorstellen (data)  4 uur
├── 3.3 Generatie-matrix UI                  3 uur
├── 3.4 Content agent "genereer-voor-doelgroep" 2 uur
└── 3.5 Batch-generatie + aantal kiezen      2 uur

Stap 4: Hulpbronnen Tastbaar           ~12 uur
├── 4.1 DB migratie (nieuwe velden)          2 uur
├── 4.2 AI zoeker prompt aanpassen           2 uur
├── 4.3 Hulpbronkaart redesign               4 uur
├── 4.4 Zoek-UI met filters                  3 uur
└── 4.5 Batch-verrijking tool                1 uur

Stap 5: Artikel Compleetheid           ~14 uur
├── 5.1 Compleetheidscore berekening         3 uur
├── 5.2 Compleetheids-dashboard UI           4 uur
├── 5.3 Batch-acties via agents              3 uur
├── 5.4 Per-artikel actie-overzicht          2 uur
└── 5.5 Filters en sortering                 2 uur

Stap 6: Scoren & Feedback              ~10 uur
├── 6.1 ContentScore + LeesGeschiedenis      2 uur
├── 6.2 "Was dit nuttig?" component          3 uur
├── 6.3 Score-aggregatie                     2 uur
└── 6.4 Leesgeschiedenis tracking            3 uur

Stap 7: Content Hiaten                  ~8 uur
├── 7.1 AandoeningGewicht + seed data        2 uur
├── 7.2 OnderwerpGewicht + seed data         2 uur
├── 7.3 Content-dekking dashboard            3 uur
└── 7.4 Kruistabel hiaten-analyse            1 uur

Stap 8: Bronvermelding                 ~10 uur
├── 8.1 ArtikelBron model + migratie         2 uur
├── 8.2 Artikel auteur-velden                1 uur
├── 8.3 Bronsectie in artikel-weergave       3 uur
├── 8.4 Content agent bronnen vastleggen     2 uur
└── 8.5 Beheerportaal bronnen-sectie         2 uur

─────────────────────────────────────────────
Totaal geschat:                        ~98 uur
```

### Afhankelijkheden

```
Stap 1 (Tagging) ──→ Stap 2 (Aanbevelingen) ──→ Stap 3 (Generatie)
                 │                             │
                 ├──→ Stap 4 (Hulpbronnen)     ├──→ Stap 7 (Hiaten)
                 │                             │
                 └──→ Stap 5 (Compleetheid)    └──→ Stap 6 (Scoren)
                                               │
Stap 8 (Bronvermelding) ─────────────────────┘ (onafhankelijk, kan parallel)
```

**Stap 1** is het fundament — alles hangt af van het tagsysteem.
**Stap 2** bouwt voort op tags voor aanbevelingen.
**Stap 3** gebruikt aanbevelingsdata + tags voor slimme generatie.
**Stap 4 en 5** kunnen parallel met stap 2/3.
**Stap 8** is volledig onafhankelijk.

---

## 12. Acceptatiecriteria per Stap

### Stap 1: Tagging & Profiel-matching
- [ ] 5 tag-types beschikbaar (AANDOENING, SITUATIE, ONDERWERP, DOELGROEP, LEVENSFASE)
- [ ] 40+ tags geseeded met synoniemen
- [ ] `bepaalProfielTags()` leidt tags af uit bestaande profieldata
- [ ] Alle bestaande artikelen getagd met minimaal 2 tag-types (via AI bulk-tagging)
- [ ] Mantelzorger kan in profiel tags bekijken en aanpassen
- [ ] Hulpbronnen kunnen getagd worden via ZorgorganisatieTag

### Stap 2: Aanbevolen Artikelen
- [ ] Dashboard toont "Aanbevolen voor jou" met 3-5 artikelen
- [ ] Aanbevelingen zijn persoonlijk (werkende mantelzorger ≠ gepensioneerde mantelzorger)
- [ ] Leren-pagina sorteerbaar op relevantie
- [ ] Weekkaarten LEREN gebruiken relevantie-score
- [ ] Onderaan artikel staan 2-3 gerelateerde artikelen
- [ ] Ger noemt de match-reden bij artikel-suggesties

### Stap 3: Gerichte Artikelgeneratie
- [ ] Beheerder kan aangeven hoeveel artikelen gegenereerd moeten worden
- [ ] Agent analyseert leesgedrag, scores en matrix en doet een voorstel
- [ ] Voorstel is aanpasbaar door beheerder voor generatie start
- [ ] Gegenereerde artikelen krijgen automatisch de juiste tags
- [ ] Generatie-matrix toont welke tag-combinaties gedekt zijn

### Stap 4: Hulpbronnen Tastbaar
- [ ] Elke hulpbron heeft een `eersteStap` (ingevuld of fallback)
- [ ] Hulpbronkaart toont: eerste stap, kosten, wachttijd (indien beschikbaar)
- [ ] Filters werken: categorie, soort hulp, dekkingsgebied
- [ ] Batch-verrijking kan 50+ hulpbronnen verwerken

### Stap 5: Artikel Compleetheid
- [ ] Elk artikel toont een compleetheidspercentage (0-100%)
- [ ] Beheerder kan filteren op compleetheid en ontbrekende stappen
- [ ] Batch-acties: tags toevoegen, B1-check, bronnen zoeken via agents
- [ ] Per artikel: overzicht van voltooide en ontbrekende stappen met actieknoppen
- [ ] "Alle ontbrekende stappen uitvoeren" als één-klik actie

### Stap 6: Scoren & Feedback
- [ ] Gebruiker kan artikel beoordelen met nuttig/niet-nuttig + optionele reden
- [ ] Gebruiker kan hulpbron beoordelen
- [ ] Gemiddelde score zichtbaar bij >= 3 beoordelingen
- [ ] Leesgeschiedenis wordt bijgehouden

### Stap 7: Content Hiaten
- [ ] Beheerder ziet content-dekking per doelgroep en aandoening
- [ ] Hiaten-analyse combineert met generatie-matrix
- [ ] "Genereer voor hiaten" knop linkt naar slimme generatie (Stap 3)

### Stap 8: Bronvermelding
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
Iteratie 4B:  Content & Zoek Fundament (~98 uur, 6-7 weken)
────────────────────────────────────────────────
Iteratie 5:   Content uit Code naar Database
Iteratie 6:   Performance
Iteratie 7:   Toegankelijkheid
Iteratie 8:   Schaalbaarheid
```

---

*Dit plan is opgesteld op 14 maart 2026 (v1.1) en wacht op goedkeuring voordat de bouw begint.*
