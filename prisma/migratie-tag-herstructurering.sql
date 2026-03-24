-- ============================================
-- MIGRATIE: Tag-herstructurering
-- Datum: 24 maart 2026
-- Beschrijving: AANDOENING → ZORGTHEMA enum, groep veld, data-migratie
-- ============================================
-- BELANGRIJK: Maak een backup VOOR het draaien van dit script!
-- ============================================

-- ============================================
-- STAP 1: TagType enum aanpassen (AANDOENING → ZORGTHEMA)
-- ============================================

-- Nieuwe enum-waarde toevoegen
ALTER TYPE "TagType" ADD VALUE IF NOT EXISTS 'ZORGTHEMA';

-- COMMIT nodig na ADD VALUE voordat we het kunnen gebruiken
-- (In een transactie moet dit als apart statement draaien)

-- ============================================
-- STAP 2: Groep veld toevoegen aan ContentTag
-- ============================================

ALTER TABLE "ContentTag" ADD COLUMN IF NOT EXISTS "groep" TEXT;
CREATE INDEX IF NOT EXISTS "ContentTag_groep_idx" ON "ContentTag" ("groep");

-- ============================================
-- STAP 3: Bestaande AANDOENING tags migreren naar ZORGTHEMA type
-- ============================================

-- Eerst: alle bestaande AANDOENING tags op type ZORGTHEMA zetten
UPDATE "ContentTag" SET type = 'ZORGTHEMA' WHERE type = 'AANDOENING';

-- ============================================
-- STAP 4: Nieuwe zorgthema-tags aanmaken (als ze nog niet bestaan)
-- De oude aandoening-tags worden NIET verwijderd tot de content-migratie klaar is.
-- ============================================

-- Nieuwe zorgthema's
INSERT INTO "ContentTag" (id, type, slug, naam, beschrijving, emoji, groep, volgorde, "isActief", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid()::text, 'ZORGTHEMA', 'geheugen-cognitie', 'Geheugen & denken', 'Dementie, NAH, cognitieve achteruitgang bij ouderdom', '🧠', 'zorgthema', 1, true, NOW(), NOW()),
  (gen_random_uuid()::text, 'ZORGTHEMA', 'lichamelijk', 'Lichamelijke zorg', 'Hartfalen, COPD, CVA, diabetes, lichamelijke beperking, revalidatie', '💪', 'zorgthema', 2, true, NOW(), NOW()),
  (gen_random_uuid()::text, 'ZORGTHEMA', 'psychisch-emotioneel', 'Psychisch & emotioneel', 'Psychische aandoeningen, depressie, angst, verslaving', '💚', 'zorgthema', 3, true, NOW(), NOW()),
  (gen_random_uuid()::text, 'ZORGTHEMA', 'beperking-begeleiding', 'Beperking & begeleiding', 'Verstandelijke beperking, autisme, ontwikkelingsstoornis', '🧩', 'zorgthema', 4, true, NOW(), NOW()),
  (gen_random_uuid()::text, 'ZORGTHEMA', 'ouder-worden', 'Ouder worden', 'Algemene ouderdomsklachten, kwetsbaarheid, vallen, eenzaamheid', '👴', 'zorgthema', 5, true, NOW(), NOW()),
  (gen_random_uuid()::text, 'ZORGTHEMA', 'ernstig-ziek', 'Ernstig of langdurig ziek', 'Kanker, terminale fase, palliatief, chronisch ernstig ziek', '🕊️', 'zorgthema', 6, true, NOW(), NOW())
ON CONFLICT (slug) DO UPDATE SET
  type = EXCLUDED.type,
  naam = EXCLUDED.naam,
  beschrijving = EXCLUDED.beschrijving,
  emoji = EXCLUDED.emoji,
  groep = EXCLUDED.groep,
  volgorde = EXCLUDED.volgorde,
  "updatedAt" = NOW();

-- ============================================
-- STAP 5: Groep toekennen aan bestaande situatie-tags
-- ============================================

-- Relatie-groep
UPDATE "ContentTag" SET groep = 'relatie' WHERE slug IN ('partner-zorg', 'ouder-zorg', 'kind-zorg');

-- Weekinvulling-groep
UPDATE "ContentTag" SET groep = 'weekinvulling' WHERE slug IN ('werkend', 'werkend-parttime', 'student', 'gepensioneerd');

-- Wonen-groep
UPDATE "ContentTag" SET groep = 'wonen' WHERE slug IN ('samenwonend', 'dichtbij', 'op-afstand');

-- Zorgduur-groep
UPDATE "ContentTag" SET groep = 'zorgduur' WHERE slug IN ('beginnend', 'langdurig');

-- Extra-groep
UPDATE "ContentTag" SET groep = 'extra' WHERE slug IN ('met-kinderen', 'meerdere-zorgvragers', 'alleenstaand');

-- Rouw-groep (eigen sectie)
UPDATE "ContentTag" SET groep = 'rouw' WHERE slug = 'rouwverwerking';

