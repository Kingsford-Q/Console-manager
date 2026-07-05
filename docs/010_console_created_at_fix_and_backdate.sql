-- Phase 10: Add missing review/sale-tracking columns + fix "NaNd" + backdate rows
-- Run this in your Supabase SQL Editor (safe to re-run)
--
-- What we found (via information_schema): console_accounts is missing
-- created_at, review_started_at, days_in_review, AND sold_at entirely, and
-- applications is missing review_started_at, days_in_review, and sold_at
-- (its created_at/updated_at were already fine). Migration 006 evidently
-- never ran against this database. That's why:
--   - Console Accounts "Days in Review" showed "NaNd" (there was no
--     created_at/sold_at to compute from)
--   - The Dashboard's review-time and sales-analytics widgets
--     (consoleService.getReviewStats, applicationService.getReviewStats,
--     salesService) have been silently erroring — they SELECT columns
--     that don't exist
-- This script adds everything those features need, wires up triggers to
-- keep review_started_at / days_in_review / sold_at accurate going forward
-- (including for rows inserted directly into a review/sold status, not just
-- ones that transition into it), and backdates the specific rows requested.

-- ============================================
-- 1. NEW COLUMNS
-- ============================================

ALTER TABLE console_accounts ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE console_accounts ADD COLUMN IF NOT EXISTS review_started_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE console_accounts ADD COLUMN IF NOT EXISTS days_in_review INTEGER;
ALTER TABLE console_accounts ADD COLUMN IF NOT EXISTS sold_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE applications ADD COLUMN IF NOT EXISTS review_started_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS days_in_review INTEGER;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS sold_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_console_accounts_sold_at ON console_accounts(sold_at);
CREATE INDEX IF NOT EXISTS idx_applications_sold_at ON applications(sold_at);

-- Best-effort backfill for any row already sitting in a review status.
UPDATE console_accounts
SET review_started_at = updated_at
WHERE status = 'in_review' AND review_started_at IS NULL;

UPDATE applications
SET review_started_at = updated_at
WHERE status = 'under_review' AND review_started_at IS NULL;

-- ============================================
-- 2. TRIGGERS — stamp review_started_at / days_in_review / sold_at
--    automatically, both on INSERT (row created directly into a review/sold
--    status) and on UPDATE (status transitions).
-- ============================================

CREATE OR REPLACE FUNCTION track_console_review_and_sale()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'in_review' AND (OLD IS NULL OR OLD.status IS DISTINCT FROM 'in_review') THEN
    NEW.review_started_at := COALESCE(NEW.review_started_at, now());
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.status = 'approved' AND OLD.status = 'in_review' AND OLD.review_started_at IS NOT NULL THEN
    NEW.days_in_review := GREATEST(0, ROUND(EXTRACT(EPOCH FROM (now() - OLD.review_started_at)) / 86400)::INTEGER);
  END IF;

  IF NEW.status = 'sold' AND (OLD IS NULL OR OLD.status IS DISTINCT FROM 'sold') THEN
    NEW.sold_at := COALESCE(NEW.sold_at, now());
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_console_review_and_sale ON console_accounts;
CREATE TRIGGER trg_console_review_and_sale
BEFORE INSERT OR UPDATE ON console_accounts
FOR EACH ROW EXECUTE FUNCTION track_console_review_and_sale();

-- An app is considered "sold" the moment the console that houses it is sold.
CREATE OR REPLACE FUNCTION cascade_console_sold_to_applications()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'sold' AND OLD.status IS DISTINCT FROM 'sold' THEN
    UPDATE applications
    SET sold_at = NEW.sold_at
    WHERE console_id = NEW.id AND sold_at IS NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_cascade_console_sold ON console_accounts;
CREATE TRIGGER trg_cascade_console_sold
AFTER UPDATE ON console_accounts
FOR EACH ROW EXECUTE FUNCTION cascade_console_sold_to_applications();

CREATE OR REPLACE FUNCTION track_application_review_duration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'under_review' AND (OLD IS NULL OR OLD.status IS DISTINCT FROM 'under_review') THEN
    NEW.review_started_at := COALESCE(NEW.review_started_at, now());
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.status = 'production' AND OLD.status = 'under_review' AND OLD.review_started_at IS NOT NULL THEN
    NEW.days_in_review := GREATEST(0, ROUND(EXTRACT(EPOCH FROM (now() - OLD.review_started_at)) / 86400)::INTEGER);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_application_review_duration ON applications;
CREATE TRIGGER trg_application_review_duration
BEFORE INSERT OR UPDATE ON applications
FOR EACH ROW EXECUTE FUNCTION track_application_review_duration();

-- ============================================
-- 3. REALTIME (no-op if already enabled)
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'console_accounts'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE console_accounts;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'applications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE applications;
  END IF;
END $$;

-- ============================================
-- 4. Backdate the 5 existing consoles to their real creation dates
--    Roamer-Red & Dragon-Sushi: 2026-06-29
--    Euro UK, Bury-LTD & Odunaike: 2026-07-02
-- ============================================

UPDATE console_accounts SET created_at = '2026-06-29T00:00:00Z' WHERE console_name = 'Roamer-Red';
UPDATE console_accounts SET created_at = '2026-06-29T00:00:00Z' WHERE console_name = 'Dragon-Sushi';
UPDATE console_accounts SET created_at = '2026-07-02T00:00:00Z' WHERE console_name = 'Euro UK';
UPDATE console_accounts SET created_at = '2026-07-02T00:00:00Z' WHERE console_name = 'Bury-LTD';
UPDATE console_accounts SET created_at = '2026-07-02T00:00:00Z' WHERE console_name = 'Odunaike';

-- Sanity check: confirm all 5 rows now show the expected created_at.
SELECT console_name, status, created_at, sold_at FROM console_accounts ORDER BY console_name;

-- ============================================
-- 5. One-off: backdate Bible Quiz and Color Picker Pro to their real
--    creation date (2026-06-29), so their Days in Review is accurate.
-- ============================================

UPDATE applications
SET created_at = '2026-06-29T00:00:00Z'
WHERE package_name IN ('com.minipro.biblequiz', 'com.minipro.colorpickerpro');

-- ============================================
-- Done. console_accounts and applications now have every column the app
-- expects, the Dashboard's review-time/sales widgets should stop erroring,
-- Console Accounts will show real day counts, and the two named apps will
-- calculate Days in Review from 2026-06-29.
-- ============================================
