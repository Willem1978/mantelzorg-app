# AI-Chatbot Ger — Technisch & Functioneel Overzicht

Dit document beschrijft hoe de AI-chatbot **Ger** in MantelBuddy werkt: welk model, hoe hij wordt aangestuurd ("getraind" via prompt en context), welke koppelingen hij heeft naar de database en externe systemen, welke hulpmiddelen (tools) hij tot zijn beschikking heeft en welke gedragsregels hem warm én kort houden.

> Laatste update: na implementatie van Ronde 1 + Ronde 2 UX-verbeteringen (kortere antwoorden, beide doelgroepen, cumulatieve kaartverzameling, proactieve opener, tool-status, variatie-regels).

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

### De opener-route (nieuw)

`/api/ai/opener` is bewust **geen** AI-call: de welkomstzin moet binnen 200 ms beschikbaar zijn voor first paint van de chat. De route leest de laatste balanstest en bouwt op basis van het belastingsniveau en het zwaarste deelgebied/zwaarste taak een passende begroeting + 3 startknoppen:

| Niveau | Voorbeeld-opener | Startknoppen |
|---|---|---|
| **HOOG** | "Fijn dat je er bent. Ik zie dat **fysieke belasting** op dit moment het meeste van je vraagt. Zal ik daar mee beginnen?" | "Vertel meer over fysieke belasting" / "Welke hulp kan mij ontlasten?" / "Ik wil het over iets anders hebben" |
| **GEMIDDELD** | "Goed dat je er bent. **Huishoudelijke taken** kost je relatief veel tijd — wil je kijken hoe dat lichter kan?" | "Hulp bij huishoudelijke taken" / "Tips voor mezelf" / "Hoe gaat het met mij?" |
| **LAAG** | "Goed dat je er bent. Het gaat eigenlijk best goed met je balans — knap! Wat houdt je vandaag bezig?" | "Tips om het zo te houden" / "Iets over mezelf vertellen" / "Welke hulp is er in de buurt?" |
| **Geen test** | Nudge naar balanstest + uitnodiging om wel te starten | "Ik wil de balanstest doen" / "Ik wil eerst even praten" / "Welke hulp is er bij mij in de buurt?" |

Frontend (`AiChat.tsx`) haalt dit op bij mount, valt terug op generieke tekst bij fout.

---

## 5. Het systeem-prompt (de "training" van Ger)

Het hart van Ger zit in `src/lib/ai/prompts/assistent.ts`. Dit prompt is opgebouwd uit duidelijk gemarkeerde secties die zijn gedrag definiëren:

| Sectie | Wat erin staat |
|---|---|
| **Grondhouding** | Niet belerend, niet medelijdend; uitgaan van kracht; warm en respectvol |
| **Gespreksstijl** | Warme buurvrouw-toon; **HARD limit max 3 zinnen** per beurt; geen inleidingen, samenvattingen of afsluitingen; geen lijsten |
| **Taalstijl (B1)** | Korte zinnen (max 15 woorden), geen jargon, actief, scanbaar, geen genummerde lijsten |
| **Gespreksvoering** | 4-stappen flow: Verbinding → Verdieping → Eén concreet advies → Open uitnodiging |
| **Variatie in openers** | 5 soorten verbinding mogelijk; verboden clichés ("Wat een goede vraag", "Ik begrijp dat...", "Wat moedig dat je dit deelt"); "Dat herken ik" max 1× per gesprek |
| **Gesprekscontinuïteit** | Bij korte/vage antwoorden ("ja", "weet niet"): pak iets uit de context (zware taak, open actiepunt) en vraag concreet door |
| **Omgaan met context** | Pre-fetched data is al beschikbaar; nooit samenvatten, alleen onzichtbaar verweven |
| **Gedrag per belastingniveau** | HOOG: proactief, mantelzorglijn / GEMIDDELD: één concrete actie / LAAG: complimenteren |
| **Twee-doelgroepen-regel** | Bij brede vragen ALTIJD 1 hulp voor de zorgvrager + 1 hulp voor de mantelzorger zelf combineren |
| **Hulp + artikel combineren** | Bij emotionele onderwerpen (slaap, schuldgevoel, eenzaamheid): hulpkaart (actie) **én** artikelkaart (lezen/bewaren) in hetzelfde bericht |
| **Zorgtaken** | Eén taak per bericht, beginnen met de zwaarste; "eerste stap" benoemen voor nieuwe gebruikers |
| **Actiepunten** | Concreet advies opslaan via tool, in volgend gesprek opvolgen |
| **Crisisdetectie** | Empathie eerst, dan praktisch; bij acute nood doorverwijzen naar 113 / huisarts / Veilig Thuis |
| **Output-syntax** | Hulpkaart, artikelkaart, navigatie-knop, vraag-knop — exacte syntax + max-aantallen per bericht |
| **Tool-instructies** | Tools alléén als pre-fetched context niet voldoende is |
| **Niet doen** | Verzin geen telefoonnummers; geen medisch advies; geen herhaling van eerder getoonde kaarten; nooit langer dan 3 zinnen |
| **App-pagina's** | Lijst van interne paden voor `{{knop:...}}` actieknoppen |

