-- ============================================
-- ITERATIE A - STAP 2 van 2
-- Draai dit NA stap 1 in Supabase SQL Editor
-- ============================================

-- Nieuwe SITUATIE-tags
INSERT INTO "ContentTag" ("id", "type", "slug", "naam", "emoji", "volgorde", "isActief", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid()::text, 'SITUATIE', 'werkend-parttime', 'Parttime werkend', '🕐', 3, true, NOW(), NOW()),
  (gen_random_uuid()::text, 'SITUATIE', 'student', 'Studerende mantelzorger', '🎓', 4, true, NOW(), NOW()),
  (gen_random_uuid()::text, 'SITUATIE', 'gepensioneerd', 'Gepensioneerde mantelzorger', '👴', 5, true, NOW(), NOW()),
  (gen_random_uuid()::text, 'SITUATIE', 'dichtbij', 'Naaste woont dichtbij', '📍', 7, true, NOW(), NOW()),
  (gen_random_uuid()::text, 'SITUATIE', 'alleenstaand', 'Alleenstaande mantelzorger', '🏚️', 17, true, NOW(), NOW())
ON CONFLICT ("slug") DO NOTHING;

-- Bestaande tags: emoji/volgorde bijwerken
UPDATE "ContentTag" SET "emoji" = '🎓', "volgorde" = 1 WHERE "slug" = 'jong' AND "type" = 'SITUATIE';
UPDATE "ContentTag" SET "volgorde" = 2 WHERE "slug" = 'werkend' AND "type" = 'SITUATIE';
UPDATE "ContentTag" SET "emoji" = '🏠', "volgorde" = 6 WHERE "slug" = 'samenwonend' AND "type" = 'SITUATIE';
UPDATE "ContentTag" SET "emoji" = '🚗', "volgorde" = 8 WHERE "slug" = 'op-afstand' AND "type" = 'SITUATIE';
UPDATE "ContentTag" SET "volgorde" = 9 WHERE "slug" = 'met-kinderen' AND "type" = 'SITUATIE';
UPDATE "ContentTag" SET "naam" = 'Net begonnen (< 1 jaar)', "volgorde" = 10 WHERE "slug" = 'beginnend' AND "type" = 'SITUATIE';
UPDATE "ContentTag" SET "naam" = 'Al jaren bezig (> 5 jaar)', "volgorde" = 11 WHERE "slug" = 'langdurig' AND "type" = 'SITUATIE';
UPDATE "ContentTag" SET "emoji" = '⏰', "volgorde" = 12 WHERE "slug" = 'intensief' AND "type" = 'SITUATIE';
UPDATE "ContentTag" SET "volgorde" = 13 WHERE "slug" = 'partner-zorg' AND "type" = 'SITUATIE';
UPDATE "ContentTag" SET "volgorde" = 14 WHERE "slug" = 'ouder-zorg' AND "type" = 'SITUATIE';
UPDATE "ContentTag" SET "volgorde" = 15 WHERE "slug" = 'kind-zorg' AND "type" = 'SITUATIE';
UPDATE "ContentTag" SET "volgorde" = 16 WHERE "slug" = 'meerdere-zorgvragers' AND "type" = 'SITUATIE';
UPDATE "ContentTag" SET "volgorde" = 18 WHERE "slug" = 'rouwverwerking' AND "type" = 'SITUATIE';

