-- ============================================
-- SEED CONTENT SQL (met CREATE TABLE)
-- Gegenereerd vanuit scripts/seed-content.ts + prisma/schema.prisma
-- Kan direct in Supabase SQL Editor worden uitgevoerd
-- ============================================

BEGIN;

-- ============================================
-- STAP 0: ENUM TYPES + TABELLEN AANMAKEN
-- ============================================

DO $$ BEGIN
  CREATE TYPE "VraagType" AS ENUM ('BALANSTEST', 'CHECKIN');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "CategorieType" AS ENUM ('LEREN', 'SUB_HOOFDSTUK', 'HULPVRAAG', 'HULP_ZORGVRAGER', 'HULP_MANTELZORGER');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "OptieGroep" AS ENUM ('RELATIE', 'UREN_PER_WEEK', 'ZORGDUUR', 'UREN_BALANSTEST', 'BUDDY_HULPVORM', 'CHECKIN_HULP');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "AppContentType" AS ENUM ('ONBOARDING', 'TUTORIAL', 'PAGINA_INTRO', 'FEATURE_CARD');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "BalanstestVraag" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  type "VraagType" NOT NULL,
  "vraagId" TEXT NOT NULL UNIQUE,
  "vraagTekst" TEXT NOT NULL,
  beschrijving TEXT,
  tip TEXT,
  sectie TEXT,
  opties JSONB,
  gewicht DOUBLE PRECISION NOT NULL DEFAULT 1.0,
  reversed BOOLEAN NOT NULL DEFAULT false,
  "isMultiSelect" BOOLEAN NOT NULL DEFAULT false,
  emoji TEXT,
  volgorde INTEGER NOT NULL DEFAULT 0,
  "isActief" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "BalanstestVraag_type_isActief_idx" ON "BalanstestVraag" (type, "isActief");

CREATE TABLE IF NOT EXISTS "Zorgtaak" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "taakId" TEXT NOT NULL UNIQUE,
  naam TEXT NOT NULL,
  beschrijving TEXT,
  categorie TEXT,
  emoji TEXT,
  icon TEXT,
  kort TEXT,
  "routeLabel" TEXT,
  groep TEXT,
  volgorde INTEGER NOT NULL DEFAULT 0,
  "isActief" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "Zorgtaak_isActief_idx" ON "Zorgtaak" ("isActief");

CREATE TABLE IF NOT EXISTS "TaakCategorieMapping" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "bronNaam" TEXT NOT NULL UNIQUE,
  "zorgtaakId" TEXT NOT NULL REFERENCES "Zorgtaak"(id) ON DELETE CASCADE,
  bron TEXT,
  "isActief" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "TaakCategorieMapping_zorgtaakId_idx" ON "TaakCategorieMapping" ("zorgtaakId");

CREATE TABLE IF NOT EXISTS "ContentCategorie" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  type "CategorieType" NOT NULL,
  slug TEXT NOT NULL,
  naam TEXT NOT NULL,
  beschrijving TEXT,
  emoji TEXT,
  icon TEXT,
  hint TEXT,
  "parentId" TEXT REFERENCES "ContentCategorie"(id),
  metadata JSONB,
  volgorde INTEGER NOT NULL DEFAULT 0,
  "isActief" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(type, slug)
);
CREATE INDEX IF NOT EXISTS "ContentCategorie_type_isActief_idx" ON "ContentCategorie" (type, "isActief");
CREATE INDEX IF NOT EXISTS "ContentCategorie_parentId_idx" ON "ContentCategorie" ("parentId");

CREATE TABLE IF NOT EXISTS "FormulierOptie" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  groep "OptieGroep" NOT NULL,
  waarde TEXT NOT NULL,
  label TEXT NOT NULL,
  beschrijving TEXT,
  emoji TEXT,
  volgorde INTEGER NOT NULL DEFAULT 0,
  "isActief" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(groep, waarde)
);
CREATE INDEX IF NOT EXISTS "FormulierOptie_groep_isActief_idx" ON "FormulierOptie" (groep, "isActief");

CREATE TABLE IF NOT EXISTS "AppContent" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  type "AppContentType" NOT NULL,
  sleutel TEXT NOT NULL,
  titel TEXT,
  inhoud TEXT,
  subtekst TEXT,
  emoji TEXT,
  icon TEXT,
  afbeelding TEXT,
  metadata JSONB,
  volgorde INTEGER NOT NULL DEFAULT 0,
  "isActief" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(type, sleutel)
);
CREATE INDEX IF NOT EXISTS "AppContent_type_isActief_idx" ON "AppContent" (type, "isActief");

-- ============================================
-- 1. BALANSTEST VRAGEN
-- ============================================

