-- ============================================
-- SEED CONTENT SQL
-- Gegenereerd vanuit scripts/seed-content.ts
-- Kan direct in Supabase SQL Editor worden uitgevoerd
-- ============================================

-- Helper: gebruik gen_random_uuid() als CUID niet beschikbaar is
-- Supabase/Postgres heeft geen ingebouwde CUID, dus we gebruiken gen_random_uuid()

BEGIN;

-- ============================================
-- 1. BALANSTEST VRAGEN
-- ============================================

INSERT INTO "BalanstestVraag" (id, type, "vraagId", "vraagTekst", beschrijving, tip, sectie, gewicht, reversed, "isMultiSelect", volgorde, "isActief", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid(), 'BALANSTEST', 'q1', 'Slaap je minder goed door de zorg voor je naaste?', 'Eerst een paar vragen aan jou over hoe jij je lichamelijk voelt.', 'Veel mantelzorgers merken dat hun slaap onrustig wordt door piekeren of nachtelijke zorgtaken.', 'Jouw energie', 1.5, false, false, 1, true, now(), now()),
  (gen_random_uuid(), 'BALANSTEST', 'q2', 'Heb je last van je lichaam door het zorgen?', NULL, 'Fysieke klachten zoals rugpijn of vermoeidheid komen veel voor bij mantelzorgers.', 'Jouw energie', 1.0, false, false, 2, true, now(), now()),
  (gen_random_uuid(), 'BALANSTEST', 'q3', 'Kost het zorgen veel tijd en energie?', NULL, 'Het is normaal om dit te ervaren. Zorg goed voor jezelf.', 'Jouw energie', 1.0, false, false, 3, true, now(), now()),
  (gen_random_uuid(), 'BALANSTEST', 'q4', 'Is de band met je naaste veranderd?', 'Nu een paar vragen over hoe jij je emotioneel voelt.', 'Relaties veranderen door ziekte. Dat is normaal en soms lastig.', 'Jouw gevoel', 1.5, false, false, 4, true, now(), now()),
  (gen_random_uuid(), 'BALANSTEST', 'q5', 'Maakt het gedrag van je naaste je verdrietig, bang of boos?', NULL, 'Deze gevoelens zijn heel begrijpelijk en komen veel voor.', 'Jouw gevoel', 1.5, false, false, 5, true, now(), now()),
  (gen_random_uuid(), 'BALANSTEST', 'q6', 'Heb je verdriet dat je naaste anders is dan vroeger?', NULL, 'Rouwen om wie iemand was is een normaal onderdeel van mantelzorg.', 'Jouw gevoel', 1.0, false, false, 6, true, now(), now()),
  (gen_random_uuid(), 'BALANSTEST', 'q7', 'Slokt de zorg al je energie op?', NULL, 'Als dit zo voelt, is het belangrijk om hulp te zoeken.', 'Jouw gevoel', 1.5, false, false, 7, true, now(), now()),
  (gen_random_uuid(), 'BALANSTEST', 'q8', 'Pas je je dagelijks leven aan voor de zorg?', 'Tot slot een paar vragen over je tijd en je eigen leven.', 'Aanpassingen zijn normaal, maar vergeet jezelf niet.', 'Jouw tijd', 1.0, false, false, 8, true, now(), now()),
  (gen_random_uuid(), 'BALANSTEST', 'q9', 'Pas je regelmatig je plannen aan om te helpen?', NULL, 'Flexibiliteit is mooi, maar je eigen plannen tellen ook.', 'Jouw tijd', 1.0, false, false, 9, true, now(), now()),
  (gen_random_uuid(), 'BALANSTEST', 'q10', 'Kom je niet meer toe aan dingen die je leuk vindt?', NULL, 'Tijd voor jezelf is geen luxe, maar noodzaak.', 'Jouw tijd', 1.0, false, false, 10, true, now(), now()),
  (gen_random_uuid(), 'BALANSTEST', 'q11', 'Kost het zorgen net zoveel tijd als je werk?', NULL, 'Mantelzorg is ook werk. Gun jezelf erkenning hiervoor.', 'Jouw tijd', 1.5, false, false, 11, true, now(), now())
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
  (gen_random_uuid(), 'CHECKIN', 'c1', 'Ben je vaak moe?', 'Als je veel moe bent, is dat een teken dat je rust nodig hebt.', false, false, 1, true, now(), now()),
  (gen_random_uuid(), 'CHECKIN', 'c2', 'Heb je tijd voor jezelf?', 'Tijd voor jezelf is belangrijk. Ook voor jou.', true, false, 2, true, now(), now()),
  (gen_random_uuid(), 'CHECKIN', 'c3', 'Maak je je vaak zorgen?', 'Zorgen maken hoort erbij. Maar het mag niet te veel worden.', false, false, 3, true, now(), now()),
  (gen_random_uuid(), 'CHECKIN', 'c4', 'Krijg je hulp van anderen?', 'Hulp van anderen is fijn. Je hoeft het niet alleen te doen.', true, false, 4, true, now(), now()),
  (gen_random_uuid(), 'CHECKIN', 'c5', 'Waar wil je hulp bij?', 'Kies wat voor jou belangrijk is. Je kunt meer dan één ding kiezen.', false, true, 5, true, now(), now())
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
  (gen_random_uuid(), 't1', 'Administratie en geldzaken', 'Rekeningen, post, verzekeringen', 1, true, now(), now()),
  (gen_random_uuid(), 't2', 'Regelen en afspraken maken', 'Arts, thuiszorg, dagbesteding', 2, true, now(), now()),
  (gen_random_uuid(), 't3', 'Boodschappen doen', 'Supermarkt, apotheek', 3, true, now(), now()),
  (gen_random_uuid(), 't4', 'Bezoek en gezelschap', 'Gesprekken, uitjes, wandelen', 4, true, now(), now()),
  (gen_random_uuid(), 't5', 'Vervoer naar afspraken', 'Ziekenhuis, huisarts, familie', 5, true, now(), now()),
  (gen_random_uuid(), 't6', 'Persoonlijke verzorging', 'Wassen, aankleden, medicijnen', 6, true, now(), now()),
  (gen_random_uuid(), 't7', 'Eten en drinken', 'Koken, maaltijden, dieet', 7, true, now(), now()),
  (gen_random_uuid(), 't8', 'Huishouden', 'Schoonmaken, was, opruimen', 8, true, now(), now()),
  (gen_random_uuid(), 't9', 'Klusjes in en om huis', 'Reparaties, tuin, onderhoud', 9, true, now(), now())
