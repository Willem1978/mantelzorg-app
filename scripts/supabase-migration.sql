-- ============================================
-- CONTENT HERSTRUCTURERING - Supabase SQL Migratie
-- Voer dit uit in de Supabase SQL Editor
-- ============================================

-- STAP 1: Nieuwe enums aanmaken
-- ============================================

DO $$ BEGIN
  CREATE TYPE "TagType" AS ENUM ('AANDOENING', 'SITUATIE');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "VoorkeurType" AS ENUM ('CATEGORIE', 'TAG');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;


-- STAP 2: Nieuwe tabellen aanmaken
-- ============================================

-- ContentTag tabel
CREATE TABLE IF NOT EXISTS "ContentTag" (
  "id"           TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "type"         "TagType" NOT NULL,
  "slug"         TEXT NOT NULL,
  "naam"         TEXT NOT NULL,
  "beschrijving" TEXT,
  "emoji"        TEXT,
  "volgorde"     INTEGER NOT NULL DEFAULT 0,
  "isActief"     BOOLEAN NOT NULL DEFAULT true,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ContentTag_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ContentTag_slug_key" ON "ContentTag"("slug");
CREATE INDEX IF NOT EXISTS "ContentTag_type_isActief_idx" ON "ContentTag"("type", "isActief");


-- ArtikelTag koppeltabel
CREATE TABLE IF NOT EXISTS "ArtikelTag" (
  "id"        TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "artikelId" TEXT NOT NULL,
  "tagId"     TEXT NOT NULL,

  CONSTRAINT "ArtikelTag_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ArtikelTag_artikelId_tagId_key" ON "ArtikelTag"("artikelId", "tagId");
CREATE INDEX IF NOT EXISTS "ArtikelTag_tagId_idx" ON "ArtikelTag"("tagId");

-- Foreign keys voor ArtikelTag
ALTER TABLE "ArtikelTag"
  ADD CONSTRAINT "ArtikelTag_artikelId_fkey"
  FOREIGN KEY ("artikelId") REFERENCES "Artikel"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ArtikelTag"
  ADD CONSTRAINT "ArtikelTag_tagId_fkey"
  FOREIGN KEY ("tagId") REFERENCES "ContentTag"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;


-- GebruikerVoorkeur tabel
CREATE TABLE IF NOT EXISTS "GebruikerVoorkeur" (
  "id"          TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "caregiverId" TEXT NOT NULL,
  "type"        "VoorkeurType" NOT NULL,
  "slug"        TEXT NOT NULL,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "GebruikerVoorkeur_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "GebruikerVoorkeur_caregiverId_type_slug_key"
  ON "GebruikerVoorkeur"("caregiverId", "type", "slug");
CREATE INDEX IF NOT EXISTS "GebruikerVoorkeur_caregiverId_idx"
  ON "GebruikerVoorkeur"("caregiverId");

-- Foreign key voor GebruikerVoorkeur
ALTER TABLE "GebruikerVoorkeur"
  ADD CONSTRAINT "GebruikerVoorkeur_caregiverId_fkey"
  FOREIGN KEY ("caregiverId") REFERENCES "Caregiver"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;


-- STAP 3: Kolom wijzigingen
-- ============================================

-- Voeg 'aandoening' kolom toe aan Caregiver (als die nog niet bestaat)
ALTER TABLE "Caregiver"
  ADD COLUMN IF NOT EXISTS "aandoening" TEXT;

-- Verwijder 'belastingNiveau' kolom uit Artikel (als die bestaat)
-- LET OP: Dit verwijdert alle data in deze kolom!
ALTER TABLE "Artikel"
  DROP COLUMN IF EXISTS "belastingNiveau";

-- Voeg index toe op subHoofdstuk (als die nog niet bestaat)
CREATE INDEX IF NOT EXISTS "Artikel_subHoofdstuk_idx" ON "Artikel"("subHoofdstuk");


-- STAP 4: Seed data - 12 Aandoening tags
-- ============================================

INSERT INTO "ContentTag" ("id", "type", "slug", "naam", "beschrijving", "emoji", "volgorde", "isActief", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid()::text, 'AANDOENING', 'dementie', 'Dementie', 'Alzheimer en andere vormen van dementie', '🧠', 1, true, NOW(), NOW()),
  (gen_random_uuid()::text, 'AANDOENING', 'kanker', 'Kanker', 'Oncologische aandoeningen', '🎗️', 2, true, NOW(), NOW()),
  (gen_random_uuid()::text, 'AANDOENING', 'hart-vaatziekten', 'Hart- en vaatziekten', 'Hartfalen, beroerte, etc.', '❤️', 3, true, NOW(), NOW()),
  (gen_random_uuid()::text, 'AANDOENING', 'psychisch', 'Psychische aandoening', 'Depressie, angst, schizofrenie, etc.', '💭', 4, true, NOW(), NOW()),
  (gen_random_uuid()::text, 'AANDOENING', 'verstandelijke-beperking', 'Verstandelijke beperking', 'Aangeboren of verworven verstandelijke beperking', '🌟', 5, true, NOW(), NOW()),
  (gen_random_uuid()::text, 'AANDOENING', 'lichamelijke-beperking', 'Lichamelijke beperking', 'Mobiliteit, spieraandoeningen, etc.', '🦽', 6, true, NOW(), NOW()),
  (gen_random_uuid()::text, 'AANDOENING', 'niet-aangeboren-hersenletsel', 'NAH (niet-aangeboren hersenletsel)', 'CVA, traumatisch hersenletsel', '🧩', 7, true, NOW(), NOW()),
  (gen_random_uuid()::text, 'AANDOENING', 'copd-longziekten', 'COPD / Longziekten', 'Chronische longaandoeningen', '🫁', 8, true, NOW(), NOW()),
  (gen_random_uuid()::text, 'AANDOENING', 'parkinson', 'Parkinson', 'Ziekte van Parkinson', '🤲', 9, true, NOW(), NOW()),
  (gen_random_uuid()::text, 'AANDOENING', 'ms', 'MS (Multiple Sclerose)', 'Multiple Sclerose', '🔬', 10, true, NOW(), NOW()),
  (gen_random_uuid()::text, 'AANDOENING', 'diabetes', 'Diabetes', 'Suikerziekte type 1 en 2', '💉', 11, true, NOW(), NOW()),
  (gen_random_uuid()::text, 'AANDOENING', 'ouderdom-kwetsbaarheid', 'Ouderdomsklachten', 'Algehele kwetsbaarheid door ouderdom', '👴', 12, true, NOW(), NOW())
ON CONFLICT ("slug") DO NOTHING;


-- STAP 5: Seed data - 9 Situatie tags
-- ============================================

INSERT INTO "ContentTag" ("id", "type", "slug", "naam", "beschrijving", "emoji", "volgorde", "isActief", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid()::text, 'SITUATIE', 'werkend', 'Werkende mantelzorger', 'Combinatie werk en mantelzorg', '💼', 1, true, NOW(), NOW()),
  (gen_random_uuid()::text, 'SITUATIE', 'jong', 'Jonge mantelzorger', 'Mantelzorger onder de 25 jaar', '🎓', 2, true, NOW(), NOW()),
  (gen_random_uuid()::text, 'SITUATIE', 'op-afstand', 'Mantelzorg op afstand', 'Zorgvrager woont niet in de buurt', '📍', 3, true, NOW(), NOW()),
  (gen_random_uuid()::text, 'SITUATIE', 'beginnend', 'Net begonnen', 'Recent mantelzorger geworden', '🌱', 4, true, NOW(), NOW()),
  (gen_random_uuid()::text, 'SITUATIE', 'intensief', 'Intensieve zorg', 'Meer dan 20 uur per week mantelzorg', '⏰', 5, true, NOW(), NOW()),
  (gen_random_uuid()::text, 'SITUATIE', 'samenwonend', 'Samenwonend met zorgvrager', 'Woont samen met de persoon die zorg nodig heeft', '🏠', 6, true, NOW(), NOW()),
  (gen_random_uuid()::text, 'SITUATIE', 'meerdere-zorgvragers', 'Meerdere zorgvragers', 'Zorgt voor meer dan één persoon', '👥', 7, true, NOW(), NOW()),
  (gen_random_uuid()::text, 'SITUATIE', 'rouwverwerking', 'Na het overlijden', 'Rouwverwerking na verlies zorgvrager', '🕊️', 8, true, NOW(), NOW()),
  (gen_random_uuid()::text, 'SITUATIE', 'naast-eigen-kinderen', 'Mantelzorg naast eigen kinderen', 'Combineert mantelzorg met opvoeding', '👨‍👩‍👧', 9, true, NOW(), NOW())
ON CONFLICT ("slug") DO NOTHING;


-- ============================================
-- KLAAR! Controleer met:
-- SELECT * FROM "ContentTag" ORDER BY "type", "volgorde";
-- SELECT COUNT(*) FROM "ContentTag";  -- Moet 21 zijn
-- ============================================
