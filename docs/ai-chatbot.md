# AI-Chatbot Ger — Technisch & Functioneel Overzicht

Dit document beschrijft hoe de AI-chatbot **Ger** in MantelBuddy werkt: welk model, hoe hij wordt aangestuurd ("getraind" via prompt en context), welke koppelingen hij heeft naar de database en externe systemen, welke hulpmiddelen (tools) hij tot zijn beschikking heeft en welke gedragsregels hem warm én kort houden.

> Laatste update: na implementatie van Ronde 1 + Ronde 2 UX-verbeteringen (kortere antwoorden, beide doelgroepen, cumulatieve kaartverzameling, proactieve opener, tool-status, variatie-regels).

---

## 0. De twee soorten hulp & de zoek-strategie per gemeente (kernkompas)

**Mantelzorg-hulp bestaat uit precies twee soorten** — geen derde. Dit onderscheid is de spil van Ger's gedrag, de zoek-tool en de pre-fetched context.

### A. Hulp voor de mantelzorger zelf
Voor de mantelzorger als persoon: ondersteuning, contact met lotgenoten, vervangende zorg, advies, educatie, emotionele steun. **Praten met iemand** valt hier ook onder — het is geen aparte "derde kant".

Concrete categorieën (`HULP_VOOR_MANTELZORGER` in `src/config/options.ts`):

| dbValue | Beschrijving |
|---|---|
| `Informatie en advies` | Mantelzorgmakelaar, mantelzorgsteunpunt, brochures |
| `Educatie` | Cursussen, trainingen voor mantelzorgers |
| `Emotionele steun` | Lotgenotengroepen, praatgroepen, psycholoog, coach |
| `Persoonlijke begeleiding` | Coaching, individuele begeleiding |
| `Praktische hulp` | Hulp in huis, dagelijkse ondersteuning |
| `Vervangende mantelzorg` | Respijtzorg, logeerhuis |

### B. Hulp bij een taak voor de zorgvrager
Voor taken die de mantelzorger normaal voor zijn naaste doet, maar waar iemand anders kan inspringen.

Concrete categorieën (`ZORGTAKEN` in `src/config/options.ts`):

`Boodschappen` · `Huishoudelijke taken` · `Persoonlijke verzorging` · `Vervoer` · `Bereiden en/of nuttigen van maaltijden` · `Klusjes in en om het huis` · `Administratie en aanvragen` · `Plannen en organiseren` · `Sociaal contact en activiteiten` · `Huisdieren`

### Zoek-strategie per gemeente

Een mantelzorger heeft (mogelijk) twee gemeenten in zijn profiel: zijn eigen gemeente en die van de zorgvrager. De zoek-scope per soort hulp:

| Wat wordt gezocht | In welke gemeente | Waarom |
|---|---|---|
| **Lotgenoten / praatgroepen / fysieke ontmoeting** | Alleen mantelzorger-gemeente | Vereist fysieke aanwezigheid in de eigen stad |
| **Mantelzorgmakelaar / respijtzorg / advies / educatie / emotionele steun** | Beide gemeenten (mantelzorger + zorgvrager) | Stad van de naaste weet vaak wat er regionaal mogelijk is rond de zorg; eigen stad is dichtbij voor afspraken |
| **Hulp bij een TAAK voor de naaste** (boodschappen, verzorging, etc.) | Alleen zorgvrager-gemeente | Een boodschappendienst in de eigen stad helpt niet als de naaste 50 km verderop woont |

Detectie van "lotgenoten / fysieke ontmoeting" gebeurt op twee manieren, in volgorde van prioriteit:

1. **Expliciet DB-veld** `Zorgorganisatie.lokaalGebonden` (Boolean nullable). Wanneer admin dit aanvinkt voor een organisatie, overrult die waarde de heuristiek.
2. **Heuristiek op trefwoorden** in de organisatienaam/dienst: `lotgenoten`, `praatgroep`, `praatcafé`, `ontmoetingsgroep`, `huiskamer`, `alzheimer café`, `mantelzorgsalon`, `inloopochtend`, `wandelgroep`.

Implementatie: `src/lib/ai/hulp-categorisatie.ts` — functies `bepaalKant`, `bepaalGemeenteScope`, `gemeentenVoorScope`.

### Hoe dit door het systeem heen wordt geborgd

Op vier plekken tegelijk hardgemaakt — geen single point of failure:

1. **Centrale classificatie** (`hulp-categorisatie.ts`): één bron van waarheid voor `Kant` en `GemeenteScope`.
2. **Tool `zoekHulpbronnen`** verplicht een `kant` parameter ('mantelzorger' of 'zorgvrager-taak'); de tool past automatisch de juiste gemeente-scope toe per organisatie.
3. **Pre-fetched context** rendert twee scherp gelabelde blokken (`=== HULP VOOR JOU (mantelzorger) ===` en `=== HULP BIJ TAKEN VOOR JE NAASTE (in [stad]) ===`) met sub-secties per scope ("alleen in [jouw stad]" / "in beide steden" / "landelijk").
4. **System-prompt** definieert de tweesplitsing expliciet, verbiedt valse alternatieven ("praktisch versus praten" — fout, want praten valt onder kant A) en koppelt elke kant aan het juiste pre-fetched blok.
5. **Opener-tegels**: twee tegels die fysiek de twee kanten weerspiegelen (geen losse "even praten"-tegel).

---

## 1. Wat is Ger?

Ger is de digitale mantelzorgcoach in de app. Hij is geen hulpverlener, maar een warm, vriendelijk gespreksaanknooppunt dat:

- meedenkt met mantelzorgers in B1-taalniveau (eenvoudig Nederlands),
- relevante lokale hulpbronnen voorstelt voor zowel de **zorgvrager** (de naaste die zorg krijgt) als voor de **mantelzorger** zelf,
- artikelen en tips toont die de gebruiker kan aanklikken, lezen, opslaan als favoriet en mailen,
- waarschuwt bij signalen van crisis en doorverwijst naar 113 / Mantelzorglijn,
- actiepunten kan vastleggen voor opvolging in een volgend gesprek,
- onder de chat een groeiende verzameling hulpbronnen en artikelen opbouwt waarin de gebruiker zelf kan terugbladeren.

Ger is **niet getraind** in de klassieke zin (geen fine-tuning). Zijn gedrag wordt volledig gestuurd door:

1. De keuze van het taalmodel (Anthropic Claude Haiku 4.5),
2. Een uitgebreid **systeem-prompt** dat zijn persona, stijl en gedragsregels beschrijft,
3. **Pre-fetched gebruikerscontext** (balanstest, hulpbronnen, gemeente, voorkeuren),
4. Een **proactieve opener** die op basis van de balanstest server-side wordt opgebouwd,
5. **Tools** die hij tijdens een gesprek kan aanroepen voor extra zoekopdrachten,
6. Een **crisis-detector** die voor de AI-call al ingrijpt bij gevaarlijke situaties.

---

## 2. Model & provider

| Aspect | Waarde |
|---|---|
| Provider | **Anthropic** (via Vercel AI SDK) |
| Model voor Ger (chat, welkom, balanscoach, check-in) | `claude-haiku-4-5-20251001` |
| Model voor admin-agents (curator, analytics, content-agent) | `claude-sonnet-4-20250514` |
| Gereserveerd voor toekomst (crisis-deep-detect) | `claude-opus-4-20250514` |
| SDK-pakketten | `@ai-sdk/anthropic`, `ai`, `@ai-sdk/react` |
| Embeddings (semantisch zoeken) | OpenAI `text-embedding-3-small` (1536-dim) |
| **Output-budget per turn** | `maxOutputTokens: 600` (kort gehouden — zie sectie 5) |
| **Tool-stappen per turn** | `stopWhen: stepCountIs(7)` |

Model-keuze per agent staat centraal in `src/lib/ai/models.ts` in het `AGENT_MODELS`-object. Wijzig daar als een agent een ander model moet krijgen.

**Waarom Haiku voor user-facing chat?** Kostenoptimalisatie. Haiku 4.5 is ongeveer 4× goedkoper dan Sonnet en 18× goedkoper dan Opus, terwijl het voor coachende dialoog ruim voldoende is. Sonnet wordt alleen ingezet voor admin-werk (content-curatie, analyse) waar diepere redenering nodig is.

---

## 3. Architectuuroverzicht (high-level)

```
┌──────────────────┐                                  ┌──────────────────────┐
│                  │  GET /api/ai/opener              │                      │
│  AiChat.tsx      │  ───────────────────────────────►│  /api/ai/opener      │
│  (browser)       │  ◄──── opener + 3 vraagknoppen   │  (geen AI-call)      │
│                  │                                  └──────────────────────┘
│  - useChat hook  │
│  - kaarten       │  POST /api/ai/chat               ┌──────────────────────┐
│    parser        │  ───────────────────────────────►│                      │
│  - cumulatieve   │  body: messages,                 │  /api/ai/chat        │
│    verzameling   │        shownHulpbronnen,         │  (Next.js route)     │
│  - tool-status   │        shownArtikelen            │                      │
│  - localStorage  │  ◄──── SSE stream (tekst+tools)  │  1. Auth check       │
└──────────────────┘                                  │  2. Crisis-detector  │
                                                      │  3. Prefetch context │
                                                      │     (met variatie)   │
                                                      │  4. streamText()     │
                                                      │     ├ Claude Haiku   │
                                                      │     ├ system-prompt  │
                                                      │     └ tools          │
                                                      └──────────┬───────────┘
                                                                 │
                                                      ┌──────────┴───────────┐
                                                      │                      │
                                                      ▼                      ▼
                                            ┌──────────────────┐   ┌─────────────────┐
                                            │  Prisma / Postgres│   │  OpenAI         │
                                            │  - Caregiver      │   │  embeddings API │
                                            │  - BelastbaarheidT│   │  (semantic)     │
                                            │  - Zorgorganisatie│   └─────────────────┘
                                            │  - Artikel        │
                                            │  - Actiepunten    │
                                            │  - WeekKaart      │
                                            │  + pgvector       │
                                            └───────────────────┘
```

### Belangrijke ontwerpkeuzes

- **Streaming**: antwoorden worden token-voor-token gestreamd via `streamText` → `toUIMessageStreamResponse`. De gebruiker ziet Ger "typen".
- **Tool-status zichtbaar**: tijdens een tool-call toont de loading-bubble nu een mensvriendelijk label ("Ger zoekt lokale hulp...", "Ger zoekt artikelen...") in plaats van het generieke "Ger typt...". Dit komt uit `message.parts` met type `tool-<naam>`.
- **Pre-fetch boven tools**: gebruikersdata (test, hulpbronnen, gemeente) wordt vóór de AI-call al uit de DB gehaald en in de system-prompt geïnjecteerd. Dat scheelt 1-2 tool-call rondes en daarmee 10-15 seconden latency.
- **Variatie tussen beurten**: zowel pre-fetch als tools houden rekening met wat de gebruiker eerder heeft gezien (zacht deprioriteren, niet uitsluiten) zodat elke beurt iets nieuws kan tonen.
- **Geen persistente chatgeschiedenis**: berichten staan in browser-localStorage (via Vercel AI SDK), niet in de database. Per device / per logout begint een nieuw gesprek.
- **Cumulatieve kaartverzameling**: hulp- en artikelkaarten verdwijnen niet als Ger nieuwe noemt — ze stapelen onder de chat (max 6 hulp + 6 artikelen, gededupliceerd) zodat de gebruiker tijdens het gesprek een verzameling opbouwt om later op te slaan.

---

## 4. API-routes (welke chats er zijn)

Alle routes leven onder `src/app/api/ai/`.

| Route | Agent-key | Doel | Auth | Rate-limit |
|---|---|---|---|---|
| `/api/ai/opener` | — | **Gepersonaliseerde welkomstzin + 3 startknoppen** (geen AI-call, server-side opgebouwd uit balanstest) | Vereist | nee |
| `/api/ai/chat` | `ger-chat` | Hoofd-chatpagina (`/ai-assistent`) — ingelogde gebruiker | Vereist | nee |
| `/api/ai/welkom` | `ger-welkom` | Publieke chat op homepage / hero | Anoniem | 20 / 10min per IP (Upstash) |
| `/api/ai/balanscoach` | `ger-balanscoach` | Coach-pagina met test-context | Vereist | nee |
| `/api/ai/checkin` | `ger-checkin` | Maandelijkse check-in coaching | Vereist | nee |
| `/api/ai/embeddings` | — | Genereer + sla artikel-embeddings op | Admin | nee |
| `/api/ai/admin/tag-suggestie` | `admin-bulk-tag` | Auto-tagging van artikelen | Admin | nee |
| `/api/ai/admin/moderate` | `admin-moderate` | Content-moderatie | Admin | nee |
| `/api/ai/admin/curator` | `admin-curator` | Inhoud-curatie + ranking (Sonnet) | Admin | nee |
| `/api/ai/admin/analytics` | `admin-analytics` | Analyse & inzichten (Sonnet) | Admin | nee |
| `/api/ai/admin/content-agent` | `admin-content-agent` | Genereren van nieuwe artikelen (Sonnet) | Admin | nee |

