-- ============================================
-- MantelBuddy: Row Level Security (RLS) inschakelen
-- ============================================
--
-- Dit script schakelt RLS in op alle tabellen en maakt een policy
-- die alleen toegang geeft via de service_role (Prisma connectie).
--
-- De app benadert de database ALLEEN via Prisma (server-side),
-- niet via de Supabase client SDK. Daarom blokkeren we alle
-- directe Supabase API-toegang (anon/authenticated rollen).
--
-- Uitvoeren: Supabase Dashboard → SQL Editor → plak dit script
-- ============================================

-- ============================================
-- 1. RLS inschakelen op alle tabellen
-- ============================================

-- Auth-gerelateerde tabellen
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Account" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Session" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "VerificationToken" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MagicLinkToken" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PasswordResetToken" ENABLE ROW LEVEL SECURITY;

-- Mantelzorger profiel & intake
ALTER TABLE "Caregiver" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "IntakeCategory" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "IntakeQuestion" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "IntakeResponse" ENABLE ROW LEVEL SECURITY;

-- Check-in & taken
ALTER TABLE "MonthlyCheckIn" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Task" ENABLE ROW LEVEL SECURITY;

-- Resources & organisaties
ALTER TABLE "Resource" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Organisation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "OrganisationMember" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CaregiverOrganisation" ENABLE ROW LEVEL SECURITY;

-- Notificaties & hulpvragen
ALTER TABLE "Notification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "HelpRequest" ENABLE ROW LEVEL SECURITY;

-- Agenda
ALTER TABLE "CalendarEvent" ENABLE ROW LEVEL SECURITY;

-- Belastbaarheidstest
ALTER TABLE "BelastbaarheidTest" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BelastbaarheidAntwoord" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ZorgtaakSelectie" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Zorgorganisatie" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BelastbaarheidRapport" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AlarmLog" ENABLE ROW LEVEL SECURITY;

-- Favorieten
ALTER TABLE "Favoriet" ENABLE ROW LEVEL SECURITY;

-- MantelBuddy vrijwilligers
ALTER TABLE "MantelBuddy" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BuddyMatch" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BuddyTaak" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BuddyTaakReactie" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BuddyBeoordeling" ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. Policies: alleen service_role + postgres mogen alles
-- ============================================
-- Prisma gebruikt de postgres-rol via de directe connection string.
-- De service_role bypast RLS automatisch in Supabase.
-- We maken een policy per tabel voor de postgres-rol.
-- ============================================

-- Auth-gerelateerde tabellen
CREATE POLICY "postgres_full_access" ON "User" FOR ALL TO postgres USING (true) WITH CHECK (true);
CREATE POLICY "postgres_full_access" ON "Account" FOR ALL TO postgres USING (true) WITH CHECK (true);
CREATE POLICY "postgres_full_access" ON "Session" FOR ALL TO postgres USING (true) WITH CHECK (true);
CREATE POLICY "postgres_full_access" ON "VerificationToken" FOR ALL TO postgres USING (true) WITH CHECK (true);
CREATE POLICY "postgres_full_access" ON "MagicLinkToken" FOR ALL TO postgres USING (true) WITH CHECK (true);
CREATE POLICY "postgres_full_access" ON "PasswordResetToken" FOR ALL TO postgres USING (true) WITH CHECK (true);

-- Mantelzorger profiel & intake
CREATE POLICY "postgres_full_access" ON "Caregiver" FOR ALL TO postgres USING (true) WITH CHECK (true);
CREATE POLICY "postgres_full_access" ON "IntakeCategory" FOR ALL TO postgres USING (true) WITH CHECK (true);
CREATE POLICY "postgres_full_access" ON "IntakeQuestion" FOR ALL TO postgres USING (true) WITH CHECK (true);
CREATE POLICY "postgres_full_access" ON "IntakeResponse" FOR ALL TO postgres USING (true) WITH CHECK (true);

-- Check-in & taken
CREATE POLICY "postgres_full_access" ON "MonthlyCheckIn" FOR ALL TO postgres USING (true) WITH CHECK (true);
CREATE POLICY "postgres_full_access" ON "Task" FOR ALL TO postgres USING (true) WITH CHECK (true);

-- Resources & organisaties
CREATE POLICY "postgres_full_access" ON "Resource" FOR ALL TO postgres USING (true) WITH CHECK (true);
CREATE POLICY "postgres_full_access" ON "Organisation" FOR ALL TO postgres USING (true) WITH CHECK (true);
CREATE POLICY "postgres_full_access" ON "OrganisationMember" FOR ALL TO postgres USING (true) WITH CHECK (true);
CREATE POLICY "postgres_full_access" ON "CaregiverOrganisation" FOR ALL TO postgres USING (true) WITH CHECK (true);

-- Notificaties & hulpvragen
CREATE POLICY "postgres_full_access" ON "Notification" FOR ALL TO postgres USING (true) WITH CHECK (true);
CREATE POLICY "postgres_full_access" ON "HelpRequest" FOR ALL TO postgres USING (true) WITH CHECK (true);

-- Agenda
CREATE POLICY "postgres_full_access" ON "CalendarEvent" FOR ALL TO postgres USING (true) WITH CHECK (true);

-- Belastbaarheidstest
CREATE POLICY "postgres_full_access" ON "BelastbaarheidTest" FOR ALL TO postgres USING (true) WITH CHECK (true);
CREATE POLICY "postgres_full_access" ON "BelastbaarheidAntwoord" FOR ALL TO postgres USING (true) WITH CHECK (true);
CREATE POLICY "postgres_full_access" ON "ZorgtaakSelectie" FOR ALL TO postgres USING (true) WITH CHECK (true);
CREATE POLICY "postgres_full_access" ON "Zorgorganisatie" FOR ALL TO postgres USING (true) WITH CHECK (true);
CREATE POLICY "postgres_full_access" ON "BelastbaarheidRapport" FOR ALL TO postgres USING (true) WITH CHECK (true);
CREATE POLICY "postgres_full_access" ON "AlarmLog" FOR ALL TO postgres USING (true) WITH CHECK (true);

-- Favorieten
CREATE POLICY "postgres_full_access" ON "Favoriet" FOR ALL TO postgres USING (true) WITH CHECK (true);

-- MantelBuddy vrijwilligers
CREATE POLICY "postgres_full_access" ON "MantelBuddy" FOR ALL TO postgres USING (true) WITH CHECK (true);
CREATE POLICY "postgres_full_access" ON "BuddyMatch" FOR ALL TO postgres USING (true) WITH CHECK (true);
CREATE POLICY "postgres_full_access" ON "BuddyTaak" FOR ALL TO postgres USING (true) WITH CHECK (true);
CREATE POLICY "postgres_full_access" ON "BuddyTaakReactie" FOR ALL TO postgres USING (true) WITH CHECK (true);
CREATE POLICY "postgres_full_access" ON "BuddyBeoordeling" FOR ALL TO postgres USING (true) WITH CHECK (true);

-- ============================================
-- Klaar! Alle 31 tabellen hebben nu RLS aan.
-- De anon en authenticated rollen hebben GEEN toegang.
-- Alleen postgres (Prisma) en service_role hebben volledige toegang.
-- ============================================