INSERT INTO "BalanstestVraag" (id, type, "vraagId", "vraagTekst", beschrijving, tip, sectie, gewicht, reversed, "isMultiSelect", volgorde, "isActief", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid()::text, 'BALANSTEST', 'q1', 'Slaap je minder goed door de zorg voor je naaste?', 'Eerst een paar vragen aan jou over hoe jij je lichamelijk voelt.', 'Veel mantelzorgers merken dat hun slaap onrustig wordt door piekeren of nachtelijke zorgtaken.', 'Jouw energie', 1.5, false, false, 1, true, now(), now()),
  (gen_random_uuid()::text, 'BALANSTEST', 'q2', 'Heb je last van je lichaam door het zorgen?', NULL, 'Fysieke klachten zoals rugpijn of vermoeidheid komen veel voor bij mantelzorgers.', 'Jouw energie', 1.0, false, false, 2, true, now(), now()),
  (gen_random_uuid()::text, 'BALANSTEST', 'q3', 'Kost het zorgen veel tijd en energie?', NULL, 'Het is normaal om dit te ervaren. Zorg goed voor jezelf.', 'Jouw energie', 1.0, false, false, 3, true, now(), now()),
  (gen_random_uuid()::text, 'BALANSTEST', 'q4', 'Is de band met je naaste veranderd?', 'Nu een paar vragen over hoe jij je emotioneel voelt.', 'Relaties veranderen door ziekte. Dat is normaal en soms lastig.', 'Jouw gevoel', 1.5, false, false, 4, true, now(), now()),
  (gen_random_uuid()::text, 'BALANSTEST', 'q5', 'Maakt het gedrag van je naaste je verdrietig, bang of boos?', NULL, 'Deze gevoelens zijn heel begrijpelijk en komen veel voor.', 'Jouw gevoel', 1.5, false, false, 5, true, now(), now()),
  (gen_random_uuid()::text, 'BALANSTEST', 'q6', 'Heb je verdriet dat je naaste anders is dan vroeger?', NULL, 'Rouwen om wie iemand was is een normaal onderdeel van mantelzorg.', 'Jouw gevoel', 1.0, false, false, 6, true, now(), now()),
  (gen_random_uuid()::text, 'BALANSTEST', 'q7', 'Slokt de zorg al je energie op?', NULL, 'Als dit zo voelt, is het belangrijk om hulp te zoeken.', 'Jouw gevoel', 1.5, false, false, 7, true, now(), now()),
  (gen_random_uuid()::text, 'BALANSTEST', 'q8', 'Pas je je dagelijks leven aan voor de zorg?', 'Tot slot een paar vragen over je tijd en je eigen leven.', 'Aanpassingen zijn normaal, maar vergeet jezelf niet.', 'Jouw tijd', 1.0, false, false, 8, true, now(), now()),
  (gen_random_uuid()::text, 'BALANSTEST', 'q9', 'Pas je regelmatig je plannen aan om te helpen?', NULL, 'Flexibiliteit is mooi, maar je eigen plannen tellen ook.', 'Jouw tijd', 1.0, false, false, 9, true, now(), now()),
  (gen_random_uuid()::text, 'BALANSTEST', 'q10', 'Kom je niet meer toe aan dingen die je leuk vindt?', NULL, 'Tijd voor jezelf is geen luxe, maar noodzaak.', 'Jouw tijd', 1.0, false, false, 10, true, now(), now()),
  (gen_random_uuid()::text, 'BALANSTEST', 'q11', 'Kost het zorgen net zoveel tijd als je werk?', NULL, 'Mantelzorg is ook werk. Gun jezelf erkenning hiervoor.', 'Jouw tijd', 1.5, false, false, 11, true, now(), now())
ON CONFLICT ("vraagId") DO UPDATE SET
  "vraagTekst" = EXCLUDED."vraagTekst",
  tip = EXCLUDED.tip,
  sectie = EXCLUDED.sectie,
  beschrijving = EXCLUDED.beschrijving,
  gewicht = EXCLUDED.gewicht,
  volgorde = EXCLUDED.volgorde,
  "updatedAt" = now();

-- ============================================
-- 2. CHECK-IN VRAGEN
-- ============================================

INSERT INTO "BalanstestVraag" (id, type, "vraagId", "vraagTekst", tip, reversed, "isMultiSelect", volgorde, "isActief", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid()::text, 'CHECKIN', 'c1', 'Ben je vaak moe?', 'Als je veel moe bent, is dat een teken dat je rust nodig hebt.', false, false, 1, true, now(), now()),
  (gen_random_uuid()::text, 'CHECKIN', 'c2', 'Heb je tijd voor jezelf?', 'Tijd voor jezelf is belangrijk. Ook voor jou.', true, false, 2, true, now(), now()),
  (gen_random_uuid()::text, 'CHECKIN', 'c3', 'Maak je je vaak zorgen?', 'Zorgen maken hoort erbij. Maar het mag niet te veel worden.', false, false, 3, true, now(), now()),
  (gen_random_uuid()::text, 'CHECKIN', 'c4', 'Krijg je hulp van anderen?', 'Hulp van anderen is fijn. Je hoeft het niet alleen te doen.', true, false, 4, true, now(), now()),
  (gen_random_uuid()::text, 'CHECKIN', 'c5', 'Waar wil je hulp bij?', 'Kies wat voor jou belangrijk is. Je kunt meer dan een ding kiezen.', false, true, 5, true, now(), now())
ON CONFLICT ("vraagId") DO UPDATE SET
  "vraagTekst" = EXCLUDED."vraagTekst",
  tip = EXCLUDED.tip,
  reversed = EXCLUDED.reversed,
  "isMultiSelect" = EXCLUDED."isMultiSelect",
  volgorde = EXCLUDED.volgorde,
  "updatedAt" = now();

-- ============================================
-- 3. ZORGTAKEN
-- ============================================

INSERT INTO "Zorgtaak" (id, "taakId", naam, beschrijving, volgorde, "isActief", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid()::text, 't1', 'Administratie en geldzaken', 'Rekeningen, post, verzekeringen', 1, true, now(), now()),
  (gen_random_uuid()::text, 't2', 'Regelen en afspraken maken', 'Arts, thuiszorg, dagbesteding', 2, true, now(), now()),
  (gen_random_uuid()::text, 't3', 'Boodschappen doen', 'Supermarkt, apotheek', 3, true, now(), now()),
  (gen_random_uuid()::text, 't4', 'Bezoek en gezelschap', 'Gesprekken, uitjes, wandelen', 4, true, now(), now()),
  (gen_random_uuid()::text, 't5', 'Vervoer naar afspraken', 'Ziekenhuis, huisarts, familie', 5, true, now(), now()),
  (gen_random_uuid()::text, 't6', 'Persoonlijke verzorging', 'Wassen, aankleden, medicijnen', 6, true, now(), now()),
  (gen_random_uuid()::text, 't7', 'Eten en drinken', 'Koken, maaltijden, dieet', 7, true, now(), now()),
  (gen_random_uuid()::text, 't8', 'Huishouden', 'Schoonmaken, was, opruimen', 8, true, now(), now()),
  (gen_random_uuid()::text, 't9', 'Klusjes in en om huis', 'Reparaties, tuin, onderhoud', 9, true, now(), now())