`maxDuration` voor de chat-route staat op 30 seconden — voldoende voor tool-calls + DB-queries binnen Vercel serverless.

### De opener-route — twee duidelijke richtingen

`/api/ai/opener` is bewust **geen** AI-call: de welkomstzin moet binnen 200 ms beschikbaar zijn voor first paint van de chat. De route leest de laatste balanstest + de naam van de zorgvrager (`careRecipientName`) en bouwt:

1. Een **korte begroeting** (één zin, niveau-afhankelijk):
   - HOOG: "Fijn dat je er bent. Ik zie dat je flink wat doet voor [naaste] — waar kan ik je vandaag mee helpen?"
   - GEMIDDELD: "Goed dat je er bent. Waar kan ik je vandaag mee helpen?"
   - LAAG: "Goed dat je er bent. Het gaat eigenlijk best goed met je balans — knap! Waar kan ik je vandaag mee helpen?"
   - Geen test: "Hoi! Ik ben Ger. Fijn dat je er bent. Waar kan ik je vandaag mee helpen?"

2. **Twee vaste keuze-tegels** die de fundamentele tweesplitsing fysiek weerspiegelen:

| Emoji | Titel | Omschrijving | Wat wordt naar Ger gestuurd |
|---|---|---|---|
| 🧑 | Hulp voor mij zelf | Mantelzorgmakelaar, lotgenoten, vervangende zorg, praten over hoe het gaat | "Ik wil hulp voor mij zelf als mantelzorger" |
| 🤝 | Hulp bij een taak voor [naaste-naam] | Boodschappen, verzorging, vervoer, huishouden — taken die jij doet | "Ik zoek hulp bij [zwaarste-taak] voor [naaste]" (of generiek) |

"Even praten over hoe het gaat" valt **onder tegel 1** (kant A) — het is geen losse derde optie. Onder de twee tegels staat een sub-link *"Liever je eigen vraag stellen? Type hieronder."* voor wie direct iets wil typen.

De middelste tegel personaliseert: als de zorgvrager-naam bekend is, staat hij in de titel; als de zwaarste taak bekend is, gaat de actie-tekst direct naar die taak. Zo voelt het meteen alsof Ger de situatie kent.

Frontend (`AiChat.tsx`) haalt deze JSON op bij mount, rendert de tegels als grote klikbare cards onder de welkomstzin en valt terug op generieke tekst bij fout.

---

## 5. Het systeem-prompt (de "training" van Ger)

Het hart van Ger zit in `src/lib/ai/prompts/assistent.ts`. Dit prompt is opgebouwd uit duidelijk gemarkeerde secties die zijn gedrag definiëren:

| Sectie | Wat erin staat |
|---|---|
| **Grondhouding** | Niet belerend, niet medelijdend; uitgaan van kracht; warm en respectvol |
| **Gespreksstijl** | Warme buurvrouw-toon; sinds Ronde 12: **max 3-4 zinnen** lopende tekst (90 woorden eerste bericht, 70 daarna); geen inleidingen, samenvattingen, afsluitingen of tool-narratie; korte bullets met "- " toegestaan voor concrete tips (max 4, max 10 woorden); genummerde lijsten verboden |
| **Taalstijl (B1, niet onderhandelbaar)** | Max 15 woorden per zin (liever 8); één gedachte per zin; actief schrijven; concrete woorden. **Verboden-woordenlijst** met alternatieven (ondersteuningsbehoefte → hulp, indiceren → kijken wat je nodig hebt, faciliteren → regelen, etc.). Vóór versturen: check of een woord van >3 lettergrepen begrijpelijk is voor laaggeletterde lezer. |
| **Empathisch én oplossingsgericht** | Drie valkuilen die verboden zijn: zielig maken, belerend zijn, alleen meeleven zonder oplossing. **Formule per bericht**: 1 zin verbinding + 1 concreet aanbod + 1 open vraag. Oplossingsgericht ≠ sturend — bied opties, geen verplichtingen. Geen "je moet" / "je zou eigenlijk" / "het is belangrijk dat". |
| **Drie-richting-kompas (kernkompas, Ronde 10)** | Drie vaste paden zichtbaar onder elke chat-beurt: A) hulp voor de mantelzorger zelf, B) hulp bij een taak voor de zorgvrager, C) informatie / artikel zoeken. "Praten" valt onder A. De drie blijven ook midden in een sub-onderwerp aangeboden via 3 vraagknoppen. Bij vage start: actief de A/B/C-keuze aanbieden, geen kaarten. Als gebruiker al koos: blijf in die kant maar bied volgende beurt weer A/B/C aan. |
| **Waar zoekt Ger wat (gemeente-scope)** | Lotgenoten/praatgroepen → alleen mantelzorger-stad. Mantelzorgmakelaar/respijt/advies/educatie/emotioneel → beide steden. Hulp bij taken → alleen zorgvrager-stad. AI hoeft niets te kiezen — `zoekHulpbronnen.kant` parameter regelt het automatisch. |
| **Tempo — snel concreet** | Bericht 1 mag warm beginnen (1 zin), bericht 2+ direct concreet zonder warm opstartzinnetje. **Elk bericht een aanbod** (kaart, knop of tweesplitsing). Info-vragen → direct artikelkaart. Hulp-vragen → direct hulpkaart |
| **Gespreksvoering** | 4-stappen flow: Verbinding → Verdieping → Concreet aanbod (1-2 kaarten) → Open uitnodiging |
| **Variatie in openers** | 5 soorten verbinding mogelijk; verboden clichés ("Wat een goede vraag", "Ik begrijp dat...", "Wat moedig dat je dit deelt"); "Dat herken ik" max 1× per gesprek |
| **Gesprekscontinuïteit** | Bij korte/vage antwoorden ("ja", "weet niet"): pak iets uit de context (zware taak, open actiepunt) en vraag concreet door |
| **Omgaan met context** | Pre-fetched data is al beschikbaar; nooit samenvatten, alleen onzichtbaar verweven |
| **Gedrag per belastingniveau** | HOOG: proactief, mantelzorglijn / GEMIDDELD: één concrete actie / LAAG: complimenteren |
| **Volg de gemaakte keuze** | Als gebruiker kant A of B koos: kopieer alléén kaarten uit dat blok in de pre-fetch. Geen kruislings combineren. |
| **Hulp + artikel combineren** | Combineren is de standaard waar het past (hulp om te bellen + artikel om te lezen). Volgorde: hulpkaart eerst, dan artikelkaart. Max 2+2 met totaal 3 per bericht. Alleen-hulp of alleen-artikelen mag bij puur praktische resp. puur informatieve vragen. |
| **Zorgtaken** | Eén taak per bericht, beginnen met de zwaarste; "eerste stap" benoemen voor nieuwe gebruikers |
| **Actiepunten** | Concreet advies opslaan via tool, in volgend gesprek opvolgen |
| **Crisisdetectie** | Empathie eerst, dan praktisch; bij acute nood doorverwijzen naar 113 / huisarts / Veilig Thuis |
| **Output-syntax** | Hulpkaart, artikelkaart, navigatie-knop, vraag-knop — exacte syntax + max-aantallen per bericht |
| **Tool-instructies** | Tools alléén als pre-fetched context niet voldoende is |
| **Niet doen** | Verzin geen telefoonnummers; geen medisch advies; geen herhaling van eerder getoonde kaarten; nooit langer dan 3 zinnen |
| **App-pagina's** | Lijst van interne paden voor `{{knop:...}}` actieknoppen |

Het prompt is gesplitst in twee delen voor Anthropic prompt caching:

1. **`buildStableSystem(gemeenteMantelzorger, gemeenteNaaste)`** — basisprompt + de gemeenten van mantelzorger en zorgvrager. Verandert zelden binnen een gesprek, wordt door Anthropic ~5 min gecached.
2. **`buildContextBlock(userContext)`** — het pre-fetched user-context-blok (balanstest, hulpbronnen, actiepunten). Verandert per beurt door variatie en `shownHulpbronnen`, hangt achter de cache-grens.

De backwards-compatible `buildAssistentPrompt()` retourneert beide aan elkaar geplakt voor routes die nog geen caching gebruiken.

### Lengte-regels (cruciaal voor coachende ervaring)

Vroeger neigden antwoorden naar 6-10 zinnen met inleiding én samenvatting. Sinds Ronde 12:

- `maxOutputTokens: 600` — hard plafond op het model.
- **Eerste bericht max 90 woorden, vervolgberichten max 70 woorden** (was 120/100).
- 3-4 zinnen lopende tekst, eventueel aangevuld met 2-4 korte bullets (max 10 woorden per bullet) als die concreter zijn dan een vloeiende zin.
- Geen "Wat een goede vraag", geen "Hopelijk helpt dit", geen "Dus om het kort te zeggen".
- Geen tool-narratie ("laat me zoeken", "even kijken in de database", "ik denk dat") — direct met het antwoord beginnen.
- Korte zin = klein cadeautje. Lange zin = lezing.

### Output-syntax die Ger leert genereren

In zijn antwoord kan Ger speciale tokens plaatsen die de frontend dan rendert als interactieve UI-elementen:

| Token | Voorbeeld | Wat de frontend doet |
|---|---|---|
| `{{hulpkaart:Naam\|Dienst\|Beschrijving\|Tel\|Web\|Gemeente\|Kosten\|Tijden}}` | Lokale zorgorganisatie | Klikbare amberkleurige kaart → opent ContentModal met bel/website-knoppen + favoriet-knop |
| `{{artikelkaart:Titel\|Beschrijving\|Emoji\|Categorie\|Inhoud}}` | Tip- of info-artikel | Klikbare groene kaart → opent ContentModal met volledige tekst + favoriet-knop + mail-knop |
| `{{knop:Label:/pad}}` | Navigatie-knop | Knop die naar een interne pagina linkt |
| `{{vraag:Vraagtekst}}` | Vervolgvraag | Knop onder input die direct die vraag verstuurt |

**Per bericht**: maximaal 3 kaarten in totaal — combinatie toegestaan en zelfs gewenst (hulp om te bellen + artikel om te lezen). Specifiek: max 2 hulpkaarten + max 2 artikelkaarten, samen niet meer dan 3. Volgorde: eerst hulpkaarten (actie), dan artikelkaarten (lezen). Plus **3 vraagknoppen onderaan (A/B/C-kompas)** — sinds Ronde 10 niet meer 2. Parsing gebeurt in `src/components/ai/HulpKaart.tsx`, `ArtikelKaart.tsx` en de chat-componenten (`FloatingGerChat`, `DashboardGerChat`, `AiChat`, `AgentChat`, `PublicGerChat`, `GerHeroChat`).

---

## 6. Pre-fetched gebruikerscontext

Voor élk chatverzoek wordt eerst `prefetchUserContext()` (`src/lib/ai/prefetch-context.ts`) aangeroepen. Die haalt in één keer alles op wat Ger nodig kan hebben en zet het als een tekstblok onderaan het systeem-prompt. Resultaat: Ger hoeft géén tools meer aan te roepen voor standaardvragen → snel én goedkoper (minder tokens).

### Wat er wordt opgehaald