ON CONFLICT ("taakId") DO UPDATE SET
  naam = EXCLUDED.naam,
  beschrijving = EXCLUDED.beschrijving,
  volgorde = EXCLUDED.volgorde,
  "updatedAt" = now();

-- ============================================
-- 4. HULPVRAAG CATEGORIEËN (zorgvrager)
-- ============================================

INSERT INTO "ContentCategorie" (id, type, slug, naam, icon, hint, metadata, volgorde, "isActief", "createdAt", "updatedAt")
VALUES
  -- Dagelijks leven
  (gen_random_uuid(), 'HULP_ZORGVRAGER', 'persoonlijke-verzorging', 'Persoonlijke verzorging', '🛁', 'Verzorging', '{"groep": "Dagelijks leven", "routeLabel": "Wmo/Zvw/Wlz"}', 1, true, now(), now()),
  (gen_random_uuid(), 'HULP_ZORGVRAGER', 'maaltijden', 'Bereiden en/of nuttigen van maaltijden', '🍽️', 'Maaltijden', '{"groep": "Dagelijks leven", "routeLabel": "Gemeente"}', 2, true, now(), now()),
  (gen_random_uuid(), 'HULP_ZORGVRAGER', 'boodschappen', 'Boodschappen', '🛒', 'Boodschappen', '{"groep": "Dagelijks leven", "routeLabel": "Gemeente"}', 3, true, now(), now()),
  -- In en om het huis
  (gen_random_uuid(), 'HULP_ZORGVRAGER', 'huishoudelijke-taken', 'Huishoudelijke taken', '🧹', 'Huishouden', '{"groep": "In en om het huis", "routeLabel": "Wmo"}', 4, true, now(), now()),
  (gen_random_uuid(), 'HULP_ZORGVRAGER', 'klusjes', 'Klusjes in en om het huis', '🔧', 'Klusjes', '{"groep": "In en om het huis", "routeLabel": "Gemeente"}', 5, true, now(), now()),
  -- Organisatie & regelwerk
  (gen_random_uuid(), 'HULP_ZORGVRAGER', 'administratie', 'Administratie en aanvragen', '📋', 'Administratie', '{"groep": "Organisatie & regelwerk", "routeLabel": "Landelijk"}', 6, true, now(), now()),
  (gen_random_uuid(), 'HULP_ZORGVRAGER', 'plannen', 'Plannen en organiseren', '📅', 'Plannen', '{"groep": "Organisatie & regelwerk", "routeLabel": null}', 7, true, now(), now()),
  -- Welzijn & mobiliteit
  (gen_random_uuid(), 'HULP_ZORGVRAGER', 'sociaal-contact', 'Sociaal contact en activiteiten', '👥', 'Sociaal', '{"groep": "Welzijn & mobiliteit", "routeLabel": "Wmo"}', 8, true, now(), now()),
  (gen_random_uuid(), 'HULP_ZORGVRAGER', 'vervoer', 'Vervoer', '🚗', 'Vervoer', '{"groep": "Welzijn & mobiliteit", "routeLabel": "Landelijk"}', 9, true, now(), now()),
  -- Overig
  (gen_random_uuid(), 'HULP_ZORGVRAGER', 'huisdieren', 'Huisdieren', '🐕', 'Huisdieren', '{"groep": "Overig", "routeLabel": null}', 10, true, now(), now())
ON CONFLICT (type, slug) DO UPDATE SET
  naam = EXCLUDED.naam,
  icon = EXCLUDED.icon,
  hint = EXCLUDED.hint,
  metadata = EXCLUDED.metadata,
  volgorde = EXCLUDED.volgorde,
  "updatedAt" = now();

-- Categorieën mantelzorger
INSERT INTO "ContentCategorie" (id, type, slug, naam, icon, hint, volgorde, "isActief", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid(), 'HULP_MANTELZORGER', 'mantelzorgondersteuning', 'Mantelzorgondersteuning', '💜', 'Ondersteuning', 1, true, now(), now()),
  (gen_random_uuid(), 'HULP_MANTELZORGER', 'respijtzorg', 'Respijtzorg', '🏠', 'Respijtzorg', 2, true, now(), now()),
  (gen_random_uuid(), 'HULP_MANTELZORGER', 'emotionele-steun', 'Emotionele steun', '💚', 'Praten & steun', 3, true, now(), now()),
  (gen_random_uuid(), 'HULP_MANTELZORGER', 'lotgenotencontact', 'Lotgenotencontact', '👥', 'Lotgenoten', 4, true, now(), now()),
  (gen_random_uuid(), 'HULP_MANTELZORGER', 'leren-en-training', 'Leren en training', '🎓', 'Leren & training', 5, true, now(), now())