ON CONFLICT ("taakId") DO UPDATE SET
  naam = EXCLUDED.naam,
  beschrijving = EXCLUDED.beschrijving,
  volgorde = EXCLUDED.volgorde,
  "updatedAt" = now();

-- ============================================
-- 4. HULPVRAAG CATEGORIEEN
-- ============================================

INSERT INTO "ContentCategorie" (id, type, slug, naam, icon, hint, metadata, volgorde, "isActief", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid()::text, 'HULP_ZORGVRAGER', 'administratie', 'Administratie', '📋', 'Administratie', '{"groep": "Organisatie & regelwerk", "routeLabel": "Landelijk"}', 1, true, now(), now()),
  (gen_random_uuid()::text, 'HULP_ZORGVRAGER', 'plannen', 'Plannen', '📅', 'Plannen', '{"groep": "Organisatie & regelwerk", "routeLabel": null}', 2, true, now(), now()),
  (gen_random_uuid()::text, 'HULP_ZORGVRAGER', 'boodschappen', 'Boodschappen', '🛒', 'Boodschappen', '{"groep": "Dagelijks leven", "routeLabel": "Gemeente"}', 3, true, now(), now()),
  (gen_random_uuid()::text, 'HULP_ZORGVRAGER', 'sociaal-contact', 'Sociaal & activiteiten', '👥', 'Sociaal & activiteiten', '{"groep": "Welzijn & mobiliteit", "routeLabel": "Wmo"}', 4, true, now(), now()),
  (gen_random_uuid()::text, 'HULP_ZORGVRAGER', 'vervoer', 'Vervoer', '🚗', 'Vervoer', '{"groep": "Welzijn & mobiliteit", "routeLabel": "Landelijk"}', 5, true, now(), now()),
  (gen_random_uuid()::text, 'HULP_ZORGVRAGER', 'persoonlijke-verzorging', 'Verzorging', '🛁', 'Verzorging', '{"groep": "Dagelijks leven", "routeLabel": "Wmo/Zvw/Wlz"}', 6, true, now(), now()),
  (gen_random_uuid()::text, 'HULP_ZORGVRAGER', 'maaltijden', 'Maaltijden', '🍽️', 'Maaltijden', '{"groep": "Dagelijks leven", "routeLabel": "Gemeente"}', 7, true, now(), now()),
  (gen_random_uuid()::text, 'HULP_ZORGVRAGER', 'huishoudelijke-taken', 'Huishouden', '🧹', 'Huishouden', '{"groep": "In en om het huis", "routeLabel": "Wmo"}', 8, true, now(), now()),
  (gen_random_uuid()::text, 'HULP_ZORGVRAGER', 'klusjes', 'Klusjes', '🔧', 'Klusjes', '{"groep": "In en om het huis", "routeLabel": "Gemeente"}', 9, true, now(), now()),
  (gen_random_uuid()::text, 'HULP_ZORGVRAGER', 'huisdieren', 'Huisdieren', '🐕', 'Huisdieren', '{"groep": "Overig", "routeLabel": null}', 10, true, now(), now())
ON CONFLICT (type, slug) DO UPDATE SET
  naam = EXCLUDED.naam, icon = EXCLUDED.icon, hint = EXCLUDED.hint,
  metadata = EXCLUDED.metadata, volgorde = EXCLUDED.volgorde, "updatedAt" = now();

INSERT INTO "ContentCategorie" (id, type, slug, naam, icon, hint, volgorde, "isActief", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid()::text, 'HULP_MANTELZORGER', 'mantelzorgondersteuning', 'Ondersteuning', '💜', 'Ondersteuning', 1, true, now(), now()),
  (gen_random_uuid()::text, 'HULP_MANTELZORGER', 'vervangende-mantelzorg', 'Vervangende mantelzorg', '🏠', 'Vervangende mantelzorg', 2, true, now(), now()),
  (gen_random_uuid()::text, 'HULP_MANTELZORGER', 'emotionele-steun', 'Praten & steun', '💚', 'Praten & steun', 3, true, now(), now()),
  (gen_random_uuid()::text, 'HULP_MANTELZORGER', 'lotgenotencontact', 'Lotgenoten', '👥', 'Lotgenoten', 4, true, now(), now()),
  (gen_random_uuid()::text, 'HULP_MANTELZORGER', 'leren-en-training', 'Leren & training', '🎓', 'Leren & training', 5, true, now(), now())
ON CONFLICT (type, slug) DO UPDATE SET
  naam = EXCLUDED.naam, icon = EXCLUDED.icon, hint = EXCLUDED.hint,
  volgorde = EXCLUDED.volgorde, "updatedAt" = now();

INSERT INTO "ContentCategorie" (id, type, slug, naam, icon, hint, volgorde, "isActief", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid()::text, 'HULPVRAAG', 'respite-care', 'Even vrij', '🏠', 'Iemand neemt de zorg over', 1, true, now(), now()),
  (gen_random_uuid()::text, 'HULPVRAAG', 'emotional-support', 'Praten', '💚', 'Over je gevoel praten', 2, true, now(), now()),
  (gen_random_uuid()::text, 'HULPVRAAG', 'practical-help', 'Hulp thuis', '🔧', 'Klussen of taken', 3, true, now(), now()),
  (gen_random_uuid()::text, 'HULPVRAAG', 'financial-advice', 'Geld', '💰', 'Hulp met geld of aanvragen', 4, true, now(), now()),
  (gen_random_uuid()::text, 'HULPVRAAG', 'information', 'Info', 'ℹ️', 'Informatie zoeken', 5, true, now(), now()),
  (gen_random_uuid()::text, 'HULPVRAAG', 'other', 'Anders', '📝', 'Iets anders', 6, true, now(), now())
ON CONFLICT (type, slug) DO UPDATE SET
  naam = EXCLUDED.naam, icon = EXCLUDED.icon, hint = EXCLUDED.hint,
  volgorde = EXCLUDED.volgorde, "updatedAt" = now();

