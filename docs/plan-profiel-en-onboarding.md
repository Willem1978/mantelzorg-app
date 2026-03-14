# Plan: Profiel, Onboarding & Tags — "Ken je Mantelzorger"

**Datum:** 14 maart 2026
**Versie:** 1.0
**Doel:** Een compleet profiel samenstellen waarmee het systeem de mantelzorger echt kent. Tags afleiden uit profielantwoorden. Onboarding en profiel-wizard samenvoegen tot één vloeiend scherm. Multi-select voor aandoeningen. Dit profiel vormt het fundament voor het artikelaanbevelingssysteem.

---

## Kernvisie

> **Het profiel is het fundament van alles.**
>
> Als we weten dat iemand een werkende mantelzorger is, met twee kinderen thuis, die op afstand zorgt voor een moeder met dementie — dan kunnen we:
> - De juiste artikelen aanbevelen
> - De juiste hulpbronnen tonen
> - Ger (de AI-coach) persoonlijker laten praten
> - Weekkaarten relevanter maken
> - Content gericht genereren voor deze doelgroep
>
> Het huidige systeem verzamelt al veel data, maar verspreid over onboarding, profiel-wizard en voorkeuren. Dit plan voegt alles samen tot één helder profiel.

---

## 1. Wat bestaat er al?

### 1.1 Huidige Onboarding (Onboarding.tsx — 5 stappen)

| Stap | Wat wordt gevraagd? | Opgeslagen als |
|------|---------------------|----------------|
| 1 | Welkom (geen input) | — |
| 2 | Gemeente + relatie met naaste | `municipality`, `careRecipient` |
| 3 | Zorguren per week + hoe lang al | `careHoursPerWeek`, `careSince` |
| 4 | App-uitleg (geen input) | — |
| 5 | Klaar → doorsturen naar belastbaarheidstest | — |

**Probleem:** 3 van de 5 stappen verzamelen geen data. Er wordt niks gevraagd over werk, gezin, aandoening of situatie.

### 1.2 Huidige ProfielWizard (ProfielWizard.tsx — 5 stappen)

| Stap | Wat wordt gevraagd? | Opgeslagen als |
|------|---------------------|----------------|
| 1 | Naam, e-mail, telefoon, adres | Caregiver velden |
| 2 | Naaste: naam, relatie, adres | Caregiver velden |
| 3 | Aandoening (**enkelvoudig**) + situatie-tags (multi) | `aandoening` + GebruikerVoorkeur |
| 4 | Interesse-categorieën (multi) | GebruikerVoorkeur |
| 5 | Overzicht + opslaan | — |

**Problemen:**
- Aandoening is single-select — maar naasten hebben vaak meerdere aandoeningen
- Stap voor stap is overweldigend voor iemand in stress
- Wordt pas na onboarding gedaan, als extra actie
- Locatie-relatie (samenwonend/dichtbij/op afstand) wordt niet expliciet gevraagd, alleen als tag
- Werkstatus (fulltime/parttime/niet) wordt niet gevraagd, alleen als tag "werkend"

### 1.3 Huidige Tags (ContentTag)

**12 aandoening-tags:** dementie, kanker, CVA/beroerte, hartfalen, COPD, diabetes, psychisch, verstandelijke beperking, lichamelijke beperking, NAH, ouderdom, terminaal/palliatief

**9 situatie-tags (seed):** werkend, jong, op-afstand, met-kinderen, beginnend, langdurig, partner-zorg, ouder-zorg, kind-zorg

**Extra tags in productie (screenshot):** samenwonend, intensief, meerdere-zorgvragers, rouwverwerking, naast-eigen-kinderen, alleenstaand, meervoudige-mantelzorg

### 1.4 Wat ontbreekt?

