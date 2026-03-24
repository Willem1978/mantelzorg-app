# Voorstel: Tag-herstructurering MantelBuddy

**Datum:** 24 maart 2026
**Status:** Voorstel — ter goedkeuring
**Raakt:** Profiel, Onboarding, Wizard, Database, Content/Artikelen, Aanbevelingen

---

## 1. Probleem: Wat er nu mis is

### 1.1 Te veel ziektes — te confronterend
Het huidige systeem heeft **12 specifieke aandoening-tags**:

| # | Huidige tag | Probleem |
|---|-------------|----------|
| 1 | Dementie | Specifiek |
| 2 | Kanker | Confronterend |
| 3 | CVA / Beroerte | Medisch jargon |
| 4 | Hartfalen | Confronterend |
| 5 | COPD | Medisch jargon |
| 6 | Diabetes | Specifiek |
| 7 | Psychische aandoening | Stigma |
| 8 | Verstandelijke beperking | Specifiek |
| 9 | Lichamelijke beperking | Specifiek |
| 10 | NAH | Onbekende afkorting |
| 11 | Ouderdom / Kwetsbaarheid | Vaag |
| 12 | Terminale fase / Palliatief | Zeer confronterend |

**Problemen:**
- Mantelzorgers worden gedwongen een "diagnose-label" te kiezen — dat is confronterend
- Veel mantelzorgers weten de exacte diagnose niet, of er zijn meerdere aandoeningen
- De lijst is incompleet (waar is ALS? Parkinson? MS?) — uitbreiden maakt het erger
- Content is moeilijk te matchen: een artikel over "omgaan met vergeetachtigheid" is relevant voor dementie, NAH én ouderdom
- De tags zeggen niets over wat de mantelzorger **nodig heeft**

### 1.2 Geen heldere structuur rond de rol
De huidige 18 situatie-tags zijn een ongestructureerde grabbelton:
- Jong, werkend, parttime, student, gepensioneerd, samenwonend, dichtbij, op afstand, met kinderen, beginnend, langdurig, intensief, partner-zorg, ouder-zorg, kind-zorg, meerdere zorgvragers, alleenstaand, rouwverwerking

Er zit geen logica of hiërarchie in. Een mantelzorger ziet 20+ chips en denkt: "wat moet ik hiermee?"

### 1.3 Content is niet getagd
De ArtikelTag tabel is **leeg** — 0 van de 47 artikelen zijn gekoppeld aan tags. Het hele systeem doet dus niets.

---

## 2. Ontwerpprincipes voor de nieuwe structuur

1. **Niet confronterend** — Vraag niet "welke ziekte heeft uw naaste?" maar "wat voor soort zorg geef je?"
2. **Overkoepelend** — Geen diagnose-labels maar zorgthema's die meerdere aandoeningen dekken
3. **Vanuit de mantelzorger** — Niet de ziekte centraal maar de ervaring en behoefte van de zorger
4. **Automatisch waar mogelijk** — Tags afleiden uit simpele profielvragen, niet handmatig laten kiezen
5. **Minder is meer** — Liever 5 duidelijke keuzes dan 20 verwarrende opties
6. **Herkenbaar** — Mantelzorgers moeten zichzelf herkennen in de opties

---

## 3. Nieuwe tagstructuur

### Dimensie A: Zorgthema (vervangt "Aandoening")

In plaats van 12 specifieke ziektes → **6 overkoepelende zorgthema's** gebaseerd op het *type zorg* dat nodig is:

| # | Slug | Label | Dekt o.a. | Emoji |
|---|------|-------|-----------|-------|
| 1 | `geheugen-cognitie` | Geheugen & denken | Dementie, NAH, cognitieve achteruitgang bij ouderdom | 🧠 |
| 2 | `lichamelijk` | Lichamelijke zorg | Hartfalen, COPD, CVA, diabetes, lichamelijke beperking, revalidatie | 💪 |
| 3 | `psychisch-emotioneel` | Psychisch & emotioneel | Psychische aandoeningen, depressie, angst, verslaving | 💚 |
| 4 | `beperking-begeleiding` | Beperking & begeleiding | Verstandelijke beperking, autisme, ontwikkelingsstoornis | 🧩 |
| 5 | `ouder-worden` | Ouder worden | Algemene ouderdomsklachten, kwetsbaarheid, vallen, eenzaamheid | 👴 |
| 6 | `ernstig-ziek` | Ernstig of langdurig ziek | Kanker, terminale fase, palliatief, chronisch ernstig ziek | 🕊️ |

**Waarom dit werkt:**
- "Mijn vader heeft geheugenproblemen" is veel minder confronterend dan "Mijn vader heeft dementie"
- "Ik geef lichamelijke zorg" dekt 6 oude tags in één keuze
- "Beperking & begeleiding" is direct herkenbaar voor mantelzorgers in die situatie
- **Multi-select mogelijk** — veel mantelzorgers herkennen zich in 2-3 thema's
- Content is gemakkelijker te taggen op thema dan op diagnose
- De lijst is uitbreidbaar zonder te lang te worden

