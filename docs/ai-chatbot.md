# AI-Chatbot Ger — Technisch & Functioneel Overzicht

Dit document beschrijft hoe de AI-chatbot **Ger** in MantelBuddy werkt: welk model, hoe hij wordt aangestuurd ("getraind" via prompts en context), welke koppelingen hij heeft naar de database en externe systemen, en welke hulpmiddelen (tools) hij tot zijn beschikking heeft.

---

## 1. Wat is Ger?

Ger is de digitale mantelzorgcoach in de app. Hij is geen hulpverlener, maar een warm, vriendelijk gespreksaanknooppunt dat:

- meedenkt met mantelzorgers in B1-taalniveau (eenvoudig Nederlands),
- relevante lokale hulpbronnen voorstelt op basis van gemeente en zorgsituatie,
- artikelen en tips toont die de gebruiker kan lezen, opslaan als favoriet of mailen,
- waarschuwt bij signalen van crisis en doorverwijst naar 113 / Mantelzorglijn,
- actiepunten kan vastleggen voor opvolging in een volgend gesprek.

Ger is **niet getraind** in de klassieke zin (geen fine-tuning). Zijn gedrag wordt volledig gestuurd door:

1. Het keuze van het taalmodel (Anthropic Claude Haiku 4.5),
2. Een uitgebreid **systeem-prompt** dat zijn persona, stijl en gedragsregels beschrijft,
3. **Pre-fetched gebruikerscontext** (balanstest, hulpbronnen, gemeente, voorkeuren),
4. **Tools** die hij tijdens een gesprek kan aanroepen voor extra zoekopdrachten,
5. Een **crisis-detector** die voor de AI-call al ingrijpt bij gevaarlijke situaties.

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

Model-keuze per agent staat centraal in `src/lib/ai/models.ts` in het `AGENT_MODELS`-object. Wijzig daar als een agent een ander model moet krijgen.

**Waarom Haiku voor user-facing chat?** Kostenoptimalisatie. Haiku 4.5 is ongeveer 4× goedkoper dan Sonnet en 18× goedkoper dan Opus, terwijl het voor coachende dialoog ruim voldoende is. Sonnet wordt alleen ingezet voor admin-werk (content-curatie, analyse) waar diepere redenering nodig is.

---

## 3. Architectuuroverzicht (high-level)