| Ontbreekt | Waarom belangrijk? |
|-----------|--------------------|
| Multi-select aandoening | Naaste heeft vaak dementie + diabetes, of kanker + psychisch |
| Werkstatus met gradatie | "Werkend" is te grof — fulltime vs parttime maakt groot verschil |
| Locatie-relatie als profielvraag | Samenwonend/dichtbij/op-afstand bepaalt welke hulp relevant is |
| Levensfase-tags | Net begonnen vs al jaren bezig verandert de relevantie compleet |
| ArtikelTag koppelingen | 0 van 42 artikelen is getagd — aanbevelingssysteem kan niet werken |

---

## 2. Het Nieuwe Profiel

### 2.1 Profielvragen — één scherm, niet in stappen

Het profiel wordt verzameld op **één overzichtelijk scherm** (scrollbaar), gegroepeerd in secties. De gebruiker kan secties overslaan en later invullen vanuit het profiel.

```
┌──────────────────────────────────────────────────┐
│ 📋 Mijn profiel                                   │
│                                                   │
│ Help ons je beter te helpen. Hoe meer we weten,   │
│ hoe persoonlijker onze tips en artikelen.          │
│ Je kunt alles later nog aanpassen.                 │
│                                                   │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                   │
│ 👤 OVER JOU                                       │
│                                                   │
│ Naam: [Willem                              ]      │
│ Adres: [Zoek je straat...                  ]      │
│ Telefoon: [optioneel, voor WhatsApp        ]      │
│                                                   │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                   │
│ 💚 VOOR WIE ZORG JE?                              │
│                                                   │
│ Naam naaste: [Moeder                       ]      │
│ Relatie: [Ouder ▼]                                │
│ Adres naaste: [Zoek straat...              ]      │
│                                                   │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                   │
│ 🏠 WOONSITUATIE                                   │
│                                                   │
│ Waar woont je naaste ten opzichte van jou?         │
│                                                   │
│ (○) 🏠 We wonen samen                              │
│ (○) 📍 Dichtbij (zelfde stad/dorp)                 │
│ (○) 🚗 Op afstand (andere stad/regio)              │
│                                                   │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                   │
│ 💼 WERK                                           │
│                                                   │
│ Werk je naast het zorgen?                          │
│                                                   │
│ (○) 💼 Ja, fulltime                                │
│ (○) 🕐 Ja, parttime                                │
│ (○) 🏠 Nee, ik werk niet                           │
│ (○) 🎓 Ik studeer                                  │
│ (○) 👴 Ik ben gepensioneerd                        │
│                                                   │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                   │
│ 🩺 AANDOENING / BEPERKING VAN JE NAASTE          │
│                                                   │
│ Waarmee heeft je naaste te maken?                  │
│ Je mag er meerdere kiezen.                         │
│                                                   │
│ [🧠 Dementie    ] [🎗️ Kanker     ] [❤️ Hart/vaat ]│
│ [💭 Psychisch   ] [🌟 Verstand.  ] [🦽 Licham.   ]│
│ [🧩 NAH         ] [🫁 COPD/Long  ] [🤲 Parkinson ]│
│ [🔬 MS          ] [💉 Diabetes   ] [👴 Ouderdom  ]│
│ [🕊️ Terminaal   ] [              ]                │
│                                                   │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                   │
│ 🏷️ JOUW SITUATIE                                  │
│                                                   │
│ Herken je jezelf hierin? Kies wat past.             │
│                                                   │
│ [💼 Werkende mantelzorger  ] [🎓 Jong (<25)      ] │
│ [👨‍👩‍👧 Mantelzorg + gezin     ] [🌱 Net begonnen    ] │
│ [⏳ Al jaren bezig         ] [⏰ Intensief (20u+) ] │
│ [💑 Partnerzorg            ] [👵 Zorg voor ouder  ] │
│ [👧 Zorg voor kind         ] [👥 Meerdere naasten ] │
│ [🕊️ Na het overlijden      ] [🏚️ Alleenstaand     ] │
│                                                   │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                   │
│ 📚 WAAR WIL JE MEER OVER LEZEN?                   │
│                                                   │
│ Kies de onderwerpen die jou aanspreken.             │
│                                                   │
│ [📋 Praktische tips    ] [🧘 Zelfzorg & balans  ]  │
│ [⚖️ Rechten & regeling ] [💰 Geld & financiën   ]  │
│ [🔧 Hulpmiddelen       ] [💼 Werk & mantelzorg  ]  │
│ [🤝 Samen zorgen       ]                           │
│                                                   │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                   │
│ [        💾 Profiel opslaan                   ]    │
│                                                   │
│ Je kunt dit later altijd aanpassen in je profiel.  │
└──────────────────────────────────────────────────┘
```