### Dimensie B: Jouw rol als mantelzorger (vervangt "Situatie")

In plaats van 18 losse chips → **5 gestructureerde profielvragen** die automatisch tags genereren:

#### B1. Relatie met je naaste (exclusief — radio buttons)
| Optie | Afgeleide tag |
|-------|--------------|
| Ik zorg voor mijn partner | `partner-zorg` |
| Ik zorg voor mijn ouder(s) | `ouder-zorg` |
| Ik zorg voor mijn kind | `kind-zorg` |
| Ik zorg voor iemand anders (familie/vriend/buur) | `netwerk-zorg` |

#### B2. Hoe ziet jouw week eruit? (exclusief — radio buttons)
| Optie | Afgeleide tag |
|-------|--------------|
| Ik werk (fulltime of parttime) | `werkend` |
| Ik studeer | `student` |
| Ik ben met pensioen | `gepensioneerd` |
| Ik zorg fulltime / werk niet | `fulltime-zorger` |

#### B3. Wonen (exclusief — radio buttons)
| Optie | Afgeleide tag |
|-------|--------------|
| Ik woon samen met mijn naaste | `samenwonend` |
| Mijn naaste woont dichtbij | `dichtbij` |
| Ik zorg op afstand | `op-afstand` |

#### B4. Hoe lang zorg je al? (exclusief — radio buttons)
| Optie | Afgeleide tag |
|-------|--------------|
| Kort (minder dan 1 jaar) | `beginnend` |
| Een paar jaar (1-5 jaar) | `ervaren` |
| Al lang (meer dan 5 jaar) | `langdurig` |

#### B5. Wat speelt er nog meer? (multi-select — chips, optioneel)
| Optie | Afgeleide tag |
|-------|--------------|
| Ik heb ook kinderen om voor te zorgen | `met-kinderen` |
| Ik zorg voor meerdere mensen | `meerdere-naasten` |
| Ik doe het alleen (geen hulp van anderen) | `alleenstaand` |

#### B6. Rouw — eigen sectie in het profiel
Rouw krijgt een **eigen, aparte plek** in het profiel. Het is geen "extra" maar een ingrijpende verandering in de zorgsituatie die specifieke content en ondersteuning vraagt.

| Status | Afgeleide tag | Toelichting |
|--------|--------------|-------------|
| Mijn naaste is overleden | `rouw` | Ontgrendelt rouw-specifieke content, tips en lotgenotencontact |
| *(niet geselecteerd)* | — | Standaard: actieve zorgsituatie |

**Waarom een eigen plek:**
- Rouw verandert de hele context van de mantelzorger — van "zorgen voor" naar "loslaten"
- Rouw-content is fundamenteel anders dan actieve-zorg-content
- Het verdient een respectvolle, rustige plek — niet weggestopt als checkbox tussen andere opties
- Het profiel kan na selectie verschuiven: minder "hoe zorg je" en meer "hoe gaat het met jou"

### Dimensie C: Onderwerp (voor content-tagging, niet voor gebruikers)

Blijft grotendeels hetzelfde, maar wordt uitgebreid en afgestemd op de nieuwe structuur:

| # | Slug | Label | Emoji |
|---|------|-------|-------|
| 1 | `financien-regelingen` | Financiën & regelingen | 💰 |
| 2 | `wmo-wlz-zvw` | Wmo, Wlz & zorgverzekering | 📋 |
| 3 | `pgb` | PGB | 💳 |
| 4 | `medicatie-behandeling` | Medicatie & behandeling | 💊 |
| 5 | `dagelijks-zorgen` | Dagelijks zorgen | 🏠 |
| 6 | `zelfzorg-balans` | Zelfzorg & balans | 💆 |
| 7 | `respijtzorg` | Respijtzorg & vervanging | 🌿 |
| 8 | `werk-zorg` | Werk & zorg combineren | ⚖️ |
| 9 | `hulpmiddelen` | Hulpmiddelen & technologie | 🔧 |
| 10 | `emotioneel` | Emotioneel & mentaal | 💚 |
| 11 | `netwerk-hulp` | Netwerk & hulp organiseren | 🤝 |
| 12 | `veiligheid` | Veiligheid thuis | 🏡 |

---

## 4. Vergelijking oud → nieuw

### Aandoening → Zorgthema
| Aspect | Oud | Nieuw |
|--------|-----|-------|
| Aantal | 12 specifieke ziektes | 6 overkoepelende thema's |
| Toon | Medisch, confronterend | Herkenbaar, beschrijvend |
| Selectie | Chip-wall (verwarrend) | Multi-select met duidelijke labels |
| Vraag | "Wat heeft je naaste?" | "Wat voor zorg geef je?" |
| Uitbreidbaarheid | Elke nieuwe ziekte = extra tag | Ziektes vallen onder bestaande thema's |

### Situatie → Rol
| Aspect | Oud | Nieuw |
|--------|-----|-------|
| Aantal | 18 losse tags | 6 gestructureerde secties → max 10 tags |
| Structuur | Vlakke lijst | Gegroepeerd per thema (B1-B6) |
| Invoer | Mix van auto + handmatig | Helder: B1-B4 auto, B5-B6 optioneel handmatig |
| UX | 20+ chips tegelijk | Per vraag 3-4 opties (radio buttons) |
| Rouw | Weggestopt als chip | Eigen respectvolle sectie (B6) |

