# Verbeterplan UX & Klantreis MantelBuddy

## Analyse-samenvatting

Na diepgaand onderzoek van alle pagina's, flows, en de score-berekening komen
de volgende kernproblemen naar voren:

### Wat goed werkt
- Warme tone met Ger als gids
- Balanstest met thermometer-visualisatie
- Hulpvragen directory met lokaal/landelijk filter
- Check-in systeem, artikel-bibliotheek, dark mode
- Advies-systeem is al gebouwd (advies.ts) maar nog niet op dashboard

### 5 Kernproblemen

| # | Probleem | Ernst |
|---|----------|-------|
| 1 | **Geen stappenplan** - Na test geen concreet "doe dit nu" plan | Kritiek |
| 2 | **Geen score per deelgebied** - Alleen totaal, niet Energie/Gevoel/Tijd | Hoog |
| 3 | **Dashboard overweldigend** - 6 secties tegelijk, geen focus | Hoog |
| 4 | **Gemeente oppervlakkig** - String-filter, geen beheermodel | Hoog |
| 5 | **Advies niet zichtbaar** - advies.ts gebouwd maar niet op dashboard | Hoog |

---

## Implementatieplan (5 fases)

### Fase A: Deelgebied-scores op Rapport en Dashboard
**Doel:** Score per gebied (Energie/Gevoel/Tijd) tonen met gekleurde indicatoren

De 11 vragen zijn al in 3 secties verdeeld:
- **Jouw Energie** (q1-q3): slaap, lichaam, energie
- **Jouw Gevoel** (q4-q7): relatie, emotie, verdriet, uitputting
- **Jouw Tijd** (q8-q11): aanpassing, plannen, hobby, werkdruk

**Wijzigingen:**
1. Score-berekening uitbreiden met per-sectie scores
2. Rapport pagina: 3 gekleurde blokken per deelgebied (groen/oranje/rood)
3. Dashboard: compacte deelgebied-indicatoren bij de scorekaart
4. Tips per deelgebied genereren (bijv. "Jouw energie is laag - prioriteer slaap")

### Fase B: Persoonlijk Stappenplan na Test
**Doel:** Concrete "deze week / deze maand" acties na testresultaat

Na testafronding ziet de mantelzorger:

**Bij LAAG niveau:**
- "Goed bezig! Blijf dit doen"
- Herinnering voor maandelijkse check-in
- 1 tip artikel

**Bij GEMIDDELD niveau:**
- "Stap 1: Zoek deze week hulp voor [zwaarste taak]" (directe link)
- "Stap 2: Lees dit artikel over [zwakste deelgebied]"
- "Stap 3: Doe over een maand een check-in"

**Bij HOOG niveau:**
- "Vandaag: Bel de Mantelzorglijn (030-205-9059)"
- "Deze week: Neem contact op met je gemeente"
- "Plan: Zoek vervangende zorg voor [zwaarste taak]"

**Wijzigingen:**
1. Nieuwe component `Stappenplan.tsx` - visueel stappenplan
2. Op rapport pagina tonen na scorekaart
3. Advies items uit advies.ts integreren als concrete stappen
4. Stappen opslaan per gebruiker (voortgang bijhouden)

### Fase C: Dashboard Vereenvoudigen
**Doel:** Focus op 1 volgende actie, niet 6 secties tegelijk

Nieuwe dashboard layout:
1. **Bovenaan:** Score + deelgebieden (compact)
2. **Midden:** "Jouw volgende stap" (1 prominente actie)
3. **Onder:** Samengevouwen secties (taken, artikelen, etc.)

**Wijzigingen:**
1. Dashboard refactoren: progressive disclosure
2. "Volgende stap" kaart prominent maken
3. Advies-items uit advies.ts op dashboard tonen
4. Minder-relevante secties samenvouwen

### Fase D: Gemeente Beheermodel
**Doel:** Per gemeente content, advies en inrichting beheren

**Database:**
- Nieuw `Gemeente` model met:
  - Naam, code, contactgegevens
  - Custom advies-teksten per niveau
  - Custom hulpbronnen-links
  - Eigen nieuwsberichten
  - Actief/inactief status

**Beheeromgeving:**
- Nieuw tabblad "Gemeenten" in beheer
- Per gemeente: naam, contactinfo, status
- Per gemeente: aangepast advies voor LAAG/GEMIDDELD/HOOG
- Per gemeente: eigen hulpbronnen en artikelen
- Overzicht van alle geimplementeerde gemeenten

**Wijzigingen:**
1. Prisma schema: Gemeente model
2. API routes: CRUD voor gemeenten
3. Beheer pagina: gemeente-overzicht + detail
4. Frontend: gemeente-specifiek advies ophalen en tonen

### Fase E: Taak-niveau Advies
**Doel:** Bij oranje/rode taken concreet advies en alternatieven

Per taak met score "zwaar" of "gemiddeld":
- Specifiek advies tekst
- Concrete alternatieven ("Probeer thuiszorg voor persoonlijke verzorging")
- Directe link naar relevante hulpbronnen
- Optioneel: gemeente-specifieke alternatieven

**Wijzigingen:**
1. Taak-advies content in database (beheerbaar)
2. Op rapport en dashboard tonen bij relevante taken
3. Link naar hulpvragen met pre-gefilterde categorie

---

## Prioriteitsvolgorde

1. **Fase A** (deelgebied-scores) - fundament voor alles
2. **Fase B** (stappenplan) - grootste UX-impact
3. **Fase D** (gemeente beheer) - structureel nodig
4. **Fase C** (dashboard) - afhankelijk van A+B
5. **Fase E** (taak-advies) - verfijning