ON CONFLICT (type, slug) DO UPDATE SET
  naam = EXCLUDED.naam,
  icon = EXCLUDED.icon,
  hint = EXCLUDED.hint,
  volgorde = EXCLUDED.volgorde,
  "updatedAt" = now();

-- Hulpvraag categorieën
INSERT INTO "ContentCategorie" (id, type, slug, naam, icon, hint, volgorde, "isActief", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid(), 'HULPVRAAG', 'respite-care', 'Even vrij', '🏠', 'Iemand neemt de zorg over', 1, true, now(), now()),
  (gen_random_uuid(), 'HULPVRAAG', 'emotional-support', 'Praten', '💚', 'Over je gevoel praten', 2, true, now(), now()),
  (gen_random_uuid(), 'HULPVRAAG', 'practical-help', 'Hulp thuis', '🔧', 'Klussen of taken', 3, true, now(), now()),
  (gen_random_uuid(), 'HULPVRAAG', 'financial-advice', 'Geld', '💰', 'Hulp met geld of aanvragen', 4, true, now(), now()),
  (gen_random_uuid(), 'HULPVRAAG', 'information', 'Info', 'ℹ️', 'Informatie zoeken', 5, true, now(), now()),
  (gen_random_uuid(), 'HULPVRAAG', 'other', 'Anders', '📝', 'Iets anders', 6, true, now(), now())
ON CONFLICT (type, slug) DO UPDATE SET
  naam = EXCLUDED.naam,
  icon = EXCLUDED.icon,
  hint = EXCLUDED.hint,
  volgorde = EXCLUDED.volgorde,
  "updatedAt" = now();

-- ============================================
-- 5. LEREN CATEGORIEËN + SUB-HOOFDSTUKKEN
-- ============================================

INSERT INTO "ContentCategorie" (id, type, slug, naam, beschrijving, emoji, volgorde, "isActief", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid(), 'LEREN', 'praktische-tips', 'Praktische tips', 'Voor het dagelijks leven', '💡', 1, true, now(), now()),
  (gen_random_uuid(), 'LEREN', 'zelfzorg', 'Zelfzorg', 'Zorg ook voor jezelf', '🧘', 2, true, now(), now()),
  (gen_random_uuid(), 'LEREN', 'rechten', 'Je rechten', 'Wmo, Zvw, Wlz en meer', '⚖️', 3, true, now(), now()),
  (gen_random_uuid(), 'LEREN', 'financieel', 'Financieel', 'Kosten, vergoedingen & pgb', '💰', 4, true, now(), now()),
  (gen_random_uuid(), 'LEREN', 'hulpmiddelen-producten', 'Hulpmiddelen & producten', 'Fysiek, digitaal & aanpassingen', '🛠️', 5, true, now(), now())
ON CONFLICT (type, slug) DO UPDATE SET
  naam = EXCLUDED.naam,
  beschrijving = EXCLUDED.beschrijving,
  emoji = EXCLUDED.emoji,
  volgorde = EXCLUDED.volgorde,
  "updatedAt" = now();

-- Sub-hoofdstukken (met referentie naar parent via subquery)

-- praktische-tips sub-hoofdstukken
INSERT INTO "ContentCategorie" (id, type, slug, naam, beschrijving, "parentId", volgorde, "isActief", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid(), 'SUB_HOOFDSTUK', 'dagelijks-organiseren', 'Dagelijks organiseren', 'Dagstructuur, weekplanning en taken uitbesteden', (SELECT id FROM "ContentCategorie" WHERE type = 'LEREN' AND slug = 'praktische-tips'), 1, true, now(), now()),
  (gen_random_uuid(), 'SUB_HOOFDSTUK', 'samen-organiseren', 'Samen organiseren met familie/netwerk', 'Afspraken, back-up en samenwerking', (SELECT id FROM "ContentCategorie" WHERE type = 'LEREN' AND slug = 'praktische-tips'), 2, true, now(), now()),
  (gen_random_uuid(), 'SUB_HOOFDSTUK', 'veiligheid-zware-taken', 'Veiligheid bij zware taken', 'Tillen, verplaatsen en medicatie', (SELECT id FROM "ContentCategorie" WHERE type = 'LEREN' AND slug = 'praktische-tips'), 3, true, now(), now())
ON CONFLICT (type, slug) DO UPDATE SET
  naam = EXCLUDED.naam,
  beschrijving = EXCLUDED.beschrijving,
  "parentId" = EXCLUDED."parentId",
  volgorde = EXCLUDED.volgorde,
  "updatedAt" = now();