### Totaal tags op een profiel
| | Oud | Nieuw |
|--|-----|-------|
| Zorgthema/Aandoening | 0-12 (chip wall) | 1-3 (multi-select) |
| Rol/Situatie | 0-18 (chaos) | 4-9 (gestructureerd) |
| Rouw | Optionele chip | Eigen sectie (0-1 tag) |
| **Totaal per gebruiker** | **Onvoorspelbaar** | **5-12 (voorspelbaar)** |

---

## 5. Impact op bestaande onderdelen

### 5.1 Database (Prisma schema)
```
ContentTag model aanpassen:
- type: AANDOENING → ZORGTHEMA
- groep veld toevoegen (dimensie A/B/C)
- Oude aandoening-tags verwijderen, nieuwe zorgthema's seeden
- Oude situatie-tags opschonen (18 → 9 unieke tags)
- ArtikelTag tabel vullen (nu leeg!)

Migratiestrategie:
- Mapping-tabel oud → nieuw maken
- Bestaande GebruikerVoorkeur records migreren
- Seed-scripts aanpassen
```

### 5.2 Profiel
```
Huidig: één groot formulier met 20+ losse chips
Nieuw: gestructureerd scherm met 5 secties:
  1. Zorgthema (multi-select chips, max 3)
  2. Relatie (radio)
  3. Weekinvulling (radio)
  4. Woonsituatie (radio)
  5. Zorgduur (radio)
  + optioneel: "Wat speelt er nog meer?" (multi-select)
```

### 5.3 Onboarding / Wizard
```
Huidig: 4-5 stappen met veel vragen
Nieuw flow:
  Stap 1: Welkom + registratie (email + wachtwoord)
  Stap 2: "Wat voor zorg geef je?" (zorgthema keuze)
  Stap 3: "Even voorstellen" (relatie + woonsituatie)
  Stap 4: → Direct naar balanstest

  "Later invullen" altijd mogelijk.
  Profiel verder aanvullen is geen onboarding maar profiel-completeness.
```

### 5.4 Content / Artikelen
```
Elk artikel krijgt:
- 1-3 zorgthema-tags (Dimensie A)
- 1-3 onderwerp-tags (Dimensie C)
- Optioneel: relevante rol-tags (Dimensie B)

Voorbeeld: "Omgaan met vergeetachtigheid bij je partner"
→ Zorgthema: geheugen-cognitie
→ Onderwerp: dagelijks-zorgen
→ Rol: partner-zorg
```

### 5.5 Aanbevelingen (Iteratie 5)
```
Relevantie-score wordt:
- Zorgthema match:  3 punten (zwaarst)
- Rol match:        2 punten
- Onderwerp match:  1 punt

Gebruiker met tags [geheugen-cognitie, partner-zorg, werkend]
→ Artikel "Dementie en werk combineren" scoort: 3+2+2 = 7 punten
→ Artikel "PGB aanvragen" scoort: 0+0+1 = 1 punt
```

### 5.6 AI Coach (Ger)
```
Profiel-context voor Ger wordt rijker en duidelijker:
"Mantelzorger zorgt voor partner met geheugen/cognitie-problematiek,
 woont samen, werkt parttime, al 3 jaar bezig."

In plaats van: "Tags: dementie, werkend-parttime, samenwonend, langdurig"
```

---

## 6. Migratiestrategie bestaande data

### Mapping aandoening → zorgthema
| Oude tag | Nieuwe tag |
|----------|-----------|
| dementie | geheugen-cognitie |
| nah | geheugen-cognitie |
| kanker | ernstig-ziek |
| terminaal | ernstig-ziek |
| cva-beroerte | lichamelijk |
| hartfalen | lichamelijk |
| copd | lichamelijk |
| diabetes | lichamelijk |
| lichamelijke-beperking | lichamelijk |
| psychisch | psychisch-emotioneel |
| verstandelijke-beperking | beperking-begeleiding |
| ouderdom | ouder-worden |

### Mapping situatie-tags → rol-tags
| Oude tag | Actie |
|----------|-------|
| werkend | Behouden als `werkend` |
| werkend-parttime | Samenvoegen in `werkend` (parttime info in profiel) |
| student | Behouden |
| gepensioneerd | Behouden |
| samenwonend | Behouden |
| dichtbij | Behouden |
| op-afstand | Behouden |
| partner-zorg | Behouden |
| ouder-zorg | Behouden |
| kind-zorg | Behouden |
| jong | Verwijderen (automatisch afleidbaar uit geboortedatum, niet als tag tonen) |
| intensief | Verwijderen (afleidbaar uit uren, gebruiken in berekening, niet als tag) |
| beginnend | Behouden |
| langdurig | Behouden |
| met-kinderen | Behouden |
| meerdere-zorgvragers | Hernoemd naar `meerdere-naasten` |
| alleenstaand | Behouden |
| rouwverwerking | Hernoemd naar `rouw` — verplaatst naar eigen sectie (B6) |

