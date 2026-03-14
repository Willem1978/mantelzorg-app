-- ============================================
-- ITERATIE A: Profiel & Tags Fundament
-- COMPLEET — kopieer en plak in Supabase SQL Editor
-- ============================================

-- ============================================
-- STAP 1: TagType enum uitbreiden met ONDERWERP
-- ============================================
ALTER TYPE "TagType" ADD VALUE IF NOT EXISTS 'ONDERWERP';

-- ============================================
-- STAP 2: Nieuwe kolommen op Caregiver
-- ============================================
ALTER TABLE "Caregiver" ADD COLUMN IF NOT EXISTS "woonsituatie" TEXT;
ALTER TABLE "Caregiver" ADD COLUMN IF NOT EXISTS "werkstatus" TEXT;

-- ============================================
-- STAP 3: Synoniemen kolom op ContentTag
-- ============================================
ALTER TABLE "ContentTag" ADD COLUMN IF NOT EXISTS "synoniemen" TEXT[] DEFAULT '{}';

-- ============================================
-- STAP 4: Nieuwe SITUATIE-tags toevoegen
-- ============================================
INSERT INTO "ContentTag" ("id", "type", "slug", "naam", "emoji", "volgorde", "isActief", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid()::text, 'SITUATIE', 'werkend-parttime', 'Parttime werkend', '🕐', 3, true, NOW(), NOW()),
  (gen_random_uuid()::text, 'SITUATIE', 'student', 'Studerende mantelzorger', '🎓', 4, true, NOW(), NOW()),
  (gen_random_uuid()::text, 'SITUATIE', 'gepensioneerd', 'Gepensioneerde mantelzorger', '👴', 5, true, NOW(), NOW()),
  (gen_random_uuid()::text, 'SITUATIE', 'dichtbij', 'Naaste woont dichtbij', '📍', 7, true, NOW(), NOW()),
  (gen_random_uuid()::text, 'SITUATIE', 'alleenstaand', 'Alleenstaande mantelzorger', '🏚️', 17, true, NOW(), NOW())
ON CONFLICT ("slug") DO NOTHING;

-- Bestaande tags: emoji/volgorde bijwerken voor consistentie
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

-- ============================================
-- STAP 5: ONDERWERP-tags toevoegen
-- ============================================
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

-- ============================================
-- STAP 6: ARTIKELEN TAGGEN
-- Koppel bestaande artikelen aan relevante tags
-- via de ArtikelTag koppeltabel
-- ============================================

-- Helperfunctie: koppel artikel aan tag (skip als al bestaat)
-- We gebruiken een DO-block met een functie zodat we niet steeds
-- de tag-id hoeven op te zoeken

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

-- pt-1: Dagstructuur en weekplanning
SELECT tag_artikel('pt-1', 'ouderdom');

-- pt-2: Tips voor veilig medicijngebruik
SELECT tag_artikel('pt-2', 'medicatie');
SELECT tag_artikel('pt-2', 'veiligheid-thuis');

-- pt-3: Samenwerken met de thuiszorg
SELECT tag_artikel('pt-3', 'respijtzorg');

-- pt-4: Communiceren met je naaste
SELECT tag_artikel('pt-4', 'dementie');

-- pt-5: Veilig tillen en verplaatsen
SELECT tag_artikel('pt-5', 'lichamelijke-beperking');
SELECT tag_artikel('pt-5', 'veiligheid-thuis');

-- pt-6: Zorgrooster maken met familie
SELECT tag_artikel('pt-6', 'respijtzorg');

-- pt-7: Hulp vragen aan je omgeving
SELECT tag_artikel('pt-7', 'emotionele-steun');

-- pt-8: Valpreventie in huis
SELECT tag_artikel('pt-8', 'ouderdom');
SELECT tag_artikel('pt-8', 'veiligheid-thuis');

-- pt-9: Dagstructuur bij dementie
SELECT tag_artikel('pt-9', 'dementie');
SELECT tag_artikel('pt-9', 'dagbesteding');

-- === ZELFZORG ===

-- zz-1: Herken overbelasting op tijd
SELECT tag_artikel('zz-1', 'intensief');
SELECT tag_artikel('zz-1', 'emotionele-steun');

-- zz-2: Grenzen stellen als mantelzorger
SELECT tag_artikel('zz-2', 'emotionele-steun');

-- zz-3: Vervangende mantelzorg: even vrij van zorgen
SELECT tag_artikel('zz-3', 'respijtzorg');
SELECT tag_artikel('zz-3', 'dagbesteding');

-- zz-4: Werk en mantelzorg combineren
SELECT tag_artikel('zz-4', 'werkend');
SELECT tag_artikel('zz-4', 'werk-zorg-balans');

-- zz-5: De Mantelzorglijn: praat met iemand
SELECT tag_artikel('zz-5', 'emotionele-steun');

-- zz-6: De mantelzorgtest: hoe belast ben jij?
SELECT tag_artikel('zz-6', 'intensief');

-- zz-7: Logeeropvang en vakantiemogelijkheden
SELECT tag_artikel('zz-7', 'respijtzorg');

-- zz-8: Lotgenotencontact: praat met andere mantelzorgers
SELECT tag_artikel('zz-8', 'emotionele-steun');

-- === JE RECHTEN ===