-- Onderwerp-groep
UPDATE "ContentTag" SET groep = 'onderwerp' WHERE type = 'ONDERWERP';

-- Tags die verdwijnen op inactief zetten
UPDATE "ContentTag" SET "isActief" = false WHERE slug IN ('jong', 'intensief');

-- ============================================
-- STAP 6: Nieuwe situatie-tags toevoegen
-- ============================================

-- netwerk-zorg (voor "ik zorg voor iemand anders")
INSERT INTO "ContentTag" (id, type, slug, naam, emoji, groep, volgorde, "isActief", "createdAt", "updatedAt")
VALUES (gen_random_uuid()::text, 'SITUATIE', 'netwerk-zorg', 'Zorgt voor iemand anders', '🤝', 'relatie', 4, true, NOW(), NOW())
ON CONFLICT (slug) DO UPDATE SET groep = 'relatie', "updatedAt" = NOW();

-- fulltime-zorger
INSERT INTO "ContentTag" (id, type, slug, naam, emoji, groep, volgorde, "isActief", "createdAt", "updatedAt")
VALUES (gen_random_uuid()::text, 'SITUATIE', 'fulltime-zorger', 'Fulltime zorger', '🏠', 'weekinvulling', 5, true, NOW(), NOW())
ON CONFLICT (slug) DO UPDATE SET groep = 'weekinvulling', "updatedAt" = NOW();

-- ervaren (1-5 jaar, vult gat tussen beginnend en langdurig)
INSERT INTO "ContentTag" (id, type, slug, naam, emoji, groep, volgorde, "isActief", "createdAt", "updatedAt")
VALUES (gen_random_uuid()::text, 'SITUATIE', 'ervaren', 'Een paar jaar bezig', '📅', 'zorgduur', 2, true, NOW(), NOW())
ON CONFLICT (slug) DO UPDATE SET groep = 'zorgduur', "updatedAt" = NOW();

-- meerdere-naasten (hernoeming van meerdere-zorgvragers)
INSERT INTO "ContentTag" (id, type, slug, naam, emoji, groep, volgorde, "isActief", "createdAt", "updatedAt")
VALUES (gen_random_uuid()::text, 'SITUATIE', 'meerdere-naasten', 'Zorgt voor meerdere mensen', '👥', 'extra', 2, true, NOW(), NOW())
ON CONFLICT (slug) DO UPDATE SET groep = 'extra', naam = 'Zorgt voor meerdere mensen', "updatedAt" = NOW();

-- rouw (hernoeming van rouwverwerking)
INSERT INTO "ContentTag" (id, type, slug, naam, emoji, groep, volgorde, "isActief", "createdAt", "updatedAt")
VALUES (gen_random_uuid()::text, 'SITUATIE', 'rouw', 'Naaste is overleden', '🕊️', 'rouw', 1, true, NOW(), NOW())
ON CONFLICT (slug) DO UPDATE SET groep = 'rouw', naam = 'Naaste is overleden', "updatedAt" = NOW();

-- ============================================
-- STAP 7: Nieuwe onderwerp-tags toevoegen/hernoemen
-- ============================================

INSERT INTO "ContentTag" (id, type, slug, naam, emoji, groep, volgorde, "isActief", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid()::text, 'ONDERWERP', 'financien-regelingen', 'Financiën & regelingen', '💰', 'onderwerp', 1, true, NOW(), NOW()),
  (gen_random_uuid()::text, 'ONDERWERP', 'wmo-wlz-zvw', 'Wmo, Wlz & zorgverzekering', '📋', 'onderwerp', 2, true, NOW(), NOW()),
  (gen_random_uuid()::text, 'ONDERWERP', 'medicatie-behandeling', 'Medicatie & behandeling', '💊', 'onderwerp', 4, true, NOW(), NOW()),
  (gen_random_uuid()::text, 'ONDERWERP', 'dagelijks-zorgen', 'Dagelijks zorgen', '🏠', 'onderwerp', 5, true, NOW(), NOW()),
  (gen_random_uuid()::text, 'ONDERWERP', 'zelfzorg-balans', 'Zelfzorg & balans', '💆', 'onderwerp', 6, true, NOW(), NOW()),
  (gen_random_uuid()::text, 'ONDERWERP', 'werk-zorg', 'Werk & zorg combineren', '⚖️', 'onderwerp', 8, true, NOW(), NOW()),
  (gen_random_uuid()::text, 'ONDERWERP', 'hulpmiddelen', 'Hulpmiddelen & technologie', '🔧', 'onderwerp', 9, true, NOW(), NOW()),
  (gen_random_uuid()::text, 'ONDERWERP', 'emotioneel', 'Emotioneel & mentaal', '💚', 'onderwerp', 10, true, NOW(), NOW()),
  (gen_random_uuid()::text, 'ONDERWERP', 'netwerk-hulp', 'Netwerk & hulp organiseren', '🤝', 'onderwerp', 11, true, NOW(), NOW()),
  (gen_random_uuid()::text, 'ONDERWERP', 'veiligheid', 'Veiligheid thuis', '🏡', 'onderwerp', 12, true, NOW(), NOW())