-- ============================================
-- 5. LEREN CATEGORIEEN + SUB-HOOFDSTUKKEN
-- ============================================

INSERT INTO "ContentCategorie" (id, type, slug, naam, beschrijving, emoji, volgorde, "isActief", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid()::text, 'LEREN', 'praktische-tips', 'Praktische tips', 'Voor het dagelijks leven', '💡', 1, true, now(), now()),
  (gen_random_uuid()::text, 'LEREN', 'zelfzorg', 'Zelfzorg', 'Zorg ook voor jezelf', '🧘', 2, true, now(), now()),
  (gen_random_uuid()::text, 'LEREN', 'rechten', 'Je rechten', 'Wmo, Zvw, Wlz en meer', '⚖️', 3, true, now(), now()),
  (gen_random_uuid()::text, 'LEREN', 'financieel', 'Financieel', 'Kosten, vergoedingen & pgb', '💰', 4, true, now(), now()),
  (gen_random_uuid()::text, 'LEREN', 'hulpmiddelen-producten', 'Hulpmiddelen & producten', 'Fysiek, digitaal & aanpassingen', '🛠️', 5, true, now(), now())
ON CONFLICT (type, slug) DO UPDATE SET
  naam = EXCLUDED.naam, beschrijving = EXCLUDED.beschrijving,
  emoji = EXCLUDED.emoji, volgorde = EXCLUDED.volgorde, "updatedAt" = now();

-- praktische-tips
INSERT INTO "ContentCategorie" (id, type, slug, naam, beschrijving, "parentId", volgorde, "isActief", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid()::text, 'SUB_HOOFDSTUK', 'dagelijks-organiseren', 'Dagelijks organiseren', 'Dagstructuur, weekplanning en taken uitbesteden', (SELECT id FROM "ContentCategorie" WHERE type='LEREN' AND slug='praktische-tips'), 1, true, now(), now()),
  (gen_random_uuid()::text, 'SUB_HOOFDSTUK', 'samen-organiseren', 'Samen organiseren met familie/netwerk', 'Afspraken, back-up en samenwerking', (SELECT id FROM "ContentCategorie" WHERE type='LEREN' AND slug='praktische-tips'), 2, true, now(), now()),
  (gen_random_uuid()::text, 'SUB_HOOFDSTUK', 'veiligheid-zware-taken', 'Veiligheid bij zware taken', 'Tillen, verplaatsen en medicatie', (SELECT id FROM "ContentCategorie" WHERE type='LEREN' AND slug='praktische-tips'), 3, true, now(), now())
ON CONFLICT (type, slug) DO UPDATE SET
  naam = EXCLUDED.naam, beschrijving = EXCLUDED.beschrijving,
  "parentId" = EXCLUDED."parentId", volgorde = EXCLUDED.volgorde, "updatedAt" = now();

-- zelfzorg
INSERT INTO "ContentCategorie" (id, type, slug, naam, beschrijving, "parentId", volgorde, "isActief", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid()::text, 'SUB_HOOFDSTUK', 'overbelasting-herkennen', 'Overbelasting herkennen', 'Signalen herkennen en wat je kunt doen', (SELECT id FROM "ContentCategorie" WHERE type='LEREN' AND slug='zelfzorg'), 1, true, now(), now()),
  (gen_random_uuid()::text, 'SUB_HOOFDSTUK', 'pauze-en-respijt', 'Pauze en respijt organiseren', 'Tijdelijke overname van zorg regelen', (SELECT id FROM "ContentCategorie" WHERE type='LEREN' AND slug='zelfzorg'), 2, true, now(), now()),
  (gen_random_uuid()::text, 'SUB_HOOFDSTUK', 'emotionele-steun', 'Emotionele steun en praten', 'Steun zoeken en stress verwerken', (SELECT id FROM "ContentCategorie" WHERE type='LEREN' AND slug='zelfzorg'), 3, true, now(), now())
ON CONFLICT (type, slug) DO UPDATE SET
  naam = EXCLUDED.naam, beschrijving = EXCLUDED.beschrijving,
  "parentId" = EXCLUDED."parentId", volgorde = EXCLUDED.volgorde, "updatedAt" = now();

-- rechten
INSERT INTO "ContentCategorie" (id, type, slug, naam, beschrijving, "parentId", volgorde, "isActief", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid()::text, 'SUB_HOOFDSTUK', 'routekaart-wmo-zvw-wlz', 'Routekaart Wmo / Zvw / Wlz', 'Wat hoort waar? Interactief overzicht', (SELECT id FROM "ContentCategorie" WHERE type='LEREN' AND slug='rechten'), 1, true, now(), now()),
  (gen_random_uuid()::text, 'SUB_HOOFDSTUK', 'gemeente-wmo-aanvragen', 'Gemeente (Wmo) aanvragen', 'Wat je kunt krijgen en hoe je het aanvraagt', (SELECT id FROM "ContentCategorie" WHERE type='LEREN' AND slug='rechten'), 2, true, now(), now()),
  (gen_random_uuid()::text, 'SUB_HOOFDSTUK', 'clientondersteuning', 'Gratis clientondersteuning', 'Onafhankelijke hulp bij het organiseren van zorg', (SELECT id FROM "ContentCategorie" WHERE type='LEREN' AND slug='rechten'), 3, true, now(), now())
ON CONFLICT (type, slug) DO UPDATE SET
  naam = EXCLUDED.naam, beschrijving = EXCLUDED.beschrijving,
  "parentId" = EXCLUDED."parentId", volgorde = EXCLUDED.volgorde, "updatedAt" = now();

