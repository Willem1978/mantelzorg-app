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
| 4 | `ontwikkeling` | Ontwikkeling & groei | Verstandelijke beperking, autisme, ontwikkelingsstoornis | 🌱 |
| 5 | `ouder-worden` | Ouder worden | Algemene ouderdomsklachten, kwetsbaarheid, vallen, eenzaamheid | 👴 |
| 6 | `ernstig-ziek` | Ernstig of langdurig ziek | Kanker, terminale fase, palliatief, chronisch ernstig ziek | 🕊️ |

**Waarom dit werkt:**
- "Mijn vader heeft geheugenproblemen" is veel minder confronterend dan "Mijn vader heeft dementie"
- "Ik geef lichamelijke zorg" dekt 6 oude tags in één keuze
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
| Mijn naaste is recent overleden | `rouw` |

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
| Aantal | 18 losse tags | 5 gestructureerde vragen → max 9 tags |
| Structuur | Vlakke lijst | Gegroepeerd per thema (B1-B5) |
| Invoer | Mix van auto + handmatig | Helder: B1-B4 auto, B5 optioneel handmatig |
| UX | 20+ chips tegelijk | Per vraag 3-4 opties (radio buttons) |

### Totaal tags op een profiel
| | Oud | Nieuw |
|--|-----|-------|
| Zorgthema/Aandoening | 0-12 (chip wall) | 1-3 (multi-select) |
| Rol/Situatie | 0-18 (chaos) | 4-8 (gestructureerd) |
| **Totaal per gebruiker** | **Onvoorspelbaar** | **5-11 (voorspelbaar)** |

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
| verstandelijke-beperking | ontwikkeling |
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
| rouwverwerking | Hernoemd naar `rouw` |

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
> 🌱 Ontwikkeling & groei
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
| Situatie | 18 losse chips | 5 duidelijke vragen |
| Onboarding | Zwaar, veel vragen | 3 schermen, dan balanstest |
| Content-matching | 0 artikelen getagd | Alle artikelen getagd op 3 dimensies |
| Aanbevelingen | Niet mogelijk | Score-based matching op profiel |
| Mantelzorger-ervaring | "Wat moet ik met al die opties?" | "Oh, dit gaat over mij" |

---

## 9. Beslispunten voor eigenaar

Voordat we implementeren, graag jouw akkoord op:

1. **Zijn de 6 zorgthema's compleet?** Missen er thema's, of zijn er thema's die je anders zou benoemen?

2. **Zorgthema "Ontwikkeling & groei"** — is dit herkenbaar voor mantelzorgers van iemand met een verstandelijke beperking? Of beter: "Beperking & begeleiding"?

3. **Rouw als losse tag** — nu staat het bij "wat speelt er nog meer?". Sommige platforms geven dit een eigen plek. Jouw voorkeur?

4. **Schermen in de onboarding** — akkoord met 3 schermen vóór de balanstest? Of nog korter (alleen zorgthema → balanstest)?

5. **Tag "fulltime-zorger"** (B2) — is dit een relevante groep om apart aan te spreken met content?

---

*Dit voorstel is de basis voor de implementatie in Iteratie 2 van het projectplan. Na goedkeuring wordt het vertaald naar database-migraties, seed-scripts en UI-wijzigingen.*