-- zelfzorg sub-hoofdstukken
INSERT INTO "ContentCategorie" (id, type, slug, naam, beschrijving, "parentId", volgorde, "isActief", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid(), 'SUB_HOOFDSTUK', 'overbelasting-herkennen', 'Overbelasting herkennen', 'Signalen herkennen en wat je kunt doen', (SELECT id FROM "ContentCategorie" WHERE type = 'LEREN' AND slug = 'zelfzorg'), 1, true, now(), now()),
  (gen_random_uuid(), 'SUB_HOOFDSTUK', 'pauze-en-respijt', 'Pauze en respijt organiseren', 'Tijdelijke overname van zorg regelen', (SELECT id FROM "ContentCategorie" WHERE type = 'LEREN' AND slug = 'zelfzorg'), 2, true, now(), now()),
  (gen_random_uuid(), 'SUB_HOOFDSTUK', 'emotionele-steun', 'Emotionele steun en praten', 'Steun zoeken en stress verwerken', (SELECT id FROM "ContentCategorie" WHERE type = 'LEREN' AND slug = 'zelfzorg'), 3, true, now(), now())
ON CONFLICT (type, slug) DO UPDATE SET
  naam = EXCLUDED.naam,
  beschrijving = EXCLUDED.beschrijving,
  "parentId" = EXCLUDED."parentId",
  volgorde = EXCLUDED.volgorde,
  "updatedAt" = now();

-- rechten sub-hoofdstukken
INSERT INTO "ContentCategorie" (id, type, slug, naam, beschrijving, "parentId", volgorde, "isActief", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid(), 'SUB_HOOFDSTUK', 'routekaart-wmo-zvw-wlz', 'Routekaart Wmo / Zvw / Wlz', 'Wat hoort waar? Interactief overzicht', (SELECT id FROM "ContentCategorie" WHERE type = 'LEREN' AND slug = 'rechten'), 1, true, now(), now()),
  (gen_random_uuid(), 'SUB_HOOFDSTUK', 'gemeente-wmo-aanvragen', 'Gemeente (Wmo) aanvragen', 'Wat je kunt krijgen en hoe je het aanvraagt', (SELECT id FROM "ContentCategorie" WHERE type = 'LEREN' AND slug = 'rechten'), 2, true, now(), now()),
  (gen_random_uuid(), 'SUB_HOOFDSTUK', 'clientondersteuning', 'Gratis clientondersteuning', 'Onafhankelijke hulp bij het organiseren van zorg', (SELECT id FROM "ContentCategorie" WHERE type = 'LEREN' AND slug = 'rechten'), 3, true, now(), now())
ON CONFLICT (type, slug) DO UPDATE SET
  naam = EXCLUDED.naam,
  beschrijving = EXCLUDED.beschrijving,
  "parentId" = EXCLUDED."parentId",
  volgorde = EXCLUDED.volgorde,
  "updatedAt" = now();

-- financieel sub-hoofdstukken
INSERT INTO "ContentCategorie" (id, type, slug, naam, beschrijving, "parentId", volgorde, "isActief", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid(), 'SUB_HOOFDSTUK', 'eigen-bijdrage-kosten', 'Eigen bijdrage en kosten', 'CAK, abonnementstarief en rekentools', (SELECT id FROM "ContentCategorie" WHERE type = 'LEREN' AND slug = 'financieel'), 1, true, now(), now()),
  (gen_random_uuid(), 'SUB_HOOFDSTUK', 'mantelzorgwaardering', 'Mantelzorgwaardering', 'Jaarlijkse waardering van je gemeente', (SELECT id FROM "ContentCategorie" WHERE type = 'LEREN' AND slug = 'financieel'), 2, true, now(), now()),
  (gen_random_uuid(), 'SUB_HOOFDSTUK', 'pgb-aanvragen-beheer', 'Pgb: aanvragen en beheer', 'Route, vaardigheden en SVB', (SELECT id FROM "ContentCategorie" WHERE type = 'LEREN' AND slug = 'financieel'), 3, true, now(), now()),
  (gen_random_uuid(), 'SUB_HOOFDSTUK', 'vergoedingen-hulpmiddelen', 'Vergoedingen hulpmiddelen', 'Eerst aanvragen, dan kopen', (SELECT id FROM "ContentCategorie" WHERE type = 'LEREN' AND slug = 'financieel'), 4, true, now(), now())
ON CONFLICT (type, slug) DO UPDATE SET
  naam = EXCLUDED.naam,
  beschrijving = EXCLUDED.beschrijving,
  "parentId" = EXCLUDED."parentId",
  volgorde = EXCLUDED.volgorde,
  "updatedAt" = now();

-- hulpmiddelen-producten sub-hoofdstukken
INSERT INTO "ContentCategorie" (id, type, slug, naam, beschrijving, "parentId", volgorde, "isActief", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid(), 'SUB_HOOFDSTUK', 'hulpmiddelen-overzicht', 'Hulpmiddelen overzicht', 'Fysieke en digitale hulpmiddelen vinden', (SELECT id FROM "ContentCategorie" WHERE type = 'LEREN' AND slug = 'hulpmiddelen-producten'), 1, true, now(), now()),
  (gen_random_uuid(), 'SUB_HOOFDSTUK', 'vergoedingsroutes', 'Vergoedingsroutes', 'Welk hulpmiddel via welke wet?', (SELECT id FROM "ContentCategorie" WHERE type = 'LEREN' AND slug = 'hulpmiddelen-producten'), 2, true, now(), now())
ON CONFLICT (type, slug) DO UPDATE SET
  naam = EXCLUDED.naam,
  beschrijving = EXCLUDED.beschrijving,
  "parentId" = EXCLUDED."parentId",
  volgorde = EXCLUDED.volgorde,
  "updatedAt" = now();

-- ============================================
-- 6. TAAK-CATEGORIE MAPPINGS
-- ============================================