---

## 7. Nieuwe profielvragen in de wizard (UX)

Zo ziet de ervaring eruit voor een nieuwe gebruiker:

### Scherm 1: "Welkom bij MantelBuddy"
> *We helpen je om de zorg vol te houden. Laten we even kennismaken.*
> [Start]

### Scherm 2: "Wat voor zorg geef je?"
> *Kies wat het beste past. Je kunt meerdere kiezen.*
>
> 🧠 Geheugen & denken
> 💪 Lichamelijke zorg
> 💚 Psychisch & emotioneel
> 🧩 Beperking & begeleiding
> 👴 Ouder worden
> 🕊️ Ernstig of langdurig ziek
>
> [Weet ik niet / sla over →]

### Scherm 3: "Vertel iets over jezelf"
> *Voor wie zorg je?*
> ○ Mijn partner  ○ Mijn ouder(s)  ○ Mijn kind  ○ Iemand anders
>
> *Woon je samen?*
> ○ Ja, samen  ○ Nee, dichtbij  ○ Nee, op afstand
>
> [Later invullen →]

### Scherm 4: "Hoe gaat het met je? Doe de balanstest"
> *In 2 minuten weet je hoe het met je gaat. Je krijgt direct tips.*
> [Start balanstest]
> [Liever later →]

---

## 8. Samenvatting: wat levert dit op?

| Aspect | Nu | Straks |
|--------|-----|--------|
| Ziektes | 12 confronterende labels | 6 herkenbare zorgthema's |
| Situatie | 18 losse chips | 6 duidelijke secties (incl. rouw) |
| Onboarding | Zwaar, veel vragen | 3 schermen, dan balanstest |
| Content-matching | 0 artikelen getagd | Alle artikelen getagd op 3 dimensies |
| Aanbevelingen | Niet mogelijk | Score-based matching op profiel |
| Mantelzorger-ervaring | "Wat moet ik met al die opties?" | "Oh, dit gaat over mij" |

---

## 9. Genomen beslissingen (24 maart 2026)

| # | Beslispunt | Beslissing |
|---|-----------|------------|
| 1 | Zorgthema's compleet? | **Ja, 6 thema's zijn akkoord** |
| 2 | Naam "Ontwikkeling & groei" | **Gewijzigd naar "Beperking & begeleiding"** — directer en herkenbaarder |
| 3 | Plek van rouw | **Eigen sectie in profiel (B6)** — geen weggestopte checkbox |
| 4 | Onboarding-schermen | **3 schermen** vóór de balanstest (welkom → zorgthema → voorstellen → balanstest) |

---

## 10. Volledige impactanalyse: Database, Content & Code

### 10.1 Database-wijzigingen (Prisma schema)

#### A. TagType enum aanpassen
```prisma
// OUD:
enum TagType {
  AANDOENING
  SITUATIE
  ONDERWERP
}

// NIEUW:
enum TagType {
  ZORGTHEMA      // ← was AANDOENING
  SITUATIE       // blijft
  ONDERWERP      // blijft
}
```
**Impact:** Elke query die `type: "AANDOENING"` filtert moet naar `type: "ZORGTHEMA"`.

#### B. ContentTag model — groep veld toevoegen
```prisma
model ContentTag {
  // bestaande velden...
  groep     String?   // "zorgthema" | "relatie" | "weekinvulling" | "wonen" | "zorgduur" | "extra" | "rouw" | "onderwerp"
}
```
**Impact:** Nieuw veld, geen breaking change. Seed-scripts moeten groep meesturen.

#### C. Caregiver model — `aandoening` veld
```prisma
model Caregiver {
  // OUD:
  aandoening    String?    // "dementie", "kanker", etc.

  // NIEUW:
  aandoening    String?    // Backward compat — wordt gemigreerd naar GebruikerVoorkeur
  // Op termijn: veld verwijderen, alleen GebruikerVoorkeur gebruiken
}
```
**Impact:**
- Bestaande waarden moeten gemigreerd worden: `dementie` → `geheugen-cognitie`, etc.
- Veld voorlopig behouden voor backward compat, maar schrijflogica aanpassen

#### D. Migratie-SQL voor bestaande data