### 2.2 Secties en hun doel

| Sectie | Verplicht? | Doel | Levert tags op? |
|--------|-----------|------|-----------------|
| **Over jou** | Naam: ja | Personalisatie (Ger spreekt je aan met naam) | Nee |
| **Voor wie zorg je** | Nee | Ger + hulpbronnen zoeken in juiste gemeente | Nee |
| **Woonsituatie** | Nee | Bepaalt `samenwonend` / `op-afstand` tag | Ja → locatie-tag |
| **Werk** | Nee | Bepaalt `werkend` / `werkend-parttime` / `student` tag | Ja → werk-tag |
| **Aandoening** | Nee | Multi-select: welke aandoening(en) heeft de naaste | Ja → aandoening-tags |
| **Jouw situatie** | Nee | Aanvullende herkenningslabels | Ja → situatie-tags |
| **Interesses** | Nee | Welke content-categorieën interesseren de gebruiker | Ja → categorie-voorkeuren |

### 2.3 Automatische tag-afleiding uit profielantwoorden

Sommige tags worden **automatisch afgeleid** uit profielantwoorden, zodat de gebruiker ze niet dubbel hoeft te kiezen:

| Profielantwoord | → Automatische tag | Type |
|-----------------|---------------------|------|
| Woonsituatie = "samen" | `samenwonend` | SITUATIE |
| Woonsituatie = "afstand" | `op-afstand` | SITUATIE |
| Werk = "fulltime" of "parttime" | `werkend` | SITUATIE |
| Werk = "student" | `jong` (als leeftijd < 25) | SITUATIE |
| Relatie = "partner" | `partner-zorg` | SITUATIE |
| Relatie = "ouder" | `ouder-zorg` | SITUATIE |
| Relatie = "kind" | `kind-zorg` | SITUATIE |
| careHoursPerWeek >= 20 | `intensief` | SITUATIE |
| careSince < 1 jaar | `beginnend` | SITUATIE |
| careSince > 5 jaar | `langdurig` | SITUATIE |
| dateOfBirth → leeftijd < 25 | `jong` | SITUATIE |
| Aandoening bevat "dementie" | `dementie` | AANDOENING |
| (etc. voor elke geselecteerde aandoening) | | AANDOENING |

**Belangrijk:** Automatisch afgeleide tags worden **getoond** in de situatie-sectie (als voorgeselecteerd), zodat de gebruiker ze kan aanpassen. Ze worden niet stilletjes toegevoegd.

### 2.4 Aandoening: multi-select

De huidige single-select voor aandoening wordt multi-select:

**Wijziging:** `caregiver.aandoening` (String?) → opslaan als meerdere `GebruikerVoorkeur` records met `type: TAG` en AANDOENING-slugs.

Het bestaande `aandoening` veld op Caregiver blijft bestaan als "primaire aandoening" (eerste selectie), voor backward-compatibiliteit met bestaande code. Maar alle geselecteerde aandoeningen worden ook als GebruikerVoorkeur TAG records opgeslagen.

**Voorbeeld:** Een naaste met dementie + diabetes:
- `caregiver.aandoening = "dementie"` (primair, backward-compat)
- GebruikerVoorkeur: `{ type: TAG, slug: "dementie" }`
- GebruikerVoorkeur: `{ type: TAG, slug: "diabetes" }`

### 2.5 Woonsituatie: driekeuze i.p.v. tag

De woonsituatie wordt een **expliciete profielvraag** met drie opties, niet alleen een tag:

```
Waar woont je naaste ten opzichte van jou?

(○) 🏠 We wonen samen
(○) 📍 Dichtbij (zelfde stad of dorp)
(○) 🚗 Op afstand (andere stad of regio)
```

**Opslaan als:**
- Nieuw veld: `caregiver.woonsituatie` = `"samen"` | `"dichtbij"` | `"op-afstand"`
- Automatisch: GebruikerVoorkeur TAG → `samenwonend` of `op-afstand`

### 2.6 Werkstatus: vijf opties

```
Werk je naast het zorgen?

(○) 💼 Ja, ik werk fulltime
(○) 🕐 Ja, ik werk parttime
(○) 🏠 Nee, ik werk niet
(○) 🎓 Ik studeer
(○) 👴 Ik ben gepensioneerd
```

**Opslaan als:**
- Nieuw veld: `caregiver.werkstatus` = `"fulltime"` | `"parttime"` | `"niet-werkend"` | `"student"` | `"gepensioneerd"`
- Automatisch: GebruikerVoorkeur TAG → `werkend` (bij fulltime/parttime)

---

## 3. Onboarding: nieuw ontwerp

### 3.1 Nieuwe flow

De huidige 5-stappen onboarding wordt vervangen door een **kortere flow**:

```
Registratie
    │
    ├── Welkom-scherm (met Ger)
    │   "Welkom bij MantelBuddy! Ik ben Ger, jouw digitale coach."
    │
    ├── Profiel invullen (één scherm — zie 2.1)
    │   Onderaan: [Profiel opslaan] of [Later invullen →]
    │
    └── Doorsturen naar belastbaarheidstest
        (of naar dashboard als profiel overgeslagen)
```

### 3.2 "Later invullen" optie

Als de gebruiker het profiel overslaat:
- Wordt doorgestuurd naar het dashboard
- Een **zachte herinnering** verschijnt op het dashboard:

```
┌──────────────────────────────────────────────────┐
│ 📋 Vul je profiel aan                             │
│                                                   │
│ Hoe meer we over je weten, hoe persoonlijker      │
│ onze tips. Het kost maar 2 minuten.               │
│                                                   │
│ [Profiel invullen →]        [Niet nu]             │
└──────────────────────────────────────────────────┘
```

- Deze herinnering verschijnt maximaal 3 keer (1× per week)
- Na 3 keer wordt het een kleine link in het profiel
- Ger kan ook in gesprekken vragen: "Ik zie dat je profiel nog niet compleet is. Wil je dat nu doen?"

### 3.3 Profiel vanuit profiel-pagina

De profiel-pagina bevat een knop "Profiel aanpassen" die exact hetzelfde scherm opent als bij de onboarding (sectie 2.1). Geen aparte wizard meer — één consistent scherm.

### 3.4 Profiel-completeness indicator

Op de profiel-pagina een voortgangsbalk:

```
Je profiel: ████████░░ 80% compleet

Nog niet ingevuld:
• Adres van je naaste (voor lokale hulp)
• Werk en studie
```

---

## 4. Tags: uitbreiding en herstructurering

### 4.1 Situatie-tags uitbreiden en opschonen

De huidige tags plus aanvullingen, consistent gemaakt:

**SITUATIE-tags (bestaand + nieuw):**