INSERT INTO "TaakCategorieMapping" (id, "bronNaam", "zorgtaakId", "isActief", "createdAt")
VALUES
  -- Persoonlijke verzorging → t6
  (gen_random_uuid(), 'Wassen/aankleden', (SELECT id FROM "Zorgtaak" WHERE "taakId" = 't6'), true, now()),
  (gen_random_uuid(), 'Wassen en aankleden', (SELECT id FROM "Zorgtaak" WHERE "taakId" = 't6'), true, now()),
  (gen_random_uuid(), 'Persoonlijke verzorging', (SELECT id FROM "Zorgtaak" WHERE "taakId" = 't6'), true, now()),
  (gen_random_uuid(), 'Toiletgang', (SELECT id FROM "Zorgtaak" WHERE "taakId" = 't6'), true, now()),
  (gen_random_uuid(), 'Medicijnen', (SELECT id FROM "Zorgtaak" WHERE "taakId" = 't6'), true, now()),
  (gen_random_uuid(), 'Toezicht', (SELECT id FROM "Zorgtaak" WHERE "taakId" = 't6'), true, now()),
  (gen_random_uuid(), 'Medische zorg', (SELECT id FROM "Zorgtaak" WHERE "taakId" = 't6'), true, now()),
  -- Huishoudelijke taken → t8
  (gen_random_uuid(), 'Huishouden', (SELECT id FROM "Zorgtaak" WHERE "taakId" = 't8'), true, now()),
  (gen_random_uuid(), 'Huishoudelijke taken', (SELECT id FROM "Zorgtaak" WHERE "taakId" = 't8'), true, now()),
  -- Vervoer → t5
  (gen_random_uuid(), 'Vervoer', (SELECT id FROM "Zorgtaak" WHERE "taakId" = 't5'), true, now()),
  (gen_random_uuid(), 'Vervoer/begeleiding', (SELECT id FROM "Zorgtaak" WHERE "taakId" = 't5'), true, now()),
  (gen_random_uuid(), 'Vervoer naar afspraken', (SELECT id FROM "Zorgtaak" WHERE "taakId" = 't5'), true, now()),
  -- Administratie → t1
  (gen_random_uuid(), 'Administratie', (SELECT id FROM "Zorgtaak" WHERE "taakId" = 't1'), true, now()),
  (gen_random_uuid(), 'Administratie en aanvragen', (SELECT id FROM "Zorgtaak" WHERE "taakId" = 't1'), true, now()),
  (gen_random_uuid(), 'Administratie en geldzaken', (SELECT id FROM "Zorgtaak" WHERE "taakId" = 't1'), true, now()),
  -- Plannen en organiseren → t2
  (gen_random_uuid(), 'Plannen en organiseren', (SELECT id FROM "Zorgtaak" WHERE "taakId" = 't2'), true, now()),
  (gen_random_uuid(), 'Regelen en afspraken maken', (SELECT id FROM "Zorgtaak" WHERE "taakId" = 't2'), true, now()),
  (gen_random_uuid(), 'Plannen', (SELECT id FROM "Zorgtaak" WHERE "taakId" = 't2'), true, now()),
  (gen_random_uuid(), 'Organiseren', (SELECT id FROM "Zorgtaak" WHERE "taakId" = 't2'), true, now()),
  -- Sociaal contact → t4
  (gen_random_uuid(), 'Sociaal contact', (SELECT id FROM "Zorgtaak" WHERE "taakId" = 't4'), true, now()),
  (gen_random_uuid(), 'Sociaal contact en activiteiten', (SELECT id FROM "Zorgtaak" WHERE "taakId" = 't4'), true, now()),
  (gen_random_uuid(), 'Activiteiten', (SELECT id FROM "Zorgtaak" WHERE "taakId" = 't4'), true, now()),
  (gen_random_uuid(), 'Bezoek en gezelschap', (SELECT id FROM "Zorgtaak" WHERE "taakId" = 't4'), true, now()),
  (gen_random_uuid(), 'Bezoek en uitjes', (SELECT id FROM "Zorgtaak" WHERE "taakId" = 't4'), true, now()),
  -- Maaltijden → t7
  (gen_random_uuid(), 'Maaltijden', (SELECT id FROM "Zorgtaak" WHERE "taakId" = 't7'), true, now()),
  (gen_random_uuid(), 'Eten maken', (SELECT id FROM "Zorgtaak" WHERE "taakId" = 't7'), true, now()),
  (gen_random_uuid(), 'Eten en drinken', (SELECT id FROM "Zorgtaak" WHERE "taakId" = 't7'), true, now()),
  -- Boodschappen → t3
  (gen_random_uuid(), 'Boodschappen', (SELECT id FROM "Zorgtaak" WHERE "taakId" = 't3'), true, now()),
  (gen_random_uuid(), 'Boodschappen doen', (SELECT id FROM "Zorgtaak" WHERE "taakId" = 't3'), true, now()),
  -- Klusjes → t9
  (gen_random_uuid(), 'Klusjes', (SELECT id FROM "Zorgtaak" WHERE "taakId" = 't9'), true, now()),
  (gen_random_uuid(), 'Klusjes in huis', (SELECT id FROM "Zorgtaak" WHERE "taakId" = 't9'), true, now()),
  (gen_random_uuid(), 'Klusjes in en om huis', (SELECT id FROM "Zorgtaak" WHERE "taakId" = 't9'), true, now()),
  (gen_random_uuid(), 'Klusjes in/om huis', (SELECT id FROM "Zorgtaak" WHERE "taakId" = 't9'), true, now()),
  (gen_random_uuid(), 'Klusjes in en om het huis', (SELECT id FROM "Zorgtaak" WHERE "taakId" = 't9'), true, now()),
  -- Huisdieren → t4 (fallback naar bezoek)
  (gen_random_uuid(), 'Huisdieren', (SELECT id FROM "Zorgtaak" WHERE "taakId" = 't4'), true, now()),
  (gen_random_uuid(), 'Huisdieren verzorgen', (SELECT id FROM "Zorgtaak" WHERE "taakId" = 't4'), true, now()),
  (gen_random_uuid(), 'Dieren', (SELECT id FROM "Zorgtaak" WHERE "taakId" = 't4'), true, now())
