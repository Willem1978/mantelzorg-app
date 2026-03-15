# Plan: Iteratie B, C, D & E - Afronden

## Analyse: Wat is de huidige situatie?

| Iteratie | Wat is gebouwd | Wat ontbreekt | Restwerk |
|----------|---------------|---------------|----------|
| **B** Aanbevelingen | DB-schema, tag-seeding, tag-afleiding, voorkeuren API | Alles: scoring, UI, Ger-integratie | ~14 uur |
| **C** Artikelgeneratie | Content-agent pipeline, hiaten-analyse, batch-genereer, leesdata tracking | Batch progress, tag-suggestie UI, gap-opslag | ~4 uur |
| **D** Kwaliteit | Curator API (review, B1, duplicaten), beheer UI | Kwaliteitsscore, completeness dashboard, actie-knoppen | ~8 uur |
| **E** Zoeken | Embeddings, pgvector, semantic search tool, admin AI-zoeker | User-facing zoekpagina, API integratie, automatisering | ~6 uur |

**Totaal restwerk: ~32 uur**

---

## Advies: Verdelen in 2 iteraties

**Reden:** B is een volledig nieuw blok (~14 uur). C/D/E zijn afronding van bestaand werk (~18 uur). Door te splitsen houden we elke iteratie beheersbaar en testbaar.

---

## Iteratie 1: Aanbevelingen (B) — ~14 uur

> Kernvraag: "Hoe krijgt elke mantelzorger artikelen te zien die bij hun situatie passen?"

### Prerequisite: Artikelen taggen
- [ ] `seed-artikel-tags.ts` draaien zodat ArtikelTag tabel gevuld is
- [ ] Controleren dat alle 42+ artikelen minimaal 1 tag hebben

### B.1: Relevantie-score berekening (~4 uur)
**Nieuw bestand:** `src/lib/dashboard/relevance-scoring.ts`

Logica:
1. Haal gebruiker-tags op (GebruikerVoorkeur + bepaalProfielTags())
2. Haal artikel-tags op (ArtikelTag + ContentTag)
3. Bereken overlap-score per artikel:
   - AANDOENING match = 3 punten
   - SITUATIE match = 2 punten
   - ONDERWERP match = 1 punt
4. Sorteer op score, return top N

**Wijzig:** `src/lib/dashboard/artikelen.ts`
- `getAanbevolenArtikelen(caregiverId)` gebruikt nu relevance-scoring
- Fallback naar belastingNiveau als gebruiker geen tags heeft

### B.2: Dashboard "Aanbevolen voor jou" (~3 uur)
**Wijzig:** `src/app/(dashboard)/dashboard/page.tsx`
- Sectie "Aanbevolen voor jou" met top 3-5 artikelen
- Toont match-reden: "Past bij jouw situatie: dementie, werkend"
- Fallback-tekst als profiel nog niet ingevuld

**Wijzig:** `src/app/api/dashboard/route.ts`
- `getAanbevolenArtikelen(caregiverId)` i.p.v. belastingNiveau

### B.3: Leren-pagina sorteren op relevantie (~2 uur)
**Wijzig:** `src/app/(dashboard)/leren/page.tsx` (of `[categorie]/page.tsx`)
- Artikelen binnen categorie sorteren op relevantie-score
- Badge "Aanbevolen" op artikelen met hoge score
- Optioneel: "Voor jou" sectie bovenaan

### B.4: Weekkaarten verbeteren (~2 uur)
**Wijzig:** `src/components/dashboard/WeekKaartenKaart.tsx`
- Weekkaarten selecteren op basis van relevantie i.p.v. random/vast
- Elke week andere relevante tips tonen

### B.5: "Meer hierover" suggesties (~2 uur)
**Wijzig:** Artikel-detail weergave
- Onderaan artikel: "Meer over [tag]" met gerelateerde artikelen
- Gebruikt gedeelde tags om gerelateerde content te vinden

### B.6: Ger AI integratie (~1 uur)
**Wijzig:** `src/lib/ai/tools/artikelen.ts` + AI system prompt
- Gebruiker-tags meegeven als context aan Ger
- Ger kan zeggen: "Omdat je zorgt voor iemand met dementie, raad ik aan..."

---

## Iteratie 2: Afronding C/D/E — ~18 uur

> Kernvraag: "Hoe zorgen we dat content compleet, kwalitatief en vindbaar is?"

### C-afronding: Artikelgeneratie (~4 uur)

#### C.1: Tag-suggestie in artikel-editor (~2 uur)
**Wijzig:** `src/app/beheer/artikelen/page.tsx`
- Bij bewerken/aanmaken: AI-suggesties voor tags tonen
- Tags toewijzen met checkboxes (ContentTag selectie)
- Bestaande ArtikelTag-relaties tonen en bewerken