Aan dit basis-prompt worden **dynamisch toegevoegd** door `buildAssistentPrompt()`:

1. De gemeenten van mantelzorger en zorgvrager (twee-gemeentes-systeem),
2. Het volledige **context-blok** uit `prefetchUserContext()` (zie volgende sectie).

### Lengte-regels (cruciaal voor coachende ervaring)

Vroeger neigden antwoorden naar 6-10 zinnen met inleiding én samenvatting. Nu strikt:

- `maxOutputTokens: 600` — hard plafond op het model.
- Prompt-regel: **max 3 zinnen conversatietekst per beurt**, liever 2.
- Geen "Wat een goede vraag", geen "Hopelijk helpt dit", geen "Dus om het kort te zeggen".
- Korte zin = klein cadeautje. Lange zin = lezing.

### Output-syntax die Ger leert genereren

In zijn antwoord kan Ger speciale tokens plaatsen die de frontend dan rendert als interactieve UI-elementen:

| Token | Voorbeeld | Wat de frontend doet |
|---|---|---|
| `{{hulpkaart:Naam\|Dienst\|Beschrijving\|Tel\|Web\|Gemeente\|Kosten\|Tijden}}` | Lokale zorgorganisatie | Klikbare amberkleurige kaart → opent ContentModal met bel/website-knoppen + favoriet-knop |
| `{{artikelkaart:Titel\|Beschrijving\|Emoji\|Categorie\|Inhoud}}` | Tip- of info-artikel | Klikbare groene kaart → opent ContentModal met volledige tekst + favoriet-knop + mail-knop |
| `{{knop:Label:/pad}}` | Navigatie-knop | Knop die naar een interne pagina linkt |
| `{{vraag:Vraagtekst}}` | Vervolgvraag | Knop onder input die direct die vraag verstuurt |

**Per bericht**: maximaal 4 kaarten in totaal — typisch 1-2 hulpkaarten + 1-2 artikelkaarten. Plus 3 vraagknoppen onderaan. Parsing gebeurt in `src/components/ai/HulpKaart.tsx`, `ArtikelKaart.tsx` en `AiChat.tsx`.

---

## 6. Pre-fetched gebruikerscontext

Voor élk chatverzoek wordt eerst `prefetchUserContext()` (`src/lib/ai/prefetch-context.ts`) aangeroepen. Die haalt in één keer alles op wat Ger nodig kan hebben en zet het als een tekstblok onderaan het systeem-prompt. Resultaat: Ger hoeft géén tools meer aan te roepen voor standaardvragen → snel én goedkoper (minder tokens).

### Wat er wordt opgehaald

| Bron (Prisma-model) | Inhoud |
|---|---|
| `Caregiver` | Aandoening, voorkeuren (tags & categorieën), al gekoppelde organisaties |
| `BelastbaarheidTest` | Laatste test: totaalscore, niveau, zorguren, deelgebieden, alarmen |
| `TaakSelectie` | Geselecteerde zorgtaken + uren + moeilijkheid |
| `Zorgorganisatie` (3×) | Hulp per zware taak, hulp per categorie, hulp voor de mantelzorger zelf |
| `Actiepunt` | Openstaande actiepunten uit eerdere gesprekken |
| `WeekKaart` | Kaarten van deze week (voltooid + open) |
| `Gemeente`-resolver | Gemeente-specifiek mantelzorgloket (als geconfigureerd) |
| Coach-adviezen | Adviesteksten per deelgebied/niveau (uit static config) |

### Twee-gemeentes-systeem

