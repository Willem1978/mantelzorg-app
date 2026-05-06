-- Migratie voor Ronde 16 — AI-telemetrie
--
-- Plak deze SQL in Supabase → SQL Editor → Run.
-- De SQL is idempotent (gebruikt IF NOT EXISTS), dus veilig om opnieuw te draaien.
--
-- Wat het doet:
-- - Maakt de tabel "AiInteractie" aan voor lichtgewicht telemetrie van
--   AI-route-aanroepen (kosten, latency, tool-gebruik, errors).
-- - Geen berichten of inhoud worden opgeslagen — alleen meta-data.

CREATE TABLE IF NOT EXISTS "AiInteractie" (
  "id"            TEXT NOT NULL,
  "userId"        TEXT,
  "route"         TEXT NOT NULL,
  "model"         TEXT,
  "pagina"        TEXT,
  "durationMs"    INTEGER NOT NULL,
  "toolsCalled"   TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "toolsFailed"   TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "inputTokens"   INTEGER,
  "outputTokens"  INTEGER,
  "status"        TEXT NOT NULL,
  "errorBericht"  TEXT,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AiInteractie_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "AiInteractie_userId_createdAt_idx"
  ON "AiInteractie"("userId", "createdAt");

CREATE INDEX IF NOT EXISTS "AiInteractie_route_createdAt_idx"
  ON "AiInteractie"("route", "createdAt");

CREATE INDEX IF NOT EXISTS "AiInteractie_status_createdAt_idx"
  ON "AiInteractie"("status", "createdAt");

-- Veiligheid: deze tabel bevat geen content, maar wel userId. RLS aanzetten
-- zodat alleen de service_role (backend) erbij kan.
ALTER TABLE "AiInteractie" ENABLE ROW LEVEL SECURITY;