```sql
-- STAP 1: ContentTag type AANDOENING → ZORGTHEMA
-- (eerst nieuwe tags aanmaken, dan oude verwijderen)

-- STAP 2: Caregiver.aandoening waarden migreren
UPDATE "Caregiver" SET aandoening = 'geheugen-cognitie' WHERE aandoening IN ('dementie', 'nah');
UPDATE "Caregiver" SET aandoening = 'lichamelijk' WHERE aandoening IN ('cva-beroerte', 'hartfalen', 'copd', 'diabetes', 'lichamelijke-beperking');
UPDATE "Caregiver" SET aandoening = 'psychisch-emotioneel' WHERE aandoening = 'psychisch';
UPDATE "Caregiver" SET aandoening = 'beperking-begeleiding' WHERE aandoening = 'verstandelijke-beperking';
UPDATE "Caregiver" SET aandoening = 'ouder-worden' WHERE aandoening = 'ouderdom';
UPDATE "Caregiver" SET aandoening = 'ernstig-ziek' WHERE aandoening IN ('kanker', 'terminaal');

-- STAP 3: GebruikerVoorkeur slug-waarden migreren
UPDATE "GebruikerVoorkeur" SET slug = 'geheugen-cognitie' WHERE slug IN ('dementie', 'nah') AND type = 'TAG';
UPDATE "GebruikerVoorkeur" SET slug = 'lichamelijk' WHERE slug IN ('cva-beroerte', 'hartfalen', 'copd', 'diabetes', 'lichamelijke-beperking') AND type = 'TAG';
UPDATE "GebruikerVoorkeur" SET slug = 'psychisch-emotioneel' WHERE slug = 'psychisch' AND type = 'TAG';
UPDATE "GebruikerVoorkeur" SET slug = 'beperking-begeleiding' WHERE slug = 'verstandelijke-beperking' AND type = 'TAG';
UPDATE "GebruikerVoorkeur" SET slug = 'ouder-worden' WHERE slug = 'ouderdom' AND type = 'TAG';
UPDATE "GebruikerVoorkeur" SET slug = 'ernstig-ziek' WHERE slug IN ('kanker', 'terminaal') AND type = 'TAG';
UPDATE "GebruikerVoorkeur" SET slug = 'meerdere-naasten' WHERE slug = 'meerdere-zorgvragers' AND type = 'TAG';
UPDATE "GebruikerVoorkeur" SET slug = 'rouw' WHERE slug = 'rouwverwerking' AND type = 'TAG';
-- Verwijder tags die niet meer bestaan:
DELETE FROM "GebruikerVoorkeur" WHERE slug IN ('werkend-parttime', 'jong', 'intensief') AND type = 'TAG';

-- STAP 4: ArtikelTag records migreren (via ContentTag ID lookup)
-- Dit gaat via de seed-scripts: oude tags verwijderen, nieuwe tags aanmaken, artikelen opnieuw taggen

-- STAP 5: Oude ContentTag records verwijderen
-- Pas na succesvolle migratie van ArtikelTag en GebruikerVoorkeur
```

---

### 10.2 Impact op alle 44 artikelen

Elk artikel moet opnieuw getagd worden met de nieuwe zorgthema's en onderwerp-tags. Hieronder de volledige mapping:

#### Praktische tips (9 artikelen)
| ID | Titel | Nieuwe zorgthema-tags | Nieuwe onderwerp-tags |
|----|-------|----------------------|----------------------|
| pt-1 | Dagstructuur en weekplanning | *(alle thema's relevant)* | dagelijks-zorgen |
| pt-2 | Tips voor veilig medicijngebruik | lichamelijk, ouder-worden | medicatie-behandeling |
| pt-3 | Samenwerken met de thuiszorg | *(alle)* | netwerk-hulp |
| pt-4 | Communiceren met je naaste | geheugen-cognitie, psychisch-emotioneel | dagelijks-zorgen, emotioneel |
| pt-5 | Veilig tillen en verplaatsen | lichamelijk, ouder-worden | dagelijks-zorgen, veiligheid |
| pt-6 | Zorgrooster maken met familie | *(alle)* | netwerk-hulp |
| pt-7 | Hulp vragen aan je omgeving | *(alle)* | netwerk-hulp |
| pt-8 | Valpreventie in huis | lichamelijk, ouder-worden | veiligheid |
| pt-9 | Dagstructuur bij dementie | geheugen-cognitie | dagelijks-zorgen |

#### Zelfzorg (8 artikelen)
| ID | Titel | Nieuwe zorgthema-tags | Nieuwe onderwerp-tags |
|----|-------|----------------------|----------------------|
| zz-1 | Herken overbelasting op tijd | *(alle)* | zelfzorg-balans |
| zz-2 | Grenzen stellen als mantelzorger | *(alle)* | zelfzorg-balans, emotioneel |
| zz-3 | Vervangende mantelzorg: even vrij | *(alle)* | respijtzorg |
| zz-4 | Werk en mantelzorg combineren | *(alle)* | werk-zorg |
| zz-5 | De Mantelzorglijn: praat met iemand | *(alle)* | emotioneel |
| zz-6 | De mantelzorgtest: hoe belast ben jij? | *(alle)* | zelfzorg-balans |
| zz-7 | Logeeropvang en vakantiemogelijkheden | *(alle)* | respijtzorg |
| zz-8 | Lotgenotencontact | *(alle)* | emotioneel, netwerk-hulp |

#### Rechten (9 artikelen)
| ID | Titel | Nieuwe zorgthema-tags | Nieuwe onderwerp-tags |
|----|-------|----------------------|----------------------|
| re-1 | De Wmo: hulp via je gemeente | *(alle)* | wmo-wlz-zvw, financien-regelingen |
| re-2 | Mantelzorg is altijd vrijwillig | *(alle)* | financien-regelingen |
| re-3 | Het keukentafelgesprek | *(alle)* | wmo-wlz-zvw |
| re-4 | Recht op zorgverlof van je werk | *(alle)* | werk-zorg, financien-regelingen |
| re-5 | Gratis onafhankelijke cliëntondersteuning | *(alle)* | wmo-wlz-zvw, financien-regelingen |
| re-6 | Recht op vervangende mantelzorg | *(alle)* | respijtzorg, financien-regelingen |
| re-7 | De Wlz: langdurige zorg | *(alle)* | wmo-wlz-zvw |
| re-8 | Bezwaar maken tegen een beslissing | *(alle)* | financien-regelingen |
| re-9 | Regelhulp: welke zorg past bij jou? | *(alle)* | wmo-wlz-zvw |

#### Financieel (9 artikelen)
| ID | Titel | Nieuwe zorgthema-tags | Nieuwe onderwerp-tags |
|----|-------|----------------------|----------------------|
| fi-1 | Eigen bijdrage en kosten (CAK) | *(alle)* | financien-regelingen |
| fi-2 | Mantelzorgwaardering van je gemeente | *(alle)* | financien-regelingen |
| fi-3 | Betaald worden via een PGB | *(alle)* | pgb, financien-regelingen |
| fi-4 | Belasting en PGB-inkomen | *(alle)* | pgb, financien-regelingen |
| fi-5 | Vergoedingen hulpmiddelen | lichamelijk, ouder-worden | financien-regelingen, hulpmiddelen |
| fi-6 | Zorgkosten aftrekken bij de belasting | *(alle)* | financien-regelingen |
| fi-7 | Mantelzorgcompliment aanvragen | *(alle)* | financien-regelingen |
| fi-8 | PGB declareren via de SVB | *(alle)* | pgb, financien-regelingen |
| fi-9 | Zorgtoeslag en huurtoeslag | *(alle)* | financien-regelingen |

#### Hulpmiddelen (7 artikelen)
| ID | Titel | Nieuwe zorgthema-tags | Nieuwe onderwerp-tags |
|----|-------|----------------------|----------------------|
| hp-1 | Hulpmiddelenwijzer | lichamelijk, ouder-worden | hulpmiddelen |
| hp-2 | Woningaanpassingen via de Wmo | lichamelijk, ouder-worden | hulpmiddelen, wmo-wlz-zvw |
| hp-3 | Welk hulpmiddel via welke wet? | lichamelijk, ouder-worden | hulpmiddelen, financien-regelingen |
| hp-4 | Douchestoel, toiletverhoger en badlift | lichamelijk, ouder-worden | hulpmiddelen, veiligheid |
| hp-5 | Rollator, rolstoel en scootmobiel | lichamelijk | hulpmiddelen |
| hp-6 | Personenalarmering en GPS-tracker | geheugen-cognitie, ouder-worden | hulpmiddelen, veiligheid |
| hp-7 | Hulpmiddelen via je zorgverzekeraar | lichamelijk, ouder-worden | hulpmiddelen, wmo-wlz-zvw |

#### Gemeente nieuws (2 artikelen)
| ID | Titel | Nieuwe zorgthema-tags | Nieuwe onderwerp-tags |
|----|-------|----------------------|----------------------|
| gn-zutphen-1 | Lotgenotengroep mantelzorgers Zutphen | *(alle)* | emotioneel, netwerk-hulp |
| gn-zutphen-2 | Mantelzorgcompliment Zutphen | *(alle)* | financien-regelingen |

> **Opmerking:** Artikelen gemarkeerd met *(alle)* zijn generiek relevant voor alle zorgthema's. Deze krijgen **geen** zorgthema-tag — ze worden getoond aan iedereen. Alleen artikelen die specifiek relevant zijn voor bepaalde zorgsituaties krijgen zorgthema-tags. Dit voorkomt dat alles aan alles getagd wordt.

---

### 10.3 Keyword-matching aanpassen (seed-artikel-tags.ts)

Het huidige keyword-systeem in `scripts/seed-artikel-tags.ts` moet volledig herschreven worden:

```typescript
// OUD: 12 aandoening keywords + 12 situatie keywords + 12 onderwerp keywords
// NIEUW: 6 zorgthema keywords + 9 situatie keywords + 12 onderwerp keywords

const TAG_KEYWORDS_NIEUW: Record<string, string[]> = {
  // ZORGTHEMA tags (was: AANDOENING)
  "geheugen-cognitie": ["dementie", "alzheimer", "geheugen", "vergeetachtig", "nah", "hersenletsel", "cognitie"],
  "lichamelijk": ["lichamelijk", "hartfalen", "copd", "cva", "beroerte", "diabetes", "revalidatie", "rolstoel", "mobiliteit", "tillen", "vallen"],
  "psychisch-emotioneel": ["psychisch", "depressie", "angst", "ggz", "psychiatrisch", "mentaal", "verslaving"],
  "beperking-begeleiding": ["verstandelijke beperking", "lvb", "downsyndroom", "autisme", "begeleiding"],
  "ouder-worden": ["ouderdom", "kwetsbaar", "vergrijzing", "senioren", "bejaarden", "ouder worden"],
  "ernstig-ziek": ["kanker", "terminaal", "palliatief", "levenseinde", "oncologie", "tumor", "chemo"],

  // SITUATIE tags (geschoond)
  "werkend": ["werk", "werkgever", "collega", "kantoor", "baan", "arbeids"],
  "student": ["student", "studie", "opleiding"],
  "partner-zorg": ["partner", "echtgenoot", "echtgenote"],
  "ouder-zorg": ["ouder", "moeder", "vader", "ouders"],
  "kind-zorg": ["kind", "zoon", "dochter"],
  "samenwonend": ["samenwonend", "inwonend", "samen wonen"],
  "op-afstand": ["afstand", "ver weg", "reizen", "andere stad"],
  "rouw": ["rouw", "overlijden", "verlies", "afscheid"],
  "meerdere-naasten": ["meerdere", "twee naasten"],

  // ONDERWERP tags (vernieuwd)
  "financien-regelingen": ["financ", "kosten", "geld", "vergoeding", "toelage", "budget", "eigen bijdrage"],
  "wmo-wlz-zvw": ["wmo", "wlz", "zvw", "gemeente", "indicatie", "zorgverzeker"],
  "pgb": ["pgb", "persoonsgebonden budget", "svb"],
  "medicatie-behandeling": ["medicijn", "medicatie", "pillen", "apotheek"],
  "dagelijks-zorgen": ["dagstructuur", "dagritme", "dagelijks", "maaltijd", "koken", "huishoud"],
  "zelfzorg-balans": ["overbelast", "burn-out", "burnout", "zelfzorg", "grenzen stellen"],
  "respijtzorg": ["respijt", "logeer", "vervanging", "adempauze", "even vrij"],
  "werk-zorg": ["werk-zorg", "zorgverlof", "combineren werk"],
  "hulpmiddelen": ["hulpmiddel", "rollator", "rolstoel", "scootmobiel", "douchestoel", "woningaanpass"],
  "emotioneel": ["emotioneel", "steun", "luisterend oor", "lotgenoten", "praatgroep", "mantelzorglijn"],
  "netwerk-hulp": ["samenwerk", "thuiszorg", "familie", "netwerk", "hulp vragen", "zorgrooster"],
  "veiligheid": ["veiligheid", "valpreventie", "domotica", "alarm", "personenalarm", "gps-tracker"],
}
```

---

### 10.4 Alle bestanden die aangepast moeten worden

#### Prisma & Database (3 bestanden)
| Bestand | Wijziging | Risico |
|---------|-----------|--------|
| `prisma/schema.prisma` | TagType enum: AANDOENING→ZORGTHEMA, groep veld op ContentTag | **HOOG** — migratie nodig |
| `prisma/migrations/[nieuw]` | Migratie-SQL voor enum + veld + data | **HOOG** — productiedata |
| `prisma/seed.ts` | Entry point updaten | Laag |

#### Seed-scripts (3 bestanden)
| Bestand | Wijziging | Risico |
|---------|-----------|--------|
| `scripts/seed-content-herstructurering.ts` | 12 aandoening-tags → 6 zorgthema's, 18 situatie-tags → 13, groep veld toevoegen | **HOOG** — bron van alle tags |
| `scripts/seed-artikel-tags.ts` | Keyword-mapping volledig herschrijven (zie 10.3) | **HOOG** — bepaalt artikel-tags |
| `scripts/seed-content.ts` | Controleren op verwijzingen naar oude tag-slugs | Middel |

#### API Routes (6 bestanden)
| Bestand | Wijziging | Risico |
|---------|-----------|--------|
| `src/app/api/content/tags/route.ts` | Response groepering: `aandoeningen` → `zorgthemas` | **HOOG** — breekt frontend |
| `src/app/api/user/voorkeuren/route.ts` | GET: aandoening→zorgthema velden. POST: primary aandoening logica aanpassen | **HOOG** — breekt profiel opslaan |
| `src/app/api/artikelen/route.ts` | Filter `?tag=slug` werkt al generiek, maar controleren | Laag |
| `src/app/api/beheer/artikelen/[id]/route.ts` | Tag-sync werkt al generiek via tagIds | Laag |
| `src/app/api/ai/admin/tag-suggestie/route.ts` | "BESCHIKBARE TAGS" lijst updaten, type check aanpassen | Middel |
| `src/app/api/ai/admin/content-agent/route.ts` | `haalTags()` functie: type "AANDOENING"→"ZORGTHEMA" | Middel |
| `src/app/api/profile/route.ts` | Caregiver.aandoening veld: nieuwe slugs | Middel |

#### UI Componenten (4 bestanden)
| Bestand | Wijziging | Risico |
|---------|-----------|--------|
| `src/components/profiel/ProfielFormulier.tsx` | **Volledig herschrijven**: chip-wall → gestructureerde secties (B1-B6). Tag-type check `AANDOENING`→`ZORGTHEMA`. Rouw-sectie toevoegen | **HOOG** — kern van profiel |
| `src/components/profiel/ProfielWizard.tsx` | **Volledig herschrijven**: 3-schermen flow. Zorgthema multi-select. Verwijzing naar `INTERESSE_CATEGORIEEN` updaten | **HOOG** — kern van onboarding |
| `src/app/(dashboard)/leren/[categorie]/page.tsx` | Relevantie-filter: `gebruikerTags` matching logica | Middel |
| `src/app/beheer/artikelen/page.tsx` | Admin tag-selectie: groepering `aandoeningen`→`zorgthemas` | Middel |

#### Libraries (3 bestanden)
| Bestand | Wijziging | Risico |
|---------|-----------|--------|
| `src/lib/profiel-tags.ts` | **Herschrijven**: `bepaalProfielTags()` uitbreiden met `fulltime-zorger`, `ervaren`, `netwerk-zorg`. `AUTOMATISCHE_TAG_SLUGS` updaten. `HANDMATIGE_TAG_SLUGS` updaten (rouw apart) | **HOOG** — kern van tag-afleiding |
| `src/lib/validations.ts` | `voorkeurenSchema`: veld `aandoeningen`→`zorgthemas` | Middel |
| `src/lib/artikel-completeness.ts` | Geen wijziging nodig (telt alleen tagCount) | Geen |

#### Config (1 bestand)
| Bestand | Wijziging | Risico |
|---------|-----------|--------|
| `src/config/options.ts` | `RELATIE_OPTIES` uitbreiden met "Iemand anders". Geen directe tag-verwijzingen maar indirect via formulieropties | Laag |

---

### 10.5 Afhankelijkheden en volgorde van wijzigingen

```
FASE 1: Database & Tags (moet eerst)
├── 1a. prisma/schema.prisma — enum + groep veld
├── 1b. Prisma migratie genereren en draaien
├── 1c. seed-content-herstructurering.ts — nieuwe tags seeden
└── 1d. Data-migratie SQL — bestaande Caregiver + GebruikerVoorkeur

FASE 2: Backend (daarna)
├── 2a. profiel-tags.ts — bepaalProfielTags() herschrijven
├── 2b. api/content/tags — response format
├── 2c. api/user/voorkeuren — GET + POST
├── 2d. api/ai/admin/* — tag-suggestie + content-agent
└── 2e. validations.ts — schema's updaten

FASE 3: Content (kan parallel met fase 2)
├── 3a. seed-artikel-tags.ts — keyword-mapping herschrijven
├── 3b. Alle 44 artikelen opnieuw taggen (script draaien)
└── 3c. Handmatige controle: zijn tags logisch?

FASE 4: Frontend (laatst, want afhankelijk van backend)
├── 4a. ProfielFormulier.tsx — gestructureerde secties
├── 4b. ProfielWizard.tsx — 3-schermen onboarding
├── 4c. leren/[categorie]/page.tsx — relevantie-filter
└── 4d. beheer/artikelen/page.tsx — admin tag-UI
```

---

### 10.6 Risico's en aandachtspunten

| Risico | Impact | Mitigatie |
|--------|--------|-----------|
| **Productiedata verloren** bij migratie | HOOG | Backup maken vóór migratie. Migratie-SQL eerst testen op staging |
| **ArtikelTag tabel is leeg** — geen data om te migreren | GEEN | Alleen nieuwe tags seeden, dan artikelen taggen |
| **GebruikerVoorkeur met oude slugs** | MIDDEL | UPDATE query's migreren. Deduplicatie na merge (bijv. 2x `lichamelijk`) |
| **Caregiver.aandoening met oude waarden** | MIDDEL | UPDATE query's. NULL-waarden (geen aandoening gekozen) hoeven niets |
| **Frontend toont lege tags na deploy** | HOOG | Seed-scripts draaien vóór frontend deploy |
| **AI-prompts verwijzen naar oude tag-namen** | LAAG | Tag-suggestie haalt dynamisch uit DB, niet hardcoded |
| **Artikel keyword-matching mist artikelen** | MIDDEL | Handmatige review na bulk-tagging. Content gap analyse |

---

### 10.7 Wat NIET verandert

Deze onderdelen zijn **niet geraakt** door de tag-herstructurering:

- **ContentCategorie** (LEREN, SUB_HOOFDSTUK, etc.) — structuur blijft hetzelfde
- **Zorgtaken** (t1-t10) — ongewijzigd
- **Balanstest vragen** (q1-q12) — ongewijzigd
- **Check-in vragen** (c1-c5) — ongewijzigd
- **Buddy-systeem** (BuddyTaakCategorie, matching) — ongewijzigd
- **Hulpvraag categorieën** — ongewijzigd
- **Zorgorganisaties** (landelijk + gemeente) — ongewijzigd
- **Artikel inhoud** (markdown teksten) — ongewijzigd, alleen tags wijzigen
- **Artikel categorieën** (praktische-tips→dagelijks-zorgen mapping) — al gemigreerd in herstructurering

---

*Dit voorstel is de basis voor de implementatie in Iteratie 2 van het projectplan. Na goedkeuring wordt het vertaald naar database-migraties, seed-scripts en UI-wijzigingen.*
