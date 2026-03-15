-- ============================================================
-- Opschoning: verwijder alle Arnhem en Nijmegen hulpbronnen
-- Zutphen en landelijke bronnen blijven behouden.
--
-- Voer dit script uit in de Supabase SQL Editor.
-- ============================================================

BEGIN;

-- 1. Toon wat er verwijderd gaat worden (ter controle)
SELECT gemeente, COUNT(*) AS aantal
FROM "Zorgorganisatie"
WHERE gemeente IN ('Arnhem', 'Nijmegen')
GROUP BY gemeente;

-- 2. Verwijder favorieten die verwijzen naar Arnhem/Nijmegen organisaties
DELETE FROM "Favoriet"
WHERE type = 'HULP'
  AND "itemId" IN (
    SELECT id FROM "Zorgorganisatie"
    WHERE gemeente IN ('Arnhem', 'Nijmegen')
  );

-- 3. Verwijder validaties van Arnhem/Nijmegen organisaties
DELETE FROM "HulpbronValidatie"
WHERE "zorgorganisatieId" IN (
    SELECT id FROM "Zorgorganisatie"
    WHERE gemeente IN ('Arnhem', 'Nijmegen')
);

-- 4. Verwijder de Arnhem/Nijmegen zorgorganisaties
DELETE FROM "Zorgorganisatie"
WHERE gemeente IN ('Arnhem', 'Nijmegen');

-- 5. Verwijder Arnhem/Nijmegen gemeente nieuws artikelen
DELETE FROM "Artikel"
WHERE type = 'GEMEENTE_NIEUWS'
  AND gemeente IN ('Arnhem', 'Nijmegen');

-- 6. Controle: toon wat er over is
SELECT gemeente, COUNT(*) AS aantal
FROM "Zorgorganisatie"
WHERE gemeente IS NOT NULL
GROUP BY gemeente

UNION ALL

SELECT '(Landelijk)' AS gemeente, COUNT(*) AS aantal
FROM "Zorgorganisatie"
WHERE gemeente IS NULL;

COMMIT;
