-- ============================================
-- ITERATIE A - STAP 1 van 2
-- Draai dit EERST in Supabase SQL Editor
-- ============================================

-- Enum uitbreiden (moet apart gecommit worden)
ALTER TYPE "TagType" ADD VALUE IF NOT EXISTS 'ONDERWERP';

-- Kolommen toevoegen (kan in dezelfde run)
ALTER TABLE "Caregiver" ADD COLUMN IF NOT EXISTS "woonsituatie" TEXT;
ALTER TABLE "Caregiver" ADD COLUMN IF NOT EXISTS "werkstatus" TEXT;
ALTER TABLE "ContentTag" ADD COLUMN IF NOT EXISTS "synoniemen" TEXT[] DEFAULT '{}';

-- ============================================
-- KLAAR! Draai nu STAP 2.
-- ============================================