| Slug | Naam | Emoji | Bron | Nieuw? |
|------|------|-------|------|--------|
| `werkend` | Werkende mantelzorger | 💼 | Automatisch (werkstatus) | Nee |
| `werkend-parttime` | Parttime werkend | 🕐 | Automatisch (werkstatus) | **Ja** |
| `jong` | Jonge mantelzorger (< 25) | 🎓 | Automatisch (leeftijd) | Nee |
| `op-afstand` | Mantelzorg op afstand | 📍 | Automatisch (woonsituatie) | Nee |
| `samenwonend` | Samenwonend met naaste | 🏠 | Automatisch (woonsituatie) | Nee* |
| `dichtbij` | Naaste woont dichtbij | 📍 | Automatisch (woonsituatie) | **Ja** |
| `beginnend` | Net begonnen (< 1 jaar) | 🌱 | Automatisch (careSince) | Nee |
| `langdurig` | Al jaren bezig (> 5 jaar) | ⏳ | Automatisch (careSince) | Nee |
| `intensief` | Intensieve zorg (20+ uur/week) | ⏰ | Automatisch (careHours) | Nee* |
| `met-kinderen` | Mantelzorg naast eigen kinderen | 👨‍👩‍👧 | Handmatig (situatie-chips) | Nee |
| `partner-zorg` | Partnerzorg | 💑 | Automatisch (relatie) | Nee |
| `ouder-zorg` | Kind zorgt voor ouder | 👵 | Automatisch (relatie) | Nee |
| `kind-zorg` | Ouder zorgt voor kind | 👧 | Automatisch (relatie) | Nee |
| `meerdere-zorgvragers` | Meerdere naasten | 👥 | Handmatig (situatie-chips) | Nee* |
| `alleenstaand` | Alleenstaande mantelzorger | 🏚️ | Handmatig (situatie-chips) | **Ja** |
| `student` | Studerende mantelzorger | 🎓 | Automatisch (werkstatus) | **Ja** |
| `gepensioneerd` | Gepensioneerde mantelzorger | 👴 | Automatisch (werkstatus) | **Ja** |
| `rouwverwerking` | Na het overlijden | 🕊️ | Handmatig (situatie-chips) | Nee* |

(*) = bestond in productie maar niet in seed-script

### 4.2 Welke tags worden automatisch vs. handmatig gezet?

**Automatisch afgeleid** (gebruiker hoeft niks te doen, wordt berekend):
- `werkend` / `werkend-parttime` / `student` / `gepensioneerd` → uit werkstatus-vraag
- `samenwonend` / `dichtbij` / `op-afstand` → uit woonsituatie-vraag
- `partner-zorg` / `ouder-zorg` / `kind-zorg` → uit relatie met naaste
- `beginnend` / `langdurig` → uit careSince
- `intensief` → uit careHoursPerWeek
- `jong` → uit dateOfBirth

**Handmatig gekozen** (situatie-chips sectie):
- `met-kinderen` — niet afleidbaar uit bestaande data
- `meerdere-zorgvragers` — niet afleidbaar
- `alleenstaand` — niet afleidbaar
- `rouwverwerking` — niet afleidbaar

**Belangrijk:** Automatisch afgeleide tags verschijnen als **voorgeselecteerd** in de situatie-chips, zodat de gebruiker ze ziet en eventueel kan uitzetten.

### 4.3 Interesse-categorieën (bestaand, ongewijzigd)

De 7 huidige categorieën blijven:

| Slug | Naam | Emoji |
|------|------|-------|
| `praktische-tips` | Praktische tips | 📋 |
| `zelfzorg-balans` | Zelfzorg & balans | 🧘 |
| `rechten-regelingen` | Rechten & regelingen | ⚖️ |
| `geld-financien` | Geld & financiën | 💰 |
| `hulpmiddelen-technologie` | Hulpmiddelen & technologie | 🔧 |
| `werk-mantelzorg` | Werk & mantelzorg | 💼 |
| `samenwerken-netwerk` | Samenwerken & netwerk | 🤝 |

### 4.4 Tag-type ONDERWERP (nieuw)

Naast AANDOENING en SITUATIE wordt een derde tag-type toegevoegd: **ONDERWERP**. Dit zijn inhoudelijke onderwerpen die op artikelen worden gezet (niet door de gebruiker gekozen, maar door de AI/beheerder):

