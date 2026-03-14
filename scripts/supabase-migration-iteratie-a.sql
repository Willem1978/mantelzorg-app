-- ============================================
-- ITERATIE A: Profiel & Tags Fundament
-- Voer dit uit in de Supabase SQL Editor
-- ============================================

-- STAP 1: TagType enum uitbreiden met ONDERWERP
-- ============================================
ALTER TYPE "TagType" ADD VALUE IF NOT EXISTS 'ONDERWERP';

-- STAP 2: Nieuwe kolommen op Caregiver
-- ============================================
ALTER TABLE "Caregiver" ADD COLUMN IF NOT EXISTS "woonsituatie" TEXT;
ALTER TABLE "Caregiver" ADD COLUMN IF NOT EXISTS "werkstatus" TEXT;

-- STAP 3: Synoniemen kolom op ContentTag
-- ============================================
ALTER TABLE "ContentTag" ADD COLUMN IF NOT EXISTS "synoniemen" TEXT[] DEFAULT '{}';

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

-- Tags die in productie bestonden maar niet in seed: update emoji/volgorde
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

-- KLAAR!
-- Na deze migratie kun je het artikel-tagging script draaien:
-- npx tsx scripts/seed-artikel-tags.ts