-- financieel
INSERT INTO "ContentCategorie" (id, type, slug, naam, beschrijving, "parentId", volgorde, "isActief", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid()::text, 'SUB_HOOFDSTUK', 'eigen-bijdrage-kosten', 'Eigen bijdrage en kosten', 'CAK, abonnementstarief en rekentools', (SELECT id FROM "ContentCategorie" WHERE type='LEREN' AND slug='financieel'), 1, true, now(), now()),
  (gen_random_uuid()::text, 'SUB_HOOFDSTUK', 'mantelzorgwaardering', 'Mantelzorgwaardering', 'Jaarlijkse waardering van je gemeente', (SELECT id FROM "ContentCategorie" WHERE type='LEREN' AND slug='financieel'), 2, true, now(), now()),
  (gen_random_uuid()::text, 'SUB_HOOFDSTUK', 'pgb-aanvragen-beheer', 'Pgb: aanvragen en beheer', 'Route, vaardigheden en SVB', (SELECT id FROM "ContentCategorie" WHERE type='LEREN' AND slug='financieel'), 3, true, now(), now()),
  (gen_random_uuid()::text, 'SUB_HOOFDSTUK', 'vergoedingen-hulpmiddelen', 'Vergoedingen hulpmiddelen', 'Eerst aanvragen, dan kopen', (SELECT id FROM "ContentCategorie" WHERE type='LEREN' AND slug='financieel'), 4, true, now(), now())
ON CONFLICT (type, slug) DO UPDATE SET
  naam = EXCLUDED.naam, beschrijving = EXCLUDED.beschrijving,
  "parentId" = EXCLUDED."parentId", volgorde = EXCLUDED.volgorde, "updatedAt" = now();

-- hulpmiddelen-producten
INSERT INTO "ContentCategorie" (id, type, slug, naam, beschrijving, "parentId", volgorde, "isActief", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid()::text, 'SUB_HOOFDSTUK', 'hulpmiddelen-overzicht', 'Hulpmiddelen overzicht', 'Fysieke en digitale hulpmiddelen vinden', (SELECT id FROM "ContentCategorie" WHERE type='LEREN' AND slug='hulpmiddelen-producten'), 1, true, now(), now()),
  (gen_random_uuid()::text, 'SUB_HOOFDSTUK', 'vergoedingsroutes', 'Vergoedingsroutes', 'Welk hulpmiddel via welke wet?', (SELECT id FROM "ContentCategorie" WHERE type='LEREN' AND slug='hulpmiddelen-producten'), 2, true, now(), now())
ON CONFLICT (type, slug) DO UPDATE SET
  naam = EXCLUDED.naam, beschrijving = EXCLUDED.beschrijving,
  "parentId" = EXCLUDED."parentId", volgorde = EXCLUDED.volgorde, "updatedAt" = now();

-- ============================================
-- 6. TAAK-CATEGORIE MAPPINGS
-- ============================================

INSERT INTO "TaakCategorieMapping" (id, "bronNaam", "zorgtaakId", "isActief", "createdAt")
VALUES
  (gen_random_uuid()::text, 'Wassen/aankleden', (SELECT id FROM "Zorgtaak" WHERE "taakId"='t6'), true, now()),
  (gen_random_uuid()::text, 'Wassen en aankleden', (SELECT id FROM "Zorgtaak" WHERE "taakId"='t6'), true, now()),
  (gen_random_uuid()::text, 'Persoonlijke verzorging', (SELECT id FROM "Zorgtaak" WHERE "taakId"='t6'), true, now()),
  (gen_random_uuid()::text, 'Toiletgang', (SELECT id FROM "Zorgtaak" WHERE "taakId"='t6'), true, now()),
  (gen_random_uuid()::text, 'Medicijnen', (SELECT id FROM "Zorgtaak" WHERE "taakId"='t6'), true, now()),
  (gen_random_uuid()::text, 'Toezicht', (SELECT id FROM "Zorgtaak" WHERE "taakId"='t6'), true, now()),
  (gen_random_uuid()::text, 'Medische zorg', (SELECT id FROM "Zorgtaak" WHERE "taakId"='t6'), true, now()),
  (gen_random_uuid()::text, 'Huishouden', (SELECT id FROM "Zorgtaak" WHERE "taakId"='t8'), true, now()),
  (gen_random_uuid()::text, 'Huishoudelijke taken', (SELECT id FROM "Zorgtaak" WHERE "taakId"='t8'), true, now()),
  (gen_random_uuid()::text, 'Vervoer', (SELECT id FROM "Zorgtaak" WHERE "taakId"='t5'), true, now()),
  (gen_random_uuid()::text, 'Vervoer/begeleiding', (SELECT id FROM "Zorgtaak" WHERE "taakId"='t5'), true, now()),
  (gen_random_uuid()::text, 'Vervoer naar afspraken', (SELECT id FROM "Zorgtaak" WHERE "taakId"='t5'), true, now()),
  (gen_random_uuid()::text, 'Administratie', (SELECT id FROM "Zorgtaak" WHERE "taakId"='t1'), true, now()),
  (gen_random_uuid()::text, 'Administratie en aanvragen', (SELECT id FROM "Zorgtaak" WHERE "taakId"='t1'), true, now()),
  (gen_random_uuid()::text, 'Administratie en geldzaken', (SELECT id FROM "Zorgtaak" WHERE "taakId"='t1'), true, now()),
  (gen_random_uuid()::text, 'Plannen en organiseren', (SELECT id FROM "Zorgtaak" WHERE "taakId"='t2'), true, now()),
  (gen_random_uuid()::text, 'Regelen en afspraken maken', (SELECT id FROM "Zorgtaak" WHERE "taakId"='t2'), true, now()),
  (gen_random_uuid()::text, 'Plannen', (SELECT id FROM "Zorgtaak" WHERE "taakId"='t2'), true, now()),
  (gen_random_uuid()::text, 'Organiseren', (SELECT id FROM "Zorgtaak" WHERE "taakId"='t2'), true, now()),
  (gen_random_uuid()::text, 'Sociaal contact', (SELECT id FROM "Zorgtaak" WHERE "taakId"='t4'), true, now()),
  (gen_random_uuid()::text, 'Sociaal contact en activiteiten', (SELECT id FROM "Zorgtaak" WHERE "taakId"='t4'), true, now()),
  (gen_random_uuid()::text, 'Activiteiten', (SELECT id FROM "Zorgtaak" WHERE "taakId"='t4'), true, now()),
  (gen_random_uuid()::text, 'Bezoek en gezelschap', (SELECT id FROM "Zorgtaak" WHERE "taakId"='t4'), true, now()),
  (gen_random_uuid()::text, 'Bezoek en uitjes', (SELECT id FROM "Zorgtaak" WHERE "taakId"='t4'), true, now()),
  (gen_random_uuid()::text, 'Maaltijden', (SELECT id FROM "Zorgtaak" WHERE "taakId"='t7'), true, now()),
  (gen_random_uuid()::text, 'Eten maken', (SELECT id FROM "Zorgtaak" WHERE "taakId"='t7'), true, now()),
  (gen_random_uuid()::text, 'Eten en drinken', (SELECT id FROM "Zorgtaak" WHERE "taakId"='t7'), true, now()),
  (gen_random_uuid()::text, 'Boodschappen', (SELECT id FROM "Zorgtaak" WHERE "taakId"='t3'), true, now()),
  (gen_random_uuid()::text, 'Boodschappen doen', (SELECT id FROM "Zorgtaak" WHERE "taakId"='t3'), true, now()),
  (gen_random_uuid()::text, 'Klusjes', (SELECT id FROM "Zorgtaak" WHERE "taakId"='t9'), true, now()),
  (gen_random_uuid()::text, 'Klusjes in huis', (SELECT id FROM "Zorgtaak" WHERE "taakId"='t9'), true, now()),
  (gen_random_uuid()::text, 'Klusjes in en om huis', (SELECT id FROM "Zorgtaak" WHERE "taakId"='t9'), true, now()),
  (gen_random_uuid()::text, 'Klusjes in/om huis', (SELECT id FROM "Zorgtaak" WHERE "taakId"='t9'), true, now()),
  (gen_random_uuid()::text, 'Klusjes in en om het huis', (SELECT id FROM "Zorgtaak" WHERE "taakId"='t9'), true, now()),
  (gen_random_uuid()::text, 'Huisdieren', (SELECT id FROM "Zorgtaak" WHERE "taakId"='t4'), true, now()),
  (gen_random_uuid()::text, 'Huisdieren verzorgen', (SELECT id FROM "Zorgtaak" WHERE "taakId"='t4'), true, now()),
  (gen_random_uuid()::text, 'Dieren', (SELECT id FROM "Zorgtaak" WHERE "taakId"='t4'), true, now())
