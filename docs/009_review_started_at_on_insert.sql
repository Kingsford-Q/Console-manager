-- Phase 9: Stamp review_started_at on INSERT too, not just on UPDATE transitions
-- Run this in your Supabase SQL Editor (safe to re-run)
--
-- Why: trg_console_review_and_sale / trg_application_review_duration (added in
-- 006) only fired BEFORE UPDATE. A console/application created directly with
-- status = 'in_review' / 'under_review' (instead of transitioning into it)
-- never got review_started_at populated, so days_in_review could never be
-- computed for it either. The app's UI now falls back to created_at when
-- review_started_at is missing so it never shows a blank dash, but running
-- this migration makes the underlying numbers exact again.

-- Backfill rows currently sitting in a review status with no review_started_at.
UPDATE console_accounts
SET review_started_at = created_at
WHERE status = 'in_review' AND review_started_at IS NULL;

UPDATE applications
SET review_started_at = created_at
WHERE status = 'under_review' AND review_started_at IS NULL;

-- Recreate the trigger functions so they also cover INSERT (OLD is NULL there).
CREATE OR REPLACE FUNCTION track_console_review_and_sale()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'in_review' AND (OLD IS NULL OR OLD.status IS DISTINCT FROM 'in_review') THEN
    NEW.review_started_at := COALESCE(NEW.review_started_at, now());
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.status = 'approved' AND OLD.status = 'in_review' AND OLD.review_started_at IS NOT NULL THEN
    NEW.days_in_review := GREATEST(0, ROUND(EXTRACT(EPOCH FROM (now() - OLD.review_started_at)) / 86400)::INTEGER);
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.status = 'sold' AND OLD.status IS DISTINCT FROM 'sold' THEN
    NEW.sold_at := now();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_console_review_and_sale ON console_accounts;
CREATE TRIGGER trg_console_review_and_sale
BEFORE INSERT OR UPDATE ON console_accounts
FOR EACH ROW EXECUTE FUNCTION track_console_review_and_sale();

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
-- Done. New rows created directly in 'in_review' / 'under_review' now get
-- review_started_at immediately, and existing rows in those statuses have
-- been backfilled. No new columns needed for the Console Accounts "Days in
-- Review" change — it now reads created_at/sold_at, both of which already
-- exist on console_accounts.
-- ============================================
