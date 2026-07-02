-- Phase 6: Review-time tracking + app sales analytics
-- Run this in your Supabase SQL Editor (safe to re-run; uses IF NOT EXISTS / OR REPLACE guards)
--
-- What this adds:
--   1. Columns to record how long a console account / application sat in
--      review, and when it was sold.
--   2. Triggers that populate those columns automatically:
--      - console_accounts: in_review -> approved records days_in_review
--      - applications:     under_review -> production records days_in_review
--      - console_accounts: any -> sold records sold_at, and cascades sold_at
--        onto every application that belongs to that console (an app is
--        "sold" when the console housing it is sold)
--   3. Enables Supabase Realtime on both tables so the dashboard can update
--      live without a manual refresh.

-- ============================================
-- 1. NEW COLUMNS
-- ============================================

ALTER TABLE console_accounts ADD COLUMN IF NOT EXISTS review_started_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE console_accounts ADD COLUMN IF NOT EXISTS days_in_review INTEGER;
ALTER TABLE console_accounts ADD COLUMN IF NOT EXISTS sold_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE applications ADD COLUMN IF NOT EXISTS review_started_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS days_in_review INTEGER;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS sold_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_console_accounts_sold_at ON console_accounts(sold_at);
CREATE INDEX IF NOT EXISTS idx_applications_sold_at ON applications(sold_at);

-- Best-effort backfill: rows already sitting in a review state before this
-- migration ran have no review_started_at yet. Use updated_at as the
-- closest available approximation so their eventual days_in_review isn't
-- left null the first time they leave review.
UPDATE console_accounts
SET review_started_at = updated_at
WHERE status = 'in_review' AND review_started_at IS NULL;

UPDATE applications
SET review_started_at = updated_at
WHERE status = 'under_review' AND review_started_at IS NULL;

-- ============================================
-- 2. CONSOLE ACCOUNTS: review-time + sale tracking
-- ============================================

CREATE OR REPLACE FUNCTION track_console_review_and_sale()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'in_review' AND OLD.status IS DISTINCT FROM 'in_review' THEN
    NEW.review_started_at := now();
  END IF;

  IF NEW.status = 'approved' AND OLD.status = 'in_review' AND OLD.review_started_at IS NOT NULL THEN
    NEW.days_in_review := GREATEST(0, ROUND(EXTRACT(EPOCH FROM (now() - OLD.review_started_at)) / 86400)::INTEGER);
  END IF;

  IF NEW.status = 'sold' AND OLD.status IS DISTINCT FROM 'sold' THEN
    NEW.sold_at := now();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_console_review_and_sale ON console_accounts;
CREATE TRIGGER trg_console_review_and_sale
BEFORE UPDATE ON console_accounts
FOR EACH ROW EXECUTE FUNCTION track_console_review_and_sale();

-- An app is considered "sold" the moment the console that houses it is
-- sold. Cascade the sale timestamp onto every application under that
-- console that hasn't already been marked sold.
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

-- ============================================
-- 3. APPLICATIONS: review-time tracking
-- ============================================

CREATE OR REPLACE FUNCTION track_application_review_duration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'under_review' AND OLD.status IS DISTINCT FROM 'under_review' THEN
    NEW.review_started_at := now();
  END IF;

  IF NEW.status = 'production' AND OLD.status = 'under_review' AND OLD.review_started_at IS NOT NULL THEN
    NEW.days_in_review := GREATEST(0, ROUND(EXTRACT(EPOCH FROM (now() - OLD.review_started_at)) / 86400)::INTEGER);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_application_review_duration ON applications;
CREATE TRIGGER trg_application_review_duration
BEFORE UPDATE ON applications
FOR EACH ROW EXECUTE FUNCTION track_application_review_duration();

-- ============================================
-- 4. REALTIME: let the dashboard reflect changes live
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
-- Done. Refresh the app — moving a console from "in_review" to "approved"
-- now records days_in_review automatically, same for an application moving
-- "under_review" -> "production". Selling a console stamps sold_at on it
-- and on every application it owns, which powers the weekly/monthly
-- "apps sold" analytics on the dashboard. Both tables now stream changes
-- to the client in real time.
-- ============================================