ON CONFLICT ("bronNaam") DO UPDATE SET
  "zorgtaakId" = EXCLUDED."zorgtaakId";

-- ============================================
-- 7. FORMULIER OPTIES
-- ============================================

INSERT INTO "FormulierOptie" (id, groep, waarde, label, emoji, volgorde, "isActief", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid()::text, 'RELATIE', 'partner', 'Mijn partner', '💑', 1, true, now(), now()),
  (gen_random_uuid()::text, 'RELATIE', 'ouder', 'Mijn ouder', '👵', 2, true, now(), now()),
  (gen_random_uuid()::text, 'RELATIE', 'kind', 'Mijn kind', '👧', 3, true, now(), now()),
  (gen_random_uuid()::text, 'RELATIE', 'ander-familielid', 'Ander familielid', '👨‍👩‍👧', 4, true, now(), now()),
  (gen_random_uuid()::text, 'RELATIE', 'kennis', 'Kennis of vriend(in)', '🤝', 5, true, now(), now())
ON CONFLICT (groep, waarde) DO UPDATE SET
  label = EXCLUDED.label, emoji = EXCLUDED.emoji, volgorde = EXCLUDED.volgorde, "updatedAt" = now();

INSERT INTO "FormulierOptie" (id, groep, waarde, label, beschrijving, volgorde, "isActief", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid()::text, 'UREN_PER_WEEK', '0-5', '0 - 5 uur', 'Af en toe bijspringen', 1, true, now(), now()),
  (gen_random_uuid()::text, 'UREN_PER_WEEK', '5-10', '5 - 10 uur', 'Regelmatig helpen', 2, true, now(), now()),
  (gen_random_uuid()::text, 'UREN_PER_WEEK', '10-20', '10 - 20 uur', 'Flink bezig', 3, true, now(), now()),
  (gen_random_uuid()::text, 'UREN_PER_WEEK', '20-40', '20 - 40 uur', 'Bijna een baan', 4, true, now(), now()),
  (gen_random_uuid()::text, 'UREN_PER_WEEK', '40+', 'Meer dan 40 uur', 'Fulltime zorg', 5, true, now(), now())
ON CONFLICT (groep, waarde) DO UPDATE SET
  label = EXCLUDED.label, beschrijving = EXCLUDED.beschrijving, volgorde = EXCLUDED.volgorde, "updatedAt" = now();

INSERT INTO "FormulierOptie" (id, groep, waarde, label, emoji, volgorde, "isActief", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid()::text, 'ZORGDUUR', '<1', 'Minder dan 1 jaar', '🌱', 1, true, now(), now()),
  (gen_random_uuid()::text, 'ZORGDUUR', '1-3', '1 - 3 jaar', '🌿', 2, true, now(), now()),
  (gen_random_uuid()::text, 'ZORGDUUR', '3-5', '3 - 5 jaar', '🌳', 3, true, now(), now()),
  (gen_random_uuid()::text, 'ZORGDUUR', '5+', 'Meer dan 5 jaar', '🏔️', 4, true, now(), now())
ON CONFLICT (groep, waarde) DO UPDATE SET
  label = EXCLUDED.label, emoji = EXCLUDED.emoji, volgorde = EXCLUDED.volgorde, "updatedAt" = now();