ON CONFLICT ("bronNaam") DO UPDATE SET
  "zorgtaakId" = EXCLUDED."zorgtaakId";

-- ============================================
-- 7. FORMULIER OPTIES
-- ============================================

-- Relatie opties
INSERT INTO "FormulierOptie" (id, groep, waarde, label, emoji, volgorde, "isActief", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid(), 'RELATIE', 'partner', 'Mijn partner', '💑', 1, true, now(), now()),
  (gen_random_uuid(), 'RELATIE', 'ouder', 'Mijn ouder', '👵', 2, true, now(), now()),
  (gen_random_uuid(), 'RELATIE', 'kind', 'Mijn kind', '👧', 3, true, now(), now()),
  (gen_random_uuid(), 'RELATIE', 'ander-familielid', 'Ander familielid', '👨‍👩‍👧', 4, true, now(), now()),
  (gen_random_uuid(), 'RELATIE', 'kennis', 'Kennis of vriend(in)', '🤝', 5, true, now(), now())
ON CONFLICT (groep, waarde) DO UPDATE SET
  label = EXCLUDED.label,
  emoji = EXCLUDED.emoji,
  volgorde = EXCLUDED.volgorde,
  "updatedAt" = now();

-- Uren per week
INSERT INTO "FormulierOptie" (id, groep, waarde, label, beschrijving, volgorde, "isActief", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid(), 'UREN_PER_WEEK', '0-5', '0 - 5 uur', 'Af en toe bijspringen', 1, true, now(), now()),
  (gen_random_uuid(), 'UREN_PER_WEEK', '5-10', '5 - 10 uur', 'Regelmatig helpen', 2, true, now(), now()),
  (gen_random_uuid(), 'UREN_PER_WEEK', '10-20', '10 - 20 uur', 'Flink bezig', 3, true, now(), now()),
  (gen_random_uuid(), 'UREN_PER_WEEK', '20-40', '20 - 40 uur', 'Bijna een baan', 4, true, now(), now()),
  (gen_random_uuid(), 'UREN_PER_WEEK', '40+', 'Meer dan 40 uur', 'Fulltime zorg', 5, true, now(), now())
ON CONFLICT (groep, waarde) DO UPDATE SET
  label = EXCLUDED.label,
  beschrijving = EXCLUDED.beschrijving,
  volgorde = EXCLUDED.volgorde,
  "updatedAt" = now();

-- Zorgduur
INSERT INTO "FormulierOptie" (id, groep, waarde, label, emoji, volgorde, "isActief", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid(), 'ZORGDUUR', '<1', 'Minder dan 1 jaar', '🌱', 1, true, now(), now()),
  (gen_random_uuid(), 'ZORGDUUR', '1-3', '1 - 3 jaar', '🌿', 2, true, now(), now()),
  (gen_random_uuid(), 'ZORGDUUR', '3-5', '3 - 5 jaar', '🌳', 3, true, now(), now()),
  (gen_random_uuid(), 'ZORGDUUR', '5+', 'Meer dan 5 jaar', '🏔️', 4, true, now(), now())
ON CONFLICT (groep, waarde) DO UPDATE SET
  label = EXCLUDED.label,
  emoji = EXCLUDED.emoji,
  volgorde = EXCLUDED.volgorde,
  "updatedAt" = now();

-- Uren balanstest
INSERT INTO "FormulierOptie" (id, groep, waarde, label, beschrijving, volgorde, "isActief", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid(), 'UREN_BALANSTEST', '0-2', 'Tot 2 uur per week', '1', 1, true, now(), now()),
  (gen_random_uuid(), 'UREN_BALANSTEST', '2-4', '2 tot 4 uur per week', '3', 2, true, now(), now()),
  (gen_random_uuid(), 'UREN_BALANSTEST', '4-8', '4 tot 8 uur per week', '6', 3, true, now(), now()),
  (gen_random_uuid(), 'UREN_BALANSTEST', '8-12', '8 tot 12 uur per week', '10', 4, true, now(), now()),
  (gen_random_uuid(), 'UREN_BALANSTEST', '12-24', '12 tot 24 uur per week', '18', 5, true, now(), now()),
  (gen_random_uuid(), 'UREN_BALANSTEST', '24+', 'Meer dan 24 uur per week', '30', 6, true, now(), now())
ON CONFLICT (groep, waarde) DO UPDATE SET
  label = EXCLUDED.label,
  beschrijving = EXCLUDED.beschrijving,
  volgorde = EXCLUDED.volgorde,
  "updatedAt" = now();