ON CONFLICT (slug) DO UPDATE SET
  naam = EXCLUDED.naam,
  emoji = EXCLUDED.emoji,
  groep = EXCLUDED.groep,
  volgorde = EXCLUDED.volgorde,
  "updatedAt" = NOW();

-- ============================================
-- STAP 8: Caregiver.aandoening waarden migreren
-- ============================================

UPDATE "Caregiver" SET aandoening = 'geheugen-cognitie' WHERE aandoening IN ('dementie', 'nah');
UPDATE "Caregiver" SET aandoening = 'lichamelijk' WHERE aandoening IN ('cva-beroerte', 'hartfalen', 'copd', 'diabetes', 'lichamelijke-beperking');
UPDATE "Caregiver" SET aandoening = 'psychisch-emotioneel' WHERE aandoening = 'psychisch';
UPDATE "Caregiver" SET aandoening = 'beperking-begeleiding' WHERE aandoening = 'verstandelijke-beperking';
UPDATE "Caregiver" SET aandoening = 'ouder-worden' WHERE aandoening = 'ouderdom';
UPDATE "Caregiver" SET aandoening = 'ernstig-ziek' WHERE aandoening IN ('kanker', 'terminaal');

-- ============================================
-- STAP 9: GebruikerVoorkeur slug-waarden migreren
-- ============================================

-- Aandoening-slugs → zorgthema-slugs
UPDATE "GebruikerVoorkeur" SET slug = 'geheugen-cognitie' WHERE slug IN ('dementie', 'nah') AND type = 'TAG';
UPDATE "GebruikerVoorkeur" SET slug = 'lichamelijk' WHERE slug IN ('cva-beroerte', 'hartfalen', 'copd', 'diabetes', 'lichamelijke-beperking') AND type = 'TAG';
UPDATE "GebruikerVoorkeur" SET slug = 'psychisch-emotioneel' WHERE slug = 'psychisch' AND type = 'TAG';
UPDATE "GebruikerVoorkeur" SET slug = 'beperking-begeleiding' WHERE slug = 'verstandelijke-beperking' AND type = 'TAG';
UPDATE "GebruikerVoorkeur" SET slug = 'ouder-worden' WHERE slug = 'ouderdom' AND type = 'TAG';
UPDATE "GebruikerVoorkeur" SET slug = 'ernstig-ziek' WHERE slug IN ('kanker', 'terminaal') AND type = 'TAG';

-- Hernoemde situatie-tags
UPDATE "GebruikerVoorkeur" SET slug = 'meerdere-naasten' WHERE slug = 'meerdere-zorgvragers' AND type = 'TAG';
UPDATE "GebruikerVoorkeur" SET slug = 'rouw' WHERE slug = 'rouwverwerking' AND type = 'TAG';

-- Verwijder tags die niet meer bestaan
DELETE FROM "GebruikerVoorkeur" WHERE slug IN ('werkend-parttime', 'jong', 'intensief') AND type = 'TAG';

-- Verwijder duplicaten die ontstaan door merge (bijv. 2x 'lichamelijk' voor dezelfde caregiver)
DELETE FROM "GebruikerVoorkeur" a
USING "GebruikerVoorkeur" b
WHERE a.id > b.id
  AND a."caregiverId" = b."caregiverId"
  AND a.type = b.type
  AND a.slug = b.slug;

-- ============================================
-- STAP 10: Oude aandoening-tags deactiveren (niet verwijderen)
-- ============================================

UPDATE "ContentTag" SET "isActief" = false
WHERE slug IN (
  'dementie', 'kanker', 'cva-beroerte', 'hartfalen', 'copd', 'diabetes',
  'psychisch', 'verstandelijke-beperking', 'lichamelijke-beperking',
  'nah', 'ouderdom', 'terminaal'
) AND type = 'ZORGTHEMA';

-- Oude onderwerp-tags deactiveren (vervangen door nieuwe slugs)
UPDATE "ContentTag" SET "isActief" = false
WHERE slug IN ('financien', 'wmo-aanvragen', 'medicatie', 'nachtrust', 'voeding',
  'veiligheid-thuis', 'dagbesteding', 'vervoer', 'werk-zorg-balans', 'emotionele-steun')
AND type = 'ONDERWERP';

-- Oude situatie-tags deactiveren
UPDATE "ContentTag" SET "isActief" = false
WHERE slug IN ('werkend-parttime', 'jong', 'intensief', 'meerdere-zorgvragers', 'rouwverwerking')
AND type = 'SITUATIE';

-- ============================================
-- KLAAR! Controleer met:
-- SELECT type, groep, slug, naam, "isActief" FROM "ContentTag" ORDER BY type, groep, volgorde;
-- ============================================
