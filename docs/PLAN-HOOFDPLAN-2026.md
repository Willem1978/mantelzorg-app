# MantelBuddy — Hoofdplan 2026

**Datum:** 16 maart 2026
**Versie:** 1.0
**Dit plan vervangt alle eerdere planbestanden.**

---

## Inhoudsopgave

1. [Prioriteit 1: Tags, Profiel & Wizard Herstructurering](#prioriteit-1)
2. [Prioriteit 2: Aanbevelingen op basis van Tags](#prioriteit-2)
3. [Prioriteit 3: Content Kwaliteit & Generatie](#prioriteit-3)
4. [Prioriteit 4: Zoeken & Vindbaarheid](#prioriteit-4)
5. [Prioriteit 5: Performance & Schaalbaarheid](#prioriteit-5)
6. [Wat is al af?](#wat-is-al-af)

---

## Wat is al af?

| Onderdeel | Status |
|-----------|--------|
| Iteratie 1: Beveiliging | Afgerond |
| Iteratie 2: Input Validatie & Stabiliteit | Afgerond |
| Iteratie 3: Klantreis Verbeteren | Afgerond |
| Iteratie 4 fase 1: Hulpbronnen | Gebouwd |
| Database schema (ContentTag, ArtikelTag, GebruikerVoorkeur) | Bestaat |
| Tag-afleiding (`bepaalProfielTags()`) | Bestaat, maar frontend-only |
| ProfielWizard (5 stappen) | Bestaat, maar rommelig |
| Onboarding (5 stappen) | Bestaat, maar 3 stappen zonder data |
| Voorkeuren-API (multi-aandoening) | Bestaat |
| Content Agent pipeline | Bestaat |
| Curator API (review, B1, duplicaten) | Bestaat |
| Embeddings + pgvector + semantic search | Bestaat |
| Hulpbronnen zoeker + validator | Bestaat |

---

<a name="prioriteit-1"></a>
## Prioriteit 1: Tags, Profiel & Wizard Herstructurering

> **Kernprobleem:** Tags staan als platte lijst door elkaar (zie screenshot). Er is geen logische groepering. Woonsituatie, werkstatus, relatietype en levensfase staan allemaal als losse chips naast elkaar. De wizard en het profielscherm zijn niet op elkaar afgestemd. Tags hebben geen duidelijke relatie tot artikelen en hulpbronnen.

### 1.1 Probleem: Tags zijn een platte chaos

**Huidige situatie (screenshot):**
```
Jouw situatie:
🎒 Jonge mantelzorger | 💼 Werkende mantelzorger | 🕐 Parttime werkend
🏠 Alleenstaande mantelzorger | 🎓 Studerende mantelzorger
👴 Gepensioneerde mantelzorger | 👥 Meervoudige mantelzorg
🏠 Samenwonend met zorgvrager | 💑 Partnerzorg | 📍 Naaste woont dichtbij
👨‍👩‍👧 Ouder zorgt voor kind | 👵 Kind zorgt voor ouder | 🚗 Mantelzorg op afstand
👨‍👩‍👧 Mantelzorg naast eigen kinderen | 🕊️ Rouwende mantelzorger
🌱 Net begonnen (< 1 jaar) | ⏰ Intensieve zorg | 👥 Meerdere zorgvragers
🕊️ Na het overlijden
```

**Problemen:**
1. Alles staat door elkaar — geen visuele groepering
2. Tags die eigenlijk profielvragen zijn (woonsituatie, werk) staan als chips
3. Automatische en handmatige tags zijn niet te onderscheiden
4. Sommige tags sluiten elkaar uit (fulltime vs parttime vs student) maar je kunt ze allemaal selecteren
5. Tags die worden afgeleid uit profieldata staan ook als handmatig selecteerbaar
6. Geen duidelijke relatie tussen tags en welke content/hulpbronnen erbij horen

### 1.2 Oplossing: Gestructureerd profiel met themagroepen

**Het profiel wordt één overzichtelijk scherm, gegroepeerd in duidelijke thema-secties.** Elke sectie is een concrete vraag met passende input (radio buttons, multi-select, chips). Tags worden AFGELEID uit antwoorden, niet handmatig gekozen.

#### Het nieuwe profielscherm:

```
┌──────────────────────────────────────────────────┐
│ 📋 Mijn profiel                                   │
│                                                   │
│ Help ons je beter te helpen. Hoe meer we weten,   │
│ hoe persoonlijker onze tips en artikelen.          │
│                                                   │
│ ═══════════════════════════════════════════════════│
│                                                   │
│ SECTIE 1: 💚 VOOR WIE ZORG JE?                    │
│                                                   │
│ Relatie met je naaste:                             │
│ (○) Partner    (○) Ouder    (○) Kind               │
│ (○) Broer/zus  (○) Vriend/kennis  (○) Anders       │
│                                                   │
│ → Levert op: partner-zorg / ouder-zorg / kind-zorg │
│                                                   │
│ ═══════════════════════════════════════════════════│
│                                                   │
│ SECTIE 2: 🏠 WOONSITUATIE                          │
│                                                   │
│ Waar woont je naaste ten opzichte van jou?         │
│                                                   │
│ (○) 🏠 We wonen samen                              │
│ (○) 📍 Dichtbij (zelfde stad/dorp)                 │
│ (○) 🚗 Op afstand (andere stad/regio)              │
│                                                   │
│ → Levert op: samenwonend / dichtbij / op-afstand   │
│                                                   │
│ ═══════════════════════════════════════════════════│
│                                                   │
│ SECTIE 3: 💼 WERK & DAGBESTEDING                   │
│                                                   │
│ Wat is jouw situatie?                              │
│                                                   │
│ (○) 💼 Ik werk fulltime                            │
│ (○) 🕐 Ik werk parttime                            │
│ (○) 🏠 Ik werk niet                                │
│ (○) 🎓 Ik studeer                                  │
│ (○) 👴 Ik ben gepensioneerd                        │
│                                                   │
│ → Levert op: werkend / werkend-parttime / student / │
│   gepensioneerd                                    │
│                                                   │
│ ═══════════════════════════════════════════════════│
│                                                   │
│ SECTIE 4: 🩺 AANDOENING VAN JE NAASTE             │
│                                                   │
│ Waarmee heeft je naaste te maken?                  │
│ (meerdere mogelijk)                                │
│                                                   │
│ [🧠 Dementie    ] [🎗️ Kanker      ] [❤️ Hart/vaat ]│
│ [💭 Psychisch   ] [🌟 Verstand.   ] [🦽 Licham.   ]│
│ [🧩 NAH         ] [🫁 COPD/Long   ] [💉 Diabetes  ]│
│ [👴 Ouderdom    ] [🕊️ Terminaal   ] [🔬 Overig    ]│
│                                                   │
│ → Levert op: aandoening-tags (AANDOENING type)     │
│                                                   │
│ ═══════════════════════════════════════════════════│
│                                                   │
│ SECTIE 5: ⏱️ ZORGSITUATIE                          │
│                                                   │
│ Hoeveel uur per week zorg je (ongeveer)?           │
│ [slider of dropdown: 0-5 / 5-10 / 10-20 / 20-40 / 40+]│
│                                                   │
│ Hoe lang zorg je al?                               │
│ (○) Minder dan 1 jaar                              │
│ (○) 1-5 jaar                                       │
│ (○) Meer dan 5 jaar                                │
│                                                   │
│ → Levert op: intensief / beginnend / langdurig      │
│                                                   │
│ ═══════════════════════════════════════════════════│
│                                                   │
│ SECTIE 6: 👤 WAT PAST BIJ JOU?                    │
│                                                   │
│ Herken je jezelf hierin? (optioneel, meerdere)     │
│                                                   │
│ [👨‍👩‍👧 Ik zorg naast eigen kinderen ]                │
│ [👥 Ik zorg voor meerdere naasten  ]               │
│ [🏚️ Ik sta er alleen voor          ]               │
│ [🕊️ Mijn naaste is overleden       ]               │
│                                                   │
│ → Dit zijn de ENIGE handmatige tags (4 stuks)       │
│                                                   │
│ ═══════════════════════════════════════════════════│
│                                                   │
│ SECTIE 7: 📚 WAAR WIL JE OVER LEZEN?              │
│                                                   │
│ [📋 Praktische tips    ] [🧘 Zelfzorg & balans   ] │
│ [⚖️ Rechten & regeling ] [💰 Geld & financiën    ] │
│ [🔧 Hulpmiddelen       ] [💼 Werk & mantelzorg   ] │
│ [🤝 Samen zorgen       ]                           │
│                                                   │
│ ═══════════════════════════════════════════════════│
│                                                   │
│ [        💾 Profiel opslaan                   ]    │
│                                                   │
│ Je kunt dit later altijd aanpassen in je profiel.  │
└──────────────────────────────────────────────────┘
```

### 1.3 Kernprincipe: Tags worden AFGELEID, niet gekozen

**Oud:** Gebruiker kiest uit 20+ losse tag-chips
**Nieuw:** Gebruiker beantwoordt 6 duidelijke vragen → systeem leidt tags af

| Profielvraag | → Automatische tag(s) | Type |
|---|---|---|
| Relatie = partner | `partner-zorg` | SITUATIE |
| Relatie = ouder | `ouder-zorg` | SITUATIE |
| Relatie = kind | `kind-zorg` | SITUATIE |
| Woonsituatie = samen | `samenwonend` | SITUATIE |
| Woonsituatie = dichtbij | `dichtbij` | SITUATIE |
| Woonsituatie = op afstand | `op-afstand` | SITUATIE |
| Werk = fulltime | `werkend` | SITUATIE |
| Werk = parttime | `werkend`, `werkend-parttime` | SITUATIE |
| Werk = student | `student` | SITUATIE |
| Werk = gepensioneerd | `gepensioneerd` | SITUATIE |
| Zorguren >= 20 | `intensief` | SITUATIE |
| Zorgt < 1 jaar | `beginnend` | SITUATIE |
| Zorgt > 5 jaar | `langdurig` | SITUATIE |
| Leeftijd < 25 | `jong` | SITUATIE |
| Aandoening = dementie | `dementie` | AANDOENING |
| (etc.) | (etc.) | AANDOENING |

**Handmatige tags (sectie 6, slechts 4 stuks):**
- `met-kinderen` — niet afleidbaar
- `meerdere-zorgvragers` — niet afleidbaar
- `alleenstaand` — niet afleidbaar
- `rouwverwerking` — niet afleidbaar

### 1.4 Wizard vs. Profiel: samenvoegen

**Oud:**
- Onboarding = 5 stappen (3 zonder data)
- ProfielWizard = 5 stappen (apart scherm)
- Profielpagina = weer een ander scherm met tags

**Nieuw:**
- Onboarding = Welkom → **Profiel invullen** (één scherm) → Belastbaarheidstest
- Profielpagina = **zelfde scherm** als bij onboarding
- Geen aparte wizard meer

```
Registratie
    │
    ├── Welkom (met Ger)
    │   "Welkom bij MantelBuddy! Ik ben Ger."
    │
    ├── Profiel invullen (één scrollbaar scherm)
    │   [Profiel opslaan] of [Later invullen →]
    │
    └── Door naar belastbaarheidstest
        (of dashboard als overgeslagen)
```

### 1.5 Tag-naar-Content koppeling

Tags zijn alleen nuttig als ze content filteren. Huidige staat: **0 artikelen zijn getagd** (ArtikelTag tabel is leeg).

**Actie:**
1. Alle bestaande artikelen taggen (AANDOENING + SITUATIE + ONDERWERP)
2. Hulpbronnen koppelen aan tags (voor gerichte aanbevelingen)
3. Bij nieuw gegenereerde content: tags automatisch meegeven

**Tag-matching voor content:**
| Tag-type | Voorbeeld | Wat levert het op? |
|---|---|---|
| AANDOENING: `dementie` | Artikelen over dementie, hulpbronnen voor dementie | Gerichte info |
| SITUATIE: `werkend` | Artikelen over werk-zorgbalans | Relevante tips |
| SITUATIE: `op-afstand` | Artikelen over mantelzorg op afstand | Passende hulp |
| SITUATIE: `beginnend` | Startgids, basis-info | Geen overweldiging |
| CATEGORIE: `zelfzorg-balans` | Artikelen in die categorie | Interesse-match |

### 1.6 Bouwstappen Prioriteit 1

| # | Taak | Geschat |
|---|------|---------|
| 1.1 | **Tag-groepen definiëren** — SITUATIE tags opsplitsen in subgroepen (relatie, wonen, werk, zorgduur, levensfase) via een nieuw `groep` veld op ContentTag | 2 uur |
| 1.2 | **Profielscherm herstructureren** — Één scrollbaar scherm met 7 secties. Radio buttons voor exclusieve keuzes (wonen, werk). Multi-select alleen voor aandoeningen en handmatige tags | 6 uur |
| 1.3 | **Tag-afleiding server-side** — `bepaalProfielTags()` verplaatsen naar backend. Bij opslaan profiel automatisch tags berekenen en opslaan | 3 uur |
| 1.4 | **Wizard en onboarding samenvoegen** — Eén flow: welkom → profiel (scrollbaar) → belastbaarheidstest. "Later invullen" optie | 4 uur |
| 1.5 | **Voorkeuren-API opschonen** — Duidelijk onderscheid tussen automatische tags (uit profiel) en handmatige tags. Categorieën apart | 2 uur |
| 1.6 | **Bestaande artikelen taggen** — AI bulk-tagging van alle artikelen via ArtikelTag | 3 uur |
| 1.7 | **Profiel-completeness indicator** — Voortgangsbalk op profielpagina | 1 uur |
| 1.8 | **Dashboard herinnering** — "Vul je profiel aan" kaart (max 3×) | 1 uur |
| | **Totaal** | **~22 uur** |

### 1.7 Database-wijzigingen

```prisma
// ContentTag uitbreiden met groep
model ContentTag {
  // bestaande velden...
  groep        String?    // "relatie" | "wonen" | "werk" | "zorgduur" | "levensfase" | "extra" | null
}
```

**Tag-groepen:**
| Groep | Tags | Input-type |
|---|---|---|
| `relatie` | partner-zorg, ouder-zorg, kind-zorg | Radio (exclusief) |
| `wonen` | samenwonend, dichtbij, op-afstand | Radio (exclusief) |
| `werk` | werkend, werkend-parttime, student, gepensioneerd | Radio (exclusief) |
| `zorgduur` | beginnend, langdurig | Automatisch (careSince) |
| `zorgintensiteit` | intensief | Automatisch (uren) |
| `levensfase` | jong | Automatisch (leeftijd) |
| `extra` | met-kinderen, meerdere-zorgvragers, alleenstaand, rouwverwerking | Chips (multi-select) |

### 1.8 Acceptatiecriteria

- [ ] Profielscherm is één scrollbaar scherm met duidelijke secties
- [ ] Woonsituatie: 3 radio buttons (niet als tag-chips)
- [ ] Werkstatus: 5 radio buttons (niet als tag-chips)
- [ ] Relatie: radio buttons (niet als tag-chips)
- [ ] Aandoening: multi-select chips
- [ ] Alleen 4 handmatige tags als chips in "Wat past bij jou?"
- [ ] Tags worden automatisch afgeleid bij opslaan (server-side)
- [ ] Wizard en onboarding gebruiken zelfde profielscherm
- [ ] Alle artikelen zijn getagd via ArtikelTag
- [ ] Profiel-completeness indicator werkt
- [ ] "Later invullen" optie in onboarding

---

<a name="prioriteit-2"></a>
## Prioriteit 2: Aanbevelingen op basis van Tags

> **Doel:** Artikelen en hulpbronnen proactief aanbevelen op basis van het profiel. "Van zoek zelf naar aanbevolen voor jou."

### 2.1 Bouwstappen

| # | Taak | Geschat |
|---|------|---------|
| 2.1 | **Relevantie-score berekening** — Tag-overlap score per artikel per gebruiker. AANDOENING match = 3pt, SITUATIE = 2pt, CATEGORIE = 1pt | 4 uur |
| 2.2 | **Dashboard "Aanbevolen voor jou"** — Top 3-5 artikelen op basis van relevantie. Match-reden tonen | 3 uur |
| 2.3 | **Leren-pagina sorteren** — Artikelen binnen categorie sorteren op relevantie. Badge "Aanbevolen" | 2 uur |
| 2.4 | **Weekkaarten verbeteren** — Weekkaarten selecteren op basis van relevantie i.p.v. random | 2 uur |
| 2.5 | **"Meer hierover" suggesties** — Onderaan artikel: gerelateerde artikelen op basis van gedeelde tags | 2 uur |
| 2.6 | **Ger AI integratie** — Gebruiker-tags meegeven als context aan Ger | 1 uur |
| | **Totaal** | **~14 uur** |

### 2.2 Acceptatiecriteria

- [ ] Dashboard toont "Aanbevolen voor jou" met 3-5 artikelen
- [ ] Werkende mantelzorger ziet andere artikelen dan gepensioneerde
- [ ] Match-reden is zichtbaar ("Past bij: dementie, werkend")
- [ ] Leren-pagina heeft relevantie-sortering
- [ ] Ger gebruikt profiel-tags in gesprekken

---

<a name="prioriteit-3"></a>
## Prioriteit 3: Content Kwaliteit & Generatie

> **Doel:** Content compleet, kwalitatief en gericht genereren voor specifieke doelgroepen.

### 3.1 Bouwstappen

| # | Taak | Geschat |
|---|------|---------|
| 3.1 | **Tag-suggestie in artikel-editor** — AI-suggesties voor tags bij bewerken/aanmaken | 2 uur |
| 3.2 | **Doelgroep-specifiek genereren** — Beheerder kiest tag-combinatie, AI genereert artikel | 3 uur |
| 3.3 | **Content hiaten-analyse** — Welke tag-combinaties hebben geen artikelen? | 4 uur |
| 3.4 | **Artikel completeness-score** — 0-100% score per artikel (titel, tags, inhoud, bron) | 3 uur |
| 3.5 | **Curator-resultaten opslaan** — Review-feedback per artikel bewaren | 2 uur |
| 3.6 | **Actie-knoppen bij feedback** — "Herschrijf" / "Markeer opgelost" per issue | 2 uur |
| 3.7 | **Bronvermelding** — ArtikelBron model + bronsectie in weergave | 5 uur |
| | **Totaal** | **~21 uur** |

---

<a name="prioriteit-4"></a>
## Prioriteit 4: Zoeken & Vindbaarheid

> **Doel:** Mantelzorgers kunnen zoeken op betekenis, niet alleen op exacte woorden.

### 4.1 Bouwstappen

| # | Taak | Geschat |
|---|------|---------|
| 4.1 | **User-facing zoekpagina** — Zoekbalk met resultaten uit artikelen + hulpbronnen | 3 uur |
| 4.2 | **Zoekbalk in navigatie** — Compacte zoekbalk in header | 1 uur |
| 4.3 | **Embeddings automatisering** — Cron route voor dagelijks embeddings bijwerken | 1 uur |
| 4.4 | **Gemeente hulpbronnen semantic search** — Semantic search i.p.v. tekst-matching | 1 uur |
| | **Totaal** | **~6 uur** |

---

<a name="prioriteit-5"></a>
## Prioriteit 5: Performance & Schaalbaarheid

> **Uit het masterplan, nog niet gestart.**

| # | Taak | Geschat |
|---|------|---------|
| 5.1 | Caching strategie (Redis/in-memory) | 4 uur |
| 5.2 | API response times optimaliseren | 3 uur |
| 5.3 | Database query optimalisatie | 3 uur |
| 5.4 | Toegankelijkheid & UX voor ouderen | 6 uur |
| | **Totaal** | **~16 uur** |

---

## Totaaloverzicht

| Prioriteit | Onderwerp | Geschat | Status |
|---|---|---|---|
| **1** | Tags, Profiel & Wizard Herstructurering | ~22 uur | **Te starten** |
| **2** | Aanbevelingen op basis van Tags | ~14 uur | Wacht op P1 |
| **3** | Content Kwaliteit & Generatie | ~21 uur | Wacht op P1 |
| **4** | Zoeken & Vindbaarheid | ~6 uur | Onafhankelijk |
| **5** | Performance & Schaalbaarheid | ~16 uur | Onafhankelijk |
| | **Totaal** | **~79 uur** | |

### Afhankelijkheden

```
P1 (Tags & Profiel) ──→ P2 (Aanbevelingen)
                    ──→ P3 (Content Kwaliteit)

P4 (Zoeken) ──── onafhankelijk, kan parallel
P5 (Performance) ── onafhankelijk, kan parallel
```

**Prioriteit 1 is het absolute fundament.** Zonder gestructureerde tags en een opgeschoond profielscherm werken aanbevelingen en gerichte content niet.

---

*Dit plan is opgesteld op 16 maart 2026 en vervangt alle eerdere planbestanden.*