-- Check-in hulp opties
INSERT INTO "FormulierOptie" (id, groep, waarde, label, emoji, volgorde, "isActief", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid(), 'CHECKIN_HULP', 'geen', 'Het gaat goed zo', '✅', 1, true, now(), now()),
  (gen_random_uuid(), 'CHECKIN_HULP', 'huishouden', 'Huishouden', '🧹', 2, true, now(), now()),
  (gen_random_uuid(), 'CHECKIN_HULP', 'zorgtaken', 'Zorgtaken', '🩺', 3, true, now(), now()),
  (gen_random_uuid(), 'CHECKIN_HULP', 'tijd_voor_mezelf', 'Tijd voor mezelf', '🧘', 4, true, now(), now()),
  (gen_random_uuid(), 'CHECKIN_HULP', 'administratie', 'Papierwerk', '📋', 5, true, now(), now()),
  (gen_random_uuid(), 'CHECKIN_HULP', 'emotioneel', 'Praten met iemand', '💬', 6, true, now(), now())
ON CONFLICT (groep, waarde) DO UPDATE SET
  label = EXCLUDED.label,
  emoji = EXCLUDED.emoji,
  volgorde = EXCLUDED.volgorde,
  "updatedAt" = now();

-- Buddy hulpvormen
INSERT INTO "FormulierOptie" (id, groep, waarde, label, emoji, volgorde, "isActief", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid(), 'BUDDY_HULPVORM', 'gesprek', 'Gesprek / praatje', '☕', 1, true, now(), now()),
  (gen_random_uuid(), 'BUDDY_HULPVORM', 'boodschappen', 'Boodschappen', '🛒', 2, true, now(), now()),
  (gen_random_uuid(), 'BUDDY_HULPVORM', 'vervoer', 'Vervoer', '🚗', 3, true, now(), now()),
  (gen_random_uuid(), 'BUDDY_HULPVORM', 'klusjes', 'Klusjes', '🔧', 4, true, now(), now()),
  (gen_random_uuid(), 'BUDDY_HULPVORM', 'oppas', 'Oppas / toezicht', '🏠', 5, true, now(), now()),
  (gen_random_uuid(), 'BUDDY_HULPVORM', 'administratie', 'Administratie', '📋', 6, true, now(), now())
ON CONFLICT (groep, waarde) DO UPDATE SET
  label = EXCLUDED.label,
  emoji = EXCLUDED.emoji,
  volgorde = EXCLUDED.volgorde,
  "updatedAt" = now();

-- ============================================
-- 8. TUTORIAL STAPPEN
-- ============================================

INSERT INTO "AppContent" (id, type, sleutel, titel, inhoud, subtekst, emoji, metadata, volgorde, "isActief", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid(), 'TUTORIAL', 'welkom', 'Welkom bij MantelBuddy', 'Ik ben **Ger**, en ik ga je stap voor stap uitleggen hoe MantelBuddy jou kan helpen.', 'Het duurt maar 2 minuutjes. ⏱️', '👋', NULL, 0, true, now(), now()),
  (gen_random_uuid(), 'TUTORIAL', 'balanstest', 'De Balanstest', 'Met een **korte test** van 2 minuten kijken we hoe het met je gaat. Je krijgt een score die laat zien of je het goed volhoudt.', 'Doe de test regelmatig. Dan kun je zien hoe het gaat over tijd.', '📊', '{"demoScore": 13, "maxScore": 24}', 1, true, now(), now()),
  (gen_random_uuid(), 'TUTORIAL', 'hulp-mantelzorger', 'Hulp voor jou', 'Je hoeft het niet alleen te doen. MantelBuddy zoekt hulp **bij jou in de buurt**.', 'Daarom vragen we je adres. Zo vinden we hulp bij jou in de buurt.', '💜', '{"items": [{"emoji": "💜", "label": "Ondersteuning"}, {"emoji": "🏠", "label": "Respijtzorg"}, {"emoji": "💚", "label": "Praten"}, {"emoji": "👥", "label": "Lotgenoten"}]}', 2, true, now(), now()),
  (gen_random_uuid(), 'TUTORIAL', 'hulp-naaste', 'Hulp voor je naaste', 'Er is ook hulp voor de persoon waar je voor zorgt. De kleuren laten zien wat het zwaarst is.', 'We vragen twee adressen. Eén voor jou en één voor je naaste. Zo vinden we voor allebei de juiste hulp.', '💝', '{"items": [{"emoji": "🛁", "label": "Verzorging", "status": "zwaar"}, {"emoji": "🧹", "label": "Huishouden", "status": "gemiddeld"}, {"emoji": "🍽️", "label": "Maaltijden", "status": "gemiddeld"}, {"emoji": "🚗", "label": "Vervoer", "status": "licht"}]}', 3, true, now(), now()),
  (gen_random_uuid(), 'TUTORIAL', 'mantelbuddies', 'MantelBuddies', 'Een **MantelBuddy** is een vrijwilliger bij jou in de buurt. Die helpt je graag met kleine taken.', 'Eenmalig of vaker — jij kiest. Je vindt ze bij **Hulp**.', '🤝', '{"items": [{"emoji": "🛒", "text": "Boodschappen doen"}, {"emoji": "☕", "text": "Even een praatje maken"}, {"emoji": "🚗", "text": "Mee naar de dokter"}, {"emoji": "🔧", "text": "Klusjes in huis"}]}', 4, true, now(), now()),
  (gen_random_uuid(), 'TUTORIAL', 'informatie', 'Informatie en tips', 'Bij **Informatie** vind je handige artikelen en nieuws uit jouw gemeente.', NULL, '📚', '{"categories": [{"emoji": "💡", "title": "Praktische tips"}, {"emoji": "🧘", "title": "Zelfzorg"}, {"emoji": "⚖️", "title": "Je rechten"}, {"emoji": "💰", "title": "Financieel"}], "gemeenteNieuws": {"emoji": "🏘️", "title": "Nieuws van de gemeente", "subtitle": "Updates bij jou in de buurt"}}', 5, true, now(), now()),
  (gen_random_uuid(), 'TUTORIAL', 'favorieten', 'Bewaar je favorieten', 'Kom je iets tegen dat je wilt onthouden? Tik op het **hartje ❤️** om het te bewaren.', 'Je favorieten vind je terug op een eigen pagina. Daar kun je ze ook **afvinken** als je ze hebt gedaan. ✅', '❤️', NULL, 6, true, now(), now()),
  (gen_random_uuid(), 'TUTORIAL', 'klaar', 'Je bent er klaar voor!', 'Ik ben trots op je dat je deze stap zet. Mantelzorg is niet makkelijk, maar je staat er niet alleen voor.', 'Je kunt deze uitleg altijd teruglezen via je **Profiel**. 👤', '🎉', NULL, 7, true, now(), now())