| Bron (Prisma-model) | Inhoud |
|---|---|
| `Caregiver` | Aandoening, voorkeuren (tags & categorieën), al gekoppelde organisaties, gemeenten |
| `BelastbaarheidTest` | Laatste test: totaalscore, niveau, zorguren, deelgebieden, alarmen |
| `TaakSelectie` | Geselecteerde zorgtaken + uren + moeilijkheid |
| `Zorgorganisatie` (mantelzorger-zijde) | Hulp voor de mantelzorger — uit BEIDE gemeenten, met scope-label per organisatie (lokaal-only / beide / landelijk) |
| `Zorgorganisatie` (zorgvrager-zijde) | Hulp bij taken voor de naaste — alleen uit gemeente zorgvrager, gegroepeerd per zorgtaak |
| `Actiepunt` | Openstaande actiepunten uit eerdere gesprekken |
| `WeekKaart` | Kaarten van deze week (voltooid + open) |
| `Gemeente`-resolver | Gemeente-specifiek mantelzorgloket (als geconfigureerd) |
| Coach-adviezen | Adviesteksten per deelgebied/niveau (uit static config) |

### Twee gescheiden hulp-blokken in de system-prompt

De pre-fetched context produceert twee scherp gelabelde blokken zodat Ger fysiek niet kruislings kan categoriseren:

```
=== HULP VOOR JOU (mantelzorger) ===
  Lotgenoten / praatgroepen / fysieke ontmoeting (alleen in [stad mantelzorger] — jouw stad):
    {{hulpkaart:...}}
  Mantelzorgmakelaar / respijtzorg / advies / educatie / emotionele steun (in [stad mantelzorger] én [stad zorgvrager]):
    {{hulpkaart:...}}
  Landelijke organisaties:
    {{hulpkaart:...}}

=== HULP BIJ TAKEN VOOR JE NAASTE (in [stad zorgvrager]) ===
  Boodschappen:
    {{hulpkaart:...}}
  Persoonlijke verzorging:
    {{hulpkaart:...}}
  ...
```

De scope-bepaling per organisatie gebeurt in `src/lib/ai/hulp-categorisatie.ts` (functies `bepaalKant`, `bepaalGemeenteScope`, `gemeentenVoorScope`). Lotgenoten in de stad van de zorgvrager worden er actief uit gefilterd — ze hebben geen praktische waarde voor de mantelzorger.

### Twee-gemeentes-systeem (zoek-strategie)

Een mantelzorger heeft (mogelijk) twee gemeenten in zijn profiel: zijn eigen woonplaats en die van de zorgvrager. De zoek-scope is verschillend per soort hulp — zie sectie 0 voor de complete tabel. Kort samengevat:

| Soort hulp | Gemeente |
|---|---|
| Lotgenoten / praatgroepen / fysieke ontmoeting | Alleen mantelzorger-stad |
| Mantelzorgmakelaar / respijtzorg / advies / educatie / emotioneel | Beide steden |
| Hulp bij een TAAK voor de naaste (boodschappen, verzorging, vervoer) | Alleen zorgvrager-stad |

### Variatie tussen chat-beurten

De pre-fetch-functie krijgt een `options.shownHulpbronnen` mee — een lijst met namen van hulpkaarten die Ger in eerdere beurten al heeft getoond. Items in die lijst worden **zacht gedeprioriteerd**: ze gaan achteraan in de gesorteerde resultaten, maar verdwijnen niet (bij gemeenten met weinig hulpbronnen blijven ze beschikbaar). Binnen elke subgroep wordt geshuffeld via `prioritizeUnshown` (`src/lib/ai/variation.ts`).

---

## 6b. Geheugen — hoe Ger continuïteit bewaart

Ger heeft **drie soorten geheugen**, elk met een eigen rol en levensduur:

### Geheugen 1 — Profiel & balanstest (vast)

Wat je ooit hebt ingevuld op `/profiel` (gemeente, naaste-naam, zorgthema, voorkeuren) en je laatste balanstest (zware taken, uren, niveau). Blijft staan tot je het zelf wijzigt of een nieuwe test doet.

| | |
|---|---|
| Bron | `caregiver`, `belastbaarheidTest`, `taakSelectie`, `caregiverVoorkeur` |
| Lezen | `prefetchUserContext` elke chat-beurt |
| In prompt | `dynamicContext` blok via `buildContextBlock` |
| Levensduur | Permanent (tot wijziging) |

### Geheugen 2 — Actiepunten (concrete afspraken)

Als Ger en de gebruiker afspreken dat er iets gaat gebeuren, slaat Ger dat op via de `slaActiepuntOp`-tool. Het komt in `Task` met `isSuggested: true`. Bij elke volgende chat leest `fetchOpenActiepunten` de openstaande actiepunten.

| | |
|---|---|
| Bron | `Task`-model met `isSuggested: true`, `status: TODO` of `IN_PROGRESS` |
| Schrijven | Tool `slaActiepuntOp` (sinds Ronde 15 ook in `/api/ai/balanscoach`) |
| Lezen | `fetchOpenActiepunten` (max 5, nieuwste eerst) |
| In prompt | `OPENSTAANDE ACTIEPUNTEN (uit vorige gesprekken)`-blok |
| Wegvalt | Wanneer status → `DONE` of `CANCELLED` op `/agenda` |
| Voorbeeld | *"Vorige keer spraken we over [titel]. Is dat gelukt?"* |

### Geheugen 3 — Gespreks-samenvattingen (longitudinale context)

Sinds Ronde 11. Aan het eind van elk gesprek vat Haiku het samen in 3-5 zinnen + 1-5 onderwerpen. Bij een nieuw gesprek krijgt Ger de laatste 3 samenvattingen mee.

#### Schrijven — wanneer en hoe

```
Chat eindigt (handmatig sluiten of navigatie weg)
    ↓
FloatingGerChat.handleClose / DashboardGerChat unmount
    ↓
fetch /api/ai/samenvat met { messages[] }, keepalive: true
    ↓
Server: dedup-check (max 1 per 5 min per user)
    ↓
Haiku model genereert { samenvatting, onderwerpen } via generateObject + Zod schema
    ↓
Server telt actiepunten gemaakt in laatste 30 min
    ↓
prisma.gesprekSamenvatting.create({ userId, samenvatting, onderwerpen,
                                    actiepuntenAangemaakt, berichtenAantal })
```

Skip-criteria:
- Minder dan 4 echte berichten (te kort)
- Al een samenvatting in de laatste 5 minuten (dedup)
- Niet ingelogd

#### Lezen — bij volgend gesprek

```
Gebruiker stuurt bericht naar /api/ai/balanscoach
    ↓
prefetchUserContext.findMany op gesprekSamenvatting
  - userId match
  - createdAt >= 90 dagen geleden  (TTL)
  - orderBy createdAt DESC, take 3
    ↓
buildEerdereGesprekkenBlock formatteert per gesprek:
  "- [datum] [onderwerpen: ...]
     [samenvatting]"
    ↓
Geïnjecteerd onder "=== EERDERE GESPREKKEN MET DEZE MANTELZORGER ===" in de system prompt
    ↓
Prompt-sectie EERDERE GESPREKKEN — REFEREREN MET WARMTE instrueert Ger:
  - WEL: "Vorige keer hadden we het over X — hoe staat dat nu?"
  - NIET: letterlijk citeren of voorlezen
  - NIET: "ik heb in mijn database gezien dat..."
```

#### Velden van `GesprekSamenvatting`

| Veld | Wat |
|---|---|
| `samenvatting` | 3-5 zinnen, vanuit Ger's perspectief, B1-Nederlands |
| `onderwerpen` | 1-5 sleutelwoorden, bv. `["PGB", "zelfzorg", "regelwerk"]` |
| `actiepuntenAangemaakt` | Hoeveel `Task`-records met `isSuggested: true` in de laatste 30 min zijn aangemaakt |
| `berichtenAantal` | Aantal echte berichten in het gesprek (excl. lege tool-call-stappen en `[pagina:...]`-init) |
| `createdAt` | Indexeren voor TTL en dedup |

#### Privacy

- **GEEN letterlijke berichten** in de DB — alleen de samenvatting.
- **TTL 90 dagen** in het AI-geheugen — oudere blijven voor analytics maar verdwijnen uit de prompt.
- **Maximaal 3 samenvattingen** in de prompt per beurt — geen cumulatief stapelen.
- **Dedup** voorkomt drie identieke records bij re-mount of beforeunload-event.

### Hoe alle drie samenkomen — voorbeeld

| Bron | Wat Ger leest |
|---|---|
| Geheugen 1 | "Willem, gemeente Arnhem, naaste Kim in Zutphen. Zware taken: regelen 10u, administratie 3u." |
| Geheugen 2 | "OPEN ACTIEPUNT: Bel maandag het Wmo-loket Zutphen — 5 dagen geleden voorgesteld." |
| Geheugen 3 | "Vorig gesprek (5 dagen geleden, onderwerpen: PGB, regelwerk): we hadden het over PGB voor Kim. Willem zou contact opnemen met het Wmo-loket." |

Ger's openingszin: *"Hey Willem, fijn je weer te zien. Je zou contact opnemen met het Wmo-loket — is dat gelukt?"*

### DB-migratie + bestanden

| Bestand | Wat |
|---|---|
| `prisma/schema.prisma:1518` | Model `GesprekSamenvatting` |
| `prisma/gesprek-samenvatting.sql` | Supabase SQL voor dit model |
| `src/app/api/ai/samenvat/route.ts` | Schrijf-endpoint (Haiku via `generateObject`) |
| `src/lib/ai/prefetch-context.ts` | `prefetchUserContext` leest, `buildEerdereGesprekkenBlock` formatteert |
| `src/lib/ai/prompts/balanscoach.ts` | Sectie `EERDERE GESPREKKEN — REFEREREN MET WARMTE` |
| `src/components/ai/FloatingGerChat.tsx` | Trigger in `handleClose` met `keepalive: true` |
| `src/components/dashboard/DashboardGerChat.tsx` | Trigger in cleanup + `beforeunload` |

---

## 7. Tools (function calling)

Ger kan tijdens een gesprek tools aanroepen voor extra zoekopdrachten. Definities in `src/lib/ai/tools/`. Het taalmodel beslist zelf wanneer en met welke parameters.

| Tool | Doel | Status-label in UI |
|---|---|---|
| `zoekHulpbronnen` | Zoek lokale zorgorganisaties — vereist `kant` parameter ('mantelzorger' of 'zorgvrager-taak'); past automatisch juiste gemeente-scope toe | "Ger zoekt hulp voor jou als mantelzorger" / "Ger zoekt hulp bij een taak voor je naaste" |
| `zoekArtikelen` | Zoek info-artikelen via id-lookup — kaart-syntax is `{{artikelkaart:id\|titel\|emoji\|categorie}}` | "Ger zoekt artikelen die kunnen helpen" |
| `semantischZoeken` | Vector similarity search (pgvector + OpenAI embeddings) | "Ger zoekt informatie over dit onderwerp" |
| `slaActiepuntOp` | Concreet advies opslaan voor opvolging | "Ger noteert dit voor je" |

Op de hoofdchat (`/api/ai/chat`) zijn dit de **4 actieve tools**. `bekijkTestTrend`, `gemeenteInfo`, `bekijkBalanstest` en `bekijkCheckInTrend` zijn weggehaald omdat hun data al in de pre-fetched context staat — het model riep ze toch zelden, maar hun descriptions kostten elke request tokens. Ze zijn nog beschikbaar in andere routes (balanscoach, checkin) en admin-agents.

`stopWhen: stepCountIs(7)` betekent: maximaal 7 stappen (tool-calls + finale tekst) per turn — voorkomt loops.

### De `kant` parameter in `zoekHulpbronnen`

Verplicht. AI moet expliciet kiezen voordat hij zoekt:

| Waarde | Wat de tool doet |
|---|---|
| `"mantelzorger"` | Zoekt in `HULP_VOOR_MANTELZORGER`-categorieën of `doelgroep=MANTELZORGER`. Per organisatie wordt scope bepaald: lotgenoten alleen mantelzorger-stad, andere mantelzorger-hulp in beide steden. |
| `"zorgvrager-taak"` | Zoekt in `ZORGTAKEN`-categorieën, alleen in zorgvrager-stad. |

De gemeente-filter is daardoor niet meer keyword-based of door het model te kiezen — de classificatie zit centraal in `src/lib/ai/hulp-categorisatie.ts`. Override per organisatie is mogelijk via DB-veld `Zorgorganisatie.lokaalGebonden`.

### Variatie in tool-resultaten

