-- ============================================
-- CONTENT PIPELINE - Nieuwe ArtikelStatus waarden
-- Voer dit uit in de Supabase SQL Editor
-- ============================================

-- Voeg nieuwe pipeline-statussen toe aan ArtikelStatus enum
-- (ALTER TYPE ADD VALUE is veilig: bestaande waarden blijven werken)

ALTER TYPE "ArtikelStatus" ADD VALUE IF NOT EXISTS 'VOORSTEL';
ALTER TYPE "ArtikelStatus" ADD VALUE IF NOT EXISTS 'HERSCHREVEN';
ALTER TYPE "ArtikelStatus" ADD VALUE IF NOT EXISTS 'VERRIJKT';

-- ============================================
-- KLAAR! Pipeline statussen:
-- VOORSTEL → CONCEPT → HERSCHREVEN → VERRIJKT → GEPUBLICEERD → GEARCHIVEERD
-- ============================================