INSERT INTO "FormulierOptie" (id, groep, waarde, label, beschrijving, volgorde, "isActief", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid()::text, 'UREN_BALANSTEST', '0-2', 'Tot 2 uur per week', '1', 1, true, now(), now()),
  (gen_random_uuid()::text, 'UREN_BALANSTEST', '2-4', '2 tot 4 uur per week', '3', 2, true, now(), now()),
  (gen_random_uuid()::text, 'UREN_BALANSTEST', '4-8', '4 tot 8 uur per week', '6', 3, true, now(), now()),
  (gen_random_uuid()::text, 'UREN_BALANSTEST', '8-12', '8 tot 12 uur per week', '10', 4, true, now(), now()),
  (gen_random_uuid()::text, 'UREN_BALANSTEST', '12-24', '12 tot 24 uur per week', '18', 5, true, now(), now()),
  (gen_random_uuid()::text, 'UREN_BALANSTEST', '24+', 'Meer dan 24 uur per week', '30', 6, true, now(), now())
ON CONFLICT (groep, waarde) DO UPDATE SET
  label = EXCLUDED.label, beschrijving = EXCLUDED.beschrijving, volgorde = EXCLUDED.volgorde, "updatedAt" = now();

INSERT INTO "FormulierOptie" (id, groep, waarde, label, emoji, volgorde, "isActief", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid()::text, 'CHECKIN_HULP', 'geen', 'Het gaat goed zo', '✅', 1, true, now(), now()),
  (gen_random_uuid()::text, 'CHECKIN_HULP', 'huishouden', 'Huishouden', '🧹', 2, true, now(), now()),
  (gen_random_uuid()::text, 'CHECKIN_HULP', 'zorgtaken', 'Zorgtaken', '🩺', 3, true, now(), now()),
  (gen_random_uuid()::text, 'CHECKIN_HULP', 'tijd_voor_mezelf', 'Tijd voor mezelf', '🧘', 4, true, now(), now()),
  (gen_random_uuid()::text, 'CHECKIN_HULP', 'administratie', 'Papierwerk', '📋', 5, true, now(), now()),
  (gen_random_uuid()::text, 'CHECKIN_HULP', 'emotioneel', 'Praten met iemand', '💬', 6, true, now(), now())
ON CONFLICT (groep, waarde) DO UPDATE SET
  label = EXCLUDED.label, emoji = EXCLUDED.emoji, volgorde = EXCLUDED.volgorde, "updatedAt" = now();

INSERT INTO "FormulierOptie" (id, groep, waarde, label, emoji, volgorde, "isActief", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid()::text, 'BUDDY_HULPVORM', 'gesprek', 'Gesprek / praatje', '☕', 1, true, now(), now()),
  (gen_random_uuid()::text, 'BUDDY_HULPVORM', 'boodschappen', 'Boodschappen', '🛒', 2, true, now(), now()),
  (gen_random_uuid()::text, 'BUDDY_HULPVORM', 'vervoer', 'Vervoer', '🚗', 3, true, now(), now()),
  (gen_random_uuid()::text, 'BUDDY_HULPVORM', 'klusjes', 'Klusjes', '🔧', 4, true, now(), now()),
  (gen_random_uuid()::text, 'BUDDY_HULPVORM', 'oppas', 'Oppas / toezicht', '🏠', 5, true, now(), now()),
  (gen_random_uuid()::text, 'BUDDY_HULPVORM', 'administratie', 'Administratie', '📋', 6, true, now(), now())
ON CONFLICT (groep, waarde) DO UPDATE SET
  label = EXCLUDED.label, emoji = EXCLUDED.emoji, volgorde = EXCLUDED.volgorde, "updatedAt" = now();

-- ============================================
-- 8. TUTORIAL STAPPEN
-- ============================================

INSERT INTO "AppContent" (id, type, sleutel, titel, inhoud, subtekst, emoji, metadata, volgorde, "isActief", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid()::text, 'TUTORIAL', 'welkom', 'Welkom bij MantelBuddy', 'Ik ben **Ger**, en ik ga je stap voor stap uitleggen hoe MantelBuddy jou kan helpen.', 'Het duurt maar 2 minuutjes.', '👋', NULL, 0, true, now(), now()),
  (gen_random_uuid()::text, 'TUTORIAL', 'balanstest', 'De Balanstest', 'Met een **korte test** van 2 minuten kijken we hoe het met je gaat. Je krijgt een score die laat zien of je het goed volhoudt.', 'Doe de test regelmatig. Dan kun je zien hoe het gaat over tijd.', '📊', '{"demoScore": 13, "maxScore": 24}', 1, true, now(), now()),
  (gen_random_uuid()::text, 'TUTORIAL', 'hulp-mantelzorger', 'Hulp voor jou', 'Je hoeft het niet alleen te doen. MantelBuddy zoekt hulp **bij jou in de buurt**.', 'Daarom vragen we je adres. Zo vinden we hulp bij jou in de buurt.', '💜', '{"items": [{"emoji": "💜", "label": "Ondersteuning"}, {"emoji": "🏠", "label": "Vervangende mantelzorg"}, {"emoji": "💚", "label": "Praten"}, {"emoji": "👥", "label": "Lotgenoten"}]}', 2, true, now(), now()),
  (gen_random_uuid()::text, 'TUTORIAL', 'hulp-naaste', 'Hulp voor je naaste', 'Er is ook hulp voor de persoon waar je voor zorgt. De kleuren laten zien wat het zwaarst is.', 'We vragen twee adressen. Een voor jou en een voor je naaste.', '💝', '{"items": [{"emoji": "🛁", "label": "Verzorging", "status": "zwaar"}, {"emoji": "🧹", "label": "Huishouden", "status": "gemiddeld"}, {"emoji": "🍽️", "label": "Maaltijden", "status": "gemiddeld"}, {"emoji": "🚗", "label": "Vervoer", "status": "licht"}]}', 3, true, now(), now()),
  (gen_random_uuid()::text, 'TUTORIAL', 'mantelbuddies', 'MantelBuddies', 'Een **MantelBuddy** is een vrijwilliger bij jou in de buurt. Die helpt je graag met kleine taken.', 'Eenmalig of vaker -- jij kiest. Je vindt ze bij **Hulp**.', '🤝', '{"items": [{"emoji": "🛒", "text": "Boodschappen doen"}, {"emoji": "☕", "text": "Even een praatje maken"}, {"emoji": "🚗", "text": "Mee naar de dokter"}, {"emoji": "🔧", "text": "Klusjes in huis"}]}', 4, true, now(), now()),
  (gen_random_uuid()::text, 'TUTORIAL', 'informatie', 'Informatie en tips', 'Bij **Informatie** vind je handige artikelen en nieuws uit jouw gemeente.', NULL, '📚', '{"categories": [{"emoji": "💡", "title": "Praktische tips"}, {"emoji": "🧘", "title": "Zelfzorg"}, {"emoji": "⚖️", "title": "Je rechten"}, {"emoji": "💰", "title": "Financieel"}], "gemeenteNieuws": {"emoji": "🏘️", "title": "Nieuws van de gemeente", "subtitle": "Updates bij jou in de buurt"}}', 5, true, now(), now()),
  (gen_random_uuid()::text, 'TUTORIAL', 'favorieten', 'Bewaar je favorieten', 'Kom je iets tegen dat je wilt onthouden? Tik op het **hartje** om het te bewaren.', 'Je favorieten vind je terug op een eigen pagina.', '❤️', NULL, 6, true, now(), now()),
  (gen_random_uuid()::text, 'TUTORIAL', 'klaar', 'Je bent er klaar voor!', 'Ik ben trots op je dat je deze stap zet. Mantelzorg is niet makkelijk, maar je staat er niet alleen voor.', 'Je kunt deze uitleg altijd teruglezen via je **Profiel**.', '🎉', NULL, 7, true, now(), now())
