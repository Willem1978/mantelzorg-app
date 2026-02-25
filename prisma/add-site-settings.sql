-- CreateTable: SiteSettings (huisstijl, kleuren, teksten, logo)
CREATE TABLE IF NOT EXISTS "SiteSettings" (
    "id" TEXT NOT NULL,
    "categorie" TEXT NOT NULL,
    "sleutel" TEXT NOT NULL,
    "waarde" TEXT NOT NULL,
    "label" TEXT,
    "type" TEXT NOT NULL DEFAULT 'text',
    "groep" TEXT,
    "volgorde" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT,

    CONSTRAINT "SiteSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "SiteSettings_sleutel_key" ON "SiteSettings"("sleutel");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "SiteSettings_categorie_idx" ON "SiteSettings"("categorie");

-- Enable RLS
ALTER TABLE "SiteSettings" ENABLE ROW LEVEL SECURITY;

-- Policy: iedereen mag lezen (publieke instellingen)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'SiteSettings' AND policyname = 'site_settings_select'
  ) THEN
    CREATE POLICY "site_settings_select" ON "SiteSettings" FOR SELECT USING (true);
  END IF;
END $$;

-- Policy: alleen service role mag schrijven
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'SiteSettings' AND policyname = 'site_settings_all'
  ) THEN
    CREATE POLICY "site_settings_all" ON "SiteSettings" FOR ALL USING (
      current_setting('role', true) = 'service_role'
      OR current_setting('request.jwt.claims', true)::jsonb->>'role' = 'service_role'
    );
  END IF;
END $$;