`zoekHulpbronnen` en `zoekArtikelen` halen sinds [PR #345](https://github.com/Willem1978/mantelzorg-app/pull/345) een **ruimere set** op (15-24 records) en passen `prioritizeUnshown` toe op basis van `shownNamen` / `shownTitels` die de client meestuurt. Resultaat: bij dezelfde zoekvraag in dezelfde gemeente komen telkens andere organisaties bovendrijven.

### Tool-status zichtbaar in UI

`AiChat.tsx` inspecteert het laatste assistant-bericht tijdens streaming: als er een part van het type `tool-<naam>` aanwezig is, mapt het via `TOOL_STATUS` naar een mensvriendelijk Nederlands label dat in de loading-bubble verschijnt. Defensief gelezen zodat het werkt met meerdere AI SDK-versies. Geen tool actief? Dan toont de bubble simpelweg "Ger typt…".

---

## 8. Crisis-detectie

Tweelaagse aanpak — eerst snel en deterministisch, daarna AI-aanvulling voor subtiele formuleringen.

### Laag 1: keyword-detectie

Vóórdat het AI-model überhaupt wordt aangesproken, wordt het laatste gebruikersbericht door `detecteerCrisis()` gescand (`src/lib/ai/crisis-detector.ts`).

### Niveaus

| Niveau | Trigger | Reactie |
|---|---|---|
| `geen` | Geen signalen | Normaal AI-antwoord |
| `aandacht` | 1 keyword-match | Doorzetten naar laag 2 (AI-verificatie) |
| `crisis` | 2+ matches of expliciete keywords ("zelfmoord", "ik kan niet meer") | **Geen AI-call**: vast protocol-antwoord met 113, huisarts en Mantelzorglijn |

### Laag 2: AI-verificatie bij `aandacht`

`aiCrisisVerificatie()` in `src/lib/ai/crisis-ai-check.ts`:

- Wordt **alleen** aangeroepen als laag 1 een aandacht-signaal vond — bij ~99% van de berichten gebeurt deze call niet.
- Stuurt het bericht naar Haiku met een safety-classifier prompt; verwacht één woord terug: `ESCALEREN` / `ZORG` / `OK`.
- Bij `ESCALEREN` wordt het niveau opgewaardeerd naar `crisis` → vast protocol-antwoord.
- Maximaal 10 output-tokens, faalt stil bij netwerk-/API-fouten (chat blijft werken).

Vangt formuleringen als "alles voelt grijs", "ik weet het allemaal niet meer", "het maakt allemaal niet meer uit" — die geen keyword raken maar wel zorgwekkend zijn.

Hardcoded crisis-respons gebruikt deze hulplijnen:
- **113 Zelfmoordpreventie** — 0800-0113
- **Huisarts** (eigen)
- **Mantelzorglijn** — 030-205 90 59
- **Veilig Thuis** — 0800-2000

Filosofie: **safety-first** — false positives (onterecht crisis-protocol tonen) zijn acceptabel. Liever één keer te veel een hulplijn tonen dan een echt signaal missen.

---

## 9. Frontend-integratie

Hoofdcomponent: `src/components/ai/AiChat.tsx`. Gebruikt `useChat` uit `@ai-sdk/react` met een custom `DefaultChatTransport`.

### Bericht-flow

1. **Bij mount**: `GET /api/ai/opener` → opener-tekst + **2 keuze-tegels** tonen (gepersonaliseerd op basis van balanstest en zorgvrager-naam)
2. **Gebruiker** typt of klikt op een tegel of vraagknop → `sendMessage({ text })`. Klik op vraagknop wordt gelogd via `POST /api/ai/suggestie-klik` (type=`VRAAGKNOP`).
3. **`prepareSendMessagesRequest`** callback:
   - Converteert UI-berichten (parts-format) naar model-berichten (content-format)
   - Filtert lege berichten (tool-call stappen zonder tekst)
   - Verzamelt eerdere `{{hulpkaart:...}}`-namen en `{{artikelkaart:...}}`-titels uit de message-history
   - Stuurt mee als `shownHulpbronnen` / `shownArtikelen` in de body
4. **Server** streamt antwoord-tokens terug
5. **Tijdens streaming**:
   - Loading-bubble toont **tool-status met kant** als Ger `zoekHulpbronnen` aanroept: "Ger zoekt hulp voor jou als mantelzorger" of "Ger zoekt hulp bij een taak voor je naaste"
   - Voor andere tools een algemener label ("Ger zoekt artikelen die kunnen helpen", etc.)
   - `parseHulpkaarten`, `parseArtikelkaarten`, `parseButtons` halen tokens uit de tekst en renderen ze los buiten de spreekbubble
6. **Cumulatieve verzameling**: een `useEffect` loopt na elke nieuwe assistant-message door **alle** assistant-berichten heen, dedupliceert op naam/titel en zet de top-6 hulp + top-6 artikelen onder de input. Verdwijnen doen ze pas als de cap wordt overschreden.
7. **Lege-strook hint**: als er nog géén kaarten zijn maar er is wel een gesprek bezig, toont de UI subtiel *"Nog geen suggesties — Ger luistert eerst even mee."*

### UI-varianten

| Component | Gebruik |
|---|---|
| `AiChat` | Hoofd-chatpagina `/ai-assistent` |
| `GerHeroChat` | Hero-sectie homepage (visueel groter) |
| `FloatingGerChat` | Zwevend chat-widget |
| `PublicGerChat` | Publieke variant zonder login |
| `AgentChat` | Generiek alternatief (mogelijk legacy) |

### Cumulatieve kaartverzameling

In tegenstelling tot eerder (vervangende set per bericht) bouwt de chat nu een **groeiende collectie** op onder de input:

- Hulpkaarten en artikelkaarten worden uit alle assistant-berichten verzameld
- Dedupe op lowercase naam / titel
- Caps: max 6 hulpkaarten + max 6 artikelkaarten
- Volgorde: nieuwste eerst (van recent assistant-bericht naar oud)
- Elke kaart blijft klikbaar; ContentModal opent met bel/web-knoppen + hartje voor favoriet

Zo voelt het gesprek minder "wegglippen" — wat Ger eerder noemde blijft zichtbaar en makkelijk op te slaan.

### Favoriet-functie

Beide kaart-modals (hulpkaart en artikelkaart) bevatten een hartje-knop. Klikken roept `POST /api/favorieten` (of `DELETE` om te verwijderen) en dispatcht een `favorieten-updated`-event zodat andere componenten kunnen herladen. Het `itemId` van AI-aanbevelingen wordt deterministisch gegenereerd uit de naam/titel (`ai-naam-met-streepjes`). Categorie wordt meegegeven voor filtering op de favorieten-pagina.

---

## 10. Koppelingen & afhankelijkheden

### Externe services

| Service | Doel | Env-variabele |
|---|---|---|
| **Anthropic API** | Claude-modellen voor alle chat-agents | `ANTHROPIC_API_KEY` |
| **OpenAI API** | Embeddings voor semantisch zoeken | `OPENAI_API_KEY` |
| **Upstash Redis** | Rate-limiting op `/api/ai/welkom` (20/10min per IP) | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` |
| **Sentry** | Error-tracking incl. AI-fouten | `SENTRY_DSN` |
| **Auth0 / NextAuth** | Sessie-validatie voor authenticated routes | div. NextAuth env-vars |

Bij een ontbrekende `ANTHROPIC_API_KEY` antwoordt de chat-route met **HTTP 503** en een Nederlandse foutmelding ("De AI-assistent is tijdelijk niet beschikbaar. Neem contact op met de beheerder.").

### Database (Prisma / Postgres)

Modellen die de AI-chatbot direct leest of schrijft:

```
Caregiver           ── leest profiel, gemeenten, voorkeuren, organisatie-koppelingen
BelastbaarheidTest  ── leest scores, antwoorden, geselecteerde taken, alarmen
                       (gebruikt door /api/ai/chat én /api/ai/opener)
Zorgorganisatie     ── leest hulpbronnen (filtert op gemeente, niveau, doelgroep)
Artikel             ── leest gepubliceerde artikelen + tags
ArtikelTag / Tag    ── leest tags voor filtering
Actiepunt           ── leest open punten, schrijft nieuwe via tool
WeekKaart           ── leest week-overzicht
AlarmLog            ── schrijft crisis-signalen
GeplandCheckin      ── schrijft (via balanscoach-route)
Favoriet            ── geschreven door client na klik op favoriet-knop
AiSuggestieClick    ── geschreven bij elke klik op hulp-/artikelkaart (analytics)
```

`pgvector` extensie wordt gebruikt door `semantischZoeken` voor 1536-dim embedding similarity (OpenAI). Valt automatisch terug op tekstzoek als de extensie niet aanwezig is — geen harde dependency.

### Geen persistentie van gesprekken

Berichten worden **alleen lokaal** opgeslagen door de Vercel AI SDK in browser-localStorage. Er is bewust **geen** `Conversation`-of-`ChatMessage`-model in de database. Implicaties:

- Wisselen van device/browser = nieuw gesprek
- Logout wist het lokale gesprek niet, maar je ziet het pas weer na inlog
- Variatie in suggesties is sessie-scoped (zie sectie 6)
- Privacy: gesprekken zijn nergens server-side gelogd

Wel persistent over sessies heen: **Actiepunten** (door Ger via tool opgeslagen) en **Favorieten** (door gebruiker via kaart-modal). Die maken het mogelijk dat Ger in een volgend gesprek kan zeggen: *"Vorige keer spraken we over X. Is dat gelukt?"*

---

## 11. Beveiliging & rate-limiting

| Mechanisme | Waar | Doel |
|---|---|---|
| **Auth-check** | Begin van elke route (m.u.v. `/welkom`) | Alleen ingelogde users mogen praten met de gepersonaliseerde Ger |
| **Crisis-detector (laag 1: keywords)** | Vóór elke AI-call | Voorkomt dat AI iets schadelijks zegt bij overduidelijke crisis-keywords |
| **AI crisis-verificatie (laag 2)** | Bij `aandacht`-niveau van laag 1 | Snelle Haiku-call die subtiele formuleringen oppakt; kan upgraden naar `crisis` |
| **Rate-limiting** | `/api/ai/welkom` (20/10min per IP) | Voorkomt misbruik van de publieke endpoint |
| **`maxDuration` 30s** | Vercel function | Hard timeout — voorkomt lange hangende calls |
| **`stopWhen: stepCountIs(7)`** | streamText | Maximaal 7 tool-call stappen per turn — voorkomt oneindige loops |
| **`maxOutputTokens: 600`** | streamText | Hard plafond op antwoordlengte — kostenbeheersing + UX |
| **Hardgecodeerd protocol bij crisis** | `buildCrisisResponse()` | Telefoonnummers van hulplijnen kunnen niet door AI verzonnen of gewijzigd worden |
| **Geen verzonnen contactgegevens** | Prompt-instructie + tool-output | Hulpkaarten worden letterlijk uit DB gekopieerd; AI mag geen telefoonnummers/websites verzinnen |

---

## 12. Hoe pas je Ger's gedrag aan? ("training")

Omdat er geen fine-tuning is, gebeurt alle gedragsaanpassing via **prompt engineering** + **context**. Veelvoorkomende aanpassingen:

| Wat | Waar aanpassen |
|---|---|
| **Toon, persona, gespreksstijl** | `src/lib/ai/prompts/assistent.ts` (basis-prompt) |
| **Lengte-limiet antwoorden** | `maxOutputTokens` in `src/app/api/ai/chat/route.ts` + zinnen-limiet in `assistent.ts` |
| **Variatie in openers / verboden clichés** | Sectie "Stap 1 — Verbinding" in `assistent.ts` |
| **Twee-doelgroepen-regel** | Sectie "Output-syntax" in `assistent.ts` |
| **Welkomstzin + startknoppen** | `src/app/api/ai/opener/route.ts` (server-side, geen AI) |
| **Tool-status labels in UI** | `TOOL_STATUS` object in `src/components/ai/AiChat.tsx` |
| **Cap op cumulatieve kaartverzameling** | `MAX_HULP` / `MAX_ARTIKEL` in `AiChat.tsx` |
| **Gedrag per balansniveau** | Sectie "Gedrag per belastingniveau" in `assistent.ts` |
| **Output-syntax / kaart-formaat** | Sectie "Output Syntax" in zelfde prompt + `HulpKaart.tsx` / `ArtikelKaart.tsx` (parser) |
| **Crisis-keywords / hulplijnen** | `src/lib/ai/crisis-detector.ts` (laag 1) en `src/lib/ai/crisis-ai-check.ts` (laag 2) |
| **Welke kant / gemeente-scope** | `src/lib/ai/hulp-categorisatie.ts` (centrale classificatie + lotgenoten-keywords) |
| **Welk model voor welke agent** | `src/lib/ai/models.ts` (`AGENT_MODELS`) |
| **Welke tools beschikbaar per route** | De `tools: { ... }` in elke `/api/ai/*/route.ts` |
| **Wat in pre-fetched context** | `src/lib/ai/prefetch-context.ts` (prefetchUserContext + buildContextBlock) |
| **Variatie / herhaling-gedrag** | `src/lib/ai/variation.ts` + `shownHulpbronnen` body-veld |
| **Coach-adviezen per deelgebied** | Static config (zie `loadCoachAdviezen()`) |

### Iteratie-tips

1. **Wijzig één ding tegelijk** in het systeem-prompt. Door de uitgebreidheid is het makkelijk dat aanpassingen elkaar tegenwerken.
2. **Test op échte balanstest-data** — Ger gedraagt zich anders bij HOOG/GEMIDDELD/LAAG. Een test-account per niveau is waardevol.
3. **Let op token-budget** — `maxOutputTokens: 600` houdt antwoorden kort, maar de pre-fetched context kan groot worden bij veel hulpbronnen. Monitor input-tokens in Anthropic dashboard.
4. **Gebruik de Anthropic console voor prompt-debugging** — kopieer de werkelijk verstuurde messages + system prompt en test daar varianten zonder de volledige Next.js stack.
5. **Bij wijzigingen aan kaart-syntax**: update óók de parser in `HulpKaart.tsx` / `ArtikelKaart.tsx`, anders worden ze niet meer herkend.

---

## 13. Andere AI-componenten in het systeem

Naast Ger draaien er meer AI-processen op de achtergrond. Ze zijn niet "Ger" maar leven wel in dezelfde `src/lib/ai/`-boom:

| Onderdeel | Doel | Model |
|---|---|---|
| `agents/hulpbronnen-zoeker` | Automatisch nieuwe zorgorganisaties vinden + voorstellen | Sonnet |
| `agents/hulpbronnen-validator` | Bestaande hulpbronnen verifiëren (telefoonnummer klopt nog?) | Sonnet |
| `embed-on-save` | Bij elke artikel-save → genereer + sla embedding op | OpenAI embeddings |
| Admin-curator | Rangschikken / dedupliceren van content | Sonnet |
| Admin-content-agent | Genereren van nieuwe artikelen op B1-niveau | Sonnet |
| Admin-tag-suggestie | Artikel automatisch taggen | Haiku |
| WhatsApp-bot (Twilio) | Balanstest via WhatsApp afnemen | Haiku |

Deze agents schrijven naar dezelfde Postgres en delen de Anthropic-account — houd er rekening mee bij rate-limit / kosten-budgettering.

---

## 14. Belangrijke bestanden in één oogopslag

```
src/
├── app/api/ai/
│   ├── opener/route.ts          ← welkomstzin + 2 keuze-tegels (geen AI-call)
│   ├── chat/route.ts            ← hoofd-chat endpoint
│   ├── welkom/route.ts          ← publieke chat (rate-limited)
│   ├── balanscoach/route.ts     ← coach met test-context
│   ├── checkin/route.ts         ← maandelijkse check-in
│   ├── embeddings/route.ts      ← embedding generatie
│   ├── suggestie-klik/route.ts  ← logt klikken op kaarten + vraagknoppen
│   └── admin/                   ← admin-agents
│
├── lib/ai/
│   ├── models.ts                ← model-keuze per agent (Haiku/Sonnet/Opus)
│   ├── variation.ts             ← shuffle + prioritizeUnshown helpers
│   ├── hulp-categorisatie.ts    ← Kant + GemeenteScope (de tweesplitsing)
│   ├── crisis-detector.ts       ← keyword-detectie laag 1 + vast protocol
│   ├── crisis-ai-check.ts       ← AI-aanvulling laag 2 (Haiku)
│   ├── prefetch-context.ts      ← context vooraf + twee gescheiden hulp-blokken
│   ├── embeddings.ts            ← OpenAI embedding service
│   ├── coach-advies.ts          ← static coach-tips per deelgebied
│   ├── gemeente-resolver.ts     ← gemeente-contact lookup
│   ├── prompts/
│   │   ├── assistent.ts         ← Ger's hoofdprompt (chat) — TWEE-RICHTING + tempo
│   │   ├── welkom.ts            ← homepage Ger
│   │   ├── balanscoach.ts       ← coach
│   │   └── checkin-buddy.ts     ← check-in
│   ├── tools/                   ← function-calling tools (zoekHulpbronnen met kant)
│   ├── agents/                  ← complexe AI-agents (hulpbron-zoeker, validator)
│   └── __tests__/               ← vitest unit-tests
│
└── components/ai/
    ├── AiChat.tsx               ← hoofdchat-UI (transport + tegels + cumulatief)
    ├── HulpKaart.tsx            ← parser + render van {{hulpkaart:...}}
    ├── ArtikelKaart.tsx         ← parser + render van {{artikelkaart:...}} (id-lookup)
    ├── GerAvatar.tsx            ← avatar-component
    ├── GerHeroChat.tsx          ← hero-variant
    ├── FloatingGerChat.tsx      ← floating widget
    └── PublicGerChat.tsx        ← anonieme variant
```

---

## 15. Recente verbeteringen (Ronde 1 + 2 + 3 + 4 + 5 + 6 + 7 + 8 + 9 + 10 + 11 + 12 + 13 + 14 + 15 + 16)

### Ronde 16 — Stabilization: tool-fouten + telemetrie + prompt-duplicaten

Drie aparte stabilisatie-stappen op één branch.

#### 1. Tool-error-handling (`safeExecute`)

Voorheen kon één crashende tool (DB-fout, time-out, malformed input) de hele chat-stream omver gooien. Nieuwe utility `lib/ai/tools/_helpers.ts` met `safeExecute(toolName, fn)` die elke tool-execute wrapt:

- Bij fout: `console.error` met toolName + retourneer `{ fout: true, bericht: string, toolName: string }`.
- Het model verwerkt dit als gewone tool-output en kan beleefd uitwijken.
- Alle 12 tools gewrapt: `balanstest`, `actiepunten`, `artikelen`, `checkin-trend`, `gebruiker-status`, `gemeente-advies`, `gemeente`, `hulpbronnen`, `rapport-samenvatting`, `registreer-alarm`, `semantic-search`, `test-trend`.

#### 2. Telemetrie (`AiInteractie`)

Nieuw model voor lichtgewicht logging zodat we kosten/latency/tool-gebruik in productie kunnen monitoren:

| Veld | Wat |
|---|---|
| `userId, route, model, pagina` | Wie + welke endpoint + welk model |
| `durationMs` | Totale request-duur |
| `toolsCalled[], toolsFailed[]` | Welke tools werden gebruikt + welke faalden via `safeExecute` |
| `inputTokens, outputTokens` | Uit `usage` van streamText / generateObject |
| `status` | `ok` / `error` / `rate-limited` / `auth-error` |
| `errorBericht` | Afgekapt op 500 chars |

**GEEN content** — geen berichten of samenvattingen worden gelogd, alleen meta-data.

| Locatie | Wat |
|---|---|
| `prisma/schema.prisma` | Nieuw model `AiInteractie` |
| `prisma/ai-interactie.sql` | Supabase migratie (idempotent) — inclusief RLS-enable |
| `src/lib/ai/telemetrie.ts` | `logAiInteractie()` — fire-and-forget helper |
| `src/app/api/ai/balanscoach/route.ts` | Logging op alle exit-paths (auth-error, rate-limited, ok via `onFinish`, error catch) |
| `src/app/api/ai/samenvat/route.ts` | Logging op ok + error |

Andere routes (`chat`, `welkom`, `checkin`) volgen in latere ronde.

#### 3. Prompt: drie evidente duplicaten weggehaald

Conservatieve opschoning, geen dramatische rewrite. Drie regels weggehaald die elk al ergens anders in de prompt stonden:
- "Verzin er geen bij" (regel 513 — al gedekt in TWEE SOORTEN HULP en COACHING)
- "NOOIT alle info in één bericht dumpen — één onderwerp per keer" (al gedekt in ZO PRAAT JE en STIJL)
- "Verzin geen taken" in `buildBalanscoachPrompt` LOCATIE-blok (al gedekt in hoofdprompt)

Resultaat: 1043 → 1030 regels. Subtiele opschoning; grote rewrite blijft uitgesteld.

#### Vereist na deploy

DB-migratie via `prisma/ai-interactie.sql` in Supabase SQL Editor voordat de telemetrie écht schrijft. Zonder migratie: telemetry-calls falen stil (zoals bedoeld), maar er komt niets in de DB.

### Ronde 15 — Cleanup-roundup: feedback-loop herstellen + tegenspraken oplossen + hardening

Een onafhankelijke kritische review legde drie categorieën problemen bloot. Deze ronde adresseert ze allemaal in één PR.

#### 1. Kapotte feedback-loop hersteld

De prompt vertelde Ger over openstaande actiepunten ("vorige keer spraken we over X — is dat gelukt?"), en `/api/ai/samenvat` verwachtte een `actiepuntenAangemaakt`-count, maar **de tool om actiepunten op te slaan ontbrak in `/api/ai/balanscoach`**. Resultaat: het hele "vorige keer spraken we over..."-mechanisme was een fopspeen.

| Fix | Bestand |
|---|---|
| `slaActiepuntOp` toegevoegd aan tool-set | `app/api/ai/balanscoach/route.ts` |
| `bekijkGemeenteAdvies` toegevoegd aan prompt-tool-header | `prompts/balanscoach.ts` |
| `stepCountIs(3)` → `(5)` (ruimte voor ketens balanstest → gemeente → actiepunt) | `app/api/ai/balanscoach/route.ts` |
| `actiepuntenAangemaakt` server-side getelt (laatste 30 min) | `app/api/ai/samenvat/route.ts` |

#### 2. Drie prompt-tegenspraken opgelost

| Tegenspraak | Resolutie |
|---|---|
| "max 1-2 zinnen" vs "max 2-3 zinnen" | Eén regel: **max 1-2 zinnen lopende tekst** in beide secties |
| "GEEN hulpkaarten in eerste bericht" vs "Bij HOOG altijd Mantelzorglijn" | Expliciete uitzondering: bij HOOG **moet** Mantelzorglijn-hulpkaart in het eerste bericht (veiligheidsnet) |
| "Niet je score noemen" vs "Je doet [X] uur per week" | Onderscheid: **uren noemen mag** (concreet, herkenbaar); **score-getallen, "niveau", "deelgebied", "draaglast" niet** |

#### 3. Twee gaten gevuld

| Onderwerp | Wat |
|---|---|
| **Afscheid** | Nieuwe sectie: bij "doei" / "tot ziens" / "bedankt, ik ga weer" — sluit warm en kort af in 1-2 zinnen, GEEN 3 vraagknoppen meer onderaan, geen nieuwe open vraag |
| **Off-topic / scheldwoorden / prompt-injection** | Nieuwe sectie met instructies per type: off-topic → terug naar rol; schelden → erken gevoel zonder corrigeren; prompt-injection ("ignore previous") → beleefd terug naar rol |

#### 4. Hardening + performance

| Fix | Effect |
|---|---|
| **Rate-limiting** op `/api/ai/balanscoach` (60/10min/user) en `/api/ai/samenvat` (al hoger) | Beschermt tegen scraping/abuse |
| **Dedup op `/api/ai/samenvat`** — max 1 samenvatting per 5 min per user | Voorkomt dubbele records bij re-mount/beforeunload |
| **TTL 90 dagen op `eerdereGesprekken`** in prefetch | Oude gesprekken blokkeren de prompt niet meer |
| **Coach-adviezen gecached op module-niveau** (5 min TTL) | Bespaart een DB-query per chat-beurt |
| **Pagina-veld validatie** — alleen bekende strings toegestaan | Voorkomt prompt-injection via `body.pagina` |
| **`shownHulpbronnen` cap op 50** | Voorkomt payload-bloat |
| **Dubbele caregiver-fetch verwijderd** | Eén query in plaats van twee |
| **JSON-status-dump weggehaald** | Was redundant met `dynamicContext` |

#### Niet gedaan in deze ronde

De review noemde ook ~30-40% redundantie in de prompt (4× "verzin geen taken", 6× "B1", 5× "één onderwerp"). Die opschoning is **bewust uitgesteld** — een bulk-edit zou subtiele nuances kunnen verwijderen die eerder met reden zijn toegevoegd. Pakken we in een aparte ronde aan met een meer chirurgische aanpak.

### Ronde 14 — Vraagknop-audit: alleen wensen, vragen, of zelf-uitspraken

Live-test toonde twee fouten in vraagknoppen die het model genereerde:

1. **"Ik bel het Mantelzorgloket"** — actie-uitspraak. De gebruiker klikt op een knop, dat is geen telefoongesprek. Een knop hoort een vraag of wens te zijn.
2. **"En hoe gaat het eigenlijk met jou zelf?"** — wanneer de gebruiker hierop klikt, vraagt hij Ger hoe Ger zich voelt. Omgedraaid perspectief.

Audit van alle voorgedefinieerde knoppen:

| Locatie | Status |
|---|---|
| `DashboardGerChat` chips (4) | Alle goed — wensen/uitspraken |
| `opener/route.ts` tegels (2) | Alle goed |
| `balanscoach.ts` voorbeelden | 1 actie-uitspraak gevonden ("Bel Perspectief Zutphen voor het regelwerk") — vervangen door info-vraag |

Nieuwe prompt-sectie *"WAT VRAAGKNOPPEN ZIJN, EN WAT NIET"* met:

**Drie geldige soorten knoptekst:**
- Een **wens** ("Ik wil hulp bij mijn energie")
- Een **vraag** ("Wat doet een mantelzorgmakelaar?")
- Een **uitspraak over zichzelf** ("Het gaat niet goed met mij")

**Drie types die nu expliciet FOUT zijn:**
- Vragen aan Ger over Ger ("Hoe gaat het met jou?")
- Actie-uitspraken ("Ik bel het Mantelzorgloket", "Ik ga naar de gemeente")
- Bedankjes/afronders ("Bedankt", "Oké")

Plus een check-vraag voor het model: *"Kun je de knop-tekst lezen alsof de gebruiker hem hardop tegen jou zou zeggen? Zo niet — fout."*

| Bestand | Wijziging |
|---|---|
| `prompts/balanscoach.ts` | Nieuwe KRITIEK-sectie met drie geldige + drie foute soorten vraagknoppen. Voorbeeld "Bel Perspectief..." vervangen door "Wat doet een mantelzorgmakelaar?". |

### Ronde 13 — Tweesplitsing-kennis borgen + nóg kortere B1-taal

Twee verbeteringen die voortkomen uit het inzicht dat de mantelzorger zelf
meestal **geen voorkennis heeft** over zijn rol of de hulp die er is.

#### 1. Tweesplitsing-kennis expliciet uitleggen (kennis-borging)

Veel mensen die voor een naaste zorgen herkennen zich niet als "mantelzorger" en weten niet dat er twee fundamenteel verschillende soorten hulp bestaan:

| Soort | Voor wie | Komt van |
|---|---|---|
| **Hulp voor jou** (de mantelzorger) | Voor jou als mens — praten, rust, advies | Jouw gemeente, jouw werkgever, jouw zorgverzekeraar, steunpunt mantelzorg |
| **Hulp bij een taak voor je naaste** | Een ander neemt jouw zorgtaak over | De gemeente van je naaste, zijn/haar zorgverzekeraar, vrijwilligers, mensen uit de buurt |

Nieuwe prompt-sectie *TWEE SOORTEN HULP — DIT IS HET BELANGRIJKSTE WAT JE UITLEGT* met:
- Expliciete waarschuwing dat de gebruiker dit meestal niet weet
- Beide soorten in B1-taal uitgelegd, mét waar de hulp vandaan komt
- Regel voor toepassing: bij eerste vraag van iemand die nog niets weet — leg in 1-2 zinnen uit dat er twee soorten zijn, niet als lijst
- Verbod op jargon zonder uitleg ("WMO", "Wlz", "PGB" alleen met uitleg in dezelfde zin)

#### 2. Nóg kortere B1-taal

Antwoorden waren nog te lang en te formeel. Aangescherpt:

| Was (Ronde 12) | Nu (Ronde 13) |
|---|---|
| Eerste bericht: max 90 woorden | **max 60 woorden** |
| Vervolgberichten: max 70 woorden | **max 45 woorden** |
| Lopende tekst: max 3-4 zinnen | **max 1-2 zinnen** |
| Open vraag: max 15 woorden | **max 8 woorden** |
| Zinslengte: niet expliciet | **max 12 woorden, liever 8** |
| Emotionele onderwerpen: max 110 | **max 80** |

Dashboard- en opener-chips zijn ook ingekort:

| Was | Nu |
|---|---|
| "Ik wil hulp voor mijzelf" | "Hulp voor mij zelf" |
| "Ik wil hulp bij een taak die ik voor [naaste] doe" | "Hulp bij een taak voor [naaste]" |
| "Ik ben op zoek naar informatie" | "Ik zoek informatie" |
| "Het gaat niet zo goed met mij" | "Het gaat niet goed met mij" |

Pagina-context-voorbeelden in de prompt zijn allemaal verkort. Opener-tegels (`/api/ai/opener`) gebruiken nu B1-omschrijvingen ("Een ander neemt boodschappen over, zodat jij dat niet alleen doet") in plaats van opsommingen van diensten.

| Bestand | Wat |
|---|---|
| `prompts/balanscoach.ts` | Nieuwe sectie TWEE SOORTEN HULP, woordbudget 60/45, zinnen max 12 woorden, vragen max 8 woorden, alle pagina-voorbeelden ingekort |
| `components/dashboard/DashboardGerChat.tsx` | Drie chip-labels ingekort |
| `app/api/ai/opener/route.ts` | Tegel-omschrijvingen herschreven naar B1 (geen opsomming van diensten) |

### Ronde 12 — Korter, bullets, geen tool-narratie + gebruiker-pad volgen

Vier verbeteringen samen — drie aan tekstvorm, één aan gespreksflow.

Live-test: Ger gaf op informatie-vragen lange essay-achtige antwoorden, beginnend met *"Laat me anders zoeken naar wat breder kan helpen: Oké, ik zie dat er op dit moment geen specifieke artikelen beschikbaar zijn..."*. Drie problemen:

1. **Te lange teksten** — drie alinea's waar één had volstaan. Oude regel was "max 4-6 zinnen / 100 woorden", maar in de praktijk te ruim.
2. **Bullet-verbod te strikt** — voor concrete tips ("zorg voor 7 uur slaap, geen scherm, frisse lucht") was een vloeiende zin minder helder dan een korte bullet-lijst.
3. **Tool-narratie zichtbaar** — Ger zei letterlijk wat hij dacht of zocht in plaats van direct met het antwoord te komen.

| Verbetering | Effect | Bestand |
|---|---|---|
| **Strakker woordbudget** | Eerste bericht: 120 → **90 woorden**. Vervolgberichten: 100 → **70 woorden**. 3-4 zinnen i.p.v. 4-6. Bij emotionele onderwerpen iets meer (110). | `prompts/balanscoach.ts` |
| **Bullets toegestaan voor concrete tips** | Verbod *"NOOIT opsommingen met streepjes"* opgeheven. Wel kort: max 4 bullets, max 10 woorden per bullet, alleen als ze concreter zijn dan een vloeiende zin. Genummerde lijsten (1. 2. 3.) blijven verboden. De UI rendert `- ` en `• ` al als bullets — geen code-aanpassing nodig. | `prompts/balanscoach.ts` |
| **Verbod op tool-narratie** | Nieuwe regel: NOOIT je eigen denkproces verbaliseren. FOUT-voorbeelden: *"Laat me anders zoeken..."*, *"Even kijken in de database..."*, *"Ik denk dat..."*, *"Oké, ik zie dat..."*. GOED: direct met het antwoord beginnen, zonder opwarmer. | `prompts/balanscoach.ts` |
| **Fallback bij geen artikelen gevonden** | Niet narreren ("ik zie geen artikelen"). Wel: 1-2 zinnen tip + 2-3 bullets + verwijzing naar mantelzorgloket als hulpkaart + open vraag + 3 vraagknoppen. | `prompts/balanscoach.ts` |
| **Meerdere hulpkaarten bij meerdere taken** | Bij B-pad-vraag ("hulp bij een taak voor naaste") en >1 taak in `zwareTaken`/`overigeTaken`: toon tot 2 hulpkaarten verspreid over de zwaarste én tweede taak. Niet één bron en stoppen. Als er maar één passende bron is: noemen dat er ook hulp is voor de andere taak en vragen of de gebruiker dat ook wil zien. | `prompts/balanscoach.ts` |
| **Vraagknoppen volgen het gekozen pad** | A/B/C-kompas heeft nu twee modi: bij OPENING/vage start drie verschillende dimensies (1× A, 1× B, 1× C). Maar zodra de gebruiker een pad koos: 2 knoppen verdiepen dat pad + 1 uitstap-knop naar een ander pad. De gebruiker koos B (taak voor Kim) → blijf in B totdat hij zelf wil wisselen, niet meteen weer A en C aanbieden. | `prompts/balanscoach.ts` |

### Ronde 11 — Gespreksgeheugen + proactieve artikelen bij kennis-onderwerpen

Twee verbeteringen die het gesprek persoonlijker en beter doorpakkend maken.

#### 1. Gespreksgeheugen (cross-session)

Tot Ronde 10 startte elk chat-gesprek van nul: Ger wist alleen wat in profiel/balanstest/openstaande actiepunten stond, maar niet wat hij vorige keer met deze mantelzorger had besproken. Nu is er een lichtgewicht geheugen-systeem dat na elk gesprek een korte samenvatting opslaat en bij een volgend gesprek terug-injecteert.

**Privacy-by-design:** alleen samenvatting (3-5 zinnen) + 1-5 onderwerpen worden bewaard, géén letterlijke berichten. Maximaal de laatste 3 samenvattingen worden in de prompt geïnjecteerd.

| Onderdeel | Wat | Bestand |
|---|---|---|
| **Database-model** | Nieuw model `GesprekSamenvatting`: id, userId, samenvatting (text), onderwerpen (string[]), actiepuntenAangemaakt, berichtenAantal, createdAt. Geïndexeerd op (userId, createdAt). | `prisma/schema.prisma`, `prisma/gesprek-samenvatting.sql` (Supabase migratie) |
| **API-endpoint `/api/ai/samenvat`** | POST met messages-array. Roept Haiku (~$0.0005/gesprek) met gestructureerde output via `generateObject`. Slaat samenvatting + onderwerpen op. Skipt gesprekken < 4 berichten. | `src/app/api/ai/samenvat/route.ts` |
| **Trigger in chat-componenten** | `FloatingGerChat.handleClose` en `DashboardGerChat` (op unmount + beforeunload) sturen messages naar `/api/ai/samenvat` met `keepalive: true`. Faalt stil. | `FloatingGerChat.tsx`, `DashboardGerChat.tsx` |
| **Prefetch-uitbreiding** | `prefetchUserContext` haalt de laatste 3 samenvattingen op. `buildEerdereGesprekkenBlock` rendert ze in een `EERDERE GESPREKKEN`-blok in de system prompt (datum + onderwerpen + samenvatting per gesprek). | `prefetch-context.ts` |
| **Prompt-sectie** | Nieuwe `EERDERE GESPREKKEN — REFEREREN MET WARMTE`-sectie met WAT WEL ("vorige keer hadden we het over X — hoe staat dat nu?") / WAT NIET (letterlijk citeren, "ik heb in mijn database gezien"). | `prompts/balanscoach.ts` |
| **Modeltoewijzing** | Nieuwe agent `ger-samenvat` → Haiku 4.5 (snel + goedkoop). | `lib/ai/models.ts` |

#### 2. Proactieve artikelen bij kennis-onderwerpen

Bij negen kennis-zwaar onderwerpen (PGB, respijtzorg, dementie, zorgverlof, mantelzorgvergoeding, WMO, lotgenoten, burn-out, schuldgevoel) is een `{{artikelkaart:...}}` voortaan **verplicht** — ook als de gebruiker niet expliciet om "info" of "tips" vroeg. De gebruiker heeft baat bij iets om later na te lezen, zonder dat hij ernaar hoeft te vragen.

| Onderdeel | Wat | Bestand |
|---|---|---|
| **Prompt-regel** | Nieuwe `KENNIS-ONDERWERPEN`-sectie onder ARTIKELKAARTEN met de negen onderwerpen + GOED/FOUT-voorbeeld voor PGB (waar dit live mis ging). | `prompts/balanscoach.ts` |

### Ronde 10 — Drie kompas-dimensies, echte taken, deelgebied-specifieke vragen

Live-test toonde drie dieperliggende problemen die de chat onpersoonlijk en
willekeurig maakten:

1. **Generieke taakvoorbeelden in plaats van de eigen taken.** De prompt bevatte vaste voorbeelden ("boodschappenservice, maaltijdservice, koken") in het ENERGIE/GEVOEL/TIJD-blok. Het model kopieerde die letterlijk, zelfs als de gebruiker geen boodschappen of koken in zijn `zwareTaken` had. Resultaat: een Zutphen-mantelzorger die 10 uur per week regelt voor zijn naaste kreeg een aanbod voor boodschappenbezorging.
2. **Twee vraagknoppen, vaak uit dezelfde dimensie.** De UI capte op 2 (`slice(0, 2)`), de prompt zei "ALTIJD precies 2", en in de praktijk eindigden gesprekken vaak op een dood spoor.
3. **Bij vage input ("iets anders") gaf Ger een lege wedervraag.** *"Oké, goed. Waar wil je het over hebben?"* — precies wat een coach niet hoort te doen.

#### De drie kompas-dimensies (kerncompass)

Onder elke chat-beurt staan voortaan drie vraagknoppen die de drie vaste paden representeren:

| Dimensie | Wat | Voorbeeld-label |
|---|---|---|
| **A — Voor jou** | Hulp/aandacht voor de mantelzorger zelf — rust, gevoel, tijd, lotgenoten, respijt | "Ik wil hulp voor mijzelf" / "Vertel meer over respijtzorg voor mij" |
| **B — Voor je naaste** | Hulp bij een concrete zorgtaak die je voor de naaste doet (gebruikt een ECHTE taak uit `zwareTaken`) | "Ik wil hulp bij een taak die ik voor [naaste] doe" / "Hulp bij administratie voor Kim" |
| **C — Informatie / ander pad** | Een artikel lezen, ander onderwerp aansnijden, status bekijken | "Ik ben op zoek naar informatie" / "Lees een artikel over slaap" |

Deze drie blijven ook midden in een sub-onderwerp aangeboden — de gebruiker raakt nooit het kompas kwijt.

#### Wijzigingen

| Verbetering | Effect | Bestand |
|---|---|---|
| **Echte taken, geen verzinsels** | Vaste voorbeelden in het ENERGIE/GEVOEL/TIJD-blok zijn weggehaald. Nieuwe kritieke regel: "Gebruik alleen taken uit `zwareTaken`/`overigeTaken`. Verzin er geen bij." Met FOUT/GOED-voorbeelden. ZWARE TAKEN-blok zegt nu expliciet: "BEGIN ALTIJD bij de zwaarste (hoogste urenPerWeek)". | `prompts/balanscoach.ts` |
| **Eerste bericht met cijfers + deelgebied-vraag** | FLOW 1 vervangen: regel 1 = één zin met `totaleZorguren` + zwaarste taak. Regel 2 = open vraag specifiek voor het LAAGSTE deelgebied (energie → "hoe slaap je", gevoel → "met wie kun je praten", tijd → "heb je nog tijd voor jezelf"). | `prompts/balanscoach.ts` |
| **3 vraagknoppen (A/B/C-kompas)** | "ALTIJD precies 2" → "ALTIJD precies 3". Drie vaste dimensies, ook midden in een gesprek. UI cap op `.slice(0, 3)` in alle chat-componenten. | `prompts/balanscoach.ts`, `FloatingGerChat.tsx`, `DashboardGerChat.tsx`, `AgentChat.tsx`, `PublicGerChat.tsx`, `GerHeroChat.tsx` |
| **Dashboard-chip C: "Ik ben op zoek naar informatie"** | Vroeger varieerde C tussen "Hoe gaat het vandaag", "Bekijk openstaande acties", "Geef me een tip" etc. Nu vast: "Ik ben op zoek naar informatie" → triggert artikel-zoek-flow. | `DashboardGerChat.tsx` |
| **Direct artikelen tonen bij C** | Klikt de gebruiker op "Ik ben op zoek naar informatie" → Ger zoekt direct 1-2 passende artikelen op basis van zorgthema/laagste deelgebied. Geen open wedervraag eerst. | `prompts/balanscoach.ts` |
| **"Iets anders"-regel** | Ger pakt ZELF een onbesproken onderwerp uit de status (ander deelgebied, tweede zware taak, mantelzorger zelf, leesinteresse). Verbod op "waar wil je het over hebben?" als wedervraag. | `prompts/balanscoach.ts` |
| **Pagina-specifieke voorbeelden geüpgraded** | Alle voorbeeld-knoppensets in pagina-context (informatie, hulp, mantelbuddy, balanstest, checkin) bijgewerkt naar 3 knoppen die A/B/C-spreiding hebben. | `prompts/balanscoach.ts` |

### Ronde 9 — Live-test fixes: hulpkaart-pills, openingsknoppen, geen-agency, en/en-kaarten

| Verbetering | Effect | Bestand |
|---|---|---|
| **Hulpbronnen NOOIT in platte tekst** | Live-test toonde dat het model de prefetched organisaties paraphraseerde als bold-naam + beschrijving + telefoon op aparte regels — geen hulpkaart-pill onder de chat. Toegevoegd: kritieke FOUT/GOED-regel die platte-tekst-organisaties verbiedt. Naam, telefoon en beschrijving mogen alleen via de `{{hulpkaart:...}}`-marker. | `prompts/balanscoach.ts` |
| **Openingsknoppen consistent + naasteNaam** | Eén formulering overal: "Ik wil hulp voor mijzelf" + "Ik wil hulp bij een taak die ik voor [naasteNaam] doe". `naasteNaam` doorgegeven via `GerChatContext`, dus de tweede chip toont de echte naam (bijv. "Kim") in plaats van "mijn naaste". Vraagknop-voorbeelden + A/B/C-regel in de prompt zijn met dezelfde formulering bijgewerkt. | `DashboardGerChat.tsx`, `dashboard/page.tsx`, `prompts/balanscoach.ts` |
| **Geen-agency-regel** | Live-test toonde "Laat me de gemeente bellen voor je". Nieuwe sectie onder `WAT NIET`: "NOOIT DOEN ALSOF JE ACTIES UITVOERT" met FOUT/GOED-voorbeelden voor bellen, mailen, contact opnemen, regelen. Ger geeft alleen suggesties; de gebruiker doet zelf de actie. | `prompts/balanscoach.ts` |
| **En/en in plaats van of/of voor kaarten** | Vroegere regel was "OF hulpkaarten OF artikelkaarten — NIET BEIDE". Nu is combineren juist de standaard waar het past (hulp om te bellen + artikel om te lezen). Nieuwe limiet: max 2 hulpkaarten + max 2 artikelkaarten, totaal max 3 per bericht. Volgorde: hulpkaarten eerst (actie), dan artikelkaarten (lezen). | `prompts/balanscoach.ts` |

### Ronde 8 — Hulpkaarten in floating-/dashboardchat + drie-dimensies-regel voor vraagknoppen

| Verbetering | Effect | Bestand |
|---|---|---|
| **Hulpkaarten in `/api/ai/balanscoach`** | De floating "Vraag Ger"-chat (`FloatingGerChat`) en de dashboardchat (`DashboardGerChat`) toonden geen hulpkaarten onder de chat. Oorzaak: de balanscoach-route injecteerde alleen status-JSON + mantelzorgloket — geen `{{hulpkaart:...}}` per zorgtaak / voor de mantelzorger. De prompt rekent daar wél op ("kaarten zijn al geladen, NIET zoeken met tools"). Fix: balanscoach gebruikt nu `prefetchUserContext` + `buildContextBlock`, identiek aan `/api/ai/chat`. | `app/api/ai/balanscoach/route.ts` |
| **Drie-dimensies-regel voor de twee vraagknoppen** | De prompt liet het model regelmatig twee knoppen uit dezelfde richting genereren (bijv. "Help me met [taak]" + "Welke hulp is er voor mijn naaste?" — beide hulp-bij-taak). Nieuwe expliciete regel + voorbeeld in `balanscoach.ts`: de twee knoppen MOETEN uit verschillende dimensies komen — A) hulp voor de mantelzorger zelf, B) hulp bij een taak voor de naaste, C) ander pad (artikel/tip/status/even praten). Nooit twee uit dezelfde letter. | `prompts/balanscoach.ts` |
| **Dashboard: drie chips uit drie verschillende dimensies** | `buildProactiveActions` in `DashboardGerChat` gaf bij sommige contexten twee semantisch identieke chips (bijv. `niveau=HOOG` → "Ik heb hulp nodig" + default "Welke hulp is er voor mij?"; `zwareTaken>0` → "Help me met mijn zware taken" + "Hulp bij [taak]"). Herschreven naar één chip per dimensie: VOOR JOU / VOOR JE NAASTE / VERDER KIJKEN — labels variëren per niveau, trend, openstaande acties en check-in-status, maar de drie kolommen staan vast. | `components/dashboard/DashboardGerChat.tsx` |

### Ronde 7 — Dashboard-cleanup + B1-borging in prompt

| Verbetering | Effect | Bestand |
|---|---|---|
| **Dashboard opgeschoond** | "Artikelen voor jou"-blok en "Ger via WhatsApp"-QR verwijderd van het dashboard. Bijbehorende component-code en data-interface ook opgeruimd om dead code te voorkomen. | `app/(dashboard)/dashboard/page.tsx` |
| **B1-taalstijl strikter** | Max 15 woorden per zin (liever 8). Eén gedachte per zin. Aparte verboden-woordenlijst met alternatieven (ondersteuningsbehoefte → hulp, indiceren → kijken wat je nodig hebt, faciliteren → regelen, respijtzorg krijgt eerste-keer-uitleg). Pre-verzend check op woorden >3 lettergrepen. | `prompts/assistent.ts` |
| **Empathisch + oplossingsgericht + niet-belerend** | Nieuwe prompt-sectie met drie valkuilen (zielig maken / belerend zijn / alleen meeleven). Vaste formule: 1 zin verbinding + 1 concreet aanbod + 1 open vraag. Verbod op "je moet" / "je zou eigenlijk" / "het is belangrijk dat". Oplossingsgericht = opties bieden, niet verplichtingen opleggen. | `prompts/assistent.ts` |

### Ronde 6 — Robuustheid & analytics (iteratie 7-10)

| Verbetering | Effect | Bestand |
|---|---|---|
| **Schema-veld `lokaalGebonden`** | Admin kan per organisatie expliciet markeren "vereist fysieke aanwezigheid in deze stad". Override't de heuristiek in `bepaalGemeenteScope`. | `prisma/schema.prisma` (migratie nodig) |
| **AI-aanvulling op crisis-detectie** | Bij keyword-niveau "aandacht" volgt een snelle Haiku-call (~10 tokens) die kan upgraden naar "crisis". Vangt subtiele formuleringen die keywords missen. Faalt stil als AI niet bereikbaar is. | `crisis-ai-check.ts` (nieuw), `chat/route.ts` |
| **Tool-cleanup chat-route** | `bekijkTestTrend` en `gemeenteInfo` weggehaald uit `/api/ai/chat` — hun data staat al in pre-fetch en model riep ze toch zelden. Bespaart tool-description tokens per request. | `chat/route.ts` |
| **Vraagknop klik-tracking** | Klikken op `{{vraag:...}}` knoppen worden ook gelogd in `AiSuggestieClick` (type=VRAAGKNOP). Zo zien we welke gespreksrichtingen mantelzorgers kiezen. | `AiChat.tsx`, `suggestie-klik/route.ts` |
| **Lege-strook hint** | Als er nog geen suggesties zijn maar wel een gesprek loopt: subtiele tekst "Nog geen suggesties — Ger luistert eerst even mee." | `AiChat.tsx` |
| **Tool-status met kant + gemeente** | Tijdens `zoekHulpbronnen`: "Ger zoekt hulp voor jou als mantelzorger" of "Ger zoekt hulp bij een taak voor je naaste". | `AiChat.tsx` |
| **Datakwaliteit-log** | `bepaalKant` logt `console.warn` voor onbekende `onderdeelTest` waarden. Maakt content-curatie zichtbaar. | `hulp-categorisatie.ts` |
| **Vitest unit-tests** | Tests voor `bepaalKant`, `bepaalGemeenteScope`, `gemeentenVoorScope`, `prioritizeUnshown`, `toKeySet`. Voorkomt regressies in de classificatie-laag. | `__tests__/hulp-categorisatie.test.ts`, `__tests__/variation.test.ts` |

### Ronde 5 — Tweesplitsing structureel borgen + zoek-strategie per gemeente

| Verbetering | Effect | Bestand |
|---|---|---|
| **Centrale `hulp-categorisatie.ts`** | Eén bron van waarheid voor `Kant` ("mantelzorger" of "zorgvrager-taak") en `GemeenteScope` (lokaal-only / zorgvrager-only / beide). Vervangt fragiele keyword-logica. | `src/lib/ai/hulp-categorisatie.ts` (nieuw) |
| **Tool `zoekHulpbronnen` met verplichte `kant`** | AI moet expliciet kiezen welke kant voordat hij zoekt. Tool past automatisch juiste gemeente-scope toe per organisatie (lotgenoten alleen in jouw stad, mantelzorgmakelaar in beide). | `tools/hulpbronnen.ts` |
| **Pre-fetched context met twee gescheiden blokken** | "HULP VOOR JOU (mantelzorger)" met sub-secties (lotgenoten alleen in [stad] / overig in beide steden / landelijk) en "HULP BIJ TAKEN VOOR JE NAASTE (in [stad])" met taken per categorie. | `prefetch-context.ts` |
| **Prompt: TWEE-RICHTING-VRAAG + WAAR ZOEKT GER WAT** | Expliciete tweesplitsing als kernkompas; verbod op valse alternatieven ("praktisch vs praten"); uitleg waar Ger wat zoekt per soort hulp. | `prompts/assistent.ts` |
| **Opener-tegels: 2 in plaats van 3** | "Hulp voor mij zelf" en "Hulp bij een taak voor [naaste]" — geen losse "even praten"-tegel meer (zit in tegel 1). Sub-link "Liever je eigen vraag stellen? Type hieronder." | `opener/route.ts`, `AiChat.tsx` |

### Ronde 4 — Kostenbeheersing, robuustheid en analytics

| Verbetering | Effect | Bestand |
|---|---|---|
| **Anthropic prompt caching** | Stabiele deel van system-prompt (~6 KB) wordt gecached. Vervolgvragen binnen 5 min geven ~90% korting op input-kosten van dat blok. | `chat/route.ts`, `prompts/assistent.ts` (`buildStableSystem`) |
| **Artikelkaart via id-lookup** | Token wordt `{{artikelkaart:id\|titel\|emoji\|categorie}}` (4 velden, geen inhoud meer). Client haalt volledige inhoud lazy op via `/api/artikelen/[id]`. Robuust tegen `\|` in inhoud, bespaart tokens, altijd actuele content. Backwards-compatible met oude 5-veld syntax. | `tools/artikelen.ts`, `ArtikelKaart.tsx`, `assistent.ts` |
| **Klikgedrag-tracking** | Klikken op hulp- en artikelkaarten worden gelogd in nieuw `AiSuggestieClick` model. Basis voor latere ranking ("welke suggesties klikken mantelzorgers daadwerkelijk aan?"). Niet-blocking, faalt stil bij netwerkfout. | `prisma/schema.prisma`, `suggestie-klik/route.ts`, `HulpKaart.tsx`, `ArtikelKaart.tsx` |

**LET OP**: schema-wijziging vereist migratie. Run `npm run db:migrate` (development) of `npm run db:generate` + `prisma migrate deploy` (productie).

### Ronde 3 — Soepel geheel met expliciete tweesplitsing

| Verbetering | Effect | Bestand |
|---|---|---|
| **Keuze-tegels in welkomst** | Mantelzorger ziet meteen de richtingen: hulp voor mezelf / hulp bij taak voor naaste (in Ronde 5 teruggebracht naar 2 tegels — "even praten" valt onder kant 1) | `opener/route.ts`, `AiChat.tsx` |
| **Personalisering met naaste-naam** | Tegel "Hulp bij een taak voor [naam]" toont naam van zorgvrager als bekend; actie verwijst direct naar zwaarste taak | `opener/route.ts` |
| **Twee-richting-vraag in prompt** | Bij vage starten ("ik weet het niet meer") biedt Ger actief A vs B keuze aan via vraagknoppen | `assistent.ts` |
| **Tempo-regel** | Bericht 2+ moet direct concreet zijn, geen warm opstartzinnetje meer; info-vraag → direct artikelkaart, hulp-vraag → direct hulpkaart | `assistent.ts` |
| **Elk bericht een aanbod** | Praten zonder iets aan te bieden mag alleen bij echte emotionele momenten | `assistent.ts` |
| **Niet meer altijd combineren** | Als gebruiker een kant koos, blijft Ger daarin (was: ALTIJD beide). Combineren alleen bij puur brede vraag zonder gemaakte keuze | `assistent.ts` |

### Ronde 1 + 2 — kernverbeteringen

| Verbetering | Effect | Bestand |
|---|---|---|
| Antwoorden korter | `maxOutputTokens` 2048 → 600; prompt naar **max 3 zinnen** | `chat/route.ts`, `assistent.ts` |
| Beide doelgroepen verplicht (vervangen in Ronde 5) | Bij brede vragen ALTIJD 1 hulp voor zorgvrager + 1 voor mantelzorger. **Ronde 5** heeft dit vervangen door: bij brede vraag ALLEEN tweesplitsing tonen, gebruiker kiest, daarna eenkant. | `assistent.ts` |
| Meer kaarten per beurt | 1-2 hulp + 1-2 artikelen toegestaan (was: kies één type) | `assistent.ts` |
| Cumulatieve verzameling | Kaarten stapelen onder input, dedupe, cap 6+6 | `AiChat.tsx` |
| Proactieve opener | `/api/ai/opener` geeft per balanstest passende begroeting + 3 startknoppen | `opener/route.ts` |
| Vraagknoppen 2 → 3 | Variatie-instructie: verdiepen / wisselen / nieuw onderwerp; klikken worden gelogd | `assistent.ts`, `AiChat.tsx` |
| Tool-status in UI | "Ger zoekt lokale hulp..." i.p.v. "Ger typt..." | `AiChat.tsx` |
| Variatie in openers | 5 soorten verbinding; verbod op clichés ("Wat een goede vraag", "Ik begrijp dat...") | `assistent.ts` |
| Gespreksflow bij korte antwoorden | Bij "ja"/"weet niet": pak iets uit context en vraag concreet door | `assistent.ts` |
| Variatie in suggesties | Eerder getoonde hulp/artikelen worden in tools + pre-fetch zacht gedeprioriteerd | `variation.ts`, `tools/*`, `prefetch-context.ts` |

---

## 16. Bekende beperkingen & open punten

- ~~**Geen cross-session-geheugen voor gesprekken zelf**~~ — opgelost in Ronde 11 via `GesprekSamenvatting` (zie sectie 15).
- **Prompt-redundantie nog niet opgeschoond**: ~30-40% van de prompt (`balanscoach.ts`) bevat herhalingen ("verzin geen taken" 4×, "B1" 6×, "één onderwerp per bericht" 5×). Bewust uitgesteld omdat bulk-edit subtiele nuances kan wegnemen — toekomstige ronde.
- ~~**Geen telemetrie / observability**~~ — opgelost in Ronde 16 via `AiInteractie`-model (zie sectie 15). Vereist nog DB-migratie via `prisma/ai-interactie.sql`. Routes `chat`, `welkom`, `checkin` volgen in een latere ronde.
- **Geen multi-modal**: alleen tekst. Geen foto's of stem.
- **Tweesplitsing + variatie nog niet overal**: `/api/ai/balanscoach` deelt sinds Ronde 8 dezelfde `prefetchUserContext` + `buildContextBlock` als `/api/ai/chat`, maar de aanroepende frontends (`FloatingGerChat`, `DashboardGerChat`) sturen `shownHulpbronnen` nog niet mee. `/checkin` en `/welkom` lopen ook nog niet via die laag.
- **Geen A/B-testing van prompts**: aanpassingen aan het systeem-prompt gaan direct naar productie zonder framework om varianten te vergelijken.
- **Lotgenoten-detectie blijft heuristisch waar `lokaalGebonden` niet expliciet gezet is**: false negatives mogelijk bij organisaties die wel praatgroep zijn maar geen keyword in de naam hebben. Curatie via admin-UI is volgende stap.
- **`AiSuggestieClick` wordt nog niet teruggevoerd in ranking**: gegevens worden verzameld maar er is nog geen analyse/ranking-functie bovenop. Eerste stap was logging; ranking volgt zodra er voldoende data is.
- **Latency**: pre-fetch + Anthropic-call duurt typisch 2-5 seconden voor het eerste token. Bij `aandacht`-niveau wordt daar nog een Haiku-verificatie aan toegevoegd (~500ms extra). Prompt caching beperkt de latency-impact bij vervolgvragen.

---

## 17. Snelle referentie

| Vraag | Antwoord |
|---|---|
| Welk model gebruikt Ger? | Claude Haiku 4.5 (`claude-haiku-4-5-20251001`) |
| Waar staat zijn persona/prompt? | `src/lib/ai/prompts/assistent.ts` |
| Hoe wordt hij "getraind"? | Niet via fine-tuning — via systeem-prompt + pre-fetched context + tools |
| Welke API roept hij aan? | Anthropic Messages API via `@ai-sdk/anthropic` |
| Waar slaat hij gesprekken op? | Browser-localStorage (niet in DB) |
| Hoe weet hij wat de gebruiker doormaakt? | Pre-fetched context uit balanstest, hulpbronnen, gemeente, voorkeuren |
| Waar zitten zijn tools? | `src/lib/ai/tools/` (op chat-route: `zoekHulpbronnen`, `zoekArtikelen`, `semantischZoeken`, `slaActiepuntOp`) |
| Wat gebeurt er bij een crisis? | Tweelaagse check: keywords + AI-verificatie. Bij crisis vast protocol (113, huisarts, Mantelzorglijn) |
| Hoe pas ik zijn toon aan? | Bewerk het prompt in `assistent.ts` |
| Hoe lang mag een antwoord zijn? | `maxOutputTokens: 600` + prompt: max 3 zinnen, max 15 woorden per zin |
| Welk taalniveau? | Strikt B1. Verboden-woordenlijst in prompt met B1-alternatieven. |
| Hoe houdt Ger het empathisch maar oplossingsgericht? | Vaste formule per bericht: 1 zin verbinding + 1 concreet aanbod + 1 open vraag. Verbod op "je moet" / "je zou eigenlijk" / "het is belangrijk dat". |
| Wat is de eerste vraag? | Twee keuze-tegels: "Hulp voor mij zelf" of "Hulp bij een taak voor [naaste]". Praten valt onder de eerste. |
| Hoe weet Ger waar hij moet zoeken? | `kant` parameter in `zoekHulpbronnen` (verplicht) + `bepaalGemeenteScope` per organisatie |
| Lotgenoten in welke stad? | Alleen mantelzorger-stad |
| Mantelzorgmakelaar in welke stad? | Beide steden (mantelzorger én zorgvrager) |
| Hulp bij boodschappen? | Alleen zorgvrager-stad |
| Toont hij hulp voor zorgvrager én mantelzorger? | Volgt de keuze van de gebruiker. Bij brede vraag: tweesplitsing aanbieden, niet combineren. |
| Hoe snel komt er concreet advies? | Vanaf bericht 2 verplicht: elk bericht bevat minstens een hulpkaart, artikelkaart of tweesplitsing |
| Kan de gebruiker artikelen opslaan? | Ja, via hartje in ContentModal → `Favoriet`-tabel |
| Blijven kaarten in beeld? | Ja, cumulatief onder de chat (max 6 hulp + 6 artikelen) |
| Hoe weet de gebruiker wat Ger doet? | Tool-status in loading-bubble: "Ger zoekt hulp voor jou als mantelzorger..." (kant zichtbaar) |
| Worden klikken gelogd? | Ja: hulpkaart-klik, artikelkaart-klik én vraagknop-klik in `AiSuggestieClick` |
| Waarom Haiku en geen Sonnet? | 4× goedkoper; voor coachende dialoog ruim voldoende |