ON CONFLICT (type, sleutel) DO UPDATE SET
  titel = EXCLUDED.titel, inhoud = EXCLUDED.inhoud, subtekst = EXCLUDED.subtekst,
  emoji = EXCLUDED.emoji, volgorde = EXCLUDED.volgorde, metadata = EXCLUDED.metadata, "updatedAt" = now();

-- ============================================
-- 9. ONBOARDING STAPPEN
-- ============================================

INSERT INTO "AppContent" (id, type, sleutel, titel, inhoud, subtekst, emoji, metadata, volgorde, "isActief", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid()::text, 'ONBOARDING', 'welkom', 'Hoi! Welkom bij MantelBuddy', 'Fijn dat je er bent. In een paar stappen maken we de app klaar voor jou.', 'Het duurt maar 2 minuutjes.', '👋', NULL, 0, true, now(), now()),
  (gen_random_uuid()::text, 'ONBOARDING', 'wie-ben-jij', 'Wie ben jij?', 'Zodat we hulp bij jou in de buurt kunnen vinden.', NULL, '👤', NULL, 1, true, now(), now()),
  (gen_random_uuid()::text, 'ONBOARDING', 'zorgsituatie', 'Jouw zorgsituatie', 'Zo kunnen we beter inschatten wat je nodig hebt.', NULL, '💪', NULL, 2, true, now(), now()),
  (gen_random_uuid()::text, 'ONBOARDING', 'app-uitleg', 'Wat kan MantelBuddy?', 'Dit zijn de belangrijkste onderdelen van de app.', NULL, '📱', '{"features": [{"emoji": "📊", "title": "Balanstest", "description": "Korte test die meet hoe het met je gaat"}, {"emoji": "🔍", "title": "Hulp zoeken", "description": "Vind hulp bij jou in de buurt"}, {"emoji": "📚", "title": "Tips & informatie", "description": "Handige artikelen en nieuws"}, {"emoji": "❤️", "title": "Favorieten", "description": "Bewaar wat je wilt onthouden"}]}', 3, true, now(), now()),
  (gen_random_uuid()::text, 'ONBOARDING', 'klaar', 'Alles staat klaar!', 'Je kunt nu beginnen. Veel succes!', NULL, '🎉', NULL, 4, true, now(), now())
ON CONFLICT (type, sleutel) DO UPDATE SET
  titel = EXCLUDED.titel, inhoud = EXCLUDED.inhoud, subtekst = EXCLUDED.subtekst,
  emoji = EXCLUDED.emoji, volgorde = EXCLUDED.volgorde, metadata = EXCLUDED.metadata, "updatedAt" = now();

-- ============================================
-- 10. PAGINA INTRO'S
-- ============================================

INSERT INTO "AppContent" (id, type, sleutel, titel, inhoud, emoji, volgorde, "isActief", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid()::text, 'PAGINA_INTRO', 'leren', 'Informatie & tips', 'Handige informatie speciaal voor mantelzorgers. Geschreven in eenvoudige taal.', '📚', 1, true, now(), now()),
  (gen_random_uuid()::text, 'PAGINA_INTRO', 'hulpvragen', 'Hulp zoeken', 'Vind hulp bij jou in de buurt, afgestemd op jouw situatie.', '🔍', 2, true, now(), now()),
  (gen_random_uuid()::text, 'PAGINA_INTRO', 'balanstest', 'Balanstest', 'Doe de korte test en ontdek hoe het met je gaat.', '📊', 3, true, now(), now()),
  (gen_random_uuid()::text, 'PAGINA_INTRO', 'check-in', 'Maandelijkse check-in', 'Even kijken hoe het gaat. 5 korte vragen.', '💬', 4, true, now(), now()),
  (gen_random_uuid()::text, 'PAGINA_INTRO', 'gemeente-nieuws', 'Nieuws uit jouw gemeente', 'Actuele berichten en evenementen voor mantelzorgers bij jou in de buurt.', '🏘️', 5, true, now(), now())
ON CONFLICT (type, sleutel) DO UPDATE SET
  titel = EXCLUDED.titel, inhoud = EXCLUDED.inhoud,
  emoji = EXCLUDED.emoji, volgorde = EXCLUDED.volgorde, "updatedAt" = now();

COMMIT;