| Slug | Naam |
|------|------|
| `financien` | Financiën & vergoedingen |
| `wmo-aanvragen` | Wmo aanvragen |
| `pgb` | Persoonsgebonden budget |
| `medicatie` | Medicatie & medicijnbeheer |
| `nachtrust` | Slaap & nachtrust |
| `voeding` | Voeding & maaltijden |
| `veiligheid-thuis` | Veiligheid in huis |
| `dagbesteding` | Dagbesteding |
| `vervoer` | Vervoer & mobiliteit |
| `respijtzorg` | Respijtzorg |
| `werk-zorg-balans` | Werk-zorgbalans |
| `emotionele-steun` | Emotionele steun |

Deze tags worden gebruikt voor:
- Artikelen taggen (ArtikelTag)
- Synoniemen voor zoeken
- Content hiaten-analyse

---

## 5. Data-opslag

### 5.1 Wijzigingen aan Caregiver model

```prisma
model Caregiver {
  // BESTAAND (ongewijzigd)
  careRecipient          String?   // relatie: partner, ouder, kind, etc.
  careHoursPerWeek       Int?      // uren per week
  careSince              DateTime? // sinds wanneer
  aandoening             String?   // BEWAREN voor backward-compat (primaire aandoening)
  dateOfBirth            DateTime?
  municipality           String?
  city                   String?
  // ... alle bestaande velden

  // NIEUW
  woonsituatie           String?   // "samen" | "dichtbij" | "op-afstand"
  werkstatus             String?   // "fulltime" | "parttime" | "niet-werkend" | "student" | "gepensioneerd"
}
```

### 5.2 Tag-opslag via GebruikerVoorkeur (bestaand model)

Alle tags (aandoening + situatie + interesse-categorieën) worden opgeslagen via het bestaande `GebruikerVoorkeur` model:

```
GebruikerVoorkeur { type: TAG, slug: "dementie" }       // aandoening
GebruikerVoorkeur { type: TAG, slug: "diabetes" }        // 2e aandoening
GebruikerVoorkeur { type: TAG, slug: "werkend" }         // situatie (auto)
GebruikerVoorkeur { type: TAG, slug: "op-afstand" }      // situatie (auto)
GebruikerVoorkeur { type: TAG, slug: "met-kinderen" }    // situatie (handmatig)
GebruikerVoorkeur { type: CATEGORIE, slug: "zelfzorg" }  // interesse
GebruikerVoorkeur { type: CATEGORIE, slug: "financien" } // interesse
```

### 5.3 TagType enum uitbreiden

```prisma
enum TagType {
  AANDOENING    // bestaand
  SITUATIE      // bestaand
  ONDERWERP     // NIEUW — voor artikel-tagging
}
```

### 5.4 Synoniemen op ContentTag

```prisma
model ContentTag {
  // bestaande velden...
  synoniemen     String[]   // NIEUW: ["PGB", "persoonsgebonden budget"]
}
```

---

## 6. `bepaalProfielTags()` — de kernfunctie

Deze functie berekent welke tags automatisch van toepassing zijn op basis van profieldata:

```typescript
function bepaalProfielTags(caregiver: Caregiver): string[] {
  const tags: string[] = []

  // Werkstatus
  if (caregiver.werkstatus === "fulltime") tags.push("werkend")
  if (caregiver.werkstatus === "parttime") tags.push("werkend-parttime", "werkend")
  if (caregiver.werkstatus === "student") tags.push("student")
  if (caregiver.werkstatus === "gepensioneerd") tags.push("gepensioneerd")

  // Woonsituatie
  if (caregiver.woonsituatie === "samen") tags.push("samenwonend")
  if (caregiver.woonsituatie === "dichtbij") tags.push("dichtbij")
  if (caregiver.woonsituatie === "op-afstand") tags.push("op-afstand")

  // Relatie
  if (caregiver.careRecipient === "partner") tags.push("partner-zorg")
  if (caregiver.careRecipient === "ouder") tags.push("ouder-zorg")
  if (caregiver.careRecipient === "kind") tags.push("kind-zorg")

  // Zorgintensiteit
  if (caregiver.careHoursPerWeek && caregiver.careHoursPerWeek >= 20)
    tags.push("intensief")

  // Zorgduur
  if (caregiver.careSince) {
    const jarenBezig = yearsAgo(caregiver.careSince)
    if (jarenBezig < 1) tags.push("beginnend")
    if (jarenBezig > 5) tags.push("langdurig")
  }

  // Leeftijd
  if (caregiver.dateOfBirth) {
    const leeftijd = ageInYears(caregiver.dateOfBirth)
    if (leeftijd < 25) tags.push("jong")
  }

  return tags
}
```

