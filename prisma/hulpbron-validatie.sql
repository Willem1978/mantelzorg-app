-- Hulpbron Validatie schema uitbreiding
-- Voegt validatie-tracking toe aan zorgorganisaties en een apart validatie-log model

-- Enum voor validatie status
DO $$ BEGIN
  CREATE TYPE "HulpbronValidatieStatus" AS ENUM ('GELDIG', 'WAARSCHUWING', 'ONGELDIG', 'ONBEKEND');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Nieuwe kolommen op Zorgorganisatie
ALTER TABLE "Zorgorganisatie" ADD COLUMN IF NOT EXISTS "laatsteValidatie" TIMESTAMP(3);
ALTER TABLE "Zorgorganisatie" ADD COLUMN IF NOT EXISTS "validatieStatus" TEXT;
ALTER TABLE "Zorgorganisatie" ADD COLUMN IF NOT EXISTS "bronType" TEXT;

-- Validatie-log tabel
CREATE TABLE IF NOT EXISTS "HulpbronValidatie" (
  "id" TEXT NOT NULL,
  "zorgorganisatieId" TEXT NOT NULL,
  "status" "HulpbronValidatieStatus" NOT NULL,
  "websiteBereikbaar" BOOLEAN,
  "websiteStatusCode" INTEGER,
  "contentKlopt" BOOLEAN,
  "telefoonGeldig" BOOLEAN,
  "opmerkingen" TEXT,
  "aiSamenvatting" TEXT,
  "gecontroleerd" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "HulpbronValidatie_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "HulpbronValidatie_zorgorganisatieId_fkey"
    FOREIGN KEY ("zorgorganisatieId") REFERENCES "Zorgorganisatie"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS "HulpbronValidatie_zorgorganisatieId_idx" ON "HulpbronValidatie"("zorgorganisatieId");
CREATE INDEX IF NOT EXISTS "HulpbronValidatie_status_idx" ON "HulpbronValidatie"("status");
CREATE INDEX IF NOT EXISTS "HulpbronValidatie_gecontroleerd_idx" ON "HulpbronValidatie"("gecontroleerd");
CREATE INDEX IF NOT EXISTS "Zorgorganisatie_validatieStatus_idx" ON "Zorgorganisatie"("validatieStatus");