Cruciaal detail: een mantelzorger in Arnhem kan zorgen voor een naaste in Zutphen. Hulp wordt daarom in twee gemeenten gezocht en in **gescheiden blokken** in de prompt geplaatst:

- **Zorgtaken** (boodschappen, verzorging, klusjes) → gemeente van de **zorgvrager** → blok `HULP BIJ ZWARE ZORGTAKEN`
- **Mantelzorger-hulp** (steunpunt, emotioneel, lotgenoten) → gemeente van de **mantelzorger** → blok `HULP VOOR JOU (mantelzorger)`

De prompt instrueert Ger om bij brede vragen **uit beide blokken** te kiezen en te combineren in één bericht. Categorie-routing in `zoekHulpbronnen` werkt op basis van keywords (`emotioneel`, `steunpunt`, `respijt` etc.).

### Variatie tussen chat-beurten

De pre-fetch-functie krijgt nu een `options.shownHulpbronnen` mee — een lijst met namen van hulpkaarten die Ger in eerdere beurten al heeft getoond. Items in die lijst worden **zacht gedeprioriteerd**: ze gaan achteraan in de gesorteerde resultaten, maar verdwijnen niet (bij gemeenten met weinig hulpbronnen blijven ze beschikbaar). Binnen elke subgroep wordt geshuffeld via `prioritizeUnshown` (`src/lib/ai/variation.ts`).

---

## 7. Tools (function calling)

Ger kan tijdens een gesprek tools aanroepen voor extra zoekopdrachten. Definities in `src/lib/ai/tools/`. Het taalmodel beslist zelf wanneer en met welke parameters.

| Tool | Doel | Status-label in UI tijdens uitvoering |
|---|---|---|
| `bekijkTestTrend` | Vergelijking met eerdere balanstesten | "Ger bekijkt jouw balans-trend" |
| `zoekHulpbronnen` | Zoek lokale zorgorganisaties | "Ger zoekt lokale hulp voor je" |
| `zoekArtikelen` | Zoek info-artikelen | "Ger zoekt artikelen die kunnen helpen" |
| `gemeenteInfo` | Mantelzorgloket-contact per gemeente | "Ger bekijkt info van jouw gemeente" |
| `semantischZoeken` | Vector similarity search | "Ger zoekt informatie over dit onderwerp" |
| `slaActiepuntOp` | Concreet advies opslaan voor opvolging | "Ger noteert dit voor je" |
| `bekijkBalanstest` | Volledige test-resultaten ophalen | "Ger bekijkt jouw balanstest" |
| `bekijkCheckInTrend` | Maandelijkse check-in trends | "Ger bekijkt je check-in trend" |
| `bekijkGebruikerStatus` | Profiel + test-status + voltooiingspercentage | — |
| `bekijkGemeenteAdvies` | Gemeente-specifiek advies (config) | "Ger zoekt advies in jouw gemeente" |
| `genereerRapportSamenvatting` | Genereer + sla PDF-rapport op | "Ger maakt een samenvatting" |
| `registreerAlarm` | Crisissignaal vastleggen | "Ger zet dit veilig in je dossier" |

Op de hoofdchat (`/api/ai/chat`) zijn nu **6 tools** actief: `bekijkTestTrend`, `zoekHulpbronnen`, `zoekArtikelen`, `gemeenteInfo`, `semantischZoeken`, `slaActiepuntOp`. De andere zijn beschikbaar in andere routes (balanscoach/checkin) of admin-agents.

`stopWhen: stepCountIs(7)` betekent: maximaal 7 stappen (tool-calls + finale tekst) per turn — voorkomt loops.

### Variatie in tool-resultaten