Deze functie draait bij:
1. Opslaan van het profiel
2. Na wijziging van relevante velden
3. Bij het berekenen van aanbevelingen (runtime)

---

## 7. Artikelen taggen

### 7.1 Bestaande 42 artikelen taggen

Alle bestaande artikelen moeten getagd worden met AANDOENING-, SITUATIE- en ONDERWERP-tags. Dit gebeurt via de AI content agent:

1. Agent leest elk artikel (titel + beschrijving + inhoud)
2. Stelt relevante tags voor uit alle beschikbare tags
3. Beheerder reviewt en bevestigt per artikel

### 7.2 ArtikelTag koppelingen aanmaken

Momenteel is de ArtikelTag tabel leeg. Na het taggen van artikelen worden de koppelingen aangemaakt. Dit is de **absolute basis** voor het aanbevelingssysteem.

### 7.3 Nieuwe artikelen automatisch taggen

Bij het genereren van nieuwe artikelen via de content agent worden tags automatisch meegeleverd in de output en opgeslagen als ArtikelTag records.

---

## 8. Bouwvolgorde — Iteraties

### Iteratie A: Profiel & Tags Fundament (~20 uur)

> Resultaat: profiel-scherm werkt, tags worden opgeslagen, bestaande artikelen zijn getagd.

```
A.1  Caregiver model uitbreiden                    2 uur
     (woonsituatie, werkstatus velden)

A.2  ContentTag seed bijwerken                     1 uur
     (nieuwe situatie-tags + synoniemen,
      ONDERWERP tags toevoegen)

A.3  Profiel-scherm bouwen (één pagina)            6 uur
     Secties: Over jou, Naaste, Woonsituatie,
     Werk, Aandoening (multi), Situatie, Interesses

A.4  bepaalProfielTags() functie                   2 uur
     Automatische tag-afleiding + voorkeuren opslaan

A.5  Voorkeuren-API updaten                        2 uur
     Multi-aandoening support, woonsituatie/werkstatus
     opslaan, automatische tags mergen met handmatige

A.6  Onboarding aanpassen                          3 uur
     Welkom → profiel-scherm → belastbaarheidstest
     "Later invullen" optie met herinnering

A.7  Bestaande artikelen taggen (AI bulk)          3 uur
     42 artikelen → ArtikelTag koppelingen aanmaken

A.8  Profiel-completeness indicator                1 uur
     Voortgangsbalk op profiel-pagina
```

### Iteratie B: Aanbevelingen (~14 uur)

> Resultaat: artikelen worden aanbevolen op basis van profiel-tags.

```
B.1  Relevantie-score berekening                   4 uur
     SQL query: tag-overlap score per gebruiker

B.2  "Aanbevolen voor jou" dashboard               3 uur
     Top 3-5 artikelen op basis van relevantie

B.3  Leren-pagina sorteren op relevantie           2 uur

B.4  Weekkaarten LEREN verbeteren                  2 uur

B.5  "Meer hierover" suggesties                    2 uur

B.6  Ger AI-integratie (tags in context)           1 uur
```

### Iteratie C: Gerichte Artikelgeneratie (~14 uur)

> Resultaat: beheerder kan doelgroep-specifieke artikelen laten genereren.

```
C.1  Doelgroep-specifiek genereren                 3 uur

C.2  Slimme generatie-voorstellen (data)           4 uur

C.3  Generatie-matrix UI                           3 uur

C.4  Content agent "genereer-voor-doelgroep"       2 uur

C.5  Batch-generatie + aantal kiezen               2 uur
```

### Iteratie D: Kwaliteitsbeheer & Rest (~30 uur)