-- ONDERWERP-tags (nu werkt 'ONDERWERP' omdat de enum al gecommit is)
INSERT INTO "ContentTag" ("id", "type", "slug", "naam", "emoji", "volgorde", "synoniemen", "isActief", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid()::text, 'ONDERWERP', 'financien', 'Financiën & vergoedingen', '💰', 1, '{}', true, NOW(), NOW()),
  (gen_random_uuid()::text, 'ONDERWERP', 'wmo-aanvragen', 'Wmo aanvragen', '📋', 2, '{}', true, NOW(), NOW()),
  (gen_random_uuid()::text, 'ONDERWERP', 'pgb', 'Persoonsgebonden budget', '💳', 3, '{PGB,"persoonsgebonden budget"}', true, NOW(), NOW()),
  (gen_random_uuid()::text, 'ONDERWERP', 'medicatie', 'Medicatie & medicijnbeheer', '💊', 4, '{}', true, NOW(), NOW()),
  (gen_random_uuid()::text, 'ONDERWERP', 'nachtrust', 'Slaap & nachtrust', '😴', 5, '{}', true, NOW(), NOW()),
  (gen_random_uuid()::text, 'ONDERWERP', 'voeding', 'Voeding & maaltijden', '🍽️', 6, '{}', true, NOW(), NOW()),
  (gen_random_uuid()::text, 'ONDERWERP', 'veiligheid-thuis', 'Veiligheid in huis', '🏠', 7, '{}', true, NOW(), NOW()),
  (gen_random_uuid()::text, 'ONDERWERP', 'dagbesteding', 'Dagbesteding', '🎨', 8, '{}', true, NOW(), NOW()),
  (gen_random_uuid()::text, 'ONDERWERP', 'vervoer', 'Vervoer & mobiliteit', '🚗', 9, '{}', true, NOW(), NOW()),
  (gen_random_uuid()::text, 'ONDERWERP', 'respijtzorg', 'Respijtzorg', '🌿', 10, '{respijt,"vervangende zorg",logeervoorziening}', true, NOW(), NOW()),
  (gen_random_uuid()::text, 'ONDERWERP', 'werk-zorg-balans', 'Werk-zorgbalans', '⚖️', 11, '{}', true, NOW(), NOW()),
  (gen_random_uuid()::text, 'ONDERWERP', 'emotionele-steun', 'Emotionele steun', '💚', 12, '{}', true, NOW(), NOW())
ON CONFLICT ("slug") DO NOTHING;

-- ARTIKELEN TAGGEN
CREATE OR REPLACE FUNCTION tag_artikel(p_artikel_id TEXT, p_tag_slug TEXT)
RETURNS VOID AS $$
DECLARE
  v_tag_id TEXT;
BEGIN
  SELECT "id" INTO v_tag_id FROM "ContentTag" WHERE "slug" = p_tag_slug AND "isActief" = true LIMIT 1;
  IF v_tag_id IS NOT NULL THEN
    INSERT INTO "ArtikelTag" ("id", "artikelId", "tagId")
    VALUES (gen_random_uuid()::text, p_artikel_id, v_tag_id)
    ON CONFLICT ("artikelId", "tagId") DO NOTHING;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- === PRAKTISCHE TIPS ===
SELECT tag_artikel('pt-1', 'ouderdom');
SELECT tag_artikel('pt-2', 'medicatie');
SELECT tag_artikel('pt-2', 'veiligheid-thuis');
SELECT tag_artikel('pt-3', 'respijtzorg');
SELECT tag_artikel('pt-4', 'dementie');
SELECT tag_artikel('pt-5', 'lichamelijke-beperking');
SELECT tag_artikel('pt-5', 'veiligheid-thuis');
SELECT tag_artikel('pt-6', 'respijtzorg');
SELECT tag_artikel('pt-7', 'emotionele-steun');
SELECT tag_artikel('pt-8', 'ouderdom');
SELECT tag_artikel('pt-8', 'veiligheid-thuis');
SELECT tag_artikel('pt-9', 'dementie');
SELECT tag_artikel('pt-9', 'dagbesteding');