```
┌──────────────────┐     POST /api/ai/chat      ┌──────────────────────┐
│                  │  ─────────────────────────►│                      │
│  AiChat.tsx      │  body: messages,            │  /api/ai/chat        │
│  (browser)       │        shownHulpbronnen,    │  (Next.js route)     │
│                  │◄ ─────────────────────────  │                      │
│  - useChat hook  │     SSE stream              │  1. Auth check       │
│  - parseHulp/    │     (tekst + tool-steps)    │  2. Crisis-detector  │
│    artikelkaart  │                             │  3. Prefetch context │
│  - knoppen       │                             │  4. streamText()     │
│  - localStorage  │                             │     ├ Claude Haiku   │
└──────────────────┘                             │     ├ system-prompt  │
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
- **Pre-fetch boven tools**: gebruikersdata (test, hulpbronnen, gemeente) wordt vóór de AI-call al uit de DB gehaald en in de system-prompt geïnjecteerd. Dat scheelt 1-2 tool-call rondes en daarmee 10-15 seconden latency.
- **Geen persistente chatgeschiedenis**: berichten staan in browser-localStorage (via Vercel AI SDK), niet in de database. Per device / per logout begint een nieuw gesprek.
- **Sessie-scoped variatie**: de client stuurt namen van eerder getoonde hulpbronnen en artikelen mee, zodat Ger elke beurt iets nieuws kan voorstellen. Geen DB-state.

---

## 4. API-routes (welke chats er zijn)

Alle routes leven onder `src/app/api/ai/`.

| Route | Agent-key | Doel | Auth | Rate-limit |
|---|---|---|---|---|
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

---

## 5. Het systeem-prompt (de "training" van Ger)

Het hart van Ger zit in `src/lib/ai/prompts/assistent.ts`. Dit prompt is opgebouwd uit duidelijk gemarkeerde secties die zijn gedrag definiëren:

| Sectie | Wat erin staat |
|---|---|
| **Grondhouding** | Niet belerend, niet medelijdend; uitgaan van kracht; warm en respectvol |
| **Gespreksstijl** | Praat als warme buurvrouw; geen lijsten; max 4-5 zinnen; eindigen met open vraag |
| **Taalstijl (B1)** | Korte zinnen (max 15 woorden), geen jargon, actief, scanbaar, geen genummerde lijsten |
| **Gespreksvoering** | 4-stappen flow: Verbinding → Verdieping → Eén concreet advies → Open uitnodiging |
| **Omgaan met context** | Pre-fetched data is al beschikbaar; nooit samenvatten, alleen onzichtbaar verweven |
| **Gedrag per belastingniveau** | HOOG: proactief, mantelzorglijn / GEMIDDELD: één concrete actie / LAAG: complimenteren |
| **Zorgtaken** | Eén taak per bericht, beginnen met de zwaarste; "eerste stap" benoemen voor nieuwe gebruikers |
| **Actiepunten** | Concreet advies opslaan via tool, in volgend gesprek opvolgen |
| **Crisisdetectie** | Empathie eerst, dan praktisch; bij acute nood doorverwijzen naar 113 / huisarts / Veilig Thuis |
| **Output-syntax** | Hulpkaart, artikelkaart, navigatie-knop, vraag-knop — exacte syntax + max-aantallen |
| **Tool-instructies** | Tools alléén als pre-fetched context niet voldoende is |
| **Niet doen** | Verzin geen telefoonnummers; geen medisch advies; geen herhaling van eerder getoonde kaarten |
| **App-pagina's** | Lijst van interne paden voor `{{knop:...}}` actieknoppen |

Aan dit basis-prompt worden **dynamisch toegevoegd** door `buildAssistentPrompt()`:

1. De gemeenten van mantelzorger en zorgvrager (twee-gemeentes-systeem),
2. Het volledige **context-blok** uit `prefetchUserContext()` (zie volgende sectie).

### Output-syntax die Ger leert genereren

In zijn antwoord kan Ger speciale tokens plaatsen die de frontend dan rendert als interactieve UI-elementen:

| Token | Voorbeeld | Wat de frontend doet |
|---|---|---|
| `{{hulpkaart:Naam\|Dienst\|Beschrijving\|Tel\|Web\|Gemeente\|Kosten\|Tijden}}` | Lokale zorgorganisatie | Klikbare amberkleurige kaart → opent ContentModal met bel/website-knoppen + favoriet-knop |
| `{{artikelkaart:Titel\|Beschrijving\|Emoji\|Categorie\|Inhoud}}` | Tip- of info-artikel | Klikbare groene kaart → opent ContentModal met volledige tekst + favoriet-knop + mail-knop |
| `{{knop:Label:/pad}}` | Navigatie-knop | Knop die naar een interne pagina linkt |
| `{{vraag:Vraagtekst}}` | Vervolgvraag | Knop onder input die direct die vraag verstuurt |

Parsing gebeurt in `src/components/ai/HulpKaart.tsx`, `ArtikelKaart.tsx` en `AiChat.tsx`.

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

Cruciaal detail: een mantelzorger in Arnhem kan zorgen voor een naaste in Zutphen. Hulp wordt daarom in twee gemeenten gezocht:

- **Zorgtaken** (boodschappen, verzorging, klusjes) → gemeente van de **zorgvrager**
- **Mantelzorger-hulp** (steunpunt, emotioneel, lotgenoten) → gemeente van de **mantelzorger**

Dat onderscheid wordt gemaakt in zowel `prefetch-context.ts` als in de `zoekHulpbronnen`-tool, op basis van categorie-keywords (`emotioneel`, `steunpunt`, `respijt` etc.).

### Variatie tussen chat-beurten

De pre-fetch-functie krijgt nu een `options.shownHulpbronnen` mee — een lijst met namen van hulpkaarten die Ger in eerdere beurten al heeft getoond. Items in die lijst worden **zacht gedeprioriteerd**: ze gaan achteraan in de gesorteerde resultaten, maar verdwijnen niet (bij gemeenten met weinig hulpbronnen blijven ze beschikbaar). Binnen elke subgroep wordt geshuffeld via `prioritizeUnshown` (`src/lib/ai/variation.ts`).

---

## 7. Tools (function calling)

Ger kan tijdens een gesprek tools aanroepen voor extra zoekopdrachten. Definities in `src/lib/ai/tools/`. Het taalmodel beslist zelf wanneer en met welke parameters.

| Tool | Doel | Belangrijke kenmerken |
|---|---|---|
| `bekijkTestTrend` | Vergelijking met eerdere balanstesten | Score-historie + trendindicatie |
| `zoekHulpbronnen` | Zoek lokale zorgorganisaties | Twee-gemeentes-routing, categorie-varianten via `TAAK_NAAM_VARIANTEN`, sessie-variatie |
| `zoekArtikelen` | Zoek info-artikelen | Filter op categorie/tag/zoekterm; sessie-variatie; output instrueert artikelkaart-syntax |
| `gemeenteInfo` | Mantelzorgloket-contact per gemeente | Telefoon, e-mail, website van loket |
| `semantischZoeken` | Vector similarity search | OpenAI embeddings + pgvector; valt terug op tekstzoek |
| `slaActiepuntOp` | Concreet advies opslaan voor opvolging | Prisma `Actiepunt` record per user |
| `bekijkBalanstest` | Volledige test-resultaten ophalen | Alleen als ineens diepe details nodig zijn |
| `bekijkCheckInTrend` | Maandelijkse check-in trends | Score over laatste maanden |
| `bekijkGebruikerStatus` | Profiel + test-status + voltooiingspercentage | 211 regels — meest uitgebreide tool |
| `bekijkGemeenteAdvies` | Gemeente-specifiek advies (config) | Statische mapping |
| `genereerRapportSamenvatting` | Genereer + sla PDF-rapport op | Voor de mantelzorger-rapport-functie |
| `registreerAlarm` | Crisissignaal vastleggen | `AlarmLog` record |

Op de hoofdchat (`/api/ai/chat`) zijn nu **6 tools** actief: `bekijkTestTrend`, `zoekHulpbronnen`, `zoekArtikelen`, `gemeenteInfo`, `semantischZoeken`, `slaActiepuntOp`. De andere zijn beschikbaar in andere routes (balanscoach/checkin) of admin-agents.

`stopWhen: stepCountIs(7)` betekent: maximaal 7 stappen (tool-calls + finale tekst) per turn — voorkomt loops.

### Variatie in tool-resultaten

`zoekHulpbronnen` en `zoekArtikelen` halen sinds [PR #345](https://github.com/Willem1978/mantelzorg-app/pull/345) een **ruimere set** op (15-24 records) en passen `prioritizeUnshown` toe op basis van `shownNamen` / `shownTitels` die de client meestuurt. Resultaat: bij dezelfde zoekvraag in dezelfde gemeente komen telkens andere organisaties bovendrijven.

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

Hoofdcomponent: `src/components/ai/AiChat.tsx` (~430 regels). Gebruikt `useChat` uit `@ai-sdk/react` met een custom `DefaultChatTransport`.

### Bericht-flow

1. Gebruiker typt en verstuurt → `sendMessage({ text })`
2. `prepareSendMessagesRequest` callback:
   - Converteert UI-berichten (parts-format) naar model-berichten (content-format)
   - Filtert lege berichten (tool-call stappen zonder tekst)
   - Verzamelt eerdere `{{hulpkaart:...}}`-namen en `{{artikelkaart:...}}`-titels uit de message-history
   - Stuurt mee als `shownHulpbronnen` / `shownArtikelen` in de body
3. Server streamt antwoord-tokens terug
4. Tijdens streaming: `parseHulpkaarten`, `parseArtikelkaarten`, `parseButtons` halen de tokens uit de tekst en renderen ze los buiten de spreekbubble
5. Hulp- en artikelkaarten worden **gepersisteerd** onder de input (max 2 hulpkaarten + 3 artikelkaarten) — blijven staan tot Ger nieuwe noemt

### UI-varianten

| Component | Gebruik |
|---|---|
| `AiChat` | Hoofd-chatpagina `/ai-assistent` |
| `GerHeroChat` | Hero-sectie homepage (visueel groter) |
| `FloatingGerChat` | Zwevend chat-widget |
| `PublicGerChat` | Publieke variant zonder login |
| `AgentChat` | Generiek alternatief (mogelijk legacy) |

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

Als je in de toekomst persistente chathistorie wilt, is dat een nieuw Prisma-model + extra read/write in de chat-route waard.

---

## 11. Beveiliging & rate-limiting

| Mechanisme | Waar | Doel |
|---|---|---|
| **Auth-check** | Begin van elke route (m.u.v. `/welkom`) | Alleen ingelogde users mogen praten met de gepersonaliseerde Ger |
| **Crisis-detector** | Vóór elke AI-call | Voorkomt dat AI iets schadelijks zegt bij echte nood |
| **Rate-limiting** | `/api/ai/welkom` (20/10min per IP) | Voorkomt misbruik van de publieke endpoint |
| **`maxDuration` 30s** | Vercel function | Hard timeout — voorkomt lange hangende calls |
| **`stopWhen: stepCountIs(7)`** | streamText | Maximaal 7 tool-call stappen per turn — voorkomt oneindige loops |
| **Hardgecodeerd protocol bij crisis** | `buildCrisisResponse()` | Telefoonnummers van hulplijnen kunnen niet door AI verzonnen of gewijzigd worden |
| **Geen verzonnen contactgegevens** | Prompt-instructie + tool-output | Hulpkaarten worden letterlijk uit DB gekopieerd; AI mag geen telefoonnummers/websites verzinnen |

---

## 12. Hoe pas je Ger's gedrag aan? ("training")

Omdat er geen fine-tuning is, gebeurt alle gedragsaanpassing via **prompt engineering** + **context**. Veelvoorkomende aanpassingen:

| Wat | Waar aanpassen |
|---|---|
| **Toon, persona, gespreksstijl** | `src/lib/ai/prompts/assistent.ts` (basis-prompt) |
| **Gedrag per balansniveau** | Sectie "Gedrag per belastingniveau" in zelfde prompt |
| **Output-syntax / kaart-formaat** | Sectie "Output Syntax" in zelfde prompt + `HulpKaart.tsx` / `ArtikelKaart.tsx` (parser) |
| **Crisis-keywords / hulplijnen** | `src/lib/ai/crisis-detector.ts` |
| **Welk model voor welke agent** | `src/lib/ai/models.ts` (`AGENT_MODELS`) |
| **Welke tools beschikbaar per route** | De `tools: { ... }` in elke `/api/ai/*/route.ts` |
| **Wat in pre-fetched context** | `src/lib/ai/prefetch-context.ts` (prefetchUserContext + buildContextBlock) |
| **Suggestie-knoppen bij start** | `suggesties` array in `src/components/ai/AiChat.tsx` |
| **Welkomst-zin (eerste bericht)** | JSX in `AiChat.tsx` (sectie "Welkomstbericht") |
| **Variatie / herhaling-gedrag** | `src/lib/ai/variation.ts` + `shownHulpbronnen` body-veld |
| **Coach-adviezen per deelgebied** | Static config (zie `loadCoachAdviezen()`) |

### Iteratie-tips

1. **Wijzig één ding tegelijk** in het systeem-prompt. Door de uitgebreidheid is het makkelijk dat aanpassingen elkaar tegenwerken.
2. **Test op échte balanstest-data** — Ger gedraagt zich anders bij HOOG/GEMIDDELD/LAAG. Een test-account per niveau is waardevol.
3. **Let op token-budget** — `maxOutputTokens: 2048` is geen probleem voor antwoorden, maar de pre-fetched context kan groot worden bij veel hulpbronnen. Onnodig veel context = hogere kosten.
4. **Gebruik de Anthropic console voor prompt-debugging** — kopieer de werkelijk verstuurde messages + system prompt en test daar varianten zonder de volledige Next.js stack.

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
│   ├── prefetch-context.ts      ← gebruikersdata vooraf ophalen
│   ├── embeddings.ts            ← OpenAI embedding service
│   ├── coach-advies.ts          ← static coach-tips per deelgebied
│   ├── gemeente-resolver.ts     ← gemeente-contact lookup
│   ├── prompts/
│   │   ├── assistent.ts         ← Ger's hoofdprompt (chat)
│   │   ├── welkom.ts            ← homepage Ger
│   │   ├── balanscoach.ts       ← coach
│   │   └── checkin-buddy.ts     ← check-in
│   ├── tools/                   ← function-calling tools
│   └── agents/                  ← complexe AI-agents (hulpbron-zoeker, validator)
│
└── components/ai/
    ├── AiChat.tsx               ← hoofdchat-UI (useChat + transport)
    ├── HulpKaart.tsx            ← parser + render van {{hulpkaart:...}}
    ├── ArtikelKaart.tsx         ← parser + render van {{artikelkaart:...}}
    ├── GerAvatar.tsx            ← avatar-component
    ├── GerHeroChat.tsx          ← hero-variant
    ├── FloatingGerChat.tsx      ← floating widget
    └── PublicGerChat.tsx        ← anonieme variant
```

---

## 15. Bekende beperkingen & open punten

- **Geen cross-session-geheugen**: Ger weet niet wat hij vorige week zei — alleen open `Actiepunten` worden meegenomen.
- **Geen multi-modal**: alleen tekst. Geen foto's of stem.
- **Geen tool-keuze-uitleg in UI**: als Ger een tool aanroept ziet de gebruiker alleen "Ger typt..." — geen visuele indicatie van bv. "ik zoek nu lokale hulp".
- **Variatie alleen in chat-hoofdpagina**: `/api/ai/balanscoach`, `/checkin` en `/welkom` accepteren de `shownNamen`/`shownTitels` parameters wel via tool-signature, maar wiren ze nog niet door vanuit hun eigen frontends.
- **Geen A/B-testing van prompts**: aanpassingen aan het systeem-prompt gaan direct naar productie zonder framework om varianten te vergelijken.
- **Latency**: pre-fetch + Anthropic-call duurt typisch 2-5 seconden voor het eerste token. Bij veel hulpbronnen in de context kan dit oplopen.

---

## 16. Snelle referentie

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
| Waarom Haiku en geen Sonnet? | 4× goedkoper; voor coachende dialoog ruim voldoende |