#### C.2: Gap-analyse opslaan en trending (~2 uur)
**Wijzig:** `src/app/api/ai/admin/content-agent/route.ts`
- Hiaten-analyse resultaten opslaan in database (nieuw model of JSON in SiteSettings)
- Datum + resultaten bijhouden voor trend-weergave
- Dashboard: "Vorige analyse: 12 gaps, nu: 8 gaps"

### D-afronding: Kwaliteit & Completeness (~8 uur)

#### D.1: Artikel completeness-score (~3 uur)
**Nieuw:** `src/lib/artikel-completeness.ts`

Score-berekening per artikel (0-100%):
- Heeft titel: +10%
- Heeft beschrijving (>50 tekens): +15%
- Heeft inhoud: +20%
- Heeft minimaal 1 tag: +15%
- Heeft emoji: +5%
- Heeft bron/url: +10%
- Heeft subHoofdstuk: +10%
- Status = GEPUBLICEERD: +15%

**Wijzig:** `src/app/beheer/artikelen/page.tsx`
- Completeness-percentage tonen per artikel in de lijst
- Kleurcodering: groen (>80%), oranje (50-80%), rood (<50%)
- Filter op completeness: "Toon onvolledig"
- Sorteeroptie op completeness-score

#### D.2: Curator-resultaten opslaan (~2 uur)
**Wijzig:** `src/app/api/ai/admin/curator/route.ts`
- Resultaten opslaan bij Artikel (nieuw veld `curatorFeedback` JSON of apart model)
- Timestamp van laatste review
- Badge in artikelen-lijst: "3 issues gevonden"

#### D.3: Actie-knoppen bij curator-feedback (~2 uur)
**Wijzig:** `src/app/beheer/curator/page.tsx`
- Per issue: "Herschrijf dit artikel" knop → roept content-agent aan
- Per issue: "Markeer als opgelost" knop
- Bulk-actie: "Herschrijf alle artikelen met B1-issues"

#### D.4: Content-gezondheid overzicht (~1 uur)
**Wijzig:** `src/app/beheer/artikelen/page.tsx` (of apart dashboard)
- Samenvatting bovenaan: "42 artikelen, gemiddeld 76% compleet, 5 met B1-issues"
- Donut/balk-grafiek van completeness-verdeling
- Quick-links naar probleemgevallen

### E-afronding: Zoeken (~6 uur)

#### E.1: User-facing zoekpagina (~3 uur)
**Nieuw:** `src/app/(dashboard)/zoeken/page.tsx`
- Zoekbalk met placeholder "Zoek hulp of informatie..."
- Resultaten uit zowel Artikelen als Zorgorganisaties
- Relevantie-score tonen (%)
- Filters: type (artikel/hulpbron), gemeente
- Fallback naar tekst-search als embeddings ontbreken

**Nieuw:** `src/app/api/search/route.ts`
- Accepteert `?q=zoekterm&gemeente=Zutphen&type=all`
- Roept `semantic_search()` PostgreSQL functie aan
- Fallback naar ILIKE tekst-matching

#### E.2: Zoekbalk integratie (~1 uur)
**Wijzig:** Dashboard header of navigatie
- Compacte zoekbalk in de navigatie (of op hulpvragen-pagina)
- Klik → navigeert naar `/zoeken?q=...`

#### E.3: Embeddings automatisering (~1 uur)
**Nieuw:** `src/app/api/cron/embeddings/route.ts`
- Vercel Cron route (dagelijks)
- Genereert embeddings voor artikelen/organisaties zonder embedding
- Logging van resultaten

#### E.4: Gemeente hulpbronnen API upgraden (~1 uur)
**Wijzig:** `src/app/api/gemeente/hulpbronnen/route.ts`
- `?zoek=` parameter: semantic search gebruiken i.p.v. tekst-matching
- Relevantie-score meegeven in response
- Fallback naar tekst als pgvector niet beschikbaar

---

## Volgorde en afhankelijkheden

```
Iteratie 1 (B):
  Prerequisite: seed-artikel-tags.ts draaien
  B.1 → B.2 → B.3 (sequentieel: scoring eerst, dan UI)
  B.4, B.5, B.6 (parallel na B.1)

Iteratie 2 (C/D/E):
  C.1, C.2 (parallel)
  D.1 → D.4 (score eerst, dan dashboard)
  D.2 → D.3 (opslaan eerst, dan actie-knoppen)
  E.1 → E.2 (zoekpagina eerst, dan integratie)
  E.3, E.4 (parallel)
```

---

## Wat we NIET doen (bewust)

- Geen content-versioning/geschiedenis (over-engineering voor nu)
- Geen scheduled content-generatie (handmatig is prima)
- Geen reading analytics (scroll depth, leestijd) — te complex, weinig waarde nu
- Geen real-time zoeksuggesties (gewone zoekresultaten zijn voldoende)
- Geen automatische B1-correctie (AI-suggesties zijn genoeg)