-- === ZELFZORG ===
SELECT tag_artikel('zz-1', 'intensief');
SELECT tag_artikel('zz-1', 'emotionele-steun');
SELECT tag_artikel('zz-2', 'emotionele-steun');
SELECT tag_artikel('zz-3', 'respijtzorg');
SELECT tag_artikel('zz-3', 'dagbesteding');
SELECT tag_artikel('zz-4', 'werkend');
SELECT tag_artikel('zz-4', 'werk-zorg-balans');
SELECT tag_artikel('zz-5', 'emotionele-steun');
SELECT tag_artikel('zz-6', 'intensief');
SELECT tag_artikel('zz-7', 'respijtzorg');
SELECT tag_artikel('zz-8', 'emotionele-steun');

-- === JE RECHTEN ===
SELECT tag_artikel('re-1', 'wmo-aanvragen');
SELECT tag_artikel('re-1', 'financien');
SELECT tag_artikel('re-3', 'wmo-aanvragen');
SELECT tag_artikel('re-4', 'werkend');
SELECT tag_artikel('re-4', 'werk-zorg-balans');
SELECT tag_artikel('re-5', 'wmo-aanvragen');
SELECT tag_artikel('re-6', 'respijtzorg');
SELECT tag_artikel('re-6', 'wmo-aanvragen');
SELECT tag_artikel('re-7', 'langdurig');
SELECT tag_artikel('re-7', 'intensief');
SELECT tag_artikel('re-8', 'wmo-aanvragen');
SELECT tag_artikel('re-9', 'wmo-aanvragen');

-- === FINANCIEEL ===
SELECT tag_artikel('fi-1', 'financien');
SELECT tag_artikel('fi-1', 'wmo-aanvragen');
SELECT tag_artikel('fi-2', 'financien');
SELECT tag_artikel('fi-3', 'pgb');
SELECT tag_artikel('fi-3', 'financien');
SELECT tag_artikel('fi-4', 'pgb');
SELECT tag_artikel('fi-4', 'financien');
SELECT tag_artikel('fi-5', 'financien');
SELECT tag_artikel('fi-5', 'lichamelijke-beperking');
SELECT tag_artikel('fi-6', 'financien');
SELECT tag_artikel('fi-7', 'financien');
SELECT tag_artikel('fi-8', 'pgb');
SELECT tag_artikel('fi-8', 'financien');
SELECT tag_artikel('fi-9', 'financien');

-- === HULPMIDDELEN ===
SELECT tag_artikel('hp-1', 'lichamelijke-beperking');
SELECT tag_artikel('hp-2', 'wmo-aanvragen');
SELECT tag_artikel('hp-2', 'veiligheid-thuis');
SELECT tag_artikel('hp-2', 'ouderdom');
SELECT tag_artikel('hp-3', 'financien');
SELECT tag_artikel('hp-3', 'wmo-aanvragen');
SELECT tag_artikel('hp-4', 'veiligheid-thuis');
SELECT tag_artikel('hp-4', 'ouderdom');
SELECT tag_artikel('hp-5', 'lichamelijke-beperking');
SELECT tag_artikel('hp-5', 'vervoer');
SELECT tag_artikel('hp-5', 'ouderdom');
SELECT tag_artikel('hp-6', 'dementie');
SELECT tag_artikel('hp-6', 'veiligheid-thuis');
SELECT tag_artikel('hp-6', 'ouderdom');
SELECT tag_artikel('hp-7', 'financien');

-- === GEMEENTE NIEUWS ===
SELECT tag_artikel('gn-nijmegen-1', 'emotionele-steun');
SELECT tag_artikel('gn-nijmegen-2', 'financien');
SELECT tag_artikel('gn-arnhem-1', 'emotionele-steun');
SELECT tag_artikel('gn-arnhem-2', 'respijtzorg');
SELECT tag_artikel('gn-arnhem-2', 'wmo-aanvragen');
SELECT tag_artikel('gn-zutphen-1', 'emotionele-steun');
SELECT tag_artikel('gn-zutphen-2', 'financien');

-- Opruimen
DROP FUNCTION IF EXISTS tag_artikel(TEXT, TEXT);

-- ============================================
-- KLAAR! Check: SELECT COUNT(*) FROM "ArtikelTag";
-- ============================================
