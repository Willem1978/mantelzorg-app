-- ============================================
-- MantelZorg App: VOLLEDIGE RLS Fix
-- ============================================
--
-- Lost 67 "Policy Exists RLS Disabled" fouten op.
-- Dit script:
--   1. Schakelt RLS in op ALLE 40 tabellen
--   2. Verwijdert en maakt policies opnieuw aan (idempotent)
--   3. Veilig om meerdere keren uit te voeren
--
-- Uitvoeren: Supabase Dashboard → SQL Editor → plak dit script → Run
-- ============================================

-- ============================================
-- STAP 1: RLS inschakelen op ALLE tabellen
-- ============================================

-- Auth-gerelateerde tabellen
ALTER TABLE IF EXISTS "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "Account" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "Session" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "VerificationToken" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "MagicLinkToken" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "PasswordResetToken" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "InviteToken" ENABLE ROW LEVEL SECURITY;

-- Mantelzorger profiel & intake
ALTER TABLE IF EXISTS "Caregiver" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "IntakeCategory" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "IntakeQuestion" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "IntakeResponse" ENABLE ROW LEVEL SECURITY;

-- Check-in & taken
ALTER TABLE IF EXISTS "MonthlyCheckIn" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "Task" ENABLE ROW LEVEL SECURITY;

-- Resources & organisaties
ALTER TABLE IF EXISTS "Resource" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "Organisation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "OrganisationMember" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "CaregiverOrganisation" ENABLE ROW LEVEL SECURITY;

-- Notificaties & hulpvragen
ALTER TABLE IF EXISTS "Notification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "HelpRequest" ENABLE ROW LEVEL SECURITY;

-- Agenda
ALTER TABLE IF EXISTS "CalendarEvent" ENABLE ROW LEVEL SECURITY;

-- Belastbaarheidstest
ALTER TABLE IF EXISTS "BelastbaarheidTest" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "BelastbaarheidAntwoord" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "ZorgtaakSelectie" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "Zorgorganisatie" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "BelastbaarheidRapport" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "AlarmLog" ENABLE ROW LEVEL SECURITY;

-- Artikelen & content management
ALTER TABLE IF EXISTS "Artikel" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "AuditLog" ENABLE ROW LEVEL SECURITY;

-- Favorieten
ALTER TABLE IF EXISTS "Favoriet" ENABLE ROW LEVEL SECURITY;

-- MantelBuddy vrijwilligers
ALTER TABLE IF EXISTS "MantelBuddy" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "BuddyMatch" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "BuddyTaak" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "BuddyTaakReactie" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "BuddyBeoordeling" ENABLE ROW LEVEL SECURITY;

-- Content beheer tabellen
ALTER TABLE IF EXISTS "BalanstestVraag" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "Zorgtaak" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "TaakCategorieMapping" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "ContentCategorie" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "FormulierOptie" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "AppContent" ENABLE ROW LEVEL SECURITY;

-- Prisma migrations tabel
ALTER TABLE IF EXISTS "_prisma_migrations" ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STAP 2: Policies opnieuw aanmaken (idempotent)
-- ============================================
-- Drop + Create per tabel zodat het altijd werkt,
-- ongeacht of de policy al bestond.
-- ============================================

DO $$
DECLARE
  tbl TEXT;
  all_tables TEXT[] := ARRAY[
    'User', 'Account', 'Session', 'VerificationToken',
    'MagicLinkToken', 'PasswordResetToken', 'InviteToken',
    'Caregiver', 'IntakeCategory', 'IntakeQuestion', 'IntakeResponse',
    'MonthlyCheckIn', 'Task',
    'Resource', 'Organisation', 'OrganisationMember', 'CaregiverOrganisation',
    'Notification', 'HelpRequest',
    'CalendarEvent',
    'BelastbaarheidTest', 'BelastbaarheidAntwoord', 'ZorgtaakSelectie',
    'Zorgorganisatie', 'BelastbaarheidRapport', 'AlarmLog',
    'Artikel', 'AuditLog',
    'Favoriet',
    'MantelBuddy', 'BuddyMatch', 'BuddyTaak', 'BuddyTaakReactie', 'BuddyBeoordeling',
    'BalanstestVraag', 'Zorgtaak', 'TaakCategorieMapping',
    'ContentCategorie', 'FormulierOptie', 'AppContent',
    '_prisma_migrations'
  ];
BEGIN
  FOR tbl IN SELECT unnest(all_tables)
  LOOP
    -- Check of de tabel bestaat
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = tbl
    ) THEN
      -- Verwijder bestaande policy
      EXECUTE format('DROP POLICY IF EXISTS "postgres_full_access" ON %I', tbl);
      -- Maak nieuwe policy
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

-- ============================================
-- STAP 3: Verificatie - toon RLS status
-- ============================================

SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- ============================================
-- Klaar! Alle tabellen hebben nu:
--   ✓ RLS ingeschakeld
--   ✓ postgres_full_access policy
--
-- Alleen postgres (Prisma) en service_role
-- hebben volledige toegang.
-- anon en authenticated rollen zijn GEBLOKKEERD.
-- ============================================
