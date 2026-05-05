-- Migratie voor Ronde 11 — Gespreksgeheugen voor Ger
--
-- Plak deze SQL in Supabase → SQL Editor → Run.
-- De SQL is idempotent (gebruikt IF NOT EXISTS), dus veilig om opnieuw te draaien.
--
-- Wat het doet:
-- - Maakt de tabel "GesprekSamenvatting" aan voor de korte samenvattingen
--   die /api/ai/samenvat na elk gesprek opslaat.
-- - Voegt een index toe op (userId, createdAt) zodat de prefetch snel
--   de laatste 3 samenvattingen per gebruiker kan ophalen.

CREATE TABLE IF NOT EXISTS "GesprekSamenvatting" (
  "id"                      TEXT NOT NULL,
  "userId"                  TEXT NOT NULL,
  "samenvatting"            TEXT NOT NULL,
  "onderwerpen"             TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "actiepuntenAangemaakt"   INTEGER NOT NULL DEFAULT 0,
  "berichtenAantal"         INTEGER NOT NULL DEFAULT 0,
  "createdAt"               TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "GesprekSamenvatting_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "GesprekSamenvatting_userId_createdAt_idx"
  ON "GesprekSamenvatting"("userId", "createdAt");
