-- ============================================
-- MantelBuddy: RLS fix voor ontbrekende tabellen
-- ============================================
--
-- 9 tabellen hadden nog geen RLS ingeschakeld:
-- InviteToken, Artikel, AuditLog, BalanstestVraag,
-- Zorgtaak, TaakCategorieMapping, ContentCategorie,
-- FormulierOptie, AppContent
--
-- Dit script voegt RLS + postgres_full_access policy toe
-- voor deze tabellen. Veilig om meerdere keren uit te voeren
-- dankzij IF NOT EXISTS.
--
-- Uitvoeren: Supabase Dashboard → SQL Editor → plak dit script
-- ============================================

-- ============================================
-- 1. RLS inschakelen op ontbrekende tabellen
-- ============================================

ALTER TABLE "InviteToken" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Artikel" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BalanstestVraag" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Zorgtaak" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TaakCategorieMapping" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ContentCategorie" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "FormulierOptie" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AppContent" ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. Policies: postgres-rol volledige toegang
-- ============================================

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'InviteToken', 'Artikel', 'AuditLog', 'BalanstestVraag',
    'Zorgtaak', 'TaakCategorieMapping', 'ContentCategorie',
    'FormulierOptie', 'AppContent'
  ])
  LOOP
    -- Verwijder bestaande policy als die er al is (idempotent)
    EXECUTE format('DROP POLICY IF EXISTS "postgres_full_access" ON %I', tbl);
    -- Maak nieuwe policy
    EXECUTE format(
      'CREATE POLICY "postgres_full_access" ON %I FOR ALL TO postgres USING (true) WITH CHECK (true)',
      tbl
    );
    RAISE NOTICE 'RLS + policy toegevoegd voor tabel: %', tbl;
  END LOOP;
END
$$;

-- ============================================
-- Klaar! 9 ontbrekende tabellen hebben nu RLS.
-- Totaal: 40 tabellen beveiligd.
-- ============================================