-- re-1: De Wmo: hulp via je gemeente
SELECT tag_artikel('re-1', 'wmo-aanvragen');
SELECT tag_artikel('re-1', 'financien');

-- re-2: Mantelzorg is altijd vrijwillig
-- (algemeen, geen specifieke tag)

-- re-3: Het keukentafelgesprek
SELECT tag_artikel('re-3', 'wmo-aanvragen');

-- re-4: Recht op zorgverlof van je werk
SELECT tag_artikel('re-4', 'werkend');
SELECT tag_artikel('re-4', 'werk-zorg-balans');

-- re-5: Gratis onafhankelijke clientondersteuning
SELECT tag_artikel('re-5', 'wmo-aanvragen');

-- re-6: Recht op vervangende mantelzorg
SELECT tag_artikel('re-6', 'respijtzorg');
SELECT tag_artikel('re-6', 'wmo-aanvragen');

-- re-7: De Wlz: langdurige zorg
SELECT tag_artikel('re-7', 'langdurig');
SELECT tag_artikel('re-7', 'intensief');

-- re-8: Bezwaar maken tegen een beslissing
SELECT tag_artikel('re-8', 'wmo-aanvragen');

-- re-9: Regelhulp: welke zorg past bij jou?
SELECT tag_artikel('re-9', 'wmo-aanvragen');

-- === FINANCIEEL ===

-- fi-1: Eigen bijdrage en kosten (CAK)
SELECT tag_artikel('fi-1', 'financien');
SELECT tag_artikel('fi-1', 'wmo-aanvragen');

-- fi-2: Mantelzorgwaardering van je gemeente
SELECT tag_artikel('fi-2', 'financien');

-- fi-3: Betaald worden via een PGB
SELECT tag_artikel('fi-3', 'pgb');
SELECT tag_artikel('fi-3', 'financien');

-- fi-4: Belasting en PGB-inkomen
SELECT tag_artikel('fi-4', 'pgb');
SELECT tag_artikel('fi-4', 'financien');

-- fi-5: Vergoedingen hulpmiddelen
SELECT tag_artikel('fi-5', 'financien');
SELECT tag_artikel('fi-5', 'lichamelijke-beperking');

-- fi-6: Zorgkosten aftrekken bij de belasting
SELECT tag_artikel('fi-6', 'financien');

-- fi-7: Mantelzorgcompliment aanvragen
SELECT tag_artikel('fi-7', 'financien');

-- fi-8: PGB declareren via de SVB
SELECT tag_artikel('fi-8', 'pgb');
SELECT tag_artikel('fi-8', 'financien');

-- fi-9: Zorgtoeslag en huurtoeslag
SELECT tag_artikel('fi-9', 'financien');

-- === HULPMIDDELEN ===

-- hp-1: Hulpmiddelenwijzer
SELECT tag_artikel('hp-1', 'lichamelijke-beperking');

-- hp-2: Woningaanpassingen via de Wmo
SELECT tag_artikel('hp-2', 'wmo-aanvragen');
SELECT tag_artikel('hp-2', 'veiligheid-thuis');
SELECT tag_artikel('hp-2', 'ouderdom');

-- hp-3: Welk hulpmiddel via welke wet?
SELECT tag_artikel('hp-3', 'financien');
SELECT tag_artikel('hp-3', 'wmo-aanvragen');

-- hp-4: Douchestoel, toiletverhoger en badlift
SELECT tag_artikel('hp-4', 'veiligheid-thuis');
SELECT tag_artikel('hp-4', 'ouderdom');

-- hp-5: Rollator, rolstoel en scootmobiel
SELECT tag_artikel('hp-5', 'lichamelijke-beperking');
SELECT tag_artikel('hp-5', 'vervoer');
SELECT tag_artikel('hp-5', 'ouderdom');

-- hp-6: Personenalarmering en GPS-tracker
SELECT tag_artikel('hp-6', 'dementie');
SELECT tag_artikel('hp-6', 'veiligheid-thuis');
SELECT tag_artikel('hp-6', 'ouderdom');

-- hp-7: Hulpmiddelen via je zorgverzekeraar
SELECT tag_artikel('hp-7', 'financien');

-- === GEMEENTE NIEUWS ===

-- gn-nijmegen-1: Gratis mantelzorgcursus
SELECT tag_artikel('gn-nijmegen-1', 'emotionele-steun');

-- gn-nijmegen-2: Mantelzorgwaardering Nijmegen
SELECT tag_artikel('gn-nijmegen-2', 'financien');

-- gn-arnhem-1: Nieuw steunpunt mantelzorg
SELECT tag_artikel('gn-arnhem-1', 'emotionele-steun');

-- gn-arnhem-2: Vervangende mantelzorg aanvragen
SELECT tag_artikel('gn-arnhem-2', 'respijtzorg');
SELECT tag_artikel('gn-arnhem-2', 'wmo-aanvragen');

-- gn-zutphen-1: Lotgenotengroep
SELECT tag_artikel('gn-zutphen-1', 'emotionele-steun');

-- gn-zutphen-2: Mantelzorgcompliment Zutphen
SELECT tag_artikel('gn-zutphen-2', 'financien');

-- Opruimen: verwijder de helperfunctie
DROP FUNCTION IF EXISTS tag_artikel(TEXT, TEXT);

-- ============================================
-- KLAAR!
-- Controleer met: SELECT COUNT(*) FROM "ArtikelTag";
-- ============================================
