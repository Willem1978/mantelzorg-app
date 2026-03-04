-- ============================================================
-- Fix Supabase Security Warnings
-- ============================================================
--
-- Lost op:
--   1. Function Search Path Mutable (3 functies)
--   2. RLS Disabled in Public (8 tabellen)
--
-- Uitvoeren: Supabase Dashboard → SQL Editor → plak dit script → Run
-- ============================================================


-- ============================================================
-- DEEL 1: Function Search Path - set search_path op alle functies
-- ============================================================
-- Zonder vaste search_path kan een aanvaller via een aangepaste
-- search_path andere functies/tabellen injecteren.
-- ============================================================

-- 1a. match_artikelen
CREATE OR REPLACE FUNCTION match_artikelen(
  query_embedding extensions.vector(1536),
  match_threshold float DEFAULT 0.5,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id text,
  titel text,
  beschrijving text,
  categorie text,
  url text,
  bron text,
  "bronLabel" text,
  emoji text,
  similarity float
)
LANGUAGE plpgsql
SET search_path = public, extensions
AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id,
    a.titel,
    a.beschrijving,
    a.categorie,
    a.url,
    a.bron,
    a."bronLabel",
    a.emoji,
    1 - (a.embedding <=> query_embedding) AS similarity
  FROM "Artikel" a
  WHERE a."isActief" = true
    AND a.embedding IS NOT NULL
    AND 1 - (a.embedding <=> query_embedding) > match_threshold
  ORDER BY a.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- 1b. match_zorgorganisaties
CREATE OR REPLACE FUNCTION match_zorgorganisaties(
  query_embedding extensions.vector(1536),
  match_threshold float DEFAULT 0.5,
  match_count int DEFAULT 5,
  filter_gemeente text DEFAULT NULL
)
RETURNS TABLE (
  id text,
  naam text,
  beschrijving text,
  dienst text,
  telefoon text,
  website text,
  email text,
  gemeente text,
  kosten text,
  openingstijden text,
  "soortHulp" text,
  "onderdeelTest" text,
  similarity float
)
LANGUAGE plpgsql
SET search_path = public, extensions
AS $$
BEGIN
  RETURN QUERY
  SELECT
    z.id,
    z.naam,
    z.beschrijving,
    z.dienst,
    z.telefoon,
    z.website,
    z.email,
    z.gemeente,
    z.kosten,
    z.openingstijden,
    z."soortHulp",
    z."onderdeelTest",
    1 - (z.embedding <=> query_embedding) AS similarity
  FROM "Zorgorganisatie" z
  WHERE z."isActief" = true
    AND z.embedding IS NOT NULL
    AND 1 - (z.embedding <=> query_embedding) > match_threshold
    AND (filter_gemeente IS NULL OR z.gemeente = filter_gemeente)
  ORDER BY z.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- 1c. semantic_search
CREATE OR REPLACE FUNCTION semantic_search(
  query_embedding extensions.vector(1536),
  match_threshold float DEFAULT 0.5,
  match_count int DEFAULT 10,
  filter_gemeente text DEFAULT NULL,
  search_type text DEFAULT 'all'
)
RETURNS TABLE (
  id text,
  bron_type text,
  titel text,
  beschrijving text,
  extra_info jsonb,
  similarity float
)
LANGUAGE plpgsql
SET search_path = public, extensions
AS $$
BEGIN
  RETURN QUERY
  (
    SELECT
      a.id,
      'artikel'::text AS bron_type,
      a.titel,
      a.beschrijving,
      jsonb_build_object(
        'categorie', a.categorie,
        'url', a.url,
        'bron', a.bron,
        'bronLabel', a."bronLabel",
        'emoji', a.emoji
      ) AS extra_info,
      1 - (a.embedding <=> query_embedding) AS similarity
    FROM "Artikel" a
    WHERE a."isActief" = true
      AND a.embedding IS NOT NULL
      AND 1 - (a.embedding <=> query_embedding) > match_threshold
      AND search_type IN ('all', 'artikelen')
  )
  UNION ALL
  (
    SELECT
      z.id,
      'hulpbron'::text AS bron_type,
      z.naam AS titel,
      z.beschrijving,
      jsonb_build_object(
        'dienst', z.dienst,
        'telefoon', z.telefoon,
        'website', z.website,
        'email', z.email,
        'gemeente', z.gemeente,
        'kosten', z.kosten,
        'openingstijden', z.openingstijden,
        'soortHulp', z."soortHulp",
        'onderdeelTest', z."onderdeelTest"
      ) AS extra_info,
      1 - (z.embedding <=> query_embedding) AS similarity
    FROM "Zorgorganisatie" z
    WHERE z."isActief" = true
      AND z.embedding IS NOT NULL
      AND 1 - (z.embedding <=> query_embedding) > match_threshold
      AND (filter_gemeente IS NULL OR z.gemeente = filter_gemeente)
      AND search_type IN ('all', 'hulpbronnen')
  )
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;


-- ============================================================
-- DEEL 2: RLS inschakelen op 8 ontbrekende tabellen
-- ============================================================

ALTER TABLE IF EXISTS "SiteSettings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "Gemeente" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "CoachAdvies" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "Bericht" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "ArtikelTag" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "ContentTag" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "GebruikerVoorkeur" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "GemeenteStap" ENABLE ROW LEVEL SECURITY;

-- Policies aanmaken (idempotent: drop + create)
DO $$
DECLARE
  tbl TEXT;
  missing_tables TEXT[] := ARRAY[
    'SiteSettings', 'Gemeente', 'CoachAdvies', 'Bericht',
    'ArtikelTag', 'ContentTag', 'GebruikerVoorkeur', 'GemeenteStap'
  ];
BEGIN
  FOR tbl IN SELECT unnest(missing_tables)
  LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = tbl
    ) THEN
      EXECUTE format('DROP POLICY IF EXISTS "postgres_full_access" ON %I', tbl);
      EXECUTE format(
        'CREATE POLICY "postgres_full_access" ON %I FOR ALL TO postgres USING (true) WITH CHECK (true)',
        tbl
      );
      RAISE NOTICE '✓ RLS + policy OK voor tabel: %', tbl;
    ELSE
      RAISE NOTICE '⚠ Tabel % bestaat niet (overgeslagen)', tbl;
    END IF;
  END LOOP;
END
$$;


-- ============================================================
-- Verificatie
-- ============================================================

SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'SiteSettings', 'Gemeente', 'CoachAdvies', 'Bericht',
    'ArtikelTag', 'ContentTag', 'GebruikerVoorkeur', 'GemeenteStap'
  )
ORDER BY tablename;
