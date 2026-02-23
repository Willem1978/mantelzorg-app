# Plan: Correcte mapping zorgtaken → hulpcategorieën + tegel-kleuring

## Probleemanalyse

Na grondige analyse heb ik **drie problemen** gevonden:

### Probleem 1: TAAK_NAAR_ONDERDEEL mapping is VOLLEDIG FOUT

In `src/app/api/dashboard/route.ts` (regel 6-15) staat een mapping die de taak-IDs uit de balanstest koppelt aan de `onderdeelTest` waarden in de hulpbronnen database. Deze mapping is **compleet verkeerd**:

| Taak ID | Balanstest taak | Huidige mapping (FOUT) | Correcte mapping |
|---------|----------------|----------------------|-----------------|
| t1 | Administratie en geldzaken | Persoonlijke verzorging ❌ | Administratie en aanvragen |
| t2 | Regelen en afspraken maken | Huishoudelijke taken ❌ | Plannen en organiseren |
| t3 | Boodschappen doen | Persoonlijke verzorging ❌ | Boodschappen |
| t4 | Bezoek en gezelschap | Vervoer ❌ | Sociaal contact en activiteiten |
| t5 | Vervoer naar afspraken | Administratie en aanvragen ❌ | Vervoer |
| t6 | Persoonlijke verzorging | Sociaal contact en activiteiten ❌ | Persoonlijke verzorging |
| t7 | Eten en drinken | Persoonlijke verzorging ❌ | Bereiden en/of nuttigen van maaltijden |
| t8 | Huishouden | Persoonlijke verzorging ❌ | Huishoudelijke taken |
| t9 | Klusjes (ONTBREEKT) | - | Klusjes in en om het huis |

**Gevolg:** Als een mantelzorger "Vervoer" als zwaar aangeeft, krijgt hij hulpbronnen voor "Administratie" te zien. Alles loopt kris-kras door elkaar.

### Probleem 2: Niet alle hulp wordt getoond

De hulpvragen pagina toont in de "Voor naaste" tab alleen tegels als er balanstest-taken aan gekoppeld zijn. Als een mantelzorger geen balanstest heeft gedaan, ziet hij helemaal geen hulp. De gebruiker wil **altijd alle hulpbronnen** zien die in de gemeente van de mantelzorger óf de zorgvrager beschikbaar zijn.

### Probleem 3: Tegel-kleuring op basis van belasting

De kleurmechaniek is al deels aanwezig in de "voor naaste" tab (rood/oranje/groen rand + achtergrond). Maar door de foute mapping (probleem 1) werkt het niet correct. Na het fixen van de mapping zal de kleuring automatisch werken.

---

## Implementatieplan

### Stap 1: Fix TAAK_NAAR_ONDERDEEL mapping in dashboard API
**Bestand:** `src/app/api/dashboard/route.ts`

Corrigeer de mapping naar:
```typescript
const TAAK_NAAR_ONDERDEEL: Record<string, string> = {
  t1: 'Administratie en aanvragen',
  t2: 'Plannen en organiseren',
  t3: 'Boodschappen',
  t4: 'Sociaal contact en activiteiten',
  t5: 'Vervoer',
  t6: 'Persoonlijke verzorging',
  t7: 'Bereiden en/of nuttigen van maaltijden',
  t8: 'Huishoudelijke taken',
  t9: 'Klusjes in en om het huis',
}
```

### Stap 2: Toon ALLE categorieën in "Voor naaste" tab, ongeacht balanstest
**Bestand:** `src/app/(dashboard)/hulpvragen/page.tsx`

Momenteel toont de "voor naaste" tab:
- Pas tegels als er zorgtaken uit de balanstest zijn
- Een "doe de balanstest" bericht als er geen test is

Verandering:
- **Altijd** alle zorgvrager-categorieën tonen (Administratie, Plannen, Boodschappen, etc.)
- Tegels met een taak uit de balanstest krijgen kleur (rood/oranje/groen)
- Tegels zonder taak blijven de standaard neutrale kleur
- De "doe de balanstest" banner bovenaan wordt een subtielere hint (niet de enige content)

### Stap 3: Verbreed gemeente-filtering voor hulpbronnen
**Bestand:** `src/app/api/dashboard/route.ts`

In de `getHulpbronnenVoorTaken` functie, pas de `perCategorie` query aan zodat deze hulpbronnen ophaalt voor **beide gemeenten** (mantelzorger + zorgvrager), niet alleen de zorgvrager-gemeente:
- Mantelzorger-categorieën → gemeente mantelzorger (al correct)
- Zorgvrager-categorieën → gemeente zorgvrager + gemeente mantelzorger (beide)
- Landelijke hulpbronnen → altijd tonen (al correct)

### Stap 4: Alle zorgtaken meegeven (niet alleen "zware")
**Bestand:** `src/app/api/dashboard/route.ts`

De dashboard API stuurt nu `zorgtaken` mee, maar alleen de geselecteerde taken met moeilijkheid. De hulpvragen pagina krijgt deze via `dashboardData.test?.zorgtaken`. Dit werkt al correct: **alle** geselecteerde taken worden meegestuurd met hun moeilijkheid.

Geen wijziging nodig hier - de mapping fix in Stap 1 lost het probleem op.

### Stap 5: Verfijn tegel-kleuring
**Bestand:** `src/app/(dashboard)/hulpvragen/page.tsx`

De huidige kleuring (regels 916-922) werkt al met:
- `zwaar` → rode achtergrond + rode rand
- `gemiddeld` → amber achtergrond + amber rand
- `licht` → groene achtergrond + groene rand
- geen taak → standaard kaart

Dit hoeft niet aangepast te worden na de mapping fix.

---

## Samenvatting wijzigingen

| # | Bestand | Wijziging |
|---|---------|-----------|
| 1 | `src/app/api/dashboard/route.ts` | Fix TAAK_NAAR_ONDERDEEL mapping (9 regels) |
| 2 | `src/app/api/dashboard/route.ts` | Verbreed gemeente-filtering (hulpbronnen uit beide gemeenten) |
| 3 | `src/app/(dashboard)/hulpvragen/page.tsx` | Toon altijd alle zorgvrager-categorieën |