> Resultaat: artikel compleetheid, scoren, hiaten, bronvermelding.

```
D.1  Artikel compleetheids-dashboard              8 uur
D.2  Scoren & Feedback (ContentScore)             6 uur
D.3  Content Hiaten & Prioriteitsmatrix           4 uur
D.4  Hulpbronnen Tastbaar Maken                  12 uur
```

### Iteratie E: Bronvermelding (~10 uur)

> Kan parallel met elke andere iteratie.

```
E.1  ArtikelBron model + migratie                 2 uur
E.2  Bronsectie in artikel-weergave               3 uur
E.3  Content agent bronnen vastleggen             3 uur
E.4  Beheerportaal bronnen-sectie                 2 uur
```

### Afhankelijkheden

```
Iteratie A (Profiel & Tags) ──→ Iteratie B (Aanbevelingen)
                             │                │
                             │                └──→ Iteratie C (Generatie)
                             │                │
                             │                └──→ Iteratie D (Kwaliteit)
                             │
Iteratie E (Bronvermelding) ───── (onafhankelijk, kan parallel)
```

**Iteratie A** is het absolute fundament. Zonder profiel-tags en getagde artikelen werkt niets.

---

## 9. Acceptatiecriteria

### Iteratie A: Profiel & Tags
- [ ] Profiel is één scrollbaar scherm (geen stappen)
- [ ] Woonsituatie: 3 opties (samen/dichtbij/op afstand)
- [ ] Werkstatus: 5 opties (fulltime/parttime/niet/student/gepensioneerd)
- [ ] Aandoening is multi-select (meerdere aandoeningen kiezen)
- [ ] Situatie-tags worden automatisch afgeleid uit profieldata
- [ ] Automatische tags zijn voorgeselecteerd maar aanpasbaar
- [ ] "Later invullen" optie werkt in onboarding
- [ ] Herinnering verschijnt op dashboard (max 3×)
- [ ] Alle 42 bestaande artikelen zijn getagd via ArtikelTag
- [ ] Profiel-completeness indicator toont voortgang

### Iteratie B: Aanbevelingen
- [ ] Dashboard toont "Aanbevolen voor jou" met 3-5 artikelen
- [ ] Artikelen zijn gesorteerd op tag-overlap met profiel
- [ ] Werkende mantelzorger ziet andere artikelen dan gepensioneerde
- [ ] Leren-pagina sorteerbaar op relevantie
- [ ] Weekkaarten LEREN gebruiken relevantie-score
- [ ] Ger vermeldt match-reden bij artikel-suggesties

### Iteratie C: Gerichte Generatie
- [ ] Beheerder kan aantal te genereren artikelen opgeven
- [ ] Agent analyseert data en doet voorstel
- [ ] Gegenereerde artikelen krijgen automatisch juiste tags
- [ ] Generatie-matrix toont welke combinaties gedekt zijn

### Iteratie D: Kwaliteitsbeheer
- [ ] Artikel compleetheids-percentage zichtbaar
- [ ] Batch-acties via agents (tags, B1-check, bronnen)
- [ ] "Was dit nuttig?" feedback op artikelen
- [ ] Leesgeschiedenis wordt bijgehouden

### Iteratie E: Bronvermelding
- [ ] Artikelen tonen bronsectie
- [ ] AI-gegenereerde artikelen gemarkeerd
- [ ] Bronnen automatisch opgeslagen bij generatie

---

## 10. Relatie tot bestaand plan

Dit plan **vervangt Stap 0 en Stap 1** van het Content & Zoek Fundament plan (v1.2). Het is specifieker over het profiel en de onboarding, en geeft concreet aan hoe de profieldata wordt vertaald naar tags.

De overige stappen uit het Content-plan (aanbevelingen, generatie, kwaliteit, hiaten, bronvermelding) zijn als Iteraties B-E opgenomen.

---

*Dit plan is opgesteld op 14 maart 2026 en wacht op goedkeuring voordat de bouw begint.*