ON CONFLICT (type, sleutel) DO UPDATE SET
  titel = EXCLUDED.titel,
  inhoud = EXCLUDED.inhoud,
  subtekst = EXCLUDED.subtekst,
  emoji = EXCLUDED.emoji,
  volgorde = EXCLUDED.volgorde,
  metadata = EXCLUDED.metadata,
  "updatedAt" = now();

-- ============================================
-- 9. ONBOARDING STAPPEN
-- ============================================

INSERT INTO "AppContent" (id, type, sleutel, titel, inhoud, subtekst, emoji, metadata, volgorde, "isActief", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid(), 'ONBOARDING', 'welkom', 'Hoi! Welkom bij MantelBuddy', 'Fijn dat je er bent. In een paar stappen maken we de app klaar voor jou.', 'Het duurt maar 2 minuutjes.', '👋', NULL, 0, true, now(), now()),
  (gen_random_uuid(), 'ONBOARDING', 'wie-ben-jij', 'Wie ben jij?', 'Zodat we hulp bij jou in de buurt kunnen vinden.', NULL, '👤', NULL, 1, true, now(), now()),
  (gen_random_uuid(), 'ONBOARDING', 'zorgsituatie', 'Jouw zorgsituatie', 'Zo kunnen we beter inschatten wat je nodig hebt.', NULL, '💪', NULL, 2, true, now(), now()),
  (gen_random_uuid(), 'ONBOARDING', 'app-uitleg', 'Wat kan MantelBuddy?', 'Dit zijn de belangrijkste onderdelen van de app.', NULL, '📱', '{"features": [{"emoji": "📊", "title": "Balanstest", "description": "Korte test die meet hoe het met je gaat"}, {"emoji": "🔍", "title": "Hulp zoeken", "description": "Vind hulp bij jou in de buurt"}, {"emoji": "📚", "title": "Tips & informatie", "description": "Handige artikelen en nieuws"}, {"emoji": "❤️", "title": "Favorieten", "description": "Bewaar wat je wilt onthouden"}]}', 3, true, now(), now()),
  (gen_random_uuid(), 'ONBOARDING', 'klaar', 'Alles staat klaar!', 'Je kunt nu beginnen. Veel succes!', NULL, '🎉', NULL, 4, true, now(), now())
ON CONFLICT (type, sleutel) DO UPDATE SET
  titel = EXCLUDED.titel,
  inhoud = EXCLUDED.inhoud,
  subtekst = EXCLUDED.subtekst,
  emoji = EXCLUDED.emoji,
  volgorde = EXCLUDED.volgorde,
  metadata = EXCLUDED.metadata,
  "updatedAt" = now();

-- ============================================
-- 10. PAGINA INTRO'S
-- ============================================

INSERT INTO "AppContent" (id, type, sleutel, titel, inhoud, emoji, volgorde, "isActief", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid(), 'PAGINA_INTRO', 'leren', 'Informatie & tips', 'Handige informatie speciaal voor mantelzorgers. Geschreven in eenvoudige taal.', '📚', 1, true, now(), now()),
  (gen_random_uuid(), 'PAGINA_INTRO', 'hulpvragen', 'Hulp zoeken', 'Vind hulp bij jou in de buurt, afgestemd op jouw situatie.', '🔍', 2, true, now(), now()),
  (gen_random_uuid(), 'PAGINA_INTRO', 'balanstest', 'Balanstest', 'Doe de korte test en ontdek hoe het met je gaat.', '📊', 3, true, now(), now()),
  (gen_random_uuid(), 'PAGINA_INTRO', 'check-in', 'Maandelijkse check-in', 'Even kijken hoe het gaat. 5 korte vragen.', '💬', 4, true, now(), now()),
  (gen_random_uuid(), 'PAGINA_INTRO', 'gemeente-nieuws', 'Nieuws uit jouw gemeente', 'Actuele berichten en evenementen voor mantelzorgers bij jou in de buurt.', '🏘️', 5, true, now(), now())
ON CONFLICT (type, sleutel) DO UPDATE SET
  titel = EXCLUDED.titel,
  inhoud = EXCLUDED.inhoud,
  emoji = EXCLUDED.emoji,
  volgorde = EXCLUDED.volgorde,
  "updatedAt" = now();

COMMIT;