`zoekHulpbronnen` en `zoekArtikelen` halen sinds [PR #345](https://github.com/Willem1978/mantelzorg-app/pull/345) een **ruimere set** op (15-24 records) en passen `prioritizeUnshown` toe op basis van `shownNamen` / `shownTitels` die de client meestuurt. Resultaat: bij dezelfde zoekvraag in dezelfde gemeente komen telkens andere organisaties bovendrijven.

### Tool-status zichtbaar in UI

`AiChat.tsx` inspecteert het laatste assistant-bericht tijdens streaming: als er een part van het type `tool-<naam>` aanwezig is, mapt het via `TOOL_STATUS` naar een mensvriendelijk Nederlands label dat in de loading-bubble verschijnt. Defensief gelezen zodat het werkt met meerdere AI SDK-versies. Geen tool actief? Dan toont de bubble simpelweg "Ger typt…".

---

## 8. Crisis-detectie

Vóórdat het AI-model überhaupt wordt aangesproken, wordt het laatste gebruikersbericht door `detecteerCrisis()` gescand (`src/lib/ai/crisis-detector.ts`).

### Niveaus

| Niveau | Trigger | Reactie |
|---|---|---|
| `none` | Geen signalen | Normaal AI-antwoord |
| `attention` | 1 keyword-match | AI antwoordt, maar met extra crisis-context in het prompt |
| `crisis` | 2+ matches of expliciete keywords ("zelfmoord", "ik kan niet meer") | **Geen AI-call**: vast protocol-antwoord met 113, huisarts en Mantelzorglijn |

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

1. **Bij mount**: `GET /api/ai/opener` → opener-tekst + 3 vraagknoppen tonen (gepersonaliseerd op basis van balanstest)
2. **Gebruiker** typt of klikt op een vraagknop → `sendMessage({ text })`
3. **`prepareSendMessagesRequest`** callback:
   - Converteert UI-berichten (parts-format) naar model-berichten (content-format)
   - Filtert lege berichten (tool-call stappen zonder tekst)
   - Verzamelt eerdere `{{hulpkaart:...}}`-namen en `{{artikelkaart:...}}`-titels uit de message-history
   - Stuurt mee als `shownHulpbronnen` / `shownArtikelen` in de body
4. **Server** streamt antwoord-tokens terug
5. **Tijdens streaming**:
   - Loading-bubble toont tool-status als Ger een tool aanroept ("Ger zoekt lokale hulp voor je")
   - `parseHulpkaarten`, `parseArtikelkaarten`, `parseButtons` halen tokens uit de tekst en renderen ze los buiten de spreekbubble
6. **Cumulatieve verzameling**: een `useEffect` loopt na elke nieuwe assistant-message door **alle** assistant-berichten heen, dedupliceert op naam/titel en zet de top-6 hulp + top-6 artikelen onder de input. Verdwijnen doen ze pas als de cap wordt overschreden.

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
| **Crisis-detector** | Vóór elke AI-call | Voorkomt dat AI iets schadelijks zegt bij echte nood |
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
| **Crisis-keywords / hulplijnen** | `src/lib/ai/crisis-detector.ts` |
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
│   ├── opener/route.ts          ← gepersonaliseerde welkomstzin (geen AI-call)
│   ├── chat/route.ts            ← hoofd-chat endpoint
│   ├── welkom/route.ts          ← publieke chat (rate-limited)
│   ├── balanscoach/route.ts     ← coach met test-context
│   ├── checkin/route.ts         ← maandelijkse check-in
│   ├── embeddings/route.ts      ← embedding generatie
│   └── admin/                   ← admin-agents
│
├── lib/ai/
│   ├── models.ts                ← model-keuze per agent (Haiku/Sonnet/Opus)
│   ├── variation.ts             ← shuffle + prioritizeUnshown helpers
│   ├── crisis-detector.ts       ← keyword-detectie + vast protocol
│   ├── prefetch-context.ts      ← gebruikersdata vooraf ophalen + variatie
│   ├── embeddings.ts            ← OpenAI embedding service
│   ├── coach-advies.ts          ← static coach-tips per deelgebied
│   ├── gemeente-resolver.ts     ← gemeente-contact lookup
│   ├── prompts/
│   │   ├── assistent.ts         ← Ger's hoofdprompt (chat) — variatie + 3 zinnen
│   │   ├── welkom.ts            ← homepage Ger
│   │   ├── balanscoach.ts       ← coach
│   │   └── checkin-buddy.ts     ← check-in
│   ├── tools/                   ← function-calling tools (met variatie)
│   └── agents/                  ← complexe AI-agents (hulpbron-zoeker, validator)
│
└── components/ai/
    ├── AiChat.tsx               ← hoofdchat-UI (useChat + transport + cumulatief)
    ├── HulpKaart.tsx            ← parser + render van {{hulpkaart:...}}
    ├── ArtikelKaart.tsx         ← parser + render van {{artikelkaart:...}}
    ├── GerAvatar.tsx            ← avatar-component
    ├── GerHeroChat.tsx          ← hero-variant
    ├── FloatingGerChat.tsx      ← floating widget
    └── PublicGerChat.tsx        ← anonieme variant
```

---

## 15. Recente verbeteringen (Ronde 1 + 2)

| Verbetering | Effect | Bestand |
|---|---|---|
| Antwoorden korter | `maxOutputTokens` 2048 → 600; prompt naar **max 3 zinnen** | `chat/route.ts`, `assistent.ts` |
| Beide doelgroepen verplicht | Bij brede vragen ALTIJD 1 hulp voor zorgvrager + 1 voor mantelzorger | `assistent.ts` |
| Meer kaarten per beurt | 1-2 hulp + 1-2 artikelen toegestaan (was: kies één type) | `assistent.ts` |
| Cumulatieve verzameling | Kaarten stapelen onder input, dedupe, cap 6+6 | `AiChat.tsx` |
| Proactieve opener | `/api/ai/opener` geeft per balanstest passende begroeting + 3 startknoppen | `opener/route.ts` |
| Vraagknoppen 2 → 3 | Variatie-instructie: verdiepen / wisselen / nieuw onderwerp | `assistent.ts`, `AiChat.tsx` |
| Tool-status in UI | "Ger zoekt lokale hulp..." i.p.v. "Ger typt..." | `AiChat.tsx` |
| Variatie in openers | 5 soorten verbinding; verbod op clichés ("Wat een goede vraag", "Ik begrijp dat...") | `assistent.ts` |
| Gespreksflow bij korte antwoorden | Bij "ja"/"weet niet": pak iets uit context en vraag concreet door | `assistent.ts` |
| Variatie in suggesties | Eerder getoonde hulp/artikelen worden in tools + pre-fetch zacht gedeprioriteerd | `variation.ts`, `tools/*`, `prefetch-context.ts` |

---

## 16. Bekende beperkingen & open punten

- **Geen cross-session-geheugen voor gesprekken zelf**: Ger weet niet wat hij vorige week zei — alleen open `Actiepunten` worden meegenomen.
- **Geen multi-modal**: alleen tekst. Geen foto's of stem.
- **Variatie alleen op de hoofdchat**: `/api/ai/balanscoach`, `/checkin` en `/welkom` accepteren de `shownNamen`/`shownTitels` parameters wel via tool-signature, maar wiren ze nog niet door vanuit hun eigen frontends.
- **Geen A/B-testing van prompts**: aanpassingen aan het systeem-prompt gaan direct naar productie zonder framework om varianten te vergelijken.
- **Geen prompt-caching**: het systeem-prompt + pre-fetched context wordt elk request opnieuw verstuurd. Anthropic prompt caching kan input-kosten met ~90% verlagen voor vervolgvragen.
- **Crisis-detectie keyword-based**: kan subtiele signalen missen. Te overwegen: aparte snelle moderatie-call met Haiku voor signalen die geen keyword raken.
- **Artikel-`inhoud` via tekst-token**: als de inhoud een `|` bevat kan de parser haperen. Robuuster zou zijn: alleen artikel-id meegeven en client haalt inhoud uit DB.
- **Geen klikgedrag-tracking**: we weten niet welke kaarten mantelzorgers nuttig vinden — handig voor latere ranking.
- **Latency**: pre-fetch + Anthropic-call duurt typisch 2-5 seconden voor het eerste token. Bij veel hulpbronnen in de context kan dit oplopen.

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
| Waar zitten zijn tools? | `src/lib/ai/tools/` |
| Wat gebeurt er bij een crisis? | Vast protocol vóór AI-call (113, huisarts, Mantelzorglijn) |
| Hoe pas ik zijn toon aan? | Bewerk het prompt in `assistent.ts` |
| Hoe lang mag een antwoord zijn? | `maxOutputTokens: 600` + prompt: max 3 zinnen |
| Toont hij hulp voor zorgvrager én mantelzorger? | Ja, bij brede vragen verplicht beide combineren |
| Kan de gebruiker artikelen opslaan? | Ja, via hartje in ContentModal → `Favoriet`-tabel |
| Blijven kaarten in beeld? | Ja, cumulatief onder de chat (max 6 hulp + 6 artikelen) |
| Hoe weet de gebruiker wat Ger doet? | Tool-status in loading-bubble: "Ger zoekt lokale hulp voor je..." |
| Waarom Haiku en geen Sonnet? | 4× goedkoper; voor coachende dialoog ruim voldoende |
